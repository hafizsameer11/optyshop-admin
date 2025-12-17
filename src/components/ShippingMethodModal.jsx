import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const ShippingMethodModal = ({ shippingMethod, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'standard',
    description: '',
    price: '',
    estimated_days: '',
    is_active: true,
    sort_order: 0,
    icon: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shippingMethod) {
      setFormData({
        name: shippingMethod.name || '',
        slug: shippingMethod.slug || '',
        type: shippingMethod.type || 'standard',
        description: shippingMethod.description || '',
        price: shippingMethod.price || '',
        estimated_days: shippingMethod.estimated_days || '',
        is_active: shippingMethod.is_active !== undefined ? shippingMethod.is_active : true,
        sort_order: shippingMethod.sort_order || 0,
        icon: shippingMethod.icon || '',
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        type: 'standard',
        description: '',
        price: '',
        estimated_days: '',
        is_active: true,
        sort_order: 0,
        icon: '',
      });
    }
  }, [shippingMethod]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : parseFloat(value) || '') : value;
    
    if (name === 'name' && !shippingMethod) {
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
        price: parseFloat(formData.price) || 0,
        estimated_days: formData.estimated_days ? parseInt(formData.estimated_days) : null,
        sort_order: parseInt(formData.sort_order) || 0,
      };

      let response;
      if (shippingMethod) {
        response = await api.put(API_ROUTES.ADMIN.SHIPPING_METHODS.UPDATE(shippingMethod.id), submitData);
        toast.success(response.data?.message || 'Shipping method updated successfully');
      } else {
        response = await api.post(API_ROUTES.ADMIN.SHIPPING_METHODS.CREATE, submitData);
        toast.success(response.data?.message || 'Shipping method created successfully');
      }
      onClose();
    } catch (error) {
      console.error('Shipping method save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save shipping method');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save shipping method';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {shippingMethod ? 'Edit Shipping Method' : 'Add Shipping Method'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-all duration-200"
            aria-label="Close"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                placeholder="e.g., Standard Shipping"
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
                className="input-modern font-mono"
                required
                placeholder="e.g., standard-shipping"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input-modern"
                required
              >
                <option value="standard">Standard</option>
                <option value="express">Express</option>
                <option value="overnight">Overnight</option>
                <option value="international">International</option>
                <option value="free">Free</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                className="input-modern"
                required
                placeholder="e.g., 9.99"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Days</label>
              <input
                type="number"
                name="estimated_days"
                value={formData.estimated_days}
                onChange={handleChange}
                className="input-modern"
                placeholder="e.g., 7"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort Order</label>
              <input
                type="number"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleChange}
                className="input-modern"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="input-modern resize-none"
              placeholder="Shipping method description"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Icon URL</label>
            <input
              type="url"
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              className="input-modern"
              placeholder="https://example.com/icons/shipping.svg"
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

export default ShippingMethodModal;


