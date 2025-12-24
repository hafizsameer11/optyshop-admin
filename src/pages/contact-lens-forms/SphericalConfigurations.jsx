import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../../config/apiRoutes';
import SphericalConfigModal from '../../components/SphericalConfigModal';

const SphericalConfigurations = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchConfigs();
  }, [page]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_ROUTES.ADMIN.CONTACT_LENS_FORMS.SPHERICAL.LIST}?page=${page}&limit=${limit}`);
      
      let configsData = [];
      let pagination = null;

      if (response.data) {
        if (response.data.data) {
          const dataObj = response.data.data;
          if (Array.isArray(dataObj)) {
            configsData = dataObj;
          } else if (dataObj.configs && Array.isArray(dataObj.configs)) {
            configsData = dataObj.configs;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            configsData = dataObj.data;
          }
          if (dataObj.pagination) {
            pagination = dataObj.pagination;
          }
        } else if (Array.isArray(response.data)) {
          configsData = response.data;
        } else if (response.data.configs && Array.isArray(response.data.configs)) {
          configsData = response.data.configs;
          if (response.data.pagination) {
            pagination = response.data.pagination;
          }
        }
      }

      if (Array.isArray(configsData)) {
        setConfigs(configsData);
        if (pagination) {
          setTotalPages(pagination.totalPages || 1);
        }
      } else {
        setConfigs([]);
      }
    } catch (error) {
      console.error('Spherical configs API error:', error);
      toast.error('Failed to fetch spherical configurations');
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedConfig(null);
    setModalOpen(true);
  };

  const handleEdit = (config) => {
    setSelectedConfig(config);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this spherical configuration?')) {
      return;
    }

    try {
      const response = await api.delete(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.SPHERICAL.DELETE(id));
      if (response.data?.success) {
        toast.success(response.data.message || 'Spherical configuration deleted successfully');
      } else {
        toast.success('Spherical configuration deleted successfully');
      }
      fetchConfigs();
    } catch (error) {
      console.error('Delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete configuration');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete configuration';
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
        <h1 className="text-3xl font-bold text-gray-900">Spherical Configurations</h1>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Configuration</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Display Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sub Category ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
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
              {configs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No spherical configurations found
                  </td>
                </tr>
              ) : (
                configs.map((config) => {
                  const configId = config.id;
                  const name = config.name || 'N/A';
                  const displayName = config.display_name || config.displayName || 'N/A';
                  const subCategoryId = config.sub_category_id || config.subCategoryId || 'N/A';
                  const price = config.price !== undefined ? config.price : (config.price !== undefined ? config.price : 0);
                  const isActive = config.is_active !== undefined ? config.is_active : (config.isActive !== undefined ? config.isActive : true);

                  return (
                    <tr key={configId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {configId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {displayName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subCategoryId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(config)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(configId)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {modalOpen && (
        <SphericalConfigModal
          config={selectedConfig}
          onClose={() => {
            setModalOpen(false);
            setSelectedConfig(null);
            fetchConfigs();
          }}
        />
      )}
    </div>
  );
};

export default SphericalConfigurations;

