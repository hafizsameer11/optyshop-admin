import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiSave, FiX, FiUpload, FiDollarSign, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { 
  getEyeHygieneVariants,
  getProductEyeHygieneVariants,
  createEyeHygieneVariant,
  updateEyeHygieneVariant,
  deleteEyeHygieneVariant,
  validateEyeHygieneVariantData,
  supportsEyeHygieneVariants
} from '../services/productsService';

const EyeHygieneVariantManager = ({ productId, productType, onVariantsUpdate }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [formData, setFormData] = useState({
    product_id: productId || 0,
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_active: true,
    sort_order: 0
  });

  // Check if product supports eye hygiene variants
  if (!supportsEyeHygieneVariants(productType)) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">Eye Hygiene Variants are only available for eye hygiene products.</p>
      </div>
    );
  }

  // Load variants when component mounts or productId changes
  useEffect(() => {
    if (productId) {
      loadVariants();
    }
  }, [productId]);

  // Initialize form data with productId
  useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      product_id: productId || 0 
    }));
  }, []); // Only run once on mount

  const loadVariants = async () => {
    try {
      setLoading(true);
      const data = await getProductEyeHygieneVariants(productId);
      setVariants(data.variants || []);
      if (onVariantsUpdate) {
        onVariantsUpdate(data.variants || []);
      }
    } catch (error) {
      console.error('Error loading variants:', error);
      toast.error('Failed to load variants');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: productId || 0,
      name: '',
      description: '',
      price: '',
      image_url: '',
      is_active: true,
      sort_order: 0
    });
    setEditingVariant(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if product is saved first
    if (!productId) {
      toast.error('Please save the product first before adding variants');
      return;
    }
    
    // Prepare data for validation
    const submitData = {
      ...formData,
      price: parseFloat(formData.price)
    };
    
    // Validate form data
    const errors = validateEyeHygieneVariantData(submitData);
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    try {
      setLoading(true);
      
      if (editingVariant) {
        // Update existing variant
        await updateEyeHygieneVariant(editingVariant.id, submitData);
        toast.success('Variant updated successfully');
      } else {
        // Create new variant
        await createEyeHygieneVariant(submitData);
        toast.success('Variant created successfully');
      }
      
      resetForm();
      loadVariants();
    } catch (error) {
      console.error('Error saving variant:', error);
      toast.error(error.response?.data?.message || 'Failed to save variant');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (variant) => {
    setEditingVariant(variant);
    setFormData({
      product_id: variant.product_id,
      name: variant.name,
      description: variant.description || '',
      price: variant.price.toString(),
      image_url: variant.image_url || '',
      is_active: variant.is_active,
      sort_order: variant.sort_order || 0
    });
    setShowAddForm(true);
  };

  const handleDelete = async (variant) => {
    if (!window.confirm(`Are you sure you want to delete the variant "${variant.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteEyeHygieneVariant(variant.id);
      toast.success('Variant deleted successfully');
      loadVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast.error(error.response?.data?.message || 'Failed to delete variant');
    } finally {
      setLoading(false);
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

  const toggleVariantStatus = async (variant) => {
    try {
      setLoading(true);
      await updateEyeHygieneVariant(variant.id, {
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
            <h3 className="text-lg font-semibold text-gray-900">Eye Hygiene Variants</h3>
            <p className="text-sm text-gray-500 mt-1">Manage product variants like cleaning solutions, accessories, etc.</p>
          </div>
          <button
            onClick={() => {
              if (!productId) {
                toast.error('Please save the product first before adding variants');
                return;
              }
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">
                {editingVariant ? 'Edit Variant' : 'Add New Variant'}
              </h4>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  Variant Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Premium Cleaning Solution"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($) *
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the variant features, benefits, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Active (visible to customers)
                </label>
              </div>
            </div>

            {formData.image_url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                <div className="flex items-center gap-4">
                  <img
                    src={formData.image_url}
                    alt="Variant preview"
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/64x64?text=Error';
                    }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{formData.name || 'Unnamed Variant'}</p>
                    <p className="text-sm text-gray-600">${formData.price || '0.00'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <FiSave className="w-4 h-4" />
                {editingVariant ? 'Update' : 'Create'} Variant
              </button>
            </div>
          </form>
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
                        alt={variant.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{variant.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          variant.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {variant.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {variant.description && (
                        <p className="text-sm text-gray-600 mb-2">{variant.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="font-medium text-gray-900">${variant.price}</span>
                        <span>Order: {variant.sort_order}</span>
                      </div>
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
    </div>
  );
};

export default EyeHygieneVariantManager;
