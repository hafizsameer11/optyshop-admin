import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

const SubCategoryModal = ({ subCategory, categories, onClose, onSuccess }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        category_id: '',
        parent_id: '',
        description: '',
        sort_order: 0,
        is_active: true,
    });
    const [loading, setLoading] = useState(false);
    const [availableParents, setAvailableParents] = useState([]);
    const [loadingParents, setLoadingParents] = useState(false);

    useEffect(() => {
        if (subCategory) {
            // Extract parent_id from subcategory (could be null for top-level)
            const parentId = subCategory.parent_id !== undefined && subCategory.parent_id !== null
                ? subCategory.parent_id.toString()
                : '';
            
            setFormData({
                name: subCategory.name || '',
                slug: subCategory.slug || '',
                category_id: subCategory.category_id || subCategory.category?.id || '',
                parent_id: parentId,
                description: subCategory.description || '',
                sort_order: subCategory.sort_order !== undefined ? subCategory.sort_order : 0,
                is_active: subCategory.is_active !== undefined ? subCategory.is_active : true,
            });
        } else {
            setFormData({
                name: '',
                slug: '',
                category_id: '',
                parent_id: '',
                description: '',
                sort_order: 0,
                is_active: true,
            });
        }
    }, [subCategory]);

    // Fetch available parent subcategories when category is selected
    // Parents are top-level subcategories (parent_id = null) in the selected category
    useEffect(() => {
        const fetchAvailableParents = async () => {
            if (!formData.category_id) {
                setAvailableParents([]);
            return;
        }

            // Don't fetch if editing the same subcategory (would cause circular reference)
            const excludeId = subCategory?.id ? subCategory.id : null;

            try {
                setLoadingParents(true);
                
                // Try the available-parents endpoint first (if it exists)
                // If it returns 404, immediately fall back to LIST endpoint
                try {
                    let url = API_ROUTES.ADMIN.SUBCATEGORIES.AVAILABLE_PARENTS(formData.category_id);
                    if (excludeId) {
                        url += `?exclude_id=${excludeId}`;
                    }
                    console.log(`🔍 Fetching available parents from: ${url}`);
                    const response = await api.get(url);
                    
                    // If we get a 404, the endpoint doesn't exist - skip to fallback
                    if (response.status === 404) {
                        throw new Error('Endpoint not found');
                    }
                    
                    console.log('📥 Available parents API response (full):', JSON.stringify(response.data, null, 2));
                    
                    // Handle various response structures
                    let parents = [];
                    if (response.data?.data?.parentSubcategories) {
                        parents = response.data.data.parentSubcategories;
                    } else if (response.data?.parentSubcategories) {
                        parents = response.data.parentSubcategories;
                    } else if (response.data?.data?.subcategories) {
                        parents = response.data.data.subcategories;
                    } else if (response.data?.subcategories) {
                        parents = response.data.subcategories;
                    } else if (Array.isArray(response.data?.data)) {
                        parents = response.data.data;
                    } else if (Array.isArray(response.data)) {
                        parents = response.data;
                    }
                    
                    const parentsArray = Array.isArray(parents) ? parents : [];
                    console.log(`✅ Parsed ${parentsArray.length} available parent subcategories from available-parents endpoint:`, parentsArray);
                    
                    if (parentsArray.length > 0) {
                        setAvailableParents(parentsArray);
                        return;
                    }
                } catch (availableParentsError) {
                    // If it's a 404 or "Route not found" error, skip to fallback
                    const errorMessage = availableParentsError.response?.data?.message || availableParentsError.message || '';
                    const errorMessageLower = errorMessage.toLowerCase();
                    const isNotFound = availableParentsError.response?.status === 404 || 
                                      errorMessageLower.includes('not found') ||
                                      errorMessageLower.includes('route not found') ||
                                      (availableParentsError.response?.data?.success === false && errorMessageLower.includes('not found'));
                    
                    if (isNotFound) {
                        console.log('ℹ️ Available-parents endpoint not found, using fallback method (LIST endpoint)');
                        console.log('Error response:', availableParentsError.response?.data);
                    } else {
                        console.warn('Available-parents endpoint failed, trying alternative method:', availableParentsError);
                        console.warn('Error details:', availableParentsError.response?.data || availableParentsError.message);
                    }
                    // Continue to fallback method below - don't throw, let it fall through
                }

                // Fallback: Fetch all subcategories and filter for top-level in this category
                try {
                    const listUrl = `${API_ROUTES.ADMIN.SUBCATEGORIES.LIST}?category_id=${formData.category_id}&limit=1000`;
                    console.log(`🔍 Fallback: Fetching subcategories from: ${listUrl}`);
                    const response = await api.get(listUrl);
                    console.log('📥 LIST endpoint response:', response.data);
                    
                    const responseData = response.data?.data || {};
                    const allSubCategories = responseData.subcategories || [];
                    console.log(`📊 Found ${allSubCategories.length} total subcategories for category ${formData.category_id}`);
                    
                    // Filter for top-level subcategories (parent_id = null) in this category
                    const topLevelParents = allSubCategories.filter(sub => {
                        const categoryMatch = (sub.category_id || sub.category?.id) == formData.category_id;
                        const isTopLevel = !sub.parent_id || sub.parent_id === null || sub.parent_id === undefined;
                        const notSelf = excludeId ? sub.id !== excludeId : true;
                        
                        if (categoryMatch && isTopLevel && notSelf) {
                            console.log(`  ✓ Valid parent: ${sub.name} (id: ${sub.id}, parent_id: ${sub.parent_id})`);
                        }
                        
                        return categoryMatch && isTopLevel && notSelf;
                    });
                    
                    console.log(`✅ Filtered ${topLevelParents.length} top-level subcategories from LIST endpoint for category ${formData.category_id}:`, topLevelParents);
                    setAvailableParents(topLevelParents);
                } catch (listError) {
                    console.error('Failed to fetch parent subcategories from LIST endpoint:', listError);
                    console.error('Error details:', listError.response?.data || listError.message);
                    setAvailableParents([]);
            }
        } catch (error) {
                console.error('Failed to fetch available parent subcategories:', error);
                setAvailableParents([]);
            } finally {
                setLoadingParents(false);
            }
        };

        fetchAvailableParents();
    }, [formData.category_id, subCategory?.id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let fieldValue;
        
        if (type === 'checkbox') {
            fieldValue = checked;
        } else if (type === 'number') {
            // Handle number inputs - allow empty string or valid number
            fieldValue = value === '' ? '' : (isNaN(parseInt(value)) ? 0 : parseInt(value));
        } else {
            fieldValue = value;
        }

        // Auto-generate slug from name (only when creating new subcategory)
        if (name === 'name' && !subCategory && type !== 'number') {
            // Generate base slug from name
            // Note: Duplicate names/slugs are allowed for sub-subcategories under different parents
            const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            setFormData(prev => ({ ...prev, name: fieldValue, slug }));
        } else {
            setFormData(prev => ({ ...prev, [name]: fieldValue }));
        }

        // Clear parent_id when category changes (parent must be in same category)
        if (name === 'category_id') {
            setFormData(prev => ({ ...prev, category_id: fieldValue, parent_id: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate required fields
            if (!formData.name || !formData.name.trim()) {
                toast.error(t('subCategoryNameRequired'));
                setLoading(false);
                return;
            }
                if (!formData.category_id) {
                    toast.error(t('categoryRequired'));
                setLoading(false);
                return;
            }
            if (!formData.slug || !formData.slug.trim()) {
                toast.error(t('subCategorySlugRequired'));
                setLoading(false);
                return;
            }

            // Prepare data object
            // parent_id: null for top-level subcategories, or ID for nested subcategories
            const parentId = formData.parent_id && formData.parent_id.trim() 
                ? parseInt(formData.parent_id) 
                : null;

            const dataToSend = {
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                category_id: parseInt(formData.category_id),
                parent_id: parentId, // null for top-level, or parent subcategory ID for nested
                is_active: formData.is_active !== undefined ? formData.is_active : true,
            };
            
            console.log('📤 Sending subcategory:', {
                isNested: parentId !== null,
                parent_id: parentId,
                fullPayload: JSON.stringify(dataToSend, null, 2)
            });

            // Add optional description if provided
            if (formData.description && formData.description.trim()) {
                dataToSend.description = formData.description.trim();
            }

            // Add sort_order if provided (defaults to 0)
            if (formData.sort_order !== undefined && formData.sort_order !== null && formData.sort_order !== '') {
                dataToSend.sort_order = parseInt(formData.sort_order) || 0;
            } else {
                dataToSend.sort_order = 0;
            }

            // API Response: { success, message, data: { subcategory: {} } }
            let response;
            if (subCategory) {
                response = await api.put(API_ROUTES.ADMIN.SUBCATEGORIES.UPDATE(subCategory.id), dataToSend);
            } else {
                response = await api.post(API_ROUTES.ADMIN.SUBCATEGORIES.CREATE, dataToSend);
            }

            // Extract created/updated subcategory from response
            // API Response: { success, message, data: { subcategory: {} } }
            const createdSubCategory = response.data?.data?.subcategory || response.data?.data || response.data?.subcategory || {};

            // Debug: Log API response to see what was saved
            console.log('✅ SubCategory Created/Updated:', {
                requestPayload: JSON.stringify(dataToSend, null, 2),
                responseStatus: response.status,
                responseData: JSON.stringify(createdSubCategory, null, 2),
                responseKeys: Object.keys(createdSubCategory || {}),
                parent_id: createdSubCategory?.parent_id,
                parentId: createdSubCategory?.parentId,
                parent: createdSubCategory?.parent,
                parent_subcategory_id: createdSubCategory?.parent_subcategory_id,
                category_id: createdSubCategory?.category_id,
                name: createdSubCategory?.name,
                slug: createdSubCategory?.slug,
                hasParentId: !!(createdSubCategory?.parent_id || createdSubCategory?.parentId),
                hasParentSubcategoryId: !!(createdSubCategory?.parent_subcategory_id || createdSubCategory?.parentSubcategoryId),
                hasParentObject: !!createdSubCategory?.parent,
                fullResponse: response.data
            });
            
            // Validate that the essential fields were saved
            if (!createdSubCategory.id) {
                console.error('❌ ERROR: API response missing subcategory ID!', response.data);
                toast.error(t('subCategorySaveWarning'));
            }
            

            // Handle response structure: { success, message, data: { subcategory: {} } }
            const successMessage = response.data?.message || (subCategory ? t('subCategoryUpdated') : t('subCategoryCreated'));

            toast.success(successMessage);
            
            // If onSuccess callback is provided, pass the created/updated subcategory
            if (onSuccess && createdSubCategory) {
                // Enrich with parent_id if it wasn't returned by API
                const enrichedData = {
                    ...createdSubCategory,
                    parent_id: createdSubCategory.parent_id !== undefined 
                        ? createdSubCategory.parent_id 
                        : parentId
                };
                
                console.log('📦 Enriched data for onSuccess:', enrichedData);
                onSuccess(enrichedData);
            }
            
            // Close modal and trigger refresh
            onClose();
        } catch (error) {
            console.error('SubCategory save error:', error);
            if (!error.response) {
                toast.error(t('cannotSaveSubCategory'));
            } else if (error.response.status === 401) {
                toast.error(t('demoModeLogin'));
            } else if (error.response.status === 400 || error.response.status === 422) {
                const errorData = error.response?.data || {};
                const errorMessage = errorData.message || errorData.errors?.[0]?.msg || t('validationFailed');
                
                // Check if it's a duplicate error
                const isDuplicateError = errorMessage.toLowerCase().includes('already exists') ||
                                       errorMessage.toLowerCase().includes('duplicate') ||
                                       errorMessage.toLowerCase().includes('slug already exists') ||
                                       errorMessage.toLowerCase().includes('name already exists') ||
                                       errorMessage.toLowerCase().includes('subcategory with this slug') ||
                                       errorMessage.toLowerCase().includes('subcategory with this name');
                
                if (isDuplicateError) {
                    // Check if error message is generic (doesn't mention parent context)
                    const isGenericError = !errorMessage.toLowerCase().includes('same parent') && 
                                         !errorMessage.toLowerCase().includes('parent') &&
                                         !errorMessage.toLowerCase().includes('under');
                    
                    if (formData.parent_id) {
                        // Sub-subcategory: duplicates should be allowed under different parents
                        if (isGenericError) {
                            // Generic error - backend might still have global uniqueness check
                            toast.error(
                                `⚠️ ${errorMessage}\n\n` +
                                `Note: With composite unique constraints (name, parent_id), duplicates should be allowed under different parent subcategories.\n` +
                                `If you're creating this under a different parent, the backend may need to be updated to use composite constraints.`,
                                { duration: 8000 }
                            );
                        } else {
                            // Specific error about same parent - expected behavior
                            toast.error(
                                `A subcategory with this name or slug already exists under the same parent subcategory.\n` +
                                `💡 You can use the same name/slug under a different parent subcategory.`,
                                { duration: 6000 }
                            );
                        }
                    } else {
                        // Top-level subcategory - global uniqueness is expected
                        toast.error(
                            `A top-level subcategory with this name or slug already exists.\n` +
                            `💡 Tip: Create this as a sub-subcategory under a parent to allow duplicates under different parents.`,
                            { duration: 5000 }
                        );
                    }
                } else {
                    toast.error(errorMessage);
                }
            } else {
                const errorMessage = error.response?.data?.message || t('failedToSaveSubCategory');
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-indigo-200/50 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] animate-fade-in">
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex-shrink-0">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                        {subCategory ? t('editSubCategory') : t('addSubCategory')}
                    </h2>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <LanguageSwitcher variant="compact" onGradient={true} />
                        <button 
                            onClick={onClose} 
                            className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-all duration-200"
                            aria-label="Close"
                        >
                            <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50/50">

                            {/* Category Selection - Required */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    {t('category')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleChange}
                                    className="input-modern w-full"
                                    required
                                >
                                    <option value="">{t('selectCategory')}</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Parent SubCategory Selection - Optional (for nested subcategories) */}
                            {formData.category_id && (
                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        {t('parentSubCategory')} <span className="text-gray-500 text-xs font-normal">{t('optional')}</span>
                                    </label>
                                    {loadingParents ? (
                                        <div className="input-modern text-gray-500 w-full">{t('loadingParentOptions')}</div>
                                    ) : availableParents.length > 0 ? (
                                        <>
                                            <select
                                                name="parent_id"
                                                value={formData.parent_id}
                                                onChange={handleChange}
                                                className="input-modern w-full"
                                            >
                                                <option value="">{t('noneTopLevel')}</option>
                                                {availableParents.map(parent => (
                                                    <option key={parent.id} value={parent.id}>
                                                        {parent.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-gray-500 mt-2 px-1">
                                                {formData.parent_id 
                                                    ? (
                                                        <>
                                                            ✓ {t('nestedSubCategoryNote')}
                                                            <br />
                                                            <span className="text-blue-600 font-medium">
                                                                💡 Duplicate names/slugs are allowed under different parent subcategories.
                                                            </span>
                                                        </>
                                                    )
                                                    : t('topLevelSubCategoryNote')}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <select
                                                name="parent_id"
                                                value=""
                                                disabled
                                                className="input-modern bg-gray-100 text-gray-400 cursor-not-allowed w-full"
                                            >
                                                <option value="">{t('noneNoParents')}</option>
                                            </select>
                                            <p className="text-xs text-amber-600 mt-2 px-1">
                                                {t('noTopLevelSubCategories')}
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    {t('name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="input-modern w-full"
                                    required
                                />
                                {formData.parent_id && (
                                    <p className="text-xs text-blue-600 mt-2 px-1">
                                        💡 <strong>Note:</strong> You can use the same name for sub-subcategories under different parent subcategories.
                                    </p>
                                )}
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    {t('slug')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    className="input-modern font-mono w-full"
                                    required
                                />
                                {formData.parent_id && (
                                    <p className="text-xs text-blue-600 mt-2 px-1">
                                        💡 <strong>Note:</strong> You can use the same slug for sub-subcategories under different parent subcategories.
                                    </p>
                                )}
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    {t('description')}
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    className="input-modern resize-none w-full"
                                    placeholder={t('enterSubCategoryDescription')}
                                />
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    {t('sortOrder')}
                                </label>
                                <input
                                    type="number"
                                    name="sort_order"
                                    value={formData.sort_order}
                                    onChange={handleChange}
                                    min="0"
                                    className="input-modern w-full"
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-500 mt-2 px-1">{t('sortOrderHint')}</p>
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
                                    {t('active')}
                                </label>
                            </div>

                        </div>
                    </div>

                    {/* Fixed Footer with Action Buttons - Always at bottom */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-white flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold text-gray-700 text-sm sm:text-base"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-indigo-500 disabled:hover:via-purple-500 disabled:hover:to-pink-500 text-sm sm:text-base"
                        >
                            {loading ? t('saving') : t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubCategoryModal;
