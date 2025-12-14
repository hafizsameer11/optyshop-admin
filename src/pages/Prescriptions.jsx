import React, { useState, useEffect } from 'react';
import { FiEye, FiCheckCircle } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PrescriptionModal from '../components/PrescriptionModal';
import { API_ROUTES } from '../config/apiRoutes';
import { sendPrescriptionVerificationEmail } from '../utils/emailService';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.PRESCRIPTIONS.LIST);
      console.log('Prescriptions API Response:', response.data);
      
      // Handle various response structures from the API
      // Possible formats:
      // 1. { success: true, data: { prescriptions: [...] } }
      // 2. { success: true, data: [...] }
      // 3. { prescriptions: [...] }
      // 4. [...] (direct array)
      let prescriptionsData = [];
      
      if (response.data) {
        if (response.data.data) {
          // Nested data structure
          if (Array.isArray(response.data.data)) {
            prescriptionsData = response.data.data;
          } else if (response.data.data.prescriptions && Array.isArray(response.data.data.prescriptions)) {
            prescriptionsData = response.data.data.prescriptions;
          }
        } else if (Array.isArray(response.data)) {
          // Direct array
          prescriptionsData = response.data;
        } else if (response.data.prescriptions && Array.isArray(response.data.prescriptions)) {
          prescriptionsData = response.data.prescriptions;
        }
      }
      
      console.log('Parsed prescriptions:', prescriptionsData);
      
      if (Array.isArray(prescriptionsData)) {
        setPrescriptions(prescriptionsData);
      } else {
        console.error('Prescriptions data is not an array:', prescriptionsData);
        setPrescriptions([]);
      }
    } catch (error) {
      console.error('Prescriptions API error:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to load prescriptions. Please try again.');
      // Use empty array as fallback
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (prescription) => {
    // If viewing, optionally refresh the prescription data to get latest status
    try {
      const response = await api.get(API_ROUTES.PRESCRIPTIONS.BY_ID(prescription.id));
      const prescriptionData = response.data?.data?.prescription || response.data?.prescription || response.data;
      setSelectedPrescription(prescriptionData || prescription);
    } catch (error) {
      // If fetch fails, use the existing prescription data
      console.warn('Failed to fetch updated prescription, using cached data:', error);
      setSelectedPrescription(prescription);
    }
    setModalOpen(true);
  };

  const handleVerify = async (id) => {
    try {
      // PUT /api/prescriptions/:id/verify
      const response = await api.put(API_ROUTES.PRESCRIPTIONS.VERIFY(id));
      // Handle response structure: { success, message, data: { prescription: {...} } }
      const responseData = response.data?.data || response.data;
      const verifiedPrescription = response.data?.data?.prescription || responseData?.prescription || responseData;
      const successMessage = response.data?.message || 'Prescription verified successfully';
      toast.success(successMessage);
      
      // Send email notification if prescription was verified
      if (verifiedPrescription && verifiedPrescription.is_verified) {
        try {
          await sendPrescriptionVerificationEmail(verifiedPrescription, api, API_ROUTES);
        } catch (emailError) {
          console.warn('Failed to send prescription verification email:', emailError);
          // Don't show error to user - email failure shouldn't block the action
        }
      }
      
      fetchPrescriptions();
    } catch (error) {
      console.error('Prescription verify error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot verify prescription');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to verify prescriptions');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to verify prescription';
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
        <p className="text-sm text-gray-600 mt-1">View and verify customer prescriptions</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        {prescriptions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg">No prescriptions found</p>
            <p className="text-gray-400 text-sm mt-2">Customer prescriptions will appear here once they are submitted.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OD Sphere
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OS Sphere
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PD Binocular
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prescriptions.map((prescription) => (
                  <tr key={prescription.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{prescription.id}
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prescription.user_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prescription.prescription_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prescription.od_sphere || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prescription.os_sphere || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prescription.pd_binocular || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          prescription.is_verified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {prescription.is_verified ? 'Verified' : 'Pending'}
                      </span>
                      {prescription.is_active !== undefined && (
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            prescription.is_active
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {prescription.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prescription.created_at ? new Date(prescription.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleView(prescription)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                      title="View details"
                    >
                      <FiEye />
                    </button>
                    {!prescription.is_verified && (
                      <button
                        onClick={() => handleVerify(prescription.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Verify prescription"
                      >
                        <FiCheckCircle />
                      </button>
                    )}
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && selectedPrescription && (
        <PrescriptionModal
          prescription={selectedPrescription}
          onClose={() => {
            setModalOpen(false);
            setSelectedPrescription(null);
            fetchPrescriptions();
          }}
        />
      )}
    </div>
  );
};

export default Prescriptions;
