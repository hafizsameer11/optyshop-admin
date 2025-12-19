import React, { useState, useEffect } from 'react';
import { FiX, FiCheckCircle } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import { sendPrescriptionVerificationEmail } from '../utils/emailService';
import LanguageSwitcher from './LanguageSwitcher';

const PrescriptionModal = ({ prescription, onClose }) => {
  // Admin can only view and verify/validate prescriptions from customers
  const isViewMode = true; // Always view mode for admin
  const [formData, setFormData] = useState({
    user_id: '',
    prescription_type: 'single_vision',
    od_sphere: '',
    od_cylinder: '',
    od_axis: '',
    od_add: '',
    os_sphere: '',
    os_cylinder: '',
    os_axis: '',
    os_add: '',
    pd_binocular: '',
    pd_monocular_od: '',
    pd_monocular_os: '',
    pd_near: '',
    ph_od: '',
    ph_os: '',
    doctor_name: '',
    doctor_license: '',
    prescription_date: '',
    expiry_date: '',
    notes: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    if (prescription) {
      setFormData({
        user_id: prescription.user_id || '',
        prescription_type: prescription.prescription_type || 'single_vision',
        od_sphere: prescription.od_sphere || '',
        od_cylinder: prescription.od_cylinder || '',
        od_axis: prescription.od_axis || '',
        od_add: prescription.od_add || '',
        os_sphere: prescription.os_sphere || '',
        os_cylinder: prescription.os_cylinder || '',
        os_axis: prescription.os_axis || '',
        os_add: prescription.os_add || '',
        pd_binocular: prescription.pd_binocular || '',
        pd_monocular_od: prescription.pd_monocular_od || '',
        pd_monocular_os: prescription.pd_monocular_os || '',
        pd_near: prescription.pd_near || '',
        ph_od: prescription.ph_od || '',
        ph_os: prescription.ph_os || '',
        doctor_name: prescription.doctor_name || '',
        doctor_license: prescription.doctor_license || '',
        prescription_date: prescription.prescription_date ? prescription.prescription_date.split('T')[0] : '',
        expiry_date: prescription.expiry_date ? prescription.expiry_date.split('T')[0] : '',
        notes: prescription.notes || '',
        is_active: prescription.is_active !== undefined ? prescription.is_active : true,
      });
    } else {
      setFormData({
        user_id: '',
        prescription_type: 'single_vision',
        od_sphere: '',
        od_cylinder: '',
        od_axis: '',
        od_add: '',
        os_sphere: '',
        os_cylinder: '',
        os_axis: '',
        os_add: '',
        pd_binocular: '',
        pd_monocular_od: '',
        pd_monocular_os: '',
        pd_near: '',
        ph_od: '',
        ph_os: '',
        doctor_name: '',
        doctor_license: '',
        prescription_date: '',
        expiry_date: '',
        notes: '',
        is_active: true,
      });
    }
  }, [prescription]);


  const handleVerify = async () => {
    if (!prescription?.id) return;
    
    if (!window.confirm('Are you sure you want to verify this prescription?')) return;

    setVerifying(true);
    try {
      // PUT /api/prescriptions/:id/verify (Admin endpoint)
      // Endpoint: PUT {{base_url}}/api/prescriptions/:id/verify
      // Auth: Authorization: Bearer {{admin_token}}
      // No request body required
      const response = await api.put(API_ROUTES.PRESCRIPTIONS.VERIFY(prescription.id));
      
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
      
      // Refresh prescription data
      if (verifiedPrescription) {
        setFormData({
          user_id: verifiedPrescription.user_id || '',
          prescription_type: verifiedPrescription.prescription_type || 'single_vision',
          od_sphere: verifiedPrescription.od_sphere || '',
          od_cylinder: verifiedPrescription.od_cylinder || '',
          od_axis: verifiedPrescription.od_axis || '',
          od_add: verifiedPrescription.od_add || '',
          os_sphere: verifiedPrescription.os_sphere || '',
          os_cylinder: verifiedPrescription.os_cylinder || '',
          os_axis: verifiedPrescription.os_axis || '',
          os_add: verifiedPrescription.os_add || '',
          pd_binocular: verifiedPrescription.pd_binocular || '',
          pd_monocular_od: verifiedPrescription.pd_monocular_od || '',
          pd_monocular_os: verifiedPrescription.pd_monocular_os || '',
          pd_near: verifiedPrescription.pd_near || '',
          ph_od: verifiedPrescription.ph_od || '',
          ph_os: verifiedPrescription.ph_os || '',
          doctor_name: verifiedPrescription.doctor_name || '',
          doctor_license: verifiedPrescription.doctor_license || '',
          prescription_date: verifiedPrescription.prescription_date ? verifiedPrescription.prescription_date.split('T')[0] : '',
          expiry_date: verifiedPrescription.expiry_date ? verifiedPrescription.expiry_date.split('T')[0] : '',
          notes: verifiedPrescription.notes || '',
          is_active: verifiedPrescription.is_active !== undefined ? verifiedPrescription.is_active : true,
        });
      }
      
      // Call onClose to refresh the list
      onClose();
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
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleValidate = async () => {
    setValidating(true);
    setValidationResult(null);

    try {
      // Helper function to convert string to number or null
      const toNumberOrNull = (value) => {
        if (value === '' || value === null || value === undefined) return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      };

      // Prepare validation data matching API specification from Postman collection
      // POST /api/prescriptions/validate expects: od_sphere, os_sphere, od_cylinder, os_cylinder, pd_binocular
      // Example from Postman: { "od_sphere": -2.50, "os_sphere": -2.25, "od_cylinder": -0.75, "os_cylinder": -0.50, "pd_binocular": 64 }
      // All values must be numbers (not strings or null)
      const validationData = {};

      // Helper to safely convert to number
      const toNumber = (value) => {
        if (value === '' || value === null || value === undefined) return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      };

      // Build validation data object with only valid numeric values
      const odSphere = toNumber(formData.od_sphere);
      const osSphere = toNumber(formData.os_sphere);
      const odCylinder = toNumber(formData.od_cylinder);
      const osCylinder = toNumber(formData.os_cylinder);
      const pdBinocular = toNumber(formData.pd_binocular);

      if (odSphere !== null) validationData.od_sphere = odSphere;
      if (osSphere !== null) validationData.os_sphere = osSphere;
      if (odCylinder !== null) validationData.od_cylinder = odCylinder;
      if (osCylinder !== null) validationData.os_cylinder = osCylinder;
      if (pdBinocular !== null) validationData.pd_binocular = pdBinocular;

      // POST /api/prescriptions/validate (Admin endpoint)
      // Endpoint: POST {{base_url}}/api/prescriptions/validate
      // Auth: Authorization: Bearer {{admin_token}}
      const response = await api.post(API_ROUTES.PRESCRIPTIONS.VALIDATE, validationData);
      
      // Handle response structure: { success, message, data: { valid: true } }
      const responseData = response.data?.data || response.data;
      const isValid = responseData?.valid === true;
      const message = response.data?.message || (isValid ? 'Prescription appears valid' : 'Prescription validation failed');
      
      setValidationResult({
        valid: isValid,
        message: message
      });

      if (isValid) {
        toast.success(message);
      } else {
        toast.error(message);
      }
    } catch (error) {
      console.error('Prescription validation error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot validate prescription');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to validate prescriptions');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to validate prescription';
        setValidationResult({
          valid: false,
          message: errorMessage
        });
        toast.error(errorMessage);
      }
    } finally {
      setValidating(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            View Prescription #{prescription?.id || 'N/A'}
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

        <div className="p-6 space-y-6">
          {/* User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID *
              </label>
              <input
                type="number"
                name="user_id"
                value={formData.user_id}
                readOnly
                className="w-full px-4 py-2 border rounded-lg bg-gray-50"
              />
            </div>
          </div>

          {/* Prescription Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prescription Type *
            </label>
            <select
              name="prescription_type"
              value={formData.prescription_type}
              readOnly
              disabled
              className="w-full px-4 py-2 border rounded-lg bg-gray-50"
            >
              <option value="single_vision">Single Vision</option>
              <option value="bifocal">Bifocal</option>
              <option value="progressive">Progressive</option>
              <option value="reading">Reading</option>
            </select>
          </div>

          {/* Right Eye (OD) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Right Eye (OD)</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sphere *
                </label>
                <input
                  type="number"
                  name="od_sphere"
                  value={formData.od_sphere}
                  onChange={handleChange}
                  step="0.25"
                  disabled={isViewMode}
                  className={`w-full px-4 py-2 border rounded-lg ${isViewMode ? 'bg-gray-50' : 'focus:ring-2 focus:ring-primary-500 focus:border-transparent'}`}
                  required
                  placeholder="e.g., -2.50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cylinder
                </label>
                <input
                  type="number"
                  name="od_cylinder"
                  value={formData.od_cylinder}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  placeholder="e.g., -0.75"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Axis
                </label>
                <input
                  type="number"
                  name="od_axis"
                  value={formData.od_axis}
                  onChange={handleChange}
                  min="0"
                  max="180"
                  disabled={isViewMode}
                  className={`w-full px-4 py-2 border rounded-lg ${isViewMode ? 'bg-gray-50' : 'focus:ring-2 focus:ring-primary-500 focus:border-transparent'}`}
                  placeholder="0-180"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add
                </label>
                <input
                  type="number"
                  name="od_add"
                  value={formData.od_add}
                  onChange={handleChange}
                  step="0.25"
                  disabled={isViewMode}
                  className={`w-full px-4 py-2 border rounded-lg ${isViewMode ? 'bg-gray-50' : 'focus:ring-2 focus:ring-primary-500 focus:border-transparent'}`}
                  placeholder="e.g., +2.00"
                />
              </div>
            </div>
          </div>

          {/* Left Eye (OS) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Left Eye (OS)</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sphere *
                </label>
                <input
                  type="number"
                  name="os_sphere"
                  value={formData.os_sphere}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  placeholder="e.g., -2.25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cylinder
                </label>
                <input
                  type="number"
                  name="os_cylinder"
                  value={formData.os_cylinder}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  placeholder="e.g., -0.50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Axis
                </label>
                <input
                  type="number"
                  name="os_axis"
                  value={formData.os_axis}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  placeholder="0-180"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add
                </label>
                <input
                  type="number"
                  name="os_add"
                  value={formData.os_add}
                  onChange={handleChange}
                  step="0.25"
                  disabled={isViewMode}
                  className={`w-full px-4 py-2 border rounded-lg ${isViewMode ? 'bg-gray-50' : 'focus:ring-2 focus:ring-primary-500 focus:border-transparent'}`}
                  placeholder="e.g., +2.00"
                />
              </div>
            </div>
          </div>

          {/* Pupillary Distance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Pupillary Distance (PD)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Binocular PD *
                </label>
                <input
                  type="number"
                  name="pd_binocular"
                  value={formData.pd_binocular}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  placeholder="e.g., 64"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Near PD
                </label>
                <input
                  type="number"
                  name="pd_near"
                  value={formData.pd_near}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  placeholder="e.g., 62"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monocular OD (Right)
                </label>
                <input
                  type="number"
                  name="pd_monocular_od"
                  value={formData.pd_monocular_od}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  placeholder="e.g., 32"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monocular OS (Left)
                </label>
                <input
                  type="number"
                  name="pd_monocular_os"
                  value={formData.pd_monocular_os}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  placeholder="e.g., 32"
                />
              </div>
            </div>
          </div>

          {/* Pupillary Height */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Pupillary Height (PH)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PH OD (Right)
                </label>
                <input
                  type="number"
                  name="ph_od"
                  value={formData.ph_od}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  placeholder="e.g., 22"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PH OS (Left)
                </label>
                <input
                  type="number"
                  name="ph_os"
                  value={formData.ph_os}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  placeholder="e.g., 22"
                />
              </div>
            </div>
          </div>

          {/* Doctor Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Doctor Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor Name
                </label>
                <input
                  type="text"
                  name="doctor_name"
                  value={formData.doctor_name}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  placeholder="e.g., Dr. John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor License
                </label>
                <input
                  type="text"
                  name="doctor_license"
                  value={formData.doctor_license}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  placeholder="e.g., MD12345"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prescription Date
                </label>
                <input
                  type="date"
                  name="prescription_date"
                  value={formData.prescription_date}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              readOnly
              rows="3"
              className="w-full px-4 py-2 border rounded-lg bg-gray-50"
              placeholder="Additional notes or special instructions"
            />
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className={`p-4 rounded-lg border-2 ${
              validationResult.valid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center">
                {validationResult.valid ? (
                  <FiCheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <FiX className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span className={`text-sm font-medium ${
                  validationResult.valid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.message}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center pt-2 pb-4">
            <span className="text-sm text-gray-700 mr-4">
              Status: <span className={`font-semibold ${prescription?.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                {prescription?.is_verified ? 'Verified' : 'Pending Verification'}
              </span>
            </span>
            {prescription?.is_active !== undefined && (
              <span className="text-sm text-gray-700">
                Active: <span className={`font-semibold ${prescription?.is_active ? 'text-green-600' : 'text-gray-600'}`}>
                  {prescription?.is_active ? 'Yes' : 'No'}
                </span>
              </span>
            )}
            </div>

          <div className="flex justify-between items-center pt-4 border-t">
              <button
                type="button"
                onClick={handleValidate}
              disabled={validating || verifying}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
              >
                {validating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle />
                    <span>Validate Prescription</span>
                </>
              )}
            </button>
            <div className="flex space-x-4">
              {!prescription?.is_verified && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying || validating}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center space-x-2"
                >
                  {verifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle />
                      <span>Verify Prescription</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionModal;

