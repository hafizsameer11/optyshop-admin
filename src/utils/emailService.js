import api from './api';

/**
 * Email Service Utility
 * Sends email notifications when forms are submitted with all fields filled
 */

/**
 * Check if a backend email endpoint exists and send email
 * @param {Object} emailData - Email data object
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.html - HTML email body
 * @param {string} emailData.text - Plain text email body (optional)
 * @returns {Promise<boolean>} - Returns true if email was sent successfully
 */
export const sendEmail = async (emailData) => {
  try {
    // Try to send email via backend API endpoint
    // You can configure this endpoint in your backend
    const response = await api.post('/admin/email/send', {
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });
    
    return response.data?.success || true;
  } catch (error) {
    // If backend email endpoint doesn't exist, log and return false
    // You can integrate EmailJS or another service here
    console.warn('Email service not available:', error.message);
    
    // Alternative: Use EmailJS (uncomment and configure if needed)
    // return await sendEmailViaEmailJS(emailData);
    
    return false;
  }
};

/**
 * Format form data into email content
 * @param {Object} formData - Form data object
 * @param {string} formType - Type of form (e.g., 'Coupon')
 * @returns {Object} - Email data object with subject, html, and text
 */
export const formatFormDataForEmail = (formData, formType = 'Form') => {
  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '<em>Not provided</em>';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
        New ${formType} Submission
      </h2>
      <p style="color: #666; margin-top: 20px;">
        A new ${formType.toLowerCase()} has been submitted with all fields completed.
      </p>
      <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin-top: 20px;">
        <h3 style="color: #333; margin-top: 0;">Form Details:</h3>
        <table style="width: 100%; border-collapse: collapse;">
  `;

  Object.entries(formData).forEach(([key, value]) => {
    const label = key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    
    htmlContent += `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 10px; font-weight: bold; color: #374151; width: 40%;">
              ${label}:
            </td>
            <td style="padding: 10px; color: #6B7280;">
              ${formatValue(value)}
            </td>
          </tr>
    `;
  });

  htmlContent += `
        </table>
      </div>
      <p style="color: #666; margin-top: 20px; font-size: 12px;">
        This is an automated notification from the Admin Panel.
      </p>
    </div>
  `;

  const textContent = Object.entries(formData)
    .map(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      return `${label}: ${formatValue(value)}`;
    })
    .join('\n');

  return {
    subject: `New ${formType} Submission - All Fields Completed`,
    html: htmlContent,
    text: `New ${formType} Submission\n\n${textContent}`,
  };
};

/**
 * Send form submission email notification
 * @param {Object} formData - Form data object
 * @param {string} formType - Type of form
 * @param {string} recipientEmail - Email address to send notification to (default: admin email)
 * @returns {Promise<boolean>} - Returns true if email was sent successfully
 */
export const sendFormSubmissionEmail = async (
  formData,
  formType = 'Form',
  recipientEmail = null
) => {
  // Get recipient email from environment variable or use default
  const to = recipientEmail || 
             import.meta.env.VITE_ADMIN_EMAIL || 
             'admin@optyshop.com';

  const emailContent = formatFormDataForEmail(formData, formType);
  
  return await sendEmail({
    to,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });
};

/**
 * Parse address JSON string from API response
 * @param {string|Object} address - Address as JSON string or object
 * @returns {Object} - Parsed address object
 */
const parseAddress = (address) => {
  if (!address) return null;
  if (typeof address === 'object') return address;
  try {
    return JSON.parse(address);
  } catch (e) {
    return null;
  }
};

/**
 * Get customer email from order data
 * @param {Object} order - Order object
 * @returns {string|null} - Customer email address
 */
const getCustomerEmail = (order) => {
  // Try shipping address first
  const shippingAddress = parseAddress(order.shipping_address);
  if (shippingAddress?.email) return shippingAddress.email;
  
  // Try billing address
  const billingAddress = parseAddress(order.billing_address);
  if (billingAddress?.email) return billingAddress.email;
  
  // Try user object
  if (order.user?.email) return order.user.email;
  
  return null;
};

/**
 * Format order data for email display
 * @param {Object} order - Order object
 * @returns {Object} - Formatted order data
 */
const formatOrderForEmail = (order) => {
  const shippingAddress = parseAddress(order.shipping_address);
  const billingAddress = parseAddress(order.billing_address);
  
  return {
    orderNumber: order.order_number || `#${order.id}`,
    status: order.status || 'N/A',
    paymentStatus: order.payment_status || 'N/A',
    total: order.total || '0.00',
    subtotal: order.subtotal || '0.00',
    tax: order.tax || '0.00',
    shipping: order.shipping || '0.00',
    discount: order.discount || '0.00',
    customerName: shippingAddress 
      ? `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim()
      : order.user 
        ? `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim()
        : 'Customer',
    shippingAddress: shippingAddress,
    billingAddress: billingAddress,
    createdAt: order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A',
    items: order.items || [],
  };
};

