/**
 * Lens Thickness Options Backend API Implementation
 * Provides CRUD operations for lens thickness options management
 * 
 * Endpoints:
 * - GET /api/admin/lens-thickness-options - List all thickness options
 * - POST /api/admin/lens-thickness-options - Create new thickness option
 * - GET /api/admin/lens-thickness-options/:id - Get single thickness option
 * - PUT /api/admin/lens-thickness-options/:id - Update thickness option
 * - DELETE /api/admin/lens-thickness-options/:id - Delete thickness option
 */

import api from '../utils/api';

/**
 * Get all lens thickness options with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with thickness options data
 */
export const getLensThicknessOptions = async (params = {}) => {
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

  const response = await api.get(`/admin/lens-thickness-options?${queryParams}`);
  return response;
};

/**
 * Get a single lens thickness option by ID
 * @param {number} id - Thickness option ID
 * @returns {Promise} Response with thickness option data
 */
export const getLensThicknessOptionById = async (id) => {
  const response = await api.get(`/admin/lens-thickness-options/${id}`);
  return response;
};

/**
 * Create a new lens thickness option
 * @param {Object} thicknessOptionData - Thickness option data
 * @param {string} thicknessOptionData.name - Name
 * @param {string} thicknessOptionData.slug - Slug
 * @param {string} thicknessOptionData.description - Description
 * @param {boolean} thicknessOptionData.is_active - Active status
 * @returns {Promise} Response with created thickness option data
 */
export const createLensThicknessOption = async (thicknessOptionData) => {
  const response = await api.post('/admin/lens-thickness-options', thicknessOptionData);
  return response;
};

/**
 * Update an existing lens thickness option
 * @param {number} id - Thickness option ID
 * @param {Object} thicknessOptionData - Updated thickness option data
 * @returns {Promise} Response with updated thickness option data
 */
export const updateLensThicknessOption = async (id, thicknessOptionData) => {
  const response = await api.put(`/admin/lens-thickness-options/${id}`, thicknessOptionData);
  return response;
};

/**
 * Delete a lens thickness option
 * @param {number} id - Thickness option ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteLensThicknessOption = async (id) => {
  const response = await api.delete(`/admin/lens-thickness-options/${id}`);
  return response;
};

/**
 * Get active thickness options (for frontend display)
 * @returns {Promise} Response with active thickness options
 */
export const getActiveLensThicknessOptions = async () => {
  const response = await api.get('/admin/lens-thickness-options?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Bulk update thickness options
 * @param {Array} optionsData - Array of thickness option data with IDs
 * @returns {Promise} Response with updated thickness options
 */
export const bulkUpdateLensThicknessOptions = async (optionsData) => {
  const response = await api.put('/admin/lens-thickness-options/bulk', { options: optionsData });
  return response;
};

export default {
  getLensThicknessOptions,
  getLensThicknessOptionById,
  createLensThicknessOption,
  updateLensThicknessOption,
  deleteLensThicknessOption,
  getActiveLensThicknessOptions,
  bulkUpdateLensThicknessOptions
};
