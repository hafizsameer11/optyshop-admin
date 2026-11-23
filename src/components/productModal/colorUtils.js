/** Color / image helpers for ProductModal (kept small so edits stay safe). */

export const isValidHexCode = (hex) => {
  if (!hex || typeof hex !== 'string') return false;
  return /^#([A-Fa-f0-9]{6})$/.test(hex.trim());
};

/** Saved server image URL — excludes local data:/blob: previews. */
export const isSavedImageUrl = (value) => {
  if (!value || typeof value !== 'string') return false;
  const url = value.trim();
  if (!url) return false;
  if (url.startsWith('data:') || url.startsWith('blob:')) return false;
  return true;
};

/** Reject empty / dummy / unusable color preview URLs. */
export const isUsableImageUrl = (value) => {
  if (!value || typeof value !== 'string') return false;
  const url = value.trim();
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower === 'null' || lower === 'undefined' || lower === 'none' || lower === '-') return false;
  if (url.startsWith('blob:')) return false;
  if (url.startsWith('data:image/')) return true;
  if (/^https?:\/\//i.test(url)) return true;
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) return true;
  return false;
};

/** Grouped searchable color library for product / CL variants. */
export const COLOR_LIBRARY = [
  {
    group: 'Blacks & Neutrals',
    colors: [
      { hex: '#000000', name: 'Black' },
      { hex: '#1A1A1A', name: 'Matte Black' },
      { hex: '#2C2C2C', name: 'Charcoal' },
      { hex: '#4A4A4A', name: 'Dark Gray' },
      { hex: '#808080', name: 'Gray' },
      { hex: '#A8A8A8', name: 'Light Gray' },
      { hex: '#C0C0C0', name: 'Silver' },
      { hex: '#E8E8E8', name: 'Pearl' },
      { hex: '#FFFFFF', name: 'White' },
    ],
  },
  {
    group: 'Browns & Tortoise',
    colors: [
      { hex: '#3D2314', name: 'Dark Brown' },
      { hex: '#5C4033', name: 'Coffee' },
      { hex: '#8B4513', name: 'Brown' },
      { hex: '#A0522D', name: 'Sienna' },
      { hex: '#C4A484', name: 'Tan' },
      { hex: '#D2B48C', name: 'Sand' },
      { hex: '#6B4423', name: 'Tortoise' },
      { hex: '#8B5A2B', name: 'Classic Tortoise' },
      { hex: '#A67B5B', name: 'Light Tortoise' },
      { hex: '#4A3728', name: 'Havana' },
    ],
  },
  {
    group: 'Metals',
    colors: [
      { hex: '#FFD700', name: 'Gold' },
      { hex: '#DAA520', name: 'Antique Gold' },
      { hex: '#B87333', name: 'Copper' },
      { hex: '#CD7F32', name: 'Bronze' },
      { hex: '#B5B5B5', name: 'Brushed Steel' },
      { hex: '#E5E4E2', name: 'Platinum' },
      { hex: '#C9B037', name: 'Champagne' },
      { hex: '#AAA9AD', name: 'Gunmetal' },
    ],
  },
  {
    group: 'Transparent',
    colors: [
      { hex: '#F5F5F5', name: 'Clear' },
      { hex: '#FAF0E6', name: 'Crystal' },
      { hex: '#E8F4F8', name: 'Ice Clear' },
      { hex: '#FFF8DC', name: 'Champagne Clear' },
      { hex: '#F0E68C', name: 'Light Amber Clear' },
      { hex: '#E6E6FA', name: 'Smoke Clear' },
    ],
  },
  {
    group: 'Blues',
    colors: [
      { hex: '#000080', name: 'Navy' },
      { hex: '#1E3A5F', name: 'Dark Blue' },
      { hex: '#0000FF', name: 'Blue' },
      { hex: '#4169E1', name: 'Royal Blue' },
      { hex: '#87CEEB', name: 'Sky Blue' },
      { hex: '#5F9EA0', name: 'Cadet Blue' },
      { hex: '#008080', name: 'Teal' },
      { hex: '#20B2AA', name: 'Light Sea' },
    ],
  },
  {
    group: 'Greens',
    colors: [
      { hex: '#006400', name: 'Dark Green' },
      { hex: '#008000', name: 'Green' },
      { hex: '#2E8B57', name: 'Sea Green' },
      { hex: '#556B2F', name: 'Olive' },
      { hex: '#9ACD32', name: 'Yellow Green' },
      { hex: '#90EE90', name: 'Light Green' },
    ],
  },
  {
    group: 'Reds & Pinks',
    colors: [
      { hex: '#8B0000', name: 'Dark Red' },
      { hex: '#FF0000', name: 'Red' },
      { hex: '#800020', name: 'Burgundy' },
      { hex: '#DC143C', name: 'Crimson' },
      { hex: '#FF69B4', name: 'Hot Pink' },
      { hex: '#FFB6C1', name: 'Light Pink' },
      { hex: '#DB7093', name: 'Pale Violet Red' },
      { hex: '#C71585', name: 'Magenta' },
    ],
  },
  {
    group: 'Purples',
    colors: [
      { hex: '#4B0082', name: 'Indigo' },
      { hex: '#800080', name: 'Purple' },
      { hex: '#9370DB', name: 'Medium Purple' },
      { hex: '#DDA0DD', name: 'Plum' },
      { hex: '#E6E6FA', name: 'Lavender' },
    ],
  },
  {
    group: 'Gradients (approx)',
    colors: [
      { hex: '#2C1810', name: 'Brown Fade' },
      { hex: '#1A1A2E', name: 'Blue Fade' },
      { hex: '#3D2B1F', name: 'Tortoise Fade' },
      { hex: '#4A5568', name: 'Gray Fade' },
      { hex: '#5C3317', name: 'Amber Fade' },
    ],
  },
];

