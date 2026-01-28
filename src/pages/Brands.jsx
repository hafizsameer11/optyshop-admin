import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiExternalLink } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import BrandModal from '../components/BrandModal';
import { API_ROUTES } from '../config/apiRoutes';

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.ADMIN.BRANDS.LIST);
      // API response structure: { success: true, message: "...", data: { brands: [...] } }
      const brandsData = response.data?.data?.brands || response.data?.brands || [];
      setBrands(Array.isArray(brandsData) ? brandsData : []);
    } catch (error) {
      console.error('Brands API error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot fetch brands');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        toast.error('Failed to fetch brands');
      }
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = () => {
    setSelectedBrand(null);
    setModalOpen(true);
  };

  const handleEdit = (brand) => {
    setSelectedBrand(brand);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) {
      return;
    }

    try {
      await api.delete(API_ROUTES.ADMIN.BRANDS.DELETE(id));
      toast.success('Brand deleted successfully');
      fetchBrands();
    } catch (error) {
      console.error('Brand delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete brand');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete brand';
        toast.error(errorMessage);
      }
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedBrand(null);
  };

  const handleModalSuccess = () => {
    fetchBrands();
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
        <h1 className="text-3xl font-bold text-gray-900">Brands Management</h1>
        <button
          onClick={handleAddBrand}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Brand</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Logo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Website URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sort Order
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
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {brand.logo_image ? (
                      <div className="relative group">
                        <img
                          src={brand.logo_image}
                          alt={brand.name}
                          className="w-16 h-16 object-contain rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white p-1"
                          onClick={() => window.open(brand.logo_image, '_blank')}
                          title="Click to view full logo"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                        <FiImage className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{brand.slug || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate" title={brand.description}>
                      {brand.description || (
                        <span className="text-gray-400 italic">No description</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {brand.website_url ? (
                      <a
                        href={brand.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                        title={brand.website_url}
                      >
                        <FiExternalLink className="w-4 h-4" />
                        <span className="max-w-xs truncate">Visit Website</span>
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400 italic">No URL</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {brand.sort_order || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        brand.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleEdit(brand)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors p-1.5 hover:bg-indigo-50 rounded"
                        title="Edit brand"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(brand.id)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1.5 hover:bg-red-50 rounded"
                        title="Delete brand"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {brands.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No brands found. Click "Add Brand" to create one.</p>
        </div>
      )}

      {modalOpen && (
        <BrandModal
          brand={selectedBrand}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default Brands;

