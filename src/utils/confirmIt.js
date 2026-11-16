/**
 * Admin confirmation dialogs — always Italian.
 * Browser chrome (Ok / Annulla) follows the user's browser language.
 */

export function confirmIt(message) {
  return window.confirm(message);
}

export function confirmDelete(itemLabel = 'questo elemento') {
  return confirmIt(`Sei sicuro di voler eliminare ${itemLabel}?`);
}

export function confirmToggle(actionLabel, name) {
  const action =
    String(actionLabel || '').toLowerCase() === 'activate' ||
    String(actionLabel || '').toLowerCase() === 'attiva'
      ? 'attivare'
      : String(actionLabel || '').toLowerCase() === 'deactivate' ||
          String(actionLabel || '').toLowerCase() === 'disattiva'
        ? 'disattivare'
        : String(actionLabel || 'modificare');
  const label = name ? ` "${name}"` : '';
  return confirmIt(`Sei sicuro di voler ${action}${label}?`);
}
