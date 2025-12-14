/**
 * API Routes Usage Examples
 * 
 * This file demonstrates how to use the API_ROUTES configuration
 * in your components and services.
 */

import { API_ROUTES, buildQueryString, QUERY_PARAMS } from './apiRoutes';
import api from '../utils/api';

// ============================================
// EXAMPLE USAGE IN COMPONENTS
// ============================================

// Example 1: Simple GET request
export const fetchProducts = async () => {
  const response = await api.get(API_ROUTES.PRODUCTS.LIST);
  return response.data;
};

// Example 2: GET with query parameters
export const fetchProductsWithFilters = async (filters) => {
  const url = buildQueryString(API_ROUTES.PRODUCTS.LIST, {
    [QUERY_PARAMS.PAGE]: filters.page || 1,
    [QUERY_PARAMS.LIMIT]: filters.limit || 12,
    [QUERY_PARAMS.FRAME_SHAPE]: filters.frameShape,
    [QUERY_PARAMS.MIN_PRICE]: filters.minPrice,
    [QUERY_PARAMS.MAX_PRICE]: filters.maxPrice,
  });
  
  const response = await api.get(url);
  return response.data;
};

// Example 3: GET with dynamic ID
export const fetchProductById = async (productId) => {
  const response = await api.get(API_ROUTES.PRODUCTS.BY_ID(productId));
  return response.data;
};

// Example 4: POST request
export const createOrder = async (orderData) => {
  const response = await api.post(API_ROUTES.ORDERS.CREATE, orderData);
  return response.data;
};

// Example 5: PUT request
export const updateProduct = async (productId, productData) => {
  const response = await api.put(
    API_ROUTES.ADMIN.PRODUCTS.UPDATE(productId),
    productData
  );
  return response.data;
};

// Example 6: DELETE request
export const deleteProduct = async (productId) => {
  const response = await api.delete(
    API_ROUTES.ADMIN.PRODUCTS.DELETE(productId)
  );
  return response.data;
};

// Example 7: Using nested routes (Forms)
export const submitContactForm = async (formData) => {
  const response = await api.post(
    API_ROUTES.FORMS.CONTACT.SUBMIT,
    formData
  );
  return response.data;
};

// Example 8: Admin dashboard with query params
export const fetchDashboardStats = async (range = 30) => {
  const url = buildQueryString(API_ROUTES.ADMIN.DASHBOARD, {
    [QUERY_PARAMS.RANGE]: range,
  });
  
  const response = await api.get(url);
  return response.data;
};

// Example 9: Simulations API
export const calculatePD = async (pdData) => {
  const response = await api.post(
    API_ROUTES.SIMULATIONS.CALCULATE_PD,
    pdData
  );
  return response.data;
};

// Example 10: Admin configs (for Simulations page)
export const fetchConfigs = async () => {
  const response = await api.get(API_ROUTES.ADMIN.CONFIGS.LIST);
  return response.data;
};

export const createConfig = async (configData) => {
  const response = await api.post(
    API_ROUTES.ADMIN.CONFIGS.CREATE,
    configData
  );
  return response.data;
};

export const updateConfig = async (configId, configData) => {
  const response = await api.put(
    API_ROUTES.ADMIN.CONFIGS.UPDATE(configId),
    configData
  );
  return response.data;
};

export const deleteConfig = async (configId) => {
  const response = await api.delete(
    API_ROUTES.ADMIN.CONFIGS.DELETE(configId)
  );
  return response.data;
};

// Example 11: VTO Settings (for Simulations page)
export const fetchVTOSettings = async () => {
  const response = await api.get(API_ROUTES.ADMIN.VTO_SETTINGS.GET);
  return response.data;
};

export const updateVTOSettings = async (settings) => {
  const response = await api.put(
    API_ROUTES.ADMIN.VTO_SETTINGS.UPDATE,
    settings
  );
  return response.data;
};

// Example 12: Marketing - Coupons
export const fetchCoupons = async () => {
  const response = await api.get(API_ROUTES.MARKETING.COUPONS.LIST);
  return response.data;
};

// Example 13: CMS - Blog Posts
export const fetchBlogPosts = async () => {
  const response = await api.get(API_ROUTES.CMS.BLOG.LIST);
  return response.data;
};

// Example 14: Analytics
export const fetchSalesAnalytics = async (period = 'month') => {
  const url = buildQueryString(API_ROUTES.ANALYTICS.SALES, {
    [QUERY_PARAMS.PERIOD]: period,
  });
  
  const response = await api.get(url);
  return response.data;
};

// ============================================
// USAGE IN REACT COMPONENTS
// ============================================

/*
// In your React component:

import { useEffect, useState } from 'react';
import { fetchProducts, fetchProductById } from '../services/productService';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };
    
    loadProducts();
  }, []);
  
  // ... rest of component
};
*/

