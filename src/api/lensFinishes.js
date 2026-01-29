/**
 * Lens Finishes Backend API Implementation
 * Provides CRUD operations for lens finishes management
 * 
 * Endpoints:
 * - GET /api/admin/lens-finishes - List all lens finishes
 * - POST /api/admin/lens-finishes - Create new lens finish
 * - GET /api/admin/lens-finishes/:id - Get single lens finish
 * - PUT /api/admin/lens-finishes/:id - Update lens finish
 * - DELETE /api/admin/lens-finishes/:id - Delete lens finish
 */

import api from '../utils/api';

/**
 * Get all lens finishes with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with lens finishes data
 */
export const getLensFinishes = async (params = {}) => {
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

  const response = await api.get(`/admin/lens-finishes?${queryParams}`);
  return response;
};

/**
 * Get a single lens finish by ID
 * @param {number} id - Lens finish ID
 * @returns {Promise} Response with lens finish data
 */
export const getLensFinishById = async (id) => {
  const response = await api.get(`/admin/lens-finishes/${id}`);
  return response;
};

/**
 * Create a new lens finish
 * @param {Object} lensFinishData - Lens finish data
 * @param {string} lensFinishData.name - Name
 * @param {string} lensFinishData.slug - Slug
 * @param {number} lensFinishData.base_price - Base price
 * @param {string} lensFinishData.description - Description
 * @param {boolean} lensFinishData.is_active - Active status
 * @returns {Promise} Response with created lens finish data
 */
export const createLensFinish = async (lensFinishData) => {
  const response = await api.post('/admin/lens-finishes', lensFinishData);
  return response;
};

/**
 * Update an existing lens finish
 * @param {number} id - Lens finish ID
 * @param {Object} lensFinishData - Updated lens finish data
 * @returns {Promise} Response with updated lens finish data
 */
export const updateLensFinish = async (id, lensFinishData) => {
  const response = await api.put(`/admin/lens-finishes/${id}`, lensFinishData);
  return response;
};

/**
 * Delete a lens finish
 * @param {number} id - Lens finish ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteLensFinish = async (id) => {
  const response = await api.delete(`/admin/lens-finishes/${id}`);
  return response;
};

/**
 * Get active lens finishes (for frontend display)
 * @returns {Promise} Response with active lens finishes
 */
export const getActiveLensFinishes = async () => {
  const response = await api.get('/admin/lens-finishes?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Bulk update lens finishes
 * @param {Array} finishesData - Array of lens finish data with IDs
 * @returns {Promise} Response with updated lens finishes
 */
export const bulkUpdateLensFinishes = async (finishesData) => {
  const response = await api.put('/admin/lens-finishes/bulk', { finishes: finishesData });
  return response;
};

export default {
  getLensFinishes,
  getLensFinishById,
  createLensFinish,
  updateLensFinish,
  deleteLensFinish,
  getActiveLensFinishes,
  bulkUpdateLensFinishes
};
