import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiPackage, FiImage, FiLayers, FiAlignLeft, FiHash, FiTag, FiBox, FiCpu, FiMapPin } from 'react-icons/fi';
import api from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

function parseImagesField(images) {
  if (!images) return [];
  if (Array.isArray(images)) return images.filter(Boolean);
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** 6-char uppercase hex without #, or null */
function normalizeHexKey(hex) {
  if (hex == null || hex === '') return null;
  const s = String(hex).trim().replace(/^#/, '').toUpperCase();
  if (/^[0-9A-F]{6}$/.test(s)) return s;
  return null;
}

function parseImageColorsArray(imageColors) {
  if (!imageColors) return null;
  if (Array.isArray(imageColors)) return imageColors;
  if (typeof imageColors === 'string') {
    try {
      const parsed = JSON.parse(imageColors);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Count images per color from parallel `images` + `image_colors` (same index = same file).
 * This is how many admin saves store variant photos even when `colors[].images` is empty.
 */
function countImagesByHexFromParallelArrays(p) {
  const imgs = parseImagesField(p.images);
  const ic = parseImageColorsArray(p.image_colors ?? p.imageColors);
  if (!ic || !Array.isArray(ic)) return new Map();
  const map = new Map();
  const n = Math.min(imgs.length, ic.length);
  for (let i = 0; i < n; i++) {
    const hex = ic[i];
    if (hex == null || hex === '') continue;
    const norm = normalizeHexKey(hex);
    if (!norm) continue;
    map.set(norm, (map.get(norm) || 0) + 1);
  }
  return map;
}

function hexDisplayFromNorm(norm) {
  return norm ? `#${norm}` : null;
}

/** Normalize API color_images + colors + parallel image_colors into rows for display */
function parseColorVariants(p) {
  const parallelByHex = countImagesByHexFromParallelArrays(p);
  /** @type {Map<string, { hex: string | null, name: string, imageCount: number, price: number | null }>} */
  const merged = new Map();

  const upsert = (hexRaw, nameRaw, structCount, price) => {
    const norm = normalizeHexKey(hexRaw || '');
    const nameStr = String(nameRaw ?? '').trim() || 'Variant';
    const key = norm ? `hex:${norm}` : `name:${nameStr.toUpperCase()}`;
    const fromParallel = norm ? parallelByHex.get(norm) || 0 : 0;
    const count = Math.max(structCount ?? 0, fromParallel);
    const hexOut = norm ? hexDisplayFromNorm(norm) : null;
    const prev = merged.get(key);
    if (prev) {
      merged.set(key, {
        hex: prev.hex || hexOut,
        name: prev.name || nameStr,
        imageCount: Math.max(prev.imageCount, count),
        price: price != null ? price : prev.price,
      });
    } else {
      merged.set(key, {
        hex: hexOut,
        name: nameStr,
        imageCount: count,
        price: price != null ? price : null,
      });
    }
  };

  if (Array.isArray(p.colors)) {
    p.colors.forEach((c) => {
      const hex = c.hexCode || c.hex_code || c.value;
      const name = c.display_name || c.name || (normalizeHexKey(c.value) ? null : c.value);
      const imgs = c.images;
      const count = Array.isArray(imgs) ? imgs.length : 0;
      upsert(hex, name || 'Variant', count, c.price);
    });
  }

  let raw = p.color_images;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = null;
    }
  }
  if (Array.isArray(raw)) {
    raw.forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      const hex = entry.hexCode || entry.hex_code;
      const name = entry.name;
      const imgs = entry.images;
      const count = Array.isArray(imgs) ? imgs.length : 0;
      upsert(hex, name || 'Variant', count, entry.price);
    });
  } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    Object.entries(raw).forEach(([key, val]) => {
      if (!val) return;
      const hex = typeof val === 'object' ? val.hexCode || val.hex_code || key : key;
      const name = typeof val === 'object' ? val.name : null;
      const imgs = typeof val === 'object' ? val.images : val;
      let count = 0;
      if (Array.isArray(imgs)) count = imgs.length;
      else if (typeof imgs === 'string' && imgs) count = 1;
      upsert(hex, name || key, count, typeof val === 'object' ? val.price : null);
    });
  }

  parallelByHex.forEach((count, norm) => {
    const key = `hex:${norm}`;
    if (!merged.has(key)) {
      merged.set(key, {
        hex: hexDisplayFromNorm(norm),
        name: 'Variant',
        imageCount: count,
        price: null,
      });
    }
  });

  return Array.from(merged.values());
}

