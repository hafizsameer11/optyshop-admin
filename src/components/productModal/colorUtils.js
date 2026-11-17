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
    tortoise: '#8B4513',
    tortoiseshell: '#8B4513',
    navy: '#000080',
    burgundy: '#800020',
    clear: '#FFFFFF',
    transparent: '#FFFFFF',
  };
  return colorMap[String(colorName).toLowerCase().trim()] || null;
};

export const getColorNameFromHex = (hexCode) => {
  if (!hexCode) return 'Unknown';
  const hexMap = {
    '#000000': 'Black',
    '#FFFFFF': 'White',
    '#8B4513': 'Brown',
    '#0000FF': 'Blue',
    '#FF0000': 'Red',
    '#008000': 'Green',
    '#808080': 'Gray',
    '#FFD700': 'Gold',
    '#C0C0C0': 'Silver',
    '#000080': 'Navy',
    '#800020': 'Burgundy',
  };
  return hexMap[String(hexCode).toUpperCase().trim()] || hexCode;
};

export const PRESET_VARIANT_COLORS = [
  { hex: '#000000', name: 'Black' },
  { hex: '#8B4513', name: 'Brown' },
  { hex: '#0000FF', name: 'Blue' },
  { hex: '#FF0000', name: 'Red' },
  { hex: '#008000', name: 'Green' },
  { hex: '#808080', name: 'Gray' },
  { hex: '#FFD700', name: 'Gold' },
  { hex: '#C0C0C0', name: 'Silver' },
];

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
    if (images.length === 0) return;

    out.push({
      hexCode,
      name: (colorData && !Array.isArray(colorData) && colorData.name) || getColorNameFromHex(hexCode),
      price: colorData && !Array.isArray(colorData) && colorData.price != null ? colorData.price : null,
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
        price: entry.price,
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
  });
  return Object.values(mergedByHex);
};

/** Build color_images payload to KEEP on update — never drop untouched colors. */
export const buildColorImagesToKeep = (imagesWithColors, existingColorImages) => {
  const byHex = {};
  const FileConstructor = typeof File !== 'undefined' ? File : null;

  (existingColorImages || []).forEach((colorImg) => {
    const hex = String(colorImg?.hexCode || '').trim().toUpperCase();
    if (!isValidHexCode(hex)) return;
    byHex[hex] = {
      hexCode: hex,
      name: colorImg.name || getColorNameFromHex(hex),
      price: colorImg.price != null ? colorImg.price : null,
      images: [],
    };
  });

  (imagesWithColors || []).forEach((img) => {
    const hex = String(img?.hexCode || '').trim().toUpperCase();
    if (!isValidHexCode(hex)) return;
    if (!byHex[hex]) {
      byHex[hex] = {
        hexCode: hex,
        name: getColorNameFromHex(hex),
        price: null,
        images: [],
      };
    }
    if (isUsableImageUrl(img.preview) && isSavedImageUrl(img.preview) && !byHex[hex].images.includes(img.preview)) {
      byHex[hex].images.push(img.preview);
    }
  });

  return Object.values(byHex).filter((entry) => {
    if (entry.images.length > 0) return true;
    return (imagesWithColors || []).some(
      (img) =>
        String(img?.hexCode || '').toUpperCase() === entry.hexCode &&
        FileConstructor &&
        img.file instanceof FileConstructor
    );
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
