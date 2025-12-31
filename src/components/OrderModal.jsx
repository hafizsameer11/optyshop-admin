import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiDollarSign, FiXCircle, FiUser } from 'react-icons/fi';
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
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
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('customerInformation')}</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">{t('userId')}:</span> {orderData?.user_id || t('nA')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">{t('email')}:</span> {orderData?.user?.email || t('nA')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">{t('phone')}:</span> {orderData?.user?.phone || t('nA')}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('orderDetails')}</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">{t('date')}:</span>{' '}
                    {orderData?.created_at ? new Date(orderData.created_at).toLocaleDateString() : t('nA')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">{t('status')}:</span>{' '}
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${orderData?.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        orderData?.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          orderData?.status === 'refunded' ? 'bg-orange-100 text-orange-800' :
                            orderData?.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                              orderData?.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                      }`}>
                      {orderData?.status || t('nA')}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">{t('paymentStatus')}:</span>{' '}
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${orderData?.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        orderData?.payment_status === 'refunded' ? 'bg-orange-100 text-orange-800' :
                          orderData?.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                      }`}>
                      {orderData?.payment_status || t('nA')}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">{t('paymentMethod')}:</span> {orderData?.payment_method || t('nA')}
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">{t('pricingBreakdown')}</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('subtotal')}:</span>
                  <span>${orderData?.subtotal || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('tax')}:</span>
                  <span>${orderData?.tax || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('shipping')}:</span>
                  <span>${orderData?.shipping || '0.00'}</span>
                </div>
                {orderData?.discount && parseFloat(orderData.discount) > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>{t('discount')}:</span>
                    <span>-${orderData.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t pt-2">
                  <span>{t('total')}:</span>
                  <span>${orderData?.total || orderData?.total_amount || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Payment Flow Status */}
            {orderData?.id && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Flow Status</h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="space-y-3">
                    {/* Step 1: Order Created */}
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        orderData?.id ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        ✓
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Order Created</p>
                        <p className="text-xs text-gray-600">
                          {orderData?.created_at ? new Date(orderData.created_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Payment Intent */}
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        orderData?.payment_status !== 'pending' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {orderData?.payment_status !== 'pending' ? '✓' : '○'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Payment Intent Created</p>
                        <p className="text-xs text-gray-600">
                          {orderData?.payment_method === 'stripe' ? 'Stripe Payment Intent' : 
                           orderData?.payment_method === 'paypal' ? 'PayPal Payment' :
                           orderData?.payment_method === 'cod' ? 'Cash on Delivery' : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Step 3: Payment Confirmed */}
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        orderData?.payment_status === 'paid' ? 'bg-green-500 text-white' : 
                        orderData?.payment_status === 'refunded' ? 'bg-orange-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {orderData?.payment_status === 'paid' ? '✓' : 
                         orderData?.payment_status === 'refunded' ? '↻' : '○'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Payment Status</p>
                        <p className="text-xs text-gray-600">
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

                    {/* Step 4: Transaction Created */}
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        orderData?.payment_status === 'paid' || orderData?.payment_status === 'refunded' 
                          ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {orderData?.payment_status === 'paid' || orderData?.payment_status === 'refunded' ? '✓' : '○'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Transaction Recorded</p>
                        <p className="text-xs text-gray-600">
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

            {/* Shipping Address */}
            {orderData?.shipping_address && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('shippingAddress')}</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm">
                    {orderData.shipping_address.street}<br />
                    {orderData.shipping_address.city}, {orderData.shipping_address.state} {orderData.shipping_address.zip}<br />
                    {orderData.shipping_address.country}
                  </p>
                </div>
              </div>
            )}

            {/* Billing Address */}
            {orderData?.billing_address && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('billingAddress')}</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm">
                    {orderData.billing_address.street}<br />
                    {orderData.billing_address.city}, {orderData.billing_address.state} {orderData.billing_address.zip}<br />
                    {orderData.billing_address.country}
                  </p>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">{t('orderItems')}</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('product')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('quantity')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('unitPrice')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orderData?.items && orderData.items.length > 0 ? (
                      orderData.items.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="px-4 py-2 text-sm">
                            <div>
                              <div className="font-medium">{item.product_name || item.product?.name || 'Product'}</div>
                              {item.lens_index && (
                                <div className="text-xs text-gray-500">{t('lensIndex')}: {item.lens_index}</div>
                              )}
                              {item.lens_coatings && item.lens_coatings.length > 0 && (
                                <div className="text-xs text-gray-500">
                                  {t('lensCoatings')}: {item.lens_coatings.join(', ')}
                                </div>
                              )}
                              {/* Lens Configuration Details */}
                              {(item.lens_type || item.prescription_data || item.progressive_variant_id || item.lens_thickness_material_id || item.lens_thickness_option_id || item.treatment_ids || item.photochromic_color_id || item.prescription_sun_color_id) && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <div className="text-xs font-semibold text-gray-700 mb-1">{t('lensConfiguration')}:</div>
                                  {item.lens_type && (
                                    <div className="text-xs text-gray-600 mb-1">
                                      <span className="font-medium">{t('lensType')}:</span> {item.lens_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </div>
                                  )}
                                  {item.prescription_id && (
                                    <div className="text-xs text-gray-600 mb-1">
                                      <span className="font-medium">{t('prescriptionId')}:</span> {item.prescription_id}
                                    </div>
                                  )}
                                  {item.progressiveVariant && (
                                    <div className="text-xs text-gray-600 mb-1">
                                      <span className="font-medium">{t('progressiveVariant')}:</span> {item.progressiveVariant.name} {item.progressiveVariant.price && `($${item.progressiveVariant.price})`}
                                    </div>
                                  )}
                                  {item.lensThicknessMaterial && (
                                    <div className="text-xs text-gray-600 mb-1">
                                      <span className="font-medium">{t('lensThicknessMaterial')}:</span> {item.lensThicknessMaterial.name}
                                    </div>
                                  )}
                                  {item.lensThicknessOption && (
                                    <div className="text-xs text-gray-600 mb-1">
                                      <span className="font-medium">{t('lensThicknessOption')}:</span> {item.lensThicknessOption.name}
                                    </div>
                                  )}
                                  {item.treatment_ids && Array.isArray(item.treatment_ids) && item.treatment_ids.length > 0 && (
                                    <div className="text-xs text-gray-600 mb-1">
                                      <span className="font-medium">{t('treatments')}:</span> {item.treatment_ids.join(', ')}
                                    </div>
                                  )}
                                  {item.photochromicColor && (
                                    <div className="text-xs text-gray-600 mb-1">
                                      <span className="font-medium">{t('photochromicColor')}:</span> {item.photochromicColor.name}
                                    </div>
                                  )}
                                  {item.prescriptionSunColor && (
                                    <div className="text-xs text-gray-600 mb-1">
                                      <span className="font-medium">{t('prescriptionSunColor')}:</span> {item.prescriptionSunColor.name}
                                    </div>
                                  )}
                                  {/* Prescription Data */}
                                  {item.prescription_data && typeof item.prescription_data === 'object' && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <div className="text-xs font-semibold text-gray-700 mb-1">{t('prescriptionData')}:</div>
                                      {item.prescription_data.pd && (
                                        <div className="text-xs text-gray-600 mb-1">
                                          <span className="font-medium">{t('binocularPD')}:</span> {item.prescription_data.pd}mm
                                        </div>
                                      )}
                                      {item.prescription_data.pd_right && (
                                        <div className="text-xs text-gray-600 mb-1">
                                          <span className="font-medium">{t('pdRight')}:</span> {item.prescription_data.pd_right}mm
                                        </div>
                                      )}
                                      {item.prescription_data.pd_left && (
                                        <div className="text-xs text-gray-600 mb-1">
                                          <span className="font-medium">{t('pdLeft')}:</span> {item.prescription_data.pd_left}mm
                                        </div>
                                      )}
                                      {item.prescription_data.h && (
                                        <div className="text-xs text-gray-600 mb-1">
                                          <span className="font-medium">{t('height')}:</span> {item.prescription_data.h}mm
                                        </div>
                                      )}
                                      {item.prescription_data.od && (
                                        <div className="text-xs text-gray-600 mb-1">
                                          <span className="font-medium">{t('rightEye')} (OD):</span> {item.prescription_data.od.sph && `Sph: ${item.prescription_data.od.sph}`} {item.prescription_data.od.cyl && `Cyl: ${item.prescription_data.od.cyl}`} {item.prescription_data.od.axis && `Axis: ${item.prescription_data.od.axis}`}
                                        </div>
                                      )}
                                      {item.prescription_data.os && (
                                        <div className="text-xs text-gray-600 mb-1">
                                          <span className="font-medium">{t('leftEye')} (OS):</span> {item.prescription_data.os.sph && `Sph: ${item.prescription_data.os.sph}`} {item.prescription_data.os.cyl && `Cyl: ${item.prescription_data.os.cyl}`} {item.prescription_data.os.axis && `Axis: ${item.prescription_data.os.axis}`}
                                        </div>
                                      )}
                                      {item.prescription_data.year_of_birth && (
                                        <div className="text-xs text-gray-600 mb-1">
                                          <span className="font-medium">{t('yearOfBirth')}:</span> {item.prescription_data.year_of_birth}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Contact Lens Details */}
                              {item.contact_lens_details && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <div className="text-xs font-semibold text-gray-700 mb-1">Contact Lens Details:</div>
                                  {item.contact_lens_details.right_eye && (
                                    <div className="text-xs text-gray-600 mb-1">
                                      <span className="font-medium">Right Eye:</span> {Object.entries(item.contact_lens_details.right_eye)
                                        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                                        .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
                                        .join(', ')}
                                    </div>
                                  )}
                                  {item.contact_lens_details.left_eye && (
                                    <div className="text-xs text-gray-600 mb-1">
                                      <span className="font-medium">Left Eye:</span> {Object.entries(item.contact_lens_details.left_eye)
                                        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                                        .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
                                        .join(', ')}
                                    </div>
                                  )}
                                  {item.contact_lens_details.astigmatism && (
                                    <div className="text-xs text-gray-600">
                                      <span className="font-medium">Astigmatism:</span> {Object.entries(item.contact_lens_details.astigmatism)
                                        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                                        .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
                                        .join(', ')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {item.product_sku || item.product?.sku || t('nA')}
                          </td>
                          <td className="px-4 py-2 text-sm">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm">${item.unit_price || '0.00'}</td>
                          <td className="px-4 py-2 text-sm font-medium">${item.total_price || '0.00'}</td>
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



