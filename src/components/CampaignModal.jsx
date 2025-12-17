import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import { sendFormSubmissionEmail } from '../utils/emailService';

const CampaignModal = ({ campaign, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    campaign_type: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (campaign) {
      // Format dates for input fields (YYYY-MM-DD)
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
      });
    } else {
      // Reset form for new campaign
      setFormData({
        name: '',
        slug: '',
        description: '',
        campaign_type: '',
        starts_at: '',
        ends_at: '',
        is_active: true,
      });
    }
  }, [campaign]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, [name]: fieldValue });
  };

  // Auto-generate slug from name
  useEffect(() => {
    if (!campaign && formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, campaign]);

  // Check if all form fields are filled
  const areAllFieldsFilled = () => {
    const requiredFields = ['name', 'slug', 'description', 'starts_at', 'ends_at'];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        return false;
      }
    }
    
    // Check optional fields - all must have values
    if (!formData.campaign_type || !formData.campaign_type.trim()) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        toast.error('Campaign name is required');
        setLoading(false);
        return;
      }
      if (!formData.slug || !formData.slug.trim()) {
        toast.error('Campaign slug is required');
        setLoading(false);
        return;
      }
      if (!formData.description || !formData.description.trim()) {
        toast.error('Description is required');
        setLoading(false);
        return;
      }
      if (!formData.starts_at || !formData.ends_at) {
        toast.error('Start and end dates are required');
        setLoading(false);
        return;
      }

      // Prepare data object
      const dataToSend = {
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description: formData.description.trim(),
        starts_at: formData.starts_at,
        ends_at: formData.ends_at,
        is_active: formData.is_active,
      };

      // Add optional fields
      if (formData.campaign_type && formData.campaign_type.trim()) {
        dataToSend.campaign_type = formData.campaign_type.trim();
      } else {
        dataToSend.campaign_type = null;
      }

      let response;
      if (campaign) {
        response = await api.put(API_ROUTES.ADMIN.CAMPAIGNS.UPDATE(campaign.id), dataToSend);
      } else {
        response = await api.post(API_ROUTES.ADMIN.CAMPAIGNS.CREATE, dataToSend);
      }
      
      const successMessage = response.data?.message || (campaign ? 'Campaign updated successfully' : 'Campaign created successfully');
      toast.success(successMessage);
      
      // Check if all fields are filled and send email notification
      if (areAllFieldsFilled()) {
        try {
          const emailSent = await sendFormSubmissionEmail(
            formData,
            'Campaign',
            null // Uses default admin email from env or 'admin@optyshop.com'
          );
          
          if (emailSent) {
            toast.success('Email notification sent successfully');
          } else {
            // Email service might not be configured, but form was saved
            console.log('Email service not available, but form was saved successfully');
          }
        } catch (emailError) {
          // Don't fail the form submission if email fails
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
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 400 || error.response.status === 422) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save campaign';
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
            {campaign ? 'Edit Campaign' : 'Add Campaign'}
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-modern"
              required
              placeholder="e.g., Winter Sale 2025"
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
              placeholder="e.g., winter-sale-2025"
            />
            <p className="mt-1 text-xs text-gray-500">URL-friendly identifier (auto-generated from name)</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="input-modern resize-none"
              required
              placeholder="Brief description of the campaign..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Campaign Type
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
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="starts_at"
                value={formData.starts_at}
                onChange={handleChange}
                className="input-modern"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="ends_at"
                value={formData.ends_at}
                onChange={handleChange}
                className="input-modern"
                required
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

export default CampaignModal;

