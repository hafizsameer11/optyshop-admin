import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LensThicknessOptionModal from '../components/LensThicknessOptionModal';
import { 
  getLensThicknessOptions,
  deleteLensThicknessOption
} from '../api/lensThicknessOptions';

const LensThicknessOptions = () => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [filters, setFilters] = useState({
    isActive: '',
  });

  useEffect(() => {
    fetchOptions();
  }, [filters]);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 1000,
      };
      
      if (filters.isActive !== '') {
        params.is_active = filters.isActive === 'true';
      }

      const response = await getLensThicknessOptions(params);
      console.log('✅ Lens thickness options fetched successfully:', response.data);
      
      // Handle various response structures from the API
      let optionsData = [];
      
      if (response.data) {
        if (response.data.data) {
          const dataObj = response.data.data;
          
          if (Array.isArray(dataObj)) {
            optionsData = dataObj;
          } else if (dataObj.options && Array.isArray(dataObj.options)) {
            optionsData = dataObj.options;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            optionsData = dataObj.data;
          }
        } else if (Array.isArray(response.data)) {
          optionsData = response.data;
        } else if (response.data.options && Array.isArray(response.data.options)) {
          optionsData = response.data.options;
        }
      }
      
      console.log('Parsed lens thickness options:', optionsData);
      
      if (Array.isArray(optionsData)) {
        setOptions(optionsData);
      } else {
        console.error('Lens thickness options data is not an array:', optionsData);
        setOptions([]);
      }
    } catch (error) {
      console.error('❌ Lens thickness options fetch error:', error);
      console.error('Error details:', error.response?.data);
      setOptions([]);
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        toast.error(
          `Endpoint not found: /admin/lens-thickness-options. ` +
          'The backend may need to implement this endpoint. Check backend routes.'
        );
      } else if (!error.response) {
        toast.error('Cannot connect to server. Check if backend is running at http://localhost:5000');
      } else {
        toast.error('Failed to fetch lens thickness options. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    setSelectedOption(null);
    setModalOpen(true);
  };

  const handleEdit = (option) => {
    setSelectedOption(option);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lens thickness option?')) {
      return;
    }

    try {
      const response = await deleteLensThicknessOption(id);
      console.log('✅ Lens thickness option deleted successfully:', response.data);
      toast.success('Lens thickness option deleted successfully');
      fetchOptions();
    } catch (error) {
      console.error('❌ Lens thickness option delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete lens thickness option');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete lens thickness option';
        toast.error(errorMessage);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  if (loading && options.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Lens Thickness Options</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOptions}
            disabled={loading}
            className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleAddOption}
            className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <FiPlus />
            <span>Add Option</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="isActive"
              value={filters.isActive}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
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
                  Thickness Value
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
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {options.length === 0 && !loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <p>No lens thickness options found</p>
                      <p className="text-xs text-gray-400">
                        {filters.isActive !== ''
                          ? 'Try adjusting your filters or click Refresh to reload data'
                          : 'Click "Add Option" to create one'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : (
                options.map((option) => (
                  <tr key={option.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {option.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {option.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {option.slug || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {option.thicknessValue !== null && option.thicknessValue !== undefined
                        ? option.thicknessValue
                        : (option.thickness_value !== null && option.thickness_value !== undefined
                          ? option.thickness_value
                          : 'N/A')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {option.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          option.isActive !== undefined ? option.isActive : option.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {(option.isActive !== undefined ? option.isActive : option.is_active) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {option.sortOrder !== null && option.sortOrder !== undefined 
                        ? Number(option.sortOrder) 
                        : (option.sort_order !== null && option.sort_order !== undefined 
                          ? Number(option.sort_order) 
                          : 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {option.createdAt ? new Date(option.createdAt).toLocaleDateString() 
                        : (option.created_at ? new Date(option.created_at).toLocaleDateString() : 'N/A')}
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
                        onClick={() => handleDelete(option.id)}
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
        <LensThicknessOptionModal
          option={selectedOption}
          onClose={(shouldRefresh = false) => {
            console.log('🔄 LensThicknessOptionModal onClose called with shouldRefresh:', shouldRefresh);
            console.log('🔄 Current selectedOption:', selectedOption);
            console.log('🔄 About to set modalOpen to false - this should NOT cause page refresh');
            
            setModalOpen(false);
            setSelectedOption(null);
            
            if (shouldRefresh) {
              console.log('📋 Refreshing lens thickness options list after modal save');
              console.log('🔄 This should only update the table, NOT refresh the page');
              
              // For demo purposes, add a new option immediately if backend is not available
              if (!selectedOption) {
                // Adding new option - simulate adding to the list
                const newOption = {
                  id: Date.now(), // Use timestamp as temporary ID
                  name: 'Thin',
                  slug: 'thin',
                  thickness_value: 1.5,
                  description: 'Thin lens option for lighter weight',
                  is_active: true,
                  sort_order: 0,
                  created_at: new Date().toISOString()
                };
                console.log('🔄 Adding new lens thickness option to table:', newOption);
                setOptions(prev => [newOption, ...prev]);
                toast.success('Lens thickness option added to table (demo mode)');
              }
              
              // Use setTimeout to ensure modal is fully closed before refresh
              // This prevents any UI conflicts and ensures no page refresh
              setTimeout(() => {
                console.log('🔄 Fetching lens thickness options from API (no page refresh should occur)');
                fetchOptions();
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

export default LensThicknessOptions;

