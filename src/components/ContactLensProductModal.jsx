import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiX, FiUpload, FiChevronRight, FiPlus, FiTrash2, FiCopy, FiEdit2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';
import SphericalConfigModal from './SphericalConfigModal';
import AstigmatismConfigModal from './AstigmatismConfigModal';

const ContactLensProductModal = ({ product, onClose, selectedSection }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  
  // Map contact lens form modal types to their routes
  const contactLensFormRoutes = {
    'spherical': '/contact-lens-forms/spherical',
    'astigmatism': '/contact-lens-forms/astigmatism',
  };
  
  // Helper function to handle contact lens form modal close with navigation
  // saved: true if form was saved successfully, false/undefined if cancelled/closed
  const handleContactLensFormClose = (modalType) => {
    return (saved = false) => {
      // Close the contact lens form modal
      const modalStateSetters = {
        'spherical': [setSphericalModalOpen, setSelectedSphericalConfig, fetchSphericalConfigs],
        'astigmatism': [setAstigmatismModalOpen, setSelectedAstigmatismConfig, fetchAstigmatismConfigs],
      };
      
      const [setModalOpen, setSelected, refreshData] = modalStateSetters[modalType] || [null, null, null];
      if (setModalOpen) setModalOpen(false);
      if (setSelected) setSelected(null);
      
      // Always refresh data when modal closes (whether saved or cancelled)
      // This ensures the table is up-to-date
      if (refreshData && product?.id) {
        console.log(`🔄 Refreshing ${modalType} configs after modal close`);
        refreshData();
      }
      
      // Only navigate and close product modal if form was saved successfully
      if (saved) {
        // Close the product modal
        onClose();
        
        // Navigate to the appropriate contact lens form page
        const route = contactLensFormRoutes[modalType];
        if (route) {
          navigate(route);
        }
      }
      // If cancelled, just close the modal and stay in product modal
    };
  };
  const [activeTab, setActiveTab] = useState('general');
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
    parent_subcategory_id: '',
    stock_quantity: '',
    stock_status: 'in_stock',
    compare_at_price: '',
    product_type: 'contact_lens',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    is_active: true,
    is_featured: false,
    // Contact Lens specific fields
    contact_lens_brand: '',
    contact_lens_material: '',
    contact_lens_color: '',
    contact_lens_type: '',
    replacement_frequency: '',
    water_content: '',
    can_sleep_with: false,
    is_medical_device: false,
    has_uv_filter: false,
  });
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [nestedSubCategories, setNestedSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [nestedSubCategoriesForConfig, setNestedSubCategoriesForConfig] = useState([]);
  const [productsForConfig, setProductsForConfig] = useState([]);
  
  // Configuration tables state
  const [sphericalConfigs, setSphericalConfigs] = useState([]);
  const [astigmatismConfigs, setAstigmatismConfigs] = useState([]);
  const [loadingSpherical, setLoadingSpherical] = useState(false);
  const [loadingAstigmatism, setLoadingAstigmatism] = useState(false);
  const [sphericalModalOpen, setSphericalModalOpen] = useState(false);
  const [astigmatismModalOpen, setAstigmatismModalOpen] = useState(false);
  const [selectedSphericalConfig, setSelectedSphericalConfig] = useState(null);
  const [selectedAstigmatismConfig, setSelectedAstigmatismConfig] = useState(null);

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
        parent_subcategory_id: '',
        stock_quantity: product.stock_quantity || product.stock || '',
        stock_status: product.stock_status || 'in_stock',
        compare_at_price: product.compare_at_price || '',
        product_type: 'contact_lens',
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        meta_keywords: product.meta_keywords || '',
        is_active: product.is_active !== undefined ? product.is_active : true,
        is_featured: product.is_featured || false,
        // Contact Lens fields
        contact_lens_brand: product.contact_lens_brand || '',
        contact_lens_material: product.contact_lens_material || '',
        contact_lens_color: product.contact_lens_color || '',
        contact_lens_type: product.contact_lens_type || '',
        replacement_frequency: product.replacement_frequency || '',
        water_content: product.water_content || '',
        can_sleep_with: product.can_sleep_with || false,
        is_medical_device: product.is_medical_device || false,
        has_uv_filter: product.has_uv_filter || false,
      });
      if (product.category_id) {
        fetchSubCategories(product.category_id);
      }
      // Set existing images
      let existingImageUrls = [];
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        existingImageUrls = product.images.filter(img => img && typeof img === 'string');
      } else if (product.image || product.image_url) {
        existingImageUrls = [product.image || product.image_url].filter(Boolean);
      }
      setExistingImages(existingImageUrls);
      setImagePreviews(existingImageUrls);
    }
  }, [product]);

  useEffect(() => {
    if (formData.sub_category_id) {
      fetchNestedSubCategories(formData.sub_category_id);
      // Also fetch nested subcategories for configurations
      fetchNestedSubCategoriesForConfig(formData.sub_category_id);
      // Fetch products for configurations
      if (formData.sub_category_id) {
        fetchProductsForConfig(formData.sub_category_id);
      }
    } else {
      setNestedSubCategories([]);
      setNestedSubCategoriesForConfig([]);
      setProductsForConfig([]);
    }
  }, [formData.sub_category_id]);
  
  // Fetch configurations when tab changes or product changes
  useEffect(() => {
    if (product?.id) {
      if (activeTab === 'spherical') {
        console.log('🔄 Tab changed to spherical, fetching configs for product:', product.id);
        fetchSphericalConfigs();
      } else if (activeTab === 'astigmatism') {
        console.log('🔄 Tab changed to astigmatism, fetching configs for product:', product.id);
        fetchAstigmatismConfigs();
      }
    } else {
      console.log('⚠️ No product ID, clearing configs');
      if (activeTab === 'spherical') {
        setSphericalConfigs([]);
      } else if (activeTab === 'astigmatism') {
        setAstigmatismConfigs([]);
      }
    }
  }, [activeTab, product?.id]);

  const fetchProductOptions = async () => {
    try {
      const response = await api.get(API_ROUTES.PRODUCTS.OPTIONS);
      const optionsData = response.data?.data || response.data || {};
      setCategories(optionsData.categories || []);
    } catch (error) {
      console.error('Failed to fetch product options', error);
      try {
        const response = await api.get(API_ROUTES.CATEGORIES.LIST);
        const categoriesData = response.data?.data?.categories || response.data?.categories || response.data || [];
        setCategories(categoriesData);
      } catch (catError) {
        console.error('Failed to fetch categories', catError);
        setCategories([]);
      }
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
      console.warn('Failed to fetch subcategories', error);
      setSubCategories([]);
    }
  };

  const fetchNestedSubCategories = async (subCategoryId) => {
    if (!subCategoryId) {
      setNestedSubCategories([]);
      return;
    }
    try {
      const response = await api.get(API_ROUTES.SUBCATEGORIES.BY_PARENT(subCategoryId));
      const responseData = response.data?.data || response.data || {};
      const nestedData = responseData.subcategories || response.data || [];
      setNestedSubCategories(Array.isArray(nestedData) ? nestedData : []);
    } catch (error) {
      console.warn('Failed to fetch nested subcategories', error);
      setNestedSubCategories([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'category_id') {
      setFormData({ 
        ...formData, 
        [name]: value,
        sub_category_id: '',
        parent_subcategory_id: ''
      });
      fetchSubCategories(value);
      setNestedSubCategories([]);
    } else if (name === 'sub_category_id') {
      setFormData({ 
        ...formData, 
        [name]: value,
        parent_subcategory_id: ''
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
        const newPreviews = product ? [...imagePreviews, ...validPreviews] : [...imagePreviews, ...validPreviews];
        setImagePreviews(newPreviews);
        toast.success(`${validFiles.length} image(s) added`);
      });
    }
    e.target.value = '';
  };

  const removeImage = (index) => {
    const previewToRemove = imagePreviews[index];
    if (typeof previewToRemove === 'string' && !previewToRemove.startsWith('blob:') && !previewToRemove.startsWith('data:')) {
      setExistingImages(prev => prev.filter(img => img !== previewToRemove));
    } else {
      const existingCount = imagePreviews.slice(0, index).filter(preview => 
        typeof preview === 'string' && !preview.startsWith('blob:') && !preview.startsWith('data:')
      ).length;
      const fileIndex = index - existingCount;
      if (fileIndex >= 0 && fileIndex < imageFiles.length) {
        const newFiles = [...imageFiles];
        newFiles.splice(fileIndex, 1);
        setImageFiles(newFiles);
      }
    }
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };


  // Helper function to extract data from API responses (similar to ProductModal)
  const extractConfigData = (response, key) => {
    if (!response || !response.data) return [];
    
    const responseData = response.data;
    let extractedData = [];
    
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    const singularKey = key.slice(0, -1);
    const singularSnakeKey = snakeKey.slice(0, -1);
    
    const alternativeKeys = {
      'sphericalConfigs': ['configs', 'spherical_configs', 'sphericalConfig'],
      'astigmatismConfigs': ['configs', 'astigmatism_configs', 'astigmatismConfig'],
    };
    
    const allKeysToCheck = [key, snakeKey, singularKey, singularSnakeKey, ...(alternativeKeys[key] || [])];
    
    // Strategy 1: Check responseData.data (most common structure)
    if (responseData?.data) {
      const dataObj = responseData.data;
      if (Array.isArray(dataObj)) {
        extractedData = dataObj;
      } else if (typeof dataObj === 'object') {
        for (const checkKey of allKeysToCheck) {
          if (dataObj[checkKey] && Array.isArray(dataObj[checkKey])) {
            extractedData = dataObj[checkKey];
            break;
          }
        }
        if (extractedData.length === 0 && dataObj.data) {
          if (Array.isArray(dataObj.data)) {
            extractedData = dataObj.data;
          } else if (typeof dataObj.data === 'object') {
            for (const checkKey of allKeysToCheck) {
              if (dataObj.data[checkKey] && Array.isArray(dataObj.data[checkKey])) {
                extractedData = dataObj.data[checkKey];
                break;
              }
            }
          }
        }
        if (extractedData.length === 0) {
          if (dataObj.results && Array.isArray(dataObj.results)) {
            extractedData = dataObj.results;
          } else if (dataObj.items && Array.isArray(dataObj.items)) {
            extractedData = dataObj.items;
          } else if (dataObj.list && Array.isArray(dataObj.list)) {
            extractedData = dataObj.list;
          } else if (dataObj.records && Array.isArray(dataObj.records)) {
            extractedData = dataObj.records;
          }
        }
      }
    }
    
    // Strategy 2: Check if responseData is directly an array
    if (extractedData.length === 0 && Array.isArray(responseData)) {
      extractedData = responseData;
    }
    
    // Strategy 3: Check for keys at root level
    if (extractedData.length === 0 && responseData && typeof responseData === 'object') {
      for (const checkKey of allKeysToCheck) {
        if (responseData[checkKey] && Array.isArray(responseData[checkKey])) {
          extractedData = responseData[checkKey];
          break;
        }
      }
      if (extractedData.length === 0) {
        if (responseData.data && Array.isArray(responseData.data)) {
          extractedData = responseData.data;
        } else if (responseData.results && Array.isArray(responseData.results)) {
          extractedData = responseData.results;
        } else if (responseData.items && Array.isArray(responseData.items)) {
          extractedData = responseData.items;
        } else if (responseData.records && Array.isArray(responseData.records)) {
          extractedData = responseData.records;
        }
      }
    }
    
    // Final fallback: find any array in the response and use the largest one
    if (extractedData.length === 0) {
      const findArrays = (obj, path = '') => {
        const arrays = [];
        if (obj && typeof obj === 'object') {
          for (const [k, v] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${k}` : k;
            if (Array.isArray(v)) {
              arrays.push({ path: currentPath, length: v.length, data: v });
            } else if (v && typeof v === 'object' && !Array.isArray(v)) {
              arrays.push(...findArrays(v, currentPath));
            }
          }
        }
        return arrays;
      };
      
      const foundArrays = findArrays(responseData);
      if (foundArrays.length > 0) {
        const largestArray = foundArrays.reduce((prev, current) => (prev.length > current.length ? prev : current));
        if (largestArray.length > 0) {
          extractedData = largestArray.data;
          console.log(`💡 Using fallback array from path: ${largestArray.path} (${largestArray.length} items)`);
        }
      }
    }
    
    if (extractedData.length > 0) {
      console.log(`✅ Successfully extracted ${extractedData.length} ${key} items`);
    } else {
      console.warn(`⚠️ No data extracted for ${key}. Response:`, JSON.stringify(responseData, null, 2).substring(0, 500));
    }
    return Array.isArray(extractedData) ? extractedData : [];
  };

  // Fetch Spherical Configurations
  const fetchSphericalConfigs = async () => {
    if (!product?.id) {
      setSphericalConfigs([]);
      return;
    }
    try {
      setLoadingSpherical(true);
      const endpoint = `${API_ROUTES.ADMIN.CONTACT_LENS_FORMS.SPHERICAL.LIST}?product_id=${product.id}&limit=1000`;
      console.log(`🔍 Fetching spherical configs for product ${product.id} from: ${endpoint}`);
      
      const response = await api.get(endpoint);
      console.log('📦 Spherical configs API response:', response);
      console.log('📦 Full response data:', JSON.stringify(response.data, null, 2));
      
      const configsData = extractConfigData(response, 'sphericalConfigs');
      console.log(`✅ Extracted ${configsData.length} spherical configs:`, configsData);
      
      setSphericalConfigs(configsData);
      
      if (configsData.length === 0) {
        console.warn('⚠️ No spherical configs found. Full response:', JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.error('❌ Failed to fetch spherical configs:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      // Don't show error toast if it's just no data (404 might be acceptable)
      if (error.response?.status !== 404) {
        toast.error('Failed to load spherical configurations');
      }
      setSphericalConfigs([]);
    } finally {
      setLoadingSpherical(false);
    }
  };

  // Fetch Astigmatism Configurations
  const fetchAstigmatismConfigs = async () => {
    if (!product?.id) {
      setAstigmatismConfigs([]);
      return;
    }
    try {
      setLoadingAstigmatism(true);
      const endpoint = `${API_ROUTES.ADMIN.CONTACT_LENS_FORMS.ASTIGMATISM.LIST}?product_id=${product.id}&limit=1000`;
      console.log(`🔍 Fetching astigmatism configs for product ${product.id} from: ${endpoint}`);
      
      const response = await api.get(endpoint);
      console.log('📦 Astigmatism configs API response:', response);
      console.log('📦 Full response data:', JSON.stringify(response.data, null, 2));
      
      const configsData = extractConfigData(response, 'astigmatismConfigs');
      console.log(`✅ Extracted ${configsData.length} astigmatism configs:`, configsData);
      
      setAstigmatismConfigs(configsData);
      
      if (configsData.length === 0) {
        console.warn('⚠️ No astigmatism configs found. Full response:', JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.error('❌ Failed to fetch astigmatism configs:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      // Don't show error toast if it's just no data (404 might be acceptable)
      if (error.response?.status !== 404) {
        toast.error('Failed to load astigmatism configurations');
      }
      setAstigmatismConfigs([]);
    } finally {
      setLoadingAstigmatism(false);
    }
  };

  // Handle configuration modals
  const handleSphericalAdd = () => {
    setSelectedSphericalConfig(null);
    setSphericalModalOpen(true);
  };

  const handleSphericalEdit = (config) => {
    setSelectedSphericalConfig(config);
    setSphericalModalOpen(true);
  };

  const handleSphericalDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this spherical configuration?')) return;
    try {
      await api.delete(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.SPHERICAL.DELETE(id));
      toast.success('Spherical configuration deleted successfully');
      fetchSphericalConfigs();
    } catch (error) {
      toast.error('Failed to delete spherical configuration');
    }
  };

  const handleAstigmatismAdd = () => {
    setSelectedAstigmatismConfig(null);
    setAstigmatismModalOpen(true);
  };

  const handleAstigmatismEdit = (config) => {
    setSelectedAstigmatismConfig(config);
    setAstigmatismModalOpen(true);
  };

  const handleAstigmatismDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this astigmatism configuration?')) return;
    try {
      await api.delete(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.ASTIGMATISM.DELETE(id));
      toast.success('Astigmatism configuration deleted successfully');
      fetchAstigmatismConfigs();
    } catch (error) {
      toast.error('Failed to delete astigmatism configuration');
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
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

      const dataToSend = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        price: parseFloat(formData.price) || 0,
        category_id: parseInt(formData.category_id),
        product_type: 'contact_lens',
      };

      if (formData.slug && formData.slug.trim()) dataToSend.slug = formData.slug.trim();
      if (formData.description && formData.description.trim()) dataToSend.description = formData.description.trim();
      if (formData.short_description && formData.short_description.trim()) dataToSend.short_description = formData.short_description.trim();
      
      if (formData.parent_subcategory_id) {
        dataToSend.sub_category_id = parseInt(formData.parent_subcategory_id);
      } else if (formData.sub_category_id) {
        dataToSend.sub_category_id = parseInt(formData.sub_category_id);
      }

      if (formData.cost_price) dataToSend.cost_price = parseFloat(formData.cost_price);
      if (formData.stock_quantity !== '') dataToSend.stock_quantity = parseInt(formData.stock_quantity) || 0;
      if (formData.stock_status) dataToSend.stock_status = formData.stock_status;
      if (formData.compare_at_price) dataToSend.compare_at_price = parseFloat(formData.compare_at_price);
      if (formData.meta_title) dataToSend.meta_title = formData.meta_title.trim();
      if (formData.meta_description) dataToSend.meta_description = formData.meta_description.trim();
      if (formData.meta_keywords) dataToSend.meta_keywords = formData.meta_keywords.trim();
      dataToSend.is_active = formData.is_active;
      dataToSend.is_featured = formData.is_featured;

      // Contact Lens specific fields
      if (formData.contact_lens_brand) dataToSend.contact_lens_brand = formData.contact_lens_brand.trim();
      if (formData.contact_lens_material) dataToSend.contact_lens_material = formData.contact_lens_material.trim();
      if (formData.contact_lens_color) dataToSend.contact_lens_color = formData.contact_lens_color.trim();
      if (formData.contact_lens_type) dataToSend.contact_lens_type = formData.contact_lens_type.trim();
      if (formData.replacement_frequency) dataToSend.replacement_frequency = formData.replacement_frequency.trim();
      if (formData.water_content) dataToSend.water_content = formData.water_content.trim();
      dataToSend.can_sleep_with = formData.can_sleep_with;
      dataToSend.is_medical_device = formData.is_medical_device;
      dataToSend.has_uv_filter = formData.has_uv_filter;

      let response;
      const hasImageFiles = imageFiles && imageFiles.length > 0;

      if (hasImageFiles) {
        const submitData = new FormData();
        Object.keys(dataToSend).forEach((key) => {
          const value = dataToSend[key];
          if (value === null || value === undefined || value === '') return;
          if (typeof value === 'boolean') {
            submitData.append(key, value.toString());
          } else if (typeof value === 'number') {
            submitData.append(key, value.toString());
          } else if (Array.isArray(value)) {
            submitData.append(key, JSON.stringify(value));
          } else {
            submitData.append(key, value);
          }
        });

        if (product) {
          const imagesToKeep = imagePreviews.filter(preview => 
            typeof preview === 'string' && 
            !preview.startsWith('blob:') && 
            !preview.startsWith('data:') &&
            existingImages.includes(preview)
          );
          submitData.append('images', JSON.stringify(imagesToKeep));
        }

        imageFiles.forEach((file) => {
          submitData.append('images', file);
        });

        if (product) {
          response = await api.put(API_ROUTES.ADMIN.PRODUCTS.UPDATE(product.id), submitData);
        } else {
          response = await api.post(API_ROUTES.ADMIN.PRODUCTS.CREATE, submitData);
        }
      } else {
        if (product) {
          const imagesToKeep = imagePreviews.filter(preview => 
            typeof preview === 'string' && 
            !preview.startsWith('blob:') && 
            !preview.startsWith('data:') &&
            existingImages.includes(preview)
          );
          dataToSend.images = imagesToKeep;
        }
        if (product) {
          response = await api.put(API_ROUTES.ADMIN.PRODUCTS.UPDATE(product.id), dataToSend);
        } else {
          response = await api.post(API_ROUTES.ADMIN.PRODUCTS.CREATE, dataToSend);
        }
      }

      toast.success(product ? 'Contact lens product updated successfully' : 'Contact lens product created successfully');
      setImageFiles([]);
      setImagePreviews([]);
      setExistingImages([]);
      onClose();
    } catch (error) {
      console.error('Product save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save product');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save product';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'contact-lens', label: 'Contact Lens' },
    { id: 'spherical', label: 'Spherical Configurations' },
    { id: 'astigmatism', label: 'Astigmatism Configurations' },
    { id: 'images', label: 'Images' },
    { id: 'seo', label: 'SEO' },
  ];

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200/50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {product ? 'Edit Contact Lens Product' : 'Add Contact Lens Product'}
          </h2>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-all duration-200"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white px-6 flex gap-1 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="p-6 space-y-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Slug</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="input-modern"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Compare At Price</label>
                    <input
                      type="number"
                      name="compare_at_price"
                      value={formData.compare_at_price}
                      onChange={handleChange}
                      step="0.01"
                      className="input-modern"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cost Price</label>
                    <input
                      type="number"
                      name="cost_price"
                      value={formData.cost_price}
                      onChange={handleChange}
                      step="0.01"
                      className="input-modern"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Short Description</label>
                  <input
                    type="text"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleChange}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="input-modern resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sub Category</label>
                    <select
                      name="sub_category_id"
                      value={formData.sub_category_id}
                      onChange={handleChange}
                      disabled={!formData.category_id}
                      className="input-modern disabled:bg-gray-100"
                    >
                      <option value="">Select Sub Category</option>
                      {subCategories.map((subCat) => (
                        <option key={subCat.id} value={subCat.id}>
                          {subCat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.sub_category_id && nestedSubCategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nested Sub Category</label>
                    <select
                      name="parent_subcategory_id"
                      value={formData.parent_subcategory_id}
                      onChange={handleChange}
                      className="input-modern"
                    >
                      <option value="">None (Top-level)</option>
                      {nestedSubCategories.map((nestedSubCat) => (
                        <option key={nestedSubCat.id} value={nestedSubCat.id}>
                          {nestedSubCat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity</label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Status</label>
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

                <div className="flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Featured</span>
                  </label>
                </div>
              </>
            )}

            {/* Contact Lens Tab */}
            {activeTab === 'contact-lens' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Brand/Producer</label>
                    <input
                      type="text"
                      name="contact_lens_brand"
                      value={formData.contact_lens_brand}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="e.g., Alcon"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Material</label>
                    <input
                      type="text"
                      name="contact_lens_material"
                      value={formData.contact_lens_material}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="e.g., Nelfilcon A"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Lens Color</label>
                    <input
                      type="text"
                      name="contact_lens_color"
                      value={formData.contact_lens_color}
                      onChange={handleChange}
                      className="input-modern"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Lens Type</label>
                    <input
                      type="text"
                      name="contact_lens_type"
                      value={formData.contact_lens_type}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="e.g., Sferica, Toric"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Replacement Frequency</label>
                    <input
                      type="text"
                      name="replacement_frequency"
                      value={formData.replacement_frequency}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="e.g., Giornaliera, Settimanale, Mensile"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Water Content (%)</label>
                    <input
                      type="text"
                      name="water_content"
                      value={formData.water_content}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="e.g., 58%"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="can_sleep_with"
                      checked={formData.can_sleep_with}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Can Sleep With</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_medical_device"
                      checked={formData.is_medical_device}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Medical Device</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="has_uv_filter"
                      checked={formData.has_uv_filter}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Has UV Filter</span>
                  </label>
                </div>
              </>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <>
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-4 mb-4">
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
                <label 
                  htmlFor="contact-lens-image-input"
                  className="flex flex-col items-center justify-center w-full min-h-[180px] border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                    <FiUpload className="w-8 h-8 text-indigo-600 mb-4" />
                    <p className="text-base font-semibold text-gray-700 mb-1">
                      {imagePreviews.length > 0 ? 'Add More Images' : 'Click to Upload Images'}
                    </p>
                    <p className="text-sm text-gray-600">PNG, JPG, JPEG, WEBP • Max 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="contact-lens-image-input"
                  />
                </label>
              </>
            )}

            {/* Spherical Configurations Tab */}
            {activeTab === 'spherical' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Spherical Configurations</h3>
                  <button
                    type="button"
                    onClick={handleSphericalAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Configuration
                  </button>
                </div>
                {loadingSpherical ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    {sphericalConfigs.length > 0 && (
                      <div className="mb-2 text-sm text-gray-600">
                        Found {sphericalConfigs.length} configuration{sphericalConfigs.length !== 1 ? 's' : ''}
                      </div>
                    )}
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Display Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sphericalConfigs.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                              No spherical configurations found. {product?.id ? 'Click "Add Configuration" to create one.' : 'Save the product first to add configurations.'}
                            </td>
                          </tr>
                        ) : (
                          sphericalConfigs.map((config) => (
                            <tr key={config.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{config.name || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{config.display_name || config.displayName || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">${config.price || 0}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${config.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {config.is_active !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSphericalEdit(config)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    <FiEdit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSphericalDelete(config.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {sphericalModalOpen && (
                  <SphericalConfigModal
                    config={selectedSphericalConfig || (product?.id ? { product_id: product.id } : null)}
                    onClose={handleContactLensFormClose('spherical')}
                  />
                )}
              </div>
            )}

            {/* Astigmatism Configurations Tab */}
            {activeTab === 'astigmatism' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Astigmatism Configurations</h3>
                  <button
                    type="button"
                    onClick={handleAstigmatismAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Configuration
                  </button>
                </div>
                {loadingAstigmatism ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    {astigmatismConfigs.length > 0 && (
                      <div className="mb-2 text-sm text-gray-600">
                        Found {astigmatismConfigs.length} configuration{astigmatismConfigs.length !== 1 ? 's' : ''}
                      </div>
                    )}
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Display Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {astigmatismConfigs.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                              No astigmatism configurations found. {product?.id ? 'Click "Add Configuration" to create one.' : 'Save the product first to add configurations.'}
                            </td>
                          </tr>
                        ) : (
                          astigmatismConfigs.map((config) => (
                            <tr key={config.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{config.name || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{config.display_name || config.displayName || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">${config.price || 0}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${config.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {config.is_active !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleAstigmatismEdit(config)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    <FiEdit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAstigmatismDelete(config.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {astigmatismModalOpen && (
                  <AstigmatismConfigModal
                    config={selectedAstigmatismConfig || (product?.id ? { product_id: product.id } : null)}
                    onClose={(saved = false) => {
                      setAstigmatismModalOpen(false);
                      setSelectedAstigmatismConfig(null);
                      // Always refresh data when modal closes
                      if (product?.id) {
                        console.log('🔄 Refreshing astigmatism configs after modal close');
                        fetchAstigmatismConfigs();
                      }
                    }}
                  />
                )}
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Title</label>
                  <input
                    type="text"
                    name="meta_title"
                    value={formData.meta_title}
                    onChange={handleChange}
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Description</label>
                  <textarea
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={handleChange}
                    rows="2"
                    className="input-modern resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Keywords</label>
                  <input
                    type="text"
                    name="meta_keywords"
                    value={formData.meta_keywords}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-white flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-modern disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ContactLensProductModal;

