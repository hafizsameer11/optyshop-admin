import api from '../utils/api';

// Coupons API service for admin panel
const couponsAPI = {
  // Get all coupons
  getAll: async () => {
    const response = await api.get('/admin/coupons');
    return response.data?.data?.coupons || response.data?.data || response.data || [];
  },

  // Get coupon by ID
  getById: async (id) => {
    const response = await api.get(`/admin/coupons/${id}`);
    return response.data?.data?.coupon || response.data?.data || response.data;
  },

  // Create new coupon
  create: async (couponData) => {
    const response = await api.post('/admin/coupons', couponData);
    return response.data?.data?.coupon || response.data?.data || response.data;
  },

  // Update coupon
  update: async (id, couponData) => {
    const response = await api.put(`/admin/coupons/${id}`, couponData);
    return response.data?.data?.coupon || response.data?.data || response.data;
  },

  // Delete coupon
  delete: async (id) => {
    const response = await api.delete(`/admin/coupons/${id}`);
    return response.data;
  },
};

export default couponsAPI;
