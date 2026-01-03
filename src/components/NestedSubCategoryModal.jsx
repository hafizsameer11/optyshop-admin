import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';

const NestedSubCategoryModal = ({ subCategory, categories, topLevelSubCategories, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        category_id: '',
        parent_subcategory_id: '',
        description: '',
        is_active: true,
    });
    const [availableParents, setAvailableParents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (subCategory) {
            const parentId = subCategory.parent_id !== undefined && subCategory.parent_id !== null
                ? subCategory.parent_id
                : subCategory.parent?.id || 
                  subCategory.parentId ||
                  subCategory.parent_subcategory_id || 
                  subCategory.parentSubcategoryId ||
                  subCategory.parentSubcategory?.id;
            
            setFormData({
                name: subCategory.name || '',
                slug: subCategory.slug || '',
                category_id: subCategory.category_id || subCategory.category?.id || '',
                parent_subcategory_id: parentId || '',
                description: subCategory.description || '',
                is_active: subCategory.is_active !== undefined ? subCategory.is_active : true,
            });
            
            // If category is set, filter available parents
            if (subCategory.category_id || subCategory.category?.id) {
                const categoryId = subCategory.category_id || subCategory.category?.id;
                filterParentsByCategory(categoryId);
            }
        } else {
            setFormData({
                name: '',
                slug: '',
                category_id: '',
                parent_subcategory_id: '',
                description: '',
                is_active: true,
            });
            setAvailableParents([]);
        }
    }, [subCategory, topLevelSubCategories]);

    const filterParentsByCategory = (categoryId) => {
        if (!categoryId || !topLevelSubCategories) {
            setAvailableParents([]);
            return;
        }
        
        // Filter top-level subcategories that belong to the selected category
        const parents = topLevelSubCategories.filter(sc => 
            (sc.category_id || sc.category?.id) === parseInt(categoryId)
        );
        setAvailableParents(parents);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;

        // Auto-generate slug from name (only when creating new subcategory)
        if (name === 'name' && !subCategory) {
            const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            setFormData(prev => ({ ...prev, name: fieldValue, slug }));
        } else if (name === 'category_id') {
            // When category changes, filter available parent subcategories
            setFormData(prev => ({ 
                ...prev, 
                [name]: fieldValue,
                parent_subcategory_id: '' // Reset parent subcategory
            }));
            filterParentsByCategory(value);
        } else if (name === 'parent_subcategory_id') {
            // Log when parent subcategory is selected
            console.log('🔗 Parent subcategory selected:', value, 'Type:', typeof value);
            setFormData(prev => ({ ...prev, [name]: fieldValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: fieldValue }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate required fields
            if (!formData.name || !formData.name.trim()) {
                toast.error('SubCategory name is required');
                setLoading(false);
                return;
            }
            if (!formData.category_id || formData.category_id === '') {
                toast.error('Category is required');
                setLoading(false);
                return;
            }
            if (!formData.parent_subcategory_id || formData.parent_subcategory_id === '') {
                toast.error('Parent subcategory is required for nested subcategories');
                setLoading(false);
                return;
            }
            if (!formData.slug || !formData.slug.trim()) {
                toast.error('SubCategory slug is required');
                setLoading(false);
                return;
            }

            // Prepare data object - nested subcategories always have a parent_id
            // Debug: Log the form data before parsing
            console.log('🔍 Form data before submission:', {
                parent_subcategory_id: formData.parent_subcategory_id,
                parent_subcategory_id_type: typeof formData.parent_subcategory_id,
                category_id: formData.category_id,
                name: formData.name,
            });
            
            const parentId = parseInt(formData.parent_subcategory_id);
            if (isNaN(parentId) || parentId <= 0) {
                console.error('❌ Invalid parent_subcategory_id:', {
                    raw: formData.parent_subcategory_id,
                    parsed: parentId,
                    isNaN: isNaN(parentId),
                    isZeroOrNegative: parentId <= 0
                });
                toast.error('Invalid parent subcategory selected. Please select a valid parent subcategory.');
                setLoading(false);
                return;
            }
            
            console.log('✅ Valid parent_id parsed:', parentId);

            const dataToSend = {
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                category_id: parseInt(formData.category_id),
                parent_id: parentId, // CRITICAL: Always set parent_id for nested subcategories
                is_active: formData.is_active !== undefined ? formData.is_active : true,
            };
            
            // Double-check that parent_id is set correctly
            if (!dataToSend.parent_id || dataToSend.parent_id === null || dataToSend.parent_id === undefined) {
                console.error('❌ ERROR: parent_id is missing or null in dataToSend!', dataToSend);
                toast.error('Error: Parent subcategory ID is missing. Please try again.');
                setLoading(false);
                return;
            }

            if (formData.description && formData.description.trim()) {
                dataToSend.description = formData.description.trim();
            }

            console.log('📤 Sending nested subcategory:', {
                fullPayload: JSON.stringify(dataToSend, null, 2),
                parent_id: dataToSend.parent_id,
                parent_id_type: typeof dataToSend.parent_id,
                parent_id_value: dataToSend.parent_id,
                formData_parent_subcategory_id: formData.parent_subcategory_id,
            });

            // Log the exact endpoint being called
            const endpoint = subCategory 
                ? API_ROUTES.ADMIN.SUBCATEGORIES.UPDATE(subCategory.id)
                : API_ROUTES.ADMIN.SUBCATEGORIES.CREATE;
            const method = subCategory ? 'PUT' : 'POST';
            
            // Get baseURL from api instance
            const baseURL = api.defaults?.baseURL || import.meta.env.VITE_API_BASE_URL || 'https://optyshop-frontend.hmstech.org/api';
            
            console.log('🌐 API Request Details:', {
                method: method,
                endpoint: endpoint,
                baseURL: baseURL,
                fullUrl: `${baseURL}${endpoint}`,
                payload: dataToSend,
            });

            let response;
            if (subCategory) {
                response = await api.put(endpoint, dataToSend);
            } else {
                response = await api.post(endpoint, dataToSend);
            }

            const createdSubCategory = response.data?.data?.subcategory || response.data?.data || response.data?.subcategory || {};
            
            console.log('✅ Nested SubCategory Created/Updated:', {
                sent_parent_id: dataToSend.parent_id,
                responseStatus: response.status,
                received_parent_id: createdSubCategory?.parent_id || 'not in response (enriched with sent value)',
            });
            
            // Note: Backend accepts parent_id but may not return it in response
            // We handle this by enriching the response data with the parent_id we sent

            const successMessage = response.data?.message || (subCategory ? 'Nested subcategory updated successfully' : 'Nested subcategory created successfully');
            toast.success(successMessage);
            
            // Pass enriched data with parent_id
            if (onSuccess && createdSubCategory) {
                const enrichedData = {
                    ...createdSubCategory,
                    parent_id: parentId,
                    parent_subcategory_id: parentId
                };
                onSuccess(enrichedData);
            }
            
            onClose();
        } catch (error) {
            console.error('❌ Nested SubCategory save error:', {
                error: error,
                response: error.response,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                config: error.config,
                url: error.config?.url,
                method: error.config?.method,
                baseURL: error.config?.baseURL,
                fullUrl: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
            });
            
            if (!error.response) {
                toast.error('Backend unavailable - Cannot save nested subcategory');
            } else if (error.response.status === 401) {
                toast.error('❌ Demo mode - Please log in with real credentials');
            } else if (error.response.status === 404) {
                const errorMessage = error.response?.data?.message || 'Route not found';
                console.error('❌ 404 Error - Route not found:', {
                    attemptedUrl: error.config?.url,
                    fullUrl: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
                    method: error.config?.method,
                });
                toast.error(`Route not found: ${error.config?.method?.toUpperCase()} ${error.config?.url || endpoint}`);
            } else if (error.response.status === 400 || error.response.status === 422) {
                const errorData = error.response?.data || {};
                const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
                toast.error(errorMessage);
            } else {
                const errorMessage = error.response?.data?.message || 'Failed to save nested subcategory';
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-indigo-200/50 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex-shrink-0">
                    <h2 className="text-2xl font-extrabold text-white">
                        {subCategory ? 'Edit Nested SubCategory' : 'Add Nested SubCategory'}
                    </h2>
                    <div className="flex items-center gap-3">
                        <LanguageSwitcher variant="compact" onGradient={true} />
                        <button 
                            onClick={onClose} 
                            className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-all duration-200"
                            aria-label="Close"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col custom-scrollbar" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                    <div className="p-6 space-y-6 bg-gray-50/50 flex-1 min-h-0">
                        {/* Info Banner */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 shadow-sm">
                            <p className="text-sm text-indigo-800">
                                <strong>Nested SubCategory:</strong> This will be a child of an existing top-level subcategory.
                            </p>
                        </div>

                        {/* Category Selection - Required */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                className="input-modern w-full"
                                required
                            >
                                <option value="">Select a Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Parent Subcategory Selection - Required */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                Parent SubCategory <span className="text-red-500">*</span>
                            </label>
                            {!formData.category_id ? (
                                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                                    Please select a Category first to load available parent subcategories.
                                </div>
                            ) : availableParents.length === 0 ? (
                                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    No top-level subcategories available for this category. Create a top-level subcategory first.
                                </div>
                            ) : (
                                <>
                                    <select
                                        name="parent_subcategory_id"
                                        value={formData.parent_subcategory_id}
                                        onChange={handleChange}
                                        className="input-modern font-sans w-full"
                                        required
                                    >
                                        <option value="">Select Parent SubCategory</option>
                                        {availableParents.map(subCat => (
                                            <option key={subCat.id} value={subCat.id}>
                                                {subCat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2 px-1">
                                        Select the parent subcategory this will be nested under
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input-modern w-full"
                                required
                            />
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                Slug <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                className="input-modern font-mono w-full"
                                required
                            />
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                className="input-modern resize-none w-full"
                                placeholder="Enter nested subcategory description (optional)"
                            />
                        </div>

                        <div className="flex items-center p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
                            <input
                                type="checkbox"
                                name="is_active"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                            />
                            <label htmlFor="is_active" className="ml-3 block text-sm font-semibold text-gray-800 cursor-pointer">
                                Active
                            </label>
                        </div>
                    </div>

                    {/* Fixed Footer with Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-gray-200 bg-white flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary-modern disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NestedSubCategoryModal;


