/**
 * Test file for Promotions API
 * This file contains test functions to verify the Flash Offers and Product Gifts API endpoints
 * 
 * To run these tests, uncomment the test functions and call them from your browser console
 * or in a development environment.
 */

import { flashOffersApi, productGiftsApi, publicApiEndpoints } from './promotions.js';

// ============================================
// FLASH OFFERS TESTS
// ============================================
export const testFlashOffers = {
    // Test GET all flash offers
    testGetFlashOffers: async () => {
        try {
            console.log('Testing GET all flash offers...');
            const result = await flashOffersApi.getFlashOffers();
            console.log('✅ GET all flash offers success:', result);
            return result;
        } catch (error) {
            console.error('❌ GET all flash offers failed:', error);
            throw error;
        }
    },

    // Test GET flash offer by ID
    testGetFlashOfferById: async (id = 1) => {
        try {
            console.log(`Testing GET flash offer by ID: ${id}...`);
            const result = await flashOffersApi.getFlashOfferById(id);
            console.log('✅ GET flash offer by ID success:', result);
            return result;
        } catch (error) {
            console.error('❌ GET flash offer by ID failed:', error);
            throw error;
        }
    },

    // Test CREATE flash offer
    testCreateFlashOffer: async () => {
        try {
            console.log('Testing CREATE flash offer...');
            const offerData = {
                title: 'Test Flash Offer',
                description: 'Test description',
                discountPercentage: 20,
                startDate: '2024-01-01T00:00:00Z',
                endDate: '2024-12-31T23:59:59Z',
                isActive: true,
                products: [1, 2, 3] // Product IDs
            };
            const result = await flashOffersApi.createFlashOffer(offerData);
            console.log('✅ CREATE flash offer success:', result);
            return result;
        } catch (error) {
            console.error('❌ CREATE flash offer failed:', error);
            throw error;
        }
    },

    // Test UPDATE flash offer
    testUpdateFlashOffer: async (id = 1) => {
        try {
            console.log(`Testing UPDATE flash offer: ${id}...`);
            const offerData = {
                title: 'Updated Flash Offer',
                description: 'Updated description',
                discountPercentage: 25,
                isActive: false
            };
            const result = await flashOffersApi.updateFlashOffer(id, offerData);
            console.log('✅ UPDATE flash offer success:', result);
            return result;
        } catch (error) {
            console.error('❌ UPDATE flash offer failed:', error);
            throw error;
        }
    },

    // Test DELETE flash offer
    testDeleteFlashOffer: async (id = 1) => {
        try {
            console.log(`Testing DELETE flash offer: ${id}...`);
            const result = await flashOffersApi.deleteFlashOffer(id);
            console.log('✅ DELETE flash offer success:', result);
            return result;
        } catch (error) {
            console.error('❌ DELETE flash offer failed:', error);
            throw error;
        }
    },

    // Test TOGGLE flash offer status
    testToggleFlashOfferStatus: async (id = 1, isActive = true) => {
        try {
            console.log(`Testing TOGGLE flash offer status: ${id}, active: ${isActive}...`);
            const result = await flashOffersApi.toggleFlashOfferStatus(id, isActive);
            console.log('✅ TOGGLE flash offer status success:', result);
            return result;
        } catch (error) {
            console.error('❌ TOGGLE flash offer status failed:', error);
            throw error;
        }
    }
};

