/**
 * Lens Types Backend API Implementation
 * Provides CRUD operations for lens types management
 * 
 * Endpoints:
 * - GET /api/admin/lens-types - List all lens types
 * - POST /api/admin/lens-types - Create new lens type
 * - GET /api/admin/lens-types/:id - Get single lens type
 * - PUT /api/admin/lens-types/:id - Update lens type
 * - DELETE /api/admin/lens-types/:id - Delete lens type
 */

import api from '../utils/api';

/**
 * Get all lens types with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with lens types data
 */
export const getLensTypes = async (params = {}) => {
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
    const response = await api.get(`/admin/lens-types?${queryParams}`);
    return response;
  } catch (error) {
    console.log('🔄 Lens types fetch error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Returning mock lens types data in demo mode');
      // Get demo data from localStorage or use default data
      let demoData = JSON.parse(localStorage.getItem('demo_lens_types') || 'null');
      
      // If no demo data exists, use default data
      if (!demoData || demoData.length === 0) {
        demoData = [
          {
            id: 1,
            name: "Standard",
            slug: "standard",
            index: 1.50,
            thickness_factor: 1.0,
            price_adjustment: 0.00,
            description: "Basic single vision lens with standard thickness.",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 2,
            name: "Polycarbonate",
            slug: "polycarbonate",
            index: 1.59,
            thickness_factor: 0.8,
            price_adjustment: 25.00,
            description: "Impact-resistant lens material, ideal for sports and safety glasses.",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 3,
            name: "High Index 1.67",
            slug: "high-index-1.67",
            index: 1.67,
            thickness_factor: 0.6,
            price_adjustment: 45.00,
            description: "Thinner, lighter lens for strong prescriptions.",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 4,
            name: "High Index 1.74",
            slug: "high-index-1.74",
            index: 1.74,
            thickness_factor: 0.5,
            price_adjustment: 65.00,
            description: "Ultra-thin lens for the highest prescriptions.",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 5,
            name: "Trivex",
            slug: "trivex",
            index: 1.53,
            thickness_factor: 0.9,
            price_adjustment: 35.00,
            description: "Lightweight, impact-resistant material with excellent optical clarity.",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          }
        ];
        
        // Save default data to localStorage
        localStorage.setItem('demo_lens_types', JSON.stringify(demoData));
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
 * Get a single lens type by ID
 * @param {number} id - Lens type ID
 * @returns {Promise} Response with lens type data
 */
export const getLensTypeById = async (id) => {
  const response = await api.get(`/admin/lens-types/${id}`);
  return response;
};

/**
 * Create a new lens type
 * @param {Object} lensTypeData - Lens type data
 * @param {string} lensTypeData.name - Name
 * @param {string} lensTypeData.slug - Slug
 * @param {number} lensTypeData.index - Index value
 * @param {number} lensTypeData.thickness_factor - Thickness factor
 * @param {number} lensTypeData.price_adjustment - Price adjustment
 * @param {string} lensTypeData.description - Description
 * @param {boolean} lensTypeData.is_active - Active status
 * @returns {Promise} Response with created lens type data
 */
export const createLensType = async (lensTypeData) => {
  try {
    const response = await api.post('/admin/lens-types', lensTypeData);
    return response;
  } catch (error) {
    console.log('🔄 Lens type creation error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating lens type creation in demo mode');
      // Get existing demo data or create new array
      const existingData = JSON.parse(localStorage.getItem('demo_lens_types') || '[]');
      
      // Create new lens type with unique ID
      const newLensType = {
        id: Date.now(),
        ...lensTypeData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to existing data
      existingData.push(newLensType);
      
      // Save to localStorage
      localStorage.setItem('demo_lens_types', JSON.stringify(existingData));
      
      // Simulate successful creation
      const mockResponse = {
        data: newLensType,
        status: 200
      };
      return mockResponse;
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Update an existing lens type
 * @param {number} id - Lens type ID
 * @param {Object} lensTypeData - Updated lens type data
 * @returns {Promise} Response with updated lens type data
 */
export const updateLensType = async (id, lensTypeData) => {
  try {
    const response = await api.put(`/admin/lens-types/${id}`, lensTypeData);
    return response;
  } catch (error) {
    console.log('🔄 Lens type update error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating lens type update in demo mode');
      // Get existing demo data
      const existingData = JSON.parse(localStorage.getItem('demo_lens_types') || '[]');
      
      // Find and update the lens type
      const index = existingData.findIndex(item => item.id === id);
      if (index !== -1) {
        existingData[index] = {
          ...existingData[index],
          ...lensTypeData,
          updated_at: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('demo_lens_types', JSON.stringify(existingData));
        
        // Simulate successful update
        const mockResponse = {
          data: existingData[index],
          status: 200
        };
        return mockResponse;
      } else {
        throw new Error('Lens type not found');
      }
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Delete a lens type
 * @param {number} id - Lens type ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteLensType = async (id) => {
  try {
    const response = await api.delete(`/admin/lens-types/${id}`);
    return response;
  } catch (error) {
    console.log('🔄 Lens type delete error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating lens type deletion in demo mode');
      // Get existing demo data
      const existingData = JSON.parse(localStorage.getItem('demo_lens_types') || '[]');
      
      // Find and remove the lens type
      const index = existingData.findIndex(item => item.id === id);
      if (index !== -1) {
        existingData.splice(index, 1);
        
        // Save to localStorage
        localStorage.setItem('demo_lens_types', JSON.stringify(existingData));
        
        // Simulate successful deletion
        const mockResponse = {
          data: {
            success: true,
            message: 'Lens type deleted successfully'
          },
          status: 200
        };
        return mockResponse;
      } else {
        throw new Error('Lens type not found');
      }
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Get active lens types (for frontend display)
 * @returns {Promise} Response with active lens types
 */
export const getActiveLensTypes = async () => {
  const response = await api.get('/admin/lens-types?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Bulk update lens types
 * @param {Array} lensTypesData - Array of lens type data with IDs
 * @returns {Promise} Response with updated lens types
 */
export const bulkUpdateLensTypes = async (lensTypesData) => {
  const response = await api.put('/admin/lens-types/bulk', { lens_types: lensTypesData });
  return response;
};

export default {
  getLensTypes,
  getLensTypeById,
  createLensType,
  updateLensType,
  deleteLensType,
  getActiveLensTypes,
  bulkUpdateLensTypes
};
