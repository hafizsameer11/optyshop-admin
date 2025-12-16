import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import SubCategoryModal from '../components/SubCategoryModal';
import { API_ROUTES } from '../config/apiRoutes';

const SubCategories = () => {
    const [subCategories, setSubCategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSubCategory, setEditingSubCategory] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch categories first (always needed for parent mapping)
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

            // Fetch subcategories separately - handle 404 gracefully
            try {
                const subCatResponse = await api.get(API_ROUTES.ADMIN.SUBCATEGORIES.LIST);
                const responseData = subCatResponse.data?.data || subCatResponse.data || {};
                const subCatData = responseData.subcategories || responseData || [];
                setSubCategories(Array.isArray(subCatData) ? subCatData : []);
            } catch (subCatError) {
                console.warn('SubCategories endpoint not available:', subCatError.response?.status);
                setSubCategories([]);
                
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
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this subcategory?')) return;

        try {
            await api.delete(API_ROUTES.ADMIN.SUBCATEGORIES.DELETE(id));
            toast.success('SubCategory deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Delete error:', error);
            if (error.response?.status === 401) {
                toast.error('❌ Demo mode - Cannot delete');
            } else {
                toast.error('Failed to delete subcategory');
            }
        }
    };

    const handleEdit = (subCategory) => {
        setEditingSubCategory(subCategory);
        setModalOpen(true);
    };

    const handleAdd = () => {
        setEditingSubCategory(null);
        setModalOpen(true);
    };

    const getParentName = (categoryId) => {
        const parent = categories.find(c => c.id === categoryId);
        return parent ? parent.name : '-';
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
                <h1 className="text-3xl font-bold text-gray-900">SubCategories</h1>
                <button
                    onClick={handleAdd}
                    className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                    <FiPlus />
                    <span>Add SubCategory</span>
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
                                    Parent Category
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
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                        No subcategories found
                                    </td>
                                </tr>
                            ) : (
                                subCategories.map((subCategory) => (
                                    <tr key={subCategory.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {subCategory.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getParentName(subCategory.category_id)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {subCategory.slug}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={subCategory.description}>
                                            {subCategory.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${subCategory.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {subCategory.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(subCategory)}
                                                className="text-primary-600 hover:text-primary-900 mr-4"
                                                title="Edit"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(subCategory.id)}
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
            </div>

            {modalOpen && (
                <SubCategoryModal
                    subCategory={editingSubCategory}
                    categories={categories}
                    onClose={() => {
                        setModalOpen(false);
                        setEditingSubCategory(null);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
};

export default SubCategories;
