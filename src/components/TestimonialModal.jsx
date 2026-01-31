import React, { useState, useEffect } from 'react';
import { FiX, FiStar, FiUpload } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

const TestimonialModal = ({ testimonial, onClose, onSuccess }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    customer_name: '',
    text: '',
    rating: 5,
    avatar_url: '',
    is_featured: false,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (testimonial) {
      setFormData({
        customer_name: testimonial.customer_name || '',
        text: testimonial.text || '',
        rating: testimonial.rating || 5,
        avatar_url: testimonial.avatar_url || '',
        is_featured: testimonial.is_featured !== undefined ? testimonial.is_featured : false,
        sort_order: testimonial.sort_order !== undefined ? testimonial.sort_order : 0,
      });
      // Set image preview if URL exists
      if (testimonial.avatar_url) {
        setImagePreview(testimonial.avatar_url);
      } else {
        setImagePreview(null);
      }
      setImageFile(null);
    } else {
      // Reset form for new testimonial
      setFormData({
        customer_name: '',
        text: '',
        rating: 5,
        avatar_url: '',
        is_featured: false,
        sort_order: 0,
      });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [testimonial]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value);
    setFormData({
      ...formData,
      [name]: fieldValue
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Upload to server immediately to get HTTPS URL
      const formData = new FormData();
      formData.append('image', file);
      
      // Show loading state
      toast.loading('Uploading image...');
      
      // Upload to server
      fetch('/api/admin/upload/image', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success && data.url) {
          setImageFile(file);
          setImagePreview(data.url);
          toast.success('Image uploaded successfully');
        } else {
          toast.error('Failed to upload image');
        }
      })
      .catch(error => {
        console.error('Upload error:', error);
        toast.error('Failed to upload image');
      })
      .finally(() => {
        toast.dismiss();
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.customer_name || !formData.customer_name.trim()) {
        toast.error('Customer name is required');
        setLoading(false);
        return;
      }
      if (!formData.text || !formData.text.trim()) {
        toast.error('Testimonial text is required');
        setLoading(false);
        return;
      }

      // Use FormData if image is being uploaded, otherwise use JSON
      let response;
      if (imageFile) {
        // Upload with image file
        const formDataToSend = new FormData();
        formDataToSend.append('customer_name', formData.customer_name.trim());
        formDataToSend.append('text', formData.text.trim());
        formDataToSend.append('rating', formData.rating || 5);
        formDataToSend.append('is_featured', formData.is_featured.toString());
        formDataToSend.append('sort_order', (formData.sort_order || 0).toString());
        formDataToSend.append('avatar', imageFile);

        if (testimonial) {
          response = await api.put(API_ROUTES.CMS.TESTIMONIALS.UPDATE(testimonial.id), formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          response = await api.post(API_ROUTES.CMS.TESTIMONIALS.CREATE, formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      } else {
        // Use JSON format (no image upload)
        const dataToSend = {
          customer_name: formData.customer_name.trim(),
          text: formData.text.trim(),
          rating: formData.rating || 5,
          is_featured: formData.is_featured,
          sort_order: formData.sort_order || 0,
        };

        // Add optional avatar_url only if it exists and no new image is being uploaded
        if (formData.avatar_url && formData.avatar_url.trim() && !imageFile) {
          dataToSend.avatar_url = formData.avatar_url.trim();
        } else {
          dataToSend.avatar_url = null;
        }

        if (testimonial) {
          response = await api.put(API_ROUTES.CMS.TESTIMONIALS.UPDATE(testimonial.id), dataToSend);
        } else {
          response = await api.post(API_ROUTES.CMS.TESTIMONIALS.CREATE, dataToSend);
        }
      }

      const successMessage = response.data?.message || (testimonial ? 'Testimonial updated successfully' : 'Testimonial created successfully');
      toast.success(successMessage);
      // Reset image file after successful save
      setImageFile(null);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Testimonial save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save testimonial');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 400 || error.response.status === 422) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save testimonial';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {testimonial ? t('editTestimonial') : t('addTestimonial')}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('customerName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              className="input-modern"
              required
              placeholder="e.g., John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('testimonialText')} <span className="text-red-500">*</span>
            </label>
            <textarea
              name="text"
              value={formData.text}
              onChange={handleChange}
              rows="4"
              className="input-modern resize-none"
              required
              placeholder="Share your testimonial..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('avatar')}
            </label>
            <div className="space-y-2">
              {imagePreview && (
                <div className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                <FiUpload className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {imagePreview ? t('changeAvatar') || 'Change Avatar Image' : t('uploadAvatar') || 'Upload Avatar Image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500">JPG, PNG, GIF, or WEBP (max 10MB)</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <FiStar
                    className={`w-8 h-8 transition-colors ${star <= formData.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                      }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium text-gray-600">
                {formData.rating} out of 5
              </span>
            </div>
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
            <p className="mt-1 text-sm text-gray-500">Lower numbers appear first</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_featured"
              id="is_featured"
              checked={formData.is_featured}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="is_featured" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
              Featured Testimonial
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

export default TestimonialModal;

