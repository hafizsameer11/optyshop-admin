# Postman Collection Integration

This document explains how the OptyShop Admin Panel integrates with the Postman API collection.

## Overview

The admin panel uses `src/config/apiRoutes.js` to define all API endpoints. This file is synchronized with `OptyShop_API.postman_collection.json` to ensure consistency.

## File Structure

```
admin-panel/
├── OptyShop_API.postman_collection.json  # Complete API collection
├── src/
│   ├── config/
│   │   └── apiRoutes.js                  # API route definitions
│   └── utils/
│       └── postmanValidator.js           # Validation utilities
└── docs/
    └── POSTMAN_INTEGRATION.md            # This file
```

## Using API Routes

### Basic Usage

```javascript
import { API_ROUTES } from '../config/apiRoutes';
import api from '../utils/api';

// GET request
const products = await api.get(API_ROUTES.ADMIN.PRODUCTS.LIST);

// POST request
const newProduct = await api.post(
  API_ROUTES.ADMIN.PRODUCTS.CREATE,
  productData
);

// PUT request with ID
const updated = await api.put(
  API_ROUTES.ADMIN.PRODUCTS.UPDATE(productId),
  updateData
);

// DELETE request
await api.delete(API_ROUTES.ADMIN.PRODUCTS.DELETE(productId));
```

### Building Query Strings

```javascript
import { API_ROUTES, buildQueryString } from '../config/apiRoutes';

const url = buildQueryString(API_ROUTES.ADMIN.PRODUCTS.LIST, {
  page: 1,
  limit: 20,
  category_id: 5,
  search: 'glasses'
});
// Returns: "/admin/products?page=1&limit=20&category_id=5&search=glasses"
```

## Validating Against Postman Collection

Use the validator utility to ensure routes are in sync:

```javascript
import { API_ROUTES } from '../config/apiRoutes';
import { validateRoutesAgainstPostman } from '../utils/postmanValidator';

// Validate all routes
const validation = validateRoutesAgainstPostman(API_ROUTES);

if (!validation.isValid) {
  console.warn('Missing endpoints:', validation.missingEndpoints);
}
```

## Finding Endpoints in Postman Collection

### Get Endpoint Details

```javascript
import { getEndpointFromPostman } from '../utils/postmanValidator';

const endpoint = getEndpointFromPostman('admin/products', 'GET');
console.log(endpoint);
// {
//   name: "Get All Products (Admin)",
//   method: "GET",
//   path: "admin/products",
//   description: "...",
//   auth: "Bearer {{admin_token}}"
// }
```

### Get All Admin Endpoints

```javascript
import { getAdminEndpointsFromPostman } from '../utils/postmanValidator';

const adminEndpoints = getAdminEndpointsFromPostman();
console.log(`Found ${adminEndpoints.length} admin endpoints`);
```

## Endpoint Categories

### Authentication
- `API_ROUTES.AUTH.*` - Login, register, profile, etc.

### Products
- `API_ROUTES.ADMIN.PRODUCTS.*` - CRUD operations for products
- `API_ROUTES.PRODUCTS.*` - Public product endpoints

### Categories & Subcategories
- `API_ROUTES.ADMIN.CATEGORIES.*` - Category management
- `API_ROUTES.ADMIN.SUBCATEGORIES.*` - Subcategory management

### Orders
- `API_ROUTES.ADMIN.ORDERS.*` - Admin order management
- `API_ROUTES.ORDERS.*` - Customer order endpoints

### Lens Management
- `API_ROUTES.ADMIN.LENS_TYPES.*`
- `API_ROUTES.ADMIN.LENS_COATINGS.*`
- `API_ROUTES.ADMIN.LENS_OPTIONS.*`
- `API_ROUTES.ADMIN.LENS_COLORS.*`
- `API_ROUTES.ADMIN.LENS_FINISHES.*`
- `API_ROUTES.ADMIN.LENS_TREATMENTS.*`
- `API_ROUTES.ADMIN.LENS_THICKNESS_MATERIALS.*`
- `API_ROUTES.ADMIN.LENS_THICKNESS_OPTIONS.*`

### Prescriptions
- `API_ROUTES.ADMIN.PRESCRIPTION_LENS_TYPES.*`
- `API_ROUTES.ADMIN.PRESCRIPTION_LENS_VARIANTS.*`
- `API_ROUTES.PRESCRIPTIONS.*` - Prescription CRUD

