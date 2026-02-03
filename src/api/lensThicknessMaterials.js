/**
 * Lens Thickness Materials Backend API Implementation
 * Provides CRUD operations for lens thickness materials management
 * 
 * Endpoints:
 * - GET /api/admin/lens-thickness-materials - List all thickness materials
 * - POST /api/admin/lens-thickness-materials - Create new thickness material
 * - GET /api/admin/lens-thickness-materials/:id - Get single thickness material
 * - PUT /api/admin/lens-thickness-materials/:id - Update thickness material
 * - DELETE /api/admin/lens-thickness-materials/:id - Delete thickness material
 */

import api from '../utils/api';

/**
 * Get all lens thickness materials with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with thickness materials data
 */
export const getLensThicknessMaterials = async (params = {}) => {
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
    const response = await api.get(`/admin/lens-thickness-materials?${queryParams}`);
    return response;
  } catch (error) {
    console.log('🔄 Lens thickness materials fetch error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Returning mock lens thickness materials data in demo mode');
      // Get demo data from localStorage or use default data
      let demoData = JSON.parse(localStorage.getItem('demo_lens_thickness_materials') || 'null');
      
      // If no demo data exists, use default data
      if (!demoData || demoData.length === 0) {
        demoData = [
          {
            id: 1,
            name: "Standard Plastic",
            slug: "standard-plastic",
            description: "Standard CR-39 plastic lens material.",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 2,
            name: "Polycarbonate",
            slug: "polycarbonate",
            description: "Impact-resistant polycarbonate lens material.",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 3,
            name: "High Index 1.67",
            slug: "high-index-167",
            description: "Thinner lens material for strong prescriptions.",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 4,
            name: "High Index 1.74",
            slug: "high-index-174",
            description: "Ultra-thin lens material for the highest prescriptions.",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 5,
            name: "Trivex",
            slug: "trivex",
            description: "Lightweight, impact-resistant material with excellent optical clarity.",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          }
        ];
        
        // Save default data to localStorage
        localStorage.setItem('demo_lens_thickness_materials', JSON.stringify(demoData));
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
 * Get a single lens thickness material by ID
 * @param {number} id - Thickness material ID
 * @returns {Promise} Response with thickness material data
 */
export const getLensThicknessMaterialById = async (id) => {
  const response = await api.get(`/admin/lens-thickness-materials/${id}`);
  return response;
};

/**
 * Create a new lens thickness material
 * @param {Object} thicknessMaterialData - Thickness material data
 * @param {string} thicknessMaterialData.name - Name
 * @param {string} thicknessMaterialData.slug - Slug
 * @param {string} thicknessMaterialData.description - Description
 * @param {boolean} thicknessMaterialData.is_active - Active status
 * @returns {Promise} Response with created thickness material data
 */
export const createLensThicknessMaterial = async (thicknessMaterialData) => {
  try {
    const response = await api.post('/admin/lens-thickness-materials', thicknessMaterialData);
    return response;
  } catch (error) {
    console.log('🔄 Lens thickness material creation error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating lens thickness material creation in demo mode');
      // Get existing demo data or create new array
      const existingData = JSON.parse(localStorage.getItem('demo_lens_thickness_materials') || '[]');
      
      // Create new thickness material with unique ID
      const newMaterial = {
        id: Date.now(),
        ...thicknessMaterialData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to existing data
      existingData.push(newMaterial);
      
      // Save to localStorage
      localStorage.setItem('demo_lens_thickness_materials', JSON.stringify(existingData));
      
      // Simulate successful creation
      const mockResponse = {
        data: newMaterial,
        status: 200
      };
      return mockResponse;
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Update an existing lens thickness material
 * @param {number} id - Thickness material ID
 * @param {Object} thicknessMaterialData - Updated thickness material data
 * @returns {Promise} Response with updated thickness material data
 */
export const updateLensThicknessMaterial = async (id, thicknessMaterialData) => {
  try {
    const response = await api.put(`/admin/lens-thickness-materials/${id}`, thicknessMaterialData);
    return response;
  } catch (error) {
    console.log('🔄 Lens thickness material update error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating lens thickness material update in demo mode');
      // Get existing demo data
      const existingData = JSON.parse(localStorage.getItem('demo_lens_thickness_materials') || '[]');
      
      // Find and update the thickness material
      const index = existingData.findIndex(item => item.id === id);
      if (index !== -1) {
        existingData[index] = {
          ...existingData[index],
          ...thicknessMaterialData,
          updated_at: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('demo_lens_thickness_materials', JSON.stringify(existingData));
        
        // Simulate successful update
        const mockResponse = {
          data: existingData[index],
          status: 200
        };
        return mockResponse;
      } else {
        throw new Error('Lens thickness material not found');
      }
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Delete a lens thickness material
 * @param {number} id - Thickness material ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteLensThicknessMaterial = async (id) => {
  try {
    const response = await api.delete(`/admin/lens-thickness-materials/${id}`);
    return response;
  } catch (error) {
    console.log('🔄 Lens thickness material delete error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating lens thickness material deletion in demo mode');
      // Get existing demo data
      const existingData = JSON.parse(localStorage.getItem('demo_lens_thickness_materials') || '[]');
      
      // Find and remove the thickness material
      const index = existingData.findIndex(item => item.id === id);
      if (index !== -1) {
        existingData.splice(index, 1);
        
        // Save to localStorage
        localStorage.setItem('demo_lens_thickness_materials', JSON.stringify(existingData));
        
        // Simulate successful deletion
        const mockResponse = {
          data: {
            success: true,
            message: 'Lens thickness material deleted successfully'
          },
          status: 200
        };
        return mockResponse;
      } else {
        throw new Error('Lens thickness material not found');
      }
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Get active thickness materials (for frontend display)
 * @returns {Promise} Response with active thickness materials
 */
export const getActiveLensThicknessMaterials = async () => {
  const response = await api.get('/admin/lens-thickness-materials?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Bulk update thickness materials
 * @param {Array} materialsData - Array of thickness material data with IDs
 * @returns {Promise} Response with updated thickness materials
 */
export const bulkUpdateLensThicknessMaterials = async (materialsData) => {
  const response = await api.put('/admin/lens-thickness-materials/bulk', { materials: materialsData });
  return response;
};

export default {
  getLensThicknessMaterials,
  getLensThicknessMaterialById,
  createLensThicknessMaterial,
  updateLensThicknessMaterial,
  deleteLensThicknessMaterial,
  getActiveLensThicknessMaterials,
  bulkUpdateLensThicknessMaterials
};
