import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiStar } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import TestimonialModal from '../components/TestimonialModal';
import { API_ROUTES } from '../config/apiRoutes';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.CMS.TESTIMONIALS.LIST);
      // API response structure: { success: true, message: "...", data: { testimonials: [...] } }
      const testimonialsData = response.data?.data?.testimonials || response.data?.testimonials || [];
      setTestimonials(Array.isArray(testimonialsData) ? testimonialsData : []);
    } catch (error) {
      console.error('Testimonials API error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot fetch testimonials');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        toast.error('Failed to fetch testimonials');
      }
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestimonial = () => {
    setSelectedTestimonial(null);
    setModalOpen(true);
  };

  const handleEdit = (testimonial) => {
    setSelectedTestimonial(testimonial);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) {
      return;
    }

    try {
      await api.delete(API_ROUTES.CMS.TESTIMONIALS.DELETE(id));
      toast.success('Testimonial deleted successfully');
      fetchTestimonials();
    } catch (error) {
      console.error('Testimonial delete error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot delete testimonial');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete testimonial';
        toast.error(errorMessage);
      }
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <FiStar
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
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
        <h1 className="text-3xl font-bold text-gray-900">Testimonials</h1>
        <button
          onClick={handleAddTestimonial}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FiPlus />
          <span>Add Testimonial</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Text
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sort Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {testimonials.map((testimonial) => (
                <tr key={testimonial.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{testimonial.customer_name}</div>
                    {testimonial.avatar_url && (
                      <div className="text-xs text-gray-500 mt-1">Has avatar</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                    {testimonial.text ? (testimonial.text.length > 60 ? `${testimonial.text.substring(0, 60)}...` : testimonial.text) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStars(testimonial.rating || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {testimonial.sort_order || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        testimonial.is_featured
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {testimonial.is_featured ? 'Featured' : 'Regular'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEdit(testimonial)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                      title="Edit testimonial"
                    >
                      <FiEdit2 />
                    </button>
                    <button 
                      onClick={() => handleDelete(testimonial.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete testimonial"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {testimonials.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No testimonials found. Click "Add Testimonial" to create one.</p>
          </div>
        )}
      </div>

      {modalOpen && (
        <TestimonialModal
          testimonial={selectedTestimonial}
          onClose={() => {
            setModalOpen(false);
            setSelectedTestimonial(null);
          }}
          onSuccess={fetchTestimonials}
        />
      )}
    </div>
  );
};

export default Testimonials;

