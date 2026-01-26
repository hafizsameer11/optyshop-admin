/**
 * Frame Sizes Backend API Implementation
 * Provides CRUD operations for frame sizes management
 * 
 * Endpoints:
 * - GET /api/admin/frame-sizes - List all frame sizes
 * - POST /api/admin/frame-sizes - Create new frame size
 * - GET /api/admin/frame-sizes/:id - Get single frame size
 * - PUT /api/admin/frame-sizes/:id - Update frame size
 * - DELETE /api/admin/frame-sizes/:id - Delete frame size
 */

import api from '../utils/api';

/**
 * Get all frame sizes with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {number} params.product_id - Filter by product ID
 * @returns {Promise} Response with frame sizes data
 */
export const getFrameSizes = async (params = {}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'desc',
    product_id
  } = params;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder
  });

  if (product_id) {
    queryParams.append('product_id', product_id.toString());
  }

  const response = await api.get(`/admin/frame-sizes?${queryParams}`);
  return response;
};

/**
 * Get a single frame size by ID
 * @param {number} id - Frame size ID
 * @returns {Promise} Response with frame size data
 */
export const getFrameSizeById = async (id) => {
  const response = await api.get(`/admin/frame-sizes/${id}`);
  return response;
};

/**
 * Create a new frame size
 * @param {Object} frameSizeData - Frame size data
 * @param {number} frameSizeData.product_id - Product ID
 * @param {number} frameSizeData.lens_width - Lens width in mm
 * @param {number} frameSizeData.bridge_width - Bridge width in mm
 * @param {number} frameSizeData.temple_length - Temple length in mm
 * @param {number} [frameSizeData.frame_width] - Frame width in mm (optional)
 * @param {number} [frameSizeData.frame_height] - Frame height in mm (optional)
 * @param {string} frameSizeData.size_label - Size label (Small, Medium, Large, Extra Large)
 * @returns {Promise} Response with created frame size data
 */
export const createFrameSize = async (frameSizeData) => {
  const response = await api.post('/admin/frame-sizes', frameSizeData);
  return response;
};

/**
 * Update an existing frame size
 * @param {number} id - Frame size ID
 * @param {Object} frameSizeData - Updated frame size data
 * @returns {Promise} Response with updated frame size data
 */
export const updateFrameSize = async (id, frameSizeData) => {
  const response = await api.put(`/admin/frame-sizes/${id}`, frameSizeData);
  return response;
};

/**
 * Delete a frame size
 * @param {number} id - Frame size ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteFrameSize = async (id) => {
  const response = await api.delete(`/admin/frame-sizes/${id}`);
  return response;
};

/**
 * Get frame sizes by product ID
 * @param {number} productId - Product ID
 * @returns {Promise} Response with frame sizes for the product
 */
export const getFrameSizesByProduct = async (productId) => {
  const response = await api.get(`/admin/frame-sizes?product_id=${productId}`);
  return response;
};

/**
 * Bulk update frame sizes for a product
 * @param {number} productId - Product ID
 * @param {Array} frameSizes - Array of frame size data
 * @returns {Promise} Response with updated frame sizes
 */
export const bulkUpdateFrameSizes = async (productId, frameSizes) => {
  const response = await api.put(`/admin/frame-sizes/bulk`, {
    product_id: productId,
    frame_sizes: frameSizes
  });
  return response;
};

export default {
  getFrameSizes,
  getFrameSizeById,
  createFrameSize,
  updateFrameSize,
  deleteFrameSize,
  getFrameSizesByProduct,
  bulkUpdateFrameSizes
};