/**
 * Send order status update email notification
 * @param {Object} order - Order object from API response
 * @param {string} previousStatus - Previous order status (optional)
 * @returns {Promise<boolean>} - Returns true if email was sent successfully
 */
export const sendOrderStatusUpdateEmail = async (order, previousStatus = null) => {
  const customerEmail = getCustomerEmail(order);
  if (!customerEmail) {
    console.warn('No customer email found for order notification');
    return false;
  }

  const orderData = formatOrderForEmail(order);
  const statusLabels = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };

  const statusLabel = statusLabels[orderData.status.toLowerCase()] || orderData.status;
  const statusColor = {
    pending: '#F59E0B',
    processing: '#3B82F6',
    shipped: '#8B5CF6',
    delivered: '#10B981',
    cancelled: '#EF4444',
    refunded: '#F97316',
  }[orderData.status.toLowerCase()] || '#6B7280';

  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Status Update</h1>
      </div>
      
      <div style="padding: 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Hello ${orderData.customerName || 'Customer'},
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Your order <strong>${orderData.orderNumber}</strong> status has been updated.
        </p>
        
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
          <p style="margin: 0; color: #6B7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
            New Status
          </p>
          <p style="margin: 10px 0 0 0; color: #111827; font-size: 24px; font-weight: bold;">
            ${statusLabel}
          </p>
        </div>
        
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #111827; margin-top: 0; font-size: 18px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Order Number:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${orderData.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Order Date:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${orderData.createdAt}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Total Amount:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">$${orderData.total}</td>
            </tr>
          </table>
        </div>
        
        ${orderData.shippingAddress ? `
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #111827; margin-top: 0; font-size: 18px;">Shipping Address</h3>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
            ${orderData.shippingAddress.first_name || ''} ${orderData.shippingAddress.last_name || ''}<br>
            ${orderData.shippingAddress.address || orderData.shippingAddress.street || ''}<br>
            ${orderData.shippingAddress.city || ''}${orderData.shippingAddress.state ? `, ${orderData.shippingAddress.state}` : ''} ${orderData.shippingAddress.zip_code || orderData.shippingAddress.zip || ''}<br>
            ${orderData.shippingAddress.country || ''}
          </p>
        </div>
        ` : ''}
        
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
          If you have any questions about your order, please don't hesitate to contact us.
        </p>
        
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 20px;">
          Thank you for your business!<br>
          <strong>OptyShop Team</strong>
        </p>
      </div>
      
      <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
          This is an automated notification. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  const textContent = `
Order Status Update

Hello ${orderData.customerName || 'Customer'},

Your order ${orderData.orderNumber} status has been updated to: ${statusLabel}

Order Details:
- Order Number: ${orderData.orderNumber}
- Order Date: ${orderData.createdAt}
- Total Amount: $${orderData.total}

${orderData.shippingAddress ? `
Shipping Address:
${orderData.shippingAddress.first_name || ''} ${orderData.shippingAddress.last_name || ''}
${orderData.shippingAddress.address || orderData.shippingAddress.street || ''}
${orderData.shippingAddress.city || ''}${orderData.shippingAddress.state ? `, ${orderData.shippingAddress.state}` : ''} ${orderData.shippingAddress.zip_code || orderData.shippingAddress.zip || ''}
${orderData.shippingAddress.country || ''}
` : ''}

If you have any questions about your order, please don't hesitate to contact us.

Thank you for your business!
OptyShop Team
  `.trim();

  return await sendEmail({
    to: customerEmail,
    subject: `Order ${orderData.orderNumber} - Status Updated to ${statusLabel}`,
    html: htmlContent,
    text: textContent,
  });
};

