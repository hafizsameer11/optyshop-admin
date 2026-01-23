import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import FrameSizeModal from '../components/FrameSizeModal';
import { API_ROUTES } from '../config/apiRoutes';

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
      // Try admin endpoint first, fallback to public endpoint if needed
      let response;
      try {
        response = await api.get(API_ROUTES.ADMIN.FRAME_SIZES.LIST);
      } catch (adminError) {
        // If admin endpoint doesn't exist, rethrow the error
        // Frame sizes should only be managed through admin endpoint
        throw adminError;
      }
      console.log('Frame sizes API Response:', response.data);
      
      // Handle the nested data structure from the API
      // Response structure: { success, message, data: { frameSizes: [...] } }
      // Single frame size: { success, message, data: { frameSize: {...} } }
      // Also handle if data is directly an array or if it's in data.data
      let frameSizesData = [];
      
      if (response.data?.data) {
        // Check for various possible structures
        if (Array.isArray(response.data.data)) {
          frameSizesData = response.data.data;
        } else if (response.data.data.frameSizes) {
          frameSizesData = response.data.data.frameSizes;
        } else if (response.data.data.frame_sizes) {
          frameSizesData = response.data.data.frame_sizes;
        } else if (response.data.data.frameSize) {
          // Single frame size returned as array
          frameSizesData = [response.data.data.frameSize];
        } else if (response.data.data.data?.frameSizes) {
          frameSizesData = response.data.data.data.frameSizes;
        } else if (response.data.data.data?.frame_sizes) {
          frameSizesData = response.data.data.data.frame_sizes;
        }
      } else if (Array.isArray(response.data)) {
        frameSizesData = response.data;
      } else if (response.data?.frameSizes) {
        frameSizesData = response.data.frameSizes;
      } else if (response.data?.frame_sizes) {
        frameSizesData = response.data.frame_sizes;
      } else if (response.data?.frameSize) {
        // Single frame size
        frameSizesData = [response.data.frameSize];
      }
      
      console.log('Parsed frame sizes:', frameSizesData);
      console.log('Is array?', Array.isArray(frameSizesData));
      console.log('Length:', frameSizesData?.length);
      
      if (Array.isArray(frameSizesData)) {
        setFrameSizes(frameSizesData);
      } else {
        console.error('Frame sizes data is not an array:', frameSizesData);
        setFrameSizes([]);
      }
    } catch (error) {
      console.error('Frame sizes API error:', error);
      console.error('Error details:', error.response?.data);
      // Use empty array as fallback
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
      const response = await api.delete(API_ROUTES.ADMIN.FRAME_SIZES.DELETE(id));
      // Handle response structure: { success, message }
      if (response.data?.success) {
        toast.success(response.data.message || 'Frame size deleted successfully');
      } else {
        toast.success('Frame size deleted successfully');
      }
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
                  Product ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lens Width
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bridge Width
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temple Length
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frame Width
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frame Height
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size Label
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
              {frameSizes.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-sm text-gray-500">
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
                      {size.product_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {size.lens_width} mm
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {size.bridge_width} mm
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {size.temple_length} mm
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {size.frame_width ? `${size.frame_width} mm` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {size.frame_height ? `${size.frame_height} mm` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {size.size_label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {size.created_at ? new Date(size.created_at).toLocaleDateString() : 'N/A'}
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
            setModalOpen(false);
            setSelectedFrameSize(null);
            if (shouldRefresh) {
              fetchFrameSizes();
            }
          }}
        />
      )}
    </div>
  );
};

export default FrameSizes;



