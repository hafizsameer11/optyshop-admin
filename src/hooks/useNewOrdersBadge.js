import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';
import { API_ROUTES } from '../config/apiRoutes';

const STORAGE_KEY = 'optyshop_admin_orders_last_seen_id';

export function getLastSeenOrderId() {
  const n = Number(localStorage.getItem(STORAGE_KEY) || '0');
  return Number.isFinite(n) ? n : 0;
}

export function markOrdersSeen(maxId) {
  const current = getLastSeenOrderId();
  const next = Math.max(current, Number(maxId) || 0);
  localStorage.setItem(STORAGE_KEY, String(next));
  window.dispatchEvent(new CustomEvent('optyshop:orders-seen', { detail: { id: next } }));
}

/**
 * Poll for orders newer than last-seen id. Shows a notification dot for new shop orders.
 */
export default function useNewOrdersBadge(pollMs = 30000) {
  const [newCount, setNewCount] = useState(0);
  const [latestId, setLatestId] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const response = await api.get(`${API_ROUTES.ADMIN.ORDERS.LIST}?page=1&limit=20`);
      const data = response.data?.data || response.data || {};
      const orders = data.orders || [];
      const lastSeen = getLastSeenOrderId();
      let maxId = lastSeen;
      let count = 0;
      for (const o of orders) {
        const id = Number(o.id) || 0;
        if (id > maxId) maxId = id;
        if (id > lastSeen) count += 1;
      }
      setLatestId(maxId);
      setNewCount(count);
    } catch (e) {
      // keep previous badge on transient errors
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, pollMs);
    const onSeen = () => refresh();
    window.addEventListener('optyshop:orders-seen', onSeen);
    window.addEventListener('focus', onSeen);
    return () => {
      clearInterval(t);
      window.removeEventListener('optyshop:orders-seen', onSeen);
      window.removeEventListener('focus', onSeen);
    };
  }, [refresh, pollMs]);

  return { newCount, latestId, refresh, markSeen: markOrdersSeen };
}
