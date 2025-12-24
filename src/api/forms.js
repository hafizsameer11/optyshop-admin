import api from '../utils/api';
import axios from 'axios';
import { API_ROUTES } from '../config/apiRoutes';

// Helper to build query string
const buildQuery = (params) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
};

// Public API client for endpoints that don't require authentication
const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://optyshop-frontend.hmstech.org/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const formsApi = {
    getContactSubmissions: async (params = {}) => {
        // Matches GET /api/admin/forms/contact-submissions
        const response = await api.get(`/admin/forms/contact-submissions${buildQuery(params)}`);
        return response.data;
    },

    getContactSubmissionById: async (id) => {
        const response = await api.get(`/admin/forms/contact-submissions/${id}`);
        return response.data;
    },

    getContactConfig: async () => {
        // Matches GET /api/forms/contact (PUBLIC endpoint - no auth required)
        // Use publicApi to avoid sending Authorization header
        const response = await publicApi.get(API_ROUTES.FORMS.CONTACT.CONFIG);
        return response.data;
    },

    getDemoConfig: async () => {
        // Matches GET /api/forms/demo (PUBLIC endpoint - no auth required)
        // Use publicApi to avoid sending Authorization header
        const response = await publicApi.get(API_ROUTES.FORMS.DEMO.CONFIG);
        return response.data;
    },

    getDemoSubmissions: async (params = {}) => {
        // Matches GET /api/admin/forms/demo-submissions
        const response = await api.get(`/admin/forms/demo-submissions${buildQuery(params)}`);
        return response.data;
    },

    getDemoSubmissionById: async (id) => {
        const response = await api.get(`/admin/forms/demo-submissions/${id}`);
        return response.data;
    },

    getPricingSubmissions: async (params = {}) => {
        // Matches GET /api/admin/forms/pricing-submissions
        const response = await api.get(`/admin/forms/pricing-submissions${buildQuery(params)}`);
        return response.data;
    },

    getPricingSubmissionById: async (id) => {
        const response = await api.get(`/admin/forms/pricing-submissions/${id}`);
        return response.data;
    },

    getJobApplicationSubmissions: async (params = {}) => {
        // Matches GET /api/admin/forms/job-application-submissions
        const response = await api.get(`/admin/forms/job-application-submissions${buildQuery(params)}`);
        return response.data;
    },

    getJobApplicationSubmissionById: async (id) => {
        const response = await api.get(`/admin/forms/job-application-submissions/${id}`);
        return response.data;
    }
};