/**
 * Send order refund email notification
 * @param {Object} order - Order object from API response
 * @param {string} refundAmount - Refund amount (optional)
 * @param {string} refundReason - Refund reason (optional)
 * @returns {Promise<boolean>} - Returns true if email was sent successfully
 */
export const sendOrderRefundEmail = async (order, refundAmount = null, refundReason = null) => {
  const customerEmail = getCustomerEmail(order);
  if (!customerEmail) {
    console.warn('No customer email found for refund notification');
    return false;
  }

  const orderData = formatOrderForEmail(order);
  const refundAmountDisplay = refundAmount || orderData.total;

  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Refund Processed</h1>
      </div>
      
      <div style="padding: 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Hello ${orderData.customerName || 'Customer'},
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          We have processed a refund for your order <strong>${orderData.orderNumber}</strong>.
        </p>
        
        <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <p style="margin: 0; color: #92400E; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
            Refund Amount
          </p>
          <p style="margin: 10px 0 0 0; color: #78350F; font-size: 28px; font-weight: bold;">
            $${refundAmountDisplay}
          </p>
        </div>
        
        ${refundReason ? `
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #111827; margin-top: 0; font-size: 18px;">Refund Reason</h3>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
            ${refundReason}
          </p>
        </div>
        ` : ''}
        
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #111827; margin-top: 0; font-size: 18px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Order Number:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${orderData.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Original Amount:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">$${orderData.total}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Payment Method:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${order.payment_method || 'N/A'}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
          <p style="color: #065F46; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong>Important:</strong> The refund will be processed to your original payment method. 
            Please allow 5-10 business days for the refund to appear in your account.
          </p>
        </div>
        
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
          If you have any questions about this refund, please don't hesitate to contact us.
        </p>
        
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 20px;">
          Thank you for your understanding.<br>
          <strong>OptyShop Team</strong>
        </p>
      </div>
      
      <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
          This is an automated notification. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  const textContent = `
Refund Processed

Hello ${orderData.customerName || 'Customer'},

We have processed a refund for your order ${orderData.orderNumber}.

Refund Amount: $${refundAmountDisplay}

${refundReason ? `Refund Reason: ${refundReason}\n` : ''}
Order Details:
- Order Number: ${orderData.orderNumber}
- Original Amount: $${orderData.total}
- Payment Method: ${order.payment_method || 'N/A'}

Important: The refund will be processed to your original payment method. 
Please allow 5-10 business days for the refund to appear in your account.

If you have any questions about this refund, please don't hesitate to contact us.

Thank you for your understanding.
OptyShop Team
  `.trim();

  return await sendEmail({
    to: customerEmail,
    subject: `Refund Processed for Order ${orderData.orderNumber}`,
    html: htmlContent,
    text: textContent,
  });
};

/**
 * Send technician assignment email notification
 * @param {Object} order - Order object from API response
 * @param {Object} technician - Technician object with name and details (optional)
 * @returns {Promise<boolean>} - Returns true if email was sent successfully
 */
export const sendTechnicianAssignmentEmail = async (order, technician = null) => {
  const customerEmail = getCustomerEmail(order);
  if (!customerEmail) {
    console.warn('No customer email found for technician assignment notification');
    return false;
  }

  const orderData = formatOrderForEmail(order);
  const technicianName = technician?.name || technician?.first_name 
    ? `${technician.first_name || ''} ${technician.last_name || ''}`.trim()
    : technician?.id 
      ? `Technician #${technician.id}`
      : 'A technician';

  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Technician Assigned</h1>
      </div>
      
      <div style="padding: 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Hello ${orderData.customerName || 'Customer'},
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          A technician has been assigned to your order <strong>${orderData.orderNumber}</strong>.
        </p>
        
        <div style="background-color: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
          <p style="margin: 0; color: #1E40AF; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
            Assigned Technician
          </p>
          <p style="margin: 10px 0 0 0; color: #1E3A8A; font-size: 24px; font-weight: bold;">
            ${technicianName}
          </p>
        </div>
        
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #111827; margin-top: 0; font-size: 18px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Order Number:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${orderData.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Order Status:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${orderData.status}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Order Date:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${orderData.createdAt}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
          <p style="color: #065F46; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong>What's Next?</strong><br>
            Your assigned technician will be working on your order and will ensure it meets our quality standards. 
            You will receive updates as your order progresses.
          </p>
        </div>
        
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
          If you have any questions about your order, please don't hesitate to contact us.
        </p>
        
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 20px;">
          Thank you for your patience!<br>
          <strong>OptyShop Team</strong>
        </p>
      </div>
      
      <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
          This is an automated notification. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  const textContent = `
Technician Assigned

Hello ${orderData.customerName || 'Customer'},

A technician has been assigned to your order ${orderData.orderNumber}.

Assigned Technician: ${technicianName}

Order Details:
- Order Number: ${orderData.orderNumber}
- Order Status: ${orderData.status}
- Order Date: ${orderData.createdAt}

What's Next?
Your assigned technician will be working on your order and will ensure it meets our quality standards. 
You will receive updates as your order progresses.

If you have any questions about your order, please don't hesitate to contact us.

Thank you for your patience!
OptyShop Team
  `.trim();

  return await sendEmail({
    to: customerEmail,
    subject: `Technician Assigned to Order ${orderData.orderNumber}`,
    html: htmlContent,
    text: textContent,
  });
};

