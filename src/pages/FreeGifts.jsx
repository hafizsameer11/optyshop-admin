import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiGift } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import FreeGiftModal from '../components/FreeGiftModal';

const FreeGifts = () => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);

  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.ADMIN.FREE_GIFTS.LIST);
      const giftsData = response.data?.data?.gifts || response.data?.gifts || response.data || [];
      setGifts(Array.isArray(giftsData) ? giftsData : []);
    } catch (error) {
      console.error('Free gifts API error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot fetch free gifts');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        toast.error('Failed to fetch free gifts');
      }
      setGifts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedGift(null);
    setIsModalOpen(true);
  };

  const handleEdit = (gift) => {
    setSelectedGift(gift);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedGift(null);
  };

  const handleModalSuccess = () => {
    fetchGifts();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this free gift rule?')) {
      return;
    }

    try {
      await api.delete(API_ROUTES.ADMIN.FREE_GIFTS.DELETE(id));
      toast.success('Free gift rule deleted successfully');
      fetchGifts();
    } catch (error) {
      console.error('Free gift delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete free gift');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete free gift';
        toast.error(errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <FiGift className="w-8 h-8 text-primary-500" />
          <h1 className="text-3xl font-bold text-gray-900">Free Gifts (Omaggio)</h1>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Free Gift Rule</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trigger Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Free Gift Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min/Max Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gifts.map((gift) => (
                <tr key={gift.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {gift.product ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{gift.product.name}</span>
                        <span className="text-xs text-gray-500">SKU: {gift.product.sku || 'N/A'}</span>
                      </div>
                    ) : (
                      <span className="text-gray-600">Product ID: {gift.product_id}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {gift.gift_product ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-green-700">{gift.gift_product.name}</span>
                        <span className="text-xs text-gray-500">SKU: {gift.gift_product.sku || 'N/A'}</span>
                      </div>
                    ) : (
                      <span className="text-gray-600">Product ID: {gift.gift_product_id}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>Min: {gift.min_quantity || 1}</span>
                      {gift.max_quantity && <span>Max: {gift.max_quantity}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {gift.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        gift.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {gift.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEdit(gift)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                      title="Edit free gift rule"
                    >
                      <FiEdit2 />
                    </button>
                    <button 
                      onClick={() => handleDelete(gift.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete free gift rule"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {gifts.length === 0 && !loading && (
          <div className="text-center py-12">
            <FiGift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No free gift rules found. Click "Add Free Gift Rule" to create one.</p>
            <p className="text-sm text-gray-400 mt-2">Configure which products trigger a free gift when purchased.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <FreeGiftModal
          gift={selectedGift}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default FreeGifts;
