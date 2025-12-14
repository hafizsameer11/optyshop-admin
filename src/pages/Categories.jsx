import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import CategoryModal from '../components/CategoryModal';
import { API_ROUTES } from '../config/apiRoutes';

const Categories = () => {
  const [categories, setCategories] = useState([]);
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Category</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sort Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    No categories found
                  </td>
                </tr>
              ) : (
                categories.map((category) => {
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
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.slug || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={category.description || ''}>
                      {category.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {productCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.sort_order !== null && category.sort_order !== undefined ? Number(category.sort_order) : 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          category.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.created_at ? new Date(category.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
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
