import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiUpload, FiEye } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';

const ContactLensConfigModal = ({ config, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    configuration_type: 'spherical',
    category_id: '',
    sub_category_id: '', // Top-level subcategory
    sub_sub_category_id: '', // Sub-subcategory (has parent_id)
    sku: '',
    price: '',
    compare_at_price: '',
    cost_price: '',
    description: '',
    short_description: '',
    stock_quantity: '',
    stock_status: 'in_stock',
    is_active: true,
    // Spherical parameters
    right_qty: '',
    right_base_curve: '',
    right_diameter: '',
    right_power: '',
    left_qty: '',
    left_base_curve: '',
    left_diameter: '',
    left_power: '',
    // Astigmatism parameters
    right_cylinder: '',
    right_axis: '',
    left_cylinder: '',
    left_axis: '',
  });

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [colorImages, setColorImages] = useState({}); // { colorName: [files] }
  const [colorImagePreviews, setColorImagePreviews] = useState({}); // { colorName: [previews] }

  useEffect(() => {
    fetchCategories();
    if (config) {
      loadConfigData();
    }
  }, [config]);

  useEffect(() => {
    if (formData.category_id) {
      fetchSubCategories(formData.category_id);
    } else {
      setSubCategories([]);
      setSubSubCategories([]);
    }
  }, [formData.category_id]);

  useEffect(() => {
    if (formData.sub_category_id) {
      fetchSubSubCategories(formData.sub_category_id);
    } else {
      setSubSubCategories([]);
    }
  }, [formData.sub_category_id]);

  const fetchCategories = async () => {
    try {
      const response = await api.get(API_ROUTES.CATEGORIES.LIST);
      const responseData = response.data?.data || response.data || {};
      const categoriesData = responseData.categories || responseData || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    if (!categoryId) {
      setSubCategories([]);
      return;
    }
    try {
      const response = await api.get(API_ROUTES.SUBCATEGORIES.BY_CATEGORY(categoryId));
      const responseData = response.data?.data || response.data || {};
      const subCatData = responseData.subcategories || responseData || [];
      // Filter to get only top-level subcategories (parent_id = null)
      const topLevel = Array.isArray(subCatData)
        ? subCatData.filter(sub => {
            const parentId = sub.parent_id !== undefined ? sub.parent_id :
                           sub.parentId ||
                           sub.parent_subcategory_id ||
                           sub.parentSubcategoryId;
            return parentId === null || parentId === undefined || parentId === '';
          })
        : [];
      setSubCategories(topLevel);
    } catch (error) {
      console.error('Failed to fetch subcategories:', error);
      setSubCategories([]);
    }
  };

  const fetchSubSubCategories = async (parentId) => {
    if (!parentId) {
      setSubSubCategories([]);
      return;
    }
    try {
      const response = await api.get(API_ROUTES.SUBCATEGORIES.BY_PARENT(parentId));
      const responseData = response.data?.data || response.data || {};
      const nestedData = responseData.subcategories || responseData || [];
      setSubSubCategories(Array.isArray(nestedData) ? nestedData : []);
    } catch (error) {
      console.warn('Failed to fetch sub-subcategories:', error);
      // Try alternative endpoint
      try {
        const response = await api.get(API_ROUTES.SUBCATEGORIES.NESTED(parentId));
        const responseData = response.data?.data || response.data || {};
        const nestedData = responseData.subcategories || responseData || [];
        setSubSubCategories(Array.isArray(nestedData) ? nestedData : []);
      } catch (altError) {
        console.warn('Alternative endpoint also failed:', altError);
        setSubSubCategories([]);
      }
    }
  };

  const loadConfigData = async () => {
    if (!config) return;

    try {
      // Fetch full config details if we only have ID
      let configData = config;
      if (config.id && !config.sub_category_id) {
        const response = await api.get(API_ROUTES.ADMIN.CONTACT_LENS_CONFIGS.BY_ID(config.id));
        configData = response.data?.data || response.data || config;
      }

      // Determine subcategory hierarchy
      let categoryId = configData.category_id || '';
      let subCategoryId = '';
      let subSubCategoryId = '';

      if (configData.sub_category_id) {
        // Check if this is a sub-subcategory (has parent_id)
        try {
          const subCatResponse = await api.get(API_ROUTES.SUBCATEGORIES.BY_ID(configData.sub_category_id));
          const subCat = subCatResponse.data?.data || subCatResponse.data || {};
          const parentId = subCat.parent_id || subCat.parentId || subCat.parent_subcategory_id || subCat.parentSubcategoryId;
          
          if (parentId !== null && parentId !== undefined && parentId !== '') {
            // It's a sub-subcategory
            subSubCategoryId = configData.sub_category_id;
            subCategoryId = parentId;
            categoryId = subCat.category_id || categoryId;
          } else {
            // It's a top-level subcategory
            subCategoryId = configData.sub_category_id;
            categoryId = subCat.category_id || categoryId;
          }
        } catch (err) {
          // If we can't fetch, assume it's a sub-subcategory (per guide requirements)
          subSubCategoryId = configData.sub_category_id;
        }
      }

      setFormData({
        name: configData.name || '',
        display_name: configData.display_name || configData.name || '',
        configuration_type: configData.configuration_type || 'spherical',
        category_id: categoryId.toString(),
        sub_category_id: subCategoryId.toString(),
        sub_sub_category_id: subSubCategoryId.toString(),
        sku: configData.sku || '',
        price: configData.price || '',
        compare_at_price: configData.compare_at_price || '',
        cost_price: configData.cost_price || '',
        description: configData.description || '',
        short_description: configData.short_description || '',
        stock_quantity: configData.stock_quantity || '',
        stock_status: configData.stock_status || 'in_stock',
        is_active: configData.is_active !== undefined ? configData.is_active : true,
        right_qty: configData.right_qty || '',
        right_base_curve: configData.right_base_curve || '',
        right_diameter: configData.right_diameter || '',
        right_power: configData.right_power || '',
        left_qty: configData.left_qty || '',
        left_base_curve: configData.left_base_curve || '',
        left_diameter: configData.left_diameter || '',
        left_power: configData.left_power || '',
        right_cylinder: configData.right_cylinder || '',
        right_axis: configData.right_axis || '',
        left_cylinder: configData.left_cylinder || '',
        left_axis: configData.left_axis || '',
      });

      // Load images
      if (configData.images && Array.isArray(configData.images) && configData.images.length > 0) {
        setImagePreviews(configData.images.filter(img => img && typeof img === 'string'));
      } else if (configData.image || configData.image_url) {
        setImagePreviews([configData.image || configData.image_url].filter(Boolean));
      }

      // Load color images
      if (configData.color_images && typeof configData.color_images === 'object') {
        setColorImagePreviews(configData.color_images);
      }
    } catch (error) {
      console.error('Failed to load config data:', error);
      toast.error('Failed to load configuration data');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}: Not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: Size exceeds 10MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Limit to 5 images total
    const currentCount = imagePreviews.length + imageFiles.length;
    if (currentCount + validFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      const allowedCount = 5 - currentCount;
      if (allowedCount > 0) {
        validFiles.splice(allowedCount);
      } else {
        return;
      }
    }

    setImageFiles(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeImage = (index) => {
    // Remove from previews
    const newPreviews = [...imagePreviews];
    const removedPreview = newPreviews.splice(index, 1)[0];
    setImagePreviews(newPreviews);

    // Remove from files if it's a new file
    if (index < imageFiles.length) {
      const newFiles = [...imageFiles];
      newFiles.splice(index, 1);
      setImageFiles(newFiles);
    } else {
      // It's an existing image - we'll need to handle deletion on backend
      // For now, just remove from preview
    }
  };

  const handleColorImageChange = (colorName, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}: Not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: Size exceeds 10MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Limit to 5 images per color
    const existingFiles = colorImages[colorName] || [];
    const existingPreviews = colorImagePreviews[colorName] || [];
    if (existingFiles.length + existingPreviews.length + validFiles.length > 5) {
      toast.error(`Maximum 5 images allowed per color`);
      return;
    }

    const newFiles = [...existingFiles, ...validFiles];
    setColorImages({ ...colorImages, [colorName]: newFiles });

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setColorImagePreviews(prev => ({
          ...prev,
          [colorName]: [...(prev[colorName] || []), reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeColorImage = (colorName, index) => {
    const newFiles = { ...colorImages };
    const newPreviews = { ...colorImagePreviews };

    if (newFiles[colorName]) {
      newFiles[colorName].splice(index, 1);
      if (newFiles[colorName].length === 0) {
        delete newFiles[colorName];
      }
    }

    if (newPreviews[colorName]) {
      newPreviews[colorName].splice(index, 1);
      if (newPreviews[colorName].length === 0) {
        delete newPreviews[colorName];
      }
    }

    setColorImages(newFiles);
    setColorImagePreviews(newPreviews);
  };

  const validateForm = () => {
    // Required fields
    if (!formData.name || !formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!formData.display_name || !formData.display_name.trim()) {
      toast.error('Display name is required');
      return false;
    }
    if (!formData.configuration_type) {
      toast.error('Configuration type is required');
      return false;
    }
    if (!formData.sub_sub_category_id) {
      toast.error('Sub-SubCategory is required (must be a sub-subcategory with parent)');
      return false;
    }

    // Validate at least one eye has power
    if (!formData.right_power && !formData.left_power) {
      toast.error('At least one eye (right or left) must have power');
      return false;
    }

    // Validate base curve and diameter when power is provided
    if (formData.right_power) {
      if (!formData.right_base_curve || !formData.right_diameter) {
        toast.error('Right eye: Base curve and diameter are required when power is provided');
        return false;
      }
    }
    if (formData.left_power) {
      if (!formData.left_base_curve || !formData.left_diameter) {
        toast.error('Left eye: Base curve and diameter are required when power is provided');
        return false;
      }
    }

    // Validate astigmatism fields
    if (formData.configuration_type === 'astigmatism') {
      if (formData.right_cylinder && !formData.right_axis) {
        toast.error('Right eye: Axis is required when cylinder is provided');
        return false;
      }
      if (formData.left_cylinder && !formData.left_axis) {
        toast.error('Left eye: Axis is required when cylinder is provided');
        return false;
      }
    } else {
      // Spherical cannot have cylinder or axis
      if (formData.right_cylinder || formData.right_axis || formData.left_cylinder || formData.left_axis) {
        toast.error('Spherical configurations cannot have cylinder or axis fields');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        name: formData.name.trim(),
        display_name: formData.display_name.trim(),
        configuration_type: formData.configuration_type,
        sub_category_id: parseInt(formData.sub_sub_category_id), // Use sub-subcategory
      };

      // Product fields
      if (formData.sku && formData.sku.trim()) {
        dataToSend.sku = formData.sku.trim();
      }
      if (formData.price) {
        dataToSend.price = parseFloat(formData.price);
      }
      if (formData.compare_at_price) {
        dataToSend.compare_at_price = parseFloat(formData.compare_at_price);
      }
      if (formData.cost_price) {
        dataToSend.cost_price = parseFloat(formData.cost_price);
      }
      if (formData.description && formData.description.trim()) {
        dataToSend.description = formData.description.trim();
      }
      if (formData.short_description && formData.short_description.trim()) {
        dataToSend.short_description = formData.short_description.trim();
      }
      if (formData.stock_quantity) {
        dataToSend.stock_quantity = parseInt(formData.stock_quantity);
      }
      if (formData.stock_status) {
        dataToSend.stock_status = formData.stock_status;
      }
      dataToSend.is_active = formData.is_active;

      // Parameter fields
      if (formData.right_qty) dataToSend.right_qty = formData.right_qty;
      if (formData.right_base_curve) dataToSend.right_base_curve = formData.right_base_curve;
      if (formData.right_diameter) dataToSend.right_diameter = formData.right_diameter;
      if (formData.right_power) dataToSend.right_power = formData.right_power;
      if (formData.left_qty) dataToSend.left_qty = formData.left_qty;
      if (formData.left_base_curve) dataToSend.left_base_curve = formData.left_base_curve;
      if (formData.left_diameter) dataToSend.left_diameter = formData.left_diameter;
      if (formData.left_power) dataToSend.left_power = formData.left_power;

      // Astigmatism fields
      if (formData.configuration_type === 'astigmatism') {
        if (formData.right_cylinder) dataToSend.right_cylinder = formData.right_cylinder;
        if (formData.right_axis) dataToSend.right_axis = formData.right_axis;
        if (formData.left_cylinder) dataToSend.left_cylinder = formData.left_cylinder;
        if (formData.left_axis) dataToSend.left_axis = formData.left_axis;
      }

      let response;

      // Check if we need FormData (images or color images)
      const hasImageFiles = imageFiles.length > 0;
      const hasColorImages = Object.keys(colorImages).length > 0 &&
                            Object.values(colorImages).some(files => files && files.length > 0);

      if (hasImageFiles || hasColorImages) {
        const submitData = new FormData();

        // Add all fields to FormData
        Object.keys(dataToSend).forEach(key => {
          const value = dataToSend[key];
          if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(item => submitData.append(key, item));
            } else {
              submitData.append(key, value);
            }
          }
        });

        // Add main images
        imageFiles.forEach(file => {
          submitData.append('images', file);
        });

        // Add color images
        Object.keys(colorImages).forEach(colorName => {
          const files = colorImages[colorName];
          if (files && files.length > 0) {
            files.forEach(file => {
              submitData.append(`color_images_${colorName}`, file);
            });
          }
        });

        if (config) {
          response = await api.put(API_ROUTES.ADMIN.CONTACT_LENS_CONFIGS.UPDATE(config.id), submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          response = await api.post(API_ROUTES.ADMIN.CONTACT_LENS_CONFIGS.CREATE, submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      } else {
        // No files - send as JSON
        if (config) {
          response = await api.put(API_ROUTES.ADMIN.CONTACT_LENS_CONFIGS.UPDATE(config.id), dataToSend);
        } else {
          response = await api.post(API_ROUTES.ADMIN.CONTACT_LENS_CONFIGS.CREATE, dataToSend);
        }
      }

      const successMessage = response.data?.message || 
                            (config ? 'Configuration updated successfully' : 'Configuration created successfully');
      toast.success(successMessage);
      
      setImageFiles([]);
      onClose();
    } catch (error) {
      console.error('Config save error:', error);
      
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save configuration');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error ||
                           `Failed to save configuration (${error.response.status})`;
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const isSpherical = formData.configuration_type === 'spherical';
  const isAstigmatism = formData.configuration_type === 'astigmatism';

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" 
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200/50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {config ? 'Edit Contact Lens Configuration' : 'Add Contact Lens Configuration'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-modern w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                    className="input-modern w-full"
                    required
                    placeholder="Shown in dropdown"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Configuration Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="configuration_type"
                    value={formData.configuration_type}
                    onChange={handleChange}
                    className="input-modern w-full"
                    required
                  >
                    <option value="spherical">Spherical</option>
                    <option value="astigmatism">Astigmatism</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="input-modern w-full"
                  />
                </div>
              </div>
            </div>

            {/* Category Hierarchy */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Category Hierarchy</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={(e) => {
                      handleChange(e);
                      setFormData(prev => ({ ...prev, sub_category_id: '', sub_sub_category_id: '' }));
                    }}
                    className="input-modern w-full"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    SubCategory (Top Level)
                  </label>
                  <select
                    name="sub_category_id"
                    value={formData.sub_category_id}
                    onChange={(e) => {
                      handleChange(e);
                      setFormData(prev => ({ ...prev, sub_sub_category_id: '' }));
                    }}
                    disabled={!formData.category_id}
                    className="input-modern w-full disabled:bg-gray-100"
                  >
                    <option value="">Select SubCategory</option>
                    {subCategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sub-SubCategory <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 block font-normal">(Must have parent)</span>
                  </label>
                  <select
                    name="sub_sub_category_id"
                    value={formData.sub_sub_category_id}
                    onChange={handleChange}
                    disabled={!formData.sub_category_id}
                    className="input-modern w-full disabled:bg-gray-100"
                    required
                  >
                    <option value="">Select Sub-SubCategory</option>
                    {subSubCategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Product Fields */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Product Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="input-modern w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Compare At Price</label>
                  <input
                    type="number"
                    step="0.01"
                    name="compare_at_price"
                    value={formData.compare_at_price}
                    onChange={handleChange}
                    className="input-modern w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleChange}
                    className="input-modern w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    className="input-modern w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Status</label>
                  <select
                    name="stock_status"
                    value={formData.stock_status}
                    onChange={handleChange}
                    className="input-modern w-full"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="backorder">Backorder</option>
                    <option value="preorder">Preorder</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-sm font-semibold text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="input-modern w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Short Description</label>
                <textarea
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleChange}
                  rows={2}
                  className="input-modern w-full"
                />
              </div>
            </div>

            {/* Parameter Fields - Spherical */}
            {isSpherical && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Spherical Parameters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Right Eye */}
                  <div className="space-y-4 bg-blue-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-900">Right Eye</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Qty</label>
                        <input
                          type="text"
                          name="right_qty"
                          value={formData.right_qty}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">B.C</label>
                        <input
                          type="text"
                          name="right_base_curve"
                          value={formData.right_base_curve}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">DIA</label>
                        <input
                          type="text"
                          name="right_diameter"
                          value={formData.right_diameter}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">PWR</label>
                        <input
                          type="text"
                          name="right_power"
                          value={formData.right_power}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Left Eye */}
                  <div className="space-y-4 bg-purple-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-purple-900">Left Eye</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Qty</label>
                        <input
                          type="text"
                          name="left_qty"
                          value={formData.left_qty}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">B.C</label>
                        <input
                          type="text"
                          name="left_base_curve"
                          value={formData.left_base_curve}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">DIA</label>
                        <input
                          type="text"
                          name="left_diameter"
                          value={formData.left_diameter}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">PWR</label>
                        <input
                          type="text"
                          name="left_power"
                          value={formData.left_power}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Parameter Fields - Astigmatism */}
            {isAstigmatism && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Astigmatism Parameters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Right Eye */}
                  <div className="space-y-4 bg-blue-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-900">Right Eye</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Qty</label>
                        <input
                          type="text"
                          name="right_qty"
                          value={formData.right_qty}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">B.C</label>
                        <input
                          type="text"
                          name="right_base_curve"
                          value={formData.right_base_curve}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">DIA</label>
                        <input
                          type="text"
                          name="right_diameter"
                          value={formData.right_diameter}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">PWR</label>
                        <input
                          type="text"
                          name="right_power"
                          value={formData.right_power}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">CYL</label>
                        <input
                          type="text"
                          name="right_cylinder"
                          value={formData.right_cylinder}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">AX</label>
                        <input
                          type="text"
                          name="right_axis"
                          value={formData.right_axis}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Left Eye */}
                  <div className="space-y-4 bg-purple-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-purple-900">Left Eye</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Qty</label>
                        <input
                          type="text"
                          name="left_qty"
                          value={formData.left_qty}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">B.C</label>
                        <input
                          type="text"
                          name="left_base_curve"
                          value={formData.left_base_curve}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">DIA</label>
                        <input
                          type="text"
                          name="left_diameter"
                          value={formData.left_diameter}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">PWR</label>
                        <input
                          type="text"
                          name="left_power"
                          value={formData.left_power}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">CYL</label>
                        <input
                          type="text"
                          name="left_cylinder"
                          value={formData.left_cylinder}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">AX</label>
                        <input
                          type="text"
                          name="left_axis"
                          value={formData.left_axis}
                          onChange={handleChange}
                          className="input-modern w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Images Upload */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Images</h3>
              
              {/* Main Images */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Product Images (Max 5)
                </label>
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiUpload className="w-8 h-8 text-indigo-600 mb-2" />
                    <p className="text-sm font-semibold text-gray-700">
                      {imagePreviews.length > 0 ? 'Add More Images' : 'Click to Upload Images'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Max 5 images, 10MB each</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={imagePreviews.length + imageFiles.length >= 5}
                  />
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-4 border-t pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (config ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ContactLensConfigModal;

