# API Routes Configuration

This directory contains the centralized API routes configuration for the OptyShop Admin Panel.

## Files

- **`apiRoutes.js`** - Main configuration file with all API route definitions
- **`apiRoutes.example.js`** - Usage examples and helper functions
- **`README.md`** - This documentation file

## Overview

The `apiRoutes.js` file organizes all API endpoints from the OptyShop backend into a structured, easy-to-use configuration object. This provides:

✅ **Centralized route management** - All routes in one place  
✅ **Type safety** - Consistent route structure  
✅ **Easy refactoring** - Change routes in one location  
✅ **Better maintainability** - Clear organization by feature  
✅ **Dynamic routes** - Helper functions for routes with IDs/slugs  

## Usage

### Basic Import

```javascript
import { API_ROUTES } from '../config/apiRoutes';
```

### Simple GET Request

```javascript
import api from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

const fetchProducts = async () => {
  const response = await api.get(API_ROUTES.PRODUCTS.LIST);
  return response.data;
};
```

### Dynamic Routes (with ID)

```javascript
const fetchProduct = async (productId) => {
  const response = await api.get(API_ROUTES.PRODUCTS.BY_ID(productId));
  return response.data;
};
```

### Routes with Query Parameters

```javascript
import { API_ROUTES, buildQueryString, QUERY_PARAMS } from '../config/apiRoutes';

const fetchFilteredProducts = async (filters) => {
  const url = buildQueryString(API_ROUTES.PRODUCTS.LIST, {
    [QUERY_PARAMS.PAGE]: filters.page || 1,
    [QUERY_PARAMS.LIMIT]: filters.limit || 12,
    [QUERY_PARAMS.FRAME_SHAPE]: filters.frameShape,
  });
  
  const response = await api.get(url);
  return response.data;
};
```

### POST/PUT/DELETE Requests

```javascript
// Create
const createProduct = async (productData) => {
  const response = await api.post(
    API_ROUTES.ADMIN.PRODUCTS.CREATE,
    productData
  );
  return response.data;
};

// Update
const updateProduct = async (productId, productData) => {
  const response = await api.put(
    API_ROUTES.ADMIN.PRODUCTS.UPDATE(productId),
    productData
  );
  return response.data;
};

// Delete
const deleteProduct = async (productId) => {
  const response = await api.delete(
    API_ROUTES.ADMIN.PRODUCTS.DELETE(productId)
  );
  return response.data;
};
```

## Route Categories

The routes are organized into the following categories:

### Public Routes
- `AUTH` - Authentication endpoints
- `PRODUCTS` - Product listings and details
- `CATEGORIES` - Category information
- `CART` - Shopping cart operations
- `ORDERS` - Order management
- `PRESCRIPTIONS` - Prescription management
- `SIMULATIONS` - Optical simulations
- `CASE_STUDIES` - Case study content
- `BLOG` - Blog articles
- `JOBS` - Job listings
- `FORMS` - Form submissions

### Admin Routes
- `ADMIN` - General admin operations
  - Dashboard
  - Products management
  - Orders management
  - Users management
  - Categories management
  - Frame sizes management
  - Lens types management
  - Lens coatings management
  - Configs management
  - VTO settings
- `MARKETING` - Marketing tools (Coupons, Campaigns)
- `CMS` - Content management (Banners, Blog, FAQs, Pages, Testimonials)
- `ANALYTICS` - Analytics and reporting
- `OVERVIEW` - Overview statistics

### Utility Routes
- `HEALTH` - Health check endpoints

## Helper Functions

### `buildQueryString(baseUrl, params)`

Builds a URL with query parameters.

```javascript
import { buildQueryString } from '../config/apiRoutes';

const url = buildQueryString(API_ROUTES.PRODUCTS.LIST, {
  page: 1,
  limit: 12,
  frameShape: 'round'
});
// Returns: "/api/products?page=1&limit=12&frameShape=round"
```

### `QUERY_PARAMS`

Constants for common query parameter names.

```javascript
import { QUERY_PARAMS } from '../config/apiRoutes';

// Available constants:
QUERY_PARAMS.PAGE
QUERY_PARAMS.LIMIT
QUERY_PARAMS.STATUS
QUERY_PARAMS.FRAME_SHAPE
QUERY_PARAMS.FRAME_MATERIAL
QUERY_PARAMS.MIN_PRICE
QUERY_PARAMS.MAX_PRICE
QUERY_PARAMS.RANGE
QUERY_PARAMS.PERIOD
QUERY_PARAMS.INCLUDE_PRODUCTS
QUERY_PARAMS.TYPE
```

## Route Structure Examples

### Static Routes
```javascript
API_ROUTES.AUTH.LOGIN              // "/api/auth/login"
API_ROUTES.PRODUCTS.LIST           // "/api/products"
API_ROUTES.ADMIN.DASHBOARD         // "/api/admin/dashboard"
```

### Dynamic Routes (Functions)
```javascript
API_ROUTES.PRODUCTS.BY_ID(5)       // "/api/products/5"
API_ROUTES.PRODUCTS.BY_SLUG('slug') // "/api/products/slug/slug"
API_ROUTES.ADMIN.PRODUCTS.UPDATE(3) // "/api/admin/products/3"
```

### Nested Routes
```javascript
API_ROUTES.FORMS.CONTACT.SUBMIT    // "/api/forms/contact/submissions"
API_ROUTES.CMS.BLOG.CREATE         // "/api/cms/blog"
API_ROUTES.MARKETING.COUPONS.LIST  // "/api/marketing/coupons"
```

## Examples in Codebase

See `Simulations.jsx` and `ConfigModal.jsx` for real-world usage examples:

```javascript
// In Simulations.jsx
import { API_ROUTES } from '../config/apiRoutes';

const fetchConfigs = async () => {
  const response = await api.get(API_ROUTES.ADMIN.CONFIGS.LIST);
  // ...
};

const handleDeleteConfig = async (configId) => {
  await api.delete(API_ROUTES.ADMIN.CONFIGS.DELETE(configId));
  // ...
};
```

## Benefits

1. **No Hardcoded URLs** - All routes come from a single source
2. **Easy Updates** - Change backend routes in one place
3. **Better IDE Support** - Autocomplete for route names
4. **Consistency** - Same route structure across the app
5. **Documentation** - Routes are self-documenting
6. **Type Safety** - Reduces typos and errors

## Migration Guide

To migrate existing code to use API routes:

1. Import the routes:
   ```javascript
   import { API_ROUTES } from '../config/apiRoutes';
   ```

2. Replace hardcoded strings:
   ```javascript
   // Before
   api.get('/api/products')
   
   // After
   api.get(API_ROUTES.PRODUCTS.LIST)
   ```

3. For dynamic routes:
   ```javascript
   // Before
   api.get(`/api/products/${id}`)
   
   // After
   api.get(API_ROUTES.PRODUCTS.BY_ID(id))
   ```

## Notes

- All routes are relative to the base URL configured in `api.js`
- The base URL (`/api`) is automatically prepended
- Dynamic route functions accept parameters (id, slug, etc.)
- Query parameters should be added using `buildQueryString()` helper

