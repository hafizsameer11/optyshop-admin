import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiPlus, FiMinus } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';

const ContactLensConfigModal = ({ config, onClose }) => {
  const [formData, setFormData] = useState({
    product_id: '', // Selected product ID
    display_name: '',
    configuration_type: 'spherical',
    category_id: '',
    sub_category_id: '', // Top-level subcategory
    sub_sub_category_id: '', // Sub-subcategory (has parent_id)
    is_active: true,
    // Spherical parameters (arrays for multiple selections)
    right_qty: [],
    right_base_curve: [],
    right_diameter: [],
    right_power: [],
    left_qty: [],
    left_base_curve: [],
    left_diameter: [],
    left_power: [],
    // Astigmatism parameters (arrays for multiple selections)
    right_cylinder: [],
    right_axis: [],
    left_cylinder: [],
    left_axis: [],
  });

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
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

  // Auto-fill display_name when product is selected
  useEffect(() => {
    if (formData.product_id && !formData.display_name) {
      const selectedProduct = products.find(p => p.id === parseInt(formData.product_id));
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          display_name: selectedProduct.name || ''
        }));
      }
    }
  }, [formData.product_id, products]);

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

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      // Fetch all products with a high limit to get all available products
      const response = await api.get(`${API_ROUTES.ADMIN.PRODUCTS.LIST}?page=1&limit=1000`);
      const responseData = response.data?.data || response.data || {};
      const productsData = responseData.products || responseData || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
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
        product_id: configData.product_id || configData.productId || '',
        display_name: configData.display_name || configData.name || '',
        configuration_type: configData.configuration_type || 'spherical',
        category_id: categoryId.toString(),
        sub_category_id: subCategoryId.toString(),
        sub_sub_category_id: subSubCategoryId.toString(),
        is_active: configData.is_active !== undefined ? configData.is_active : true,
        // Convert to arrays if they're not already
        right_qty: Array.isArray(configData.right_qty) ? configData.right_qty : (configData.right_qty ? [configData.right_qty] : []),
        right_base_curve: Array.isArray(configData.right_base_curve) ? configData.right_base_curve : (configData.right_base_curve ? [configData.right_base_curve] : []),
        right_diameter: Array.isArray(configData.right_diameter) ? configData.right_diameter : (configData.right_diameter ? [configData.right_diameter] : []),
        right_power: Array.isArray(configData.right_power) ? configData.right_power : (configData.right_power ? [configData.right_power] : []),
        left_qty: Array.isArray(configData.left_qty) ? configData.left_qty : (configData.left_qty ? [configData.left_qty] : []),
        left_base_curve: Array.isArray(configData.left_base_curve) ? configData.left_base_curve : (configData.left_base_curve ? [configData.left_base_curve] : []),
        left_diameter: Array.isArray(configData.left_diameter) ? configData.left_diameter : (configData.left_diameter ? [configData.left_diameter] : []),
        left_power: Array.isArray(configData.left_power) ? configData.left_power : (configData.left_power ? [configData.left_power] : []),
        right_cylinder: Array.isArray(configData.right_cylinder) ? configData.right_cylinder : (configData.right_cylinder ? [configData.right_cylinder] : []),
        right_axis: Array.isArray(configData.right_axis) ? configData.right_axis : (configData.right_axis ? [configData.right_axis] : []),
        left_cylinder: Array.isArray(configData.left_cylinder) ? configData.left_cylinder : (configData.left_cylinder ? [configData.left_cylinder] : []),
        left_axis: Array.isArray(configData.left_axis) ? configData.left_axis : (configData.left_axis ? [configData.left_axis] : []),
      });

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


  // Multi-value input handlers
  const addParameterValue = (fieldName, value) => {
    if (!value || value.toString().trim() === '') {
      toast.error('Please enter a value');
      return;
    }
    const currentValues = formData[fieldName] || [];
    let processedValue = value.toString().trim();
    
    // Convert to number if it's a numeric field (axis should be integer, others can be decimal)
    if (fieldName.includes('axis')) {
      const numValue = parseInt(processedValue);
      if (isNaN(numValue)) {
        toast.error('Axis must be a valid integer');
        return;
      }
      processedValue = numValue.toString();
    } else if (fieldName.includes('power') || fieldName.includes('cylinder') || fieldName.includes('base_curve') || fieldName.includes('diameter')) {
      const numValue = parseFloat(processedValue);
      if (isNaN(numValue)) {
        toast.error('Please enter a valid number');
        return;
      }
      processedValue = numValue.toString();
    }
    
    if (currentValues.includes(processedValue)) {
      toast.error('This value already exists');
      return;
    }
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...currentValues, processedValue]
    }));
  };

  const removeParameterValue = (fieldName, index) => {
    const currentValues = formData[fieldName] || [];
    setFormData(prev => ({
      ...prev,
      [fieldName]: currentValues.filter((_, i) => i !== index)
    }));
  };

  const updateParameterValue = (fieldName, index, newValue) => {
    const currentValues = [...(formData[fieldName] || [])];
    let processedValue = newValue.toString().trim();
    
    // Convert to number if it's a numeric field
    if (fieldName.includes('axis')) {
      const numValue = parseInt(processedValue);
      if (!isNaN(numValue)) {
        processedValue = numValue.toString();
      }
    } else if (fieldName.includes('power') || fieldName.includes('cylinder') || fieldName.includes('base_curve') || fieldName.includes('diameter')) {
      const numValue = parseFloat(processedValue);
      if (!isNaN(numValue)) {
        processedValue = numValue.toString();
      }
    }
    
    currentValues[index] = processedValue;
    setFormData(prev => ({
      ...prev,
      [fieldName]: currentValues
    }));
  };

  // Multi-value input component
  const MultiValueInput = ({ label, fieldName, placeholder = "Enter value", type = "text" }) => {
    const values = formData[fieldName] || [];
    const [inputValue, setInputValue] = useState('');

    const handleAdd = () => {
      if (inputValue.trim()) {
        addParameterValue(fieldName, inputValue);
        setInputValue('');
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    };

    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label} <span className="text-xs text-gray-500 font-normal">(Multiple values)</span>
        </label>
        <div className="space-y-2">
          {/* Input field with add button */}
          <div className="flex gap-2">
            <input
              type={type}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="input-modern flex-1"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Add
            </button>
          </div>
          {/* Display selected values as tags */}
          {values.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[60px]">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-300 shadow-sm"
                >
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => updateParameterValue(fieldName, index, e.target.value)}
                    className="text-sm border-none outline-none focus:ring-0 p-0 w-20"
                  />
                  <button
                    type="button"
                    onClick={() => removeParameterValue(fieldName, index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <FiMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const validateForm = () => {
    // Required fields
    if (!formData.product_id) {
      toast.error('Product is required');
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
        product_id: parseInt(formData.product_id),
        display_name: formData.display_name.trim(),
        configuration_type: formData.configuration_type,
        sub_category_id: parseInt(formData.sub_sub_category_id), // Use sub-subcategory
        is_active: formData.is_active,
      };

      // Parameter fields (arrays)
      const rightQty = Array.isArray(formData.right_qty) ? formData.right_qty : [];
      const rightBaseCurve = Array.isArray(formData.right_base_curve) ? formData.right_base_curve : [];
      const rightDiameter = Array.isArray(formData.right_diameter) ? formData.right_diameter : [];
      const rightPower = Array.isArray(formData.right_power) ? formData.right_power : [];
      const leftQty = Array.isArray(formData.left_qty) ? formData.left_qty : [];
      const leftBaseCurve = Array.isArray(formData.left_base_curve) ? formData.left_base_curve : [];
      const leftDiameter = Array.isArray(formData.left_diameter) ? formData.left_diameter : [];
      const leftPower = Array.isArray(formData.left_power) ? formData.left_power : [];

      if (rightQty.length > 0) dataToSend.right_qty = rightQty;
      if (rightBaseCurve.length > 0) dataToSend.right_base_curve = rightBaseCurve;
      if (rightDiameter.length > 0) dataToSend.right_diameter = rightDiameter;
      if (rightPower.length > 0) dataToSend.right_power = rightPower;
      if (leftQty.length > 0) dataToSend.left_qty = leftQty;
      if (leftBaseCurve.length > 0) dataToSend.left_base_curve = leftBaseCurve;
      if (leftDiameter.length > 0) dataToSend.left_diameter = leftDiameter;
      if (leftPower.length > 0) dataToSend.left_power = leftPower;

      // Astigmatism fields (arrays)
      if (formData.configuration_type === 'astigmatism') {
        const rightCylinder = Array.isArray(formData.right_cylinder) ? formData.right_cylinder : [];
        const rightAxis = Array.isArray(formData.right_axis) ? formData.right_axis : [];
        const leftCylinder = Array.isArray(formData.left_cylinder) ? formData.left_cylinder : [];
        const leftAxis = Array.isArray(formData.left_axis) ? formData.left_axis : [];
        
        if (rightCylinder.length > 0) dataToSend.right_cylinder = rightCylinder;
        if (rightAxis.length > 0) dataToSend.right_axis = rightAxis;
        if (leftCylinder.length > 0) dataToSend.left_cylinder = leftCylinder;
        if (leftAxis.length > 0) dataToSend.left_axis = leftAxis;
      }

      let response;

      // Send as JSON (no image uploads needed - images come from product)
      if (config) {
        response = await api.put(API_ROUTES.ADMIN.CONTACT_LENS_CONFIGS.UPDATE(config.id), dataToSend);
      } else {
        response = await api.post(API_ROUTES.ADMIN.CONTACT_LENS_CONFIGS.CREATE, dataToSend);
      }

      const successMessage = response.data?.message || 
                            (config ? 'Configuration updated successfully' : 'Configuration created successfully');
      toast.success(successMessage);
      
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
                    Product <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 block font-normal">Select an existing product</span>
                  </label>
                  <select
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleChange}
                    className="input-modern w-full"
                    required
                    disabled={loadingProducts}
                  >
                    <option value="">{loadingProducts ? 'Loading products...' : 'Select Product'}</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} {product.sku ? `(${product.sku})` : ''}
                      </option>
                    ))}
                  </select>
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


            {/* Parameter Fields - Spherical */}
            {isSpherical && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Spherical Parameters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Right Eye */}
                  <div className="space-y-4 bg-blue-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-900">Right Eye</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <MultiValueInput label="Qty" fieldName="right_qty" placeholder="e.g., 6, 30" />
                      <MultiValueInput label="B.C (Base Curve)" fieldName="right_base_curve" placeholder="e.g., 8.4, 8.5" />
                      <MultiValueInput label="DIA (Diameter)" fieldName="right_diameter" placeholder="e.g., 14.3" />
                      <MultiValueInput label="PWR (Power)" fieldName="right_power" placeholder="e.g., -2.00, -1.75" />
                    </div>
                  </div>

                  {/* Left Eye */}
                  <div className="space-y-4 bg-purple-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-purple-900">Left Eye</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <MultiValueInput label="Qty" fieldName="left_qty" placeholder="e.g., 6, 30" />
                      <MultiValueInput label="B.C (Base Curve)" fieldName="left_base_curve" placeholder="e.g., 8.4, 8.5" />
                      <MultiValueInput label="DIA (Diameter)" fieldName="left_diameter" placeholder="e.g., 14.3" />
                      <MultiValueInput label="PWR (Power)" fieldName="left_power" placeholder="e.g., -2.00, -1.75" />
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
                    <div className="grid grid-cols-1 gap-4">
                      <MultiValueInput label="Qty" fieldName="right_qty" placeholder="e.g., 6, 30" />
                      <MultiValueInput label="B.C (Base Curve)" fieldName="right_base_curve" placeholder="e.g., 8.4, 8.5" />
                      <MultiValueInput label="DIA (Diameter)" fieldName="right_diameter" placeholder="e.g., 14.3" />
                      <MultiValueInput label="PWR (Power)" fieldName="right_power" placeholder="e.g., -2.00, -1.75" />
                      <MultiValueInput label="CYL (Cylinder)" fieldName="right_cylinder" placeholder="e.g., -0.50, -0.75" />
                      <MultiValueInput label="AX (Axis)" fieldName="right_axis" placeholder="e.g., 90, 180" type="number" />
                    </div>
                  </div>

                  {/* Left Eye */}
                  <div className="space-y-4 bg-purple-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-purple-900">Left Eye</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <MultiValueInput label="Qty" fieldName="left_qty" placeholder="e.g., 6, 30" />
                      <MultiValueInput label="B.C (Base Curve)" fieldName="left_base_curve" placeholder="e.g., 8.4, 8.5" />
                      <MultiValueInput label="DIA (Diameter)" fieldName="left_diameter" placeholder="e.g., 14.3" />
                      <MultiValueInput label="PWR (Power)" fieldName="left_power" placeholder="e.g., -2.00, -1.75" />
                      <MultiValueInput label="CYL (Cylinder)" fieldName="left_cylinder" placeholder="e.g., -0.50, -0.75" />
                      <MultiValueInput label="AX (Axis)" fieldName="left_axis" placeholder="e.g., 90, 180" type="number" />
                    </div>
                  </div>
                </div>
              </div>
            )}


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

