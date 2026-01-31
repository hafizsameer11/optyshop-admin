// API Test Script - Run this in browser console on the admin panel
// This will test if the API is correctly returning all products when no filters are applied

(async function testProductsAPI() {
    console.log('🧪 Testing Products API...');
    
    try {
        // Test 1: Get all products without filters (should return ALL products)
        console.log('\n📋 Test 1: Getting all products without filters...');
        const response1 = await fetch('/api/admin/products?page=1&limit=12', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Note: Authorization header should be added automatically by api.js
            }
        });
        
        if (response1.ok) {
            const data1 = await response1.json();
            console.log('✅ Success - All products response:', {
                totalProducts: data1.data?.products?.length || 0,
                firstProduct: data1.data?.products?.[0]?.name || 'N/A',
                categories: [...new Set(data1.data?.products?.map(p => p.category?.name).filter(Boolean))]
            });
        } else {
            console.error('❌ Failed to get all products:', response1.status);
        }
        
        // Test 2: Get products with category filter (should return filtered products)
        console.log('\n📋 Test 2: Getting products with category filter...');
        const response2 = await fetch('/api/admin/products?page=1&limit=12&category_id=1', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response2.ok) {
            const data2 = await response2.json();
            console.log('✅ Success - Filtered products response:', {
                totalProducts: data2.data?.products?.length || 0,
                firstProduct: data2.data?.products?.[0]?.name || 'N/A',
                categories: [...new Set(data2.data?.products?.map(p => p.category?.name).filter(Boolean))]
            });
        } else {
            console.error('❌ Failed to get filtered products:', response2.status);
        }
        
        console.log('\n🎯 Comparison:');
        console.log('If Test 1 shows more products and multiple categories, the fix is working!');
        console.log('If Test 1 shows only eyeglasses, there might be a backend issue.');
        
    } catch (error) {
        console.error('❌ API test failed:', error);
    }
})();
