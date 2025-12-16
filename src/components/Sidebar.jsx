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
  FiTruck
} from 'react-icons/fi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
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
      item: { path: '/jobs', icon: FiBriefcase, label: 'Jobs' }
    },
    {
      type: 'item',
      item: { path: '/shipping-methods', icon: FiTruck, label: 'Shipping' }
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
        { path: '/forms/credentials', label: 'Credentials' },
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

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-indigo-800 to-purple-900 text-white transition-all duration-300 z-30 shadow-xl overflow-hidden flex flex-col
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-indigo-700/50 bg-indigo-900/30 backdrop-blur-sm shrink-0">
          <div className={`flex items-center ${!isOpen && 'lg:justify-center w-full'}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center shadow-lg">
              <span className="font-bold text-white text-lg">O</span>
            </div>
            {isOpen && <h1 className="ml-3 text-xl font-bold tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">OptyShop</h1>}
          </div>
          {isOpen && (
            <button onClick={toggleSidebar} className="lg:hidden text-gray-300 hover:text-white">
              <FiX className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-transparent py-4">
          <div className="px-3 space-y-1">
            {menuSections.map((section, index) => {
              // Render Divider
              if (section.type === 'divider') {
                if (!isOpen) return null;
                return (
                  <div key={`divider-${index}`} className="px-3 py-2 mt-4 mb-2">
                    <span className="text-xs font-semibold text-indigo-300/60 uppercase tracking-wider">
                      {section.label}
                    </span>
                  </div>
                );
              }

                // Render Group/Submenu
              if (section.type === 'group') {
                const isExpanded = openSubmenus[section.key];
                const hasActiveChild = section.children.some(child => location.pathname === child.path);
                const GroupIcon = section.icon;

                return (
                  <div key={section.key} className="mb-1">
                    <button
                      onClick={() => toggleSubmenu(section.key)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200
                                ${hasActiveChild ? 'bg-indigo-700/40 text-white' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}
                                ${!isOpen && 'justify-center lg:px-0'}
                            `}
                      title={!isOpen ? section.label : ''}
                    >
                      <div className={`flex items-center ${!isOpen && 'justify-center w-full'}`}>
                        <GroupIcon className={`w-5 h-5 ${hasActiveChild ? 'text-pink-400' : ''} ${!isOpen ? 'mx-auto' : 'mr-2.5'}`} />
                        {isOpen && <span className="text-sm font-medium tracking-wide">{section.label}</span>}
                      </div>
                      {isOpen && (
                        <FiChevronRight className={`text-xs text-indigo-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      )}
                    </button>

                    {/* Submenu Items */}
                    {isOpen && isExpanded && (
                      <div className="mt-1 ml-2 pl-3 border-l-2 border-indigo-700/30 space-y-0.5">
                        {section.children.map((child, cIdx) => {
                          const ChildIcon = child.icon;
                          const isChildActive = location.pathname === child.path;
                          return (
                            <Link
                              key={cIdx}
                              to={child.path}
                              className={`flex items-center px-3 py-2 rounded-md text-sm transition-all duration-150
                                                ${isChildActive 
                                                  ? 'text-white bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-l-2 border-pink-400 font-medium' 
                                                  : 'text-indigo-300 hover:text-white hover:bg-white/5'
                                                }
                                            `}
                            >
                              {ChildIcon && <ChildIcon className="w-4 h-4 mr-2 flex-shrink-0" />}
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Render Single Item
              if (section.type === 'item') {
                const item = section.item;
                const Icon = item.icon;
              const isActive = location.pathname === item.path;
                
              return (
                <Link
                    key={`item-${index}`}
                  to={item.path}
                    className={`relative group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200
                    ${isActive
                        ? 'bg-gradient-to-r from-indigo-600/40 to-purple-600/40 text-white shadow-md'
                      : 'text-indigo-200 hover:bg-white/5 hover:text-white'
                    }
                    ${!isOpen && 'justify-center lg:px-0'}
                  `}
                  title={!isOpen ? item.label : ''}
                >
                    {/* Active Indicator */}
                  {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-pink-400 rounded-r-full shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
                  )}

                    <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'text-pink-300 scale-110' : 'group-hover:scale-110'} ${!isOpen ? 'mx-auto' : 'mr-2.5'}`} />

                  {isOpen && (
                      <span className={`text-sm font-medium tracking-wide ${isActive ? 'text-white' : ''}`}>
                      {item.label}
                    </span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {!isOpen && (
                      <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-gray-700">
                      {item.label}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 border-l border-b border-gray-700 rotate-45"></div>
                    </div>
                  )}
                </Link>
              );
              }

              return null;
            })}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
