import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://optyshop-frontend.hmstech.org/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
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
    
    // Handle rate limiting (429) - skip retry for auth/me to prevent cascading failures
    if (error.response?.status === 429) {
      const config = error.config;
      const isAuthMeEndpoint = config?.url?.includes('/auth/me');
      
      // For auth/me endpoint, don't retry - just fail gracefully
      if (isAuthMeEndpoint) {
        console.warn('Rate limited on /auth/me - skipping retry to prevent cascading failures');
        return Promise.reject(error);
      }
      
      // For other endpoints, use limited retry with exponential backoff
      const retryAfter = parseInt(error.response.headers['retry-after']) || 1;
      const retryCount = config.__retryCount || 0;
      const maxRetries = 2; // Reduced from 3 to 2
      
      if (retryCount < maxRetries) {
        config.__retryCount = retryCount + 1;
        const delay = retryAfter * 1000 * Math.pow(2, retryCount); // Exponential backoff
        
        console.log(`Rate limited. Retrying request in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the request
        return api(config);
      } else {
        console.warn(`Rate limit exceeded after ${maxRetries} retries. Request failed.`);
      }
    }
    
    // Only redirect to login for actual 401 responses, not network errors
    // But skip redirect if we're in demo mode
    if (error.response?.status === 401 && !isDemoMode) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    
    // Log network errors for debugging
    if (!error.response) {
      console.warn('Network error - API server may be unavailable:', error.message);
    }
    
    // Log 401 errors in demo mode
    if (error.response?.status === 401 && isDemoMode) {
      console.warn('API call blocked in demo mode - backend requires real authentication');
    }
    
    return Promise.reject(error);
  }
);

export default api;



