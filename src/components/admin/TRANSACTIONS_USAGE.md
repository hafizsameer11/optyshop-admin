# How to Use Transactions in Admin Panel

This guide explains how transactions are integrated and used throughout the admin panel.

## Overview

Transactions track all payment activities separately from orders. This allows:
- Multiple transactions per order (payments, refunds, chargebacks)
- Complete audit trail of financial activities
- Gateway fee tracking
- Net amount calculations

## Integration Points

### 1. **Orders Page** (`/orders`)

The Orders page shows payment status, but detailed transaction history is in the Order Modal.

**What you see:**
- Payment Status column (paid, pending, refunded, failed)
- Quick view of order payment state

**To see transactions:**
- Click the eye icon to open Order Modal
- Scroll to "Payment Transactions" section

### 2. **Order Modal** (`OrderModal.jsx`)

The Order Modal now includes a **Payment Transactions** section that shows:

**Features:**
- Timeline view of all transactions for the order
- Visual indicators for transaction types:
  - 💚 Payment (green, down arrow)
  - 🔴 Refund/Partial Refund/Chargeback (red, up arrow)
- Financial summary:
  - Order Total
  - Net Amount (after refunds)
  - Total Gateway Fees
- Quick links to view transaction details
- Refresh button to reload transactions

**Location in Modal:**
```
Order Details
├── Order Information
├── Pricing Breakdown
├── Payment Transactions ← NEW!
├── Shipping Address
├── Billing Address
└── Order Items
```

### 3. **Transactions Page** (`/transactions`)

Dedicated page for managing all transactions across all orders.

**Features:**
- List all transactions with filters
- View transaction details
- Update transaction status
- Create transactions manually
- Statistics dashboard
- Filter by:
  - Status (pending, completed, failed, etc.)
  - Type (payment, refund, partial_refund, etc.)
  - Payment Method (stripe, paypal, cod)
  - Order ID
  - User ID
  - Date range

**Access:**
- Sidebar → Transactions
- Or navigate to `/transactions`

### 4. **Dashboard** (`/`)

The dashboard shows transaction statistics in the overview.

## Common Workflows

### Workflow 1: View Order Payment History

1. Go to **Orders** page
2. Find the order you want to check
3. Click the **eye icon** (👁️) to open Order Modal
4. Scroll to **"Payment Transactions"** section
5. See all transactions:
   - Initial payment
   - Any refunds
   - Chargebacks
   - Net amount calculation

### Workflow 2: Process a Refund

**Option A: Via Order Modal**
1. Open Order Modal
2. Click **"Process Refund"** button
3. Enter refund amount and reason
4. System creates a new refund transaction
5. Transaction appears in Payment Transactions section

**Option B: Via Transactions Page**
1. Go to **Transactions** page
2. Filter by Order ID
3. Click **"Create Transaction"** button
4. Select type: "refund" or "partial_refund"
5. Enter amount and details
6. Transaction is created and linked to order

### Workflow 3: View All Transactions for an Order

1. Go to **Transactions** page
2. In filters, enter Order ID
3. Click search
4. See all transactions for that order

### Workflow 4: Update Transaction Status

1. Go to **Transactions** page
2. Find the transaction
3. Click **refresh icon** (🔄) to update status
4. Enter new status and gateway response
5. Order payment status updates automatically

### Workflow 5: Create Manual Transaction

1. Go to **Transactions** page
2. Click **"Create Transaction"** button
3. Fill in:
   - Order ID
   - User ID
   - Type (payment, refund, etc.)
   - Amount
   - Payment Method
   - Gateway Transaction ID (if available)
   - Gateway Fee
4. Save
5. If status is "completed", order payment status updates automatically

## Component Usage

### AdminOrderTransactionsList Component

Used in Order Modal to show transactions for a specific order.

```jsx
import AdminOrderTransactionsList from './components/admin/OrderTransactionsList';

<AdminOrderTransactionsList 
  orderId={order.id}
  orderTotal={order.total}
  onTransactionUpdate={refreshOrder}
/>
```

**Props:**
- `orderId` (number, required) - Order ID
- `orderTotal` (number, optional) - Order total for summary
- `onTransactionUpdate` (function, optional) - Callback when transactions change

## Transaction Types

| Type | Description | Icon | Color |
|------|-------------|------|-------|
| `payment` | Initial payment | ↓ | Green |
| `refund` | Full refund | ↑ | Red |
| `partial_refund` | Partial refund | ↑ | Red |
| `chargeback` | Disputed transaction | ↑ | Red |
| `reversal` | Reversed transaction | ↑ | Gray |

## Transaction Statuses

| Status | Meaning | Color |
|--------|---------|-------|
| `pending` | Created but not processed | Yellow |
| `processing` | Currently being processed | Blue |
| `completed` | Successfully completed | Green |
| `failed` | Payment failed | Red |
| `cancelled` | Cancelled before completion | Gray |
| `refunded` | Refunded | Orange |

## Financial Calculations

### Net Amount Calculation

For an order with multiple transactions:

```
Net Amount = Sum of completed payments - Sum of completed refunds/chargebacks
```

**Example:**
- Payment: +$199.99 (completed)
- Partial Refund: -$50.00 (completed)
- Net Amount: $149.99

### Gateway Fees

Gateway fees are tracked separately:
- Shown in transaction details
- Subtracted from gross amount to get net amount
- Total fees shown in order transaction summary

## Automatic Updates

When a transaction status changes:

1. **Transaction Status → "completed"** (type: payment)
   - Order `payment_status` → "paid"
   - Order `payment_id` → gateway_transaction_id

2. **Transaction Status → "completed"** (type: refund)
   - Order `payment_status` → "refunded"

3. **Transaction Status → "failed"**
   - Order `payment_status` → "failed"

## Best Practices

1. **Always check transactions before refunding**
   - View Payment Transactions section in Order Modal
   - Verify existing transactions
   - Calculate net amount

2. **Use transaction page for detailed management**
   - Better filtering options
   - View all transactions across orders
   - Update statuses with gateway responses

3. **Keep gateway responses**
   - Store full gateway response when updating status
   - Helps with troubleshooting
   - Required for audit trail

4. **Track fees separately**
   - Enter gateway fees when creating transactions
   - Net amount calculated automatically
   - Financial reports use net amounts

## Troubleshooting

### Transactions not showing in Order Modal
- Check if order has transactions
- Verify order ID is correct
- Check browser console for API errors
- Try refreshing the transactions

### Payment status not updating
- Verify transaction status is "completed"
- Check transaction type matches (payment for paid, refund for refunded)
- Refresh order details after transaction update

### Net amount calculation incorrect
- Verify all transactions are included
- Check transaction statuses (only "completed" transactions count)
- Verify amounts are correct

## API Endpoints Used

### Admin Transaction Endpoints

1. **Get All Transactions**
   ```
   GET /api/admin/transactions?orderId=123
   ```

2. **Get Transaction Details**
   ```
   GET /api/admin/transactions/:id
   ```

3. **Create Transaction**
   ```
   POST /api/admin/transactions
   ```

4. **Update Transaction Status**
   ```
   PUT /api/admin/transactions/:id/status
   ```

5. **Get Transaction Statistics**
   ```
   GET /api/admin/transactions/stats
   ```

## Summary

Transactions provide a complete financial audit trail for orders. Use:
- **Order Modal** for quick view of order transactions
- **Transactions Page** for detailed management and filtering
- **Dashboard** for overall statistics

All transaction changes automatically update order payment status, ensuring data consistency.