// ============================================
// PRODUCT GIFTS TESTS
// ============================================
export const testProductGifts = {
    // Test GET all product gifts
    testGetProductGifts: async () => {
        try {
            console.log('Testing GET all product gifts...');
            const result = await productGiftsApi.getProductGifts();
            console.log('✅ GET all product gifts success:', result);
            return result;
        } catch (error) {
            console.error('❌ GET all product gifts failed:', error);
            throw error;
        }
    },

    // Test GET product gift by ID
    testGetProductGiftById: async (id = 1) => {
        try {
            console.log(`Testing GET product gift by ID: ${id}...`);
            const result = await productGiftsApi.getProductGiftById(id);
            console.log('✅ GET product gift by ID success:', result);
            return result;
        } catch (error) {
            console.error('❌ GET product gift by ID failed:', error);
            throw error;
        }
    },

    // Test CREATE product gift
    testCreateProductGift: async () => {
        try {
            console.log('Testing CREATE product gift...');
            const giftData = {
                name: 'Test Product Gift',
                description: 'Test gift description',
                productId: 1,
                giftProductId: 2,
                quantity: 1,
                isActive: true,
                conditions: {
                    minPurchaseAmount: 100,
                    applicableCategories: [1, 2]
                }
            };
            const result = await productGiftsApi.createProductGift(giftData);
            console.log('✅ CREATE product gift success:', result);
            return result;
        } catch (error) {
            console.error('❌ CREATE product gift failed:', error);
            throw error;
        }
    },

    // Test UPDATE product gift
    testUpdateProductGift: async (id = 1) => {
        try {
            console.log(`Testing UPDATE product gift: ${id}...`);
            const giftData = {
                name: 'Updated Product Gift',
                description: 'Updated gift description',
                quantity: 2,
                isActive: false
            };
            const result = await productGiftsApi.updateProductGift(id, giftData);
            console.log('✅ UPDATE product gift success:', result);
            return result;
        } catch (error) {
            console.error('❌ UPDATE product gift failed:', error);
            throw error;
        }
    },

    // Test DELETE product gift
    testDeleteProductGift: async (id = 1) => {
        try {
            console.log(`Testing DELETE product gift: ${id}...`);
            const result = await productGiftsApi.deleteProductGift(id);
            console.log('✅ DELETE product gift success:', result);
            return result;
        } catch (error) {
            console.error('❌ DELETE product gift failed:', error);
            throw error;
        }
    },

    // Test TOGGLE product gift status
    testToggleProductGiftStatus: async (id = 1, isActive = true) => {
        try {
            console.log(`Testing TOGGLE product gift status: ${id}, active: ${isActive}...`);
            const result = await productGiftsApi.toggleProductGiftStatus(id, isActive);
            console.log('✅ TOGGLE product gift status success:', result);
            return result;
        } catch (error) {
            console.error('❌ TOGGLE product gift status failed:', error);
            throw error;
        }
    },

    // Test GET gifts by product
    testGetGiftsByProduct: async (productId = 1) => {
        try {
            console.log(`Testing GET gifts by product: ${productId}...`);
            const result = await productGiftsApi.getGiftsByProduct(productId);
            console.log('✅ GET gifts by product success:', result);
            return result;
        } catch (error) {
            console.error('❌ GET gifts by product failed:', error);
            throw error;
        }
    }
};

// ============================================
// PUBLIC API TESTS
// ============================================
export const testPublicApi = {
    // Test GET public flash offers
    testGetPublicFlashOffers: async () => {
        try {
            console.log('Testing GET public flash offers...');
            const result = await publicApiEndpoints.getPublicFlashOffers();
            console.log('✅ GET public flash offers success:', result);
            return result;
        } catch (error) {
            console.error('❌ GET public flash offers failed:', error);
            throw error;
        }
    },

    // Test GET active flash offer
    testGetActiveFlashOffer: async () => {
        try {
            console.log('Testing GET active flash offer...');
            const result = await publicApiEndpoints.getActiveFlashOffer();
            console.log('✅ GET active flash offer success:', result);
            return result;
        } catch (error) {
            console.error('❌ GET active flash offer failed:', error);
            throw error;
        }
    },

    // Test GET public product gifts
    testGetPublicProductGifts: async () => {
        try {
            console.log('Testing GET public product gifts...');
            const result = await publicApiEndpoints.getPublicProductGifts();
            console.log('✅ GET public product gifts success:', result);
            return result;
        } catch (error) {
            console.error('❌ GET public product gifts failed:', error);
            throw error;
        }
    },

    // Test GET public gifts by product
    testGetPublicGiftsByProduct: async (productId = 1) => {
        try {
            console.log(`Testing GET public gifts by product: ${productId}...`);
            const result = await publicApiEndpoints.getPublicGiftsByProduct(productId);
            console.log('✅ GET public gifts by product success:', result);
            return result;
        } catch (error) {
            console.error('❌ GET public gifts by product failed:', error);
            throw error;
        }
    }
};

// ============================================
// COMPREHENSIVE TEST RUNNER
// ============================================
export const runAllTests = async () => {
    console.log('🚀 Starting comprehensive API tests...');
    
    try {
        // Test Public APIs first (no authentication required)
        console.log('\n📋 Testing Public APIs...');
        await testPublicApi.testGetPublicFlashOffers();
        await testPublicApi.testGetActiveFlashOffer();
        await testPublicApi.testGetPublicProductGifts();
        await testPublicApi.testGetPublicGiftsByProduct();

        // Test Flash Offers Admin APIs
        console.log('\n📋 Testing Flash Offers Admin APIs...');
        await testFlashOffers.testGetFlashOffers();
        
        // Test Product Gifts Admin APIs
        console.log('\n📋 Testing Product Gifts Admin APIs...');
        await testProductGifts.testGetProductGifts();

        console.log('\n✅ All basic tests completed successfully!');
        console.log('⚠️  Note: CREATE, UPDATE, DELETE tests require proper authentication and permissions.');
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
        throw error;
    }
};

// Export test runner for easy access
export default {
    flashOffers: testFlashOffers,
    productGifts: testProductGifts,
    public: testPublicApi,
    runAll: runAllTests
};

/*
USAGE EXAMPLES:

// Import and run tests
import promotionsTests from './promotions.test.js';

// Run all tests
await promotionsTests.runAll();

// Run specific test
await promotionsTests.flashOffers.testGetFlashOffers();
await promotionsTests.productGifts.testGetProductGifts();

// Run public API tests
await promotionsTests.public.testGetPublicFlashOffers();

Note: Make sure you have proper authentication set up in your api.js
for admin endpoints to work correctly.
*/
