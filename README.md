# OptyShop Admin Panel

A comprehensive React-based admin panel for OptyShop - Smart Optical E-Commerce & Simulation System.

## Features

### 🔐 Authentication
- Secure admin login
- JWT token-based authentication
- Protected routes

### 📊 Dashboard
- Real-time statistics
- Revenue tracking
- Order and user metrics
- Quick action shortcuts

### 🛍️ Product Management
- Create, edit, and delete products
- Product search and filtering
- Category management
- Frame size management
- Lens types and coatings

### 📦 Order Management
- View all orders                      ^

Error: Cannot find module @rollup/rollup-win32-x64-msvc. npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828). Please try `npm i` again after removing both package-lock.json and node_modules directory.
    at requireWithFriendlyError (D:\web\admin-panel\node_modules\rollup\dist\native.js:83:9)
    at Object.<anonymous> (D:\web\admin-panel\node_modules\rollup\dist\native.js:92:76)
    at Module._compile (node:internal/modules/cjs/loader:1760:14)
    at Object..js (node:internal/modules/cjs/loader:1893:10)
    at Module.load (node:internal/modules/cjs/loader:1480:32)
    at Module._load (node:internal/modules/cjs/loader:1299:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:244:24)
    at cjsLoader (node:internal/modules/esm/translators:329:5)
    at ModuleWrap.<anonymous> (node:internal/modules/esm/translators:221:7) { 
  [cause]: Error: Cannot find module '@rollup/rollup-win32-x64-msvc'
  Require stack:
  - D:\web\admin-panel\node_modules\rollup\dist\native.js
      at Module._resolveFilename (node:internal/modules/cjs/loader:1420:15)   
      at defaultResolveImpl (node:internal/modules/cjs/loader:1058:19)        
      at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1063:22)    
      at Module._load (node:internal/modules/cjs/loader:1226:37)
      at TracingChannel.traceSync (node:diagnostics_channel:322:14)
      at wrapModuleLoad (node:internal/modules/cjs/loader:244:24)
      at Module.require (node:internal/modules/cjs/loader:1503:12)
      at require (node:internal/modules/helpers:152:16)
      at requireWithFriendlyError (D:\web\admin-panel\node_modules\rollup\dist\native.js:65:10)
      at Object.<anonymous> (D:\web\admin-panel\node_modules\rollup\dist\native.js:92:76) {
    code: 'MODULE_NOT_FOUND',
    requireStack: [ 'D:\\web\\admin-panel\\node_modules\\rollup\\dist\\native.js' ]
  }
}

Node.js v24.8.0
PS D:\web\admin-panel> 
- Update order status
- Track order details
- Customer information
- Order filtering and search

### 👥 User Management
- View and manage users
- Update user roles
- Activate/deactivate accounts
- User search

### 💰 Marketing
- Coupon management
- Campaign tracking
- Usage statistics

### 📝 CMS Management
- Banner management
- Blog post creation
- FAQ management
- Page editor
- Testimonial management

### 👓 Optical Simulations
- PD Calculator configuration
- Lens thickness calculator
- Photochromic simulator
- AR coating simulator
- VTO (Virtual Try-On) settings

### 📈 Analytics
- Sales analytics
- VTO performance metrics
- Conversion rate tracking
- Activity logs
- Top performing products

## Tech Stack

- **React 18** - UI library
- **React Router v6** - Routing
- **Axios** - API calls
- **Tailwind CSS** - Styling
- **React Icons** - Icons
- **React Hot Toast** - Notifications
- **Vite** - Build tool

## Installation

1. **Install dependencies:**
```bash
cd admin-panel
npm install
```

2. **Configure API endpoint:**
Edit `src/utils/api.js` if your backend is not running on `http://localhost:5000`

3. **Run development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
```

## Default Credentials

For testing purposes:
- **Email:** admin@test.com
- **Password:** admin123

## Project Structure

```
admin-panel/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Layout.jsx       # Main layout wrapper
│   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   ├── Header.jsx       # Top header
│   │   ├── ProductModal.jsx # Product form modal
│   │   ├── OrderModal.jsx   # Order details modal
│   │   ├── UserModal.jsx    # User edit modal
│   │   └── CategoryModal.jsx# Category form modal
│   ├── pages/               # Page components
│   │   ├── Login.jsx        # Login page
│   │   ├── Dashboard.jsx    # Dashboard
│   │   ├── Products.jsx     # Product management
│   │   ├── Orders.jsx       # Order management
│   │   ├── Users.jsx        # User management
│   │   ├── Categories.jsx   # Category management
│   │   ├── FrameSizes.jsx   # Frame size management
│   │   ├── LensTypes.jsx    # Lens type management
│   │   ├── LensCoatings.jsx # Lens coating management
│   │   ├── Prescriptions.jsx# Prescription management
│   │   ├── Coupons.jsx      # Coupon management
│   │   ├── Campaigns.jsx    # Campaign management
│   │   ├── Banners.jsx      # Banner management
│   │   ├── BlogPosts.jsx    # Blog management
│   │   ├── FAQs.jsx         # FAQ management
│   │   ├── Pages.jsx        # Page management
│   │   ├── Testimonials.jsx # Testimonial management
│   │   ├── Analytics.jsx    # Analytics dashboard
│   │   └── Simulations.jsx  # Simulation configuration
│   ├── context/
│   │   └── AuthContext.jsx  # Authentication context
│   ├── utils/
│   │   └── api.js           # API configuration
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## API Integration

The admin panel is designed to work with the OptyShop API. Make sure your backend API is running and accessible.

### API Endpoints Used:
- `/api/auth/*` - Authentication
- `/api/admin/*` - Admin operations
- `/api/products/*` - Product management
- `/api/orders/*` - Order management
- `/api/categories/*` - Category management
- `/api/prescriptions/*` - Prescription management
- `/api/marketing/*` - Marketing management
- `/api/cms/*` - CMS management
- `/api/simulations/*` - Simulation configuration
- `/api/analytics/*` - Analytics data

## Features by Section

### Product Management
- Bulk upload support
- Image upload
- Frame specifications (shape, material, size)
- Stock management
- Pricing

### Order Management
- Real-time status updates
- Customer details
- Shipping information
- Payment tracking
- Refund processing
- Technician assignment

### Prescription Management
- Verification workflow
- Optical measurements
- PD (Pupillary Distance) tracking
- Prescription type support

### Simulation Tools
- PD calculation
- Pupillary height calculation
- Lens thickness estimation
- Kids lens recommendations
- Lifestyle recommendations
- Base curve calculation
- Photochromic simulation
- AR coating simulation

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Preview Production Build
```bash
npm run preview
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary and confidential.

## Support

For support, email support@optyshop.com or create an issue in the repository.

#   o p t y s h o p - a d m i n  
 