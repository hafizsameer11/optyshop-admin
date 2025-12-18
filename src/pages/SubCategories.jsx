import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import SubCategoryModal from '../components/SubCategoryModal';
import { API_ROUTES, buildQueryString } from '../config/apiRoutes';

const SubCategories = () => {
    const [subCategories, setSubCategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [topLevelModalOpen, setTopLevelModalOpen] = useState(false);
    const [editingSubCategory, setEditingSubCategory] = useState(null);
    
    // Filter and pagination state
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageLimit = 50;

    useEffect(() => {
        fetchData();
    }, [currentPage, searchQuery, categoryFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch categories first (always needed for parent mapping and filter)
            let catData = [];
            try {
                const catResponse = await api.get(API_ROUTES.ADMIN.CATEGORIES.LIST);
                const responseData = catResponse.data?.data || catResponse.data || {};
                catData = responseData.categories || responseData || [];
                setCategories(Array.isArray(catData) ? catData : []);
            } catch (catError) {
                console.error('Categories fetch error:', catError);
                setCategories([]);
            }

            // Build query parameters for subcategories endpoint
            const queryParams = {
                page: currentPage,
                limit: pageLimit,
            };
            
            if (searchQuery.trim()) {
                queryParams.search = searchQuery.trim();
            }
            
            if (categoryFilter) {
                queryParams.category_id = categoryFilter;
            }

            // Fetch subcategories with filters and pagination
            try {
                const url = buildQueryString(API_ROUTES.ADMIN.SUBCATEGORIES.LIST, queryParams);
                const subCatResponse = await api.get(url);
                const responseData = subCatResponse.data?.data || {};
                const subCatData = responseData.subcategories || [];
                const allSubCategories = Array.isArray(subCatData) ? subCatData : [];
                
                // Handle pagination metadata
                if (responseData.pagination) {
                    setTotalPages(responseData.pagination.pages || 1);
                    setTotalCount(responseData.pagination.total || 0);
                } else {
                    setTotalPages(1);
                    setTotalCount(allSubCategories.length);
                }
                
                console.log(`✅ Loaded ${allSubCategories.length} subcategories (page ${currentPage}/${totalPages})`);
                
                setSubCategories(allSubCategories);
            } catch (subCatError) {
                console.warn('SubCategories endpoint not available:', subCatError.response?.status);
                setSubCategories([]);
                setTotalPages(1);
                setTotalCount(0);
                
                // Only show error if it's not a 404 (endpoint doesn't exist yet)
                const isDemoMode = localStorage.getItem('demo_user') !== null;
                if (!isDemoMode && subCatError.response?.status !== 404) {
                    if (!subCatError.response) {
                        toast.error('Failed to fetch subcategories: Network error.');
                    } else if (subCatError.response.status === 401) {
                        toast.error('Authentication failed. Please log in again.');
                    } else {
                        toast.error(`Failed to fetch subcategories: ${subCatError.response?.data?.message || subCatError.message}`);
                    }
                }
            }

        } catch (error) {
            console.error('Unexpected error:', error);
            setSubCategories([]);
            setCategories([]);
            setTotalPages(1);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page on new search
    };

    const handleCategoryFilter = (e) => {
        setCategoryFilter(e.target.value);
        setCurrentPage(1); // Reset to first page on filter change
    };

    const clearFilters = () => {
        setSearchQuery('');
        setCategoryFilter('');
        setCurrentPage(1);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this subcategory?')) return;

        try {
            // API Response: { success, message, data: {} }
            const response = await api.delete(API_ROUTES.ADMIN.SUBCATEGORIES.DELETE(id));
            const successMessage = response.data?.message || 'SubCategory deleted successfully';
            toast.success(successMessage);
            fetchData();
        } catch (error) {
            console.error('Delete error:', error);
            if (error.response?.status === 401) {
                toast.error('❌ Demo mode - Cannot delete');
            } else {
                const errorMessage = error.response?.data?.message || 'Failed to delete subcategory';
                toast.error(errorMessage);
            }
        }
    };

    const handleEdit = useCallback((subCategory) => {
        setEditingSubCategory(subCategory);
        setTopLevelModalOpen(true);
    }, []);

    const handleAdd = useCallback(() => {
        setEditingSubCategory(null);
        setTopLevelModalOpen(true);
    }, []);



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
                <h1 className="text-3xl font-bold text-gray-900">SubCategories</h1>
                <button
                    onClick={handleAdd}
                    className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                    <FiPlus />
                    <span>Add SubCategory</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <FiX />
                            </button>
                        )}
                    </div>

                    {/* Category Filter */}
                    <div>
                        <select
                            value={categoryFilter}
                            onChange={handleCategoryFilter}
                            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Clear Filters */}
                    {(searchQuery || categoryFilter) && (
                        <div>
                            <button
                                onClick={clearFilters}
                                className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>


            {/* SubCategories Table */}
            <div className="bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Parent SubCategory
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Slug
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {subCategories.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                        No subcategories found
                                    </td>
                                </tr>
                            ) : (() => {
                                // Sort subcategories: top-level first, then nested (grouped by parent)
                                const sortedSubCategories = [...subCategories].sort((a, b) => {
                                    const aIsNested = a.parent_id !== null && a.parent_id !== undefined;
                                    const bIsNested = b.parent_id !== null && b.parent_id !== undefined;
                                    
                                    // Top-level subcategories come first
                                    if (!aIsNested && bIsNested) return -1;
                                    if (aIsNested && !bIsNested) return 1;
                                    
                                    // If both are nested, group by parent_id
                                    if (aIsNested && bIsNested) {
                                        if (a.parent_id !== b.parent_id) {
                                            return (a.parent_id || 0) - (b.parent_id || 0);
                                        }
                                    }
                                    
                                    // Within same group, sort by sort_order or name
                                    const aOrder = a.sort_order !== undefined ? a.sort_order : 999;
                                    const bOrder = b.sort_order !== undefined ? b.sort_order : 999;
                                    if (aOrder !== bOrder) return aOrder - bOrder;
                                    
                                    // Final sort by name
                                    return (a.name || '').localeCompare(b.name || '');
                                });
                                
                                return sortedSubCategories.map((subCategory) => {
                                    const categoryId = subCategory.category_id || subCategory.category?.id;
                                    const category = categories.find(c => c.id === categoryId);
                                    
                                    // Check if this is a nested subcategory (has parent_id)
                                    const isNested = subCategory.parent_id !== null && subCategory.parent_id !== undefined;
                                    
                                    // Get parent subcategory name
                                    let parentName = '-';
                                    let parentInfo = null;
                                    if (isNested) {
                                        // Try to get parent name from the parent object in response
                                        if (subCategory.parent?.name) {
                                            parentName = subCategory.parent.name;
                                            parentInfo = subCategory.parent;
                                        } else if (subCategory.parent_id) {
                                            // Fallback: try to find parent in current list
                                            const parentSubCategory = subCategories.find(sc => sc.id === subCategory.parent_id);
                                            if (parentSubCategory?.name) {
                                                parentName = parentSubCategory.name;
                                                parentInfo = parentSubCategory;
                                            } else {
                                                parentName = `ID: ${subCategory.parent_id}`;
                                            }
                                        }
                                    }
                                    
                                    return (
                                        <tr key={subCategory.id} className={`hover:bg-gray-50 transition-colors ${isNested ? 'bg-blue-50/30' : 'bg-white'}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    {isNested ? (
                                                        <>
                                                            <span className="text-blue-400 font-bold text-lg">└─</span>
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {subCategory.name}
                                                            </span>
                                                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-semibold">
                                                                Sub-Subcategory
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm font-bold text-gray-900">
                                                            {subCategory.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                <span className="font-medium">{category ? category.name : '-'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {isNested ? (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-blue-600 font-semibold">{parentName}</span>
                                                        {parentInfo?.slug && (
                                                            <span className="text-xs text-gray-400">({parentInfo.slug})</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">Top-level</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {subCategory.slug}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={subCategory.description}>
                                                {subCategory.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        subCategory.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {subCategory.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-3">
                                                    <button
                                                        onClick={() => handleEdit(subCategory)}
                                                        className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 p-1.5 rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(subCategory.id)}
                                                        className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1.5 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-700">
                        Showing page {currentPage} of {totalPages} ({totalCount} total subcategories)
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Top-Level SubCategory Modal */}
            {topLevelModalOpen && (
                <SubCategoryModal
                    subCategory={editingSubCategory}
                    categories={categories}
                    onClose={() => {
                        setTopLevelModalOpen(false);
                        setEditingSubCategory(null);
                    }}
                    onSuccess={() => {
                        // Refresh data after successful create/update
                        setTimeout(() => {
                            fetchData();
                        }, 300);
                    }}
                />
            )}

        </div>
    );
};

export default SubCategories;
