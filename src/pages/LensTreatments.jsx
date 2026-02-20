import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LensTreatmentModal from '../components/LensTreatmentModal';
import { 
  getLensTreatments,
  deleteLensTreatment
} from '../api/lensTreatments';
import { useNavigationContext } from '../hooks/useNavigationContext';

const LensTreatments = () => {
  const navigate = useNavigate();
  const { getBackNavigationPath } = useNavigationContext();
  const [lensTreatments, setLensTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLensTreatment, setSelectedLensTreatment] = useState(null);

  useEffect(() => {
    fetchLensTreatments();
  }, []);

  const fetchLensTreatments = async () => {
    try {
      setLoading(true);
      const response = await getLensTreatments({ page: 1, limit: 1000 });
      console.log('✅ Lens treatments fetched successfully:', response.data);
      
      // Handle various response structures from the API
      let lensTreatmentsData = [];
      
      if (response.data) {
        // Check for nested data structure
        if (response.data.data) {
          const dataObj = response.data.data;
          
          // Check if data is directly an array
          if (Array.isArray(dataObj)) {
            lensTreatmentsData = dataObj;
          } 
          // Check for various property names
          else if (dataObj.lensTreatments && Array.isArray(dataObj.lensTreatments)) {
            lensTreatmentsData = dataObj.lensTreatments;
          } else if (dataObj.treatments && Array.isArray(dataObj.treatments)) {
            lensTreatmentsData = dataObj.treatments;
          } else if (dataObj.lens_treatments && Array.isArray(dataObj.lens_treatments)) {
            lensTreatmentsData = dataObj.lens_treatments;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            lensTreatmentsData = dataObj.data;
          }
        } 
        // Check if response.data is directly an array
        else if (Array.isArray(response.data)) {
          lensTreatmentsData = response.data;
        } 
        // Check for various property names at root level
        else {
          if (response.data.lensTreatments && Array.isArray(response.data.lensTreatments)) {
            lensTreatmentsData = response.data.lensTreatments;
          } else if (response.data.treatments && Array.isArray(response.data.treatments)) {
            lensTreatmentsData = response.data.treatments;
          } else if (response.data.lens_treatments && Array.isArray(response.data.lens_treatments)) {
            lensTreatmentsData = response.data.lens_treatments;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            lensTreatmentsData = response.data.results;
          }
        }
      }
      
      console.log('Parsed lens treatments:', lensTreatmentsData);
      console.log('Parsed lens treatments count:', lensTreatmentsData.length);
      
      if (Array.isArray(lensTreatmentsData)) {
        setLensTreatments(lensTreatmentsData);
        if (lensTreatmentsData.length === 0) {
          console.warn('Lens treatments array is empty. Check if data exists in database.');
        }
      } else {
        console.error('❌ Lens treatments data is not an array:', lensTreatmentsData);
        setLensTreatments([]);
      }
    } catch (error) {
      console.error('❌ Lens treatments fetch error:', error);
      console.error('Error details:', error.response?.data);
      setLensTreatments([]);
      toast.error('Failed to fetch lens treatments. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLensTreatment = () => {
    setSelectedLensTreatment(null);
    setModalOpen(true);
  };

  const handleBackToLensManagement = () => {
    const backPath = getBackNavigationPath();
    console.log('📍 Navigating back to:', backPath);
    navigate(backPath);
  };

  const handleEdit = (lensTreatment) => {
    setSelectedLensTreatment(lensTreatment);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lens treatment?')) {
      return;
    }

    try {
      const response = await deleteLensTreatment(id);
      console.log('✅ Lens treatment deleted successfully:', response.data);
      toast.success('Lens treatment deleted successfully');
      
      // Refresh the list without page reload
      console.log('🔄 Deleting lens treatment and refreshing table (no page refresh)');
      fetchLensTreatments();
    } catch (error) {
      console.error('❌ Lens treatment delete error:', error);
      
      // Check the type of error
      const isNetworkError = !error.response;
      const isAuthError = error.response?.status === 401;
      const isServerError = error.response?.status >= 500;
      const isNotFoundError = error.response?.status === 404;
      
      if (isNetworkError || isAuthError || isServerError || isNotFoundError) {
        console.log('🔄 Backend error during delete - still refreshing table');
        toast.error('Backend unavailable - Cannot delete lens treatment');
        // Still refresh to show current state
        fetchLensTreatments();
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete lens treatment';
        toast.error(errorMessage);
        // Still refresh to show current state
        fetchLensTreatments();
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
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToLensManagement}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Back to Lens Management"
          >
            <FiArrowLeft />
            <span>Back to Lens Management</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Lens Treatments</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchLensTreatments}
            disabled={loading}
            className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleAddLensTreatment}
            className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <FiPlus />
            <span>Add Lens Treatment</span>
          </button>
        </div>
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
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
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
              {lensTreatments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                    No lens treatments found
                  </td>
                </tr>
              ) : (
                lensTreatments.map((treatment) => (
                  <tr key={treatment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {treatment.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {treatment.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {treatment.slug || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {treatment.type ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {treatment.type.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${treatment.price ? treatment.price.toFixed(2) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {treatment.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          treatment.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {treatment.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {treatment.sort_order !== null && treatment.sort_order !== undefined ? Number(treatment.sort_order) : 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(treatment)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        onClick={() => handleDelete(treatment.id)}
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
        <LensTreatmentModal
          lensTreatment={selectedLensTreatment}
          onClose={(shouldRefresh = false) => {
            console.log('🔄 LensTreatmentModal onClose called with shouldRefresh:', shouldRefresh);
            console.log('🔄 Current selectedLensTreatment:', selectedLensTreatment);
            console.log('🔄 About to set modalOpen to false - this should NOT cause page refresh');
            
            // First close the modal
            setModalOpen(false);
            setSelectedLensTreatment(null);
            
            if (shouldRefresh) {
              console.log('📋 Refreshing lens treatments list after modal save');
              console.log('🔄 This should only update the table, NOT refresh the page');
              
              // Use setTimeout to ensure modal is fully closed before refresh
              // This prevents any UI conflicts and ensures no page refresh
              setTimeout(() => {
                console.log('🔄 Fetching lens treatments from API (no page refresh should occur)');
                fetchLensTreatments();
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

export default LensTreatments;

