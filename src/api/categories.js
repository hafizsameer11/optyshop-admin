/**
 * Categories Backend API Implementation
 * Provides CRUD operations for categories management
 * 
 * Endpoints:
 * - GET /api/admin/categories - List all categories
 * - POST /api/admin/categories - Create new category
 * - GET /api/admin/categories/:id - Get single category
 * - PUT /api/admin/categories/:id - Update category
 * - DELETE /api/admin/categories/:id - Delete category
 */

import api from '../utils/api';

/**
 * Get all categories with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with categories data
 */
export const getCategories = async (params = {}) => {
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

  const response = await api.get(`/admin/categories?${queryParams}`);
  return response;
};

/**
 * Get a single category by ID
 * @param {number} id - Category ID
 * @returns {Promise} Response with category data
 */
export const getCategoryById = async (id) => {
  const response = await api.get(`/admin/categories/${id}`);
  return response;
};

/**
 * Create a new category
 * @param {Object} categoryData - Category data
 * @param {string} categoryData.name - Name
 * @param {string} categoryData.slug - Slug
 * @param {string} categoryData.description - Description
 * @param {string} categoryData.image - Image URL
 * @param {boolean} categoryData.is_active - Active status
 * @param {number} categoryData.sort_order - Sort order
 * @returns {Promise} Response with created category data
 */
export const createCategory = async (categoryData) => {
  const response = await api.post('/admin/categories', categoryData);
  return response;
};

/**
 * Update an existing category
 * @param {number} id - Category ID
 * @param {Object} categoryData - Updated category data
 * @returns {Promise} Response with updated category data
 */
export const updateCategory = async (id, categoryData) => {
  const response = await api.put(`/admin/categories/${id}`, categoryData);
  return response;
};

/**
 * Delete a category
 * @param {number} id - Category ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteCategory = async (id) => {
  const response = await api.delete(`/admin/categories/${id}`);
  return response;
};

/**
 * Get active categories (for frontend display)
 * @returns {Promise} Response with active categories
 */
export const getActiveCategories = async () => {
  const response = await api.get('/admin/categories?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Get categories by section
 * @param {string} section - Section name (sunglasses, eyeglasses, etc.)
 * @returns {Promise} Response with categories for the specified section
 */
export const getCategoriesBySection = async (section) => {
  const response = await api.get(`/admin/categories?section=${section}&is_active=true&sortBy=sort_order&sortOrder=asc`);
  return response;
};

/**
 * Bulk update categories
 * @param {Array} categoriesData - Array of category data with IDs
 * @returns {Promise} Response with updated categories
 */
export const bulkUpdateCategories = async (categoriesData) => {
  const response = await api.put('/admin/categories/bulk', { categories: categoriesData });
  return response;
};

/**
 * Update category sort orders
 * @param {Array} sortOrders - Array of { id, sort_order } objects
 * @returns {Promise} Response with updated categories
 */
export const updateCategorySortOrders = async (sortOrders) => {
  const response = await api.put('/admin/categories/sort-orders', { sortOrders });
  return response;
};

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getActiveCategories,
  getCategoriesBySection,
  bulkUpdateCategories,
  updateCategorySortOrders
};
