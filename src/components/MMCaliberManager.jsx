import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSave, FiX, FiMaximize2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { mmCalibersApi } from '../api/mmCalibers';
import {
  validateCaliberData,
  formatCaliberDisplay,
  supportsMMCalibers
} from '../services/productsService';

const MMCaliberManager = ({ productId, productType, onCalibersUpdate }) => {
  const [calibers, setCalibers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [formData, setFormData] = useState({
    mm: '',
    product_id: productId || ''
  });

  // Check if product supports MM calibers
  if (!supportsMMCalibers(productType)) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">MM Calibers are only available for sunglasses and eyeglasses products.</p>
      </div>
    );
  }

  // Load calibers when component mounts or productId changes
  useEffect(() => {
    if (productId) {
      loadCalibers();
    }
  }, [productId]);

  // Initialize form data with productId
  useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      product_id: productId || '' 
    }));
  }, []); // Only run once on mount

  const loadCalibers = async () => {
    try {
      setLoading(true);
      setApiError(null);
      console.log('🔄 Loading calibers for product:', productId);
      const data = await mmCalibersApi.getProductCalibers(productId);
      console.log('✅ Calibers loaded successfully:', data);
      setCalibers(data.data || data.calibers || []);
      if (onCalibersUpdate) {
        onCalibersUpdate(data.data || data.calibers || []);
      }
    } catch (error) {
      console.error('❌ Error loading calibers:', error);
      // Check if this is a 500 error or "backend not implemented" error
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
    setFormData({ 
      mm: '', 
      product_id: productId || ''
    });
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if product is saved first
    if (!productId) {
      toast.error('Please save the product first before adding calibers');
      return;
    }
    
    // Validate form data
    const errors = validateCaliberData(formData);
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    try {
      setLoading(true);

      const response = await mmCalibersApi.addCaliberToProduct(productId, {
        mm: formData.mm
      });
      console.log('✅ Caliber created successfully:', response);
      toast.success('Caliber created successfully');

      // Add the new caliber to local state immediately (no page refresh)
      const newCaliber = { mm: formData.mm };
      const nextCalibers = [...calibers, newCaliber];
      setCalibers(nextCalibers);
      if (onCalibersUpdate) {
        onCalibersUpdate(nextCalibers);
      }

      resetForm();
      
      // Reload calibers to ensure we have the latest data from server
      setTimeout(() => {
        loadCalibers();
      }, 500);
    } catch (error) {
      console.error('Error saving caliber:', error);
      // Check if this is a 500 error or "backend not implemented" error
      if (error.response?.status === 500) {
        setApiError('Backend API not implemented - MM Calibers endpoint is not available on the server');
        toast.error('Backend API not implemented for MM Calibers');
      } else if (error.response?.status === 404) {
        setApiError('Product not found - The product may not exist or has been deleted');
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

  const handleDelete = async (caliber) => {
    if (!window.confirm(`Are you sure you want to delete the ${formatCaliberDisplay(caliber.mm)} caliber?`)) {
      return;
    }

    try {
      setLoading(true);
      await mmCalibersApi.deleteCaliber(productId, caliber.mm);
      toast.success('Caliber deleted successfully');
      loadCalibers();
    } catch (error) {
      console.error('Error deleting caliber:', error);
      // Check if this is a 500 error or "backend not implemented" error
      if (error.response?.status === 500) {
        setApiError('Backend API not implemented - MM Calibers endpoint is not available on the server');
        toast.error('Backend API not implemented for MM Calibers');
      } else if (error.response?.status === 404) {
        setApiError('Product not found - The product may not exist or has been deleted');
        toast.error('Product not found');
      } else if (error.message && error.message.includes('Caliber management is not yet available')) {
        setApiError(error.message);
        toast.error(error.message);
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete caliber';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">MM Calibers</h3>
            <p className="text-sm text-gray-500 mt-1">
              Frame size options only (like shoe sizes). Sizes never change the product image.
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
            Add Caliber
          </button>
        </div>
      </div>

      {/* Backend API Not Implemented Warning */}
      {apiError && (
        <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 text-yellow-600">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Backend API Not Implemented:</strong> {apiError}
              </p>
            </div>
          </div>
        </div>
      )}

      
      {/* Warning message when product is not saved */}
      {!productId && (
        <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 text-yellow-600">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Product not saved:</strong> Please save the product first before you can add calibers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50" onSubmit={(e) => e.preventDefault()}>
          <form onSubmit={handleSubmit} className="space-y-4" onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Add New Caliber</h4>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product ID
                </label>
                <input
                  type="text"
                  value={formData.product_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                  placeholder="Product ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Auto-populated from current product</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caliber Size (mm)
                </label>
                <input
                  type="text"
                  value={formData.mm}
                  onChange={(e) => setFormData(prev => ({ ...prev, mm: e.target.value }))}
                  placeholder="e.g., 58"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sizes are shown to customers in a dropdown. Product photos come from the Images tab.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  resetForm();
                }}
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
                Create Caliber
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calibers List */}
      <div className="px-6 py-4">
        {loading && calibers.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Loading calibers...</p>
          </div>
        ) : calibers.length === 0 ? (
          <div className="text-center py-8">
            <FiMaximize2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No calibers added yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {productId ? 'Add your first caliber to get started' : 'Save the product first to add calibers'}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {calibers.map((caliber) => (
              <div
                key={caliber.mm}
                className="flex items-center gap-3 border border-gray-200 rounded-lg pl-4 pr-2 py-2 hover:shadow-sm transition-shadow"
              >
                <span className="font-medium text-gray-900">{formatCaliberDisplay(caliber.mm)}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(caliber);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete caliber"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MMCaliberManager;
