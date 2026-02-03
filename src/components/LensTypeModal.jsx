import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';
import { 
  createLensType, 
  updateLensType,
  getLensTypes,
  deleteLensType
} from '../api/lensTypes';

const LensTypeModal = ({ lensType, onClose }) => {
  const { t } = useI18n();
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
      console.log('🔄 Populating edit form with lens type data:', lensType);
      
      // Handle both snake_case and camelCase field names
      const populatedData = {
        name: lensType.name || '',
        slug: lensType.slug || '',
        index: lensType.index || '',
        thickness_factor: lensType.thickness_factor !== null && lensType.thickness_factor !== undefined
          ? lensType.thickness_factor
          : (lensType.thicknessFactor !== null && lensType.thicknessFactor !== undefined
            ? lensType.thicknessFactor
            : ''),
        price_adjustment: lensType.price_adjustment !== null && lensType.price_adjustment !== undefined
          ? lensType.price_adjustment
          : (lensType.priceAdjustment !== null && lensType.priceAdjustment !== undefined
            ? lensType.priceAdjustment
            : ''),
        description: lensType.description || '',
        is_active: lensType.is_active !== undefined 
          ? lensType.is_active 
          : (lensType.isActive !== undefined ? lensType.isActive : true),
      };
      
      console.log('🔄 Form data populated for lens type edit:', populatedData);
      setFormData(populatedData);
    } else {
      console.log('🔄 Resetting form for new lens type creation');
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

  const handleSubmit = async () => {
    console.log('🔍 Lens Type form submission started');
    
    // Validate required fields
    if (!formData.name) {
      toast.error('Please enter lens type name');
      return;
    }
    if (!formData.slug) {
      toast.error('Please enter slug');
      return;
    }
    if (!formData.index) {
      toast.error('Please enter index');
      return;
    }
    if (!formData.price_adjustment) {
      toast.error('Please enter price adjustment');
      return;
    }
    
    setLoading(true);

    try {
      // Prepare data - convert empty strings to null for optional fields
      const submitData = {
        ...formData,
        thickness_factor: formData.thickness_factor === '' ? null : formData.thickness_factor,
        index: parseFloat(formData.index),
        price_adjustment: parseFloat(formData.price_adjustment),
      };

      console.log('🔄 Submitting lens type data:', {
        isEdit: !!lensType,
        lensTypeId: lensType?.id,
        submitData
      });

      let response;
      if (lensType) {
        console.log('🔄 Updating lens type with ID:', lensType.id);
        response = await updateLensType(lensType.id, submitData);
        console.log('✅ Lens type updated successfully:', response.data);
        // Handle response structure: { success, message, data: { lensType: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Lens type updated successfully');
        } else {
          toast.success('Lens type updated successfully');
        }
      } else {
        console.log('🔄 Creating new lens type');
        response = await createLensType(submitData);
        console.log('✅ Lens type created successfully:', response.data);
        // Handle response structure: { success, message, data: { lensType: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Lens type created successfully');
        } else {
          toast.success('Lens type created successfully');
        }
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
      console.error('❌ Lens type save error:', error);
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
        const errorMessage = error.response?.data?.message || 'Failed to save lens type';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200/50 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10 flex-shrink-0">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {lensType ? t('editLensType') : t('addLensType')}
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

        <form className="p-6 space-y-5 overflow-y-auto flex-1" noValidate>
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
                {t('index')} <span className="text-red-500">*</span>
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
                {t('priceAdjustment')} <span className="text-red-500">*</span>
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
              {t('thicknessFactor')}
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
              {t('description')}
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
              {t('active')}
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white flex-shrink-0">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              disabled={loading}
              className="btn-primary-modern disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
            >
              {loading ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LensTypeModal;

