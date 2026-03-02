import api from '../utils/api';

// Testimonials API service for admin panel
const testimonialsAPI = {
  // Get all testimonials
  getAll: async () => {
    const response = await api.get('/admin/testimonials');
    return response.data?.data?.testimonials || response.data?.data || response.data || [];
  },

  // Get testimonial by ID
  getById: async (id) => {
    const response = await api.get(`/admin/testimonials/${id}`);
    return response.data?.data?.testimonial || response.data?.data || response.data;
  },

  // Create new testimonial
  create: async (testimonialData) => {
    const response = await api.post('/admin/testimonials', testimonialData);
    return response.data?.data?.testimonial || response.data?.data || response.data;
  },

  // Update testimonial
  update: async (id, testimonialData) => {
    const response = await api.put(`/admin/testimonials/${id}`, testimonialData);
    return response.data?.data?.testimonial || response.data?.data || response.data;
  },

  // Delete testimonial
  delete: async (id) => {
    const response = await api.delete(`/admin/testimonials/${id}`);
    return response.data;
  },
};

export default testimonialsAPI;
