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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {config ? 'Edit VTO Config' : 'Add VTO Config'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-all duration-200"
            aria-label="Close"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-modern"
              required
              placeholder="e.g., Default VTO Config"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="input-modern"
              required
              placeholder="e.g., default-vto-config"
            />
            <p className="mt-1 text-sm text-gray-500">URL-friendly version of the name</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="input-modern"
              placeholder="Optional description..."
            />
          </div>

          {/* Settings */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Settings</h3>
            
            {/* Camera Distance */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                className="input-modern"
                placeholder="50"
              />
              <p className="mt-1 text-sm text-gray-500">Distance of camera from model (0-100)</p>
            </div>

            {/* Lighting Intensity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                className="input-modern"
                placeholder="0.8"
              />
              <p className="mt-1 text-sm text-gray-500">Lighting intensity (0.0-1.0)</p>
            </div>

            {/* Model Quality */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Model Quality
              </label>
              <select
                name="modelQuality"
                value={formData.modelQuality}
                onChange={handleChange}
                className="input-modern"
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
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
              Active
            </label>
          </div>

          {/* Form Actions */}
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

export default VTOConfigModal;

