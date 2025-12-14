import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const UserModal = ({ user, onClose }) => {
  const isEditMode = !!user;
  const [formData, setFormData] = useState({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    password: '',
    role: user?.role || 'customer',
    is_active: user?.is_active !== undefined ? user.is_active : true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode) {
        // Update existing user
        const updateData = {
          role: formData.role,
          is_active: formData.is_active,
        };
        const response = await api.put(API_ROUTES.ADMIN.USERS.UPDATE(user.id), updateData);
        if (response.data?.success) {
          toast.success(response.data.message || 'User updated successfully');
        } else {
          toast.success('User updated successfully');
        }
      } else {
        // Create new user
        const createData = {
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || null,
          role: formData.role,
          is_active: formData.is_active,
        };
        const response = await api.post(API_ROUTES.ADMIN.USERS.CREATE, createData);
        if (response.data?.success) {
          toast.success(response.data.message || 'User created successfully');
        } else {
          toast.success('User created successfully');
        }
      }
      onClose();
    } catch (error) {
      console.error('User operation error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save user');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMsg = error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} user`;
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{isEditMode ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isEditMode}
              className={`w-full px-4 py-2 border rounded-lg ${isEditMode ? 'bg-gray-50' : 'focus:ring-2 focus:ring-primary-500 focus:border-transparent'}`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                disabled={isEditMode}
                className={`w-full px-4 py-2 border rounded-lg ${isEditMode ? 'bg-gray-50' : 'focus:ring-2 focus:ring-primary-500 focus:border-transparent'}`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                disabled={isEditMode}
                className={`w-full px-4 py-2 border rounded-lg ${isEditMode ? 'bg-gray-50' : 'focus:ring-2 focus:ring-primary-500 focus:border-transparent'}`}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isEditMode}
              className={`w-full px-4 py-2 border rounded-lg ${isEditMode ? 'bg-gray-50' : 'focus:ring-2 focus:ring-primary-500 focus:border-transparent'}`}
            />
          </div>

          {!isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required={!isEditMode}
                minLength={6}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
              <option value="technician">Technician</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Active Account
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

export default UserModal;



