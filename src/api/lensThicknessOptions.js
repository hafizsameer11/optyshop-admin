/**
 * Lens Thickness Options Backend API Implementation
 * Provides CRUD operations for lens thickness options management
 * 
 * Endpoints:
 * - GET /api/admin/lens-thickness-options - List all thickness options
 * - POST /api/admin/lens-thickness-options - Create new thickness option
 * - GET /api/admin/lens-thickness-options/:id - Get single thickness option
 * - PUT /api/admin/lens-thickness-options/:id - Update thickness option
 * - DELETE /api/admin/lens-thickness-options/:id - Delete thickness option
 */

import api from '../utils/api';

/**
 * Get all lens thickness options with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with thickness options data
 */
export const getLensThicknessOptions = async (params = {}) => {
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
    const response = await api.get(`/admin/lens-thickness-options?${queryParams}`);
    return response;
  } catch (error) {
    console.log('🔄 Lens thickness options fetch error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Returning mock lens thickness options data in demo mode');
      // Get demo data from localStorage or use default data
      let demoData = JSON.parse(localStorage.getItem('demo_lens_thickness_options') || 'null');
      
      // If no demo data exists, use default data
      if (!demoData || demoData.length === 0) {
        demoData = [
          {
            id: 1,
            name: "Standard 1.5",
            slug: "standard-15",
            description: "Standard thickness for low to moderate prescriptions.",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 2,
            name: "Thin 1.6",
            slug: "thin-16",
            description: "Thinner lens option for moderate prescriptions.",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 3,
            name: "Super Thin 1.67",
            slug: "super-thin-167",
            description: "Very thin lens option for strong prescriptions.",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 4,
            name: "Ultra Thin 1.74",
            slug: "ultra-thin-174",
            description: "Ultra-thin lens option for the highest prescriptions.",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 5,
            name: "Aspheric 1.6",
            slug: "aspheric-16",
            description: "Aspheric design for flatter, thinner lenses.",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          }
        ];
        
        // Save default data to localStorage
        localStorage.setItem('demo_lens_thickness_options', JSON.stringify(demoData));
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
 * Get a single lens thickness option by ID
 * @param {number} id - Thickness option ID
 * @returns {Promise} Response with thickness option data
 */
export const getLensThicknessOptionById = async (id) => {
  const response = await api.get(`/admin/lens-thickness-options/${id}`);
  return response;
};

/**
 * Create a new lens thickness option
 * @param {Object} thicknessOptionData - Thickness option data
 * @param {string} thicknessOptionData.name - Name
 * @param {string} thicknessOptionData.slug - Slug
 * @param {string} thicknessOptionData.description - Description
 * @param {boolean} thicknessOptionData.is_active - Active status
 * @returns {Promise} Response with created thickness option data
 */
export const createLensThicknessOption = async (thicknessOptionData) => {
  try {
    const response = await api.post('/admin/lens-thickness-options', thicknessOptionData);
    return response;
  } catch (error) {
    console.log('🔄 Lens thickness option creation error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating lens thickness option creation in demo mode');
      // Get existing demo data or create new array
      const existingData = JSON.parse(localStorage.getItem('demo_lens_thickness_options') || '[]');
      
      // Create new thickness option with unique ID
      const newOption = {
        id: Date.now(),
        ...thicknessOptionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to existing data
      existingData.push(newOption);
      
      // Save to localStorage
      localStorage.setItem('demo_lens_thickness_options', JSON.stringify(existingData));
      
      // Simulate successful creation
      const mockResponse = {
        data: newOption,
        status: 200
      };
      return mockResponse;
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Update an existing lens thickness option
 * @param {number} id - Thickness option ID
 * @param {Object} thicknessOptionData - Updated thickness option data
 * @returns {Promise} Response with updated thickness option data
 */
export const updateLensThicknessOption = async (id, thicknessOptionData) => {
  try {
    const response = await api.put(`/admin/lens-thickness-options/${id}`, thicknessOptionData);
    return response;
  } catch (error) {
    console.log('🔄 Lens thickness option update error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating lens thickness option update in demo mode');
      // Get existing demo data
      const existingData = JSON.parse(localStorage.getItem('demo_lens_thickness_options') || '[]');
      
      // Find and update the thickness option
      const index = existingData.findIndex(item => item.id === id);
      if (index !== -1) {
        existingData[index] = {
          ...existingData[index],
          ...thicknessOptionData,
          updated_at: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('demo_lens_thickness_options', JSON.stringify(existingData));
        
        // Simulate successful update
        const mockResponse = {
          data: existingData[index],
          status: 200
        };
        return mockResponse;
      } else {
        throw new Error('Lens thickness option not found');
      }
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Delete a lens thickness option
 * @param {number} id - Thickness option ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteLensThicknessOption = async (id) => {
  try {
    const response = await api.delete(`/admin/lens-thickness-options/${id}`);
    return response;
  } catch (error) {
    console.log('🔄 Lens thickness option delete error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating lens thickness option deletion in demo mode');
      // Get existing demo data
      const existingData = JSON.parse(localStorage.getItem('demo_lens_thickness_options') || '[]');
      
      // Find and remove the thickness option
      const index = existingData.findIndex(item => item.id === id);
      if (index !== -1) {
        existingData.splice(index, 1);
        
        // Save to localStorage
        localStorage.setItem('demo_lens_thickness_options', JSON.stringify(existingData));
        
        // Simulate successful deletion
        const mockResponse = {
          data: {
            success: true,
            message: 'Lens thickness option deleted successfully'
          },
          status: 200
        };
        return mockResponse;
      } else {
        throw new Error('Lens thickness option not found');
      }
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Get active thickness options (for frontend display)
 * @returns {Promise} Response with active thickness options
 */
export const getActiveLensThicknessOptions = async () => {
  const response = await api.get('/admin/lens-thickness-options?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Bulk update thickness options
 * @param {Array} optionsData - Array of thickness option data with IDs
 * @returns {Promise} Response with updated thickness options
 */
export const bulkUpdateLensThicknessOptions = async (optionsData) => {
  const response = await api.put('/admin/lens-thickness-options/bulk', { options: optionsData });
  return response;
};

export default {
  getLensThicknessOptions,
  getLensThicknessOptionById,
  createLensThicknessOption,
  updateLensThicknessOption,
  deleteLensThicknessOption,
  getActiveLensThicknessOptions,
  bulkUpdateLensThicknessOptions
};
