import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiImage } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ProductModal from '../components/ProductModal';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from '../components/LanguageSwitcher';

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
const ProductImage = ({ product }) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    // Reset error state when product changes
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
      const separator = normalizedUrl.includes('?') ? '&' : '?';
      const cacheBustUrl = `${normalizedUrl}${separator}_t=${Date.now()}`;
      setImageSrc(cacheBustUrl);
    } else {
      setImageSrc(null);
      setImageLoading(false);
      if (product.id && imageUrl) {
        console.warn(`⚠️ Product ${product.id} has invalid or test image URL: ${imageUrl}`);
      }
    }
  }, [product]);

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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [subCategoriesMap, setSubCategoriesMap] = useState({});

  useEffect(() => {
    fetchProducts();
    fetchSubCategories();
  }, [page, searchTerm]);

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
      
      const response = await api.get(`${API_ROUTES.ADMIN.PRODUCTS.LIST}?${params.toString()}`);
      
      // Handle the nested data structure from the API
      // Response structure: { success, message, data: { products: [], pagination: {} } }
      const responseData = response.data?.data || response.data || {};
      const productsData = responseData.products || responseData || [];
      
      // Log first product to debug structure
      if (Array.isArray(productsData) && productsData.length > 0) {
        console.log('Sample product data structure:', productsData[0]);
      }
      
      // Extract pagination info
      const pagination = responseData.pagination || {};
      const pages = pagination.pages || pagination.totalPages || 1;
      
      setProducts(Array.isArray(productsData) ? productsData : []);
      setTotalPages(pages);
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

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingProduct(null);
    // Add a small delay to ensure backend has processed the update
    setTimeout(() => {
      fetchProducts();
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Enhanced Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="compact" />
          <button
            onClick={handleAdd}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 font-semibold text-sm sm:text-base w-full sm:w-auto"
          >
            <FiPlus className="w-5 h-5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Enhanced Search and Table Card - Responsive */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50/50 to-indigo-50/30">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-10 sm:pl-12 w-full"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gradient-to-r from-gray-50 via-indigo-50/30 to-purple-50/30 border-b border-gray-200">
              <tr>
                <th className="table-header-responsive font-bold text-gray-700 uppercase tracking-wider">
                  ID
                </th>
                <th className="table-header-responsive font-bold text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="table-header-responsive font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                  SKU
                </th>
                <th className="table-header-responsive font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                  Category
                </th>
                <th className="table-header-responsive font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                  SubCategory
                </th>
                <th className="table-header-responsive font-bold text-gray-700 uppercase tracking-wider">
                  Price
                </th>
                <th className="table-header-responsive font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                  Stock
                </th>
                <th className="table-header-responsive font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="table-header-responsive font-bold text-gray-700 uppercase tracking-wider hidden xl:table-cell">
                  Type
                </th>
                <th className="table-header-responsive font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="10" className="table-cell-responsive text-center">
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                        <FiSearch className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-semibold text-base sm:text-lg">No products found</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {searchTerm ? 'Try a different search term.' : 'Get started by adding your first product.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr 
                    key={product.id} 
                    className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-200 group"
                  >
                    <td className="table-cell-responsive text-sm text-gray-500 font-medium">
                      {product.id}
                    </td>
                    <td className="table-cell-responsive">
                      <div className="flex items-center min-w-0">
                        <ProductImage product={product} />
                        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                          <div className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
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
                    <td className="table-cell-responsive text-sm sm:text-base font-bold text-gray-900">
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
                          <span className="inline-flex px-2 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200">
                            Inactive
                          </span>
                        )}
                        {product.is_featured && (
                          <span className="inline-flex px-2 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell-responsive text-sm text-gray-500 hidden xl:table-cell">
                      {product.product_type ? String(product.product_type) : '-'}
                    </td>
                    <td className="table-cell-responsive">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 rounded-lg text-indigo-600 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Edit"
                          aria-label="Edit product"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 rounded-lg text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-rose-500 transition-all duration-200 shadow-sm hover:shadow-md"
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
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600 font-medium">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Products;



