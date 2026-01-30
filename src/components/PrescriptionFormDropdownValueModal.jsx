import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import { 
  createPrescriptionFormDropdownValue, 
  updatePrescriptionFormDropdownValue,
  getPrescriptionFormDropdownValues,
  deletePrescriptionFormDropdownValue
} from '../api/prescriptionFormDropdownValues';

const PrescriptionFormDropdownValueModal = ({ value, onClose }) => {
  const [formData, setFormData] = useState({
    field_type: 'sph',
    value: '',
    label: '',
    eye_type: 'both',
    form_type: null,
    sort_order: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value && value.id) {
      // Reset form data when editing a different value
      // Normalize field names (handle both snake_case and camelCase)
      const fieldType = value.field_type || value.fieldType || 'sph';
      const val = value.value || '';
      const label = value.label || val || '';
      const eyeType = value.eye_type || value.eyeType;
      const formType = value.form_type || value.formType;
      const sortOrder = value.sort_order !== null && value.sort_order !== undefined 
        ? value.sort_order 
        : (value.sortOrder !== null && value.sortOrder !== undefined ? value.sortOrder : 0);
      const isActive = value.is_active !== undefined 
        ? value.is_active 
        : (value.isActive !== undefined ? value.isActive : true);
      
      const newFormData = {
        field_type: fieldType,
        value: val,
        label: label,
        eye_type: eyeType === null || eyeType === undefined ? 'both' : eyeType,
        form_type: formType === null || formType === undefined ? null : formType,
        sort_order: sortOrder,
        is_active: isActive,
      };
      console.log('Setting form data for edit:', { 
        originalValue: value, 
        normalizedFormData: newFormData 
      });
      setFormData(newFormData);
    } else {
      // Reset to defaults for new value
      setFormData({
        field_type: 'sph',
        value: '',
        label: '',
        eye_type: 'both',
        form_type: null,
        sort_order: 0,
        is_active: true,
      });
    }
  }, [value]);

  const handleChange = (e) => {
    const { name, value: val, type, checked } = e.target;
    let fieldValue;
    
    if (type === 'checkbox') {
      fieldValue = checked;
    } else if (type === 'number') {
      fieldValue = val === '' ? '' : parseFloat(val) || 0;
    } else if (name === 'form_type') {
      // Handle form_type: empty string becomes null
      fieldValue = val === '' ? null : val;
    } else {
      fieldValue = val === '' ? (name === 'label' ? '' : null) : val;
    }

    // When field_type changes, keep existing value (user might want to change field type of existing value)
    // Only clear if it's a completely new entry with no existing value
    if (name === 'field_type') {
      setFormData(prev => ({
        ...prev,
        [name]: fieldValue
      }));
    }
    // Auto-update label when value changes (if label is empty or matches old value)
    else if (name === 'value' && (!formData.label || formData.label === formData.value)) {
      setFormData(prev => ({ ...prev, value: fieldValue, label: fieldValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: fieldValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        eye_type: formData.eye_type === 'both' ? null : formData.eye_type,
        form_type: formData.form_type === '' ? null : formData.form_type,
      };

      let response;
      if (value) {
        response = await updatePrescriptionFormDropdownValue(value.id, submitData);
        console.log('✅ Dropdown value updated successfully:', response.data);
        toast.success('Dropdown value updated successfully');
      } else {
        // Check for multiple values (comma-separated)
        const valuesToCreate = formData.value.toString().split(',').map(v => v.trim()).filter(v => v !== '');

        if (valuesToCreate.length > 1) {
          // Bulk creation
          const createPromises = valuesToCreate.map(val => {
            return createPrescriptionFormDropdownValue({
              ...submitData,
              value: val,
              label: val, // specific label logic for bulk: use value as label to avoid confusion
            });
          });

          await Promise.all(createPromises);
          console.log(`✅ ${valuesToCreate.length} dropdown values created successfully`);
          toast.success(`${valuesToCreate.length} dropdown values created successfully`);
        } else {
          // Single creation
          response = await createPrescriptionFormDropdownValue(submitData);
          console.log('✅ Dropdown value created successfully:', response.data);
          toast.success('Dropdown value created successfully');
        }
      }
      onClose(true);
    } catch (error) {
      console.error('❌ Prescription Form Dropdown Value save error:', error);
      console.error('Error response:', error.response?.data);
      
      // Check the type of error
      const isNetworkError = !error.response;
      const isAuthError = error.response?.status === 401;
      const isServerError = error.response?.status >= 500;
      const isNotFoundError = error.response?.status === 404;
      
      // For any error, still close modal and try to refresh
      // This ensures the UI doesn't get stuck
      if (isNetworkError || isAuthError || isServerError || isNotFoundError) {
        console.log('🔄 API error occurred, but still closing modal and refreshing');
        toast.error('Backend error - Changes may not be saved');
        setTimeout(() => {
          console.log('🔄 Calling onClose(true) to refresh table');
          onClose(true);
        }, 1000);
      } else {
        // For validation errors, don't close modal
        const errorMessage = error.response?.data?.message || 'Failed to save prescription form dropdown value';
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
            {value ? 'Edit Prescription Form Dropdown Value' : 'Add Prescription Form Dropdown Value'}
          </h2>
          <button
            onClick={() => onClose(false)}
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
              <option value="pd">PD (Pupillary Distance)</option>
              <option value="sph">SPH (Sphere)</option>
              <option value="cyl">CYL (Cylinder)</option>
              <option value="axis">Axis</option>
              <option value="h">H (Height)</option>
              <option value="year_of_birth">Year of Birth</option>
              <option value="select_option">Select Option</option>
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
                  formData.field_type === 'sph' ? 'e.g., -2.00, -1.75' :
                    formData.field_type === 'cyl' ? 'e.g., -0.25, -0.50' :
                      formData.field_type === 'pd' ? 'e.g., 60, 62, 64' :
                        formData.field_type === 'h' ? 'e.g., 16, 18, 20' :
                          formData.field_type === 'year_of_birth' ? 'e.g., 1980, 1990, 2000' :
                            formData.field_type === 'select_option' ? 'e.g., premium, standard' : ''
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.field_type === 'axis' ? 'Axis values (0-180)' :
                formData.field_type === 'sph' ? 'Sphere values (e.g., -2.00 D)' :
                  formData.field_type === 'cyl' ? 'Cylinder values (e.g., -0.25 D)' :
                    formData.field_type === 'pd' ? 'Pupillary Distance values (e.g., 60, 62, 64 mm)' :
                      formData.field_type === 'h' ? 'Height values (e.g., 16, 18, 20 mm)' :
                        formData.field_type === 'year_of_birth' ? 'Year of birth values' :
                          formData.field_type === 'select_option' ? 'Select option values' : ''}
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
              Display label for the dropdown. If empty, the value will be used.
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
              Form Type
            </label>
            <select
              name="form_type"
              value={formData.form_type === null || formData.form_type === undefined ? '' : formData.form_type}
              onChange={handleChange}
              className="input-modern"
            >
              <option value="">All Forms</option>
              <option value="progressive">Progressive</option>
              <option value="near_vision">Near Vision</option>
              <option value="distance_vision">Distance Vision</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select specific form type or leave as "All Forms" for all types
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
              onClick={() => onClose(false)}
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

export default PrescriptionFormDropdownValueModal;

