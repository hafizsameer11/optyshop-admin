import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiMove } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import MenuItemModal from '../components/MenuItemModal';

const MenuItems = () => {
    const { menuId } = useParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [menuDetails, setMenuDetails] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    useEffect(() => {
        fetchMenuDetails();
        fetchItems();
    }, [menuId]);

    const fetchMenuDetails = async () => {
        try {
            // Assuming get by ID is available for menu metadata
            const response = await api.get(API_ROUTES.ADMIN.MENUS.BY_ID(menuId));
            const data = response.data?.data || response.data || {};
            setMenuDetails(data);
        } catch (error) {
            console.error("Error fetching menu details:", error);
            // Fallback name if API fails or plain structure
            setMenuDetails({ name: 'Menu Items', id: menuId });
        }
    };

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await api.get(API_ROUTES.ADMIN.MENU_ITEMS.LIST, {
                params: { menu_id: menuId }
            });
            // API: { success, message, data: [...] } or [...]
            const data = response.data?.data || response.data || [];
            const itemsList = Array.isArray(data) ? data : (data.items || []);

            // Sort in frontend if not sorted by backend
            const sorted = [...itemsList].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            setItems(sorted);
        } catch (error) {
            console.error('Menu Items API error:', error);
            toast.error('Failed to fetch menu items');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingItem(null);
        setModalOpen(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            const response = await api.delete(API_ROUTES.ADMIN.MENU_ITEMS.DELETE(id));
            toast.success(response.data?.message || 'Item deleted successfully');
            fetchItems();
        } catch (error) {
            console.error('Item delete error:', error);
            toast.error('Failed to delete item');
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
            <div className="mb-6">
                <Link to="/menus" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4 transition-colors">
                    <FiArrowLeft className="mr-2" /> Back to Menus
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{menuDetails?.name || 'Menu'} Items</h1>
                        <p className="text-gray-500 mt-1">Manage links and hierarchy for this menu</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        <FiPlus />
                        <span>Add Item</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                    Order
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Label
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Slug / URL
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Attributes
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="px-6 py-12 text-center text-gray-500"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
                                                <FiPlus size={24} />
                                            </div>
                                            <p className="font-medium text-gray-600">No items in this menu yet</p>
                                            <button onClick={handleAdd} className="mt-2 text-primary-500 hover:underline text-sm">Create your first item</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{item.sort_order}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.label}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                                            {item.slug || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {item.meta && (
                                                <div className="flex flex-wrap gap-1">
                                                    {Object.keys(typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta).slice(0, 3).map(key => (
                                                        <span key={key} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100">
                                                            {key}
                                                        </span>
                                                    ))}
                                                    {Object.keys(typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta).length > 3 && (
                                                        <span className="text-xs text-gray-400">+{Object.keys(typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta).length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="text-primary-600 hover:text-primary-900 mr-4 p-1 hover:bg-primary-50 rounded"
                                                title="Edit item"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                                                title="Delete item"
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
                <MenuItemModal
                    item={editingItem}
                    menuId={menuId}
                    onClose={() => {
                        setModalOpen(false);
                        setEditingItem(null);
                    }}
                    onSuccess={fetchItems}
                />
            )}
        </div>
    );
};

export default MenuItems;
