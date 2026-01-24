import React, { useState, useEffect } from 'react';
import { FiX, FiGift } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import { useI18n } from '../context/I18nContext';

const FreeGiftModal = ({ gift, onClose, onSuccess }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    product_id: '',
    gift_product_id: '',
    min_quantity: 1,
    max_quantity: '',
    description: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [triggerSearchTerm, setTriggerSearchTerm] = useState('');
  const [giftSearchTerm, setGiftSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (gift) {
      setFormData({
        product_id: gift.product_id || '',
        gift_product_id: gift.gift_product_id || '',
        min_quantity: gift.min_quantity || 1,
        max_quantity: gift.max_quantity || '',
        description: gift.description || '',
        is_active: gift.is_active !== undefined ? gift.is_active : true,
      });
    } else {
      setFormData({
        product_id: '',
        gift_product_id: '',
        min_quantity: 1,
        max_quantity: '',
        description: '',
        is_active: true,
      });
    }
  }, [gift]);

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
      [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : parseInt(value)) : value)
    }));
  };

  const handleTriggerProductSelect = (productId) => {
    setFormData(prev => ({
      ...prev,
      product_id: prev.product_id === productId ? '' : productId
    }));
  };

  const handleGiftProductSelect = (productId) => {
    setFormData(prev => ({
      ...prev,
      gift_product_id: prev.gift_product_id === productId ? '' : productId
    }));
  };

  const filteredTriggerProducts = products.filter(product =>
    product.name?.toLowerCase().includes(triggerSearchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(triggerSearchTerm.toLowerCase())
  );

  const filteredGiftProducts = products.filter(product =>
    product.name?.toLowerCase().includes(giftSearchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(giftSearchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.product_id) {
        toast.error('Trigger product must be selected');
        setLoading(false);
        return;
      }
      
      if (!formData.gift_product_id) {
        toast.error('Free gift product must be selected');
        setLoading(false);
        return;
      }
      
      if (formData.min_quantity < 1) {
        toast.error('Minimum quantity must be at least 1');
        setLoading(false);
        return;
      }

      const dataToSend = {
        product_id: parseInt(formData.product_id),
        gift_product_id: parseInt(formData.gift_product_id),
        min_quantity: parseInt(formData.min_quantity),
        is_active: formData.is_active,
      };

      if (formData.max_quantity !== '') {
        dataToSend.max_quantity = parseInt(formData.max_quantity);
      }

      if (formData.description && formData.description.trim()) {
        dataToSend.description = formData.description.trim();
      }

      let response;
      if (gift) {
        response = await api.put(API_ROUTES.ADMIN.FREE_GIFTS.UPDATE(gift.id), dataToSend);
      } else {
        response = await api.post(API_ROUTES.ADMIN.FREE_GIFTS.CREATE, dataToSend);
      }
      
      const successMessage = response.data?.message || (gift ? 'Free gift rule updated successfully' : 'Free gift rule created successfully');
      toast.success(successMessage);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Free gift save error:', error);
      const errorMessage = error.response?.data?.message || (gift ? 'Failed to update free gift rule' : 'Failed to create free gift rule');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center space-x-3">
            <FiGift className="w-6 h-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              {gift ? 'Edit Free Gift Rule' : 'Create Free Gift Rule'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> When a customer purchases the selected product (minimum quantity required), 
              they will automatically receive the free gift product in their order.
            </p>
          </div>

          {/* Trigger Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trigger Product (Product that triggers the gift) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Search trigger product..."
              value={triggerSearchTerm}
              onChange={(e) => setTriggerSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
            />
            <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto p-3">
              {productsLoading ? (
                <div className="text-center py-4 text-gray-500">Loading products...</div>
              ) : filteredTriggerProducts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No products found</div>
              ) : (
                <div className="space-y-2">
                  {filteredTriggerProducts.map((product) => (
                    <label
                      key={product.id}
                      className={`flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer ${
                        formData.product_id === product.id ? 'bg-primary-50 border border-primary-300' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="product_id"
                        checked={formData.product_id === product.id}
                        onChange={() => handleTriggerProductSelect(product.id)}
                        className="border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
                        {product.name} {product.sku && `(${product.sku})`}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
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
              rows={2}
              placeholder="Optional description for this gift rule"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="min_quantity"
                value={formData.min_quantity}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Min. quantity of trigger product required
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Quantity
              </label>
              <input
                type="number"
                name="max_quantity"
                value={formData.max_quantity}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional max. quantity for eligibility
              </p>
            </div>
          </div>

          {/* Free Gift Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Free Gift Product (Product to give away) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Search gift product..."
              value={giftSearchTerm}
              onChange={(e) => setGiftSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
            />
            <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto p-3">
              {productsLoading ? (
                <div className="text-center py-4 text-gray-500">Loading products...</div>
              ) : filteredGiftProducts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No products found</div>
              ) : (
                <div className="space-y-2">
                  {filteredGiftProducts.map((product) => (
                    <label
                      key={product.id}
                      className={`flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer ${
                        formData.gift_product_id === product.id ? 'bg-green-50 border border-green-300' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="gift_product_id"
                        checked={formData.gift_product_id === product.id}
                        onChange={() => handleGiftProductSelect(product.id)}
                        className="border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
                        {product.name} {product.sku && `(${product.sku})`}
                      </span>
                      {formData.gift_product_id === product.id && (
                        <FiGift className="w-4 h-4 text-green-600 ml-auto" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
            {formData.gift_product_id && (
              <p className="mt-2 text-sm text-green-600 font-medium">
                ✓ Gift product selected
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
              {loading ? 'Saving...' : gift ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FreeGiftModal;
