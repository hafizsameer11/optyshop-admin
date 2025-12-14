# Customer Transaction Components

This directory contains customer-facing transaction components for use in the website and customer dashboard.

## Components

### 1. `CustomerTransactions.jsx` (Page Component)
Full transaction history page for customers.

**Location:** `src/pages/customer/Transactions.jsx`

**Features:**
- List all customer transactions
- Filter by status, type, and order ID
- Pagination support
- View transaction details modal
- Responsive design

**Usage:**
```jsx
import CustomerTransactions from './pages/customer/Transactions';

// In your router
<Route path="/transactions" element={<CustomerTransactions />} />
```

### 2. `TransactionDetailsModal.jsx`
Modal component showing detailed transaction information.

**Location:** `src/components/customer/TransactionDetailsModal.jsx`

**Props:**
- `transaction` (object) - Transaction data
- `onClose` (function) - Callback when modal is closed

**Usage:**
```jsx
import TransactionDetailsModal from './components/customer/TransactionDetailsModal';

<TransactionDetailsModal
  transaction={selectedTransaction}
  onClose={() => setModalOpen(false)}
/>
```

### 3. `TransactionSummary.jsx`
Compact transaction summary card.

**Location:** `src/components/customer/TransactionSummary.jsx`

**Props:**
- `transaction` (object) - Transaction data
- `showOrderLink` (boolean, optional) - Show link to order (default: true)
- `compact` (boolean, optional) - Use compact layout (default: false)

**Usage:**
```jsx
import TransactionSummary from './components/customer/TransactionSummary';

// Full summary
<TransactionSummary transaction={transaction} />

// Compact version
<TransactionSummary transaction={transaction} compact />
```

### 4. `TransactionHistoryWidget.jsx`
Dashboard widget showing recent transactions.

**Location:** `src/components/customer/TransactionHistoryWidget.jsx`

**Props:**
- `limit` (number, optional) - Number of transactions to show (default: 5)

**Usage:**
```jsx
import TransactionHistoryWidget from './components/customer/TransactionHistoryWidget';

// In customer dashboard
<TransactionHistoryWidget limit={5} />
```

### 5. `OrderTransactionsList.jsx`
Shows all transactions for a specific order (handles multiple transactions per order).

**Location:** `src/components/customer/OrderTransactionsList.jsx`

**Props:**
- `orderId` (number, required) - Order ID to fetch transactions for
- `orderTotal` (number, optional) - Order total amount for summary calculation

**Features:**
- Timeline view of all transactions (payments, refunds, chargebacks)
- Calculates net amount (payments - refunds)
- Shows transaction flow with icons
- Handles multiple transaction types per order

**Usage:**
```jsx
import OrderTransactionsList from './components/customer/OrderTransactionsList';

// In order details page
<OrderTransactionsList orderId={123} orderTotal={199.99} />
```

## API Client

### `customerApi.js`
Customer API client using `access_token` (not `admin_token`).

**Location:** `src/utils/customerApi.js`

**Features:**
- Automatically attaches `Authorization: Bearer {access_token}` header
- Handles 401 errors (redirects to login)
- Retry logic for rate limiting

**Usage:**
```jsx
import customerApi from './utils/customerApi';
import { API_ROUTES } from './config/apiRoutes';

// Fetch customer transactions
const response = await customerApi.get(API_ROUTES.TRANSACTIONS.LIST);
```

## Authentication

These components use **customer authentication** (`access_token`), not admin authentication.

### Token Storage
- Customer token: `localStorage.getItem('access_token')`
- Admin token: `localStorage.getItem('admin_token')` (NOT used here)

### Login Flow
1. Customer logs in via `/api/auth/login`
2. Backend returns `access_token` (not `admin_token`)
3. Store in `localStorage.setItem('access_token', token)`
4. `customerApi` automatically uses this token

## API Endpoints Used

### Customer Transaction Endpoints

