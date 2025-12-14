# How to Use OptyShop Admin Panel

## 🎯 Current Situation

Your backend is running on `http://localhost:5000` ✅  
Your admin panel is running on `http://localhost:3000` ✅  
You can see real product data ✅

## ⚠️ Important: Demo Mode vs Real Mode

### What You're Currently Using: DEMO MODE

You're logged in with demo credentials:
- Email: `admin@test.com`
- Password: `admin123`

**Demo Mode Limitations:**
- ✅ Can VIEW all data from the backend
- ❌ Cannot ADD new items
- ❌ Cannot EDIT existing items
- ❌ Cannot DELETE items

You'll see a **🔒 DEMO MODE - Read Only** badge in the header.

### How to Enable Full Functionality

To add, edit, and delete items, you need to **log in with REAL credentials**:

#### Step 1: Create a Real Admin User in Your Database

You need to create an admin user in your backend database. Run this in your backend terminal:

```bash
# In your backend directory
cd D:\OPTshop\backend

# Run your seed script or create admin user manually
# The exact command depends on your backend setup
```

Or use your backend's user creation endpoint to create an admin user.

#### Step 2: Log Out of Demo Mode

1. Click the **Logout** button in the admin panel
2. This will clear your demo session

#### Step 3: Log In with Real Credentials

1. Use your real admin email and password
2. The backend will authenticate you with a real token
3. All add/edit/delete operations will work ✅

## 🔧 Features by Mode

### Demo Mode (Current)
- View Dashboard (shows 0s because demo token can't fetch)
- View Products (shows real data!)
- View Orders, Users, Categories
- **Cannot modify anything**

### Real Mode (After logging in with real credentials)
- ✅ Full access to all features
- ✅ Add new products, categories, orders
- ✅ Edit existing items
- ✅ Delete items
- ✅ Update order statuses
- ✅ Manage users

## 📝 Error Messages Explained

### "❌ Demo mode - Please log in with real credentials to save products"
- **What it means:** You're trying to add/edit/delete while using demo credentials
- **Solution:** Log out and log in with real admin credentials

### "Backend unavailable - Cannot save"
- **What it means:** Backend server is not running
- **Solution:** Start your backend server: `npm run dev` in backend directory

## 🚀 Quick Start Guide

### Option 1: Test the UI (Demo Mode)
```bash
# Just for viewing and testing UI
Email: admin@test.com
Password: admin123
```

### Option 2: Full Functionality
```bash
# Create admin user in backend first, then:
Email: your-real-admin@email.com
Password: your-real-password
```

## 🎨 Visual Indicators

- **🔒 DEMO MODE - Read Only** badge in header = Using demo credentials, read-only access
- **No badge** = Using real credentials, full access
- **"Admin User"** text = Your user name (from demo or real account)

## 💡 Tips

1. **Backend must be running** for ANY data to show (even in demo mode)
2. **Demo mode is perfect** for testing the UI and viewing data
3. **Real credentials required** for any add/edit/delete operations
4. **Check browser console** for detailed error messages while developing

## 🐛 Troubleshooting

### Products page shows data but can't edit
- You're in demo mode. Log in with real credentials.

### Dashboard shows all zeros
- This is expected in demo mode (401 errors are silent)
- Log in with real credentials to see real dashboard stats

### "Failed to save" errors
- Backend might not have the endpoint implemented
- Check backend terminal for error logs
- Verify you're logged in with real credentials

## 📞 Need Help?

Check the backend logs when performing operations:
```bash
# In backend terminal, you'll see:
POST /api/admin/products 401 - Unauthorized
# This means: using demo credentials, operation blocked

POST /api/admin/products 200 - Success
# This means: using real credentials, operation succeeded
```

