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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [subCategoriesMap, setSubCategoriesMap] = useState({});
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
  const [selectedSection, setSelectedSection] = useState('all'); // 'all', 'sunglasses', 'eyeglasses', 'contact-lenses', 'eye-hygiene'

  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm, categoryFilter, subCategoryFilter, selectedSection]);

  // Fetch subcategories when category filter changes
  useEffect(() => {
    if (categoryFilter) {
      fetchSubCategoriesForCategory(categoryFilter);
    } else {
      setSubCategories([]);
      setSubCategoryFilter('');
    }
  }, [categoryFilter]);

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
      
      // Add category filter if selected (per Postman collection: category_id query param)
      if (categoryFilter) {
        params.append('category_id', categoryFilter);
      }
      
      // Add subcategory filter if selected (per Postman collection: sub_category_id query param)
      if (subCategoryFilter) {
        params.append('sub_category_id', subCategoryFilter);
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
            productType: 'frame'
            // Note: Opty Kids uses same endpoint as eyeglasses but may need category filtering
          },
          'contact-lenses': {
            endpoint: API_ROUTES.ADMIN.PRODUCTS.SECTION.CONTACT_LENSES,
            productType: 'contact_lens'
          },
          'eye-hygiene': {
            endpoint: API_ROUTES.ADMIN.PRODUCTS.SECTION.EYE_HYGIENE,
            productType: 'eye_hygiene'
          },
        };
        
        const config = sectionConfig[selectedSection];
        if (config) {
          // Add product_type as query param to ensure proper filtering
          // The section endpoint should already filter, but this ensures it works
          if (!params.has('product_type')) {
            params.append('product_type', config.productType);
          }
          // Use section-specific endpoint (backend automatically filters by product_type)
          endpoint = `${config.endpoint}?${params.toString()}`;
          console.log(`🔍 Fetching products for section: ${selectedSection}`, {
            endpoint,
            productType: config.productType,
            params: params.toString()
          });
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
        sampleProduct: productsArray.length > 0 ? {
          id: productsArray[0].id,
          name: productsArray[0].name,
          product_type: productsArray[0].product_type
        } : null
      });
      
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
          if (errorMessage.includes('prisma') || errorMessage.includes('Prisma') || errorMessage.includes('database')) {
            toast.error('Database error: Please try a different search term or contact support.');
          } else {
            toast.error(`Failed to load products: ${errorMessage}`);
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
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  // Determine which modal to use based on selected section
  const getProductModal = () => {
    if (selectedSection === 'contact-lenses') {
      return (
        <ContactLensProductModal
          product={editingProduct}
          onClose={handleModalClose}
          selectedSection={selectedSection}
        />
      );
    } else {
      // For sunglasses, eyeglasses, opty-kids, eye-hygiene, and all - use standard ProductModal
      // Set product_type based on selected section when creating new product
      const productTypeMap = {
        'sunglasses': 'sunglasses',
        'eyeglasses': 'frame',
        'opty-kids': 'frame', // Opty Kids uses same product type as eyeglasses
        'eye-hygiene': 'eye_hygiene',
        'all': null // Will use default or existing product type
      };
      
      // When creating new product, set default product type based on section
      // When editing, use existing product type
      let productToPass = editingProduct;
      if (!editingProduct && selectedSection !== 'all') {
        // Creating new product - set default product type
        productToPass = { product_type: productTypeMap[selectedSection] };
      } else if (editingProduct && !editingProduct.product_type && selectedSection !== 'all') {
        // Editing product without product_type - set based on section
        productToPass = { ...editingProduct, product_type: productTypeMap[selectedSection] };
      }
      
      return (
        <ProductModal
          product={productToPass}
          onClose={handleModalClose}
        />
      );
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingProduct(null);
    // Refresh products list immediately to reflect changes (removed images, etc.)
    // Flow: User saves product → Backend deletes removed images from storage & DB → 
    //       Modal closes → We fetch updated products → Table shows updated data
    // The backend has already processed the update, so we can refresh right away
    fetchProducts();
    // Force image refresh by updating the refresh key to ensure removed images disappear from table
    // This cache-busts the ProductImage component so it loads fresh images
    setImageRefreshKey(Date.now());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  // Section options
  const sections = [
    { value: 'all', label: 'All Products', icon: '📦' },
    { value: 'sunglasses', label: 'Sunglasses', icon: '🕶️' },
    { value: 'eyeglasses', label: 'Eyeglasses', icon: '👓' },
    { value: 'opty-kids', label: 'Opty Kids', icon: '👶' },
    { value: 'contact-lenses', label: 'Contact Lenses', icon: '🔍' },
    { value: 'eye-hygiene', label: 'Eye Hygiene', icon: '💧' },
  ];

  const handleSectionChange = (section) => {
    console.log(`🔄 Changing section to: ${section}`);
    setSelectedSection(section);
    setPage(1); // Reset to first page when section changes
    // Clear category and subcategory filters when changing sections to show all products in that section
    setCategoryFilter('');
    setSubCategoryFilter('');
    // Note: searchTerm is kept so users can still search within the selected section
    // fetchProducts will be called automatically via useEffect when selectedSection changes
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
          <button
            onClick={handleAdd}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 font-semibold text-sm sm:text-base w-full sm:w-auto"
          >
            <FiPlus className="w-5 h-5" />
            <span>{t('addProduct')}</span>
          </button>
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



