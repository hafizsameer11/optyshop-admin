import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">
            {option ? 'Edit Lens Thickness Option' : 'Add Lens Thickness Option'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., Thin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug *
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thickness Value *
            </label>
            <input
              type="number"
              name="thickness_value"
              value={formData.thickness_value}
              onChange={handleChange}
              step="0.1"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., 1.5"
            />
            <p className="text-xs text-gray-500 mt-1">Thickness value in millimeters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Thin lens option for lighter weight"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Order
            </label>
            <input
              type="number"
              name="sort_order"
              value={formData.sort_order}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>

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

export default LensThicknessOptionModal;

