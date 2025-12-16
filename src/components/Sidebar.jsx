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
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiInbox,
  FiBriefcase,
  FiDollarSign,
  FiBarChart2,
  FiGlobe,
  FiDroplet,
  FiShield
} from 'react-icons/fi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const [openSubmenus, setOpenSubmenus] = useState({
    forms: true // Default open for visibility
  });

  const toggleSubmenu = (key) => {
    if (!isOpen) return; // Don't toggle if sidebar is closed (hover logic could handle it, but keep simple)
    setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const menuItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },

    // Website Forms Group
    {
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

    { path: '/products', icon: FiShoppingBag, label: 'Products' },
    { path: '/orders', icon: FiShoppingCart, label: 'Orders' },
    { path: '/users', icon: FiUsers, label: 'Users' },
    { path: '/categories', icon: FiGrid, label: 'Categories' },
    { path: '/frame-sizes', icon: FiLayers, label: 'Frame Sizes' },
    { path: '/lens-options', icon: FiSettings, label: 'Lens Options' },
    { path: '/lens-types', icon: FiEye, label: 'Lens Types' },
    { path: '/lens-coatings', icon: FiBox, label: 'Lens Coatings' },
    { path: '/lens-colors', icon: FiDroplet, label: 'Lens Colors' },
    { path: '/lens-finishes', icon: FiLayers, label: 'Lens Finishes' },
    { path: '/lens-treatments', icon: FiShield, label: 'Lens Treatments' },
    { path: '/lens-thickness-materials', icon: FiBox, label: 'Lens Thickness Materials' },
    { path: '/lens-thickness-options', icon: FiLayers, label: 'Lens Thickness Options' },
    { path: '/prescriptions', icon: FiFileText, label: 'Prescriptions' },
    { path: '/prescription-lens-types', icon: FiEye, label: 'Prescription Lens Types' },
    { path: '/prescription-lens-variants', icon: FiLayers, label: 'Prescription Lens Variants' },
    { path: '/coupons', icon: FiTag, label: 'Coupons' },
    { path: '/campaigns', icon: FiTrendingUp, label: 'Campaigns' },
    { path: '/jobs', icon: FiBriefcase, label: 'Jobs' },
    { path: '/banners', icon: FiImage, label: 'Banners' },
    { path: '/blog', icon: FiFileText, label: 'Blog Posts' },
    { path: '/faqs', icon: FiMessageSquare, label: 'FAQs' },
    { path: '/pages', icon: FiFile, label: 'Pages' },
    { path: '/menus', icon: FiMenu, label: 'Navigation Menus' },
    { path: '/testimonials', icon: FiStar, label: 'Testimonials' },
    { path: '/simulations', icon: FiZap, label: 'Simulations' },
    { path: '/transactions', icon: FiDollarSign, label: 'Transactions' },
    { path: '/analytics', icon: FiBarChart2, label: 'Analytics' },
    { path: '/overview', icon: FiGlobe, label: 'Overview' },
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
            {menuItems.map((item, index) => {
              const Icon = item.icon;

              if (item.children) {
                // Render Group/Submenu
                const isExpanded = openSubmenus[item.key];
                const hasActiveChild = item.children.some(child => location.pathname === child.path);

                return (
                  <div key={index} className="mb-1">
                    <button
                      onClick={() => toggleSubmenu(item.key)}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200
                                ${hasActiveChild ? 'bg-indigo-700/30 text-white' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}
                                ${!isOpen && 'justify-center lg:px-0'}
                            `}
                      title={!isOpen ? item.label : ''}
                    >
                      <div className={`flex items-center ${!isOpen && 'justify-center w-full'}`}>
                        <Icon className={`w-6 h-6 ${hasActiveChild ? 'text-pink-400' : ''} ${!isOpen ? 'mx-auto' : 'mr-3'}`} />
                        {isOpen && <span className="font-medium tracking-wide">{item.label}</span>}
                      </div>
                      {isOpen && (
                        <div className="text-indigo-400">
                          {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                        </div>
                      )}
                    </button>

                    {/* Submenu Items */}
                    {isOpen && isExpanded && (
                      <div className="mt-1 ml-4 pl-4 border-l border-indigo-700/50 space-y-1 animate-slide-up">
                        {item.children.map((child, cIdx) => {
                          const isChildActive = location.pathname === child.path;
                          return (
                            <Link
                              key={cIdx}
                              to={child.path}
                              className={`block px-3 py-2 rounded-lg text-sm transition-colors
                                                ${isChildActive ? 'text-white bg-white/10 font-medium' : 'text-indigo-300 hover:text-white hover:bg-white/5'}
                                            `}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Render Single Item
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={index}
                  to={item.path}
                  className={`relative group flex items-center px-3 py-3 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm'
                      : 'text-indigo-200 hover:bg-white/5 hover:text-white'
                    }
                    ${!isOpen && 'justify-center lg:px-0'}
                  `}
                  title={!isOpen ? item.label : ''}
                >
                  {/* Active Indicator Strip */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-pink-500 rounded-r-full shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                  )}

                  <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110 text-pink-400' : 'group-hover:scale-110'} ${!isOpen ? 'mx-auto' : 'mr-3'}`} />

                  {isOpen && (
                    <span className={`font-medium tracking-wide ${isActive ? 'text-white' : ''}`}>
                      {item.label}
                    </span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {!isOpen && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
