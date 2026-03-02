import api from '../utils/api';

// Pages API service for admin panel
const pagesAPI = {
  // Get all pages
  getAll: async () => {
    const response = await api.get('/admin/pages');
    return response.data?.data?.pages || response.data?.data || response.data || [];
  },

  // Get page by ID
  getById: async (id) => {
    const response = await api.get(`/admin/pages/${id}`);
    return response.data?.data?.page || response.data?.data || response.data;
  },

  // Create new page
  create: async (pageData) => {
    const response = await api.post('/admin/pages', pageData);
    return response.data?.data?.page || response.data?.data || response.data;
  },

  // Update page
  update: async (id, pageData) => {
    const response = await api.put(`/admin/pages/${id}`, pageData);
    return response.data?.data?.page || response.data?.data || response.data;
  },

  // Delete page
  delete: async (id) => {
    const response = await api.delete(`/admin/pages/${id}`);
    return response.data;
  },
};

export default pagesAPI;
