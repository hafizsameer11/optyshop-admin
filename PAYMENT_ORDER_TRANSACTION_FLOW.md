# Payment, Order & Transaction Flow Documentation

## Overview
This document explains how payments, orders, and transactions occur from both the **Website (Customer)** and **Admin Panel** perspectives.

---

## 🔄 Complete Flow: Website to Admin Panel

### **Step-by-Step Process:**

```
1. Customer adds items to Cart (Website)
   ↓
2. Customer creates Order (Website)
   ↓
3. Customer creates Payment Intent (Website)
   ↓
4. Customer confirms Payment (Website)
   ↓
5. Transaction is created automatically (Backend)
   ↓
6. Admin views/manages in Admin Panel
```

---

## 🌐 **WEBSITE (Customer) Flow**

### **1. ORDER CREATION**

#### **Endpoint:** `POST /api/orders`
**Auth:** `Bearer {{access_token}}` (Customer token)

**Request Body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 1,
      "lens_index": 1.61,
      "lens_coatings": ["ar", "blue_light"]
    }
  ],
  "prescription_id": 1,
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "payment_method": "stripe"
}
```

**What Happens:**
- Order is created with status: `pending`
- Order payment_status: `pending`
- Order is linked to the customer's account

**Customer Can:**
- ✅ View their orders: `GET /api/orders`
- ✅ Get order details: `GET /api/orders/:id`
- ✅ Cancel order: `PUT /api/orders/:id/cancel`

---

### **2. PAYMENT PROCESSING**

#### **Step 2a: Create Payment Intent**
**Endpoint:** `POST /api/payments/create-intent`
**Auth:** `Bearer {{access_token}}`

**Request Body:**
```json
{
  "order_id": 1,
  "amount": 199.99,
  "currency": "USD"
}
```

**Response:**
```json
{
  "client_secret": "pi_xxx_secret_xxx",
  "payment_intent_id": "pi_1234567890"
}
```

**What Happens:**
- Stripe Payment Intent is created
- Returns `client_secret` for frontend Stripe.js integration
- If amount is omitted, uses order total automatically

---

#### **Step 2b: Confirm Payment (After Stripe.js)**
**Endpoint:** `POST /api/payments/confirm`
**Auth:** `Bearer {{access_token}}`

**Request Body:**
```json
{
  "payment_intent_id": "pi_1234567890"
}
```

**What Happens:**
- Payment is confirmed with Stripe
- **Transaction is automatically created** with:
  - `type`: `payment`
  - `status`: `completed` (if successful)
  - `payment_method`: `stripe`
  - Linked to order and user
- **Order payment_status is updated** to `paid`
- **Order status** may change based on business logic

---

#### **Step 2c: Check Payment Status**
**Endpoint:** `GET /api/payments/intent/:intentId`
**Auth:** `Bearer {{access_token}}`

**What Happens:**
- Returns current status of payment intent
- Customer can check if payment is processing/completed/failed

---

### **3. TRANSACTION VIEWING (Customer)**

#### **View Transactions**
**Endpoint:** `GET /api/transactions`
**Auth:** `Bearer {{access_token}}`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (pending, processing, completed, failed, cancelled, refunded)
- `type`: Filter by type (payment, refund, partial_refund, chargeback, reversal)
- `orderId`: Filter by order ID

**What Customer Sees:**
- Only their own transactions
- Transaction details including:
  - Amount, currency
  - Payment method (stripe, paypal, cod)
  - Status and type
  - Related order information
  - Gateway transaction ID

#### **View Single Transaction**
**Endpoint:** `GET /api/transactions/:id`
**Auth:** `Bearer {{access_token}}`

**What Customer Sees:**
- Full transaction details
- Gateway response (if available)
- Receipt URL (if available)

---

## 🛠️ **ADMIN PANEL Flow**

### **1. ORDER MANAGEMENT**

#### **View All Orders**
**Endpoint:** `GET /api/admin/orders`
**Auth:** `Bearer {{admin_token}}`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by order status
- `search`: Search by order number, customer name, etc.

**What Admin Sees:**
- All orders from all customers
- Order status, payment status
- Customer information
- Order items and totals
- Shipping information

**Admin Panel:** `src/pages/Orders.jsx` ✅

---

#### **View Order Details**
**Endpoint:** `GET /api/admin/orders/:id`
**Auth:** `Bearer {{admin_token}}`

**What Admin Sees:**
- Complete order information
- All order items with details
- Customer information
- Payment and transaction history
- Shipping details
- Order timeline/status history

---

#### **Update Order Status**
**Endpoint:** `PUT /api/orders/:id/status`
**Auth:** `Bearer {{admin_token}}`

**Request Body:**
```json
{
  "status": "shipped"
}
```

**Available Statuses:**
- `pending`
- `processing`
- `shipped`
- `delivered`
- `cancelled`
- `refunded`

**What Happens:**
- Order status is updated
- Customer may receive notification (if implemented)

**Admin Panel:** Available in `OrderModal.jsx` ✅

---

#### **Process Refund**
**Endpoint:** `POST /api/orders/:id/refund`
**Auth:** `Bearer {{admin_token}}`

**Request Body:**
```json
{
  "amount": 99.99,
  "reason": "Customer requested refund"
}
```

**What Happens:**
- Refund is processed through payment gateway
- **Transaction is created** with:
  - `type`: `refund` or `partial_refund`
  - `status`: `completed`
  - Linked to original order
- Order payment_status updated to `refunded` (if full refund)
- Order status may change

**Admin Panel:** Available in `OrderModal.jsx` ✅

---

#### **Assign Technician**
**Endpoint:** `PUT /api/orders/:id/assign-technician`
**Auth:** `Bearer {{admin_token}}`

**Request Body:**
```json
{
  "technician_name": "John Doe",
  "technician_id": 5
}
```

**What Happens:**
- Technician is assigned to order
- Order tracking information updated

**Admin Panel:** Available in `OrderModal.jsx` ✅

---

### **2. TRANSACTION MANAGEMENT**

#### **View All Transactions**
**Endpoint:** `GET /api/admin/transactions`
**Auth:** `Bearer {{admin_token}}`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: pending, processing, completed, failed, cancelled, refunded
- `type`: payment, refund, partial_refund, chargeback, reversal
- `paymentMethod`: stripe, paypal, cod
- `userId`: Filter by user ID
- `orderId`: Filter by order ID
- `startDate`: Filter from date (YYYY-MM-DD)
- `endDate`: Filter to date (YYYY-MM-DD)

**What Admin Sees:**
- All transactions from all customers
- Transaction details:
  - Amount, currency
  - Payment method
  - Status and type
  - Customer information
  - Related order
  - Gateway transaction ID
  - Gateway response
  - Metadata

**Admin Panel:** `src/pages/Transactions.jsx` ✅

---

#### **View Transaction Statistics**
**Endpoint:** `GET /api/admin/transactions/stats`
**Auth:** `Bearer {{admin_token}}`

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**What Admin Sees:**
- Total transactions count
- Total revenue
- Breakdown by payment method
- Breakdown by status
- Breakdown by type
- Revenue trends

**Admin Panel:** `src/pages/Transactions.jsx` ✅ (Stats displayed)

---

#### **View Single Transaction**
**Endpoint:** `GET /api/admin/transactions/:id`
**Auth:** `Bearer {{admin_token}}`

**What Admin Sees:**
- Complete transaction details
- Full order information
- Customer information
- Gateway response (complete)
- Receipt URL
- Metadata
- Transaction history

**Admin Panel:** `src/pages/Transactions.jsx` ✅ (View modal)

---

#### **Create Transaction Manually**
**Endpoint:** `POST /api/admin/transactions`
**Auth:** `Bearer {{admin_token}}`

**Request Body:**
```json
{
  "order_id": 1,
  "user_id": 1,
  "type": "payment",
  "status": "completed",
  "payment_method": "stripe",
  "amount": 199.99,
  "currency": "USD",
  "gateway_transaction_id": "ch_1234567890",
  "gateway_response": {
    "id": "ch_1234567890",
    "status": "succeeded"
  },
  "gateway_fee": 5.99,
  "description": "Payment for order #ORD-12345",
  "metadata": {
    "source": "admin_panel",
    "notes": "Manual transaction entry"
  }
}
```

**What Happens:**
- Transaction is created manually
- If status is `completed`, order payment_status is automatically updated to `paid`
- Useful for:
  - Manual payment entries (cash, check, etc.)
  - Correcting transaction records
  - Adding missing transactions

**Admin Panel:** `src/pages/Transactions.jsx` ✅ (Create functionality)

---

#### **Update Transaction Status**
**Endpoint:** `PUT /api/admin/transactions/:id/status`
**Auth:** `Bearer {{admin_token}}`

**Request Body:**
```json
{
  "status": "completed",
  "gateway_response": {
    "id": "ch_1234567890",
    "status": "succeeded",
    "receipt_url": "https://pay.stripe.com/receipts/..."
  },
  "metadata": {
    "updated_by": "admin@example.com",
    "notes": "Payment confirmed"
  }
}
```

**What Happens:**
- Transaction status is updated
- If status becomes `completed`, order payment_status is updated to `paid`
- If status becomes `refunded`, order payment_status is updated to `refunded`
- Gateway response and metadata are updated

**Admin Panel:** `src/pages/Transactions.jsx` ✅ (Status update modal)

---

### **3. PAYMENT MANAGEMENT (Admin)**

#### **Create Refund**
**Endpoint:** `POST /api/payments/refund`
**Auth:** `Bearer {{admin_token}}`

**Request Body (Partial Refund):**
```json
{
  "transaction_id": 1,
  "amount": 50.00,
  "reason": "requested_by_customer"
}
```

**Request Body (Full Refund):**
```json
{
  "transaction_id": 1,
  "reason": "requested_by_customer"
}
```

**What Happens:**
- Refund is processed through payment gateway (Stripe)
- **New transaction is created** with:
  - `type`: `refund` (full) or `partial_refund`
  - `status`: `completed`
  - Linked to original transaction and order
- If full refund, order payment_status is updated to `refunded`
- Original transaction status may be updated

**Available Reasons:**
- `requested_by_customer`
- `duplicate`
- `fraudulent`

**Admin Panel:** Available via Transactions page ✅

---

## 📊 **Transaction Types**

### **Payment Types:**
1. **`payment`** - Initial payment for an order
2. **`refund`** - Full refund of a payment
3. **`partial_refund`** - Partial refund of a payment
4. **`chargeback`** - Chargeback from payment gateway
5. **`reversal`** - Transaction reversal

### **Transaction Statuses:**
1. **`pending`** - Transaction initiated but not completed
2. **`processing`** - Transaction is being processed
3. **`completed`** - Transaction successfully completed
4. **`failed`** - Transaction failed
5. **`cancelled`** - Transaction was cancelled
6. **`refunded`** - Transaction was refunded

---

## 🔗 **Relationships**

### **Order ↔ Transaction:**
- One order can have multiple transactions
- Transactions are linked to orders via `order_id`
- Order payment_status is automatically updated based on transaction status

### **User ↔ Transaction:**
- Transactions are linked to users via `user_id`
- Customers can only see their own transactions
- Admins can see all transactions

### **Transaction ↔ Payment Gateway:**
- Transactions store `gateway_transaction_id`
- Gateway responses are stored in `gateway_response` field
- Receipt URLs are stored when available

---

## ✅ **Integration Status**

### **Website (Customer) Endpoints:**
- ✅ Order creation: `POST /api/orders`
- ✅ Order viewing: `GET /api/orders`
- ✅ Order cancellation: `PUT /api/orders/:id/cancel`
- ✅ Payment intent creation: `POST /api/payments/create-intent`
- ✅ Payment confirmation: `POST /api/payments/confirm`
- ✅ Payment status check: `GET /api/payments/intent/:id`
- ✅ Transaction viewing: `GET /api/transactions`

### **Admin Panel Endpoints:**
- ✅ Order management: `GET /api/admin/orders` - **Integrated in `Orders.jsx`**
- ✅ Order details: `GET /api/admin/orders/:id` - **Integrated in `OrderModal.jsx`**
- ✅ Order status update: `PUT /api/orders/:id/status` - **Available in `OrderModal.jsx`**
- ✅ Order refund: `POST /api/orders/:id/refund` - **Available in `OrderModal.jsx`**
- ✅ Technician assignment: `PUT /api/orders/:id/assign-technician` - **Available in `OrderModal.jsx`**
- ✅ Transaction management: `GET /api/admin/transactions` - **Integrated in `Transactions.jsx`**
- ✅ Transaction stats: `GET /api/admin/transactions/stats` - **Integrated in `Transactions.jsx`**
- ✅ Transaction details: `GET /api/admin/transactions/:id` - **Integrated in `Transactions.jsx`**
- ✅ Create transaction: `POST /api/admin/transactions` - **Available in `Transactions.jsx`**
- ✅ Update transaction status: `PUT /api/admin/transactions/:id/status` - **Available in `Transactions.jsx`**
- ✅ Payment refund: `POST /api/payments/refund` - **Available via Transactions page**

---

## 🎯 **Key Points**

1. **Automatic Transaction Creation:**
   - When customer confirms payment, transaction is automatically created
   - No manual intervention needed for normal flow

2. **Order Payment Status Sync:**
   - Order payment_status is automatically updated when:
     - Transaction status becomes `completed` → order payment_status = `paid`
     - Transaction status becomes `refunded` → order payment_status = `refunded`

3. **Admin Capabilities:**
   - View all orders and transactions
   - Manually create transactions (for cash, check, etc.)
   - Update transaction statuses
   - Process refunds
   - Update order statuses
   - Assign technicians

4. **Customer Capabilities:**
   - Create orders
   - Make payments
   - View their own orders and transactions
   - Cancel orders (if allowed)

5. **Payment Gateway Integration:**
   - Uses Stripe for payment processing
   - Payment intents are created server-side
   - Frontend uses Stripe.js for secure payment collection
   - Gateway responses are stored for audit trail

---

## 📝 **API Routes Configuration**

All endpoints are properly configured in `src/config/apiRoutes.js`:

```javascript
// Orders
ORDERS: {
  CREATE: `/orders`,                          // USER
  LIST: `/orders`,                             // USER
  BY_ID: (id) => `/orders/${id}`,             // USER
  CANCEL: (id) => `/orders/${id}/cancel`,      // USER
  UPDATE_STATUS: (id) => `/orders/${id}/status`, // ADMIN
  REFUND: (id) => `/orders/${id}/refund`,      // ADMIN
  ASSIGN_TECHNICIAN: (id) => `/orders/${id}/assign-technician`, // ADMIN
}

