import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import { sendFormSubmissionEmail } from '../utils/emailService';

const CouponModal = ({ coupon, onClose, onSuccess }) => {
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
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (coupon) {
      // Format dates for input fields (YYYY-MM-DD)
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

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
      });
    }
  }, [coupon]);

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
      if (!formData.starts_at || !formData.ends_at) {
        toast.error('Start and end dates are required');
        setLoading(false);
        return;
      }

      // Prepare data object - convert empty strings to null for optional fields
      const dataToSend = {
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        starts_at: formData.starts_at,
        ends_at: formData.ends_at,
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
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save coupon');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 400 || error.response.status === 422) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
        toast.error(errorMessage);
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
              Applicable To
            </label>
            <input
              type="text"
              name="applicable_to"
              value={formData.applicable_to}
              onChange={handleChange}
              className="input-modern"
              placeholder="Optional: e.g., specific products, categories"
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
              Active
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

export default CouponModal;

