import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Check localStorage for saved preference, default to true on desktop
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      if (saved !== null) return saved === 'true';
      // Default: open on desktop, closed on mobile
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      // On mobile/tablet, close sidebar by default
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        // On desktop, restore saved preference or default to open
        const saved = localStorage.getItem('sidebarOpen');
        if (saved !== null) {
          setSidebarOpen(saved === 'true');
        } else {
          setSidebarOpen(true);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', sidebarOpen.toString());
    }
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 relative overflow-hidden">
      {/* Enhanced Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/30 via-purple-300/20 to-pink-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-300/25 via-cyan-300/20 to-teal-300/25 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-200/10 to-fuchsia-200/10 rounded-full blur-3xl"></div>
      </div>
      
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className={`relative flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out
        ${sidebarOpen 
          ? 'lg:ml-64' 
          : 'ml-0 lg:ml-20'
        }`}>
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pt-4 sm:pt-6 md:pt-8 lg:pt-10">
          <div className="max-w-7xl mx-auto relative z-0 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
