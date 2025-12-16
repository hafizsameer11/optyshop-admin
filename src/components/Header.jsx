import React from 'react';
import { FiMenu, FiLogOut, FiUser, FiBell, FiSearch } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const isDemoMode = localStorage.getItem('demo_user') !== null;

  return (
    <header className="relative bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 h-20 flex items-center justify-between px-6 md:px-8 z-20">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <FiMenu className="w-5 h-5" />
        </button>
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gray-100/80 rounded-xl hover:bg-gray-100 transition-all duration-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20">
          <FiSearch className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-64"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {isDemoMode && (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300/50 rounded-lg shadow-sm">
            <span className="text-xs font-bold text-amber-800">
              🔒 DEMO MODE
            </span>
          </div>
        )}
        
        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-200 group">
          <FiBell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>
        
        {/* User Profile */}
        <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl hover:bg-gray-100/80 transition-all duration-200 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white">
            {user?.first_name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-800">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-0.5"
        >
          <FiLogOut className="w-4 h-4" />
          <span className="hidden md:inline font-semibold">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;



