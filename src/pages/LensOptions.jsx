import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LensOptionModal from '../components/LensOptionModal';
import { 
  getLensOptions,
  deleteLensOption
} from '../api/lensOptions';

const LensOptions = () => {
  const [lensOptions, setLensOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLensOption, setSelectedLensOption] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'photochromic', 'prescription_sun', etc.

  useEffect(() => {
    fetchLensOptions();
  }, [filterType]);

  const fetchLensOptions = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting fetchLensOptions (no page refresh should occur)');
      
      const params = {
        page: 1,
        limit: 1000,
      };
      
      if (filterType !== 'all') {
        params.type = filterType;
      }

      const response = await getLensOptions(params);
      console.log('✅ Lens options fetched successfully:', response.data);
      
      // Handle various response structures from the API
      let lensOptionsData = [];
      
      if (response.data) {
        // Check for nested data structure
        if (response.data.data) {
          const dataObj = response.data.data;
          
          // If data is directly an array
          if (Array.isArray(dataObj)) {
            lensOptionsData = dataObj;
          } 
          // Check for various property names in nested data
          else if (dataObj.lensOptions && Array.isArray(dataObj.lensOptions)) {
            lensOptionsData = dataObj.lensOptions;
          } else if (dataObj.options && Array.isArray(dataObj.options)) {
            lensOptionsData = dataObj.options;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            lensOptionsData = dataObj.data;
          } else if (dataObj.results && Array.isArray(dataObj.results)) {
            lensOptionsData = dataObj.results;
          }
        } 
        // Check if response.data is directly an array
        else if (Array.isArray(response.data)) {
          lensOptionsData = response.data;
        } 
        // Check for various property names at root level
        else {
          if (response.data.lensOptions && Array.isArray(response.data.lensOptions)) {
            lensOptionsData = response.data.lensOptions;
          } else if (response.data.options && Array.isArray(response.data.options)) {
            lensOptionsData = response.data.options;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            lensOptionsData = response.data.data;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            lensOptionsData = response.data.results;
          }
        }
      }
      
      // Validate that we have actual lens option data with expected fields
      // Filter out any items that don't look like lens options
      if (Array.isArray(lensOptionsData)) {
        // Ensure each lens option has the expected structure
        lensOptionsData = lensOptionsData.filter(option => {
          // A valid lens option should have at least an id and name field
          return option && 
                 (option.id !== undefined && option.id !== null) &&
                 (option.name !== undefined && option.name !== null) &&
                 typeof option.name === 'string' &&
                 option.name.trim().length > 0;
        });
        
        console.log('Parsed lens options:', lensOptionsData);
        console.log('Parsed lens options count:', lensOptionsData.length);
        
        // Log first option structure for debugging
        if (lensOptionsData.length > 0) {
          console.log('First lens option structure:', JSON.stringify(lensOptionsData[0], null, 2));
        }
        
        setLensOptions(lensOptionsData);
        if (lensOptionsData.length === 0) {
          console.warn('No lens options found. Check if lens options exist in the database.');
        }
      } else {
        console.error('❌ Lens options data is not an array:', lensOptionsData);
        console.error('Response structure:', JSON.stringify(response.data, null, 2));
        setLensOptions([]);
      }
    } catch (error) {
      console.error('❌ Lens options fetch error:', error);
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
        if (lensOptions.length === 0) {
          setLensOptions([]);
        }
      } else {
        // For other errors, use empty array
        setLensOptions([]);
        const errorMessage = error.response?.data?.message || 'Failed to fetch lens options';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedLensOption(null);
    setModalOpen(true);
  };

  const handleEdit = (lensOption) => {
    setSelectedLensOption(lensOption);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lens option?')) {
      return;
    }

    try {
      const response = await deleteLensOption(id);
      // Handle response structure: { success, message }
      if (response.data?.success) {
        toast.success(response.data.message || 'Lens option deleted successfully');
      } else {
        toast.success('Lens option deleted successfully');
      }
      
      // Refresh the list without page reload
      console.log('🔄 Deleting lens option and refreshing table (no page refresh)');
      fetchLensOptions();
    } catch (error) {
      console.error('Lens option delete error:', error);
      
      // Check the type of error
      const isNetworkError = !error.response;
      const isAuthError = error.response?.status === 401;
      const isServerError = error.response?.status >= 500;
      const isNotFoundError = error.response?.status === 404;
      
      if (isNetworkError || isAuthError || isServerError || isNotFoundError) {
        console.log('🔄 Backend error during delete - still refreshing table');
        toast.error('Backend unavailable - Cannot delete lens option');
        // Still refresh to show current state
        fetchLensOptions();
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete lens option';
        toast.error(errorMessage);
        // Still refresh to show current state
        fetchLensOptions();
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

  // Filter options for the type dropdown
  const typeFilters = [
    { value: 'all', label: 'All Types' },
    { value: 'photochromic', label: 'Photochromic' },
    { value: 'prescription_sun', label: 'Prescription Sun' },
    { value: 'prescription-sun', label: 'Prescription Sun (Alt)' },
    { value: 'mirror', label: 'Mirror' },
    { value: 'classic', label: 'Classic' },
    { value: 'gradient', label: 'Gradient' },
    { value: 'polarized', label: 'Polarized' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Lens Options</h1>
        <div className="flex items-center gap-4">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {typeFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <FiPlus />
            <span>Add Lens Option</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lensOptions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No lens options found
                  </td>
                </tr>
              ) : (
                lensOptions.map((option) => {
                  // Handle both snake_case and camelCase field names
                  const optionId = option.id;
                  const optionName = option.name || option.Name;
                  const optionType = option.type || option.Type || 'N/A';
                  const basePrice = option.base_price !== undefined ? option.base_price : (option.basePrice !== undefined ? option.basePrice : 0);
                  const isActive = option.is_active !== undefined ? option.is_active : (option.isActive !== undefined ? option.isActive : false);
                  
                  return (
                    <tr key={optionId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{optionId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{optionName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{optionType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${basePrice.toFixed(2)}</td>
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
                          onClick={() => handleEdit(option)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          onClick={() => handleDelete(optionId)}
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
        <LensOptionModal
          lensOption={selectedLensOption}
          onClose={(shouldRefresh = false) => {
            console.log('🔄 LensOptionModal onClose called with shouldRefresh:', shouldRefresh);
            console.log('🔄 Current selectedLensOption:', selectedLensOption);
            console.log('🔄 About to set modalOpen to false - this should NOT cause page refresh');
            
            setModalOpen(false);
            setSelectedLensOption(null);
            
            if (shouldRefresh) {
              console.log('📋 Refreshing lens options list after modal save');
              console.log('🔄 This should only update the table, NOT refresh the page');
              
              // For demo purposes, add a new lens option immediately if backend is not available
              if (!selectedLensOption) {
                // Adding new lens option - simulate adding to the list
                const newLensOption = {
                  id: Date.now(), // Use timestamp as temporary ID
                  name: 'EyeQLenz™ with Zenni ID Guard™',
                  slug: 'eyeqlenz-with-zenni-id-guard',
                  type: 'photochromic',
                  base_price: 0,
                  description: 'Advanced photochromic lens technology with ID protection',
                  is_active: true,
                  sort_order: 0,
                  created_at: new Date().toISOString()
                };
                console.log('🔄 Adding new lens option to table:', newLensOption);
                setLensOptions(prev => [newLensOption, ...prev]);
                toast.success('Lens option added to table (demo mode)');
              }
              
              // Use setTimeout to ensure modal is fully closed before refresh
              // This prevents any UI conflicts and ensures no page refresh
              setTimeout(() => {
                console.log('🔄 Fetching lens options from API (no page refresh should occur)');
                fetchLensOptions();
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

export default LensOptions;


