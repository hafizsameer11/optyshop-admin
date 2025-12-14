import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const LensTypeModal = ({ lensType, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    index: '',
    thickness_factor: '',
    price_adjustment: '',
    description: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lensType) {
      setFormData({
        name: lensType.name || '',
        slug: lensType.slug || '',
        index: lensType.index || '',
        thickness_factor: lensType.thickness_factor || '',
        price_adjustment: lensType.price_adjustment || '',
        description: lensType.description || '',
        is_active: lensType.is_active !== undefined ? lensType.is_active : true,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        index: '',
        thickness_factor: '',
        price_adjustment: '',
        description: '',
        is_active: true,
      });
    }
  }, [lensType]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : parseFloat(value) || '') : value;
    
    // Auto-generate slug from name (only when creating new lens type)
    if (name === 'name' && !lensType) {
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
      // Prepare data - convert empty strings to null for optional fields
      const submitData = {
        ...formData,
        thickness_factor: formData.thickness_factor === '' ? null : formData.thickness_factor,
      };

      let response;
      if (lensType) {
        response = await api.put(API_ROUTES.ADMIN.LENS_TYPES.UPDATE(lensType.id), submitData);
        // Handle response structure: { success, message, data: { lensType: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Lens type updated successfully');
        } else {
          toast.success('Lens type updated successfully');
        }
      } else {
        response = await api.post(API_ROUTES.ADMIN.LENS_TYPES.CREATE, submitData);
        // Handle response structure: { success, message, data: { lensType: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Lens type created successfully');
        } else {
          toast.success('Lens type created successfully');
        }
      }
      onClose();
    } catch (error) {
      console.error('Lens type save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save lens type');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to save lens types');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save lens type';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {lensType ? 'Edit Lens Type' : 'Add Lens Type'}
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
              placeholder="e.g., High Index 1.67"
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
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., high-index-167"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Index *
              </label>
              <input
                type="number"
                name="index"
                value={formData.index}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                placeholder="e.g., 1.67"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Adjustment *
              </label>
              <input
                type="number"
                name="price_adjustment"
                value={formData.price_adjustment}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                placeholder="e.g., 50.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thickness Factor
            </label>
            <input
              type="number"
              name="thickness_factor"
              value={formData.thickness_factor}
              onChange={handleChange}
              step="0.01"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 0.7"
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
              placeholder="e.g., Thinner lens for higher prescriptions"
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

export default LensTypeModal;

