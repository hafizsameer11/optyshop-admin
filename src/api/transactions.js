import api from '../utils/api';

// Transactions API service for admin panel
const transactionsAPI = {
  // Get all transactions
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters if provided
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.user_id) queryParams.append('user_id', filters.user_id);
    if (filters.order_id) queryParams.append('order_id', filters.order_id);
    if (filters.payment_method) queryParams.append('payment_method', filters.payment_method);
    if (filters.date_from) queryParams.append('date_from', filters.date_from);
    if (filters.date_to) queryParams.append('date_to', filters.date_to);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const url = queryParams.toString() ? `/admin/transactions?${queryParams.toString()}` : '/admin/transactions';
    const response = await api.get(url);
    
    return response.data?.data?.transactions || response.data?.data || response.data || [];
  },

  // Get transaction by ID
  getById: async (id) => {
    const response = await api.get(`/admin/transactions/${id}`);
    return response.data?.data?.transaction || response.data?.data || response.data;
  },

  // Create transaction
  create: async (transactionData) => {
    const response = await api.post('/admin/transactions', transactionData);
    return response.data?.data?.transaction || response.data?.data || response.data;
  },

  // Get transaction statistics
  getStats: async () => {
    const response = await api.get('/admin/transactions/stats');
    return response.data?.data?.stats || response.data?.data || response.data;
  },

  // Update transaction status
  updateStatus: async (id, status) => {
    const response = await api.put(`/admin/transactions/${id}/status`, { status });
    return response.data?.data?.transaction || response.data?.data || response.data;
  },
};

export default transactionsAPI;
