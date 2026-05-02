import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiLogOut, FiBell, FiSearch, FiUser, FiSettings, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import LanguageSwitcher from './LanguageSwitcher';
import {
  ADMIN_GLOBAL_SEARCH_SCOPES,
  ADMIN_GLOBAL_SEARCH_SCOPE_KEY,
  DEFAULT_ADMIN_SEARCH_SCOPE_ID,
} from '../config/adminGlobalSearch';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [searchScope, setSearchScope] = useState(() => {
    try {
      const saved = localStorage.getItem(ADMIN_GLOBAL_SEARCH_SCOPE_KEY);
      if (saved && ADMIN_GLOBAL_SEARCH_SCOPES.some((s) => s.id === saved)) return saved;
    } catch {
      /* ignore */
    }
    return DEFAULT_ADMIN_SEARCH_SCOPE_ID;
  });
  const isDemoMode = localStorage.getItem('demo_user') !== null;

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_GLOBAL_SEARCH_SCOPE_KEY, searchScope);
    } catch {
      /* ignore */
    }
  }, [searchScope]);

  const handleHeaderSearch = (e) => {
    e.preventDefault();
    const q = headerSearch.trim();
    const scope = ADMIN_GLOBAL_SEARCH_SCOPES.find((s) => s.id === searchScope);
    const path = scope?.path || '/products';
    if (!q) {
      navigate(path);
      return;
    }
    const params = new URLSearchParams();
    params.set('adminSearch', q);
    navigate(`${path}?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm backdrop-blur-lg bg-white/95">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-y-3 min-h-16 py-2 sm:py-0 sm:h-16 sm:min-h-0">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
              aria-label="Toggle sidebar"
            >
              <FiMenu className="w-5 h-5" />
            </button>

            <form
              onSubmit={handleHeaderSearch}
              className="flex flex-1 min-w-0 max-w-2xl items-stretch gap-2"
            >
              <label className="sr-only" htmlFor="admin-search-scope">
                Search in
              </label>
              <select
                id="admin-search-scope"
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value)}
                className="shrink-0 w-[9.5rem] sm:w-36 pl-2 pr-7 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                aria-label="Search in"
              >
                {ADMIN_GLOBAL_SEARCH_SCOPES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <div className="relative flex-1 min-w-0">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                <input
                  type="search"
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  aria-label={t('searchPlaceholder')}
                  className="w-full pl-9 sm:pl-12 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                />
              </div>
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <LanguageSwitcher />

            {isDemoMode && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-xs font-semibold text-amber-800">
                  🔒 {t('demoMode')}
                </span>
              </div>
            )}

            <button
              className="relative p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <FiBell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {user?.first_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{t('administrator')}</p>
                </div>
                <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/profile');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                      <FiUser className="w-4 h-4" />
                      {t('profileSettings')}
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/preferences');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                      <FiSettings className="w-4 h-4" />
                      {t('preferences')}
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
