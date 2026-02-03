import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PrescriptionLensTypeModal from '../components/PrescriptionLensTypeModal';
import { 
  getPrescriptionLensTypes,
  deletePrescriptionLensType
} from '../api/prescriptionLensTypes';

const PrescriptionLensTypes = () => {
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
      const response = await getPrescriptionLensTypes({ page: 1, limit: 1000 });
      console.log('✅ Prescription lens types fetched successfully:', response.data);
      
      let lensTypesData = [];
      
      if (response.data) {
        // Handle various response structures from the API
        if (response.data.data) {
          const dataObj = response.data.data;
          
          // If data is directly an array
          if (Array.isArray(dataObj)) {
            lensTypesData = dataObj;
          } 
          // Check for various property names in nested data
          else if (dataObj.prescriptionLensTypes && Array.isArray(dataObj.prescriptionLensTypes)) {
            lensTypesData = dataObj.prescriptionLensTypes;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            lensTypesData = dataObj.data;
          } else if (dataObj.results && Array.isArray(dataObj.results)) {
            lensTypesData = dataObj.results;
          }
        } 
        // Check if response.data is directly an array
        else if (Array.isArray(response.data)) {
          lensTypesData = response.data;
        } 
        // Check for various property names at root level
        else {
          if (response.data.prescriptionLensTypes && Array.isArray(response.data.prescriptionLensTypes)) {
            lensTypesData = response.data.prescriptionLensTypes;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            lensTypesData = response.data.data;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            lensTypesData = response.data.results;
          }
        }
      }
      
      // Validate that we have actual lens type data with expected fields
      // Filter out any items that don't look like prescription lens types
      if (Array.isArray(lensTypesData)) {
        // Ensure each lens type has the expected structure
        lensTypesData = lensTypesData.filter(type => {
          // A valid lens type should have at least an id and name field
          return type && 
                 (type.id !== undefined && type.id !== null) &&
                 (type.name !== undefined && type.name !== null) &&
                 typeof type.name === 'string' &&
                 type.name.trim().length > 0;
        });
        
        console.log('Parsed prescription lens types:', lensTypesData);
        console.log('Lens types count:', lensTypesData.length);
        
        // Log first type structure for debugging
        if (lensTypesData.length > 0) {
          console.log('First lens type structure:', JSON.stringify(lensTypesData[0], null, 2));
        }
        
        setLensTypes(lensTypesData);
      } else {
        console.error('Prescription lens types data is not an array:', lensTypesData);
        console.error('Response structure:', JSON.stringify(response.data, null, 2));
        setLensTypes([]);
      }
    } catch (error) {
      console.error('❌ Prescription lens types fetch error:', error);
      console.error('Error details:', error.response?.data);
      setLensTypes([]);
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        toast.error('Prescription lens types endpoint not found. Check API configuration.');
      } else if (!error.response) {
        toast.error('Cannot connect to server. Check if backend is running.');
      } else {
        toast.error('Failed to fetch prescription lens types. Check console for details.');
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
    if (!window.confirm('Are you sure you want to delete this prescription lens type?')) {
      return;
    }

    try {
      const response = await deletePrescriptionLensType(id);
      console.log('✅ Prescription lens type deleted successfully:', response.data);
      toast.success('Prescription lens type deleted successfully');
      fetchLensTypes();
    } catch (error) {
      console.error('❌ Prescription lens type delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete prescription lens type');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete prescription lens type';
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
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Prescription Lens Types</h1>
          <button
            onClick={handleAddLensType}
            className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <FiPlus />
            <span>Add Prescription Lens Type</span>
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
                  Prescription Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Price
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
              {lensTypes.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-sm text-gray-500">
                    No prescription lens types found
                  </td>
                </tr>
              ) : (
                lensTypes.map((type) => {
                  // Handle both snake_case and camelCase field names
                  const typeId = type.id;
                  const typeName = type.name || type.Name;
                  const typeSlug = type.slug || type.Slug || '';
                  const prescriptionType = type.prescription_type || type.prescriptionType || type.prescription_type_id || type.prescriptionTypeId;
                  const basePrice = type.base_price !== undefined ? type.base_price : (type.basePrice !== undefined ? type.basePrice : 0);
                  const description = type.description || type.Description || 'N/A';
                  const isActive = type.is_active !== undefined ? type.is_active : (type.isActive !== undefined ? type.isActive : false);
                  const sortOrder = type.sort_order !== undefined ? type.sort_order : (type.sortOrder !== undefined ? type.sortOrder : 0);
                  const createdAt = type.created_at || type.createdAt || type.CreatedAt || type.created || null;
                  
                  // Format prescription type for display
                  let prescriptionTypeDisplay = 'N/A';
                  if (prescriptionType) {
                    if (typeof prescriptionType === 'string') {
                      prescriptionTypeDisplay = prescriptionType.replace(/_/g, ' ').replace(/-/g, ' ');
                    } else {
                      prescriptionTypeDisplay = String(prescriptionType);
                    }
                  }
                  
                  return (
                    <tr key={typeId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {typeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {typeName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {typeSlug}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {prescriptionTypeDisplay}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${basePrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {description}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
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
                          onClick={() => handleDelete(typeId)}
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
        <PrescriptionLensTypeModal
          lensType={selectedLensType}
          onClose={(shouldRefresh = false) => {
            console.log('🔄 PrescriptionLensTypeModal onClose called with shouldRefresh:', shouldRefresh);
            console.log('🔄 Current selectedLensType:', selectedLensType);
            console.log('🔄 About to set modalOpen to false - this should NOT cause page refresh');
            
            setModalOpen(false);
            setSelectedLensType(null);
            
            if (shouldRefresh) {
              console.log('📋 Refreshing prescription lens types list after modal save');
              console.log('🔄 This should only update the table, NOT refresh the page');
              
              // Use setTimeout to ensure modal is fully closed before refresh
              // This prevents any UI conflicts and ensures no page refresh
              setTimeout(() => {
                console.log('🔄 Fetching prescription lens types from API (no page refresh should occur)');
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

export default PrescriptionLensTypes;

