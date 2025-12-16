import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import CategoryModal from '../components/CategoryModal';
import { API_ROUTES } from '../config/apiRoutes';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [subCategoriesMap, setSubCategoriesMap] = useState({}); // categoryId -> subcategories array
  const [expandedCategories, setExpandedCategories] = useState({}); // categoryId -> boolean
  const [loadingSubcategories, setLoadingSubcategories] = useState({}); // categoryId -> boolean
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Try admin endpoint first, fallback to public endpoint
      let response;
      try {
        // Try admin endpoint first
        response = await api.get(API_ROUTES.ADMIN.CATEGORIES.LIST);
      } catch (adminError) {
        // If admin endpoint fails, try public endpoint
        response = await api.get(API_ROUTES.CATEGORIES.LIST);
      }
      
      console.log('Categories API Response:', response.data);
      
      // Handle the nested data structure from the API
      // Response structure: { success, message, data: { categories: [...] } } or { categories: [...] }
      const responseData = response.data?.data || response.data || {};
      const categoriesData = responseData.categories || responseData || [];
      
      console.log('Parsed categories:', categoriesData);
      
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else {
        console.error('Categories data is not an array:', categoriesData);
        setCategories([]);
      }
    } catch (error) {
      console.error('Categories API error:', error);
      // Use empty array as fallback - silent for all errors (demo mode, offline, etc.)
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await api.delete(API_ROUTES.ADMIN.CATEGORIES.DELETE(id));
      const successMessage = response.data?.message || 'Category deleted successfully';
      toast.success(successMessage);
      fetchCategories();
    } catch (error) {
      console.error('Category delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete category');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to delete categories');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete category';
        toast.error(errorMessage);
      }
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Enhanced Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-2">
            Categories
          </h1>
          <p className="text-gray-500 font-medium">Manage your product categories</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 font-semibold"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Enhanced Table Card */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 via-indigo-50/30 to-purple-50/30 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Sort Order
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                        <FiPlus className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-semibold text-lg">No categories found</p>
                      <p className="text-gray-400 text-sm mt-1">Get started by adding your first category</p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((category, index) => {
                  // Handle different possible product count structures
                  let productCount = 0;
                  if (Array.isArray(category.products)) {
                    productCount = category.products.length;
                  } else if (category.products_count !== undefined) {
                    productCount = category.products_count;
                  } else if (category.product_count !== undefined) {
                    productCount = category.product_count;
                  }
                  
                  return (
                  <tr 
                    key={category.id} 
                    className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-200 group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {category.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded-md inline-block">
                        {category.slug || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate" title={category.description || ''}>
                        {category.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-900">{productCount}</span>
                        <span className="text-xs text-gray-500">items</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-700">
                        {category.sort_order !== null && category.sort_order !== undefined ? Number(category.sort_order) : 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm ${
                          category.is_active
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                            : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {category.is_active ? '✓ Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 font-medium">
                        {category.created_at ? new Date(category.created_at).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 rounded-lg text-indigo-600 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 rounded-lg text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-rose-500 transition-all duration-200 shadow-sm hover:shadow-md"
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
      </div>

      {modalOpen && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setModalOpen(false);
            setEditingCategory(null);
            fetchCategories();
          }}
        />
      )}
    </div>
  );
};

export default Categories;
