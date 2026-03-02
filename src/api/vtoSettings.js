import api from '../utils/api';

// VTO Settings API service for admin panel (for Simulations page)
const vtoSettingsAPI = {
  // Get VTO settings
  get: async () => {
    const response = await api.get('/admin/vto-settings');
    return response.data?.data?.settings || response.data?.data || response.data;
  },

  // Update VTO settings
  update: async (settingsData) => {
    const response = await api.put('/admin/vto-settings', settingsData);
    return response.data?.data?.settings || response.data?.data || response.data;
  },
};

export default vtoSettingsAPI;
