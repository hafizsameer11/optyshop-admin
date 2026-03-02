import api from '../utils/api';

// Menu Items API service for admin panel
const menuItemsAPI = {
  // Get all menu items
  getAll: async () => {
    const response = await api.get('/admin/menu-items');
    return response.data?.data?.menuItems || response.data?.data?.menu_items || response.data?.data || response.data || [];
  },

  // Create new menu item
  create: async (menuItemData) => {
    const response = await api.post('/admin/menu-items', menuItemData);
    return response.data?.data?.menuItem || response.data?.data?.menu_item || response.data?.data || response.data;
  },

  // Get menu item by ID
  getById: async (id) => {
    const response = await api.get(`/admin/menu-items/${id}`);
    return response.data?.data?.menuItem || response.data?.data?.menu_item || response.data?.data || response.data;
  },

  // Update menu item
  update: async (id, menuItemData) => {
    const response = await api.put(`/admin/menu-items/${id}`, menuItemData);
    return response.data?.data?.menuItem || response.data?.data?.menu_item || response.data?.data || response.data;
  },

  // Delete menu item
  delete: async (id) => {
    const response = await api.delete(`/admin/menu-items/${id}`);
    return response.data;
  },
};

export default menuItemsAPI;
