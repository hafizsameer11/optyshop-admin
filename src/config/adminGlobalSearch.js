/** Header global search: route + label for “search in” dropdown */
export const ADMIN_GLOBAL_SEARCH_SCOPES = [
  { id: 'products', path: '/products', label: 'Products' },
  { id: 'orders', path: '/orders', label: 'Orders' },
  { id: 'users', path: '/users', label: 'Users' },
  { id: 'categories', path: '/categories', label: 'Categories' },
  { id: 'brands', path: '/brands', label: 'Brands' },
  { id: 'subcategories', path: '/subcategories', label: 'Subcategories' },
];

export const ADMIN_GLOBAL_SEARCH_SCOPE_KEY = 'admin_header_search_scope';

export const DEFAULT_ADMIN_SEARCH_SCOPE_ID = 'products';
