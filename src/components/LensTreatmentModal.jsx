import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';
import { 
  createLensTreatment, 
  updateLensTreatment,
  getLensTreatments,
  deleteLensTreatment
} from '../api/lensTreatments';

const LensTreatmentModal = ({ lensTreatment, onClose }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'scratch_proof',
    description: '',
    price: '',
    icon: '',
    is_active: true,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lensTreatment) {
      console.log('🔄 Populating edit form with lens treatment data:', lensTreatment);
      
      // Handle both snake_case and camelCase field names
      const populatedData = {
        name: lensTreatment.name || '',
        slug: lensTreatment.slug || '',
        type: lensTreatment.type || 'scratch_proof',
        description: lensTreatment.description || '',
        price: lensTreatment.price !== null && lensTreatment.price !== undefined
          ? lensTreatment.price
          : '',
        icon: lensTreatment.icon || '',
        is_active: lensTreatment.is_active !== undefined 
          ? lensTreatment.is_active 
          : (lensTreatment.isActive !== undefined ? lensTreatment.isActive : true),
        sort_order: lensTreatment.sort_order !== null && lensTreatment.sort_order !== undefined
          ? lensTreatment.sort_order
          : (lensTreatment.sortOrder !== null && lensTreatment.sortOrder !== undefined
            ? lensTreatment.sortOrder
            : 0),
      };
      
      console.log('🔄 Form data populated for lens treatment edit:', populatedData);
      setFormData(populatedData);
    } else {
      console.log('🔄 Resetting form for new lens treatment creation');
      setFormData({
        name: '',
        slug: '',
        type: 'scratch_proof',
        description: '',
        price: '',
        icon: '',
        is_active: true,
        sort_order: 0,
      });
    }
  }, [lensTreatment]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!lensTreatment && formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, lensTreatment]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : parseFloat(value) || '') : value;
    
    setFormData({ ...formData, [name]: fieldValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 Lens Treatment form submission started');
    
    if (!formData.name) {
      toast.error('Please enter a name');
      return;
    }
    
    setLoading(true);

    try {
      // Auto-generate slug if not provided
      let slug = formData.slug;
      if (!slug && formData.name) {
        slug = formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      
      if (!slug) {
        toast.error('Please enter a slug or name');
        setLoading(false);
        return;
      }
      
      // Prepare data with proper types
      const submitData = {
        name: formData.name,
        slug: slug,
        type: formData.type,
        description: formData.description || null,
        price: parseFloat(formData.price) || 0,
        icon: formData.icon || null,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order, 10) || 0,
      };

      console.log('🔄 Submitting lens treatment data:', {
        isEdit: !!lensTreatment,
        lensTreatmentId: lensTreatment?.id,
        submitData
      });
      
      let response;
      if (lensTreatment) {
        console.log('🔄 Updating lens treatment with ID:', lensTreatment.id);
        response = await updateLensTreatment(lensTreatment.id, submitData);
        console.log('✅ Lens treatment updated successfully:', response.data);
        toast.success('Lens treatment updated successfully');
      } else {
        console.log('🔄 Creating new lens treatment');
        response = await createLensTreatment(submitData);
        console.log('✅ Lens treatment created successfully:', response.data);
        toast.success('Lens treatment created successfully');
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
      console.error('❌ Lens treatment save error:', error);
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
        const errorMessage = error.response?.data?.message || 'Failed to save lens treatment';
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
            {lensTreatment ? 'Edit Lens Treatment' : 'Add Lens Treatment'}
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
              placeholder="e.g., Scratch Proof"
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
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              placeholder="e.g., scratch-proof (auto-generated from name)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">URL-friendly identifier (auto-generated if left empty)</p>
          </div>

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
              <option value="scratch_proof">Scratch Proof</option>
              <option value="anti_glare">Anti Glare</option>
              <option value="blue_light_anti_glare">Blue Light Anti Glare</option>
              <option value="uv_protection">UV Protection</option>
              <option value="photochromic">Photochromic</option>
              <option value="polarized">Polarized</option>
              <option value="hydrophobic">Hydrophobic</option>
              <option value="oleophobic">Oleophobic</option>
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
              placeholder="e.g., 30.00"
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
              placeholder="e.g., Protects lenses from scratches and daily wear"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Icon URL
            </label>
            <input
              type="url"
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              className="input-modern"
              placeholder="https://example.com/icons/scratch-proof.svg"
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
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-modern disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LensTreatmentModal;