/** Flat list used by quick-pick UI and Contact Lens presets. */
export const PRESET_VARIANT_COLORS = COLOR_LIBRARY.flatMap((g) => g.colors);

const HEX_NAME_LOOKUP = PRESET_VARIANT_COLORS.reduce((acc, { hex, name }) => {
  acc[String(hex).toUpperCase()] = name;
  return acc;
}, {});

export const getHexFromColorName = (colorName) => {
  if (!colorName) return null;
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
    tortoise: '#6B4423',
    tortoiseshell: '#8B5A2B',
    navy: '#000080',
    burgundy: '#800020',
    clear: '#F5F5F5',
    transparent: '#F5F5F5',
    havana: '#4A3728',
    gunmetal: '#AAA9AD',
  };
  const key = String(colorName).toLowerCase().trim();
  if (colorMap[key]) return colorMap[key];
  const fromLib = PRESET_VARIANT_COLORS.find((c) => c.name.toLowerCase() === key);
  return fromLib ? fromLib.hex : null;
};

export const getColorNameFromHex = (hexCode) => {
  if (!hexCode) return 'Unknown';
  const key = String(hexCode).toUpperCase().trim();
  return HEX_NAME_LOOKUP[key] || key;
};

export const filterColorLibrary = (query) => {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return COLOR_LIBRARY;
  return COLOR_LIBRARY.map((group) => ({
    ...group,
    colors: group.colors.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.hex.toLowerCase().includes(q) ||
        group.group.toLowerCase().includes(q)
    ),
  })).filter((g) => g.colors.length > 0);
};

/**
 * Normalize product.color_images whether API returns:
 * - array: [{ hexCode, name, price, images }]
 * - object keyed by hex/name
 * - JSON string
 * Using Object.keys() on an array treated "0","1" as hex codes and wiped colors on edit.
 */
