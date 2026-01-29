/**
 * Prescription Form Dropdown Values Backend API Implementation
 * Provides CRUD operations for prescription form dropdown values management
 * 
 * Endpoints:
 * - GET /api/admin/prescription-forms/dropdown-values - List all dropdown values
 * - POST /api/admin/prescription-forms/dropdown-values - Create new dropdown value
 * - GET /api/admin/prescription-forms/dropdown-values/:id - Get single dropdown value
 * - PUT /api/admin/prescription-forms/dropdown-values/:id - Update dropdown value
 * - DELETE /api/admin/prescription-forms/dropdown-values/:id - Delete dropdown value
 */

import api from '../utils/api';

/**
 * Get all prescription form dropdown values with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: sort_order)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: asc)
 * @param {string} params.field_type - Filter by field type
 * @param {string} params.eye_type - Filter by eye type
 * @param {string} params.form_type - Filter by form type
 * @returns {Promise} Response with dropdown values data
 */
export const getPrescriptionFormDropdownValues = async (params = {}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = 'sort_order',
    sortOrder = 'asc',
    field_type,
    eye_type,
    form_type
  } = params;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder
  });

  if (field_type) queryParams.append('field_type', field_type);
  if (eye_type && eye_type !== 'both') queryParams.append('eye_type', eye_type);
  if (form_type) queryParams.append('form_type', form_type);

  const response = await api.get(`/admin/prescription-forms/dropdown-values?${queryParams}`);
  return response;
};

/**
 * Get a single prescription form dropdown value by ID
 * @param {number} id - Dropdown value ID
 * @returns {Promise} Response with dropdown value data
 */
export const getPrescriptionFormDropdownValueById = async (id) => {
  const response = await api.get(`/admin/prescription-forms/dropdown-values/${id}`);
  return response;
};

/**
 * Create a new prescription form dropdown value
 * @param {Object} dropdownValueData - Dropdown value data
 * @param {string} dropdownValueData.field_type - Field type (sph, cyl, axis, etc.)
 * @param {string} dropdownValueData.value - Value
 * @param {string} dropdownValueData.label - Display label
 * @param {string} dropdownValueData.eye_type - Eye type (left, right, both)
 * @param {string} dropdownValueData.form_type - Form type (progressive, near_vision, etc.)
 * @param {number} dropdownValueData.sort_order - Sort order
 * @param {boolean} dropdownValueData.is_active - Active status
 * @returns {Promise} Response with created dropdown value data
 */
export const createPrescriptionFormDropdownValue = async (dropdownValueData) => {
  const response = await api.post('/admin/prescription-forms/dropdown-values', dropdownValueData);
  return response;
};

/**
 * Update an existing prescription form dropdown value
 * @param {number} id - Dropdown value ID
 * @param {Object} dropdownValueData - Updated dropdown value data
 * @returns {Promise} Response with updated dropdown value data
 */
export const updatePrescriptionFormDropdownValue = async (id, dropdownValueData) => {
  const response = await api.put(`/admin/prescription-forms/dropdown-values/${id}`, dropdownValueData);
  return response;
};

/**
 * Delete a prescription form dropdown value
 * @param {number} id - Dropdown value ID
 * @returns {Promise} Response confirming deletion
 */
export const deletePrescriptionFormDropdownValue = async (id) => {
  const response = await api.delete(`/admin/prescription-forms/dropdown-values/${id}`);
  return response;
};

/**
 * Get dropdown values by field type
 * @param {string} fieldType - Field type (sph, cyl, axis, etc.)
 * @returns {Promise} Response with dropdown values for the field type
 */
export const getPrescriptionFormDropdownValuesByFieldType = async (fieldType) => {
  const response = await api.get(`/admin/prescription-forms/dropdown-values?field_type=${fieldType}`);
  return response;
};

/**
 * Bulk update sort order for dropdown values
 * @param {Array} sortOrderData - Array of {id, sort_order} objects
 * @returns {Promise} Response with updated dropdown values
 */
export const bulkUpdatePrescriptionFormDropdownValuesOrder = async (sortOrderData) => {
  const response = await api.put('/admin/prescription-forms/dropdown-values/bulk-order', { values: sortOrderData });
  return response;
};

export default {
  getPrescriptionFormDropdownValues,
  getPrescriptionFormDropdownValueById,
  createPrescriptionFormDropdownValue,
  updatePrescriptionFormDropdownValue,
  deletePrescriptionFormDropdownValue,
  getPrescriptionFormDropdownValuesByFieldType,
  bulkUpdatePrescriptionFormDropdownValuesOrder
};