/**
 * Send order cancellation email notification
 * @param {Object} order - Order object from API response
 * @param {string} cancellationReason - Reason for cancellation (optional)
 * @returns {Promise<boolean>} - Returns true if email was sent successfully
 */
export const sendOrderCancellationEmail = async (order, cancellationReason = null) => {
  const customerEmail = getCustomerEmail(order);
  if (!customerEmail) {
    console.warn('No customer email found for cancellation notification');
    return false;
  }

  const orderData = formatOrderForEmail(order);

  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Order Cancelled</h1>
      </div>
      
      <div style="padding: 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Hello ${orderData.customerName || 'Customer'},
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          We regret to inform you that your order <strong>${orderData.orderNumber}</strong> has been cancelled.
        </p>
        
        <div style="background-color: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
          <p style="margin: 0; color: #991B1B; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
            Order Status
          </p>
          <p style="margin: 10px 0 0 0; color: #7F1D1D; font-size: 24px; font-weight: bold;">
            Cancelled
          </p>
        </div>
        
        ${cancellationReason ? `
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #111827; margin-top: 0; font-size: 18px;">Cancellation Reason</h3>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
            ${cancellationReason}
          </p>
        </div>
        ` : ''}
        
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #111827; margin-top: 0; font-size: 18px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Order Number:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${orderData.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Order Date:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${orderData.createdAt}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Order Amount:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">$${orderData.total}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Payment Method:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${order.payment_method || 'N/A'}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <p style="color: #92400E; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong>Refund Information:</strong><br>
            ${order.payment_status === 'paid' || order.payment_status === 'refunded' 
              ? 'If payment was already processed, a refund will be issued to your original payment method within 5-10 business days.' 
              : 'No payment was processed for this order, so no refund is necessary.'}
          </p>
        </div>
        
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
          If you have any questions about this cancellation or would like to place a new order, please don't hesitate to contact us.
        </p>
        
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 20px;">
          We apologize for any inconvenience this may have caused.<br>
          <strong>OptyShop Team</strong>
        </p>
      </div>
      
      <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
          This is an automated notification. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  const textContent = `
Order Cancelled

Hello ${orderData.customerName || 'Customer'},

We regret to inform you that your order ${orderData.orderNumber} has been cancelled.

Order Status: Cancelled

${cancellationReason ? `Cancellation Reason: ${cancellationReason}\n` : ''}
Order Details:
- Order Number: ${orderData.orderNumber}
- Order Date: ${orderData.createdAt}
- Order Amount: $${orderData.total}
- Payment Method: ${order.payment_method || 'N/A'}

Refund Information:
${order.payment_status === 'paid' || order.payment_status === 'refunded' 
  ? 'If payment was already processed, a refund will be issued to your original payment method within 5-10 business days.' 
  : 'No payment was processed for this order, so no refund is necessary.'}

If you have any questions about this cancellation or would like to place a new order, please don't hesitate to contact us.

We apologize for any inconvenience this may have caused.
OptyShop Team
  `.trim();

  return await sendEmail({
    to: customerEmail,
    subject: `Order ${orderData.orderNumber} - Cancelled`,
    html: htmlContent,
    text: textContent,
  });
};

