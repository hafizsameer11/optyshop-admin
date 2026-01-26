import React, { useState, useEffect } from 'react';
import { FiX, FiUpload, FiImage } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

const SizeVolumeVariantModal = ({ variant, productId, onClose }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    size_volume: '',
    pack_type: '',
    price: '',
    compare_at_price: '',
    cost_price: '',
    stock_quantity: '',
    stock_status: 'in_stock',
    sku: '',
    expiry_date: '',
    is_active: true,
    sort_order: '',
    image_url: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (variant) {
      // Editing existing variant
      setFormData({
        size_volume: variant.size_volume || '',
        pack_type: variant.pack_type || '',
        price: variant.price || '',
        compare_at_price: variant.compare_at_price || '',
        cost_price: variant.cost_price || '',
        stock_quantity: variant.stock_quantity !== null && variant.stock_quantity !== undefined ? variant.stock_quantity : '',
        stock_status: variant.stock_status || 'in_stock',
        sku: variant.sku || '',
        expiry_date: variant.expiry_date ? new Date(variant.expiry_date).toISOString().split('T')[0] : '',
        is_active: variant.is_active !== undefined ? variant.is_active : true,
        sort_order: variant.sort_order !== null && variant.sort_order !== undefined ? variant.sort_order : '',
        image_url: variant.image_url || '',
      });
    } else {
      // New variant
      setFormData({
        size_volume: '',
        pack_type: '',
        price: '',
        compare_at_price: '',
        cost_price: '',
        stock_quantity: '',
        stock_status: 'in_stock',
        sku: '',
        expiry_date: '',
        is_active: true,
        sort_order: '',
        image_url: '',
      });
    }
  }, [variant]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'number') {
      setFormData({ ...formData, [name]: value === '' ? '' : value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real implementation, you would upload the file to a server
      // For now, we'll create a temporary URL
      const tempUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, image_url: tempUrl }));
      toast.info('Image uploaded (temporary URL for demo)');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.size_volume || !formData.size_volume.trim()) {
      toast.error('Size/Volume is required');
      return;
    }
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      toast.error('Valid price is required');
      return;
    }
    
    setLoading(true);

    try {
      // Prepare data - convert empty strings to null for optional fields
      const submitData = {
        size_volume: formData.size_volume.trim(),
        price: parseFloat(formData.price),
        pack_type: formData.pack_type || null,
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        stock_quantity: formData.stock_quantity !== '' ? parseInt(formData.stock_quantity) : 0,
        stock_status: formData.stock_status || 'in_stock',
        sku: formData.sku || null,
        expiry_date: formData.expiry_date || null,
        is_active: formData.is_active,
        sort_order: formData.sort_order !== '' ? parseInt(formData.sort_order) : 0,
        image_url: formData.image_url || null,
      };

      let response;
      if (variant && variant.id) {
        // Update existing variant
        // Per Postman: PUT /api/admin/products/:productId/size-volume-variants/:variantId
        response = await api.put(
          API_ROUTES.ADMIN.PRODUCTS.SIZE_VOLUME_VARIANTS.UPDATE(productId, variant.id),
          submitData
        );
        toast.success('Variant updated successfully');
      } else {
        // Create new variant
        // Per Postman: POST /api/admin/products/:productId/size-volume-variants
        response = await api.post(
          API_ROUTES.ADMIN.PRODUCTS.SIZE_VOLUME_VARIANTS.CREATE(productId),
          submitData
        );
        toast.success('Variant created successfully');
      }
      
      onClose(true); // Pass saved=true to trigger refresh
    } catch (error) {
      console.error('Variant save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save variant');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save variant';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200/50 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10 flex-shrink-0">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {variant ? 'Edit Size/Volume Variant' : 'Add Size/Volume Variant'}
          </h2>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <button 
              onClick={() => onClose(false)} 
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-all duration-200"
              aria-label="Close"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Size/Volume <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="size_volume"
                value={formData.size_volume}
                onChange={handleChange}
                className="input-modern"
                placeholder="e.g., 5ml, 10ml, 30ml"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pack Type
              </label>
              <input
                type="text"
                name="pack_type"
                value={formData.pack_type}
                onChange={handleChange}
                className="input-modern"
                placeholder="e.g., Single, Pack of 2"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input-modern"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Compare At Price
              </label>
              <input
                type="number"
                name="compare_at_price"
                value={formData.compare_at_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input-modern"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cost Price
              </label>
              <input
                type="number"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input-modern"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                min="0"
                className="input-modern"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock Status
              </label>
              <select
                name="stock_status"
                value={formData.stock_status}
                onChange={handleChange}
                className="input-modern"
              >
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="backorder">Backorder</option>
                <option value="preorder">Preorder</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                SKU
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="input-modern"
                placeholder="Variant SKU"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                className="input-modern"
              />
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
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm font-semibold text-gray-700">
                Active
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Variant Image
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="flex-1 input-modern"
              />
              <label className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 cursor-pointer flex items-center gap-2">
                <FiUpload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            {formData.image_url && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Image Preview</label>
                <div className="flex items-center gap-4">
                  <img
                    src={formData.image_url}
                    alt="Variant preview"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80x80?text=Error';
                    }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{formData.size_volume || 'Variant'}</p>
                    <p className="text-sm text-gray-600">${formData.price || '0.00'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white flex-shrink-0">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-modern disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('saving') : variant ? 'Update Variant' : 'Create Variant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SizeVolumeVariantModal;

