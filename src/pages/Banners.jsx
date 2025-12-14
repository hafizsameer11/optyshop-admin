import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import BannerModal from '../components/BannerModal';
import { API_ROUTES } from '../config/apiRoutes';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      // Try CMS route first (public), fallback not needed as CMS route should work for GET
      const response = await api.get(API_ROUTES.CMS.BANNERS.LIST);
      console.log('Banners API Response:', response.data);
      
      // Handle response structure: { success, message, data: { banners: [...] } }
      // Or direct array: { banners: [...] }
      let bannersData = [];
      
      if (response.data?.data) {
        bannersData = response.data.data.banners || response.data.data || [];
      } else if (Array.isArray(response.data)) {
        bannersData = response.data;
      } else if (response.data?.banners) {
        bannersData = response.data.banners;
      }
      
      console.log('Parsed banners:', bannersData);
      setBanners(Array.isArray(bannersData) ? bannersData : []);
    } catch (error) {
      console.error('Banners API error:', error);
      console.error('Error details:', error.response?.data);
      // Use empty array as fallback
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBanner = () => {
    setSelectedBanner(null);
    setModalOpen(true);
  };

  const handleEdit = (banner) => {
    setSelectedBanner(banner);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    try {
      // Use admin route if available, otherwise fallback to CMS route
      const deleteUrl = (API_ROUTES.ADMIN.BANNERS && API_ROUTES.ADMIN.BANNERS.DELETE)
        ? API_ROUTES.ADMIN.BANNERS.DELETE(id)
        : API_ROUTES.CMS.BANNERS.DELETE(id);
      const response = await api.delete(deleteUrl);
      // Handle response structure
      if (response.data?.success) {
        toast.success(response.data.message || 'Banner deleted successfully');
      } else {
        toast.success('Banner deleted successfully');
      }
      fetchBanners();
    } catch (error) {
      console.error('Banner delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete banner');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete banner';
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
        <h1 className="text-3xl font-bold text-gray-900">Banners</h1>
        <button
          onClick={handleAddBanner}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Banner</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Link URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sort Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {banners.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    No banners found
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {banner.image_url ? (
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="h-16 w-24 object-cover rounded"
                        />
                      ) : (
                        <div className="h-16 w-24 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-400">No Image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {banner.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {banner.link_url ? (
                        <a
                          href={banner.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 truncate max-w-xs block"
                        >
                          {banner.link_url}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {banner.position || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {banner.sort_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          banner.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {banner.created_at ? new Date(banner.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        title="Edit banner"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete banner"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <BannerModal
          banner={selectedBanner}
          onClose={() => {
            setModalOpen(false);
            setSelectedBanner(null);
            fetchBanners();
          }}
        />
      )}
    </div>
  );
};

export default Banners;
