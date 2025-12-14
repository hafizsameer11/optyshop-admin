/**
 * Transaction Summary Component
 * Displays a summary card of transaction information
 * Can be used in customer dashboard, order details, etc.
 */
import React from 'react';
import { FiDollarSign, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const TransactionSummary = ({ transaction, showOrderLink = true, compact = false }) => {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <FiXCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FiClock className="w-5 h-5 text-yellow-600" />;
    }
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(transaction.status)}
            <div>
              <p className="text-sm font-medium text-gray-900">
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
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
              {transaction.status}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FiDollarSign className="mr-2" />
            Transaction Details
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {transaction.transaction_number || `TXN-${transaction.id}`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(transaction.status)}
          <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
            {transaction.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Amount</p>
          <p className="text-xl font-bold text-gray-900">
            {transaction.currency || 'USD'} {transaction.amount?.toFixed(2) || '0.00'}
          </p>
          {transaction.net_amount && transaction.net_amount !== transaction.amount && (
            <p className="text-xs text-gray-500 mt-1">
              Net: {transaction.currency || 'USD'} {transaction.net_amount.toFixed(2)}
            </p>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Payment Method</p>
          <p className="text-sm font-semibold text-gray-900 capitalize">
            {transaction.payment_method || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Type</p>
          <p className="text-sm font-semibold text-gray-900 capitalize">
            {transaction.type || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Date</p>
          <p className="text-sm font-semibold text-gray-900">
            {new Date(transaction.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {showOrderLink && transaction.order_id && (
        <div className="pt-4 border-t border-gray-200">
          <Link
            to={`/orders/${transaction.order_id}`}
            className="text-sm text-primary-600 hover:text-primary-800 hover:underline"
          >
            View Order #{transaction.order_id} →
          </Link>
        </div>
      )}
    </div>
  );
};

export default TransactionSummary;

