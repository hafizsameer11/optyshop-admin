import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LensCoatingModal from '../components/LensCoatingModal';
import { 
  getLensCoatings,
  deleteLensCoating
} from '../api/lensCoatings';

const LensCoatings = () => {
  const [lensCoatings, setLensCoatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLensCoating, setSelectedLensCoating] = useState(null);

  useEffect(() => {
    fetchLensCoatings();
  }, []);

  const fetchLensCoatings = async () => {
    try {
      setLoading(true);
      const response = await getLensCoatings({ page: 1, limit: 1000 });
      console.log('✅ Lens coatings fetched successfully:', response.data);
      
      // Handle various response structures from the API
      let lensCoatingsData = [];
      
      if (response.data) {
        if (response.data.data) {
          // Nested data structure
          if (Array.isArray(response.data.data)) {
            lensCoatingsData = response.data.data;
          } else if (response.data.data.lensCoatings && Array.isArray(response.data.data.lensCoatings)) {
            lensCoatingsData = response.data.data.lensCoatings;
          }
        } else if (Array.isArray(response.data)) {
          // Direct array
          lensCoatingsData = response.data;
        } else if (response.data.lensCoatings && Array.isArray(response.data.lensCoatings)) {
          lensCoatingsData = response.data.lensCoatings;
        }
      }
      
      console.log('Parsed lens coatings:', lensCoatingsData);
      
      if (Array.isArray(lensCoatingsData)) {
        setLensCoatings(lensCoatingsData);
      } else {
        console.error('❌ Lens coatings data is not an array:', lensCoatingsData);
        setLensCoatings([]);
      }
    } catch (error) {
      console.error('❌ Lens coatings fetch error:', error);
      console.error('Error details:', error.response?.data);
      setLensCoatings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLensCoating = () => {
    setSelectedLensCoating(null);
    setModalOpen(true);
  };

  const handleEdit = (lensCoating) => {
    setSelectedLensCoating(lensCoating);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lens coating?')) {
      return;
    }

    try {
      const response = await deleteLensCoating(id);
      console.log('✅ Lens coating deleted successfully:', response.data);
      toast.success('Lens coating deleted successfully');
      fetchLensCoatings();
    } catch (error) {
      console.error('❌ Lens coating delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete lens coating');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete lens coating';
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
        <h1 className="text-3xl font-bold text-gray-900">Lens Coatings</h1>
        <button
          onClick={handleAddLensCoating}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Coating</span>
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
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Adjustment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
              {lensCoatings.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                    No lens coatings found
                  </td>
                </tr>
              ) : (
                lensCoatings.map((coating) => (
                  <tr key={coating.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {coating.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {coating.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {coating.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                        {coating.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${coating.price_adjustment}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {coating.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          coating.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {coating.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {coating.created_at ? new Date(coating.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(coating)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        onClick={() => handleDelete(coating.id)}
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
        <LensCoatingModal
          lensCoating={selectedLensCoating}
          onClose={(shouldRefresh) => {
            setModalOpen(false);
            setSelectedLensCoating(null);
            if (shouldRefresh) {
              fetchLensCoatings();
            }
          }}
        />
      )}
    </div>
  );
};

export default LensCoatings;
