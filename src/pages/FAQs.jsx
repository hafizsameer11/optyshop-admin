import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import FAQModal from '../components/FAQModal';

const FAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.ADMIN.FAQS.LIST);
      // API response structure: { success: true, message: "...", data: { faqs: [...] } }
      const faqsData = response.data?.data?.faqs || response.data?.faqs || [];
      setFaqs(Array.isArray(faqsData) ? faqsData : []);
    } catch (error) {
      console.error('FAQs API error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot fetch FAQs');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        toast.error('Failed to fetch FAQs');
      }
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedFaq(null);
    setIsModalOpen(true);
  };

  const handleEdit = (faq) => {
    setSelectedFaq(faq);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedFaq(null);
  };

  const handleModalSuccess = () => {
    fetchFAQs();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) {
      return;
    }

    try {
      await api.delete(API_ROUTES.ADMIN.FAQS.DELETE(id));
      toast.success('FAQ deleted successfully');
      fetchFAQs();
    } catch (error) {
      console.error('FAQ delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete FAQ');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete FAQ';
        toast.error(errorMessage);
      }
    }
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
        <h1 className="text-3xl font-bold text-gray-900">FAQs</h1>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add FAQ</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Answer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
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
              {faqs.map((faq) => (
                <tr key={faq.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {faq.question}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {faq.answer.length > 50 ? `${faq.answer.substring(0, 50)}...` : faq.answer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                      {faq.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {faq.sort_order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        faq.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {faq.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEdit(faq)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                      title="Edit FAQ"
                    >
                      <FiEdit2 />
                    </button>
                    <button 
                      onClick={() => handleDelete(faq.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete FAQ"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {faqs.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No FAQs found. Click "Add FAQ" to create one.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <FAQModal
          faq={selectedFaq}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default FAQs;

