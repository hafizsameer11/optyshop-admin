/**
 * Admin Order Transactions List Component
 * Shows all transactions for a specific order in admin panel
 * Handles multiple transactions per order (payments, refunds, chargebacks)
 * Allows admin to view and manage transactions
 */
import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiArrowDown, FiArrowUp, FiRefreshCw, FiEye, FiRefreshCcw } from 'react-icons/fi';
import api from '../../utils/api';
import { API_ROUTES } from '../../config/apiRoutes';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminOrderTransactionsList = ({ orderId, orderTotal, onTransactionUpdate }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (orderId) {
      fetchOrderTransactions();
    }
  }, [orderId]);

  const fetchOrderTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `${API_ROUTES.ADMIN.TRANSACTIONS.LIST}?orderId=${orderId}`
      );
      const data = response.data?.data || response.data || {};
      const transactionsData = data.transactions || data || [];
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (error) {
      console.error('Failed to fetch order transactions:', error);
      toast.error('Failed to load transaction history');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateNetAmount = () => {
    return transactions.reduce((total, txn) => {
      if (txn.status === 'completed') {
        if (txn.type === 'payment') {
          return total + (txn.net_amount || txn.amount || 0);
        } else if (txn.type === 'refund' || txn.type === 'partial_refund' || txn.type === 'chargeback') {
          return total - (txn.amount || 0);
        }
      }
      return total;
    }, 0);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'payment':
        return <FiArrowDown className="w-5 h-5 text-green-600" />;
      case 'refund':
      case 'partial_refund':
      case 'chargeback':
        return <FiArrowUp className="w-5 h-5 text-red-600" />;
      default:
        return <FiDollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionLabel = (type) => {
    const labels = {
      payment: 'Payment',
      refund: 'Full Refund',
      partial_refund: 'Partial Refund',
      chargeback: 'Chargeback',
      reversal: 'Reversal',
    };
    return labels[type] || type;
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

  const handleViewTransaction = (transactionId) => {
    navigate(`/transactions?highlight=${transactionId}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiDollarSign className="mr-2" />
          Payment Transactions
        </h3>
        <p className="text-gray-500 text-sm">No transactions found for this order.</p>
      </div>
    );
  }

  const netAmount = calculateNetAmount();
  const hasRefunds = transactions.some(t => 
    (t.type === 'refund' || t.type === 'partial_refund' || t.type === 'chargeback') && 
    t.status === 'completed'
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FiDollarSign className="mr-2" />
          Payment Transactions ({transactions.length})
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchOrderTransactions}
            className="text-sm text-primary-600 hover:text-primary-800 flex items-center px-3 py-1 rounded hover:bg-gray-100"
            title="Refresh transactions"
          >
            <FiRefreshCw className="mr-1" />
            Refresh
          </button>
          <button
            onClick={() => navigate('/transactions')}
            className="text-sm text-primary-600 hover:text-primary-800 flex items-center px-3 py-1 rounded hover:bg-gray-100"
            title="View all transactions"
          >
            <FiEye className="mr-1" />
            View All
          </button>
        </div>
      </div>

      {/* Transaction Timeline */}
      <div className="space-y-4 mb-6">
        {transactions.map((transaction, index) => (
          <div key={transaction.id} className="relative">
            {/* Timeline Line */}
            {index < transactions.length - 1 && (
              <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
            )}
            
            <div className="flex items-start space-x-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm">
                {getTransactionIcon(transaction.type)}
              </div>

              {/* Transaction Card */}
              <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {getTransactionLabel(transaction.type)}
                      </p>
                      <button
                        onClick={() => handleViewTransaction(transaction.id)}
                        className="text-primary-600 hover:text-primary-800"
                        title="View transaction details"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {transaction.transaction_number || `TXN-${transaction.id}`}
                    </p>
                    {transaction.gateway_transaction_id && (
                      <p className="text-xs text-gray-400 font-mono mt-1">
                        Gateway: {transaction.gateway_transaction_id}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.type === 'payment' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {transaction.type === 'payment' ? '+' : '-'}
                      {transaction.currency || 'USD'} {transaction.amount?.toFixed(2) || '0.00'}
                    </p>
                    {transaction.gateway_fee && transaction.gateway_fee > 0 && (
                      <p className="text-xs text-gray-500">
                        Fee: {transaction.currency || 'USD'} {transaction.gateway_fee.toFixed(2)}
                      </p>
                    )}
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full mt-1 ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
                  <div>
                    <span className="font-medium">Method:</span> {transaction.payment_method || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>{' '}
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </div>
                  {transaction.net_amount && transaction.net_amount !== transaction.amount && (
                    <div>
                      <span className="font-medium">Net:</span>{' '}
                      {transaction.currency || 'USD'} {transaction.net_amount.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Summary */}
      <div className="border-t border-gray-200 pt-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Order Total:</span>
            <span className="text-lg font-semibold text-gray-900">
              {transactions[0]?.currency || 'USD'} {orderTotal?.toFixed(2) || '0.00'}
            </span>
          </div>
          
          {hasRefunds && (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Net Amount (after refunds):</span>
                <span className={`text-xl font-bold ${
                  netAmount >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {transactions[0]?.currency || 'USD'} {Math.abs(netAmount).toFixed(2)}
                </span>
              </div>
              {netAmount < 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  ⚠️ This order has been fully or partially refunded
                </p>
              )}
            </>
          )}

          {/* Total Gateway Fees */}
          {transactions.some(t => t.gateway_fee && t.gateway_fee > 0) && (
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
              <span className="text-xs text-gray-600">Total Gateway Fees:</span>
              <span className="text-sm font-semibold text-gray-700">
                {transactions[0]?.currency || 'USD'} {
                  transactions
                    .filter(t => t.gateway_fee && t.gateway_fee > 0)
                    .reduce((sum, t) => sum + t.gateway_fee, 0)
                    .toFixed(2)
                }
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrderTransactionsList;

