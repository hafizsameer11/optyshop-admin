import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiSave, FiX, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { 
  getProductCalibers, 
  createProductCaliber, 
  updateProductCaliber, 
  deleteProductCaliber,
  validateCaliberData,
  formatCaliberDisplay,
  supportsMMCalibers
} from '../services/productsService';

const MMCaliberManager = ({ productId, productType, onCalibersUpdate }) => {
  const [calibers, setCalibers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCaliber, setEditingCaliber] = useState(null);
  const [formData, setFormData] = useState({
    mm: '',
    image_url: '',
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
      console.log('Loading calibers for product:', productId);
      const data = await getProductCalibers(productId);
      console.log('Calibers loaded:', data);
      setCalibers(data.calibers || []);
      if (onCalibersUpdate) {
        onCalibersUpdate(data.calibers || []);
      }
    } catch (error) {
      console.error('Error loading calibers:', error);
      toast.error('Failed to load calibers');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      mm: '', 
      image_url: '',
      product_id: productId || ''
    });
    setEditingCaliber(null);
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
      
      if (editingCaliber) {
        // Update existing caliber
        const response = await updateProductCaliber(productId, editingCaliber.mm, {
          image_url: formData.image_url
        });
        console.log('Caliber updated successfully:', response);
        toast.success('Caliber updated successfully');
      } else {
        // Create new caliber
        const response = await createProductCaliber(productId, formData.mm, {
          image_url: formData.image_url
        });
        console.log('Caliber created successfully:', response);
        toast.success('Caliber created successfully');
      }
      
      resetForm();
      // Add a small delay to ensure server processes the data
      setTimeout(() => {
        loadCalibers();
      }, 500);
    } catch (error) {
      console.error('Error saving caliber:', error);
      toast.error(error.response?.data?.message || 'Failed to save caliber');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (caliber) => {
    setEditingCaliber(caliber);
    setFormData({
      mm: caliber.mm,
      image_url: caliber.image_url,
      product_id: productId || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (caliber) => {
    if (!window.confirm(`Are you sure you want to delete the ${formatCaliberDisplay(caliber.mm)} caliber?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteProductCaliber(productId, caliber.mm);
      toast.success('Caliber deleted successfully');
      loadCalibers();
    } catch (error) {
      console.error('Error deleting caliber:', error);
      toast.error(error.response?.data?.message || 'Failed to delete caliber');
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">MM Calibers</h3>
            <p className="text-sm text-gray-500 mt-1">Manage frame size options with images</p>
          </div>
          <button
            onClick={() => {
              if (!productId) {
                toast.error('Please save the product first before adding calibers');
                return;
              }
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Add Caliber
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
                <strong>Product not saved:</strong> Please save the product first before you can add calibers.
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
                {editingCaliber ? 'Edit Caliber' : 'Add New Caliber'}
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
                  Caliber Size (mm)
                </label>
                <input
                  type="text"
                  value={formData.mm}
                  onChange={(e) => setFormData(prev => ({ ...prev, mm: e.target.value }))}
                  placeholder="e.g., 58"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!!editingCaliber} // Don't allow editing mm for existing calibers
                  required
                />
                {editingCaliber && (
                  <p className="text-xs text-gray-500 mt-1">Caliber size cannot be changed after creation</p>
                )}
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
                    required
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
            </div>

            {formData.image_url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                <div className="flex items-center gap-4">
                  <img
                    src={formData.image_url}
                    alt="Caliber preview"
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/64x64?text=Error';
                    }}
                  />
                  <span className="text-sm text-gray-600">
                    {formatCaliberDisplay(formData.mm)}
                  </span>
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
                {editingCaliber ? 'Update' : 'Create'} Caliber
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
            <FiImage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No calibers added yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {productId ? 'Add your first caliber to get started' : 'Save the product first to add calibers'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calibers.map((caliber) => (
              <div key={caliber.mm} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={caliber.image_url}
                      alt={`${caliber.mm}mm`}
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                      }}
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{formatCaliberDisplay(caliber.mm)}</h4>
                      <p className="text-sm text-gray-500">Frame size option</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(caliber)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit caliber"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(caliber)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete caliber"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Size: {caliber.mm}mm
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MMCaliberManager;
