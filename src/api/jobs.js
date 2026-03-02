import api from '../utils/api';

// Jobs API service for admin panel
const jobsAPI = {
  // Get all jobs (including inactive ones) with application counts
  getAll: async () => {
    const response = await api.get('/admin/jobs');
    return response.data?.data?.jobs || response.data?.data || response.data || [];
  },

  // Get job by ID
  getById: async (id) => {
    const response = await api.get(`/admin/jobs/${id}`);
    return response.data?.data?.job || response.data?.data || response.data;
  },

  // Create new job
  create: async (jobData) => {
    const response = await api.post('/admin/jobs', jobData);
    return response.data?.data?.job || response.data?.data || response.data;
  },

  // Update job
  update: async (id, jobData) => {
    const response = await api.put(`/admin/jobs/${id}`, jobData);
    return response.data?.data?.job || response.data?.data || response.data;
  },

  // Delete job
  delete: async (id) => {
    const response = await api.delete(`/admin/jobs/${id}`);
    return response.data;
  },
};

export default jobsAPI;
