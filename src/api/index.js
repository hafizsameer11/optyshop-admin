// API Services Index
// Centralized export for all API services

// Authentication
import authAPI from './auth';

// Core Entities
import productsAPI from './products';
import categoriesAPI from './categories';
import subCategoriesAPI from './subCategories';
import brandsAPI from './brands';

// Orders & Transactions
import ordersAPI from './orders';
import transactionsAPI from './transactions';

// Users Management
import usersAPI from './users';

// Lens & Prescription
import lensTypesAPI from './lensTypes';
import lensCoatingsAPI from './lensCoatings';
import lensColorsAPI from './lensColors';
import lensTreatmentsAPI from './lensTreatments';
import lensFinishesAPI from './lensFinishes';
import lensThicknessMaterialsAPI from './lensThicknessMaterials';
import lensThicknessOptionsAPI from './lensThicknessOptions';
import lensOptionsAPI from './lensOptions';
import prescriptionLensTypesAPI from './prescriptionLensTypes';
import prescriptionLensVariantsAPI from './prescriptionLensVariants';
import prescriptionSunLensesAPI from './prescriptionSunLenses';
import photochromicLensesAPI from './photochromicLenses';
import prescriptionFormDropdownValuesAPI from './prescriptionFormDropdownValues';
import contactLensFormsAPI from './contactLensForms';

// Product Customization
import frameSizesAPI from './frameSizes';
import mmCalibersAPI from './mmCalibers';

// Content Management
import bannersAPI from './banners';
import campaignsAPI from './campaigns';
import promotionsAPI from './promotions';
import couponsAPI from './coupons';
import flashOffersAPI from './flashOffers';
import faqsAPI from './faqs';
import blogPostsAPI from './blogPosts';
import pagesAPI from './pages';
import testimonialsAPI from './testimonials';
import jobsAPI from './jobs';
import jobApplicationsAPI from './jobApplications';

// Navigation
import menusAPI from './menus';
import menuItemsAPI from './menuItems';

// Shipping
import shippingMethodsAPI from './shippingMethods';

// Forms & Requests
import formsAPI from './forms';

// Simulations & VTO
import configsAPI from './configs';
import vtoSettingsAPI from './vtoSettings';

// Upload
import uploadAPI from './upload';

// Export all APIs
export {
  // Authentication
  authAPI,

  // Core Entities
  productsAPI,
  categoriesAPI,
  subCategoriesAPI,
  brandsAPI,

  // Orders & Transactions
  ordersAPI,
  transactionsAPI,

  // Users Management
  usersAPI,

  // Lens & Prescription
  lensTypesAPI,
  lensCoatingsAPI,
  lensColorsAPI,
  lensTreatmentsAPI,
  lensFinishesAPI,
  lensThicknessMaterialsAPI,
  lensThicknessOptionsAPI,
  lensOptionsAPI,
  prescriptionLensTypesAPI,
  prescriptionLensVariantsAPI,
  prescriptionSunLensesAPI,
  photochromicLensesAPI,
  prescriptionFormDropdownValuesAPI,
  contactLensFormsAPI,

  // Product Customization
  frameSizesAPI,
  mmCalibersAPI,

  // Content Management
  bannersAPI,
  campaignsAPI,
  promotionsAPI,
  couponsAPI,
  flashOffersAPI,
  faqsAPI,
  blogPostsAPI,
  pagesAPI,
  testimonialsAPI,
  jobsAPI,
  jobApplicationsAPI,

  // Navigation
  menusAPI,
  menuItemsAPI,

  // Shipping
  shippingMethodsAPI,

  // Forms & Requests
  formsAPI,

  // Simulations & VTO
  configsAPI,
  vtoSettingsAPI,

  // Upload
  uploadAPI,
};

// Default export for convenience
export default {
  authAPI,
  productsAPI,
  categoriesAPI,
  subCategoriesAPI,
  brandsAPI,
  ordersAPI,
  transactionsAPI,
  usersAPI,
  lensTypesAPI,
  lensCoatingsAPI,
  lensColorsAPI,
  lensTreatmentsAPI,
  lensFinishesAPI,
  lensThicknessMaterialsAPI,
  lensThicknessOptionsAPI,
  lensOptionsAPI,
  prescriptionLensTypesAPI,
  prescriptionLensVariantsAPI,
  prescriptionSunLensesAPI,
  photochromicLensesAPI,
  prescriptionFormDropdownValuesAPI,
  contactLensFormsAPI,
  frameSizesAPI,
  mmCalibersAPI,
  bannersAPI,
  campaignsAPI,
  promotionsAPI,
  couponsAPI,
  flashOffersAPI,
  faqsAPI,
  blogPostsAPI,
  pagesAPI,
  testimonialsAPI,
  jobsAPI,
  jobApplicationsAPI,
  menusAPI,
  menuItemsAPI,
  shippingMethodsAPI,
  formsAPI,
  configsAPI,
  vtoSettingsAPI,
  uploadAPI,
};
