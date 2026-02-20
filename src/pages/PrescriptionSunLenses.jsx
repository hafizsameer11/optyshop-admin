import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PrescriptionSunLensModal from '../components/PrescriptionSunLensModal';
import { 
  getPrescriptionSunLenses,
  deletePrescriptionSunLens
} from '../api/prescriptionSunLenses';
import { useNavigationContext } from '../hooks/useNavigationContext';

const PrescriptionSunLenses = () => {
  const navigate = useNavigate();
  const { getBackNavigationPath } = useNavigationContext();
  const [lenses, setLenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLens, setSelectedLens] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  // Debug localStorage state
  useEffect(() => {
    const demoData = localStorage.getItem('demo_prescription_sun_lenses');
    console.log('🔍 Current localStorage demo_prescription_sun_lenses:', demoData);
    console.log('🔍 Parsed localStorage data:', JSON.parse(demoData || '[]'));
  }, []);

  useEffect(() => {
    fetchLenses();
  }, [filterType, filterActive]);

  const fetchLenses = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 1000,
      };
      
      if (filterType !== 'all') {
        params.type = filterType;
      }
      if (filterActive !== 'all') {
        params.is_active = filterActive === 'active';
      }

      const response = await getPrescriptionSunLenses(params);
      console.log('✅ Prescription sun lenses fetched successfully:', response.data);
      console.log('🔍 Full response structure:', JSON.stringify(response, null, 2));
      console.log('🔍 Response data keys:', Object.keys(response.data || {}));
      console.log('🔍 Looking for data in response.data.options:', response.data?.options);
      console.log('🔍 Type of response.data.options:', typeof response.data?.options);
      console.log('🔍 Is response.data.options an array?', Array.isArray(response.data?.options));
      
      let lensesData = [];
      
      if (response.data) {
        // Handle various response structures from the API
        // Check for various property names at root level first (direct response)
        if (response.data.options && Array.isArray(response.data.options)) {
          lensesData = response.data.options;
        } else if (response.data.prescriptionSunLenses && Array.isArray(response.data.prescriptionSunLenses)) {
          lensesData = response.data.prescriptionSunLenses;
        } else if (response.data.lenses && Array.isArray(response.data.lenses)) {
          lensesData = response.data.lenses;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          lensesData = response.data.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          lensesData = response.data.results;
        }
        // Check for nested data structure
        else if (response.data.data) {
          const dataObj = response.data.data;
          // If data is directly an array
          if (Array.isArray(dataObj)) {
            lensesData = dataObj;
          } 
          // Check for various property names in nested data (prioritize prescriptionSunLenses)
          else if (dataObj.prescriptionSunLenses && Array.isArray(dataObj.prescriptionSunLenses)) {
            lensesData = dataObj.prescriptionSunLenses;
          } else if (dataObj.lenses && Array.isArray(dataObj.lenses)) {
            lensesData = dataObj.lenses;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            lensesData = dataObj.data;
          } else if (dataObj.results && Array.isArray(dataObj.results)) {
            lensesData = dataObj.results;
          } else if (dataObj.options && Array.isArray(dataObj.options)) {
            lensesData = dataObj.options;
          }
        } 
        // Check if response.data is directly an array
        else if (Array.isArray(response.data)) {
          lensesData = response.data;
        }
      }
      
      if (Array.isArray(lensesData)) {
        console.log('✅ Setting lenses data:', lensesData);
        console.log('🔍 Lenses count:', lensesData.length);
        setLenses(lensesData);
      } else {
        console.error('❌ Prescription sun lenses data is not an array:', lensesData);
        console.error('❌ Type of lensesData:', typeof lensesData);
        setLenses([]);
      }
    } catch (error) {
      console.error('❌ Prescription sun lenses fetch error:', error);
      console.error('Error details:', error.response?.data);
      setLenses([]);
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        toast.error('Prescription Sun Lenses endpoint not found. Check API configuration.');
      } else if (!error.response) {
        toast.error('Cannot connect to server. Check if backend is running.');
      } else {
        toast.error('Failed to fetch prescription sun lenses. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedLens(null);
    setModalOpen(true);
  };

  const handleBackToLensManagement = () => {
    const backPath = getBackNavigationPath();
    console.log('📍 Navigating back to:', backPath);
    navigate(backPath);
  };

  const handleEdit = (lens) => {
    setSelectedLens(lens);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prescription sun lens?')) {
      return;
    }

    try {
      const response = await deletePrescriptionSunLens(id);
      // Handle response structure: { success, message }
      if (response.data?.success) {
        toast.success(response.data.message || 'Prescription sun lens deleted successfully');
      } else {
        toast.success('Prescription sun lens deleted successfully');
      }
      
      // Refresh the list without page reload
      console.log('🔄 Deleting prescription sun lens and refreshing table (no page refresh)');
      fetchLenses();
    } catch (error) {
      console.error('❌ Prescription sun lens delete error:', error);
      
      // Check the type of error
      const isNetworkError = !error.response;
      const isAuthError = error.response?.status === 401;
      const isServerError = error.response?.status >= 500;
      const isNotFoundError = error.response?.status === 404;
      
      if (isNetworkError || isAuthError || isServerError || isNotFoundError) {
        console.log('🔄 Backend error during delete - still refreshing table');
        toast.error('Backend unavailable - Cannot delete prescription sun lens');
        // Still refresh to show current state
        fetchLenses();
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete prescription sun lens';
        toast.error(errorMessage);
        // Still refresh to show current state
        fetchLenses();
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
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToLensManagement}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Back to Lens Management"
            >
              <FiArrowLeft />
              <span>Back to Lens Management</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Prescription Sun Lenses</h1>
          </div>
          <div className="flex items-center gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="polarized">Polarized</option>
            <option value="classic">Classic</option>
            <option value="blokz">Blokz</option>
          </select>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <FiPlus />
            <span>Add Prescription Sun Lens</span>
          </button>
        </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-800 font-semibold mb-2">
            📋 How Prescription Sun Lenses Work:
          </p>
          <ol className="text-sm text-blue-700 ml-4 list-decimal space-y-1">
            <li><strong>Create the main lens option</strong> (e.g., "Polarized", "Classic", "Blokz") using the form above</li>
            <li><strong>Go to Lens Finishes page</strong> and create finishes for this lens (e.g., "Classic", "Mirror", "Gradient", "Fashion")</li>
            <li><strong>Go to Lens Colors page</strong> and add colors to those finishes</li>
            <li>The structured data (lens → finishes → colors) will be available via <code className="bg-blue-100 px-1 rounded">GET /api/prescription-sun-lenses</code> for website display</li>
          </ol>
          <p className="text-xs text-blue-600 mt-2">
            💡 <strong>Note:</strong> Prescription Sun Lenses use a 3-level structure: Lens Option → Finishes → Colors
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    No prescription sun lenses found
                  </td>
                </tr>
              ) : (
                lenses.map((lens) => {
                  const lensId = lens.id;
                  const lensName = lens.name || 'N/A';
                  const lensSlug = lens.slug || 'N/A';
                  const lensType = lens.type || 'N/A';
                  const basePrice = lens.base_price !== undefined ? lens.base_price : (lens.basePrice !== undefined ? lens.basePrice : 0);
                  const sortOrder = lens.sort_order !== undefined ? lens.sort_order : (lens.sortOrder !== undefined ? lens.sortOrder : 0);
                  const isActive = lens.is_active !== undefined ? lens.is_active : (lens.isActive !== undefined ? lens.isActive : false);
                  
                  return (
                    <tr key={lensId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lensId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lensName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{lensSlug}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lensType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${basePrice ? basePrice.toFixed(2) : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sortOrder}</td>
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
                          onClick={() => handleEdit(lens)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          onClick={() => handleDelete(lensId)}
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
      </div>

      {modalOpen && (
        <PrescriptionSunLensModal
          lens={selectedLens}
          onClose={(shouldRefresh = false) => {
            console.log('🔄 PrescriptionSunLensModal onClose called with shouldRefresh:', shouldRefresh);
            console.log('🔄 Current selectedLens:', selectedLens);
            console.log('🔄 About to set modalOpen to false - this should NOT cause page refresh');
            
            // First close the modal
            setModalOpen(false);
            setSelectedLens(null);
            
            if (shouldRefresh) {
              console.log('📋 Refreshing prescription sun lenses list after modal save');
              console.log('🔄 This should only update the table, NOT refresh the page');
              console.log('🔄 Calling fetchLenses() now...');
              
              // Use setTimeout to ensure modal is fully closed before refresh
              // This prevents any UI conflicts and ensures no page refresh
              setTimeout(() => {
                console.log('🔄 Fetching prescription sun lenses from API (no page refresh should occur)');
                fetchLenses();
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

export default PrescriptionSunLenses;

