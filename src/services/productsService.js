import api from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// Type Definitions for Product Management
export const ProductTypes = {
  SUNGLASSES: 'sunglasses',
  EYEGLASSES: 'frame',
  CONTACT_LENSES: 'contact_lens',
  EYE_HYGIENE: 'eye_hygiene'
};

// MM Caliber Interface
export const MMCaliber = {
  mm: '',           // string - Caliber size (e.g., "58", "62")
  image_url: ''     // string - URL to the image for this caliber
};

// Size/Volume Variant Interface
export const SizeVolumeVariant = {
  id: 0,
  product_id: 0,
  size_volume: '',
  pack_type: '',
  price: 0,
  compare_at_price: 0,
  cost_price: 0,
  stock_quantity: 0,
  stock_status: 'in_stock',
  sku: '',
  expiry_date: '',
  is_active: true,
  sort_order: 0,
  image_url: '',
  created_at: '',
  updated_at: ''
};

// Eye Hygiene Variant Interface
export const EyeHygieneVariant = {
  id: 0,
  product_id: 0,
  name: '',
  description: '',
  price: 0,
  image_url: '',
  is_active: true,
  sort_order: 0,
  created_at: '',
  updated_at: ''
};

// Enhanced Product Interface
export const Product = {
  id: 0,
  name: '',
  slug: '',
  description: '',
  price: 0,
  product_type: '',
  category_id: 0,
  subcategory_id: 0,
  brand_id: 0,
  image_url: '',
  images: [],
  is_active: true,
  is_featured: false,
  sort_order: 0,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  created_at: '',
  updated_at: '',
  // New fields for frame/glasses products
  mm_calibers: [],  // Array of MMCaliber objects
  // New field for eye hygiene products
  eye_hygiene_variants: [],  // Array of EyeHygieneVariant objects
  // New field for size-volume variants
  size_volume_variants: []   // Array of SizeVolumeVariant objects
};

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

/**
 * Get product with caliber options
 * GET /api/products/:id/calibers
 */
export const getProductWithCalibers = async (productId) => {
  try {
    const response = await api.get(API_ROUTES.PRODUCTS.BY_ID(productId) + '/calibers');
    return response.data;
  } catch (error) {
    console.error('Error fetching product with calibers:', error);
    throw error;
  }
};

/**
 * Get category products with calibers
 * GET /api/categories/:id/products
 */