export const normalizeColorImagesList = (raw) => {
  if (!raw) return [];
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!parsed || typeof parsed !== 'object') return [];

  const out = [];
  const pushEntry = (hexHint, colorData) => {
    let hexCode = String(hexHint || '').trim().toUpperCase();
    if (!isValidHexCode(hexCode) && colorData && typeof colorData === 'object' && !Array.isArray(colorData)) {
      hexCode = String(colorData.hexCode || colorData.hex_code || '').trim().toUpperCase();
    }
    if (!isValidHexCode(hexCode)) {
      const fromName = getHexFromColorName(String(hexHint || ''));
      if (fromName) hexCode = fromName.toUpperCase();
    }
    if (!isValidHexCode(hexCode)) return;

    let imageUrls = [];
    if (Array.isArray(colorData?.images)) imageUrls = colorData.images;
    else if (Array.isArray(colorData)) imageUrls = colorData;
    else if (typeof colorData === 'string') imageUrls = [colorData];

    const images = imageUrls
      .map((url) => (typeof url === 'string' ? url.trim() : ''))
      .filter((url) => isUsableImageUrl(url));

    const stockQty =
      colorData && !Array.isArray(colorData) && colorData.stock_quantity != null && colorData.stock_quantity !== ''
        ? Number(colorData.stock_quantity)
        : null;
    const barcode =
      colorData && !Array.isArray(colorData)
        ? String(colorData.barcode || colorData.bar_code || '').trim() || null
        : null;
    const purchaseCode =
      colorData && !Array.isArray(colorData)
        ? String(colorData.purchase_code || colorData.purchaseCode || '').trim() || null
        : null;

    // Keep color rows that have images OR stock OR codes (admin can add photos later)
    if (images.length === 0 && stockQty == null && !barcode && !purchaseCode) {
      // Still keep if name-only entry from pending variants — handled by UI pendingVariantHexes
      if (!(colorData && !Array.isArray(colorData) && (colorData.name || colorData.display_name))) {
        return;
      }
    }

    out.push({
      hexCode,
      name:
        (colorData && !Array.isArray(colorData) && (colorData.name || colorData.display_name)) ||
        getColorNameFromHex(hexCode),
      display_name:
        (colorData && !Array.isArray(colorData) && (colorData.display_name || colorData.name)) ||
        getColorNameFromHex(hexCode),
      price: colorData && !Array.isArray(colorData) && colorData.price != null ? colorData.price : null,
      stock_quantity: Number.isFinite(stockQty) ? stockQty : null,
      stock_status:
        (colorData && !Array.isArray(colorData) && colorData.stock_status) ||
        (Number.isFinite(stockQty) ? (stockQty > 0 ? 'in_stock' : 'out_of_stock') : null),
      barcode,
      purchase_code: purchaseCode,
      images,
    });
  };

  if (Array.isArray(parsed)) {
    parsed.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      pushEntry(item.hexCode || item.hex_code, item);
    });
  } else {
    Object.keys(parsed).forEach((key) => {
      pushEntry(key, parsed[key]);
    });
  }

  // Merge duplicate hex rows (same color saved as multiple entries)
  const mergedByHex = {};
  out.forEach((entry) => {
    const hex = String(entry.hexCode || '').toUpperCase();
    if (!mergedByHex[hex]) {
      mergedByHex[hex] = {
        hexCode: hex,
        name: entry.name,
        display_name: entry.display_name || entry.name,
        price: entry.price,
        stock_quantity: entry.stock_quantity != null ? entry.stock_quantity : null,
        stock_status: entry.stock_status || null,
        barcode: entry.barcode || null,
        purchase_code: entry.purchase_code || null,
        images: [],
      };
    }
    (entry.images || []).forEach((url) => {
      if (isUsableImageUrl(url) && !mergedByHex[hex].images.includes(url)) {
        mergedByHex[hex].images.push(url);
      }
    });
    if (entry.price != null && mergedByHex[hex].price == null) {
      mergedByHex[hex].price = entry.price;
    }
    if (entry.stock_quantity != null && mergedByHex[hex].stock_quantity == null) {
      mergedByHex[hex].stock_quantity = entry.stock_quantity;
    }
    if (entry.stock_status && !mergedByHex[hex].stock_status) {
      mergedByHex[hex].stock_status = entry.stock_status;
    }
    if (entry.barcode && !mergedByHex[hex].barcode) {
      mergedByHex[hex].barcode = entry.barcode;
    }
    if (entry.purchase_code && !mergedByHex[hex].purchase_code) {
      mergedByHex[hex].purchase_code = entry.purchase_code;
    }
    if (entry.name && (!mergedByHex[hex].name || mergedByHex[hex].name === getColorNameFromHex(hex))) {
      mergedByHex[hex].name = entry.name;
      mergedByHex[hex].display_name = entry.display_name || entry.name;
    }
  });
  return Object.values(mergedByHex);
};

