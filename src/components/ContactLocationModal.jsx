import React, { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const emptyForm = {
  title: '',
  subtitle: '',
  address: '',
  phone: '',
  email: '',
  sort_order: 0,
  is_active: true,
};

const ContactLocationModal = ({ location, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location) {
      setFormData({
        title: location.title || '',
        subtitle: location.subtitle || '',
        address: location.address || '',
        phone: location.phone || '',
        email: location.email || '',
        sort_order: location.sort_order ?? 0,
        is_active: location.is_active !== undefined ? location.is_active : true,
      });
    } else {
      setFormData(emptyForm);
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error('Title is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle?.trim() || null,
        address: formData.address?.trim() || null,
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        sort_order: formData.sort_order || 0,
        is_active: formData.is_active,
      };

      if (location?.id) {
        await api.put(API_ROUTES.ADMIN.CONTACT_LOCATIONS.UPDATE(location.id), payload);
        toast.success('Location updated');
      } else {
        await api.post(API_ROUTES.ADMIN.CONTACT_LOCATIONS.CREATE, payload);
        toast.success('Location created');
      }
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {location ? 'Edit Location' : 'Add Location'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="EUROPE / Customer Support"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <input
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              placeholder="Headquarters / US Subsidiary"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              placeholder="One line per row"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+33 9 71 00 71 00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
              <input
                name="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 mt-5">
              <input
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Active (show on Contact Us)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-60"
            >
              {loading ? 'Saving…' : location ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactLocationModal;
