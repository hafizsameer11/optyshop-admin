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
  FiMenu
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [openSubmenus, setOpenSubmenus] = useState({
    catalog: false,
    lens: false,
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
      item: { path: '/', icon: FiHome, label: 'Dashboard' }
    },
    {
      type: 'divider',
      label: 'Core Management'
    },
    {
      type: 'item',
      item: { path: '/products', icon: FiShoppingBag, label: 'Products' }
    },
    {
      type: 'item',
      item: { path: '/orders', icon: FiShoppingCart, label: 'Orders' }
    },
    {
      type: 'item',
      item: { path: '/users', icon: FiUsers, label: 'Users' }
    },
    {
      type: 'divider',
      label: 'Catalog'
    },
    {
      type: 'group',
      key: 'catalog',
      label: 'Categories',
      icon: FiFolder,
      children: [
        { path: '/categories', icon: FiGrid, label: 'Categories' },
        { path: '/subcategories', icon: FiFolderPlus, label: 'SubCategories' },
      ]
    },
    {
      type: 'divider',
      label: 'Frame & Lens'
    },
    {
      type: 'group',
      key: 'lens',
      label: 'Lens Management',
      icon: FiAperture,
      children: [
        { path: '/frame-sizes', icon: FiLayers, label: 'Frame Sizes' },
        { path: '/lens-types', icon: FiEye, label: 'Lens Types' },
        { path: '/lens-options', icon: FiSettings, label: 'Lens Options' },
        { path: '/lens-coatings', icon: FiBox, label: 'Lens Coatings' },
        { path: '/lens-colors', icon: FiDroplet, label: 'Lens Colors' },
        { path: '/lens-finishes', icon: FiLayers, label: 'Lens Finishes' },
        { path: '/lens-treatments', icon: FiShield, label: 'Lens Treatments' },
        { path: '/lens-thickness-materials', icon: FiBox, label: 'Thickness Materials' },
        { path: '/lens-thickness-options', icon: FiLayers, label: 'Thickness Options' },
      ]
    },
    {
      type: 'divider',
      label: 'Prescriptions'
    },
    {
      type: 'group',
      key: 'prescription',
      label: 'Prescription',
      icon: FiFileText,
      children: [
        { path: '/prescriptions', icon: FiFileText, label: 'Prescriptions' },
        { path: '/prescription-lens-types', icon: FiEye, label: 'Lens Types' },
        { path: '/prescription-lens-variants', icon: FiLayers, label: 'Lens Variants' },
      ]
    },
    {
      type: 'divider',
      label: 'Marketing'
    },
    {
      type: 'group',
      key: 'marketing',
      label: 'Marketing',
      icon: FiTrendingUp,
      children: [
        { path: '/coupons', icon: FiTag, label: 'Coupons' },
        { path: '/campaigns', icon: FiTrendingUp, label: 'Campaigns' },
        { path: '/banners', icon: FiImage, label: 'Banners' },
      ]
    },
    {
      type: 'divider',
      label: 'Content'
    },
    {
      type: 'group',
      key: 'content',
      label: 'Content Management',
      icon: FiFile,
      children: [
        { path: '/blog', icon: FiFileText, label: 'Blog Posts' },
        { path: '/faqs', icon: FiMessageSquare, label: 'FAQs' },
        { path: '/pages', icon: FiFile, label: 'Pages' },
        { path: '/testimonials', icon: FiStar, label: 'Testimonials' },
      ]
    },
    {
      type: 'divider',
      label: 'Operations'
    },
    {
      type: 'item',
      item: { path: '/shipping-methods', icon: FiTruck, label: 'Shipping Methods' }
    },
    {
      type: 'item',
      item: { path: '/jobs', icon: FiBriefcase, label: 'Jobs' }
    },
    {
      type: 'group',
      key: 'forms',
      label: 'Website Forms',
      icon: FiInbox,
      children: [
        { path: '/forms/contact', label: 'Contact Requests' },
        { path: '/forms/demo', label: 'Demo Requests' },
        { path: '/forms/pricing', label: 'Pricing Requests' },
        { path: '/forms/credentials', label: 'Credentials Requests' },
        { path: '/forms/support', label: 'Support Requests' },
        { path: '/forms/job-applications', label: 'Job Applications' },
      ]
    },
    {
      type: 'divider',
      label: 'Analytics'
    },
    {
      type: 'item',
      item: { path: '/transactions', icon: FiDollarSign, label: 'Transactions' }
    },
    {
      type: 'item',
      item: { path: '/analytics', icon: FiBarChart2, label: 'Analytics' }
    },
    {
      type: 'item',
      item: { path: '/overview', icon: FiActivity, label: 'Overview' }
    },
    {
      type: 'item',
      item: { path: '/simulations', icon: FiZap, label: 'Simulations' }
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
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-r border-indigo-500/20 dark:border-gray-700 shadow-2xl z-50 transition-all duration-300 ease-in-out ${
          isOpen 
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
                  <p className="text-xs text-white/80 font-medium">Admin Panel</p>
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
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        active
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
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          hasActiveChild
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
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                  childActive
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
                    <p className="text-xs text-white/80 font-medium">Administrator</p>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={logout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-white bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-500 hover:to-red-600 border border-red-400/30 hover:border-red-400/50 shadow-lg hover:shadow-xl backdrop-blur-sm ${
                !isOpen && 'lg:justify-center'
              }`}
              title={!isOpen ? 'Logout' : ''}
            >
              <FiLogOut className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="text-sm font-semibold">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
