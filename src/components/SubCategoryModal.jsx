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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold">
                        {subCategory ? 'Edit SubCategory' : 'Add SubCategory'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Parent Category *
                        </label>
                        <select
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Slug *
                        </label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="is_active"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                            Active
                        </label>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
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
