/**
 * Transaction Details Modal for Customers
 * Shows detailed transaction information in a user-friendly format
 */
import React from 'react';
import { FiX, FiCheckCircle, FiXCircle, FiClock, FiDollarSign, FiFileText, FiCreditCard } from 'react-icons/fi';

const TransactionDetailsModal = ({ transaction, onClose }) => {
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
        return <FiCheckCircle className="w-6 h-6 text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <FiXCircle className="w-6 h-6 text-red-600" />;
      case 'pending':
      case 'processing':
        return <FiClock className="w-6 h-6 text-yellow-600" />;
      default:
        return <FiClock className="w-6 h-6 text-gray-600" />;
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              {transaction.transaction_number || `TXN-${transaction.id}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-lg flex items-center space-x-3 ${
            transaction.status === 'completed' ? 'bg-green-50' :
            transaction.status === 'failed' || transaction.status === 'cancelled' ? 'bg-red-50' :
            'bg-yellow-50'
          }`}>
            {getStatusIcon(transaction.status)}
            <div>
              <p className="font-semibold text-gray-900">Status: {transaction.status}</p>
              <p className="text-sm text-gray-600">
                {transaction.status === 'completed' && 'Payment successful'}
                {transaction.status === 'pending' && 'Payment is being processed'}
                {transaction.status === 'processing' && 'Payment is being verified'}
                {transaction.status === 'failed' && 'Payment failed'}
                {transaction.status === 'cancelled' && 'Transaction was cancelled'}
                {transaction.status === 'refunded' && 'Amount has been refunded'}
              </p>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiDollarSign className="mr-2" />
              Payment Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Transaction Type</p>
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                  {transaction.type || 'N/A'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                <p className="text-sm font-semibold text-gray-900 capitalize flex items-center">
                  <FiCreditCard className="mr-2" />
                  {transaction.payment_method || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Gross Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transaction.currency || 'USD'} {transaction.amount?.toFixed(2) || '0.00'}
                </p>
              </div>
              {transaction.gateway_fee && transaction.gateway_fee > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Gateway Fee</p>
                  <p className="text-lg font-semibold text-red-600">
                    - {transaction.currency || 'USD'} {transaction.gateway_fee.toFixed(2)}
                  </p>
                </div>
              )}
              <div className="col-span-2 border-t border-blue-200 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-gray-700">Net Amount</p>
                  <p className="text-3xl font-bold text-green-700">
                    {transaction.net_amount !== undefined && transaction.net_amount !== null
                      ? `${transaction.currency || 'USD'} ${transaction.net_amount.toFixed(2)}`
                      : transaction.gateway_fee && transaction.gateway_fee > 0
                      ? `${transaction.currency || 'USD'} ${((transaction.amount || 0) - transaction.gateway_fee).toFixed(2)}`
                      : `${transaction.currency || 'USD'} ${transaction.amount?.toFixed(2) || '0.00'}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
              <p className="text-sm font-semibold text-gray-900">#{transaction.id}</p>
            </div>
            {transaction.order_id && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Number</p>
                <a
                  href={`/orders/${transaction.order_id}`}
                  className="text-sm font-semibold text-primary-600 hover:text-primary-800 hover:underline"
                >
                  Order #{transaction.order_id}
                </a>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1">Created At</p>
              <p className="text-sm font-semibold text-gray-900">{formatDate(transaction.created_at)}</p>
            </div>
            {transaction.processed_at && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Processed At</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(transaction.processed_at)}</p>
              </div>
            )}
          </div>

          {/* Gateway Information */}
          {transaction.gateway_transaction_id && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <FiFileText className="mr-2" />
                Gateway Transaction ID
              </h4>
              <p className="text-sm text-gray-700 font-mono">{transaction.gateway_transaction_id}</p>
            </div>
          )}

          {/* Description */}
          {transaction.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
              <p className="text-sm text-gray-700">{transaction.description}</p>
            </div>
          )}

          {/* Order Summary (if included in response) */}
          {transaction.order && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Related Order</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Order #:</span>{' '}
                  <a
                    href={`/orders/${transaction.order.id || transaction.order_id}`}
                    className="font-semibold text-primary-600 hover:text-primary-800 hover:underline"
                  >
                    {transaction.order.order_number || transaction.order.id || transaction.order_id}
                  </a>
                </div>
                {transaction.order.total && (
                  <div>
                    <span className="text-gray-600">Order Total:</span>{' '}
                    <span className="font-semibold text-gray-900">
                      {transaction.order.currency || transaction.currency || 'USD'} {transaction.order.total.toFixed(2)}
                    </span>
                  </div>
                )}
                {transaction.order.status && (
                  <div>
                    <span className="text-gray-600">Order Status:</span>{' '}
                    <span className="font-semibold text-gray-900 capitalize">
                      {transaction.order.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Receipt Download (if available) */}
          {transaction.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>✓ Payment Successful</strong> - Your receipt has been sent to your email.
              </p>
              {transaction.gateway_response?.receipt_url && (
                <a
                  href={transaction.gateway_response.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-800 underline mt-2 inline-block"
                >
                  Download Receipt →
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;

