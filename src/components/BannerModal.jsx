import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const BannerModal = ({ banner, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    position: '',
    sort_order: 0,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper function to normalize image URLs
  const normalizeImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return null;
    
    // Skip test/example URLs
    const testDomains = ['example.com', 'localhost', '127.0.0.1', 'test.com', 'placeholder.com'];
    try {
      const urlObj = new URL(trimmedUrl);
      const hostname = urlObj.hostname.toLowerCase();
      
      if (testDomains.some(domain => hostname.includes(domain))) {
        return null;
      }
      
      return trimmedUrl;
    } catch (e) {
      // Relative path
      if (trimmedUrl.startsWith('/')) {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://optyshop-frontend.hmstech.org/api';
        const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
        return `${baseUrl}${trimmedUrl}`;
      }
      return null;
    }
  };

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || '',
        image_url: banner.image_url || '',
        link_url: banner.link_url || '',
        position: banner.position || '',
        sort_order: banner.sort_order || 0,
        is_active: banner.is_active !== undefined ? banner.is_active : true,
      });
      // Normalize image URL for preview
      const normalizedUrl = normalizeImageUrl(banner.image_url);
      setImagePreview(normalizedUrl);
    } else {
      setFormData({
        title: '',
        image_url: '',
        link_url: '',
        position: '',
        sort_order: 0,
        is_active: true,
      });
      setImagePreview(null);
    }
  }, [banner]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) : value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPG, PNG, GIF, or WEBP)');
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        toast.error('Image file is too large. Please select a file smaller than 10MB.');
        e.target.value = ''; // Clear the input
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate image for new banners
      if (!banner && !imageFile) {
        toast.error('Please select an image for the banner');
        setLoading(false);
        return;
      }

      const submitData = new FormData();
      
      // Add all form fields
      submitData.append('title', formData.title);
      if (formData.link_url) {
        submitData.append('link_url', formData.link_url);
      }
      if (formData.position) {
        submitData.append('position', formData.position);
      }
      submitData.append('sort_order', formData.sort_order.toString());
      submitData.append('is_active', formData.is_active.toString());

      // Add image file if provided
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      let response;
      let requestUrl;
      if (banner) {
        // Use admin route for updating with safety check
        requestUrl = API_ROUTES.ADMIN?.BANNERS?.UPDATE?.(banner.id) || `/admin/banners/${banner.id}`;
        console.log('Updating banner - URL:', requestUrl);
        response = await api.put(requestUrl, submitData);
        // Handle response structure: { success, message, data: { banner: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Banner updated successfully');
        } else {
          toast.success('Banner updated successfully');
        }
      } else {
        // Use admin route for creating with safety check
        requestUrl = API_ROUTES.ADMIN?.BANNERS?.CREATE || '/admin/banners';
        console.log('Creating banner - URL:', requestUrl);
        response = await api.post(requestUrl, submitData);
        // Handle response structure: { success, message, data: { banner: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Banner created successfully');
        } else {
          toast.success('Banner created successfully');
        }
      }
      onClose();
    } catch (error) {
      console.error('Banner save error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      });
      
      if (!error.response) {
        toast.error('Backend unavailable - Make sure the backend server is running on http://localhost:5000');
      } else if (error.response.status === 404) {
        const attemptedUrl = error.config?.baseURL + error.config?.url;
        toast.error(`API endpoint not found (404). Attempted URL: ${attemptedUrl}. Please verify the backend server is running and the route exists.`);
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to save banners');
      } else if (error.response.status === 400 || error.response.status === 422) {
        // Validation errors - show detailed message
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || 
                           errorData.errors?.[0]?.msg || 
                           errorData.errors?.[0]?.message ||
                           (Array.isArray(errorData.errors) ? errorData.errors.join(', ') : 'Validation failed');
        toast.error(errorMessage);
      } else if (error.response.status === 413) {
        toast.error('File too large. Please select a smaller image file.');
      } else if (error.response.status === 415) {
        toast.error('Unsupported file type. Please select a valid image file (JPG, PNG, etc.).');
      } else {
        // Try to extract error message from various possible response structures
        const errorData = error.response?.data || {};
        let errorMessage = errorData.message || 
                          errorData.error || 
                          errorData.errors?.[0]?.msg ||
                          errorData.errors?.[0]?.message ||
                          'Failed to save banner';
        
        // Check if it's a file upload error
        const errorString = JSON.stringify(errorData).toLowerCase();
        if (errorString.includes('upload') || errorString.includes('file') || errorString.includes('image')) {
          errorMessage = errorData.message || 'File upload failed. Please try again or contact administrator.';
        }
        
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">
            {banner ? 'Edit Banner' : 'Add Banner'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Welcome Banner"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image *
            </label>
            {imagePreview && (
              <div className="mb-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                  onError={(e) => {
                    console.warn('Image preview failed to load:', imagePreview);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required={!banner}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {banner && !imageFile && (
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to keep current image
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link URL (Optional)
            </label>
            <input
              type="url"
              name="link_url"
              value={formData.link_url}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., https://example.com/products"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position (Optional)
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., home, header, footer"
            />
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
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Active
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

export default BannerModal;

