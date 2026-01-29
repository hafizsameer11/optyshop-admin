/**
 * Photochromic Lenses Backend API Implementation
 * Provides CRUD operations for photochromic lenses management
 * 
 * Endpoints:
 * - GET /api/admin/photochromic-lenses - List all photochromic lenses
 * - POST /api/admin/photochromic-lenses - Create new photochromic lens
 * - GET /api/admin/photochromic-lenses/:id - Get single photochromic lens
 * - PUT /api/admin/photochromic-lenses/:id - Update photochromic lens
 * - DELETE /api/admin/photochromic-lenses/:id - Delete photochromic lens
 */

import api from '../utils/api';

/**
 * Get all photochromic lenses with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with photochromic lenses data
 */
export const getPhotochromicLenses = async (params = {}) => {
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

  const response = await api.get(`/admin/photochromic-lenses?${queryParams}`);
  return response;
};

/**
 * Get a single photochromic lens by ID
 * @param {number} id - Photochromic lens ID
 * @returns {Promise} Response with photochromic lens data
 */
export const getPhotochromicLensById = async (id) => {
  const response = await api.get(`/admin/photochromic-lenses/${id}`);
  return response;
};

/**
 * Create a new photochromic lens
 * @param {Object} photochromicLensData - Photochromic lens data
 * @param {string} photochromicLensData.name - Name
 * @param {string} photochromicLensData.slug - Slug
 * @param {number} photochromicLensData.base_price - Base price
 * @param {string} photochromicLensData.description - Description
 * @param {boolean} photochromicLensData.is_active - Active status
 * @returns {Promise} Response with created photochromic lens data
 */
export const createPhotochromicLens = async (photochromicLensData) => {
  const response = await api.post('/admin/photochromic-lenses', photochromicLensData);
  return response;
};

/**
 * Update an existing photochromic lens
 * @param {number} id - Photochromic lens ID
 * @param {Object} photochromicLensData - Updated photochromic lens data
 * @returns {Promise} Response with updated photochromic lens data
 */
export const updatePhotochromicLens = async (id, photochromicLensData) => {
  const response = await api.put(`/admin/photochromic-lenses/${id}`, photochromicLensData);
  return response;
};

/**
 * Delete a photochromic lens
 * @param {number} id - Photochromic lens ID
 * @returns {Promise} Response confirming deletion
 */
export const deletePhotochromicLens = async (id) => {
  const response = await api.delete(`/admin/photochromic-lenses/${id}`);
  return response;
};

/**
 * Get active photochromic lenses (for frontend display)
 * @returns {Promise} Response with active photochromic lenses
 */
export const getActivePhotochromicLenses = async () => {
  const response = await api.get('/admin/photochromic-lenses?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Bulk update photochromic lenses
 * @param {Array} lensesData - Array of photochromic lens data with IDs
 * @returns {Promise} Response with updated photochromic lenses
 */
export const bulkUpdatePhotochromicLenses = async (lensesData) => {
  const response = await api.put('/admin/photochromic-lenses/bulk', { lenses: lensesData });
  return response;
};

export default {
  getPhotochromicLenses,
  getPhotochromicLensById,
  createPhotochromicLens,
  updatePhotochromicLens,
  deletePhotochromicLens,
  getActivePhotochromicLenses,
  bulkUpdatePhotochromicLenses
};
