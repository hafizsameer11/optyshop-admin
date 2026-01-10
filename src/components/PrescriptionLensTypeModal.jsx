import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';

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
      // Handle both snake_case and camelCase field names
      setFormData({
        name: lensType.name || '',
        slug: lensType.slug || '',
        description: lensType.description || '',
        prescription_type: lensType.prescription_type || lensType.prescriptionType || 'single_vision',
        base_price: lensType.base_price !== null && lensType.base_price !== undefined
          ? lensType.base_price
          : (lensType.basePrice !== null && lensType.basePrice !== undefined
            ? lensType.basePrice
            : ''),
        is_active: lensType.is_active !== undefined 
          ? lensType.is_active 
          : (lensType.isActive !== undefined ? lensType.isActive : true),
        sort_order: lensType.sort_order !== null && lensType.sort_order !== undefined
          ? lensType.sort_order
          : (lensType.sortOrder !== null && lensType.sortOrder !== undefined
            ? lensType.sortOrder
            : 0),
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
      onClose(true); // Pass true to indicate successful save
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {lensType ? 'Edit Prescription Lens Type' : 'Add Prescription Lens Type'}
          </h2>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <button 
              onClick={() => onClose(false)} 
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
              placeholder="e.g., Distance Vision"
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
              className="input-modern"
              required
              placeholder="e.g., distance-vision"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Prescription Type <span className="text-red-500">*</span>
            </label>
            <select
              name="prescription_type"
              value={formData.prescription_type}
              onChange={handleChange}
              className="input-modern"
              required
            >
              <option value="single_vision">Single Vision</option>
              <option value="bifocal">Bifocal</option>
              <option value="trifocal">Trifocal</option>
              <option value="progressive">Progressive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Base Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="base_price"
              value={formData.base_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="input-modern"
              required
              placeholder="e.g., 60.00"
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
              className="input-modern"
              placeholder="e.g., For distance (Thin, anti-glare, blue-cut options)"
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
              min="0"
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
              onClick={() => onClose(false)}
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

export default PrescriptionLensTypeModal;

