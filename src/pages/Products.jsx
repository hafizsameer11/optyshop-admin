import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiImage } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ProductModal from '../components/ProductModal';
import ContactLensProductModal from '../components/ContactLensProductModal';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

// Helper function to validate hex code format (#RRGGBB)
const isValidHexCode = (hex) => {
  if (!hex || typeof hex !== 'string') return false;
  const hexPattern = /^#([A-Fa-f0-9]{6})$/;
  return hexPattern.test(hex.trim());
};

// Helper function to convert color name to hex code (for backward compatibility)
const getColorHex = (colorName) => {
  if (!colorName) return null;
  // Check if it's already a hex code
  if (isValidHexCode(colorName)) {
    return colorName.toUpperCase().trim();
  }
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

// Helper function to normalize image URLs
const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;
  
  // Skip test/example URLs that will cause CORS errors
  const testDomains = ['example.com', 'localhost', '127.0.0.1', 'test.com', 'placeholder.com'];
  try {
    const urlObj = new URL(trimmedUrl);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if it's a test domain
    if (testDomains.some(domain => hostname.includes(domain))) {
      console.warn(`Skipping test/example image URL: ${trimmedUrl}`);
      return null;
    }
    
    // Valid external URL - return as is
    return trimmedUrl;
  } catch (e) {
    // Not a valid absolute URL, might be relative
    if (trimmedUrl.startsWith('/')) {
      // Relative path - try to construct full URL using API base URL
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://optyshop-frontend.hmstech.org/api';
      // Remove /api suffix if present, then append the relative path
      const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
      return `${baseUrl}${trimmedUrl}`;
    }
    
    // Invalid URL format
    console.warn(`Invalid image URL format: ${trimmedUrl}`);
    return null;
  }
};

// Product Image Component with error handling
const ProductImage = ({ product, refreshKey }) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    // Reset error state when product or images change
    setImageError(false);
    setImageLoading(true);
    
    // Safety check for product
    if (!product) {
      setImageSrc(null);
      setImageLoading(false);
      return;
    }
    
    // Get the first available image - check multiple possible image fields
    // Priority: images array > image > image_url
    let imageUrl = null;
    
    // Check images array first (most common format from API)
    if (product.images) {
      if (Array.isArray(product.images) && product.images.length > 0) {
        // Get first non-empty image URL from array
        imageUrl = product.images.find(img => img && typeof img === 'string' && img.trim() !== '') || product.images[0];
      } else if (typeof product.images === 'string' && product.images.trim() !== '') {
        // Sometimes images might be a string instead of array
        imageUrl = product.images;
      }
    }
    
    // Fallback to image field
    if (!imageUrl && product.image && typeof product.image === 'string' && product.image.trim() !== '') {
      imageUrl = product.image;
    }
    
    // Fallback to image_url field
    if (!imageUrl && product.image_url && typeof product.image_url === 'string' && product.image_url.trim() !== '') {
      imageUrl = product.image_url;
    }
    
    // Normalize and validate the URL
    const normalizedUrl = normalizeImageUrl(imageUrl);
    
    if (normalizedUrl) {
      // Add cache-busting parameter to ensure fresh image loads after updates
      // Use refreshKey if provided, otherwise use timestamp
      const separator = normalizedUrl.includes('?') ? '&' : '?';
      const cacheBust = refreshKey || Date.now();
      const cacheBustUrl = `${normalizedUrl}${separator}_t=${cacheBust}`;
      setImageSrc(cacheBustUrl);
    } else {
      setImageSrc(null);
      setImageLoading(false);
      if (product.id && imageUrl) {
        console.warn(`⚠️ Product ${product.id} has invalid or test image URL: ${imageUrl}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, product?.images, product?.image, product?.image_url, refreshKey]);

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  // Handle image load error
  const handleImageError = (e) => {
    // Silently handle image errors - just show placeholder
    // Only log in development mode
    if (import.meta.env.DEV) {
      console.warn('Product image failed to load:', {
        imageSrc,
        productId: product?.id,
        productName: product?.name,
      });
    }
    
    setImageError(true);
    setImageLoading(false);
    // Hide the broken image
    if (e.target) {
      e.target.style.display = 'none';
    }
  };

  // If no image source or error, show placeholder
  if (!imageSrc || imageError) {
    return (
      <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
        <FiImage className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  // Show image with loading state and error fallback
  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      {imageLoading && !imageError && (
        <div className="absolute inset-0 bg-gray-200 rounded flex items-center justify-center z-10">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      )}
      {imageSrc && !imageError && (
        <img
          src={imageSrc}
          alt={product?.name || 'Product'}
          className={`w-10 h-10 rounded object-cover bg-gray-100 flex-shrink-0 transition-opacity duration-200 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          style={{ display: imageError ? 'none' : 'block' }}
        />
      )}
      {imageError && (
        <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
          <FiImage className="w-5 h-5 text-gray-400" />
        </div>
      )}
    </div>
  );
};

