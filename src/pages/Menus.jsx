import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiList } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import MenuModal from '../components/MenuModal';

const Menus = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.ADMIN.MENUS.LIST);
      // API: { success, message, data: { menus: [...] } } or { menus: [...] }
      const data = response.data?.data || response.data || {};
      const menusData = data.menus || data || [];
      setMenus(Array.isArray(menusData) ? menusData : []);
    } catch (error) {
      console.error('Menus API error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot fetch menus');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        toast.error('Failed to fetch menus');
      }
      setMenus([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMenu(null);
    setModalOpen(true);
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu?')) return;

    try {
      const response = await api.delete(API_ROUTES.ADMIN.MENUS.DELETE(id));
      const msg = response.data?.message || 'Menu deleted successfully';
      toast.success(msg);
      fetchMenus();
    } catch (error) {
      console.error('Menu delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete menu');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const msg = error.response?.data?.message || 'Failed to delete menu';
        toast.error(msg);
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
        <h1 className="text-3xl font-bold text-gray-900">Navigation Menus</h1>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Menu</span>
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
                  Code
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
              {menus.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No navigation menus found. Click &quot;Add Menu&quot; to
                    create one.
                  </td>
                </tr>
              ) : (
                menus.map((menu) => (
                  <tr key={menu.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {menu.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {menu.code || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {menu.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${menu.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {menu.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => window.location.href = `/menus/${menu.id}/items`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Manage Items"
                      >
                        <FiList />
                      </button>
                      <button
                        onClick={() => handleEdit(menu)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        title="Edit menu"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDelete(menu.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete menu"
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
        <MenuModal
          menu={editingMenu}
          onClose={() => {
            setModalOpen(false);
            setEditingMenu(null);
          }}
          onSuccess={fetchMenus}
        />
      )}
    </div>
  );
};

export default Menus;


