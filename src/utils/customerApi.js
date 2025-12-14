/**
 * Customer API Client
 * Uses access_token for customer authentication (not admin_token)
 * For use in customer-facing website and customer dashboard
 */
import axios from 'axios';

const customerApi = axios.create({
  baseURL: 'https://optyshop-frontend.hmstech.org/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add customer access_token
customerApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData
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
customerApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle rate limiting (429) with automatic retry
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after']) || 1;
      const config = error.config;
      
      const retryCount = config.__retryCount || 0;
      const maxRetries = 3;
      
      if (retryCount < maxRetries) {
        config.__retryCount = retryCount + 1;
        const delay = retryAfter * 1000 * Math.pow(2, retryCount);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return customerApi(config);
      }
    }
    
    // Redirect to login for 401 responses
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      // Redirect to customer login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/customer/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default customerApi;

