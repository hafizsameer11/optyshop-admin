import React from 'react';
import { FiMenu, FiLogOut, FiUser, FiBell, FiSearch } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const isDemoMode = localStorage.getItem('demo_user') !== null;

  return (
    <header className="relative bg-white/90 backdrop-blur-2xl shadow-xl border-b border-gray-200/60 h-20 flex items-center justify-between px-6 md:px-8 z-20">
      {/* Enhanced decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-rose-500 shadow-lg"></div>
      {/* Subtle inner glow */}
      <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-white/50 to-transparent pointer-events-none"></div>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2.5 rounded-xl text-gray-700 hover:text-indigo-600 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-sm hover:shadow-md"
        >
          <FiMenu className="w-5 h-5" />
        </button>
        
        {/* Enhanced Search Bar */}
        <div className="hidden md:flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100/80 rounded-xl hover:from-white hover:to-gray-50 transition-all duration-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:shadow-lg border border-gray-200/50">
          <FiSearch className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search anything..."
            className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-72 font-medium"
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
        
        {/* Enhanced Notifications */}
        <button className="relative p-2.5 rounded-xl text-gray-700 hover:text-indigo-600 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 group shadow-sm hover:shadow-md">
          <FiBell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-full ring-2 ring-white shadow-sm animate-pulse"></span>
        </button>
        
        {/* Enhanced User Profile */}
        <div className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 cursor-pointer group border border-transparent hover:border-indigo-200/50 shadow-sm hover:shadow-md">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white group-hover:ring-indigo-200 transition-all duration-300">
            {user?.first_name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 font-medium">Administrator</p>
          </div>
        </div>
        
        {/* Enhanced Logout Button */}
        <button
          onClick={logout}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:via-rose-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-0.5 font-semibold"
        >
          <FiLogOut className="w-4 h-4" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;



