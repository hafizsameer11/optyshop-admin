const fs = require('fs');
const path = require('path');

function patch(abs, apply) {
  const raw = fs.readFileSync(abs, 'utf8');
  const hadCrlf = raw.includes('\r\n');
  let t = raw.replace(/\r\n/g, '\n');
  t = apply(t);
  fs.writeFileSync(abs, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
  console.log('OK', path.relative(process.cwd(), abs));
}

const root = path.join(__dirname, '..');

// --- util ---
const utilPath = path.join(root, 'src', 'utils', 'orderAddress.js');
fs.writeFileSync(
  utilPath,
  `/**
 * Checkout stores first_name/address/zip_code; admin UI historically used street/zip.
 * Normalize either shape (and JSON strings) for display.
 */
export function parseOrderAddress(raw) {
  if (!raw) return null;
  let addr = raw;
  if (typeof raw === 'string') {
    try { addr = JSON.parse(raw); } catch { return null; }
  }
  if (!addr || typeof addr !== 'object' || Array.isArray(addr)) return null;
  return addr;
}

export function normalizeOrderAddress(raw) {
  const addr = parseOrderAddress(raw);
  if (!addr) return null;

  const first = addr.first_name || addr.firstName || '';
  const last = addr.last_name || addr.lastName || '';
  const name = [first, last].filter(Boolean).join(' ').trim()
    || addr.name
    || addr.full_name
    || '';

  const street = addr.street || addr.address || addr.address_line1 || addr.line1 || '';
  const city = addr.city || '';
  const state = addr.state || addr.province || addr.region || '';
  const zip = addr.zip || addr.zip_code || addr.postal_code || addr.postcode || '';
  const country = addr.country || '';
  const email = addr.email || '';
  const phone = addr.phone || addr.phone_number || '';

  const hasAny = name || street || city || state || zip || country || email || phone;
  if (!hasAny) return null;

  return { name, street, city, state, zip, country, email, phone };
}

export function formatOrderAddressLines(raw) {
  const a = normalizeOrderAddress(raw);
  if (!a) return [];
  const lines = [];
  if (a.name) lines.push(a.name);
  if (a.street) lines.push(a.street);
  const cityLine = [a.city, a.state, a.zip].filter(Boolean).join(', ');
  if (cityLine) lines.push(cityLine);
  if (a.country) lines.push(a.country);
  if (a.email) lines.push(a.email);
  if (a.phone) lines.push(a.phone);
  return lines;
}
`
);
console.log('OK wrote orderAddress.js');

const hookPath = path.join(root, 'src', 'hooks', 'useNewOrdersBadge.js');
fs.mkdirSync(path.dirname(hookPath), { recursive: true });
fs.writeFileSync(
  hookPath,
  `import { useCallback, useEffect, useState } from 'react';
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
      const response = await api.get(\`\${API_ROUTES.ADMIN.ORDERS.LIST}?page=1&limit=20\`);
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
`
);
console.log('OK wrote useNewOrdersBadge.js');

// --- OrderModal address display ---
patch(path.join(root, 'src/components/OrderModal.jsx'), (t) => {
  if (!t.includes("from '../utils/orderAddress'")) {
    t = t.replace(
      "import AdminOrderTransactionsList from './admin/OrderTransactionsList';",
      "import AdminOrderTransactionsList from './admin/OrderTransactionsList';\nimport { formatOrderAddressLines, normalizeOrderAddress } from '../utils/orderAddress';"
    );
  }

  const oldBlock = `            {/* Shipping & Billing Addresses */}
            {(orderData?.shipping_address || orderData?.billing_address) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Address */}
                {orderData?.shipping_address && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('shippingAddress')}</h3>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-lg border border-green-200 shadow-sm">
                      <div className="space-y-1 text-sm text-gray-700">
                        {orderData.shipping_address.street && (
                          <p className="font-medium">{orderData.shipping_address.street}</p>
                        )}
                        <p>
                          {orderData.shipping_address.city && \`\${orderData.shipping_address.city}, \`}
                          {orderData.shipping_address.state} {orderData.shipping_address.zip}
                        </p>
                        {orderData.shipping_address.country && (
                          <p className="font-semibold text-gray-900">{orderData.shipping_address.country}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing Address */}
                {orderData?.billing_address && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('billingAddress')}</h3>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200 shadow-sm">
                      <div className="space-y-1 text-sm text-gray-700">
                        {orderData.billing_address.street && (
                          <p className="font-medium">{orderData.billing_address.street}</p>
                        )}
                        <p>
                          {orderData.billing_address.city && \`\${orderData.billing_address.city}, \`}
                          {orderData.billing_address.state} {orderData.billing_address.zip}
                        </p>
                        {orderData.billing_address.country && (
                          <p className="font-semibold text-gray-900">{orderData.billing_address.country}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}`;

  const newBlock = `            {/* Shipping & Billing Addresses */}
            {(() => {
              const shippingLines = formatOrderAddressLines(orderData?.shipping_address);
              const billingLines = formatOrderAddressLines(orderData?.billing_address);
              if (shippingLines.length === 0 && billingLines.length === 0) return null;
              return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {shippingLines.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('shippingAddress')}</h3>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-lg border border-green-200 shadow-sm">
                      <div className="space-y-1 text-sm text-gray-700">
                        {shippingLines.map((line, i) => (
                          <p key={i} className={i === 0 ? 'font-medium text-gray-900' : ''}>{line}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {billingLines.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('billingAddress')}</h3>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200 shadow-sm">
                      <div className="space-y-1 text-sm text-gray-700">
                        {billingLines.map((line, i) => (
                          <p key={i} className={i === 0 ? 'font-medium text-gray-900' : ''}>{line}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              );
            })()}`;

  if (!t.includes(oldBlock)) {
    if (t.includes('formatOrderAddressLines(orderData')) console.log('OrderModal address already');
    else throw new Error('OrderModal address block missing');
  } else {
    t = t.replace(oldBlock, newBlock);
  }

  // Normalize after fetch so rest of modal also works
  const oldFetch = `      if (orderDetails) {
        setOrderData(orderDetails);
        setStatus(orderDetails.status);
      }`;
  const newFetch = `      if (orderDetails) {
        const shipping = normalizeOrderAddress(orderDetails.shipping_address);
        const billing = normalizeOrderAddress(orderDetails.billing_address);
        setOrderData({
          ...orderDetails,
          shipping_address: shipping || orderDetails.shipping_address,
          billing_address: billing || orderDetails.billing_address,
        });
        setStatus(orderDetails.status);
      }`;
  if (t.includes(oldFetch)) t = t.replace(oldFetch, newFetch);

  return t;
});

// --- Sidebar badge ---
patch(path.join(root, 'src/components/Sidebar.jsx'), (t) => {
  if (!t.includes('useNewOrdersBadge')) {
    t = t.replace(
      "import { useI18n } from '../context/I18nContext';",
      "import { useI18n } from '../context/I18nContext';\nimport useNewOrdersBadge from '../hooks/useNewOrdersBadge';"
    );
  }
  if (!t.includes('const { newCount: newOrdersCount }')) {
    t = t.replace(
      '  const [openSubmenus, setOpenSubmenus] = useState({',
      '  const { newCount: newOrdersCount } = useNewOrdersBadge();\n  const [openSubmenus, setOpenSubmenus] = useState({'
    );
  }

  const oldLinkInner = `                      <Icon className={\`w-5 h-5 flex-shrink-0 \${active ? 'text-indigo-600' : 'text-gray-500'}\`} />
                      {isOpen && (
                        <span className={\`text-sm font-medium \${active ? 'font-semibold' : ''}\`}>
                          {label}
                        </span>
                      )}
                    </Link>`;
  const newLinkInner = `                      <span className="relative flex-shrink-0">
                        <Icon className={\`w-5 h-5 \${active ? 'text-indigo-600' : 'text-gray-500'}\`} />
                        {path === '/orders' && newOrdersCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[0.5rem] h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                        )}
                      </span>
                      {isOpen && (
                        <span className={\`text-sm font-medium flex items-center gap-2 \${active ? 'font-semibold' : ''}\`}>
                          {label}
                          {path === '/orders' && newOrdersCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                              {newOrdersCount > 99 ? '99+' : newOrdersCount}
                            </span>
                          )}
                        </span>
                      )}
                    </Link>`;
  if (!t.includes(oldLinkInner)) {
    if (t.includes("path === '/orders' && newOrdersCount")) console.log('sidebar badge already');
    else throw new Error('sidebar link inner missing');
  } else {
    t = t.replace(oldLinkInner, newLinkInner);
  }
  return t;
});

// --- Header bell: real new-order dot + navigate ---
patch(path.join(root, 'src/components/Header.jsx'), (t) => {
  if (!t.includes('useNewOrdersBadge')) {
    t = t.replace(
      "import {",
      "import useNewOrdersBadge from '../hooks/useNewOrdersBadge';\nimport {"
    );
    // fragile - check
    if (!t.includes("import useNewOrdersBadge from '../hooks/useNewOrdersBadge';")) {
      t = t.replace(
        "import LanguageSwitcher from './LanguageSwitcher';",
        "import LanguageSwitcher from './LanguageSwitcher';\nimport useNewOrdersBadge from '../hooks/useNewOrdersBadge';"
      );
    }
  }
  if (!t.includes('newOrdersCount')) {
    t = t.replace(
      '  const [showUserMenu, setShowUserMenu] = useState(false);',
      '  const [showUserMenu, setShowUserMenu] = useState(false);\n  const { newCount: newOrdersCount } = useNewOrdersBadge();'
    );
  }

  const oldBell = `            <button
              className="relative p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <FiBell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>`;
  const newBell = `            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="relative p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={newOrdersCount > 0 ? \`\${newOrdersCount} new orders\` : 'Notifications'}
              title={newOrdersCount > 0 ? \`\${newOrdersCount} new order(s)\` : 'Orders'}
            >
              <FiBell className="w-5 h-5" />
              {newOrdersCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
            </button>`;
  if (!t.includes(oldBell)) {
    if (t.includes('newOrdersCount > 0 &&')) console.log('header bell already');
    else throw new Error('header bell missing');
  } else {
    t = t.replace(oldBell, newBell);
  }
  return t;
});

// --- Orders page marks seen ---
patch(path.join(root, 'src/pages/Orders.jsx'), (t) => {
  if (!t.includes('markOrdersSeen')) {
    // add import after api import-ish
    if (t.includes("from '../config/apiRoutes'")) {
      t = t.replace(
        "from '../config/apiRoutes';",
        "from '../config/apiRoutes';\nimport { markOrdersSeen } from '../hooks/useNewOrdersBadge';"
      );
    } else if (t.includes('from "../config/apiRoutes"')) {
      t = t.replace(
        'from "../config/apiRoutes";',
        'from "../config/apiRoutes";\nimport { markOrdersSeen } from "../hooks/useNewOrdersBadge";'
      );
    } else {
      throw new Error('cannot find apiRoutes import in Orders.jsx');
    }
  }

  const markSnippet = `      setOrders(Array.isArray(ordersData) ? ordersData : []);`;
  const markNew = `      const list = Array.isArray(ordersData) ? ordersData : [];
      setOrders(list);
      const maxId = list.reduce((m, o) => Math.max(m, Number(o.id) || 0), 0);
      if (maxId > 0) markOrdersSeen(maxId);`;
  if (t.includes(markSnippet) && !t.includes('markOrdersSeen(maxId)')) {
    t = t.replace(markSnippet, markNew);
  }
  return t;
});

console.log('Admin patches done');
