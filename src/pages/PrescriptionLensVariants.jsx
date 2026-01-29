import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PrescriptionLensVariantModal from '../components/PrescriptionLensVariantModal';
import { 
  getPrescriptionLensVariants,
  deletePrescriptionLensVariant
} from '../api/prescriptionLensVariants';
import { getPrescriptionLensTypes } from '../api/prescriptionLensTypes';

const PrescriptionLensVariants = () => {
  const [variants, setVariants] = useState([]);
  const [lensTypes, setLensTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [filters, setFilters] = useState({
    prescriptionLensTypeId: '',
    isActive: '',
    isRecommended: '',
  });

  useEffect(() => {
    fetchLensTypes();
  }, []);

  useEffect(() => {
    fetchVariants();
  }, [filters]);

  const fetchLensTypes = async () => {
    try {
      const response = await getPrescriptionLensTypes({ page: 1, limit: 1000 });
      let lensTypesData = [];
      
      if (response.data) {
        if (response.data.data) {
          if (Array.isArray(response.data.data)) {
            lensTypesData = response.data.data;
          } else if (response.data.data.prescriptionLensTypes && Array.isArray(response.data.data.prescriptionLensTypes)) {
            lensTypesData = response.data.data.prescriptionLensTypes;
          }
        } else if (Array.isArray(response.data)) {
          lensTypesData = response.data;
        } else if (response.data.prescriptionLensTypes && Array.isArray(response.data.prescriptionLensTypes)) {
          lensTypesData = response.data.prescriptionLensTypes;
        }
      }
      
      if (Array.isArray(lensTypesData)) {
        setLensTypes(lensTypesData);
      }
    } catch (error) {
      console.error('❌ Prescription lens types fetch error:', error);
    }
  };

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 1000,
      };
      
      if (filters.prescriptionLensTypeId) {
        params.prescriptionLensTypeId = filters.prescriptionLensTypeId;
      }
      if (filters.isActive !== '') {
        params.is_active = filters.isActive === 'true';
      }
      if (filters.isRecommended !== '') {
        params.isRecommended = filters.isRecommended === 'true';
      }

      const response = await getPrescriptionLensVariants(params);
      console.log('✅ Prescription lens variants fetched successfully:', response.data);
      
      let variantsData = [];
      
      if (response.data) {
        // Handle various response structures from the API
        // Check for nested data structure first
        if (response.data.data) {
          const dataObj = response.data.data;
          
          // If data is directly an array
          if (Array.isArray(dataObj)) {
            variantsData = dataObj;
          } 
          // Check for various property names in nested data
          else if (dataObj.prescriptionLensVariants && Array.isArray(dataObj.prescriptionLensVariants)) {
            variantsData = dataObj.prescriptionLensVariants;
          } else if (dataObj.variants && Array.isArray(dataObj.variants)) {
            variantsData = dataObj.variants;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            variantsData = dataObj.data;
          } else if (dataObj.results && Array.isArray(dataObj.results)) {
            variantsData = dataObj.results;
          }
        } 
        // Check if response.data is directly an array
        else if (Array.isArray(response.data)) {
          variantsData = response.data;
        } 
        // Check for various property names at root level
        else {
          if (response.data.prescriptionLensVariants && Array.isArray(response.data.prescriptionLensVariants)) {
            variantsData = response.data.prescriptionLensVariants;
          } else if (response.data.variants && Array.isArray(response.data.variants)) {
            variantsData = response.data.variants;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            variantsData = response.data.data;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            variantsData = response.data.results;
          }
        }
      }
      
      // Validate that we have actual variant data with expected fields
      // Filter out any items that don't look like prescription lens variants
      if (Array.isArray(variantsData)) {
        // Ensure each variant has the expected structure
        variantsData = variantsData.filter(variant => {
          // A valid variant should have at least an id and name field
          // and the name should not look like a person's name (basic validation)
          return variant && 
                 (variant.id !== undefined && variant.id !== null) &&
                 (variant.name !== undefined && variant.name !== null) &&
                 typeof variant.name === 'string' &&
                 variant.name.trim().length > 0;
        });
        
        console.log('Parsed prescription lens variants:', variantsData);
        console.log('Variants count:', variantsData.length);
        
        // Log first variant structure for debugging
        if (variantsData.length > 0) {
          console.log('First variant structure:', JSON.stringify(variantsData[0], null, 2));
        }
        
        setVariants(variantsData);
      } else {
        console.error('❌ Prescription lens variants data is not an array:', variantsData);
        console.error('Response structure:', JSON.stringify(response.data, null, 2));
        setVariants([]);
      }
    } catch (error) {
      console.error('❌ Prescription lens variants fetch error:', error);
      console.error('Error details:', error.response?.data);
      setVariants([]);
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        toast.error('Prescription Lens Variants endpoint not found. Check API configuration.');
      } else if (!error.response) {
        toast.error('Cannot connect to server. Check if backend is running.');
      } else {
        toast.error('Failed to fetch prescription lens variants. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariant = () => {
    setSelectedVariant(null);
    setModalOpen(true);
  };

  const handleEdit = (variant) => {
    setSelectedVariant(variant);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prescription lens variant?')) {
      return;
    }

    try {
      const response = await deletePrescriptionLensVariant(id);
      console.log('✅ Prescription lens variant deleted successfully:', response.data);
      toast.success('Prescription lens variant deleted successfully');
      fetchVariants();
    } catch (error) {
      console.error('❌ Prescription lens variant delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete prescription lens variant');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete prescription lens variant';
        toast.error(errorMessage);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const getLensTypeName = (variant) => {
    // First check if the variant has nested prescription_lens_type data
    if (variant.prescription_lens_type && variant.prescription_lens_type.name) {
      return variant.prescription_lens_type.name;
    }
    if (variant.prescriptionLensType && variant.prescriptionLensType.name) {
      return variant.prescriptionLensType.name;
    }
    
    // Otherwise, look up by ID
    const typeId = variant.prescription_lens_type_id || variant.prescriptionLensTypeId;
    if (!typeId) return 'N/A';
    const type = lensTypes.find(t => t.id === typeId || t.id === parseInt(typeId));
    return type ? type.name : `Type ID: ${typeId}`;
  };

  if (loading && variants.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Prescription Lens Variants</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchVariants}
            className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            title="Refresh data"
          >
            <FiRefreshCw />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleAddVariant}
            className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <FiPlus />
            <span>Add Prescription Lens Variant</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prescription Lens Type
            </label>
            <select
              name="prescriptionLensTypeId"
              value={filters.prescriptionLensTypeId}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {lensTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recommended
            </label>
            <select
              name="isRecommended"
              value={filters.isRecommended}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Recommended</option>
              <option value="false">Not Recommended</option>
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
                  Prescription Lens Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommended
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
              {variants.length === 0 && !loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <p>No prescription lens variants found</p>
                      <p className="text-xs text-gray-400">
                        {filters.prescriptionLensTypeId || filters.isActive !== '' || filters.isRecommended !== '' 
                          ? 'Try adjusting your filters or click Refresh to reload data'
                          : 'Click "Add Prescription Lens Variant" to create one'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : (
                variants.map((variant) => {
                  // Handle both snake_case and camelCase field names
                  const variantId = variant.id;
                  const variantName = variant.name || variant.Name;
                  const variantPrice = variant.price || variant.Price || 0;
                  const variantDescription = variant.description || variant.Description || 'N/A';
                  const variantIsRecommended = variant.is_recommended !== undefined ? variant.is_recommended : (variant.isRecommended !== undefined ? variant.isRecommended : false);
                  const variantIsActive = variant.is_active !== undefined ? variant.is_active : (variant.isActive !== undefined ? variant.isActive : false);
                  const variantSortOrder = variant.sort_order || variant.sortOrder || 0;
                  const variantCreatedAt = variant.created_at || variant.createdAt || variant.CreatedAt;
                  
                  return (
                    <tr key={variantId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {variantId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {variantName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getLensTypeName(variant)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${variantPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {variantDescription}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            variantIsRecommended
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {variantIsRecommended ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            variantIsActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {variantIsActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {variantSortOrder}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {variantCreatedAt ? new Date(variantCreatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleEdit(variant)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          onClick={() => handleDelete(variantId)}
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
        <PrescriptionLensVariantModal
          variant={selectedVariant}
          lensTypes={lensTypes}
          onClose={(shouldRefresh) => {
            setModalOpen(false);
            setSelectedVariant(null);
            if (shouldRefresh) {
              fetchVariants();
            }
          }}
        />
      )}
    </div>
  );
};

export default PrescriptionLensVariants;

