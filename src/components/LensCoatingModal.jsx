import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const LensCoatingModal = ({ lensCoating, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: '',
    price_adjustment: '',
    description: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lensCoating) {
      setFormData({
        name: lensCoating.name || '',
        slug: lensCoating.slug || '',
        type: lensCoating.type || '',
        price_adjustment: lensCoating.price_adjustment || '',
        description: lensCoating.description || '',
        is_active: lensCoating.is_active !== undefined ? lensCoating.is_active : true,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        type: '',
        price_adjustment: '',
        description: '',
        is_active: true,
      });
    }
  }, [lensCoating]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : parseFloat(value) || '') : value;
    
    // Auto-generate slug from name (only when creating new lens coating)
    if (name === 'name' && !lensCoating) {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormData({ ...formData, name: fieldValue, slug });
    } else {
      setFormData({ ...formData, [name]: fieldValue });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate coating type
    const validTypes = ['ar', 'blue_light', 'photochromic', 'scratch', 'uv', 'polarized'];
    if (!validTypes.includes(formData.type)) {
      toast.error('Please select a valid coating type');
      return;
    }
    
    setLoading(true);

    try {
      // Prepare data with proper types
      const submitData = {
        name: formData.name,
        slug: formData.slug,
        type: formData.type,
        price_adjustment: parseFloat(formData.price_adjustment) || 0,
        description: formData.description || '',
        is_active: formData.is_active,
      };
      
      let response;
      if (lensCoating) {
        response = await api.put(API_ROUTES.ADMIN.LENS_COATINGS.UPDATE(lensCoating.id), submitData);
        // Handle response structure: { success, message, data: { lensCoating: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Lens coating updated successfully');
        } else {
          toast.success('Lens coating updated successfully');
        }
      } else {
        response = await api.post(API_ROUTES.ADMIN.LENS_COATINGS.CREATE, submitData);
        // Handle response structure: { success, message, data: { lensCoating: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Lens coating created successfully');
        } else {
          toast.success('Lens coating created successfully');
        }
      }
      onClose();
    } catch (error) {
      console.error('Lens coating save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save lens coating');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to save lens coatings');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save lens coating';
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
            {lensCoating ? 'Edit Lens Coating' : 'Add Lens Coating'}
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
              placeholder="e.g., Anti-Reflective"
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
              placeholder="e.g., ar-coating"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Select type</option>
              <option value="ar">Anti-Reflective (AR)</option>
              <option value="blue_light">Blue Light Filter</option>
              <option value="photochromic">Photochromic</option>
              <option value="scratch">Scratch Resistant</option>
              <option value="uv">UV Protection</option>
              <option value="polarized">Polarized</option>
            </select>
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
              placeholder="e.g., Reduces glare and reflections"
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

export default LensCoatingModal;

