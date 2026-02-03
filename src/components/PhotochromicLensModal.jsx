import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';
import { 
  createPhotochromicLens, 
  updatePhotochromicLens,
  getPhotochromicLenses,
  deletePhotochromicLens
} from '../api/photochromicLenses';

const PhotochromicLensModal = ({ lens, onClose }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    base_price: '',
    description: '',
    is_active: true,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lens) {
      console.log('🔄 Populating edit form with photochromic lens data:', lens);
      
      // Handle both snake_case and camelCase field names
      const populatedData = {
        name: lens.name || '',
        slug: lens.slug || '',
        base_price: lens.base_price !== null && lens.base_price !== undefined
          ? lens.base_price
          : (lens.basePrice !== null && lens.basePrice !== undefined
            ? lens.basePrice
            : ''),
        description: lens.description || '',
        is_active: lens.is_active !== undefined 
          ? lens.is_active 
          : (lens.isActive !== undefined ? lens.isActive : true),
        sort_order: lens.sort_order !== null && lens.sort_order !== undefined
          ? lens.sort_order
          : (lens.sortOrder !== null && lens.sortOrder !== undefined
            ? lens.sortOrder
            : 0),
      };
      
      console.log('🔄 Form data populated for photochromic lens edit:', populatedData);
      setFormData(populatedData);
    } else {
      console.log('🔄 Resetting form for new photochromic lens creation');
      setFormData({
        name: '',
        slug: '',
        base_price: '',
        description: '',
        is_active: true,
        sort_order: 0,
      });
    }
  }, [lens]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : parseFloat(value) || '') : value;
    
    // Auto-generate slug from name (only when creating new lens)
    if (name === 'name' && !lens) {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormData({ ...formData, name: fieldValue, slug });
    } else {
      setFormData({ ...formData, [name]: fieldValue });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 Photochromic Lens form submission started');
    setLoading(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        base_price: parseFloat(formData.base_price) || 0,
        description: formData.description.trim() || null,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        sort_order: parseInt(formData.sort_order) || 0,
      };

      console.log('🔄 Submitting photochromic lens data:', {
        isEdit: !!lens,
        lensId: lens?.id,
        submitData
      });

      let response;
      if (lens) {
        console.log('🔄 Updating photochromic lens with ID:', lens.id);
        response = await updatePhotochromicLens(lens.id, submitData);
        console.log('✅ Photochromic lens updated successfully:', response.data);
        toast.success('Photochromic lens updated successfully');
      } else {
        console.log('🔄 Creating new photochromic lens');
        response = await createPhotochromicLens(submitData);
        console.log('✅ Photochromic lens created successfully:', response.data);
        toast.success('Photochromic lens created successfully');
      }
      
      // Verify the response contains the expected data
      if (response.data && (response.data.id || response.data.success || response.data.data)) {
        console.log('✅ API operation confirmed, closing modal and navigating');
        onClose(true);
      } else {
        console.warn('⚠️ Unexpected API response format:', response.data);
        toast.error('Unexpected response from server');
      }
    } catch (error) {
      console.error('❌ Photochromic lens save error:', error);
      console.error('Error response:', error.response?.data);
      
      // Check the type of error
      const isNetworkError = !error.response;
      const isAuthError = error.response?.status === 401;
      const isServerError = error.response?.status >= 500;
      const isNotFoundError = error.response?.status === 404;
      const isValidationError = error.response?.status === 422;
      
      // For validation errors, don't close modal and show specific error
      if (isValidationError) {
        const validationErrors = error.response?.data?.errors || {};
        const errorMessages = Object.values(validationErrors).flat().join(', ');
        const errorMessage = errorMessages || error.response?.data?.message || 'Validation failed';
        console.error('❌ Validation errors:', validationErrors);
        toast.error(errorMessage);
      } else if (isNetworkError || isAuthError || isServerError || isNotFoundError) {
        // For other errors, still close modal and navigate
        console.log('🔄 API error occurred, but still closing modal and navigating');
        toast.error('Backend error - Changes may not be saved');
        setTimeout(() => {
          console.log('🔄 Calling onClose(true) to navigate to table');
          onClose(true);
        }, 1000);
      } else {
        // For other types of errors, don't close modal
        const errorMessage = error.response?.data?.message || 'Failed to save photochromic lens';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {lens ? 'Edit Photochromic Lens' : 'Add Photochromic Lens'}
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
          <div className="grid grid-cols-2 gap-4">
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
                placeholder="e.g., EyeQLenz™ with Zenni ID Guard™"
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
                placeholder="e.g., eyeqlenz-with-zenni-id-guard"
              />
            </div>
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
              className="input-modern"
              required
              placeholder="e.g., 0.00"
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
              rows="4"
              className="input-modern"
              placeholder="e.g., 4-in-1 lens that reflects infrared light..."
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

export default PhotochromicLensModal;

