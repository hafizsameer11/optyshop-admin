import React, { useState, useEffect } from 'react';
import { FiSettings, FiEye, FiZap, FiSliders, FiX, FiPlus, FiEdit2, FiTrash2, FiUpload } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ConfigModal from '../components/ConfigModal';
import VTOConfigModal from '../components/VTOConfigModal';
import { API_ROUTES } from '../config/apiRoutes';

const Simulations = () => {
  const [activeTab, setActiveTab] = useState('config');
  const [configs, setConfigs] = useState([]);
  const [vtoConfigs, setVtoConfigs] = useState([]);
  const [vtoAssets, setVtoAssets] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [vtoConfigModalOpen, setVtoConfigModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [selectedVtoConfig, setSelectedVtoConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vtoConfigsLoading, setVtoConfigsLoading] = useState(false);
  const [vtoAssetsLoading, setVtoAssetsLoading] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [vtoSettings, setVtoSettings] = useState({
    cameraDistance: 50,
    lightingIntensity: 0.8,
    modelQuality: 'high'
  });
  const [savingVTO, setSavingVTO] = useState(false);
  const [activeToolModal, setActiveToolModal] = useState(null);
  const [toolResults, setToolResults] = useState({});
  const [assetType, setAssetType] = useState('frame_3d');
  const [assetFile, setAssetFile] = useState(null);

  useEffect(() => {
    fetchConfigs();
    fetchVTOSettings();
    if (activeTab === 'vto-configs') {
      fetchVTOConfigs();
    }
    if (activeTab === 'vto-assets') {
      fetchVTOAssets();
    }
  }, [activeTab]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.SIMULATIONS.CONFIG);
      // API returns a single config object or array of configs
      const configsData = response.data?.data?.configs || response.data?.configs || 
                         (Array.isArray(response.data?.data) ? response.data.data : 
                         (response.data?.data ? [response.data.data] : []));
      setConfigs(Array.isArray(configsData) ? configsData : []);
      
      // Load VTO settings from configs if available
      const vtoConfig = configsData.find(c => c.config_key === 'vto_settings');
      if (vtoConfig && vtoConfig.config_value) {
        try {
          const parsed = typeof vtoConfig.config_value === 'string' 
            ? JSON.parse(vtoConfig.config_value) 
            : vtoConfig.config_value;
          if (parsed && typeof parsed === 'object') {
            setVtoSettings(prev => ({
              ...prev,
              ...parsed
            }));
          }
        } catch (parseError) {
          console.warn('Failed to parse VTO settings from config:', parseError);
        }
      }
    } catch (error) {
      console.error('Configs API error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot fetch configs');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 404) {
        // Config endpoint might not be implemented yet
        setConfigs([]);
      } else {
        toast.error('Failed to fetch configs');
      }
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVTOSettings = async () => {
    // VTO settings endpoint doesn't exist - using default settings
    // Settings are managed through VTO configs instead
  };

  const handleDeleteConfig = async (configId) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    try {
      // Update config to set is_active to false (soft delete)
      // Or if there's a delete endpoint, use that
      await api.put(API_ROUTES.SIMULATIONS.UPDATE_CONFIG, {
        id: configId,
        is_active: false
      });
      toast.success('Configuration deactivated successfully');
      fetchConfigs();
    } catch (error) {
      console.error('Delete config error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete configuration');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete configuration';
        toast.error(errorMessage);
      }
    }
  };

  const handleSaveVTOSettings = async () => {
    setSavingVTO(true);
    try {
      // Find existing vto_settings config
      const existingConfig = configs.find(c => c.config_key === 'vto_settings');
      
      // Save VTO settings as a config entry
      const dataToSend = {
        config_key: 'vto_settings',
        config_value: JSON.stringify(vtoSettings),
        category: 'vto',
        description: 'VTO camera and lighting settings',
        is_active: true,
      };

      // If updating existing config, include id
      if (existingConfig && existingConfig.id) {
        dataToSend.id = existingConfig.id;
      }

      const response = await api.put(API_ROUTES.SIMULATIONS.UPDATE_CONFIG, dataToSend);
      const successMessage = response.data?.message || 'VTO settings saved successfully';
      toast.success(successMessage);
      fetchConfigs();
    } catch (error) {
      console.error('Save VTO settings error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save VTO settings');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 400 || error.response.status === 422) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save VTO settings';
        toast.error(errorMessage);
      }
    } finally {
      setSavingVTO(false);
    }
  };

  const handleVTOChange = (field, value) => {
    setVtoSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddConfig = () => {
    setSelectedConfig(null);
    setModalOpen(true);
  };

  const handleEditConfig = (config) => {
    setSelectedConfig(config);
    setModalOpen(true);
  };

  const fetchVTOConfigs = async () => {
    try {
      setVtoConfigsLoading(true);
      const response = await api.get(API_ROUTES.SIMULATIONS.VTO_CONFIGS);
      // API response structure: { success: true, message: "...", data: { configs: [...] } }
      const configsData = response.data?.data?.configs || response.data?.configs || [];
      setVtoConfigs(Array.isArray(configsData) ? configsData : []);
    } catch (error) {
      console.error('VTO configs API error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot fetch VTO configs');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        toast.error('Failed to fetch VTO configs');
      }
      setVtoConfigs([]);
    } finally {
      setVtoConfigsLoading(false);
    }
  };

  const handleAddVTOConfig = () => {
    setSelectedVtoConfig(null);
    setVtoConfigModalOpen(true);
  };

  const handleEditVTOConfig = (config) => {
    setSelectedVtoConfig(config);
    setVtoConfigModalOpen(true);
  };

  const handleDeleteVTOConfig = async (id) => {
    if (!window.confirm('Are you sure you want to delete this VTO config?')) {
      return;
    }

    try {
      await api.delete(API_ROUTES.SIMULATIONS.VTO_CONFIG_BY_ID(id));
      toast.success('VTO config deleted successfully');
      fetchVTOConfigs();
    } catch (error) {
      console.error('VTO config delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete VTO config');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete VTO config';
        toast.error(errorMessage);
      }
    }
  };

  const fetchVTOAssets = async () => {
    try {
      setVtoAssetsLoading(true);
      const response = await api.get(API_ROUTES.SIMULATIONS.VTO_ASSETS);
      const assetsData = response.data?.data?.assets || response.data?.assets || [];
      setVtoAssets(Array.isArray(assetsData) ? assetsData : []);
    } catch (error) {
      console.error('VTO assets API error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot fetch VTO assets');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        toast.error('Failed to fetch VTO assets');
      }
      setVtoAssets([]);
    } finally {
      setVtoAssetsLoading(false);
    }
  };

  const handleUploadAsset = async (e) => {
    e.preventDefault();
    if (!assetFile) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!assetType) {
      toast.error('Please select an asset type');
      return;
    }

    setUploadingAsset(true);
    try {
      const formData = new FormData();
      formData.append('file', assetFile);
      formData.append('asset_type', assetType);

      const response = await api.post(API_ROUTES.SIMULATIONS.VTO_ASSETS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // API response structure: { success: true, message: "...", data: { asset: {...} } }
      const successMessage = response.data?.message || 'Asset uploaded successfully';
      toast.success(successMessage);
      setAssetFile(null);
      setAssetType('frame_3d');
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      fetchVTOAssets();
    } catch (error) {
      console.error('Asset upload error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot upload asset');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 400 || error.response.status === 422) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to upload asset';
        toast.error(errorMessage);
      }
    } finally {
      setUploadingAsset(false);
    }
  };

  const handleOpenTool = (toolName) => {
    setActiveToolModal(toolName);
    setToolResults({});
  };

  const handleCloseTool = () => {
    setActiveToolModal(null);
    setToolResults({});
  };

  const simulationTools = [
    {
      title: 'PD Calculator',
      description: 'Calculate pupillary distance from measurements',
      icon: FiEye,
      color: 'bg-blue-500'
    },
    {
      title: 'Lens Thickness Calculator',
      description: 'Calculate lens thickness based on prescription',
      icon: FiSliders,
      color: 'bg-purple-500'
    },
    {
      title: 'Photochromic Simulator',
      description: 'Simulate photochromic lens behavior',
      icon: FiZap,
      color: 'bg-yellow-500'
    },
    {
      title: 'AR Coating Simulator',
      description: 'Simulate anti-reflective coating effects',
      icon: FiSettings,
      color: 'bg-green-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Optical Simulations</h1>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('config')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'config'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Configuration
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tools'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Simulation Tools
            </button>
            <button
              onClick={() => setActiveTab('vto')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'vto'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              VTO Settings
            </button>
            <button
              onClick={() => setActiveTab('vto-configs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'vto-configs'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              VTO Configs
            </button>
            <button
              onClick={() => setActiveTab('vto-assets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'vto-assets'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              VTO Assets
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'config' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Simulation Configuration</h2>
                <button 
                  onClick={handleAddConfig}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  Add Config
                </button>
              </div>
              <div className="space-y-3">
                {configs.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No configurations found. Click "Add Config" to create one.</p>
                  </div>
                ) : (
                  configs.map((config) => (
                    <div key={config.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6 flex-1">
                          <div className="w-48">
                            <p className="text-sm font-semibold text-gray-900">
                              {config.config_key}
                            </p>
                            {config.description && (
                              <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700 font-mono break-all">
                              {typeof config.config_value === 'string' 
                                ? (config.config_value.length > 100 
                                    ? `${config.config_value.substring(0, 100)}...` 
                                    : config.config_value)
                                : JSON.stringify(config.config_value)}
                            </p>
                          </div>
                          <div className="w-32">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              config.category === 'optical' ? 'bg-blue-100 text-blue-800' :
                              config.category === 'simulation' ? 'bg-purple-100 text-purple-800' :
                              config.category === 'vto' ? 'bg-green-100 text-green-800' :
                              config.category === 'pd_calculator' ? 'bg-yellow-100 text-yellow-800' :
                              config.category === 'lens_thickness' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {config.category}
                            </span>
                          </div>
                          <div className="w-20">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              config.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {config.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                          <button 
                            onClick={() => handleEditConfig(config)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button 
                            onClick={() => handleDeleteConfig(config.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {configs.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={fetchConfigs}
                    className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tools' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Available Simulation Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {simulationTools.map((tool, index) => {
                  const Icon = tool.icon;
                  return (
                    <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className={`${tool.color} p-3 rounded-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{tool.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                          <button 
                            onClick={() => handleOpenTool(tool.title)}
                            className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Configure →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'vto' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Virtual Try-On Settings</h2>
              <div className="space-y-6">
                <div className="border rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Camera Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Camera Distance
                      </label>
                      <input
                        type="number"
                        value={vtoSettings.cameraDistance}
                        onChange={(e) => handleVTOChange('cameraDistance', parseFloat(e.target.value))}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lighting Intensity
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={vtoSettings.lightingIntensity}
                        onChange={(e) => handleVTOChange('lightingIntensity', parseFloat(e.target.value))}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Model Quality</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="quality" 
                        value="low" 
                        checked={vtoSettings.modelQuality === 'low'}
                        onChange={(e) => handleVTOChange('modelQuality', e.target.value)}
                        className="mr-2" 
                      />
                      <span className="text-sm">Low (Faster performance)</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="quality" 
                        value="medium"
                        checked={vtoSettings.modelQuality === 'medium'}
                        onChange={(e) => handleVTOChange('modelQuality', e.target.value)}
                        className="mr-2" 
                      />
                      <span className="text-sm">Medium (Balanced)</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="quality" 
                        value="high"
                        checked={vtoSettings.modelQuality === 'high'}
                        onChange={(e) => handleVTOChange('modelQuality', e.target.value)}
                        className="mr-2" 
                      />
                      <span className="text-sm">High (Best quality)</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={handleSaveVTOSettings}
                    disabled={savingVTO}
                    className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingVTO ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vto-configs' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">VTO Configurations</h2>
                <button 
                  onClick={handleAddVTOConfig}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  <FiPlus />
                  <span>Add VTO Config</span>
                </button>
              </div>
              {vtoConfigsLoading ? (
                <div className="text-center py-12">
                  <div className="spinner"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Slug
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
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
                      {vtoConfigs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                            No VTO configs found. Click "Add VTO Config" to create one.
                          </td>
                        </tr>
                      ) : (
                        vtoConfigs.map((config) => (
                          <tr key={config.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {config.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {config.slug}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {config.description || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  config.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {config.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => handleEditVTOConfig(config)}
                                className="text-primary-600 hover:text-primary-900 mr-4"
                                title="Edit VTO config"
                              >
                                <FiEdit2 />
                              </button>
                              <button 
                                onClick={() => handleDeleteVTOConfig(config.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete VTO config"
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
              )}
            </div>
          )}

          {activeTab === 'vto-assets' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">VTO Assets</h2>
              </div>
              
              {/* Upload Form */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-md font-semibold mb-4">Upload New Asset</h3>
                <form onSubmit={handleUploadAsset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asset Type *
                    </label>
                    <select
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="frame_3d">Frame 3D</option>
                      <option value="face_mesh">Face Mesh</option>
                      <option value="occlusion_mask">Occlusion Mask</option>
                      <option value="environment_map">Environment Map</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File *
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setAssetFile(e.target.files[0])}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploadingAsset || !assetFile}
                    className="flex items-center space-x-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                  >
                    <FiUpload />
                    <span>{uploadingAsset ? 'Uploading...' : 'Upload Asset'}</span>
                  </button>
                </form>
              </div>

              {/* Assets List */}
              {vtoAssetsLoading ? (
                <div className="text-center py-12">
                  <div className="spinner"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploaded
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vtoAssets.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                            No assets found. Upload an asset to get started.
                          </td>
                        </tr>
                      ) : (
                        vtoAssets.map((asset) => (
                          <tr key={asset.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                                {asset.asset_type || asset.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {asset.file_name || asset.filename || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {asset.file_size ? `${(asset.file_size / 1024).toFixed(2)} KB` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {asset.created_at ? new Date(asset.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => handleDeleteVTOConfig(asset.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete asset"
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
              )}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ConfigModal
          config={selectedConfig}
          onClose={() => {
            setModalOpen(false);
            fetchConfigs();
          }}
        />
      )}

      {vtoConfigModalOpen && (
        <VTOConfigModal
          config={selectedVtoConfig}
          onClose={() => {
            setVtoConfigModalOpen(false);
            setSelectedVtoConfig(null);
          }}
          onSuccess={fetchVTOConfigs}
        />
      )}

      {/* Simulation Tool Modals */}
      {activeToolModal === 'PD Calculator' && (
        <PDCalculatorModal 
          onClose={handleCloseTool}
          results={toolResults}
          setResults={setToolResults}
        />
      )}

      {activeToolModal === 'Lens Thickness Calculator' && (
        <LensThicknessModal 
          onClose={handleCloseTool}
          results={toolResults}
          setResults={setToolResults}
        />
      )}

      {activeToolModal === 'Photochromic Simulator' && (
        <PhotochromicModal 
          onClose={handleCloseTool}
          onSave={fetchConfigs}
          configs={configs}
        />
      )}

      {activeToolModal === 'AR Coating Simulator' && (
        <ARCoatingModal 
          onClose={handleCloseTool}
          onSave={fetchConfigs}
          configs={configs}
        />
      )}
    </div>
  );
};

// PD Calculator Modal Component
const PDCalculatorModal = ({ onClose, results, setResults }) => {
  const [measurements, setMeasurements] = useState({
    rightPupil: '',
    leftPupil: '',
    nasalBridge: '',
    calculationMethod: 'binocular'
  });

  const calculatePD = () => {
    const right = parseFloat(measurements.rightPupil) || 0;
    const left = parseFloat(measurements.leftPupil) || 0;
    const bridge = parseFloat(measurements.nasalBridge) || 0;

    if (measurements.calculationMethod === 'binocular') {
      const binocularPD = right + left + bridge;
      setResults({
        binocularPD: binocularPD.toFixed(1),
        monocularRight: (right + bridge / 2).toFixed(1),
        monocularLeft: (left + bridge / 2).toFixed(1)
      });
      toast.success('PD calculated successfully!');
    } else {
      setResults({
        monocularRight: right.toFixed(1),
        monocularLeft: left.toFixed(1)
      });
      toast.success('Monocular PD calculated!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">PD Calculator</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calculation Method
            </label>
            <select
              value={measurements.calculationMethod}
              onChange={(e) => setMeasurements({...measurements, calculationMethod: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="binocular">Binocular (Total PD)</option>
              <option value="monocular">Monocular (Individual Eyes)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Right Pupil Distance (mm)
              </label>
              <input
                type="number"
                step="0.1"
                value={measurements.rightPupil}
                onChange={(e) => setMeasurements({...measurements, rightPupil: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="31.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Left Pupil Distance (mm)
              </label>
              <input
                type="number"
                step="0.1"
                value={measurements.leftPupil}
                onChange={(e) => setMeasurements({...measurements, leftPupil: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="31.5"
              />
            </div>
          </div>

          {measurements.calculationMethod === 'binocular' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nasal Bridge Width (mm)
              </label>
              <input
                type="number"
                step="0.1"
                value={measurements.nasalBridge}
                onChange={(e) => setMeasurements({...measurements, nasalBridge: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
            </div>
          )}

          <button
            onClick={calculatePD}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            Calculate PD
          </button>

          {Object.keys(results).length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Results:</h3>
              {results.binocularPD && (
                <p className="text-lg mb-2">
                  <span className="font-medium">Binocular PD:</span> {results.binocularPD} mm
                </p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <p>
                  <span className="font-medium">Right Eye:</span> {results.monocularRight} mm
                </p>
                <p>
                  <span className="font-medium">Left Eye:</span> {results.monocularLeft} mm
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Lens Thickness Calculator Modal
const LensThicknessModal = ({ onClose, results, setResults }) => {
  const [prescription, setPrescription] = useState({
    sphere: '',
    cylinder: '',
    axis: '',
    lensIndex: '1.61',
    frameSize: '52'
  });

  const calculateThickness = () => {
    const sphere = parseFloat(prescription.sphere) || 0;
    const cylinder = parseFloat(prescription.cylinder) || 0;
    const index = parseFloat(prescription.lensIndex);
    const frameSize = parseFloat(prescription.frameSize);

    // Simplified thickness calculation formula
    const baseCenterThickness = 2.0; // mm
    const sphereEffect = Math.abs(sphere) * 0.8;
    const cylinderEffect = Math.abs(cylinder) * 0.4;
    const sizeEffect = (frameSize - 50) * 0.2;
    
    const centerThickness = baseCenterThickness + (sphereEffect + cylinderEffect) / index;
    const edgeThickness = sphere < 0 
      ? centerThickness + (Math.abs(sphere) * sizeEffect) / index
      : baseCenterThickness;

    setResults({
      centerThickness: centerThickness.toFixed(2),
      edgeThickness: edgeThickness.toFixed(2),
      recommendation: sphere < -4 || sphere > 4 
        ? 'High-index lens recommended (1.67 or 1.74)' 
        : 'Standard index suitable'
    });
    toast.success('Lens thickness calculated!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Lens Thickness Calculator</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sphere (SPH)
              </label>
              <input
                type="number"
                step="0.25"
                value={prescription.sphere}
                onChange={(e) => setPrescription({...prescription, sphere: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="-2.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cylinder (CYL)
              </label>
              <input
                type="number"
                step="0.25"
                value={prescription.cylinder}
                onChange={(e) => setPrescription({...prescription, cylinder: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="-1.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Axis
              </label>
              <input
                type="number"
                min="0"
                max="180"
                value={prescription.axis}
                onChange={(e) => setPrescription({...prescription, axis: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="90"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lens Index
              </label>
              <select
                value={prescription.lensIndex}
                onChange={(e) => setPrescription({...prescription, lensIndex: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="1.50">1.50 (Standard)</option>
                <option value="1.56">1.56</option>
                <option value="1.61">1.61</option>
                <option value="1.67">1.67 (High Index)</option>
                <option value="1.74">1.74 (Ultra High Index)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frame Size (mm)
              </label>
              <input
                type="number"
                value={prescription.frameSize}
                onChange={(e) => setPrescription({...prescription, frameSize: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="52"
              />
            </div>
          </div>

          <button
            onClick={calculateThickness}
            className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
          >
            Calculate Thickness
          </button>

          {Object.keys(results).length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Results:</h3>
              <div className="space-y-2">
                <p className="text-lg">
                  <span className="font-medium">Center Thickness:</span> {results.centerThickness} mm
                </p>
                <p className="text-lg">
                  <span className="font-medium">Edge Thickness:</span> {results.edgeThickness} mm
                </p>
                <p className="text-sm text-purple-700 mt-3 font-medium">
                  💡 {results.recommendation}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Photochromic Simulator Modal
const PhotochromicModal = ({ onClose, onSave, configs }) => {
  const [uvIntensity, setUvIntensity] = useState(50);
  const [temperature, setTemperature] = useState(20);
  const [saving, setSaving] = useState(false);

  const getTintLevel = () => {
    const tempFactor = Math.max(0, 1 - (temperature - 20) / 30);
    const tintPercentage = Math.min(85, (uvIntensity / 100) * 85 * tempFactor);
    return Math.round(tintPercentage);
  };

  const tintLevel = getTintLevel();

  const handleSave = async () => {
    setSaving(true);
    try {
      // Find existing photochromic_settings config
      const existingConfig = configs?.find(c => c.config_key === 'photochromic_settings');
      
      const dataToSend = {
        config_key: 'photochromic_settings',
        config_value: JSON.stringify({
          min_opacity: 0.1,
          max_opacity: 0.8,
          transition_time: 30,
          uvIntensity,
          temperature
        }),
        category: 'simulation',
        description: 'Photochromic lens simulation settings',
        is_active: true,
      };

      // If updating existing config, include id
      if (existingConfig && existingConfig.id) {
        dataToSend.id = existingConfig.id;
      }

      const response = await api.put(API_ROUTES.SIMULATIONS.UPDATE_CONFIG, dataToSend);
      
      const successMessage = response.data?.message || 'Photochromic settings saved successfully';
      toast.success(successMessage);
      
      // Refresh configs list to show the new record
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Save photochromic settings error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save settings');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 400 || error.response.status === 422) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save settings';
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Photochromic Lens Simulator</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              UV Light Intensity: {uvIntensity}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={uvIntensity}
              onChange={(e) => setUvIntensity(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Indoor</span>
              <span>Partial Sun</span>
              <span>Direct Sun</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature: {temperature}°C
            </label>
            <input
              type="range"
              min="-10"
              max="40"
              value={temperature}
              onChange={(e) => setTemperature(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Cold</span>
              <span>Moderate</span>
              <span>Hot</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Lens Preview</h3>
            <div 
              className="w-full h-48 rounded-lg border-4 border-gray-300 flex items-center justify-center transition-all duration-500"
              style={{ 
                backgroundColor: `rgba(100, 100, 100, ${tintLevel / 100})`,
                color: tintLevel > 40 ? 'white' : 'black'
              }}
            >
              <div className="text-center">
                <FiEye className="w-16 h-16 mx-auto mb-2" />
                <p className="text-2xl font-bold">{tintLevel}% Tinted</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Current Conditions:</h3>
            <ul className="space-y-1 text-sm">
              <li>• UV Intensity: {uvIntensity}% {uvIntensity > 70 ? '(High - Full activation)' : uvIntensity > 30 ? '(Moderate)' : '(Low - Minimal tint)'}</li>
              <li>• Temperature: {temperature}°C {temperature > 25 ? '(Slower activation)' : '(Optimal activation)'}</li>
              <li>• Activation Time: ~{temperature > 25 ? '45-60' : '30-45'} seconds</li>
              <li>• Fade Time: ~{temperature > 25 ? '3-5' : '2-3'} minutes</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// AR Coating Simulator Modal
const ARCoatingModal = ({ onClose, onSave, configs }) => {
  const [hasARCoating, setHasARCoating] = useState(true);
  const [lightAngle, setLightAngle] = useState(45);
  const [reflectionLevel, setReflectionLevel] = useState(11);
  const [saving, setSaving] = useState(false);

  // Calculate reflection level based on current settings
  React.useEffect(() => {
    const calculated = hasARCoating 
      ? Math.max(5, Math.sin((lightAngle * Math.PI) / 180) * 15)
      : Math.sin((lightAngle * Math.PI) / 180) * 100;
    setReflectionLevel(Math.round(calculated));
  }, [hasARCoating, lightAngle]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Find existing ar_coating_settings config
      const existingConfig = configs?.find(c => c.config_key === 'ar_coating_settings');
      
      const dataToSend = {
        config_key: 'ar_coating_settings',
        config_value: JSON.stringify({
          hasARCoating,
          lightAngle,
          reflectionIntensity: reflectionLevel
        }),
        category: 'simulation',
        description: 'AR coating simulation settings',
        is_active: true,
      };

      // If updating existing config, include id
      if (existingConfig && existingConfig.id) {
        dataToSend.id = existingConfig.id;
      }

      const response = await api.put(API_ROUTES.SIMULATIONS.UPDATE_CONFIG, dataToSend);
      
      const successMessage = response.data?.message || 'AR coating settings saved successfully';
      toast.success(successMessage);
      
      // Refresh configs list to show the new record
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Save AR coating settings error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save settings');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 400 || error.response.status === 422) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save settings';
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">AR Coating Simulator</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <span className="font-medium">Anti-Reflective Coating</span>
            <button
              type="button"
              onClick={() => setHasARCoating(!hasARCoating)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hasARCoating ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hasARCoating ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Light Angle: {lightAngle}°
            </label>
            <input
              type="range"
              min="0"
              max="90"
              value={lightAngle}
              onChange={(e) => setLightAngle(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Direct (0°)</span>
              <span>Angled (45°)</span>
              <span>Steep (90°)</span>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Lens Preview</h3>
            <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-4 border-gray-300 overflow-hidden">
              {/* Lens representation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <FiSettings className="w-20 h-20 text-gray-400" />
              </div>
              {/* Reflection effect */}
              {reflectionLevel > 10 && (
                <div 
                  className="absolute top-0 right-0 bg-white rounded-full blur-xl transition-all duration-300"
                  style={{
                    width: `${reflectionLevel * 2}px`,
                    height: `${reflectionLevel * 2}px`,
                    opacity: reflectionLevel / 100,
                    transform: `translate(-${lightAngle}%, ${100 - lightAngle}%)`
                  }}
                />
              )}
            </div>
            <div className="mt-4 text-center">
              <p className="text-xl font-bold">
                {reflectionLevel}% Light Reflection
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {reflectionLevel < 20 ? '✓ Excellent clarity' : reflectionLevel < 50 ? '⚠ Moderate glare' : '✗ High glare'}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Benefits Comparison:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-1">Without AR Coating:</p>
                <ul className="space-y-1">
                  <li>• 8-12% light reflection</li>
                  <li>• Visible glare</li>
                  <li>• Reduced clarity</li>
                  <li>• Eye strain</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">With AR Coating:</p>
                <ul className="space-y-1">
                  <li>• {'<1%'} light reflection</li>
                  <li>• Minimal glare</li>
                  <li>• Enhanced clarity</li>
                  <li>• Reduced eye strain</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulations;