function stockDisplay(p) {
  const qty = p.stock_quantity;
  const raw = p.stock_status != null ? String(p.stock_status).toLowerCase().replace(/-/g, '_') : '';

  const labels = {
    in_stock: 'Listed as in stock',
    out_of_stock: 'Out of stock',
    low_stock: 'Low stock',
    on_backorder: 'On backorder',
  };

  const qtyNum = qty != null && qty !== '' ? Number(qty) : null;
  const qtyLabel =
    qtyNum != null && !Number.isNaN(qtyNum)
      ? `${qtyNum} unit${qtyNum === 1 ? '' : 's'}`
      : '—';

  let statusBadge = labels[raw] || (raw ? raw.replace(/_/g, ' ') : null);
  let badgeClass = 'bg-slate-100 text-slate-700';

  if (raw === 'in_stock') {
    badgeClass = qtyNum === 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800';
    if (qtyNum === 0) statusBadge = 'In stock (check quantity)';
  } else if (raw === 'out_of_stock') {
    badgeClass = 'bg-red-50 text-red-800';
  } else if (raw === 'low_stock') {
    badgeClass = 'bg-amber-100 text-amber-900';
  }

  return { qtyLabel, qtyNum, statusBadge, badgeClass, raw };
}

function fmt(v) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

function fmtMoney(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = parseFloat(v);
  if (Number.isNaN(n)) return '—';
  return `€${n.toFixed(2)}`;
}

function fmtFrameShape(s) {
  if (!s) return '—';
  return String(s).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function frameColorHex(name) {
  if (!name) return null;
  const s = String(name).trim();
  if (/^#?[0-9A-Fa-f]{6}$/.test(s.replace('#', ''))) {
    return s.startsWith('#') ? s.toUpperCase() : `#${s.toUpperCase()}`;
  }
  const colorMap = {
    black: '#000000',
    white: '#FFFFFF',
    brown: '#8B4513',
    blue: '#0000FF',
    red: '#FF0000',
    green: '#008000',
    gray: '#808080',
    grey: '#808080',
    gold: '#FFD700',
    silver: '#C0C0C0',
    tortoise: '#8B4513',
    tortoiseshell: '#8B4513',
    navy: '#000080',
    burgundy: '#800020',
    clear: '#FFFFFF',
    transparent: '#FFFFFF',
  };
  return colorMap[s.toLowerCase()] || null;
}

function KV({ label, children, wide }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="text-sm text-gray-900 mt-0.5 break-words">{children}</div>
    </div>
  );
}

function DetailCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-xl bg-white border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-indigo-600 shrink-0" />}
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</div>
    </section>
  );
}

/**
 * Read-only product details modal (separate from edit ProductModal).
 */
