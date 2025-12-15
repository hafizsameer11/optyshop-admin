import React, { useState, useEffect } from 'react';
import { FiX, FiStar } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const TestimonialModal = ({ testimonial, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    text: '',
    rating: 5,
    avatar_url: '',
    is_featured: false,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);

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

      // Prepare data object - convert empty strings to null for optional fields
      const dataToSend = {
        customer_name: formData.customer_name.trim(),
        text: formData.text.trim(),
        rating: formData.rating || 5,
        is_featured: formData.is_featured,
        sort_order: formData.sort_order || 0,
      };

      // Add optional fields only if they have values
      if (formData.avatar_url && formData.avatar_url.trim()) {
        dataToSend.avatar_url = formData.avatar_url.trim();
      } else {
        dataToSend.avatar_url = null;
      }

      let response;
      if (testimonial) {
        response = await api.put(API_ROUTES.CMS.TESTIMONIALS.UPDATE(testimonial.id), dataToSend);
      } else {
        response = await api.post(API_ROUTES.CMS.TESTIMONIALS.CREATE, dataToSend);
      }
      
      const successMessage = response.data?.message || (testimonial ? 'Testimonial updated successfully' : 'Testimonial created successfully');
      toast.success(successMessage);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">
            {testimonial ? 'Edit Testimonial' : 'Add Testimonial'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name *
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Testimonial Text *
            </label>
            <textarea
              name="text"
              value={formData.text}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="Share your testimonial..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avatar URL
            </label>
            <input
              type="text"
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com/avatar.jpg (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="focus:outline-none"
                >
                  <FiStar
                    className={`w-8 h-8 ${
                      star <= formData.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {formData.rating} out of 5
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Order
            </label>
            <input
              type="number"
              name="sort_order"
              value={formData.sort_order}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700">
              Featured Testimonial
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestimonialModal;

