/**
 * Derive default Name + Display name when user picks a nested subcategory in
 * spherical/astigmatism config forms (avoids manual re-entry when switching line e.g. Daily → Weekly).
 */
export function labelsFromNestedSubcategory(subCat) {
  if (!subCat || typeof subCat !== 'object') return null;
  const parentRaw = subCat._parentName || subCat.parent?.name || '';
  const parent =
    parentRaw && String(parentRaw).trim() !== '' && parentRaw !== 'Unknown Parent'
      ? String(parentRaw).trim()
      : '';
  const leaf = (subCat.name != null ? String(subCat.name) : '').trim();
  if (!parent && !leaf) return null;
  const name = [parent, leaf].filter(Boolean).join(' ').toLowerCase();
  const display_name = parent || leaf;
  return { name, display_name };
}
