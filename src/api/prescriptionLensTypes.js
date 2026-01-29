/**
 * Prescription Lens Types Backend API Implementation
 * Provides CRUD operations for prescription lens types management
 * 
 * Endpoints:
 * - GET /api/admin/prescription-lens-types - List all prescription lens types
 * - POST /api/admin/prescription-lens-types - Create new prescription lens type
 * - GET /api/admin/prescription-lens-types/:id - Get single prescription lens type
 * - PUT /api/admin/prescription-lens-types/:id - Update prescription lens type
 * - DELETE /api/admin/prescription-lens-types/:id - Delete prescription lens type
 */

import api from '../utils/api';

/**
 * Get all prescription lens types with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: sort_order)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: asc)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with prescription lens types data
 */
export const getPrescriptionLensTypes = async (params = {}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = 'sort_order',
    sortOrder = 'asc',
    is_active
  } = params;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder
  });

  if (is_active !== undefined) {
    queryParams.append('is_active', is_active.toString());
  }

  const response = await api.get(`/admin/prescription-lens-types?${queryParams}`);
  return response;
};

/**
 * Get a single prescription lens type by ID
 * @param {number} id - Prescription lens type ID
 * @returns {Promise} Response with prescription lens type data
 */
export const getPrescriptionLensTypeById = async (id) => {
  const response = await api.get(`/admin/prescription-lens-types/${id}`);
  return response;
};

/**
 * Create a new prescription lens type
 * @param {Object} prescriptionLensTypeData - Prescription lens type data
 * @param {string} prescriptionLensTypeData.name - Name
 * @param {string} prescriptionLensTypeData.slug - Slug
 * @param {string} prescriptionLensTypeData.description - Description
 * @param {string} prescriptionLensTypeData.prescription_type - Prescription type
 * @param {number} prescriptionLensTypeData.base_price - Base price
 * @param {boolean} prescriptionLensTypeData.is_active - Active status
 * @param {number} prescriptionLensTypeData.sort_order - Sort order
 * @returns {Promise} Response with created prescription lens type data
 */
export const createPrescriptionLensType = async (prescriptionLensTypeData) => {
  const response = await api.post('/admin/prescription-lens-types', prescriptionLensTypeData);
  return response;
};

/**
 * Update an existing prescription lens type
 * @param {number} id - Prescription lens type ID
 * @param {Object} prescriptionLensTypeData - Updated prescription lens type data
 * @returns {Promise} Response with updated prescription lens type data
 */
export const updatePrescriptionLensType = async (id, prescriptionLensTypeData) => {
  const response = await api.put(`/admin/prescription-lens-types/${id}`, prescriptionLensTypeData);
  return response;
};

/**
 * Delete a prescription lens type
 * @param {number} id - Prescription lens type ID
 * @returns {Promise} Response confirming deletion
 */
export const deletePrescriptionLensType = async (id) => {
  const response = await api.delete(`/admin/prescription-lens-types/${id}`);
  return response;
};

/**
 * Get active prescription lens types (for frontend display)
 * @returns {Promise} Response with active prescription lens types
 */
export const getActivePrescriptionLensTypes = async () => {
  const response = await api.get('/admin/prescription-lens-types?is_active=true&sortBy=sort_order&sortOrder=asc');
  return response;
};

/**
 * Bulk update prescription lens types
 * @param {Array} prescriptionLensTypesData - Array of prescription lens type data with IDs
 * @returns {Promise} Response with updated prescription lens types
 */
export const bulkUpdatePrescriptionLensTypes = async (prescriptionLensTypesData) => {
  const response = await api.put('/admin/prescription-lens-types/bulk', { prescription_lens_types: prescriptionLensTypesData });
  return response;
};

export default {
  getPrescriptionLensTypes,
  getPrescriptionLensTypeById,
  createPrescriptionLensType,
  updatePrescriptionLensType,
  deletePrescriptionLensType,
  getActivePrescriptionLensTypes,
  bulkUpdatePrescriptionLensTypes
};
