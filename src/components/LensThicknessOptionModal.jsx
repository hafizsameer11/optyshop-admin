import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';

const LensThicknessOptionModal = ({ option, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    thickness_value: '',
    is_active: true,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (option) {
      setFormData({
        name: option.name || '',
        slug: option.slug || '',
        description: option.description || '',
        thickness_value: option.thicknessValue !== null && option.thicknessValue !== undefined
          ? option.thicknessValue
          : (option.thickness_value !== null && option.thickness_value !== undefined
            ? option.thickness_value
            : ''),
        is_active: option.isActive !== undefined ? option.isActive : (option.is_active !== undefined ? option.is_active : true),
        sort_order: option.sortOrder !== null && option.sortOrder !== undefined 
          ? option.sortOrder 
          : (option.sort_order !== null && option.sort_order !== undefined ? option.sort_order : 0),
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        thickness_value: '',
        is_active: true,
        sort_order: 0,
      });
    }
  }, [option]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!option && formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, option]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : parseFloat(value) || '') : value;
    
    setFormData({ ...formData, [name]: fieldValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Please enter a name');
      return;
    }
    
    if (!formData.thickness_value && formData.thickness_value !== 0) {
      toast.error('Please enter a thickness value');
      return;
    }
    
    setLoading(true);

    try {
      // Auto-generate slug if not provided
      let slug = formData.slug;
      if (!slug && formData.name) {
        slug = formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      
      if (!slug) {
        toast.error('Please enter a slug or name');
        setLoading(false);
        return;
      }
      
      // Prepare data with proper types - API expects snake_case
      const submitData = {
        name: formData.name,
        slug: slug,
        description: formData.description || null,
        thickness_value: parseFloat(formData.thickness_value) || 0,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order, 10) || 0,
      };
      
      let response;
      if (option) {
        response = await api.put(API_ROUTES.ADMIN.LENS_THICKNESS_OPTIONS.UPDATE(option.id), submitData);
        if (response.data?.success) {
          toast.success(response.data.message || 'Lens thickness option updated successfully');
        } else {
          toast.success('Lens thickness option updated successfully');
        }
      } else {
        response = await api.post(API_ROUTES.ADMIN.LENS_THICKNESS_OPTIONS.CREATE, submitData);
        if (response.data?.success) {
          toast.success(response.data.message || 'Lens thickness option created successfully');
        } else {
          toast.success('Lens thickness option created successfully');
        }
      }
      onClose();
    } catch (error) {
      console.error('Lens thickness option save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save lens thickness option');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to save lens thickness options');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save lens thickness option';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {option ? 'Edit Lens Thickness Option' : 'Add Lens Thickness Option'}
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
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-modern"
              required
              placeholder="e.g., Thin"
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
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              placeholder="e.g., thin (auto-generated from name)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">URL-friendly identifier (auto-generated if left empty)</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Thickness Value <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="thickness_value"
              value={formData.thickness_value}
              onChange={handleChange}
              step="0.1"
              className="input-modern"
              required
              placeholder="e.g., 1.5"
            />
            <p className="text-xs text-gray-500 mt-1">Thickness value in millimeters</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="input-modern"
              placeholder="e.g., Thin lens option for lighter weight"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sort Order
            </label>
            <input
              type="number"
              name="sort_order"
              value={formData.sort_order}
              onChange={handleChange}
              className="input-modern"
              placeholder="0"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
              Active
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-modern disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LensThicknessOptionModal;

