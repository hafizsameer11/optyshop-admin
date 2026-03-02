import api from '../utils/api';

// Navigation Menus API service for admin panel
const menusAPI = {
  // Get all menus
  getAll: async () => {
    const response = await api.get('/admin/menus');
    return response.data?.data?.menus || response.data?.data || response.data || [];
  },

  // Create new menu
  create: async (menuData) => {
    const response = await api.post('/admin/menus', menuData);
    return response.data?.data?.menu || response.data?.data || response.data;
  },

  // Get menu by ID
  getById: async (id) => {
    const response = await api.get(`/admin/menus/${id}`);
    return response.data?.data?.menu || response.data?.data || response.data;
  },

  // Update menu
  update: async (id, menuData) => {
    const response = await api.put(`/admin/menus/${id}`, menuData);
    return response.data?.data?.menu || response.data?.data || response.data;
  },

  // Delete menu
  delete: async (id) => {
    const response = await api.delete(`/admin/menus/${id}`);
    return response.data;
  },
};

export default menusAPI;
