/**
 * Transaction History Widget
 * Compact widget for customer dashboard showing recent transactions
 */
import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiArrowRight, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import customerApi from '../../utils/customerApi';
import { API_ROUTES } from '../../config/apiRoutes';
import { Link } from 'react-router-dom';

const TransactionHistoryWidget = ({ limit = 5 }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentTransactions();
  }, []);

  const fetchRecentTransactions = async () => {
    try {
      const response = await customerApi.get(
        `${API_ROUTES.TRANSACTIONS.LIST}?page=1&limit=${limit}&status=completed`
      );
      const data = response.data?.data || response.data || {};
      const transactionsData = data.transactions || data || [];
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (error) {
      console.error('Failed to fetch recent transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <FiXCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FiClock className="w-4 h-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FiDollarSign className="mr-2" />
          Recent Transactions
        </h3>
        <Link
          to="/transactions"
          className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
        >
          View All
          <FiArrowRight className="ml-1" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <FiDollarSign className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1">
                {getStatusIcon(transaction.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {transaction.transaction_number || `TXN-${transaction.id}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {transaction.currency || 'USD'} {transaction.amount?.toFixed(2) || '0.00'}
                </p>
                {transaction.order_id && (
                  <Link
                    to={`/orders/${transaction.order_id}`}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    Order #{transaction.order_id}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryWidget;

