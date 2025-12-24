import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../../config/apiRoutes';
import AstigmatismDropdownValueModal from '../../components/AstigmatismDropdownValueModal';

const AstigmatismDropdownValues = () => {
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [filterFieldType, setFilterFieldType] = useState('');
  const [filterEyeType, setFilterEyeType] = useState('');

  useEffect(() => {
    fetchValues();
  }, [filterFieldType, filterEyeType]);

  const fetchValues = async () => {
    try {
      setLoading(true);
      let url = API_ROUTES.ADMIN.CONTACT_LENS_FORMS.ASTIGMATISM.DROPDOWN_VALUES.LIST;
      const params = new URLSearchParams();
      if (filterFieldType) params.append('field_type', filterFieldType);
      if (filterEyeType) params.append('eye_type', filterEyeType);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);
      
      let valuesData = [];

      if (response.data) {
        if (response.data.data) {
          const dataObj = response.data.data;
          if (Array.isArray(dataObj)) {
            valuesData = dataObj;
          } else if (dataObj.values && Array.isArray(dataObj.values)) {
            valuesData = dataObj.values;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            valuesData = dataObj.data;
          }
        } else if (Array.isArray(response.data)) {
          valuesData = response.data;
        } else if (response.data.values && Array.isArray(response.data.values)) {
          valuesData = response.data.values;
        }
      }

      if (Array.isArray(valuesData)) {
        setValues(valuesData);
      } else {
        setValues([]);
      }
    } catch (error) {
      console.error('Astigmatism dropdown values API error:', error);
      toast.error('Failed to fetch dropdown values');
      setValues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedValue(null);
    setModalOpen(true);
  };

  const handleEdit = (value) => {
    setSelectedValue(value);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dropdown value?')) {
      return;
    }

    try {
      const response = await api.delete(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.ASTIGMATISM.DROPDOWN_VALUES.DELETE(id));
      if (response.data?.success) {
        toast.success(response.data.message || 'Dropdown value deleted successfully');
      } else {
        toast.success('Dropdown value deleted successfully');
      }
      fetchValues();
    } catch (error) {
      console.error('Delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete value');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete value';
        toast.error(errorMessage);
      }
    }
  };

  const getFieldTypeBadgeColor = (fieldType) => {
    switch (fieldType) {
      case 'power':
        return 'bg-blue-100 text-blue-800';
      case 'cylinder':
        return 'bg-purple-100 text-purple-800';
      case 'axis':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEyeTypeBadgeColor = (eyeType) => {
    switch (eyeType) {
      case 'left':
        return 'bg-yellow-100 text-yellow-800';
      case 'right':
        return 'bg-pink-100 text-pink-800';
      case 'both':
      case null:
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold text-gray-900">Astigmatism Dropdown Values</h1>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Dropdown Value</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field Type
            </label>
            <select
              value={filterFieldType}
              onChange={(e) => setFilterFieldType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Field Types</option>
              <option value="power">Power</option>
              <option value="cylinder">Cylinder</option>
              <option value="axis">Axis</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eye Type
            </label>
            <select
              value={filterEyeType}
              onChange={(e) => setFilterEyeType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Eye Types</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="both">Both</option>
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
                  Field Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eye Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sort Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {values.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    No dropdown values found
                  </td>
                </tr>
              ) : (
                values.map((value) => {
                  const valueId = value.id;
                  const fieldType = value.field_type || value.fieldType || 'N/A';
                  const val = value.value || 'N/A';
                  const label = value.label || val;
                  const eyeType = value.eye_type || value.eyeType || 'both';
                  const sortOrder = value.sort_order !== null && value.sort_order !== undefined ? value.sort_order : (value.sortOrder !== null && value.sortOrder !== undefined ? value.sortOrder : 0);
                  const isActive = value.is_active !== undefined ? value.is_active : (value.isActive !== undefined ? value.isActive : true);

                  return (
                    <tr key={valueId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {valueId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getFieldTypeBadgeColor(fieldType)}`}>
                          {fieldType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {val}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEyeTypeBadgeColor(eyeType)}`}>
                          {eyeType || 'both'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sortOrder}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(value)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(valueId)}
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
        <AstigmatismDropdownValueModal
          value={selectedValue}
          onClose={() => {
            setModalOpen(false);
            setSelectedValue(null);
            fetchValues();
          }}
        />
      )}
    </div>
  );
};

export default AstigmatismDropdownValues;

