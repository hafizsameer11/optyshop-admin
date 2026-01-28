import api from '../utils/api';

// Banner API service for admin panel
const bannerAPI = {
  // Get all banners with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters if provided
    if (filters.page_type) queryParams.append('page_type', filters.page_type);
    if (filters.category_id) queryParams.append('category_id', filters.category_id);
    if (filters.sub_category_id) queryParams.append('sub_category_id', filters.sub_category_id);
    
    const url = queryParams.toString() ? `/admin/banners?${queryParams.toString()}` : '/admin/banners';
    const response = await api.get(url);
    
    // Handle different response structures
    if (response.data?.data?.banners) {
      return response.data.data.banners;
    } else if (response.data?.data) {
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.banners) {
      return response.data.banners;
    }
    
    return [];
  },

  // Get banner by ID
  getById: async (id) => {
    const response = await api.get(`/admin/banners/${id}`);
    return response.data?.data?.banner || response.data?.data || response.data;
  },

  // Create new banner
  create: async (formData) => {
    const response = await api.post('/admin/banners', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data?.banner || response.data?.data || response.data;
  },

  // Update banner
  update: async (id, formData) => {
    const response = await api.put(`/admin/banners/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data?.banner || response.data?.data || response.data;
  },

  // Delete banner
  delete: async (id) => {
    const response = await api.delete(`/admin/banners/${id}`);
    return response.data;
  },

  // Get banners for public API (website)
  getPublicBanners: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.page_type) queryParams.append('page_type', filters.page_type);
    if (filters.category_id) queryParams.append('category_id', filters.category_id);
    if (filters.sub_category_id) queryParams.append('sub_category_id', filters.sub_category_id);
    
    const url = queryParams.toString() ? `/banners?${queryParams.toString()}` : '/banners';
    const response = await api.get(url);
    
    // Handle different response structures
    if (response.data?.data?.banners) {
      return response.data.data.banners;
    } else if (response.data?.data) {
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.banners) {
      return response.data.banners;
    }
    
    return [];
  },
};

export default bannerAPI;
