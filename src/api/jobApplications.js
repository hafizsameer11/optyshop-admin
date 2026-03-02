import api from '../utils/api';

// Job Applications API service for admin panel
const jobApplicationsAPI = {
  // Get all job applications
  getAll: async () => {
    const response = await api.get('/admin/job-applications');
    return response.data?.data?.jobApplications || response.data?.data?.job_applications || response.data?.data || response.data || [];
  },

  // Get job application by ID
  getById: async (id) => {
    const response = await api.get(`/admin/job-applications/${id}`);
    return response.data?.data?.jobApplication || response.data?.data?.job_application || response.data?.data || response.data;
  },

  // Update job application status
  updateStatus: async (id, status) => {
    const response = await api.put(`/admin/job-applications/${id}/status`, { status });
    return response.data?.data?.jobApplication || response.data?.data?.job_application || response.data?.data || response.data;
  },

  // Accept job application
  accept: async (id) => {
    const response = await api.put(`/admin/job-applications/${id}/accept`);
    return response.data?.data?.jobApplication || response.data?.data?.job_application || response.data?.data || response.data;
  },

  // Reject job application
  reject: async (id) => {
    const response = await api.put(`/admin/job-applications/${id}/reject`);
    return response.data?.data?.jobApplication || response.data?.data?.job_application || response.data?.data || response.data;
  },

  // Delete job application
  delete: async (id) => {
    const response = await api.delete(`/admin/job-applications/${id}`);
    return response.data;
  },
};

export default jobApplicationsAPI;
