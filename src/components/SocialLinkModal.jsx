import React, { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Other' },
];

const emptyForm = {
  platform: 'instagram',
  url: '',
  label: '',
  sort_order: 0,
  is_active: true,
};

const SocialLinkModal = ({ link, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (link) {
      setFormData({
        platform: link.platform || 'instagram',
        url: link.url || '',
        label: link.label || '',
        sort_order: link.sort_order ?? 0,
        is_active: link.is_active !== undefined ? link.is_active : true,
      });
    } else {
      setFormData(emptyForm);
    }
  }, [link]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.url?.trim()) {
      toast.error('URL obbligatoria');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        platform: formData.platform,
        url: formData.url.trim(),
        label: formData.label?.trim() || null,
        sort_order: formData.sort_order || 0,
        is_active: formData.is_active,
      };

      if (link?.id) {
        await api.put(API_ROUTES.ADMIN.SOCIAL_LINKS.UPDATE(link.id), payload);
        toast.success('Link aggiornato');
      } else {
        await api.post(API_ROUTES.ADMIN.SOCIAL_LINKS.CREATE, payload);
        toast.success('Link creato');
      }
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Salvataggio non riuscito');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {link ? 'Modifica link social' : 'Aggiungi link social'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Piattaforma *</label>
            <select
              name="platform"
              value={formData.platform}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
            <input
              name="url"
              type="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etichetta (opzionale)</label>
            <input
              name="label"
              value={formData.label}
              onChange={handleChange}
              placeholder="es. Instagram OptiShop"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordine</label>
            <input
              name="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Attivo (visibile nel footer)
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SocialLinkModal;
