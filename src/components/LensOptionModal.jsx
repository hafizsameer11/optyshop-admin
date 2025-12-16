import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const LensOptionModal = ({ lensOption, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'classic',
    description: '',
    base_price: '',
    is_active: true,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lensOption) {
      setFormData({
        name: lensOption.name || '',
        slug: lensOption.slug || '',
        type: lensOption.type || 'classic',
        description: lensOption.description || '',
        base_price: lensOption.base_price || '',
        is_active: lensOption.is_active !== undefined ? lensOption.is_active : true,
        sort_order: lensOption.sort_order || 0,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        type: 'classic',
        description: '',
        base_price: '',
        is_active: true,
        sort_order: 0,
      });
    }
  }, [lensOption]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : parseFloat(value) || '') : value;
    
    if (name === 'name' && !lensOption) {
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
      // Prepare data matching API specification from Postman collection
      // POST /api/admin/lens-options expects: name, slug, type, description, base_price, is_active, sort_order
      // Example from Postman: { "name": "Mirror Lenses", "slug": "mirror-lenses", "type": "mirror", "description": "...", "base_price": 20.00, "is_active": true, "sort_order": 0 }
      const submitData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        type: formData.type,
        description: formData.description.trim() || null,
        base_price: parseFloat(formData.base_price) || 0,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        sort_order: parseInt(formData.sort_order) || 0,
      };

      let response;
      if (lensOption) {
        // PUT /api/admin/lens-options/:id (Admin endpoint)
        // Endpoint: PUT {{base_url}}/api/admin/lens-options/:id
        // Auth: Authorization: Bearer {{admin_token}}
        response = await api.put(API_ROUTES.ADMIN.LENS_OPTIONS.UPDATE(lensOption.id), submitData);
        toast.success(response.data?.message || 'Lens option updated successfully');
      } else {
        // POST /api/admin/lens-options (Admin endpoint)
        // Endpoint: POST {{base_url}}/api/admin/lens-options
        // Auth: Authorization: Bearer {{admin_token}}
        response = await api.post(API_ROUTES.ADMIN.LENS_OPTIONS.CREATE, submitData);
        toast.success(response.data?.message || 'Lens option created successfully');
      }
      onClose();
    } catch (error) {
      console.error('Lens option save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save lens option');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to create lens options');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save lens option';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">
            {lensOption ? 'Edit Lens Option' : 'Add Lens Option'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                placeholder="e.g., Mirror Lenses"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                placeholder="e.g., mirror-lenses"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="classic">Classic</option>
                <option value="mirror">Mirror</option>
                <option value="gradient">Gradient</option>
                <option value="polarized">Polarized</option>
                <option value="photochromic">Photochromic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base Price *</label>
              <input
                type="number"
                name="base_price"
                value={formData.base_price}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                placeholder="e.g., 20.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Lens option description"
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

export default LensOptionModal;


