import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiImage, FiEye } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ContactLensConfigModal from '../components/ContactLensConfigModal';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

// Helper function to normalize image URLs
const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;
  
  const testDomains = ['example.com', 'localhost', '127.0.0.1', 'test.com', 'placeholder.com'];
  try {
    const urlObj = new URL(trimmedUrl);
    const hostname = urlObj.hostname.toLowerCase();
    
    if (testDomains.some(domain => hostname.includes(domain))) {
      return null;
    }
    
    return trimmedUrl;
  } catch (e) {
    if (trimmedUrl.startsWith('/')) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://optyshop-frontend.hmstech.org/api';
      const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
      return `${baseUrl}${trimmedUrl}`;
    }
    
    return null;
  }
};

// Configuration Image Component - handles both product and config images
const ConfigImage = ({ config, refreshKey }) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
    
    if (!config) {
      setImageSrc(null);
      setImageLoading(false);
      return;
    }
    
    let imageUrl = null;
    
    // Try product images first (if config contains product data)
    if (config.images) {
      if (Array.isArray(config.images) && config.images.length > 0) {
        imageUrl = config.images.find(img => img && typeof img === 'string' && img.trim() !== '') || config.images[0];
      } else if (typeof config.images === 'string' && config.images.trim() !== '') {
        imageUrl = config.images;
      }
    }
    
    if (!imageUrl && config.image && typeof config.image === 'string' && config.image.trim() !== '') {
      imageUrl = config.image;
    }
    
    if (!imageUrl && config.image_url && typeof config.image_url === 'string' && config.image_url.trim() !== '') {
      imageUrl = config.image_url;
    }
    
    const normalizedUrl = normalizeImageUrl(imageUrl);
    
    if (normalizedUrl) {
      const separator = normalizedUrl.includes('?') ? '&' : '?';
      const cacheBust = refreshKey || Date.now();
      const cacheBustUrl = `${normalizedUrl}${separator}_t=${cacheBust}`;
      setImageSrc(cacheBustUrl);
    } else {
      setImageSrc(null);
      setImageLoading(false);
    }
  }, [config?.id, config?.images, config?.image, config?.image_url, refreshKey]);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = (e) => {
    setImageError(true);
    setImageLoading(false);
    if (e.target) {
      e.target.style.display = 'none';
    }
  };

  if (!imageSrc || imageError) {
    return (
      <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
        <FiImage className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

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
          alt={config?.name || 'Configuration'}
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

const ContactLensConfigs = () => {
  const { t } = useI18n();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  const [configTypeFilter, setConfigTypeFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('true');
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [page, searchTerm, categoryFilter, subCategoryFilter, configTypeFilter, isActiveFilter]);

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
      console.warn('Failed to fetch subcategories for category:', error);
      setSubCategories([]);
    }
  };

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      
      const trimmedSearch = searchTerm?.trim();
      if (trimmedSearch) {
        params.append('search', trimmedSearch);
      }
      
      if (categoryFilter) {
        params.append('category_id', categoryFilter);
      }
      
      if (subCategoryFilter) {
        params.append('sub_category_id', subCategoryFilter);
      }
      
      if (configTypeFilter) {
        params.append('configuration_type', configTypeFilter);
      }
      
      if (isActiveFilter !== '') {
        params.append('is_active', isActiveFilter);
      }
      
      const response = await api.get(`${API_ROUTES.ADMIN.CONTACT_LENS_CONFIGS.LIST}?${params.toString()}`);
      
      const responseData = response.data?.data || response.data || {};
      const configsData = responseData.configurations || responseData || [];
      const pagination = responseData.pagination || {};
      const pages = pagination.pages || pagination.totalPages || 1;
      
      setConfigs(Array.isArray(configsData) ? configsData : []);
      setTotalPages(pages);
      setImageRefreshKey(Date.now());
    } catch (error) {
      console.error('Contact lens configs API error:', error);
      setConfigs([]);
      setTotalPages(1);
      
      if (!error.response) {
        toast.error('Failed to load configurations: Network error.');
      } else if (error.response.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error(`Failed to load configurations: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;

    try {
      await api.delete(API_ROUTES.ADMIN.CONTACT_LENS_CONFIGS.DELETE(id));
      toast.success('Configuration deleted successfully');
      fetchConfigs();
    } catch (error) {
      console.error('Config delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete configuration');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to delete configurations');
      } else {
        toast.error('Failed to delete configuration');
      }
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingConfig(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingConfig(null);
    setTimeout(() => {
      fetchConfigs();
      setImageRefreshKey(Date.now());
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
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Contact Lens Configurations</h1>
          <p className="page-subtitle">Manage contact lens configurations for frontend dropdowns</p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="compact" />
          <button
            onClick={handleAdd}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 font-semibold text-sm sm:text-base w-full sm:w-auto"
          >
            <FiPlus className="w-5 h-5" />
            <span>Add Configuration</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Card */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search configurations..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
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
                  setSubCategoryFilter('');
                  setPage(1);
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
                  setPage(1);
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

            {/* Configuration Type Filter */}
            <div>
              <select
                value={configTypeFilter}
                onChange={(e) => {
                  setConfigTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="input-modern w-full"
              >
                <option value="">All Types</option>
                <option value="spherical">Spherical</option>
                <option value="astigmatism">Astigmatism</option>
              </select>
            </div>

            {/* Active Status Filter */}
            <div>
              <select
                value={isActiveFilter}
                onChange={(e) => {
                  setIsActiveFilter(e.target.value);
                  setPage(1);
                }}
                className="input-modern w-full"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Image</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Display Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {configs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <FiEye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No configurations found</p>
                    <p className="text-sm mt-2">Create your first contact lens configuration to get started</p>
                  </td>
                </tr>
              ) : (
                configs.map((config) => {
                  // Get product information from config (API might return product object or product fields)
                  const product = config.product || {};
                  const productName = product.name || config.product_name || config.name || 'N/A';
                  const productSku = product.sku || config.product_sku || config.sku || '';
                  const productId = config.product_id || config.productId || product.id || '';
                  
                  // Use product image if available, otherwise fallback to config image
                  const imageConfig = product.images || product.image ? { ...product } : config;
                  
                  return (
                    <tr key={config.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ConfigImage config={imageConfig} refreshKey={imageRefreshKey} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{productName}</div>
                        {productSku && (
                          <div className="text-sm text-gray-500">SKU: {productSku}</div>
                        )}
                        {productId && (
                          <div className="text-xs text-gray-400">ID: {productId}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{config.display_name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          config.configuration_type === 'spherical' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {config.configuration_type === 'spherical' ? 'Spherical' : 'Astigmatism'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          config.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {config.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(config)}
                            className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(config.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <ContactLensConfigModal
          config={editingConfig}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default ContactLensConfigs;


