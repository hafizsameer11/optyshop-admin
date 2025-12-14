import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ShippingMethodModal from '../components/ShippingMethodModal';
import { API_ROUTES } from '../config/apiRoutes';

const ShippingMethods = () => {
  const [shippingMethods, setShippingMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);

  useEffect(() => {
    fetchShippingMethods();
  }, []);

  const fetchShippingMethods = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.ADMIN.SHIPPING_METHODS.LIST);
      console.log('Shipping methods API Response:', response.data);
      
      const shippingMethodsData = response.data?.data?.shippingMethods || response.data?.shippingMethods || response.data?.data || response.data || [];
      console.log('Parsed shipping methods:', shippingMethodsData);
      
      if (Array.isArray(shippingMethodsData)) {
        setShippingMethods(shippingMethodsData);
      } else {
        console.error('Shipping methods data is not an array:', shippingMethodsData);
        setShippingMethods([]);
      }
    } catch (error) {
      console.error('Shipping methods API error:', error);
      setShippingMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedShippingMethod(null);
    setModalOpen(true);
  };

  const handleEdit = (shippingMethod) => {
    setSelectedShippingMethod(shippingMethod);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shipping method?')) {
      return;
    }

    try {
      await api.delete(API_ROUTES.ADMIN.SHIPPING_METHODS.DELETE(id));
      toast.success('Shipping method deleted successfully');
      fetchShippingMethods();
    } catch (error) {
      console.error('Shipping method delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete shipping method');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete shipping method';
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
        <h1 className="text-3xl font-bold text-gray-900">Shipping Methods</h1>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Shipping Method</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shippingMethods.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No shipping methods found
                  </td>
                </tr>
              ) : (
                shippingMethods.map((method) => (
                  <tr key={method.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{method.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{method.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{method.type || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${method.price || '0.00'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{method.estimated_days || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          method.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {method.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(method)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        onClick={() => handleDelete(method.id)}
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
        <ShippingMethodModal
          shippingMethod={selectedShippingMethod}
          onClose={() => {
            setModalOpen(false);
            setSelectedShippingMethod(null);
            fetchShippingMethods();
          }}
        />
      )}
    </div>
  );
};

export default ShippingMethods;


