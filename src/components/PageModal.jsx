import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

const PageModal = ({ page, onClose, onSuccess }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    page_type: '',
    is_published: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (page) {
      setFormData({
        title: page.title || '',
        slug: page.slug || '',
        content: page.content || '',
        page_type: page.page_type || '',
        is_published: page.is_published !== undefined ? page.is_published : false,
      });
    } else {
      // Reset form for new page
      setFormData({
        title: '',
        slug: '',
        content: '',
        page_type: '',
        is_published: false,
      });
    }
  }, [page]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData({ 
      ...formData, 
      [name]: fieldValue 
    });
    
    // Auto-generate slug from title when creating new page
    if (name === 'title' && !page) {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormData(prev => ({ ...prev, title: value, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.title.trim()) {
        toast.error('Title is required');
        setLoading(false);
        return;
      }
      if (!formData.slug || !formData.slug.trim()) {
        toast.error('Slug is required');
        setLoading(false);
        return;
      }
      if (!formData.content || !formData.content.trim()) {
        toast.error('Content is required');
        setLoading(false);
        return;
      }

      // Prepare data object - convert empty strings to null for optional fields
      const dataToSend = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        content: formData.content.trim(),
        is_published: formData.is_published,
      };

      // Add optional fields only if they have values
      if (formData.page_type && formData.page_type.trim()) {
        dataToSend.page_type = formData.page_type.trim();
      } else {
        dataToSend.page_type = null;
      }

      let response;
      if (page) {
        response = await api.put(API_ROUTES.ADMIN.PAGES.UPDATE(page.id), dataToSend);
      } else {
        response = await api.post(API_ROUTES.ADMIN.PAGES.CREATE, dataToSend);
      }
      
      const successMessage = response.data?.message || (page ? 'Page updated successfully' : 'Page created successfully');
      toast.success(successMessage);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Page save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save page');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 400 || error.response.status === 422) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save page';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {page ? t('editPage') : t('addPage')}
          </h2>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-all duration-200"
              aria-label="Close"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('pageTitle')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-modern"
              required
              placeholder="e.g., About Us"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="input-modern font-mono"
              required
              placeholder="e.g., about-us"
            />
            <p className="mt-1 text-sm text-gray-500">URL-friendly version of the title</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Page Type
            </label>
            <input
              type="text"
              name="page_type"
              value={formData.page_type}
              onChange={handleChange}
              className="input-modern"
              placeholder="e.g., about, policy, terms (optional)"
            />
            <p className="mt-1 text-sm text-gray-500">Optional categorization for the page</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('content')} <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="10"
              className="input-modern resize-none"
              required
              placeholder="Enter the page content..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_published"
              id="is_published"
              checked={formData.is_published}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="is_published" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
              {t('publishImmediately')}
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-modern disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PageModal;

