/**
 * Order Transactions List Component
 * Shows all transactions for a specific order
 * Handles multiple transactions per order (payments, refunds, chargebacks)
 */
import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiArrowDown, FiArrowUp, FiRefreshCw } from 'react-icons/fi';
import customerApi from '../../utils/customerApi';
import { API_ROUTES } from '../../config/apiRoutes';
import TransactionSummary from './TransactionSummary';
import toast from 'react-hot-toast';

const OrderTransactionsList = ({ orderId, orderTotal }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderTransactions();
    }
  }, [orderId]);

  const fetchOrderTransactions = async () => {
    try {
      setLoading(true);
      const response = await customerApi.get(
        `${API_ROUTES.TRANSACTIONS.LIST}?orderId=${orderId}`
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
          Payment Transactions
        </h3>
        <button
          onClick={fetchOrderTransactions}
          className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
        >
          <FiRefreshCw className="mr-1" />
          Refresh
        </button>
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
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {getTransactionLabel(transaction.type)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.transaction_number || `TXN-${transaction.id}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.type === 'payment' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {transaction.type === 'payment' ? '+' : '-'}
                      {transaction.currency || 'USD'} {transaction.amount?.toFixed(2) || '0.00'}
                    </p>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'pending' || transaction.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                  <div>
                    <span className="font-medium">Method:</span> {transaction.payment_method || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>{' '}
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </div>
                  {transaction.gateway_transaction_id && (
                    <div className="col-span-2">
                      <span className="font-medium">Gateway ID:</span>{' '}
                      <span className="font-mono text-xs">{transaction.gateway_transaction_id}</span>
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
                <span className="text-sm font-medium text-gray-700">Net Amount:</span>
                <span className={`text-xl font-bold ${
                  netAmount >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {transactions[0]?.currency || 'USD'} {Math.abs(netAmount).toFixed(2)}
                </span>
              </div>
              {netAmount < 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  * This order has been fully or partially refunded
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTransactionsList;

