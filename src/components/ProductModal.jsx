import React, { useState, useEffect } from 'react';
import { FiX, FiUpload } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

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
  const [frameShapes, setFrameShapes] = useState([]);
  const [frameMaterials, setFrameMaterials] = useState([]);
  const [genders, setGenders] = useState([]);
  const [lensTypes, setLensTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
      // Set image preview if product has images array or image_url
      if (product.images && product.images.length > 0) {
        setImagePreview(product.images[0]);
      } else if (product.image || product.image_url) {
        setImagePreview(product.image || product.image_url);
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
      setImageFile(null);
      setImagePreview(null);
    }
  }, [product]);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        e.target.value = ''; // Reset input
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        e.target.value = ''; // Reset input
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result) {
          setImagePreview(reader.result);
          console.log('Image preview loaded successfully');
        } else {
          console.error('FileReader result is empty');
          toast.error('Failed to load image preview');
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        toast.error('Error reading image file');
        setImageFile(null);
        setImagePreview(null);
        e.target.value = ''; // Reset input
      };
      
      reader.onloadend = () => {
        console.log('FileReader loadend');
      };
      
      try {
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error('Failed to read image file');
        setImageFile(null);
        setImagePreview(null);
        e.target.value = '';
      }
    } else {
      // No file selected
      setImageFile(null);
      setImagePreview(null);
    }
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
      
      // If we have an image file, try to upload with FormData first
      if (imageFile) {
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

          // Add image file - API expects 'images' (plural)
          submitData.append('images', imageFile);

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
            // If S3 upload fails, try saving without image
            imageUploadFailed = true;
            toast.warning('Image upload failed. Saving product without image...');
            
            // Retry without image
            if (product) {
              response = await api.put(API_ROUTES.ADMIN.PRODUCTS.UPDATE(product.id), dataToSend);
            } else {
              response = await api.post(API_ROUTES.ADMIN.PRODUCTS.CREATE, dataToSend);
            }
            toast.success('Product saved successfully (without image). Please configure S3 to enable image uploads.');
          } else {
            // Re-throw if it's not an S3 error
            throw imageError;
          }
        }
      } else {
        // No image - send as JSON
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image
            </label>
            <div className="flex items-center space-x-4">
              {imagePreview && (
                <div className="relative flex-shrink-0">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                    onError={(e) => {
                      console.error('Image preview error:', e);
                      toast.error('Failed to display image preview');
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                      // Reset file input using the specific input ID
                      const fileInput = document.getElementById('product-image-input');
                      if (fileInput) fileInput.value = '';
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              )}
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    {imagePreview ? 'Change Image' : 'Click to upload'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  onClick={(e) => {
                    // Allow selecting the same file again by resetting value
                    e.target.value = '';
                  }}
                  className="hidden"
                  id="product-image-input"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="product-slug"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compare at Price
              </label>
              <input
                type="number"
                name="compare_at_price"
                value={formData.compare_at_price}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Original price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Price
              </label>
              <input
                type="number"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Wholesale cost"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Description
            </label>
            <input
              type="text"
              name="short_description"
              value={formData.short_description}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Brief product description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Type
              </label>
              <select
                name="product_type"
                value={formData.product_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="frame">Frame</option>
                {/* Note: Only "frame" is currently a valid ProductType enum value in Prisma */}
                {/* Other values like "lens" and "accessory" are not valid and will cause errors */}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Status
              </label>
              <select
                name="stock_status"
                value={formData.stock_status}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="on_backorder">On Backorder</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frame Shape
              </label>
              <select
                name="frame_shape"
                value={formData.frame_shape}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frame Material
              </label>
              <select
                name="frame_material"
                value={formData.frame_material}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frame Color
              </label>
              <input
                type="text"
                name="frame_color"
                value={formData.frame_color}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Black, Gold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lens Type
            </label>
            <select
              name="lens_type"
              value={formData.lens_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="SEO title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="SEO description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  name="meta_keywords"
                  value={formData.meta_keywords}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>
          </div>

          {/* Status Checkboxes */}
          <div className="flex items-center space-x-6 border-t pt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Featured</span>
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

export default ProductModal;



