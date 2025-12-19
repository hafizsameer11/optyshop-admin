import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import { sendFormSubmissionEmail } from '../utils/emailService';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

const JobModal = ({ job, onClose, onSuccess }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    department: '',
    location: '',
    description: '',
    requirements: '',
    apply_url: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (job) {
      // Parse requirements if it's a JSON string
      let requirementsText = '';
      if (job.requirements) {
        try {
          if (typeof job.requirements === 'string') {
            const parsed = JSON.parse(job.requirements);
            if (Array.isArray(parsed)) {
              requirementsText = parsed.join('\n');
            } else {
              requirementsText = job.requirements;
            }
          } else if (Array.isArray(job.requirements)) {
            requirementsText = job.requirements.join('\n');
          } else {
            requirementsText = String(job.requirements);
          }
        } catch {
          requirementsText = String(job.requirements);
        }
      }

      setFormData({
        title: job.title || '',
        slug: job.slug || '',
        department: job.department || '',
        location: job.location || '',
        description: job.description || '',
        requirements: requirementsText,
        apply_url: job.apply_url || '',
        is_active: job.is_active !== undefined ? job.is_active : true,
      });
    } else {
      // Reset form for new job
      setFormData({
        title: '',
        slug: '',
        department: '',
        location: '',
        description: '',
        requirements: '',
        apply_url: '',
        is_active: true,
      });
    }
  }, [job]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, [name]: fieldValue });
  };

  // Auto-generate slug from title
  useEffect(() => {
    if (!job && formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, job]);

  // Check if all form fields are filled
  const areAllFieldsFilled = () => {
    const requiredFields = ['title', 'slug', 'department', 'location', 'description', 'requirements'];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        return false;
      }
    }
    
    // Check optional fields
    if (!formData.apply_url || !formData.apply_url.trim()) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.title.trim()) {
        toast.error('Job title is required');
        setLoading(false);
        return;
      }
      if (!formData.slug || !formData.slug.trim()) {
        toast.error('Job slug is required');
        setLoading(false);
        return;
      }
      if (!formData.department || !formData.department.trim()) {
        toast.error('Department is required');
        setLoading(false);
        return;
      }
      if (!formData.location || !formData.location.trim()) {
        toast.error('Location is required');
        setLoading(false);
        return;
      }
      if (!formData.description || !formData.description.trim()) {
        toast.error('Description is required');
        setLoading(false);
        return;
      }

      // Parse requirements - convert newline-separated text to JSON array
      let requirementsArray = [];
      if (formData.requirements && formData.requirements.trim()) {
        requirementsArray = formData.requirements
          .split('\n')
          .map(req => req.trim())
          .filter(req => req.length > 0);
      }

      // Prepare data object
      const dataToSend = {
        title: formData.title.trim(),
        slug: formData.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        department: formData.department.trim(),
        location: formData.location.trim(),
        description: formData.description.trim(),
        requirements: JSON.stringify(requirementsArray),
        is_active: formData.is_active,
      };

      // Add optional fields
      if (formData.apply_url && formData.apply_url.trim()) {
        dataToSend.apply_url = formData.apply_url.trim();
      } else {
        dataToSend.apply_url = null;
      }

      let response;
      if (job) {
        response = await api.put(API_ROUTES.ADMIN.JOBS.UPDATE(job.id), dataToSend);
      } else {
        response = await api.post(API_ROUTES.ADMIN.JOBS.CREATE, dataToSend);
      }
      
      const successMessage = response.data?.message || (job ? 'Job updated successfully' : 'Job created successfully');
      toast.success(successMessage);
      
      // Check if all fields are filled and send email notification
      if (areAllFieldsFilled()) {
        try {
          const emailSent = await sendFormSubmissionEmail(
            formData,
            'Job',
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
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Job save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save job');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 400 || error.response.status === 422) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save job';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {job ? 'Edit Job' : 'Add Job'}
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
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-modern"
              required
              placeholder="e.g., Senior Optometrist"
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
              placeholder="e.g., senior-optometrist"
            />
            <p className="mt-1 text-xs text-gray-500">URL-friendly identifier (auto-generated from title if left empty)</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="input-modern"
                required
                placeholder="e.g., Clinical"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input-modern"
                required
                placeholder="e.g., New York, NY"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="input-modern resize-none"
              required
              placeholder="Job description and responsibilities..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Requirements <span className="text-red-500">*</span>
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows="5"
              className="input-modern resize-none"
              required
              placeholder="Enter each requirement on a new line&#10;e.g.,&#10;Doctor of Optometry (OD) degree&#10;State license to practice optometry&#10;3+ years of clinical experience"
            />
            <p className="mt-1 text-xs text-gray-500">Enter each requirement on a separate line</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Apply URL
            </label>
            <input
              type="url"
              name="apply_url"
              value={formData.apply_url}
              onChange={handleChange}
              className="input-modern"
              placeholder="https://careers.example.com/apply"
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

export default JobModal;

