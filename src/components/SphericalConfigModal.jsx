import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiCopy } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const SphericalConfigModal = ({ config, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    sub_category_id: '',
    display_name: '',
    price: '',
    is_active: true,
    right_qty: [],
    right_base_curve: [],
    right_diameter: [],
    right_power: [],
    left_qty: [],
    left_base_curve: [],
    left_diameter: [],
    left_power: [],
  });
  const [loading, setLoading] = useState(false);
  const [subCategories, setSubCategories] = useState([]);
  const [useBackendCopy, setUseBackendCopy] = useState(false);

  useEffect(() => {
    fetchSubCategories();
  }, []);

  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name || '',
        sub_category_id: config.sub_category_id || config.subCategoryId || '',
        display_name: config.display_name || config.displayName || '',
        price: config.price !== undefined ? config.price : '',
        is_active: config.is_active !== undefined ? config.is_active : (config.isActive !== undefined ? config.isActive : true),
        right_qty: Array.isArray(config.right_qty) ? config.right_qty.map(String) : (Array.isArray(config.rightQty) ? config.rightQty.map(String) : []),
        right_base_curve: Array.isArray(config.right_base_curve) ? config.right_base_curve.map(String) : (Array.isArray(config.rightBaseCurve) ? config.rightBaseCurve.map(String) : []),
        right_diameter: Array.isArray(config.right_diameter) ? config.right_diameter.map(String) : (Array.isArray(config.rightDiameter) ? config.rightDiameter.map(String) : []),
        right_power: Array.isArray(config.right_power) ? config.right_power.map(String) : (Array.isArray(config.rightPower) ? config.rightPower.map(String) : []),
        left_qty: Array.isArray(config.left_qty) ? config.left_qty.map(String) : (Array.isArray(config.leftQty) ? config.leftQty.map(String) : []),
        left_base_curve: Array.isArray(config.left_base_curve) ? config.left_base_curve.map(String) : (Array.isArray(config.leftBaseCurve) ? config.leftBaseCurve.map(String) : []),
        left_diameter: Array.isArray(config.left_diameter) ? config.left_diameter.map(String) : (Array.isArray(config.leftDiameter) ? config.leftDiameter.map(String) : []),
        left_power: Array.isArray(config.left_power) ? config.left_power.map(String) : (Array.isArray(config.leftPower) ? config.leftPower.map(String) : []),
      });
      setUseBackendCopy(false); // Reset when editing existing config
    } else {
      setUseBackendCopy(false); // Reset when creating new config
    }
  }, [config]);

  const fetchSubCategories = async () => {
    try {
      const response = await api.get(`${API_ROUTES.ADMIN.SUBCATEGORIES.LIST}?page=1&limit=1000`);
      let subCategoriesData = [];

      if (response.data) {
        if (response.data.data) {
          const dataObj = response.data.data;
          if (Array.isArray(dataObj)) {
            subCategoriesData = dataObj;
          } else if (dataObj.subcategories && Array.isArray(dataObj.subcategories)) {
            subCategoriesData = dataObj.subcategories;
          }
        } else if (Array.isArray(response.data)) {
          subCategoriesData = response.data;
        }
      }

      setSubCategories(subCategoriesData);
    } catch (error) {
      console.error('SubCategories fetch error:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Keep price as number, but others can be strings if needed (though top level fields are mostly text/number)
    const fieldValue = type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
    setFormData({ ...formData, [name]: fieldValue });
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    // Treat as string to preserve formatting (e.g. "8.60")
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field) => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayItem = (field, index) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  const copyRightToLeft = () => {
    // Copy on frontend for immediate visual feedback
    setFormData({
      ...formData,
      left_qty: [...formData.right_qty],
      left_base_curve: [...formData.right_base_curve],
      left_diameter: [...formData.right_diameter],
      left_power: [...formData.right_power],
    });
    // Enable backend copy flag for API submission
    setUseBackendCopy(true);
    toast.success('Right Eye values copied to Left Eye');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        right_qty: formData.right_qty.filter(v => v !== ''),
        right_base_curve: formData.right_base_curve.filter(v => v !== ''),
        right_diameter: formData.right_diameter.filter(v => v !== ''),
        right_power: formData.right_power.filter(v => v !== ''),
        left_qty: formData.left_qty.filter(v => v !== ''),
        left_base_curve: formData.left_base_curve.filter(v => v !== ''),
        left_diameter: formData.left_diameter.filter(v => v !== ''),
        left_power: formData.left_power.filter(v => v !== ''),
      };

      // Add backend copy flag if user clicked copy button
      if (useBackendCopy) {
        submitData.copy_right_to_left = true;
      }

      let response;
      if (config) {
        response = await api.put(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.SPHERICAL.UPDATE(config.id), submitData);
        if (response.data?.success) {
          toast.success(response.data.message || 'Spherical configuration updated successfully');
        } else {
          toast.success('Spherical configuration updated successfully');
        }
      } else {
        response = await api.post(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.SPHERICAL.CREATE, submitData);
        if (response.data?.success) {
          toast.success(response.data.message || 'Spherical configuration created successfully');
        } else {
          toast.success('Spherical configuration created successfully');
        }
      }
      setUseBackendCopy(false); // Reset flag after submission
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save configuration');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save configuration';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderArrayField = (field, label, placeholder = "Enter value") => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
        <button
          type="button"
          onClick={() => addArrayItem(field)}
          className="text-primary-600 hover:text-primary-800 text-sm flex items-center gap-1"
        >
          <FiPlus className="w-4 h-4" />
          Add Value
        </button>
      </div>
      <div className="space-y-2">
        {formData[field].map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => handleArrayChange(field, index, e.target.value)}
              className="flex-1 input-modern"
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => removeArrayItem(field, index)}
              className="p-2 text-red-600 hover:text-red-900"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {formData[field].length === 0 && (
          <p className="text-sm text-gray-500">No values added. Click "Add Value" to add one.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200/50 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10 flex-shrink-0">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {config ? 'Edit Spherical Configuration' : 'Add Spherical Configuration'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-all duration-200"
            aria-label="Close"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-modern"
                required
                placeholder="e.g., Daily Spherical Config"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                className="input-modern"
                placeholder="e.g., Daily Spherical"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sub Category ID <span className="text-red-500">*</span>
              </label>
              <select
                name="sub_category_id"
                value={formData.sub_category_id}
                onChange={handleChange}
                className="input-modern"
                required
              >
                <option value="">Select Sub Category</option>
                {subCategories.map((subCat) => (
                  <option key={subCat.id} value={subCat.id}>
                    {subCat.name} (ID: {subCat.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="input-modern"
                placeholder="e.g., 29.99"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label className="ml-2 block text-sm font-semibold text-gray-700">
              Active
            </label>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Right Eye Parameters</h3>
              <button
                type="button"
                onClick={copyRightToLeft}
                className="px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg hover:from-primary-600 hover:to-purple-700 transition-all duration-200 text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <FiCopy className="w-4 h-4" />
                Copy Right Eye to Left Eye
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderArrayField('right_qty', 'Right Qty', 'e.g. 1')}
              {renderArrayField('right_base_curve', 'Right Base Curve (B.C)', 'e.g. 8.60')}
              {renderArrayField('right_diameter', 'Right Diameter (DIA)', 'e.g. 14.0')}
              {renderArrayField('right_power', 'Right Power (PWR)', 'e.g. -2.00')}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Left Eye Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderArrayField('left_qty', 'Left Qty', 'e.g. 1')}
              {renderArrayField('left_base_curve', 'Left Base Curve (B.C)', 'e.g. 8.60')}
              {renderArrayField('left_diameter', 'Left Diameter (DIA)', 'e.g. 14.0')}
              {renderArrayField('left_power', 'Left Power (PWR)', 'e.g. -2.00')}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
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
              {loading ? 'Saving...' : config ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SphericalConfigModal;
