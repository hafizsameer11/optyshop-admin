// Test script to verify the "All Products" fix
// Run this in the browser console when on the admin products page

console.log('🧪 Testing All Products fix...');

// 1. Check current state
const currentState = localStorage.getItem('products_page_state');
console.log('Current localStorage state:', currentState ? JSON.parse(currentState) : 'None');

// 2. Simulate clicking "All Products" button
// This should clear all filters
const testAllProducts = () => {
  // Clear all filters and set to 'all'
  localStorage.setItem('products_page_state', JSON.stringify({
    searchTerm: '',
    categoryFilter: '',
    subCategoryFilter: '',
    selectedSection: 'all',
    page: 1
  }));
  
  console.log('✅ Set state to All Products');
  console.log('New state:', JSON.parse(localStorage.getItem('products_page_state')));
  
  // Refresh the page to test
  console.log('🔄 Refresh the page to see all products');
};

// 3. Run the test
testAllProducts();

// 4. Check what API calls are being made
// (Look for console logs that show "All Products selected - NO category filters sent")
