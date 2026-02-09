import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../../config/apiRoutes';
import AstigmatismConfigModal from '../../components/AstigmatismConfigModal';
import { astigmatismConfigs } from '../../api/contactLensForms';

const AstigmatismConfigurations = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [totalPages, setTotalPages] = useState(1);
    const [filterSubCategoryId, setFilterSubCategoryId] = useState('');
    const [subCategories, setSubCategories] = useState([]);

    useEffect(() => {
        fetchSubCategories();
    }, []);

    useEffect(() => {
        fetchConfigs();
    }, [page, filterSubCategoryId]);

    const fetchSubCategories = async () => {
        try {
            const response = await api.get(`${API_ROUTES.ADMIN.SUBCATEGORIES.LIST}?page=1&limit=1000`);
            let subCategoriesData = [];

            if (response.data) {
                if (response.data.data) {
                    const dataObj = response.data.data;
                    if (Array.isArray(dataObj)) {
                        subCategoriesData = dataObj;
                    } else if (dataObj.subcategories && Array.isArray(dataObj.subcategories)) {
                        subCategoriesData = dataObj.subcategories;
                    }
                } else if (Array.isArray(response.data)) {
                    subCategoriesData = response.data;
                }
            }

            setSubCategories(subCategoriesData);
        } catch (error) {
            console.error('SubCategories fetch error:', error);
        }
    };

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const params = { page, limit };
            if (filterSubCategoryId) {
                params.sub_category_id = filterSubCategoryId;
            }

            const response = await astigmatismConfigs.getAll(params);

            let configsData = [];
            let pagination = null;

            if (response.data) {
                if (response.data.data) {
                    const dataObj = response.data.data;
                    if (Array.isArray(dataObj)) {
                        configsData = dataObj;
                    } else if (dataObj.configs && Array.isArray(dataObj.configs)) {
                        configsData = dataObj.configs;
                    } else if (dataObj.data && Array.isArray(dataObj.data)) {
                        configsData = dataObj.data;
                    } else if (dataObj.results && Array.isArray(dataObj.results)) {
                        configsData = dataObj.results;
                    }
                    if (dataObj.pagination) {
                        pagination = dataObj.pagination;
                    }
                } else if (Array.isArray(response.data)) {
                    configsData = response.data;
                } else if (response.data.configs && Array.isArray(response.data.configs)) {
                    configsData = response.data.configs;
                    if (response.data.pagination) {
                        pagination = response.data.pagination;
                    }
                } else if (response.data.results && Array.isArray(response.data.results)) {
                    configsData = response.data.results;
                    if (response.data.pagination) {
                        pagination = response.data.pagination;
                    }
                }
            }

            if (Array.isArray(configsData)) {
                setConfigs(configsData);
                if (pagination) {
                    setTotalPages(pagination.totalPages || 1);
                } else if (configsData.length < limit) {
                    setTotalPages(1);
                }
            } else {
                setConfigs([]);
            }
        } catch (error) {
            console.error('Astigmatism configs API error:', error);
            if (!error.response) {
                toast.error('Cannot connect to server. Check if backend is running.');
            } else if (error.response.status === 401) {
                toast.error('Authentication required.');
            } else if (error.response.status === 404) {
                // Warning but not error potentially if not implemented yet
                console.warn('Endpoint not found');
            } else {
                toast.error('Failed to fetch astigmatism configurations');
            }
            setConfigs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedConfig(null);
        setModalOpen(true);
    };

    const handleEdit = async (config) => {
        try {
            setLoading(true);
            // Try to fetch full details, but if endpoint doesn't exist (404), use list data
            const response = await api.get(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.ASTIGMATISM.BY_ID(config.id));
            let fullConfig = config;
            if (response.data) {
                if (response.data.data) {
                    fullConfig = response.data.data;
                } else if (response.data.config) {
                    fullConfig = response.data.config;
                } else {
                    fullConfig = response.data;
                }
            }
            setSelectedConfig(fullConfig);
            setModalOpen(true);
        } catch (error) {
            // If 404, the endpoint doesn't exist - silently use list data
            // For other errors, log but still use list data
            if (error.response?.status !== 404) {
                console.error('Fetch config details error:', error);
            }
            // Use the config from the list (should have all necessary data)
            setSelectedConfig(config);
            setModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this astigmatism configuration?')) {
            return;
        }

        try {
            const response = await astigmatismConfigs.delete(id);
            if (response.success) {
                toast.success(response.message || 'Astigmatism configuration deleted successfully');
            } else {
                toast.success('Astigmatism configuration deleted successfully');
            }
            fetchConfigs();
        } catch (error) {
            console.error('Delete error:', error);
            if (!error.response) {
                toast.error('Backend unavailable - Cannot delete configuration');
            } else {
                toast.error('Failed to delete configuration');
            }
        }
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
                <h1 className="text-3xl font-bold text-gray-900">Astigmatism Configurations</h1>
                <button
                    onClick={handleAdd}
                    className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                    <FiPlus />
                    <span>Add Configuration</span>
                </button>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Sub Category
                        </label>
                        <select
                            value={filterSubCategoryId}
                            onChange={(e) => {
                                setFilterSubCategoryId(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">All Sub Categories</option>
                            {subCategories.map((subCat) => (
                                <option key={subCat.id} value={subCat.id}>
                                    {subCat.name} (ID: {subCat.id})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Display Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sub Category ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
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
                            {configs.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                        No astigmatism configurations found
                                    </td>
                                </tr>
                            ) : (
                                configs.map((config) => {
                                    const configId = config.id;
                                    const name = config.name || 'N/A';
                                    const displayName = config.display_name || config.displayName || 'N/A';
                                    const subCategoryId = config.sub_category_id || config.subCategoryId || 'N/A';
                                    const priceValue = config.price !== undefined && config.price !== null
                                        ? (typeof config.price === 'string' ? parseFloat(config.price) : Number(config.price))
                                        : 0;
                                    const price = isNaN(priceValue) ? 0 : priceValue;
                                    const isActive = config.is_active !== undefined ? config.is_active : (config.isActive !== undefined ? config.isActive : true);
                                    
                                    // Get product information
                                    const product = config.product || config.productData;
                                    const productName = product?.name || 'N/A';
                                    const productSku = product?.sku;
                                    const productDisplay = product ? `${productName}${productSku ? ` (${productSku})` : ''}` : 'No Product';

                                    return (
                                        <tr key={configId}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {configId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {displayName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {subCategoryId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={product ? 'text-gray-900' : 'text-gray-400 italic'}>
                                                    {productDisplay}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ${typeof price === 'number' && !isNaN(price) ? price.toFixed(2) : '0.00'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    {isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(config)}
                                                    className="text-primary-600 hover:text-primary-900 mr-4"
                                                    title="Edit"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(configId)}
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

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-700">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {modalOpen && (
                <AstigmatismConfigModal
                    config={selectedConfig}
                    onClose={() => {
                        setModalOpen(false);
                        setSelectedConfig(null);
                        fetchConfigs();
                    }}
                />
            )}
        </div>
    );
};

export default AstigmatismConfigurations;
