import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiImage } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import BannerModal from '../components/BannerModal';
import { API_ROUTES } from '../config/apiRoutes';

// Banner Image Component with error handling
const BannerImage = ({ banner }) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    if (banner?.image_url) {
      const normalizedUrl = normalizeImageUrl(banner.image_url);
      setImageSrc(normalizedUrl);
      setImageError(!normalizedUrl);
    } else {
      setImageSrc(null);
      setImageError(true);
    }
  }, [banner]);

  const handleImageError = () => {
    setImageError(true);
  };

  if (!imageSrc || imageError) {
    return (
      <div className="h-16 w-24 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
        <FiImage className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={banner?.title || 'Banner'}
      className="h-16 w-24 object-cover rounded"
      onError={handleImageError}
      loading="lazy"
    />
  );
};

// Helper function to normalize image URLs
const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;
  
  // Skip test/example URLs that will cause CORS errors
  const testDomains = ['example.com', 'localhost', '127.0.0.1', 'test.com', 'placeholder.com'];
  try {
    const urlObj = new URL(trimmedUrl);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if it's a test domain
    if (testDomains.some(domain => hostname.includes(domain))) {
      console.warn(`Skipping test/example image URL: ${trimmedUrl}`);
      return null;
    }
    
    // Valid external URL - return as is
    return trimmedUrl;
  } catch (e) {
    // Not a valid absolute URL, might be relative
    if (trimmedUrl.startsWith('/')) {
      // Relative path - try to construct full URL using API base URL
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://optyshop-frontend.hmstech.org/api';
      // Remove /api suffix if present, then append the relative path
      const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
      return `${baseUrl}${trimmedUrl}`;
    }
    
    // Invalid URL format
    console.warn(`Invalid image URL format: ${trimmedUrl}`);
    return null;
  }
};

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
      // Use ADMIN route for listing banners with safety check
      const bannersRoute = API_ROUTES.ADMIN?.BANNERS?.LIST || API_ROUTES.BANNERS?.LIST || '/admin/banners';
      console.log('Fetching banners from route:', bannersRoute);
      console.log('API_ROUTES.ADMIN:', API_ROUTES.ADMIN);
      console.log('API_ROUTES.ADMIN.BANNERS:', API_ROUTES.ADMIN?.BANNERS);
      const response = await api.get(bannersRoute);
      console.log('Banners API Response:', response.data);
      
      // Handle response structure: { success, message, data: { banners: [...] } }
      // Or direct array: { banners: [...] }
      let bannersData = [];
      
      if (response.data?.data) {
        // Handle nested structure: { data: { banners: [...] } } or { data: [...] }
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
      setBanners([]);
      
      // Show error message (but not for demo mode)
      const isDemoMode = localStorage.getItem('demo_user') !== null;
      if (!isDemoMode) {
        if (!error.response) {
          toast.error('Failed to load banners: Network error. Please check your connection.');
        } else if (error.response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else {
          toast.error(`Failed to load banners: ${error.response?.data?.message || error.message}`);
        }
      }
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
      // Use admin route for deletion with safety check
      const deleteUrl = API_ROUTES.ADMIN?.BANNERS?.DELETE?.(id) || `/admin/banners/${id}`;
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
                      <BannerImage banner={banner} />
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
