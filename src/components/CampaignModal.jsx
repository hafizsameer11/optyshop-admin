import React, { useState, useEffect } from 'react';
import { FiX, FiUpload, FiImage, FiLink } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import { sendFormSubmissionEmail } from '../utils/emailService';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

const CampaignModal = ({ campaign, onClose, onSuccess }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    campaign_type: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
    link_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (campaign) {
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      setFormData({
        name: campaign.name || '',
        slug: campaign.slug || '',
        description: campaign.description || '',
        campaign_type: campaign.campaign_type || '',
        starts_at: formatDate(campaign.starts_at),
        ends_at: formatDate(campaign.ends_at),
        is_active: campaign.is_active !== undefined ? campaign.is_active : true,
        link_url: campaign.link_url || '',
      });
      
      // Handle image preview with error handling for invalid data URLs
      if (campaign.image_url) {
        // Check if it's a data URL and validate it
        if (campaign.image_url.startsWith('data:')) {
          const img = new Image();
          img.onload = () => {
            setImagePreview(campaign.image_url);
          };
          img.onerror = () => {
            console.warn('Invalid data URL, clearing image preview');
            setImagePreview(null);
          };
          img.src = campaign.image_url;
        } else {
          setImagePreview(campaign.image_url);
        }
      } else {
        setImagePreview(null);
      }
      setImageFile(null);
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        campaign_type: '',
        starts_at: '',
        ends_at: '',
        is_active: true,
        link_url: '',
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [campaign]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, [name]: fieldValue });
  };

  const handleImageChange = (e) => {
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

    setImageFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    const fileInput = document.getElementById('campaign-image');
    if (fileInput) fileInput.value = '';
  };

  useEffect(() => {
    if (!campaign && formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, campaign]);

  const areAllFieldsFilled = () => {
    // All fields are now optional - no validation required
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // All fields are now optional - no validation required

      // Always use FormData for campaign creation/update (backend expects multipart/form-data)
      const formDataToSend = new FormData();
      
      // Only send fields that have values
      if (formData.name && formData.name.trim()) {
        formDataToSend.append('name', formData.name.trim());
      }
      if (formData.slug && formData.slug.trim()) {
        formDataToSend.append('slug', formData.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'));
      }
      if (formData.description && formData.description.trim()) {
        formDataToSend.append('description', formData.description.trim());
      }
      
      // Convert dates to ISO format (backend expects ISO format)
      // Use direct string concatenation to avoid timezone shifts
      const formatDateForAPI = (dateString) => {
        if (!dateString) return '';
        // If already in ISO format, return as is
        if (dateString.includes('T')) return dateString;
        // Convert YYYY-MM-DD to ISO format (YYYY-MM-DDTHH:mm:ssZ)
        // Use midnight UTC to avoid timezone issues (without milliseconds to match Postman example)
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return `${dateString}T00:00:00Z`;
        }
        // Try parsing as date if format is different
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
        return dateString;
      };
      
      formDataToSend.append('is_active', formData.is_active.toString());
      
      // Only send dates if they have values
      if (formData.starts_at) {
        formDataToSend.append('starts_at', formatDateForAPI(formData.starts_at));
      }
      if (formData.ends_at) {
        formDataToSend.append('ends_at', formatDateForAPI(formData.ends_at));
      }
      
      // Send optional fields only if they have values (per Postman collection)
      if (formData.campaign_type && formData.campaign_type.trim()) {
        formDataToSend.append('campaign_type', formData.campaign_type.trim());
      }
      
      // Only append image if a new file is selected
      const FileConstructor = typeof File !== 'undefined' ? File : null;
      if (FileConstructor && imageFile instanceof FileConstructor) {
        formDataToSend.append('image', imageFile);
      }
      
      // Send link_url only if it has a value
      if (formData.link_url && formData.link_url.trim()) {
        formDataToSend.append('link_url', formData.link_url.trim());
      }

      let response;
      if (campaign) {
        response = await api.put(API_ROUTES.ADMIN.CAMPAIGNS.UPDATE(campaign.id), formDataToSend);
      } else {
        response = await api.post(API_ROUTES.ADMIN.CAMPAIGNS.CREATE, formDataToSend);
      }
      
      const successMessage = response.data?.message || (campaign ? 'Campaign updated successfully' : 'Campaign created successfully');
      toast.success(successMessage);
      
      if (areAllFieldsFilled()) {
        try {
          const emailSent = await sendFormSubmissionEmail(formData, 'Campaign', null);
          if (emailSent) {
            toast.success('Email notification sent successfully');
          }
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Campaign save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save campaign');
      } else if (error.response.status === 401) {
        toast.error('âŒ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 400 || error.response.status === 422) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
        toast.error(errorMessage);
      } else if (error.response.status === 500) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.error || 'Server error - Please check the console for details';
        console.error('Server error details:', errorData);
        console.error('Request payload:', {
          name: formData.name,
          slug: formData.slug,
          starts_at: formData.starts_at,
          ends_at: formData.ends_at,
          hasImage: FileConstructor && imageFile instanceof FileConstructor
        });
        toast.error(`Server Error: ${errorMessage}`);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save campaign';
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
            {campaign ? t('editCampaign') : t('addCampaign')}
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
              {t('campaignName')}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-modern"
              placeholder="e.g., Winter Sale 2025"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Slug
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="input-modern font-mono"
              placeholder="e.g., winter-sale-2025"
            />
            <p className="mt-1 text-xs text-gray-500">URL-friendly identifier (auto-generated from name)</p>
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
              placeholder="Brief description of the campaign..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('campaignType')}
            </label>
            <input
              type="text"
              name="campaign_type"
              value={formData.campaign_type}
              onChange={handleChange}
              className="input-modern"
              placeholder="Optional: e.g., discount, promotion, seasonal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('startsAt')}
              </label>
              <input
                type="date"
                name="starts_at"
                value={formData.starts_at}
                onChange={handleChange}
                className="input-modern"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('endsAt')}
              </label>
              <input
                type="date"
                name="ends_at"
                value={formData.ends_at}
                onChange={handleChange}
                className="input-modern"
              />
            </div>
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
              Active Campaign
            </label>
          </div>

          {/* Campaign Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FiImage className="inline w-4 h-4 mr-1" />
              Campaign Image
            </label>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative group">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 shadow-sm">
                    <img
                      src={imagePreview}
                      alt="Campaign preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center gap-2 shadow-lg"
                      >
                        <FiX className="w-4 h-4" />
                        Remove Image
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-indigo-400 transition-all duration-200">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiUpload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF, WEBP (MAX. 10MB)</p>
                  </div>
                  <input
                    type="file"
                    id="campaign-image"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Upload campaign image (JPG, PNG, GIF, WEBP - Max 10MB)
            </p>
          </div>

          {/* Link URL Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FiLink className="inline w-4 h-4 mr-1" />
              Campaign Link URL
            </label>
            <input
              type="url"
              name="link_url"
              value={formData.link_url}
              onChange={handleChange}
              className="input-modern"
              placeholder="https://example.com/campaign-page"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional: URL to redirect when campaign is clicked
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
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

export default CampaignModal;
