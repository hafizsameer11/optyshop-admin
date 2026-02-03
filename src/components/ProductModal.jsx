import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiUpload, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';
import FrameSizeModal from './FrameSizeModal';
import LensTypeModal from './LensTypeModal';
import LensOptionModal from './LensOptionModal';
import PrescriptionSunLensModal from './PrescriptionSunLensModal';
import PhotochromicLensModal from './PhotochromicLensModal';
import LensCoatingModal from './LensCoatingModal';
import LensColorModal from './LensColorModal';
import LensFinishModal from './LensFinishModal';
import LensTreatmentModal from './LensTreatmentModal';
import LensThicknessMaterialModal from './LensThicknessMaterialModal';
import LensThicknessOptionModal from './LensThicknessOptionModal';
import PrescriptionLensTypeModal from './PrescriptionLensTypeModal';
import PrescriptionFormDropdownValueModal from './PrescriptionFormDropdownValueModal';
import SphericalConfigModal from './SphericalConfigModal';
import AstigmatismConfigModal from './AstigmatismConfigModal';
import MMCaliberManager from './MMCaliberManager';
import EyeHygieneVariantManager from './EyeHygieneVariantManager';
import SizeVolumeVariantManager from './SizeVolumeVariantManager';
import SizeVolumeVariantModal from './SizeVolumeVariantModal';
import { getProductSizeVolumeVariants } from '../services/productsService';
import { 
  createProduct,
  updateProduct,
  getProducts,
  deleteProduct
} from '../api/products';
import { getBrands } from '../api/brands';
import { getSubCategories } from '../api/subCategories';
import { getCategories } from '../api/categories';

// Helper function to validate hex code format (#RRGGBB)
const isValidHexCode = (hex) => {
  if (!hex || typeof hex !== 'string') return false;
  const hexPattern = /^#([A-Fa-f0-9]{6})$/;
  return hexPattern.test(hex.trim());
};

// Helper function to convert color name to hex code (for backward compatibility)
const getHexFromColorName = (colorName) => {
  if (!colorName) return null;
  const colorMap = {
    'black': '#000000',
    'white': '#FFFFFF',
    'brown': '#8B4513',
    'blue': '#0000FF',
    'red': '#FF0000',
    'green': '#008000',
    'gray': '#808080',
    'grey': '#808080',
    'gold': '#FFD700',
    'silver': '#C0C0C0',
    'tortoise': '#8B4513',
    'tortoiseshell': '#8B4513',
    'navy': '#000080',
    'burgundy': '#800020',
    'clear': '#FFFFFF',
    'transparent': '#FFFFFF',
  };
  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || null;
};

// Helper function to get color name from hex code (for display)
const getColorNameFromHex = (hexCode) => {
  if (!hexCode) return 'Unknown';
  const hexMap = {
    '#000000': 'Black',
    '#FFFFFF': 'White',
    '#8B4513': 'Brown',
    '#0000FF': 'Blue',
    '#FF0000': 'Red',
    '#008000': 'Green',
    '#808080': 'Gray',
    '#FFD700': 'Gold',
    '#C0C0C0': 'Silver',
    '#000080': 'Navy',
    '#800020': 'Burgundy',
  };
  const normalized = hexCode.toUpperCase().trim();
  return hexMap[normalized] || hexCode;
};

