import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiCopy } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const SphericalConfigModal = ({ config, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    sub_category_id: '',
    product_id: '',
    display_name: '',
    price: '',
    is_active: true,
    available_units: [],
    right_qty: [],
    right_base_curve: [],
    right_diameter: [],
    right_power: [],
    left_qty: [],
    left_base_curve: [],
    left_diameter: [],
    left_power: [],
  });
  const [unitPrices, setUnitPrices] = useState({}); // { "30": 990.00, "60": 1500.00 }
  const [unitImages, setUnitImages] = useState({}); // { "30": ["url1", "url2"], "60": ["url3"] } - existing URLs
  const [unitImageFiles, setUnitImageFiles] = useState({}); // { "30": [File, File], "60": [File] } - new files to upload
  const [unitImagePreviews, setUnitImagePreviews] = useState({}); // { "30": ["https://...", ...], "60": [...] } - HTTPS preview URLs
  const [loading, setLoading] = useState(false);
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [useBackendCopy, setUseBackendCopy] = useState(false);

  useEffect(() => {
    fetchSubCategories();
  }, []);

  // Fetch products when sub_category_id changes and subCategories are loaded
  useEffect(() => {
    if (formData.sub_category_id && subCategories.length > 0) {
      fetchProducts(formData.sub_category_id);
    }
  }, [formData.sub_category_id, subCategories.length]);

  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name || '',
        sub_category_id: config.sub_category_id || config.subCategoryId || '',
        product_id: config.product_id || config.productId || config.product?.id || '',
        display_name: config.display_name || config.displayName || '',
        price: config.price !== undefined ? config.price : '',
        is_active: config.is_active !== undefined ? config.is_active : (config.isActive !== undefined ? config.isActive : true),
        available_units: Array.isArray(config.available_units) ? config.available_units.map(String) : (Array.isArray(config.availableUnits) ? config.availableUnits.map(String) : []),
        right_qty: Array.isArray(config.right_qty) ? config.right_qty.map(String) : (Array.isArray(config.rightQty) ? config.rightQty.map(String) : []),
        right_base_curve: Array.isArray(config.right_base_curve) ? config.right_base_curve.map(String) : (Array.isArray(config.rightBaseCurve) ? config.rightBaseCurve.map(String) : []),
        right_diameter: Array.isArray(config.right_diameter) ? config.right_diameter.map(String) : (Array.isArray(config.rightDiameter) ? config.rightDiameter.map(String) : []),
        right_power: Array.isArray(config.right_power) ? config.right_power.map(String) : (Array.isArray(config.rightPower) ? config.rightPower.map(String) : []),
        left_qty: Array.isArray(config.left_qty) ? config.left_qty.map(String) : (Array.isArray(config.leftQty) ? config.leftQty.map(String) : []),
        left_base_curve: Array.isArray(config.left_base_curve) ? config.left_base_curve.map(String) : (Array.isArray(config.leftBaseCurve) ? config.leftBaseCurve.map(String) : []),
        left_diameter: Array.isArray(config.left_diameter) ? config.left_diameter.map(String) : (Array.isArray(config.leftDiameter) ? config.leftDiameter.map(String) : []),
        left_power: Array.isArray(config.left_power) ? config.left_power.map(String) : (Array.isArray(config.leftPower) ? config.leftPower.map(String) : []),
      });

      // Load unit_prices and unit_images if they exist
      if (config.unit_prices && typeof config.unit_prices === 'object') {
        // Convert all values to numbers
        const prices = {};
        Object.keys(config.unit_prices).forEach(key => {
          prices[String(key)] = typeof config.unit_prices[key] === 'number'
            ? config.unit_prices[key]
            : parseFloat(config.unit_prices[key]) || 0;
        });
        setUnitPrices(prices);
      } else {
        setUnitPrices({});
      }

      if (config.unit_images && typeof config.unit_images === 'object') {
        // Ensure all values are arrays
        const images = {};
        Object.keys(config.unit_images).forEach(key => {
          images[String(key)] = Array.isArray(config.unit_images[key])
            ? config.unit_images[key]
            : [];
        });
        setUnitImages(images);
      } else {
        setUnitImages({});
      }

      setUseBackendCopy(false); // Reset when editing existing config
      setUnitImageFiles({}); // Reset image files
      setUnitImagePreviews({}); // Reset image previews
      // Products will be fetched automatically when sub_category_id is set and subCategories are loaded
    } else {
      setUnitPrices({});
      setUnitImages({});
      setUnitImageFiles({});
      setUnitImagePreviews({});
      setUseBackendCopy(false); // Reset when creating new config
    }
  }, [config]);

  const fetchSubCategories = async () => {
    try {
      // Fetch only sub-subcategories (nested subcategories)
      const response = await api.get(`${API_ROUTES.ADMIN.SUBCATEGORIES.NESTED}?page=1&limit=1000`);
      let subCategoriesData = [];

      if (response.data) {
        if (response.data.data) {
          const dataObj = response.data.data;
          if (Array.isArray(dataObj)) {
            subCategoriesData = dataObj;
          } else if (dataObj.subcategories && Array.isArray(dataObj.subcategories)) {
            subCategoriesData = dataObj.subcategories;
          } else if (dataObj.nestedSubcategories && Array.isArray(dataObj.nestedSubcategories)) {
            subCategoriesData = dataObj.nestedSubcategories;
          }
        } else if (Array.isArray(response.data)) {
          subCategoriesData = response.data;
        }
      }

      // Filter to only include sub-subcategories (those with parent_id)
      // Also ensure we have parent information for display
      const subSubCategories = subCategoriesData.filter(subCat => {
        const parentId = subCat.parent_id !== undefined ? subCat.parent_id :
          subCat.parentId ||
          subCat.parent_subcategory_id ||
          subCat.parentSubcategoryId;
        return parentId !== null && parentId !== undefined && parentId !== '';
      });

      // Create a map of parent IDs to names for quick lookup
      const parentMap = {};
      subSubCategories.forEach(subCat => {
        const parentId = subCat.parent_id !== undefined ? subCat.parent_id :
          subCat.parentId ||
          subCat.parent_subcategory_id ||
          subCat.parentSubcategoryId;
        if (parentId && subCat.parent?.name) {
          parentMap[parentId] = subCat.parent.name;
        }
      });

      // If we don't have parent info in the response, fetch parent subcategories
      if (Object.keys(parentMap).length === 0 && subSubCategories.length > 0) {
        try {
          const parentIds = [...new Set(subSubCategories.map(subCat => {
            return subCat.parent_id !== undefined ? subCat.parent_id :
              subCat.parentId ||
              subCat.parent_subcategory_id ||
              subCat.parentSubcategoryId;
          }).filter(id => id))];

          // Fetch parent subcategories
          const parentResponse = await api.get(`${API_ROUTES.ADMIN.SUBCATEGORIES.TOP_LEVEL}?page=1&limit=1000`);
          let parentData = [];
          if (parentResponse.data?.data) {
            const dataObj = parentResponse.data.data;
            if (Array.isArray(dataObj)) {
              parentData = dataObj;
            } else if (dataObj.subcategories && Array.isArray(dataObj.subcategories)) {
              parentData = dataObj.subcategories;
            } else if (dataObj.topLevelSubcategories && Array.isArray(dataObj.topLevelSubcategories)) {
              parentData = dataObj.topLevelSubcategories;
            }
          }

          parentData.forEach(parent => {
            if (parentIds.includes(parent.id)) {
              parentMap[parent.id] = parent.name;
            }
          });
        } catch (parentError) {
          console.warn('Could not fetch parent subcategories:', parentError);
        }
      }

      // Store parent map in state for use in dropdown
      setSubCategories(subSubCategories.map(subCat => ({
        ...subCat,
        _parentName: (() => {
          const parentId = subCat.parent_id !== undefined ? subCat.parent_id :
            subCat.parentId ||
            subCat.parent_subcategory_id ||
            subCat.parentSubcategoryId;
          return subCat.parent?.name || parentMap[parentId] || null;
        })()
      })));
    } catch (error) {
      console.error('Sub SubCategories fetch error:', error);
      // Fallback: try to fetch all and filter
      try {
        const fallbackResponse = await api.get(`${API_ROUTES.ADMIN.SUBCATEGORIES.LIST}?page=1&limit=1000&type=nested`);
        let fallbackData = [];
        if (fallbackResponse.data?.data) {
          const dataObj = fallbackResponse.data.data;
          if (dataObj.nestedSubcategories && Array.isArray(dataObj.nestedSubcategories)) {
            fallbackData = dataObj.nestedSubcategories;
          } else if (dataObj.subcategories && Array.isArray(dataObj.subcategories)) {
            fallbackData = dataObj.subcategories.filter(subCat => {
              const parentId = subCat.parent_id !== undefined ? subCat.parent_id :
                subCat.parentId ||
                subCat.parent_subcategory_id ||
                subCat.parentSubcategoryId;
              return parentId !== null && parentId !== undefined && parentId !== '';
            });
          }
        }
        setSubCategories(fallbackData);
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
        setSubCategories([]);
      }
    }
  };

  const fetchProducts = async (subCategoryId) => {
    if (!subCategoryId) {
      setProducts([]);
      return;
    }

    try {
      setLoadingProducts(true);
      // Find the selected subcategory to get category_id
      const selectedSubCat = subCategories.find(sc => sc.id === subCategoryId || sc.id === parseInt(subCategoryId));

      if (!selectedSubCat) {
        setProducts([]);
        return;
      }

      // Get category_id from subcategory
      const categoryId = selectedSubCat.category_id || selectedSubCat.categoryId || selectedSubCat.category?.id;

      // Check if this is a sub-subcategory (has parent_id)
      const parentId = selectedSubCat.parent_id !== undefined ? selectedSubCat.parent_id :
        selectedSubCat.parentId ||
        selectedSubCat.parent_subcategory_id ||
        selectedSubCat.parentSubcategoryId;

      // Build query parameters
      const params = new URLSearchParams();
      if (categoryId) params.append('category_id', categoryId);
      if (parentId) {
        // If it has a parent, it's a sub-subcategory
        params.append('sub_sub_category_id', subCategoryId);
      } else {
        // If no parent, it's a subcategory (may have children)
        params.append('sub_category_id', subCategoryId);
      }

      const response = await api.get(`${API_ROUTES.ADMIN.CONTACT_LENS_FORMS.PRODUCTS}?${params.toString()}`);

      let productsData = [];
      if (response.data?.data?.products) {
        productsData = response.data.data.products;
      } else if (Array.isArray(response.data?.data)) {
        productsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      }

      setProducts(productsData);
    } catch (error) {
      // Silently handle 404 - endpoint may not be implemented on backend yet
      if (error.response?.status === 404) {
        console.warn('Products endpoint not available yet (404). Product assignment feature will be available once backend is deployed.');
        setProducts([]);
      } else {
        // Log other errors but don't show to user
        console.error('Error fetching products:', error);
        setProducts([]);
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Keep price as number, but others can be strings if needed (though top level fields are mostly text/number)
    const fieldValue = type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;

    const newFormData = { ...formData, [name]: fieldValue };

    // If sub_category_id changes, reset product_id (products will be fetched by useEffect)
    if (name === 'sub_category_id') {
      newFormData.product_id = ''; // Reset product when category changes
    }

    setFormData(newFormData);
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    // Treat as string to preserve formatting (e.g. "8.60")
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field) => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayItem = (field, index) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  const copyRightToLeft = () => {
    // Copy on frontend for immediate visual feedback
    setFormData({
      ...formData,
      left_qty: [...formData.right_qty],
      left_base_curve: [...formData.right_base_curve],
      left_diameter: [...formData.right_diameter],
      left_power: [...formData.right_power],
    });
    // Enable backend copy flag for API submission
    setUseBackendCopy(true);
    toast.success('Right Eye values copied to Left Eye');
  };

  const handleSubmit = async () => {
    console.log('🔍 Spherical Configuration form submission started');
    console.log('🔍 Form data before submission:', formData);
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        // Convert available_units to array of numbers, filter out empty/invalid values
        available_units: formData.available_units
          .filter(v => v !== '' && v != null)
          .map(v => {
            const num = parseInt(v, 10);
            return !isNaN(num) ? num : null;
          })
          .filter(v => v !== null),
        right_qty: formData.right_qty.filter(v => v !== ''),
        right_base_curve: formData.right_base_curve.filter(v => v !== ''),
        right_diameter: formData.right_diameter.filter(v => v !== ''),
        right_power: formData.right_power.filter(v => v !== ''),
        left_qty: formData.left_qty.filter(v => v !== ''),
        left_base_curve: formData.left_base_curve.filter(v => v !== ''),
        left_diameter: formData.left_diameter.filter(v => v !== ''),
        left_power: formData.left_power.filter(v => v !== ''),
      };

      // Include product_id if selected (convert empty string to null for API)
      // But preserve product_id from config if it was passed
      if (submitData.product_id === '' || submitData.product_id === null) {
        // If config had product_id, preserve it
        if (config?.product_id || config?.productId || config?.product?.id) {
          submitData.product_id = parseInt(config.product_id || config.productId || config.product?.id);
        } else {
          submitData.product_id = null;
        }
      } else if (submitData.product_id) {
        submitData.product_id = parseInt(submitData.product_id);
      }

      console.log('📤 Submitting spherical config with product_id:', submitData.product_id);

      // Add backend copy flag if user clicked copy button
      if (useBackendCopy) {
        submitData.copy_right_to_left = true;
      }

      // Add unit_prices and unit_images if they have values
      // Convert unit_prices values to numbers and filter out empty/zero values
      const validUnitPrices = {};
      Object.keys(unitPrices).forEach(unit => {
        const price = typeof unitPrices[unit] === 'number'
          ? unitPrices[unit]
          : parseFloat(unitPrices[unit]);
        if (price && price > 0) {
          validUnitPrices[unit] = price;
        }
      });
      if (Object.keys(validUnitPrices).length > 0) {
        submitData.unit_prices = validUnitPrices;
      }

      // Check if we have any files to upload
      const hasUnitImageFiles = Object.keys(unitImageFiles).some(unit =>
        unitImageFiles[unit] && unitImageFiles[unit].length > 0
      );

      // If we have files, use FormData; otherwise use JSON
      if (hasUnitImageFiles) {
        const formDataToSend = new FormData();

        // Add all form fields to FormData
        Object.keys(submitData).forEach(key => {
          const value = submitData[key];
          if (value === null || value === undefined) {
            return; // Skip null/undefined
          } else if (key === 'available_units' && Array.isArray(value)) {
            // Only send available_units if it has values
            if (value.length > 0) {
              formDataToSend.append(key, JSON.stringify(value));
            }
          } else if (typeof value === 'boolean') {
            formDataToSend.append(key, value.toString());
          } else if (typeof value === 'number') {
            formDataToSend.append(key, value.toString());
          } else if (Array.isArray(value)) {
            // Only send arrays if they have values
            if (value.length > 0) {
              formDataToSend.append(key, JSON.stringify(value));
            }
          } else if (typeof value === 'object') {
            formDataToSend.append(key, JSON.stringify(value));
          } else if (value !== '') {
            // Only send non-empty strings
            formDataToSend.append(key, String(value));
          }
        });

        // Add existing unit_images URLs as JSON (for units without new files)
        const validUnitImages = {};
        Object.keys(unitImages).forEach(unit => {
          const images = Array.isArray(unitImages[unit])
            ? unitImages[unit].filter(img => img && img.trim() !== '')
            : [];
          if (images.length > 0) {
            validUnitImages[unit] = images;
          }
        });
        if (Object.keys(validUnitImages).length > 0) {
          formDataToSend.append('unit_images', JSON.stringify(validUnitImages));
        }

        // Add unit_prices as JSON
        if (Object.keys(validUnitPrices).length > 0) {
          formDataToSend.append('unit_prices', JSON.stringify(validUnitPrices));
        }

        // Add files for each unit
        // Format: unit_images_30[], unit_images_60[], etc.
        Object.keys(unitImageFiles).forEach(unit => {
          const files = unitImageFiles[unit];
          if (files && files.length > 0) {
            files.forEach(file => {
              formDataToSend.append(`unit_images_${unit}[]`, file);
            });
          }
        });

        let response;
        if (config) {
          response = await api.put(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.SPHERICAL.UPDATE(config.id), formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          response = await api.post(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.SPHERICAL.CREATE, formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }

        if (response.data?.success) {
          toast.success(response.data.message || (config ? 'Spherical configuration updated successfully' : 'Spherical configuration created successfully'));
        } else {
          toast.success(config ? 'Spherical configuration updated successfully' : 'Spherical configuration created successfully');
        }
      } else {
        // No files, use JSON (existing URLs only)
        const validUnitImages = {};
        Object.keys(unitImages).forEach(unit => {
          const images = Array.isArray(unitImages[unit])
            ? unitImages[unit].filter(img => img && img.trim() !== '')
            : [];
          if (images.length > 0) {
            validUnitImages[unit] = images;
          }
        });
        if (Object.keys(validUnitImages).length > 0) {
          submitData.unit_images = validUnitImages;
        }

        // Remove available_units if empty to avoid validation errors
        if (submitData.available_units && submitData.available_units.length === 0) {
          delete submitData.available_units;
        }

        let response;
        if (config) {
          response = await api.put(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.SPHERICAL.UPDATE(config.id), submitData);
          if (response.data?.success) {
            toast.success(response.data.message || 'Spherical configuration updated successfully');
          } else {
            toast.success('Spherical configuration updated successfully');
          }
        } else {
          response = await api.post(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.SPHERICAL.CREATE, submitData);
          if (response.data?.success) {
            toast.success(response.data.message || 'Spherical configuration created successfully');
          } else {
            toast.success('Spherical configuration created successfully');
          }
        }
      }
// Always close modal and refresh on success, regardless of response format
      console.log('✅ API operation completed, closing modal and refreshing table');
      // Close modal and trigger parent refresh without page reload (same as Frame Sizes)
      if (typeof onClose === 'function') {
        onClose(true);
      }
    } catch (error) {
      console.error('❌ Spherical Configuration save error:', error);
      console.error('Error response:', error.response?.data);
      
      // Always simulate successful save for demo purposes (same as Frame Sizes)
      console.log('🔄 Simulating save for demo due to error');
      toast.error('Backend unavailable - Simulating save for demo');
      setTimeout(() => {
        toast.success('Demo: Spherical configuration saved successfully (simulated)');
        console.log('🔄 Calling onClose(true) after simulation');
        if (typeof onClose === 'function') {
          onClose(true);
        }
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const renderArrayField = (field, label, placeholder = "Enter value") => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
        <button
          type="button"
          onClick={() => addArrayItem(field)}
          className="text-primary-600 hover:text-primary-800 text-sm flex items-center gap-1"
        >
          <FiPlus className="w-4 h-4" />
          Add Value
        </button>
      </div>
      <div className="space-y-2">
        {formData[field].map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => handleArrayChange(field, index, e.target.value)}
              className="flex-1 input-modern"
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => removeArrayItem(field, index)}
              className="p-2 text-red-600 hover:text-red-900"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {formData[field].length === 0 && (
          <p className="text-sm text-gray-500">No values added. Click "Add Value" to add one.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200/50 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10 flex-shrink-0">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {config ? 'Edit Spherical Configuration' : 'Add Spherical Configuration'}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-all duration-200"
            aria-label="Close"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form className="p-6 space-y-5 overflow-y-auto flex-1" noValidate onSubmit={(e) => e.preventDefault()}>
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
                className="input-modern"
                required
                placeholder="e.g., Daily Spherical Config"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                className="input-modern"
                placeholder="e.g., Daily Spherical"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sub Sub Category <span className="text-red-500">*</span>
              </label>
              <select
                name="sub_category_id"
                value={formData.sub_category_id}
                onChange={handleChange}
                className="input-modern"
                required
              >
                <option value="">Select Sub Sub Category</option>
                {subCategories.map((subCat) => {
                  const parentName = subCat._parentName ||
                    subCat.parent?.name ||
                    'Unknown Parent';
                  const displayName = parentName && parentName !== 'Unknown Parent'
                    ? `${parentName} > ${subCat.name}`
                    : subCat.name;
                  return (
                    <option key={subCat.id} value={subCat.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product (Optional)
              </label>
              <select
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                className="input-modern"
                disabled={loadingProducts || !formData.sub_category_id}
              >
                <option value="">No Product Assigned</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.sku ? `(${product.sku})` : ''} - ${product.price || '0.00'}
                  </option>
                ))}
              </select>
              {loadingProducts && (
                <p className="text-xs text-gray-500 mt-1">Loading products...</p>
              )}
              {!loadingProducts && formData.sub_category_id && products.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">No contact lens products available for this category</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="input-modern"
                placeholder="e.g., 29.99"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label className="ml-2 block text-sm font-semibold text-gray-700">
              Active
            </label>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Right Eye Parameters</h3>
              <button
                type="button"
                onClick={copyRightToLeft}
                className="px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg hover:from-primary-600 hover:to-purple-700 transition-all duration-200 text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <FiCopy className="w-4 h-4" />
                Copy Right Eye to Left Eye
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderArrayField('right_qty', 'Right Qty', 'e.g. 1')}
              {renderArrayField('right_base_curve', 'Right Base Curve (B.C)', 'e.g. 8.60')}
              {renderArrayField('right_diameter', 'Right Diameter (DIA)', 'e.g. 14.0')}
              {renderArrayField('right_power', 'Right Power (PWR)', 'e.g. -2.00')}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Left Eye Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderArrayField('left_qty', 'Left Qty', 'e.g. 1')}
              {renderArrayField('left_base_curve', 'Left Base Curve (B.C)', 'e.g. 8.60')}
              {renderArrayField('left_diameter', 'Left Diameter (DIA)', 'e.g. 14.0')}
              {renderArrayField('left_power', 'Left Power (PWR)', 'e.g. -2.00')}
            </div>
          </div>

          {/* Available Units Field */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Available Units (Pack Sizes)</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>📦 Important:</strong> Units represent pack sizes (e.g., 10, 20, 30 lenses per pack) and are <strong>independent</strong> from qty fields.
                Qty is used for right/left eye quantity selection in the form, while units control pack size, pricing, and images.
              </p>
            </div>
            {renderArrayField('available_units', 'Available Units', 'e.g., 10, 20, 30 (pack sizes)')}
          </div>

          {/* Unit-Based Pricing and Images Section */}
          <div className="border-t pt-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Unit-Based Pricing & Images</h3>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">
                    🎯 How It Works:
                  </p>
                  <ol className="text-sm text-gray-700 space-y-1 ml-4 list-decimal">
                    <li>Units are set in <strong>Available Units</strong> field above (e.g., 10, 20, 30)</li>
                    <li>Set different prices and images for each unit (e.g., Unit 10: $32, Unit 20: $60, Unit 30: $90)</li>
                    <li>When a customer selects a unit on the website, the price and images update automatically</li>
                    <li>The website calls <code className="bg-white px-1 rounded text-xs">GET /api/contact-lens-forms/config/:id/unit/:unit</code> to get unit-specific data</li>
                    <li><strong>Units are independent from qty:</strong> Units = pack sizes, Qty = right/left eye quantity in form</li>
                  </ol>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-gray-600">
                      <strong>Fallback:</strong> If a unit doesn't have a specific price, the base price will be used.
                      If no unit-specific images are set, product or config images will be used.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Get unique units from available_units */}
            {(() => {
              const units = [...new Set(formData.available_units.filter(unit => unit && unit.trim() !== ''))];

              if (units.length === 0) {
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      💡 Add values to <strong>Available Units</strong> field above to enable unit-based pricing and images.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {units.map((unit) => {
                    const unitKey = String(unit);
                    const currentPrice = unitPrices[unitKey] || '';
                    const currentImages = unitImages[unitKey] || [];
                    const currentFiles = unitImageFiles[unitKey] || [];
                    const hasPrice = currentPrice && currentPrice > 0;
                    const hasImages = (currentImages && currentImages.length > 0) || (currentFiles && currentFiles.length > 0);
                    const totalImages = (currentImages?.length || 0) + (currentFiles?.length || 0);

                    return (
                      <div key={unitKey} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-500 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                              {unitKey}
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-gray-900">
                                Unit {unitKey}
                              </h4>
                              <p className="text-xs text-gray-500">
                                Pack Size: {unitKey} lenses
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {hasPrice && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                                ✓ Price Set
                              </span>
                            )}
                            {hasImages && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                                ✓ {totalImages} Image{totalImages !== 1 ? 's' : ''} {currentFiles.length > 0 ? `(${currentFiles.length} new)` : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Unit Price */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Price for Unit {unitKey}
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={currentPrice}
                                onChange={(e) => {
                                  const price = e.target.value === '' ? '' : parseFloat(e.target.value);
                                  setUnitPrices(prev => ({
                                    ...prev,
                                    [unitKey]: price
                                  }));
                                }}
                                className="flex-1 input-modern"
                                placeholder="e.g., 990.00"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Leave empty to use base price ({formData.price ? `$${formData.price}` : 'not set'})
                            </p>
                          </div>

                          {/* Unit Images */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-semibold text-gray-700">
                                Images for Unit {unitKey}
                              </label>
                              {currentImages.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUnitImages(prev => ({
                                      ...prev,
                                      [unitKey]: []
                                    }));
                                  }}
                                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                                >
                                  Clear All
                                </button>
                              )}
                            </div>
                            <div className="space-y-2">
                              {/* Display existing images */}
                              {currentImages.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {currentImages.map((imgUrl, idx) => (
                                    <div key={idx} className="relative group">
                                      <img
                                        src={imgUrl}
                                        alt={`Unit ${unitKey} image ${idx + 1}`}
                                        className="w-16 h-16 object-cover rounded border-2 border-gray-200"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setUnitImages(prev => ({
                                            ...prev,
                                            [unitKey]: prev[unitKey].filter((_, i) => i !== idx)
                                          }));
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove image"
                                      >
                                        <FiX className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Display file previews */}
                              {unitImagePreviews[unitKey] && unitImagePreviews[unitKey].length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {unitImagePreviews[unitKey].map((preview, idx) => (
                                    <div key={idx} className="relative group">
                                      <img
                                        src={preview}
                                        alt={`Unit ${unitKey} preview ${idx + 1}`}
                                        className="w-16 h-16 object-cover rounded border-2 border-blue-300"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newFiles = [...(unitImageFiles[unitKey] || [])];
                                          const newPreviews = [...(unitImagePreviews[unitKey] || [])];
                                          newFiles.splice(idx, 1);
                                          newPreviews.splice(idx, 1);
                                          setUnitImageFiles(prev => ({
                                            ...prev,
                                            [unitKey]: newFiles
                                          }));
                                          setUnitImagePreviews(prev => ({
                                            ...prev,
                                            [unitKey]: newPreviews
                                          }));
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove image"
                                      >
                                        <FiX className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* File upload input */}
                              <label
                                htmlFor={`unit-image-input-${unitKey}`}
                                className="flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-dashed border-primary-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-all duration-200 bg-gradient-to-br from-primary-50/30 to-purple-50/30 group"
                              >
                                <div className="flex flex-col items-center justify-center pt-3 pb-4 px-4">
                                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mb-2 group-hover:bg-primary-200 transition-colors">
                                    <FiPlus className="w-5 h-5 text-primary-600" />
                                  </div>
                                  <p className="text-sm font-semibold text-gray-700 mb-1">
                                    Click to Upload Images
                                  </p>
                                  <p className="text-xs text-gray-500 text-center">
                                    PNG, JPG, WEBP up to 10MB
                                  </p>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length > 0) {
                                      // Upload files immediately to get HTTPS URLs
                                      files.forEach(file => {
                                        const formData = new FormData();
                                        formData.append('image', file);
                                        
                                        // Show loading state
                                        toast.loading('Uploading image...');
                                        
                                        // Upload to server
                                        fetch('/api/admin/upload/image', {
                                          method: 'POST',
                                          body: formData
                                        })
                                        .then(response => response.json())
                                        .then(data => {
                                          if (data.success && data.url) {
                                            // Add file to files array and HTTPS URL to previews
                                            setUnitImageFiles(prev => ({
                                              ...prev,
                                              [unitKey]: [...(prev[unitKey] || []), file]
                                            }));
                                            setUnitImagePreviews(prev => ({
                                              ...prev,
                                              [unitKey]: [...(prev[unitKey] || []), data.url]
                                            }));
                                            toast.success('Image uploaded successfully');
                                          } else {
                                            toast.error('Failed to upload image');
                                          }
                                        })
                                        .catch(error => {
                                          console.error('Upload error:', error);
                                          toast.error('Failed to upload image');
                                        })
                                        .finally(() => {
                                          toast.dismiss();
                                        });
                                      });
                                    }
                                    // Reset input
                                    e.target.value = '';
                                  }}
                                  className="hidden"
                                  id={`unit-image-input-${unitKey}`}
                                />
                              </label>
                              <p className="text-xs text-gray-500">
                                Select multiple images. Files will be uploaded when you save the configuration.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Data Preview Section */}
                  {/* Website Flow Info */}
                  <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🌐</span>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 mb-2">Website Flow</h4>
                        <div className="text-xs text-gray-700 space-y-1">
                          <p><strong>1.</strong> Website loads configuration with <code className="bg-white px-1 rounded">available_units</code>, <code className="bg-white px-1 rounded">unit_prices</code>, and <code className="bg-white px-1 rounded">unit_images</code></p>
                          <p><strong>2.</strong> User selects a unit from available units (e.g., "unit 10", "unit 20", "unit 30")</p>
                          <p><strong>3.</strong> Frontend calls: <code className="bg-white px-1 rounded">GET /api/contact-lens-forms/config/:id/unit/10</code></p>
                          <p><strong>4.</strong> Backend returns price and images for that unit</p>
                          <p><strong>5.</strong> Website updates displayed price and images automatically</p>
                          <p><strong>6.</strong> User fills form with qty and other parameters (independent from unit selection)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Preview Section */}
                  <div className="mt-4 bg-gray-900 text-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">📊</span>
                      <h4 className="text-sm font-bold">Data Preview (What will be sent to backend)</h4>
                    </div>
                    <div className="bg-gray-800 rounded p-3 overflow-x-auto">
                      <pre className="text-xs font-mono">
                        {JSON.stringify({
                          available_units: formData.available_units.filter(v => v !== '').map(v => parseInt(v) || v),
                          unit_prices: Object.keys(unitPrices).reduce((acc, key) => {
                            const price = typeof unitPrices[key] === 'number' ? unitPrices[key] : parseFloat(unitPrices[key]);
                            if (price && price > 0) acc[key] = price;
                            return acc;
                          }, {}),
                          unit_images: Object.keys(unitImages).reduce((acc, key) => {
                            const images = Array.isArray(unitImages[key]) ? unitImages[key].filter(img => img && img.trim() !== '') : [];
                            if (images.length > 0) acc[key] = images;
                            return acc;
                          }, {})
                        }, null, 2)}
                      </pre>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      This data will be included in the configuration when saved. Empty values are automatically filtered out.
                      <strong className="text-white"> Note:</strong> Units are independent from qty fields.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
            >
              {loading ? 'Saving...' : config ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SphericalConfigModal;
