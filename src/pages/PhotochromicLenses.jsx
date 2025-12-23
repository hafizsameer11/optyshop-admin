import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PhotochromicLensModal from '../components/PhotochromicLensModal';
import { API_ROUTES } from '../config/apiRoutes';

const PhotochromicLenses = () => {
  const [lenses, setLenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLens, setSelectedLens] = useState(null);
  const [filterActive, setFilterActive] = useState('all');

  useEffect(() => {
    fetchLenses();
  }, [filterActive]);

  const fetchLenses = async () => {
    try {
      setLoading(true);
      let queryString = 'page=1&limit=1000';
      if (filterActive !== 'all') {
        queryString += `&isActive=${filterActive === 'active' ? 'true' : 'false'}`;
      }
      const response = await api.get(`${API_ROUTES.ADMIN.PHOTOCHROMIC_LENSES.LIST}?${queryString}`);
      console.log('Photochromic Lenses API Response:', JSON.stringify(response.data, null, 2));
      
      let lensesData = [];
      
      if (response.data) {
        if (response.data.data) {
          const dataObj = response.data.data;
          if (Array.isArray(dataObj)) {
            lensesData = dataObj;
          } else if (dataObj.photochromicLenses && Array.isArray(dataObj.photochromicLenses)) {
            lensesData = dataObj.photochromicLenses;
          } else if (dataObj.lenses && Array.isArray(dataObj.lenses)) {
            lensesData = dataObj.lenses;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            lensesData = dataObj.data;
          } else if (dataObj.results && Array.isArray(dataObj.results)) {
            lensesData = dataObj.results;
          }
        } else if (Array.isArray(response.data)) {
          lensesData = response.data;
        } else {
          if (response.data.photochromicLenses && Array.isArray(response.data.photochromicLenses)) {
            lensesData = response.data.photochromicLenses;
          } else if (response.data.lenses && Array.isArray(response.data.lenses)) {
            lensesData = response.data.lenses;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            lensesData = response.data.data;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            lensesData = response.data.results;
          }
        }
      }
      
      if (Array.isArray(lensesData)) {
        lensesData = lensesData.filter(lens => {
          return lens && 
                 (lens.id !== undefined && lens.id !== null) &&
                 (lens.name !== undefined && lens.name !== null) &&
                 typeof lens.name === 'string' &&
                 lens.name.trim().length > 0;
        });
        
        setLenses(lensesData);
      } else {
        setLenses([]);
      }
    } catch (error) {
      console.error('Photochromic Lenses API error:', error);
      setLenses([]);
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        toast.error('Photochromic Lenses endpoint not found. Check API configuration.');
      } else if (!error.response) {
        toast.error('Cannot connect to server. Check if backend is running.');
      } else {
        toast.error('Failed to fetch photochromic lenses. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedLens(null);
    setModalOpen(true);
  };

  const handleEdit = (lens) => {
    setSelectedLens(lens);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this photochromic lens?')) {
      return;
    }

    try {
      await api.delete(API_ROUTES.ADMIN.PHOTOCHROMIC_LENSES.DELETE(id));
      toast.success('Photochromic lens deleted successfully');
      fetchLenses();
    } catch (error) {
      console.error('Photochromic lens delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete photochromic lens');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete photochromic lens';
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
        <h1 className="text-3xl font-bold text-gray-900">Photochromic Lenses</h1>
        <div className="flex items-center gap-4">
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
            <span>Add Photochromic Lens</span>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No photochromic lenses found
                  </td>
                </tr>
              ) : (
                lenses.map((lens) => {
                  const lensId = lens.id;
                  const lensName = lens.name || '';
                  const lensSlug = lens.slug || '';
                  const basePrice = lens.base_price !== undefined ? lens.base_price : (lens.basePrice !== undefined ? lens.basePrice : 0);
                  const sortOrder = lens.sort_order !== undefined ? lens.sort_order : (lens.sortOrder !== undefined ? lens.sortOrder : 0);
                  const isActive = lens.is_active !== undefined ? lens.is_active : (lens.isActive !== undefined ? lens.isActive : false);
                  
                  return (
                    <tr key={lensId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lensId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lensName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{lensSlug}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${basePrice.toFixed(2)}</td>
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
        <PhotochromicLensModal
          lens={selectedLens}
          onClose={() => {
            setModalOpen(false);
            setSelectedLens(null);
            fetchLenses();
          }}
        />
      )}
    </div>
  );
};

export default PhotochromicLenses;

