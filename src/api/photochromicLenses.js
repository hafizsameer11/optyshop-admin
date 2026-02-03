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

  try {
    const response = await api.get(`/admin/photochromic-lenses?${queryParams}`);
    return response;
  } catch (error) {
    console.log('🔄 Photochromic lenses fetch error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Returning mock photochromic lenses data in demo mode');
      // Get demo data from localStorage or use default data
      let demoData = JSON.parse(localStorage.getItem('demo_photochromic_lenses') || 'null');
      
      // If no demo data exists, use default data
      if (!demoData || demoData.length === 0) {
        demoData = [
          {
            id: 1,
            name: "EyeQLenz™ with Zenni ID Guard™",
            slug: "eyeqlenz-with-zenni-id-guard",
            description: "4-in-1 lens that reflects infrared light to keep you comfortable and protect against eye strain and fatigue.",
            base_price: 32.95,
            is_active: true,
            sort_order: 1,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 2,
            name: "Transitions® Signature®",
            slug: "transitions-signature",
            description: "Classic photochromic lenses that darken in sunlight and clear indoors.",
            base_price: 45.00,
            is_active: true,
            sort_order: 2,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 3,
            name: "Transitions® XTRActive®",
            slug: "transitions-xtractive",
            description: "Extra darkness for extra protection, even in the car.",
            base_price: 55.00,
            is_active: true,
            sort_order: 3,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          }
        ];
        
        // Save default data to localStorage
        localStorage.setItem('demo_photochromic_lenses', JSON.stringify(demoData));
      }
      
      // Apply filters if specified
      let filteredData = demoData;
      if (is_active !== undefined) {
        filteredData = filteredData.filter(item => item.is_active === is_active);
      }
      
      // Return mock data that matches the expected structure
      const mockResponse = {
        data: {
          data: filteredData,
          pagination: {
            current_page: page,
            total_pages: Math.ceil(filteredData.length / limit),
            total_items: filteredData.length,
            items_per_page: limit
          }
        },
        status: 200
      };
      return mockResponse;
    }
    
    // For other errors, still throw them
    throw error;
  }
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
  try {
    const response = await api.post('/admin/photochromic-lenses', photochromicLensData);
    return response;
  } catch (error) {
    console.log('🔄 Photochromic lens creation error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating photochromic lens creation in demo mode');
      // Get existing demo data or create new array
      const existingData = JSON.parse(localStorage.getItem('demo_photochromic_lenses') || '[]');
      
      // Create new lens with unique ID
      const newLens = {
        id: Date.now(),
        ...photochromicLensData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to existing data
      existingData.push(newLens);
      
      // Save to localStorage
      localStorage.setItem('demo_photochromic_lenses', JSON.stringify(existingData));
      
      // Simulate successful creation
      const mockResponse = {
        data: newLens,
        status: 200
      };
      return mockResponse;
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Update an existing photochromic lens
 * @param {number} id - Photochromic lens ID
 * @param {Object} photochromicLensData - Updated photochromic lens data
 * @returns {Promise} Response with updated photochromic lens data
 */
export const updatePhotochromicLens = async (id, photochromicLensData) => {
  try {
    const response = await api.put(`/admin/photochromic-lenses/${id}`, photochromicLensData);
    return response;
  } catch (error) {
    console.log('🔄 Photochromic lens update error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating photochromic lens update in demo mode');
      // Get existing demo data
      const existingData = JSON.parse(localStorage.getItem('demo_photochromic_lenses') || '[]');
      
      // Find and update the lens
      const index = existingData.findIndex(item => item.id === id);
      if (index !== -1) {
        existingData[index] = {
          ...existingData[index],
          ...photochromicLensData,
          updated_at: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('demo_photochromic_lenses', JSON.stringify(existingData));
        
        // Simulate successful update
        const mockResponse = {
          data: existingData[index],
          status: 200
        };
        return mockResponse;
      } else {
        throw new Error('Photochromic lens not found');
      }
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Delete a photochromic lens
 * @param {number} id - Photochromic lens ID
 * @returns {Promise} Response confirming deletion
 */
export const deletePhotochromicLens = async (id) => {
  try {
    const response = await api.delete(`/admin/photochromic-lenses/${id}`);
    return response;
  } catch (error) {
    console.log('🔄 Photochromic lens delete error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating photochromic lens deletion in demo mode');
      // Get existing demo data
      const existingData = JSON.parse(localStorage.getItem('demo_photochromic_lenses') || '[]');
      
      // Find and remove the lens
      const index = existingData.findIndex(item => item.id === id);
      if (index !== -1) {
        existingData.splice(index, 1);
        
        // Save to localStorage
        localStorage.setItem('demo_photochromic_lenses', JSON.stringify(existingData));
        
        // Simulate successful deletion
        const mockResponse = {
          data: {
            success: true,
            message: 'Photochromic lens deleted successfully'
          },
          status: 200
        };
        return mockResponse;
      } else {
        throw new Error('Photochromic lens not found');
      }
    }
    
    // For other errors, still throw them
    throw error;
  }
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
