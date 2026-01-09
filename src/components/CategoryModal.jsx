import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

const CategoryModal = ({ category, onClose }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_active: true,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      // Handle both snake_case and camelCase field names
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        is_active: category.is_active !== undefined 
          ? category.is_active 
          : (category.isActive !== undefined ? category.isActive : true),
        sort_order: category.sort_order !== null && category.sort_order !== undefined
          ? category.sort_order
          : (category.sortOrder !== null && category.sortOrder !== undefined
            ? category.sortOrder
            : 0),
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        is_active: true,
        sort_order: 0,
      });
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value;
    
    // Auto-generate slug from name (only when creating new category)
    if (name === 'name' && !category) {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormData({ ...formData, name: fieldValue, slug });
    } else {
      setFormData({ ...formData, [name]: fieldValue });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        toast.error('Category name is required');
        setLoading(false);
        return;
      }
      if (!formData.slug || !formData.slug.trim()) {
        toast.error('Category slug is required');
        setLoading(false);
        return;
      }

      // Prepare data object
      const dataToSend = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        sort_order: parseInt(formData.sort_order) || 0,
      };

      // Only include description if it has a value
      if (formData.description && formData.description.trim()) {
        dataToSend.description = formData.description.trim();
      } else {
        dataToSend.description = null;
      }

      let response;
      if (category) {
        response = await api.put(API_ROUTES.ADMIN.CATEGORIES.UPDATE(category.id), dataToSend);
      } else {
        response = await api.post(API_ROUTES.ADMIN.CATEGORIES.CREATE, dataToSend);
      }
      
      // Handle response structure: { success, message, data: { category: {...} } }
      const responseData = response.data?.data || response.data;
      const successMessage = response.data?.message || (category ? 'Category updated successfully' : 'Category created successfully');
      
      toast.success(successMessage);
      onClose();
    } catch (error) {
      console.error('Category save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save category');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to save categories');
      } else if (error.response.status === 400 || error.response.status === 422) {
        // Validation errors
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save category';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-indigo-200/50 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex-shrink-0">
          <h2 className="text-2xl font-extrabold text-white">
            {category ? t('editCategory') : t('addCategory')}
          </h2>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" onGradient={true} />
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-all duration-200"
              aria-label="Close"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 custom-scrollbar">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <label className="block text-sm font-bold text-gray-800 mb-2">
                {t('name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-modern w-full"
                required
              />
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <label className="block text-sm font-bold text-gray-800 mb-2">
                {t('slug')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="input-modern font-mono w-full"
                required
              />
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <label className="block text-sm font-bold text-gray-800 mb-2">
                {t('description')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="input-modern resize-none w-full"
                placeholder="Enter category description (optional)"
              />
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <label className="block text-sm font-bold text-gray-800 mb-2">
                {t('sortOrder')}
              </label>
              <input
                type="number"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleChange}
                min="0"
                className="input-modern w-full"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-2 px-1">Lower numbers appear first (default: 0)</p>
            </div>

            <div className="flex items-center p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
              />
              <label htmlFor="is_active" className="ml-3 block text-sm font-semibold text-gray-800 cursor-pointer">
                {t('active')}
              </label>
            </div>
          </div>

          {/* Fixed Footer with Action Buttons */}
          <div className="flex flex-row justify-between items-center gap-3 p-6 border-t border-gray-200 bg-white flex-shrink-0 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold text-gray-700"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CategoryModal;



