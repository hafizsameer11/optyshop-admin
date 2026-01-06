import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiExternalLink } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import CampaignModal from '../components/CampaignModal';
import { API_ROUTES } from '../config/apiRoutes';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.ADMIN.CAMPAIGNS.LIST);
      // API response structure: { success: true, message: "...", data: { campaigns: [...] } }
      const campaignsData = response.data?.data?.campaigns || response.data?.campaigns || [];
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
    } catch (error) {
      console.error('Campaigns API error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot fetch campaigns');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        toast.error('Failed to fetch campaigns');
      }
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCampaign = () => {
    setSelectedCampaign(null);
    setModalOpen(true);
  };

  const handleEdit = (campaign) => {
    setSelectedCampaign(campaign);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      await api.delete(API_ROUTES.ADMIN.CAMPAIGNS.DELETE(id));
      toast.success('Campaign deleted successfully');
      fetchCampaigns();
    } catch (error) {
      console.error('Campaign delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete campaign');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete campaign';
        toast.error(errorMessage);
      }
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedCampaign(null);
  };

  const handleModalSuccess = () => {
    fetchCampaigns();
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
        <h1 className="text-3xl font-bold text-gray-900">Marketing Campaigns</h1>
        <button
          onClick={handleAddCampaign}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Campaign</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Link URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
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
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {campaign.image_url ? (
                      <div className="relative group">
                        <img
                          src={campaign.image_url}
                          alt={campaign.name}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => window.open(campaign.image_url, '_blank')}
                          title="Click to view full image"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                        <FiImage className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{campaign.slug || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate" title={campaign.description}>
                      {campaign.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.campaign_type || (
                      <span className="text-gray-400 italic">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {campaign.link_url ? (
                      <a
                        href={campaign.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                        title={campaign.link_url}
                      >
                        <FiExternalLink className="w-4 h-4" />
                        <span className="max-w-xs truncate">View Link</span>
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400 italic">No Link</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.starts_at && campaign.ends_at ? (
                      <div>
                        <div>{new Date(campaign.starts_at).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">to</div>
                        <div>{new Date(campaign.ends_at).toLocaleDateString()}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        campaign.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {campaign.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleEdit(campaign)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors p-1.5 hover:bg-indigo-50 rounded"
                        title="Edit campaign"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(campaign.id)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1.5 hover:bg-red-50 rounded"
                        title="Delete campaign"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {campaigns.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No campaigns found. Click "Add Campaign" to create one.</p>
        </div>
      )}

      {modalOpen && (
        <CampaignModal
          campaign={selectedCampaign}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default Campaigns;