// Payments
PAYMENTS: {
  CREATE_INTENT: `/payments/create-intent`,    // USER
  CONFIRM: `/payments/confirm`,               // USER
  INTENT_STATUS: (intentId) => `/payments/intent/${intentId}`, // USER
  REFUND: `/payments/refund`,                 // ADMIN
}

// Transactions
TRANSACTIONS: {
  LIST: `/transactions`,                       // USER
  BY_ID: (id) => `/transactions/${id}`,        // USER
}

// Admin Transactions
ADMIN: {
  TRANSACTIONS: {
    LIST: `/admin/transactions`,
    BY_ID: (id) => `/admin/transactions/${id}`,
    CREATE: `/admin/transactions`,
    STATS: `/admin/transactions/stats`,
    UPDATE_STATUS: (id) => `/admin/transactions/${id}/status`,
  },
  ORDERS: {
    LIST: `/admin/orders`,
    BY_ID: (id) => `/admin/orders/${id}`,
  },
}
```

---

## ✅ **Verification**

All payment, order, and transaction endpoints from the Postman collection are:
- ✅ Properly defined in `apiRoutes.js`
- ✅ Integrated in admin panel pages
- ✅ Available for customer use on website
- ✅ Properly authenticated (customer vs admin tokens)
- ✅ Documented with clear flow

**Status: FULLY INTEGRATED** ✅