const Products = () => {
  const { t } = useI18n();
  
  // State persistence key
  const STORAGE_KEY = 'products_page_state';
  
  // Helper function to load state from localStorage
  const loadStateFromStorage = () => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        return {
          searchTerm: parsed.searchTerm || '',
          categoryFilter: parsed.categoryFilter || '',
          subCategoryFilter: parsed.subCategoryFilter || '',
          selectedSection: parsed.selectedSection || 'all',
          page: parsed.page || 1,
        };
      }
    } catch (error) {
      console.warn('Failed to load state from localStorage:', error);
    }
    return {
      searchTerm: '',
      categoryFilter: '',
      subCategoryFilter: '',
      selectedSection: 'all',
      page: 1,
    };
  };
  
  // Helper function to save state to localStorage
  const saveStateToStorage = (state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        searchTerm: state.searchTerm,
        categoryFilter: state.categoryFilter,
        subCategoryFilter: state.subCategoryFilter,
        selectedSection: state.selectedSection,
        page: state.page,
      }));
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  };
  
  // Load initial state from localStorage
  const initialState = loadStateFromStorage();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialState.searchTerm);
  const [categoryFilter, setCategoryFilter] = useState(initialState.categoryFilter);
  const [subCategoryFilter, setSubCategoryFilter] = useState(initialState.subCategoryFilter);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [page, setPage] = useState(initialState.page);
  const [totalPages, setTotalPages] = useState(1);
  const [subCategoriesMap, setSubCategoriesMap] = useState({});
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
  const [selectedSection, setSelectedSection] = useState(initialState.selectedSection); // 'all', 'sunglasses', 'eyeglasses', 'contact-lenses', 'eye-hygiene'
  const [sectionCategoryIds, setSectionCategoryIds] = useState([]); // All category IDs for the selected section
  const [sectionSubCategoryIds, setSectionSubCategoryIds] = useState([]); // All subcategory IDs (including nested) for the selected section
  // Track if this is the initial mount to prevent clearing restored subcategory filter
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Save state to localStorage whenever relevant state changes
  useEffect(() => {
    saveStateToStorage({
      searchTerm,
      categoryFilter,
      subCategoryFilter,
      selectedSection,
      page,
    });
  }, [searchTerm, categoryFilter, subCategoryFilter, selectedSection, page]);

  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
  }, []);
  
  // When categories are loaded and we have a restored categoryFilter, fetch subcategories
  useEffect(() => {
    if (categories.length > 0 && categoryFilter && isInitialMount) {
      fetchSubCategoriesForCategory(categoryFilter);
    }
  }, [categories.length, categoryFilter, isInitialMount]);

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm, categoryFilter, subCategoryFilter, selectedSection, sectionCategoryIds, sectionSubCategoryIds]);
  
  // Fetch subcategories when category filter changes
  useEffect(() => {
    if (categoryFilter) {
      fetchSubCategoriesForCategory(categoryFilter);
    } else {
      setSubCategories([]);
      // Only reset subcategory filter if category filter is being cleared (not on initial mount)
      if (!isInitialMount) {
        setSubCategoryFilter('');
      }
    }
    // After first render, mark that initial mount is complete
    if (isInitialMount) {
      setIsInitialMount(false);
    }
  }, [categoryFilter, isInitialMount]);

  const fetchCategories = async () => {
    try {
      const response = await api.get(API_ROUTES.ADMIN.CATEGORIES.LIST);
      const responseData = response.data?.data || response.data || {};
      const categoriesData = responseData.categories || responseData || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.warn('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const fetchSubCategoriesForCategory = async (categoryId) => {
    if (!categoryId) {
      setSubCategories([]);
      return;
    }
    try {
      const response = await api.get(API_ROUTES.SUBCATEGORIES.BY_CATEGORY(categoryId));
      const responseData = response.data?.data || response.data || {};
      const subCatData = responseData.subcategories || responseData || [];
      setSubCategories(Array.isArray(subCatData) ? subCatData : []);
    } catch (error) {
      console.warn('Failed to fetch subcategories for category:', error);
      setSubCategories([]);
    }
  };

  const fetchSubCategories = async () => {
    try {
      // Fetch all subcategories (including nested) to build a complete lookup map
      // This includes both top-level and nested subcategories
      const response = await api.get(API_ROUTES.ADMIN.SUBCATEGORIES.LIST);
      const responseData = response.data?.data || response.data || {};
      const subCatData = responseData.subcategories || responseData || [];
      
      if (Array.isArray(subCatData)) {
        // Create a map of subcategory ID to name and parent info for quick lookup
        const map = {};
        subCatData.forEach(subCat => {
          if (subCat.id) {
            const parentId = subCat.parent_id !== undefined ? subCat.parent_id : 
                           subCat.parentId || 
                           subCat.parent_subcategory_id || 
                           subCat.parentSubcategoryId;
            const parentName = subCat.parent?.name || 
                              (parentId && subCatData.find(p => p.id === parentId)?.name);
            
            // Build display name: if nested, show "Parent > Child" format
            let displayName = subCat.name || '';
            if (parentName && parentId) {
              displayName = `${parentName} > ${displayName}`;
            }
            
            map[subCat.id] = {
              name: subCat.name || '',
              displayName: displayName,
              parentId: parentId || null,
              parentName: parentName || null,
              isNested: parentId !== null && parentId !== undefined
            };
          }
        });
        setSubCategoriesMap(map);
        console.log(`📊 Loaded ${Object.keys(map).length} subcategories for product lookup (including nested)`);
      }
    } catch (error) {
      console.warn('Failed to fetch subcategories for lookup:', error);
      // Don't show error to user, just use IDs if names aren't available
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });
      
      // Trim search term and only send if not empty
      const trimmedSearch = searchTerm?.trim();
      if (trimmedSearch) {
        params.append('search', trimmedSearch);
      }
      
      // If a section is selected, use section category and subcategory IDs for filtering
      // This ensures products are filtered by both product_type (via endpoint) and category (via params)
      // IMPORTANT: Only show products that belong to the selected section's categories
      if (selectedSection !== 'all') {
        // If section categories are found, filter strictly by those categories
        if (sectionCategoryIds.length > 0) {
          // Add all category IDs for the section to ensure proper filtering
          sectionCategoryIds.forEach(catId => {
            params.append('category_id', catId);
          });
          
          // Add all subcategory IDs (including nested) for the section
          if (sectionSubCategoryIds.length > 0) {
            sectionSubCategoryIds.forEach(subCatId => {
              params.append('sub_category_id', subCatId);
            });
          }
        } else {
          // If no categories found for this section, we still want to show products
          // but the backend will filter by product_type only
          // Note: This handles edge cases where categories might not be set up yet
          console.warn(`⚠️ No categories found for section "${selectedSection}". Products will be filtered by product_type only.`);
        }
      } else if (selectedSection === 'all') {
        // Manual category filter if selected (per Postman collection: category_id query param)
        if (categoryFilter) {
          params.append('category_id', categoryFilter);
        }
        
        // Manual subcategory filter if selected (per Postman collection: sub_category_id query param)
        if (subCategoryFilter) {
          params.append('sub_category_id', subCategoryFilter);
        }
      }
      
      // Determine which endpoint to use based on selected section
      // Section endpoints automatically filter by product_type on the backend
      let endpoint;
      if (selectedSection === 'all') {
        endpoint = `${API_ROUTES.ADMIN.PRODUCTS.LIST}?${params.toString()}`;
      } else {
        // Map sections to their corresponding product types and endpoints
        const sectionConfig = {
          'sunglasses': {
            endpoint: API_ROUTES.ADMIN.PRODUCTS.SECTION.SUNGLASSES,
            productType: 'sunglasses'
          },
          'eyeglasses': {
            endpoint: API_ROUTES.ADMIN.PRODUCTS.SECTION.EYEGLASSES,
            productType: 'frame'
          },
          'opty-kids': {
            endpoint: API_ROUTES.ADMIN.PRODUCTS.SECTION.EYEGLASSES,
            productType: 'opty-kids' // Try opty-kids product type first, fallback to frame if needed
          },
          'contact-lenses': {
            endpoint: API_ROUTES.ADMIN.PRODUCTS.SECTION.CONTACT_LENSES,
            productType: 'contact_lens'
          },
          'eye-hygiene': {
            endpoint: API_ROUTES.ADMIN.PRODUCTS.SECTION.EYE_HYGIENE,
            productType: 'accessory' // Backend uses 'accessory' for eye hygiene products
          },
        };
        
        const config = sectionConfig[selectedSection];
        if (config) {
          // Always add product_type to params to ensure proper filtering
          // This works with both section-specific endpoints and general endpoint
          if (!params.has('product_type')) {
            params.append('product_type', config.productType);
          }
          
          // For Opty Kids, always use general endpoint with category filtering
          // since it might share product_type with eyeglasses
          if (selectedSection === 'opty-kids') {
            // Use general products endpoint to ensure category filtering works
            endpoint = `${API_ROUTES.ADMIN.PRODUCTS.LIST}?${params.toString()}`;
            console.log(`🔍 Fetching Opty Kids products with category filtering:`, {
              endpoint,
              categoryIds: sectionCategoryIds,
              subCategoryIds: sectionSubCategoryIds,
              productType: config.productType,
              params: params.toString()
            });
          } else {
            // For other sections, use section-specific endpoint (which filters by product_type)
            // Category IDs are already in params, so they'll be included if available
            endpoint = `${config.endpoint}?${params.toString()}`;
            console.log(`🔍 Fetching products for section: ${selectedSection}`, {
              endpoint,
              productType: config.productType,
              categoryIds: sectionCategoryIds.length > 0 ? sectionCategoryIds : 'none',
              params: params.toString()
            });
          }
        } else {
          // Fallback to general products endpoint
          endpoint = `${API_ROUTES.ADMIN.PRODUCTS.LIST}?${params.toString()}`;
        }
      }
      
      const response = await api.get(endpoint);
      
      // Handle the nested data structure from the API
      // Response structure: { success, message, data: { products: [], pagination: {} } }
      const responseData = response.data?.data || response.data || {};
      const productsData = responseData.products || responseData || [];
      
      // Log products count for debugging
      const productsArray = Array.isArray(productsData) ? productsData : [];
      console.log(`✅ Fetched ${productsArray.length} products for section: ${selectedSection}`, {
        section: selectedSection,
        count: productsArray.length,
        categoryIds: selectedSection !== 'all' ? sectionCategoryIds : 'all categories',
        subCategoryIds: selectedSection !== 'all' ? sectionSubCategoryIds.length : 0,
        sampleProduct: productsArray.length > 0 ? {
          id: productsArray[0].id,
          name: productsArray[0].name,
          category_id: productsArray[0].category_id,
          product_type: productsArray[0].product_type
        } : null
      });
      
      // Log a summary of category filtering
      if (selectedSection !== 'all' && sectionCategoryIds.length > 0) {
        console.log(`📋 Filtering by categories:`, sectionCategoryIds.map(id => {
          const cat = categories.find(c => c.id === id);
          return cat ? `${cat.name} (ID: ${id})` : `ID: ${id}`;
        }));
      }
      
      // Extract pagination info
      const pagination = responseData.pagination || {};
      const pages = pagination.pages || pagination.totalPages || 1;
      
      setProducts(productsArray);
      setTotalPages(pages);
      // Update refresh key to force image reload after product list update
      setImageRefreshKey(Date.now());
    } catch (error) {
      console.error('Products API error:', error);
      setProducts([]);
      setTotalPages(1);
      
      // Show error message for network/API errors (but not for demo mode)
      const isDemoMode = localStorage.getItem('demo_user') !== null;
      if (!isDemoMode) {
        if (!error.response) {
          toast.error('Failed to load products: Network error. Please check your connection.');
        } else if (error.response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else if (error.response.status === 500) {
          // Handle backend/database errors
          const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Server error';
          const errorDetails = error.response?.data?.details || '';
          
          // Check for common database/relation errors related to size/volume variants
          if (errorMessage.toLowerCase().includes('prisma') || 
              errorMessage.toLowerCase().includes('database') ||
              errorMessage.toLowerCase().includes('relation') ||
              errorMessage.toLowerCase().includes('sizevolume') ||
              errorMessage.toLowerCase().includes('size_volume')) {
            toast.error(
              'Database error: The Size/Volume Variants feature may require a database migration. Please contact support or check backend logs.',
              { duration: 6000 }
            );
            console.error('Database/Relation Error Details:', {
              message: errorMessage,
              details: errorDetails,
              fullError: error.response?.data
            });
          } else {
            toast.error(`Failed to load products: ${errorMessage}`);
            console.error('Server Error Details:', error.response?.data);
          }
        } else {
          toast.error(`Failed to load products: ${error.response?.data?.message || error.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(API_ROUTES.ADMIN.PRODUCTS.DELETE(id));
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Product delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete product');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to delete products');
      } else {
        toast.error('Failed to delete product');
      }
    }
  };

  const handleEdit = (product) => {
    console.log('📝 Editing product:', {
      id: product.id,
      name: product.name,
      product_type: product.product_type,
      category_id: product.category_id,
      category_name: product.category?.name || product.category_name
    });
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  // Determine which modal to use based on product's actual product_type when editing,
  // or based on selected section when creating a new product
  const getProductModal = () => {
    // Helper function to infer product_type from category name
    const inferProductTypeFromCategory = (categoryName, categoryId) => {
      let resolvedCategoryName = categoryName;
      
      if (!resolvedCategoryName && categoryId) {
        // Try to find category by ID
        const category = categories.find(cat => cat.id === categoryId);
        if (category) {
          resolvedCategoryName = category.name || '';
        }
      }
      
      if (!resolvedCategoryName) return null;
      
      const categoryLower = resolvedCategoryName.toLowerCase().trim();
      
      // Map category names to product types
      // Note: Backend only accepts: frame, sunglasses, contact_lens, accessory
      if (categoryLower.includes('contact') && categoryLower.includes('lens')) {
        return 'contact_lens';
      }
      if (categoryLower.includes('eye') && categoryLower.includes('hygiene')) {
        // Eye hygiene products use 'accessory' as product_type for backend
        // but we track it internally as 'eye_hygiene' for UI purposes
        return 'accessory';
      }
      if (categoryLower.includes('sun') && (categoryLower.includes('glass') || categoryLower.includes('sunglass'))) {
        return 'sunglasses';
      }
      if (categoryLower.includes('eye') && categoryLower.includes('glass')) {
        return 'frame';
      }
      if (categoryLower.includes('opty') && categoryLower.includes('kids')) {
        return 'frame'; // Opty Kids uses frame product type
      }
      
      return null;
    };

    // Helper function to normalize product_type for comparison
    const normalizeProductType = (productType) => {
      if (!productType) return null;
      // Convert to lowercase and replace spaces/underscores/dashes with underscore
      return String(productType).toLowerCase().trim().replace(/[\s-]/g, '_');
    };

    // Helper function to check if product type matches a specific type (handles variations)
    const isProductType = (productType, targetType) => {
      const normalized = normalizeProductType(productType);
      const normalizedTarget = normalizeProductType(targetType);
      return normalized === normalizedTarget;
    };

    // When editing a product, determine modal based on the product's actual product_type
    if (editingProduct) {
      let productType = editingProduct.product_type;
      let productToPass = editingProduct;
      
      console.log('🔍 Raw product_type from editingProduct:', productType);
      console.log('🔍 Full editingProduct:', editingProduct);
      
      // Always check category to ensure we have the correct product type
      // Category is more reliable than product_type field which might be missing or incorrect
      const categoryName = editingProduct.category?.name || editingProduct.category_name;
      const categoryId = editingProduct.category_id || editingProduct.categoryId;
      const inferredType = inferProductTypeFromCategory(categoryName, categoryId);
      
      // Check if this is an eye hygiene product by category (category contains "eye hygiene")
      const categoryLower = (categoryName || '').toLowerCase().trim();
      const isEyeHygieneCategory = categoryLower.includes('eye') && categoryLower.includes('hygiene');
      
      console.log('🔍 Category info:', { categoryName, categoryId, inferredType, isEyeHygieneCategory });
      
      // Use inferred type if product_type is missing or doesn't match category
      if (inferredType) {
        const normalizedInferred = normalizeProductType(inferredType);
        const normalizedCurrent = normalizeProductType(productType);
        
        // If no product_type or if it doesn't match category, use inferred type
        if (!productType || (normalizedInferred !== normalizedCurrent && normalizedInferred)) {
          productType = inferredType;
          productToPass = { ...editingProduct, product_type: inferredType };
          console.log(`🔍 Using inferred product_type "${inferredType}" from category "${categoryName}" for product ${editingProduct.id}`);
        }
      }
      
      // Normalize product type for consistent comparison
      const normalizedProductType = normalizeProductType(productType);
      console.log('🔍 Final normalized product_type:', normalizedProductType);
      
      // Use ContactLensProductModal for contact lens products (handle variations like "contact lera", "contact_lens", etc.)
      const isContactLens = 
        isProductType(productType, 'contact_lens') || 
        normalizedProductType === 'contactlera' ||
        normalizedProductType === 'contact_lera' ||
        (normalizedProductType?.includes('contact') && normalizedProductType?.includes('lens')) ||
        (normalizedProductType?.includes('contact') && normalizedProductType?.includes('lera')) ||
        (inferredType === 'contact_lens');
      
      if (isContactLens) {
        console.log('✅ Opening ContactLensProductModal for contact lens product');
        // Ensure product_type is set correctly for the modal
        productToPass = { ...editingProduct, product_type: 'contact_lens' };
        return (
          <ContactLensProductModal
            product={productToPass}
            onClose={handleModalClose}
            selectedSection={selectedSection}
          />
        );
      }
      
      // For eye hygiene products (identified by category), use ProductModal with 'accessory' product_type
      // but pass category info so it shows the Size/Volume Variants tab
      if (isEyeHygieneCategory) {
        console.log('✅ Opening ProductModal for Eye Hygiene product (using accessory product_type)');
        // Use 'accessory' as product_type for backend, but include a flag for UI
        productToPass = { 
          ...editingProduct, 
          product_type: 'accessory',
          _isEyeHygiene: true, // Internal flag for UI purposes
          category_id: categoryId,
          category: editingProduct.category || { name: categoryName, id: categoryId }
        };
        return (
          <ProductModal
            product={productToPass}
            onClose={handleModalClose}
          />
        );
      }
      
      // For all other product types (sunglasses, frame, etc.), use ProductModal
      // ProductModal will automatically show the appropriate tabs based on product_type
      console.log(`✅ Opening ProductModal for product type: ${productType || 'default'} (normalized: ${normalizedProductType})`);
      // Ensure product_type is set correctly before passing to ProductModal
      if (!productToPass.product_type || productToPass.product_type !== productType) {
        productToPass = { ...editingProduct, product_type: productType || normalizedProductType || 'frame' };
      }
      return (
        <ProductModal
          product={productToPass}
          onClose={handleModalClose}
        />
      );
    }
    
    // When creating a new product, use selectedSection to determine default product type
    const productTypeMap = {
      'sunglasses': 'sunglasses',
      'eyeglasses': 'frame',
      'opty-kids': 'frame', // Opty Kids uses same product type as eyeglasses
      'eye-hygiene': 'accessory', // Backend uses 'accessory' for eye hygiene products
      'contact-lenses': 'contact_lens',
      'all': null // Will use default product type
    };
    
    const defaultProductType = productTypeMap[selectedSection];
    
    // If creating contact lens product, use ContactLensProductModal
    if (selectedSection === 'contact-lenses') {
      return (
        <ContactLensProductModal
          product={defaultProductType ? { product_type: defaultProductType } : null}
          onClose={handleModalClose}
          selectedSection={selectedSection}
        />
      );
    }
    
    // For other product types, use ProductModal with default product type
    return (
      <ProductModal
        product={defaultProductType ? { product_type: defaultProductType } : null}
        onClose={handleModalClose}
      />
    );
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingProduct(null);
    // Refresh products list immediately to reflect changes (new products, updates, removed images, etc.)
    // Flow: User saves product → Backend saves product with category_id → 
    //       Modal closes → We fetch updated products → Table shows updated data
    // Note: New products will appear in:
    //       1. "All Products" section (always shows all products)
    //       2. Their specific category section (filtered by category_id)
    // The backend has already processed the save, so we can refresh right away
    fetchProducts();
    // Force image refresh by updating the refresh key to ensure removed images disappear from table
    // This cache-busts the ProductImage component so it loads fresh images
    setImageRefreshKey(Date.now());
  };

  // Section options
  const sections = [
    { value: 'all', label: 'All Products', icon: '📦' },
    { value: 'sunglasses', label: 'Sunglasses', icon: '🕶️' },
    { value: 'eyeglasses', label: 'Eyeglasses', icon: '👓' },
    { value: 'opty-kids', label: 'Opty Kids', icon: '👶' },
    { value: 'contact-lenses', label: 'Contact Lenses', icon: '🔍' },
    { value: 'eye-hygiene', label: 'Eye Hygiene', icon: '💧' },
  ];

  // Map section names to exact category names/slugs (case-insensitive matching)
  // Based on actual categories in the system:
  // - "opty kids" (exact match)
  // - "sun glasses" (exact match - two words)
  // - "contact-lenses" (exact match - with hyphen)
  // - "eye glasses" (exact match - two words)
  // - "eye hygiene" (exact match)
  const sectionToCategoryMap = {
    'sunglasses': ['sun glasses', 'sunglasses', 'sun-glasses', 'sunglass', 'sun glasses'],
    'eyeglasses': ['eye glasses', 'eyeglasses', 'eye-glasses', 'eyeglass', 'eye glasses'],
    'opty-kids': ['opty kids', 'opty-kids', 'optykids', 'opty kids'],
    'contact-lenses': ['contact-lenses', 'contact lenses', 'contactlenses', 'contact-lenses'],
    'eye-hygiene': ['eye hygiene', 'eye-hygiene', 'eyehygiene', 'eye hygiene'],
  };

  // Find categories matching the section
  // This function finds all categories that match a given section (e.g., "Sunglasses", "Eyeglasses")
  // Products are then filtered by these category IDs to show only relevant products
  // Categories in system: "opty kids", "sun glasses", "contact-lenses", "eye glasses", "eye hygiene"
  const findCategoriesForSection = (section) => {
    if (section === 'all') {
      return [];
    }
    
    const patterns = sectionToCategoryMap[section] || [];
    const matchingCategories = categories.filter(cat => {
      const catName = (cat.name || '').toLowerCase().trim();
      const catSlug = (cat.slug || '').toLowerCase().trim();
      
      // First, try exact matches (most specific)
      const exactNameMatch = patterns.some(pattern => catName === pattern.toLowerCase());
      const exactSlugMatch = patterns.some(pattern => catSlug === pattern.toLowerCase());
      
      // Then, try partial matches (for variations)
      const partialNameMatch = patterns.some(pattern => {
        const patternLower = pattern.toLowerCase();
        return catName === patternLower || catName.includes(patternLower) || patternLower.includes(catName);
      });
      const partialSlugMatch = patterns.some(pattern => {
        const patternLower = pattern.toLowerCase();
        return catSlug === patternLower || catSlug.includes(patternLower) || patternLower.includes(catSlug);
      });
      
      const matchesName = exactNameMatch || partialNameMatch;
      const matchesSlug = exactSlugMatch || partialSlugMatch;
      
      // Special handling: Eyeglasses should exclude Opty Kids categories
      // "eye glasses" should NOT match "opty kids"
      if (section === 'eyeglasses') {
        const isOptyKids = catName === 'opty kids' || catName.includes('opty kids') || 
                          catSlug === 'opty-kids' || catSlug.includes('opty-kids') ||
                          catName.includes('opty') && catName.includes('kids') ||
                          catSlug.includes('opty') && catSlug.includes('kids');
        return (matchesName || matchesSlug) && !isOptyKids;
      }
      
      // Special handling: Opty Kids should only match "opty kids" categories
      // Must contain both "opty" and "kids"
      if (section === 'opty-kids') {
        const isOptyKids = catName === 'opty kids' || catName.includes('opty kids') ||
                          catSlug === 'opty-kids' || catSlug.includes('opty-kids') ||
                          (catName.includes('opty') && catName.includes('kids')) ||
                          (catSlug.includes('opty') && catSlug.includes('kids'));
        return isOptyKids;
      }
      
      // For other sections, return if name or slug matches
      return matchesName || matchesSlug;
    });
    
    console.log(`🔍 Found ${matchingCategories.length} categories for section "${section}":`, 
      matchingCategories.map(cat => ({ id: cat.id, name: cat.name, slug: cat.slug }))
    );
    
    // Return array of category IDs - these will be used to filter products
    return matchingCategories.map(cat => cat.id);
  };

  // Update section category and subcategory IDs when section or categories change
  useEffect(() => {
    let isMounted = true;
    
    const updateSectionData = async () => {
      if (selectedSection === 'all') {
        if (isMounted) {
          setSectionCategoryIds([]);
          setSectionSubCategoryIds([]);
        }
        return;
      }
      
      if (categories.length === 0) {
        if (isMounted) {
          setSectionCategoryIds([]);
          setSectionSubCategoryIds([]);
        }
        return;
      }
      
      const categoryIds = findCategoriesForSection(selectedSection);
      
      if (isMounted) {
        setSectionCategoryIds(categoryIds);
      }
      
      if (categoryIds.length === 0) {
        if (isMounted) {
          setSectionSubCategoryIds([]);
        }
        return;
      }
      
      // Fetch all subcategories (including nested) for given category IDs
      try {
        // Fetch subcategories for each category
        const subCategoryPromises = categoryIds.map(async (categoryId) => {
          try {
            return api.get(API_ROUTES.SUBCATEGORIES.BY_CATEGORY(categoryId));
          } catch (error) {
            console.warn(`Failed to fetch subcategories for category ${categoryId}:`, error);
            return { data: { data: { subcategories: [] } } };
          }
        });

        const responses = await Promise.all(subCategoryPromises);
        const subCategoryArrays = responses.map(response => {
          const responseData = response.data?.data || response.data || {};
          const subCatData = responseData.subcategories || responseData || [];
          return Array.isArray(subCatData) ? subCatData : [];
        });
        
        const allSubCategories = subCategoryArrays.flat();
        
        // Get all top-level subcategory IDs
        const subCategoryIds = allSubCategories.map(subCat => subCat.id).filter(Boolean);
        
        // Also find nested subcategories (sub-subcategories) for each subcategory
        const nestedSubCategoryIds = [];
        for (const subCat of allSubCategories) {
          if (subCat.id) {
            // Check if this subcategory has children in our subCategoriesMap
            Object.entries(subCategoriesMap).forEach(([id, mappedSubCat]) => {
              if (mappedSubCat.parentId === subCat.id) {
                nestedSubCategoryIds.push(parseInt(id));
              }
            });
            
            // Also try to fetch nested subcategories from API
            try {
              const nestedResponse = await api.get(API_ROUTES.ADMIN.SUBCATEGORIES.BY_PARENT(subCat.id));
              const nestedData = nestedResponse.data?.data || nestedResponse.data || {};
              const nestedSubCats = nestedData.subcategories || nestedData || [];
              if (Array.isArray(nestedSubCats)) {
                nestedSubCats.forEach(nested => {
                  if (nested.id) nestedSubCategoryIds.push(nested.id);
                });
              }
            } catch (error) {
              // Ignore errors for nested subcategories
            }
          }
        }
        
        // Combine all subcategory IDs (top-level and nested)
        const allIds = [...subCategoryIds, ...nestedSubCategoryIds];
        const uniqueIds = [...new Set(allIds)];
        
        if (isMounted) {
          setSectionSubCategoryIds(uniqueIds);
          console.log(`📋 Found ${uniqueIds.length} subcategories (including nested) for categories:`, {
            categoryIds,
            subCategoryIds: uniqueIds.length
          });
        }
      } catch (error) {
        console.error('Failed to fetch subcategories for section:', error);
        if (isMounted) {
          setSectionSubCategoryIds([]);
        }
      }
    };
    
    updateSectionData();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection, categories.length]); // Only depend on selectedSection and categories.length

  // Early return must be AFTER all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  const handleSectionChange = (section) => {
    console.log(`🔄 User clicked category button: "${section}"`);
    console.log(`📦 Current section: ${selectedSection} → New section: ${section}`);
    
    // Update selected section
    setSelectedSection(section);
    
    // Reset to first page when section changes
    setPage(1);
    
    // Clear category and subcategory filters when changing sections
    // This ensures that when a section is selected, we show ALL products belonging to that section's categories
    setCategoryFilter('');
    setSubCategoryFilter('');
    
    // Note: searchTerm is kept so users can still search within the selected section
    // fetchProducts will be called automatically via useEffect when selectedSection changes
    // 
    // When a category button is clicked, products will be filtered by:
    // 1. Section's category IDs (sectionCategoryIds) - finds matching categories like "sun glasses", "eye glasses", etc.
    // 2. Section's subcategory IDs (sectionSubCategoryIds) - includes nested subcategories for those categories
    // 3. Product type (via endpoint) - backend automatically filters by product_type ('sunglasses', 'frame', 'contact_lens', 'eye_hygiene')
    // 
    // This ensures ONLY products from the selected category section are displayed
    
    if (section === 'all') {
      console.log(`✅ Showing ALL products (no category filter)`);
    } else {
      const sectionLabel = sections.find(s => s.value === section)?.label || section;
      console.log(`✅ Filtering products for "${sectionLabel}" category section`);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Enhanced Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">{t('products')}</h1>
          <p className="page-subtitle">Manage your product inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="compact" />
          {/* Only show Add Product button when a specific section is selected (not "All Products") */}
          {selectedSection !== 'all' && (
            <button
              onClick={handleAdd}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 font-semibold text-sm sm:text-base w-full sm:w-auto"
            >
              <FiPlus className="w-5 h-5" />
              <span>{t('addProduct')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {sections.map((section) => (
              <button
                key={section.value}
                onClick={() => handleSectionChange(section.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  selectedSection === section.value
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-base">{section.icon}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Contact Lens Forms are now integrated into the Contact Lens Product Modal */}
        {/* Configurations (Spherical, Astigmatism, Dropdown Values) are available as tabs in the product form */}

        {/* Lens Management is now integrated into the Product Modal */}
        {/* Configurations are available as tabs in the product form for Sunglasses, Eyeglasses, and Opty Kids */}
      </div>

      {/* Enhanced Search and Table Card - Responsive */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
        {/* Search and Filters Bar */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder={t('searchProducts')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
                className="input-modern pl-10 sm:pl-12 w-full"
              />
            </div>
            
            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setSubCategoryFilter(''); // Reset subcategory when category changes
                  setPage(1); // Reset to first page on filter change
                }}
                className="input-modern w-full"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* SubCategory Filter */}
            <div>
              <select
                value={subCategoryFilter}
                onChange={(e) => {
                  setSubCategoryFilter(e.target.value);
                  setPage(1); // Reset to first page on filter change
                }}
                disabled={!categoryFilter}
                className="input-modern w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All SubCategories</option>
                {subCategories.map((subCat) => (
                  <option key={subCat.id} value={subCat.id}>
                    {subCat.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Clear Filters Button */}
            {(categoryFilter || subCategoryFilter || searchTerm || selectedSection !== 'all') && (
              <div>
                <button
                  onClick={() => {
                    setCategoryFilter('');
                    setSubCategoryFilter('');
                    setSearchTerm('');
                    setSelectedSection('all');
                    setPage(1);
                    // Clear saved state from localStorage
                    try {
                      localStorage.removeItem(STORAGE_KEY);
                    } catch (error) {
                      console.warn('Failed to clear state from localStorage:', error);
                    }
                  }}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th className="table-header-responsive font-semibold text-gray-700 uppercase tracking-wider text-xs">
                  ID
                </th>
                <th className="table-header-responsive font-semibold text-gray-700 uppercase tracking-wider text-xs">
                  Product
                </th>
                <th className="table-header-responsive font-semibold text-gray-700 uppercase tracking-wider text-xs hidden md:table-cell">
                  SKU
                </th>
                <th className="table-header-responsive font-semibold text-gray-700 uppercase tracking-wider text-xs hidden lg:table-cell">
                  Category
                </th>
                <th className="table-header-responsive font-semibold text-gray-700 uppercase tracking-wider text-xs hidden lg:table-cell">
                  SubCategory
                </th>
                <th className="table-header-responsive font-semibold text-gray-700 uppercase tracking-wider text-xs hidden md:table-cell">
                  Color
                </th>
                <th className="table-header-responsive font-semibold text-gray-700 uppercase tracking-wider text-xs">
                  Price
                </th>
                <th className="table-header-responsive font-semibold text-gray-700 uppercase tracking-wider text-xs hidden sm:table-cell">
                  Stock
                </th>
                <th className="table-header-responsive font-semibold text-gray-700 uppercase tracking-wider text-xs">
                  Status
                </th>
                <th className="table-header-responsive font-semibold text-gray-700 uppercase tracking-wider text-xs hidden md:table-cell">
                  Product Type
                </th>
                <th className="table-header-responsive font-semibold text-gray-700 uppercase tracking-wider text-xs hidden xl:table-cell">
                  Type
                </th>
                <th className="table-header-responsive font-semibold text-gray-700 uppercase tracking-wider text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="12" className="table-cell-responsive text-center">
                    <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <FiSearch className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-700 font-semibold text-base sm:text-lg">No products found</p>
                      <p className="text-gray-500 text-sm mt-1">
                        {searchTerm ? 'Try a different search term.' : 'Get started by adding your first product.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr 
                    key={product.id} 
                    className="hover:bg-gray-50/50 transition-all duration-200 group border-b border-gray-100"
                  >
                    <td className="table-cell-responsive text-sm text-gray-500 font-medium">
                      {product.id}
                    </td>
                    <td className="table-cell-responsive">
                      <div className="flex items-center min-w-0">
                        <ProductImage product={product} refreshKey={imageRefreshKey} />
                        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                          <div className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                            {product.name}
                          </div>
                          {product.slug && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">{product.slug}</div>
                          )}
                          {/* Show SKU on mobile */}
                          <div className="md:hidden text-xs text-gray-400 mt-1">
                            SKU: {product.sku ? String(product.sku) : '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell-responsive text-sm text-gray-500 hidden md:table-cell">
                      {product.sku ? String(product.sku) : '-'}
                    </td>
                    <td className="table-cell-responsive text-sm text-gray-500 hidden lg:table-cell">
                      {product.category_id ? String(product.category_id) : '-'}
                      {product.category?.name && (
                        <div className="text-xs text-gray-400 mt-1">{product.category.name}</div>
                      )}
                    </td>
                    <td className="table-cell-responsive text-sm text-gray-500 hidden lg:table-cell">
                      {(() => {
                        const subCatId = product.sub_category_id || product.subcategory_id || product.subCategoryId;
                        if (!subCatId) return '-';
                        
                        // Try to get subcategory info from product object first
                        const subCatFromProduct = product.subcategory || 
                                                 product.sub_category || 
                                                 product.SubCategory ||
                                                 product.subCategory;
                        
                        // Then try lookup map
                        const subCatInfo = subCategoriesMap[subCatId];
                        
                        // Build display: show nested hierarchy if available
                        let displayName = subCatFromProduct?.name || 
                                        subCatInfo?.displayName || 
                                        subCatInfo?.name || 
                                        subCatId;
                        
                        const isNested = subCatInfo?.isNested || 
                                        subCatFromProduct?.parent_id !== null && subCatFromProduct?.parent_id !== undefined;
                        
                        return (
                          <>
                            <div className={isNested ? 'text-indigo-600 font-medium' : ''}>
                              {displayName}
                            </div>
                            {isNested && subCatInfo?.parentName && (
                              <div className="text-xs text-gray-400 mt-1">
                                Nested under: {subCatInfo.parentName}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-0.5">
                              ID: {String(subCatId)}
                            </div>
                          </>
                        );
                      })()}
                    </td>
                    <td className="table-cell-responsive text-sm text-gray-500 hidden md:table-cell">
                      {product.frame_color ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="capitalize font-medium">{product.frame_color}</span>
                            <div 
                              className="w-5 h-5 rounded border border-gray-300 shadow-sm"
                              style={{ 
                                backgroundColor: getColorHex(product.frame_color) || '#000000'
                              }}
                              title={product.frame_color}
                            />
                          </div>
                          {/* Show if product has color-specific images with hex codes */}
                          {product.color_images && typeof product.color_images === 'object' && Object.keys(product.color_images).length > 0 && (
                            <div className="flex flex-col gap-1">
                              <div className="text-xs text-indigo-600 font-medium">
                                {Object.keys(product.color_images).length} color variant{Object.keys(product.color_images).length !== 1 ? 's' : ''}
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {Object.keys(product.color_images).slice(0, 5).map((colorKey) => {
                                  const hexCode = isValidHexCode(colorKey) ? colorKey : getColorHex(colorKey);
                                  const colorName = isValidHexCode(colorKey) ? getColorNameFromHex(colorKey) : colorKey;
                                  if (!hexCode) return null;
                                  return (
                                    <div
                                      key={colorKey}
                                      className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs"
                                      title={`${colorName} (${hexCode})`}
                                    >
                                      <div 
                                        className="w-3 h-3 rounded border border-gray-300"
                                        style={{ backgroundColor: hexCode }}
                                      />
                                      <span className="text-gray-600">{hexCode}</span>
                                    </div>
                                  );
                                })}
                                {Object.keys(product.color_images).length > 5 && (
                                  <span className="text-xs text-gray-500">+{Object.keys(product.color_images).length - 5} more</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-gray-400">-</span>
                          {/* Show color images even if no frame_color */}
                          {product.color_images && typeof product.color_images === 'object' && Object.keys(product.color_images).length > 0 && (
                            <div className="flex flex-col gap-1">
                              <div className="text-xs text-indigo-600 font-medium">
                                {Object.keys(product.color_images).length} color variant{Object.keys(product.color_images).length !== 1 ? 's' : ''}
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {Object.keys(product.color_images).slice(0, 5).map((colorKey) => {
                                  const hexCode = isValidHexCode(colorKey) ? colorKey : getColorHex(colorKey);
                                  const colorName = isValidHexCode(colorKey) ? getColorNameFromHex(colorKey) : colorKey;
                                  if (!hexCode) return null;
                                  return (
                                    <div
                                      key={colorKey}
                                      className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs"
                                      title={`${colorName} (${hexCode})`}
                                    >
                                      <div 
                                        className="w-3 h-3 rounded border border-gray-300"
                                        style={{ backgroundColor: hexCode }}
                                      />
                                      <span className="text-gray-600">{hexCode}</span>
                                    </div>
                                  );
                                })}
                                {Object.keys(product.color_images).length > 5 && (
                                  <span className="text-xs text-gray-500">+{Object.keys(product.color_images).length - 5} more</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="table-cell-responsive text-sm sm:text-base font-semibold text-gray-900">
                      ${product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
                      {product.compare_at_price && (
                        <div className="text-xs text-gray-400 line-through mt-0.5">
                          ${parseFloat(product.compare_at_price).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="table-cell-responsive text-sm text-gray-500 hidden sm:table-cell">
                      <div className="font-semibold">{product.stock_quantity !== null && product.stock_quantity !== undefined ? Number(product.stock_quantity) : 0}</div>
                      {product.stock_status && (
                        <div className={`text-xs mt-1 ${
                          product.stock_status === 'in_stock' ? 'text-green-600' : 
                          product.stock_status === 'out_of_stock' ? 'text-red-600' : 
                          'text-yellow-600'
                        }`}>
                          {String(product.stock_status).replace(/_/g, ' ')}
                        </div>
                      )}
                    </td>
                    <td className="table-cell-responsive">
                      <div className="flex flex-col gap-1.5">
                        {product.is_active ? (
                          <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg bg-green-50 text-green-700 border border-green-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-50 text-gray-600 border border-gray-200">
                            Inactive
                          </span>
                        )}
                        {product.is_featured && (
                          <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell-responsive text-sm text-gray-500 hidden md:table-cell">
                      {product.product_type ? (
                        <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                          {String(product.product_type).replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="table-cell-responsive text-sm text-gray-500 hidden xl:table-cell">
                      {product.product_type ? String(product.product_type) : '-'}
                    </td>
                    <td className="table-cell-responsive">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 rounded-xl text-indigo-600 hover:text-white hover:bg-indigo-500 transition-all duration-200"
                          title="Edit"
                          aria-label="Edit product"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 rounded-xl text-red-600 hover:text-white hover:bg-red-500 transition-all duration-200"
                          title="Delete"
                          aria-label="Delete product"
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

        {/* Pagination - Responsive */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600 font-medium">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {modalOpen && getProductModal()}
    </div>
  );
};

export default Products;



