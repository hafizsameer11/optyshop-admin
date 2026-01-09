import React, { useState, useEffect } from 'react';
import { FiX, FiUpload, FiImage, FiExternalLink } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

const BrandModal = ({ brand, onClose, onSuccess }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    website_url: '',
    sort_order: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    if (brand) {
      // Handle both snake_case and camelCase field names
      setFormData({
        name: brand.name || '',
        slug: brand.slug || '',
        description: brand.description || '',
        website_url: brand.website_url || brand.websiteUrl || '',
        sort_order: brand.sort_order !== null && brand.sort_order !== undefined
          ? brand.sort_order
          : (brand.sortOrder !== null && brand.sortOrder !== undefined
            ? brand.sortOrder
            : 0),
        is_active: brand.is_active !== undefined 
          ? brand.is_active 
          : (brand.isActive !== undefined ? brand.isActive : true),
      });
      
      const logoUrl = brand.logo_url || brand.logoUrl;
      if (logoUrl) {
        setLogoPreview(logoUrl);
      } else {
        setLogoPreview(null);
      }
      setLogoFile(null);
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        website_url: '',
        sort_order: 0,
        is_active: true,
      });
      setLogoFile(null);
      setLogoPreview(null);
    }
  }, [brand]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value);
    setFormData({ ...formData, [name]: fieldValue });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, GIF, or WEBP images.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image size must be less than 10MB.');
      return;
    }

    setLogoFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        toast.error('Brand name is required');
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      
      // Required fields
      formDataToSend.append('name', formData.name.trim());
      
      // Optional fields - only send if they have values (per Postman collection)
      if (formData.slug && formData.slug.trim()) {
        formDataToSend.append('slug', formData.slug.trim());
      }
      if (formData.description && formData.description.trim()) {
        formDataToSend.append('description', formData.description.trim());
      }
      if (formData.website_url && formData.website_url.trim()) {
        formDataToSend.append('website_url', formData.website_url.trim());
      }
      // Always send sort_order and is_active (required by backend)
      formDataToSend.append('sort_order', formData.sort_order.toString());
      formDataToSend.append('is_active', formData.is_active.toString());
      
      // Logo upload (only if new logo selected)
      if (logoFile instanceof File) {
        formDataToSend.append('logo', logoFile);
      }

      if (brand) {
        // Update existing brand
        await api.put(API_ROUTES.ADMIN.BRANDS.UPDATE(brand.id), formDataToSend);
        toast.success(t('brandUpdated') || 'Brand updated successfully');
      } else {
        // Create new brand
        await api.post(API_ROUTES.ADMIN.BRANDS.CREATE, formDataToSend);
        toast.success(t('brandCreated') || 'Brand created successfully');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Brand save error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Request payload:', {
        name: formData.name,
        slug: formData.slug,
        hasLogo: logoFile instanceof File,
        sort_order: formData.sort_order,
        is_active: formData.is_active
      });
      
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save brand');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 400 || error.response.status === 422) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation error';
        toast.error(errorMessage);
      } else if (error.response.status === 500) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.error || 'Server error - Please check the console for details';
        console.error('Server error details:', errorData);
        toast.error(`Server Error: ${errorMessage}`);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save brand';
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
            {brand ? (t('editBrand') || 'Edit Brand') : (t('addBrand') || 'Add Brand')}
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
          {/* Brand Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('brandName') || 'Brand Name'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-modern"
              placeholder={t('brandNamePlaceholder') || 'e.g., ZEISS, ZENNI, Transitions'}
              required
            />
          </div>

          {/* Brand Slug */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('brandSlug') || 'Brand Slug'}
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="input-modern"
              placeholder={t('brandSlugPlaceholder') || 'zeiss, zenni, transitions'}
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('brandSlugHint') || 'Leave empty to auto-generate from brand name'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('description') || 'Description'}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-modern"
              rows="3"
              placeholder={t('brandDescriptionPlaceholder') || 'Brand description...'}
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FiImage className="inline w-4 h-4 mr-1" />
              {t('brandLogo') || 'Brand Logo'}
            </label>
            <div className="space-y-3">
              {logoPreview ? (
                <div className="relative group">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 shadow-sm">
                    <img src={logoPreview} alt="Brand logo preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                      <button type="button" onClick={handleRemoveLogo} className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center gap-2 shadow-lg">
                        <FiX className="w-4 h-4" />
                        {t('removeImage') || 'Remove Logo'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-indigo-400 transition-all duration-200">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiUpload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">{t('clickToUpload') || 'Click to upload'}</span> {t('orDragAndDrop') || 'or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF, WEBP (MAX. 10MB)</p>
                  </div>
                  <input
                    type="file"
                    id="brand-logo"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {t('brandLogoHint') || 'Upload brand logo (JPG, PNG, GIF, WEBP - Max 10MB)'}
            </p>
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FiExternalLink className="inline w-4 h-4 mr-1" />
              {t('websiteUrl') || 'Website URL'}
            </label>
            <input
              type="url"
              name="website_url"
              value={formData.website_url}
              onChange={handleChange}
              className="input-modern"
              placeholder="https://example.com"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('websiteUrlHint') || 'Optional: Link to brand\'s official website'}
            </p>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('sortOrder') || 'Sort Order'}
            </label>
            <input
              type="number"
              name="sort_order"
              value={formData.sort_order}
              onChange={handleChange}
              className="input-modern"
              placeholder="0"
              min="0"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('sortOrderHint') || 'Lower numbers appear first (default: 0)'}
            </p>
          </div>

          {/* Active Status */}
          <div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is-active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="is-active" className="text-sm font-semibold text-gray-700">
                {t('activeBrand') || 'Active Brand'}
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500 ml-8">
              {t('activeBrandHint') || 'Only active brands will be displayed on the website'}
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('saving') || 'Saving...'}
                </span>
              ) : (
                brand ? (t('update') || 'Update Brand') : (t('create') || 'Create Brand')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandModal;

