import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiShoppingBag,
  FiShoppingCart,
  FiUsers,
  FiGrid,
  FiLayers,
  FiEye,
  FiTag,
  FiFileText,
  FiTrendingUp,
  FiSettings,
  FiImage,
  FiMessageSquare,
  FiFile,
  FiStar,
  FiZap,
  FiBox,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiInbox,
  FiBriefcase,
  FiDollarSign,
  FiBarChart2,
  FiGlobe,
  FiDroplet,
  FiShield,
  FiPackage,
  FiFolder,
  FiFolderPlus,
  FiAperture,
  FiActivity,
  FiTruck,
  FiLogOut,
  FiMenu,
  FiAward
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [openSubmenus, setOpenSubmenus] = useState({
    catalog: false,
    prescription: false,
    marketing: false,
    content: false,
    forms: false
  });

  const toggleSubmenu = (key) => {
    if (!isOpen) return;
    setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const menuSections = [
    {
      type: 'item',
      item: { path: '/', icon: FiHome, label: t('dashboard') }
    },
    {
      type: 'divider',
      label: t('coreManagement')
    },
    {
      type: 'item',
      item: { path: '/products', icon: FiShoppingBag, label: t('products') }
    },
    {
      type: 'item',
      item: { path: '/orders', icon: FiShoppingCart, label: t('orders') }
    },
    {
      type: 'item',
      item: { path: '/users', icon: FiUsers, label: t('users') }
    },
    {
      type: 'divider',
      label: t('catalog')
    },
    {
      type: 'group',
      key: 'catalog',
      label: t('categories'),
      icon: FiFolder,
      children: [
        { path: '/categories', icon: FiGrid, label: t('categories') },
        { path: '/subcategories', icon: FiFolderPlus, label: t('subCategories') },
      ]
    },
    {
      type: 'divider',
      label: t('prescriptions')
    },
    {
      type: 'group',
      key: 'prescription',
      label: t('prescription'),
      icon: FiFileText,
      children: [
        { path: '/prescriptions', icon: FiFileText, label: t('prescriptions') },
      ]
    },
    {
      type: 'divider',
      label: t('marketing')
    },
    {
      type: 'group',
      key: 'marketing',
      label: t('marketing'),
      icon: FiTrendingUp,
      children: [
        { path: '/coupons', icon: FiTag, label: t('coupons') },
        { path: '/campaigns', icon: FiTrendingUp, label: t('campaigns') },
        { path: '/banners', icon: FiImage, label: t('banners') },
        { path: '/brands', icon: FiAward, label: t('brands') },
      ]
    },
    {
      type: 'divider',
      label: t('content')
    },
    {
      type: 'group',
      key: 'content',
      label: t('contentManagement'),
      icon: FiFile,
      children: [
        { path: '/blog', icon: FiFileText, label: t('blogPosts') },
        { path: '/faqs', icon: FiMessageSquare, label: t('faqs') },
        { path: '/pages', icon: FiFile, label: t('pages') },
        { path: '/testimonials', icon: FiStar, label: t('testimonials') },
      ]
    },
    {
      type: 'divider',
      label: t('operations')
    },
    {
      type: 'item',
      item: { path: '/shipping-methods', icon: FiTruck, label: t('shippingMethods') }
    },
    {
      type: 'item',
      item: { path: '/jobs', icon: FiBriefcase, label: t('jobs') }
    },
    {
      type: 'group',
      key: 'forms',
      label: t('websiteForms'),
      icon: FiInbox,
      children: [
        { path: '/forms/contact', label: t('contactRequests') },
        { path: '/forms/demo', label: t('demoRequests') },
        { path: '/forms/pricing', label: t('pricingRequests') },
        { path: '/forms/credentials', label: t('credentialsRequests') },
        { path: '/forms/support', label: t('supportRequests') },
        { path: '/forms/job-applications', label: t('jobApplications') },
      ]
    },
    {
      type: 'divider',
      label: t('analytics')
    },
    {
      type: 'item',
      item: { path: '/transactions', icon: FiDollarSign, label: t('transactions') }
    },
    {
      type: 'item',
      item: { path: '/analytics', icon: FiBarChart2, label: t('analytics') }
    },
    {
      type: 'item',
      item: { path: '/overview', icon: FiActivity, label: t('overview') }
    },
    {
      type: 'item',
      item: { path: '/simulations', icon: FiZap, label: t('simulations') }
    },
  ];

  const isActive = (path) => location.pathname === path;
  const isParentActive = (children) => children?.some(child => location.pathname === child.path);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-r border-indigo-500/20 dark:border-gray-700 shadow-2xl z-50 transition-all duration-300 ease-in-out ${isOpen
            ? 'w-72 translate-x-0'
            : 'w-20 -translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between h-20 px-4 border-b border-white/10 backdrop-blur-sm bg-white/5">
            <div className={`flex items-center gap-3 ${!isOpen && 'lg:justify-center w-full'}`}>
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md shadow-lg border border-white/30 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">O</span>
              </div>
              {isOpen && (
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-white drop-shadow-lg">OptyShop</h1>
                  <p className="text-xs text-white/80 font-medium">{t('adminPanel')}</p>
                </div>
              )}
            </div>
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg text-white/90 hover:bg-white/20 hover:text-white transition-all duration-200 ${!isOpen && 'lg:mx-auto'}`}
              aria-label="Toggle sidebar"
            >
              {isOpen ? (
                <FiX className="w-5 h-5" />
              ) : (
                <FiMenu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 sidebar-scrollbar">
            <div className="space-y-1">
              {menuSections.map((section, index) => {
                if (section.type === 'divider') {
                  return isOpen ? (
                    <div key={`divider-${index}`} className="px-4 py-3 mt-4">
                      <p className="text-xs font-bold text-white/60 uppercase tracking-widest">
                        {section.label}
                      </p>
                    </div>
                  ) : (
                    <div key={`divider-${index}`} className="h-px bg-white/10 my-3"></div>
                  );
                }

                if (section.type === 'item') {
                  const { path, icon: Icon, label } = section.item;
                  const active = isActive(path);

                  return (
                    <Link
                      key={path}
                      to={path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
                          ? 'bg-white/20 backdrop-blur-md text-white shadow-lg border border-white/30'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                        } ${!isOpen && 'lg:justify-center'}`}
                      title={!isOpen ? label : ''}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-white/70'}`} />
                      {isOpen && (
                        <span className={`text-sm font-medium ${active ? 'font-semibold text-white' : ''}`}>
                          {label}
                        </span>
                      )}
                    </Link>
                  );
                }

                if (section.type === 'group') {
                  const { key, label, icon: Icon, children } = section;
                  const isOpenSubmenu = openSubmenus[key];
                  const hasActiveChild = isParentActive(children);

                  return (
                    <div key={key}>
                      <button
                        onClick={() => toggleSubmenu(key)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${hasActiveChild
                            ? 'bg-white/20 backdrop-blur-md text-white shadow-lg border border-white/30'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                          } ${!isOpen && 'lg:justify-center'}`}
                        title={!isOpen ? label : ''}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 flex-shrink-0 ${hasActiveChild ? 'text-white' : 'text-white/70'}`} />
                          {isOpen && (
                            <span className={`text-sm font-medium ${hasActiveChild ? 'font-semibold text-white' : ''}`}>
                              {label}
                            </span>
                          )}
                        </div>
                        {isOpen && (
                          <FiChevronDown
                            className={`w-4 h-4 transition-transform text-white/70 ${isOpenSubmenu ? 'rotate-180' : ''}`}
                          />
                        )}
                      </button>

                      {isOpen && isOpenSubmenu && children && (
                        <div className="ml-6 mt-2 space-y-1 border-l-2 border-white/20 pl-4">
                          {children.map((child) => {
                            const childActive = isActive(child.path);
                            const ChildIcon = child.icon || FiFile;

                            return (
                              <Link
                                key={child.path}
                                to={child.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${childActive
                                    ? 'bg-white/15 text-white shadow-md border border-white/20 font-semibold'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                  }`}
                              >
                                <ChildIcon className="w-4 h-4 flex-shrink-0" />
                                <span className={`text-sm ${childActive ? 'font-semibold' : ''}`}>
                                  {child.label}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </nav>

          {/* User Section & Logout */}
          <div className="border-t border-white/10 p-4 mt-auto backdrop-blur-sm bg-white/5">
            {isOpen && user && (
              <div className="mb-3 px-2">
                <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-semibold text-base flex-shrink-0 border border-white/30 shadow-md">
                    {user?.first_name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate drop-shadow-sm">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-white/80 font-medium">{t('administrator')}</p>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={logout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-white bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-500 hover:to-red-600 border border-red-400/30 hover:border-red-400/50 shadow-lg hover:shadow-xl backdrop-blur-sm ${!isOpen && 'lg:justify-center'
                }`}
              title={!isOpen ? t('logout') : ''}
            >
              <FiLogOut className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="text-sm font-semibold">{t('logout')}</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
