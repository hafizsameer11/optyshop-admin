import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';

const ConfigModal = ({ config, onClose }) => {
  const [formData, setFormData] = useState({
    config_key: '',
    config_value: '',
    category: 'optical',
    description: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [isJsonValue, setIsJsonValue] = useState(false);

  useEffect(() => {
    if (config) {
      // Check if config_value is JSON
      let value = config.config_value || '';
      let isJson = false;
      
      if (typeof value === 'string') {
        // Check if it's a JSON string (starts with " or { or [)
        if (value.trim().startsWith('"') || value.trim().startsWith('{') || value.trim().startsWith('[')) {
          try {
            // Try to parse it
            const parsed = JSON.parse(value);
            value = JSON.stringify(parsed, null, 2);
            isJson = true;
          } catch {
            // If parsing fails, it might be a quoted string, remove quotes
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }
          }
        }
      } else if (typeof value === 'object') {
        value = JSON.stringify(value, null, 2);
        isJson = true;
      }

      setFormData({
        config_key: config.config_key || '',
        config_value: value,
        category: config.category || 'optical',
        description: config.description || '',
        is_active: config.is_active !== undefined ? config.is_active : true,
      });
      setIsJsonValue(isJson);
    } else {
      setFormData({
        config_key: '',
        config_value: '',
        category: 'optical',
        description: '',
        is_active: true,
      });
      setIsJsonValue(false);
    }
  }, [config]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.config_key || !formData.config_key.trim()) {
        toast.error('Configuration key is required');
        setLoading(false);
        return;
      }
      if (!formData.config_value || !formData.config_value.trim()) {
        toast.error('Configuration value is required');
        setLoading(false);
        return;
      }

      // Prepare data object
      const dataToSend = {
        config_key: formData.config_key.trim(),
        config_value: formData.config_value.trim(),
        category: formData.category,
        description: formData.description.trim() || null,
        is_active: formData.is_active,
      };

      // If updating, include the id
      if (config && config.id) {
        dataToSend.id = config.id;
      }

      // If it's JSON, try to parse and stringify to ensure valid JSON
      if (isJsonValue) {
        try {
          const parsed = JSON.parse(formData.config_value.trim());
          dataToSend.config_value = JSON.stringify(parsed);
        } catch (parseError) {
          toast.error('Invalid JSON format in config value');
          setLoading(false);
          return;
        }
      }

      const response = await api.put(API_ROUTES.SIMULATIONS.UPDATE_CONFIG, dataToSend);
      const successMessage = response.data?.message || (config ? 'Configuration updated successfully' : 'Configuration created successfully');
      toast.success(successMessage);
      onClose();
    } catch (error) {
      console.error('Config save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save configuration');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 400 || error.response.status === 422) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save configuration';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {config ? 'Edit Configuration' : 'Add Configuration'}
          </h2>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-all duration-200"
              aria-label="Close"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Configuration Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="config_key"
              value={formData.config_key}
              onChange={handleChange}
              className="input-modern"
              required
              placeholder="e.g., pd_calculation_method"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Value <span className="text-red-500">*</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isJsonValue}
                  onChange={(e) => setIsJsonValue(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-xs text-gray-500">JSON Format</span>
              </label>
            </div>
            {isJsonValue ? (
              <textarea
                name="config_value"
                value={formData.config_value}
                onChange={handleChange}
                rows="6"
                className="input-modern font-mono text-sm resize-none"
                required
                placeholder='{"key": "value"} or ["array"]'
              />
            ) : (
              <input
                type="text"
                name="config_value"
                value={formData.config_value}
                onChange={handleChange}
                className="input-modern"
                required
                placeholder="e.g., binocular or &quot;string value&quot;"
              />
            )}
            <p className="mt-1 text-xs text-gray-500">
              {isJsonValue ? 'Enter valid JSON format' : 'For JSON values, check the JSON Format checkbox'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-modern"
              required
            >
              <option value="optical">Optical</option>
              <option value="pd_calculator">PD Calculator</option>
              <option value="lens_thickness">Lens Thickness</option>
              <option value="simulation">Simulation</option>
              <option value="vto">Virtual Try-On (VTO)</option>
              <option value="calculation">Calculation</option>
              <option value="display">Display</option>
              <option value="performance">Performance</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="input-modern"
              placeholder="Brief description of this configuration"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
              Active
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-modern disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigModal;