const ProductModal = ({ product, onClose }) => {
  const { t } = useI18n();

  // Helper function to handle lens management modal close with refresh
  // saved: true if form was saved successfully, false/undefined if cancelled/closed
  const handleLensManagementClose = (modalType) => {
    return (saved = false) => {
      console.log(`🔄 ${modalType} modal closing with saved=${saved}`);
      // Close the lens management modal
      const modalStateSetters = {
        'frameSize': [setFrameSizeModalOpen, setSelectedFrameSize],
        'lensType': [setLensTypeModalOpen, setSelectedLensType],
        'lensOption': [setLensOptionModalOpen, setSelectedLensOption],
        'prescriptionSunLens': [setPrescriptionSunLensModalOpen, setSelectedPrescriptionSunLens],
        'photochromicLens': [setPhotochromicLensModalOpen, setSelectedPhotochromicLens],
        'lensCoating': [setLensCoatingModalOpen, setSelectedLensCoating],
        'lensColor': [setLensColorModalOpen, setSelectedLensColor],
        'lensFinish': [setLensFinishModalOpen, setSelectedLensFinish],
        'lensTreatment': [setLensTreatmentModalOpen, setSelectedLensTreatment],
        'thicknessMaterial': [setThicknessMaterialModalOpen, setSelectedThicknessMaterial],
        'thicknessOption': [setThicknessOptionModalOpen, setSelectedThicknessOption],
        'prescriptionLensType': [setPrescriptionLensTypeModalOpen, setSelectedPrescriptionLensType],
        'prescriptionDropdown': [setPrescriptionDropdownModalOpen, setSelectedPrescriptionDropdown],
      };

      const [setModalOpen, setSelected] = modalStateSetters[modalType] || [null, null];
      if (setModalOpen) setModalOpen(false);
      if (setSelected) setSelected(null);

      // When saved successfully, navigate to the appropriate lens management page
      // This ensures the user goes to the dedicated table page instead of staying in product modal
      if (saved) {
        console.log(`🔄 Navigating to ${modalType} management page after form save`);
        
        // Mapping of modal types to their respective page routes
        const pageRoutes = {
          'frameSize': '/frame-sizes',
          'lensType': '/lens-types',
          'lensOption': '/lens-options',
          'prescriptionSunLens': '/prescription-sun-lenses',
          'photochromicLens': '/photochromic-lenses',
          'lensCoating': '/lens-coatings',
          'lensColor': '/lens-colors',
          'lensFinish': '/lens-finishes',
          'lensTreatment': '/lens-treatments',
          'thicknessMaterial': '/lens-thickness-materials',
          'thicknessOption': '/lens-thickness-options',
          'prescriptionLensType': '/prescription-lens-types',
          'prescriptionDropdown': '/prescription-form-dropdown-values',
        };

        const targetRoute = pageRoutes[modalType];
        if (targetRoute) {
          // Close the product modal first
          setTimeout(() => {
            console.log(`🔄 Navigating to ${targetRoute}`);
            // Use window.location.href for full page navigation to ensure proper page load
            window.location.href = targetRoute;
          }, 100);
        }
      } else {
        console.log(`❌ ${modalType} modal closed without navigation (cancelled)`);
      }
      // If cancelled, just close the modal and stay in product modal
    };
  };

  // SKU Generation function for all product types
  const generateSKU = () => {
    // Get brand name from brands array
    const selectedBrand = brands.find(brand => brand.id === parseInt(formData.brand_id));
    const brandCode = selectedBrand?.name || '';
    
    // Convert brand name to code (e.g., Ray-Ban -> RB)
    const brandAbbreviation = brandCode
      .split('-')
      .map(part => part.trim().charAt(0).toUpperCase())
      .join('');
    
    const model = formData.model_name || '';
    const lensWidth = formData.lens_width || '';
    const frameColor = formData.frame_color || '';
    
    // Check product type to determine format
    const productType = formData.product_type || 'frame';
    
    if (productType === 'prescription_glasses' || productType === 'eyeglasses') {
      // Prescription glasses format: RB*RX5228*54*17*2000
      const bridgeWidth = formData.bridge_width || '';
      
      if (!brandAbbreviation || !model || !lensWidth || !bridgeWidth || !frameColor) {
        toast.error('All fields required for prescription glasses SKU: Brand, Model, Lens Width, Bridge Width, Frame Color');
        return null;
      }
      
      return `${brandAbbreviation}*${model}*${lensWidth}*${bridgeWidth}*${frameColor}`;
      
    } else if (productType === 'sunglasses') {
      // Sunglasses format: RB-RX5228-54-2000-POLARIZED
      const lensMaterial = formData.lens_material || '';
      
      if (!brandAbbreviation || !model || !lensWidth || !frameColor || !lensMaterial) {
        toast.error('All fields required for sunglasses SKU: Brand, Model, Lens Width, Frame Color, Lens Material');
        return null;
      }
      
      return `${brandAbbreviation}-${model}-${lensWidth}-${frameColor}-${lensMaterial}`;
      
    } else if (productType === 'contact_lenses') {
      // Contact lenses format: ACUVUE-OASYS-6PK-8.6-14.2
      const packaging = formData.packaging || ''; // e.g., 6PK, 30PK
      const baseCurve = formData.base_curve || ''; // e.g., 8.6
      const diameter = formData.diameter || ''; // e.g., 14.2
      
      if (!brandAbbreviation || !model || !packaging || !baseCurve || !diameter) {
        toast.error('All fields required for contact lenses SKU: Brand, Model, Packaging, Base Curve, Diameter');
        return null;
      }
      
      return `${brandAbbreviation}-${model}-${packaging}-${baseCurve}-${diameter}`;
      
    } else if (productType === 'solution' || productType === 'eye_hygiene') {
      // Solutions format: OPTI-FREE-EXPRESS-355ML
      const volume = formData.volume || ''; // e.g., 355ML, 300ML
      
      if (!brandAbbreviation || !model || !volume) {
        toast.error('All fields required for solution SKU: Brand, Model, Volume');
        return null;
      }
      
      return `${brandAbbreviation}-${model}-${volume}`;
      
    } else {
      // Default format for regular frames
      if (!brandAbbreviation || !model || !lensWidth || !frameColor) {
        toast.error('All fields required for SKU generation: Brand, Model, Lens Width, Frame Color');
        return null;
      }
      
      return `${brandAbbreviation}*${model}*${lensWidth}*${frameColor}`;
    }
  };

  // Legacy function for backward compatibility
  const generatePrescriptionGlassesSKU = () => {
    return generateSKU();
  };

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    price: '',
    cost_price: '',
    description: '',
    short_description: '',
    category_id: '',
    sub_category_id: '',
    parent_subcategory_id: '', // For nested subcategories
    brand_id: '',
    model_name: '',
    lens_width: '', // Added for prescription glasses SKU generation
    bridge_width: '', // Added for prescription glasses SKU generation
    lens_material: '', // Added for sunglasses SKU generation
    packaging: '', // Added for contact lenses SKU generation
    base_curve: '', // Added for contact lenses SKU generation
    diameter: '', // Added for contact lenses SKU generation
    volume: '', // Added for solutions SKU generation
    frame_shape: '',
    frame_material: [], // Changed to array for multiple selections
    frame_color: '',
    gender: '',
    lens_type: '',
    stock_quantity: '',
    stock_status: 'in_stock',
    compare_at_price: '',
    product_type: 'frame',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    is_active: true,
    is_featured: false,
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const categoriesRef = useRef([]);
  const fetchSubCategoriesRef = useRef(null);
  const checkAndSetSubSubCategoryRef = useRef(null);
  const [subCategories, setSubCategories] = useState([]);
  const [nestedSubCategories, setNestedSubCategories] = useState([]);
  const [frameShapes, setFrameShapes] = useState([]);
  const [frameMaterials, setFrameMaterials] = useState([]);
  const [genders, setGenders] = useState([]);
  const [lensTypes, setLensTypes] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [productTypeManuallySet, setProductTypeManuallySet] = useState(false); // Track if user manually set product_type

  // Lens Management tables state
  const [frameSizes, setFrameSizes] = useState([]);
  const [lensTypesList, setLensTypesList] = useState([]);
  const [lensOptions, setLensOptions] = useState([]);
  const [prescriptionSunLenses, setPrescriptionSunLenses] = useState([]);
  const [photochromicLenses, setPhotochromicLenses] = useState([]);
  const [lensCoatings, setLensCoatings] = useState([]);
  const [lensColors, setLensColors] = useState([]);
  const [lensFinishes, setLensFinishes] = useState([]);
  const [lensTreatments, setLensTreatments] = useState([]);
  const [thicknessMaterials, setThicknessMaterials] = useState([]);
  const [thicknessOptions, setThicknessOptions] = useState([]);
  const [prescriptionLensTypes, setPrescriptionLensTypes] = useState([]);
  const [lensVariants, setLensVariants] = useState([]);

  // Size/Volume Variants state for Eye Hygiene products
  const [sizeVolumeVariants, setSizeVolumeVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [prescriptionDropdownValues, setPrescriptionDropdownValues] = useState([]);

  const [loadingLensManagement, setLoadingLensManagement] = useState({});

  // Modal states for lens management
  const [frameSizeModalOpen, setFrameSizeModalOpen] = useState(false);
  const [lensTypeModalOpen, setLensTypeModalOpen] = useState(false);
  const [lensOptionModalOpen, setLensOptionModalOpen] = useState(false);
  const [prescriptionSunLensModalOpen, setPrescriptionSunLensModalOpen] = useState(false);
  const [photochromicLensModalOpen, setPhotochromicLensModalOpen] = useState(false);
  const [lensCoatingModalOpen, setLensCoatingModalOpen] = useState(false);
  const [lensColorModalOpen, setLensColorModalOpen] = useState(false);
  const [lensFinishModalOpen, setLensFinishModalOpen] = useState(false);
  const [lensTreatmentModalOpen, setLensTreatmentModalOpen] = useState(false);
  const [thicknessMaterialModalOpen, setThicknessMaterialModalOpen] = useState(false);
  const [thicknessOptionModalOpen, setThicknessOptionModalOpen] = useState(false);
  const [prescriptionLensTypeModalOpen, setPrescriptionLensTypeModalOpen] = useState(false);
  const [prescriptionDropdownModalOpen, setPrescriptionDropdownModalOpen] = useState(false);

  const [selectedFrameSize, setSelectedFrameSize] = useState(null);
  const [selectedLensType, setSelectedLensType] = useState(null);
  const [selectedLensOption, setSelectedLensOption] = useState(null);
  const [selectedPrescriptionSunLens, setSelectedPrescriptionSunLens] = useState(null);
  const [selectedPhotochromicLens, setSelectedPhotochromicLens] = useState(null);
  const [selectedLensCoating, setSelectedLensCoating] = useState(null);
  const [selectedLensColor, setSelectedLensColor] = useState(null);
  const [selectedLensFinish, setSelectedLensFinish] = useState(null);
  const [selectedLensTreatment, setSelectedLensTreatment] = useState(null);
  const [selectedThicknessMaterial, setSelectedThicknessMaterial] = useState(null);
  const [selectedThicknessOption, setSelectedThicknessOption] = useState(null);
  const [selectedPrescriptionLensType, setSelectedPrescriptionLensType] = useState(null);
  const [selectedPrescriptionDropdown, setSelectedPrescriptionDropdown] = useState(null);

  // Contact Lens Configuration state
  const [sphericalConfigs, setSphericalConfigs] = useState([]);
  const [astigmatismConfigs, setAstigmatismConfigs] = useState([]);
  const [loadingSpherical, setLoadingSpherical] = useState(false);
  const [loadingAstigmatism, setLoadingAstigmatism] = useState(false);
  const [sphericalModalOpen, setSphericalModalOpen] = useState(false);
  const [astigmatismModalOpen, setAstigmatismModalOpen] = useState(false);
  const [selectedSphericalConfig, setSelectedSphericalConfig] = useState(null);
  const [selectedAstigmatismConfig, setSelectedAstigmatismConfig] = useState(null);

  // Local state for current product (updated after save to allow config creation)
  const [currentProduct, setCurrentProduct] = useState(product);

  const [imageFiles, setImageFiles] = useState([]); // Newly uploaded general images (File objects)
  const [imagePreviews, setImagePreviews] = useState([]); // All general image previews (URLs + new file previews)
  const [existingImages, setExistingImages] = useState([]); // Existing image URLs from product (for deletion tracking)
  const [imagesWithColors, setImagesWithColors] = useState([]); // [{ file, preview, hexCode, id, isExisting }]
  const [existingColorImages, setExistingColorImages] = useState([]); // Existing color images structure for deletion tracking
  const [model3DFile, setModel3DFile] = useState(null);
  const [model3DPreview, setModel3DPreview] = useState(null);

  // Sync currentProduct with product prop
  useEffect(() => {
    setCurrentProduct(product);
  }, [product]);

  // Helper function to check if a subcategory is a sub-subcategory and set form correctly
  const checkAndSetSubSubCategory = async (subCategoryId) => {
    if (!subCategoryId) return;

    try {
      // Use the subcategories API service to get subcategory by ID
      const response = await getSubCategories();
      const allSubCategories = response.data?.data?.subcategories || response.data?.subcategories || response.data || [];
      
      // Find the specific subcategory by ID
      const subCatData = Array.isArray(allSubCategories) 
        ? allSubCategories.find(sub => sub.id === parseInt(subCategoryId)) 
        : {};

      // Check if this subcategory has a parent (is a sub-subcategory)
      const parentId = subCatData.parent_id !== undefined ? subCatData.parent_id :
        subCatData.parentId ||
        subCatData.parent_subcategory_id ||
        subCatData.parentSubcategoryId ||
        subCatData.parent?.id;

      if (parentId && parentId !== null && parentId !== '') {
        // This is a sub-subcategory - set parent as sub_category_id and this as parent_subcategory_id
        // The useEffect will automatically fetch nested subcategories when sub_category_id changes
        console.log(`📊 Product is assigned to sub-subcategory ${subCategoryId}, parent is ${parentId}`);
        setFormData(prev => ({
          ...prev,
          sub_category_id: parentId.toString(),
          parent_subcategory_id: subCategoryId.toString()
        }));
        // Note: fetchNestedSubCategories will be called automatically by the useEffect when sub_category_id changes
      } else {
        // This is a top-level subcategory - the useEffect will fetch nested subcategories automatically
        console.log(`📊 Product is assigned to top-level subcategory ${subCategoryId}`);
      }
    } catch (error) {
      console.warn('Failed to check subcategory parent, assuming top-level:', error);
      // If we can't check, assume it's top-level - the useEffect will handle fetching nested subcategories
    }
  };

  useEffect(() => {
    console.log('🔄 ProductModal useEffect triggered');
    console.log('🔄 product prop:', product);
    console.log('🔄 product?.id:', product?.id);
    console.log('🔄 product?.name:', product?.name);

    fetchProductOptions();
    // Reset manual flag when product changes (loading existing product or creating new)
    setProductTypeManuallySet(false);

    // Fetch full product details when editing to ensure we have all fields (SEO, etc.)
    // Use admin endpoint GET /api/admin/products/:id to get complete product data
    const fetchFullProductDetails = async () => {
      console.log('🔍 fetchFullProductDetails called - product:', product);
      console.log('🔍 product?.id:', product?.id);
      console.log('🔍 product?.id type:', typeof product?.id);

      if (product && product.id) {
        try {
          const productId = product.id;
          const endpoint = API_ROUTES.ADMIN.PRODUCTS.BY_ID(productId);
          console.log('✅ Product ID found:', productId);
          console.log('🔍 API Endpoint URL:', endpoint);
          console.log('🔍 Full API_ROUTES.ADMIN.PRODUCTS:', API_ROUTES.ADMIN.PRODUCTS);
          console.log('🔍 Making API call now...');

          // Fetch full product details using admin endpoint (GET /api/admin/products/:id)
          // This ensures we get all fields including SEO and complete image data
          // Per Postman collection: GET /api/admin/products/:id returns complete product with all fields
          const fullProductResponse = await api.get(endpoint);

          console.log('✅ API call completed! Response received:', fullProductResponse);

          console.log('📦 Full API Response:', fullProductResponse);
          console.log('📦 Response Data:', fullProductResponse.data);
          console.log('📦 Response Structure:', {
            hasData: !!fullProductResponse.data,
            hasDataData: !!fullProductResponse.data?.data,
            hasProduct: !!fullProductResponse.data?.data?.product,
            responseKeys: Object.keys(fullProductResponse.data || {}),
            dataKeys: Object.keys(fullProductResponse.data?.data || {}),
          });

          const fullProductData = fullProductResponse.data?.data?.product ||
            fullProductResponse.data?.product ||
            fullProductResponse.data?.data ||
            fullProductResponse.data;

          if (fullProductData && fullProductData.id) {
            // Extract variants from product response (new API integration)
            const variants = fullProductData.sizeVolumeVariants ||
              fullProductData.size_volume_variants ||
              fullProductData.variants ||
              [];

            // Store variants in state for separate management via dedicated endpoints
            if (Array.isArray(variants) && variants.length > 0) {
              console.log('📦 Found size/volume variants in product response:', variants.length);
              setSizeVolumeVariants(variants);
            } else {
              // If no variants in product response, try to fetch separately
              // This ensures we always have the latest variants data
              if (fullProductData.id) {
                fetchSizeVolumeVariants(fullProductData.id).catch(err => {
                  console.warn('⚠️ Could not fetch variants separately:', err);
                });
              }
            }

            // Remove variant-related fields from product data (variants managed separately via dedicated endpoints)
            const {
              variants: _variants,
              sizeVolumeVariants: _sizeVolumeVariants,
              size_volume_variants: _size_volume_variants,
              size_volume,
              pack_type,
              ...cleanProductData
            } = fullProductData;

            console.log('✅ Fetched full product details with all fields:', {
              productId: cleanProductData.id,
              productName: cleanProductData.name,
              allKeys: Object.keys(cleanProductData),
              hasSEOTitle: !!cleanProductData.meta_title,
              hasSEODescription: !!cleanProductData.meta_description,
              hasSEOKeywords: !!cleanProductData.meta_keywords,
              variantsCount: variants.length
            });
            // Use the cleaned product data for form initialization (variants managed separately)
            return cleanProductData;
          } else {
            console.warn('⚠️ API response did not contain valid product data:', {
              fullProductData,
              hasId: !!fullProductData?.id
            });
          }
        } catch (error) {
          console.error('❌ Failed to fetch full product details:', error);
          console.error('❌ Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
          });
          // Continue with provided product data if fetch fails
        }
      } else {
        console.warn('⚠️ Cannot fetch product details: product or product.id is missing', {
          hasProduct: !!product,
          productId: product?.id
        });
      }
      return product;
    };

    // Load product data - fetch full details if editing, use product directly for new
    const loadProductData = async () => {
      console.log('🔄 loadProductData called - product:', product);
      console.log('🔄 product?.id:', product?.id);
      console.log('🔄 typeof product:', typeof product);

      // Only fetch if product has an ID
      if (!product || !product.id) {
        console.warn('⚠️ Cannot load product data: product or product.id is missing');
        return;
      }

      console.log('✅ Product ID found, calling fetchFullProductDetails...');
      const productToUse = await fetchFullProductDetails();
      console.log('🔄 productToUse after fetchFullProductDetails:', productToUse);

      if (productToUse) {
        setFormData({
          name: productToUse.name || '',
          slug: productToUse.slug || '',
          sku: productToUse.sku || '',
          price: productToUse.price || '',
          cost_price: productToUse.cost_price || '',
          description: productToUse.description || '',
          short_description: productToUse.short_description || '',
          category_id: productToUse.category_id || '',
          sub_category_id: productToUse.sub_category_id || productToUse.subcategory_id || '',
          parent_subcategory_id: '', // Will be set after checking if subcategory is a sub-subcategory
          brand_id: productToUse.brand_id || '',
          model_name: productToUse.model_name || '',
          lens_width: productToUse.lens_width || '', // Added for prescription glasses SKU generation
          bridge_width: productToUse.bridge_width || '', // Added for prescription glasses SKU generation
          lens_material: productToUse.lens_material || '', // Added for sunglasses SKU generation
          packaging: productToUse.packaging || '', // Added for contact lenses SKU generation
          base_curve: productToUse.base_curve || '', // Added for contact lenses SKU generation
          diameter: productToUse.diameter || '', // Added for contact lenses SKU generation
          volume: productToUse.volume || '', // Added for solutions SKU generation
          frame_shape: productToUse.frame_shape || '',
          frame_material: Array.isArray(productToUse.frame_material)
            ? productToUse.frame_material
            : productToUse.frame_material
              ? [productToUse.frame_material]
              : [],
          frame_color: productToUse.frame_color || '',
          gender: productToUse.gender || '',
          lens_type: productToUse.lens_type || '',
          stock_quantity: productToUse.stock_quantity || productToUse.stock || '',
          stock_status: productToUse.stock_status || 'in_stock',
          compare_at_price: productToUse.compare_at_price || '',
          product_type: (() => {
            // If product_type is missing or 'accessory', try to infer from category for eye hygiene
            let productType = productToUse.product_type;

            // Check category name from multiple sources
            const productCategoryName = (
              productToUse.category?.name ||
              productToUse.category_name ||
              ''
            ).toLowerCase().trim();
            const isEyeHygieneCategory = productCategoryName.includes('eye') && productCategoryName.includes('hygiene');

            // If category is eye hygiene but product_type is 'accessory' (legacy) or missing, set to 'eye_hygiene'
            // This handles backward compatibility with products that were stored as 'accessory' before
            if (isEyeHygieneCategory && (!productType || productType === 'accessory')) {
              productType = 'eye_hygiene';
              console.log('🔍 Set product_type to "eye_hygiene" (converted from legacy "accessory")', {
                originalProductType: productToUse.product_type,
                categoryName: productCategoryName,
                finalProductType: productType
              });
            }

            // Also check if we can infer from category_id if category name isn't available yet
            // Note: categories may not be loaded yet when editing, so we safely check for it
            // Use ref to access latest categories without adding to dependency array
            const currentCategories = categoriesRef.current || [];
            if (!isEyeHygieneCategory && productToUse.category_id && Array.isArray(currentCategories) && currentCategories.length > 0) {
              const category = currentCategories.find(cat => cat.id === productToUse.category_id || cat.id === parseInt(productToUse.category_id));
              if (category) {
                const catName = (category.name || '').toLowerCase().trim();
                if (catName.includes('eye') && catName.includes('hygiene')) {
                  if (!productType || productType === 'accessory') {
                    productType = 'eye_hygiene';
                    console.log('🔍 Set product_type to "eye_hygiene" based on category lookup', {
                      originalProductType: productToUse.product_type,
                      categoryId: productToUse.category_id,
                      categoryName: catName
                    });
                  }
                }
              }
            }

            return productType || 'frame';
          })(),
          meta_title: productToUse.meta_title || '',
          meta_description: productToUse.meta_description || '',
          meta_keywords: productToUse.meta_keywords || '',
          is_active: productToUse.is_active !== undefined ? productToUse.is_active : true,
          is_featured: productToUse.is_featured || false,
        });
        // Fetch subcategories if category is set
        if (productToUse.category_id) {
          if (fetchSubCategoriesRef.current) {
            fetchSubCategoriesRef.current(productToUse.category_id);
          }
          // Check if the product's subcategory is a sub-subcategory (has a parent)
          const productSubCategoryId = productToUse.sub_category_id || productToUse.subcategory_id;
          if (productSubCategoryId && checkAndSetSubSubCategoryRef.current) {
            // Check if this subcategory is a sub-subcategory and set form accordingly
            checkAndSetSubSubCategoryRef.current(productSubCategoryId);
          }
        }
        // Set existing images and previews if product has images array or image_url
        // Track existing images separately for deletion support
        let existingImageUrls = [];
        if (productToUse.images && Array.isArray(productToUse.images) && productToUse.images.length > 0) {
          existingImageUrls = productToUse.images.filter(img => img && typeof img === 'string');
        } else if (productToUse.image || productToUse.image_url) {
          existingImageUrls = [productToUse.image || productToUse.image_url].filter(Boolean);
        }
        setExistingImages(existingImageUrls);
        setImagePreviews(existingImageUrls); // Start with existing images
        // Reset imageFiles when editing - user must explicitly select new images to update them
        setImageFiles([]);

        // Set 3D model preview if exists
        if (productToUse.model_3d || productToUse.model3d || productToUse.model3D) {
          const modelUrl = productToUse.model_3d || productToUse.model3d || productToUse.model3D;
          setModel3DPreview(modelUrl);
        } else {
          setModel3DPreview(null);
        }
        setModel3DFile(null);

        // Set images with colors if exists (from product.color_images)
        // Convert color_images object to imagesWithColors array format
        // Also store the original structure for deletion tracking
        if (productToUse.color_images && typeof productToUse.color_images === 'object') {
          const imagesWithHexCodes = [];
          let imageIdCounter = 0;
          const existingColorImagesStructure = [];

          Object.keys(productToUse.color_images).forEach((key) => {
            // Check if key is a hex code or color name
            let hexCode = key;
            if (!isValidHexCode(key)) {
              // Old format: color name - convert to hex code
              hexCode = getHexFromColorName(key) || key;
            }

            const colorData = productToUse.color_images[key];
            const imageUrls = Array.isArray(colorData?.images) ? colorData.images :
              Array.isArray(colorData) ? colorData :
                typeof colorData === 'string' ? [colorData] : [];

            // Store original structure for deletion tracking
            if (imageUrls.length > 0) {
              existingColorImagesStructure.push({
                hexCode: hexCode.toUpperCase(),
                name: colorData?.name || getColorNameFromHex(hexCode),
                price: colorData?.price || null,
                images: imageUrls.filter(url => url && typeof url === 'string')
              });
            }

            // Create entries for each image URL
            imageUrls.forEach((imageUrl) => {
              if (imageUrl && typeof imageUrl === 'string') {
                imagesWithHexCodes.push({
                  id: `existing-${imageIdCounter++}`,
                  file: null, // Existing image, no file
                  preview: imageUrl,
                  hexCode: hexCode.toUpperCase(),
                  isExisting: true
                });
              }
            });
          });

          setExistingColorImages(existingColorImagesStructure);
          setImagesWithColors(imagesWithHexCodes);
        } else {
          setExistingColorImages([]);
          setImagesWithColors([]);
        }
      }
    };

    // Only fetch full product details if we have a product to edit WITH AN ID
    if (product && product.id) {
      console.log('📝 Product with ID found - Starting data load:', {
        id: product.id,
        name: product.name,
        productType: product.product_type
      });
      loadProductData().catch(err => {
        console.error('❌ Error loading product data:', err);
        console.error('❌ Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url
        });
      });
    } else {
      console.log('📝 No product provided - initializing empty form for new product');
      // Reset form for new product
      setExistingImages([]);
      setExistingColorImages([]);
      setFormData({
        name: '',
        slug: '',
        sku: '',
        price: '',
        cost_price: '',
        description: '',
        short_description: '',
        category_id: '',
        sub_category_id: '',
        parent_subcategory_id: '',
        brand_id: '',
        model_name: '',
        lens_width: '', // Added for prescription glasses SKU generation
        bridge_width: '', // Added for prescription glasses SKU generation
        lens_material: '', // Added for sunglasses SKU generation
        packaging: '', // Added for contact lenses SKU generation
        base_curve: '', // Added for contact lenses SKU generation
        diameter: '', // Added for contact lenses SKU generation
        volume: '', // Added for solutions SKU generation
        frame_shape: '',
        frame_material: [],
        frame_color: '',
        gender: '',
        lens_type: '',
        stock_quantity: '',
        stock_status: 'in_stock',
        compare_at_price: '',
        product_type: 'frame',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        is_active: true,
        is_featured: false,
      });
      setSubCategories([]);
      setNestedSubCategories([]);
      setImageFiles([]);
      setImagePreviews([]);
      setModel3DFile(null);
      setModel3DPreview(null);
      setImagesWithColors([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Fetch nested subcategories when subcategory is selected
  useEffect(() => {
    if (formData.sub_category_id) {
      // Fetch nested subcategories when subcategory is selected
      fetchNestedSubCategories(formData.sub_category_id);
    } else {
      // Clear nested subcategories when no subcategory is selected
      setNestedSubCategories([]);
    }
  }, [formData.sub_category_id]);

  // Auto-update product_type when category changes to eye hygiene
  // Only auto-update if user hasn't manually set product_type OR when category changes
  // Also runs when categories load (in case product loaded before categories)
  useEffect(() => {
    // Don't auto-update if user manually set product_type (unless category just changed)
    // Reset the manual flag when category changes (handled in handleChange)

    if (formData.category_id && categories.length > 0 && !productTypeManuallySet) {
      const currentCategory = categories.find(cat =>
        cat.id === parseInt(formData.category_id) ||
        cat.id === formData.category_id ||
        String(cat.id) === String(formData.category_id)
      );
      if (currentCategory) {
        const categoryName = (currentCategory.name || '').toLowerCase().trim();
        const isEyeHygieneCategory = categoryName.includes('eye') && categoryName.includes('hygiene');

        // If it's an eye hygiene category but product_type is not set correctly, update it
        if (isEyeHygieneCategory && formData.product_type !== 'eye_hygiene') {
          console.log('🔍 Auto-updating product_type to "eye_hygiene" based on category', {
            categoryId: formData.category_id,
            categoryName: currentCategory.name,
            currentProductType: formData.product_type,
            manuallySet: productTypeManuallySet
          });
          setFormData(prev => ({ ...prev, product_type: 'eye_hygiene' }));
        }
      }
    }

    // Also check the product prop if it exists (for initial load - ignore manual flag for initial load)
    if (product && product.category_id && categories.length > 0 && !productTypeManuallySet) {
      const productCategory = categories.find(cat =>
        cat.id === product.category_id ||
        cat.id === parseInt(product.category_id) ||
        String(cat.id) === String(product.category_id)
      );
      if (productCategory) {
        const categoryName = (productCategory.name || '').toLowerCase().trim();
        const isEyeHygieneCategory = categoryName.includes('eye') && categoryName.includes('hygiene');

        // If product is 'accessory' (legacy) or has eye hygiene category, update product_type to 'eye_hygiene'
        const isLegacyAccessory = product.product_type === 'accessory' || formData.product_type === 'accessory';
        if (isEyeHygieneCategory && (isLegacyAccessory || formData.product_type !== 'eye_hygiene')) {
          console.log('🔍 Auto-updating product_type to "eye_hygiene" based on product category', {
            productId: product.id,
            productType: product.product_type,
            categoryId: product.category_id,
            categoryName: productCategory.name
          });
          setFormData(prev => ({ ...prev, product_type: 'eye_hygiene' }));
        }
      }
    }
  }, [formData.category_id, categories, product]);

  // Reset manual flag when category changes (so auto-update can work again for new category)
  useEffect(() => {
    setProductTypeManuallySet(false);
  }, [formData.category_id]);

  const fetchProductOptions = async () => {
    try {
      // Fetch product options which includes categories, frame shapes, materials, etc.
      const response = await api.get(API_ROUTES.PRODUCTS.OPTIONS);
      const optionsData = response.data?.data || response.data || {};

      const categoriesData = optionsData.categories || [];
      setCategories(categoriesData);
      categoriesRef.current = categoriesData;

      // Fetch brands
      try {
        const brandsResponse = await getBrands({ is_active: true, sortBy: 'name', sortOrder: 'asc' });
        const brandsData = brandsResponse.data?.data?.brands || brandsResponse.data?.brands || brandsResponse.data || [];
        setBrands(Array.isArray(brandsData) ? brandsData : []);
      } catch (brandError) {
        console.warn('Failed to fetch brands', brandError);
        setBrands([]);
      }

      setFrameShapes(optionsData.frameShapes || []);

      // Merge API frame materials with additional material types
      const apiMaterials = optionsData.frameMaterials || [];
      const additionalMaterials = ['plastic', 'glass', 'polycarbonate', 'trivex', 'high_index'];
      const allMaterials = [...new Set([...apiMaterials, ...additionalMaterials])];
      setFrameMaterials(allMaterials);

      setGenders(optionsData.genders || []);
      setLensTypes(optionsData.lensTypeEnums || []);
    } catch (error) {
      console.error('Failed to fetch product options', error);
      // Fallback to just categories if options endpoint fails
      try {
        const response = await getCategories({ is_active: true, sortBy: 'sort_order', sortOrder: 'asc' });
        const categoriesData = response.data?.data?.categories || response.data?.categories || response.data || [];
        setCategories(categoriesData);
        categoriesRef.current = categoriesData;
      } catch (catError) {
        console.error('Failed to fetch categories', catError);
        setCategories([]);
      }
      setFrameShapes([]);
      // Set fallback materials even if API fails
      setFrameMaterials(['plastic', 'glass', 'polycarbonate', 'trivex', 'high_index']);
      setGenders([]);
      setLensTypes([]);
    }
  };

  // Update function refs after functions are defined
  useEffect(() => {
    fetchSubCategoriesRef.current = fetchSubCategories;
    checkAndSetSubSubCategoryRef.current = checkAndSetSubSubCategory;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once after functions are defined

  const fetchSubCategories = async (categoryId) => {
    if (!categoryId) {
      setSubCategories([]);
      setNestedSubCategories([]);
      return;
    }

    try {
      // Use the subcategories API service
      const response = await getSubCategories({ category_id: categoryId, is_active: true, sortBy: 'sort_order', sortOrder: 'asc' });
      const responseData = response.data?.data || response.data || {};
      const subCatData = responseData.subcategories || responseData || [];

      // Filter to get only top-level subcategories (parent_id = null)
      const topLevel = Array.isArray(subCatData)
        ? subCatData.filter(sub => {
          const parentId = sub.parent_id !== undefined ? sub.parent_id :
            sub.parentId ||
            sub.parent_subcategory_id ||
            sub.parentSubcategoryId;
          return parentId === null || parentId === undefined || parentId === '';
        })
        : [];

      console.log(`📊 Fetched ${topLevel.length} top-level subcategories for category ${categoryId}`);
      setSubCategories(topLevel);
    } catch (error) {
      console.warn('Failed to fetch subcategories for category', categoryId, error);
      setSubCategories([]);
    }
  };

  const fetchNestedSubCategories = async (subCategoryId) => {
    if (!subCategoryId) {
      setNestedSubCategories([]);
      return;
    }

    try {
      // Use the subcategories API service to get all subcategories and filter by parent_id
      const response = await getSubCategories({ is_active: true, sortBy: 'sort_order', sortOrder: 'asc' });
      const responseData = response.data?.data || response.data || {};
      const allSubCategories = responseData.subcategories || responseData || [];

      // Filter to get only nested subcategories (parent_id = subCategoryId)
      const nestedData = Array.isArray(allSubCategories)
        ? allSubCategories.filter(sub => {
          const parentId = sub.parent_id !== undefined ? sub.parent_id :
            sub.parentId ||
            sub.parent_subcategory_id ||
            sub.parentSubcategoryId;
          return parentId === parseInt(subCategoryId);
        })
        : [];

      console.log(`📊 Fetched ${nestedData.length} nested subcategories for parent ${subCategoryId}`);
      setNestedSubCategories(nestedData);
    } catch (error) {
      console.warn('Failed to fetch nested subcategories', error);
      setNestedSubCategories([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // If category changes, fetch subcategories and reset subcategory selections
    if (name === 'category_id') {
      // Check if the selected category is eye hygiene and auto-set product_type
      const selectedCategory = categories.find(cat => cat.id === parseInt(value));
      const categoryName = (selectedCategory?.name || '').toLowerCase().trim();
      const isEyeHygieneCategory = categoryName.includes('eye') && categoryName.includes('hygiene');

      const updatedFormData = {
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
        sub_category_id: '', // Reset subcategory when category changes
        parent_subcategory_id: '' // Reset nested subcategory
      };

      // Auto-set product_type to 'eye_hygiene' if eye hygiene category is selected
      // Only auto-set if user hasn't manually set a different product_type for this category
      // Reset manual flag when category changes so auto-update can work for new category
      setProductTypeManuallySet(false);

      if (isEyeHygieneCategory && updatedFormData.product_type !== 'eye_hygiene') {
        updatedFormData.product_type = 'eye_hygiene';
        console.log('🔍 Auto-set product_type to "eye_hygiene" for eye hygiene category');
      }

      setFormData(updatedFormData);
      fetchSubCategories(value);
      setNestedSubCategories([]);
    } else if (name === 'sub_category_id') {
      // When subcategory changes, reset nested subcategory
      // The useEffect will automatically fetch nested subcategories when sub_category_id changes
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
        parent_subcategory_id: '' // Reset nested subcategory when parent changes
      });
    } else if (name === 'product_type') {
      // User manually changed product_type - respect their selection
      setProductTypeManuallySet(true);
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name}: Not an image file`);
        return;
      }
      // Validate file size (max 5MB per image)
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name}: Size exceeds 5MB`);
        return;
      }
      validFiles.push(file);
    });

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      toast.error(`Invalid files:\n${invalidFiles.join('\n')}`);
    }

    if (validFiles.length > 0) {
      // Upload files immediately to get HTTPS URLs
      const uploadPromises = validFiles.map((file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        return fetch('/api/admin/upload/image', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.url) {
            return { file, preview: data.url };
          } else {
            toast.error('Failed to upload image');
            return null;
          }
        })
        .catch(error => {
          console.error('Upload error:', error);
          toast.error('Failed to upload image');
          return null;
        });
      });

      Promise.all(uploadPromises).then((results) => {
        const validResults = results.filter(Boolean);
        const newImages = validResults.map((result, index) => ({
          id: `new-${Date.now()}-${index}`,
          file: result.file,
          preview: result.preview,
          hexCode: '', // No hex code assigned yet - user will assign
          isExisting: false
        }));

        setImagesWithColors([...imagesWithColors, ...newImages]);
        toast.success(`${validFiles.length} image(s) added. Assign hex color codes to each image.`);
      });
    }

    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  // Handle general images (without color codes) - for backward compatibility
  const handleGeneralImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}: Not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: Size exceeds 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const newFiles = product ? validFiles : [...imageFiles, ...validFiles];
      setImageFiles(newFiles);

      // Upload files immediately to get HTTPS URLs
      const uploadPromises = validFiles.map((file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        return fetch('/api/admin/upload/image', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.url) {
            return data.url;
          } else {
            toast.error('Failed to upload image');
            return null;
          }
        })
        .catch(error => {
          console.error('Upload error:', error);
          toast.error('Failed to upload image');
          return null;
        });
      });

      Promise.all(uploadPromises).then((previews) => {
        const validPreviews = previews.filter(Boolean);
        // When editing, append new previews to existing ones
        // When creating, append to current previews
        const newPreviews = product ? [...imagePreviews, ...validPreviews] : [...imagePreviews, ...validPreviews];
        setImagePreviews(newPreviews);
        toast.success(`${validFiles.length} general image(s) added (no color code)`);
      });
    }

    e.target.value = '';
  };

  const removeImage = (index) => {
    const previewToRemove = imagePreviews[index];

    // Check if it's an existing image (HTTPS URL string) or a new file preview (Base64)
    if (typeof previewToRemove === 'string' && !previewToRemove.startsWith('data:') && previewToRemove.startsWith('https://')) {
      // It's an existing image URL - remove from existingImages
      setExistingImages(prev => prev.filter(img => img !== previewToRemove));
    } else {
      // It's a new file preview - find and remove from imageFiles
      // Count how many existing images come before this index
      const existingCount = imagePreviews.slice(0, index).filter(preview =>
        typeof preview === 'string' && !preview.startsWith('data:') && preview.startsWith('https://')
      ).length;
      // The file index in imageFiles array
      const fileIndex = index - existingCount;
      if (fileIndex >= 0 && fileIndex < imageFiles.length) {
        const newFiles = [...imageFiles];
        newFiles.splice(fileIndex, 1);
        setImageFiles(newFiles);
      }
    }

    // Remove from previews
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
    toast.success('Image removed');
  };

  const removeImageWithColor = (id) => {
    const imageToRemove = imagesWithColors.find(img => img.id === id);
    if (imageToRemove) {
      // If it's an existing image, we need to update existingColorImages structure
      if (imageToRemove.isExisting && imageToRemove.hexCode) {
        setExistingColorImages(prev => {
          return prev.map(colorImg => {
            if (colorImg.hexCode === imageToRemove.hexCode) {
              // Remove this image URL from the color's images array
              const updatedImages = colorImg.images.filter(imgUrl => imgUrl !== imageToRemove.preview);
              if (updatedImages.length === 0) {
                // If no images left for this color, remove the entire color entry
                return null;
              }
              return { ...colorImg, images: updatedImages };
            }
            return colorImg;
          }).filter(Boolean); // Remove null entries
        });
      }
      setImagesWithColors(imagesWithColors.filter(img => img.id !== id));
      toast.success('Image removed');
    }
  };

  const updateImageHexCode = (id, hexCode) => {
    if (hexCode && !isValidHexCode(hexCode)) {
      toast.error('Invalid hex code format. Must be #RRGGBB');
      return;
    }

    setImagesWithColors(imagesWithColors.map(img =>
      img.id === id ? { ...img, hexCode: hexCode ? hexCode.toUpperCase().trim() : '' } : img
    ));
  };

  const handleModel3DChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (3D model formats)
    const validExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.dae'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      toast.error(`Invalid 3D model format. Supported: ${validExtensions.join(', ')}`);
      e.target.value = '';
      return;
    }

    setModel3DFile(file);
    // Upload to server immediately to get HTTPS URL
    const formData = new FormData();
    formData.append('model', file);
    
    // Show loading state
    toast.loading('Uploading 3D model...');
    
    // Upload to server
    fetch('/api/admin/upload/model3d', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.url) {
        setModel3DPreview(data.url);
        toast.success('3D model uploaded successfully');
      } else {
        toast.error('Failed to upload 3D model');
      }
    })
    .catch(error => {
      console.error('Upload error:', error);
      toast.error('Failed to upload 3D model');
    })
    .finally(() => {
      toast.dismiss();
    });
    e.target.value = '';
  };

  const removeModel3D = () => {
    // No blob cleanup needed with Base64
    setModel3DFile(null);
    setModel3DPreview(null);
    toast.success('3D model removed');
  };


  // Helper function to validate and get product ID
  const getValidProductId = () => {
    const productId = product?.id ?? currentProduct?.id;

    // Check for all invalid cases
    if (productId === undefined || productId === null || productId === '' || String(productId) === 'undefined' || String(productId) === 'null') {
      return null; // No valid ID - should create new product
    }

    // Parse to integer
    const parsedId = typeof productId === 'number' ? productId : parseInt(String(productId), 10);

    // Validate it's a positive integer
    if (isNaN(parsedId) || !Number.isInteger(parsedId) || parsedId <= 0) {
      console.error('❌ Invalid product ID:', { productId, parsedId, type: typeof productId });
      return null; // Invalid ID - should create new product
    }

    return parsedId; // Valid ID
  };

  // ============================================================================
  // SIZE/VOLUME VARIANTS MANAGEMENT FUNCTIONS (New API Integration)
  // ============================================================================

  // Fetch all size/volume variants for a product
  // Per Postman: GET /api/admin/products/:productId/size-volume-variants
  const fetchSizeVolumeVariants = async (productId) => {
    if (!productId) {
      console.warn('⚠️ Cannot fetch variants: productId is missing');
      return;
    }

    try {
      setLoadingVariants(true);
      const response = await api.get(API_ROUTES.ADMIN.PRODUCTS.SIZE_VOLUME_VARIANTS.LIST(productId));
      const responseData = response.data?.data || response.data || {};
      const variants = responseData.variants || responseData || [];

      const variantsArray = Array.isArray(variants) ? variants : [];
      console.log(`✅ Fetched ${variantsArray.length} size/volume variants for product ${productId}`);
      setSizeVolumeVariants(variantsArray);
      return variantsArray;
    } catch (error) {
      console.error('❌ Failed to fetch size/volume variants:', error);
      if (error.response?.status === 404) {
        // Product might not have variants yet - this is okay
        console.log('📦 No variants found for product (404) - this is normal for new products');
        setSizeVolumeVariants([]);
      } else {
        toast.error('Failed to load variants');
      }
      setSizeVolumeVariants([]);
      return [];
    } finally {
      setLoadingVariants(false);
    }
  };

  // Create a new size/volume variant
  // Per Postman: POST /api/admin/products/:productId/size-volume-variants
  const createSizeVolumeVariant = async (variantData) => {
    const productId = getValidProductId();
    if (!productId) {
      toast.error('Cannot create variant: Product must be saved first');
      return;
    }

    try {
      setLoadingVariants(true);
      const response = await api.post(
        API_ROUTES.ADMIN.PRODUCTS.SIZE_VOLUME_VARIANTS.CREATE(productId),
        variantData
      );
      const responseData = response.data?.data || response.data || {};
      const newVariant = responseData.variant || responseData;

      // Refresh variants list
      await fetchSizeVolumeVariants(productId);
      toast.success('Variant created successfully');
      return newVariant;
    } catch (error) {
      console.error('❌ Failed to create variant:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create variant';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoadingVariants(false);
    }
  };

  // Update an existing size/volume variant
  // Per Postman: PUT /api/admin/products/:productId/size-volume-variants/:variantId
  const updateSizeVolumeVariant = async (variantId, variantData) => {
    const productId = getValidProductId();
    if (!productId) {
      toast.error('Cannot update variant: Product ID is missing');
      return;
    }

    try {
      setLoadingVariants(true);
      const response = await api.put(
        API_ROUTES.ADMIN.PRODUCTS.SIZE_VOLUME_VARIANTS.UPDATE(productId, variantId),
        variantData
      );
      const responseData = response.data?.data || response.data || {};
      const updatedVariant = responseData.variant || responseData;

      // Refresh variants list
      await fetchSizeVolumeVariants(productId);
      toast.success('Variant updated successfully');
      return updatedVariant;
    } catch (error) {
      console.error('❌ Failed to update variant:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update variant';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoadingVariants(false);
    }
  };

  // Delete a size/volume variant
  // Per Postman: DELETE /api/admin/products/:productId/size-volume-variants/:variantId
  const deleteSizeVolumeVariant = async (variantId) => {
    const productId = getValidProductId();
    if (!productId) {
      toast.error('Cannot delete variant: Product ID is missing');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this variant?')) {
      return;
    }

    try {
      setLoadingVariants(true);
      await api.delete(
        API_ROUTES.ADMIN.PRODUCTS.SIZE_VOLUME_VARIANTS.DELETE(productId, variantId)
      );

      // Refresh variants list
      await fetchSizeVolumeVariants(productId);
      toast.success('Variant deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete variant:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete variant';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoadingVariants(false);
    }
  };

  // Bulk update size/volume variants
  // Per Postman: PUT /api/admin/products/:productId/size-volume-variants/bulk
  // ⚠️ IMPORTANT: This REPLACES all variants - variants with id are updated, without id are created, not in array are deleted
  const bulkUpdateSizeVolumeVariants = async (variantsArray) => {
    const productId = getValidProductId();
    if (!productId) {
      toast.error('Cannot update variants: Product must be saved first');
      return;
    }

    try {
      setLoadingVariants(true);
      const response = await api.put(
        API_ROUTES.ADMIN.PRODUCTS.SIZE_VOLUME_VARIANTS.BULK_UPDATE(productId),
        { variants: variantsArray }
      );
      const responseData = response.data?.data || response.data || {};
      const updatedVariants = responseData.variants || variantsArray || [];

      setSizeVolumeVariants(Array.isArray(updatedVariants) ? updatedVariants : []);
      toast.success('Variants updated successfully');
      return updatedVariants;
    } catch (error) {
      console.error('❌ Failed to bulk update variants:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update variants';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoadingVariants(false);
    }
  };

  // Calculate isEyeHygiene early for use in useEffect
  // Use useMemo to avoid recalculating unnecessarily
  const isEyeHygieneForEffect = useMemo(() => {
    // Check if product is eye hygiene by product_type or category
    const currentCategoryForCheck = categories.find(cat =>
      cat.id === formData.category_id ||
      cat.id === parseInt(formData.category_id) ||
      String(cat.id) === String(formData.category_id)
    );
    const categoryNameForCheck = (
      currentCategoryForCheck?.name ||
      product?.category?.name ||
      product?.category_name ||
      (product?.category_id && categories.find(c =>
        c.id === product.category_id ||
        c.id === parseInt(product.category_id) ||
        String(c.id) === String(product.category_id)
      )?.name) ||
      ''
    ).toLowerCase().trim();
    const isEyeHygieneByCategoryCheck = categoryNameForCheck.includes('eye') && categoryNameForCheck.includes('hygiene');
    const productTypeFromProductCheck = product?.product_type || '';
    const formProductTypeCheck = formData.product_type || '';
    const isEyeHygieneByProductTypeCheck = productTypeFromProductCheck === 'eye_hygiene' || formProductTypeCheck === 'eye_hygiene';
    const isLegacyAccessoryCheck = productTypeFromProductCheck === 'accessory' || formProductTypeCheck === 'accessory';
    const isEyeHygieneFromLegacyAccessoryCheck = isLegacyAccessoryCheck && isEyeHygieneByCategoryCheck;

    return isEyeHygieneByProductTypeCheck ||
      isEyeHygieneByCategoryCheck ||
      isEyeHygieneFromLegacyAccessoryCheck;
  }, [categories, formData.category_id, formData.product_type, product?.category?.name, product?.category_name, product?.category_id, product?.product_type]);

  // Fetch variants when product is loaded (for eye hygiene products)
  useEffect(() => {
    if (product && product.id && isEyeHygieneForEffect) {
      console.log('📦 Fetching size/volume variants for eye hygiene product:', product.id);
      fetchSizeVolumeVariants(product.id).catch(err => {
        console.warn('⚠️ Could not fetch variants on product load:', err);
      });
    } else if (!product || !product.id) {
      // Reset variants for new products
      setSizeVolumeVariants([]);
    }
  }, [product?.id, isEyeHygieneForEffect]);

  const handleSubmit = async (e) => {
    // Prevent default form submission AND any bubbling/propagation
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent?.preventDefault();
    
    // Also prevent any form submission that might happen due to browser validation
    const form = e.target;
    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }, { once: true });
    }
    
    console.log('🚫 Product form submission prevented - starting save process');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        toast.error('Product name is required');
        setLoading(false);
        return;
      }
      if (!formData.sku || !formData.sku.trim()) {
        toast.error('SKU is required');
        setLoading(false);
        return;
      }
      if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
        toast.error('Valid price is required');
        setLoading(false);
        return;
      }
      if (!formData.category_id) {
        toast.error('Category is required');
        setLoading(false);
        return;
      }

      // Prepare data object with proper types
      const dataToSend = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        price: parseFloat(formData.price) || 0,
      };

      // Add optional fields only if they have values
      if (formData.slug && formData.slug.trim()) {
        dataToSend.slug = formData.slug.trim();
      }
      if (formData.description && formData.description.trim()) {
        dataToSend.description = formData.description.trim();
      }
      if (formData.short_description && formData.short_description.trim()) {
        dataToSend.short_description = formData.short_description.trim();
      }
      // category_id is required - always include it
      const categoryId = parseInt(formData.category_id);
      if (!isNaN(categoryId) && categoryId > 0) {
        dataToSend.category_id = categoryId;
      } else {
        toast.error('Valid category is required');
        setLoading(false);
        return;
      }
      // Handle subcategory selection: if nested subcategory is selected, use it; otherwise use parent subcategory
      if (formData.parent_subcategory_id) {
        // Nested subcategory selected - use it as the final sub_category_id
        const nestedSubCategoryId = parseInt(formData.parent_subcategory_id);
        if (!isNaN(nestedSubCategoryId)) {
          dataToSend.sub_category_id = nestedSubCategoryId;
        }
      } else if (formData.sub_category_id) {
        // Only parent subcategory selected - use it
        const subCategoryId = parseInt(formData.sub_category_id);
        if (!isNaN(subCategoryId)) {
          dataToSend.sub_category_id = subCategoryId;
        }
      }
      if (formData.cost_price && formData.cost_price !== '') {
        const costPrice = parseFloat(formData.cost_price);
        if (!isNaN(costPrice) && costPrice >= 0) {
          dataToSend.cost_price = costPrice;
        }
      }
      if (formData.stock_quantity !== '' && formData.stock_quantity !== null && formData.stock_quantity !== undefined) {
        const stockQty = parseInt(formData.stock_quantity);
        if (!isNaN(stockQty) && stockQty >= 0) {
          dataToSend.stock_quantity = stockQty;
        } else {
          dataToSend.stock_quantity = 0;
        }
      }
      if (formData.stock_status) dataToSend.stock_status = formData.stock_status;
      // Send frame_shape as-is (API accepts any string value)
      if (formData.frame_shape) {
        dataToSend.frame_shape = formData.frame_shape.trim();
      }
      // Send frame_material - API accepts single string or JSON array for multiple materials
      if (formData.frame_material && Array.isArray(formData.frame_material) && formData.frame_material.length > 0) {
        // Filter out empty values and trim
        const validMaterials = formData.frame_material.map(m => m.trim()).filter(m => m);
        if (validMaterials.length === 0) {
          // Skip if all materials are empty
        } else if (validMaterials.length === 1) {
          // If single material, send as string (per Postman API spec)
          dataToSend.frame_material = validMaterials[0];
        } else {
          // If multiple materials, send as array (per Postman API spec)
          dataToSend.frame_material = validMaterials;
        }
      } else if (formData.frame_material && !Array.isArray(formData.frame_material)) {
        const trimmed = formData.frame_material.trim();
        // Handle legacy single value format - send as string if not empty
        if (trimmed) {
          dataToSend.frame_material = trimmed;
        }
      }
      if (formData.frame_color) dataToSend.frame_color = formData.frame_color.trim();
      if (formData.gender) dataToSend.gender = formData.gender.trim();
      // Send lens_type as-is (API accepts any string value)
      if (formData.lens_type) dataToSend.lens_type = formData.lens_type.trim();
      if (formData.compare_at_price && formData.compare_at_price !== '') {
        const comparePrice = parseFloat(formData.compare_at_price);
        if (!isNaN(comparePrice) && comparePrice >= 0) {
          dataToSend.compare_at_price = comparePrice;
        }
      }
      if (formData.brand_id) {
        dataToSend.brand_id = parseInt(formData.brand_id);
      }
      if (formData.model_name) {
        dataToSend.model_name = formData.model_name.trim();
      }
      if (formData.lens_width) {
        dataToSend.lens_width = formData.lens_width.trim();
      }
      if (formData.bridge_width) {
        dataToSend.bridge_width = formData.bridge_width.trim();
      }
      if (formData.lens_material) {
        dataToSend.lens_material = formData.lens_material.trim();
      }
      if (formData.packaging) {
        dataToSend.packaging = formData.packaging.trim();
      }
      if (formData.base_curve) {
        dataToSend.base_curve = formData.base_curve.trim();
      }
      if (formData.diameter) {
        dataToSend.diameter = formData.diameter.trim();
      }
      if (formData.volume) {
        dataToSend.volume = formData.volume.trim();
      }
      // Send product_type if it's provided
      if (formData.product_type) {
        dataToSend.product_type = formData.product_type;
      }
      if (formData.meta_title && formData.meta_title.trim()) {
        dataToSend.meta_title = formData.meta_title.trim();
      }
      if (formData.meta_description && formData.meta_description.trim()) {
        dataToSend.meta_description = formData.meta_description.trim();
      }
      if (formData.meta_keywords && formData.meta_keywords.trim()) {
        dataToSend.meta_keywords = formData.meta_keywords.trim();
      }
      if (formData.is_active !== undefined) dataToSend.is_active = formData.is_active;
      if (formData.is_featured !== undefined) dataToSend.is_featured = formData.is_featured;

      let response;

      // ====================================================================
      // IMAGE UPDATE FLOW - Handles all 4 scenarios per backend specification:
      // ====================================================================
      // Scenario 1: Clear All Images
      //   - Send: images: "[]" (empty JSON array)
      //   - Result: Backend deletes ALL existing images from storage, sets DB to null
      //
      // Scenario 2: Replace Images
      //   - Send: images: "[\"url1\", \"url2\"]" (JSON array string with URLs to keep)
      //   - Result: Backend keeps only these images, deletes all others from storage
      //
      // Scenario 3: Add New Images (Keep Existing)
      //   - Send: Upload files via images file field (no JSON array)
      //   - Result: Backend adds new images to existing ones
      //
      // Scenario 4: Replace + Add New Images
      //   - Send: images: "[\"url1\"]" (text field) + upload new files via images (file field)
      //   - Result: Backend keeps specified URLs, adds new uploaded files, deletes rest
      // ====================================================================

      // Check if we need to use FormData (images, 3D model, or images with colors)
      const FileConstructor = typeof File !== 'undefined' ? File : null;
      const hasImageFiles = imageFiles && imageFiles.length > 0 && imageFiles.every(file => FileConstructor && file instanceof FileConstructor);
      const has3DModel = model3DFile && FileConstructor && model3DFile instanceof FileConstructor;
      const hasImagesWithColors = imagesWithColors.some(img => FileConstructor && img.file instanceof FileConstructor);

      // If we have any files (images, 3D model, or images with colors), use FormData
      if (hasImageFiles || has3DModel || hasImagesWithColors) {
        try {
          const submitData = new FormData();

          // Add all fields to FormData with proper type conversion
          // Required fields: name, sku, price, category_id
          const requiredFields = new Set(['name', 'sku', 'price', 'category_id']);

          Object.keys(dataToSend).forEach((key) => {
            const value = dataToSend[key];
            const isRequired = requiredFields.has(key);


            // For required fields, always send (even if empty, let backend validate)
            // For optional fields, skip null, undefined, and empty strings
            if (!isRequired && (value === null || value === undefined || value === '')) {
              return; // Skip this optional field
            }

            // Special handling for frame_material - per Postman API spec
            // Can be single string or array for multiple materials
            if (key === 'frame_material') {
              if (Array.isArray(value) && value.length > 0) {
                // Filter out empty values and send each material as a separate form field
                // Backend will receive this as an array: frame_material = ['acetate', 'metal']
                value.filter(m => m && m.trim()).forEach((material) => {
                  submitData.append('frame_material', material.trim());
                });
              } else if (typeof value === 'string' && value.trim()) {
                // Single material - send as string
                submitData.append('frame_material', value.trim());
              }
              return; // Skip the normal processing for this field
            }

            // Convert types properly for FormData
            if (typeof value === 'boolean') {
              // Booleans: send as "true" or "false" strings
              submitData.append(key, value.toString());
            } else if (typeof value === 'number') {
              // Numbers: send as string (FormData requirement)
              submitData.append(key, value.toString());
            } else if (typeof value === 'string') {
              // Strings: trim and send
              submitData.append(key, value.trim());
            } else if (Array.isArray(value)) {
              // Arrays: convert to JSON string for other array fields
              submitData.append(key, JSON.stringify(value));
            } else if (typeof value === 'object' && value !== null) {
              // Objects: convert to JSON string
              submitData.append(key, JSON.stringify(value));
            } else {
              submitData.append(key, String(value));
            }
          });

          // Add 3D model file if present (per Postman collection: model_3d field)
          if (model3DFile) {
            submitData.append('model_3d', model3DFile);
          }

          // Method 1: Parallel Arrays (Recommended - Per Postman Collection)
          // According to Postman: "Each hex code maps to the image at the same index"
          // Example from Postman: 
          //   - Upload 5 images in `images` field
          //   - Provide `image_colors`: `["#000000", "#000000", "#FFD700", "#FFD700", "#8B4513"]`
          //   - Result: images[0] → #000000, images[1] → #000000, images[2] → #FFD700, etc.
          // Strategy: Build parallel arrays where image_colors[i] maps to images[i] by exact index

          // Separate images: those with hex codes and those without (general images)
          const FileConstructor = typeof File !== 'undefined' ? File : null;
          const imagesWithHexCodes = imagesWithColors.filter(img =>
            FileConstructor && img.file instanceof FileConstructor && img.hexCode && isValidHexCode(img.hexCode)
          );
          const imagesWithoutHexCodes = imagesWithColors.filter(img =>
            FileConstructor && img.file instanceof FileConstructor && (!img.hexCode || !isValidHexCode(img.hexCode))
          );

          // Strategy per Postman: 
          // - All images go in 'images' field
          // - image_colors array maps to images by index
          // - Images without color codes become general product images
          // 
          // We'll put images with hex codes first, then general images
          // This way image_colors indices match the first N images

          const imageFilesArray = [];
          const imageColorsArray = [];

          // First, add images with hex codes (these will have corresponding entries in image_colors)
          imagesWithHexCodes.forEach((img) => {
            imageFilesArray.push(img.file);
            imageColorsArray.push(img.hexCode);
          });

          // Then add general images (from imageFiles) - no color codes
          imageFiles.forEach((file) => {
            imageFilesArray.push(file);
            // Don't add to imageColorsArray - these are general images
          });

          // Then add images without hex codes from imagesWithColors - no color codes
          imagesWithoutHexCodes.forEach((img) => {
            imageFilesArray.push(img.file);
            // Don't add to imageColorsArray - these are general images
          });

          // For UPDATE: Send complete list of images that should remain (existing URLs)
          // Per backend flow: Send images as JSON array string to specify which images to KEEP
          // Backend will compare existing vs new list and delete removed images from storage
          // Images not in this list will be deleted from storage (local filesystem)
          if (product) {
            // Build the complete list of existing image URLs that should be kept
            // (only URLs from existingImages that are still in imagePreviews)
            const imagesToKeep = imagePreviews.filter(preview =>
              typeof preview === 'string' &&
              !preview.startsWith('data:') &&
              preview.startsWith('https://') &&
              existingImages.includes(preview)
            );

            // Send as JSON array string (text field) FIRST (for image deletion support)
            // Backend flow:
            // 1. Reads req.body.images (JSON array string) - this is the list to KEEP
            // 2. Compares existing images vs. new images list
            // 3. Identifies images to delete (exist in old list but NOT in new list)
            // 4. Deletes removed images from local storage (uploads/ folder)
            // 5. Uploads new files via multer (if any)
            // 6. Updates database with final image list
            // If empty array "[]", all existing images will be deleted
            const imagesJson = JSON.stringify(imagesToKeep);
            submitData.append('images', imagesJson);

            if (import.meta.env.DEV) {
              console.log('📤 Image Update Flow - FormData:');
              console.log('  - Images to KEEP (JSON string):', imagesJson);
              console.log('  - Existing images to keep:', imagesToKeep.length);
              console.log('  - New files to upload:', imageFilesArray.length);
              console.log('  - Backend will: Delete images NOT in keep list, Upload new files, Update database');
            }
          }

          // Append new image files (file field) - these will be added to the keep list by backend
          // Backend flow: After processing the JSON array (keep list), it uploads new files via multer
          // New files are saved to uploads/products/ folder and added to the final image list
          imageFilesArray.forEach((file) => {
            submitData.append('images', file);
          });

          // Append image_colors as JSON array string
          // This array contains hex codes for the first N images (where N = imageColorsArray.length)
          // The backend will match: images[0] → image_colors[0], images[1] → image_colors[1], etc.
          // Remaining images (without hex codes) become general product images
          // Only send image_colors if we have valid hex codes
          if (imageColorsArray.length > 0 && imageColorsArray.every(hex => hex && isValidHexCode(hex))) {
            const imageColorsJson = JSON.stringify(imageColorsArray);
            submitData.append('image_colors', imageColorsJson);

            if (import.meta.env.DEV) {
              console.log('Sending image_colors:', imageColorsJson);
            }
          }

          // For UPDATE: Send complete color_images structure for deletion support
          // ALWAYS send this field when updating (even if empty) to support deletion
          // Per backend: When color_images is sent, it REPLACES all existing color images
          // Empty array "[]" = delete all color images from storage and database
          if (product) {
            // Build the complete color_images structure with images that should remain
            const colorImagesToKeep = [];

            // Group existing images by hex code (only URLs, not Base64 previews)
            // These are images that are still in the UI (not removed by user)
            const existingImagesByColor = {};
            imagesWithColors.forEach(img => {
              if (img.isExisting && img.hexCode && isValidHexCode(img.hexCode) &&
                img.preview && typeof img.preview === 'string' && !img.preview.startsWith('data:') && img.preview.startsWith('https://')) {
                if (!existingImagesByColor[img.hexCode]) {
                  existingImagesByColor[img.hexCode] = [];
                }
                existingImagesByColor[img.hexCode].push(img.preview);
              }
            });

            // Build color_images structure from existing color images that should be kept
            // Only include colors that still have images in the UI
            existingColorImages.forEach(colorImg => {
              const keptImages = existingImagesByColor[colorImg.hexCode] || [];
              if (keptImages.length > 0) {
                colorImagesToKeep.push({
                  hexCode: colorImg.hexCode,
                  name: colorImg.name,
                  price: colorImg.price,
                  images: keptImages
                });
              }
              // If keptImages.length === 0, this color was completely removed - don't include it
              // This ensures the color is deleted from storage and database
            });

            // Also include colors that have new files but no existing images to keep
            // These are new colors being added
            imagesWithColors.forEach(img => {
              const FileConstructor = typeof File !== 'undefined' ? File : null;
              if (FileConstructor && img.file instanceof FileConstructor && img.hexCode && isValidHexCode(img.hexCode)) {
                const existing = colorImagesToKeep.find(ci => ci.hexCode === img.hexCode);
                if (!existing) {
                  const colorData = existingColorImages.find(ci => ci.hexCode === img.hexCode);
                  colorImagesToKeep.push({
                    hexCode: img.hexCode,
                    name: colorData?.name || getColorNameFromHex(img.hexCode),
                    price: colorData?.price || null,
                    images: [] // New files will be added by backend
                  });
                }
              }
            });

            // ALWAYS send color_images field when updating (even if empty array)
            // Backend behavior:
            // - Empty array "[]" = Delete ALL color images from storage, set DB to null
            // - Non-empty array = Replace existing with this list, delete removed images
            // - Images NOT in this list will be DELETED from storage and database
            const colorImagesJson = JSON.stringify(colorImagesToKeep);
            submitData.append('color_images', colorImagesJson);

            if (import.meta.env.DEV) {
              console.log('📤 Color Images Deletion Flow:');
              console.log('  - Color images to KEEP (JSON string):', colorImagesJson);
              console.log('  - Colors to keep:', colorImagesToKeep.length);
              console.log('  - Backend will: Replace all color images with this list, Delete removed images from storage');
              if (colorImagesToKeep.length === 0) {
                console.log('  - ⚠️ Empty array - ALL color images will be DELETED from storage and database');
              }
            }
          }

          // Note: Removed 'replace_images' field as it's not in the Postman collection
          // and may cause Multer "Unexpected field" errors

          // Log FormData contents in development mode for debugging
          if (import.meta.env.DEV) {
            const formDataObj = {};
            const FileConstructor = typeof File !== 'undefined' ? File : null;
            for (const [key, value] of submitData.entries()) {
              if (FileConstructor && value instanceof FileConstructor) {
                formDataObj[key] = `[File: ${value.name}, size: ${value.size}]`;
              } else {
                formDataObj[key] = value;
              }
            }
            console.log('Sending product FormData:', {
              ...formDataObj,
              imageFilesCount: imageFiles.length,
              imagesWithColorsCount: imagesWithColors.filter(img => FileConstructor && img.file instanceof FileConstructor).length,
              imagesWithHexCodesCount: imagesWithHexCodes.length,
              has3DModel: !!model3DFile,
              isUpdate: !!product
            });
          }

          // Get valid product ID using helper function
          const validProductId = getValidProductId();

          if (validProductId) {
            console.log(`🔄 Updating product with ID: ${validProductId}`);
            response = await updateProduct(validProductId, submitData);
          } else {
            console.log('➕ Creating new product (no valid ID found)');
            response = await createProduct(submitData);
          }
        } catch (imageError) {
          // Log full error details
          console.error('Image upload error details:', {
            message: imageError.message,
            status: imageError.response?.status,
            statusText: imageError.response?.statusText,
            data: imageError.response?.data,
            config: {
              url: imageError.config?.url,
              method: imageError.config?.method,
              headers: imageError.config?.headers
            }
          });

          // Check for Multer "Unexpected field" error
          const errorData = imageError.response?.data || {};
          const errorMessage = errorData.message || errorData.error || '';
          if (errorMessage.includes('Unexpected field') && imagesWithColors.length > 0) {
            console.warn('Multer "Unexpected field" error detected. This may be due to image color fields not being accepted by the backend Multer configuration.');
          }

          // Re-throw the error - let multer handle file uploads
          throw imageError;
        }
      } else {
        // No files to upload - send as JSON body
        // But if updating, we still need to send image deletion arrays
        // Per backend flow: When sending JSON (not FormData), backend accepts arrays directly
        if (product) {
          // When updating without new files, we still need to send deletion arrays
          // Build the complete list of existing image URLs that should be kept
          const imagesToKeep = imagePreviews.filter(preview =>
            typeof preview === 'string' &&
            !preview.startsWith('data:') &&
            preview.startsWith('https://') &&
            existingImages.includes(preview)
          );

          // Add images array for deletion support
          // Backend flow: Compares existing images vs. new list, deletes removed ones
          // Empty array [] = delete all existing images
          dataToSend.images = imagesToKeep;

          // Build color_images structure for deletion support
          // ALWAYS send this field when updating (even if empty) to support deletion
          const colorImagesToKeep = [];
          const existingImagesByColor = {};

          // Group existing images by hex code (only URLs, not Base64 previews)
          // These are images that are still in the UI (not removed by user)
          imagesWithColors.forEach(img => {
            if (img.isExisting && img.hexCode && isValidHexCode(img.hexCode) &&
              img.preview && typeof img.preview === 'string' && !img.preview.startsWith('data:') && img.preview.startsWith('https://')) {
              if (!existingImagesByColor[img.hexCode]) {
                existingImagesByColor[img.hexCode] = [];
              }
              existingImagesByColor[img.hexCode].push(img.preview);
            }
          });

          // Build color_images structure from existing color images that should be kept
          // Only include colors that still have images in the UI
          existingColorImages.forEach(colorImg => {
            const keptImages = existingImagesByColor[colorImg.hexCode] || [];
            if (keptImages.length > 0) {
              colorImagesToKeep.push({
                hexCode: colorImg.hexCode,
                name: colorImg.name,
                price: colorImg.price,
                images: keptImages
              });
            }
            // If keptImages.length === 0, this color was completely removed - don't include it
            // This ensures the color is deleted from storage and database
          });

          // ALWAYS add color_images array for deletion support (even if empty)
          // Backend behavior:
          // - Empty array [] = Delete ALL color images from storage, set DB to null
          // - Non-empty array = Replace existing with this list, delete removed images
          dataToSend.color_images = colorImagesToKeep;

          if (import.meta.env.DEV) {
            console.log('📤 Image Update Flow - JSON Body:');
            console.log('  - Images to KEEP (array):', imagesToKeep);
            console.log('  - Color images to KEEP:', colorImagesToKeep);
            console.log('  - Backend will: Delete images NOT in keep list, Update database');
            if (imagesToKeep.length === 0) {
              console.log('  - ⚠️ Empty images array - ALL general images will be DELETED from storage and database');
            }
            if (colorImagesToKeep.length === 0) {
              console.log('  - ⚠️ Empty color_images array - ALL color images will be DELETED from storage and database');
            }
          }
        }


        // Get valid product ID using helper function
        const validProductId = getValidProductId();

        if (validProductId) {
          console.log(`🔄 Updating product with ID: ${validProductId}`);
          response = await updateProduct(validProductId, dataToSend);
        } else {
          console.log('➕ Creating new product (no valid ID found)');
          response = await createProduct(dataToSend);
        }
      }

      // Handle nested response structure: { success, message, data: { product: {...} } }
      const responseData = response.data?.data || response.data;
      let savedProduct = responseData?.product || responseData;
      const successMessage = response.data?.message || (product ? 'Product updated successfully' : 'Product created successfully');

      // Remove variant-related fields from saved product response
      if (savedProduct && savedProduct.id) {
        const {
          variants,
          sizeVolumeVariants,
          size_volume_variants,
          size_volume,
          pack_type,
          ...cleanSavedProduct
        } = savedProduct;

        // Update currentProduct with cleaned product data (without variant fields)
        setCurrentProduct(cleanSavedProduct);

        // If this is an eye hygiene product, fetch variants separately after save
        if (isEyeHygiene && savedProduct.id) {
          fetchSizeVolumeVariants(savedProduct.id).catch(err => {
            console.warn('⚠️ Could not refresh variants after product save:', err);
          });
        }
      }

      toast.success(successMessage);

      // Reset image files after successful save
      setImageFiles([]);
      setImagePreviews([]);
      setExistingImages([]);
      setImagesWithColors([]);
      setExistingColorImages([]);

      // Close modal - parent component will refresh the products list
      console.log('🔄 Product saved successfully - calling onClose(true) to refresh table');
      console.log('🔄 This should NOT cause page refresh - only table update');
      onClose(true);
    } catch (error) {
      // Log full error details for debugging
      console.error('Product save error:', error);
      console.error('Error response:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });

      // Network errors (backend not available, timeout, etc.)
      if (!error.response) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          toast.error('Request timeout - The server is taking too long to respond. Please try again.');
        } else if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
          toast.error('Network error - Please check if the backend server is running');
        } else {
          toast.error('Backend unavailable - Cannot save product. Please ensure the server is running.');
        }
      } else if (error.response.status === 401) {
        toast.error('Authentication failed - Please log in again');
      } else if (error.response.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else if (error.response.status === 500) {
        // Check for Prisma validation errors
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.error || '';

        // Log the full error for debugging
        console.error('Server 500 error details:', {
          message: errorMessage,
          error: errorData.error,
          stack: errorData.stack,
          fullData: errorData
        });

        // Log the full Prisma error if available
        if (errorData.fullData || errorData.stack) {
          console.error('Full Prisma error:', JSON.stringify(errorData, null, 2));
        }

        if (errorMessage.includes('Prisma') || errorMessage.includes('Invalid value provided')) {
          // Extract field name from Prisma error
          const fieldMatch = errorMessage.match(/field: (\w+)/);
          const fieldName = fieldMatch ? fieldMatch[1] : 'unknown field';
          toast.error(`Validation error: Please check the ${fieldName} field`);
        } else if (errorMessage.includes('Unique constraint')) {
          toast.error('A product with this SKU or slug already exists');
        } else if (errorMessage.includes('Foreign key constraint')) {
          toast.error('Invalid category, brand, or subcategory selected');
        } else {
          toast.error('Server error: ' + errorMessage);
        }
      } else if (error.response.status === 422) {
        // Validation errors
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.error || 'Validation failed';
        
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Show specific field errors
          errorData.errors.forEach(fieldError => {
            toast.error(`${fieldError.field}: ${fieldError.message}`);
          });
        } else {
          toast.error('Validation error: ' + errorMessage);
        }
      } else {
        // Other errors
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to save product';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if product is eye hygiene by product_type or category FIRST
  // Use multiple sources for category name to ensure we detect eye hygiene products even before categories load
  const currentCategory = categories.find(cat =>
    cat.id === formData.category_id ||
    cat.id === parseInt(formData.category_id) ||
    String(cat.id) === String(formData.category_id)
  );
  const categoryName = (
    currentCategory?.name ||
    product?.category?.name ||
    product?.category_name ||
    (product?.category_id && categories.find(c =>
      c.id === product.category_id ||
      c.id === parseInt(product.category_id) ||
      String(c.id) === String(product.category_id)
    )?.name) ||
    ''
  ).toLowerCase().trim();
  const isEyeHygieneByCategory = categoryName.includes('eye') && categoryName.includes('hygiene');

  // Also check the product prop's product_type in case it's set but formData hasn't been updated yet
  const productTypeFromProduct = product?.product_type || '';
  const formProductType = formData.product_type || '';

  // Check if product_type is 'eye_hygiene' or legacy 'accessory' with eye hygiene category
  const isEyeHygieneByProductType = productTypeFromProduct === 'eye_hygiene' || formProductType === 'eye_hygiene';

  // Legacy: Also check for 'accessory' with eye hygiene category (for backward compatibility)
  const isLegacyAccessory = productTypeFromProduct === 'accessory' || formProductType === 'accessory';
  const isEyeHygieneFromLegacyAccessory = isLegacyAccessory && isEyeHygieneByCategory;

  // Final determination: eye hygiene if explicitly set OR detected by category (including legacy 'accessory')
  const isEyeHygiene = isEyeHygieneByProductType ||
    isEyeHygieneByCategory ||
    isEyeHygieneFromLegacyAccessory;

  // Define tabs - show Lens Management only for frames, sunglasses, and opty-kids (but NOT eye hygiene)
  // Show Spherical and Astigmatism Configurations for contact lens products
  // IMPORTANT: All sections/tabs are present when editing - tabs are conditionally shown based on product_type
  const productTypeCheck = formData.product_type === 'frame' || formData.product_type === 'sunglasses' || formData.product_type === 'opty-kids';
  const isFrameOrSunglasses = productTypeCheck && !isEyeHygiene; // Exclude eye hygiene products
  const isContactLens = formData.product_type === 'contact_lens' && !isEyeHygiene; // Also exclude eye hygiene from contact lens tabs

  // Debug logging for eye hygiene detection
  if (product && (categoryName.includes('eye') || categoryName.includes('hygiene') || formData.product_type === 'eye_hygiene' || productTypeFromProduct === 'accessory')) {
    console.log('🔍 Eye Hygiene Detection:', {
      productId: product.id,
      formDataProductType: formData.product_type,
      productPropProductType: productTypeFromProduct,
      categoryName: categoryName,
      categoryId: formData.category_id || product.category_id,
      isLegacyAccessory: isLegacyAccessory,
      isEyeHygieneByCategory: isEyeHygieneByCategory,
      isEyeHygieneByProductType: isEyeHygieneByProductType,
      isEyeHygieneFromLegacyAccessory: isEyeHygieneFromLegacyAccessory,
      isEyeHygiene: isEyeHygiene,
      categoriesLoaded: categories.length > 0,
      currentCategoryId: currentCategory?.id
    });
  }

  const tabs = [
    { id: 'general', label: 'General' }, // Always shown - contains all basic product fields
    ...(isFrameOrSunglasses ? [
      { id: 'mm-calibers', label: 'MM Calibers' },
      { id: 'lens-management', label: 'Lens Management' },
    ] : []),
    ...(isContactLens ? [
      { id: 'spherical', label: 'Spherical Configurations' },
      { id: 'astigmatism', label: 'Astigmatism Configurations' },
    ] : []),
    // Only show Size/Volume Variants tab for saved eye hygiene products (product must have an ID)
    ...(isEyeHygiene && getValidProductId() ? [
      { id: 'eye-hygiene-variants', label: 'Eye Hygiene Variants' },
      { id: 'variants', label: 'Size/Volume Variants' },
    ] : []),
    { id: 'images', label: 'Images' }, // Always shown - all products can have images
    { id: 'seo', label: 'SEO' }, // Always shown - all products can have SEO settings
    { id: 'clip', label: 'clip' },
    { id: 'auctions', label: 'Auctions' },
    { id: 'progressive', label: 'Progressive' },
  ];

  // Log tabs for eye hygiene products to help with debugging
  if (isEyeHygiene && product) {
    console.log(`📋 Eye Hygiene product edit - Available tabs:`, tabs.map(t => t.label).join(', '));
  }

  // Fetch lens management data when tab changes
  useEffect(() => {
    if (activeTab === 'lens-management') {
      fetchLensManagementData();
    }
  }, [activeTab]);

  // Fetch configurations when tab changes or product changes
  useEffect(() => {
    if (currentProduct?.id) {
      if (activeTab === 'spherical') {
        fetchSphericalConfigs();
      } else if (activeTab === 'astigmatism') {
        fetchAstigmatismConfigs();
      }
    } else {
      // No product ID - clear configs silently (this is normal for new products)
      if (activeTab === 'spherical') {
        setSphericalConfigs([]);
      } else if (activeTab === 'astigmatism') {
        setAstigmatismConfigs([]);
      }
    }
  }, [activeTab, currentProduct?.id]);

  // Fetch all lens management configurations
  const fetchLensManagementData = async () => {
    setLoadingLensManagement({ all: true });
    try {
      // Fetch all lens management types in parallel
      const [
        frameSizesRes,
        lensTypesRes,
        lensOptionsRes,
        prescriptionSunRes,
        photochromicRes,
        lensCoatingsRes,
        lensColorsRes,
        lensFinishesRes,
        lensTreatmentsRes,
        thicknessMaterialsRes,
        thicknessOptionsRes,
        prescriptionLensTypesRes,
        prescriptionDropdownRes,
      ] = await Promise.allSettled([
        api.get(`${API_ROUTES.ADMIN.FRAME_SIZES.LIST}?limit=1000`),
        api.get(`${API_ROUTES.ADMIN.LENS_TYPES.LIST}?limit=1000`),
        api.get(`${API_ROUTES.ADMIN.LENS_OPTIONS.LIST}?limit=1000`),
        api.get(`${API_ROUTES.ADMIN.PRESCRIPTION_SUN_LENSES.LIST}?limit=1000`),
        api.get(`${API_ROUTES.ADMIN.PHOTOCHROMIC_LENSES.LIST}?limit=1000`),
        api.get(`${API_ROUTES.ADMIN.LENS_COATINGS.LIST}?limit=1000`),
        api.get(`${API_ROUTES.ADMIN.LENS_COLORS.LIST}?limit=1000`),
        api.get(`${API_ROUTES.ADMIN.LENS_FINISHES.LIST}?limit=1000`),
        api.get(`${API_ROUTES.ADMIN.LENS_TREATMENTS.LIST}?limit=1000`),
        api.get(`${API_ROUTES.ADMIN.LENS_THICKNESS_MATERIALS.LIST}?limit=1000`),
        api.get(`${API_ROUTES.ADMIN.LENS_THICKNESS_OPTIONS.LIST}?limit=1000`),
        api.get(`${API_ROUTES.ADMIN.PRESCRIPTION_LENS_TYPES.LIST}?limit=1000`),
        api.get(`${API_ROUTES.ADMIN.PRESCRIPTION_FORMS.DROPDOWN_VALUES.LIST}?limit=1000`),
      ]);

      // Helper function to extract data from response - handles multiple response formats
      // Matches the pattern used in FrameSizes.jsx and LensOptions.jsx
      const extractData = (response, key) => {
        if (response.status === 'fulfilled' && response.value) {
          const axiosResponse = response.value; // This is the axios response object
          const responseData = axiosResponse.data; // This is the actual API response
          let extractedData = [];

          // Generate snake_case version of key
          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();

          // Generate singular versions
          const singularKey = key.slice(0, -1); // Remove last 's'
          const singularSnakeKey = snakeKey.slice(0, -1);

          // Special handling for certain keys
          const alternativeKeys = {
            'frameSizes': ['frame_sizes', 'frameSize', 'frame_size'],
            'lensTypes': ['lens_types', 'lensType', 'lens_type'],
            'lensOptions': ['options', 'lens_options', 'lensOption', 'lens_option'],
            'prescriptionSunLenses': ['prescription_sun_lenses', 'prescriptionSunLens', 'prescription_sun_lens', 'prescription_sun', 'prescriptionSun'],
            'photochromicLenses': ['photochromic_lenses', 'photochromicLens', 'photochromic_lens', 'photochromic'],
            'lensCoatings': ['lens_coatings', 'lensCoating', 'lens_coating', 'coatings', 'coating'],
            'lensColors': ['lens_colors', 'lensColor', 'lens_color', 'colors', 'color'],
            'lensFinishes': ['lens_finishes', 'lensFinish', 'lens_finish', 'finishes', 'finish'],
            'lensTreatments': ['lens_treatments', 'lensTreatment', 'lens_treatment', 'treatments', 'treatment'],
            'thicknessMaterials': ['thickness_materials', 'thicknessMaterial', 'thickness_material', 'materials', 'material'],
            'thicknessOptions': ['thickness_options', 'thicknessOption', 'thickness_option', 'options', 'option'],
            'prescriptionLensTypes': ['prescription_lens_types', 'prescriptionLensType', 'prescription_lens_type', 'prescription_lens', 'prescriptionLens'],
            'dropdownValues': ['dropdown_values', 'dropdownValue', 'dropdown_value', 'prescription_form_dropdown_values', 'values', 'value']
          };

          const altKeys = alternativeKeys[key] || [];
          const allKeysToCheck = [key, snakeKey, singularKey, singularSnakeKey, ...altKeys];

          // Helper function to recursively find arrays
          const findFirstArray = (obj, depth = 0, maxDepth = 5) => {
            if (depth > maxDepth || !obj || typeof obj !== 'object') return null;
            if (Array.isArray(obj) && obj.length > 0) return obj;

            for (const value of Object.values(obj)) {
              if (Array.isArray(value) && value.length > 0) return value;
              if (value && typeof value === 'object' && !Array.isArray(value)) {
                const found = findFirstArray(value, depth + 1, maxDepth);
                if (found) return found;
              }
            }
            return null;
          };

          // Strategy 1: Check responseData.data (most common structure)
          if (responseData?.data) {
            const dataObj = responseData.data;

            // Direct array in data.data
            if (Array.isArray(dataObj)) {
              extractedData = dataObj;
            }
            // Check all possible keys in data.data
            else if (typeof dataObj === 'object') {
              // First, try exact key matches
              for (const checkKey of allKeysToCheck) {
                if (dataObj[checkKey] && Array.isArray(dataObj[checkKey])) {
                  extractedData = dataObj[checkKey];
                  break;
                }
              }

              // If still not found, check nested data.data.data
              if (extractedData.length === 0 && dataObj.data) {
                if (Array.isArray(dataObj.data)) {
                  extractedData = dataObj.data;
                } else if (typeof dataObj.data === 'object') {
                  for (const checkKey of allKeysToCheck) {
                    if (dataObj.data[checkKey] && Array.isArray(dataObj.data[checkKey])) {
                      extractedData = dataObj.data[checkKey];
                      break;
                    }
                  }
                }
              }

              // Try common array keys (results, items, list, data)
              if (extractedData.length === 0) {
                const commonKeys = ['results', 'items', 'list', 'data', 'records'];
                for (const commonKey of commonKeys) {
                  if (dataObj[commonKey] && Array.isArray(dataObj[commonKey])) {
                    extractedData = dataObj[commonKey];
                    break;
                  }
                }
              }

              // Last resort: find ANY array in the data object
              if (extractedData.length === 0) {
                const foundArray = findFirstArray(dataObj);
                if (foundArray) {
                  extractedData = foundArray;
                }
              }
            }
          }

          // Strategy 2: Check if responseData is directly an array
          if (extractedData.length === 0 && Array.isArray(responseData)) {
            extractedData = responseData;
          }

          // Strategy 3: Check for keys at root level
          if (extractedData.length === 0 && responseData && typeof responseData === 'object') {
            // Try exact key matches first
            for (const checkKey of allKeysToCheck) {
              if (responseData[checkKey] && Array.isArray(responseData[checkKey])) {
                extractedData = responseData[checkKey];
                break;
              }
            }

            // Try common array keys at root
            if (extractedData.length === 0) {
              const commonKeys = ['data', 'results', 'items', 'list', 'records'];
              for (const commonKey of commonKeys) {
                if (responseData[commonKey] && Array.isArray(responseData[commonKey])) {
                  extractedData = responseData[commonKey];
                  break;
                }
              }
            }

            // Last resort: find ANY array in the response
            if (extractedData.length === 0) {
              const foundArray = findFirstArray(responseData);
              if (foundArray) {
                extractedData = foundArray;
              }
            }
          }

          // Helper function to find all arrays in response
          const findAllArrays = (obj, path = '') => {
            const arrays = [];
            if (obj && typeof obj === 'object') {
              for (const [k, v] of Object.entries(obj)) {
                const currentPath = path ? `${path}.${k}` : k;
                if (Array.isArray(v) && v.length > 0) {
                  arrays.push({ path: currentPath, length: v.length, data: v });
                } else if (v && typeof v === 'object' && !Array.isArray(v)) {
                  arrays.push(...findAllArrays(v, currentPath));
                }
              }
            }
            return arrays;
          };

          // Debug logging and final fallback
          if (extractedData.length > 0) {
            console.log(`✅ Successfully extracted ${extractedData.length} ${key} items`);
          } else {
            // Find all arrays in the response
            const foundArrays = findAllArrays(responseData);
            if (foundArrays.length > 0) {
              console.warn(`⚠️ No data extracted for ${key} using expected keys. Found ${foundArrays.length} array(s) at:`, foundArrays.map(a => `${a.path} (${a.length} items)`));
              // Use the largest array as fallback
              const sortedArrays = foundArrays.sort((a, b) => b.length - a.length);
              const bestArray = sortedArrays[0];
              extractedData = bestArray.data;
              console.log(`💡 Using fallback array from path: ${bestArray.path} (${extractedData.length} items)`);
            } else {
              console.warn(`⚠️ No data extracted for ${key}. Looking for:`, allKeysToCheck);
              console.warn(`Response structure:`, JSON.stringify(responseData, null, 2).substring(0, 1000));
            }
          }

          return Array.isArray(extractedData) ? extractedData : [];
        } else if (response.status === 'rejected') {
          console.error(`❌ Failed to fetch ${key}:`, response.reason);
        }
        return [];
      };

      const frameSizesData = extractData(frameSizesRes, 'frameSizes');
      const lensTypesData = extractData(lensTypesRes, 'lensTypes');
      const lensOptionsData = extractData(lensOptionsRes, 'lensOptions');
      const prescriptionSunData = extractData(prescriptionSunRes, 'prescriptionSunLenses');
      const photochromicData = extractData(photochromicRes, 'photochromicLenses');
      const lensCoatingsData = extractData(lensCoatingsRes, 'lensCoatings');
      const lensColorsData = extractData(lensColorsRes, 'lensColors');
      const lensFinishesData = extractData(lensFinishesRes, 'lensFinishes');
      const lensTreatmentsData = extractData(lensTreatmentsRes, 'lensTreatments');
      const thicknessMaterialsData = extractData(thicknessMaterialsRes, 'thicknessMaterials');
      const thicknessOptionsData = extractData(thicknessOptionsRes, 'thicknessOptions');
      const prescriptionLensTypesData = extractData(prescriptionLensTypesRes, 'prescriptionLensTypes');
      const prescriptionDropdownData = extractData(prescriptionDropdownRes, 'dropdownValues');

      console.log('📊 Setting lens management data:', {
        frameSizes: frameSizesData.length,
        lensTypes: lensTypesData.length,
        lensOptions: lensOptionsData.length,
        prescriptionSunLenses: prescriptionSunData.length,
        photochromicLenses: photochromicData.length,
        lensCoatings: lensCoatingsData.length,
        lensColors: lensColorsData.length,
        lensFinishes: lensFinishesData.length,
        lensTreatments: lensTreatmentsData.length,
        thicknessMaterials: thicknessMaterialsData.length,
        thicknessOptions: thicknessOptionsData.length,
        prescriptionLensTypes: prescriptionLensTypesData.length,
        prescriptionDropdownValues: prescriptionDropdownData.length,
      });

      setFrameSizes(frameSizesData);
      setLensTypesList(lensTypesData);
      setLensOptions(lensOptionsData);
      setPrescriptionSunLenses(prescriptionSunData);
      setPhotochromicLenses(photochromicData);
      setLensCoatings(lensCoatingsData);
      setLensColors(lensColorsData);
      setLensFinishes(lensFinishesData);
      setLensTreatments(lensTreatmentsData);
      setThicknessMaterials(thicknessMaterialsData);
      setThicknessOptions(thicknessOptionsData);
      setPrescriptionLensTypes(prescriptionLensTypesData);
      setPrescriptionDropdownValues(prescriptionDropdownData);
    } catch (error) {
      console.error('Failed to fetch lens management data:', error);
      toast.error('Failed to load some lens management data. Please refresh the page.');
    } finally {
      setLoadingLensManagement({ all: false });
    }
  };

  // Helper function to extract configuration data from API response
  // Enhanced to match the robust pattern used in lens management extraction
  const extractConfigData = (response, key) => {
    if (!response || !response.data) {
      console.warn(`⚠️ No response data for ${key}`);
      return [];
    }

    const responseData = response.data;
    console.log(`🔍 Extracting data for ${key}. Full response:`, JSON.stringify(responseData, null, 2));
    let extractedData = [];

    // Generate all possible key variations
    const keyVariations = {
      'sphericalConfigs': [
        'sphericalConfigs', 'spherical_configs', 'sphericalConfig', 'spherical_config',
        'spherical', 'configs', 'data', 'results', 'items', 'list', 'records'
      ],
      'astigmatismConfigs': [
        'astigmatismConfigs', 'astigmatism_configs', 'astigmatismConfig', 'astigmatism_config',
        'astigmatism', 'configs', 'data', 'results', 'items', 'list', 'records'
      ]
    };

    const allKeysToCheck = keyVariations[key] || [key, 'configs', 'data', 'results', 'items', 'list', 'records'];

    // Helper function to recursively find arrays
    const findFirstArray = (obj, depth = 0, maxDepth = 5) => {
      if (depth > maxDepth || !obj || typeof obj !== 'object') return null;
      if (Array.isArray(obj) && obj.length > 0) return obj;

      for (const value of Object.values(obj)) {
        if (Array.isArray(value) && value.length > 0) return value;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const found = findFirstArray(value, depth + 1, maxDepth);
          if (found) return found;
        }
      }
      return null;
    };

    // Strategy 1: Check responseData.data (most common structure)
    if (responseData?.data) {
      const dataObj = responseData.data;

      // Direct array in data.data
      if (Array.isArray(dataObj)) {
        extractedData = dataObj;
        console.log(`✅ Found array in response.data.data (${dataObj.length} items)`);
      }
      // Check all possible keys in data.data
      else if (typeof dataObj === 'object') {
        // First, try exact key matches
        for (const checkKey of allKeysToCheck) {
          if (dataObj[checkKey] && Array.isArray(dataObj[checkKey])) {
            extractedData = dataObj[checkKey];
            console.log(`✅ Found ${checkKey} array in response.data.data.${checkKey} (${dataObj[checkKey].length} items)`);
            break;
          }
        }

        // If still not found, check nested data.data.data
        if (extractedData.length === 0 && dataObj.data) {
          if (Array.isArray(dataObj.data)) {
            extractedData = dataObj.data;
            console.log(`✅ Found array in response.data.data.data (${dataObj.data.length} items)`);
          } else if (typeof dataObj.data === 'object') {
            for (const checkKey of allKeysToCheck) {
              if (dataObj.data[checkKey] && Array.isArray(dataObj.data[checkKey])) {
                extractedData = dataObj.data[checkKey];
                console.log(`✅ Found ${checkKey} array in response.data.data.data.${checkKey} (${dataObj.data[checkKey].length} items)`);
                break;
              }
            }
          }
        }

        // Try common array keys (results, items, list, data)
        if (extractedData.length === 0) {
          const commonKeys = ['results', 'items', 'list', 'data', 'records', 'configs'];
          for (const commonKey of commonKeys) {
            if (dataObj[commonKey] && Array.isArray(dataObj[commonKey])) {
              extractedData = dataObj[commonKey];
              console.log(`✅ Found ${commonKey} array in response.data.data.${commonKey} (${dataObj[commonKey].length} items)`);
              break;
            }
          }
        }

        // Last resort: find ANY array in the data object
        if (extractedData.length === 0) {
          const foundArray = findFirstArray(dataObj);
          if (foundArray) {
            extractedData = foundArray;
            console.log(`💡 Using first array found in response.data.data (${foundArray.length} items)`);
          }
        }
      }
    }

    // Strategy 2: Check if responseData is directly an array
    if (extractedData.length === 0 && Array.isArray(responseData)) {
      extractedData = responseData;
      console.log(`✅ Found direct array response (${responseData.length} items)`);
    }

    // Strategy 3: Check for keys at root level
    if (extractedData.length === 0 && responseData && typeof responseData === 'object') {
      // Try exact key matches first
      for (const checkKey of allKeysToCheck) {
        if (responseData[checkKey] && Array.isArray(responseData[checkKey])) {
          extractedData = responseData[checkKey];
          console.log(`✅ Found ${checkKey} array in response.data.${checkKey} (${responseData[checkKey].length} items)`);
          break;
        }
      }

      // Try common array keys at root
      if (extractedData.length === 0) {
        const commonKeys = ['data', 'results', 'items', 'list', 'records', 'configs'];
        for (const commonKey of commonKeys) {
          if (responseData[commonKey] && Array.isArray(responseData[commonKey])) {
            extractedData = responseData[commonKey];
            console.log(`✅ Found ${commonKey} array in response.data.${commonKey} (${responseData[commonKey].length} items)`);
            break;
          }
        }
      }

      // Last resort: find ANY array in the response
      if (extractedData.length === 0) {
        const foundArray = findFirstArray(responseData);
        if (foundArray) {
          extractedData = foundArray;
          console.log(`💡 Using first array found in response.data (${foundArray.length} items)`);
        }
      }
    }

    // Final fallback: find all arrays and use the largest one
    if (extractedData.length === 0) {
      console.log('🔍 No standard structure found, searching for all arrays in response...');
      const findAllArrays = (obj, path = '') => {
        const arrays = [];
        if (obj && typeof obj === 'object') {
          for (const [k, v] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${k}` : k;
            if (Array.isArray(v) && v.length > 0) {
              arrays.push({ path: currentPath, length: v.length, data: v });
            } else if (v && typeof v === 'object' && !Array.isArray(v)) {
              arrays.push(...findAllArrays(v, currentPath));
            }
          }
        }
        return arrays;
      };

      const foundArrays = findAllArrays(responseData);
      if (foundArrays.length > 0) {
        const sortedArrays = foundArrays.sort((a, b) => b.length - a.length);
        const bestArray = sortedArrays[0];
        extractedData = bestArray.data;
        console.log(`💡 Using largest array from path: ${bestArray.path} (${bestArray.length} items)`);
        console.log(`📊 All found arrays:`, foundArrays.map(a => `${a.path} (${a.length} items)`));
      }
    }

    // Validate extracted data
    if (!Array.isArray(extractedData)) {
      console.warn(`⚠️ Extracted data is not an array for ${key}:`, typeof extractedData, extractedData);
      console.warn(`⚠️ Full response structure:`, JSON.stringify(responseData, null, 2));
      return [];
    }

    if (extractedData.length > 0) {
      console.log(`✅ Successfully extracted ${extractedData.length} ${key} items`);
      // Log first item structure for debugging
      if (extractedData[0]) {
        console.log(`📋 Sample item structure:`, Object.keys(extractedData[0]));
        console.log(`📋 Sample item (first 3 keys):`, Object.keys(extractedData[0]).slice(0, 3).reduce((acc, k) => {
          acc[k] = extractedData[0][k];
          return acc;
        }, {}));
      }
    } else {
      console.warn(`⚠️ No data extracted for ${key}. Response structure:`, JSON.stringify(responseData, null, 2).substring(0, 1000));
    }

    return extractedData;
  };

  // Fetch Spherical Configurations
  const fetchSphericalConfigs = async () => {
    if (!currentProduct?.id) {
      setSphericalConfigs([]);
      return;
    }
    try {
      setLoadingSpherical(true);

      // Build endpoint with query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('limit', '1000');
      queryParams.append('page', '1');

      // Try product_id filter first
      let endpoint = `${API_ROUTES.ADMIN.CONTACT_LENS_FORMS.SPHERICAL.LIST}?${queryParams.toString()}&product_id=${currentProduct.id}`;
      console.log(`🔍 Fetching spherical configs for product ${currentProduct.id} from: ${endpoint}`);

      let response;
      let useProductIdFilter = true;

      try {
        response = await api.get(endpoint);
        console.log('📦 Spherical configs API response:', response);
        console.log('📦 Full response data:', JSON.stringify(response.data, null, 2));
      } catch (filterError) {
        // If product_id filter fails, fetch all and filter client-side
        if (filterError.response?.status === 400 || filterError.response?.status === 422) {
          console.log('⚠️ product_id filter not supported, fetching all configs and filtering client-side');
          useProductIdFilter = false;
          endpoint = `${API_ROUTES.ADMIN.CONTACT_LENS_FORMS.SPHERICAL.LIST}?${queryParams.toString()}`;
          response = await api.get(endpoint);
          console.log('📦 Spherical configs API response (all):', response);
          console.log('📦 Full response data (all):', JSON.stringify(response.data, null, 2));
        } else {
          throw filterError;
        }
      }

      // Extract data from response - try multiple extraction strategies
      let configsData = extractConfigData(response, 'sphericalConfigs');
      console.log(`📊 Raw extracted data:`, configsData);

      // If extraction returned empty, try alternative extraction methods
      if (!configsData || configsData.length === 0) {
        console.log('🔍 Primary extraction returned empty, trying alternative methods...');
        // Try extracting with generic 'configs' key
        const altData = extractConfigData({ data: response.data }, 'configs');
        if (altData && altData.length > 0) {
          configsData = altData;
          console.log(`✅ Alternative extraction found ${configsData.length} items`);
        }
      }

      // If we fetched all configs, filter by product_id client-side
      if (!useProductIdFilter && configsData && configsData.length > 0) {
        const beforeFilter = configsData.length;
        configsData = configsData.filter(config => {
          if (!config) return false;
          const configProductId = config.product_id || config.productId || config.product?.id;
          const productId = currentProduct?.id;
          if (!productId) return false; // Skip filtering if no product ID
          const matches = configProductId == productId || configProductId === parseInt(productId) || String(configProductId) === String(productId);
          return matches;
        });
        console.log(`🔍 Filtered from ${beforeFilter} to ${configsData.length} configs for product ${currentProduct?.id}`);
      }

      // Validate and set data
      if (Array.isArray(configsData)) {
        console.log(`✅ Successfully extracted ${configsData.length} spherical configs:`, configsData);
        setSphericalConfigs(configsData);

        if (configsData.length === 0) {
          console.log('ℹ️ No spherical configs found for this product');
        }
      } else {
        console.warn('⚠️ Extracted data is not an array:', configsData);
        setSphericalConfigs([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch spherical configs:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      }

      // Handle different error cases
      if (!error.response) {
        toast.error('Cannot connect to server. Check if backend is running.');
      } else if (error.response.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response.status === 404) {
        // 404 might be acceptable if no configs exist yet
        console.log('ℹ️ No spherical configs endpoint or no data found (404)');
        setSphericalConfigs([]);
      } else if (error.response.status === 403) {
        toast.error('Access denied. You may not have permission to access this resource.');
        setSphericalConfigs([]);
      } else if (error.response.status !== 400) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to load spherical configurations';
        toast.error(errorMessage);
        setSphericalConfigs([]);
      } else {
        setSphericalConfigs([]);
      }
    } finally {
      setLoadingSpherical(false);
    }
  };

  // Fetch Astigmatism Configurations
  const fetchAstigmatismConfigs = async () => {
    if (!currentProduct?.id) {
      setAstigmatismConfigs([]);
      return;
    }
    try {
      setLoadingAstigmatism(true);

      // Build endpoint with query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('limit', '1000');
      queryParams.append('page', '1');

      // Try product_id filter first
      let endpoint = `${API_ROUTES.ADMIN.CONTACT_LENS_FORMS.ASTIGMATISM.LIST}?${queryParams.toString()}&product_id=${currentProduct.id}`;
      console.log(`🔍 Fetching astigmatism configs for product ${currentProduct.id} from: ${endpoint}`);

      let response;
      let useProductIdFilter = true;

      try {
        response = await api.get(endpoint);
        console.log('📦 Astigmatism configs API response:', response);
        console.log('📦 Full response data:', JSON.stringify(response.data, null, 2));
      } catch (filterError) {
        // If product_id filter fails, fetch all and filter client-side
        if (filterError.response?.status === 400 || filterError.response?.status === 422) {
          console.log('⚠️ product_id filter not supported, fetching all configs and filtering client-side');
          useProductIdFilter = false;
          endpoint = `${API_ROUTES.ADMIN.CONTACT_LENS_FORMS.ASTIGMATISM.LIST}?${queryParams.toString()}`;
          response = await api.get(endpoint);
          console.log('📦 Astigmatism configs API response (all):', response);
          console.log('📦 Full response data (all):', JSON.stringify(response.data, null, 2));
        } else {
          throw filterError;
        }
      }

      // Extract data from response - try multiple extraction strategies
      let configsData = extractConfigData(response, 'astigmatismConfigs');
      console.log(`📊 Raw extracted data:`, configsData);

      // If extraction returned empty, try alternative extraction methods
      if (!configsData || configsData.length === 0) {
        console.log('🔍 Primary extraction returned empty, trying alternative methods...');
        // Try extracting with generic 'configs' key
        const altData = extractConfigData({ data: response.data }, 'configs');
        if (altData && altData.length > 0) {
          configsData = altData;
          console.log(`✅ Alternative extraction found ${configsData.length} items`);
        }
      }

      // If we fetched all configs, filter by product_id client-side
      if (!useProductIdFilter && configsData && configsData.length > 0) {
        const beforeFilter = configsData.length;
        configsData = configsData.filter(config => {
          if (!config) return false;
          const configProductId = config.product_id || config.productId || config.product?.id;
          const productId = currentProduct.id || currentProduct?.id;
          const matches = configProductId == productId || configProductId === parseInt(productId) || String(configProductId) === String(productId);
          return matches;
        });
        console.log(`🔍 Filtered from ${beforeFilter} to ${configsData.length} configs for product ${currentProduct.id}`);
      }

      // Validate and set data
      if (Array.isArray(configsData)) {
        console.log(`✅ Successfully extracted ${configsData.length} astigmatism configs:`, configsData);
        setAstigmatismConfigs(configsData);

        if (configsData.length === 0) {
          console.log('ℹ️ No astigmatism configs found for this product');
        }
      } else {
        console.warn('⚠️ Extracted data is not an array:', configsData);
        setAstigmatismConfigs([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch astigmatism configs:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      }

      // Handle different error cases
      if (!error.response) {
        toast.error('Cannot connect to server. Check if backend is running.');
      } else if (error.response.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response.status === 404) {
        // 404 might be acceptable if no configs exist yet
        console.log('ℹ️ No astigmatism configs endpoint or no data found (404)');
        setAstigmatismConfigs([]);
      } else if (error.response.status === 403) {
        toast.error('Access denied. You may not have permission to access this resource.');
        setAstigmatismConfigs([]);
      } else if (error.response.status !== 400) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to load astigmatism configurations';
        toast.error(errorMessage);
        setAstigmatismConfigs([]);
      } else {
        setAstigmatismConfigs([]);
      }
    } finally {
      setLoadingAstigmatism(false);
    }
  };

  // Handle configuration modals
  const handleSphericalAdd = () => {
    setSelectedSphericalConfig(null);
    setSphericalModalOpen(true);
  };

  const handleSphericalEdit = (config) => {
    setSelectedSphericalConfig(config);
    setSphericalModalOpen(true);
  };

  const handleSphericalDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this spherical configuration?')) {
      return;
    }
    try {
      await api.delete(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.SPHERICAL.DELETE(id));
      toast.success('Spherical configuration deleted');
      fetchSphericalConfigs();
    } catch (error) {
      console.error('Failed to delete spherical config:', error);
      toast.error(error.response?.data?.message || 'Failed to delete configuration');
    }
  };

  const handleAstigmatismAdd = () => {
    setSelectedAstigmatismConfig(null);
    setAstigmatismModalOpen(true);
  };

  const handleAstigmatismEdit = (config) => {
    setSelectedAstigmatismConfig(config);
    setAstigmatismModalOpen(true);
  };

  const handleAstigmatismDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this astigmatism configuration?')) {
      return;
    }
    try {
      await api.delete(API_ROUTES.ADMIN.CONTACT_LENS_FORMS.ASTIGMATISM.DELETE(id));
      toast.success('Astigmatism configuration deleted');
      fetchAstigmatismConfigs();
    } catch (error) {
      console.error('Failed to delete astigmatism config:', error);
      toast.error(error.response?.data?.message || 'Failed to delete configuration');
    }
  };

  // Generic table component for lens management items
  const LensManagementTable = ({ title, data, loading, onAdd, onEdit, onDelete, columns, getRowData }) => {
    // Debug logging
    React.useEffect(() => {
      if (!loading && data) {
        console.log(`📋 ${title} table - Data length: ${data.length}`, data);
      }
    }, [title, data, loading]);

    if (loading) {
      return <div className="text-center py-4 text-gray-500">Loading {title}...</div>;
    }

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-md font-semibold text-gray-800">{title}</h4>
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm"
          >
            <FiPlus className="w-3 h-3" />
            Add
          </button>
        </div>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {col}
                  </th>
                ))}
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-3 py-4 text-center text-xs text-gray-500">
                    No {title.toLowerCase()} found
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const rowData = getRowData(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {rowData.map((cell, idx) => (
                        <td key={idx} className="px-3 py-2 text-xs text-gray-700">
                          {cell}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <FiEdit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200/50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
              {product ? t('editProduct') : t('addProduct')}
            </h2>
            {product && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full border border-blue-200">
                  {product.name}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full border border-gray-200">
                  ID: {product.id}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-all duration-200"
              aria-label="Close"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white px-6 flex gap-1 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col" style={{ maxHeight: 'calc(90vh - 200px)' }} noValidate>
          <div className="p-6 space-y-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('brand') || 'Brand'}
                    </label>
                    <select
                      name="brand_id"
                      value={formData.brand_id}
                      onChange={handleChange}
                      className="input-modern"
                    >
                      <option value="">Select Brand</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('model') || 'Model'}
                    </label>
                    <input
                      type="text"
                      name="model_name"
                      value={formData.model_name}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="e.g., RX5228"
                    />
                  </div>
                </div>

                {/* SKU Generation Fields - Dynamic based on product type */}
                {(formData.product_type === 'prescription_glasses' || formData.product_type === 'eyeglasses' || formData.product_type === 'sunglasses' || formData.product_type === 'frame') ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Lens Width (Caliber) <span className="text-xs text-gray-500">(for SKU)</span>
                        </label>
                        <input
                          type="text"
                          name="lens_width"
                          value={formData.lens_width}
                          onChange={handleChange}
                          className="input-modern"
                          placeholder="e.g., 54"
                        />
                      </div>

                      {(formData.product_type === 'prescription_glasses' || formData.product_type === 'eyeglasses') ? (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Bridge Width <span className="text-xs text-gray-500">(for SKU)</span>
                          </label>
                          <input
                            type="text"
                            name="bridge_width"
                            value={formData.bridge_width}
                            onChange={handleChange}
                            className="input-modern"
                            placeholder="e.g., 17"
                          />
                        </div>
                      ) : formData.product_type === 'sunglasses' ? (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Lens Material <span className="text-xs text-gray-500">(for SKU)</span>
                          </label>
                          <input
                            type="text"
                            name="lens_material"
                            value={formData.lens_material}
                            onChange={handleChange}
                            className="input-modern"
                            placeholder="e.g., POLARIZED"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Bridge Width <span className="text-xs text-gray-500">(optional)</span>
                          </label>
                          <input
                            type="text"
                            name="bridge_width"
                            value={formData.bridge_width}
                            onChange={handleChange}
                            className="input-modern"
                            placeholder="e.g., 17"
                          />
                        </div>
                      )}
                    </div>
                  </>
                ) : formData.product_type === 'contact_lenses' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Packaging <span className="text-xs text-gray-500">(for SKU)</span>
                      </label>
                      <input
                        type="text"
                        name="packaging"
                        value={formData.packaging}
                        onChange={handleChange}
                        className="input-modern"
                        placeholder="e.g., 6PK, 30PK"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Base Curve <span className="text-xs text-gray-500">(for SKU)</span>
                      </label>
                      <input
                        type="text"
                        name="base_curve"
                        value={formData.base_curve}
                        onChange={handleChange}
                        className="input-modern"
                        placeholder="e.g., 8.6"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Diameter <span className="text-xs text-gray-500">(for SKU)</span>
                      </label>
                      <input
                        type="text"
                        name="diameter"
                        value={formData.diameter}
                        onChange={handleChange}
                        className="input-modern"
                        placeholder="e.g., 14.2"
                      />
                    </div>
                    <div></div> {/* Empty div for grid alignment */}
                  </div>
                ) : formData.product_type === 'solution' || formData.product_type === 'eye_hygiene' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Volume <span className="text-xs text-gray-500">(for SKU)</span>
                      </label>
                      <input
                        type="text"
                        name="volume"
                        value={formData.volume}
                        onChange={(e) => {
                          handleChange(e);
                          const value = e.target.value;
                          
                          // Auto-change image when volume changes for eye hygiene products
                          if (value && (formData.product_type === 'eye_hygiene' || formData.product_type === 'solution') && imagesWithColors.length > 0) {
                            // Find image that matches the volume (case-insensitive)
                            const volumeImage = imagesWithColors.find(img => 
                              img.hexCode && (
                                img.hexCode.toLowerCase().includes(value.toLowerCase()) ||
                                value.toLowerCase().includes(img.hexCode.toLowerCase())
                              )
                            );
                            
                            if (volumeImage) {
                              // Update the main image preview to show the volume-specific image
                              setImagePreviews([volumeImage.preview, ...imagePreviews.filter(preview => preview !== volumeImage.preview)]);
                              toast.success(`Image updated for ${value} variant`);
                            } else {
                              // Try to find image by volume mapping to common colors
                              const volumeColorMap = {
                                '100ml': '#FF6B6B',
                                '200ml': '#4ECDC4', 
                                '300ml': '#45B7D1',
                                '355ml': '#96CEB4',
                                '500ml': '#FFEAA7',
                                '750ml': '#DDA0DD',
                                '1000ml': '#98D8C8'
                              };
                              
                              const mappedColor = volumeColorMap[value.toLowerCase().replace(/\s+/g, '')];
                              if (mappedColor) {
                                const mappedImage = imagesWithColors.find(img => img.hexCode === mappedColor);
                                if (mappedImage) {
                                  setImagePreviews([mappedImage.preview, ...imagePreviews.filter(preview => preview !== mappedImage.preview)]);
                                  toast.success(`Image updated for ${value} variant`);
                                }
                              }
                            }
                          }
                        }}
                        className="input-modern"
                        placeholder="e.g., 355ML, 300ML"
                      />
                      {formData.volume && (formData.product_type === 'eye_hygiene' || formData.product_type === 'solution') && imagePreviews.length > 0 && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs text-green-700">
                            <span className="font-medium">Variant-specific image active:</span> Showing image for {formData.volume} variant
                          </p>
                        </div>
                      )}
                    </div>
                    <div></div> {/* Empty div for grid alignment */}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Lens Width (Caliber) <span className="text-xs text-gray-500">(for SKU)</span>
                      </label>
                      <input
                        type="text"
                        name="lens_width"
                        value={formData.lens_width}
                        onChange={handleChange}
                        className="input-modern"
                        placeholder="e.g., 54"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Bridge Width <span className="text-xs text-gray-500">(optional)</span>
                      </label>
                      <input
                        type="text"
                        name="bridge_width"
                        value={formData.bridge_width}
                        onChange={handleChange}
                        className="input-modern"
                        placeholder="e.g., 17"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('productName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-modern"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('slug')}
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="product-slug"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleChange}
                        className="input-modern flex-1"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const generatedSKU = generateSKU();
                          if (generatedSKU) {
                            setFormData(prev => ({ ...prev, sku: generatedSKU }));
                            toast.success('SKU generated successfully!');
                          }
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium whitespace-nowrap"
                        title="Auto-generate SKU based on product type"
                      >
                        Auto Generate
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.product_type === 'sunglasses' 
                        ? 'Format: Brand-Model-Caliber-Color-Lens Material (e.g., RB-RX5228-54-2000-POLARIZED)'
                        : formData.product_type === 'prescription_glasses' || formData.product_type === 'eyeglasses'
                        ? 'Format: Brand*Model*Caliber*Bridge*Color (e.g., RB*RX5228*54*17*2000)'
                        : formData.product_type === 'contact_lenses'
                        ? 'Format: Brand-Model-Packaging-BaseCurve-Diameter (e.g., ACUVUE-OASYS-6PK-8.6-14.2)'
                        : formData.product_type === 'solution' || formData.product_type === 'eye_hygiene'
                        ? 'Format: Brand-Model-Volume (e.g., OPTI-FREE-EXPRESS-355ML)'
                        : 'Format: Brand*Model*Caliber*Color (e.g., RB*RX5228*54*2000)'
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('price')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      step="0.01"
                      className="input-modern"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('compareAtPrice')}
                    </label>
                    <input
                      type="number"
                      name="compare_at_price"
                      value={formData.compare_at_price}
                      onChange={handleChange}
                      step="0.01"
                      className="input-modern"
                      placeholder={t('originalPrice')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('costPrice')}
                    </label>
                    <input
                      type="number"
                      name="cost_price"
                      value={formData.cost_price}
                      onChange={handleChange}
                      step="0.01"
                      className="input-modern"
                      placeholder={t('wholesaleCost')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('shortDescription')}
                  </label>
                  <input
                    type="text"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder={t('briefProductDescription')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('description')}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="input-modern resize-none"
                    placeholder="Enter product description..."
                  />
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('category')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        className="input-modern"
                        required
                      >
                        <option value="">{t('selectCategory')}</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('subCategories')}
                      </label>
                      <select
                        name="sub_category_id"
                        value={formData.sub_category_id}
                        onChange={handleChange}
                        disabled={!formData.category_id}
                        className="input-modern disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">{formData.category_id ? t('selectCategory').replace('Category', 'SubCategory') : t('selectCategory') + ' First'}</option>
                        {subCategories.map((subCat) => (
                          <option key={subCat.id} value={subCat.id}>
                            {subCat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sub-SubCategory Selection */}
                  {formData.sub_category_id && (
                    <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('parentSubCategory')} <span className="text-gray-500 text-xs font-normal">({t('optional')} - {t('nestedSubCategoryNote')})</span>
                      </label>
                      {nestedSubCategories.length > 0 ? (
                        <>
                          <select
                            name="parent_subcategory_id"
                            value={formData.parent_subcategory_id}
                            onChange={handleChange}
                            className="input-modern border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="">{t('noneTopLevel')}</option>
                            {nestedSubCategories.map((nestedSubCat) => (
                              <option key={nestedSubCat.id} value={nestedSubCat.id}>
                                {nestedSubCat.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-blue-600 mt-2 flex items-center">
                            <span className="mr-1">ℹ️</span>
                            Select a sub-subcategory if this product belongs to a nested subcategory under "{subCategories.find(sc => sc.id === parseInt(formData.sub_category_id))?.name || 'selected subcategory'}"
                          </p>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500 italic py-2 bg-white rounded px-3 border border-gray-200">
                          No sub-subcategories available for "{subCategories.find(sc => sc.id === parseInt(formData.sub_category_id))?.name || 'selected subcategory'}". This product will use the parent SubCategory.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="product_type"
                    value={formData.product_type}
                    onChange={handleChange}
                    className="input-modern"
                    required
                  >
                    <option value="">Select Product Type</option>
                    <option value="frame">Frame (Eyeglasses)</option>
                    <option value="sunglasses">Sunglasses</option>
                    <option value="contact_lens">Contact Lens</option>
                    <option value="eye_hygiene">Eye Hygiene</option>
                    <option value="lens">Lens</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      name="stock_quantity"
                      value={formData.stock_quantity}
                      onChange={handleChange}
                      min="0"
                      className="input-modern"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stock Status
                    </label>
                    <select
                      name="stock_status"
                      value={formData.stock_status}
                      onChange={handleChange}
                      className="input-modern"
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="backorder">Backorder</option>
                      <option value="preorder">Preorder</option>
                    </select>
                  </div>
                </div>


                {/* Frame/Lens related fields - Only show for frames, sunglasses, opty-kids */}
                {!isEyeHygiene && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-200 pt-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Frame Shape
                        </label>
                        <select
                          name="frame_shape"
                          value={formData.frame_shape}
                          onChange={handleChange}
                          className="input-modern"
                        >
                          <option value="">Select Frame Shape</option>
                          {frameShapes.map((shape) => (
                            <option key={shape} value={shape}>
                              {shape.charAt(0).toUpperCase() + shape.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Frame Material
                        </label>
                        <select
                          name="frame_material"
                          value={Array.isArray(formData.frame_material) ? formData.frame_material[0] : formData.frame_material}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData({ ...formData, frame_material: value ? [value] : [] });
                          }}
                          className="input-modern"
                        >
                          <option value="">Select Frame Material</option>
                          {frameMaterials.map((material) => (
                            <option key={material} value={material}>
                              {material.charAt(0).toUpperCase() + material.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Frame Color
                        </label>
                        <input
                          type="text"
                          name="frame_color"
                          value={formData.frame_color}
                          onChange={handleChange}
                          className="input-modern"
                          placeholder="e.g., Black, Brown, Blue"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="input-modern"
                        >
                          <option value="">Select Gender</option>
                          {genders.map((gender) => (
                            <option key={gender} value={gender}>
                              {gender.charAt(0).toUpperCase() + gender.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Lens Type
                      </label>
                      <input
                        type="text"
                        name="lens_type"
                        value={formData.lens_type}
                        onChange={handleChange}
                        className="input-modern"
                        placeholder="Enter any lens type"
                      />
                    </div>
                  </>
                )}

                {/* Status Checkboxes */}
                <div className="flex items-center space-x-6 border-t border-gray-200 pt-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">{t('isFeatured')}</span>
                  </label>
                </div>
              </>
            )}

            {/* MM Calibers Tab */}
            {activeTab === 'mm-calibers' && (
              <MMCaliberManager
                productId={getValidProductId()}
                productType={formData.product_type}
                onCalibersUpdate={(calibers) => {
                  // Update form data with calibers if needed
                  console.log('Calibers updated:', calibers);
                }}
              />
            )}

            {/* Lens Management Tab */}
            {activeTab === 'lens-management' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>ℹ️ Note:</strong> Lens Management configurations are global settings that apply to all frames, sunglasses, and opty-kids products.
                  </p>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                  {/* Frame Sizes Table */}
                  <LensManagementTable
                    title="Frame Sizes"
                    data={frameSizes}
                    loading={loadingLensManagement.all}
                    onAdd={() => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedFrameSize(null);
                      setFrameSizeModalOpen(true);
                    }}
                    onEdit={(item) => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedFrameSize(item);
                      setFrameSizeModalOpen(true);
                    }}
                    onDelete={async (id) => {
                      if (window.confirm('Delete this frame size?')) {
                        try {
                          await api.delete(API_ROUTES.ADMIN.FRAME_SIZES.DELETE(id));
                          toast.success('Frame size deleted');
                          fetchLensManagementData();
                        } catch (error) {
                          toast.error('Failed to delete');
                        }
                      }
                    }}
                    columns={['ID', 'Name', 'Slug', 'Width', 'Bridge', 'Temple', 'Status']}
                    getRowData={(item) => [
                      item.id,
                      item.product?.name || '',
                      item.product?.slug || '',
                      item.lens_width ? `${item.lens_width} mm` : '',
                      item.bridge_width ? `${item.bridge_width} mm` : '',
                      item.temple_length ? `${item.temple_length} mm` : '',
                      <span key="status" className={`px-2 py-1 rounded text-xs ${item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    ]}
                  />
                  {frameSizeModalOpen && (
                    <FrameSizeModal
                      frameSize={selectedFrameSize}
                      onClose={handleLensManagementClose('frameSize')}
                    />
                  )}

                  {/* Lens Types Table */}
                  <LensManagementTable
                    title="Lens Types"
                    data={lensTypesList}
                    loading={loadingLensManagement.all}
                    onAdd={() => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedLensType(null);
                      setLensTypeModalOpen(true);
                    }}
                    onEdit={(item) => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedLensType(item);
                      setLensTypeModalOpen(true);
                    }}
                    onDelete={async (id) => {
                      if (window.confirm('Delete this lens type?')) {
                        try {
                          await api.delete(API_ROUTES.ADMIN.LENS_TYPES.DELETE(id));
                          toast.success('Lens type deleted');
                          fetchLensManagementData();
                        } catch (error) {
                          toast.error('Failed to delete');
                        }
                      }
                    }}
                    columns={['ID', 'Name', 'Slug', 'Index', 'Thickness Factor', 'Price Adjustment', 'Status']}
                    getRowData={(item) => [
                      item.id,
                      item.name || 'N/A',
                      item.slug || 'N/A',
                      item.index || 'N/A',
                      item.thickness_factor || 'N/A',
                      item.price_adjustment || 'N/A',
                      <span key="status" className={`px-2 py-1 rounded text-xs ${item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    ]}
                  />
                  {lensTypeModalOpen && (
                    <LensTypeModal
                      lensType={selectedLensType}
                      onClose={handleLensManagementClose('lensType')}
                    />
                  )}

                  {/* Lens Options Table */}
                  <LensManagementTable
                    title="Lens Options"
                    data={lensOptions}
                    loading={loadingLensManagement.all}
                    onAdd={() => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedLensOption(null);
                      setLensOptionModalOpen(true);
                    }}
                    onEdit={(item) => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedLensOption(item);
                      setLensOptionModalOpen(true);
                    }}
                    onDelete={async (id) => {
                      if (window.confirm('Delete this lens option?')) {
                        try {
                          await api.delete(API_ROUTES.ADMIN.LENS_OPTIONS.DELETE(id));
                          toast.success('Lens option deleted');
                          fetchLensManagementData();
                        } catch (error) {
                          toast.error('Failed to delete');
                        }
                      }
                    }}
                    columns={['ID', 'Name', 'Slug', 'Type', 'Base Price', 'Status']}
                    getRowData={(item) => [
                      item.id,
                      item.name || 'N/A',
                      item.slug || 'N/A',
                      item.type || 'N/A',
                      item.base_price ? `$${item.base_price}` : 'N/A',
                      <span key="status" className={`px-2 py-1 rounded text-xs ${item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    ]}
                  />
                  {lensOptionModalOpen && (
                    <LensOptionModal
                      lensOption={selectedLensOption}
                      onClose={handleLensManagementClose('lensOption')}
                    />
                  )}

                  {/* Prescription Sun Lenses Table */}
                  <LensManagementTable
                    title="Prescription Sun Lenses"
                    data={prescriptionSunLenses}
                    loading={loadingLensManagement.all}
                    onAdd={() => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedPrescriptionSunLens(null);
                      setPrescriptionSunLensModalOpen(true);
                    }}
                    onEdit={(item) => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedPrescriptionSunLens(item);
                      setPrescriptionSunLensModalOpen(true);
                    }}
                    onDelete={async (id) => {
                      if (window.confirm('Delete this prescription sun lens?')) {
                        try {
                          await api.delete(API_ROUTES.ADMIN.PRESCRIPTION_SUN_LENSES.DELETE(id));
                          toast.success('Prescription sun lens deleted');
                          fetchLensManagementData();
                        } catch (error) {
                          toast.error('Failed to delete');
                        }
                      }
                    }}
                    columns={['ID', 'Name', 'Slug', 'Type', 'Base Price', 'Status']}
                    getRowData={(item) => [
                      item.id,
                      item.name || 'N/A',
                      item.slug || 'N/A',
                      item.type || 'N/A',
                      item.base_price ? `$${item.base_price}` : 'N/A',
                      <span key="status" className={`px-2 py-1 rounded text-xs ${item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    ]}
                  />
                  {prescriptionSunLensModalOpen && (
                    <PrescriptionSunLensModal
                      lens={selectedPrescriptionSunLens}
                      onClose={handleLensManagementClose('prescriptionSunLens')}
                    />
                  )}

                  {/* Photochromic Lenses Table */}
                  <LensManagementTable
                    title="Photochromic Lenses"
                    data={photochromicLenses}
                    loading={loadingLensManagement.all}
                    onAdd={() => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedPhotochromicLens(null);
                      setPhotochromicLensModalOpen(true);
                    }}
                    onEdit={(item) => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedPhotochromicLens(item);
                      setPhotochromicLensModalOpen(true);
                    }}
                    onDelete={async (id) => {
                      if (window.confirm('Delete this photochromic lens?')) {
                        try {
                          await api.delete(API_ROUTES.ADMIN.PHOTOCHROMIC_LENSES.DELETE(id));
                          toast.success('Photochromic lens deleted');
                          fetchLensManagementData();
                        } catch (error) {
                          toast.error('Failed to delete');
                        }
                      }
                    }}
                    columns={['ID', 'Name', 'Slug', 'Base Price', 'Status']}
                    getRowData={(item) => [
                      item.id,
                      item.name || 'N/A',
                      item.slug || 'N/A',
                      item.base_price ? `$${item.base_price}` : 'N/A',
                      <span key="status" className={`px-2 py-1 rounded text-xs ${item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    ]}
                  />
                  {photochromicLensModalOpen && (
                    <PhotochromicLensModal
                      lens={selectedPhotochromicLens}
                      onClose={handleLensManagementClose('photochromicLens')}
                    />
                  )}

                  {/* Lens Coatings Table */}
                  <LensManagementTable
                    title="Lens Coatings"
                    data={lensCoatings}
                    loading={loadingLensManagement.all}
                    onAdd={() => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedLensCoating(null);
                      setLensCoatingModalOpen(true);
                    }}
                    onEdit={(item) => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedLensCoating(item);
                      setLensCoatingModalOpen(true);
                    }}
                    onDelete={async (id) => {
                      if (window.confirm('Delete this lens coating?')) {
                        try {
                          await api.delete(API_ROUTES.ADMIN.LENS_COATINGS.DELETE(id));
                          toast.success('Lens coating deleted');
                          fetchLensManagementData();
                        } catch (error) {
                          toast.error('Failed to delete');
                        }
                      }
                    }}
                    columns={['ID', 'Name', 'Slug', 'Base Price', 'Status']}
                    getRowData={(item) => [
                      item.id,
                      item.name || 'N/A',
                      item.slug || 'N/A',
                      item.base_price ? `$${item.base_price}` : 'N/A',
                      <span key="status" className={`px-2 py-1 rounded text-xs ${item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    ]}
                  />
                  {lensCoatingModalOpen && (
                    <LensCoatingModal
                      lensCoating={selectedLensCoating}
                      onClose={handleLensManagementClose('lensCoating')}
                    />
                  )}

                  {/* Lens Colors Table */}
                  <LensManagementTable
                    title="Lens Colors"
                    data={lensColors}
                    loading={loadingLensManagement.all}
                    onAdd={() => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedLensColor(null);
                      setLensColorModalOpen(true);
                    }}
                    onEdit={(item) => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedLensColor(item);
                      setLensColorModalOpen(true);
                    }}
                    onDelete={async (id) => {
                      if (window.confirm('Delete this lens color?')) {
                        try {
                          await api.delete(API_ROUTES.ADMIN.LENS_COLORS.DELETE(id));
                          toast.success('Lens color deleted');
                          fetchLensManagementData();
                        } catch (error) {
                          toast.error('Failed to delete');
                        }
                      }
                    }}
                    columns={['ID', 'Name', 'Slug', 'Hex Code', 'Status']}
                    getRowData={(item) => [
                      item.id,
                      item.name || 'N/A',
                      item.slug || 'N/A',
                      item.hex_code ? (
                        <div key="hex" className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border" style={{ backgroundColor: item.hex_code }}></div>
                          <span>{item.hex_code}</span>
                        </div>
                      ) : 'N/A',
                      <span key="status" className={`px-2 py-1 rounded text-xs ${item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    ]}
                  />
                  {lensColorModalOpen && (
                    <LensColorModal
                      lensColor={selectedLensColor}
                      onClose={handleLensManagementClose('lensColor')}
                    />
                  )}

                  {/* Lens Finishes Table */}
                  <LensManagementTable
                    title="Lens Finishes"
                    data={lensFinishes}
                    loading={loadingLensManagement.all}
                    onAdd={() => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedLensFinish(null);
                      setLensFinishModalOpen(true);
                    }}
                    onEdit={(item) => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedLensFinish(item);
                      setLensFinishModalOpen(true);
                    }}
                    onDelete={async (id) => {
                      if (window.confirm('Delete this lens finish?')) {
                        try {
                          await api.delete(API_ROUTES.ADMIN.LENS_FINISHES.DELETE(id));
                          toast.success('Lens finish deleted');
                          fetchLensManagementData();
                        } catch (error) {
                          toast.error('Failed to delete');
                        }
                      }
                    }}
                    columns={['ID', 'Name', 'Slug', 'Base Price', 'Status']}
                    getRowData={(item) => [
                      item.id,
                      item.name || 'N/A',
                      item.slug || 'N/A',
                      item.base_price ? `$${item.base_price}` : 'N/A',
                      <span key="status" className={`px-2 py-1 rounded text-xs ${item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    ]}
                  />
                  {lensFinishModalOpen && (
                    <LensFinishModal
                      lensFinish={selectedLensFinish}
                      onClose={handleLensManagementClose('lensFinish')}
                    />
                  )}

                  {/* Lens Treatments Table */}
                  <LensManagementTable
                    title="Lens Treatments"
                    data={lensTreatments}
                    loading={loadingLensManagement.all}
                    onAdd={() => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedLensTreatment(null);
                      setLensTreatmentModalOpen(true);
                    }}
                    onEdit={(item) => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedLensTreatment(item);
                      setLensTreatmentModalOpen(true);
                    }}
                    onDelete={async (id) => {
                      if (window.confirm('Delete this lens treatment?')) {
                        try {
                          await api.delete(API_ROUTES.ADMIN.LENS_TREATMENTS.DELETE(id));
                          toast.success('Lens treatment deleted');
                          fetchLensManagementData();
                        } catch (error) {
                          toast.error('Failed to delete');
                        }
                      }
                    }}
                    columns={['ID', 'Name', 'Slug', 'Base Price', 'Status']}
                    getRowData={(item) => [
                      item.id,
                      item.name || 'N/A',
                      item.slug || 'N/A',
                      item.base_price ? `$${item.base_price}` : 'N/A',
                      <span key="status" className={`px-2 py-1 rounded text-xs ${item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    ]}
                  />
                  {lensTreatmentModalOpen && (
                    <LensTreatmentModal
                      lensTreatment={selectedLensTreatment}
                      onClose={handleLensManagementClose('lensTreatment')}
                    />
                  )}

                  {/* Thickness Materials Table */}
                  <LensManagementTable
                    title="Thickness Materials"
                    data={thicknessMaterials}
                    loading={loadingLensManagement.all}
                    onAdd={() => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedThicknessMaterial(null);
                      setThicknessMaterialModalOpen(true);
                    }}
                    onEdit={(item) => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedThicknessMaterial(item);
                      setThicknessMaterialModalOpen(true);
                    }}
                    onDelete={async (id) => {
                      if (window.confirm('Delete this thickness material?')) {
                        try {
                          await api.delete(API_ROUTES.ADMIN.LENS_THICKNESS_MATERIALS.DELETE(id));
                          toast.success('Thickness material deleted');
                          fetchLensManagementData();
                        } catch (error) {
                          toast.error('Failed to delete');
                        }
                      }
                    }}
                    columns={['ID', 'Name', 'Slug', 'Status']}
                    getRowData={(item) => [
                      item.id,
                      item.name || 'N/A',
                      item.slug || 'N/A',
                      <span key="status" className={`px-2 py-1 rounded text-xs ${item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    ]}
                  />
                  {thicknessMaterialModalOpen && (
                    <LensThicknessMaterialModal
                      material={selectedThicknessMaterial}
                      onClose={handleLensManagementClose('thicknessMaterial')}
                    />
                  )}

                  {/* Thickness Options Table */}
                  <LensManagementTable
                    title="Thickness Options"
                    data={thicknessOptions}
                    loading={loadingLensManagement.all}
                    onAdd={() => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedThicknessOption(null);
                      setThicknessOptionModalOpen(true);
                    }}
                    onEdit={(item) => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedThicknessOption(item);
                      setThicknessOptionModalOpen(true);
                    }}
                    onDelete={async (id) => {
                      if (window.confirm('Delete this thickness option?')) {
                        try {
                          await api.delete(API_ROUTES.ADMIN.LENS_THICKNESS_OPTIONS.DELETE(id));
                          toast.success('Thickness option deleted');
                          fetchLensManagementData();
                        } catch (error) {
                          toast.error('Failed to delete');
                        }
                      }
                    }}
                    columns={['ID', 'Name', 'Slug', 'Status']}
                    getRowData={(item) => [
                      item.id,
                      item.name || 'N/A',
                      item.slug || 'N/A',
                      <span key="status" className={`px-2 py-1 rounded text-xs ${item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    ]}
                  />
                  {thicknessOptionModalOpen && (
                    <LensThicknessOptionModal
                      option={selectedThicknessOption}
                      onClose={handleLensManagementClose('thicknessOption')}
                    />
                  )}

                  {/* Prescription Lens Types Table */}
                  <LensManagementTable
                    title="Prescription Lens Types"
                    data={prescriptionLensTypes}
                    loading={loadingLensManagement.all}
                    onAdd={() => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedPrescriptionLensType(null);
                      setPrescriptionLensTypeModalOpen(true);
                    }}
                    onEdit={(item) => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedPrescriptionLensType(item);
                      setPrescriptionLensTypeModalOpen(true);
                    }}
                    onDelete={async (id) => {
                      if (window.confirm('Delete this prescription lens type?')) {
                        try {
                          await api.delete(API_ROUTES.ADMIN.PRESCRIPTION_LENS_TYPES.DELETE(id));
                          toast.success('Prescription lens type deleted');
                          fetchLensManagementData();
                        } catch (error) {
                          toast.error('Failed to delete');
                        }
                      }
                    }}
                    columns={['ID', 'Name', 'Slug', 'Status']}
                    getRowData={(item) => [
                      item.id,
                      item.name || 'N/A',
                      item.slug || 'N/A',
                      <span key="status" className={`px-2 py-1 rounded text-xs ${item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    ]}
                  />
                  {prescriptionLensTypeModalOpen && (
                    <PrescriptionLensTypeModal
                      lensType={selectedPrescriptionLensType}
                      onClose={handleLensManagementClose('prescriptionLensType')}
                    />
                  )}

                  {/* Prescription Form Dropdown Values Table */}
                  <LensManagementTable
                    title="Prescription Form Dropdown Values"
                    data={prescriptionDropdownValues}
                    loading={loadingLensManagement.all}
                    onAdd={() => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedPrescriptionDropdown(null);
                      setPrescriptionDropdownModalOpen(true);
                    }}
                    onEdit={(item) => {
                      setActiveTab('lens-management'); // Ensure Lens Management tab is active
                      setSelectedPrescriptionDropdown(item);
                      setPrescriptionDropdownModalOpen(true);
                    }}
                    onDelete={async (id) => {
                      if (window.confirm('Delete this dropdown value?')) {
                        try {
                          await api.delete(API_ROUTES.ADMIN.PRESCRIPTION_FORMS.DROPDOWN_VALUES.DELETE(id));
                          toast.success('Dropdown value deleted');
                          fetchLensManagementData();
                        } catch (error) {
                          toast.error('Failed to delete');
                        }
                      }
                    }}
                    columns={['ID', 'Field Type', 'Value', 'Label', 'Status']}
                    getRowData={(item) => [
                      item.id,
                      <span key="field" className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {item.field_type || item.fieldType || 'N/A'}
                      </span>,
                      item.value || 'N/A',
                      item.label || item.value || 'N/A',
                      <span key="status" className={`px-2 py-1 rounded text-xs ${item.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    ]}
                  />
                  {prescriptionDropdownModalOpen && (
                    <PrescriptionFormDropdownValueModal
                      value={selectedPrescriptionDropdown}
                      onClose={handleLensManagementClose('prescriptionDropdown')}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Eye Hygiene Variants Tab */}
            {activeTab === 'eye-hygiene-variants' && (
              <EyeHygieneVariantManager
                productId={getValidProductId()}
                productType={formData.product_type}
                onVariantsUpdate={(variants) => {
                  // Update form data with variants if needed
                  console.log('Eye hygiene variants updated:', variants);
                }}
              />
            )}

            {/* Size/Volume Variants Tab - Eye Hygiene Products */}
            {activeTab === 'variants' && isEyeHygiene && (
              <SizeVolumeVariantManager
                productId={getValidProductId()}
                productType={formData.product_type}
                onVariantsUpdate={(variants) => {
                  // Optional: Handle variants update if needed
                  console.log('Size/Volume variants updated:', variants);
                }}
                onAddVariant={() => {
                  setEditingVariant(null);
                  setVariantModalOpen(true);
                }}
                onEditVariant={(variant) => {
                  console.log('🔧 ProductModal: onEditVariant called with variant:', variant);
                  console.log('🔧 ProductModal: Setting editingVariant and opening modal');
                  setEditingVariant(variant);
                  setVariantModalOpen(true);
                  console.log('🔧 ProductModal: variantModalOpen set to true, editingVariant set');
                }}
              />
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <>
                {/* Multiple Images Upload - Enhanced Design */}
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('productImages')} <span className="text-indigo-600 font-bold">({t('multipleSelectionSupported')})</span>
                  </label>

                  <div className="space-y-4">
                    {/* Display existing/preview images */}
                    {imagePreviews.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-700">
                            {t('selectedImages')} ({imagePreviews.length})
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setImageFiles([]);
                              setImagePreviews([]);
                              setExistingImages([]); // Clear existing images tracking - will send images: "[]" to delete all
                              toast.success(t('clearAll'));
                            }}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            {t('clearAll')}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {imagePreviews.map((preview, index) => {
                            const isExisting = typeof preview === 'string' && preview.startsWith('https://') && existingImages.includes(preview);
                            return (
                              <div key={index} className="relative group">
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className={`w-full h-32 object-cover rounded-xl border-2 shadow-md hover:border-indigo-400 transition-all ${isExisting ? 'border-blue-300' : 'border-gray-200'
                                    }`}
                                  onError={(e) => {
                                    console.error('Image preview error:', e);
                                    toast.error(`Failed to display image ${index + 1}`);
                                    // Remove failed image
                                    removeImage(index);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100 z-10"
                                  title="Remove image"
                                >
                                  <FiX className="w-4 h-4" />
                                </button>
                                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs text-center py-1.5 rounded-b-xl ${isExisting ? 'bg-blue-600/80' : ''
                                  }`}>
                                  {isExisting ? 'Existing' : 'New'} - Image {index + 1}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Upload area - Enhanced */}
                    <label
                      htmlFor="product-image-input"
                      className="flex flex-col items-center justify-center w-full min-h-[180px] border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-200 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 group"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                          <FiUpload className="w-8 h-8 text-indigo-600" />
                        </div>
                        <p className="text-base font-semibold text-gray-700 mb-1">
                          {imagePreviews.length > 0 ? t('addMoreImages') : t('clickToSelectMultipleImages')}
                        </p>
                        <p className="text-sm text-gray-600 text-center">
                          {t('youCanSelectMultipleImages')}
                        </p>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          {t('supportedFormats')}
                        </p>
                        {imagePreviews.length > 0 && (
                          <div className="mt-3 px-4 py-2 bg-indigo-100 rounded-lg">
                            <p className="text-sm text-indigo-700 font-semibold">
                              ✓ {imagePreviews.length} image{imagePreviews.length !== 1 ? 's' : ''} selected
                            </p>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                        id="product-image-input"
                      />
                    </label>
                    <p className="text-xs text-gray-500 text-center">
                      💡 Tip: Hold Ctrl (Windows) or Cmd (Mac) to select multiple images, or drag and drop files
                    </p>
                  </div>
                </div>

                {/* 3D Model Upload - Per Postman Collection - Hide for Eye Hygiene */}
                {!isEyeHygiene && (
                  <div className="border-t border-gray-200 pt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t('model3D')} <span className="text-gray-500 text-xs font-normal">({t('optional')})</span>
                    </label>
                    <div className="space-y-4">
                      {/* Display existing/preview 3D model */}
                      {model3DPreview && (
                        <div className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700">
                              {t('model3D')} {t('selected')}
                            </p>
                            <button
                              type="button"
                              onClick={removeModel3D}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="bg-gray-100 rounded-xl p-4 border-2 border-gray-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <span className="text-2xl">📦</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">
                                  {model3DFile ? model3DFile.name : '3D Model'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {model3DFile ? `${(model3DFile.size / 1024 / 1024).toFixed(2)} MB` : 'Existing model'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Upload area */}
                      <label
                        htmlFor="product-3d-model-input"
                        className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-200 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 group"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                            <span className="text-2xl">📦</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">
                            {model3DPreview ? 'Replace 3D Model' : 'Click to Upload 3D Model'}
                          </p>
                          <p className="text-xs text-gray-600 text-center">
                            Supported: GLB, GLTF, OBJ, FBX, DAE
                          </p>
                          <p className="text-xs text-gray-500 mt-1 text-center">
                            Max size: 50MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept=".glb,.gltf,.obj,.fbx,.dae"
                          onChange={handleModel3DChange}
                          className="hidden"
                          id="product-3d-model-input"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Images with Color Codes - Single Upload System - Hide for Eye Hygiene */}
                {!isEyeHygiene && (
                  <div className="border-t border-gray-200 pt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t('imagesWithColorCodes')} <span className="text-gray-500 text-xs font-normal">({t('optional')})</span>
                    </label>
                    <p className="text-xs text-gray-600 mb-4">
                      Upload images and assign a hex color code to each image. Each image can be associated with a specific color variant.
                      Format: <code className="bg-gray-100 px-1 rounded">#RRGGBB</code> (e.g., #000000 for black, #FFD700 for gold)
                    </p>

                    {/* Display images with their assigned hex codes */}
                    {imagesWithColors.length > 0 && (
                      <div className="mb-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-700">
                            Images with Colors ({imagesWithColors.length})
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setImagesWithColors([]);
                              setExistingColorImages([]); // Clear existing color images tracking - will send color_images: "[]" to delete all
                              toast.success('All color images cleared');
                            }}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {imagesWithColors.map((img) => (
                            <div key={img.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="relative mb-2">
                                <img
                                  src={img.preview}
                                  alt="Product color variant"
                                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImageWithColor(img.id)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                                  title="Remove image"
                                >
                                  <FiX className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Hex Color Code
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={img.hexCode || ''}
                                      onChange={(e) => updateImageHexCode(img.id, e.target.value)}
                                      placeholder="#000000"
                                      className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                      pattern="^#[0-9A-Fa-f]{6}$"
                                    />
                                    {img.hexCode && isValidHexCode(img.hexCode) && (
                                      <div
                                        className="w-8 h-8 rounded border-2 border-gray-300 shadow-sm flex-shrink-0"
                                        style={{ backgroundColor: img.hexCode }}
                                        title={img.hexCode}
                                      />
                                    )}
                                  </div>
                                  {img.hexCode && !isValidHexCode(img.hexCode) && (
                                    <p className="text-xs text-red-600 mt-1">Invalid hex code format</p>
                                  )}
                                </div>
                                {img.hexCode && isValidHexCode(img.hexCode) && (
                                  <p className="text-xs text-gray-600">
                                    {getColorNameFromHex(img.hexCode)} ({img.hexCode})
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload area for images with colors */}
                    <label
                      htmlFor="images-with-colors-input"
                      className="flex flex-col items-center justify-center w-full min-h-[150px] border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-200 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 group"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                          <FiUpload className="w-6 h-6 text-indigo-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">
                          {imagesWithColors.length > 0 ? 'Add More Images' : 'Click to Upload Images'}
                        </p>
                        <p className="text-xs text-gray-600 text-center">
                          Upload images and assign hex color codes to each
                        </p>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Supported formats: PNG, JPG, JPEG, WEBP • Max 5MB per image
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                        id="images-with-colors-input"
                      />
                    </label>

                    {/* Quick color picker for common colors */}
                    <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-xs font-medium text-blue-700 mb-2">{t('quickColorCodes')}</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { hex: '#000000', name: 'Black' },
                          { hex: '#8B4513', name: 'Brown' },
                          { hex: '#0000FF', name: 'Blue' },
                          { hex: '#FF0000', name: 'Red' },
                          { hex: '#008000', name: 'Green' },
                          { hex: '#808080', name: 'Gray' },
                          { hex: '#FFD700', name: 'Gold' },
                          { hex: '#C0C0C0', name: 'Silver' },
                        ].map(({ hex, name }) => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => {
                              // Apply to all images without hex codes
                              setImagesWithColors(imagesWithColors.map(img =>
                                !img.hexCode ? { ...img, hexCode: hex } : img
                              ));
                              toast.success(`Applied ${name} (${hex}) to unassigned images`);
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs"
                            title={`Apply ${name} (${hex}) to unassigned images`}
                          >
                            <div
                              className="w-4 h-4 rounded border border-gray-300"
                              style={{ backgroundColor: hex }}
                            />
                            <span className="text-gray-700">{name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* General Images (without color codes) - Optional */}
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('generalProductImages')} <span className="text-gray-500 text-xs font-normal">({t('noColorCodes')})</span>
                  </label>
                  <p className="text-xs text-gray-600 mb-4">
                    Upload general product images that are not associated with specific color variants.
                  </p>
                  <div className="space-y-4">
                    {imagePreviews.length > 0 && (
                      <div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`General image ${index + 1}`}
                                className="w-full h-32 object-cover rounded-xl border-2 border-gray-200 shadow-md hover:border-indigo-400 transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100 z-10"
                                title="Remove image"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <label
                      htmlFor="general-image-input"
                      className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50/50 transition-all duration-200"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                        <FiUpload className="w-6 h-6 text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-700">
                          {imagePreviews.length > 0 ? 'Add More General Images' : 'Upload General Images'}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGeneralImageChange}
                        className="hidden"
                        id="general-image-input"
                      />
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Spherical Configurations Tab */}
            {activeTab === 'spherical' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Spherical Configurations</h3>
                  {currentProduct?.id ? (
                    <button
                      type="button"
                      onClick={handleSphericalAdd}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Configuration
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">Save the product first to add configurations</p>
                  )}
                </div>
                {loadingSpherical ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NAME</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DISPLAY NAME</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PRICE</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STATUS</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sphericalConfigs.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                              {currentProduct?.id
                                ? 'No spherical configurations found. Click "Add Configuration" to create one.'
                                : 'No spherical configurations found. Save the product first to add configurations.'}
                            </td>
                          </tr>
                        ) : (
                          sphericalConfigs.map((config) => {
                            // Handle both snake_case and camelCase field names
                            const displayName = config.display_name || config.displayName || config.name || 'N/A';
                            const price = config.price !== undefined ? config.price : '0.00';
                            const isActive = config.is_active !== undefined ? config.is_active : (config.isActive !== undefined ? config.isActive : true);

                            return (
                              <tr key={config.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{config.name || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{displayName}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">${price}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded text-xs ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSphericalEdit(config)}
                                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                                      title="Edit"
                                    >
                                      <FiEdit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSphericalDelete(config.id)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                      title="Delete"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Astigmatism Configurations Tab */}
            {activeTab === 'astigmatism' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Astigmatism Configurations</h3>
                  {currentProduct?.id ? (
                    <button
                      type="button"
                      onClick={handleAstigmatismAdd}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Configuration
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">Save the product first to add configurations</p>
                  )}
                </div>
                {loadingAstigmatism ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NAME</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DISPLAY NAME</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PRICE</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STATUS</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {astigmatismConfigs.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                              {currentProduct?.id
                                ? 'No astigmatism configurations found. Click "Add Configuration" to create one.'
                                : 'No astigmatism configurations found. Save the product first to add configurations.'}
                            </td>
                          </tr>
                        ) : (
                          astigmatismConfigs.map((config) => {
                            // Handle both snake_case and camelCase field names
                            const displayName = config.display_name || config.displayName || config.name || 'N/A';
                            const price = config.price !== undefined ? config.price : '0.00';
                            const isActive = config.is_active !== undefined ? config.is_active : (config.isActive !== undefined ? config.isActive : true);

                            return (
                              <tr key={config.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{config.name || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{displayName}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">${price}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded text-xs ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleAstigmatismEdit(config)}
                                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                                      title="Edit"
                                    >
                                      <FiEdit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAstigmatismDelete(config.id)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                      title="Delete"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="meta_title"
                    value={formData.meta_title}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="SEO title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={handleChange}
                    rows="2"
                    className="input-modern resize-none"
                    placeholder="SEO description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    name="meta_keywords"
                    value={formData.meta_keywords}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </>
            )}

            {/* Clip Tab */}
            {activeTab === 'clip' && (
              <>
                <div className="p-6">
                  <p className="text-gray-600">Clip configuration content goes here.</p>
                </div>
              </>
            )}

            {/* Auctions Tab */}
            {activeTab === 'auctions' && (
              <>
                <div className="p-6">
                  <p className="text-gray-600">Auctions configuration content goes here.</p>
                </div>
              </>
            )}

            {/* Progressive Tab */}
            {activeTab === 'progressive' && (
              <>
                <div className="p-6">
                  <p className="text-gray-600">Progressive configuration content goes here.</p>
                </div>
              </>
            )}
          </div>

          {/* Fixed Footer with Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-gray-200 bg-white flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              formNoValidate
              disabled={loading}
              className="btn-primary-modern disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('saving') : t('save') + ' ' + t('product')}
            </button>
          </div>
        </form>

        {/* Configuration Modals - Rendered outside form to avoid nested forms */}
        {sphericalModalOpen && (
          <SphericalConfigModal
            config={selectedSphericalConfig || (currentProduct?.id ? { product_id: currentProduct.id } : null)}
            onClose={(saved = false) => {
              setSphericalModalOpen(false);
              setSelectedSphericalConfig(null);
              if (saved && currentProduct?.id) {
                setTimeout(() => {
                  fetchSphericalConfigs();
                }, 100);
              }
            }}
          />
        )}
        {astigmatismModalOpen && (
          <AstigmatismConfigModal
            config={selectedAstigmatismConfig || (currentProduct?.id ? { product_id: currentProduct.id } : null)}
            onClose={(saved = false) => {
              setAstigmatismModalOpen(false);
              setSelectedAstigmatismConfig(null);
              if (saved && currentProduct?.id) {
                setTimeout(() => {
                  fetchAstigmatismConfigs();
                }, 100);
              }
            }}
          />
        )}

        {/* Size/Volume Variant Modal */}
        {variantModalOpen && getValidProductId() && (
          <>
            {console.log('🔧 ProductModal: Rendering SizeVolumeVariantModal with editingVariant:', editingVariant)}
            <SizeVolumeVariantModal
              variant={editingVariant}
              productId={getValidProductId()}
              onClose={async (saved = false) => {
                console.log('🔧 ProductModal: SizeVolumeVariantModal onClose called, saved:', saved);
                setVariantModalOpen(false);
                setEditingVariant(null);
                if (saved) {
                  // Refresh the variants list after saving
                  try {
                    const data = await getProductSizeVolumeVariants(getValidProductId());
                    setSizeVolumeVariants(data.data?.variants || []);
                  } catch (error) {
                    console.error('Error refreshing variants:', error);
                  }
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ProductModal;



