import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { forceLightTheme } from '../utils/theme';

/** Light theme only — re-assert on navigation so nothing leaves the app in a dark state. */
export default function ThemeSync() {
  const { pathname } = useLocation();

  useEffect(() => {
    forceLightTheme();
  }, [pathname]);

  return null;
}