1. **Get User Transactions**
   ```
   GET /api/transactions?page=1&limit=20&status=completed&type=payment&orderId=123
   ```
   - Returns transactions for authenticated customer only
   - Supports filtering by status, type, orderId
   - Includes pagination

2. **Get Transaction Details**
   ```
   GET /api/transactions/:id
   ```
   - Returns specific transaction
   - Customer can only access their own transactions

## Integration Examples

### Example 1: Customer Dashboard

```jsx
import React from 'react';
import TransactionHistoryWidget from './components/customer/TransactionHistoryWidget';
import { Link } from 'react-router-dom';

const CustomerDashboard = () => {
  return (
    <div className="dashboard">
      <h1>My Dashboard</h1>
      
      <div className="grid grid-cols-2 gap-6">
        <TransactionHistoryWidget limit={5} />
        {/* Other dashboard widgets */}
      </div>
      
      <Link to="/transactions" className="btn-primary">
        View All Transactions
      </Link>
    </div>
  );
};
```

### Example 2: Order Details Page (Multiple Transactions)

```jsx
import React from 'react';
import OrderTransactionsList from './components/customer/OrderTransactionsList';

const OrderDetails = ({ order }) => {
  return (
    <div>
      <h2>Order #{order.id}</h2>
      <p>Total: ${order.total}</p>
      
      {/* Shows all transactions for this order in timeline format */}
      <OrderTransactionsList 
        orderId={order.id} 
        orderTotal={order.total} 
      />
    </div>
  );
};
```

### Example 2b: Order Details Page (Individual Transaction Cards)

```jsx
import React, { useState, useEffect } from 'react';
import TransactionSummary from './components/customer/TransactionSummary';
import customerApi from './utils/customerApi';
import { API_ROUTES } from './config/apiRoutes';

const OrderDetails = ({ orderId }) => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchOrderTransactions();
  }, [orderId]);

  const fetchOrderTransactions = async () => {
    try {
      const response = await customerApi.get(
        `${API_ROUTES.TRANSACTIONS.LIST}?orderId=${orderId}`
      );
      const data = response.data?.data || response.data || {};
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  return (
    <div>
      <h2>Order #{orderId}</h2>
      
      <div className="transactions-section">
        <h3>Payment Transactions</h3>
        {transactions.map((transaction) => (
          <TransactionSummary
            key={transaction.id}
            transaction={transaction}
            showOrderLink={false}
          />
        ))}
      </div>
    </div>
  );
};
```

### Example 3: Full Transaction History Page

```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerTransactions from './pages/customer/Transactions';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/transactions" element={<CustomerTransactions />} />
        {/* Other routes */}
      </Routes>
    </Router>
  );
};
```

## Styling

All components use Tailwind CSS classes. Make sure Tailwind is configured in your project.

Key classes used:
- `bg-white`, `bg-gray-50` - Backgrounds
- `text-primary-600` - Primary color (links, buttons)
- `rounded-lg`, `shadow-sm` - Card styling
- Responsive grid layouts

## Error Handling

All components handle:
- 401 Unauthorized - Redirects to login
- Network errors - Shows user-friendly messages
- Empty states - Displays helpful messages
- Loading states - Shows spinners

## Security Notes

1. **Never use `admin_token` in customer components**
2. **Always use `customerApi` (not `api`) for customer endpoints**
3. **Backend validates that customers can only see their own transactions**
4. **Never expose admin endpoints to customers**

## Testing

To test these components:

1. Login as a customer (get `access_token`)
2. Create some test transactions via orders
3. Navigate to `/transactions` page
4. Verify transactions are displayed correctly
5. Test filters and pagination
6. Test transaction details modal

## Support

For issues or questions:
- Check API documentation in `src/config/AUTH_RULES.md`
- Verify token is stored correctly (`access_token` not `admin_token`)
- Check browser console for API errors
- Verify backend endpoints are working

