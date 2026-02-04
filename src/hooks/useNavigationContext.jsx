import { createContext, useContext, useState, useEffect } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [navigationState, setNavigationState] = useState(() => {
    try {
      const saved = localStorage.getItem('lens_management_navigation');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load navigation state from localStorage:', error);
      return null;
    }
  });

  // Save navigation state to localStorage whenever it changes
  useEffect(() => {
    try {
      if (navigationState) {
        localStorage.setItem('lens_management_navigation', JSON.stringify(navigationState));
      } else {
        localStorage.removeItem('lens_management_navigation');
      }
    } catch (error) {
      console.warn('Failed to save navigation state to localStorage:', error);
    }
  }, [navigationState]);

  const setProductContext = (productId, productName = null) => {
    console.log('📍 Setting product navigation context:', { productId, productName });
    setNavigationState({
      fromProduct: true,
      productId,
      productName,
      timestamp: Date.now()
    });
  };

  const clearProductContext = () => {
    console.log('📍 Clearing product navigation context');
    setNavigationState(null);
  };

  const getBackNavigationPath = () => {
    if (!navigationState || !navigationState.fromProduct) {
      return '/lens-options'; // Default fallback
    }

    // Check if the navigation context is recent (within 30 minutes)
    const isRecent = (Date.now() - navigationState.timestamp) < 30 * 60 * 1000;
    if (!isRecent) {
      console.log('📍 Navigation context expired, using default path');
      clearProductContext();
      return '/lens-options';
    }

    console.log('📍 Navigating back to product:', navigationState.productId);
    return `/products?edit=${navigationState.productId}&tab=lens-management`;
  };

  return (
    <NavigationContext.Provider value={{
      navigationState,
      setProductContext,
      clearProductContext,
      getBackNavigationPath
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
};
