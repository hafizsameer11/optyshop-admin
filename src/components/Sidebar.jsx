import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiShoppingBag,
  FiShoppingCart,
  FiUsers,
  FiGrid,
  FiFileText,
  FiTrendingUp,
  FiImage,
  FiMessageSquare,
  FiFile,
  FiStar,
  FiZap,
  FiX,
  FiChevronDown,
  FiInbox,
  FiBriefcase,
  FiBarChart2,
  FiFolder,
  FiFolderPlus,
  FiTag,
  FiActivity,
  FiTruck,
  FiLogOut,
  FiMenu,
  FiAward,
  FiGift
} from 'react-icons/fi';
import { FaEuroSign } from 'react-icons/fa';
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
        { path: '/flash-offers', icon: FiZap, label: t('flashOffers') },
        { path: '/free-gifts', icon: FiGift, label: t('freeGifts') },
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
      item: { path: '/transactions', icon: FaEuroSign, label: t('transactions') }
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
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-xl z-50 transition-all duration-300 ease-in-out ${isOpen
            ? 'w-72 translate-x-0'
            : 'w-20 -translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-20 px-4 border-b border-gray-200 bg-gray-50/90">
            <div className={`flex items-center gap-3 ${!isOpen && 'lg:justify-center w-full'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">O</span>
              </div>
              {isOpen && (
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900">OptyShop</h1>
                  <p className="text-xs text-gray-500 font-medium">{t('adminPanel')}</p>
                </div>
              )}
            </div>
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 ${!isOpen && 'lg:mx-auto'}`}
              aria-label="Toggle sidebar"
            >
              {isOpen ? (
                <FiX className="w-5 h-5" />
              ) : (
                <FiMenu className="w-5 h-5" />
              )}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 sidebar-scrollbar-light">
            <div className="space-y-1">
              {menuSections.map((section, index) => {
                if (section.type === 'divider') {
                  return isOpen ? (
                    <div key={`divider-${index}`} className="px-4 py-3 mt-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {section.label}
                      </p>
                    </div>
                  ) : (
                    <div key={`divider-${index}`} className="h-px bg-gray-200 my-3"></div>
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
                          ? 'bg-indigo-50 text-indigo-800 shadow-sm border border-indigo-100'
                          : 'text-gray-700 hover:bg-gray-50'
                        } ${!isOpen && 'lg:justify-center'}`}
                      title={!isOpen ? label : ''}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-gray-500'}`} />
                      {isOpen && (
                        <span className={`text-sm font-medium ${active ? 'font-semibold' : ''}`}>
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
                        type="button"
                        onClick={() => toggleSubmenu(key)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${hasActiveChild
                            ? 'bg-indigo-50 text-indigo-800 shadow-sm border border-indigo-100'
                            : 'text-gray-700 hover:bg-gray-50'
                          } ${!isOpen && 'lg:justify-center'}`}
                        title={!isOpen ? label : ''}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 flex-shrink-0 ${hasActiveChild ? 'text-indigo-600' : 'text-gray-500'}`} />
                          {isOpen && (
                            <span className={`text-sm font-medium ${hasActiveChild ? 'font-semibold' : ''}`}>
                              {label}
                            </span>
                          )}
                        </div>
                        {isOpen && (
                          <FiChevronDown
                            className={`w-4 h-4 transition-transform text-gray-500 ${isOpenSubmenu ? 'rotate-180' : ''}`}
                          />
                        )}
                      </button>

                      {isOpen && isOpenSubmenu && children && (
                        <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                          {children.map((child) => {
                            const childActive = isActive(child.path);
                            const ChildIcon = child.icon || FiFile;

                            return (
                              <Link
                                key={child.path}
                                to={child.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${childActive
                                    ? 'bg-indigo-50 text-indigo-800 border border-indigo-100 font-semibold'
                                    : 'text-gray-600 hover:bg-gray-50'
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

          <div className="border-t border-gray-200 p-4 mt-auto bg-gray-50/80">
            {isOpen && user && (
              <div className="mb-3 px-2">
                <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
                    {user?.first_name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">{t('administrator')}</p>
                  </div>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={logout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-white bg-red-600 hover:bg-red-700 shadow-md ${!isOpen && 'lg:justify-center'
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
