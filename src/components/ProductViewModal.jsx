import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiPackage } from 'react-icons/fi';
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
        const p = res.data?.data?.product || res.data?.product || res.data;
        if (!cancelled && p) setProduct(p);
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
  const colors = Array.isArray(p.colors) ? p.colors : [];
  let colorImagesKeys = [];
  if (p.color_images) {
    if (typeof p.color_images === 'object' && !Array.isArray(p.color_images)) {
      colorImagesKeys = Object.keys(p.color_images);
    } else if (typeof p.color_images === 'string') {
      try {
        const parsed = JSON.parse(p.color_images);
        if (Array.isArray(parsed)) colorImagesKeys = parsed.map((x) => x.hexCode || x.name || '—');
        else if (parsed && typeof parsed === 'object') colorImagesKeys = Object.keys(parsed);
      } catch {
        /* ignore */
      }
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-view-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-4 min-w-0">
            <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {thumb ? (
                <img src={thumb} alt="" className="w-full h-full object-cover" />
              ) : (
                <FiPackage className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <h2 id="product-view-title" className="text-xl font-bold text-gray-900 truncate">
                {p.name || 'Product'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">ID {p.id}</p>
              {loading && (
                <p className="text-xs text-indigo-600 mt-1">Loading full details…</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-200/80 transition-colors"
            aria-label="Close"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500 font-medium">SKU</dt>
              <dd className="text-gray-900 mt-0.5">{p.sku ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Slug</dt>
              <dd className="text-gray-900 mt-0.5 break-all">{p.slug ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Price</dt>
              <dd className="text-gray-900 mt-0.5 font-semibold">
                €{p.price != null ? parseFloat(p.price).toFixed(2) : '—'}
                {p.compare_at_price != null && (
                  <span className="ml-2 text-gray-400 line-through text-xs font-normal">
                    €{parseFloat(p.compare_at_price).toFixed(2)}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Stock</dt>
              <dd className="text-gray-900 mt-0.5">
                {p.stock_quantity != null ? p.stock_quantity : '—'}{' '}
                {p.stock_status && (
                  <span className="text-xs text-gray-500">({String(p.stock_status).replace('_', ' ')})</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Type</dt>
              <dd className="text-gray-900 mt-0.5 capitalize">
                {p.product_type ? String(p.product_type).replace(/_/g, ' ') : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Status</dt>
              <dd className="mt-0.5">
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    p.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {p.is_active !== false ? 'Active' : 'Inactive'}
                </span>
                {p.is_featured && (
                  <span className="ml-2 inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                    Featured
                  </span>
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500 font-medium">Category / Subcategory</dt>
              <dd className="text-gray-900 mt-0.5">
                {p.category?.name || p.category_name || '—'}
                {(p.subcategory?.name || p.sub_category?.name) && (
                  <span className="text-gray-600">
                    {' '}
                    · {p.subcategory?.name || p.sub_category?.name}
                  </span>
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500 font-medium">Brand</dt>
              <dd className="text-gray-900 mt-0.5">
                {p.brand?.name || p.brand_name || '—'}
              </dd>
            </div>
          </dl>

          {(colors.length > 0 || colorImagesKeys.length > 0) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Color variants</h3>
              {colors.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {colors.map((c, i) => (
                    <li
                      key={i}
                      className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-100 border border-gray-200 text-xs"
                    >
                      {c.hexCode && (
                        <span
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: c.hexCode }}
                        />
                      )}
                      <span>{c.name || c.display_name || c.value || '—'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">{colorImagesKeys.length} variant group(s) in data</p>
              )}
            </div>
          )}

          {images.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Images ({images.length})</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.slice(0, 12).map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 hover:ring-2 hover:ring-indigo-300"
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
              {images.length > 12 && (
                <p className="text-xs text-gray-500 mt-2">+{images.length - 12} more</p>
              )}
            </div>
          )}

          {(p.short_description || p.description) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Description</h3>
              {p.short_description && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.short_description}</p>
              )}
              {p.description && (
                <div
                  className="text-sm text-gray-600 mt-2 max-w-none [&_a]:text-indigo-600"
                  dangerouslySetInnerHTML={{ __html: String(p.description) }}
                />
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
