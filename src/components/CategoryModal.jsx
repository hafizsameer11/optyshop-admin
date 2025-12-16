import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const CategoryModal = ({ category, onClose }) => {
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
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        is_active: category.is_active !== undefined ? category.is_active : true,
        sort_order: category.sort_order ?? 0,
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-md w-full shadow-2xl border border-gray-200/50 animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-white/80 transition-all duration-200"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2.5">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-modern"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2.5">
              Slug *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="input-modern font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2.5">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="input-modern resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2.5">
              Sort Order
            </label>
            <input
              type="number"
              name="sort_order"
              value={formData.sort_order}
              onChange={handleChange}
              min="0"
              className="input-modern"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-modern disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;