### Marketing
- `API_ROUTES.ADMIN.COUPONS.*`
- `API_ROUTES.ADMIN.CAMPAIGNS.*`
- `API_ROUTES.ADMIN.BANNERS.*`

### CMS
- `API_ROUTES.ADMIN.BLOG_POSTS.*`
- `API_ROUTES.ADMIN.FAQS.*`
- `API_ROUTES.ADMIN.PAGES.*`
- `API_ROUTES.CMS.TESTIMONIALS.*`

### Forms
- `API_ROUTES.ADMIN.CONTACT_REQUESTS.*`
- `API_ROUTES.ADMIN.DEMO_REQUESTS.*`
- `API_ROUTES.ADMIN.PRICING_REQUESTS.*`
- `API_ROUTES.ADMIN.JOB_APPLICATIONS.*`
- `API_ROUTES.ADMIN.CREDENTIALS_REQUESTS.*`
- `API_ROUTES.ADMIN.SUPPORT_REQUESTS.*`

### Analytics & Overview
- `API_ROUTES.ANALYTICS.*`
- `API_ROUTES.OVERVIEW.*`

## Authentication

All admin endpoints require the `admin_token` which is automatically added by `src/utils/api.js`:

```javascript
// The token is automatically added via axios interceptor
// No need to manually add Authorization header
const response = await api.get(API_ROUTES.ADMIN.DASHBOARD);
```

## Adding New Endpoints

When adding new endpoints:

1. **Update Postman Collection** - Add the endpoint to `OptyShop_API.postman_collection.json`
2. **Update apiRoutes.js** - Add the route definition to `src/config/apiRoutes.js`
3. **Validate** - Run validation to ensure consistency:

```javascript
import { validateRoutesAgainstPostman } from '../utils/postmanValidator';
import { API_ROUTES } from '../config/apiRoutes';

const validation = validateRoutesAgainstPostman(API_ROUTES);
console.log(validation);
```

## Query Parameters

Common query parameters are defined in `QUERY_PARAMS`:

```javascript
import { QUERY_PARAMS, buildQueryString, API_ROUTES } from '../config/apiRoutes';

const url = buildQueryString(API_ROUTES.ADMIN.PRODUCTS.LIST, {
  [QUERY_PARAMS.PAGE]: 1,
  [QUERY_PARAMS.LIMIT]: 20,
  [QUERY_PARAMS.STATUS]: 'active',
});
```

Available query param constants:
- `QUERY_PARAMS.PAGE` - Page number
- `QUERY_PARAMS.LIMIT` - Items per page
- `QUERY_PARAMS.STATUS` - Filter by status
- `QUERY_PARAMS.FRAME_SHAPE` - Filter by frame shape
- `QUERY_PARAMS.FRAME_MATERIAL` - Filter by frame material
- `QUERY_PARAMS.MIN_PRICE` - Minimum price filter
- `QUERY_PARAMS.MAX_PRICE` - Maximum price filter

## Best Practices

1. **Always use API_ROUTES** - Don't hardcode API paths
2. **Use buildQueryString** - For URLs with query parameters
3. **Validate regularly** - Run validation after adding new endpoints
4. **Check Postman collection** - Reference it for endpoint details and examples
5. **Follow naming conventions** - Match Postman collection naming

## Troubleshooting

### Endpoint Not Found

If an endpoint is missing:
1. Check `OptyShop_API.postman_collection.json` for the endpoint
2. Add it to `src/config/apiRoutes.js`
3. Run validation to confirm

### Authentication Errors

- Ensure `admin_token` is set in localStorage
- Check `src/utils/api.js` interceptor is working
- Verify endpoint requires admin authentication

### Query Parameter Issues

- Use `buildQueryString` helper function
- Check `QUERY_PARAMS` constants for correct parameter names
- Refer to Postman collection for available parameters

## Related Files

- `src/config/apiRoutes.js` - Route definitions
- `src/utils/api.js` - Axios instance with interceptors
- `src/utils/postmanValidator.js` - Validation utilities
- `OptyShop_API.postman_collection.json` - Complete API collection
- `docs/AUTH_RULES.md` - Authentication rules documentation

