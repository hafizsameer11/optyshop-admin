import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const SubCategoryModal = ({ subCategory, categories, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        category_id: '',
        description: '',
        is_active: true,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (subCategory) {
            setFormData({
                name: subCategory.name || '',
                slug: subCategory.slug || '',
                category_id: subCategory.category_id || '',
                description: subCategory.description || '',
                is_active: subCategory.is_active !== undefined ? subCategory.is_active : true,
            });
        } else {
            setFormData({
                name: '',
                slug: '',
                category_id: '',
                description: '',
                is_active: true,
            });
        }
    }, [subCategory]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;

        // Auto-generate slug from name (only when creating new subcategory)
        if (name === 'name' && !subCategory) {
            const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            setFormData(prev => ({ ...prev, name: fieldValue, slug }));
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
            if (!formData.category_id) {
                toast.error('Parent category is required');
                setLoading(false);
                return;
            }
            if (!formData.slug || !formData.slug.trim()) {
                toast.error('SubCategory slug is required');
                setLoading(false);
                return;
            }

            // Prepare data object
            const dataToSend = {
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                category_id: parseInt(formData.category_id),
                is_active: formData.is_active,
            };

            if (formData.description && formData.description.trim()) {
                dataToSend.description = formData.description.trim();
            }

            let response;
            // API Response: { success, message, data: { subcategory: {} } }
            if (subCategory) {
                response = await api.put(API_ROUTES.ADMIN.SUBCATEGORIES.UPDATE(subCategory.id), dataToSend);
            } else {
                response = await api.post(API_ROUTES.ADMIN.SUBCATEGORIES.CREATE, dataToSend);
            }

            // Handle response structure: { success, message, data: { subcategory: {} } }
            const successMessage = response.data?.message || (subCategory ? 'SubCategory updated successfully' : 'SubCategory created successfully');

            toast.success(successMessage);
            onClose();
        } catch (error) {
            console.error('SubCategory save error:', error);
            if (!error.response) {
                toast.error('Backend unavailable - Cannot save subcategory');
            } else if (error.response.status === 401) {
                toast.error('❌ Demo mode - Please log in with real credentials');
            } else if (error.response.status === 400 || error.response.status === 422) {
                const errorData = error.response?.data || {};
                const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
                toast.error(errorMessage);
            } else {
                const errorMessage = error.response?.data?.message || 'Failed to save subcategory';
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200/50">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                    <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                        {subCategory ? 'Edit SubCategory' : 'Add SubCategory'}
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-all duration-200"
                        aria-label="Close"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Parent Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
                            className="input-modern"
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

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input-modern"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Slug <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            className="input-modern font-mono"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="input-modern resize-none"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="is_active"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
                            Active
                        </label>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary-modern disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubCategoryModal;