/** Build color_images payload to KEEP on update — never drop untouched colors. */
export const buildColorImagesToKeep = (imagesWithColors, existingColorImages, pendingVariantHexes = []) => {
  const byHex = {};
  const FileConstructor = typeof File !== 'undefined' ? File : null;

  (existingColorImages || []).forEach((colorImg) => {
    const hex = String(colorImg?.hexCode || '').trim().toUpperCase();
    if (!isValidHexCode(hex)) return;
    const stockQty = colorImg.stock_quantity != null && colorImg.stock_quantity !== ''
      ? Number(colorImg.stock_quantity)
      : null;
    byHex[hex] = {
      hexCode: hex,
      name: colorImg.name || colorImg.display_name || getColorNameFromHex(hex),
      display_name: colorImg.display_name || colorImg.name || getColorNameFromHex(hex),
      price: colorImg.price != null ? colorImg.price : null,
      stock_quantity: Number.isFinite(stockQty) ? stockQty : null,
      stock_status:
        colorImg.stock_status ||
        (Number.isFinite(stockQty) ? (stockQty > 0 ? 'in_stock' : 'out_of_stock') : null),
      barcode: colorImg.barcode ? String(colorImg.barcode).trim() : null,
      purchase_code: colorImg.purchase_code ? String(colorImg.purchase_code).trim() : null,
      images: [],
    };
  });

  (pendingVariantHexes || []).forEach((raw) => {
    const hex = String(raw || '').trim().toUpperCase();
    if (!isValidHexCode(hex)) return;
    if (!byHex[hex]) {
      byHex[hex] = {
        hexCode: hex,
        name: getColorNameFromHex(hex),
        display_name: getColorNameFromHex(hex),
        price: null,
        stock_quantity: null,
        stock_status: null,
        barcode: null,
        purchase_code: null,
        images: [],
      };
    }
  });

  (imagesWithColors || []).forEach((img) => {
    const hex = String(img?.hexCode || '').trim().toUpperCase();
    if (!isValidHexCode(hex)) return;
    if (!byHex[hex]) {
      byHex[hex] = {
        hexCode: hex,
        name: getColorNameFromHex(hex),
        display_name: getColorNameFromHex(hex),
        price: null,
        stock_quantity: null,
        stock_status: null,
        barcode: null,
        purchase_code: null,
        images: [],
      };
    }
    if (isUsableImageUrl(img.preview) && isSavedImageUrl(img.preview) && !byHex[hex].images.includes(img.preview)) {
      byHex[hex].images.push(img.preview);
    }
  });

  return Object.values(byHex).filter((entry) => {
    if (entry.images.length > 0) return true;
    if (entry.stock_quantity != null) return true;
    if (entry.barcode || entry.purchase_code) return true;
    return (imagesWithColors || []).some(
      (img) =>
        String(img?.hexCode || '').toUpperCase() === entry.hexCode &&
        FileConstructor &&
        img.file instanceof FileConstructor
    ) || (pendingVariantHexes || []).some((h) => String(h || '').toUpperCase() === entry.hexCode);
  });
};

/** Convert normalized color list into UI rows for ProductModal. */
export const colorListToUiState = (normalized) => {
  const imagesWithHexCodes = [];
  let imageIdCounter = 0;
  (normalized || []).forEach((color) => {
    (color.images || []).forEach((imageUrl) => {
      if (!isUsableImageUrl(imageUrl)) return;
      imagesWithHexCodes.push({
        id: `existing-${imageIdCounter++}`,
        file: null,
        preview: imageUrl,
        hexCode: color.hexCode,
        isExisting: true,
      });
    });
  });
  return {
    existingColorImages: normalized || [],
    imagesWithColors: imagesWithHexCodes,
  };
};
