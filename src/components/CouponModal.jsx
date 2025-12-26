import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import { sendFormSubmissionEmail } from '../utils/emailService';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

const CouponModal = ({ coupon, onClose, onSuccess }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    max_discount: '',
    min_order_amount: '',
    usage_limit: '',
    usage_per_user: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
    applicable_to: '',
    conditions: '',
    product_ids: [], // Array of product IDs
  });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (coupon) {
      // Format dates for input fields (YYYY-MM-DD)
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      // Handle product_ids - could be array or comma-separated string
      let productIds = [];
      if (coupon.product_ids) {
        if (Array.isArray(coupon.product_ids)) {
          productIds = coupon.product_ids;
        } else if (typeof coupon.product_ids === 'string') {
          productIds = coupon.product_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        }
      } else if (coupon.products && Array.isArray(coupon.products)) {
        productIds = coupon.products.map(p => p.id || p.product_id).filter(Boolean);
      }

      setFormData({
        code: coupon.code || '',
        description: coupon.description || '',
        discount_type: coupon.discount_type || 'percentage',
        discount_value: coupon.discount_value || '',
        max_discount: coupon.max_discount || '',
        min_order_amount: coupon.min_order_amount || '',
        usage_limit: coupon.usage_limit || '',
        usage_per_user: coupon.usage_per_user || '',
        starts_at: formatDate(coupon.starts_at),
        ends_at: formatDate(coupon.ends_at),
        is_active: coupon.is_active !== undefined ? coupon.is_active : true,
        applicable_to: coupon.applicable_to || '',
        conditions: coupon.conditions || '',
        product_ids: productIds,
      });
    } else {
      // Reset form for new coupon
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        max_discount: '',
        min_order_amount: '',
        usage_limit: '',
        usage_per_user: '',
        starts_at: '',
        ends_at: '',
        is_active: true,
        applicable_to: '',
        conditions: '',
        product_ids: [],
      });
    }
  }, [coupon]);

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await api.get(`${API_ROUTES.PRODUCTS.LIST}?limit=1000`);
      const productsData = response.data?.data?.products || response.data?.products || response.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, [name]: fieldValue });
  };

  // Check if all form fields are filled
  const areAllFieldsFilled = () => {
    const requiredFields = ['code', 'discount_type', 'discount_value', 'starts_at', 'ends_at'];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        return false;
      }
    }
    
    // Check optional fields - all must have values
    const optionalFields = [
      'description',
      'min_order_amount',
      'usage_limit',
      'usage_per_user',
      'applicable_to',
      'conditions'
    ];
    
    // max_discount is only relevant for percentage discounts
    if (formData.discount_type === 'percentage') {
      optionalFields.push('max_discount');
    }
    
    for (const field of optionalFields) {
      const value = formData[field];
      if (value === null || value === undefined || value === '' || 
          (typeof value === 'string' && !value.trim())) {
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.code || !formData.code.trim()) {
        toast.error('Coupon code is required');
        setLoading(false);
        return;
      }
      if (!formData.discount_value) {
        toast.error('Discount value is required');
        setLoading(false);
        return;
      }
      
      // Validate discount_value is a valid number
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
      
      // Validate date range
      const startDate = new Date(formData.starts_at);
      const endDate = new Date(formData.ends_at);
      if (endDate < startDate) {
        toast.error('End date must be after start date');
        setLoading(false);
        return;
      }

      // Prepare data object - convert empty strings to null for optional fields
      // Note: Postman collection shows valid_from/valid_until for creation
      // API returns starts_at/ends_at when fetching, but may expect valid_from/valid_until for creation
      const dataToSend = {
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: discountValue, // Already validated as number
        valid_from: formData.starts_at, // Per Postman collection spec
        valid_until: formData.ends_at, // Per Postman collection spec
        is_active: formData.is_active,
      };

      // Add optional fields only if they have values
      if (formData.description && formData.description.trim()) {
        dataToSend.description = formData.description.trim();
      } else {
        dataToSend.description = null;
      }

      if (formData.max_discount) {
        dataToSend.max_discount = parseFloat(formData.max_discount);
      } else {
        dataToSend.max_discount = null;
      }

      if (formData.min_order_amount) {
        dataToSend.min_order_amount = parseFloat(formData.min_order_amount);
      } else {
        dataToSend.min_order_amount = null;
      }

      if (formData.usage_limit) {
        dataToSend.usage_limit = parseInt(formData.usage_limit);
      } else {
        dataToSend.usage_limit = null;
      }

      if (formData.usage_per_user) {
        dataToSend.usage_per_user = parseInt(formData.usage_per_user);
      } else {
        dataToSend.usage_per_user = null;
      }

      if (formData.applicable_to && formData.applicable_to.trim()) {
        dataToSend.applicable_to = formData.applicable_to.trim();
      } else {
        dataToSend.applicable_to = null;
      }

      if (formData.conditions && formData.conditions.trim()) {
        dataToSend.conditions = formData.conditions.trim();
      } else {
        dataToSend.conditions = null;
      }

      // Add product_ids if any products are selected
      if (formData.product_ids && Array.isArray(formData.product_ids) && formData.product_ids.length > 0) {
        dataToSend.product_ids = formData.product_ids;
      } else {
        dataToSend.product_ids = null;
      }

      // Log the data being sent for debugging
      console.log('Sending coupon data:', dataToSend);
      console.log('API endpoint:', coupon 
        ? API_ROUTES.ADMIN.COUPONS.UPDATE(coupon.id)
        : API_ROUTES.ADMIN.COUPONS.CREATE);

      let response;
      if (coupon) {
        response = await api.put(API_ROUTES.ADMIN.COUPONS.UPDATE(coupon.id), dataToSend);
      } else {
        response = await api.post(API_ROUTES.ADMIN.COUPONS.CREATE, dataToSend);
      }
      
      const successMessage = response.data?.message || (coupon ? 'Coupon updated successfully' : 'Coupon created successfully');
      toast.success(successMessage);
      
      // Check if all fields are filled and send email notification
      if (areAllFieldsFilled()) {
        try {
          const emailSent = await sendFormSubmissionEmail(
            formData,
            'Coupon',
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
      console.error('Coupon save error:', error);
      console.error('Error response:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        fullError: error
      });
      
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save coupon');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 400 || error.response.status === 422) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
        toast.error(errorMessage);
      } else if (error.response.status === 500) {
        // Enhanced 500 error handling
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.error || 'Server error occurred';
        console.error('Server 500 error details:', {
          message: errorMessage,
          error: errorData.error,
          stack: errorData.stack,
          fullData: errorData
        });
        toast.error(`Server error: ${errorMessage}. Check console for details.`);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save coupon';
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
            {coupon ? 'Edit Coupon' : 'Add Coupon'}
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
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="input-modern"
              required
              placeholder="e.g., SAVE20"
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
              rows="2"
              className="input-modern resize-none"
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <select
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
                className="input-modern"
                required
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Discount Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="discount_value"
                value={formData.discount_value}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input-modern"
                required
                placeholder={formData.discount_type === 'percentage' ? '20' : '10.00'}
              />
            </div>
          </div>

          {formData.discount_type === 'percentage' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Max Discount ($)
              </label>
              <input
                type="number"
                name="max_discount"
                value={formData.max_discount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input-modern"
                placeholder="Optional maximum discount amount"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Minimum Order Amount ($)
            </label>
            <input
              type="number"
              name="min_order_amount"
              value={formData.min_order_amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="input-modern"
              placeholder="Optional minimum order amount"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usage Limit (Total)
              </label>
              <input
                type="number"
                name="usage_limit"
                value={formData.usage_limit}
                onChange={handleChange}
                min="1"
                className="input-modern"
                placeholder="Optional total usage limit"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usage Per User
              </label>
              <input
                type="number"
                name="usage_per_user"
                value={formData.usage_per_user}
                onChange={handleChange}
                min="1"
                className="input-modern"
                placeholder="Optional per-user limit"
              />
            </div>
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Assign to Products
            </label>
            <div className="space-y-3">
              {/* Search input */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern"
                placeholder="Search products by name or SKU..."
              />
              
              {/* Product selection list */}
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                {productsLoading ? (
                  <p className="text-sm text-gray-500 text-center py-4">Loading products...</p>
                ) : products.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No products available</p>
                ) : (
                  <div className="space-y-2">
                    {products
                      .filter(product => {
                        if (!searchTerm) return true;
                        const search = searchTerm.toLowerCase();
                        return (
                          product.name?.toLowerCase().includes(search) ||
                          product.sku?.toLowerCase().includes(search)
                        );
                      })
                      .map((product) => {
                        const isSelected = formData.product_ids.includes(product.id);
                        return (
                          <label
                            key={product.id}
                            className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setFormData({
                                    ...formData,
                                    product_ids: formData.product_ids.filter(id => id !== product.id)
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    product_ids: [...formData.product_ids, product.id]
                                  });
                                }
                              }}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">{product.name}</span>
                              {product.sku && (
                                <span className="text-xs text-gray-500 ml-2">(SKU: {product.sku})</span>
                              )}
                            </div>
                            {product.price && (
                              <span className="text-sm text-gray-600">${parseFloat(product.price).toFixed(2)}</span>
                            )}
                          </label>
                        );
                      })}
                  </div>
                )}
              </div>
              
              {/* Selected products display */}
              {formData.product_ids.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 font-medium mb-2">
                    Selected Products ({formData.product_ids.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.product_ids.map((productId) => {
                      const product = products.find(p => p.id === productId);
                      if (!product) return null;
                      return (
                        <span
                          key={productId}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200"
                        >
                          {product.name}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                product_ids: formData.product_ids.filter(id => id !== productId)
                              });
                            }}
                            className="ml-2 text-indigo-600 hover:text-indigo-800"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Applicable To (Additional Notes)
            </label>
            <input
              type="text"
              name="applicable_to"
              value={formData.applicable_to}
              onChange={handleChange}
              className="input-modern"
              placeholder="Optional: Additional notes about applicability"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Conditions
            </label>
            <textarea
              name="conditions"
              value={formData.conditions}
              onChange={handleChange}
              rows="2"
              className="input-modern resize-none"
              placeholder="Optional additional conditions"
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

export default CouponModal;