/**
 * Get user email from prescription data
 * @param {Object} prescription - Prescription object
 * @param {Object} apiInstance - API instance (optional, for fetching user data)
 * @param {Object} apiRoutes - API routes object (optional, for fetching user data)
 * @returns {Promise<string|null>} - User email address or null
 */
const getUserEmailFromPrescription = async (prescription, apiInstance = null, apiRoutes = null) => {
  // If prescription has user object with email, use it
  if (prescription.user?.email) {
    return prescription.user.email;
  }
  
  // If we have user_id, try to fetch user data
  if (prescription.user_id) {
    try {
      // Import dynamically if not provided
      const api = apiInstance || (await import('./api')).default;
      const API_ROUTES = apiRoutes || (await import('../config/apiRoutes')).API_ROUTES;
      
      // Try to get user by listing users and finding the one with matching ID
      const response = await api.get(API_ROUTES.ADMIN.USERS.LIST);
      const usersData = response.data?.data?.users || response.data?.users || response.data || [];
      const user = Array.isArray(usersData) 
        ? usersData.find(u => u.id === prescription.user_id) 
        : (usersData.id === prescription.user_id ? usersData : null);
      
      if (user?.email) {
        return user.email;
      }
    } catch (error) {
      console.warn('Failed to fetch user email for prescription:', error);
    }
  }
  
  return null;
};

/**
 * Send prescription verification email notification
 * @param {Object} prescription - Prescription object from API response
 * @param {Object} apiInstance - API instance (optional, for fetching user data)
 * @param {Object} apiRoutes - API routes object (optional, for fetching user data)
 * @returns {Promise<boolean>} - Returns true if email was sent successfully
 */