export const getCategoryProductsWithCalibers = async (categoryId, params = {}) => {
  try {
    const response = await api.get(API_ROUTES.CATEGORIES.BY_ID(categoryId) + '/products', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching category products with calibers:', error);
    throw error;
  }
};

// ============================================
// ADMIN API FUNCTIONS - MM CALIBER MANAGEMENT
// ============================================

/**
 * Get all calibers for a product
 * GET /api/admin/products/:id/calibers
 */
export const getProductCalibers = async (productId) => {
  try {
    const response = await api.get(API_ROUTES.ADMIN.PRODUCTS.MM_CALIBERS.LIST(productId));
    return response.data;
  } catch (error) {
    // If endpoint doesn't exist (404), return empty calibers array as fallback
    if (error.response?.status === 404) {
      console.warn('Product calibers endpoint not found, returning empty array');
      return { calibers: [] };
    }
    console.error('Error fetching product calibers:', error);
    throw error;
  }
};

/**
 * Create a new caliber for a product
 * POST /api/admin/products/:id/calibers/:mm
 */
export const createProductCaliber = async (productId, mm, caliberData) => {
  try {
    const response = await api.post(API_ROUTES.ADMIN.PRODUCTS.MM_CALIBERS.CREATE(productId, mm), caliberData);
    return response.data;
  } catch (error) {
    // If endpoint doesn't exist (404), show user-friendly message
    if (error.response?.status === 404) {
      console.warn('Product calibers endpoint not found - backend implementation required');
      throw new Error('Caliber management is not yet available. Please contact the backend team to implement the MM calibers API endpoints.');
    }
    console.error('Error creating product caliber:', error);
    throw error;
  }
};

/**
 * Update a caliber for a product
 * PUT /api/admin/products/:id/calibers/:mm
 */
export const updateProductCaliber = async (productId, mm, caliberData) => {
  try {
    const response = await api.put(API_ROUTES.ADMIN.PRODUCTS.MM_CALIBERS.UPDATE(productId, mm), caliberData);
    return response.data;
  } catch (error) {
    // If endpoint doesn't exist (404), show user-friendly message
    if (error.response?.status === 404) {
      console.warn('Product calibers endpoint not found - backend implementation required');
      throw new Error('Caliber management is not yet available. Please contact the backend team to implement the MM calibers API endpoints.');
    }
    console.error('Error updating product caliber:', error);
    throw error;
  }
};

/**
 * Delete a caliber for a product
 * DELETE /api/admin/products/:id/calibers/:mm
 */
export const deleteProductCaliber = async (productId, mm) => {
  try {
    const response = await api.delete(API_ROUTES.ADMIN.PRODUCTS.MM_CALIBERS.DELETE(productId, mm));
    return response.data;
  } catch (error) {
    // If endpoint doesn't exist (404), show user-friendly message
    if (error.response?.status === 404) {
      console.warn('Product calibers endpoint not found - backend implementation required');
      throw new Error('Caliber management is not yet available. Please contact the backend team to implement the MM calibers API endpoints.');
    }
    console.error('Error deleting product caliber:', error);
    throw error;
  }
};

// ============================================
// ADMIN API FUNCTIONS - EYE HYGIENE VARIANT MANAGEMENT
// ============================================

/**
 * Get all eye hygiene variants
 * GET /api/admin/eye-hygiene-variants
 */
export const getEyeHygieneVariants = async (params = {}) => {
  try {
    const response = await api.get('/admin/eye-hygiene-variants', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching eye hygiene variants:', error);
    throw error;
  }
};

/**
 * Get eye hygiene variant by ID
 * GET /api/admin/eye-hygiene-variants/:id
 */
export const getEyeHygieneVariantById = async (variantId) => {
  try {
    const response = await api.get(`/admin/eye-hygiene-variants/${variantId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching eye hygiene variant:', error);
    throw error;
  }
};

/**
 * Create a new eye hygiene variant
 * POST /api/admin/eye-hygiene-variants
 */
export const createEyeHygieneVariant = async (variantData) => {
  try {
    const response = await api.post('/admin/eye-hygiene-variants', variantData);
    return response.data;
  } catch (error) {
    console.error('Error creating eye hygiene variant:', error);
    throw error;
  }
};

/**
 * Update an eye hygiene variant
 * PUT /api/admin/eye-hygiene-variants/:id
 */
export const updateEyeHygieneVariant = async (variantId, variantData) => {
  try {
    const response = await api.put(`/admin/eye-hygiene-variants/${variantId}`, variantData);
    return response.data;
  } catch (error) {
    console.error('Error updating eye hygiene variant:', error);
    throw error;
  }
};

/**
 * Delete an eye hygiene variant
 * DELETE /api/admin/eye-hygiene-variants/:id
 */
export const deleteEyeHygieneVariant = async (variantId) => {
  try {
    const response = await api.delete(`/admin/eye-hygiene-variants/${variantId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting eye hygiene variant:', error);
    throw error;
  }
};

/**
 * Get all eye hygiene variants for a specific product
 * GET /api/admin/products/:id/eye-hygiene-variants
 */
export const getProductEyeHygieneVariants = async (productId) => {
  try {
    const response = await api.get(API_ROUTES.ADMIN.PRODUCTS.BY_ID(productId) + '/eye-hygiene-variants');
    return response.data;
  } catch (error) {
    console.error('Error fetching product eye hygiene variants:', error);
    throw error;
  }
};

// ============================================
// ADMIN API FUNCTIONS - SIZE/VOLUME VARIANT MANAGEMENT
// ============================================

/**
 * Get all size-volume variants for a specific product
 * GET /api/admin/products/:id/size-volume-variants
 */
export const getProductSizeVolumeVariants = async (productId) => {
  try {
    const response = await api.get(API_ROUTES.ADMIN.PRODUCTS.SIZE_VOLUME_VARIANTS.LIST(productId));
    return response.data;
  } catch (error) {
    console.error('Error fetching product size-volume variants:', error);
    throw error;
  }
};

/**
 * Get a single size-volume variant by ID
 * GET /api/admin/products/:productId/size-volume-variants/:variantId
 */
export const getSizeVolumeVariantById = async (productId, variantId) => {
  try {
    const response = await api.get(API_ROUTES.ADMIN.PRODUCTS.SIZE_VOLUME_VARIANTS.BY_ID(productId, variantId));
    return response.data;
  } catch (error) {
    console.error('Error fetching size-volume variant:', error);
    throw error;
  }
};

/**
 * Create a new size-volume variant
 * POST /api/admin/products/:id/size-volume-variants
 */
export const createSizeVolumeVariant = async (productId, variantData) => {
  try {
    const response = await api.post(API_ROUTES.ADMIN.PRODUCTS.SIZE_VOLUME_VARIANTS.CREATE(productId), variantData);
    return response.data;
  } catch (error) {
    console.error('Error creating size-volume variant:', error);
    throw error;
  }
};

/**
 * Update a size-volume variant
 * PUT /api/admin/products/:productId/size-volume-variants/:variantId
 */
export const updateSizeVolumeVariant = async (productId, variantId, variantData) => {
  try {
    const response = await api.put(API_ROUTES.ADMIN.PRODUCTS.SIZE_VOLUME_VARIANTS.UPDATE(productId, variantId), variantData);
    return response.data;
  } catch (error) {
    console.error('Error updating size-volume variant:', error);
    throw error;
  }
};

/**
 * Delete a size-volume variant
 * DELETE /api/admin/products/:productId/size-volume-variants/:variantId
 */
export const deleteSizeVolumeVariant = async (productId, variantId) => {
  try {
    const response = await api.delete(API_ROUTES.ADMIN.PRODUCTS.SIZE_VOLUME_VARIANTS.DELETE(productId, variantId));
    return response.data;
  } catch (error) {
    console.error('Error deleting size-volume variant:', error);
    throw error;
  }
};

/**
 * Bulk update size-volume variants
 * PUT /api/admin/products/:id/size-volume-variants/bulk
 */
export const bulkUpdateSizeVolumeVariants = async (productId, variantsData) => {
  try {
    const response = await api.put(API_ROUTES.ADMIN.PRODUCTS.SIZE_VOLUME_VARIANTS.BULK_UPDATE(productId), variantsData);
    return response.data;
  } catch (error) {
    console.error('Error bulk updating size-volume variants:', error);
    throw error;
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if a product supports MM calibers (frame/glasses products)
 */
export const supportsMMCalibers = (productType) => {
  return [ProductTypes.SUNGLASSES, ProductTypes.EYEGLASSES].includes(productType);
};

/**
 * Check if a product supports eye hygiene variants
 */
export const supportsEyeHygieneVariants = (productType) => {
  return productType === ProductTypes.EYE_HYGIENE;
};

/**
 * Check if a product supports size-volume variants (eye hygiene products)
 */
export const supportsSizeVolumeVariants = (productType) => {
  return productType === ProductTypes.EYE_HYGIENE;
};

/**
 * Format caliber display text
 */
export const formatCaliberDisplay = (mm) => {
  return `${mm}mm`;
};

/**
 * Validate caliber data
 */
export const validateCaliberData = (caliberData) => {
  const errors = [];
  
  if (!caliberData.mm || isNaN(caliberData.mm)) {
    errors.push('Caliber size (mm) is required and must be a number');
  }
  
  if (!caliberData.image_url) {
    errors.push('Image URL is required');
  }
  
  try {
    new URL(caliberData.image_url);
  } catch {
    errors.push('Image URL must be a valid URL');
  }
  
  return errors;
};

/**
 * Validate eye hygiene variant data
 */
export const validateEyeHygieneVariantData = (variantData) => {
  const errors = [];
  
  if (!variantData.name || variantData.name.trim().length === 0) {
    errors.push('Variant name is required');
  }
  
  if (!variantData.product_id || isNaN(variantData.product_id)) {
    errors.push('Product ID is required and must be a number');
  }
  
  if (!variantData.price || isNaN(variantData.price) || variantData.price < 0) {
    errors.push('Price is required and must be a positive number');
  }
  
  if (variantData.image_url) {
    try {
      new URL(variantData.image_url);
    } catch {
      errors.push('Image URL must be a valid URL');
    }
  }
  
  return errors;
};

/**
 * Validate size-volume variant data
 */
export const validateSizeVolumeVariantData = (variantData) => {
  const errors = [];
  
  if (!variantData.size_volume || variantData.size_volume.trim().length === 0) {
    errors.push('Size/Volume is required');
  }
  
  if (!variantData.product_id || isNaN(variantData.product_id)) {
    errors.push('Product ID is required and must be a number');
  }
  
  if (!variantData.price || isNaN(variantData.price) || variantData.price < 0) {
    errors.push('Price is required and must be a positive number');
  }
  
  if (variantData.image_url) {
    try {
      new URL(variantData.image_url);
    } catch {
      errors.push('Image URL must be a valid URL');
    }
  }
  
  return errors;
};

export default {
  // Type exports
  ProductTypes,
  MMCaliber,
  EyeHygieneVariant,
  SizeVolumeVariant,
  Product,
  
  // Public functions
  getProductWithCalibers,
  getCategoryProductsWithCalibers,
  
  // MM Caliber functions
  getProductCalibers,
  createProductCaliber,
  updateProductCaliber,
  deleteProductCaliber,
  
  // Eye Hygiene Variant functions
  getEyeHygieneVariants,
  getEyeHygieneVariantById,
  createEyeHygieneVariant,
  updateEyeHygieneVariant,
  deleteEyeHygieneVariant,
  getProductEyeHygieneVariants,
  
  // Size/Volume Variant functions
  getProductSizeVolumeVariants,
  getSizeVolumeVariantById,
  createSizeVolumeVariant,
  updateSizeVolumeVariant,
  deleteSizeVolumeVariant,
  bulkUpdateSizeVolumeVariants,
  
  // Utility functions
  supportsMMCalibers,
  supportsEyeHygieneVariants,
  supportsSizeVolumeVariants,
  formatCaliberDisplay,
  validateCaliberData,
  validateEyeHygieneVariantData,
  validateSizeVolumeVariantData
};
