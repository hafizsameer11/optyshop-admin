/**
 * Lens Finishes Backend API Implementation
 * Provides CRUD operations for lens finishes management
 * 
 * Endpoints:
 * - GET /api/admin/lens-finishes - List all lens finishes
 * - POST /api/admin/lens-finishes - Create new lens finish
 * - GET /api/admin/lens-finishes/:id - Get single lens finish
 * - PUT /api/admin/lens-finishes/:id - Update lens finish
 * - DELETE /api/admin/lens-finishes/:id - Delete lens finish
 */

import api from '../utils/api';

/**
 * Get all lens finishes with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with lens finishes data
 */
export const getLensFinishes = async (params = {}) => {
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
    const response = await api.get(`/admin/lens-finishes?${queryParams}`);
    return response;
  } catch (error) {
    console.log('🔄 Lens finishes fetch error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Returning mock lens finishes data in demo mode');
      // Get demo data from localStorage or use default data
      let demoData = JSON.parse(localStorage.getItem('demo_lens_finishes') || 'null');
      
      // If no demo data exists, use default data
      if (!demoData || demoData.length === 0) {
        demoData = [
          {
            id: 1,
            name: "Matte",
            slug: "matte",
            description: "Non-reflective matte finish for reduced glare.",
            base_price: 15.00,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 2,
            name: "Glossy",
            slug: "glossy",
            description: "High-gloss reflective finish for enhanced appearance.",
            base_price: 10.00,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 3,
            name: "Satin",
            slug: "satin",
            description: "Semi-gloss finish with moderate reflectivity.",
            base_price: 12.00,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 4,
            name: "Anti-Glare",
            slug: "anti-glare",
            description: "Special coating to reduce glare and reflections.",
            base_price: 20.00,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 5,
            name: "Mirrored",
            slug: "mirrored",
            description: "Reflective mirrored finish for privacy and style.",
            base_price: 25.00,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          }
        ];
        
        // Save default data to localStorage
        localStorage.setItem('demo_lens_finishes', JSON.stringify(demoData));
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
 * Get a single lens finish by ID
 * @param {number} id - Lens finish ID
 * @returns {Promise} Response with lens finish data
 */
export const getLensFinishById = async (id) => {
  const response = await api.get(`/admin/lens-finishes/${id}`);
  return response;
};

/**
 * Create a new lens finish
 * @param {Object} lensFinishData - Lens finish data
 * @param {string} lensFinishData.name - Name
 * @param {string} lensFinishData.slug - Slug
 * @param {number} lensFinishData.base_price - Base price
 * @param {string} lensFinishData.description - Description
 * @param {boolean} lensFinishData.is_active - Active status
 * @returns {Promise} Response with created lens finish data
 */
export const createLensFinish = async (lensFinishData) => {
  try {
    const response = await api.post('/admin/lens-finishes', lensFinishData);
    return response;
  } catch (error) {
    console.log('🔄 Lens finish creation error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating lens finish creation in demo mode');
      // Get existing demo data or create new array
      const existingData = JSON.parse(localStorage.getItem('demo_lens_finishes') || '[]');
      
      // Create new lens finish with unique ID
      const newLensFinish = {
        id: Date.now(),
        ...lensFinishData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to existing data
      existingData.push(newLensFinish);
      
      // Save to localStorage
      localStorage.setItem('demo_lens_finishes', JSON.stringify(existingData));
      
      // Simulate successful creation
      const mockResponse = {
        data: newLensFinish,
        status: 200
      };
      return mockResponse;
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Update an existing lens finish
 * @param {number} id - Lens finish ID
 * @param {Object} lensFinishData - Updated lens finish data
 * @returns {Promise} Response with updated lens finish data
 */
export const updateLensFinish = async (id, lensFinishData) => {
  try {
    const response = await api.put(`/admin/lens-finishes/${id}`, lensFinishData);
    return response;
  } catch (error) {
    console.log('🔄 Lens finish update error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating lens finish update in demo mode');
      // Get existing demo data
      const existingData = JSON.parse(localStorage.getItem('demo_lens_finishes') || '[]');
      
      // Find and update the lens finish
      const index = existingData.findIndex(item => item.id === id);
      if (index !== -1) {
        existingData[index] = {
          ...existingData[index],
          ...lensFinishData,
          updated_at: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('demo_lens_finishes', JSON.stringify(existingData));
        
        // Simulate successful update
        const mockResponse = {
          data: existingData[index],
          status: 200
        };
        return mockResponse;
      } else {
        throw new Error('Lens finish not found');
      }
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Delete a lens finish
 * @param {number} id - Lens finish ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteLensFinish = async (id) => {
  try {
    const response = await api.delete(`/admin/lens-finishes/${id}`);
    return response;
  } catch (error) {
    console.log('🔄 Lens finish delete error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating lens finish deletion in demo mode');
      // Get existing demo data
      const existingData = JSON.parse(localStorage.getItem('demo_lens_finishes') || '[]');
      
      // Find and remove the lens finish
      const index = existingData.findIndex(item => item.id === id);
      if (index !== -1) {
        existingData.splice(index, 1);
        
        // Save to localStorage
        localStorage.setItem('demo_lens_finishes', JSON.stringify(existingData));
        
        // Simulate successful deletion
        const mockResponse = {
          data: {
            success: true,
            message: 'Lens finish deleted successfully'
          },
          status: 200
        };
        return mockResponse;
      } else {
        throw new Error('Lens finish not found');
      }
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Get active lens finishes (for frontend display)
 * @returns {Promise} Response with active lens finishes
 */
export const getActiveLensFinishes = async () => {
  const response = await api.get('/admin/lens-finishes?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Bulk update lens finishes
 * @param {Array} finishesData - Array of lens finish data with IDs
 * @returns {Promise} Response with updated lens finishes
 */
export const bulkUpdateLensFinishes = async (finishesData) => {
  const response = await api.put('/admin/lens-finishes/bulk', { finishes: finishesData });
  return response;
};

export default {
  getLensFinishes,
  getLensFinishById,
  createLensFinish,
  updateLensFinish,
  deleteLensFinish,
  getActiveLensFinishes,
  bulkUpdateLensFinishes
};
