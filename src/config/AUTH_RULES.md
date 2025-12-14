# Authentication Rules Documentation

This document outlines the authentication requirements for all API endpoints in the OptyShop system.

## Token Types

- **`access_token`** - Customer/user token (used by storefront)
- **`admin_token`** - Admin/staff token (used by admin panel)

## Auth Levels

### PUBLIC
- No `Authorization` header required
- Used by marketing site, storefront, and public tools
- Only read data or submit public forms

### USER
- Requires: `Authorization: Bearer {{access_token}}`
- Used by logged-in customers
- For: cart, orders, prescriptions, profile management

### ADMIN
- Requires: `Authorization: Bearer {{admin_token}}`
- Used only by admin/backoffice UI
- For: catalog management, CMS, marketing, analytics, user management

---

## Route Categories

### `/api/auth/*`

**PUBLIC:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

**USER:**
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `PUT /api/auth/change-password`
- `POST /api/auth/logout`

> **Note:** In admin panel, these USER routes use `admin_token` instead of `access_token`

---

### `/api/products/*` & `/api/categories/*`

**ALL PUBLIC (GET only):**
- All product listing and detail endpoints
- All category endpoints
- Admin product/category management is under `/api/admin/*`

---

### `/api/cart/*`

**ALL USER:**
- Requires `access_token`
- Admin panel typically doesn't use these endpoints

---

### `/api/orders/*`

**USER:**
- `POST /api/orders` - Create order
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/cancel` - Cancel order

**ADMIN:**
- `PUT /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/refund` - Process refund
- `PUT /api/orders/:id/assign-technician` - Assign technician

**Admin Management:**
- `GET /api/admin/orders` - List all orders (admin)
- `GET /api/admin/orders/:id` - Get order details (admin)

---

### `/api/prescriptions/*`

**USER:**
- `GET /api/prescriptions` - List user prescriptions
- `POST /api/prescriptions` - Create prescription
- `GET /api/prescriptions/:id` - Get prescription
- `PUT /api/prescriptions/:id` - Update prescription
- `DELETE /api/prescriptions/:id` - Delete prescription

**ADMIN:**
- `POST /api/prescriptions/validate` - Validate prescription
- `PUT /api/prescriptions/:id/verify` - Verify prescription

---

### `/api/simulations/*`

**PUBLIC (Calculation & Simulators):**
- `POST /api/simulations/pd`
- `POST /api/simulations/pupillary-height`
- `POST /api/simulations/lens-thickness`
- `POST /api/simulations/kids-lens-recommendation`
- `POST /api/simulations/lifestyle-recommendation`
- `POST /api/simulations/base-curve`
- `POST /api/simulations/photochromic`
- `POST /api/simulations/ar-coating`

**ADMIN (Configuration):**
- `GET /api/simulations/config`
- `PUT /api/simulations/config`
- `GET /api/simulations/vto-assets`
- `POST /api/simulations/vto-assets`
- `DELETE /api/simulations/vto-assets/:id`
- `GET /api/simulations/vto-configs`
- `POST /api/simulations/vto-configs`
- `PUT /api/simulations/vto-configs/:id`
- `DELETE /api/simulations/vto-configs/:id`

---

### `/api/case-studies/*`, `/api/blog/*`, `/api/jobs/*`

**ALL PUBLIC (GET only)**

---

### `/api/forms/*`

**ALL PUBLIC:**
- Form config endpoints (GET)
- Form submission endpoints (POST)
- Must be rate-limited and validated on backend

---

### `/api/cms/*`

**PUBLIC (GET only):**
- `GET /api/cms/banners`
- `GET /api/cms/blog`
- `GET /api/cms/faqs`
- `GET /api/cms/pages`
- `GET /api/cms/testimonials`

**ADMIN (POST/PUT/DELETE):**
- All write operations require `admin_token`

---

### `/api/admin/*`

**ALL ADMIN ONLY:**
- Every route under `/api/admin/*` requires `admin_token`
- Includes: dashboard, products, orders, users, categories, frame-sizes, lens-types, lens-coatings, configs, vto-settings

---

### `/api/marketing/*`

**ALL ADMIN ONLY:**
- Coupons management
- Campaigns management

---

### `/api/analytics/*`

**ALL ADMIN ONLY:**
- Sales analytics
- VTO analytics
- Conversion rates
- Admin logs
- Error logs

---

### `/api/overview`

**ADMIN ONLY:**
- `GET /api/overview`

---

### `/health` & `/api`

**PUBLIC:**
- Health check endpoint
- API info endpoint

---

## Frontend Implementation

### Admin Panel (This App)

- **Token Storage:** `localStorage.getItem('admin_token')`
- **API Client:** Automatically attaches `Authorization: Bearer {{admin_token}}` via axios interceptor
- **Usage:** All admin endpoints use `admin_token` automatically

### Storefront (Separate App)

- **Token Storage:** `localStorage.getItem('access_token')`
- **API Client:** Should attach `Authorization: Bearer {{access_token}}` for user endpoints
- **Usage:** Only public + user endpoints (never admin endpoints)

---

## Backend Implementation Notes

### Middleware Required

1. **`userAuthMiddleware`**
   - Validates user JWT (`access_token`)
   - Ensures `role = user/customer`

2. **`adminAuthMiddleware`**
   - Validates admin JWT (`admin_token`)
   - Ensures `role = admin/staff`

### Router Mounting

- **Public routes:** No auth middleware
- **User routes:** Always use `userAuthMiddleware`
- **Admin routes:** Always use `adminAuthMiddleware`

---

## Important Rules

1. ✅ Admin panel NEVER calls user endpoints (except auth)
2. ✅ Storefront NEVER calls admin endpoints
3. ✅ Public endpoints are accessible without tokens
4. ✅ CMS GET routes are public, write operations are admin-only
5. ✅ Orders have mixed auth (user for customer actions, admin for management)
6. ✅ Prescriptions have mixed auth (user for CRUD, admin for validation)

---

## Quick Reference

| Route Pattern | Auth Level | Token Type |
|--------------|------------|------------|
| `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh` | PUBLIC | None |
| `/api/auth/*` (other) | USER | `access_token` (or `admin_token` in admin panel) |
| `/api/products/*` (GET) | PUBLIC | None |
| `/api/categories/*` (GET) | PUBLIC | None |
| `/api/cart/*` | USER | `access_token` |
| `/api/orders/*` (customer) | USER | `access_token` |
| `/api/orders/*` (admin actions) | ADMIN | `admin_token` |
| `/api/admin/*` | ADMIN | `admin_token` |
| `/api/marketing/*` | ADMIN | `admin_token` |
| `/api/analytics/*` | ADMIN | `admin_token` |
| `/api/cms/*` (GET) | PUBLIC | None |
| `/api/cms/*` (POST/PUT/DELETE) | ADMIN | `admin_token` |
| `/api/simulations/*` (calculations) | PUBLIC | None |
| `/api/simulations/*` (config) | ADMIN | `admin_token` |

