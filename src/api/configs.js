import api from '../utils/api';

// Configs API service for admin panel (for Simulations page)
const configsAPI = {
  // Get all configs
  getAll: async () => {
    const response = await api.get('/admin/configs');
    return response.data?.data?.configs || response.data?.data || response.data || [];
  },

  // Create new config
  create: async (configData) => {
    const response = await api.post('/admin/configs', configData);
    return response.data?.data?.config || response.data?.data || response.data;
  },

  // Update config
  update: async (id, configData) => {
    const response = await api.put(`/admin/configs/${id}`, configData);
    return response.data?.data?.config || response.data?.data || response.data;
  },

  // Delete config
  delete: async (id) => {
    const response = await api.delete(`/admin/configs/${id}`);
    return response.data;
  },
};

export default configsAPI;
