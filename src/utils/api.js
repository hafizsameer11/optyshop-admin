import axios from 'axios';

const api = axios.create({
  baseURL: 'https://optyshop-frontend.hmstech.org/api',
  headers: {
    'Content-Type': 'application/json',
  },
});


// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Check if we're in demo mode (using demo credentials)
    const isDemoMode = localStorage.getItem('demo_user') !== null;
    
    // Check for "Route not found" errors
    const errorMessage = error.response?.data?.message || '';
    const isRouteNotFound = error.response?.status === 404 || 
                           errorMessage?.toLowerCase().includes('route not found');
    
    // Suppress 404 errors for /auth/me endpoint (route might not exist in all setups)
    const isAuthMeEndpoint = error.config?.url?.includes('/auth/me');
    if (isRouteNotFound && isAuthMeEndpoint) {
      // Silently handle 404 for auth/me - just return the error without logging
      return Promise.reject(error);
    }
    
    // Handle rate limiting (429) - no retries, fail immediately
    if (error.response?.status === 429) {
      // Silently fail - no retries for rate limited requests
      // Suppress console errors for rate limiting
      error.suppressErrorLog = true;
      return Promise.reject(error);
    }
    
    // Only redirect to login for actual 401 responses, not network errors
    // But skip redirect if we're in demo mode OR if it's any admin CRUD operation
    const isAdminCRUDOperation = error.config?.url?.includes('/admin/') && (
      error.config?.url?.includes('/frame-sizes') ||
      error.config?.url?.includes('/lens-options') ||
      error.config?.url?.includes('/lens-coatings') ||
      error.config?.url?.includes('/lens-colors') ||
      error.config?.url?.includes('/lens-finishes') ||
      error.config?.url?.includes('/lens-thickness-materials') ||
      error.config?.url?.includes('/lens-thickness-options') ||
      error.config?.url?.includes('/lens-treatments') ||
      error.config?.url?.includes('/lens-types') ||
      error.config?.url?.includes('/photochromic-lenses') ||
      error.config?.url?.includes('/prescription-form-dropdown-values') ||
      error.config?.url?.includes('/prescription-lens-types') ||
      error.config?.url?.includes('/prescription-lens-variants') ||
      error.config?.url?.includes('/prescription-sun-lenses') ||
      error.config?.url?.includes('/mm-calibers') ||
      error.config?.url?.includes('/banners') ||
      error.config?.url?.includes('/brands') ||
      error.config?.url?.includes('/categories') ||
      error.config?.url?.includes('/subcategories') ||
      error.config?.url?.includes('/coupons') ||
      error.config?.url?.includes('/campaigns') ||
      error.config?.url?.includes('/flash-offers') ||
      error.config?.url?.includes('/free-gifts') ||
      error.config?.url?.includes('/jobs') ||
      error.config?.url?.includes('/menu-items') ||
      error.config?.url?.includes('/menus') ||
      error.config?.url?.includes('/pages') ||
      error.config?.url?.includes('/testimonials') ||
      error.config?.url?.includes('/users') ||
      error.config?.url?.includes('/shipping-methods') ||
      error.config?.url?.includes('/blog-posts') ||
      error.config?.url?.includes('/faqs')
    );
    
    // Enhanced check for admin operations - also check if it's any admin endpoint
    const isAdminEndpoint = error.config?.url?.includes('/admin/');
    
    // Only redirect for 401 errors if:
    // 1. Not in demo mode
    // 2. Not an admin CRUD operation (these should handle their own auth)
    // 3. Not a network error (backend unavailable)
    const isNetworkError = !error.response;
    const shouldRedirect = error.response?.status === 401 && 
                         !isDemoMode && 
                         !isAdminCRUDOperation &&
                         !isNetworkError;
    
    if (shouldRedirect) {
      console.warn('Authentication failed - redirecting to login');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('demo_user');
      window.location.href = '/login';
    }
    
    // Log network errors for debugging
    if (!error.response) {
      console.warn('Network error - API server may be unavailable:', error.message);
    }
    
    // Log 401 errors in demo mode or for admin CRUD operations
    if (error.response?.status === 401 && (isDemoMode || isAdminCRUDOperation || isAdminEndpoint)) {
      console.warn('API call blocked in demo mode or admin operation - backend requires real authentication');
      // Mark error as suppressed to prevent duplicate error handling
      error.suppressErrorLog = true;
    }
    
    return Promise.reject(error);
  }
);

export default api;



