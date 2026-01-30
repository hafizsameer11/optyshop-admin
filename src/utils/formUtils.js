/**
 * Form Utilities
 * 
 * Utilities for working with form configs and submissions from the Postman collection
 * 
 * Usage:
 * import { getFormConfig, submitForm, validateFormData } from './utils/formUtils';
 */

import api from './api';
import { API_ROUTES } from '../config/apiRoutes';

/**
 * Form types available in the system
 */
export const FORM_TYPES = {
  CONTACT: 'contact',
  DEMO: 'demo',
  PRICING: 'pricing',
  JOB_APPLICATION: 'job-application',
  CREDENTIALS: 'credentials',
  SUPPORT: 'support',
};

/**
 * Get form configuration for a specific form type
 * @param {string} formType - One of FORM_TYPES values
 * @returns {Promise<Object>} Form configuration object
 */
export const getFormConfig = async (formType) => {
  try {
    const configRoute = API_ROUTES.FORMS[formType.toUpperCase()]?.CONFIG;
    if (!configRoute) {
      throw new Error(`Invalid form type: ${formType}`);
    }

    const response = await api.get(configRoute);
    return response.data?.data || response.data || {};
  } catch (error) {
    console.error(`Failed to fetch form config for ${formType}:`, error);
    throw error;
  }
};

/**
 * Submit a form
 * @param {string} formType - One of FORM_TYPES values
 * @param {Object|FormData} formData - Form data to submit
 * @param {Object} options - Additional options (headers, etc.)
 * @returns {Promise<Object>} Submission response
 */
export const submitForm = async (formType, formData, options = {}) => {
  try {
    const submitRoute = API_ROUTES.FORMS[formType.toUpperCase()]?.SUBMIT;
    if (!submitRoute) {
      throw new Error(`Invalid form type: ${formType}`);
    }

    const config = {
      headers: (typeof FormData !== 'undefined' && formData instanceof FormData) 
        ? {} // Let browser set Content-Type for FormData
        : { 'Content-Type': 'application/json' },
      ...options,
    };

    const response = await api.post(submitRoute, formData, config);
    return response.data?.data || response.data || {};
  } catch (error) {
    console.error(`Failed to submit form ${formType}:`, error);
    throw error;
  }
};

/**
 * Validate form data against form config
 * @param {Object} formData - Form data to validate
 * @param {Object} formConfig - Form configuration
 * @returns {Object} Validation result { isValid: boolean, errors: [] }
 */
