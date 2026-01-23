import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

const FrameSizeModal = ({ frameSize, onClose }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    product_id: '',
    lens_width: '',
    bridge_width: '',
    temple_length: '',
    frame_width: '',
    frame_height: '',
    size_label: '',
  });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    // Fetch products when component mounts
    fetchProducts();
  }, []);

  useEffect(() => {
    if (frameSize) {
      // Handle both snake_case and camelCase field names
      setFormData({
        product_id: frameSize.product_id !== null && frameSize.product_id !== undefined
          ? frameSize.product_id
          : (frameSize.productId !== null && frameSize.productId !== undefined
            ? frameSize.productId
            : ''),
        lens_width: frameSize.lens_width !== null && frameSize.lens_width !== undefined
          ? frameSize.lens_width
          : (frameSize.lensWidth !== null && frameSize.lensWidth !== undefined
            ? frameSize.lensWidth
            : ''),
        bridge_width: frameSize.bridge_width !== null && frameSize.bridge_width !== undefined
          ? frameSize.bridge_width
          : (frameSize.bridgeWidth !== null && frameSize.bridgeWidth !== undefined
            ? frameSize.bridgeWidth
            : ''),
        temple_length: frameSize.temple_length !== null && frameSize.temple_length !== undefined
          ? frameSize.temple_length
          : (frameSize.templeLength !== null && frameSize.templeLength !== undefined
            ? frameSize.templeLength
            : ''),
        frame_width: frameSize.frame_width !== null && frameSize.frame_width !== undefined
          ? frameSize.frame_width
          : (frameSize.frameWidth !== null && frameSize.frameWidth !== undefined
            ? frameSize.frameWidth
            : ''),
        frame_height: frameSize.frame_height !== null && frameSize.frame_height !== undefined
          ? frameSize.frame_height
          : (frameSize.frameHeight !== null && frameSize.frameHeight !== undefined
            ? frameSize.frameHeight
            : ''),
        size_label: frameSize.size_label || frameSize.sizeLabel || '',
      });
      // Set selected product if editing existing frame size
      if (frameSize.product_id || frameSize.productId) {
        const productId = frameSize.product_id || frameSize.productId;
        setSelectedProduct(products.find(p => p.id == productId) || null);
      }
    } else {
      setFormData({
        product_id: '',
        lens_width: '',
        bridge_width: '',
        temple_length: '',
        frame_width: '',
        frame_height: '',
        size_label: '',
      });
      setSelectedProduct(null);
    }
  }, [frameSize, products]);

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await api.get(API_ROUTES.ADMIN.PRODUCTS.LIST);
      // Handle response structure: { success, message, data: { products: [...] } }
      const productsData = response.data?.data?.products || response.data?.products || response.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Products fetch error:', error);
      toast.error('Failed to fetch products');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setFormData({ ...formData, product_id: product.id });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Handle numeric fields - keep as string for form but validate
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data - convert empty strings to null for optional fields
      const submitData = {
        ...formData,
        frame_width: formData.frame_width === '' ? null : formData.frame_width,
        frame_height: formData.frame_height === '' ? null : formData.frame_height,
      };

      let response;
      if (frameSize) {
        console.log('🔄 Updating frame size:', frameSize.id, submitData);
        response = await api.put(API_ROUTES.ADMIN.FRAME_SIZES.UPDATE(frameSize.id), submitData);
        // Handle response structure: { success, message, data: { frameSize: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Frame size updated successfully');
        } else {
          toast.success('Frame size updated successfully');
        }
      } else {
        console.log('➕ Creating new frame size:', submitData);
        response = await api.post(API_ROUTES.ADMIN.FRAME_SIZES.CREATE, submitData);
        // Handle response structure: { success, message, data: { frameSize: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Frame size created successfully');
        } else {
          toast.success('Frame size created successfully');
        }
      }
      
      console.log('✅ Frame size operation completed, calling onClose(true) to refresh table');
      onClose(true); // Pass true to indicate successful save
    } catch (error) {
      console.error('Frame size save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save frame size');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to save frame sizes');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save frame size';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200/50 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10 flex-shrink-0">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {frameSize ? t('editFrameSize') : t('addFrameSize')}
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('selectProduct')} <span className="text-red-500">*</span>
            </label>
            
            {/* Selected Product Display */}
            {selectedProduct && (
              <div className="mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-indigo-900">{selectedProduct.name}</p>
                    <p className="text-sm text-indigo-700">
                      {selectedProduct.product_code && `Code: ${selectedProduct.product_code}`}
                      {selectedProduct.price && ` • Price: $${selectedProduct.price}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setFormData({ ...formData, product_id: '' });
                    }}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Products Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productsLoading ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                          Loading products...
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                          No products available
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <tr
                          key={product.id}
                          onClick={() => handleProductSelect(product)}
                          className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedProduct?.id === product.id ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {product.product_code || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {product.price ? `$${product.price}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {!selectedProduct && (
              <p className="text-xs text-gray-500 mt-1">Click on a product to select it</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('lensWidth')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="lens_width"
                value={formData.lens_width}
                onChange={handleChange}
                step="0.01"
                className="input-modern"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('bridgeWidth')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="bridge_width"
                value={formData.bridge_width}
                onChange={handleChange}
                step="0.01"
                className="input-modern"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('templeLength')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="temple_length"
              value={formData.temple_length}
              onChange={handleChange}
              step="0.01"
              className="input-modern"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('frameWidth')}
              </label>
              <input
                type="number"
                name="frame_width"
                value={formData.frame_width}
                onChange={handleChange}
                step="0.01"
                className="input-modern"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('frameHeight')}
              </label>
              <input
                type="number"
                name="frame_height"
                value={formData.frame_height}
                onChange={handleChange}
                step="0.01"
                className="input-modern"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('sizeLabel')} <span className="text-red-500">*</span>
            </label>
            <select
              name="size_label"
              value={formData.size_label}
              onChange={handleChange}
              className="input-modern"
              required
            >
              <option value="">{t('selectSize')}</option>
              <option value="Small">{t('small')}</option>
              <option value="Medium">{t('medium')}</option>
              <option value="Large">{t('large')}</option>
              <option value="Extra Large">{t('extraLarge')}</option>
            </select>
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
              {loading ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FrameSizeModal;

