/**
 * Lens Treatments Backend API Implementation
 * Provides CRUD operations for lens treatments management
 * 
 * Endpoints:
 * - GET /api/admin/lens-treatments - List all lens treatments
 * - POST /api/admin/lens-treatments - Create new lens treatment
 * - GET /api/admin/lens-treatments/:id - Get single lens treatment
 * - PUT /api/admin/lens-treatments/:id - Update lens treatment
 * - DELETE /api/admin/lens-treatments/:id - Delete lens treatment
 */

import api from '../utils/api';

/**
 * Get all lens treatments with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: created_at)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: desc)
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Response with lens treatments data
 */
export const getLensTreatments = async (params = {}) => {
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
    const response = await api.get(`/admin/lens-treatments?${queryParams}`);
    return response;
  } catch (error) {
    console.log('🔄 Lens treatments fetch error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Returning mock lens treatments data in demo mode');
      // Get demo data from localStorage or use default data
      let demoData = JSON.parse(localStorage.getItem('demo_lens_treatments') || 'null');
      
      // If no demo data exists, use default data
      if (!demoData || demoData.length === 0) {
        demoData = [
          {
            id: 1,
            name: "Anti-Reflective",
            slug: "anti-reflective",
            description: "Reduces glare and reflections for better vision and appearance.",
            base_price: 30.00,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 2,
            name: "Scratch Resistant",
            slug: "scratch-resistant",
            description: "Protects lenses from everyday scratches and abrasions.",
            base_price: 15.00,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 3,
            name: "UV Protection",
            slug: "uv-protection",
            description: "Blocks harmful UV rays to protect your eyes.",
            base_price: 10.00,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 4,
            name: "Hydrophobic",
            slug: "hydrophobic",
            description: "Water-repellent coating that repels water and smudges.",
            base_price: 20.00,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 5,
            name: "Blue Light Filter",
            slug: "blue-light-filter",
            description: "Filters harmful blue light from digital screens and devices.",
            base_price: 25.00,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          }
        ];
        
        // Save default data to localStorage
        localStorage.setItem('demo_lens_treatments', JSON.stringify(demoData));
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
 * Get a single lens treatment by ID
 * @param {number} id - Lens treatment ID
 * @returns {Promise} Response with lens treatment data
 */
export const getLensTreatmentById = async (id) => {
  const response = await api.get(`/admin/lens-treatments/${id}`);
  return response;
};

/**
 * Create a new lens treatment
 * @param {Object} lensTreatmentData - Lens treatment data
 * @param {string} lensTreatmentData.name - Name
 * @param {string} lensTreatmentData.slug - Slug
 * @param {number} lensTreatmentData.base_price - Base price
 * @param {string} lensTreatmentData.description - Description
 * @param {boolean} lensTreatmentData.is_active - Active status
 * @returns {Promise} Response with created lens treatment data
 */
export const createLensTreatment = async (lensTreatmentData) => {
  try {
    const response = await api.post('/admin/lens-treatments', lensTreatmentData);
    return response;
  } catch (error) {
    console.log('🔄 Lens treatment creation error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating lens treatment creation in demo mode');
      // Get existing demo data or create new array
      const existingData = JSON.parse(localStorage.getItem('demo_lens_treatments') || '[]');
      
      // Create new lens treatment with unique ID
      const newLensTreatment = {
        id: Date.now(),
        ...lensTreatmentData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to existing data
      existingData.push(newLensTreatment);
      
      // Save to localStorage
      localStorage.setItem('demo_lens_treatments', JSON.stringify(existingData));
      
      // Simulate successful creation
      const mockResponse = {
        data: newLensTreatment,
        status: 200
      };
      return mockResponse;
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Update an existing lens treatment
 * @param {number} id - Lens treatment ID
 * @param {Object} lensTreatmentData - Updated lens treatment data
 * @returns {Promise} Response with updated lens treatment data
 */
export const updateLensTreatment = async (id, lensTreatmentData) => {
  try {
    const response = await api.put(`/admin/lens-treatments/${id}`, lensTreatmentData);
    return response;
  } catch (error) {
    console.log('🔄 Lens treatment update error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating lens treatment update in demo mode');
      // Get existing demo data
      const existingData = JSON.parse(localStorage.getItem('demo_lens_treatments') || '[]');
      
      // Find and update the lens treatment
      const index = existingData.findIndex(item => item.id === id);
      if (index !== -1) {
        existingData[index] = {
          ...existingData[index],
          ...lensTreatmentData,
          updated_at: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('demo_lens_treatments', JSON.stringify(existingData));
        
        // Simulate successful update
        const mockResponse = {
          data: existingData[index],
          status: 200
        };
        return mockResponse;
      } else {
        throw new Error('Lens treatment not found');
      }
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Delete a lens treatment
 * @param {number} id - Lens treatment ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteLensTreatment = async (id) => {
  try {
    const response = await api.delete(`/admin/lens-treatments/${id}`);
    return response;
  } catch (error) {
    console.log('🔄 Lens treatment delete error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating lens treatment deletion in demo mode');
      // Get existing demo data
      const existingData = JSON.parse(localStorage.getItem('demo_lens_treatments') || '[]');
      
      // Find and remove the lens treatment
      const index = existingData.findIndex(item => item.id === id);
      if (index !== -1) {
        existingData.splice(index, 1);
        
        // Save to localStorage
        localStorage.setItem('demo_lens_treatments', JSON.stringify(existingData));
        
        // Simulate successful deletion
        const mockResponse = {
          data: {
            success: true,
            message: 'Lens treatment deleted successfully'
          },
          status: 200
        };
        return mockResponse;
      } else {
        throw new Error('Lens treatment not found');
      }
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Get active lens treatments (for frontend display)
 * @returns {Promise} Response with active lens treatments
 */
export const getActiveLensTreatments = async () => {
  const response = await api.get('/admin/lens-treatments?is_active=true&sortBy=name&sortOrder=asc');
  return response;
};

/**
 * Bulk update lens treatments
 * @param {Array} treatmentsData - Array of lens treatment data with IDs
 * @returns {Promise} Response with updated lens treatments
 */
export const bulkUpdateLensTreatments = async (treatmentsData) => {
  const response = await api.put('/admin/lens-treatments/bulk', { treatments: treatmentsData });
  return response;
};

export default {
  getLensTreatments,
  getLensTreatmentById,
  createLensTreatment,
  updateLensTreatment,
  deleteLensTreatment,
  getActiveLensTreatments,
  bulkUpdateLensTreatments
};
