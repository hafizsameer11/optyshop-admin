/** App is light-theme only; keep <html> free of `dark` and color-scheme light. */
export const THEME_STORAGE_KEY = 'theme';

export function forceLightTheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('dark');
  root.setAttribute('data-theme', 'light');
  root.style.colorScheme = 'light';
  if (document.body) {
    document.body.classList.remove('dark');
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
  } catch {
    /* ignore */
  }
}
