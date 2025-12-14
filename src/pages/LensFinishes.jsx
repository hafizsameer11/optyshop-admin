import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import LensFinishModal from '../components/LensFinishModal';
import { API_ROUTES } from '../config/apiRoutes';

const LensFinishes = () => {
  const [lensFinishes, setLensFinishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLensFinish, setSelectedLensFinish] = useState(null);

  useEffect(() => {
    fetchLensFinishes();
  }, []);

  const fetchLensFinishes = async () => {
    try {
      setLoading(true);
      // Fetch with high limit to get all records
      // GET /api/admin/lens-finishes (Admin endpoint)
      // Endpoint: GET {{base_url}}/api/admin/lens-finishes?page=1&limit=100
      // Auth: Authorization: Bearer {{admin_token}}
      const response = await api.get(`${API_ROUTES.ADMIN.LENS_FINISHES.LIST}?page=1&limit=1000`);
      console.log('Lens finishes API Response:', JSON.stringify(response.data, null, 2));
      
      // Handle various response structures from the API
      // Possible formats:
      // 1. { success: true, data: { data: [...], pagination: {...} } }
      // 2. { success: true, data: { lensFinishes: [...], pagination: {...} } }
      // 3. { success: true, data: [...] }
      // 4. { data: [...], pagination: {...} }
      // 5. { lensFinishes: [...], pagination: {...} }
      // 6. [...] (direct array)
      let lensFinishesData = [];
      
      if (response.data) {
        // Check for nested data structure
        if (response.data.data) {
          const dataObj = response.data.data;
          
          // If data is directly an array
          if (Array.isArray(dataObj)) {
            lensFinishesData = dataObj;
          } 
          // Check for various property names in nested data
          else if (dataObj.lensFinishes && Array.isArray(dataObj.lensFinishes)) {
            lensFinishesData = dataObj.lensFinishes;
          } else if (dataObj.finishes && Array.isArray(dataObj.finishes)) {
            lensFinishesData = dataObj.finishes;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            lensFinishesData = dataObj.data;
          } else if (dataObj.results && Array.isArray(dataObj.results)) {
            lensFinishesData = dataObj.results;
          }
        } 
        // Check if response.data is directly an array
        else if (Array.isArray(response.data)) {
          lensFinishesData = response.data;
        } 
        // Check for various property names at root level
        else {
          if (response.data.lensFinishes && Array.isArray(response.data.lensFinishes)) {
            lensFinishesData = response.data.lensFinishes;
          } else if (response.data.finishes && Array.isArray(response.data.finishes)) {
            lensFinishesData = response.data.finishes;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            lensFinishesData = response.data.data;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            lensFinishesData = response.data.results;
          }
        }
      }
      
      console.log('Parsed lens finishes:', lensFinishesData);
      console.log('Parsed lens finishes count:', lensFinishesData.length);
      
      if (Array.isArray(lensFinishesData)) {
        setLensFinishes(lensFinishesData);
        if (lensFinishesData.length === 0) {
          console.warn('No lens finishes found. Check if lens finishes exist in the database.');
        }
      } else {
        console.error('Lens finishes data is not an array:', lensFinishesData);
        console.error('Response structure:', response.data);
        setLensFinishes([]);
      }
    } catch (error) {
      console.error('Lens finishes API error:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setLensFinishes([]);
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        toast.error('Lens finishes endpoint not found. Check API configuration.');
      } else if (!error.response) {
        toast.error('Cannot connect to server. Check if backend is running.');
      } else {
        toast.error('Failed to fetch lens finishes. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddLensFinish = () => {
    setSelectedLensFinish(null);
    setModalOpen(true);
  };

  const handleEdit = (lensFinish) => {
    setSelectedLensFinish(lensFinish);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lens finish?')) {
      return;
    }

    try {
      const response = await api.delete(API_ROUTES.ADMIN.LENS_FINISHES.DELETE(id));
      // Handle response structure: { success, message }
      if (response.data?.success) {
        toast.success(response.data.message || 'Lens finish deleted successfully');
      } else {
        toast.success('Lens finish deleted successfully');
      }
      fetchLensFinishes();
    } catch (error) {
      console.error('Lens finish delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete lens finish');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete lens finish';
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
        <h1 className="text-3xl font-bold text-gray-900">Lens Finishes</h1>
        <button
          onClick={handleAddLensFinish}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Lens Finish</span>
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
                  Lens Option
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Adjustment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sort Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lensFinishes.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-sm text-gray-500">
                    No lens finishes found
                  </td>
                </tr>
              ) : (
                lensFinishes.map((finish) => (
                  <tr key={finish.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {finish.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {finish.lens_option_id || 'N/A'}
                      {finish.lens_option?.name && (
                        <span className="block text-xs text-gray-400">{finish.lens_option.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {finish.lens_option?.type ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {finish.lens_option.type}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {finish.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {finish.slug || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {finish.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${finish.price_adjustment || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          finish.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {finish.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {finish.sort_order !== null && finish.sort_order !== undefined ? Number(finish.sort_order) : 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(finish)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        onClick={() => handleDelete(finish.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
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
        <LensFinishModal
          lensFinish={selectedLensFinish}
          onClose={() => {
            setModalOpen(false);
            setSelectedLensFinish(null);
            fetchLensFinishes();
          }}
        />
      )}
    </div>
  );
};

export default LensFinishes;

