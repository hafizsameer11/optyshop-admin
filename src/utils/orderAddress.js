/**
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