export default function ProductViewModal({ product: initialProduct, onClose }) {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(initialProduct);

  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct?.id]);

  useEffect(() => {
    const id = initialProduct?.id;
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(API_ROUTES.ADMIN.PRODUCTS.BY_ID(id));
        const fetched = res.data?.data?.product || res.data?.product || res.data;
        if (!cancelled && fetched) setProduct(fetched);
      } catch (e) {
        console.warn('ProductViewModal: failed to load full product, using list row', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialProduct?.id]);

  const p = product || initialProduct;
  if (!p) return null;

  const images = parseImagesField(p.images);
  const thumb = images[0] || p.image || p.thumbnail || p.image_url;
  const variantRows = parseColorVariants(p);
  const stock = stockDisplay(p);

  const priceNum = p.price != null ? parseFloat(p.price) : null;
  const compareNum = p.compare_at_price != null ? parseFloat(p.compare_at_price) : null;
  const hasDiscount = compareNum != null && priceNum != null && compareNum > priceNum;

  const svVariants = Array.isArray(p.sizeVolumeVariants || p.size_volume_variants || p.variants)
    ? p.sizeVolumeVariants || p.size_volume_variants || p.variants
    : [];
  const model3dUrl = p.model_3d || p.model3d || p.model3D;
  const frameMat = p.frame_material;
  const frameMaterialStr = Array.isArray(frameMat)
    ? frameMat.filter(Boolean).map((x) => fmtFrameShape(String(x))).join(', ')
    : frameMat
      ? fmtFrameShape(String(frameMat))
      : '';

  const hasContactFields =
    p.product_type === 'contact_lens' ||
    p.contact_lens_type ||
    p.contact_lens_material ||
    (p.water_content != null && p.water_content !== '') ||
    p.replacement_frequency ||
    p.packaging ||
    p.base_curve ||
    p.diameter;

  const hasEyeHygieneFields =
    p.product_type === 'eye_hygiene' ||
    p.size_volume ||
    p.expiry_date ||
    p.volume ||
    svVariants.length > 0;

  const hasFrameFields =
    p.frame_shape ||
    p.frame_color ||
    (frameMat && (Array.isArray(frameMat) ? frameMat.length : String(frameMat).trim())) ||
    p.gender ||
    (p.lens_material && p.product_type !== 'contact_lens') ||
    (p.lens_type && p.product_type !== 'contact_lens');

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-view-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-[0_25px_80px_-12px_rgba(0,0,0,0.35)] max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden ring-1 ring-black/5">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white px-5 py-6 sm:px-8 sm:py-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-90" />
          <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
            <div className="w-full sm:w-44 sm:h-44 h-52 rounded-2xl overflow-hidden bg-white/10 ring-2 ring-white/20 shadow-2xl flex-shrink-0 mx-auto sm:mx-0">
              {thumb ? (
                <img src={thumb} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiPackage className="w-16 h-16 text-white/40" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                {p.is_active !== false ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    Active
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80 border border-white/20">
                    Inactive
                  </span>
                )}
                {p.is_featured && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-100 border border-amber-300/40">
                    Featured
                  </span>
                )}
                {loading && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 animate-pulse">Updating…</span>
                )}
              </div>
              <h2 id="product-view-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                {p.name || 'Product'}
              </h2>
              <p className="text-sm text-indigo-200/90 mt-1 font-mono">ID {p.id}</p>

              <div className="mt-5 flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-6">
                <div>
                  <p className="text-xs font-medium text-indigo-200/80 uppercase tracking-wider mb-1">Price</p>
                  <div className="flex flex-wrap items-baseline gap-2 justify-center sm:justify-start">
                    <span className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
                      €{priceNum != null && !Number.isNaN(priceNum) ? priceNum.toFixed(2) : '—'}
                    </span>
                    {hasDiscount && (
                      <span className="text-lg text-indigo-200/70 line-through tabular-nums">
                        €{compareNum.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {hasDiscount && (
                    <p className="text-xs text-emerald-300/90 mt-1 font-medium">
                      On sale vs compare-at price
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors ring-1 ring-white/20"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 bg-slate-50/80">
          <div className="p-5 sm:p-8 space-y-6">
            {/* Quick facts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-xl bg-white border border-gray-200/80 p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">SKU & slug</p>
                <p className="text-sm font-semibold text-gray-900 font-mono">{p.sku ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-2 break-all">{p.slug ?? '—'}</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-200/80 p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Inventory</p>
                <p className="text-lg font-bold text-gray-900 tabular-nums">{stock.qtyLabel}</p>
                {stock.statusBadge && (
                  <span
                    className={`inline-flex mt-2 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${stock.badgeClass}`}
                  >
                    {stock.statusBadge}
                  </span>
                )}
                {stock.qtyNum === 0 && stock.raw === 'in_stock' && (
                  <p className="text-xs text-amber-700 mt-2 leading-snug">
                    Quantity is 0 but status is still “in stock” — update stock or status in the editor if needed.
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-white border border-gray-200/80 p-4 shadow-sm sm:col-span-2 lg:col-span-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type & placement</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {p.product_type ? String(p.product_type).replace(/_/g, ' ') : '—'}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <span className="text-gray-500">Category:</span>{' '}
                  {p.category?.name || p.category_name || '—'}
                </p>
                {(p.subcategory?.name || p.sub_category?.name) && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="text-gray-500">Subcategory:</span>{' '}
                    {p.subcategory?.name || p.sub_category?.name}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  <span className="text-gray-500">Brand:</span>{' '}
                  <span className="font-medium text-gray-900">{p.brand?.name || p.brand_name || '—'}</span>
                </p>
              </div>
            </div>

            <DetailCard title="Category & taxonomy" icon={FiMapPin}>
              <KV label="Product ID">{fmt(p.id)}</KV>
              <KV label="Category ID">{fmt(p.category_id)}</KV>
              <KV label="Category name">{fmt(p.category?.name || p.category_name)}</KV>
              <KV label="Subcategory ID">{fmt(p.sub_category_id ?? p.subcategory_id)}</KV>
              <KV label="Subcategory name">{fmt(p.subcategory?.name || p.sub_category?.name)}</KV>
              <KV label="Parent subcategory ID">{fmt(p.parent_subcategory_id)}</KV>
              <KV label="Brand ID">{fmt(p.brand_id)}</KV>
              <KV label="Brand name">{fmt(p.brand?.name || p.brand_name || p.contact_lens_brand)}</KV>
            </DetailCard>

            {hasContactFields && (
              <DetailCard title="Contact lens" icon={FiCpu}>
                <KV label="Lens type">{fmt(p.lens_type)}</KV>
                <KV label="Contact lens type">
                  {p.contact_lens_type ? String(p.contact_lens_type).replace(/_/g, ' ') : '—'}
                </KV>
                <KV label="Material">{fmt(p.contact_lens_material)}</KV>
                <KV label="Water content">
                  {p.water_content != null && p.water_content !== '' ? `${p.water_content}%` : '—'}
                </KV>
                <KV label="Replacement">{fmt(p.replacement_frequency)}</KV>
                <KV label="Packaging">{fmt(p.packaging)}</KV>
                <KV label="Base curve">{fmt(p.base_curve)}</KV>
                <KV label="Diameter">{fmt(p.diameter)}</KV>
              </DetailCard>
            )}

            {hasEyeHygieneFields && (
              <DetailCard title="Eye hygiene & size / volume" icon={FiBox}>
                <KV label="Volume (product)">{fmt(p.volume)}</KV>
                <KV label="Size / volume (legacy)">{fmt(p.size_volume)}</KV>
                <KV label="Pack type">
                  {svVariants.length > 0
                    ? [...new Set(svVariants.map((v) => v.pack_type).filter(Boolean))].join(', ') || '—'
                    : fmt(p.pack_type)}
                </KV>
                <KV label="Expiry date">
                  {p.expiry_date ? new Date(p.expiry_date).toLocaleDateString() : '—'}
                </KV>
                <KV label="Size / volume variants" wide>
                  {svVariants.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-800">
                        {svVariants.length} variant{svVariants.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-600">
                        {svVariants
                          .map((v) => v.size_volume)
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </p>
                    </div>
                  ) : (
                    '—'
                  )}
                </KV>
              </DetailCard>
            )}

            {hasFrameFields && (
              <DetailCard title="Frame & eyewear" icon={FiPackage}>
                <KV label="Frame shape">{fmtFrameShape(p.frame_shape)}</KV>
                <KV label="Frame material">{frameMaterialStr || '—'}</KV>
                <KV label="Frame color">
                  {p.frame_color ? (
                    <span className="inline-flex items-center gap-2 flex-wrap">
                      <span className="capitalize font-medium">{p.frame_color}</span>
                      {frameColorHex(p.frame_color) && (
                        <span
                          className="w-5 h-5 rounded border border-gray-300 shadow-sm inline-block shrink-0"
                          style={{ backgroundColor: frameColorHex(p.frame_color) }}
                          title={p.frame_color}
                        />
                      )}
                    </span>
                  ) : (
                    '—'
                  )}
                </KV>
                <KV label="Lens type">{fmt(p.lens_type)}</KV>
                <KV label="Lens material">{fmt(p.lens_material)}</KV>
                <KV label="Gender">{fmt(p.gender)}</KV>
              </DetailCard>
            )}

            {p.cost_price != null && p.cost_price !== '' && (
              <DetailCard title="Cost price">
                <KV label="Cost">{fmtMoney(p.cost_price)}</KV>
              </DetailCard>
            )}

            {(model3dUrl || p.model_name) && (
              <DetailCard title="3D model" icon={FiLayers}>
                <KV label="Model name">{fmt(p.model_name)}</KV>
                <KV label="Model file URL" wide>
                  {model3dUrl ? (
                    <a
                      href={model3dUrl}
                      className="text-indigo-600 underline break-all"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {model3dUrl}
                    </a>
                  ) : (
                    '—'
                  )}
                </KV>
              </DetailCard>
            )}

            {(p.meta_title || p.meta_description || p.meta_keywords) && (
              <DetailCard title="SEO" icon={FiTag}>
                <KV label="Meta title" wide>
                  {fmt(p.meta_title)}
                </KV>
                <KV label="Meta description" wide>
                  {fmt(p.meta_description)}
                </KV>
                <KV label="Meta keywords" wide>
                  {fmt(p.meta_keywords)}
                </KV>
              </DetailCard>
            )}

            {(p.created_at || p.updated_at) && (
              <DetailCard title="Timestamps" icon={FiCpu}>
                <KV label="Created">{p.created_at ? new Date(p.created_at).toLocaleString() : '—'}</KV>
                <KV label="Updated">{p.updated_at ? new Date(p.updated_at).toLocaleString() : '—'}</KV>
              </DetailCard>
            )}

            {/* Color variants */}
            {variantRows.length > 0 && (
              <section className="rounded-xl bg-white border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-100 flex items-center gap-2">
                  <FiLayers className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-gray-900">Color variants</h3>
                  <span className="text-xs text-gray-500">({variantRows.length})</span>
                </div>
                <ul className="divide-y divide-gray-100">
                  {variantRows.map((row, i) => (
                    <li key={i} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50/80 transition-colors">
                      <div
                        className="w-11 h-11 rounded-xl border-2 border-gray-200 shadow-inner shrink-0 ring-1 ring-black/5"
                        style={{ backgroundColor: row.hex || '#e5e7eb' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{row.name}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs text-gray-500">
                          {row.hex && (
                            <span className="inline-flex items-center gap-1 font-mono">
                              <FiHash className="w-3 h-3 shrink-0" />
                              {String(row.hex).replace(/^#/, '')}
                            </span>
                          )}
                          <span>
                            {row.imageCount} image{row.imageCount === 1 ? '' : 's'}
                          </span>
                          {row.price != null && !Number.isNaN(Number(row.price)) && (
                            <span className="text-indigo-600 font-medium">€{Number(row.price).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Gallery */}
            {images.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FiImage className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-bold text-gray-900">Gallery</h3>
                  <span className="text-xs text-gray-500">· {images.length} image{images.length === 1 ? '' : 's'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.slice(0, 16).map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 hover:ring-2 hover:ring-indigo-200 transition-all"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
                      <span className="absolute bottom-0 inset-x-0 py-1.5 text-[10px] font-medium text-center text-white bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100">
                        Open full size
                      </span>
                    </a>
                  ))}
                </div>
                {images.length > 16 && (
                  <p className="text-xs text-gray-500 mt-3 text-center">+{images.length - 16} more images in catalog</p>
                )}
              </section>
            )}

            {/* Description */}
            {(p.short_description || p.description) && (
              <section className="rounded-xl bg-white border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  <FiAlignLeft className="w-4 h-4 text-gray-600" />
                  <h3 className="text-sm font-bold text-gray-900">Description</h3>
                </div>
                <div className="p-4 sm:p-5 space-y-4">
                  {p.short_description && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Short</p>
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{p.short_description}</p>
                    </div>
                  )}
                  {p.description && (
                    <div>
                      {p.short_description && (
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Full</p>
                      )}
                      <div
                        className="text-sm text-gray-700 leading-relaxed max-w-none prose-p:my-2 prose-headings:text-gray-900 [&_a]:text-indigo-600 [&_a]:underline"
                        dangerouslySetInnerHTML={{ __html: String(p.description) }}
                      />
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="px-5 py-4 sm:px-8 border-t border-gray-200 bg-white flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-500/25 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
