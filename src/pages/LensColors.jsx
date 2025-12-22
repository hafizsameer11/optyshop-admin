import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import LensColorModal from '../components/LensColorModal';
import { API_ROUTES } from '../config/apiRoutes';

const LensColors = () => {
  const [lensColors, setLensColors] = useState([]);
  const [lensOptions, setLensOptions] = useState([]);
  const [lensFinishes, setLensFinishes] = useState([]);
  const [prescriptionLensTypes, setPrescriptionLensTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLensColor, setSelectedLensColor] = useState(null);

  useEffect(() => {
    fetchLensOptions();
    fetchLensFinishes();
    fetchPrescriptionLensTypes();
    fetchLensColors();
  }, []);

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
      }
    } catch (error) {
      console.error('Lens options fetch error:', error);
    }
  };

  const fetchLensFinishes = async () => {
    try {
      const response = await api.get(`${API_ROUTES.ADMIN.LENS_FINISHES.LIST}?page=1&limit=1000`);
      let lensFinishesData = [];
      
      if (response.data) {
        if (response.data.data) {
          const dataObj = response.data.data;
          if (Array.isArray(dataObj)) {
            lensFinishesData = dataObj;
          } else if (dataObj.lensFinishes && Array.isArray(dataObj.lensFinishes)) {
            lensFinishesData = dataObj.lensFinishes;
          } else if (dataObj.finishes && Array.isArray(dataObj.finishes)) {
            lensFinishesData = dataObj.finishes;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            lensFinishesData = dataObj.data;
          } else if (dataObj.results && Array.isArray(dataObj.results)) {
            lensFinishesData = dataObj.results;
          }
        } else if (Array.isArray(response.data)) {
          lensFinishesData = response.data;
        } else {
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
      
      if (Array.isArray(lensFinishesData)) {
        setLensFinishes(lensFinishesData);
      }
    } catch (error) {
      console.error('Lens finishes fetch error:', error);
    }
  };

  const fetchPrescriptionLensTypes = async () => {
    try {
      const response = await api.get(`${API_ROUTES.ADMIN.PRESCRIPTION_LENS_TYPES.LIST}?page=1&limit=1000`);
      let prescriptionLensTypesData = [];
      
      if (response.data) {
        if (response.data.data) {
          const dataObj = response.data.data;
          if (Array.isArray(dataObj)) {
            prescriptionLensTypesData = dataObj;
          } else if (dataObj.prescriptionLensTypes && Array.isArray(dataObj.prescriptionLensTypes)) {
            prescriptionLensTypesData = dataObj.prescriptionLensTypes;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            prescriptionLensTypesData = dataObj.data;
          } else if (dataObj.results && Array.isArray(dataObj.results)) {
            prescriptionLensTypesData = dataObj.results;
          }
        } else if (Array.isArray(response.data)) {
          prescriptionLensTypesData = response.data;
        } else {
          if (response.data.prescriptionLensTypes && Array.isArray(response.data.prescriptionLensTypes)) {
            prescriptionLensTypesData = response.data.prescriptionLensTypes;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            prescriptionLensTypesData = response.data.data;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            prescriptionLensTypesData = response.data.results;
          }
        }
      }
      
      if (Array.isArray(prescriptionLensTypesData)) {
        setPrescriptionLensTypes(prescriptionLensTypesData);
      }
    } catch (error) {
      console.error('Prescription lens types fetch error:', error);
    }
  };

  const getParentName = (color) => {
    // Check for prescription lens type first
    if (color.prescription_lens_type_id || color.prescriptionLensTypeId) {
      const typeId = color.prescription_lens_type_id || color.prescriptionLensTypeId;
      if (color.prescription_lens_type && color.prescription_lens_type.name) {
        return { name: color.prescription_lens_type.name, type: 'prescription', isSun: color.prescription_lens_type.name.toLowerCase().includes('sun') };
      }
      if (color.prescriptionLensType && color.prescriptionLensType.name) {
        return { name: color.prescriptionLensType.name, type: 'prescription', isSun: color.prescriptionLensType.name.toLowerCase().includes('sun') };
      }
      const type = prescriptionLensTypes.find(t => t.id === typeId || t.id === parseInt(typeId));
      if (type) {
        return { name: type.name, type: 'prescription', isSun: type.name && type.name.toLowerCase().includes('sun') };
      }
      return { name: `Prescription Type ID: ${typeId}`, type: 'prescription', isSun: false };
    }
    
    // Check for lens finish
    if (color.lens_finish_id || color.lensFinishId) {
      const finishId = color.lens_finish_id || color.lensFinishId;
      if (color.lens_finish && color.lens_finish.name) {
        return { name: color.lens_finish.name, type: 'finish' };
      }
      if (color.lensFinish && color.lensFinish.name) {
        return { name: color.lensFinish.name, type: 'finish' };
      }
      const finish = lensFinishes.find(f => f.id === finishId || f.id === parseInt(finishId));
      if (finish) {
        return { name: finish.name, type: 'finish' };
      }
      return { name: `Finish ID: ${finishId}`, type: 'finish' };
    }
    
    // Default to lens option
    if (color.lens_option && color.lens_option.name) {
      return { name: color.lens_option.name, type: 'option' };
    }
    if (color.lensOption && color.lensOption.name) {
      return { name: color.lensOption.name, type: 'option' };
    }
    
    const optionId = color.lens_option_id || color.lensOptionId;
    if (!optionId) return { name: 'N/A', type: 'unknown' };
    const option = lensOptions.find(o => o.id === optionId || o.id === parseInt(optionId));
    return { name: option ? option.name : `ID: ${optionId}`, type: 'option' };
  };

  const fetchLensColors = async () => {
    try {
      setLoading(true);
      // Fetch with high limit to get all records
      // GET /api/admin/lens-colors (Admin endpoint)
      // Endpoint: GET {{base_url}}/api/admin/lens-colors?page=1&limit=100
      // Auth: Authorization: Bearer {{admin_token}}
      const response = await api.get(`${API_ROUTES.ADMIN.LENS_COLORS.LIST}?page=1&limit=1000`);
      console.log('Lens colors API Response:', JSON.stringify(response.data, null, 2));
      
      // Handle various response structures from the API
      // Possible formats:
      // 1. { success: true, data: { data: [...], pagination: {...} } }
      // 2. { success: true, data: { lensColors: [...], pagination: {...} } }
      // 3. { success: true, data: [...] }
      // 4. { data: [...], pagination: {...} }
      // 5. { lensColors: [...], pagination: {...} }
      // 6. [...] (direct array)
      let lensColorsData = [];
      
      if (response.data) {
        // Check for nested data structure
        if (response.data.data) {
          const dataObj = response.data.data;
          
          // If data is directly an array
          if (Array.isArray(dataObj)) {
            lensColorsData = dataObj;
          } 
          // Check for various property names in nested data
          else if (dataObj.lensColors && Array.isArray(dataObj.lensColors)) {
            lensColorsData = dataObj.lensColors;
          } else if (dataObj.colors && Array.isArray(dataObj.colors)) {
            lensColorsData = dataObj.colors;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            lensColorsData = dataObj.data;
          } else if (dataObj.results && Array.isArray(dataObj.results)) {
            lensColorsData = dataObj.results;
          }
        } 
        // Check if response.data is directly an array
        else if (Array.isArray(response.data)) {
          lensColorsData = response.data;
        } 
        // Check for various property names at root level
        else {
          if (response.data.lensColors && Array.isArray(response.data.lensColors)) {
            lensColorsData = response.data.lensColors;
          } else if (response.data.colors && Array.isArray(response.data.colors)) {
            lensColorsData = response.data.colors;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            lensColorsData = response.data.data;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            lensColorsData = response.data.results;
          }
        }
      }
      
      // Validate that we have actual lens color data with expected fields
      // Filter out any items that don't look like lens colors
      if (Array.isArray(lensColorsData)) {
        // Ensure each lens color has the expected structure
        lensColorsData = lensColorsData.filter(color => {
          // A valid lens color should have at least an id and name field
          return color && 
                 (color.id !== undefined && color.id !== null) &&
                 (color.name !== undefined && color.name !== null) &&
                 typeof color.name === 'string' &&
                 color.name.trim().length > 0;
        });
        
        console.log('Parsed lens colors:', lensColorsData);
        console.log('Parsed lens colors count:', lensColorsData.length);
        
        // Log first color structure for debugging
        if (lensColorsData.length > 0) {
          console.log('First lens color structure:', JSON.stringify(lensColorsData[0], null, 2));
        }
        
        setLensColors(lensColorsData);
        if (lensColorsData.length === 0) {
          console.warn('No lens colors found. Check if lens colors exist in the database.');
        }
      } else {
        console.error('Lens colors data is not an array:', lensColorsData);
        console.error('Response structure:', JSON.stringify(response.data, null, 2));
        setLensColors([]);
      }
    } catch (error) {
      console.error('Lens colors API error:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setLensColors([]);
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        toast.error('Lens colors endpoint not found. Check API configuration.');
      } else if (!error.response) {
        toast.error('Cannot connect to server. Check if backend is running.');
      } else {
        toast.error('Failed to fetch lens colors. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddLensColor = () => {
    setSelectedLensColor(null);
    setModalOpen(true);
  };

  const handleEdit = (lensColor) => {
    setSelectedLensColor(lensColor);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lens color?')) {
      return;
    }

    try {
      const response = await api.delete(API_ROUTES.ADMIN.LENS_COLORS.DELETE(id));
      // Handle response structure: { success, message }
      if (response.data?.success) {
        toast.success(response.data.message || 'Lens color deleted successfully');
      } else {
        toast.success('Lens color deleted successfully');
      }
      fetchLensColors();
    } catch (error) {
      console.error('Lens color delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete lens color');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete lens color';
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
        <h1 className="text-3xl font-bold text-gray-900">Lens Colors</h1>
        <button
          onClick={handleAddLensColor}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Lens Color</span>
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
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hex Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color Preview
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
              {lensColors.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-sm text-gray-500">
                    No lens colors found
                  </td>
                </tr>
              ) : (
                lensColors.map((color) => {
                  // Handle both snake_case and camelCase field names
                  const colorId = color.id;
                  const colorName = color.name || color.Name;
                  const colorCode = color.color_code || color.colorCode || 'N/A';
                  const hexCode = color.hex_code || color.hexCode || null;
                  const priceAdjustment = color.price_adjustment !== undefined ? color.price_adjustment : (color.priceAdjustment !== undefined ? color.priceAdjustment : 0);
                  const isActive = color.is_active !== undefined ? color.is_active : (color.isActive !== undefined ? color.isActive : false);
                  const sortOrder = color.sort_order !== null && color.sort_order !== undefined ? Number(color.sort_order) : (color.sortOrder !== null && color.sortOrder !== undefined ? Number(color.sortOrder) : 0);
                  
                  return (
                    <tr key={colorId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {colorId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(() => {
                          const parent = getParentName(color);
                          return (
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                parent.type === 'prescription' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : parent.type === 'finish'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {parent.type === 'prescription' ? 'Prescription' : parent.type === 'finish' ? 'Finish' : 'Option'}
                              </span>
                              <span>
                                {parent.name}
                                {parent.isSun && <span className="ml-1" title="Prescription Sun Color">☀️</span>}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {colorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {colorCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {hexCode || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hexCode ? (
                          <div
                            className="w-10 h-10 rounded border border-gray-300"
                            style={{ backgroundColor: hexCode }}
                            title={hexCode}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${priceAdjustment.toFixed(2)}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sortOrder}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleEdit(color)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          onClick={() => handleDelete(colorId)}
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
        <LensColorModal
          lensColor={selectedLensColor}
          onClose={() => {
            setModalOpen(false);
            setSelectedLensColor(null);
            fetchLensColors();
          }}
        />
      )}
    </div>
  );
};

export default LensColors;

