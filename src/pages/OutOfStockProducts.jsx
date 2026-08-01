import React, { useState, useEffect, useMemo } from 'react';
import { FiAlertCircle, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const OutOfStockProducts = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ROUTES.ADMIN.PRODUCTS.OUT_OF_STOCK);
      const data = response.data?.data || response.data || {};
      const list = data.items || data.products || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Out of stock API error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot fetch out of stock items');
      } else if (error.response.status === 401) {
        toast.error('Please log in with real credentials');
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch out of stock products');
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const hay = [
        item.product_name,
        item.sku,
        item.model,
        item.color,
        item.caliber_mm,
        item.size,
        item.variant_type,
        item.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, search]);

  const variantLabel = (item) => {
    if (item.variant_type === 'mm_caliber') return 'Caliber / MM';
    if (item.variant_type === 'size_volume') return 'Size / Pack';
    if (item.variant_type === 'color') return 'Color';
    return 'Product';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiAlertCircle className="text-red-500" />
            Out of Stock Products
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Products and variants with stock quantity 0. They stay visible on the website but cannot be purchased until restocked.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchItems}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="relative max-w-md w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, model, color, size…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-red-600">{filtered.length}</span> item{filtered.length === 1 ? '' : 's'}
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading out of stock items…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            {items.length === 0
              ? 'No out-of-stock products right now.'
              : 'No items match your search.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Product name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Model / SKU</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Color</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Caliber / Size</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Stock</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtered.map((item, index) => (
                  <tr key={`${item.product_id}-${item.variant_type}-${item.caliber_mm || item.size || item.color || 'base'}-${index}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.product_name}</div>
                      {item.category && (
                        <div className="text-xs text-gray-500">{item.category}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>{item.model || '—'}</div>
                      {item.sku && item.sku !== item.model && (
                        <div className="text-xs text-gray-500">{item.sku}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.color || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.caliber_mm
                        ? `${item.caliber_mm}mm`
                        : item.size || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                        {variantLabel(item)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-red-600">{item.stock_quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/products?edit=${item.product_id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                      >
                        Restock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutOfStockProducts;
