# Transactions Quick Start Guide

## How Transactions Work in Admin Panel

### 🎯 Key Concept

**Transactions** track payment activities separately from orders. One order can have multiple transactions:
- Initial payment
- Partial refunds
- Full refunds
- Chargebacks

### 📍 Where to Find Transactions

#### 1. **In Order Details (Order Modal)**
- Go to **Orders** page
- Click 👁️ icon on any order
- Scroll to **"Payment Transactions"** section
- See all transactions for that order

#### 2. **Dedicated Transactions Page**
- Click **"Transactions"** in sidebar
- Or go to `/transactions`
- View all transactions across all orders
- Filter by status, type, order ID, etc.

#### 3. **From Orders Table**
- Click 💲 icon next to any order
- Opens Transactions page filtered by that order ID

### 🔄 Common Workflows

#### View Order Payment History
```
Orders → Click 👁️ → Scroll to "Payment Transactions"
```

#### Process Refund
```
Option 1: Order Modal → "Process Refund" button
Option 2: Transactions → "Create Transaction" → Type: refund
```

#### Check Transaction Status
```
Transactions → Find transaction → Click 👁️ → View details
```

#### Update Transaction Status
```
Transactions → Find transaction → Click 🔄 → Update status
```

### 💡 What You'll See

#### In Order Modal:
- Timeline of all transactions
- Payment: +$199.99 (green)
- Refund: -$50.00 (red)
- Net Amount: $149.99
- Total Gateway Fees

#### In Transactions Page:
- Full list with filters
- Statistics dashboard
- Create/Update capabilities
- Detailed transaction information

### ⚡ Quick Tips

1. **Always check transactions before refunding**
   - See what's already been paid/refunded
   - Calculate net amount

2. **Use Transactions page for detailed management**
   - Better filtering
   - View across all orders
   - Update with gateway responses

3. **Transactions auto-update order payment status**
   - When transaction → "completed" (payment type)
   - Order payment_status → "paid"
   - When transaction → "completed" (refund type)
   - Order payment_status → "refunded"

### 📊 Transaction Types

- **Payment** 💚 - Money coming in
- **Refund** 🔴 - Money going out (full)
- **Partial Refund** 🔴 - Money going out (partial)
- **Chargeback** 🔴 - Disputed transaction
- **Reversal** ⚪ - Reversed transaction

### ✅ Transaction Statuses

- **Pending** 🟡 - Created, not processed
- **Processing** 🔵 - Being processed
- **Completed** 🟢 - Successfully completed
- **Failed** 🔴 - Payment failed
- **Cancelled** ⚪ - Cancelled
- **Refunded** 🟠 - Refunded

### 🎓 Example Scenario

**Order #123: $199.99**

1. Customer pays → Transaction #1
   - Type: payment
   - Amount: $199.99
   - Status: completed
   - Order payment_status: paid ✅

2. Customer returns item → Transaction #2
   - Type: partial_refund
   - Amount: $50.00
   - Status: completed
   - Net Amount: $149.99

**Result:** Order shows payment_status: "paid", but net amount is $149.99

### 🔗 Navigation

- **Orders** → View orders with payment status
- **Transactions** → Manage all transactions
- **Order Modal** → See transactions for specific order

---

**Need more details?** See `TRANSACTIONS_USAGE.md` for complete documentation.

