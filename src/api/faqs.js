import api from '../utils/api';

// FAQs API service for admin panel
const faqsAPI = {
  // Get all FAQs
  getAll: async () => {
    const response = await api.get('/admin/faqs');
    return response.data?.data?.faqs || response.data?.data || response.data || [];
  },

  // Get FAQ by ID
  getById: async (id) => {
    const response = await api.get(`/admin/faqs/${id}`);
    return response.data?.data?.faq || response.data?.data || response.data;
  },

  // Create new FAQ
  create: async (faqData) => {
    const response = await api.post('/admin/faqs', faqData);
    return response.data?.data?.faq || response.data?.data || response.data;
  },

  // Update FAQ
  update: async (id, faqData) => {
    const response = await api.put(`/admin/faqs/${id}`, faqData);
    return response.data?.data?.faq || response.data?.data || response.data;
  },

  // Delete FAQ
  delete: async (id) => {
    const response = await api.delete(`/admin/faqs/${id}`);
    return response.data;
  },
};

export default faqsAPI;
