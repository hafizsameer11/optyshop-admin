/**
 * Prescription Lens Variants Backend API Implementation
 * Provides CRUD operations for prescription lens variants management
 * 
 * Endpoints:
 * - GET /api/admin/prescription-lens-variants - List all prescription lens variants
 * - POST /api/admin/prescription-lens-variants - Create new prescription lens variant
 * - GET /api/admin/prescription-lens-variants/:id - Get single prescription lens variant
 * - PUT /api/admin/prescription-lens-variants/:id - Update prescription lens variant
 * - DELETE /api/admin/prescription-lens-variants/:id - Delete prescription lens variant
 */

import api from '../utils/api';

/**
 * Get all prescription lens variants with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {number} params.prescriptionLensTypeId - Filter by prescription lens type ID
 * @param {boolean} params.is_active - Filter by active status
 * @param {boolean} params.isRecommended - Filter by recommended status
 * @returns {Promise} Response with prescription lens variants data
 */
export const getPrescriptionLensVariants = async (params = {}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'desc',
    prescriptionLensTypeId,
    is_active,
    isRecommended
  } = params;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder
  });

  if (prescriptionLensTypeId) {
    queryParams.append('prescriptionLensTypeId', prescriptionLensTypeId.toString());
  }
  if (is_active !== undefined) {
    queryParams.append('is_active', is_active.toString());
  }
  if (isRecommended !== undefined) {
    queryParams.append('isRecommended', isRecommended.toString());
  }

  const response = await api.get(`/admin/prescription-lens-variants?${queryParams}`);
  return response;
};

/**
 * Get a single prescription lens variant by ID
 * @param {number} id - Prescription lens variant ID
 * @returns {Promise} Response with prescription lens variant data
 */
export const getPrescriptionLensVariantById = async (id) => {
  const response = await api.get(`/admin/prescription-lens-variants/${id}`);
  return response;
};

/**
 * Create a new prescription lens variant
 * @param {Object} variantData - Prescription lens variant data
 * @param {string} variantData.name - Name
 * @param {string} variantData.slug - Slug
 * @param {number} variantData.prescriptionLensTypeId - Prescription lens type ID
 * @param {number} variantData.base_price - Base price
 * @param {string} variantData.description - Description
 * @param {boolean} variantData.is_active - Active status
 * @param {boolean} variantData.isRecommended - Recommended status
 * @returns {Promise} Response with created prescription lens variant data
 */
export const createPrescriptionLensVariant = async (variantData) => {
  const response = await api.post('/admin/prescription-lens-variants', variantData);
  return response;
};

/**
 * Update an existing prescription lens variant
 * @param {number} id - Prescription lens variant ID
 * @param {Object} variantData - Updated prescription lens variant data
 * @returns {Promise} Response with updated prescription lens variant data
 */
export const updatePrescriptionLensVariant = async (id, variantData) => {
  const response = await api.put(`/admin/prescription-lens-variants/${id}`, variantData);
  return response;
};

/**
 * Delete a prescription lens variant
 * @param {number} id - Prescription lens variant ID
 * @returns {Promise} Response confirming deletion
 */
export const deletePrescriptionLensVariant = async (id) => {
  const response = await api.delete(`/admin/prescription-lens-variants/${id}`);
  return response;
};

/**
 * Get active prescription lens variants (for frontend display)
 * @returns {Promise} Response with active prescription lens variants
 */
export const getActivePrescriptionLensVariants = async () => {
  const response = await api.get('/admin/prescription-lens-variants?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Get recommended prescription lens variants
 * @returns {Promise} Response with recommended prescription lens variants
 */
export const getRecommendedPrescriptionLensVariants = async () => {
  const response = await api.get('/admin/prescription-lens-variants?isRecommended=true&is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Get prescription lens variants by prescription lens type
 * @param {number} prescriptionLensTypeId - Prescription lens type ID
 * @returns {Promise} Response with prescription lens variants of the specified type
 */
export const getPrescriptionLensVariantsByType = async (prescriptionLensTypeId) => {
  const response = await api.get(`/admin/prescription-lens-variants?prescriptionLensTypeId=${prescriptionLensTypeId}&is_active=true&sortBy=name&sortOrder=asc`);
  return response;
};

/**
 * Bulk update prescription lens variants
 * @param {Array} variantsData - Array of prescription lens variant data with IDs
 * @returns {Promise} Response with updated prescription lens variants
 */
export const bulkUpdatePrescriptionLensVariants = async (variantsData) => {
  const response = await api.put('/admin/prescription-lens-variants/bulk', { variants: variantsData });
  return response;
};

export default {
  getPrescriptionLensVariants,
  getPrescriptionLensVariantById,
  createPrescriptionLensVariant,
  updatePrescriptionLensVariant,
  deletePrescriptionLensVariant,
  getActivePrescriptionLensVariants,
  getRecommendedPrescriptionLensVariants,
  getPrescriptionLensVariantsByType,
  bulkUpdatePrescriptionLensVariants
};
