/**
 * Postman Collection Validator
 * 
 * Utility to validate API routes against the Postman collection
 * and ensure all endpoints are properly integrated.
 * 
 * Usage:
 * import { validateRoutesAgainstPostman, getEndpointFromPostman } from './utils/postmanValidator';
 */

// Import Postman collection (may need to be loaded dynamically in some environments)
let postmanCollection = null;

try {
  // Try to import the Postman collection
  // Note: In production, you may want to load this dynamically or exclude it
  postmanCollection = require('../../OptyShop_API.postman_collection.json');
} catch (error) {
  console.warn('Postman collection not found. Validation features will be limited.');
}

/**
 * Extract all endpoints from Postman collection
 * @returns {Array} Array of endpoint objects with method, path, and name
 */
export const extractEndpointsFromPostman = () => {
  if (!postmanCollection) {
    console.warn('Postman collection not loaded');
    return [];
  }

  const endpoints = [];

  const traverseItems = (items, parentPath = []) => {
    if (!items || !Array.isArray(items)) return;

    items.forEach(item => {
      if (item.request) {
        // Extract endpoint information
        const method = item.request.method || 'GET';
        const pathArray = item.request.url?.path || [];
        const fullPath = pathArray.join('/');
        
        endpoints.push({
          name: item.name,
          method: method.toUpperCase(),
          path: fullPath,
          fullPath: `/${fullPath}`,
          description: item.request.description || '',
          auth: item.request.header?.find(h => h.key === 'Authorization')?.value || 'PUBLIC',
        });
      }

      // Recursively traverse nested items
      if (item.item) {
        traverseItems(item.item, [...parentPath, item.name]);
      }
    });
  };

  traverseItems(postmanCollection.item);
  return endpoints;
};

/**
 * Get endpoint details from Postman collection by path and method
 * @param {string} path - API path (e.g., 'admin/products')
 * @param {string} method - HTTP method (e.g., 'GET', 'POST')
 * @returns {Object|null} Endpoint details or null if not found
 */
export const getEndpointFromPostman = (path, method = 'GET') => {
  const endpoints = extractEndpointsFromPostman();
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  
  return endpoints.find(
    ep => ep.path === normalizedPath && ep.method === method.toUpperCase()
  ) || null;
};

/**
 * Validate API_ROUTES against Postman collection
 * @param {Object} apiRoutes - API_ROUTES object from apiRoutes.js
 * @returns {Object} Validation results
 */
export const validateRoutesAgainstPostman = (apiRoutes) => {
  const postmanEndpoints = extractEndpointsFromPostman();
  const missingEndpoints = [];
  const extraEndpoints = [];

  // Helper to flatten API_ROUTES
  const flattenRoutes = (obj, prefix = '') => {
    const routes = [];
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      if (typeof value === 'string') {
        routes.push({
          key: prefix ? `${prefix}.${key}` : key,
          path: value,
        });
      } else if (typeof value === 'function') {
        // Skip functions (they're helpers like BY_ID(id))
        routes.push({
          key: prefix ? `${prefix}.${key}` : key,
          path: value.toString(), // Mark as function
          isFunction: true,
        });
      } else if (typeof value === 'object' && value !== null) {
        routes.push(...flattenRoutes(value, prefix ? `${prefix}.${key}` : key));
      }
    });
    
    return routes;
  };

  const definedRoutes = flattenRoutes(apiRoutes);
  
  // Check for missing endpoints in API_ROUTES
  postmanEndpoints.forEach(postmanEp => {
    const found = definedRoutes.some(route => {
      if (route.isFunction) return false; // Skip function helpers
      const routePath = route.path.startsWith('/') ? route.path.slice(1) : route.path;
      return routePath === postmanEp.path;
    });
    
    if (!found && postmanEp.path.includes('admin')) {
      // Only flag admin endpoints as missing (public endpoints might be intentionally excluded)
      missingEndpoints.push({
        name: postmanEp.name,
        method: postmanEp.method,
        path: postmanEp.path,
        description: postmanEp.description,
      });
    }
  });

  return {
    totalPostmanEndpoints: postmanEndpoints.length,
    totalDefinedRoutes: definedRoutes.filter(r => !r.isFunction).length,
    missingEndpoints,
    extraEndpoints,
    isValid: missingEndpoints.length === 0,
  };
};

/**
 * Get all admin endpoints from Postman collection
 * @returns {Array} Array of admin endpoint objects
 */
export const getAdminEndpointsFromPostman = () => {
  return extractEndpointsFromPostman().filter(ep => 
    ep.path.includes('admin') || ep.auth.includes('admin_token')
  );
};

/**
 * Get endpoint examples from Postman collection
 * @param {string} path - API path
 * @param {string} method - HTTP method
 * @returns {Object|null} Example request body and headers
 */
export const getEndpointExample = (path, method = 'GET') => {
  const endpoint = getEndpointFromPostman(path, method);
  if (!endpoint) return null;

  // This would require parsing the full Postman collection structure
  // For now, return basic info
  return {
    path: endpoint.fullPath,
    method: endpoint.method,
    description: endpoint.description,
    auth: endpoint.auth,
  };
};

export default {
  extractEndpointsFromPostman,
  getEndpointFromPostman,
  validateRoutesAgainstPostman,
  getAdminEndpointsFromPostman,
  getEndpointExample,
};

