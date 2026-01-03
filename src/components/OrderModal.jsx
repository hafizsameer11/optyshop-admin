import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiDollarSign, FiXCircle, FiUser, FiPackage } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';
import { 
  sendOrderStatusUpdateEmail, 
  sendOrderRefundEmail, 
  sendTechnicianAssignmentEmail,
  sendOrderCancellationEmail
} from '../utils/emailService';
import AdminOrderTransactionsList from './admin/OrderTransactionsList';

const OrderModal = ({ order, onClose }) => {
  const { t } = useI18n();
  const isCreateMode = !order;
  const [orderData, setOrderData] = useState(order);
  const [status, setStatus] = useState(order?.status || '');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [technicianId, setTechnicianId] = useState('');
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('requested_by_customer');

  // Create mode form data
  const [formData, setFormData] = useState({
    user_id: '',
    items: [{ 
      product_id: '', 
      quantity: 1, 
      lens_index: '', 
      lens_coatings: [],
      prescription_id: null,
      lens_type: '',
      prescription_data: null,
      progressive_variant_id: null,
      lens_thickness_material_id: null,
      lens_thickness_option_id: null,
      treatment_ids: [],
      photochromic_color_id: null,
      prescription_sun_color_id: null,
      unit_price: ''
    }],
    prescription_id: '',
    shipping_address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    },
    billing_address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    },
    payment_method: 'stripe',
    notes: ''
  });

  // Fetch full order details when modal opens (only for existing orders)
  useEffect(() => {
    if (order?.id && !isCreateMode) {
      fetchOrderDetails();
    }
  }, [order?.id, isCreateMode]);

  const fetchOrderDetails = async () => {
    const orderId = orderData?.id || order?.id;
    if (!orderId) return;

    try {
      setFetching(true);
      // Use admin endpoint for admin panel
      const response = await api.get(API_ROUTES.ADMIN.ORDERS.BY_ID(orderId));
      console.log('Order details API Response:', response.data);

      // Handle response structure: { success, message, data: { order: {...} } }
      const orderDetails = response.data?.data?.order || response.data?.order || response.data;
      if (orderDetails) {
        setOrderData(orderDetails);
        setStatus(orderDetails.status);
      }
    } catch (error) {
      console.error('Order details fetch error:', error);
      // Keep the original order data if fetch fails
    } finally {
      setFetching(false);
    }
  };

  const handleStatusUpdate = async () => {
    const orderId = orderData?.id || order?.id;
    if (!orderId) return;

    setLoading(true);
    const previousStatus = orderData?.status;
    try {
      const response = await api.put(API_ROUTES.ORDERS.UPDATE_STATUS(orderId), { status });
      // Handle response structure: { success, message, data: { order: {...} } }
      if (response.data?.success) {
        toast.success(response.data.message || 'Order status updated successfully');
      } else {
        toast.success('Order status updated successfully');
      }
      // Update local order data
      const updatedOrder = response.data?.data?.order;
      if (updatedOrder) {
        setOrderData(updatedOrder);
        setStatus(updatedOrder.status);
        
        // Send email notification if status changed
        if (previousStatus !== updatedOrder.status) {
          try {
            await sendOrderStatusUpdateEmail(updatedOrder, previousStatus);
          } catch (emailError) {
            console.warn('Failed to send status update email:', emailError);
            // Don't show error to user - email failure shouldn't block the action
          }
        }
      }
      onClose();
    } catch (error) {
      console.error('Order update error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot update order');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to update orders');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to update order status';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    const orderId = orderData?.id || order?.id;
    if (!orderId) return;

    setLoading(true);
    try {
      const response = await api.put(API_ROUTES.ORDERS.CANCEL(orderId));
      // Handle response structure: { message, data: { order: {...} } }
      if (response.data?.message) {
        toast.success(response.data.message);
      } else {
        toast.success('Order cancelled successfully');
      }
      // Update local order data
      const cancelledOrder = response.data?.data?.order;
      if (cancelledOrder) {
        setOrderData(cancelledOrder);
        setStatus(cancelledOrder.status);
        
        // Extract cancellation reason from notes if available
        const notes = cancelledOrder.notes || '';
        const cancellationMatch = notes.match(/Cancelled:\s*(.+)/i);
        const cancellationReason = cancellationMatch ? cancellationMatch[1].trim() : null;
        
        // Send email notification
        try {
          await sendOrderCancellationEmail(cancelledOrder, cancellationReason);
        } catch (emailError) {
          console.warn('Failed to send cancellation email:', emailError);
          // Don't show error to user - email failure shouldn't block the action
        }
      }
      onClose();
    } catch (error) {
      console.error('Order cancel error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot cancel order');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to cancel orders');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to cancel order';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    setRefundModalOpen(true);
  };

  const processRefund = async () => {
    const orderId = orderData?.id || order?.id;
    if (!orderId) return;

    setLoading(true);
    try {
      const refundData = {
        reason: refundReason,
      };
      
      // If amount is provided, it's a partial refund
      if (refundAmount && parseFloat(refundAmount) > 0) {
        refundData.amount = parseFloat(refundAmount);
      }
      // Otherwise, it's a full refund

      const response = await api.post(API_ROUTES.ORDERS.REFUND(orderId), refundData);
      // Handle response structure: { success, message, data: { order: {...}, refund: {...}, transaction: {...} } }
      if (response.data?.success) {
        toast.success(response.data.message || 'Refund processed successfully');
      } else {
        toast.success('Refund processed successfully');
      }
      
      // Update local order data
      const updatedOrder = response.data?.data?.order;
      if (updatedOrder) {
        setOrderData(updatedOrder);
        setStatus(updatedOrder.status);
        
        // Get refund amount from response or form
        const actualRefundAmount = response.data?.data?.refund?.amount || refundAmount || updatedOrder.total;
        
        // Send email notification
        try {
          await sendOrderRefundEmail(updatedOrder, actualRefundAmount, refundReason);
        } catch (emailError) {
          console.warn('Failed to send refund email:', emailError);
          // Don't show error to user - email failure shouldn't block the action
        }
      }
      
      // Reset refund form
      setRefundAmount('');
      setRefundReason('requested_by_customer');
      setRefundModalOpen(false);
      
      // Refresh order details to show new transaction
      fetchOrderDetails();
    } catch (error) {
      console.error('Order refund error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot refund order');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to refund orders');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to process refund';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTechnician = async () => {
    if (!technicianId || !window.confirm(`Assign technician ID ${technicianId} to this order?`)) return;

    const orderId = orderData?.id || order?.id;
    if (!orderId) return;

    setLoading(true);
    try {
      const response = await api.put(API_ROUTES.ORDERS.ASSIGN_TECHNICIAN(orderId), {
        technician_id: parseInt(technicianId, 10)
      });
      // Handle response structure
      if (response.data?.success || response.data?.message) {
        toast.success(response.data.message || 'Technician assigned successfully');
      } else {
        toast.success('Technician assigned successfully');
      }
      
      // Refresh order data
      const updatedOrder = response.data?.data?.order;
      if (updatedOrder) {
        setOrderData(updatedOrder);
        
        // Extract technician information from notes if available
        const notes = updatedOrder.notes || '';
        const technicianMatch = notes.match(/Assigned to technician:\s*([^(]+)\s*\(ID:\s*(\d+)\)/);
        const technician = technicianMatch ? {
          name: technicianMatch[1].trim(),
          id: parseInt(technicianMatch[2], 10)
        } : { id: parseInt(technicianId, 10) };
        
        // Send email notification
        try {
          await sendTechnicianAssignmentEmail(updatedOrder, technician);
        } catch (emailError) {
          console.warn('Failed to send technician assignment email:', emailError);
          // Don't show error to user - email failure shouldn't block the action
        }
      } else {
        fetchOrderDetails();
      }
    } catch (error) {
      console.error('Assign technician error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot assign technician');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to assign technician';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data for API
      const submitData = {
        user_id: parseInt(formData.user_id, 10),
        items: formData.items
          .filter(item => item.product_id)
          .map(item => ({
            product_id: parseInt(item.product_id, 10),
            quantity: parseInt(item.quantity, 10),
            lens_index: item.lens_index ? parseFloat(item.lens_index) : undefined,
            lens_coatings: item.lens_coatings || []
          })),
        shipping_address: formData.shipping_address,
        payment_method: formData.payment_method,
      };

      // Add optional fields
      if (formData.prescription_id) {
        submitData.prescription_id = parseInt(formData.prescription_id, 10);
      }
      if (formData.billing_address.street) {
        submitData.billing_address = formData.billing_address;
      }
      if (formData.notes) {
        submitData.notes = formData.notes;
      }

      const response = await api.post(API_ROUTES.ORDERS.CREATE, submitData);

      // Handle response structure: { success, message, data: { order: {...} } }
      if (response.data?.success) {
        toast.success(response.data.message || 'Order created successfully');
      } else {
        toast.success('Order created successfully');
      }
      onClose();
    } catch (error) {
      console.error('Create order error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot create order');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials to create orders');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to create order';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('shipping_') || name.startsWith('billing_')) {
      const [prefix, field] = name.split('_');
      setFormData({
        ...formData,
        [`${prefix}_address`]: {
          ...formData[`${prefix}_address`],
          [field]: value
        }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { 
        product_id: '', 
        quantity: 1, 
        lens_index: '', 
        lens_coatings: [],
        prescription_id: null,
        lens_type: '',
        prescription_data: null,
        progressive_variant_id: null,
        lens_thickness_material_id: null,
        lens_thickness_option_id: null,
        treatment_ids: [],
        photochromic_color_id: null,
        prescription_sun_color_id: null,
        unit_price: ''
      }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
              {isCreateMode ? t('createNewOrder') : `${t('orderId')} #${orderData?.id || order?.id}`}
            </h2>
            {!isCreateMode && orderData?.order_number && (
              <p className="text-sm text-gray-500 mt-1">{t('orderNumber')}: {orderData.order_number}</p>
            )}
          </div>
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

        {isCreateMode ? (
          <form onSubmit={handleCreateOrder} className="p-6 space-y-5">
            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('userId')} *
              </label>
              <input
                type="number"
                name="user_id"
                value={formData.user_id}
                onChange={handleFormChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Order Items */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('orderItems')} *
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  + {t('addItem')}
                </button>
              </div>
              {formData.items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 mb-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{t('item')} {index + 1}</h4>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        {t('remove')}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('product')} ID *
                      </label>
                      <input
                        type="number"
                        value={item.product_id}
                        onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('quantity')} *
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        min="1"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('lensIndex')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.lens_index}
                        onChange={(e) => handleItemChange(index, 'lens_index', e.target.value)}
                        placeholder="e.g., 1.61"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('lensCoatings')} (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={item.lens_coatings?.join(', ') || ''}
                        onChange={(e) => handleItemChange(index, 'lens_coatings', e.target.value.split(',').map(c => c.trim()).filter(c => c))}
                        placeholder="e.g., ar, blue_light"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('prescriptionId')} ({t('optional')})
                      </label>
                      <input
                        type="number"
                        value={item.prescription_id || ''}
                        onChange={(e) => handleItemChange(index, 'prescription_id', e.target.value || null)}
                        placeholder="Prescription ID"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('lensType')} ({t('optional')})
                      </label>
                      <select
                        value={item.lens_type || ''}
                        onChange={(e) => handleItemChange(index, 'lens_type', e.target.value || null)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">{t('selectLanguage')}...</option>
                        <option value="single_vision">Single Vision</option>
                        <option value="progressive">Progressive</option>
                        <option value="bifocal">Bifocal</option>
                        <option value="reading">Reading</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('progressiveVariant')} ID ({t('optional')})
                      </label>
                      <input
                        type="number"
                        value={item.progressive_variant_id || ''}
                        onChange={(e) => handleItemChange(index, 'progressive_variant_id', e.target.value || null)}
                        placeholder="Progressive Variant ID"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('lensThicknessMaterial')} ID ({t('optional')})
                      </label>
                      <input
                        type="number"
                        value={item.lens_thickness_material_id || ''}
                        onChange={(e) => handleItemChange(index, 'lens_thickness_material_id', e.target.value || null)}
                        placeholder="Material ID"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('lensThicknessOption')} ID ({t('optional')})
                      </label>
                      <input
                        type="number"
                        value={item.lens_thickness_option_id || ''}
                        onChange={(e) => handleItemChange(index, 'lens_thickness_option_id', e.target.value || null)}
                        placeholder="Option ID"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('treatments')} IDs (comma-separated, {t('optional')})
                      </label>
                      <input
                        type="text"
                        value={Array.isArray(item.treatment_ids) ? item.treatment_ids.join(', ') : ''}
                        onChange={(e) => handleItemChange(index, 'treatment_ids', e.target.value.split(',').map(id => id.trim()).filter(id => id).map(id => parseInt(id, 10)).filter(id => !isNaN(id)))}
                        placeholder="e.g., 1, 2, 3"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('photochromicColor')} ID ({t('optional')})
                      </label>
                      <input
                        type="number"
                        value={item.photochromic_color_id || ''}
                        onChange={(e) => handleItemChange(index, 'photochromic_color_id', e.target.value || null)}
                        placeholder="Photochromic Color ID"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('prescriptionSunColor')} ID ({t('optional')})
                      </label>
                      <input
                        type="number"
                        value={item.prescription_sun_color_id || ''}
                        onChange={(e) => handleItemChange(index, 'prescription_sun_color_id', e.target.value || null)}
                        placeholder="Prescription Sun Color ID"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('unitPrice')} ({t('optional')})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price || ''}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value || null)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('prescriptionData')} (JSON, {t('optional')})
                      </label>
                      <textarea
                        value={item.prescription_data ? JSON.stringify(item.prescription_data, null, 2) : ''}
                        onChange={(e) => {
                          try {
                            const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                            handleItemChange(index, 'prescription_data', parsed);
                          } catch (err) {
                            // Invalid JSON, don't update
                          }
                        }}
                        placeholder='{"pd": 64, "od": {"sph": -2.0, "cyl": -0.5, "axis": 90}, "os": {"sph": -2.0, "cyl": -0.5, "axis": 90}}'
                        rows="4"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-xs"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter valid JSON or leave empty</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Prescription ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('prescriptionIdOptional')}
              </label>
              <input
                type="number"
                name="prescription_id"
                value={formData.prescription_id}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">{t('shippingAddress')} *</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('street')}</label>
                  <input
                    type="text"
                    name="shipping_street"
                    value={formData.shipping_address.street}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('city')}</label>
                  <input
                    type="text"
                    name="shipping_city"
                    value={formData.shipping_address.city}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('state')}</label>
                  <input
                    type="text"
                    name="shipping_state"
                    value={formData.shipping_address.state}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('zipCode')}</label>
                  <input
                    type="text"
                    name="shipping_zip"
                    value={formData.shipping_address.zip}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('country')}</label>
                  <input
                    type="text"
                    name="shipping_country"
                    value={formData.shipping_address.country}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Billing Address (Optional) */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">{t('billingAddressOptional')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('street')}</label>
                  <input
                    type="text"
                    name="billing_street"
                    value={formData.billing_address.street}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('city')}</label>
                  <input
                    type="text"
                    name="billing_city"
                    value={formData.billing_address.city}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('state')}</label>
                  <input
                    type="text"
                    name="billing_state"
                    value={formData.billing_address.state}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('zipCode')}</label>
                  <input
                    type="text"
                    name="billing_zip"
                    value={formData.billing_address.zip}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('country')}</label>
                  <input
                    type="text"
                    name="billing_country"
                    value={formData.billing_address.country}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('paymentMethod')} *
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleFormChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('notes')} {t('optional')}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Additional notes..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {loading ? t('saving') : t('createOrder')}
              </button>
            </div>
          </form>
        ) : fetching ? (
          <div className="p-6 text-center">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Order Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FiUser className="mr-2" />
                  {t('customerInformation')}
                </h3>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-lg border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{t('userId')}:</span>
                    <span className="text-sm text-gray-900 font-mono bg-white px-3 py-1 rounded-md">#{orderData?.user_id || t('nA')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{t('email')}:</span>
                    <span className="text-sm text-gray-900">{orderData?.user?.email || <span className="text-gray-400 italic">{t('nA')}</span>}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{t('phone')}:</span>
                    <span className="text-sm text-gray-900">{orderData?.user?.phone || <span className="text-gray-400 italic">{t('nA')}</span>}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('orderDetails')}</h3>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-lg border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{t('date')}:</span>
                    <span className="text-sm text-gray-900">
                      {orderData?.created_at ? new Date(orderData.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      }) : <span className="text-gray-400 italic">{t('nA')}</span>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{t('status')}:</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${orderData?.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        orderData?.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          orderData?.status === 'refunded' ? 'bg-orange-100 text-orange-800' :
                            orderData?.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                              orderData?.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                      }`}>
                      {orderData?.status || t('nA')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{t('paymentStatus')}:</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${orderData?.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        orderData?.payment_status === 'refunded' ? 'bg-orange-100 text-orange-800' :
                          orderData?.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                      }`}>
                      {orderData?.payment_status || t('nA')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{t('paymentMethod')}:</span>
                    <span className="text-sm text-gray-900 font-medium capitalize">{orderData?.payment_method || <span className="text-gray-400 italic">{t('nA')}</span>}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FiDollarSign className="mr-2" />
                {t('pricingBreakdown')}
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">{t('subtotal')}:</span>
                  <span className="font-semibold text-gray-900">${parseFloat(orderData?.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">{t('tax')}:</span>
                  <span className="font-semibold text-gray-900">${parseFloat(orderData?.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">{t('shipping')}:</span>
                  <span className="font-semibold text-gray-900">${parseFloat(orderData?.shipping || 0).toFixed(2)}</span>
                </div>
                {orderData?.discount && parseFloat(orderData.discount) > 0 && (
                  <div className="flex justify-between items-center text-sm text-red-600">
                    <span className="font-medium">{t('discount')}:</span>
                    <span className="font-bold">-${parseFloat(orderData.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-base font-bold border-t-2 border-blue-300 pt-3 mt-2">
                  <span className="text-gray-900">{t('total')}:</span>
                  <span className="text-indigo-700 text-lg">${parseFloat(orderData?.total || orderData?.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Flow Status */}
            {orderData?.id && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Flow Status</h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="space-y-4">
                    {/* Step 1: Order Created */}
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        orderData?.id ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {orderData?.id ? '✓' : '○'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Order Created</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {orderData?.created_at ? new Date(orderData.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                          }) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Payment Intent Created */}
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        orderData?.payment_id || orderData?.payment_method !== 'pending' 
                          ? 'bg-green-500 text-white border-green-600' 
                          : 'bg-gray-200 text-gray-500 border-gray-300'
                      }`}>
                        {orderData?.payment_id || orderData?.payment_method !== 'pending' ? '✓' : '○'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Payment Intent Created</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {orderData?.payment_method === 'stripe' ? 'Stripe Payment Intent' : 
                           orderData?.payment_method === 'paypal' ? 'PayPal Payment' :
                           orderData?.payment_method === 'cod' ? 'Cash on Delivery' : 
                           orderData?.payment_method ? `${orderData.payment_method.charAt(0).toUpperCase() + orderData.payment_method.slice(1)} Payment` : 'N/A'}
                        </p>
                        {orderData?.payment_id && (
                          <p className="text-xs text-gray-400 font-mono mt-1">
                            ID: {orderData.payment_id}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Payment Status */}
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        orderData?.payment_status === 'paid' 
                          ? 'bg-green-500 text-white border-green-600' :
                        orderData?.payment_status === 'refunded'
                          ? 'bg-orange-500 text-white border-orange-600' :
                        orderData?.payment_status === 'failed'
                          ? 'bg-red-500 text-white border-red-600' :
                          'bg-gray-200 text-gray-500 border-gray-300'
                      }`}>
                        {orderData?.payment_status === 'paid' ? '✓' : 
                         orderData?.payment_status === 'refunded' ? '↻' : 
                         orderData?.payment_status === 'failed' ? '✕' : '○'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Payment Status</p>
                        <p className="text-xs text-gray-600 mt-1">
                          <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                            orderData?.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            orderData?.payment_status === 'refunded' ? 'bg-orange-100 text-orange-800' :
                            orderData?.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {orderData?.payment_status || 'pending'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Step 4: Transaction Recorded */}
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        orderData?.payment_status === 'paid' || orderData?.payment_status === 'refunded' 
                          ? 'bg-green-500 text-white border-green-600' 
                          : 'bg-gray-200 text-gray-500 border-gray-300'
                      }`}>
                        {orderData?.payment_status === 'paid' || orderData?.payment_status === 'refunded' ? '✓' : '○'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Transaction Recorded</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {orderData?.payment_status === 'paid' || orderData?.payment_status === 'refunded' 
                            ? 'Transaction automatically created' : 'Waiting for payment confirmation'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Transactions */}
            {orderData?.id && (
              <div className="mt-6">
                <AdminOrderTransactionsList 
                  orderId={orderData.id}
                  orderTotal={orderData?.total || orderData?.total_amount || 0}
                  onTransactionUpdate={fetchOrderDetails}
                />
              </div>
            )}

            {/* Shipping & Billing Addresses */}
            {(orderData?.shipping_address || orderData?.billing_address) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Address */}
                {orderData?.shipping_address && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('shippingAddress')}</h3>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-lg border border-green-200 shadow-sm">
                      <div className="space-y-1 text-sm text-gray-700">
                        {orderData.shipping_address.street && (
                          <p className="font-medium">{orderData.shipping_address.street}</p>
                        )}
                        <p>
                          {orderData.shipping_address.city && `${orderData.shipping_address.city}, `}
                          {orderData.shipping_address.state} {orderData.shipping_address.zip}
                        </p>
                        {orderData.shipping_address.country && (
                          <p className="font-semibold text-gray-900">{orderData.shipping_address.country}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing Address */}
                {orderData?.billing_address && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('billingAddress')}</h3>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200 shadow-sm">
                      <div className="space-y-1 text-sm text-gray-700">
                        {orderData.billing_address.street && (
                          <p className="font-medium">{orderData.billing_address.street}</p>
                        )}
                        <p>
                          {orderData.billing_address.city && `${orderData.billing_address.city}, `}
                          {orderData.billing_address.state} {orderData.billing_address.zip}
                        </p>
                        {orderData.billing_address.country && (
                          <p className="font-semibold text-gray-900">{orderData.billing_address.country}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiPackage className="mr-2" />
                {t('orderItems')} {orderData?.items && `(${orderData.items.length})`}
              </h3>
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('product')}</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('quantity')}</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('unitPrice')}</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('total')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderData?.items && orderData.items.length > 0 ? (
                      orderData.items.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm">
                            <div className="space-y-2">
                              <div className="font-semibold text-gray-900">{item.product_name || item.product?.name || 'Product'}</div>
                              {item.lens_index && (
                                <div className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                  {t('lensIndex')}: {item.lens_index}
                                </div>
                              )}
                              {item.lens_coatings && item.lens_coatings.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {item.lens_coatings.map((coating, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
                                      {coating}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {/* Lens Configuration Details */}
                              {(item.lens_type || item.prescription_data || item.progressive_variant_id || item.lens_thickness_material_id || item.lens_thickness_option_id || item.treatment_ids || item.photochromic_color_id || item.prescription_sun_color_id) && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide">{t('lensConfiguration')}</div>
                                  <div className="grid grid-cols-1 gap-2">
                                    {item.lens_type && (
                                      <div className="flex items-center text-xs">
                                        <span className="font-semibold text-gray-700 w-24">{t('lensType')}:</span>
                                        <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-medium">
                                          {item.lens_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                      </div>
                                    )}
                                    {item.prescription_id && (
                                      <div className="flex items-center text-xs">
                                        <span className="font-semibold text-gray-700 w-24">{t('prescriptionId')}:</span>
                                        <span className="text-gray-600">#{item.prescription_id}</span>
                                      </div>
                                    )}
                                    {item.progressiveVariant && (
                                      <div className="flex items-center text-xs">
                                        <span className="font-semibold text-gray-700 w-24">{t('progressiveVariant')}:</span>
                                        <span className="px-2 py-1 rounded bg-green-50 text-green-700 font-medium">
                                          {item.progressiveVariant.name} {item.progressiveVariant.price && `($${item.progressiveVariant.price})`}
                                        </span>
                                      </div>
                                    )}
                                    {item.lensThicknessMaterial && (
                                      <div className="flex items-center text-xs">
                                        <span className="font-semibold text-gray-700 w-24">{t('lensThicknessMaterial')}:</span>
                                        <span className="text-gray-600">{item.lensThicknessMaterial.name}</span>
                                      </div>
                                    )}
                                    {item.lensThicknessOption && (
                                      <div className="flex items-center text-xs">
                                        <span className="font-semibold text-gray-700 w-24">{t('lensThicknessOption')}:</span>
                                        <span className="text-gray-600">{item.lensThicknessOption.name}</span>
                                      </div>
                                    )}
                                    {item.treatment_ids && Array.isArray(item.treatment_ids) && item.treatment_ids.length > 0 && (
                                      <div className="flex items-center text-xs">
                                        <span className="font-semibold text-gray-700 w-24">{t('treatments')}:</span>
                                        <div className="flex flex-wrap gap-1">
                                          {item.treatment_ids.map((treatmentId, idx) => (
                                            <span key={idx} className="px-2 py-1 rounded bg-yellow-50 text-yellow-700 text-xs font-medium">
                                              #{treatmentId}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {item.photochromicColor && (
                                      <div className="flex items-center text-xs">
                                        <span className="font-semibold text-gray-700 w-24">{t('photochromicColor')}:</span>
                                        <span className="px-2 py-1 rounded bg-pink-50 text-pink-700 font-medium">
                                          {item.photochromicColor.name}
                                        </span>
                                      </div>
                                    )}
                                    {item.prescriptionSunColor && (
                                      <div className="flex items-center text-xs">
                                        <span className="font-semibold text-gray-700 w-24">{t('prescriptionSunColor')}:</span>
                                        <span className="px-2 py-1 rounded bg-orange-50 text-orange-700 font-medium">
                                          {item.prescriptionSunColor.name}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {/* Prescription Data */}
                                  {item.prescription_data && typeof item.prescription_data === 'object' && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 bg-gray-50 rounded-md p-2">
                                      <div className="text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide">{t('prescriptionData')}</div>
                                      <div className="grid grid-cols-2 gap-2">
                                        {item.prescription_data.pd && (
                                          <div className="text-xs">
                                            <span className="font-semibold text-gray-700">{t('binocularPD')}:</span>
                                            <span className="ml-1 text-gray-600">{item.prescription_data.pd}mm</span>
                                          </div>
                                        )}
                                        {item.prescription_data.pd_right && (
                                          <div className="text-xs">
                                            <span className="font-semibold text-gray-700">{t('pdRight')}:</span>
                                            <span className="ml-1 text-gray-600">{item.prescription_data.pd_right}mm</span>
                                          </div>
                                        )}
                                        {item.prescription_data.pd_left && (
                                          <div className="text-xs">
                                            <span className="font-semibold text-gray-700">{t('pdLeft')}:</span>
                                            <span className="ml-1 text-gray-600">{item.prescription_data.pd_left}mm</span>
                                          </div>
                                        )}
                                        {item.prescription_data.h && (
                                          <div className="text-xs">
                                            <span className="font-semibold text-gray-700">{t('height')}:</span>
                                            <span className="ml-1 text-gray-600">{item.prescription_data.h}mm</span>
                                          </div>
                                        )}
                                        {item.prescription_data.year_of_birth && (
                                          <div className="text-xs">
                                            <span className="font-semibold text-gray-700">{t('yearOfBirth')}:</span>
                                            <span className="ml-1 text-gray-600">{item.prescription_data.year_of_birth}</span>
                                          </div>
                                        )}
                                      </div>
                                      {(item.prescription_data.od || item.prescription_data.os) && (
                                        <div className="mt-2 pt-2 border-t border-gray-300">
                                          <div className="grid grid-cols-2 gap-3">
                                            {item.prescription_data.od && (
                                              <div className="bg-white rounded p-2">
                                                <div className="text-xs font-bold text-gray-800 mb-1">{t('rightEye')} (OD)</div>
                                                <div className="space-y-1">
                                                  {item.prescription_data.od.sph && (
                                                    <div className="text-xs text-gray-600">Sph: <span className="font-medium">{item.prescription_data.od.sph}</span></div>
                                                  )}
                                                  {item.prescription_data.od.cyl && (
                                                    <div className="text-xs text-gray-600">Cyl: <span className="font-medium">{item.prescription_data.od.cyl}</span></div>
                                                  )}
                                                  {item.prescription_data.od.axis && (
                                                    <div className="text-xs text-gray-600">Axis: <span className="font-medium">{item.prescription_data.od.axis}°</span></div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                            {item.prescription_data.os && (
                                              <div className="bg-white rounded p-2">
                                                <div className="text-xs font-bold text-gray-800 mb-1">{t('leftEye')} (OS)</div>
                                                <div className="space-y-1">
                                                  {item.prescription_data.os.sph && (
                                                    <div className="text-xs text-gray-600">Sph: <span className="font-medium">{item.prescription_data.os.sph}</span></div>
                                                  )}
                                                  {item.prescription_data.os.cyl && (
                                                    <div className="text-xs text-gray-600">Cyl: <span className="font-medium">{item.prescription_data.os.cyl}</span></div>
                                                  )}
                                                  {item.prescription_data.os.axis && (
                                                    <div className="text-xs text-gray-600">Axis: <span className="font-medium">{item.prescription_data.os.axis}°</span></div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Contact Lens Details */}
                              {item.contact_lens_details && (
                                <div className="mt-3 pt-3 border-t border-gray-200 bg-blue-50 rounded-md p-3">
                                  <div className="text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide">Contact Lens Details</div>
                                  <div className="grid grid-cols-2 gap-3">
                                    {item.contact_lens_details.right_eye && (
                                      <div className="bg-white rounded p-2">
                                        <div className="text-xs font-bold text-gray-800 mb-2">Right Eye</div>
                                        <div className="space-y-1">
                                          {Object.entries(item.contact_lens_details.right_eye)
                                            .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                                            .map(([key, value]) => (
                                              <div key={key} className="text-xs text-gray-600">
                                                <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span>
                                                <span className="ml-1 font-medium">{value}</span>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    )}
                                    {item.contact_lens_details.left_eye && (
                                      <div className="bg-white rounded p-2">
                                        <div className="text-xs font-bold text-gray-800 mb-2">Left Eye</div>
                                        <div className="space-y-1">
                                          {Object.entries(item.contact_lens_details.left_eye)
                                            .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                                            .map(([key, value]) => (
                                              <div key={key} className="text-xs text-gray-600">
                                                <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span>
                                                <span className="ml-1 font-medium">{value}</span>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {item.contact_lens_details.astigmatism && (
                                    <div className="mt-2 pt-2 border-t border-blue-200">
                                      <div className="bg-white rounded p-2">
                                        <div className="text-xs font-bold text-gray-800 mb-2">Astigmatism</div>
                                        <div className="grid grid-cols-2 gap-2">
                                          {Object.entries(item.contact_lens_details.astigmatism)
                                            .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                                            .map(([key, value]) => (
                                              <div key={key} className="text-xs text-gray-600">
                                                <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span>
                                                <span className="ml-1 font-medium">{value}</span>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                            {item.product_sku || item.product?.sku || <span className="text-gray-400 italic">{t('nA')}</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-semibold">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                            ${parseFloat(item.unit_price || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-bold">
                            ${parseFloat(item.total_price || item.unit_price * item.quantity || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-4 text-center text-sm text-gray-500">
                          {t('noData')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prescription Details */}
            {orderData?.prescription && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('prescriptionDetails')}</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">{t('type')}:</span> {orderData.prescription?.prescription_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || t('nA')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">OD {t('sphere')}:</span> {orderData.prescription?.od_sphere || t('nA')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">OS {t('sphere')}:</span> {orderData.prescription?.os_sphere || t('nA')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">{t('binocularPD')}:</span> {orderData.prescription?.pd_binocular || t('nA')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">{t('verified')}:</span>{' '}
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${orderData.prescription?.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {orderData.prescription?.is_verified ? t('yes') : t('no')}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            {orderData?.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('notes')}</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{orderData.notes}</p>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              {orderData?.shipped_at && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('shippedAt')}</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm">{new Date(orderData.shipped_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {orderData?.delivered_at && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('deliveredAt')}</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm">{new Date(orderData.delivered_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('updateStatus')}</h3>
                <div className="flex gap-4">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="pending">{t('pending')}</option>
                    <option value="processing">{t('processing')}</option>
                    <option value="shipped">{t('shipped')}</option>
                    <option value="delivered">{t('delivered')}</option>
                    <option value="cancelled">{t('cancelled')}</option>
                    <option value="refunded">{t('refunded')}</option>
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={loading || status === orderData?.status}
                    className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                  >
                    {loading ? t('updating') : t('updateStatus')}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('assignTechnician')}</h3>
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={technicianId}
                    onChange={(e) => setTechnicianId(e.target.value)}
                    placeholder="Technician ID"
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAssignTechnician}
                    disabled={loading || !technicianId}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    <FiUser />
                    Assign
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                {orderData?.status !== 'cancelled' && orderData?.status !== 'refunded' && (
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <FiXCircle />
                    {t('cancelOrder')}
                  </button>
                )}
                {orderData?.payment_status !== 'refunded' && orderData?.status !== 'cancelled' && (
                  <button
                    onClick={handleRefund}
                    disabled={loading}
                    className="flex-1 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <FiDollarSign />
                    {t('processRefund')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Refund Modal */}
        {refundModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{t('processRefund')}</h2>
                  <button
                    onClick={() => {
                      setRefundModalOpen(false);
                      setRefundAmount('');
                      setRefundReason('requested_by_customer');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('refundAmount')} ({t('refundAmountPlaceholder')})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={orderData?.total || orderData?.total_amount || 0}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder={`Max: $${orderData?.total || orderData?.total_amount || '0.00'}`}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {refundAmount ? `${t('partialRefund')}: $${refundAmount}` : t('fullRefundWillBeProcessed')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('refundReason')} *
                    </label>
                    <select
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="requested_by_customer">Requested by Customer</option>
                      <option value="duplicate">Duplicate</option>
                      <option value="fraudulent">Fraudulent</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setRefundModalOpen(false);
                        setRefundAmount('');
                        setRefundReason('requested_by_customer');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={processRefund}
                      disabled={loading}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                    >
                      {loading ? t('processing') : t('processRefund')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default OrderModal;



