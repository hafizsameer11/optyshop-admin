import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';

const PrescriptionLensVariantModal = ({ variant, lensTypes, onClose }) => {
  const [formData, setFormData] = useState({
    prescription_lens_type_id: '',
    name: '',
    slug: '',
    description: '',
    price: '',
    is_recommended: false,
    viewing_range: '',
    use_cases: '',
    is_active: true,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (variant) {
      setFormData({
        prescription_lens_type_id: variant.prescription_lens_type_id || '',
        name: variant.name || '',
        slug: variant.slug || '',
        description: variant.description || '',
        price: variant.price || '',
        is_recommended: variant.is_recommended !== undefined ? variant.is_recommended : false,
        viewing_range: variant.viewing_range || '',
        use_cases: variant.use_cases || '',
        is_active: variant.is_active !== undefined ? variant.is_active : true,
        sort_order: variant.sort_order || 0,
      });
    } else {
      setFormData({
        prescription_lens_type_id: '',
        name: '',
        slug: '',
        description: '',
        price: '',
        is_recommended: false,
        viewing_range: '',
        use_cases: '',
        is_active: true,
        sort_order: 0,
      });
    }
  }, [variant]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : parseFloat(value) || '') : value;
    
    // Auto-generate slug from name (only when creating new variant)
    if (name === 'name' && !variant) {
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
        price: formData.price === '' ? 0 : formData.price,
        sort_order: formData.sort_order || 0,
        viewing_range: formData.viewing_range || null,
        use_cases: formData.use_cases || null,
      };

      let response;
      if (variant) {
        response = await api.put(API_ROUTES.ADMIN.PRESCRIPTION_LENS_VARIANTS.UPDATE(variant.id), submitData);
        if (response.data?.success) {
          toast.success(response.data.message || 'Prescription lens variant updated successfully');
        } else {
          toast.success('Prescription lens variant updated successfully');
        }
      } else {
        response = await api.post(API_ROUTES.ADMIN.PRESCRIPTION_LENS_VARIANTS.CREATE, submitData);
        if (response.data?.success) {
          toast.success(response.data.message || 'Prescription lens variant created successfully');
        } else {
          toast.success('Prescription lens variant created successfully');
        }
      }
      onClose();
    } catch (error) {
      console.error('Prescription lens variant save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save prescription lens variant');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to save prescription lens variants');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save prescription lens variant';
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
            {variant ? 'Edit Prescription Lens Variant' : 'Add Prescription Lens Variant'}
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
              Prescription Lens Type <span className="text-red-500">*</span>
            </label>
            <select
              name="prescription_lens_type_id"
              value={formData.prescription_lens_type_id}
              onChange={handleChange}
              className="input-modern"
              required
            >
              <option value="">Select a prescription lens type</option>
              {lensTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

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
              placeholder="e.g., Premium"
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
              placeholder="e.g., premium"
            />
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
              min="0"
              className="input-modern"
              required
              placeholder="e.g., 52.95"
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
              placeholder="e.g., Up to 40% wider viewing areas than Standard. Maximum comfort & balanced vision."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Use Cases
            </label>
            <input
              type="text"
              name="use_cases"
              value={formData.use_cases}
              onChange={handleChange}
              className="input-modern"
              placeholder="e.g., Maximum comfort & balanced vision"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Viewing Range
            </label>
            <input
              type="text"
              name="viewing_range"
              value={formData.viewing_range}
              onChange={handleChange}
              className="input-modern"
              placeholder="e.g., Wide"
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

          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_recommended"
                id="is_recommended"
                checked={formData.is_recommended}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
              />
              <label htmlFor="is_recommended" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
                Recommended
              </label>
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

export default PrescriptionLensVariantModal;

