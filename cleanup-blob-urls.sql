-- SQL script to clean up blob URLs from the database
-- Run this script to replace all blob URLs with null or empty strings

-- Clean up blob URLs from products table
UPDATE products 
SET images = NULL 
WHERE images LIKE 'blob:%';

UPDATE products 
SET image_url = NULL 
WHERE image_url LIKE 'blob:%';

UPDATE products 
SET model3d_url = NULL 
WHERE model3d_url LIKE 'blob:%';

-- Clean up blob URLs from color_images JSON field
UPDATE products 
SET color_images = NULL 
WHERE color_images LIKE '%blob:%';

-- Clean up blob URLs from mm_calibers field
UPDATE products 
SET mm_calibers = NULL 
WHERE mm_calibers LIKE '%blob:%';

-- Clean up blob URLs from brands table
UPDATE brands 
SET logo_url = NULL 
WHERE logo_url LIKE 'blob:%';

-- Clean up blob URLs from campaigns table
UPDATE campaigns 
SET image_url = NULL 
WHERE image_url LIKE 'blob:%';

-- Clean up blob URLs from size_volume_variants table
UPDATE size_volume_variants 
SET image_url = NULL 
WHERE image_url LIKE 'blob:%';

-- Clean up blob URLs from eye_hygiene_variants table
UPDATE eye_hygiene_variants 
SET image_url = NULL 
WHERE image_url LIKE 'blob:%';

-- Add more table updates as needed for other tables that might have blob URLs
