# Banner System Implementation Guide

## Overview
The banner system has been fully implemented to support category hierarchy assignments. Banners can be assigned to:
- **Home Page** - Global banners shown on the homepage
- **Category Pages** - Banners shown on specific category pages
- **Subcategory Pages** - Banners shown on specific subcategory pages  
- **Sub-subcategory Pages** - Banners shown on specific sub-subcategory pages

## Admin Panel Features

### Banner Table Display
The banner table now clearly shows:
- **Assignment Column**: Shows what the banner is assigned to (Home Page, Category, Subcategory, or Sub-subcategory)
- **Parent Category Column**: Shows the parent category context for subcategory and sub-subcategory assignments

### Banner Creation/Editing
When creating or editing a banner, you can:

1. **Select Page Type**:
   - Home Page: No category selection needed
   - Category Page: Select a category
   - Subcategory Page: Select a category, then a subcategory
   - Sub-subcategory Page: Select a category, parent subcategory, then nested subcategory

2. **Category Hierarchy Selection**:
   - Categories are loaded dynamically
   - Subcategories are filtered based on selected category
   - Sub-subcategories are filtered based on selected parent subcategory

3. **Form Validation**:
   - Required fields are validated based on page type
   - Image upload with file type and size validation
   - Proper error handling with user-friendly messages

### Filtering System
The admin panel includes advanced filtering:
- Filter by page type (Home, Category, Subcategory, Sub-subcategory)
- Filter by category
- Filter by subcategory (when category is selected)
- Clear all filters option

## API Implementation

### Admin Endpoints
- `GET /admin/banners` - Get all banners with optional filters
- `POST /admin/banners` - Create new banner
- `GET /admin/banners/:id` - Get specific banner
- `PUT /admin/banners/:id` - Update banner
- `DELETE /admin/banners/:id` - Delete banner

### Public Endpoints (Website)
- `GET /banners` - Get active banners with optional filters
- `GET /banners?page_type=home` - Get home page banners
- `GET /banners?page_type=category&category_id=1` - Get category banners
- `GET /banners?page_type=subcategory&category_id=1&sub_category_id=2` - Get subcategory banners
- `GET /banners?page_type=sub_subcategory&category_id=1&sub_category_id=2` - Get sub-subcategory banners

## Database Schema
Banners table includes:
- `page_type` - 'home', 'category', 'subcategory', 'sub_subcategory'
- `category_id` - Foreign key to categories (nullable for home page)
- `sub_category_id` - Foreign key to subcategories (nullable for home/category pages)

## Frontend Website Integration

### How to Display Banners on Website

```javascript
import bannerAPI from './api/banners';

// Get home page banners
const homeBanners = await bannerAPI.getPublicBanners({ page_type: 'home' });

// Get category page banners
const categoryBanners = await bannerAPI.getPublicBanners({ 
  page_type: 'category', 
  category_id: categoryId 
});

// Get subcategory page banners
const subcategoryBanners = await bannerAPI.getPublicBanners({ 
  page_type: 'subcategory', 
  category_id: categoryId,
  sub_category_id: subcategoryId 
});

// Get sub-subcategory page banners
const subSubcategoryBanners = await bannerAPI.getPublicBanners({ 
  page_type: 'sub_subcategory', 
  category_id: categoryId,
  sub_category_id: subcategoryId 
});
```

### Banner Display Logic
1. **Home Page**: Show all banners with `page_type='home'` and `is_active=true`
2. **Category Page**: Show banners with `page_type='category'` and matching `category_id`
3. **Subcategory Page**: Show banners with `page_type='subcategory'` and matching `category_id` and `sub_category_id`
4. **Sub-subcategory Page**: Show banners with `page_type='sub_subcategory'` and matching IDs

## Testing Instructions

### 1. Start the Admin Panel
```bash
cd d:\OPTshop\admin-panel
npm run dev
```

### 2. Test Banner Creation
1. Navigate to the Banners page in the admin panel
2. Click "Add Banner"
3. Test each page type:
   - **Home Page**: Select "Home Page", fill in title, upload image, save
   - **Category Page**: Select "Category Page", choose a category, fill details, save
   - **Subcategory Page**: Select "Subcategory Page", choose category and subcategory, save
   - **Sub-subcategory Page**: Select "Sub-subcategory Page", choose category, parent subcategory, and nested subcategory, save

### 3. Verify Table Display
- Check that banners display correctly in the table
- Verify the "Assignment" column shows the correct hierarchy
- Verify the "Parent Category" column shows context for subcategory assignments

### 4. Test Filtering
- Filter by page type
- Filter by category
- Filter by subcategory (when category is selected)
- Test the "Clear Filters" button

### 5. Test Banner API (Optional)
Use Postman or curl to test the API endpoints:

```bash
# Get all banners
curl -X GET "http://localhost:5000/api/admin/banners"

# Get home page banners
curl -X GET "http://localhost:5000/api/banners?page_type=home"

# Get category banners
curl -X GET "http://localhost:5000/api/banners?page_type=category&category_id=1"
```

## Key Features Implemented

✅ **Category Hierarchy Support**: Full support for category → subcategory → sub-subcategory assignments
✅ **Improved Table Display**: Clear visualization of banner assignments with parent context
✅ **Advanced Filtering**: Filter by page type, category, and subcategory
✅ **Dedicated API Service**: Clean banner API service with proper error handling
✅ **Form Validation**: Comprehensive validation based on page type selection
✅ **Dynamic Category Loading**: Categories and subcategories load dynamically based on selection
✅ **Error Handling**: User-friendly error messages and demo mode support
✅ **No Page Refresh**: All operations work without page reload
✅ **Responsive Design**: Mobile-friendly interface

## Frontend Website Implementation Notes

When implementing banners on the frontend website:

1. **Use the public API endpoints** (`/api/banners`) not the admin ones
2. **Filter by page type and category IDs** to get relevant banners
3. **Sort by `sort_order`** to display banners in the correct order
4. **Check `is_active` flag** to only show active banners
5. **Handle image URLs properly** - use the provided `image_url` field
6. **Implement caching** for better performance

The banner system is now fully functional and ready for production use!
