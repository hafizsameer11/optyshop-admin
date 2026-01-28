import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import bannerAPI from '../api/banners';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

const BannerModal = ({ banner, onClose }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    position: '',
    sort_order: 0,
    is_active: true,
    page_type: 'home',
    category_id: '',
    sub_category_id: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [nestedSubCategories, setNestedSubCategories] = useState([]);
  const [parentSubCategoryId, setParentSubCategoryId] = useState('');

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

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch subcategories when category_id changes
  useEffect(() => {
    if (formData.category_id && (formData.page_type === 'category' || formData.page_type === 'subcategory' || formData.page_type === 'sub_subcategory')) {
      fetchSubCategories(formData.category_id);
    } else {
      setSubCategories([]);
      setNestedSubCategories([]);
    }
  }, [formData.category_id, formData.page_type]);

  // Fetch nested subcategories when parentSubCategoryId changes (for sub_subcategory page_type)
  useEffect(() => {
    if (parentSubCategoryId && formData.page_type === 'sub_subcategory' && formData.category_id) {
      fetchNestedSubCategories(parentSubCategoryId);
    } else if (formData.page_type !== 'sub_subcategory') {
      setNestedSubCategories([]);
      setParentSubCategoryId('');
    }
  }, [parentSubCategoryId, formData.page_type, formData.category_id]);

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || '',
        image_url: banner.image_url || '',
        link_url: banner.link_url || '',
        position: banner.position || '',
        sort_order: banner.sort_order || 0,
        is_active: banner.is_active !== undefined ? banner.is_active : true,
        page_type: banner.page_type || banner.pageType || 'home',
        category_id: (banner.category_id || banner.categoryId) ? (banner.category_id || banner.categoryId).toString() : '',
        sub_category_id: (banner.sub_category_id || banner.subCategoryId || banner.subcategory_id) ? (banner.sub_category_id || banner.subCategoryId || banner.subcategory_id).toString() : '',
      });
      // Normalize image URL for preview
      const normalizedUrl = normalizeImageUrl(banner.image_url);
      setImagePreview(normalizedUrl);

      // Load category and subcategory data if available
      const categoryId = banner.category_id || banner.categoryId;
      const subCategoryId = banner.sub_category_id || banner.subCategoryId || banner.subcategory_id;
      const pageType = banner.page_type || banner.pageType || 'home';

      if (categoryId) {
        fetchSubCategories(categoryId).then(() => {
          if (subCategoryId && pageType === 'sub_subcategory') {
            // For sub_subcategory, we need to find the parent and load nested subcategories
            setTimeout(async () => {
              try {
                // Fetch the subcategory to find its parent
                const subCatResponse = await api.get(API_ROUTES.SUBCATEGORIES.BY_ID(subCategoryId));
                const subCat = subCatResponse.data?.data || subCatResponse.data;
                if (subCat?.parent_id || subCat?.parentId) {
                  const parentId = subCat.parent_id || subCat.parentId;
                  setParentSubCategoryId(parentId.toString());
                  fetchNestedSubCategories(parentId);
                }
              } catch (error) {
                console.warn('Failed to fetch subcategory details for editing', error);
              }
            }, 500);
          }
        });
      }
    } else {
      setFormData({
        title: '',
        image_url: '',
        link_url: '',
        position: '',
        sort_order: 0,
        is_active: true,
        page_type: 'home',
        category_id: '',
        sub_category_id: '',
      });
      setImagePreview(null);
      setParentSubCategoryId('');
      setSubCategories([]);
      setNestedSubCategories([]);
    }
  }, [banner]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      const categoriesData = response.data?.data?.categories || response.data?.categories || response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Failed to fetch categories', error);
      setCategories([]);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    if (!categoryId) {
      setSubCategories([]);
      setNestedSubCategories([]);
      return Promise.resolve();
    }

    try {
      // Fetch top-level subcategories for the category
      const response = await api.get(`/categories/${categoryId}/subcategories`);
      const responseData = response.data?.data || response.data || {};
      const subCatData = responseData.subcategories || responseData || [];

      // Filter to get only top-level subcategories (parent_id = null)
      const topLevel = Array.isArray(subCatData)
        ? subCatData.filter(sub => {
          const parentId = sub.parent_id !== undefined ? sub.parent_id :
            sub.parentId ||
            sub.parent_subcategory_id ||
            sub.parentSubcategoryId;
          return parentId === null || parentId === undefined || parentId === '';
        })
        : [];

      setSubCategories(topLevel);
      return Promise.resolve();
    } catch (error) {
      console.warn('Failed to fetch subcategories', error);
      setSubCategories([]);
      return Promise.reject(error);
    }
  };

  const fetchNestedSubCategories = async (subCategoryId) => {
    if (!subCategoryId) {
      setNestedSubCategories([]);
      return;
    }

    try {
      // Fetch nested subcategories (sub-subcategories) for the selected subcategory
      const response = await api.get(`/subcategories/${subCategoryId}/nested`);
      const responseData = response.data?.data || response.data || {};
      const nestedData = responseData.subcategories || responseData || [];
      setNestedSubCategories(Array.isArray(nestedData) ? nestedData : []);
    } catch (error) {
      console.warn('Failed to fetch nested subcategories', error);
      setNestedSubCategories([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) : value,
    };

    // Reset dependent fields when page_type changes
    if (name === 'page_type') {
      if (value === 'home') {
        newFormData.category_id = '';
        newFormData.sub_category_id = '';
        setSubCategories([]);
        setNestedSubCategories([]);
      } else if (value === 'category') {
        newFormData.sub_category_id = '';
        setNestedSubCategories([]);
        // Keep category_id if already selected
      }
      // For subcategory and sub_subcategory, keep category_id and sub_category_id if selected
    }

    // Reset sub_category_id when category_id changes
    if (name === 'category_id') {
      newFormData.sub_category_id = '';
      setNestedSubCategories([]);
      setParentSubCategoryId('');
    }

    // Reset parent subcategory when page_type changes
    if (name === 'page_type' && value !== 'sub_subcategory') {
      setParentSubCategoryId('');
      setNestedSubCategories([]);
    }

    setFormData(newFormData);
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

      // Image dimensions validation removed
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageFile(file);
        setImagePreview(event.target.result);
      };
      reader.onerror = () => {
        toast.error('Failed to read image file. Please try again.');
        e.target.value = '';
        setImageFile(null);
        setImagePreview(null);
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

      // Validate form based on page_type
      if (formData.page_type === 'category' || formData.page_type === 'subcategory' || formData.page_type === 'sub_subcategory') {
        if (!formData.category_id) {
          toast.error('Category is required for this page type');
          setLoading(false);
          return;
        }
      }

      if (formData.page_type === 'subcategory' || formData.page_type === 'sub_subcategory') {
        if (!formData.sub_category_id) {
          toast.error('Subcategory is required for this page type');
          setLoading(false);
          return;
        }
      }

      // Add all form fields
      submitData.append('title', formData.title);
      submitData.append('page_type', formData.page_type);

      if (formData.link_url) {
        submitData.append('link_url', formData.link_url);
      }
      if (formData.position) {
        submitData.append('position', formData.position);
      }
      // Validate sort_order is a number
      const sortOrder = parseInt(formData.sort_order, 10);
      if (isNaN(sortOrder) || sortOrder < 0) {
        toast.error('Sort order must be a valid positive number');
        setLoading(false);
        return;
      }
      
      submitData.append('sort_order', sortOrder.toString());
      submitData.append('is_active', formData.is_active.toString());

      // Add category_id and sub_category_id based on page_type
      // For home page: don't send category_id or sub_category_id (backend will set to null)
      // For category page: send category_id only
      // For subcategory/sub_subcategory: send both category_id and sub_category_id
      if (formData.page_type !== 'home') {
        if (formData.category_id) {
          submitData.append('category_id', formData.category_id);
        }

        // For subcategory and sub_subcategory, also send sub_category_id
        if ((formData.page_type === 'subcategory' || formData.page_type === 'sub_subcategory') && formData.sub_category_id) {
          submitData.append('sub_category_id', formData.sub_category_id);
        }
      }

      // Add image file if provided
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      let response;
      if (banner) {
        console.log('Updating banner with ID:', banner.id);
        response = await bannerAPI.update(banner.id, submitData);
        toast.success('Banner updated successfully');
      } else {
        console.log('Creating new banner');
        response = await bannerAPI.create(submitData);
        toast.success('Banner created successfully');
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

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/50 relative"
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {banner ? t('editBanner') : t('addBanner')}
          </h2>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-all duration-200"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('title')} *
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
              {t('image')} *
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
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: JPG, PNG, GIF, WEBP (Max 10MB)
            </p>
            {banner && !imageFile && (
              <p className="text-xs text-gray-500 mt-1">
                {t('leaveEmptyToKeepCurrent')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('linkURLOptional')}
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
              Page Type *
            </label>
            <select
              name="page_type"
              value={formData.page_type}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="home">Home Page</option>
              <option value="category">Category Page</option>
              <option value="subcategory">Subcategory Page</option>
              <option value="sub_subcategory">Sub-subcategory Page</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select where this banner should be displayed
            </p>
          </div>

          {(formData.page_type === 'category' || formData.page_type === 'subcategory' || formData.page_type === 'sub_subcategory') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category * <span className="text-xs font-normal text-gray-500">(Required for this page type)</span>
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required={formData.page_type !== 'home'}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.page_type === 'subcategory' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory * <span className="text-xs font-normal text-gray-500">(Required for this page type)</span>
              </label>
              <select
                name="sub_category_id"
                value={formData.sub_category_id}
                onChange={handleChange}
                required
                disabled={!formData.category_id}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {formData.category_id ? 'Select a subcategory' : 'Select a category first'}
                </option>
                {subCategories.map((subCat) => (
                  <option key={subCat.id} value={subCat.id.toString()}>
                    {subCat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.page_type === 'sub_subcategory' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Subcategory * <span className="text-xs font-normal text-gray-500">(Select parent first)</span>
                </label>
                <select
                  name="parent_subcategory_id"
                  value={parentSubCategoryId}
                  onChange={(e) => {
                    setParentSubCategoryId(e.target.value);
                    setFormData({ ...formData, sub_category_id: '' }); // Reset sub-subcategory selection
                    setNestedSubCategories([]);
                  }}
                  required
                  disabled={!formData.category_id}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {formData.category_id ? 'Select a parent subcategory' : 'Select a category first'}
                  </option>
                  {subCategories.map((subCat) => (
                    <option key={subCat.id} value={subCat.id.toString()}>
                      {subCat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-subcategory * <span className="text-xs font-normal text-gray-500">(Required for this page type)</span>
                </label>
                <select
                  name="sub_category_id"
                  value={formData.sub_category_id}
                  onChange={handleChange}
                  required
                  disabled={!parentSubCategoryId}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {parentSubCategoryId ? 'Select a sub-subcategory' : 'Select a parent subcategory first'}
                  </option>
                  {nestedSubCategories.map((nestedSubCat) => (
                    <option key={nestedSubCat.id} value={nestedSubCat.id.toString()}>
                      {nestedSubCat.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('positionOptional')}
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., header, footer, sidebar"
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

  return createPortal(modalContent, document.body);
};

export default BannerModal;

