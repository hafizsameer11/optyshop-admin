/**
 * Lens Colors Backend API Implementation
 * Provides CRUD operations for lens colors management
 * 
 * Endpoints:
 * - GET /api/admin/lens-colors - List all lens colors
 * - POST /api/admin/lens-colors - Create new lens color
 * - GET /api/admin/lens-colors/:id - Get single lens color
 * - PUT /api/admin/lens-colors/:id - Update lens color
 * - DELETE /api/admin/lens-colors/:id - Delete lens color
 */

import api from '../utils/api';

/**
 * Get all lens colors with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with lens colors data
 */
export const getLensColors = async (params = {}) => {
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

  const response = await api.get(`/admin/lens-colors?${queryParams}`);
  return response;
};

/**
 * Get a single lens color by ID
 * @param {number} id - Lens color ID
 * @returns {Promise} Response with lens color data
 */
export const getLensColorById = async (id) => {
  const response = await api.get(`/admin/lens-colors/${id}`);
  return response;
};

/**
 * Create a new lens color
 * @param {Object} lensColorData - Lens color data
 * @param {string} lensColorData.name - Name
 * @param {string} lensColorData.slug - Slug
 * @param {string} lensColorData.hex_code - Hex color code
 * @param {string} lensColorData.description - Description
 * @param {boolean} lensColorData.is_active - Active status
 * @returns {Promise} Response with created lens color data
 */
export const createLensColor = async (lensColorData) => {
  const response = await api.post('/admin/lens-colors', lensColorData);
  return response;
};

/**
 * Update an existing lens color
 * @param {number} id - Lens color ID
 * @param {Object} lensColorData - Updated lens color data
 * @returns {Promise} Response with updated lens color data
 */
export const updateLensColor = async (id, lensColorData) => {
  const response = await api.put(`/admin/lens-colors/${id}`, lensColorData);
  return response;
};

/**
 * Delete a lens color
 * @param {number} id - Lens color ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteLensColor = async (id) => {
  const response = await api.delete(`/admin/lens-colors/${id}`);
  return response;
};

/**
 * Get active lens colors (for frontend display)
 * @returns {Promise} Response with active lens colors
 */
export const getActiveLensColors = async () => {
  const response = await api.get('/admin/lens-colors?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Bulk update lens colors
 * @param {Array} colorsData - Array of lens color data with IDs
 * @returns {Promise} Response with updated lens colors
 */
export const bulkUpdateLensColors = async (colorsData) => {
  const response = await api.put('/admin/lens-colors/bulk', { colors: colorsData });
  return response;
};

export default {
  getLensColors,
  getLensColorById,
  createLensColor,
  updateLensColor,
  deleteLensColor,
  getActiveLensColors,
  bulkUpdateLensColors
};
