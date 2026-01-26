import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiSave, FiX, FiUpload, FiDollarSign, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import SizeVolumeVariantModal from './SizeVolumeVariantModal';
import { 
  getProductSizeVolumeVariants,
  createSizeVolumeVariant,
  updateSizeVolumeVariant,
  deleteSizeVolumeVariant,
  supportsSizeVolumeVariants,
  validateSizeVolumeVariantData
} from '../services/productsService';

const SizeVolumeVariantManager = ({ productId, productType, onVariantsUpdate }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  // Check if product supports size-volume variants
  if (!supportsSizeVolumeVariants(productType)) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">Size/Volume Variants are only available for eye hygiene products.</p>
      </div>
    );
  }

  // Load variants when component mounts or productId changes
  useEffect(() => {
    if (productId) {
      loadVariants();
    }
  }, [productId]);

  const loadVariants = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading size-volume variants for product:', productId);
      const data = await getProductSizeVolumeVariants(productId);
      console.log('✅ Size-volume variants loaded:', data);
      setVariants(data.variants || []);
      if (onVariantsUpdate) {
        onVariantsUpdate(data.variants || []);
      }
    } catch (error) {
      console.error('❌ Error loading variants:', error);
      toast.error('Failed to load variants');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    if (!productId) {
      toast.error('Please save the product first before adding variants');
      return;
    }
    console.log('🔄 Opening Add Variant modal for product:', productId);
    setEditingVariant(null);
    setShowModal(true);
  };

  const handleEdit = (variant) => {
    setEditingVariant(variant);
    setShowModal(true);
  };

  const handleDelete = async (variant) => {
    if (!window.confirm(`Are you sure you want to delete the variant "${variant.size_volume}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteSizeVolumeVariant(productId, variant.id);
      toast.success('Variant deleted successfully');
      loadVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast.error(error.response?.data?.message || 'Failed to delete variant');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = (refresh = false) => {
    console.log('🔄 SizeVolumeVariantManager.handleModalClose called with refresh=', refresh);
    setShowModal(false);
    setEditingVariant(null);
    if (refresh) {
      console.log('🔄 Refreshing variants after modal close');
      loadVariants();
    }
  };

  const toggleVariantStatus = async (variant) => {
    try {
      setLoading(true);
      await updateSizeVolumeVariant(productId, variant.id, {
        ...variant,
        is_active: !variant.is_active
      });
      toast.success(`Variant ${variant.is_active ? 'deactivated' : 'activated'} successfully`);
      loadVariants();
    } catch (error) {
      console.error('Error toggling variant status:', error);
      toast.error('Failed to update variant status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Size/Volume Variants</h3>
            <p className="text-sm text-gray-500 mt-1">Manage product size and volume variants with unique images</p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            type="button"
          >
            <FiPlus className="w-4 h-4" />
            Add Variant
          </button>
        </div>
      </div>

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
                <strong>Product not saved:</strong> Please save the product first before you can add variants.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Variants List */}
      <div className="px-6 py-4">
        {loading && variants.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Loading variants...</p>
          </div>
        ) : variants.length === 0 ? (
          <div className="text-center py-8">
            <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No variants added yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {productId ? 'Add your first variant to get started' : 'Save the product first to add variants'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {variants
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((variant) => (
              <div key={variant.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${variant.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {variant.image_url && (
                      <img
                        src={variant.image_url}
                        alt={variant.size_volume}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{variant.size_volume}</h4>
                        {variant.pack_type && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                            {variant.pack_type}
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          variant.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {variant.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span className="font-medium text-gray-900">${variant.price}</span>
                        {variant.compare_at_price && (
                          <span className="line-through text-gray-400">${variant.compare_at_price}</span>
                        )}
                        {variant.sku && (
                          <span>SKU: {variant.sku}</span>
                        )}
                        <span>Order: {variant.sort_order}</span>
                      </div>
                      {variant.stock_quantity !== undefined && (
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`font-medium ${
                            variant.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Stock: {variant.stock_quantity}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            variant.stock_status === 'in_stock' ? 'bg-green-100 text-green-800' :
                            variant.stock_status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {variant.stock_status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleVariantStatus(variant)}
                      className={`p-1 rounded transition-colors ${
                        variant.is_active 
                          ? 'text-gray-400 hover:text-yellow-600' 
                          : 'text-gray-400 hover:text-green-600'
                      }`}
                      title={variant.is_active ? 'Deactivate variant' : 'Activate variant'}
                    >
                      <div className={`w-4 h-4 rounded-full ${
                        variant.is_active ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    </button>
                    <button
                      onClick={() => handleEdit(variant)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit variant"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(variant)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete variant"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Size/Volume Variant Modal */}
      {showModal && (
        <SizeVolumeVariantModal
          variant={editingVariant}
          productId={productId}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default SizeVolumeVariantManager;
