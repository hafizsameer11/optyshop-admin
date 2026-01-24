import React, { useState, useEffect } from 'react';
import { FiX, FiClock } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import { useI18n } from '../context/I18nContext';

const FlashOfferModal = ({ offer, onClose, onSuccess }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
    product_ids: [],
    image_url: '',
    link_url: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (offer) {
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16); // Format for datetime-local input
      };

      let productIds = [];
      if (offer.product_ids) {
        if (Array.isArray(offer.product_ids)) {
          productIds = offer.product_ids;
        } else if (typeof offer.product_ids === 'string') {
          productIds = offer.product_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        }
      } else if (offer.products && Array.isArray(offer.products)) {
        productIds = offer.products.map(p => p.id || p.product_id).filter(Boolean);
      }

      setFormData({
        title: offer.title || '',
        description: offer.description || '',
        discount_type: offer.discount_type || 'percentage',
        discount_value: offer.discount_value || '',
        starts_at: formatDate(offer.starts_at),
        ends_at: formatDate(offer.ends_at),
        is_active: offer.is_active !== undefined ? offer.is_active : true,
        product_ids: productIds,
        image_url: offer.image_url || '',
        link_url: offer.link_url || '',
      });
      setImagePreview(offer.image_url || '');
    } else {
      setFormData({
        title: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        starts_at: '',
        ends_at: '',
        is_active: true,
        product_ids: [],
        image_url: '',
        link_url: '',
      });
      setImageFile(null);
      setImagePreview('');
    }
  }, [offer]);

  // Countdown timer effect
  useEffect(() => {
    if (!formData.ends_at) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(formData.ends_at).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds, expired: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [formData.ends_at]);

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await api.get(`${API_ROUTES.PRODUCTS.LIST}?limit=1000`);
      const productsData = response.data?.data?.products || response.data?.products || response.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Products fetch error:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProductToggle = (productId) => {
    setFormData(prev => {
      const productIds = prev.product_ids || [];
      if (productIds.includes(productId)) {
        return { ...prev, product_ids: productIds.filter(id => id !== productId) };
      } else {
        return { ...prev, product_ids: [...productIds, productId] };
      }
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.title || !formData.title.trim()) {
        toast.error('Title is required');
        setLoading(false);
        return;
      }
      if (!formData.discount_value) {
        toast.error('Discount value is required');
        setLoading(false);
        return;
      }
      
      const discountValue = parseFloat(formData.discount_value);
      if (isNaN(discountValue) || discountValue < 0) {
        toast.error('Discount value must be a valid positive number');
        setLoading(false);
        return;
      }
      
      if (!formData.starts_at || !formData.ends_at) {
        toast.error('Start and end dates are required');
        setLoading(false);
        return;
      }
      
      const startDate = new Date(formData.starts_at);
      const endDate = new Date(formData.ends_at);
      if (endDate < startDate) {
        toast.error('End date must be after start date');
        setLoading(false);
        return;
      }

      const dataToSend = {
        title: formData.title.trim(),
        discount_type: formData.discount_type,
        discount_value: discountValue,
        starts_at: formData.starts_at,
        ends_at: formData.ends_at,
        is_active: formData.is_active,
      };

      if (formData.description && formData.description.trim()) {
        dataToSend.description = formData.description.trim();
      }

      if (formData.product_ids && Array.isArray(formData.product_ids) && formData.product_ids.length > 0) {
        dataToSend.product_ids = formData.product_ids;
      }

      const formDataObj = new FormData();
      Object.keys(dataToSend).forEach(key => {
        if (key === 'product_ids') {
          formDataObj.append(key, JSON.stringify(dataToSend[key]));
        } else {
          formDataObj.append(key, dataToSend[key]);
        }
      });

      if (formData.link_url) {
        formDataObj.append('link_url', formData.link_url);
      }

      if (imageFile) {
        formDataObj.append('image', imageFile);
      }

      let response;
      if (offer) {
        response = await api.put(API_ROUTES.ADMIN.FLASH_OFFERS.UPDATE(offer.id), formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post(API_ROUTES.ADMIN.FLASH_OFFERS.CREATE, formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      const successMessage = response.data?.message || (offer ? 'Flash offer updated successfully' : 'Flash offer created successfully');
      toast.success(successMessage);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Flash offer save error:', error);
      const errorMessage = error.response?.data?.message || (offer ? 'Failed to update flash offer' : 'Failed to create flash offer');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {offer ? 'Edit Flash Offer' : 'Create Flash Offer'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Countdown Timer Display */}
          {formData.ends_at && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FiClock className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">Time Remaining:</span>
                </div>
                {timeRemaining.expired ? (
                  <span className="text-xl font-bold text-red-600">EXPIRED</span>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 font-mono">
                        {String(timeRemaining.hours).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-600 uppercase">Hours</div>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">:</div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 font-mono">
                        {String(timeRemaining.minutes).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-600 uppercase">Minutes</div>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">:</div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 font-mono">
                        {String(timeRemaining.seconds).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-600 uppercase">Seconds</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Banner Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner Image
            </label>
            <div className="flex items-center space-x-4">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
          </div>

          {/* Link URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link URL
            </label>
            <input
              type="url"
              name="link_url"
              value={formData.link_url}
              onChange={handleChange}
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Discount Type and Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <select
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="discount_value"
                value={formData.discount_value}
                onChange={handleChange}
                min="0"
                step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Start and End Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="starts_at"
                value={formData.starts_at}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="ends_at"
                value={formData.ends_at}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Products (Leave empty for all products)
            </label>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
            />
            <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto p-3">
              {productsLoading ? (
                <div className="text-center py-4 text-gray-500">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No products found</div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.product_ids?.includes(product.id) || false}
                        onChange={() => handleProductToggle(product.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
                        {product.name} {product.sku && `(${product.sku})`}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {formData.product_ids && formData.product_ids.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                {formData.product_ids.length} product(s) selected
              </p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : offer ? 'Update Offer' : 'Create Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FlashOfferModal;
