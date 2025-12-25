/**
 * API Routes Configuration
 * Complete route definitions based on OptyShop API Postman Collection
 * 
 * SOURCE: OptyShop_API.postman_collection.json (root directory)
 * This file is synchronized with the Postman collection to ensure all endpoints are available.
 * 
 * AUTHENTICATION RULES:
 * - PUBLIC: No Authorization header required
 * - USER: Requires Authorization: Bearer {{access_token}} (customer token)
 * - ADMIN: Requires Authorization: Bearer {{admin_token}} (admin token)
 * 
 * NOTE: This is the ADMIN PANEL - all routes use admin_token via api.js interceptor
 * 
 * IMPORTANT AUTH RULES:
 * 1. Admin panel uses admin_token for ALL authenticated requests
 * 2. Public endpoints (products, categories, simulations tools) don't need tokens
 * 3. All /api/admin/* routes are ADMIN ONLY
 * 4. All /api/marketing/* routes are ADMIN ONLY
 * 5. All /api/analytics/* routes are ADMIN ONLY
 * 6. CMS GET routes are PUBLIC, write operations are ADMIN
 * 7. Orders: customer actions (USER), admin actions (ADMIN)
 * 8. Prescriptions: CRUD (USER), validation/verification (ADMIN)
 * 
 * See AUTH_RULES.md for complete documentation
 * 
 * Usage:
 * import { API_ROUTES } from '../config/apiRoutes';
 * const url = API_ROUTES.AUTH.LOGIN;
 * 
 * To validate endpoints against Postman collection:
 * import { validateRoutesAgainstPostman } from '../utils/postmanValidator';
 */

// NOTE: baseURL in api.js is 'https://optyshop-frontend.hmstech.org/api'
// So routes here should NOT include '/api' prefix
// They will be appended to the baseURL
const API_BASE = '';

