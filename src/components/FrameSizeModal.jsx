import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

const FrameSizeModal = ({ frameSize, onClose }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    product_id: '',
    lens_width: '',
    bridge_width: '',
    temple_length: '',
    frame_width: '',
    frame_height: '',
    size_label: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (frameSize) {
      setFormData({
        product_id: frameSize.product_id || '',
        lens_width: frameSize.lens_width || '',
        bridge_width: frameSize.bridge_width || '',
        temple_length: frameSize.temple_length || '',
        frame_width: frameSize.frame_width || '',
        frame_height: frameSize.frame_height || '',
        size_label: frameSize.size_label || '',
      });
    } else {
      setFormData({
        product_id: '',
        lens_width: '',
        bridge_width: '',
        temple_length: '',
        frame_width: '',
        frame_height: '',
        size_label: '',
      });
    }
  }, [frameSize]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Handle numeric fields - keep as string for form but validate
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data - convert empty strings to null for optional fields
      const submitData = {
        ...formData,
        frame_width: formData.frame_width === '' ? null : formData.frame_width,
        frame_height: formData.frame_height === '' ? null : formData.frame_height,
      };

      let response;
      if (frameSize) {
        response = await api.put(API_ROUTES.ADMIN.FRAME_SIZES.UPDATE(frameSize.id), submitData);
        // Handle response structure: { success, message, data: { frameSize: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Frame size updated successfully');
        } else {
          toast.success('Frame size updated successfully');
        }
      } else {
        response = await api.post(API_ROUTES.ADMIN.FRAME_SIZES.CREATE, submitData);
        // Handle response structure: { success, message, data: { frameSize: {...} } }
        if (response.data?.success) {
          toast.success(response.data.message || 'Frame size created successfully');
        } else {
          toast.success('Frame size created successfully');
        }
      }
      onClose();
    } catch (error) {
      console.error('Frame size save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save frame size');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to save frame sizes');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save frame size';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200/50 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10 flex-shrink-0">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {frameSize ? 'Edit Frame Size' : 'Add Frame Size'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product ID <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              className="input-modern"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lens Width (mm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="lens_width"
                value={formData.lens_width}
                onChange={handleChange}
                step="0.01"
                className="input-modern"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bridge Width (mm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="bridge_width"
                value={formData.bridge_width}
                onChange={handleChange}
                step="0.01"
                className="input-modern"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Temple Length (mm) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="temple_length"
              value={formData.temple_length}
              onChange={handleChange}
              step="0.01"
              className="input-modern"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Frame Width (mm)
              </label>
              <input
                type="number"
                name="frame_width"
                value={formData.frame_width}
                onChange={handleChange}
                step="0.01"
                className="input-modern"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Frame Height (mm)
              </label>
              <input
                type="number"
                name="frame_height"
                value={formData.frame_height}
                onChange={handleChange}
                step="0.01"
                className="input-modern"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Size Label <span className="text-red-500">*</span>
            </label>
            <select
              name="size_label"
              value={formData.size_label}
              onChange={handleChange}
              className="input-modern"
              required
            >
              <option value="">Select size</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
              <option value="Extra Large">Extra Large</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-modern disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FrameSizeModal;

