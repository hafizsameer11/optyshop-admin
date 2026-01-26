import api from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

// Helper to build query string
const buildQuery = (params) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
};

export const mmCalibersApi = {
    // Get all calibers for a product
    getProductCalibers: async (productId) => {
        const response = await api.get(API_ROUTES.ADMIN.PRODUCTS.MM_CALIBERS.LIST(productId));
        return response.data;
    },

    // Add a new MM caliber to a product
    addCaliberToProduct: async (productId, caliberData) => {
        const response = await api.post(API_ROUTES.ADMIN.PRODUCTS.MM_CALIBERS.CREATE(productId), caliberData);
        return response.data;
    },

    // Update MM caliber image URL
    updateCaliber: async (productId, mm, updateData) => {
        const response = await api.put(API_ROUTES.ADMIN.PRODUCTS.MM_CALIBERS.UPDATE(productId, mm), updateData);
        return response.data;
    },

    // Delete MM caliber from product
    deleteCaliber: async (productId, mm) => {
        const response = await api.delete(API_ROUTES.ADMIN.PRODUCTS.MM_CALIBERS.DELETE(productId, mm));
        return response.data;
    },

    // Get product with caliber options (public endpoint)
    getProductWithCalibers: async (productId) => {
        const response = await api.get(API_ROUTES.PRODUCTS.WITH_CALIBERS(productId));
        return response.data;
    },

    // Get category products with calibers (public endpoint)
    getCategoryProductsWithCalibers: async (categoryId, params = {}) => {
        const response = await api.get(`${API_ROUTES.CATEGORIES.PRODUCTS_WITH_CALIBERS(categoryId)}${buildQuery(params)}`);
        return response.data;
    }
};