export const sendPrescriptionVerificationEmail = async (prescription, apiInstance = null, apiRoutes = null) => {
  const userEmail = await getUserEmailFromPrescription(prescription, apiInstance, apiRoutes);
  if (!userEmail) {
    console.warn('No user email found for prescription verification notification');
    return false;
  }

  const prescriptionTypeLabels = {
    single_vision: 'Single Vision',
    bifocal: 'Bifocal',
    progressive: 'Progressive',
    reading: 'Reading',
  };

  const prescriptionType = prescriptionTypeLabels[prescription.prescription_type] || 
                          prescription.prescription_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 
                          'Prescription';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Prescription Verified</h1>
      </div>
      
      <div style="padding: 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Hello,
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Great news! Your prescription <strong>#${prescription.id}</strong> has been verified and is now active.
        </p>
        
        <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
          <p style="margin: 0; color: #065F46; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
            Verification Status
          </p>
          <p style="margin: 10px 0 0 0; color: #047857; font-size: 24px; font-weight: bold;">
            ✓ Verified
          </p>
        </div>
        
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #111827; margin-top: 0; font-size: 18px;">Prescription Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Prescription ID:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">#${prescription.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Type:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${prescriptionType}</td>
            </tr>
            ${prescription.doctor_name ? `
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Doctor:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${prescription.doctor_name}</td>
            </tr>
            ` : ''}
            ${prescription.prescription_date ? `
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Prescription Date:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${formatDate(prescription.prescription_date)}</td>
            </tr>
            ` : ''}
            ${prescription.expiry_date ? `
            <tr>
              <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Expiry Date:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${formatDate(prescription.expiry_date)}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #111827; margin-top: 0; font-size: 18px;">Prescription Values</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
            <div>
              <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 10px 0;">Right Eye (OD)</h4>
              <table style="width: 100%; font-size: 12px;">
                ${prescription.od_sphere ? `<tr><td style="color: #6B7280; padding: 4px 0;">Sphere:</td><td style="color: #111827; text-align: right; font-weight: 600;">${prescription.od_sphere}</td></tr>` : ''}
                ${prescription.od_cylinder ? `<tr><td style="color: #6B7280; padding: 4px 0;">Cylinder:</td><td style="color: #111827; text-align: right;">${prescription.od_cylinder}</td></tr>` : ''}
                ${prescription.od_axis ? `<tr><td style="color: #6B7280; padding: 4px 0;">Axis:</td><td style="color: #111827; text-align: right;">${prescription.od_axis}°</td></tr>` : ''}
                ${prescription.od_add ? `<tr><td style="color: #6B7280; padding: 4px 0;">Add:</td><td style="color: #111827; text-align: right;">${prescription.od_add}</td></tr>` : ''}
              </table>
            </div>
            <div>
              <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 10px 0;">Left Eye (OS)</h4>
              <table style="width: 100%; font-size: 12px;">
                ${prescription.os_sphere ? `<tr><td style="color: #6B7280; padding: 4px 0;">Sphere:</td><td style="color: #111827; text-align: right; font-weight: 600;">${prescription.os_sphere}</td></tr>` : ''}
                ${prescription.os_cylinder ? `<tr><td style="color: #6B7280; padding: 4px 0;">Cylinder:</td><td style="color: #111827; text-align: right;">${prescription.os_cylinder}</td></tr>` : ''}
                ${prescription.os_axis ? `<tr><td style="color: #6B7280; padding: 4px 0;">Axis:</td><td style="color: #111827; text-align: right;">${prescription.os_axis}°</td></tr>` : ''}
                ${prescription.os_add ? `<tr><td style="color: #6B7280; padding: 4px 0;">Add:</td><td style="color: #111827; text-align: right;">${prescription.os_add}</td></tr>` : ''}
              </table>
            </div>
          </div>
          ${prescription.pd_binocular ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #E5E7EB;">
            <p style="margin: 0; color: #374151; font-size: 14px;">
              <strong>Pupillary Distance (PD):</strong> ${prescription.pd_binocular} mm
            </p>
          </div>
          ` : ''}
        </div>
        
        <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
          <p style="color: #065F46; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong>What's Next?</strong><br>
            Your prescription is now verified and ready to use. You can proceed to place orders using this prescription.
          </p>
        </div>
        
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
          If you have any questions about your prescription, please don't hesitate to contact us.
        </p>
        
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 20px;">
          Thank you for choosing OptyShop!<br>
          <strong>OptyShop Team</strong>
        </p>
      </div>
      
      <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
          This is an automated notification. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  const textContent = `
Prescription Verified

Hello,

Great news! Your prescription #${prescription.id} has been verified and is now active.

Verification Status: ✓ Verified

Prescription Details:
- Prescription ID: #${prescription.id}
- Type: ${prescriptionType}
${prescription.doctor_name ? `- Doctor: ${prescription.doctor_name}\n` : ''}
${prescription.prescription_date ? `- Prescription Date: ${formatDate(prescription.prescription_date)}\n` : ''}
${prescription.expiry_date ? `- Expiry Date: ${formatDate(prescription.expiry_date)}\n` : ''}

Prescription Values:
Right Eye (OD):
${prescription.od_sphere ? `  Sphere: ${prescription.od_sphere}\n` : ''}
${prescription.od_cylinder ? `  Cylinder: ${prescription.od_cylinder}\n` : ''}
${prescription.od_axis ? `  Axis: ${prescription.od_axis}°\n` : ''}
${prescription.od_add ? `  Add: ${prescription.od_add}\n` : ''}

Left Eye (OS):
${prescription.os_sphere ? `  Sphere: ${prescription.os_sphere}\n` : ''}
${prescription.os_cylinder ? `  Cylinder: ${prescription.os_cylinder}\n` : ''}
${prescription.os_axis ? `  Axis: ${prescription.os_axis}°\n` : ''}
${prescription.os_add ? `  Add: ${prescription.os_add}\n` : ''}
${prescription.pd_binocular ? `\nPupillary Distance (PD): ${prescription.pd_binocular} mm\n` : ''}

What's Next?
Your prescription is now verified and ready to use. You can proceed to place orders using this prescription.

If you have any questions about your prescription, please don't hesitate to contact us.

Thank you for choosing OptyShop!
OptyShop Team
  `.trim();

  return await sendEmail({
    to: userEmail,
    subject: `Prescription #${prescription.id} - Verified`,
    html: htmlContent,
    text: textContent,
  });
};

export default {
  sendEmail,
  formatFormDataForEmail,
  sendFormSubmissionEmail,
  sendOrderStatusUpdateEmail,
  sendOrderRefundEmail,
  sendTechnicianAssignmentEmail,
  sendOrderCancellationEmail,
  sendPrescriptionVerificationEmail,
};

