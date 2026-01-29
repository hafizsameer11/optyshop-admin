/**
 * Lens Options Backend API Implementation
 * Provides CRUD operations for lens options management
 * 
 * Endpoints:
 * - GET /api/admin/lens-options - List all lens options
 * - POST /api/admin/lens-options - Create new lens option
 * - GET /api/admin/lens-options/:id - Get single lens option
 * - PUT /api/admin/lens-options/:id - Update lens option
 * - DELETE /api/admin/lens-options/:id - Delete lens option
 */

import api from '../utils/api';

/**
 * Get all lens options with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {string} params.type - Filter by option type
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with lens options data
 */
export const getLensOptions = async (params = {}) => {
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

  const response = await api.get(`/admin/lens-options?${queryParams}`);
  return response;
};

/**
 * Get a single lens option by ID
 * @param {number} id - Lens option ID
 * @returns {Promise} Response with lens option data
 */
export const getLensOptionById = async (id) => {
  const response = await api.get(`/admin/lens-options/${id}`);
  return response;
};

/**
 * Create a new lens option
 * @param {Object} lensOptionData - Lens option data
 * @param {string} lensOptionData.name - Name
 * @param {string} lensOptionData.slug - Slug
 * @param {string} lensOptionData.type - Option type
 * @param {number} lensOptionData.base_price - Base price
 * @param {string} lensOptionData.description - Description
 * @param {boolean} lensOptionData.is_active - Active status
 * @returns {Promise} Response with created lens option data
 */
export const createLensOption = async (lensOptionData) => {
  const response = await api.post('/admin/lens-options', lensOptionData);
  return response;
};

/**
 * Update an existing lens option
 * @param {number} id - Lens option ID
 * @param {Object} lensOptionData - Updated lens option data
 * @returns {Promise} Response with updated lens option data
 */
export const updateLensOption = async (id, lensOptionData) => {
  const response = await api.put(`/admin/lens-options/${id}`, lensOptionData);
  return response;
};

/**
 * Delete a lens option
 * @param {number} id - Lens option ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteLensOption = async (id) => {
  const response = await api.delete(`/admin/lens-options/${id}`);
  return response;
};

/**
 * Get active lens options (for frontend display)
 * @returns {Promise} Response with active lens options
 */
export const getActiveLensOptions = async () => {
  const response = await api.get('/admin/lens-options?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Get lens options by type
 * @param {string} type - Option type
 * @returns {Promise} Response with lens options of the specified type
 */
export const getLensOptionsByType = async (type) => {
  const response = await api.get(`/admin/lens-options?type=${type}&is_active=true&sortBy=name&sortOrder=asc`);
  return response;
};

/**
 * Bulk update lens options
 * @param {Array} optionsData - Array of lens option data with IDs
 * @returns {Promise} Response with updated lens options
 */
export const bulkUpdateLensOptions = async (optionsData) => {
  const response = await api.put('/admin/lens-options/bulk', { options: optionsData });
  return response;
};

export default {
  getLensOptions,
  getLensOptionById,
  createLensOption,
  updateLensOption,
  deleteLensOption,
  getActiveLensOptions,
  getLensOptionsByType,
  bulkUpdateLensOptions
};
