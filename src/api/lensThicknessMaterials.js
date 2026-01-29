/**
 * Lens Thickness Materials Backend API Implementation
 * Provides CRUD operations for lens thickness materials management
 * 
 * Endpoints:
 * - GET /api/admin/lens-thickness-materials - List all thickness materials
 * - POST /api/admin/lens-thickness-materials - Create new thickness material
 * - GET /api/admin/lens-thickness-materials/:id - Get single thickness material
 * - PUT /api/admin/lens-thickness-materials/:id - Update thickness material
 * - DELETE /api/admin/lens-thickness-materials/:id - Delete thickness material
 */

import api from '../utils/api';

/**
 * Get all lens thickness materials with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with thickness materials data
 */
export const getLensThicknessMaterials = async (params = {}) => {
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

  const response = await api.get(`/admin/lens-thickness-materials?${queryParams}`);
  return response;
};

/**
 * Get a single lens thickness material by ID
 * @param {number} id - Thickness material ID
 * @returns {Promise} Response with thickness material data
 */
export const getLensThicknessMaterialById = async (id) => {
  const response = await api.get(`/admin/lens-thickness-materials/${id}`);
  return response;
};

/**
 * Create a new lens thickness material
 * @param {Object} thicknessMaterialData - Thickness material data
 * @param {string} thicknessMaterialData.name - Name
 * @param {string} thicknessMaterialData.slug - Slug
 * @param {string} thicknessMaterialData.description - Description
 * @param {boolean} thicknessMaterialData.is_active - Active status
 * @returns {Promise} Response with created thickness material data
 */
export const createLensThicknessMaterial = async (thicknessMaterialData) => {
  const response = await api.post('/admin/lens-thickness-materials', thicknessMaterialData);
  return response;
};

/**
 * Update an existing lens thickness material
 * @param {number} id - Thickness material ID
 * @param {Object} thicknessMaterialData - Updated thickness material data
 * @returns {Promise} Response with updated thickness material data
 */
export const updateLensThicknessMaterial = async (id, thicknessMaterialData) => {
  const response = await api.put(`/admin/lens-thickness-materials/${id}`, thicknessMaterialData);
  return response;
};

/**
 * Delete a lens thickness material
 * @param {number} id - Thickness material ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteLensThicknessMaterial = async (id) => {
  const response = await api.delete(`/admin/lens-thickness-materials/${id}`);
  return response;
};

/**
 * Get active thickness materials (for frontend display)
 * @returns {Promise} Response with active thickness materials
 */
export const getActiveLensThicknessMaterials = async () => {
  const response = await api.get('/admin/lens-thickness-materials?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Bulk update thickness materials
 * @param {Array} materialsData - Array of thickness material data with IDs
 * @returns {Promise} Response with updated thickness materials
 */
export const bulkUpdateLensThicknessMaterials = async (materialsData) => {
  const response = await api.put('/admin/lens-thickness-materials/bulk', { materials: materialsData });
  return response;
};

export default {
  getLensThicknessMaterials,
  getLensThicknessMaterialById,
  createLensThicknessMaterial,
  updateLensThicknessMaterial,
  deleteLensThicknessMaterial,
  getActiveLensThicknessMaterials,
  bulkUpdateLensThicknessMaterials
};
