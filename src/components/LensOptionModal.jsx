import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

const LensOptionModal = ({ lensOption, onClose }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'classic',
    description: '',
    base_price: '',
    is_active: true,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lensOption) {
      setFormData({
        name: lensOption.name || '',
        slug: lensOption.slug || '',
        type: lensOption.type || 'classic',
        description: lensOption.description || '',
        base_price: lensOption.base_price || '',
        is_active: lensOption.is_active !== undefined ? lensOption.is_active : true,
        sort_order: lensOption.sort_order || 0,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        type: 'classic',
        description: '',
        base_price: '',
        is_active: true,
        sort_order: 0,
      });
    }
  }, [lensOption]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : parseFloat(value) || '') : value;
    
    if (name === 'name' && !lensOption) {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormData({ ...formData, name: fieldValue, slug });
    } else {
      setFormData({ ...formData, [name]: fieldValue });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data matching API specification from Postman collection
      // POST /api/admin/lens-options expects: name, slug, type, description, base_price, is_active, sort_order
      // Example from Postman: { "name": "Mirror Lenses", "slug": "mirror-lenses", "type": "mirror", "description": "...", "base_price": 20.00, "is_active": true, "sort_order": 0 }
      const submitData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        type: formData.type,
        description: formData.description.trim() || null,
        base_price: parseFloat(formData.base_price) || 0,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        sort_order: parseInt(formData.sort_order) || 0,
      };

      let response;
      if (lensOption) {
        // PUT /api/admin/lens-options/:id (Admin endpoint)
        // Endpoint: PUT {{base_url}}/api/admin/lens-options/:id
        // Auth: Authorization: Bearer {{admin_token}}
        response = await api.put(API_ROUTES.ADMIN.LENS_OPTIONS.UPDATE(lensOption.id), submitData);
        toast.success(response.data?.message || 'Lens option updated successfully');
      } else {
        // POST /api/admin/lens-options (Admin endpoint)
        // Endpoint: POST {{base_url}}/api/admin/lens-options
        // Auth: Authorization: Bearer {{admin_token}}
        response = await api.post(API_ROUTES.ADMIN.LENS_OPTIONS.CREATE, submitData);
        toast.success(response.data?.message || 'Lens option created successfully');
      }
      onClose(true); // Pass true to indicate successful save
    } catch (error) {
      console.error('Lens option save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save lens option');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to create lens options');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save lens option';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {lensOption ? 'Edit Lens Option' : 'Add Lens Option'}
          </h2>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-all duration-200"
              aria-label="Close"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-modern"
                required
                placeholder="e.g., Mirror Lenses"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Slug <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="input-modern"
                required
                placeholder="e.g., mirror-lenses"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type <span className="text-red-500">*</span></label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input-modern"
                required
              >
                <option value="classic">Classic</option>
                <option value="mirror">Mirror</option>
                <option value="gradient">Gradient</option>
                <option value="polarized">Polarized</option>
                <option value="photochromic">Photochromic</option>
                <option value="prescription_sun">Prescription Sun</option>
                <option value="prescription-sun">Prescription Sun (Alt)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Base Price <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="base_price"
                value={formData.base_price}
                onChange={handleChange}
                step="0.01"
                className="input-modern"
                required
                placeholder="e.g., 20.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="input-modern"
              placeholder="Lens option description"
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

export default LensOptionModal;


