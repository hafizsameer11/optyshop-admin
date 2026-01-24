import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiClock } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import FlashOfferModal from '../components/FlashOfferModal';

const FlashOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.ADMIN.FLASH_OFFERS.LIST);
      const offersData = response.data?.data?.offers || response.data?.offers || response.data || [];
      setOffers(Array.isArray(offersData) ? offersData : []);
    } catch (error) {
      console.error('Flash offers API error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot fetch flash offers');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        toast.error('Failed to fetch flash offers');
      }
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedOffer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (offer) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedOffer(null);
  };

  const handleModalSuccess = () => {
    fetchOffers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this flash offer?')) {
      return;
    }

    try {
      await api.delete(API_ROUTES.ADMIN.FLASH_OFFERS.DELETE(id));
      toast.success('Flash offer deleted successfully');
      fetchOffers();
    } catch (error) {
      console.error('Flash offer delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete flash offer');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete flash offer';
        toast.error(errorMessage);
      }
    }
  };

  const calculateTimeRemaining = (endDate) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const difference = end - now;

    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, expired: false };
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
        <h1 className="text-3xl font-bold text-gray-900">Flash Offers</h1>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Flash Offer</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Banner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Countdown
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
              {offers.map((offer) => {
                const timeRemaining = offer.ends_at ? calculateTimeRemaining(offer.ends_at) : null;
                return (
                  <tr key={offer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {offer.image_url ? (
                        <img 
                          src={offer.image_url} 
                          alt={offer.title} 
                          className="w-12 h-12 object-cover rounded border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                          <FiClock />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex flex-col">
                        <span>{offer.title || 'Untitled Offer'}</span>
                        {offer.link_url && (
                          <a 
                            href={offer.link_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:underline truncate max-w-[150px]"
                          >
                            {offer.link_url}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {offer.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {offer.discount_type === 'percentage' 
                        ? `${offer.discount_value || 0}%` 
                        : `$${offer.discount_value || 0}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {offer.products && Array.isArray(offer.products) && offer.products.length > 0 ? (
                        <span className="text-gray-600">{offer.products.length} product(s)</span>
                      ) : offer.product_ids && Array.isArray(offer.product_ids) && offer.product_ids.length > 0 ? (
                        <span className="text-gray-600">{offer.product_ids.length} product(s)</span>
                      ) : (
                        <span className="text-gray-400 italic">All products</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {timeRemaining && !timeRemaining.expired ? (
                        <div className="flex items-center space-x-1 text-orange-600">
                          <FiClock className="w-4 h-4" />
                          <span className="font-mono">
                            {String(timeRemaining.hours).padStart(2, '0')}:
                            {String(timeRemaining.minutes).padStart(2, '0')}:
                            {String(timeRemaining.seconds).padStart(2, '0')}
                          </span>
                        </div>
                      ) : timeRemaining && timeRemaining.expired ? (
                        <span className="text-red-600 font-semibold">Expired</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          offer.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {offer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(offer)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        title="Edit flash offer"
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        onClick={() => handleDelete(offer.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete flash offer"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {offers.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No flash offers found. Click "Add Flash Offer" to create one.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <FlashOfferModal
          offer={selectedOffer}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default FlashOffers;
