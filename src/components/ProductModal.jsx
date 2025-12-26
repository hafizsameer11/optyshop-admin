import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiUpload, FiPlus } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';

// Helper function to validate hex code format (#RRGGBB)
const isValidHexCode = (hex) => {
  if (!hex || typeof hex !== 'string') return false;
  const hexPattern = /^#([A-Fa-f0-9]{6})$/;
  return hexPattern.test(hex.trim());
};

// Helper function to convert color name to hex code (for backward compatibility)
const getHexFromColorName = (colorName) => {
  if (!colorName) return null;
  const colorMap = {
    'black': '#000000',
    'white': '#FFFFFF',
    'brown': '#8B4513',
    'blue': '#0000FF',
    'red': '#FF0000',
    'green': '#008000',
    'gray': '#808080',
    'grey': '#808080',
    'gold': '#FFD700',
    'silver': '#C0C0C0',
    'tortoise': '#8B4513',
    'tortoiseshell': '#8B4513',
    'navy': '#000080',
    'burgundy': '#800020',
    'clear': '#FFFFFF',
    'transparent': '#FFFFFF',
  };
  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || null;
};

// Helper function to get color name from hex code (for display)
const getColorNameFromHex = (hexCode) => {
  if (!hexCode) return 'Unknown';
  const hexMap = {
    '#000000': 'Black',
    '#FFFFFF': 'White',
    '#8B4513': 'Brown',
    '#0000FF': 'Blue',
    '#FF0000': 'Red',
    '#008000': 'Green',
    '#808080': 'Gray',
    '#FFD700': 'Gold',
    '#C0C0C0': 'Silver',
    '#000080': 'Navy',
    '#800020': 'Burgundy',
  };
  const normalized = hexCode.toUpperCase().trim();
  return hexMap[normalized] || hexCode;
};

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
    frame_material: [], // Changed to array for multiple selections
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
  const [imageFiles, setImageFiles] = useState([]); // General images without color codes
  const [imagePreviews, setImagePreviews] = useState([]); // General image previews
  const [imagesWithColors, setImagesWithColors] = useState([]); // [{ file, preview, hexCode, id }]
  const [model3DFile, setModel3DFile] = useState(null);
  const [model3DPreview, setModel3DPreview] = useState(null);

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
        frame_material: Array.isArray(product.frame_material) 
          ? product.frame_material 
          : product.frame_material 
            ? [product.frame_material] 
            : [],
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
      
      // Set 3D model preview if exists
      if (product.model_3d || product.model3d || product.model3D) {
        const modelUrl = product.model_3d || product.model3d || product.model3D;
        setModel3DPreview(modelUrl);
      } else {
        setModel3DPreview(null);
      }
      setModel3DFile(null);
      
      // Set images with colors if exists (from product.color_images)
      // Convert color_images object to imagesWithColors array format
      if (product.color_images && typeof product.color_images === 'object') {
        const imagesWithHexCodes = [];
        let imageIdCounter = 0;
        
        Object.keys(product.color_images).forEach((key) => {
          // Check if key is a hex code or color name
          let hexCode = key;
          if (!isValidHexCode(key)) {
            // Old format: color name - convert to hex code
            hexCode = getHexFromColorName(key) || key;
          }
          
          const colorData = product.color_images[key];
          const imageUrls = Array.isArray(colorData?.images) ? colorData.images : 
                           Array.isArray(colorData) ? colorData : 
                           typeof colorData === 'string' ? [colorData] : [];
          
          // Create entries for each image URL
          imageUrls.forEach((imageUrl) => {
            if (imageUrl && typeof imageUrl === 'string') {
              imagesWithHexCodes.push({
                id: `existing-${imageIdCounter++}`,
                file: null, // Existing image, no file
                preview: imageUrl,
                hexCode: hexCode.toUpperCase(),
                isExisting: true
              });
            }
          });
        });
        
        setImagesWithColors(imagesWithHexCodes);
      } else {
        setImagesWithColors([]);
      }
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
        frame_material: [],
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
      setModel3DFile(null);
      setModel3DPreview(null);
      setImagesWithColors([]);
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
      
      // Merge API frame materials with additional material types
      const apiMaterials = optionsData.frameMaterials || [];
      const additionalMaterials = ['plastic', 'glass', 'polycarbonate', 'trivex', 'high_index'];
      const allMaterials = [...new Set([...apiMaterials, ...additionalMaterials])];
      setFrameMaterials(allMaterials);
      
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
      // Set fallback materials even if API fails
      setFrameMaterials(['plastic', 'glass', 'polycarbonate', 'trivex', 'high_index']);
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
      // Create previews and add to imagesWithColors (without hex code initially)
      const previewPromises = validFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ file, preview: reader.result });
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(previewPromises).then((results) => {
        const validResults = results.filter(Boolean);
        const newImages = validResults.map((result, index) => ({
          id: `new-${Date.now()}-${index}`,
          file: result.file,
          preview: result.preview,
          hexCode: '', // No hex code assigned yet - user will assign
          isExisting: false
        }));
        
        setImagesWithColors([...imagesWithColors, ...newImages]);
        toast.success(`${validFiles.length} image(s) added. Assign hex color codes to each image.`);
      });
    }

    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  // Handle general images (without color codes) - for backward compatibility
  const handleGeneralImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}: Not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: Size exceeds 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const newFiles = product ? validFiles : [...imageFiles, ...validFiles];
      setImageFiles(newFiles);

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
        const newPreviews = product ? validPreviews : [...imagePreviews, ...validPreviews];
        setImagePreviews(newPreviews);
        toast.success(`${validFiles.length} general image(s) added (no color code)`);
      });
    }

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

  const removeImageWithColor = (id) => {
    setImagesWithColors(imagesWithColors.filter(img => img.id !== id));
    toast.success('Image removed');
  };

  const updateImageHexCode = (id, hexCode) => {
    if (hexCode && !isValidHexCode(hexCode)) {
      toast.error('Invalid hex code format. Must be #RRGGBB');
      return;
    }
    
    setImagesWithColors(imagesWithColors.map(img => 
      img.id === id ? { ...img, hexCode: hexCode ? hexCode.toUpperCase().trim() : '' } : img
    ));
  };

  const handleModel3DChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (3D model formats)
    const validExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.dae'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error(`Invalid 3D model format. Supported: ${validExtensions.join(', ')}`);
      e.target.value = '';
      return;
    }

    // Validate file size (max 50MB for 3D models)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('3D model file size exceeds 50MB limit');
      e.target.value = '';
      return;
    }

    setModel3DFile(file);
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setModel3DPreview(previewUrl);
    toast.success('3D model selected');
    e.target.value = '';
  };

  const removeModel3D = () => {
    if (model3DPreview && model3DPreview.startsWith('blob:')) {
      URL.revokeObjectURL(model3DPreview);
    }
    setModel3DFile(null);
    setModel3DPreview(null);
    toast.success('3D model removed');
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
      if (!formData.category_id) {
        toast.error('Category is required');
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
      // category_id is required - always include it
      const categoryId = parseInt(formData.category_id);
      if (!isNaN(categoryId) && categoryId > 0) {
        dataToSend.category_id = categoryId;
      } else {
        toast.error('Valid category is required');
        setLoading(false);
        return;
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
      // Send frame_shape as-is (API accepts any string value)
      if (formData.frame_shape) {
        dataToSend.frame_shape = formData.frame_shape.trim();
      }
      // Send frame_material - API accepts single string or JSON array for multiple materials
      if (formData.frame_material && Array.isArray(formData.frame_material) && formData.frame_material.length > 0) {
        // Filter out empty values and trim
        const validMaterials = formData.frame_material.map(m => m.trim()).filter(m => m);
        if (validMaterials.length === 0) {
          // Skip if all materials are empty
        } else if (validMaterials.length === 1) {
          // If single material, send as string (per Postman API spec)
          dataToSend.frame_material = validMaterials[0];
        } else {
          // If multiple materials, send as array (per Postman API spec)
          dataToSend.frame_material = validMaterials;
        }
      } else if (formData.frame_material && !Array.isArray(formData.frame_material)) {
        const trimmed = formData.frame_material.trim();
        // Handle legacy single value format - send as string if not empty
        if (trimmed) {
          dataToSend.frame_material = trimmed;
        }
      }
      if (formData.frame_color) dataToSend.frame_color = formData.frame_color.trim();
      if (formData.gender) dataToSend.gender = formData.gender.trim();
      // Send lens_type as-is (API accepts any string value)
      if (formData.lens_type) dataToSend.lens_type = formData.lens_type.trim();
      if (formData.compare_at_price && formData.compare_at_price !== '') {
        const comparePrice = parseFloat(formData.compare_at_price);
        if (!isNaN(comparePrice) && comparePrice >= 0) {
          dataToSend.compare_at_price = comparePrice;
        }
      }
      // Send product_type if it's provided
      if (formData.product_type) {
        dataToSend.product_type = formData.product_type;
      }
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
      
      // Check if we need to use FormData (images, 3D model, or images with colors)
      const hasImageFiles = imageFiles && imageFiles.length > 0 && imageFiles.every(file => file instanceof File);
      const has3DModel = model3DFile && model3DFile instanceof File;
      const hasImagesWithColors = imagesWithColors.some(img => img.file instanceof File);
      
      // If we have any files (images, 3D model, or images with colors), use FormData
      if (hasImageFiles || has3DModel || hasImagesWithColors) {
        try {
          const submitData = new FormData();
          
          // Add all fields to FormData with proper type conversion
          // Required fields: name, sku, price, category_id
          const requiredFields = new Set(['name', 'sku', 'price', 'category_id']);
          
          Object.keys(dataToSend).forEach((key) => {
            const value = dataToSend[key];
            const isRequired = requiredFields.has(key);
            
            // For required fields, always send (even if empty, let backend validate)
            // For optional fields, skip null, undefined, and empty strings
            if (!isRequired && (value === null || value === undefined || value === '')) {
              return; // Skip this optional field
            }
            
            // Special handling for frame_material - per Postman API spec
            // Can be single string or array for multiple materials
            if (key === 'frame_material') {
              if (Array.isArray(value) && value.length > 0) {
                // Filter out empty values and send each material as a separate form field
                // Backend will receive this as an array: frame_material = ['acetate', 'metal']
                value.filter(m => m && m.trim()).forEach((material) => {
                  submitData.append('frame_material', material.trim());
                });
              } else if (typeof value === 'string' && value.trim()) {
                // Single material - send as string
                submitData.append('frame_material', value.trim());
              }
              return; // Skip the normal processing for this field
            }
            
            // Convert types properly for FormData
            if (typeof value === 'boolean') {
              // Booleans: send as "true" or "false" strings
              submitData.append(key, value.toString());
            } else if (typeof value === 'number') {
              // Numbers: send as string (FormData requirement)
              submitData.append(key, value.toString());
            } else if (typeof value === 'string') {
              // Strings: trim and send
              submitData.append(key, value.trim());
            } else if (Array.isArray(value)) {
              // Arrays: convert to JSON string for other array fields
              submitData.append(key, JSON.stringify(value));
            } else if (typeof value === 'object' && value !== null) {
              // Objects: convert to JSON string
              submitData.append(key, JSON.stringify(value));
            } else {
              submitData.append(key, String(value));
            }
          });

          // Add 3D model file if present (per Postman collection: model_3d field)
          if (model3DFile) {
            submitData.append('model_3d', model3DFile);
          }
          
          // Method 1: Parallel Arrays (Recommended - Per Postman Collection)
          // According to Postman: "Each hex code maps to the image at the same index"
          // Example from Postman: 
          //   - Upload 5 images in `images` field
          //   - Provide `image_colors`: `["#000000", "#000000", "#FFD700", "#FFD700", "#8B4513"]`
          //   - Result: images[0] → #000000, images[1] → #000000, images[2] → #FFD700, etc.
          // Strategy: Build parallel arrays where image_colors[i] maps to images[i] by exact index
          
          // Separate images: those with hex codes and those without (general images)
          const imagesWithHexCodes = imagesWithColors.filter(img => 
            img.file instanceof File && img.hexCode && isValidHexCode(img.hexCode)
          );
          const imagesWithoutHexCodes = imagesWithColors.filter(img => 
            img.file instanceof File && (!img.hexCode || !isValidHexCode(img.hexCode))
          );
          
          // Strategy per Postman: 
          // - All images go in 'images' field
          // - image_colors array maps to images by index
          // - Images without color codes become general product images
          // 
          // We'll put images with hex codes first, then general images
          // This way image_colors indices match the first N images
          
          const imageFilesArray = [];
          const imageColorsArray = [];
          
          // First, add images with hex codes (these will have corresponding entries in image_colors)
          imagesWithHexCodes.forEach((img) => {
            imageFilesArray.push(img.file);
            imageColorsArray.push(img.hexCode);
          });
          
          // Then add general images (from imageFiles) - no color codes
          imageFiles.forEach((file) => {
            imageFilesArray.push(file);
            // Don't add to imageColorsArray - these are general images
          });
          
          // Then add images without hex codes from imagesWithColors - no color codes
          imagesWithoutHexCodes.forEach((img) => {
            imageFilesArray.push(img.file);
            // Don't add to imageColorsArray - these are general images
          });
          
          // Append all images to 'images' field
          imageFilesArray.forEach((file) => {
            submitData.append('images', file);
          });
          
          // Append image_colors as JSON array string
          // This array contains hex codes for the first N images (where N = imageColorsArray.length)
          // The backend will match: images[0] → image_colors[0], images[1] → image_colors[1], etc.
          // Remaining images (without hex codes) become general product images
          // Only send image_colors if we have valid hex codes
          if (imageColorsArray.length > 0 && imageColorsArray.every(hex => hex && isValidHexCode(hex))) {
            const imageColorsJson = JSON.stringify(imageColorsArray);
            submitData.append('image_colors', imageColorsJson);
            
            if (import.meta.env.DEV) {
              console.log('Sending image_colors:', imageColorsJson);
            }
          }
          
          // Note: Removed 'replace_images' field as it's not in the Postman collection
          // and may cause Multer "Unexpected field" errors
          
          // Log FormData contents in development mode for debugging
          if (import.meta.env.DEV) {
            const formDataObj = {};
            for (const [key, value] of submitData.entries()) {
              if (value instanceof File) {
                formDataObj[key] = `[File: ${value.name}, size: ${value.size}]`;
              } else {
                formDataObj[key] = value;
              }
            }
            console.log('Sending product FormData:', {
              ...formDataObj,
              imageFilesCount: imageFiles.length,
              imagesWithColorsCount: imagesWithColors.filter(img => img.file instanceof File).length,
              imagesWithHexCodesCount: imagesWithHexCodes.length,
              has3DModel: !!model3DFile,
              isUpdate: !!product
            });
          }

          if (product) {
            response = await api.put(API_ROUTES.ADMIN.PRODUCTS.UPDATE(product.id), submitData);
          } else {
            response = await api.post(API_ROUTES.ADMIN.PRODUCTS.CREATE, submitData);
          }
        } catch (imageError) {
          // Log full error details
          console.error('Image upload error details:', {
            message: imageError.message,
            status: imageError.response?.status,
            statusText: imageError.response?.statusText,
            data: imageError.response?.data,
            config: {
              url: imageError.config?.url,
              method: imageError.config?.method,
              headers: imageError.config?.headers
            }
          });
          
          // Check for Multer "Unexpected field" error
          const errorData = imageError.response?.data || {};
          const errorMessage = errorData.message || errorData.error || '';
          if (errorMessage.includes('Unexpected field') && imagesWithColors.length > 0) {
            console.warn('Multer "Unexpected field" error detected. This may be due to image color fields not being accepted by the backend Multer configuration.');
          }
          
          // Re-throw the error - let multer handle file uploads
          throw imageError;
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
      
      toast.success(successMessage);
      
      // Reset image files after successful save
      setImageFiles([]);
      setImagePreviews([]);
      setImagesWithColors([]);
      onClose();
    } catch (error) {
      // Log full error details for debugging
      console.error('Product save error:', error);
      console.error('Error response:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
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
        
        // Log the full error for debugging
        console.error('Server 500 error details:', {
          message: errorMessage,
          error: errorData.error,
          stack: errorData.stack,
          fullData: errorData
        });
        
        // Log the full Prisma error if available
        if (errorData.fullData || errorData.stack) {
          console.error('Full Prisma error:', JSON.stringify(errorData, null, 2));
        }
        
        if (errorMessage.includes('Prisma') || errorMessage.includes('Invalid value provided')) {
          // Try to extract more detailed Prisma error information
          const prismaErrorMatch = errorMessage.match(/Invalid `prisma\.(\w+)\.(\w+)`/);
          const fieldMatch = errorMessage.match(/Argument `(\w+)`:/);
          const fieldName = fieldMatch ? fieldMatch[1] : (prismaErrorMatch ? prismaErrorMatch[2] : 'field');
          
          // Try to extract the actual error reason
          const reasonMatch = errorMessage.match(/Argument `\w+`:(.+?)(?:\.|$)/);
          const reason = reasonMatch ? reasonMatch[1].trim() : 'has an invalid value';
          
          toast.error(`Prisma validation error: ${fieldName} ${reason}. Please check the form data and console for details.`);
          console.error('Prisma validation error details:', {
            field: fieldName,
            reason: reason,
            fullMessage: errorMessage
          });
        } else if (errorMessage.includes('multer') || errorMessage.includes('file upload') || errorMessage.includes('Unexpected field')) {
          // Multer "Unexpected field" error - usually means backend doesn't accept the field name
          if (errorMessage.includes('Unexpected field')) {
            toast.error('File upload error: Backend does not recognize one of the file field names. This may be due to color-specific image fields. Please try uploading without color-specific images, or contact the backend team to update Multer configuration.');
          } else {
            toast.error(`File upload error: ${errorMessage}. Please check file formats and sizes.`);
          }
        } else {
          // Show more detailed error message
          const detailedMessage = errorMessage || 'Server error occurred';
          toast.error(`Server error: ${detailedMessage}. Check console for details.`);
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
          
          // Show error message
          toast.error(errorMessage);
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

          {/* 3D Model Upload - Per Postman Collection */}
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              3D Model <span className="text-gray-500 text-xs font-normal">(Optional)</span>
            </label>
            <div className="space-y-4">
              {/* Display existing/preview 3D model */}
              {model3DPreview && (
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      3D Model Selected
                    </p>
                    <button
                      type="button"
                      onClick={removeModel3D}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="bg-gray-100 rounded-xl p-4 border-2 border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {model3DFile ? model3DFile.name : '3D Model'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {model3DFile ? `${(model3DFile.size / 1024 / 1024).toFixed(2)} MB` : 'Existing model'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Upload area */}
              <label 
                htmlFor="product-3d-model-input"
                className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-200 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 group"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                    <span className="text-2xl">📦</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    {model3DPreview ? 'Replace 3D Model' : 'Click to Upload 3D Model'}
                  </p>
                  <p className="text-xs text-gray-600 text-center">
                    Supported: GLB, GLTF, OBJ, FBX, DAE
                  </p>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Max size: 50MB
                  </p>
                </div>
                <input
                  type="file"
                  accept=".glb,.gltf,.obj,.fbx,.dae"
                  onChange={handleModel3DChange}
                  className="hidden"
                  id="product-3d-model-input"
                />
              </label>
            </div>
          </div>

          {/* Images with Color Codes - Single Upload System */}
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Images with Color Codes <span className="text-gray-500 text-xs font-normal">(Optional)</span>
            </label>
            <p className="text-xs text-gray-600 mb-4">
              Upload images and assign a hex color code to each image. Each image can be associated with a specific color variant.
              Format: <code className="bg-gray-100 px-1 rounded">#RRGGBB</code> (e.g., #000000 for black, #FFD700 for gold)
            </p>
            
            {/* Display images with their assigned hex codes */}
            {imagesWithColors.length > 0 && (
              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    Images with Colors ({imagesWithColors.length})
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setImagesWithColors([]);
                      toast.success('All color images cleared');
                    }}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {imagesWithColors.map((img) => (
                    <div key={img.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="relative mb-2">
                        <img
                          src={img.preview}
                          alt="Product color variant"
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImageWithColor(img.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                          title="Remove image"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Hex Color Code
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={img.hexCode || ''}
                              onChange={(e) => updateImageHexCode(img.id, e.target.value)}
                              placeholder="#000000"
                              className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              pattern="^#[0-9A-Fa-f]{6}$"
                            />
                            {img.hexCode && isValidHexCode(img.hexCode) && (
                              <div 
                                className="w-8 h-8 rounded border-2 border-gray-300 shadow-sm flex-shrink-0"
                                style={{ backgroundColor: img.hexCode }}
                                title={img.hexCode}
                              />
                            )}
                          </div>
                          {img.hexCode && !isValidHexCode(img.hexCode) && (
                            <p className="text-xs text-red-600 mt-1">Invalid hex code format</p>
                          )}
                        </div>
                        {img.hexCode && isValidHexCode(img.hexCode) && (
                          <p className="text-xs text-gray-600">
                            {getColorNameFromHex(img.hexCode)} ({img.hexCode})
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upload area for images with colors */}
            <label 
              htmlFor="images-with-colors-input"
              className="flex flex-col items-center justify-center w-full min-h-[150px] border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-200 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 group"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                  <FiUpload className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  {imagesWithColors.length > 0 ? 'Add More Images' : 'Click to Upload Images'}
                </p>
                <p className="text-xs text-gray-600 text-center">
                  Upload images and assign hex color codes to each
                </p>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Supported formats: PNG, JPG, JPEG, WEBP • Max 5MB per image
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                id="images-with-colors-input"
              />
            </label>
            
            {/* Quick color picker for common colors */}
            <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-xs font-medium text-blue-700 mb-2">Quick Color Codes:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { hex: '#000000', name: 'Black' },
                  { hex: '#8B4513', name: 'Brown' },
                  { hex: '#0000FF', name: 'Blue' },
                  { hex: '#FF0000', name: 'Red' },
                  { hex: '#008000', name: 'Green' },
                  { hex: '#808080', name: 'Gray' },
                  { hex: '#FFD700', name: 'Gold' },
                  { hex: '#C0C0C0', name: 'Silver' },
                ].map(({ hex, name }) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => {
                      // Apply to all images without hex codes
                      setImagesWithColors(imagesWithColors.map(img => 
                        !img.hexCode ? { ...img, hexCode: hex } : img
                      ));
                      toast.success(`Applied ${name} (${hex}) to unassigned images`);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs"
                    title={`Apply ${name} (${hex}) to unassigned images`}
                  >
                    <div 
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-gray-700">{name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* General Images (without color codes) - Optional */}
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              General Product Images <span className="text-gray-500 text-xs font-normal">(Optional - No Color Codes)</span>
            </label>
            <p className="text-xs text-gray-600 mb-4">
              Upload general product images that are not associated with specific color variants.
            </p>
            <div className="space-y-4">
              {imagePreviews.length > 0 && (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`General image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-xl border-2 border-gray-200 shadow-md hover:border-indigo-400 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100 z-10"
                          title="Remove image"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <label 
                htmlFor="general-image-input"
                className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50/50 transition-all duration-200"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                  <FiUpload className="w-6 h-6 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    {imagePreviews.length > 0 ? 'Add More General Images' : 'Upload General Images'}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGeneralImageChange}
                  className="hidden"
                  id="general-image-input"
                />
              </label>
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
              Product Type <span className="text-red-500">*</span>
            </label>
            <select
              name="product_type"
              value={formData.product_type}
              onChange={handleChange}
              className="input-modern"
              required
            >
              <option value="">Select Product Type</option>
              <option value="frame">Frame</option>
              <option value="lens">Lens</option>
              <option value="contact_lens">Contact Lens</option>
              <option value="accessory">Accessory</option>
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
                <option value="backorder">Backorder</option>
                <option value="preorder">Preorder</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Frame Shape
              </label>
              <input
                type="text"
                name="frame_shape"
                value={formData.frame_shape}
                onChange={handleChange}
                className="input-modern"
                placeholder="Enter any frame shape"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Frame Material
              </label>
              <input
                type="text"
                name="frame_material"
                value={Array.isArray(formData.frame_material) ? formData.frame_material.join(', ') : formData.frame_material || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Convert comma-separated string to array, or keep as single value
                  if (value.includes(',')) {
                    setFormData({
                      ...formData,
                      frame_material: value.split(',').map(m => m.trim()).filter(m => m)
                    });
                  } else {
                    setFormData({
                      ...formData,
                      frame_material: value ? [value.trim()] : []
                    });
                  }
                }}
                className="input-modern"
                placeholder="Enter frame material(s), comma-separated for multiple"
              />
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
            <input
              type="text"
              name="lens_type"
              value={formData.lens_type}
              onChange={handleChange}
              className="input-modern"
              placeholder="Enter any lens type"
            />
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



