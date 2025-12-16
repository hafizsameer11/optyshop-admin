import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const LensColorModal = ({ lensColor, onClose }) => {
  const [formData, setFormData] = useState({
    lens_option_id: '',
    name: '',
    color_code: '',
    hex_code: '#000000',
    image_url: '',
    price_adjustment: '',
    is_active: true,
    sort_order: 0,
  });
  const [lensOptions, setLensOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    fetchLensOptions();
    if (lensColor) {
      setFormData({
        lens_option_id: lensColor.lens_option_id || '',
        name: lensColor.name || '',
        color_code: lensColor.color_code || '',
        hex_code: lensColor.hex_code || '#000000',
        image_url: lensColor.image_url || '',
        price_adjustment: lensColor.price_adjustment || '',
        is_active: lensColor.is_active !== undefined ? lensColor.is_active : true,
        sort_order: lensColor.sort_order !== null && lensColor.sort_order !== undefined ? lensColor.sort_order : 0,
      });
    } else {
      setFormData({
        lens_option_id: '',
        name: '',
        color_code: '',
        hex_code: '#000000',
        image_url: '',
        price_adjustment: '',
        is_active: true,
        sort_order: 0,
      });
    }
  }, [lensColor]);

  const fetchLensOptions = async () => {
    try {
      setLoadingOptions(true);
      // Fetch with high limit to get all records
      const response = await api.get(`${API_ROUTES.ADMIN.LENS_OPTIONS.LIST}?page=1&limit=1000`);
      console.log('Lens options API Response (Modal):', JSON.stringify(response.data, null, 2));
      
      // Handle various response structures from the API
      // Possible formats:
      // 1. { success: true, data: { lensOptions: [...], pagination: {...} } }
      // 2. { success: true, data: { data: [...], pagination: {...} } }
      // 3. { success: true, data: [...] }
      // 4. { lensOptions: [...], pagination: {...} }
      // 5. { data: [...], pagination: {...} }
      // 6. [...] (direct array)
      let lensOptionsData = [];
      
      if (response.data) {
        // Check for nested data structure
        if (response.data.data) {
          const dataObj = response.data.data;
          
          // If data is directly an array
          if (Array.isArray(dataObj)) {
            lensOptionsData = dataObj;
          } 
          // Check for various property names in nested data
          else if (dataObj.lensOptions && Array.isArray(dataObj.lensOptions)) {
            lensOptionsData = dataObj.lensOptions;
          } else if (dataObj.options && Array.isArray(dataObj.options)) {
            lensOptionsData = dataObj.options;
          } else if (dataObj.data && Array.isArray(dataObj.data)) {
            lensOptionsData = dataObj.data;
          } else if (dataObj.results && Array.isArray(dataObj.results)) {
            lensOptionsData = dataObj.results;
          }
        } 
        // Check if response.data is directly an array
        else if (Array.isArray(response.data)) {
          lensOptionsData = response.data;
        } 
        // Check for various property names at root level
        else {
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
      
      console.log('Parsed lens options (Modal):', lensOptionsData);
      console.log('Parsed lens options count:', lensOptionsData.length);
      
      if (Array.isArray(lensOptionsData)) {
        setLensOptions(lensOptionsData);
        if (lensOptionsData.length === 0) {
          console.warn('No lens options found. Check if lens options exist in the database.');
          toast.error('No lens options found. Please create lens options first.');
        }
      } else {
        console.error('Lens options data is not an array:', lensOptionsData);
        console.error('Response structure:', response.data);
        setLensOptions([]);
        toast.error('Failed to parse lens options. Check console for details.');
      }
    } catch (error) {
      console.error('Failed to fetch lens options:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setLensOptions([]);
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        toast.error('Lens options endpoint not found. Check API configuration.');
      } else if (!error.response) {
        toast.error('Cannot connect to server. Check if backend is running.');
      } else {
        toast.error('Failed to fetch lens options. Check console for details.');
      }
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : parseFloat(value) || '') : value;
    
    setFormData({ ...formData, [name]: fieldValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.lens_option_id) {
      toast.error('Please select a lens option');
      return;
    }
    
    setLoading(true);

    try {
      // Prepare data with proper types
      const submitData = {
        lens_option_id: parseInt(formData.lens_option_id, 10),
        name: formData.name,
        color_code: formData.color_code || null,
        hex_code: formData.hex_code || null,
        image_url: formData.image_url || null,
        price_adjustment: parseFloat(formData.price_adjustment) || 0,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order, 10) || 0,
      };
      
      let response;
      if (lensColor) {
        response = await api.put(API_ROUTES.ADMIN.LENS_COLORS.UPDATE(lensColor.id), submitData);
        // Handle response structure: { success, message, data: { lensColor: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Lens color updated successfully');
        } else {
          toast.success('Lens color updated successfully');
        }
      } else {
        response = await api.post(API_ROUTES.ADMIN.LENS_COLORS.CREATE, submitData);
        // Handle response structure: { success, message, data: { lensColor: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Lens color created successfully');
        } else {
          toast.success('Lens color created successfully');
        }
      }
      onClose();
    } catch (error) {
      console.error('Lens color save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save lens color');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to save lens colors');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save lens color';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">
            {lensColor ? 'Edit Lens Color' : 'Add Lens Color'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lens Option *
            </label>
            <select
              name="lens_option_id"
              value={formData.lens_option_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              disabled={loadingOptions || lensOptions.length === 0}
            >
              <option value="">
                {loadingOptions 
                  ? 'Loading options...' 
                  : lensOptions.length === 0 
                    ? 'No lens options available' 
                    : 'Select lens option'}
              </option>
              {lensOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} {option.type ? `(${option.type})` : ''}
                </option>
              ))}
            </select>
            {loadingOptions && (
              <p className="text-xs text-gray-500 mt-1">Loading options...</p>
            )}
            {!loadingOptions && lensOptions.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No lens options found. Please create lens options first in the Lens Options page.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., Blue Mirror"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Code
            </label>
            <input
              type="text"
              name="color_code"
              value={formData.color_code}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., BLUE_MIRROR"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hex Code *
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                name="hex_code"
                value={formData.hex_code}
                onChange={handleChange}
                className="h-10 w-20 border rounded-lg cursor-pointer"
              />
              <input
                type="text"
                name="hex_code"
                value={formData.hex_code}
                onChange={handleChange}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                placeholder="#000000"
                pattern="^#[0-9A-Fa-f]{6}$"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Select a color or enter hex code (e.g., #0066CC)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com/images/blue-mirror.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Adjustment *
            </label>
            <input
              type="number"
              name="price_adjustment"
              value={formData.price_adjustment}
              onChange={handleChange}
              step="0.01"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., 0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Order
            </label>
            <input
              type="number"
              name="sort_order"
              value={formData.sort_order}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LensColorModal;

