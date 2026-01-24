import api from '../utils/api';
import axios from 'axios';
import { API_ROUTES } from '../config/apiRoutes';

// Helper to build query string
const buildQuery = (params) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.active) query.append('active', params.active);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
};

// Public API client for endpoints that don't require authentication
const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://optyshop-frontend.hmstech.org/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================
// FLASH OFFERS API (ADMIN)
// ============================================
export const flashOffersApi = {
    // Get all flash offers (Admin)
    getFlashOffers: async (params = {}) => {
        const response = await api.get(`${API_ROUTES.ADMIN.FLASH_OFFERS.LIST}${buildQuery(params)}`);
        return response.data;
    },

    // Get specific flash offer by ID (Admin)
    getFlashOfferById: async (id) => {
        const response = await api.get(API_ROUTES.ADMIN.FLASH_OFFERS.BY_ID(id));
        return response.data;
    },

    // Create new flash offer (Admin)
    createFlashOffer: async (offerData) => {
        const response = await api.post(API_ROUTES.ADMIN.FLASH_OFFERS.CREATE, offerData);
        return response.data;
    },

    // Update flash offer (Admin)
    updateFlashOffer: async (id, offerData) => {
        const response = await api.put(API_ROUTES.ADMIN.FLASH_OFFERS.UPDATE(id), offerData);
        return response.data;
    },

    // Delete flash offer (Admin)
    deleteFlashOffer: async (id) => {
        const response = await api.delete(API_ROUTES.ADMIN.FLASH_OFFERS.DELETE(id));
        return response.data;
    },

    // Toggle flash offer status (active/inactive)
    toggleFlashOfferStatus: async (id, isActive) => {
        const response = await api.patch(`/admin/flash-offers/${id}/status`, { isActive });
        return response.data;
    },
};

// ============================================
// PRODUCT GIFTS API (ADMIN)
// ============================================
export const productGiftsApi = {
    // Get all product gifts (Admin)
    getProductGifts: async (params = {}) => {
        const response = await api.get(`${API_ROUTES.ADMIN.FREE_GIFTS.LIST}${buildQuery(params)}`);
        return response.data;
    },

    // Get specific product gift by ID (Admin)
    getProductGiftById: async (id) => {
        const response = await api.get(API_ROUTES.ADMIN.FREE_GIFTS.BY_ID(id));
        return response.data;
    },

    // Create new product gift (Admin)
    createProductGift: async (giftData) => {
        const response = await api.post(API_ROUTES.ADMIN.FREE_GIFTS.CREATE, giftData);
        return response.data;
    },

    // Update product gift (Admin)
    updateProductGift: async (id, giftData) => {
        const response = await api.put(API_ROUTES.ADMIN.FREE_GIFTS.UPDATE(id), giftData);
        return response.data;
    },

    // Delete product gift (Admin)
    deleteProductGift: async (id) => {
        const response = await api.delete(API_ROUTES.ADMIN.FREE_GIFTS.DELETE(id));
        return response.data;
    },

    // Toggle product gift status (active/inactive)
    toggleProductGiftStatus: async (id, isActive) => {
        const response = await api.patch(`/admin/product-gifts/${id}/status`, { isActive });
        return response.data;
    },

    // Get gifts for specific product (Admin)
    getGiftsByProduct: async (productId) => {
        const response = await api.get(`/admin/product-gifts/product/${productId}`);
        return response.data;
    },
};

// ============================================
// PUBLIC API ENDPOINTS
// ============================================
export const publicApiEndpoints = {
    // Get all public flash offers
    getPublicFlashOffers: async (params = {}) => {
        const response = await publicApi.get(`${API_ROUTES.FLASH_OFFERS.LIST}${buildQuery(params)}`);
        return response.data;
    },

    // Get active flash offer
    getActiveFlashOffer: async () => {
        const response = await publicApi.get(API_ROUTES.FLASH_OFFERS.ACTIVE);
        return response.data;
    },

    // Get all public product gifts
    getPublicProductGifts: async (params = {}) => {
        const response = await publicApi.get(`${API_ROUTES.PRODUCT_GIFTS.LIST}${buildQuery(params)}`);
        return response.data;
    },

    // Get gifts for specific product (Public)
    getPublicGiftsByProduct: async (productId) => {
        const response = await publicApi.get(API_ROUTES.PRODUCT_GIFTS.BY_PRODUCT(productId));
        return response.data;
    },
};

// Export all APIs as a single object for convenience
export const promotionsApi = {
    flashOffers: flashOffersApi,
    productGifts: productGiftsApi,
    public: publicApiEndpoints,
};

// Default export
export default promotionsApi;
