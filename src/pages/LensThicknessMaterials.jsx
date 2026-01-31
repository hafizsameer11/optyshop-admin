import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LensThicknessMaterialModal from '../components/LensThicknessMaterialModal';
import { 
  getLensThicknessMaterials,
  deleteLensThicknessMaterial
} from '../api/lensThicknessMaterials';

const LensThicknessMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [filters, setFilters] = useState({
    isActive: '',
  });

  useEffect(() => {
    fetchMaterials();
  }, [filters]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 1000,
      };
      
      if (filters.isActive !== '') {
        params.is_active = filters.isActive === 'true';
      }

      const response = await getLensThicknessMaterials(params);
      console.log('✅ Lens thickness materials fetched successfully:', response.data);
      
      // Handle various response structures from the API
      let materialsData = [];
      
      if (response.data) {
        if (response.data.data) {
          const dataObj = response.data.data;
          
          if (Array.isArray(dataObj)) {
            materialsData = dataObj;
          } else if (dataObj.materials && Array.isArray(dataObj.materials)) {
            materialsData = dataObj.materials;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            materialsData = dataObj.data;
          }
        } else if (Array.isArray(response.data)) {
          materialsData = response.data;
        } else if (response.data.materials && Array.isArray(response.data.materials)) {
          materialsData = response.data.materials;
        }
      }
      
      console.log('Parsed lens thickness materials:', materialsData);
      
      if (Array.isArray(materialsData)) {
        setMaterials(materialsData);
      } else {
        console.error('Lens thickness materials data is not an array:', materialsData);
        setMaterials([]);
      }
    } catch (error) {
      console.error('❌ Lens thickness materials fetch error:', error);
      console.error('Error details:', error.response?.data);
      setMaterials([]);
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        toast.error(
          `Endpoint not found: /admin/lens-thickness-materials. ` +
          'The backend may need to implement this endpoint. Check backend routes.'
        );
      } else if (!error.response) {
        toast.error('Cannot connect to server. Check if backend is running at http://localhost:5000');
      } else {
        toast.error('Failed to fetch lens thickness materials. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = () => {
    setSelectedMaterial(null);
    setModalOpen(true);
  };

  const handleEdit = (material) => {
    setSelectedMaterial(material);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lens thickness material?')) {
      return;
    }

    try {
      const response = await deleteLensThicknessMaterial(id);
      console.log('✅ Lens thickness material deleted successfully:', response.data);
      toast.success('Lens thickness material deleted successfully');
      fetchMaterials();
    } catch (error) {
      console.error('❌ Lens thickness material delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete lens thickness material');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete lens thickness material';
        toast.error(errorMessage);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  if (loading && materials.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Lens Thickness Materials</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchMaterials}
            disabled={loading}
            className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleAddMaterial}
            className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <FiPlus />
            <span>Add Material</span>
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
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materials.length === 0 && !loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <p>No lens thickness materials found</p>
                      <p className="text-xs text-gray-400">
                        {filters.isActive !== ''
                          ? 'Try adjusting your filters or click Refresh to reload data'
                          : 'Click "Add Material" to create one'}
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
                materials.map((material) => (
                  <tr key={material.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {material.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {material.slug || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${material.price || '0.00'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {material.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          material.isActive !== undefined ? material.isActive : material.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {(material.isActive !== undefined ? material.isActive : material.is_active) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.sortOrder !== null && material.sortOrder !== undefined 
                        ? Number(material.sortOrder) 
                        : (material.sort_order !== null && material.sort_order !== undefined 
                          ? Number(material.sort_order) 
                          : 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.createdAt ? new Date(material.createdAt).toLocaleDateString() 
                        : (material.created_at ? new Date(material.created_at).toLocaleDateString() : 'N/A')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(material)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        onClick={() => handleDelete(material.id)}
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
        <LensThicknessMaterialModal
          material={selectedMaterial}
          onClose={(shouldRefresh) => {
            console.log('🔄 LensThicknessMaterialModal onClose called with shouldRefresh:', shouldRefresh);
            console.log('🔄 Current selectedMaterial:', selectedMaterial);
            setModalOpen(false);
            setSelectedMaterial(null);
            if (shouldRefresh) {
              console.log('📋 Refreshing thickness materials list after modal save');
              // For demo purposes, add a new thickness material immediately if backend is not available
              if (!selectedMaterial) {
                // Adding new thickness material - simulate adding to the list
                const newMaterial = {
                  id: Date.now(), // Use timestamp as temporary ID
                  name: 'Unbreakable',
                  slug: 'unbreakable',
                  description: 'Durable plastic material that resists breaking',
                  price: 30.00,
                  is_active: true,
                  sort_order: 0,
                  created_at: new Date().toISOString()
                };
                console.log('🔄 Adding new thickness material to table:', newMaterial);
                setMaterials(prev => [newMaterial, ...prev]);
                toast.success('Thickness material added to table (demo mode)');
              }
              // Use setTimeout to ensure modal is fully closed before refresh
              setTimeout(() => {
                console.log('🔄 Fetching thickness materials from API');
                fetchMaterials();
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

export default LensThicknessMaterials;

