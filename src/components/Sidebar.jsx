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
        className={`fixed top-0 left-0 h-full bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white transition-all duration-300 z-30 shadow-2xl overflow-hidden flex flex-col
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'}
        `}
        style={{
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #581c87 100%)',
        }}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        {/* Header */}
        <div className="relative flex items-center justify-between h-20 px-4 border-b border-white/10 bg-white/5 backdrop-blur-xl shrink-0 shadow-lg">
          <div className={`flex items-center ${!isOpen && 'lg:justify-center w-full'}`}>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-pink-500/50 ring-2 ring-white/20">
              <span className="font-extrabold text-white text-xl">O</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
            </div>
            {isOpen && (
              <div className="ml-3">
                <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  OptyShop
                </h1>
                <p className="text-xs text-white/60 font-medium">Admin Panel</p>
            </div>
            )}
          </div>
          {isOpen && (
            <button 
              onClick={toggleSidebar} 
              className="lg:hidden text-gray-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar py-6">
          <div className="px-3 space-y-1">
            {menuSections.map((section, index) => {
              // Render Divider
              if (section.type === 'divider') {
                if (!isOpen) return null;
                return (
                  <div key={`divider-${index}`} className="px-3 py-3 mt-6 mb-2 relative">
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <span className="relative text-xs font-bold text-white/40 uppercase tracking-widest px-2 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
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
                      className={`relative w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 group
                                ${hasActiveChild 
                                  ? 'bg-gradient-to-r from-indigo-600/40 to-purple-600/40 text-white shadow-lg shadow-indigo-500/20' 
                                  : 'text-white/70 hover:bg-white/10 hover:text-white hover:shadow-md'
                                }
                                ${!isOpen && 'justify-center lg:px-0'}
                            `}
                      title={!isOpen ? section.label : ''}
                    >
                      <div className={`flex items-center ${!isOpen && 'justify-center w-full'}`}>
                        <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                          hasActiveChild ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
                        }`}>
                          <GroupIcon className={`w-4 h-4 ${hasActiveChild ? 'text-pink-300' : 'text-white/80'} transition-all duration-300`} />
                        </div>
                        {isOpen && <span className="ml-2.5 text-sm font-semibold tracking-wide">{section.label}</span>}
                      </div>
                      {isOpen && (
                        <FiChevronRight className={`text-xs text-white/50 transition-all duration-300 ${isExpanded ? 'rotate-90 text-white' : 'group-hover:text-white'}`} />
                      )}
                    </button>

                    {/* Submenu Items */}
                    {isOpen && isExpanded && (
                      <div className="mt-2 ml-2 pl-4 border-l-2 border-gradient-to-b from-pink-500/30 to-purple-500/30 space-y-1 animate-in slide-in-from-top-2">
                        {section.children.map((child, cIdx) => {
                          const ChildIcon = child.icon;
                          const isChildActive = location.pathname === child.path;
                          return (
                            <Link
                              key={cIdx}
                              to={child.path}
                              className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group
                                                ${isChildActive 
                                                  ? 'text-white bg-gradient-to-r from-pink-500/30 via-purple-500/20 to-transparent border-l-2 border-pink-400 font-semibold shadow-md shadow-pink-500/10' 
                                                  : 'text-white/60 hover:text-white hover:bg-white/5 hover:translate-x-1'
                                                }
                                            `}
                            >
                              {ChildIcon && (
                                <ChildIcon className={`w-4 h-4 mr-2.5 flex-shrink-0 transition-all duration-200 ${
                                  isChildActive ? 'text-pink-300 scale-110' : 'text-white/50 group-hover:text-white/80'
                                }`} />
                              )}
                              <span className="transition-all duration-200">{child.label}</span>
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
                    className={`relative group flex items-center px-3 py-3 rounded-xl transition-all duration-300
                    ${isActive
                        ? 'bg-gradient-to-r from-indigo-600/50 via-purple-600/40 to-pink-600/30 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]'
                        : 'text-white/70 hover:bg-white/10 hover:text-white hover:shadow-md hover:scale-[1.01]'
                    }
                    ${!isOpen && 'justify-center lg:px-0'}
                  `}
                  title={!isOpen ? item.label : ''}
                >
                    {/* Active Indicator */}
                  {isActive && (
                      <>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-gradient-to-b from-pink-400 to-purple-400 rounded-r-full shadow-[0_0_12px_rgba(236,72,153,0.8)]" />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent"></div>
                      </>
                    )}

                    <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                      isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
                    }`}>
                      <Icon className={`w-4 h-4 transition-all duration-300 ${isActive ? 'text-pink-200 scale-110' : 'text-white/80 group-hover:scale-110 group-hover:text-white'} ${!isOpen ? 'mx-auto' : ''}`} />
                    </div>

                  {isOpen && (
                      <span className={`ml-2.5 text-sm font-semibold tracking-wide transition-all duration-300 ${isActive ? 'text-white' : 'group-hover:text-white'}`}>
                      {item.label}
                    </span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {!isOpen && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-2xl border border-white/10 transform translate-x-2 group-hover:translate-x-0">
                      {item.label}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900/95 border-l border-b border-white/10 rotate-45"></div>
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
