import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiEye, FiRefreshCw, FiFilter, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  
  // Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    paymentMethod: '',
    userId: '',
    orderId: '',
    startDate: '',
    endDate: '',
  });
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [page, filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await api.get(`${API_ROUTES.ADMIN.TRANSACTIONS.LIST}?${params.toString()}`);
      const data = response.data?.data || response.data || {};
      
      const transactionsData = data.transactions || data || [];
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      
      const pagination = data.pagination || {};
      setTotalPages(pagination.pages || pagination.totalPages || 1);
    } catch (error) {
      console.error('Transactions API error:', error);
      toast.error('Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`${API_ROUTES.ADMIN.TRANSACTIONS.STATS}?${params.toString()}`);
      const data = response.data?.data || response.data || {};
      setStats(data);
    } catch (error) {
      console.error('Transaction stats API error:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleView = (transaction) => {
    setSelectedTransaction(transaction);
    setViewModalOpen(true);
  };

  const handleStatusUpdate = (transaction) => {
    setSelectedTransaction(transaction);
    setStatusModalOpen(true);
  };

  const handleStatusSubmit = async (status, gatewayResponse, metadata) => {
    try {
      await api.put(API_ROUTES.ADMIN.TRANSACTIONS.UPDATE_STATUS(selectedTransaction.id), {
        status,
        gateway_response: gatewayResponse,
        metadata,
      });
      toast.success('Transaction status updated successfully');
      setStatusModalOpen(false);
      setSelectedTransaction(null);
      fetchTransactions();
      fetchStats();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update transaction status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      refunded: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type) => {
    const colors = {
      payment: 'bg-green-100 text-green-800',
      refund: 'bg-red-100 text-red-800',
      partial_refund: 'bg-orange-100 text-orange-800',
      chargeback: 'bg-purple-100 text-purple-800',
      reversal: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      paymentMethod: '',
      userId: '',
      orderId: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={() => {
            // TODO: Open create transaction modal
            toast.info('Create transaction feature coming soon');
          }}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiDollarSign />
          <span>Create Transaction</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue (Net)</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalRevenue?.toFixed(2) || stats.netRevenue?.toFixed(2) || '0.00'}
                </p>
                {stats.totalRevenue && stats.totalFees && (
                  <p className="text-xs text-gray-500 mt-1">
                    Gross: ${(stats.totalRevenue + stats.totalFees).toFixed(2)} | Fees: ${stats.totalFees.toFixed(2)}
                  </p>
                )}
              </div>
              <FiDollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalTransactions || 0}
                </p>
              </div>
              <FiTrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedCount || 0}
                </p>
              </div>
              <FiTrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.failedCount || 0}
                </p>
              </div>
              <FiTrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FiFilter className="mr-2" />
            Filters
          </h2>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="payment">Payment</option>
              <option value="refund">Refund</option>
              <option value="partial_refund">Partial Refund</option>
              <option value="chargeback">Chargeback</option>
              <option value="reversal">Reversal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
            <input
              type="text"
              value={filters.orderId}
              onChange={(e) => handleFilterChange('orderId', e.target.value)}
              placeholder="Order ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="User ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-semibold">{transaction.transaction_number || `TXN-${transaction.id}`}</span>
                        <span className="text-xs text-gray-500">ID: #{transaction.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.order_id ? (
                        <a 
                          href={`/orders?highlight=${transaction.order_id}`}
                          className="text-primary-600 hover:text-primary-800 hover:underline"
                        >
                          Order #{transaction.order_id}
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.user_id ? (
                        <a 
                          href={`/users?highlight=${transaction.user_id}`}
                          className="text-primary-600 hover:text-primary-800 hover:underline"
                        >
                          User #{transaction.user_id}
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {transaction.currency || 'USD'} {transaction.amount?.toFixed(2) || '0.00'}
                        </span>
                        {transaction.gateway_fee && transaction.gateway_fee > 0 && (
                          <span className="text-xs text-gray-500">
                            Fee: {transaction.currency || 'USD'} {transaction.gateway_fee.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                      {transaction.net_amount !== undefined && transaction.net_amount !== null
                        ? `${transaction.currency || 'USD'} ${transaction.net_amount.toFixed(2)}`
                        : transaction.gateway_fee && transaction.gateway_fee > 0
                        ? `${transaction.currency || 'USD'} ${((transaction.amount || 0) - transaction.gateway_fee).toFixed(2)}`
                        : `${transaction.currency || 'USD'} ${transaction.amount?.toFixed(2) || '0.00'}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                        {transaction.type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.payment_method || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.created_at 
                        ? new Date(transaction.created_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(transaction)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Details"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(transaction)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Update Status"
                        >
                          <FiRefreshCw className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Transaction Modal */}
      {viewModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    setSelectedTransaction(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                {/* Transaction Number & Basic Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Transaction Number</p>
                      <p className="font-semibold text-lg">
                        {selectedTransaction.transaction_number || `TXN-${selectedTransaction.id}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">ID: #{selectedTransaction.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Financial Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Transaction Type</p>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(selectedTransaction.type)}`}>
                        {selectedTransaction.type}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-semibold">{selectedTransaction.payment_method || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gross Amount</p>
                      <p className="font-semibold text-lg">
                        {selectedTransaction.currency || 'USD'} {selectedTransaction.amount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    {selectedTransaction.gateway_fee && selectedTransaction.gateway_fee > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Gateway Fee</p>
                        <p className="font-semibold text-red-600">
                          - {selectedTransaction.currency || 'USD'} {selectedTransaction.gateway_fee.toFixed(2)}
                        </p>
                      </div>
                    )}
                    <div className="col-span-2 border-t border-blue-200 pt-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold text-gray-700">Net Amount</p>
                        <p className="font-bold text-lg text-green-700">
                          {selectedTransaction.net_amount !== undefined && selectedTransaction.net_amount !== null
                            ? `${selectedTransaction.currency || 'USD'} ${selectedTransaction.net_amount.toFixed(2)}`
                            : selectedTransaction.gateway_fee && selectedTransaction.gateway_fee > 0
                            ? `${selectedTransaction.currency || 'USD'} ${((selectedTransaction.amount || 0) - selectedTransaction.gateway_fee).toFixed(2)}`
                            : `${selectedTransaction.currency || 'USD'} ${selectedTransaction.amount?.toFixed(2) || '0.00'}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Related Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order ID</p>
                    <p className="font-semibold">
                      {selectedTransaction.order_id ? (
                        <a 
                          href={`/orders?highlight=${selectedTransaction.order_id}`}
                          className="text-primary-600 hover:text-primary-800 hover:underline"
                        >
                          Order #{selectedTransaction.order_id}
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">User ID</p>
                    <p className="font-semibold">
                      {selectedTransaction.user_id ? (
                        <a 
                          href={`/users?highlight=${selectedTransaction.user_id}`}
                          className="text-primary-600 hover:text-primary-800 hover:underline"
                        >
                          User #{selectedTransaction.user_id}
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created At</p>
                    <p className="font-semibold">
                      {selectedTransaction.created_at 
                        ? new Date(selectedTransaction.created_at).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                  {selectedTransaction.processed_at && (
                    <div>
                      <p className="text-sm text-gray-600">Processed At</p>
                      <p className="font-semibold">
                        {new Date(selectedTransaction.processed_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                {selectedTransaction.gateway_transaction_id && (
                  <div>
                    <p className="text-sm text-gray-600">Gateway Transaction ID</p>
                    <p className="font-semibold">{selectedTransaction.gateway_transaction_id}</p>
                  </div>
                )}
                {selectedTransaction.description && (
                  <div>
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="font-semibold">{selectedTransaction.description}</p>
                  </div>
                )}
                {selectedTransaction.gateway_response && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Gateway Response</p>
                    <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedTransaction.gateway_response, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedTransaction.metadata && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Metadata</p>
                    <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedTransaction.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusModalOpen && selectedTransaction && (
        <StatusUpdateModal
          transaction={selectedTransaction}
          onClose={() => {
            setStatusModalOpen(false);
            setSelectedTransaction(null);
          }}
          onSubmit={handleStatusSubmit}
        />
      )}
    </div>
  );
};

// Status Update Modal Component
const StatusUpdateModal = ({ transaction, onClose, onSubmit }) => {
  const [status, setStatus] = useState(transaction.status || '');
  const [gatewayResponse, setGatewayResponse] = useState(JSON.stringify(transaction.gateway_response || {}, null, 2));
  const [metadata, setMetadata] = useState(JSON.stringify(transaction.metadata || {}, null, 2));

  const handleSubmit = (e) => {
    e.preventDefault();
    let parsedGatewayResponse = {};
    let parsedMetadata = {};

    try {
      if (gatewayResponse) {
        parsedGatewayResponse = JSON.parse(gatewayResponse);
      }
    } catch (e) {
      toast.error('Invalid JSON in Gateway Response');
      return;
    }

    try {
      if (metadata) {
        parsedMetadata = JSON.parse(metadata);
      }
    } catch (e) {
      toast.error('Invalid JSON in Metadata');
      return;
    }

    onSubmit(status, parsedGatewayResponse, parsedMetadata);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Update Transaction Status</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gateway Response (JSON)</label>
              <textarea
                value={gatewayResponse}
                onChange={(e) => setGatewayResponse(e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                placeholder='{"id": "ch_123", "status": "succeeded"}'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metadata (JSON)</label>
              <textarea
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                placeholder='{"notes": "Manual update"}'
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                Update Status
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Transactions;