export const validateFormData = (formData, formConfig) => {
  const errors = [];
  const fields = formConfig.fields || formConfig.schema || [];

  fields.forEach(field => {
    const value = formData[field.name || field.key];
    
    // Check required fields
    if (field.required && (!value || value.toString().trim() === '')) {
      errors.push({
        field: field.name || field.key,
        message: `${field.label || field.name} is required`,
      });
    }

    // Validate email format
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push({
        field: field.name || field.key,
        message: `${field.label || field.name} must be a valid email address`,
      });
    }

    // Validate phone format (basic)
    if (field.type === 'tel' && value && !/^[\d\s\-\+\(\)]+$/.test(value)) {
      errors.push({
        field: field.name || field.key,
        message: `${field.label || field.name} must be a valid phone number`,
      });
    }

    // Validate URL format
    if (field.type === 'url' && value && !/^https?:\/\/.+/.test(value)) {
      errors.push({
        field: field.name || field.key,
        message: `${field.label || field.name} must be a valid URL`,
      });
    }

    // Validate min/max length
    if (field.minLength && value && value.length < field.minLength) {
      errors.push({
        field: field.name || field.key,
        message: `${field.label || field.name} must be at least ${field.minLength} characters`,
      });
    }

    if (field.maxLength && value && value.length > field.maxLength) {
      errors.push({
        field: field.name || field.key,
        message: `${field.label || field.name} must be no more than ${field.maxLength} characters`,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get all form requests (admin only)
 * @param {string} requestType - Type of request (contact, demo, pricing, credentials, support)
 * @param {Object} params - Query parameters (page, limit, search, etc.)
 * @returns {Promise<Object>} Requests data with pagination
 */
export const getFormRequests = async (requestType, params = {}) => {
  try {
    const routeMap = {
      contact: API_ROUTES.ADMIN.CONTACT_REQUESTS.LIST,
      demo: API_ROUTES.ADMIN.DEMO_REQUESTS.LIST,
      pricing: API_ROUTES.ADMIN.PRICING_REQUESTS.LIST,
      credentials: API_ROUTES.ADMIN.CREDENTIALS_REQUESTS.LIST,
      support: API_ROUTES.ADMIN.SUPPORT_REQUESTS.LIST,
    };

    const route = routeMap[requestType.toLowerCase()];
    if (!route) {
      throw new Error(`Invalid request type: ${requestType}`);
    }

    const queryString = new URLSearchParams(params).toString();
    const url = `${route}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return {
      requests: response.data?.data?.requests || response.data?.requests || [],
      pagination: response.data?.data?.pagination || response.data?.pagination || {},
      count: response.data?.data?.count || response.data?.count || 0,
    };
  } catch (error) {
    console.error(`Failed to fetch ${requestType} requests:`, error);
    throw error;
  }
};

/**
 * Get a specific form request by ID (admin only)
 * @param {string} requestType - Type of request
 * @param {number} id - Request ID
 * @returns {Promise<Object>} Request data
 */
export const getFormRequestById = async (requestType, id) => {
  try {
    const routeMap = {
      contact: API_ROUTES.ADMIN.CONTACT_REQUESTS.BY_ID,
      demo: API_ROUTES.ADMIN.DEMO_REQUESTS.BY_ID,
      pricing: API_ROUTES.ADMIN.PRICING_REQUESTS.BY_ID,
      credentials: API_ROUTES.ADMIN.CREDENTIALS_REQUESTS.BY_ID,
      support: API_ROUTES.ADMIN.SUPPORT_REQUESTS.BY_ID,
    };

    const route = routeMap[requestType.toLowerCase()];
    if (!route) {
      throw new Error(`Invalid request type: ${requestType}`);
    }

    const response = await api.get(route(id));
    return response.data?.data || response.data || {};
  } catch (error) {
    console.error(`Failed to fetch ${requestType} request ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a form request (admin only)
 * @param {string} requestType - Type of request
 * @param {number} id - Request ID
 * @returns {Promise<Object>} Delete response
 */
export const deleteFormRequest = async (requestType, id) => {
  try {
    const routeMap = {
      contact: API_ROUTES.ADMIN.CONTACT_REQUESTS.DELETE,
      demo: API_ROUTES.ADMIN.DEMO_REQUESTS.DELETE,
      pricing: API_ROUTES.ADMIN.PRICING_REQUESTS.DELETE,
      credentials: API_ROUTES.ADMIN.CREDENTIALS_REQUESTS.DELETE,
      support: API_ROUTES.ADMIN.SUPPORT_REQUESTS.DELETE,
    };

    const route = routeMap[requestType.toLowerCase()];
    if (!route) {
      throw new Error(`Invalid request type: ${requestType}`);
    }

    const response = await api.delete(route(id));
    return response.data || {};
  } catch (error) {
    console.error(`Failed to delete ${requestType} request ${id}:`, error);
    throw error;
  }
};

/**
 * Prepare form data for submission
 * Handles file uploads and data formatting
 * @param {Object} formData - Raw form data
 * @param {Array} fileFields - Array of field names that contain files
 * @returns {FormData|Object} Prepared form data
 */
export const prepareFormData = (formData, fileFields = []) => {
  // Check if File constructor is available (might not be in some environments)
  const FileConstructor = typeof File !== 'undefined' ? File : null;
  
  const hasFiles = fileFields.some(field => {
    const value = formData[field];
    return (FileConstructor && value instanceof FileConstructor) || 
           (Array.isArray(value) && value.some(v => FileConstructor && v instanceof FileConstructor));
  });

  if (hasFiles) {
    const formDataObj = new FormData();
    
    Object.keys(formData).forEach(key => {
      const value = formData[key];
      
      if (FileConstructor && value instanceof FileConstructor) {
        formDataObj.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (FileConstructor && item instanceof FileConstructor) {
            formDataObj.append(`${key}[${index}]`, item);
          } else {
            formDataObj.append(`${key}[${index}]`, JSON.stringify(item));
          }
        });
      } else if (value !== null && value !== undefined) {
        formDataObj.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });
    
    return formDataObj;
  }

  return formData;
};

/**
 * Form field types mapping
 */
export const FORM_FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  TEL: 'tel',
  URL: 'url',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  FILE: 'file',
  DATE: 'date',
  NUMBER: 'number',
};

export default {
  FORM_TYPES,
  FORM_FIELD_TYPES,
  getFormConfig,
  submitForm,
  validateFormData,
  getFormRequests,
  getFormRequestById,
  deleteFormRequest,
  prepareFormData,
};

