import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import LensFinishModal from '../components/LensFinishModal';
import { API_ROUTES } from '../config/apiRoutes';

const LensFinishes = () => {
  const [lensFinishes, setLensFinishes] = useState([]);
  const [lensOptions, setLensOptions] = useState([]);
  const [prescriptionSunLenses, setPrescriptionSunLenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLensFinish, setSelectedLensFinish] = useState(null);

  useEffect(() => {
    fetchLensFinishes();
    fetchLensOptions();
    fetchPrescriptionSunLenses();
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
          else if (dataObj.finishes && Array.isArray(dataObj.finishes)) {
            lensFinishesData = dataObj.finishes;
          } else if (dataObj.lensFinishes && Array.isArray(dataObj.lensFinishes)) {
            lensFinishesData = dataObj.lensFinishes;
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
          if (response.data.finishes && Array.isArray(response.data.finishes)) {
            lensFinishesData = response.data.finishes;
          } else if (response.data.lensFinishes && Array.isArray(response.data.lensFinishes)) {
            lensFinishesData = response.data.lensFinishes;
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
        console.log('Lens finishes loaded:', lensFinishesData.length);
        console.log('Sample finish:', lensFinishesData[0]);
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

  const fetchLensOptions = async () => {
    try {
      const response = await api.get(`${API_ROUTES.ADMIN.LENS_OPTIONS.LIST}?page=1&limit=1000`);
      let lensOptionsData = [];
      
      if (response.data) {
        if (response.data.data) {
          const dataObj = response.data.data;
          if (Array.isArray(dataObj)) {
            lensOptionsData = dataObj;
          } else if (dataObj.lensOptions && Array.isArray(dataObj.lensOptions)) {
            lensOptionsData = dataObj.lensOptions;
          } else if (dataObj.options && Array.isArray(dataObj.options)) {
            lensOptionsData = dataObj.options;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            lensOptionsData = dataObj.data;
          } else if (dataObj.results && Array.isArray(dataObj.results)) {
            lensOptionsData = dataObj.results;
          }
        } else if (Array.isArray(response.data)) {
          lensOptionsData = response.data;
        } else {
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
      
      if (Array.isArray(lensOptionsData)) {
        setLensOptions(lensOptionsData);
        console.log('Lens options loaded:', lensOptionsData.length);
      }
    } catch (error) {
      console.error('Lens options fetch error:', error);
    }
  };

  const fetchPrescriptionSunLenses = async () => {
    try {
      const response = await api.get(`${API_ROUTES.ADMIN.PRESCRIPTION_SUN_LENSES.LIST}?page=1&limit=1000`);
      let prescriptionSunLensesData = [];
      
      if (response.data) {
        if (response.data.data) {
          const dataObj = response.data.data;
          if (Array.isArray(dataObj)) {
            prescriptionSunLensesData = dataObj;
          } else if (dataObj.prescriptionSunLenses && Array.isArray(dataObj.prescriptionSunLenses)) {
            prescriptionSunLensesData = dataObj.prescriptionSunLenses;
          } else if (dataObj.lenses && Array.isArray(dataObj.lenses)) {
            prescriptionSunLensesData = dataObj.lenses;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            prescriptionSunLensesData = dataObj.data;
          } else if (dataObj.results && Array.isArray(dataObj.results)) {
            prescriptionSunLensesData = dataObj.results;
          }
        } else if (Array.isArray(response.data)) {
          prescriptionSunLensesData = response.data;
        } else {
          if (response.data.prescriptionSunLenses && Array.isArray(response.data.prescriptionSunLenses)) {
            prescriptionSunLensesData = response.data.prescriptionSunLenses;
          } else if (response.data.lenses && Array.isArray(response.data.lenses)) {
            prescriptionSunLensesData = response.data.lenses;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            prescriptionSunLensesData = response.data.data;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            prescriptionSunLensesData = response.data.results;
          }
        }
      }
      
      if (Array.isArray(prescriptionSunLensesData)) {
        setPrescriptionSunLenses(prescriptionSunLensesData);
        console.log('Prescription sun lenses loaded:', prescriptionSunLensesData.length);
      }
    } catch (error) {
      console.error('Prescription sun lenses fetch error:', error);
    }
  };

  const getLensOptionName = (lensOptionId) => {
    if (!lensOptionId && lensOptionId !== 0) return null;
    
    const id = typeof lensOptionId === 'string' ? parseInt(lensOptionId, 10) : lensOptionId;
    
    // Check regular lens options
    const regularOption = lensOptions.find(opt => {
      const optId = typeof opt.id === 'string' ? parseInt(opt.id, 10) : opt.id;
      return optId === id;
    });
    if (regularOption) {
      return { 
        name: regularOption.name, 
        type: regularOption.type || null, 
        source: 'regular' 
      };
    }
    
    // Check prescription sun lenses
    const sunLens = prescriptionSunLenses.find(lens => {
      const lensId = typeof lens.id === 'string' ? parseInt(lens.id, 10) : lens.id;
      return lensId === id;
    });
    if (sunLens) {
      return { 
        name: sunLens.name, 
        type: sunLens.type || null, 
        source: 'prescription_sun' 
      };
    }
    
    return null;
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
                      {(() => {
                        // Handle both snake_case and camelCase field names
                        const lensOption = finish.lens_option || finish.lensOption;
                        const lensOptionId = finish.lens_option_id || finish.lensOptionId || (lensOption?.id);
                        
                        // First check if API included the relationship (camelCase or snake_case)
                        if (lensOption?.name) {
                          return (
                            <>
                              <span className="font-medium text-gray-900">{lensOption.name}</span>
                              {lensOption.type && (
                                <span className="block text-xs text-gray-500 mt-1">Type: {lensOption.type}</span>
                              )}
                            </>
                          );
                        }
                        
                        // Otherwise, look it up from our fetched lists
                        if (lensOptionId !== null && lensOptionId !== undefined) {
                          const optionInfo = getLensOptionName(lensOptionId);
                          if (optionInfo) {
                            return (
                              <>
                                <span className="font-medium text-gray-900">{optionInfo.name}</span>
                                {optionInfo.type && (
                                  <span className="block text-xs text-gray-500 mt-1">
                                    Type: {optionInfo.type}
                                    {optionInfo.source === 'prescription_sun' && (
                                      <span className="ml-1 text-blue-600 font-semibold">(Prescription Sun)</span>
                                    )}
                                  </span>
                                )}
                                {!optionInfo.type && optionInfo.source === 'prescription_sun' && (
                                  <span className="block text-xs text-blue-600 mt-1">Prescription Sun Lens</span>
                                )}
                              </>
                            );
                          }
                          // ID exists but not found in our lists
                          return (
                            <span className="text-gray-500">
                              ID: {lensOptionId}
                              <span className="block text-xs text-gray-400 mt-1">(not found)</span>
                            </span>
                          );
                        }
                        
                        // If no lens option ID, show N/A
                        return (
                          <span className="text-gray-400 italic">
                            N/A
                            <span className="block text-xs mt-1">Not linked</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        // Handle both snake_case and camelCase field names
                        const lensOption = finish.lens_option || finish.lensOption;
                        const lensOptionId = finish.lens_option_id || finish.lensOptionId || (lensOption?.id);
                        
                        // First check if API included the relationship
                        if (lensOption?.type) {
                          return (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                              {lensOption.type}
                            </span>
                          );
                        }
                        
                        // Otherwise, look it up
                        if (lensOptionId !== null && lensOptionId !== undefined) {
                          const optionInfo = getLensOptionName(lensOptionId);
                          if (optionInfo?.type) {
                            return (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                {optionInfo.type}
                              </span>
                            );
                          }
                        }
                        
                        return <span className="text-gray-400">N/A</span>;
                      })()}
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
                      ${finish.price_adjustment || finish.priceAdjustment || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          (finish.is_active !== undefined ? finish.is_active : finish.isActive)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {(finish.is_active !== undefined ? finish.is_active : finish.isActive) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(finish.sort_order !== null && finish.sort_order !== undefined) 
                        ? Number(finish.sort_order) 
                        : (finish.sortOrder !== null && finish.sortOrder !== undefined)
                          ? Number(finish.sortOrder)
                          : 0}
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

