import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const VTOConfigModal = ({ config, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    cameraDistance: 50,
    lightingIntensity: 0.8,
    modelQuality: 'high',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (config) {
      // Parse settings if it's a JSON string
      let parsedSettings = {
        cameraDistance: 50,
        lightingIntensity: 0.8,
        modelQuality: 'high'
      };
      
      if (config.settings) {
        try {
          const settings = typeof config.settings === 'string' 
            ? JSON.parse(config.settings) 
            : config.settings;
          
          if (settings && typeof settings === 'object') {
            parsedSettings = {
              cameraDistance: settings.cameraDistance || 50,
              lightingIntensity: settings.lightingIntensity || 0.8,
              modelQuality: settings.modelQuality || 'high'
            };
          }
        } catch (error) {
          console.warn('Failed to parse settings:', error);
        }
      }

      setFormData({
        name: config.name || '',
        slug: config.slug || '',
        description: config.description || '',
        cameraDistance: parsedSettings.cameraDistance,
        lightingIntensity: parsedSettings.lightingIntensity,
        modelQuality: parsedSettings.modelQuality,
        is_active: config.is_active !== undefined ? config.is_active : true,
      });
    } else {
      // Reset form for new config
      setFormData({
        name: '',
        slug: '',
        description: '',
        cameraDistance: 50,
        lightingIntensity: 0.8,
        modelQuality: 'high',
        is_active: true,
      });
    }
  }, [config]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let fieldValue = type === 'checkbox' ? checked : value;
    
    // Handle numeric fields
    if (name === 'cameraDistance' || name === 'lightingIntensity') {
      fieldValue = type === 'number' ? parseFloat(value) || 0 : parseFloat(value) || 0;
    }
    
    // Auto-generate slug from name when creating new config
    if (name === 'name' && !config) {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormData({ 
        ...formData, 
        name: value,
        slug: slug
      });
    } else {
      setFormData({ 
        ...formData, 
        [name]: fieldValue 
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        toast.error('Name is required');
        setLoading(false);
        return;
      }
      if (!formData.slug || !formData.slug.trim()) {
        toast.error('Slug is required');
        setLoading(false);
        return;
      }

      // Build settings object from form fields
      const settings = {
        cameraDistance: formData.cameraDistance || 50,
        lightingIntensity: formData.lightingIntensity || 0.8,
        modelQuality: formData.modelQuality || 'high'
      };

      // Prepare data object
      const dataToSend = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        settings: JSON.stringify(settings),
        is_active: formData.is_active,
      };

      // Add optional fields only if they have values
      if (formData.description && formData.description.trim()) {
        dataToSend.description = formData.description.trim();
      } else {
        dataToSend.description = null;
      }

      let response;
      if (config) {
        response = await api.put(API_ROUTES.SIMULATIONS.VTO_CONFIG_BY_ID(config.id), dataToSend);
      } else {
        response = await api.post(API_ROUTES.SIMULATIONS.VTO_CONFIGS, dataToSend);
      }
      
      const successMessage = response.data?.message || (config ? 'VTO config updated successfully' : 'VTO config created successfully');
      toast.success(successMessage);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('VTO config save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save VTO config');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 400 || error.response.status === 422) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save VTO config';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">
            {config ? 'Edit VTO Config' : 'Add VTO Config'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
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
              placeholder="e.g., Default VTO Config"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., default-vto-config"
            />
            <p className="mt-1 text-sm text-gray-500">URL-friendly version of the name</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Optional description..."
            />
          </div>

          {/* Settings */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Settings</h3>
            
            {/* Camera Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Camera Distance
              </label>
              <input
                type="number"
                name="cameraDistance"
                value={formData.cameraDistance}
                onChange={handleChange}
                min="0"
                max="100"
                step="1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="50"
              />
              <p className="mt-1 text-sm text-gray-500">Distance of camera from model (0-100)</p>
            </div>

            {/* Lighting Intensity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lighting Intensity
              </label>
              <input
                type="number"
                name="lightingIntensity"
                value={formData.lightingIntensity}
                onChange={handleChange}
                min="0"
                max="1"
                step="0.1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.8"
              />
              <p className="mt-1 text-sm text-gray-500">Lighting intensity (0.0-1.0)</p>
            </div>

            {/* Model Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Quality
              </label>
              <select
                name="modelQuality"
                value={formData.modelQuality}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="low">Low (Faster performance)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Best quality)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">Quality level for 3D model rendering</p>
            </div>
          </div>

          {/* Active Status */}
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

          {/* Form Actions */}
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

export default VTOConfigModal;