export const API_ROUTES = {
  // ============================================
  // AUTHENTICATION
  // ============================================
  // PUBLIC: register, login, refresh
  // USER: me, profile, change-password, logout
  AUTH: {
    REGISTER: `/auth/register`,        // PUBLIC
    LOGIN: `/auth/login`,              // PUBLIC
    REFRESH: `/auth/refresh`,          // PUBLIC
    ME: `/auth/me`,                     // USER (but admin panel uses admin_token)
    PROFILE: `/auth/profile`,           // USER (but admin panel uses admin_token)
    CHANGE_PASSWORD: `/auth/change-password`, // USER (but admin panel uses admin_token)
    LOGOUT: `/auth/logout`,             // USER (but admin panel uses admin_token)
  },

  // ============================================
  // PRODUCTS (PUBLIC - all GET routes)
  // ============================================
  PRODUCTS: {
    LIST: `/products`,                           // PUBLIC
    FEATURED: `/products/featured`,             // PUBLIC
    OPTIONS: `/products/options`,               // PUBLIC
    BY_ID: (id) => `/products/${id}`,           // PUBLIC
    BY_SLUG: (slug) => `/products/slug/${slug}`, // PUBLIC
    RELATED: (id) => `/products/${id}/related`,  // PUBLIC
  },

  // ============================================
  // CATEGORIES (PUBLIC - all GET routes)
  // ============================================
  CATEGORIES: {
    LIST: `/categories`,                        // PUBLIC
    BY_ID: (id) => `/categories/${id}`,         // PUBLIC
    BY_SLUG: (slug) => `/categories/slug/${slug}`, // PUBLIC
  },

  // ============================================
  // SUBCATEGORIES (PUBLIC - all GET routes)
  // ============================================
  SUBCATEGORIES: {
    LIST: `/subcategories`,                     // PUBLIC - Get all subcategories (returns subcategories, topLevelSubcategories, subSubcategories arrays)
    BY_ID: (id) => `/subcategories/${id}`,       // PUBLIC - Get single subcategory (includes parent if sub-subcategory, and children if parent)
    BY_SLUG: (slug) => `/subcategories/slug/${slug}`, // PUBLIC
    BY_CATEGORY: (categoryId) => `/subcategories/by-category/${categoryId}`, // PUBLIC - Get top-level subcategories with their nested children
    BY_PARENT: (parentId) => `/subcategories/by-parent/${parentId}`, // PUBLIC - Get sub-subcategories by parent ID (returns parent info + array of sub-subcategories)
    NESTED: (subCategoryId) => `/subcategories/${subCategoryId}/subcategories`, // PUBLIC - Get nested subcategories (alternative endpoint)
    PRODUCTS: (id) => `/subcategories/${id}/products`, // PUBLIC - Get products (includes sub-subcategory products if parent)
  },

  // ============================================
  // CART (USER - requires access_token)
  // ============================================
  // NOTE: Admin panel typically doesn't use cart endpoints
  CART: {
    GET: `/cart`,                               // USER
    ADD_ITEM: `/cart/items`,                    // USER
    UPDATE_ITEM: (id) => `/cart/items/${id}`,   // USER
    REMOVE_ITEM: (id) => `/cart/items/${id}`,   // USER
    CLEAR: `/cart`,                             // USER
  },

  // ============================================
  // ORDERS
  // ============================================
  // USER: create, list, by_id, cancel
  // ADMIN: list (admin/orders), by_id (admin/orders), update_status, refund, assign_technician
  ORDERS: {
    CREATE: `/orders`,                          // USER
    LIST: `/orders`,                             // USER
    BY_ID: (id) => `/orders/${id}`,             // USER
    CANCEL: (id) => `/orders/${id}/cancel`,      // USER
    UPDATE_STATUS: (id) => `/orders/${id}/status`, // ADMIN
    REFUND: (id) => `/orders/${id}/refund`,      // ADMIN
    ASSIGN_TECHNICIAN: (id) => `/orders/${id}/assign-technician`, // ADMIN
  },

  // ============================================
  // TRANSACTIONS (CUSTOMER)
  // ============================================
  // USER: list, by_id (customer can only see their own transactions)
  TRANSACTIONS: {
    LIST: `/transactions`,                       // USER - Get user transactions with filters
    BY_ID: (id) => `/transactions/${id}`,        // USER - Get transaction details
  },

  // ============================================
  // COUPONS (PUBLIC - apply only)
  // ============================================
  COUPONS: {
    APPLY: `/coupons/apply`,                     // PUBLIC
  },

  // ============================================
  // SHIPPING METHODS (PUBLIC - all GET routes)
  // ============================================
  SHIPPING_METHODS: {
    LIST: `/shipping-methods`,                   // PUBLIC
    BY_ID: (id) => `/shipping-methods/${id}`,    // PUBLIC
  },

  // ============================================
  // LENS OPTIONS & TREATMENTS (PUBLIC - all GET routes)
  // ============================================
  LENS: {
    OPTIONS: {
      LIST: `/lens/options`,                     // PUBLIC
      BY_ID: (id) => `/lens/options/${id}`,     // PUBLIC
    },
    TREATMENTS: {
      LIST: `/lens/treatments`,                  // PUBLIC
      BY_ID: (id) => `/lens/treatments/${id}`,   // PUBLIC
    },
    PRESCRIPTION_LENS_TYPES: {
      LIST: `/lens/prescription-lens-types`,     // PUBLIC
      BY_ID: (id) => `/lens/prescription-lens-types/${id}`, // PUBLIC
      VARIANTS: (id) => `/lens/prescription-lens-types/${id}/variants`, // PUBLIC
    },
    PRESCRIPTION_LENS_VARIANTS: {
      BY_ID: (id) => `/lens/prescription-lens-variants/${id}`, // PUBLIC
    },
    PRESCRIPTION_SUN_LENSES: {
      LIST: `/prescription-sun-lenses`,          // PUBLIC
      BY_ID: (id) => `/prescription-sun-lenses/${id}`, // PUBLIC
    },
    PHOTOCHROMIC_LENSES: {
      LIST: `/photochromic-lenses`,              // PUBLIC
      BY_ID: (id) => `/photochromic-lenses/${id}`, // PUBLIC
    },
  },

  // ============================================
  // PRODUCT CUSTOMIZATION (PUBLIC)
  // ============================================
  CUSTOMIZATION: {
    OPTIONS: `/customization/options`,           // PUBLIC - Get all customization options
    PRODUCT_CUSTOMIZATION: (productId) => `/customization/products/${productId}/customization`, // PUBLIC - Get product customization options
    PRESCRIPTION_LENS_TYPES: `/customization/prescription-lens-types`, // PUBLIC - Get prescription lens types
    CALCULATE_PRICE: (productId) => `/customization/products/${productId}/customization/calculate`, // PUBLIC - Calculate price without prescription
    CALCULATE_PRICE_WITH_PRESCRIPTION: (productId) => `/customization/products/${productId}/customization/calculate-with-prescription`, // PUBLIC - Calculate price with prescription
  },

  // ============================================
  // PAYMENTS (CUSTOMER)
  // ============================================
  // USER: create-intent, confirm, get intent status
  PAYMENTS: {
    CREATE_INTENT: `/payments/create-intent`,    // USER
    CONFIRM: `/payments/confirm`,               // USER
    INTENT_STATUS: (intentId) => `/payments/intent/${intentId}`, // USER
    REFUND: `/payments/refund`,                 // ADMIN
  },

  // ============================================
  // PRESCRIPTIONS
  // ============================================
  // USER: list, create, by_id, update, delete
  // ADMIN: validate, verify
  PRESCRIPTIONS: {
    LIST: `/prescriptions`,                      // USER
    CREATE: `/prescriptions`,                   // USER
    BY_ID: (id) => `/prescriptions/${id}`,       // USER
    UPDATE: (id) => `/prescriptions/${id}`,     // USER
    DELETE: (id) => `/prescriptions/${id}`,      // USER
    VALIDATE: `/prescriptions/validate`,         // ADMIN
    VERIFY: (id) => `/prescriptions/${id}/verify`, // ADMIN
  },

  // ============================================
  // SIMULATIONS
  // ============================================
  // PUBLIC: calculation endpoints, simulators
  // ADMIN: config, vto-assets, vto-configs
  SIMULATIONS: {
    // PUBLIC - Calculation endpoints
    CALCULATE_PD: `/simulations/pd`,                    // PUBLIC
    CALCULATE_PUPILLARY_HEIGHT: `/simulations/pupillary-height`, // PUBLIC
    CALCULATE_LENS_THICKNESS: `/simulations/lens-thickness`,     // PUBLIC
    KIDS_LENS_RECOMMENDATION: `/simulations/kids-lens-recommendation`, // PUBLIC
    LIFESTYLE_RECOMMENDATION: `/simulations/lifestyle-recommendation`, // PUBLIC
    CALCULATE_BASE_CURVE: `/simulations/base-curve`,     // PUBLIC

    // PUBLIC - Simulators
    PHOTOCHROMIC: `/simulations/photochromic`,          // PUBLIC
    AR_COATING: `/simulations/ar-coating`,              // PUBLIC

    // ADMIN - Configuration
    CONFIG: `/simulations/config`,                      // ADMIN
    UPDATE_CONFIG: `/simulations/config`,               // ADMIN

    // ADMIN - VTO Assets
    VTO_ASSETS: `/simulations/vto-assets`,              // ADMIN
    VTO_ASSET_BY_ID: (id) => `/simulations/vto-assets/${id}`, // ADMIN
    CREATE_VTO_ASSET: `/simulations/vto-assets`,       // ADMIN
    DELETE_VTO_ASSET: (id) => `/simulations/vto-assets/${id}`, // ADMIN

    // ADMIN - VTO Configs
    VTO_CONFIGS: `/simulations/vto-configs`,            // ADMIN
    VTO_CONFIG_BY_ID: (id) => `/simulations/vto-configs/${id}`, // ADMIN
    CREATE_VTO_CONFIG: `/simulations/vto-configs`,     // ADMIN
    UPDATE_VTO_CONFIG: (id) => `/simulations/vto-configs/${id}`, // ADMIN
    DELETE_VTO_CONFIG: (id) => `/simulations/vto-configs/${id}`, // ADMIN
  },

  // ============================================
  // CASE STUDIES (PUBLIC)
  // ============================================
  CASE_STUDIES: {
    LIST: `/case-studies`,                              // PUBLIC
    BY_SLUG: (slug) => `/case-studies/${slug}`,         // PUBLIC
  },

  // ============================================
  // BLOG (PUBLIC - marketing site)
  // ============================================
  BLOG: {
    LIST: `/blog`,                                      // PUBLIC
    BY_SLUG: (slug) => `/blog/${slug}`,                 // PUBLIC
  },

  // ============================================
  // BANNERS (PUBLIC - GET only)
  // ============================================
  BANNERS: {
    LIST: `/banners`,                                   // PUBLIC
  },

  // ============================================
  // CAMPAIGNS (PUBLIC - GET only)
  // ============================================
  CAMPAIGNS: {
    LIST: `/campaigns`,                                // PUBLIC
  },

  // ============================================
  // FAQs (PUBLIC - GET only)
  // ============================================
  FAQS: {
    LIST: `/faqs`,                                     // PUBLIC
  },

  // ============================================
  // PAGES (PUBLIC - GET by slug only)
  // ============================================
  PAGES: {
    BY_SLUG: (slug) => `/pages/${slug}`,               // PUBLIC
  },

  // ============================================
  // JOBS (PUBLIC - public routes, ADMIN - management routes)
  // ============================================
  JOBS: {
    LIST: `/jobs`,                                      // PUBLIC
    BY_ID: (id) => `/jobs/${id}`,                       // PUBLIC
  },

  // ============================================
  // CONTACT LENS FORMS (PUBLIC - website routes)
  // ============================================
  // Public endpoints for contact lens form configuration and checkout
  CONTACT_LENS_FORMS: {
    // Get form configuration by sub-category
    GET_CONFIG: (subCategoryId) => `/contact-lens-forms/config/${subCategoryId}`,

    // Get astigmatism dropdown values (public - active only)
    ASTIGMATISM_DROPDOWN_VALUES: `/contact-lens-forms/astigmatism/dropdown-values`,

    // Get spherical configurations (public - active only)
    SPHERICAL: `/contact-lens-forms/spherical`,

    // Checkout - Add contact lens to cart (requires user auth)
    CHECKOUT: `/contact-lens-forms/checkout`,
  },

  // ============================================
  // FORMS (PUBLIC - all routes)
  // ============================================
  // Form configs and submissions are PUBLIC (no auth required)
  // Admin endpoints for viewing/managing submissions are under ADMIN.REQUESTS.*
  // See docs/FORMS_INTEGRATION.md for complete forms integration guide
  // Use src/utils/formUtils.js for form operations
  FORMS: {
    CONTACT: {
      CONFIG: `/forms/contact`,                         // PUBLIC - Get contact form configuration
      SUBMIT: `/forms/contact/submissions`,             // PUBLIC - Submit contact form
    },
    DEMO: {
      CONFIG: `/forms/demo`,                            // PUBLIC - Get demo form configuration
      SUBMIT: `/forms/demo/submissions`,                 // PUBLIC - Submit demo request
    },
    PRICING: {
      CONFIG: `/forms/pricing`,                         // PUBLIC - Get pricing form configuration
      SUBMIT: `/forms/pricing/submissions`,             // PUBLIC - Submit pricing request
    },
    JOB_APPLICATION: {
      CONFIG: `/forms/job-application`,                  // PUBLIC - Get job application form configuration
      SUBMIT: `/forms/job-application/submissions`,     // PUBLIC - Submit job application
    },
    CREDENTIALS: {
      CONFIG: `/forms/credentials`,                     // PUBLIC - Get credentials form configuration
      SUBMIT: `/forms/credentials/submissions`,         // PUBLIC - Submit credentials request
    },
    SUPPORT: {
      CONFIG: `/forms/support`,                         // PUBLIC - Get support form configuration
      SUBMIT: `/forms/support/submissions`,             // PUBLIC - Submit support request (supports file uploads via FormData)
    },
  },

  // ============================================
  // ADMIN - GENERAL (ALL ADMIN ONLY)
  // ============================================
  // ALL routes under /api/admin/* require admin_token
  ADMIN: {
    DASHBOARD: `/admin/dashboard`,

    // Products Management
    PRODUCTS: {
      LIST: `/admin/products`,
      CREATE: `/admin/products`,
      UPDATE: (id) => `/admin/products/${id}`,
      DELETE: (id) => `/admin/products/${id}`,
      BULK_UPLOAD: `/admin/products/bulk-upload`,
    },

    // Orders Management (Admin view)
    ORDERS: {
      LIST: `/admin/orders`,                    // ADMIN - Get all orders with filters
      BY_ID: (id) => `/admin/orders/${id}`,     // ADMIN - Get order details
    },

    // Users Management
    USERS: {
      LIST: `/admin/users`,
      CREATE: `/admin/users`,
      UPDATE: (id) => `/admin/users/${id}`,
    },

    // Categories Management
    CATEGORIES: {
      LIST: `/admin/categories`,
      BY_ID: (id) => `/admin/categories/${id}`,
      CREATE: `/admin/categories`,
      UPDATE: (id) => `/admin/categories/${id}`,
      DELETE: (id) => `/admin/categories/${id}`,
    },

    // SubCategories Management
    SUBCATEGORIES: {
      LIST: `/admin/subcategories`, // ADMIN - Get all subcategories with pagination
      BY_ID: (id) => `/admin/subcategories/${id}`, // ADMIN - Get single subcategory with full details
      CREATE: `/admin/subcategories`, // ADMIN - Create subcategory/sub-subcategory (set parent_id: null for top-level, or parent_id: <number> for sub-subcategory)
      UPDATE: (id) => `/admin/subcategories/${id}`, // ADMIN - Update subcategory (can change parent_id to convert between top-level and sub-subcategory)
      DELETE: (id) => `/admin/subcategories/${id}`, // ADMIN - Delete subcategory
      TOP_LEVEL: `/admin/subcategories/top-level`, // ADMIN - Get only top-level subcategories (parent_id = null)
      NESTED: `/admin/subcategories/nested`, // ADMIN - Get all sub-subcategories with pagination (filtered list of sub-subcategories only)
      BY_PARENT: (parentId) => `/admin/subcategories/by-parent/${parentId}`, // ADMIN - Get sub-subcategories by parent ID (returns parent info + sub-subcategories with full details)
      AVAILABLE_PARENTS: (categoryId) => `/admin/subcategories/available-parents/${categoryId}`, // ADMIN - Get available parents (includes "None" option, returns array with "None (Top-level subcategory)" as first item)
    },

    // Frame Sizes Management
    FRAME_SIZES: {
      LIST: `/admin/frame-sizes`,
      BY_ID: (id) => `/admin/frame-sizes/${id}`,
      CREATE: `/admin/frame-sizes`,
      UPDATE: (id) => `/admin/frame-sizes/${id}`,
      DELETE: (id) => `/admin/frame-sizes/${id}`,
    },

    // Lens Types Management
    LENS_TYPES: {
      LIST: `/admin/lens-types`,
      CREATE: `/admin/lens-types`,
      UPDATE: (id) => `/admin/lens-types/${id}`,
      DELETE: (id) => `/admin/lens-types/${id}`,
    },

    // Lens Coatings Management
    LENS_COATINGS: {
      LIST: `/admin/lens-coatings`,
      CREATE: `/admin/lens-coatings`,
      UPDATE: (id) => `/admin/lens-coatings/${id}`,
      DELETE: (id) => `/admin/lens-coatings/${id}`,
    },

    // Configs Management (for Simulations page)
    CONFIGS: {
      LIST: `/admin/configs`,
      CREATE: `/admin/configs`,
      UPDATE: (id) => `/admin/configs/${id}`,
      DELETE: (id) => `/admin/configs/${id}`,
    },

    // Navigation Menus Management
    MENUS: {
      LIST: `/admin/menus`,
      CREATE: `/admin/menus`,
      BY_ID: (id) => `/admin/menus/${id}`,
      UPDATE: (id) => `/admin/menus/${id}`,
      DELETE: (id) => `/admin/menus/${id}`,
    },

    // Navigation Menu Items Management
    MENU_ITEMS: {
      LIST: `/admin/menu-items`,
      CREATE: `/admin/menu-items`,
      BY_ID: (id) => `/admin/menu-items/${id}`,
      UPDATE: (id) => `/admin/menu-items/${id}`,
      DELETE: (id) => `/admin/menu-items/${id}`,
    },

    // Coupons Management
    COUPONS: {
      LIST: `/admin/coupons`,
      CREATE: `/admin/coupons`,
      UPDATE: (id) => `/admin/coupons/${id}`,
      DELETE: (id) => `/admin/coupons/${id}`,
    },

    // Campaigns Management
    CAMPAIGNS: {
      LIST: `/admin/campaigns`,
      CREATE: `/admin/campaigns`,
      UPDATE: (id) => `/admin/campaigns/${id}`,
      DELETE: (id) => `/admin/campaigns/${id}`,
    },

    // Jobs Management
    JOBS: {
      LIST: `/admin/jobs`,
      BY_ID: (id) => `/admin/jobs/${id}`,
      CREATE: `/admin/jobs`,
      UPDATE: (id) => `/admin/jobs/${id}`,
      DELETE: (id) => `/admin/jobs/${id}`,
    },

    // Job Applications Management
    JOB_APPLICATIONS: {
      LIST: `/admin/job-applications`,
      BY_ID: (id) => `/admin/job-applications/${id}`,
      UPDATE_STATUS: (id) => `/admin/job-applications/${id}/status`,
      ACCEPT: (id) => `/admin/job-applications/${id}/accept`,
      REJECT: (id) => `/admin/job-applications/${id}/reject`,
      DELETE: (id) => `/admin/job-applications/${id}`,
    },

    // Form Requests Management (Admin view of form submissions)
    // These endpoints manage submissions from public forms (FORMS.*)
    // See docs/FORMS_INTEGRATION.md for complete integration guide
    CONTACT_REQUESTS: {
      LIST: `/admin/requests/contact`,                    // ADMIN - List all contact form submissions
      BY_ID: (id) => `/admin/requests/contact/${id}`,     // ADMIN - Get contact submission by ID
      DELETE: (id) => `/admin/requests/contact/${id}`,     // ADMIN - Delete contact submission
    },

    DEMO_REQUESTS: {
      LIST: `/admin/requests/demo`,                       // ADMIN - List all demo form submissions
      BY_ID: (id) => `/admin/requests/demo/${id}`,        // ADMIN - Get demo submission by ID
      DELETE: (id) => `/admin/requests/demo/${id}`,       // ADMIN - Delete demo submission
    },

    PRICING_REQUESTS: {
      LIST: `/admin/requests/pricing`,                    // ADMIN - List all pricing form submissions
      BY_ID: (id) => `/admin/requests/pricing/${id}`,     // ADMIN - Get pricing submission by ID
      DELETE: (id) => `/admin/requests/pricing/${id}`,    // ADMIN - Delete pricing submission
    },

    CREDENTIALS_REQUESTS: {
      LIST: `/admin/requests/credentials`,                // ADMIN - List all credentials form submissions
      BY_ID: (id) => `/admin/requests/credentials/${id}`,  // ADMIN - Get credentials submission by ID
      DELETE: (id) => `/admin/requests/credentials/${id}`, // ADMIN - Delete credentials submission
    },

    SUPPORT_REQUESTS: {
      LIST: `/admin/requests/support`,                    // ADMIN - List all support form submissions (with attachments)
      BY_ID: (id) => `/admin/requests/support/${id}`,     // ADMIN - Get support submission by ID (includes attachments)
      DELETE: (id) => `/admin/requests/support/${id}`,     // ADMIN - Delete support submission
    },

    // Transactions Management
    TRANSACTIONS: {
      LIST: `/admin/transactions`,
      BY_ID: (id) => `/admin/transactions/${id}`,
      CREATE: `/admin/transactions`,
      STATS: `/admin/transactions/stats`,
      UPDATE_STATUS: (id) => `/admin/transactions/${id}/status`,
    },

    // FAQs Management
    FAQS: {
      LIST: `/admin/faqs`,
      CREATE: `/admin/faqs`,
      BY_ID: (id) => `/admin/faqs/${id}`,
      UPDATE: (id) => `/admin/faqs/${id}`,
      DELETE: (id) => `/admin/faqs/${id}`,
    },

    // Blog Posts Management
    BLOG_POSTS: {
      LIST: `/admin/blog-posts`,
      CREATE: `/admin/blog-posts`,
      BY_ID: (id) => `/admin/blog-posts/${id}`,
      UPDATE: (id) => `/admin/blog-posts/${id}`,
      DELETE: (id) => `/admin/blog-posts/${id}`,
    },

    // Pages Management
    PAGES: {
      LIST: `/admin/pages`,
      CREATE: `/admin/pages`,
      BY_ID: (id) => `/admin/pages/${id}`,
      UPDATE: (id) => `/admin/pages/${id}`,
      DELETE: (id) => `/admin/pages/${id}`,
    },

    // Testimonials Management
    TESTIMONIALS: {
      LIST: `/admin/testimonials`,
      CREATE: `/admin/testimonials`,
      BY_ID: (id) => `/admin/testimonials/${id}`,
      UPDATE: (id) => `/admin/testimonials/${id}`,
      DELETE: (id) => `/admin/testimonials/${id}`,
    },

    // Banners Management
    BANNERS: {
      LIST: `/admin/banners`,
      CREATE: `/admin/banners`,
      BY_ID: (id) => `/admin/banners/${id}`,
      UPDATE: (id) => `/admin/banners/${id}`,
      DELETE: (id) => `/admin/banners/${id}`,
    },

    // Shipping Methods Management
    SHIPPING_METHODS: {
      LIST: `/admin/shipping-methods`,
      BY_ID: (id) => `/admin/shipping-methods/${id}`,
      CREATE: `/admin/shipping-methods`,
      UPDATE: (id) => `/admin/shipping-methods/${id}`,
      DELETE: (id) => `/admin/shipping-methods/${id}`,
    },

    // Lens Options Management
    LENS_OPTIONS: {
      LIST: `/admin/lens-options`,
      BY_ID: (id) => `/admin/lens-options/${id}`,
      CREATE: `/admin/lens-options`,
      UPDATE: (id) => `/admin/lens-options/${id}`,
      DELETE: (id) => `/admin/lens-options/${id}`,
    },

    // Lens Colors Management
    LENS_COLORS: {
      LIST: `/admin/lens-colors`,
      BY_ID: (id) => `/admin/lens-colors/${id}`,
      CREATE: `/admin/lens-colors`,
      UPDATE: (id) => `/admin/lens-colors/${id}`,
      DELETE: (id) => `/admin/lens-colors/${id}`,
    },

    // Lens Treatments Management
    LENS_TREATMENTS: {
      LIST: `/admin/lens-treatments`,
      BY_ID: (id) => `/admin/lens-treatments/${id}`,
      CREATE: `/admin/lens-treatments`,
      UPDATE: (id) => `/admin/lens-treatments/${id}`,
      DELETE: (id) => `/admin/lens-treatments/${id}`,
    },

    // Lens Finishes Management
    LENS_FINISHES: {
      LIST: `/admin/lens-finishes`,
      BY_ID: (id) => `/admin/lens-finishes/${id}`,
      CREATE: `/admin/lens-finishes`,
      UPDATE: (id) => `/admin/lens-finishes/${id}`,
      DELETE: (id) => `/admin/lens-finishes/${id}`,
    },

    // Lens Thickness Materials Management
    LENS_THICKNESS_MATERIALS: {
      LIST: `/admin/lens-thickness-materials`,
      BY_ID: (id) => `/admin/lens-thickness-materials/${id}`,
      CREATE: `/admin/lens-thickness-materials`,
      UPDATE: (id) => `/admin/lens-thickness-materials/${id}`,
      DELETE: (id) => `/admin/lens-thickness-materials/${id}`,
    },

    // Lens Thickness Options Management
    LENS_THICKNESS_OPTIONS: {
      LIST: `/admin/lens-thickness-options`,
      BY_ID: (id) => `/admin/lens-thickness-options/${id}`,
      CREATE: `/admin/lens-thickness-options`,
      UPDATE: (id) => `/admin/lens-thickness-options/${id}`,
      DELETE: (id) => `/admin/lens-thickness-options/${id}`,
    },

    // Prescription Lens Types Management
    PRESCRIPTION_LENS_TYPES: {
      LIST: `/admin/prescription-lens-types`,
      BY_ID: (id) => `/admin/prescription-lens-types/${id}`,
      CREATE: `/admin/prescription-lens-types`,
      UPDATE: (id) => `/admin/prescription-lens-types/${id}`,
      DELETE: (id) => `/admin/prescription-lens-types/${id}`,
    },

    // Prescription Lens Variants Management
    PRESCRIPTION_LENS_VARIANTS: {
      LIST: `/admin/prescription-lens-variants`,
      BY_ID: (id) => `/admin/prescription-lens-variants/${id}`,
      CREATE: `/admin/prescription-lens-variants`,
      UPDATE: (id) => `/admin/prescription-lens-variants/${id}`,
      DELETE: (id) => `/admin/prescription-lens-variants/${id}`,
    },

    // Prescription Sun Lenses Management
    PRESCRIPTION_SUN_LENSES: {
      LIST: `/admin/prescription-sun-lenses`,
      BY_ID: (id) => `/admin/prescription-sun-lenses/${id}`,
      CREATE: `/admin/prescription-sun-lenses`,
      UPDATE: (id) => `/admin/prescription-sun-lenses/${id}`,
      DELETE: (id) => `/admin/prescription-sun-lenses/${id}`,
    },

    // Photochromic Lenses Management
    PHOTOCHROMIC_LENSES: {
      LIST: `/admin/photochromic-lenses`,
      BY_ID: (id) => `/admin/photochromic-lenses/${id}`,
      CREATE: `/admin/photochromic-lenses`,
      UPDATE: (id) => `/admin/photochromic-lenses/${id}`,
      DELETE: (id) => `/admin/photochromic-lenses/${id}`,
    },

    // VTO Settings (for Simulations page)
    VTO_SETTINGS: {
      GET: `/admin/vto-settings`,
      UPDATE: `/admin/vto-settings`,
    },

    // Contact Lens Forms Management
    CONTACT_LENS_FORMS: {
      // Spherical Configurations
      SPHERICAL: {
        LIST: `/contact-lens-forms/admin/spherical`,
        CREATE: `/contact-lens-forms/admin/spherical`,
        BY_ID: (id) => `/contact-lens-forms/admin/spherical/${id}`,
        UPDATE: (id) => `/contact-lens-forms/admin/spherical/${id}`,
        DELETE: (id) => `/contact-lens-forms/admin/spherical/${id}`,
      },
      // Astigmatism Dropdown Values
      ASTIGMATISM: {
        DROPDOWN_VALUES: {
          LIST: `/contact-lens-forms/admin/astigmatism/dropdown-values`,
          CREATE: `/contact-lens-forms/admin/astigmatism/dropdown-values`,
          UPDATE: (id) => `/contact-lens-forms/admin/astigmatism/dropdown-values/${id}`,
          DELETE: (id) => `/contact-lens-forms/admin/astigmatism/dropdown-values/${id}`,
        },
      },
    },
  },

  // ============================================
  // MARKETING (ADMIN ONLY)
  // ============================================
  // ALL routes under /api/marketing/* require admin_token
  MARKETING: {
    // Coupons
    COUPONS: {
      LIST: `/marketing/coupons`,
      CREATE: `/marketing/coupons`,
      UPDATE: (id) => `/marketing/coupons/${id}`,
      DELETE: (id) => `/marketing/coupons/${id}`,
    },

    // Campaigns
    CAMPAIGNS: {
      LIST: `/marketing/campaigns`,
      CREATE: `/marketing/campaigns`,
      UPDATE: (id) => `/marketing/campaigns/${id}`,
      DELETE: (id) => `/marketing/campaigns/${id}`,
    },
  },

  // ============================================
  // CMS
  // ============================================
  // GET routes are PUBLIC, POST/PUT/DELETE require admin_token
  // Note: Testimonials use /api/cms/testimonials (not /api/admin/testimonials)
  CMS: {
    // Testimonials (uses /api/cms/testimonials)
    TESTIMONIALS: {
      LIST: `/cms/testimonials`,                // PUBLIC
      CREATE: `/cms/testimonials`,              // ADMIN
      UPDATE: (id) => `/cms/testimonials/${id}`, // ADMIN
      DELETE: (id) => `/cms/testimonials/${id}`, // ADMIN
    },
  },

  // ============================================
  // ANALYTICS (ADMIN ONLY)
  // ============================================
  // ALL routes under /api/analytics/* require admin_token
  ANALYTICS: {
    SALES: `/analytics/sales`,
    VTO: `/analytics/vto`,
    CONVERSION: `/analytics/conversion`,
    LOGS: {
      ADMIN: `/analytics/logs/admin`,
      ERRORS: `/analytics/logs/errors`,
    },
  },

  // ============================================
  // OVERVIEW (ADMIN ONLY)
  // ============================================
  OVERVIEW: {
    GET: `/overview`,                                   // ADMIN
  },

  // ============================================
  // HEALTH CHECK (PUBLIC)
  // ============================================
  HEALTH: {
    CHECK: '/health',                                              // PUBLIC
    API_INFO: ``,                                      // PUBLIC (empty string, baseURL handles /api)
  },
};

/**
 * Helper function to build query strings
 * @param {string} baseUrl - Base URL
 * @param {object} params - Query parameters
 * @returns {string} URL with query string
 */
export const buildQueryString = (baseUrl, params = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Common query parameters used across endpoints
 */
export const QUERY_PARAMS = {
  // Pagination
  PAGE: 'page',
  LIMIT: 'limit',

  // Product filters
  FRAME_SHAPE: 'frameShape',
  FRAME_MATERIAL: 'frameMaterial',
  MIN_PRICE: 'minPrice',
  MAX_PRICE: 'maxPrice',

  // Order/Status filters
  STATUS: 'status',

  // Date ranges
  RANGE: 'range',
  PERIOD: 'period',

  // Includes
  INCLUDE_PRODUCTS: 'includeProducts',

  // VTO
  TYPE: 'type',
};

export default API_ROUTES;

