import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://optyshop-frontend.hmstech.org/api',
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
    if (config.data instanceof FormData) {
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
    // But skip redirect if we're in demo mode OR if it's a frame size operation
    const isFrameSizeOperation = error.config?.url?.includes('/frame-sizes');
    if (error.response?.status === 401 && !isDemoMode && !isFrameSizeOperation) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    
    // Log network errors for debugging
    if (!error.response) {
      console.warn('Network error - API server may be unavailable:', error.message);
    }
    
    // Log 401 errors in demo mode or for frame size operations
    if (error.response?.status === 401 && (isDemoMode || isFrameSizeOperation)) {
      console.warn('API call blocked in demo mode - backend requires real authentication');
    }
    
    return Promise.reject(error);
  }
);

export default api;



