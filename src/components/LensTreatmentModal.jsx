import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const LensTreatmentModal = ({ lensTreatment, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'scratch_proof',
    description: '',
    price: '',
    icon: '',
    is_active: true,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lensTreatment) {
      setFormData({
        name: lensTreatment.name || '',
        slug: lensTreatment.slug || '',
        type: lensTreatment.type || 'scratch_proof',
        description: lensTreatment.description || '',
        price: lensTreatment.price || '',
        icon: lensTreatment.icon || '',
        is_active: lensTreatment.is_active !== undefined ? lensTreatment.is_active : true,
        sort_order: lensTreatment.sort_order !== null && lensTreatment.sort_order !== undefined ? lensTreatment.sort_order : 0,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        type: 'scratch_proof',
        description: '',
        price: '',
        icon: '',
        is_active: true,
        sort_order: 0,
      });
    }
  }, [lensTreatment]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!lensTreatment && formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, lensTreatment]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : parseFloat(value) || '') : value;
    
    setFormData({ ...formData, [name]: fieldValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Please enter a name');
      return;
    }
    
    setLoading(true);

    try {
      // Auto-generate slug if not provided
      let slug = formData.slug;
      if (!slug && formData.name) {
        slug = formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      
      if (!slug) {
        toast.error('Please enter a slug or name');
        setLoading(false);
        return;
      }
      
      // Prepare data with proper types
      const submitData = {
        name: formData.name,
        slug: slug,
        type: formData.type,
        description: formData.description || null,
        price: parseFloat(formData.price) || 0,
        icon: formData.icon || null,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order, 10) || 0,
      };
      
      let response;
      if (lensTreatment) {
        response = await api.put(API_ROUTES.ADMIN.LENS_TREATMENTS.UPDATE(lensTreatment.id), submitData);
        // Handle response structure: { success, message, data: { lensTreatment: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Lens treatment updated successfully');
        } else {
          toast.success('Lens treatment updated successfully');
        }
      } else {
        response = await api.post(API_ROUTES.ADMIN.LENS_TREATMENTS.CREATE, submitData);
        // Handle response structure: { success, message, data: { lensTreatment: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Lens treatment created successfully');
        } else {
          toast.success('Lens treatment created successfully');
        }
      }
      onClose();
    } catch (error) {
      console.error('Lens treatment save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save lens treatment');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to save lens treatments');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save lens treatment';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">
            {lensTreatment ? 'Edit Lens Treatment' : 'Add Lens Treatment'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              placeholder="e.g., Scratch Proof"
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
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              placeholder="e.g., scratch-proof (auto-generated from name)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">URL-friendly identifier (auto-generated if left empty)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="scratch_proof">Scratch Proof</option>
              <option value="anti_glare">Anti Glare</option>
              <option value="blue_light_anti_glare">Blue Light Anti Glare</option>
              <option value="uv_protection">UV Protection</option>
              <option value="photochromic">Photochromic</option>
              <option value="polarized">Polarized</option>
              <option value="hydrophobic">Hydrophobic</option>
              <option value="oleophobic">Oleophobic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., 30.00"
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
              placeholder="e.g., Protects lenses from scratches and daily wear"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon URL
            </label>
            <input
              type="url"
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com/icons/scratch-proof.svg"
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
              placeholder="0"
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

export default LensTreatmentModal;

