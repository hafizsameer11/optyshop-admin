/**
 * Brands Backend API Implementation
 * Provides CRUD operations for brands management
 * 
 * Endpoints:
 * - GET /api/admin/brands - List all brands
 * - POST /api/admin/brands - Create new brand
 * - GET /api/admin/brands/:id - Get single brand
 * - PUT /api/admin/brands/:id - Update brand
 * - DELETE /api/admin/brands/:id - Delete brand
 */

import api from '../utils/api';

/**
 * Get all brands with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {boolean} params.is_active - Filter by active status
 * @param {string} params.search - Search term for name/description
 * @returns {Promise} Response with brands data
 */
export const getBrands = async (params = {}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'desc',
    is_active,
    search
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
  if (search && search.trim()) {
    queryParams.append('search', search.trim());
  }

  const response = await api.get(`/admin/brands?${queryParams}`);
  return response;
};

/**
 * Get a single brand by ID
 * @param {number} id - Brand ID
 * @returns {Promise} Response with brand data
 */
export const getBrandById = async (id) => {
  const response = await api.get(`/admin/brands/${id}`);
  return response;
};

/**
 * Create a new brand
 * @param {Object} brandData - Brand data
 * @param {string} brandData.name - Name
 * @param {string} brandData.slug - Slug
 * @param {string} brandData.description - Description
 * @param {string} brandData.logo - Logo URL
 * @param {string} brandData.website - Website URL
 * @param {boolean} brandData.is_active - Active status
 * @param {number} brandData.sort_order - Sort order
 * @returns {Promise} Response with created brand data
 */
export const createBrand = async (brandData) => {
  const response = await api.post('/admin/brands', brandData);
  return response;
};

/**
 * Update an existing brand
 * @param {number} id - Brand ID
 * @param {Object} brandData - Updated brand data
 * @returns {Promise} Response with updated brand data
 */
export const updateBrand = async (id, brandData) => {
  const response = await api.put(`/admin/brands/${id}`, brandData);
  return response;
};

/**
 * Delete a brand
 * @param {number} id - Brand ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteBrand = async (id) => {
  const response = await api.delete(`/admin/brands/${id}`);
  return response;
};

/**
 * Get active brands (for frontend display)
 * @returns {Promise} Response with active brands
 */
export const getActiveBrands = async () => {
  const response = await api.get('/admin/brands?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Get brands by category
 * @param {number} categoryId - Category ID
 * @returns {Promise} Response with brands for the specified category
 */
export const getBrandsByCategory = async (categoryId) => {
  const response = await api.get(`/admin/brands?category_id=${categoryId}&is_active=true&sortBy=name&sortOrder=asc`);
  return response;
};

/**
 * Bulk update brands
 * @param {Array} brandsData - Array of brand data with IDs
 * @returns {Promise} Response with updated brands
 */
export const bulkUpdateBrands = async (brandsData) => {
  const response = await api.put('/admin/brands/bulk', { brands: brandsData });
  return response;
};

/**
 * Update brand sort orders
 * @param {Array} sortOrders - Array of { id, sort_order } objects
 * @returns {Promise} Response with updated brands
 */
export const updateBrandSortOrders = async (sortOrders) => {
  const response = await api.put('/admin/brands/sort-orders', { sortOrders });
  return response;
};

/**
 * Upload brand logo
 * @param {number} id - Brand ID
 * @param {FormData} formData - FormData with logo file
 * @returns {Promise} Response with uploaded logo URL
 */
export const uploadBrandLogo = async (id, formData) => {
  const response = await api.post(`/admin/brands/${id}/logo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

export default {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  getActiveBrands,
  getBrandsByCategory,
  bulkUpdateBrands,
  updateBrandSortOrders,
  uploadBrandLogo
};
