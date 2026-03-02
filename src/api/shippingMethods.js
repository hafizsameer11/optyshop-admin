import api from '../utils/api';

// Shipping Methods API service for admin panel
const shippingMethodsAPI = {
  // Get all shipping methods
  getAll: async () => {
    const response = await api.get('/admin/shipping-methods');
    return response.data?.data?.shippingMethods || response.data?.data?.shipping_methods || response.data?.data || response.data || [];
  },

  // Get shipping method by ID
  getById: async (id) => {
    const response = await api.get(`/admin/shipping-methods/${id}`);
    return response.data?.data?.shippingMethod || response.data?.data?.shipping_method || response.data?.data || response.data;
  },

  // Create new shipping method
  create: async (shippingData) => {
    const response = await api.post('/admin/shipping-methods', shippingData);
    return response.data?.data?.shippingMethod || response.data?.data?.shipping_method || response.data?.data || response.data;
  },

  // Update shipping method
  update: async (id, shippingData) => {
    const response = await api.put(`/admin/shipping-methods/${id}`, shippingData);
    return response.data?.data?.shippingMethod || response.data?.data?.shipping_method || response.data?.data || response.data;
  },

  // Delete shipping method
  delete: async (id) => {
    const response = await api.delete(`/admin/shipping-methods/${id}`);
    return response.data;
  },
};

export default shippingMethodsAPI;
