import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import FrameSizeModal from '../components/FrameSizeModal';
import { API_ROUTES } from '../config/apiRoutes';
import { getFrameSizes, deleteFrameSize } from '../api/frameSizes';

const FrameSizes = () => {
  const [frameSizes, setFrameSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFrameSize, setSelectedFrameSize] = useState(null);

  useEffect(() => {
    fetchFrameSizes();
  }, []);

  const fetchFrameSizes = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting to fetch frame sizes...');
      
      const response = await getFrameSizes();
      console.log('✅ API call successful:', response);
      
      console.log('Full API Response:', response);
      console.log('Response.data:', response.data);
      console.log('Response.data.data:', response.data?.data);
      console.log('Response.data.data.frameSizes:', response.data?.data?.frameSizes);
      
      // Simplified data parsing based on the actual JSON response structure
      let frameSizesData = [];
      
      if (response.data?.data?.frameSizes) {
        frameSizesData = response.data.data.frameSizes;
      } else if (response.data?.frameSizes) {
        frameSizesData = response.data.frameSizes;
      } else if (Array.isArray(response.data?.data)) {
        frameSizesData = response.data.data;
      }
      
      console.log('Parsed frame sizes:', frameSizesData);
      console.log('Is array?', Array.isArray(frameSizesData));
      console.log('Length:', frameSizesData?.length);
      if (frameSizesData.length > 0) {
        console.log('First frame size data:', frameSizesData[0]);
        console.log('Available keys in first frame size:', Object.keys(frameSizesData[0]));
      }
      
      if (Array.isArray(frameSizesData)) {
        setFrameSizes(frameSizesData);
      } else {
        console.error('Frame sizes data is not an array:', frameSizesData);
        setFrameSizes([]);
      }
    } catch (error) {
      console.error('Frame sizes API error:', error);
      console.error('Error details:', error.response?.data);
      setFrameSizes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFrameSize = () => {
    setSelectedFrameSize(null);
    setModalOpen(true);
  };

  const handleEdit = (frameSize) => {
    setSelectedFrameSize(frameSize);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this frame size?')) {
      return;
    }

    try {
      const response = await deleteFrameSize(id);
      // Handle response structure: { success, message }
      if (response.data?.success) {
        toast.success(response.data.message || 'Frame size deleted successfully');
      } else {
        toast.success('Frame size deleted successfully');
      }
      // Refresh the list without page reload
      fetchFrameSizes();
    } catch (error) {
      console.error('Frame size delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete frame size');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete frame size';
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
        <h1 className="text-3xl font-bold text-gray-900">Frame Sizes</h1>
        <button
          onClick={handleAddFrameSize}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Frame Size</span>
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
                  NAME
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PRODUCT ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SLUG
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WIDTH
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BRIDGE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TEMPLE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {frameSizes.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                    No frame sizes found
                  </td>
                </tr>
              ) : (
                frameSizes.map((size) => (
                  <tr key={size.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {size.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {size.product?.name || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {size.product_id || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {size.product?.slug || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {size.lens_width ? `${size.lens_width} mm` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {size.bridge_width ? `${size.bridge_width} mm` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {size.temple_length ? `${size.temple_length} mm` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {size.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(size)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        onClick={() => handleDelete(size.id)}
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
        <FrameSizeModal
          frameSize={selectedFrameSize}
          onClose={(shouldRefresh = false) => {
            console.log('🔄 FrameSizeModal onClose called with shouldRefresh:', shouldRefresh);
            setModalOpen(false);
            setSelectedFrameSize(null);
            if (shouldRefresh) {
              console.log('📋 Refreshing frame sizes list after modal save');
              // Immediately refresh the data from API
              fetchFrameSizes();
            }
          }}
        />
      )}
    </div>
  );
};

export default FrameSizes;



