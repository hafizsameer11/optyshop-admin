import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
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
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
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
                <tr key={campaign.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.slug || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {campaign.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.campaign_type || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.starts_at && campaign.ends_at 
                      ? `${new Date(campaign.starts_at).toLocaleDateString()} - ${new Date(campaign.ends_at).toLocaleDateString()}`
                      : 'N/A'}
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
                    <button 
                      onClick={() => handleEdit(campaign)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                      title="Edit campaign"
                    >
                      <FiEdit2 />
                    </button>
                    <button 
                      onClick={() => handleDelete(campaign.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete campaign"
                    >
                      <FiTrash2 />
                    </button>
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
