import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const PrescriptionLensTypeModal = ({ lensType, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    prescription_type: 'single_vision',
    base_price: '',
    is_active: true,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lensType) {
      setFormData({
        name: lensType.name || '',
        slug: lensType.slug || '',
        description: lensType.description || '',
        prescription_type: lensType.prescription_type || 'single_vision',
        base_price: lensType.base_price || '',
        is_active: lensType.is_active !== undefined ? lensType.is_active : true,
        sort_order: lensType.sort_order || 0,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        prescription_type: 'single_vision',
        base_price: '',
        is_active: true,
        sort_order: 0,
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
      const submitData = {
        ...formData,
        base_price: formData.base_price === '' ? 0 : formData.base_price,
        sort_order: formData.sort_order || 0,
      };

      let response;
      if (lensType) {
        response = await api.put(API_ROUTES.ADMIN.PRESCRIPTION_LENS_TYPES.UPDATE(lensType.id), submitData);
        if (response.data?.success) {
          toast.success(response.data.message || 'Prescription lens type updated successfully');
        } else {
          toast.success('Prescription lens type updated successfully');
        }
      } else {
        response = await api.post(API_ROUTES.ADMIN.PRESCRIPTION_LENS_TYPES.CREATE, submitData);
        if (response.data?.success) {
          toast.success(response.data.message || 'Prescription lens type created successfully');
        } else {
          toast.success('Prescription lens type created successfully');
        }
      }
      onClose();
    } catch (error) {
      console.error('Prescription lens type save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save prescription lens type');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to save prescription lens types');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save prescription lens type';
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
            {lensType ? 'Edit Prescription Lens Type' : 'Add Prescription Lens Type'}
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
              placeholder="e.g., Distance Vision"
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
              placeholder="e.g., distance-vision"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prescription Type *
            </label>
            <select
              name="prescription_type"
              value={formData.prescription_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="single_vision">Single Vision</option>
              <option value="bifocal">Bifocal</option>
              <option value="trifocal">Trifocal</option>
              <option value="progressive">Progressive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Price *
            </label>
            <input
              type="number"
              name="base_price"
              value={formData.base_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., 60.00"
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
              placeholder="e.g., For distance (Thin, anti-glare, blue-cut options)"
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
              min="0"
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

export default PrescriptionLensTypeModal;

