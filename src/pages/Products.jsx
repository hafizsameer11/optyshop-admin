import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiImage } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ProductModal from '../components/ProductModal';
import { API_ROUTES } from '../config/apiRoutes';

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
    
    // Debug: Always log image data for troubleshooting
    if (product.id) {
      console.log(`Product ${product.id} image data:`, {
        foundUrl: imageUrl,
        images: product.images,
        image: product.image,
        image_url: product.image_url,
        fullProduct: product
      });
    }
    
    // Validate and set URL
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
      const trimmedUrl = imageUrl.trim();
      
      // Test if URL is accessible (optional - can be removed if too verbose)
      // This helps identify if it's a URL format issue
      try {
        new URL(trimmedUrl); // Validate URL format
        setImageSrc(trimmedUrl);
        console.log(`✅ Setting image source for product ${product.id}:`, trimmedUrl);
      } catch (urlError) {
        // If it's a relative path, that's okay too
        if (trimmedUrl.startsWith('/')) {
          setImageSrc(trimmedUrl);
          console.log(`✅ Setting relative image path for product ${product.id}:`, trimmedUrl);
        } else {
          console.error(`❌ Invalid image URL format for product ${product.id}:`, trimmedUrl, urlError);
          setImageSrc(null);
          setImageLoading(false);
        }
      }
    } else {
      setImageSrc(null);
      setImageLoading(false);
      if (product.id) {
        console.warn(`⚠️ Product ${product.id} has no valid image URL`);
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
    console.error('Product image failed to load:', {
      imageSrc,
      productId: product?.id,
      productName: product?.name,
      error: e,
      // Try to get more details about the error
      imageElement: e.target
    });
    
    // Check if it's a network/CORS error or 404
    const img = e.target;
    if (img) {
      console.error('Image element details:', {
        src: img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      });
    }
    
    setImageError(true);
    setImageLoading(false);
    // Don't show broken image icon
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
          crossOrigin="anonymous"
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

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await api.get(`${API_ROUTES.ADMIN.PRODUCTS.LIST}?${params.toString()}`);
      
      // Handle the nested data structure from the API
      // Response structure: { success, message, data: { products: [], pagination: {} } }
      const responseData = response.data?.data || response.data || {};
      const productsData = responseData.products || responseData || [];
      
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
    fetchProducts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Product</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    No products found. {searchTerm && 'Try a different search term.'}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <ProductImage product={product} />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {product.slug && (
                            <div className="text-xs text-gray-500">{product.slug}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku ? String(product.sku) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category_id ? String(product.category_id) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
                      {product.compare_at_price && (
                        <div className="text-xs text-gray-400 line-through">
                          ${parseFloat(product.compare_at_price).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{product.stock_quantity !== null && product.stock_quantity !== undefined ? Number(product.stock_quantity) : 0}</div>
                      {product.stock_status && (
                        <div className={`text-xs ${
                          product.stock_status === 'in_stock' ? 'text-green-600' : 
                          product.stock_status === 'out_of_stock' ? 'text-red-600' : 
                          'text-yellow-600'
                        }`}>
                          {String(product.stock_status).replace(/_/g, ' ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col gap-1">
                        {product.is_active ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                        {product.is_featured && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.product_type ? String(product.product_type) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
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



