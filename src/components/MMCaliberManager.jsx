import React, { useMemo, useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { mmCalibersApi } from '../api/mmCalibers';
import { supportsMMCalibers } from '../services/productsService';

const DIMENSION_META = {
  calibro: {
    key: 'calibro',
    title: 'MM Caliber (size)',
    hint: 'Lens width / size options for the PDP Calibro dropdown',
    placeholder: 'e.g. 52',
    allowPriceStock: true,
    addLabel: 'Add size',
    emptyLabel: 'No size values yet',
  },
  ponte: {
    key: 'ponte',
    title: 'Ponte (bridge)',
    hint: 'Bridge options for the PDP Ponte dropdown — independent from size',
    placeholder: 'e.g. 18',
    allowPriceStock: false,
    addLabel: 'Add ponte',
    emptyLabel: 'No ponte values yet',
  },
  asta: {
    key: 'asta',
    title: 'Asta (temple)',
    hint: 'Temple options for the PDP Asta dropdown — independent from size',
    placeholder: 'e.g. 140',
    allowPriceStock: false,
    addLabel: 'Add asta',
    emptyLabel: 'No asta values yet',
  },
  frame_width: {
    key: 'frame_width',
    title: 'Frame width',
    hint: 'Frame-width options for the PDP — independent from size',
    placeholder: 'e.g. 135',
    allowPriceStock: false,
    addLabel: 'Add frame width',
    emptyLabel: 'No frame width values yet',
  },
};

const emptyDraft = () => ({
  value: '',
  price: '',
  stock_quantity: '',
});

/**
 * Single-dimension manager used by separate ProductModal tabs.
 * @param {'calibro'|'ponte'|'asta'|'frame_width'} dimension
 */
const MMCaliberManager = ({
  productId,
  productType,
  dimension = 'calibro',
  onCalibersUpdate,
}) => {
  const meta = DIMENSION_META[dimension] || DIMENSION_META.calibro;
  const supported = supportsMMCalibers(productType);
  const [calibers, setCalibers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());

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
        toast.error('Failed to load options');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supported && productId) loadCalibers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, dimension, supported]);

  const items = useMemo(() => {
    const list = (calibers || []).filter((c) => {
      const dim = String(c.dimension || 'calibro').toLowerCase();
      return dim === meta.key;
    });
    return list.slice().sort((a, b) => Number(a.mm) - Number(b.mm));
  }, [calibers, meta.key]);

  if (!supported) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">These options are only available for sunglasses and eyeglasses products.</p>
      </div>
    );
  }

  const setDraftField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = async () => {
    if (!productId) {
      toast.error('Please save the product first before adding options');
      return;
    }
    const value = String(draft.value || '').trim();
    if (!value || Number.isNaN(Number(value))) {
      toast.error('Enter a valid mm value');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        dimension: meta.key,
        mm: value,
        value,
      };
      if (meta.allowPriceStock) {
        if (draft.price !== '') payload.price = draft.price;
        if (draft.stock_quantity !== '') payload.stock_quantity = draft.stock_quantity;
      }
      await mmCalibersApi.addCaliberToProduct(productId, payload);
      toast.success('Option added');
      setDraft(emptyDraft());
      await loadCalibers();
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to add option';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const dim = item.dimension || meta.key;
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
        <h3 className="text-lg font-semibold text-gray-900">{meta.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{meta.hint}</p>
      </div>

      {apiError && (
        <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200 text-sm text-yellow-800">
          {apiError}
        </div>
      )}

      {!productId && (
        <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200 text-sm text-yellow-800">
          Save the product first before adding options.
        </div>
      )}

      <div className="px-6 py-5 space-y-3">
        <div
          className={`grid gap-2 ${
            meta.allowPriceStock ? 'grid-cols-1 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'
          }`}
        >
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Value (mm)</label>
            <input
              type="text"
              value={draft.value}
              onChange={(e) => setDraftField('value', e.target.value)}
              placeholder={meta.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
          </div>
          {meta.allowPriceStock && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price ±</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.price}
                  onChange={(e) => setDraftField('price', e.target.value)}
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
                  onChange={(e) => setDraftField('stock_quantity', e.target.value)}
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
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <FiPlus className="w-4 h-4" />
            {meta.addLabel}
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg">
            {meta.emptyLabel}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <div
                key={item.id || `${meta.key}-${item.mm}`}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white pl-3 pr-1.5 py-1 text-sm"
              >
                <span className="font-medium text-gray-900">{item.mm} mm</span>
                {meta.allowPriceStock && item.price != null && item.price !== '' && (
                  <span className="text-xs text-gray-500">€{Number(item.price).toFixed(2)}</span>
                )}
                {meta.allowPriceStock && item.stock_quantity != null && item.stock_quantity !== '' && (
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
};

export default MMCaliberManager;
