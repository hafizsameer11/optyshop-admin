/**
 * Lens Coatings Backend API Implementation
 * Provides CRUD operations for lens coatings management
 * 
 * Endpoints:
 * - GET /api/admin/lens-coatings - List all lens coatings
 * - POST /api/admin/lens-coatings - Create new lens coating
 * - GET /api/admin/lens-coatings/:id - Get single lens coating
 * - PUT /api/admin/lens-coatings/:id - Update lens coating
 * - DELETE /api/admin/lens-coatings/:id - Delete lens coating
 */

import api from '../utils/api';

/**
 * Get all lens coatings with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with lens coatings data
 */
export const getLensCoatings = async (params = {}) => {
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

  const response = await api.get(`/admin/lens-coatings?${queryParams}`);
  return response;
};

/**
 * Get a single lens coating by ID
 * @param {number} id - Lens coating ID
 * @returns {Promise} Response with lens coating data
 */
export const getLensCoatingById = async (id) => {
  const response = await api.get(`/admin/lens-coatings/${id}`);
  return response;
};

/**
 * Create a new lens coating
 * @param {Object} lensCoatingData - Lens coating data
 * @param {string} lensCoatingData.name - Name
 * @param {string} lensCoatingData.slug - Slug
 * @param {number} lensCoatingData.base_price - Base price
 * @param {string} lensCoatingData.description - Description
 * @param {boolean} lensCoatingData.is_active - Active status
 * @returns {Promise} Response with created lens coating data
 */
export const createLensCoating = async (lensCoatingData) => {
  const response = await api.post('/admin/lens-coatings', lensCoatingData);
  return response;
};

/**
 * Update an existing lens coating
 * @param {number} id - Lens coating ID
 * @param {Object} lensCoatingData - Updated lens coating data
 * @returns {Promise} Response with updated lens coating data
 */
export const updateLensCoating = async (id, lensCoatingData) => {
  const response = await api.put(`/admin/lens-coatings/${id}`, lensCoatingData);
  return response;
};

/**
 * Delete a lens coating
 * @param {number} id - Lens coating ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteLensCoating = async (id) => {
  const response = await api.delete(`/admin/lens-coatings/${id}`);
  return response;
};

/**
 * Get active lens coatings (for frontend display)
 * @returns {Promise} Response with active lens coatings
 */
export const getActiveLensCoatings = async () => {
  const response = await api.get('/admin/lens-coatings?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Bulk update lens coatings
 * @param {Array} coatingsData - Array of lens coating data with IDs
 * @returns {Promise} Response with updated lens coatings
 */
export const bulkUpdateLensCoatings = async (coatingsData) => {
  const response = await api.put('/admin/lens-coatings/bulk', { coatings: coatingsData });
  return response;
};

export default {
  getLensCoatings,
  getLensCoatingById,
  createLensCoating,
  updateLensCoating,
  deleteLensCoating,
  getActiveLensCoatings,
  bulkUpdateLensCoatings
};
