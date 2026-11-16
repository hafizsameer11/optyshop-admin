import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import { confirmDelete } from '../utils/confirmIt';
import SocialLinkModal from '../components/SocialLinkModal';

const PLATFORM_LABELS = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  twitter: 'X / Twitter',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  other: 'Altro',
};

const SocialLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.ADMIN.SOCIAL_LINKS.LIST);
      const list = response.data?.data?.links || response.data?.links || [];
      setLinks(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Social links fetch error:', error);
      toast.error('Impossibile caricare i link social');
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleDelete = async (item) => {
    if (!confirmDelete(PLATFORM_LABELS[item.platform] || item.platform || 'questo link')) return;
    try {
      await api.delete(API_ROUTES.ADMIN.SOCIAL_LINKS.DELETE(item.id));
      toast.success('Link eliminato');
      fetchLinks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Eliminazione non riuscita');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Link social</h1>
          <p className="text-sm text-gray-500 mt-1">
            Solo i link attivi con URL compaiono nel footer del sito
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Aggiungi link</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Piattaforma</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etichetta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {links.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {PLATFORM_LABELS[item.platform] || item.platform}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      {item.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.label || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.sort_order}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.is_active ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(item);
                        setIsModalOpen(true);
                      }}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                      title="Modifica"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="text-red-600 hover:text-red-900"
                      title="Elimina"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {links.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nessun link. Clicca &quot;Aggiungi link&quot; per crearne uno.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <SocialLinkModal
          link={selected}
          onClose={() => {
            setIsModalOpen(false);
            setSelected(null);
          }}
          onSuccess={fetchLinks}
        />
      )}
    </div>
  );
};

export default SocialLinks;
