import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const LensThicknessMaterialModal = ({ material, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    is_active: true,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || '',
        slug: material.slug || '',
        description: material.description || '',
        price: material.price || '',
        is_active: material.isActive !== undefined ? material.isActive : (material.is_active !== undefined ? material.is_active : true),
        sort_order: material.sortOrder !== null && material.sortOrder !== undefined 
          ? material.sortOrder 
          : (material.sort_order !== null && material.sort_order !== undefined ? material.sort_order : 0),
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: '',
        is_active: true,
        sort_order: 0,
      });
    }
  }, [material]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!material && formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, material]);

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
        price: parseFloat(formData.price) || 0,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order, 10) || 0,
      };
      
      let response;
      if (material) {
        response = await api.put(API_ROUTES.ADMIN.LENS_THICKNESS_MATERIALS.UPDATE(material.id), submitData);
        if (response.data?.success) {
          toast.success(response.data.message || 'Lens thickness material updated successfully');
        } else {
          toast.success('Lens thickness material updated successfully');
        }
      } else {
        response = await api.post(API_ROUTES.ADMIN.LENS_THICKNESS_MATERIALS.CREATE, submitData);
        if (response.data?.success) {
          toast.success(response.data.message || 'Lens thickness material created successfully');
        } else {
          toast.success('Lens thickness material created successfully');
        }
      }
      onClose();
    } catch (error) {
      console.error('Lens thickness material save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save lens thickness material');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to save lens thickness materials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save lens thickness material';
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
            {material ? 'Edit Lens Thickness Material' : 'Add Lens Thickness Material'}
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
              placeholder="e.g., Unbreakable (Plastic)"
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
              placeholder="e.g., unbreakable-plastic (auto-generated from name)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">URL-friendly identifier (auto-generated if left empty)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., 30.00"
            />
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
              placeholder="e.g., Durable plastic material that resists breaking"
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

export default LensThicknessMaterialModal;

