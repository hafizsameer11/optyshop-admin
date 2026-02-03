import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LensTypeModal from '../components/LensTypeModal';
import { 
  getLensTypes,
  deleteLensType
} from '../api/lensTypes';

const LensTypes = () => {
  const [lensTypes, setLensTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLensType, setSelectedLensType] = useState(null);

  useEffect(() => {
    fetchLensTypes();
  }, []);

  const fetchLensTypes = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching lens types...');
      const response = await getLensTypes({ page: 1, limit: 1000 });
      console.log('✅ Lens types fetched successfully:', response.data);
      
      // Handle various response structures from the API
      let lensTypesData = [];
      
      if (response.data) {
        if (response.data.data) {
          // Nested data structure
          if (Array.isArray(response.data.data)) {
            lensTypesData = response.data.data;
          } else if (response.data.data.lensTypes && Array.isArray(response.data.data.lensTypes)) {
            lensTypesData = response.data.data.lensTypes;
          }
        } else if (Array.isArray(response.data)) {
          // Direct array
          lensTypesData = response.data;
        } else if (response.data.lensTypes && Array.isArray(response.data.lensTypes)) {
          lensTypesData = response.data.lensTypes;
        }
      }
      
      console.log('Parsed lens types:', lensTypesData);
      
      if (Array.isArray(lensTypesData)) {
        setLensTypes(lensTypesData);
        console.log('✅ Lens types state updated with', lensTypesData.length, 'items');
      } else {
        console.error('Lens types data is not an array:', lensTypesData);
        setLensTypes([]);
      }
    } catch (error) {
      console.error('❌ Lens types fetch error:', error);
      console.error('Error details:', error.response?.data);
      
      // Check the type of error
      const isNetworkError = !error.response;
      const isAuthError = error.response?.status === 401;
      const isServerError = error.response?.status >= 500;
      const isNotFoundError = error.response?.status === 404;
      
      if (isNetworkError || isAuthError || isServerError || isNotFoundError) {
        console.log('🔄 Backend error - keeping existing data or using empty array');
        toast.error('Backend error - Unable to fetch latest data');
        // Keep existing data or use empty array if no data exists
        if (lensTypes.length === 0) {
          setLensTypes([]);
        }
      } else {
        // For other errors, use empty array
        setLensTypes([]);
        const errorMessage = error.response?.data?.message || 'Failed to fetch lens types';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddLensType = () => {
    setSelectedLensType(null);
    setModalOpen(true);
  };

  const handleEdit = (lensType) => {
    setSelectedLensType(lensType);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lens type?')) {
      return;
    }

    try {
      const response = await deleteLensType(id);
      // Handle response structure: { success, message }
      if (response.data?.success) {
        toast.success(response.data.message || 'Lens type deleted successfully');
      } else {
        toast.success('Lens type deleted successfully');
      }
      
      // Refresh the list without page reload
      console.log('🔄 Deleting lens type and refreshing table (no page refresh)');
      fetchLensTypes();
    } catch (error) {
      console.error('❌ Lens type delete error:', error);
      
      // Check the type of error
      const isNetworkError = !error.response;
      const isAuthError = error.response?.status === 401;
      const isServerError = error.response?.status >= 500;
      const isNotFoundError = error.response?.status === 404;
      
      if (isNetworkError || isAuthError || isServerError || isNotFoundError) {
        console.log('🔄 Backend error during delete - still refreshing table');
        toast.error('Backend unavailable - Cannot delete lens type');
        // Still refresh to show current state
        fetchLensTypes();
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete lens type';
        toast.error(errorMessage);
        // Still refresh to show current state
        fetchLensTypes();
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
        <h1 className="text-3xl font-bold text-gray-900">Lens Types</h1>
        <button
          onClick={handleAddLensType}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Lens Type</span>
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
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Index
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thickness Factor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Adjustment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
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
              {lensTypes.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-sm text-gray-500">
                    No lens types found
                  </td>
                </tr>
              ) : (
                lensTypes.map((type) => (
                  <tr key={type.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {type.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {type.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {type.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {type.index}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {type.thickness_factor || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${type.price_adjustment ? type.price_adjustment.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {type.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          type.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {type.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {type.created_at ? new Date(type.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(type)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        onClick={() => handleDelete(type.id)}
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
        <LensTypeModal
          lensType={selectedLensType}
          onClose={(shouldRefresh = false) => {
            console.log('🔄 LensTypeModal onClose called with shouldRefresh:', shouldRefresh);
            console.log('🔄 Current selectedLensType:', selectedLensType);
            console.log('🔄 About to set modalOpen to false - this should NOT cause page refresh');
            
            // First close the modal
            setModalOpen(false);
            setSelectedLensType(null);
            
            if (shouldRefresh) {
              console.log('📋 Refreshing lens types list after modal save');
              console.log('🔄 This should only update the table, NOT refresh the page');
              
              // Use setTimeout to ensure modal is fully closed before refresh
              // This prevents any UI conflicts and ensures no page refresh
              setTimeout(() => {
                console.log('🔄 Fetching lens types from API (no page refresh should occur)');
                fetchLensTypes();
              }, 100);
            } else {
              console.log('❌ Modal closed without refresh (cancelled or failed)');
            }
          }}
        />
      )}
    </div>
  );
};

export default LensTypes;



