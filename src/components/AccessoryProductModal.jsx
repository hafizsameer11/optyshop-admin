import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiUpload, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import uploadAPI from '../api/upload';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';

const isSavedImageUrl = (value) => {
  if (!value || typeof value !== 'string') return false;
  const url = value.trim();
  if (!url) return false;
  return !url.startsWith('data:') && !url.startsWith('blob:');
};

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Random unique accessory SKU — ACC- + hex suffix */
const generateAccessorySKU = () => {
  let suffix = '';
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    suffix = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  } else {
    suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
  }
  return `ACC-${suffix}`;
};

const emptyForm = {
  name: '',
  slug: '',
  sku: '',
  price: '',
  compare_at_price: '',
  cost_price: '',
  short_description: '',
  description: '',
  category_id: '',
  color: '',
  material: '',
  unit: '',
  stock_quantity: '0',
  stock_status: 'in_stock',
  is_active: true,
  is_featured: false,
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
};

/**
 * Dedicated create/edit form for Accessori products.
 * Does not share ProductModal / ContactLensProductModal fields or tabs.
 */
const AccessoryProductModal = ({ product, onClose, onAfterSave }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [accessoriCategory, setAccessoriCategory] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesDirty, setImagesDirty] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const resolveAccessoriCategory = useCallback(async () => {
    try {
      const response = await api.get(API_ROUTES.ADMIN.CATEGORIES.LIST);
      const list =
        response.data?.data?.categories ||
        response.data?.data ||
        response.data?.categories ||
        response.data ||
        [];
      const categories = Array.isArray(list) ? list : [];
      const match = categories.find((cat) => {
        const n = (cat.name || '').toLowerCase();
        const s = (cat.slug || '').toLowerCase();
        return (
          s === 'accessori' ||
          n === 'accessori' ||
          s.includes('accessori') ||
          n.includes('accessori') ||
          s === 'accessories' ||
          n.includes('accessor')
        );
      });
      if (match) {
        setAccessoriCategory(match);
        return match;
      }
      toast.error('Accessori category not found. Create it under Categories first.');
      return null;
    } catch (err) {
      console.error('Failed to load categories for accessories:', err);
      toast.error('Failed to load Accessori category');
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cat = await resolveAccessoriCategory();
      if (cancelled) return;

      if (product?.id) {
        setSlugManuallyEdited(true);
        const imgs = Array.isArray(product.images)
          ? product.images.filter(Boolean)
          : product.image || product.image_url
            ? [product.image || product.image_url]
            : [];
        setExistingImages(imgs);
        setImagePreviews(imgs);
        setImagesDirty(false);
        setImageFiles([]);
        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          sku: product.sku || '',
          price: product.price != null ? String(product.price) : '',
          compare_at_price:
            product.compare_at_price != null ? String(product.compare_at_price) : '',
          cost_price: product.cost_price != null ? String(product.cost_price) : '',
          short_description: product.short_description || '',
          description: product.description || '',
          category_id: String(product.category_id || cat?.id || ''),
          color: product.frame_color || '',
          material: Array.isArray(product.frame_material)
            ? product.frame_material.join(', ')
            : product.frame_material || '',
          unit: product.pack_type || product.size_volume || '',
          stock_quantity:
            product.stock_quantity != null ? String(product.stock_quantity) : '0',
          stock_status: product.stock_status || 'in_stock',
          is_active: product.is_active !== undefined ? Boolean(product.is_active) : true,
          is_featured: Boolean(product.is_featured),
          meta_title: product.meta_title || '',
          meta_description: product.meta_description || '',
          meta_keywords: product.meta_keywords || '',
        });
      } else {
        setFormData({
          ...emptyForm,
          category_id: cat ? String(cat.id) : '',
          sku: generateAccessorySKU(),
        });
        setExistingImages([]);
        setImagePreviews([]);
        setImageFiles([]);
        setImagesDirty(false);
        setSlugManuallyEdited(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [product, resolveAccessoriCategory]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'slug') setSlugManuallyEdited(true);
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      if (name === 'name' && !slugManuallyEdited && !product?.id) {
        next.slug = slugify(value);
      }
      if (name === 'stock_quantity') {
        const qty = parseInt(value, 10);
        if (!Number.isNaN(qty)) {
          next.stock_status = qty > 0 ? 'in_stock' : 'out_of_stock';
        }
      }
      return next;
    });
  };

  const getImagesToKeep = () => {
    const ordered = imagePreviews.filter(
      (preview) => isSavedImageUrl(preview) && existingImages.includes(preview)
    );
    const missing = existingImages.filter(
      (url) => isSavedImageUrl(url) && !ordered.includes(url)
    );
    return [...ordered, ...missing];
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
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

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    setImageFiles((prev) => (product?.id ? validFiles : [...prev, ...validFiles]));
    setImagesDirty(true);

    Promise.all(
      validFiles.map((file) =>
        uploadAPI
          .uploadImage(file)
          .then((r) => r.url)
          .catch((error) => {
            console.error('Upload error:', error);
            toast.error(error.message || 'Failed to upload image');
            return null;
          })
      )
    ).then((previews) => {
      const validPreviews = previews.filter(Boolean);
      setImagePreviews((prev) => [...prev, ...validPreviews]);
      toast.success(`${validFiles.length} image(s) added`);
    });

    e.target.value = '';
  };

  const removeImage = (index) => {
    const previewToRemove = imagePreviews[index];
    setImagesDirty(true);
    if (isSavedImageUrl(previewToRemove) && existingImages.includes(previewToRemove)) {
      setExistingImages((prev) => prev.filter((img) => img !== previewToRemove));
    } else {
      const existingCount = imagePreviews
        .slice(0, index)
        .filter((preview) => isSavedImageUrl(preview) && existingImages.includes(preview))
        .length;
      const fileIndex = index - existingCount;
      if (fileIndex >= 0 && fileIndex < imageFiles.length) {
        const newFiles = [...imageFiles];
        newFiles.splice(fileIndex, 1);
        setImageFiles(newFiles);
      }
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name?.trim()) {
        toast.error('Product name is required');
        setLoading(false);
        return;
      }
      const skuValue = formData.sku?.trim() || generateAccessorySKU();
      if (!formData.price || Number.isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
        toast.error('Valid price is required');
        setLoading(false);
        return;
      }

      let categoryId = formData.category_id;
      if (!categoryId && accessoriCategory?.id) {
        categoryId = String(accessoriCategory.id);
      }
      if (!categoryId) {
        const cat = await resolveAccessoriCategory();
        categoryId = cat ? String(cat.id) : '';
      }
      if (!categoryId) {
        toast.error('Accessori category is required');
        setLoading(false);
        return;
      }

      if (!formData.sku?.trim()) {
        setFormData((prev) => ({ ...prev, sku: skuValue }));
      }

      const dataToSend = {
        name: formData.name.trim(),
        sku: skuValue,
        price: parseFloat(formData.price) || 0,
        category_id: parseInt(categoryId, 10),
        product_type: 'accessory',
        // Accessories have no subcategory
        sub_category_id: null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        stock_status: formData.stock_status || 'in_stock',
      };

      if (formData.slug?.trim()) dataToSend.slug = formData.slug.trim();
      else dataToSend.slug = slugify(formData.name);
      if (formData.description?.trim()) dataToSend.description = formData.description.trim();
      if (formData.short_description?.trim()) {
        dataToSend.short_description = formData.short_description.trim();
      }
      if (formData.cost_price !== '') dataToSend.cost_price = parseFloat(formData.cost_price) || 0;
      if (formData.compare_at_price !== '') {
        dataToSend.compare_at_price = parseFloat(formData.compare_at_price) || 0;
      }
      if (formData.stock_quantity !== '') {
        dataToSend.stock_quantity = parseInt(formData.stock_quantity, 10) || 0;
      }
      // Reuse generic product columns with accessory labels (color / material / unit)
      if (formData.color?.trim()) dataToSend.frame_color = formData.color.trim();
      if (formData.material?.trim()) dataToSend.frame_material = formData.material.trim();
      if (formData.unit?.trim()) dataToSend.pack_type = formData.unit.trim();
      if (formData.meta_title?.trim()) dataToSend.meta_title = formData.meta_title.trim();
      if (formData.meta_description?.trim()) {
        dataToSend.meta_description = formData.meta_description.trim();
      }
      if (formData.meta_keywords?.trim()) dataToSend.meta_keywords = formData.meta_keywords.trim();

      let response;
      const hasImageFiles = imageFiles && imageFiles.length > 0;

      if (hasImageFiles) {
        const submitData = new FormData();
        Object.keys(dataToSend).forEach((key) => {
          const value = dataToSend[key];
          if (value === null || value === undefined || value === '') return;
          if (typeof value === 'boolean') submitData.append(key, value.toString());
          else if (typeof value === 'number') submitData.append(key, value.toString());
          else submitData.append(key, value);
        });
        // Explicit null subcategory for accessories
        submitData.append('sub_category_id', '');

        if (product?.id && imagesDirty) {
          submitData.append('images', JSON.stringify(getImagesToKeep()));
        }
        imageFiles.forEach((file) => submitData.append('images', file));

        if (product?.id) {
          response = await api.put(API_ROUTES.ADMIN.PRODUCTS.UPDATE(product.id), submitData);
        } else {
          response = await api.post(API_ROUTES.ADMIN.PRODUCTS.CREATE, submitData);
        }
      } else {
        if (product?.id && imagesDirty) {
          dataToSend.images = getImagesToKeep();
        }
        if (product?.id) {
          response = await api.put(API_ROUTES.ADMIN.PRODUCTS.UPDATE(product.id), dataToSend);
        } else {
          response = await api.post(API_ROUTES.ADMIN.PRODUCTS.CREATE, dataToSend);
        }
      }

      const responseData = response.data?.data || response.data;
      const savedProduct = responseData?.product || responseData;

      toast.success(
        response.data?.message ||
          (product?.id ? 'Accessory updated successfully' : 'Accessory created successfully')
      );

      if (typeof onAfterSave === 'function' && savedProduct?.id) {
        onAfterSave({ ...savedProduct, product_type: 'accessory' });
      } else if (typeof onClose === 'function') {
        onClose(true);
      }
    } catch (error) {
      console.error('Accessory save error:', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to save accessory';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'details', label: 'Accessory details' },
    { id: 'images', label: 'Images' },
    { id: 'seo', label: 'SEO' },
  ];

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-gray-200/50 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div>
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
              {product?.id ? 'Edit Accessory' : 'Add Accessory'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Category:{' '}
              <span className="font-semibold text-gray-700">
                {accessoriCategory?.name || 'Accessori'}
              </span>{' '}
              (no subcategories)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <button
              type="button"
              onClick={() => onClose?.(false)}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-all"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200 bg-white px-6 flex gap-1 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto flex flex-col"
          style={{ maxHeight: 'calc(90vh - 200px)' }}
        >
          <div className="p-6 space-y-5">
            {activeTab === 'general' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="e.g. Hard shell glasses case"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Slug</label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="auto-from-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        readOnly
                        className="input-modern flex-1 bg-slate-50 text-slate-700 cursor-default"
                        title="Auto-generated SKU"
                      />
                      {!product?.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, sku: generateAccessorySKU() }));
                            toast.success('New SKU generated');
                          }}
                          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium whitespace-nowrap"
                          title="Generate another SKU"
                        >
                          Regenerate
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Auto-generated (e.g. ACC-…).{' '}
                      {product?.id ? 'Cannot change after create.' : 'Use Regenerate if needed.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price (€) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="input-modern"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Compare at Price
                    </label>
                    <input
                      type="number"
                      name="compare_at_price"
                      value={formData.compare_at_price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="input-modern"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cost Price
                    </label>
                    <input
                      type="number"
                      name="cost_price"
                      value={formData.cost_price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="input-modern"
                    />
                  </div>
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
                      <option value="preorder">Preorder</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Short Description
                  </label>
                  <input
                    type="text"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleChange}
                    className="input-modern"
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="input-modern"
                  />
                </div>

                <div className="flex flex-wrap gap-6">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="rounded border-gray-300"
                    />
                    Active
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleChange}
                      className="rounded border-gray-300"
                    />
                    Featured
                  </label>
                </div>
              </>
            )}

            {activeTab === 'details' && (
              <>
                <p className="text-sm text-slate-600 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  Fields for cases, cleaning kits, tools, and straps — not frames or lenses.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="e.g. Black, Blue, Orange"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Material</label>
                    <input
                      type="text"
                      name="material"
                      value={formData.material}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="e.g. Velvet, Hard shell, Metal"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unit / Packaging
                  </label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="e.g. 1 pezzo, Kit, Set"
                  />
                </div>
              </>
            )}

            {activeTab === 'images' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Images
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors">
                    <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload images</span>
                    <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB each</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {imagePreviews.map((src, index) => (
                      <div
                        key={`${src}-${index}`}
                        className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-square"
                      >
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1.5 rounded-full bg-white/90 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          aria-label="Remove image"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

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
                    rows={3}
                    className="input-modern"
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
                    placeholder="comma, separated, keywords"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={() => onClose?.(false)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60"
            >
              {loading ? 'Saving…' : product?.id ? 'Update Accessory' : 'Create Accessory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AccessoryProductModal;
