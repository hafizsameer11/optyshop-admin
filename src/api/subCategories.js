/**
 * SubCategories Backend API Implementation
 * Provides CRUD operations for subcategories management
 * 
 * Endpoints:
 * - GET /api/admin/subcategories - List all subcategories
 * - POST /api/admin/subcategories - Create new subcategory
 * - GET /api/admin/subcategories/:id - Get single subcategory
 * - PUT /api/admin/subcategories/:id - Update subcategory
 * - DELETE /api/admin/subcategories/:id - Delete subcategory
 */

import api from '../utils/api';

/**
 * Get all subcategories with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {number} params.category_id - Filter by category ID
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with subcategories data
 */
export const getSubCategories = async (params = {}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'desc',
    category_id,
    is_active
  } = params;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder
  });

  if (category_id) queryParams.append('category_id', category_id.toString());
  if (is_active !== undefined) {
    queryParams.append('is_active', is_active.toString());
  }

  const response = await api.get(`/admin/subcategories?${queryParams}`);
  return response;
};

/**
 * Get a single subcategory by ID
 * @param {number} id - Subcategory ID
 * @returns {Promise} Response with subcategory data
 */
export const getSubCategoryById = async (id) => {
  const response = await api.get(`/admin/subcategories/${id}`);
  return response;
};

/**
 * Create a new subcategory
 * @param {Object} subCategoryData - Subcategory data
 * @param {string} subCategoryData.name - Name
 * @param {string} subCategoryData.slug - Slug
 * @param {number} subCategoryData.category_id - Category ID
 * @param {string} subCategoryData.description - Description
 * @param {boolean} subCategoryData.is_active - Active status
 * @param {number} subCategoryData.sort_order - Sort order
 * @returns {Promise} Response with created subcategory data
 */
export const createSubCategory = async (subCategoryData) => {
  const response = await api.post('/admin/subcategories', subCategoryData);
  return response;
};

/**
 * Update an existing subcategory
 * @param {number} id - Subcategory ID
 * @param {Object} subCategoryData - Updated subcategory data
 * @returns {Promise} Response with updated subcategory data
 */
export const updateSubCategory = async (id, subCategoryData) => {
  const response = await api.put(`/admin/subcategories/${id}`, subCategoryData);
  return response;
};

/**
 * Delete a subcategory
 * @param {number} id - Subcategory ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteSubCategory = async (id) => {
  const response = await api.delete(`/admin/subcategories/${id}`);
  return response;
};

/**
 * Get active subcategories (for frontend display)
 * @returns {Promise} Response with active subcategories
 */
export const getActiveSubCategories = async () => {
  const response = await api.get('/admin/subcategories?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Get subcategories by category
 * @param {number} categoryId - Category ID
 * @returns {Promise} Response with subcategories of the specified category
 */
export const getSubCategoriesByCategory = async (categoryId) => {
  const response = await api.get(`/admin/subcategories?category_id=${categoryId}&is_active=true&sortBy=sort_order&sortOrder=asc`);
  return response;
};

/**
 * Bulk update subcategories
 * @param {Array} subCategoriesData - Array of subcategory data with IDs
 * @returns {Promise} Response with updated subcategories
 */
export const bulkUpdateSubCategories = async (subCategoriesData) => {
  const response = await api.put('/admin/subcategories/bulk', { subcategories: subCategoriesData });
  return response;
};

/**
 * Update subcategory sort orders
 * @param {Array} sortOrders - Array of { id, sort_order } objects
 * @returns {Promise} Response with updated subcategories
 */
export const updateSubCategorySortOrders = async (sortOrders) => {
  const response = await api.put('/admin/subcategories/sort-orders', { sortOrders });
  return response;
};

export default {
  getSubCategories,
  getSubCategoryById,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getActiveSubCategories,
  getSubCategoriesByCategory,
  bulkUpdateSubCategories,
  updateSubCategorySortOrders
};
