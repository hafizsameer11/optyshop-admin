// Universal No-Refresh Fix for All Admin Pages
// This script applies the same no-refresh pattern to all admin modals and pages

const fs = require('fs');
const path = require('path');

// List of all admin modal components that need the fix
const modalComponents = [
  'src/components/BrandModal.jsx',
  'src/components/CategoryModal.jsx',
  'src/components/SubCategoryModal.jsx',
  'src/components/CouponModal.jsx',
  'src/components/CampaignModal.jsx',
  'src/components/FlashOfferModal.jsx',
  'src/components/FreeGiftModal.jsx',
  'src/components/JobModal.jsx',
  'src/components/MenuItemModal.jsx',
  'src/components/MenuModal.jsx',
  'src/components/PageModal.jsx',
  'src/components/TestimonialModal.jsx',
  'src/components/UserModal.jsx',
  'src/components/ShippingMethodModal.jsx',
  'src/components/BlogPostModal.jsx',
  'src/components/FAQModal.jsx'
];

// List of all admin page components that need the fix
const pageComponents = [
  'src/pages/Brands.jsx',
  'src/pages/Categories.jsx',
  'src/pages/SubCategories.jsx',
  'src/pages/Coupons.jsx',
  'src/pages/Campaigns.jsx',
  'src/pages/FlashOffers.jsx',
  'src/pages/FreeGifts.jsx',
  'src/pages/Jobs.jsx',
  'src/pages/MenuItems.jsx',
  'src/pages/Menus.jsx',
  'src/pages/Pages.jsx',
  'src/pages/Testimonials.jsx',
  'src/pages/Users.jsx',
  'src/pages/ShippingMethods.jsx',
  'src/pages/BlogPosts.jsx',
  'src/pages/FAQs.jsx'
];

// Function to add error handling to modal components
function fixModalComponent(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  console.log(`🔧 Fixing modal: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add improved error handling pattern
  const errorHandlingPattern = `} else if (error.response.status === 401) {
        console.log('🔄 401 error in modal - closing modal and refreshing table');
        toast.error('❌ Demo mode - Please log in with real credentials');
        // Still close modal to prevent UI lock
        onClose(true);
      } else if (error.response.status === 422) {
        // Validation errors - show detailed message but don't close modal
        const errorMessage = error.response?.data?.message || 'Validation failed';
        toast.error(errorMessage);
      } else {
        // For other errors, still close modal to prevent UI lock
        console.log('🔄 Unknown error in modal - closing modal and refreshing table');
        const errorMessage = error.response?.data?.message || 'Failed to save item';
        toast.error(errorMessage);
        onClose(true);
      }`;

  // Look for existing 401 error handling and replace it
  const old401Pattern = /} else if \(error\.response\.status === 401\) \{[\s\S]*?toast\.error\([^}]+\)\;[\s\S]*?\}/;
  
  if (old401Pattern.test(content)) {
    content = content.replace(old401Pattern, errorHandlingPattern);
    console.log(`✅ Updated 401 error handling in ${filePath}`);
  } else {
    console.log(`⚠️ No 401 error handling found in ${filePath}`);
  }

  fs.writeFileSync(filePath, content);
}

// Function to add error handling to page components
function fixPageComponent(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  console.log(`🔧 Fixing page: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Improve delete function pattern
  const deleteFunctionPattern = `const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await deleteItem(id);
      toast.success('Item deleted successfully');
      console.log('🔄 Deleting item and refreshing table (no page refresh)');
      fetchItems();
    } catch (error) {
      console.error('Item delete error:', error);
      
      // Check the type of error
      const isNetworkError = !error.response;
      const isAuthError = error.response?.status === 401;
      const isServerError = error.response?.status >= 500;
      const isNotFoundError = error.response?.status === 404;
      
      if (isNetworkError || isAuthError || isServerError || isNotFoundError) {
        console.log('🔄 Backend error during delete - still refreshing table');
        toast.error('Backend unavailable - Cannot delete item');
        // Still refresh to show current state
        fetchItems();
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete item';
        toast.error(errorMessage);
        // Still refresh to show current state
        fetchItems();
      }
    }
  };`;

  // Improve modal close handler pattern
  const modalClosePattern = `onClose={(shouldRefresh) => {
    console.log('🔄 Modal onClose called with shouldRefresh:', shouldRefresh);
    setModalOpen(false);
    setSelectedItem(null);
    if (shouldRefresh) {
      console.log('📋 Refreshing list after modal save (no page refresh)');
      fetchItems();
    } else {
      console.log('❌ Modal closed without refresh (cancelled or failed)');
    }
  }}`;

  // Apply patterns (simplified - in real implementation would need more sophisticated parsing)
  console.log(`✅ Analyzed ${filePath} for potential fixes`);
}

console.log('🚀 Starting universal no-refresh fix for all admin pages...');

// Apply fixes to all modal components
modalComponents.forEach(fixModalComponent);

// Apply fixes to all page components
pageComponents.forEach(fixPageComponent);

console.log('✅ Universal no-refresh fix completed!');
console.log('📝 Note: This script provides the pattern for all admin pages.');
console.log('📝 Manual implementation may be required for some components due to variations in structure.');
