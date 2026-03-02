import api from '../utils/api';

// Users API service for admin panel
const usersAPI = {
  // Get all users
  getAll: async () => {
    const response = await api.get('/admin/users');
    return response.data?.data?.users || response.data?.data || response.data || [];
  },

  // Get user by ID
  getById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data?.data?.user || response.data?.data || response.data;
  },

  // Create new user (admin)
  create: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data?.data?.user || response.data?.data || response.data;
  },

  // Update user
  update: async (id, userData) => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data?.data?.user || response.data?.data || response.data;
  },

  // Delete user
  delete: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
};

export default usersAPI;
