import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const PageModal = ({ page, onClose, onSuccess }) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">
            {page ? 'Edit Page' : 'Add Page'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., About Us"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., about-us"
            />
            <p className="mt-1 text-sm text-gray-500">URL-friendly version of the title</p>
          </div>

          {/* Page Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Type
            </label>
            <input
              type="text"
              name="page_type"
              value={formData.page_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., about, policy, terms (optional)"
            />
            <p className="mt-1 text-sm text-gray-500">Optional categorization for the page</p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="10"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="Enter the page content..."
            />
          </div>

          {/* Published Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_published"
              id="is_published"
              checked={formData.is_published}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700">
              Publish immediately
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PageModal;

