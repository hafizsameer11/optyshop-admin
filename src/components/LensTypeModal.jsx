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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200/50 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10 flex-shrink-0">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {lensType ? 'Edit Lens Type' : 'Add Lens Type'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
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
              placeholder="e.g., High Index 1.67"
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
              placeholder="e.g., high-index-167"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Index <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="index"
                value={formData.index}
                onChange={handleChange}
                step="0.01"
                className="input-modern"
                required
                placeholder="e.g., 1.67"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price Adjustment <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price_adjustment"
                value={formData.price_adjustment}
                onChange={handleChange}
                step="0.01"
                className="input-modern"
                required
                placeholder="e.g., 50.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Thickness Factor
            </label>
            <input
              type="number"
              name="thickness_factor"
              value={formData.thickness_factor}
              onChange={handleChange}
              step="0.01"
              className="input-modern"
              placeholder="e.g., 0.7"
            />
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
              className="input-modern resize-none"
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
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
              Active
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white flex-shrink-0">
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

export default LensTypeModal;

