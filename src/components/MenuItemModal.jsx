import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const MenuItemModal = ({ item, menuId, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        label: '',
        slug: '',
        sort_order: 0,
        meta: '{}', // Stored as string for editing
    });
    const [metaKey, setMetaKey] = useState('');
    const [metaValue, setMetaValue] = useState('');
    const [metaPairs, setMetaPairs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            // Edit mode
            let metaString = '{}';
            let pairs = [];
            try {
                if (item.meta) {
                    metaString = typeof item.meta === 'string' ? item.meta : JSON.stringify(item.meta, null, 2);
                    const parsed = typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta;
                    pairs = Object.entries(parsed).map(([key, value]) => ({ key, value }));
                }
            } catch (e) {
                console.error("Error parsing item meta:", e);
            }

            setFormData({
                label: item.label || '',
                slug: item.slug || '',
                sort_order: item.sort_order || 0,
                meta: metaString,
            });
            setMetaPairs(pairs);
        } else {
            // Create mode
            setFormData({
                label: '',
                slug: '',
                sort_order: 0,
                meta: '{}',
            });
            setMetaPairs([]);
        }
    }, [item]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value,
        }));
    };

    const handleAddMeta = () => {
        if (!metaKey.trim()) return;
        setMetaPairs([...metaPairs, { key: metaKey.trim(), value: metaValue.trim() }]);
        setMetaKey('');
        setMetaValue('');
    };

    const handleRemoveMeta = (index) => {
        const newPairs = [...metaPairs];
        newPairs.splice(index, 1);
        setMetaPairs(newPairs);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.label.trim()) {
                toast.error('Label is required');
                setLoading(false);
                return;
            }

            // Construct meta object from pairs
            const metaObj = {};
            metaPairs.forEach(({ key, value }) => {
                metaObj[key] = value;
            });

            const payload = {
                menu_id: parseInt(menuId),
                label: formData.label.trim(),
                slug: formData.slug.trim() || undefined,
                sort_order: formData.sort_order,
                meta: metaObj,
            };

            let response;
            if (item) {
                response = await api.put(API_ROUTES.ADMIN.MENU_ITEMS.UPDATE(item.id), payload);
            } else {
                response = await api.post(API_ROUTES.ADMIN.MENU_ITEMS.CREATE, payload);
            }

            const msg = response.data?.message || (item ? 'Item updated successfully' : 'Item created successfully');
            toast.success(msg);
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Menu item save error:', error);
            if (!error.response) {
                toast.error('Backend unavailable - Cannot save item');
            } else {
                const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to save item';
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold">
                        {item ? 'Edit Menu Item' : 'Add Menu Item'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Label *
                        </label>
                        <input
                            type="text"
                            name="label"
                            value={formData.label}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                            placeholder="e.g., Home"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Values / Slug / URL (optional)
                        </label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="e.g., /home or https://google.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sort Order
                        </label>
                        <input
                            type="number"
                            name="sort_order"
                            value={formData.sort_order}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {/* Simple Meta/Attributes Builder */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Custom Attributes (Meta)
                        </label>
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Key (e.g. icon)"
                                    value={metaKey}
                                    onChange={(e) => setMetaKey(e.target.value)}
                                    className="flex-1 px-3 py-1 text-sm border rounded focus:ring-1 focus:ring-primary-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Value (e.g. home)"
                                    value={metaValue}
                                    onChange={(e) => setMetaValue(e.target.value)}
                                    className="flex-1 px-3 py-1 text-sm border rounded focus:ring-1 focus:ring-primary-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddMeta}
                                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                                >
                                    <FiPlus />
                                </button>
                            </div>

                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {metaPairs.map((pair, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white px-3 py-1 rounded border text-sm">
                                        <span className="truncate">
                                            <span className="font-semibold text-gray-600">{pair.key}:</span> {pair.value}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMeta(idx)}
                                            className="text-red-500 hover:text-red-700 ml-2"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {metaPairs.length === 0 && <p className="text-xs text-gray-400 text-center italic">No attributes added</p>}
                            </div>
                        </div>
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

export default MenuItemModal;
