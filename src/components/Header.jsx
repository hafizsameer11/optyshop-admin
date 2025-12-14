import React from 'react';
import { FiMenu, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const isDemoMode = localStorage.getItem('demo_user') !== null;

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
      <button
        onClick={toggleSidebar}
        className="text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <FiMenu className="w-6 h-6" />
      </button>

      <div className="flex items-center space-x-4">
        {isDemoMode && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-lg">
            <span className="text-xs font-semibold text-yellow-800">
              🔒 DEMO MODE - Read Only
            </span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <FiUser className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-700">
            {user?.first_name} {user?.last_name}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;



