/**
 * Lens Types Backend API Implementation
 * Provides CRUD operations for lens types management
 * 
 * Endpoints:
 * - GET /api/admin/lens-types - List all lens types
 * - POST /api/admin/lens-types - Create new lens type
 * - GET /api/admin/lens-types/:id - Get single lens type
 * - PUT /api/admin/lens-types/:id - Update lens type
 * - DELETE /api/admin/lens-types/:id - Delete lens type
 */

import api from '../utils/api';

/**
 * Get all lens types with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with lens types data
 */
export const getLensTypes = async (params = {}) => {
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

  const response = await api.get(`/admin/lens-types?${queryParams}`);
  return response;
};

/**
 * Get a single lens type by ID
 * @param {number} id - Lens type ID
 * @returns {Promise} Response with lens type data
 */
export const getLensTypeById = async (id) => {
  const response = await api.get(`/admin/lens-types/${id}`);
  return response;
};

/**
 * Create a new lens type
 * @param {Object} lensTypeData - Lens type data
 * @param {string} lensTypeData.name - Name
 * @param {string} lensTypeData.slug - Slug
 * @param {number} lensTypeData.index - Index value
 * @param {number} lensTypeData.thickness_factor - Thickness factor
 * @param {number} lensTypeData.price_adjustment - Price adjustment
 * @param {string} lensTypeData.description - Description
 * @param {boolean} lensTypeData.is_active - Active status
 * @returns {Promise} Response with created lens type data
 */
export const createLensType = async (lensTypeData) => {
  const response = await api.post('/admin/lens-types', lensTypeData);
  return response;
};

/**
 * Update an existing lens type
 * @param {number} id - Lens type ID
 * @param {Object} lensTypeData - Updated lens type data
 * @returns {Promise} Response with updated lens type data
 */
export const updateLensType = async (id, lensTypeData) => {
  const response = await api.put(`/admin/lens-types/${id}`, lensTypeData);
  return response;
};

/**
 * Delete a lens type
 * @param {number} id - Lens type ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteLensType = async (id) => {
  const response = await api.delete(`/admin/lens-types/${id}`);
  return response;
};

/**
 * Get active lens types (for frontend display)
 * @returns {Promise} Response with active lens types
 */
export const getActiveLensTypes = async () => {
  const response = await api.get('/admin/lens-types?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Bulk update lens types
 * @param {Array} lensTypesData - Array of lens type data with IDs
 * @returns {Promise} Response with updated lens types
 */
export const bulkUpdateLensTypes = async (lensTypesData) => {
  const response = await api.put('/admin/lens-types/bulk', { lens_types: lensTypesData });
  return response;
};

export default {
  getLensTypes,
  getLensTypeById,
  createLensType,
  updateLensType,
  deleteLensType,
  getActiveLensTypes,
  bulkUpdateLensTypes
};
