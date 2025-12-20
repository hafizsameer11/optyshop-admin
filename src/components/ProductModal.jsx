import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiUpload } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';

const ProductModal = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    price: '',
    cost_price: '',
    description: '',
    short_description: '',
    category_id: '',
    sub_category_id: '',
    parent_subcategory_id: '', // For nested subcategories
    frame_shape: '',
    frame_material: '',
    frame_color: '',
    gender: '',
    lens_type: '',
    stock_quantity: '',
    stock_status: 'in_stock',
    compare_at_price: '',
    product_type: 'frame',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    is_active: true,
    is_featured: false,
  });
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [nestedSubCategories, setNestedSubCategories] = useState([]);
  const [frameShapes, setFrameShapes] = useState([]);
  const [frameMaterials, setFrameMaterials] = useState([]);
  const [genders, setGenders] = useState([]);
  const [lensTypes, setLensTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    fetchProductOptions();
    if (product) {
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        sku: product.sku || '',
        price: product.price || '',
        cost_price: product.cost_price || '',
        description: product.description || '',
        short_description: product.short_description || '',
        category_id: product.category_id || '',
        sub_category_id: product.sub_category_id || product.subcategory_id || '',
        parent_subcategory_id: '', // Will be set after checking if subcategory is a sub-subcategory
        frame_shape: product.frame_shape || '',
        frame_material: product.frame_material || '',
        frame_color: product.frame_color || '',
        gender: product.gender || '',
        lens_type: product.lens_type || '',
        stock_quantity: product.stock_quantity || product.stock || '',
        stock_status: product.stock_status || 'in_stock',
        compare_at_price: product.compare_at_price || '',
        product_type: product.product_type || 'frame',
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        meta_keywords: product.meta_keywords || '',
        is_active: product.is_active !== undefined ? product.is_active : true,
        is_featured: product.is_featured || false,
      });
      // Fetch subcategories if category is set
      if (product.category_id) {
        fetchSubCategories(product.category_id);
        // Check if the product's subcategory is a sub-subcategory (has a parent)
        const productSubCategoryId = product.sub_category_id || product.subcategory_id;
        if (productSubCategoryId) {
          // Check if this subcategory is a sub-subcategory and set form accordingly
          checkAndSetSubSubCategory(productSubCategoryId);
        }
      }
      // Set image previews if product has images array or image_url
      // But don't set imageFiles - that should only be set when user selects new files
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        setImagePreviews(product.images.filter(img => img && typeof img === 'string'));
      } else if (product.image || product.image_url) {
        setImagePreviews([product.image || product.image_url].filter(Boolean));
      } else {
        setImagePreviews([]);
      }
      // Reset imageFiles when editing - user must explicitly select new images to update them
      setImageFiles([]);
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        slug: '',
        sku: '',
        price: '',
        cost_price: '',
        description: '',
        short_description: '',
        category_id: '',
        sub_category_id: '',
        parent_subcategory_id: '',
        frame_shape: '',
        frame_material: '',
        frame_color: '',
        gender: '',
        lens_type: '',
        stock_quantity: '',
        stock_status: 'in_stock',
        compare_at_price: '',
        product_type: 'frame',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        is_active: true,
        is_featured: false,
      });
      setSubCategories([]);
      setNestedSubCategories([]);
      setImageFiles([]);
      setImagePreviews([]);
    }
  }, [product]);

  // Helper function to check if a subcategory is a sub-subcategory and set form correctly
  const checkAndSetSubSubCategory = async (subCategoryId) => {
    if (!subCategoryId) return;
    
    try {
      // Fetch the subcategory to check if it has a parent (is a sub-subcategory)
      const response = await api.get(API_ROUTES.SUBCATEGORIES.BY_ID(subCategoryId));
      const subCatData = response.data?.data?.subcategory || response.data?.data || response.data?.subcategory || response.data || {};
      
      // Check if this subcategory has a parent (is a sub-subcategory)
      const parentId = subCatData.parent_id !== undefined ? subCatData.parent_id : 
                       subCatData.parentId || 
                       subCatData.parent_subcategory_id || 
                       subCatData.parentSubcategoryId ||
                       subCatData.parent?.id;
      
      if (parentId && parentId !== null && parentId !== '') {
        // This is a sub-subcategory - set parent as sub_category_id and this as parent_subcategory_id
        // The useEffect will automatically fetch nested subcategories when sub_category_id changes
        console.log(`📊 Product is assigned to sub-subcategory ${subCategoryId}, parent is ${parentId}`);
        setFormData(prev => ({
          ...prev,
          sub_category_id: parentId.toString(),
          parent_subcategory_id: subCategoryId.toString()
        }));
        // Note: fetchNestedSubCategories will be called automatically by the useEffect when sub_category_id changes
      } else {
        // This is a top-level subcategory - the useEffect will fetch nested subcategories automatically
        console.log(`📊 Product is assigned to top-level subcategory ${subCategoryId}`);
      }
    } catch (error) {
      console.warn('Failed to check subcategory parent, assuming top-level:', error);
      // If we can't check, assume it's top-level - the useEffect will handle fetching nested subcategories
    }
  };

  // Fetch nested subcategories when subcategory is selected
  useEffect(() => {
    if (formData.sub_category_id) {
      // Fetch nested subcategories when subcategory is selected
      fetchNestedSubCategories(formData.sub_category_id);
    } else {
      // Clear nested subcategories when no subcategory is selected
      setNestedSubCategories([]);
    }
  }, [formData.sub_category_id]);

  const fetchProductOptions = async () => {
    try {
      // Fetch product options which includes categories, frame shapes, materials, etc.
      const response = await api.get(API_ROUTES.PRODUCTS.OPTIONS);
      const optionsData = response.data?.data || response.data || {};
      
      setCategories(optionsData.categories || []);
      setFrameShapes(optionsData.frameShapes || []);
      setFrameMaterials(optionsData.frameMaterials || []);
      setGenders(optionsData.genders || []);
      setLensTypes(optionsData.lensTypeEnums || []);
    } catch (error) {
      console.error('Failed to fetch product options', error);
      // Fallback to just categories if options endpoint fails
      try {
        const response = await api.get(API_ROUTES.CATEGORIES.LIST);
        const categoriesData = response.data?.data?.categories || response.data?.categories || response.data || [];
        setCategories(categoriesData);
      } catch (catError) {
        console.error('Failed to fetch categories', catError);
        setCategories([]);
      }
      setFrameShapes([]);
      setFrameMaterials([]);
      setGenders([]);
      setLensTypes([]);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    if (!categoryId) {
      setSubCategories([]);
      setNestedSubCategories([]);
      return;
    }

    try {
      // Per Postman collection: Use /subcategories/by-category/:categoryId
      // This returns top-level subcategories with their nested children
      const response = await api.get(API_ROUTES.SUBCATEGORIES.BY_CATEGORY(categoryId));
      const responseData = response.data?.data || response.data || {};
      const subCatData = responseData.subcategories || responseData || [];
      
      // Filter to get only top-level subcategories (parent_id = null)
      // Per Postman: top-level subcategories have parent_id = null
      const topLevel = Array.isArray(subCatData) 
        ? subCatData.filter(sub => {
            const parentId = sub.parent_id !== undefined ? sub.parent_id : 
                           sub.parentId || 
                           sub.parent_subcategory_id || 
                           sub.parentSubcategoryId;
            return parentId === null || parentId === undefined || parentId === '';
          })
        : [];
      
      console.log(`📊 Fetched ${topLevel.length} top-level subcategories for category ${categoryId}`);
      setSubCategories(topLevel);
    } catch (error) {
      console.warn('Failed to fetch subcategories for category', categoryId, error);
      // Try alternative: fetch all subcategories and filter by category_id
      try {
        const response = await api.get(`${API_ROUTES.SUBCATEGORIES.LIST}?category_id=${categoryId}`);
        const responseData = response.data?.data || response.data || {};
        const subCatData = responseData.subcategories || responseData || [];
        // Filter to get only top-level subcategories (parent_id = null)
        const filtered = Array.isArray(subCatData) 
          ? subCatData.filter(sub => {
              const categoryMatch = sub.category_id === parseInt(categoryId);
              const parentId = sub.parent_id !== undefined ? sub.parent_id : 
                             sub.parentId || 
                             sub.parent_subcategory_id || 
                             sub.parentSubcategoryId;
              const isTopLevel = parentId === null || parentId === undefined || parentId === '';
              return categoryMatch && isTopLevel;
            })
          : [];
        setSubCategories(filtered);
      } catch (altError) {
        console.warn('Alternative subcategories fetch also failed', altError);
        setSubCategories([]);
      }
    }
  };

  const fetchNestedSubCategories = async (subCategoryId) => {
    if (!subCategoryId) {
      setNestedSubCategories([]);
      return;
    }

    try {
      // Per Postman collection: Use /subcategories/by-parent/:parentId to get nested subcategories
      // This is the recommended endpoint for cascading dropdowns
      const response = await api.get(API_ROUTES.SUBCATEGORIES.BY_PARENT(subCategoryId));
      const responseData = response.data?.data || response.data || {};
      const nestedData = responseData.subcategories || responseData || [];
      
      console.log(`📊 Fetched ${nestedData.length} nested subcategories for parent ${subCategoryId}`);
      setNestedSubCategories(Array.isArray(nestedData) ? nestedData : []);
    } catch (error) {
      console.warn('Failed to fetch nested subcategories using by-parent, trying alternative endpoint...', error);
      // Fallback to alternative endpoint: /subcategories/:id/subcategories
      try {
        const response = await api.get(API_ROUTES.SUBCATEGORIES.NESTED(subCategoryId));
        const responseData = response.data?.data || response.data || {};
        const nestedData = responseData.subcategories || responseData || [];
        setNestedSubCategories(Array.isArray(nestedData) ? nestedData : []);
      } catch (altError) {
        console.warn('Alternative nested subcategories fetch also failed', altError);
      setNestedSubCategories([]);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // If category changes, fetch subcategories and reset subcategory selections
    if (name === 'category_id') {
      setFormData({ 
        ...formData, 
        [name]: type === 'checkbox' ? checked : value,
        sub_category_id: '', // Reset subcategory when category changes
        parent_subcategory_id: '' // Reset nested subcategory
      });
      fetchSubCategories(value);
      setNestedSubCategories([]);
    } else if (name === 'sub_category_id') {
      // When subcategory changes, reset nested subcategory
      // The useEffect will automatically fetch nested subcategories when sub_category_id changes
      setFormData({ 
        ...formData, 
        [name]: type === 'checkbox' ? checked : value,
        parent_subcategory_id: '' // Reset nested subcategory when parent changes
      });
    } else {
      setFormData({ 
        ...formData, 
        [name]: type === 'checkbox' ? checked : value 
      });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name}: Not an image file`);
        return;
      }
      // Validate file size (max 5MB per image)
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name}: Size exceeds 5MB`);
        return;
      }
      validFiles.push(file);
    });

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      toast.error(`Invalid files:\n${invalidFiles.join('\n')}`);
    }

    if (validFiles.length > 0) {
      // When editing: replace all existing files/previews with new ones
      // When creating: add to existing files/previews
      const newFiles = product ? validFiles : [...imageFiles, ...validFiles];
      setImageFiles(newFiles);

      // Create previews for all valid files
      const previewPromises = validFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(previewPromises).then((previews) => {
        const validPreviews = previews.filter(Boolean);
        // When editing: replace old previews (from existing product images) with new ones
        // When creating: add to existing previews
        const newPreviews = product ? validPreviews : [...imagePreviews, ...validPreviews];
        setImagePreviews(newPreviews);
        
        if (product) {
          toast.success(`${validFiles.length} new image(s) selected. Click Save to update.`);
        } else {
          toast.success(`${validFiles.length} image(s) added`);
        }
      });
    }

    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  const removeImage = (index) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    
    // Remove from both arrays
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    toast.success('Image removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        toast.error('Product name is required');
        setLoading(false);
        return;
      }
      if (!formData.sku || !formData.sku.trim()) {
        toast.error('SKU is required');
        setLoading(false);
        return;
      }
      if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
        toast.error('Valid price is required');
        setLoading(false);
        return;
      }

      // Prepare data object with proper types
      const dataToSend = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        price: parseFloat(formData.price) || 0,
      };

      // Add optional fields only if they have values
      if (formData.slug && formData.slug.trim()) {
        dataToSend.slug = formData.slug.trim();
      }
      if (formData.description && formData.description.trim()) {
        dataToSend.description = formData.description.trim();
      }
      if (formData.short_description && formData.short_description.trim()) {
        dataToSend.short_description = formData.short_description.trim();
      }
      if (formData.category_id) {
        const categoryId = parseInt(formData.category_id);
        if (!isNaN(categoryId)) {
          dataToSend.category_id = categoryId;
        }
      }
      // Handle subcategory selection: if nested subcategory is selected, use it; otherwise use parent subcategory
      if (formData.parent_subcategory_id) {
        // Nested subcategory selected - use it as the final sub_category_id
        const nestedSubCategoryId = parseInt(formData.parent_subcategory_id);
        if (!isNaN(nestedSubCategoryId)) {
          dataToSend.sub_category_id = nestedSubCategoryId;
        }
      } else if (formData.sub_category_id) {
        // Only parent subcategory selected - use it
        const subCategoryId = parseInt(formData.sub_category_id);
        if (!isNaN(subCategoryId)) {
          dataToSend.sub_category_id = subCategoryId;
        }
      }
      if (formData.cost_price && formData.cost_price !== '') {
        const costPrice = parseFloat(formData.cost_price);
        if (!isNaN(costPrice) && costPrice >= 0) {
          dataToSend.cost_price = costPrice;
        }
      }
      if (formData.stock_quantity !== '' && formData.stock_quantity !== null && formData.stock_quantity !== undefined) {
        const stockQty = parseInt(formData.stock_quantity);
        if (!isNaN(stockQty) && stockQty >= 0) {
          dataToSend.stock_quantity = stockQty;
        } else {
          dataToSend.stock_quantity = 0;
        }
      }
      if (formData.stock_status) dataToSend.stock_status = formData.stock_status;
      // Normalize frame_shape: convert underscores to hyphens (cat_eye -> cat-eye)
      if (formData.frame_shape) {
        dataToSend.frame_shape = formData.frame_shape.replace(/_/g, '-');
      }
      if (formData.frame_material) dataToSend.frame_material = formData.frame_material;
      if (formData.frame_color) dataToSend.frame_color = formData.frame_color;
      if (formData.gender) dataToSend.gender = formData.gender;
      if (formData.lens_type) dataToSend.lens_type = formData.lens_type;
      if (formData.compare_at_price && formData.compare_at_price !== '') {
        const comparePrice = parseFloat(formData.compare_at_price);
        if (!isNaN(comparePrice) && comparePrice >= 0) {
          dataToSend.compare_at_price = comparePrice;
        }
      }
      // Only send product_type if it's "frame" (the only confirmed valid enum value)
      // The Prisma ProductType enum appears to only accept "frame" currently
      // Sending "lens" or "accessory" will cause a validation error
      if (formData.product_type === 'frame') {
        dataToSend.product_type = formData.product_type;
      }
      // If product_type is not "frame", don't send it to avoid Prisma validation errors
      if (formData.meta_title && formData.meta_title.trim()) {
        dataToSend.meta_title = formData.meta_title.trim();
      }
      if (formData.meta_description && formData.meta_description.trim()) {
        dataToSend.meta_description = formData.meta_description.trim();
      }
      if (formData.meta_keywords && formData.meta_keywords.trim()) {
        dataToSend.meta_keywords = formData.meta_keywords.trim();
      }
      if (formData.is_active !== undefined) dataToSend.is_active = formData.is_active;
      if (formData.is_featured !== undefined) dataToSend.is_featured = formData.is_featured;

      let response;
      let imageUploadFailed = false;
      
      // If we have image files, try to upload with FormData first
      if (imageFiles && imageFiles.length > 0 && imageFiles.every(file => file instanceof File)) {
        try {
          const submitData = new FormData();
          
          // Add all fields to FormData with proper type conversion
          Object.keys(dataToSend).forEach((key) => {
            const value = dataToSend[key];
            if (value !== null && value !== undefined) {
              // Convert types properly for FormData
              if (typeof value === 'boolean') {
                // Booleans: send as "true" or "false" strings
                submitData.append(key, value.toString());
              } else if (typeof value === 'number') {
                // Numbers: send as string (FormData requirement)
                // Backend should parse these, but ensure it's a valid number string
                submitData.append(key, value.toString());
              } else {
                // Strings and other types
                submitData.append(key, value);
              }
            }
          });

          // Add all image files - API expects 'images' (plural) array
          // Append each file to FormData
          imageFiles.forEach((file) => {
            submitData.append('images', file);
          });
          
          // For updates, also send a flag to replace existing images
          if (product) {
            submitData.append('replace_images', 'true');
          }
          
          // Debug: Log that we're sending images
          console.log('Sending images:', {
            fileCount: imageFiles.length,
            fileNames: imageFiles.map(f => f.name),
            totalSize: imageFiles.reduce((sum, f) => sum + f.size, 0),
            isUpdate: !!product
          });

          if (product) {
            response = await api.put(API_ROUTES.ADMIN.PRODUCTS.UPDATE(product.id), submitData);
          } else {
            response = await api.post(API_ROUTES.ADMIN.PRODUCTS.CREATE, submitData);
          }
        } catch (imageError) {
          // Check if it's an S3/upload error
          const errorString = JSON.stringify(imageError.response?.data || {}).toLowerCase();
          const isS3Error = errorString.includes('s3') || 
                           errorString.includes('aws') || 
                           errorString.includes('credentials') ||
                           errorString.includes('missing credentials') ||
                           errorString.includes('upload failed');
          
          if (isS3Error) {
            // If S3 upload fails, try saving without images
            imageUploadFailed = true;
            toast.warning('Image upload failed. Saving product without images...');
            
            // Retry without images
            if (product) {
              response = await api.put(API_ROUTES.ADMIN.PRODUCTS.UPDATE(product.id), dataToSend);
            } else {
              response = await api.post(API_ROUTES.ADMIN.PRODUCTS.CREATE, dataToSend);
            }
            toast.success('Product saved successfully (without images). Please configure S3 to enable image uploads.');
          } else {
            // Re-throw if it's not an S3 error
            throw imageError;
          }
        }
      } else {
        // No images - send as JSON
        if (product) {
          response = await api.put(API_ROUTES.ADMIN.PRODUCTS.UPDATE(product.id), dataToSend);
        } else {
          response = await api.post(API_ROUTES.ADMIN.PRODUCTS.CREATE, dataToSend);
        }
      }
      
      // Handle nested response structure: { success, message, data: { product: {...} } }
      const responseData = response.data?.data || response.data;
      const successMessage = response.data?.message || (product ? 'Product updated successfully' : 'Product created successfully');
      
      if (!imageUploadFailed) {
        toast.success(successMessage);
      }
      
      // Reset image files after successful save
      setImageFiles([]);
      onClose();
    } catch (error) {
      console.error('Product save error:', error);
      
      // Network errors (backend not available, timeout, etc.)
      if (!error.response) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          toast.error('Request timeout - The server is taking too long to respond. Please try again.');
        } else if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
          toast.error('Network error - Please check if the backend server is running at http://localhost:5000');
        } else {
          toast.error('Backend unavailable - Cannot save product. Please ensure the server is running.');
        }
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to save products');
      } else if (error.response.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else if (error.response.status === 500) {
        // Check for Prisma validation errors
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.error || '';
        
        if (errorMessage.includes('Prisma') || errorMessage.includes('Invalid value provided')) {
          // Extract the field name from Prisma error
          const fieldMatch = errorMessage.match(/Argument `(\w+)`:/);
          const fieldName = fieldMatch ? fieldMatch[1] : 'field';
          toast.error(`Validation error: ${fieldName} has an invalid value. Please check the form data.`);
        } else {
          toast.error('Server error - Please try again or contact support if the issue persists.');
        }
      } else {
        // Check for validation errors
        const errorData = error.response?.data || {};
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          // Show validation errors
          const validationErrors = errorData.errors.map(err => {
            const field = err.path || err.field || 'field';
            const message = err.msg || err.message || 'Invalid value';
            return `${field}: ${message}`;
          }).join(', ');
          toast.error(`Validation failed: ${validationErrors}`);
        } else {
          const errorMessage = errorData.message || 
                             errorData.error || 
                             errorData.errors?.[0]?.msg ||
                             `Failed to save product (${error.response.status})`;
          
          // Check for S3 upload errors
          const errorString = JSON.stringify(errorData).toLowerCase();
          if (errorString.includes('s3') || 
              errorString.includes('aws') || 
              errorString.includes('credentials') ||
              errorString.includes('missing credentials')) {
            toast.error('Image upload failed: AWS S3 configuration error. Product saved without image.');
          } else {
            toast.error(errorMessage);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200/50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {product ? 'Edit Product' : 'Add Product'}
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

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <div className="p-6 space-y-6">
          {/* Multiple Images Upload - Enhanced Design */}
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Product Images <span className="text-indigo-600 font-bold">(Multiple Selection Supported)</span>
            </label>
            <div className="space-y-4">
              {/* Display existing/preview images */}
              {imagePreviews.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      Selected Images ({imagePreviews.length})
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFiles([]);
                        setImagePreviews([]);
                        toast.success('All images cleared');
                      }}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-xl border-2 border-gray-200 shadow-md hover:border-indigo-400 transition-all"
                          onError={(e) => {
                            console.error('Image preview error:', e);
                            toast.error(`Failed to display image ${index + 1}`);
                            // Remove failed image
                            removeImage(index);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100 z-10"
                          title="Remove image"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs text-center py-1.5 rounded-b-xl">
                          Image {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Upload area - Enhanced */}
              <label 
                htmlFor="product-image-input"
                className="flex flex-col items-center justify-center w-full min-h-[180px] border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-200 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 group"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                    <FiUpload className="w-8 h-8 text-indigo-600" />
                  </div>
                  <p className="text-base font-semibold text-gray-700 mb-1">
                    {imagePreviews.length > 0 ? 'Add More Images' : 'Click to Select Multiple Images'}
                  </p>
                  <p className="text-sm text-gray-600 text-center">
                    You can select multiple images at once
                  </p>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Supported formats: PNG, JPG, JPEG, WEBP • Max 5MB per image
                  </p>
                  {imagePreviews.length > 0 && (
                    <div className="mt-3 px-4 py-2 bg-indigo-100 rounded-lg">
                      <p className="text-sm text-indigo-700 font-semibold">
                        ✓ {imagePreviews.length} image{imagePreviews.length !== 1 ? 's' : ''} selected
                      </p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="product-image-input"
                />
              </label>
              <p className="text-xs text-gray-500 text-center">
                💡 Tip: Hold Ctrl (Windows) or Cmd (Mac) to select multiple images, or drag and drop files
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-modern"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Slug
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="input-modern"
              placeholder="product-slug"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="input-modern"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                className="input-modern"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Compare at Price
              </label>
              <input
                type="number"
                name="compare_at_price"
                value={formData.compare_at_price}
                onChange={handleChange}
                step="0.01"
                className="input-modern"
                placeholder="Original price"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cost Price
              </label>
              <input
                type="number"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                step="0.01"
                className="input-modern"
                placeholder="Wholesale cost"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Short Description
            </label>
            <input
              type="text"
              name="short_description"
              value={formData.short_description}
              onChange={handleChange}
              className="input-modern"
              placeholder="Brief product description"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="input-modern resize-none"
              placeholder="Enter product description..."
            />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="input-modern"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SubCategory
                </label>
                <select
                  name="sub_category_id"
                  value={formData.sub_category_id}
                  onChange={handleChange}
                  disabled={!formData.category_id}
                  className="input-modern disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">{formData.category_id ? 'Select SubCategory' : 'Select Category First'}</option>
                  {subCategories.map((subCat) => (
                    <option key={subCat.id} value={subCat.id}>
                      {subCat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sub-SubCategory Selection - Show when subcategory is selected */}
            {formData.sub_category_id && (
              <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sub-SubCategory <span className="text-gray-500 text-xs font-normal">(Optional - Nested Subcategory)</span>
                </label>
                {nestedSubCategories.length > 0 ? (
                  <>
                    <select
                      name="parent_subcategory_id"
                      value={formData.parent_subcategory_id}
                      onChange={handleChange}
                      className="input-modern border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">None (Use parent SubCategory)</option>
                      {nestedSubCategories.map((nestedSubCat) => (
                        <option key={nestedSubCat.id} value={nestedSubCat.id}>
                          {nestedSubCat.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-blue-600 mt-2 flex items-center">
                      <span className="mr-1">ℹ️</span>
                      Select a sub-subcategory if this product belongs to a nested subcategory under "{subCategories.find(sc => sc.id === parseInt(formData.sub_category_id))?.name || 'selected subcategory'}"
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic py-2 bg-white rounded px-3 border border-gray-200">
                    No sub-subcategories available for "{subCategories.find(sc => sc.id === parseInt(formData.sub_category_id))?.name || 'selected subcategory'}". This product will use the parent SubCategory.
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Type
            </label>
            <select
              name="product_type"
              value={formData.product_type}
              onChange={handleChange}
              className="input-modern"
            >
              <option value="frame">Frame</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                min="0"
                className="input-modern"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock Status
              </label>
              <select
                name="stock_status"
                value={formData.stock_status}
                onChange={handleChange}
                className="input-modern"
              >
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="on_backorder">On Backorder</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Frame Shape
              </label>
              <select
                name="frame_shape"
                value={formData.frame_shape}
                onChange={handleChange}
                className="input-modern"
              >
                <option value="">Select Frame Shape</option>
                {frameShapes.map((shape) => (
                  <option key={shape} value={shape}>
                    {shape.charAt(0).toUpperCase() + shape.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Frame Material
              </label>
              <select
                name="frame_material"
                value={formData.frame_material}
                onChange={handleChange}
                className="input-modern"
              >
                <option value="">Select Frame Material</option>
                {frameMaterials.map((material) => (
                  <option key={material} value={material}>
                    {material.charAt(0).toUpperCase() + material.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Frame Color
              </label>
              <input
                type="text"
                name="frame_color"
                value={formData.frame_color}
                onChange={handleChange}
                className="input-modern"
                placeholder="e.g., Black, Gold"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-modern"
              >
                <option value="">Select Gender</option>
                {genders.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Lens Type
            </label>
            <select
              name="lens_type"
              value={formData.lens_type}
              onChange={handleChange}
              className="input-modern"
            >
              <option value="">Select Lens Type</option>
              {lensTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* SEO Fields */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">SEO Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleChange}
                  className="input-modern"
                  placeholder="SEO title"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleChange}
                  rows="2"
                  className="input-modern resize-none"
                  placeholder="SEO description"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  name="meta_keywords"
                  value={formData.meta_keywords}
                  onChange={handleChange}
                  className="input-modern"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>
          </div>

          {/* Status Checkboxes */}
          <div className="flex items-center space-x-6 border-t border-gray-200 pt-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Featured</span>
            </label>
          </div>
          </div>

          {/* Fixed Footer with Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-gray-200 bg-white flex-shrink-0">
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
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ProductModal;



