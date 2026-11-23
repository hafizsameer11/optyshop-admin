import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSave, FiX, FiMaximize2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { mmCalibersApi } from '../api/mmCalibers';
import {
  validateCaliberData,
  formatCaliberDisplay,
  supportsMMCalibers
} from '../services/productsService';

const emptyForm = (productId) => ({
  mm: '',
  lens_width: '',
  bridge_width: '',
  temple_length: '',
  frame_width: '',
  price: '',
  stock_quantity: '',
  product_id: productId || '',
});

const MMCaliberManager = ({ productId, productType, onCalibersUpdate }) => {
  const [calibers, setCalibers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [formData, setFormData] = useState(emptyForm(productId));

  if (!supportsMMCalibers(productType)) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">MM Calibers are only available for sunglasses and eyeglasses products.</p>
      </div>
    );
  }

  useEffect(() => {
    if (productId) {
      loadCalibers();
    }
  }, [productId]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      product_id: productId || '',
    }));
  }, [productId]);

  const loadCalibers = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const data = await mmCalibersApi.getProductCalibers(productId);
      const list = data.data || data.calibers || (Array.isArray(data) ? data : []);
      setCalibers(list);
      if (onCalibersUpdate) {
        onCalibersUpdate(list);
      }
    } catch (error) {
      console.error('Error loading calibers:', error);
      if (error.response?.status === 500) {
        setApiError('Backend API not implemented - MM Calibers endpoint is not available on the server');
        toast.error('Backend API not implemented for MM Calibers');
      } else if (error.response?.status === 404) {
        setApiError('Product not found - The product may not exist or has been deleted');
        toast.error('Product not found');
      } else if (error.message && error.message.includes('Caliber management is not yet available')) {
        setApiError(error.message);
      } else {
        toast.error('Failed to load calibers');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm(productId));
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productId) {
      toast.error('Please save the product first before adding calibers');
      return;
    }

    const payload = {
      mm: formData.lens_width || formData.mm,
      lens_width: formData.lens_width || formData.mm,
      bridge_width: formData.bridge_width || null,
      temple_length: formData.temple_length || null,
      frame_width: formData.frame_width || null,
      price: formData.price === '' ? null : formData.price,
      stock_quantity: formData.stock_quantity === '' ? null : formData.stock_quantity,
    };

    const errors = validateCaliberData(payload);
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    try {
      setLoading(true);
      const response = await mmCalibersApi.addCaliberToProduct(productId, payload);
      toast.success('Size option created successfully');

      const created = response?.data?.caliber || response?.caliber || payload;
      const nextCalibers = [...calibers, created];
      setCalibers(nextCalibers);
      if (onCalibersUpdate) {
        onCalibersUpdate(nextCalibers);
      }

      resetForm();
      setTimeout(() => loadCalibers(), 400);
    } catch (error) {
      console.error('Error saving caliber:', error);
      if (error.response?.status === 500) {
        setApiError('Backend API not implemented - MM Calibers endpoint is not available on the server');
        toast.error('Backend API not implemented for MM Calibers');
      } else if (error.response?.status === 404) {
        toast.error('Product not found');
      } else if (error.message && error.message.includes('Caliber management is not yet available')) {
        setApiError(error.message);
        toast.error(error.message);
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to save caliber';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteKeyFor = (caliber) => {
    if (caliber.id) return caliber.id;
    return String(caliber.mm);
  };

  const handleDelete = async (caliber) => {
    const label = formatCaliberDisplay(caliber);
    if (!window.confirm(`Delete size option ${label}?`)) {
      return;
    }

    try {
      setLoading(true);
      const key = deleteKeyFor(caliber);
      const params = {};
      if (!caliber.id) {
        if (caliber.bridge_width) params.bridge_width = caliber.bridge_width;
        if (caliber.temple_length) params.temple_length = caliber.temple_length;
        if (caliber.frame_width) params.frame_width = caliber.frame_width;
      }
      await mmCalibersApi.deleteCaliber(productId, key, params);
      toast.success('Caliber deleted successfully');
      loadCalibers();
    } catch (error) {
      console.error('Error deleting caliber:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete caliber';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">MM Calibers / Frame sizes</h3>
            <p className="text-sm text-gray-500 mt-1">
              Add multiple size rows: Calibro (lens width), Ponte, Asta, and frame width. Each row is one option on the product page.
            </p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!productId) {
                toast.error('Please save the product first before adding calibers');
                return;
              }
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            type="button"
          >
            <FiPlus className="w-4 h-4" />
            Add size
          </button>
        </div>
      </div>

      {apiError && (
        <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Backend API:</strong> {apiError}
          </p>
        </div>
      )}

      {!productId && (
        <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Product not saved:</strong> Please save the product first before you can add sizes.
          </p>
        </div>
      )}

      {showAddForm && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Add size option</h4>
              <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calibro / Lens width (mm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lens_width || formData.mm}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lens_width: e.target.value,
                      mm: e.target.value,
                    }))
                  }
                  placeholder="e.g. 52"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ponte / Bridge (mm)</label>
                <input
                  type="text"
                  value={formData.bridge_width}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bridge_width: e.target.value }))}
                  placeholder="e.g. 18"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asta / Temple (mm)</label>
                <input
                  type="text"
                  value={formData.temple_length}
                  onChange={(e) => setFormData((prev) => ({ ...prev, temple_length: e.target.value }))}
                  placeholder="e.g. 140"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frame width (mm)</label>
                <input
                  type="text"
                  value={formData.frame_width}
                  onChange={(e) => setFormData((prev) => ({ ...prev, frame_width: e.target.value }))}
                  placeholder="e.g. 135"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price adjustment (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock qty (optional)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, stock_quantity: e.target.value }))}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit(e);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <FiSave className="w-4 h-4" />
                Save size
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="px-6 py-4">
        {loading && calibers.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-gray-500 mt-2">Loading sizes...</p>
          </div>
        ) : calibers.length === 0 ? (
          <div className="text-center py-8">
            <FiMaximize2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No size options yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {productId
                ? 'Add Calibro / Ponte / Asta rows for customers to choose from'
                : 'Save the product first to add sizes'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-3">Calibro</th>
                  <th className="py-2 pr-3">Ponte</th>
                  <th className="py-2 pr-3">Asta</th>
                  <th className="py-2 pr-3">Frame width</th>
                  <th className="py-2 pr-3">Price</th>
                  <th className="py-2 pr-3">Stock</th>
                  <th className="py-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {calibers.map((caliber, idx) => (
                  <tr key={caliber.id || `${caliber.mm}-${idx}`} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-3 font-medium text-gray-900">
                      {caliber.lens_width || caliber.mm || '—'} mm
                    </td>
                    <td className="py-2.5 pr-3 text-gray-700">
                      {caliber.bridge_width != null && caliber.bridge_width !== ''
                        ? `${caliber.bridge_width} mm`
                        : '—'}
                    </td>
                    <td className="py-2.5 pr-3 text-gray-700">
                      {caliber.temple_length != null && caliber.temple_length !== ''
                        ? `${caliber.temple_length} mm`
                        : '—'}
                    </td>
                    <td className="py-2.5 pr-3 text-gray-700">
                      {caliber.frame_width != null && caliber.frame_width !== ''
                        ? `${caliber.frame_width} mm`
                        : '—'}
                    </td>
                    <td className="py-2.5 pr-3 text-gray-700">
                      {caliber.price != null && caliber.price !== '' ? `€${Number(caliber.price).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2.5 pr-3 text-gray-700">
                      {caliber.stock_quantity != null && caliber.stock_quantity !== ''
                        ? caliber.stock_quantity
                        : '—'}
                    </td>
                    <td className="py-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(caliber);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MMCaliberManager;
