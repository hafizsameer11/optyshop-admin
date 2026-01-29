/**
 * Prescription Sun Lenses Backend API Implementation
 * Provides CRUD operations for prescription sun lenses management
 * 
 * Endpoints:
 * - GET /api/admin/prescription-sun-lenses - List all prescription sun lenses
 * - POST /api/admin/prescription-sun-lenses - Create new prescription sun lens
 * - GET /api/admin/prescription-sun-lenses/:id - Get single prescription sun lens
 * - PUT /api/admin/prescription-sun-lenses/:id - Update prescription sun lens
 * - DELETE /api/admin/prescription-sun-lenses/:id - Delete prescription sun lens
 */

import api from '../utils/api';

/**
 * Get all prescription sun lenses with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {string} params.type - Filter by lens type
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with prescription sun lenses data
 */
export const getPrescriptionSunLenses = async (params = {}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'desc',
    type,
    is_active
  } = params;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder
  });

  if (type) queryParams.append('type', type);
  if (is_active !== undefined) {
    queryParams.append('is_active', is_active.toString());
  }

  const response = await api.get(`/admin/prescription-sun-lenses?${queryParams}`);
  return response;
};

/**
 * Get a single prescription sun lens by ID
 * @param {number} id - Prescription sun lens ID
 * @returns {Promise} Response with prescription sun lens data
 */
export const getPrescriptionSunLensById = async (id) => {
  const response = await api.get(`/admin/prescription-sun-lenses/${id}`);
  return response;
};

/**
 * Create a new prescription sun lens
 * @param {Object} lensData - Prescription sun lens data
 * @param {string} lensData.name - Name
 * @param {string} lensData.slug - Slug
 * @param {string} lensData.type - Lens type
 * @param {number} lensData.base_price - Base price
 * @param {string} lensData.description - Description
 * @param {boolean} lensData.is_active - Active status
 * @returns {Promise} Response with created prescription sun lens data
 */
export const createPrescriptionSunLens = async (lensData) => {
  const response = await api.post('/admin/prescription-sun-lenses', lensData);
  return response;
};

/**
 * Update an existing prescription sun lens
 * @param {number} id - Prescription sun lens ID
 * @param {Object} lensData - Updated prescription sun lens data
 * @returns {Promise} Response with updated prescription sun lens data
 */
export const updatePrescriptionSunLens = async (id, lensData) => {
  const response = await api.put(`/admin/prescription-sun-lenses/${id}`, lensData);
  return response;
};

/**
 * Delete a prescription sun lens
 * @param {number} id - Prescription sun lens ID
 * @returns {Promise} Response confirming deletion
 */
export const deletePrescriptionSunLens = async (id) => {
  const response = await api.delete(`/admin/prescription-sun-lenses/${id}`);
  return response;
};

/**
 * Get active prescription sun lenses (for frontend display)
 * @returns {Promise} Response with active prescription sun lenses
 */
export const getActivePrescriptionSunLenses = async () => {
  const response = await api.get('/admin/prescription-sun-lenses?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Get prescription sun lenses by type
 * @param {string} type - Lens type
 * @returns {Promise} Response with prescription sun lenses of the specified type
 */
export const getPrescriptionSunLensesByType = async (type) => {
  const response = await api.get(`/admin/prescription-sun-lenses?type=${type}&is_active=true&sortBy=name&sortOrder=asc`);
  return response;
};

/**
 * Bulk update prescription sun lenses
 * @param {Array} lensesData - Array of prescription sun lens data with IDs
 * @returns {Promise} Response with updated prescription sun lenses
 */
export const bulkUpdatePrescriptionSunLenses = async (lensesData) => {
  const response = await api.put('/admin/prescription-sun-lenses/bulk', { lenses: lensesData });
  return response;
};

export default {
  getPrescriptionSunLenses,
  getPrescriptionSunLensById,
  createPrescriptionSunLens,
  updatePrescriptionSunLens,
  deletePrescriptionSunLens,
  getActivePrescriptionSunLenses,
  getPrescriptionSunLensesByType,
  bulkUpdatePrescriptionSunLenses
};
