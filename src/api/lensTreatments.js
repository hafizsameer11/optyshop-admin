/**
 * Lens Treatments Backend API Implementation
 * Provides CRUD operations for lens treatments management
 * 
 * Endpoints:
 * - GET /api/admin/lens-treatments - List all lens treatments
 * - POST /api/admin/lens-treatments - Create new lens treatment
 * - GET /api/admin/lens-treatments/:id - Get single lens treatment
 * - PUT /api/admin/lens-treatments/:id - Update lens treatment
 * - DELETE /api/admin/lens-treatments/:id - Delete lens treatment
 */

import api from '../utils/api';

/**
 * Get all lens treatments with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with lens treatments data
 */
export const getLensTreatments = async (params = {}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'desc',
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

  const response = await api.get(`/admin/lens-treatments?${queryParams}`);
  return response;
};

/**
 * Get a single lens treatment by ID
 * @param {number} id - Lens treatment ID
 * @returns {Promise} Response with lens treatment data
 */
export const getLensTreatmentById = async (id) => {
  const response = await api.get(`/admin/lens-treatments/${id}`);
  return response;
};

/**
 * Create a new lens treatment
 * @param {Object} lensTreatmentData - Lens treatment data
 * @param {string} lensTreatmentData.name - Name
 * @param {string} lensTreatmentData.slug - Slug
 * @param {number} lensTreatmentData.base_price - Base price
 * @param {string} lensTreatmentData.description - Description
 * @param {boolean} lensTreatmentData.is_active - Active status
 * @returns {Promise} Response with created lens treatment data
 */
export const createLensTreatment = async (lensTreatmentData) => {
  const response = await api.post('/admin/lens-treatments', lensTreatmentData);
  return response;
};

/**
 * Update an existing lens treatment
 * @param {number} id - Lens treatment ID
 * @param {Object} lensTreatmentData - Updated lens treatment data
 * @returns {Promise} Response with updated lens treatment data
 */
export const updateLensTreatment = async (id, lensTreatmentData) => {
  const response = await api.put(`/admin/lens-treatments/${id}`, lensTreatmentData);
  return response;
};

/**
 * Delete a lens treatment
 * @param {number} id - Lens treatment ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteLensTreatment = async (id) => {
  const response = await api.delete(`/admin/lens-treatments/${id}`);
  return response;
};

/**
 * Get active lens treatments (for frontend display)
 * @returns {Promise} Response with active lens treatments
 */
export const getActiveLensTreatments = async () => {
  const response = await api.get('/admin/lens-treatments?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Bulk update lens treatments
 * @param {Array} treatmentsData - Array of lens treatment data with IDs
 * @returns {Promise} Response with updated lens treatments
 */
export const bulkUpdateLensTreatments = async (treatmentsData) => {
  const response = await api.put('/admin/lens-treatments/bulk', { treatments: treatmentsData });
  return response;
};

export default {
  getLensTreatments,
  getLensTreatmentById,
  createLensTreatment,
  updateLensTreatment,
  deleteLensTreatment,
  getActiveLensTreatments,
  bulkUpdateLensTreatments
};
