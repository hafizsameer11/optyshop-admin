import React, { useMemo, useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { mmCalibersApi } from '../api/mmCalibers';
import { supportsMMCalibers } from '../services/productsService';

const DIMENSIONS = [
  {
    key: 'calibro',
    title: 'Calibro (lens width)',
    hint: 'Independent lens-width options for the PDP Calibro dropdown',
    placeholder: 'e.g. 52',
    allowPriceStock: true,
  },
  {
    key: 'ponte',
    title: 'Ponte (bridge)',
    hint: 'Independent bridge options — not tied to a specific calibro',
    placeholder: 'e.g. 18',
    allowPriceStock: false,
  },
  {
    key: 'asta',
    title: 'Asta (temple)',
    hint: 'Independent temple options — not tied to calibro or ponte',
    placeholder: 'e.g. 140',
    allowPriceStock: false,
  },
  {
    key: 'frame_width',
    title: 'Frame width',
    hint: 'Independent frame-width options',
    placeholder: 'e.g. 135',
    allowPriceStock: false,
  },
];

const emptyDraft = () => ({
  value: '',
  price: '',
  stock_quantity: '',
});

const MMCaliberManager = ({ productId, productType, onCalibersUpdate }) => {
  const [calibers, setCalibers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [drafts, setDrafts] = useState({
    calibro: emptyDraft(),
    ponte: emptyDraft(),
    asta: emptyDraft(),
    frame_width: emptyDraft(),
  });

  if (!supportsMMCalibers(productType)) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">MM Calibers are only available for sunglasses and eyeglasses products.</p>
      </div>
    );
  }

  useEffect(() => {
    if (productId) loadCalibers();
  }, [productId]);

  const byDimension = useMemo(() => {
    const groups = { calibro: [], ponte: [], asta: [], frame_width: [] };
    (calibers || []).forEach((c) => {
      const dim = String(c.dimension || 'calibro').toLowerCase();
      if (groups[dim]) groups[dim].push(c);
      else groups.calibro.push(c);
    });
    Object.keys(groups).forEach((k) => {
      groups[k].sort((a, b) => Number(a.mm) - Number(b.mm));
    });
    return groups;
  }, [calibers]);

  const loadCalibers = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const data = await mmCalibersApi.getProductCalibers(productId);
      const list = data.data || data.calibers || (Array.isArray(data) ? data : []);
      setCalibers(list);
      if (onCalibersUpdate) onCalibersUpdate(list);
    } catch (error) {
      console.error('Error loading calibers:', error);
      if (error.response?.status === 500) {
        setApiError('Backend API not implemented for MM Calibers');
        toast.error('Backend API not implemented for MM Calibers');
      } else if (error.response?.status === 404) {
        setApiError('Product not found');
        toast.error('Product not found');
      } else {
        toast.error('Failed to load size options');
      }
    } finally {
      setLoading(false);
    }
  };

  const setDraftField = (dimension, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [dimension]: { ...prev[dimension], [field]: value },
    }));
  };

  const handleAdd = async (dimension) => {
    if (!productId) {
      toast.error('Please save the product first before adding options');
      return;
    }
    const draft = drafts[dimension] || emptyDraft();
    const value = String(draft.value || '').trim();
    if (!value || Number.isNaN(Number(value))) {
      toast.error('Enter a valid mm value');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        dimension,
        mm: value,
        value,
      };
      if (dimension === 'calibro') {
        if (draft.price !== '') payload.price = draft.price;
        if (draft.stock_quantity !== '') payload.stock_quantity = draft.stock_quantity;
      }
      await mmCalibersApi.addCaliberToProduct(productId, payload);
      toast.success('Option added');
      setDrafts((prev) => ({ ...prev, [dimension]: emptyDraft() }));
      await loadCalibers();
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to add option';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const dim = item.dimension || 'calibro';
    if (!window.confirm(`Delete ${dim} ${item.mm} mm?`)) return;
    try {
      setLoading(true);
      const key = item.id || item.mm;
      await mmCalibersApi.deleteCaliber(productId, key, { dimension: dim });
      toast.success('Deleted');
      await loadCalibers();
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to delete';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">MM Calibers / Frame sizes</h3>
        <p className="text-sm text-gray-500 mt-1">
          Calibro, Ponte, Asta and Frame width are <strong>separate</strong> lists — not linked to each other.
          Customers pick each independently on the product page.
        </p>
      </div>

      {apiError && (
        <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200 text-sm text-yellow-800">
          {apiError}
        </div>
      )}

      {!productId && (
        <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200 text-sm text-yellow-800">
          Save the product first before adding size options.
        </div>
      )}

      <div className="px-6 py-5 space-y-6">
        {DIMENSIONS.map((dim) => {
          const items = byDimension[dim.key] || [];
          const draft = drafts[dim.key] || emptyDraft();
          return (
            <div key={dim.key} className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900">{dim.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{dim.hint}</p>
              </div>

              <div className="p-4 space-y-3">
                <div className={`grid gap-2 ${dim.allowPriceStock ? 'grid-cols-1 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
                  <div className={dim.allowPriceStock ? 'sm:col-span-2' : 'sm:col-span-2'}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Value (mm)</label>
                    <input
                      type="text"
                      value={draft.value}
                      onChange={(e) => setDraftField(dim.key, 'value', e.target.value)}
                      placeholder={dim.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAdd(dim.key);
                        }
                      }}
                    />
                  </div>
                  {dim.allowPriceStock && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Price ±</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={draft.price}
                          onChange={(e) => setDraftField(dim.key, 'price', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                        <input
                          type="number"
                          min="0"
                          value={draft.stock_quantity}
                          onChange={(e) => setDraftField(dim.key, 'stock_quantity', e.target.value)}
                          placeholder="—"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={loading || !productId}
                    onClick={() => handleAdd(dim.key)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add {dim.key === 'frame_width' ? 'frame width' : dim.key}
                  </button>
                </div>

                {items.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg">
                    No {dim.key === 'frame_width' ? 'frame width' : dim.key} values yet
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <div
                        key={item.id || `${dim.key}-${item.mm}`}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white pl-3 pr-1.5 py-1 text-sm"
                      >
                        <span className="font-medium text-gray-900">{item.mm} mm</span>
                        {dim.allowPriceStock && item.price != null && item.price !== '' && (
                          <span className="text-xs text-gray-500">€{Number(item.price).toFixed(2)}</span>
                        )}
                        {dim.allowPriceStock && item.stock_quantity != null && item.stock_quantity !== '' && (
                          <span className="text-xs text-gray-500">qty {item.stock_quantity}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded-full"
                          title="Delete"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MMCaliberManager;
