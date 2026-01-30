// Test banner creation to debug 400 error
import bannerAPI from './src/api/banners.js';

async function testBannerCreation() {
  console.log('Testing banner creation with minimal data...');
  
  try {
    // Test with minimal required fields
    const formData = new FormData();
    formData.append('title', 'Test Banner');
    formData.append('page_type', 'home');
    formData.append('link_url', '');
    formData.append('position', '');
    formData.append('sort_order', '0');
    formData.append('is_active', 'true');
    formData.append('image', ''); // Empty image field to test if this is the issue
    
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }
    
    const response = await bannerAPI.create(formData);
    console.log('✅ Success:', response);
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data);
    
    // Try without image field
    try {
      console.log('\nTesting without image field...');
      const formData2 = new FormData();
      formData2.append('title', 'Test Banner 2');
      formData2.append('page_type', 'home');
      formData2.append('link_url', '');
      formData2.append('position', '');
      formData2.append('sort_order', '0');
      formData2.append('is_active', 'true');
      // Don't append image field at all
      
      const response2 = await bannerAPI.create(formData2);
      console.log('✅ Success without image:', response2);
    } catch (error2) {
      console.error('❌ Error without image:', error2.response?.status, error2.response?.data);
    }
  }
}

// Run the test
testBannerCreation();
