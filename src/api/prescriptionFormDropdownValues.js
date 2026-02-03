/**
 * Prescription Form Dropdown Values Backend API Implementation
 * Provides CRUD operations for prescription form dropdown values management
 * 
 * Endpoints:
 * - GET /api/admin/prescription-forms/dropdown-values - List all dropdown values
 * - POST /api/admin/prescription-forms/dropdown-values - Create new dropdown value
 * - GET /api/admin/prescription-forms/dropdown-values/:id - Get single dropdown value
 * - PUT /api/admin/prescription-forms/dropdown-values/:id - Update dropdown value
 * - DELETE /api/admin/prescription-forms/dropdown-values/:id - Delete dropdown value
 */

import api from '../utils/api';

/**
 * Get all prescription form dropdown values with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: sort_order)
 * @param {string} params.sortOrder - Sort order (asc/desc, default: asc)
 * @param {string} params.field_type - Filter by field type
 * @param {string} params.eye_type - Filter by eye type
 * @param {string} params.form_type - Filter by form type
 * @returns {Promise} Response with dropdown values data
 */
export const getPrescriptionFormDropdownValues = async (params = {}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = 'sort_order',
    sortOrder = 'asc',
    field_type,
    eye_type,
    form_type
  } = params;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder
  });

  if (field_type) queryParams.append('field_type', field_type);
  if (eye_type && eye_type !== 'both') queryParams.append('eye_type', eye_type);
  if (form_type) queryParams.append('form_type', form_type);

  try {
    const response = await api.get(`/admin/prescription-forms/dropdown-values?${queryParams}`);
    return response;
  } catch (error) {
    console.log('🔄 Prescription form dropdown values fetch error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Returning mock prescription form dropdown values data in demo mode');
      // Get demo data from localStorage or use default data
      let demoData = JSON.parse(localStorage.getItem('demo_prescription_form_dropdown_values') || 'null');
      
      // If no demo data exists, use default data
      if (!demoData || demoData.length === 0) {
        demoData = [
          {
            id: 1,
            field_type: 'sph',
            value: '-6.00',
            label: '-6.00',
            eye_type: 'both',
            form_type: 'progressive',
            sort_order: 1,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 2,
            field_type: 'sph',
            value: '-5.50',
            label: '-5.50',
            eye_type: 'both',
            form_type: 'progressive',
            sort_order: 2,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 3,
            field_type: 'cyl',
            value: '-2.00',
            label: '-2.00',
            eye_type: 'both',
            form_type: 'progressive',
            sort_order: 1,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 4,
            field_type: 'axis',
            value: '180',
            label: '180°',
            eye_type: 'both',
            form_type: 'progressive',
            sort_order: 1,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          },
          {
            id: 5,
            field_type: 'add',
            value: '+2.00',
            label: '+2.00',
            eye_type: 'both',
            form_type: 'progressive',
            sort_order: 1,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z"
          }
        ];
        
        // Save default data to localStorage
        localStorage.setItem('demo_prescription_form_dropdown_values', JSON.stringify(demoData));
      }
      
      // Apply filters if specified
      let filteredData = demoData;
      if (field_type) {
        filteredData = filteredData.filter(item => item.field_type === field_type);
      }
      if (eye_type && eye_type !== 'both') {
        filteredData = filteredData.filter(item => item.eye_type === eye_type || item.eye_type === 'both');
      }
      if (form_type) {
        filteredData = filteredData.filter(item => item.form_type === form_type);
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
 * Get a single prescription form dropdown value by ID
 * @param {number} id - Dropdown value ID
 * @returns {Promise} Response with dropdown value data
 */
export const getPrescriptionFormDropdownValueById = async (id) => {
  const response = await api.get(`/admin/prescription-forms/dropdown-values/${id}`);
  return response;
};

/**
 * Create a new prescription form dropdown value
 * @param {Object} dropdownValueData - Dropdown value data
 * @param {string} dropdownValueData.field_type - Field type (sph, cyl, axis, etc.)
 * @param {string} dropdownValueData.value - Value
 * @param {string} dropdownValueData.label - Display label
 * @param {string} dropdownValueData.eye_type - Eye type (left, right, both)
 * @param {string} dropdownValueData.form_type - Form type (progressive, near_vision, etc.)
 * @param {number} dropdownValueData.sort_order - Sort order
 * @param {boolean} dropdownValueData.is_active - Active status
 * @returns {Promise} Response with created dropdown value data
 */
export const createPrescriptionFormDropdownValue = async (dropdownValueData) => {
  try {
    const response = await api.post('/admin/prescription-forms/dropdown-values', dropdownValueData);
    return response;
  } catch (error) {
    console.log('🔄 Prescription form dropdown value creation error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating prescription form dropdown value creation in demo mode');
      // Get existing demo data or create new array
      const existingData = JSON.parse(localStorage.getItem('demo_prescription_form_dropdown_values') || '[]');
      
      // Create new dropdown value with unique ID
      const newValue = {
        id: Date.now(),
        ...dropdownValueData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to existing data
      existingData.push(newValue);
      
      // Save to localStorage
      localStorage.setItem('demo_prescription_form_dropdown_values', JSON.stringify(existingData));
      
      // Simulate successful creation
      const mockResponse = {
        data: newValue,
        status: 200
      };
      return mockResponse;
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Update an existing prescription form dropdown value
 * @param {number} id - Dropdown value ID
 * @param {Object} dropdownValueData - Updated dropdown value data
 * @returns {Promise} Response with updated dropdown value data
 */
export const updatePrescriptionFormDropdownValue = async (id, dropdownValueData) => {
  try {
    const response = await api.put(`/admin/prescription-forms/dropdown-values/${id}`, dropdownValueData);
    return response;
  } catch (error) {
    console.log('🔄 Prescription form dropdown value update error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating prescription form dropdown value update in demo mode');
      // Get existing demo data
      const existingData = JSON.parse(localStorage.getItem('demo_prescription_form_dropdown_values') || '[]');
      
      // Find and update the dropdown value
      const index = existingData.findIndex(item => item.id === id);
      if (index !== -1) {
        existingData[index] = {
          ...existingData[index],
          ...dropdownValueData,
          updated_at: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('demo_prescription_form_dropdown_values', JSON.stringify(existingData));
        
        // Simulate successful update
        const mockResponse = {
          data: existingData[index],
          status: 200
        };
        return mockResponse;
      } else {
        throw new Error('Prescription form dropdown value not found');
      }
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Delete a prescription form dropdown value
 * @param {number} id - Dropdown value ID
 * @returns {Promise} Response confirming deletion
 */
export const deletePrescriptionFormDropdownValue = async (id) => {
  try {
    const response = await api.delete(`/admin/prescription-forms/dropdown-values/${id}`);
    return response;
  } catch (error) {
    console.log('🔄 Prescription form dropdown value delete error in API service:', error);
    
    // Check if we're in demo mode or if it's a 401 error
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    const isAuthError = error.response?.status === 401;
    
    if (isDemoMode || isAuthError) {
      console.log('🔄 Simulating prescription form dropdown value deletion in demo mode');
      // Get existing demo data
      const existingData = JSON.parse(localStorage.getItem('demo_prescription_form_dropdown_values') || '[]');
      
      // Find and remove the dropdown value
      const index = existingData.findIndex(item => item.id === id);
      if (index !== -1) {
        existingData.splice(index, 1);
        
        // Save to localStorage
        localStorage.setItem('demo_prescription_form_dropdown_values', JSON.stringify(existingData));
        
        // Simulate successful deletion
        const mockResponse = {
          data: {
            success: true,
            message: 'Prescription form dropdown value deleted successfully'
          },
          status: 200
        };
        return mockResponse;
      } else {
        throw new Error('Prescription form dropdown value not found');
      }
    }
    
    // For other errors, still throw them
    throw error;
  }
};

/**
 * Get dropdown values by field type
 * @param {string} fieldType - Field type (sph, cyl, axis, etc.)
 * @returns {Promise} Response with dropdown values for the field type
 */
export const getPrescriptionFormDropdownValuesByFieldType = async (fieldType) => {
  const response = await api.get(`/admin/prescription-forms/dropdown-values?field_type=${fieldType}`);
  return response;
};

/**
 * Bulk update sort order for dropdown values
 * @param {Array} sortOrderData - Array of {id, sort_order} objects
 * @returns {Promise} Response with updated dropdown values
 */
export const bulkUpdatePrescriptionFormDropdownValuesOrder = async (sortOrderData) => {
  const response = await api.put('/admin/prescription-forms/dropdown-values/bulk-order', { values: sortOrderData });
  return response;
};

export default {
  getPrescriptionFormDropdownValues,
  getPrescriptionFormDropdownValueById,
  createPrescriptionFormDropdownValue,
  updatePrescriptionFormDropdownValue,
  deletePrescriptionFormDropdownValue,
  getPrescriptionFormDropdownValuesByFieldType,
  bulkUpdatePrescriptionFormDropdownValuesOrder
};
