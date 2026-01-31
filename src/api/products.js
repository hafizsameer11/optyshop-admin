/**
 * Products Backend API Implementation
 * Provides CRUD operations for products management
 * 
 * Endpoints:
 * - GET /api/admin/products - List all products
 * - POST /api/admin/products - Create new product
 * - GET /api/admin/products/:id - Get single product
 * - PUT /api/admin/products/:id - Update product
 * - DELETE /api/admin/products/:id - Delete product
 */

import api from '../utils/api';

/**
 * Get all products with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {string} params.search - Search query
 * @param {string|number|Array} params.category_id - Filter by category ID(s)
 * @param {string|number|Array} params.sub_category_id - Filter by subcategory ID(s)
 * @param {string|number|Array} params.brand_id - Filter by brand ID(s)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with products data
 */
export const getProducts = async (params = {}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'desc',
    search,
    category_id,
    sub_category_id,
    brand_id,
    is_active
  } = params;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder
  });

  if (search) queryParams.append('search', search);
  if (category_id) {
    if (Array.isArray(category_id)) {
      category_id.forEach(id => queryParams.append('category_id', id.toString()));
    } else {
      queryParams.append('category_id', category_id.toString());
    }
  }
  if (sub_category_id) {
    if (Array.isArray(sub_category_id)) {
      sub_category_id.forEach(id => queryParams.append('sub_category_id', id.toString()));
    } else {
      queryParams.append('sub_category_id', sub_category_id.toString());
    }
  }
  if (brand_id) {
    if (Array.isArray(brand_id)) {
      brand_id.forEach(id => queryParams.append('brand_id', id.toString()));
    } else {
      queryParams.append('brand_id', brand_id.toString());
    }
  }
  if (is_active !== undefined) {
    queryParams.append('is_active', is_active.toString());
  }

  const response = await api.get(`/admin/products?${queryParams}`);
  return response;
};

/**
 * Get a single product by ID
 * @param {number} id - Product ID
 * @returns {Promise} Response with product data
 */
export const getProductById = async (id) => {
  const response = await api.get(`/admin/products/${id}`);
  return response;
};

/**
 * Create a new product
 * @param {Object} productData - Product data
 * @param {string} productData.name - Name
 * @param {string} productData.slug - Slug
 * @param {string} productData.description - Description
 * @param {number} productData.price - Price
 * @param {string} productData.category - Category
 * @param {string} productData.brand - Brand
 * @param {boolean} productData.is_active - Active status
 * @returns {Promise} Response with created product data
 */
export const createProduct = async (productData) => {
  const response = await api.post('/admin/products', productData);
  return response;
};

/**
 * Update an existing product
 * @param {number} id - Product ID
 * @param {Object} productData - Updated product data
 * @returns {Promise} Response with updated product data
 */
export const updateProduct = async (id, productData) => {
  const response = await api.put(`/admin/products/${id}`, productData);
  return response;
};

/**
 * Delete a product
 * @param {number} id - Product ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteProduct = async (id) => {
  const response = await api.delete(`/admin/products/${id}`);
  return response;
};

/**
 * Get active products (for frontend display)
 * @returns {Promise} Response with active products
 */
export const getActiveProducts = async () => {
  const response = await api.get('/admin/products?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Get products by category
 * @param {string} category - Product category
 * @returns {Promise} Response with products of the specified category
 */
export const getProductsByCategory = async (category) => {
  const response = await api.get(`/admin/products?category=${category}&is_active=true&sortBy=name&sortOrder=asc`);
  return response;
};

/**
 * Get products by brand
 * @param {string} brand - Product brand
 * @returns {Promise} Response with products of the specified brand
 */
export const getProductsByBrand = async (brand) => {
  const response = await api.get(`/admin/products?brand=${brand}&is_active=true&sortBy=name&sortOrder=asc`);
  return response;
};

/**
 * Bulk update products
 * @param {Array} productsData - Array of product data with IDs
 * @returns {Promise} Response with updated products
 */
export const bulkUpdateProducts = async (productsData) => {
  const response = await api.put('/admin/products/bulk', { products: productsData });
  return response;
};

/**
 * Search products
 * @param {string} query - Search query
 * @param {Object} params - Additional query parameters
 * @returns {Promise} Response with search results
 */
export const searchProducts = async (query, params = {}) => {
  const queryParams = new URLSearchParams({
    q: query,
    ...params
  });

  const response = await api.get(`/admin/products/search?${queryParams}`);
  return response;
};

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getActiveProducts,
  getProductsByCategory,
  getProductsByBrand,
  bulkUpdateProducts,
  searchProducts
};
