import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const AstigmatismDropdownValueModal = ({ value, onClose }) => {
  const [formData, setFormData] = useState({
    field_type: 'qty',
    value: '',
    label: '',
    eye_type: 'both',
    sort_order: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value) {
      setFormData({
        field_type: value.field_type || value.fieldType || 'qty',
        value: value.value || '',
        label: value.label || value.value || '',
        eye_type: value.eye_type || value.eyeType || 'both',
        sort_order: value.sort_order !== null && value.sort_order !== undefined ? value.sort_order : (value.sortOrder !== null && value.sortOrder !== undefined ? value.sortOrder : 0),
        is_active: value.is_active !== undefined ? value.is_active : (value.isActive !== undefined ? value.isActive : true),
      });
    } else {
      setFormData({
        field_type: 'qty',
        value: '',
        label: '',
        eye_type: 'both',
        sort_order: 0,
        is_active: true,
      });
    }
  }, [value]);

  const handleChange = (e) => {
    const { name, value: val, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : type === 'number' ? (val === '' ? '' : parseFloat(val) || 0) : val;

    // Auto-update label when value changes (if label is empty or matches old value)
    if (name === 'value' && (!formData.label || formData.label === formData.value)) {
      setFormData({ ...formData, value: fieldValue, label: fieldValue });
    } else {
      setFormData({ ...formData, [name]: fieldValue });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        eye_type: formData.eye_type === 'both' ? null : formData.eye_type,
      };

      let response;
      if (value) {
        response = await api.put(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.ASTIGMATISM.DROPDOWN_VALUES.UPDATE(value.id), submitData);
        if (response.data?.success) {
          toast.success(response.data.message || 'Dropdown value updated successfully');
        } else {
          toast.success('Dropdown value updated successfully');
        }
      } else {
        // Check for multiple values (comma-separated)
        const valuesToCreate = formData.value.toString().split(',').map(v => v.trim()).filter(v => v !== '');

        if (valuesToCreate.length > 1) {
          // Bulk creation
          const createPromises = valuesToCreate.map(val => {
            return api.post(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.ASTIGMATISM.DROPDOWN_VALUES.CREATE, {
              ...submitData,
              value: val,
              label: val, // specific label logic for bulk: use value as label to avoid confusion
            });
          });

          await Promise.all(createPromises);
          toast.success(`${valuesToCreate.length} dropdown values created successfully`);
        } else {
          // Single creation
          response = await api.post(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.ASTIGMATISM.DROPDOWN_VALUES.CREATE, submitData);
          if (response.data?.success) {
            toast.success(response.data.message || 'Dropdown value created successfully');
          } else {
            toast.success('Dropdown value created successfully');
          }
        }
      }
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save value');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save value';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200/50 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10 flex-shrink-0">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {value ? 'Edit Contact Lens Dropdown Value' : 'Add Contact Lens Dropdown Value'}
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Field Type <span className="text-red-500">*</span>
            </label>
            <select
              name="field_type"
              value={formData.field_type}
              onChange={handleChange}
              className="input-modern"
              required
            >
              <option value="qty">Qty</option>
              <option value="base_curve">Base Curve (B.C)</option>
              <option value="diameter">Diameter (DIA)</option>
              <option value="power">Power (PWR)</option>
              <option value="cylinder">Cylinder (CYL)</option>
              <option value="axis">Axis (AX)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Value <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="value"
              value={formData.value}
              onChange={handleChange}
              className="input-modern"
              required
              placeholder={
                formData.field_type === 'axis' ? 'e.g., 0, 90, 180' :
                  formData.field_type === 'power' ? 'e.g., -2.00, -1.75' :
                    formData.field_type === 'cylinder' ? 'e.g., -0.25, -0.50' :
                      formData.field_type === 'qty' ? 'e.g., 1, 2, 3, 6, 12' :
                        formData.field_type === 'base_curve' ? 'e.g., 8.6, 8.7, 8.8' :
                          formData.field_type === 'diameter' ? 'e.g., 14.0, 14.2, 14.5' : ''
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.field_type === 'axis' ? 'Axis values (0-180)' :
                formData.field_type === 'power' ? 'Power values (e.g., -2.00 D)' :
                  formData.field_type === 'cylinder' ? 'Cylinder values (e.g., -0.25 D)' :
                    formData.field_type === 'qty' ? 'Quantity values (e.g., 1, 2, 3, 6, 12)' :
                      formData.field_type === 'base_curve' ? 'Base curve values (e.g., 8.6, 8.7, 8.8)' :
                        formData.field_type === 'diameter' ? 'Diameter values (e.g., 14.0, 14.2, 14.5)' : ''}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Label
            </label>
            <input
              type="text"
              name="label"
              value={formData.label}
              onChange={handleChange}
              className="input-modern"
              placeholder="Display label (optional, defaults to value)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Display label for the dropdown. If empty, the value will be used. Used by both Spherical and Astigmatism forms.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Eye Type <span className="text-red-500">*</span>
            </label>
            <select
              name="eye_type"
              value={formData.eye_type}
              onChange={handleChange}
              className="input-modern"
              required
            >
              <option value="both">Both Eyes</option>
              <option value="left">Left Eye</option>
              <option value="right">Right Eye</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select which eye(s) this value applies to
            </p>
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
              className="input-modern"
              min="0"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-500">
              Lower numbers appear first in the dropdown
            </p>
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
              {loading ? 'Saving...' : value ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AstigmatismDropdownValueModal;

