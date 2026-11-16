import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import { confirmDelete } from '../utils/confirmIt';
import ContactLocationModal from '../components/ContactLocationModal';

const ContactLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.ADMIN.CONTACT_LOCATIONS.LIST);
      const list =
        response.data?.data?.locations ||
        response.data?.locations ||
        [];
      setLocations(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Contact locations fetch error:', error);
      toast.error('Failed to fetch contact locations');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleDelete = async (item) => {
    if (!confirmDelete(item.title || 'questa sede')) return;
    try {
      await api.delete(API_ROUTES.ADMIN.CONTACT_LOCATIONS.DELETE(item.id));
      toast.success('Location deleted');
      fetchLocations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete location');
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
          <h1 className="text-3xl font-bold text-gray-900">Contact Locations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage locations shown on the Contact Us page
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
          <span>Add Location</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtitle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locations.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.subtitle || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{item.phone || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.email || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.sort_order}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.is_active ? 'Active' : 'Inactive'}
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
                      title="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {locations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No locations yet. Click &quot;Add Location&quot; to create one.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ContactLocationModal
          location={selected}
          onClose={() => {
            setIsModalOpen(false);
            setSelected(null);
          }}
          onSuccess={fetchLocations}
        />
      )}
    </div>
  );
};

export default ContactLocations;
