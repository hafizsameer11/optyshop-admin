import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const checkingAuthRef = useRef(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Prevent concurrent auth checks
    if (checkingAuthRef.current) {
      return;
    }
    
    checkingAuthRef.current = true;
    
    try {
      const token = localStorage.getItem('admin_token');
      const demoUser = localStorage.getItem('demo_user');
      
      // Check if we have a cached auth check result (to prevent rate limiting)
      const lastAuthCheck = localStorage.getItem('last_auth_check');
      const authCheckCache = localStorage.getItem('auth_check_cache');
      const now = Date.now();
      
      // If we have a valid cache (less than 10 minutes old), use it to reduce API calls
      if (lastAuthCheck && authCheckCache && (now - parseInt(lastAuthCheck)) < 10 * 60 * 1000) {
        try {
          const cachedUser = JSON.parse(authCheckCache);
          setUser(cachedUser);
          setLoading(false);
          return;
        } catch (e) {
          // Cache invalid, continue with fresh check
        }
      }
      
      if (token && demoUser) {
        // Demo mode - use stored demo user
        setUser(JSON.parse(demoUser));
        setLoading(false);
        return;
      }
      
      if (token) {
        try {
          const response = await api.get(API_ROUTES.AUTH.ME);
          // Handle nested response structure
          const userData = response.data?.data?.user || response.data?.user || response.data;
          setUser(userData);
          
          // Cache the result to prevent rate limiting
          localStorage.setItem('last_auth_check', now.toString());
          localStorage.setItem('auth_check_cache', JSON.stringify(userData));
        } catch (error) {
          const errorMessage = error.response?.data?.message || '';
          const isRouteNotFound = error.response?.status === 404 || 
                                 errorMessage?.toLowerCase().includes('route not found');
          const isRateLimited = error.response?.status === 429;
          
          // Handle rate limiting gracefully - use cached user if available
          if (isRateLimited) {
            // Always use cache if available when rate limited
            if (authCheckCache) {
              try {
                const cachedUser = JSON.parse(authCheckCache);
                setUser(cachedUser);
                // Silently use cached data - no console logging
                setLoading(false);
                checkingAuthRef.current = false;
                return;
              } catch (e) {
                // Cache invalid, continue
              }
            }
            // If no cache but rate limited, just continue with existing token
            // Don't make more requests that will fail
            // Silently handle - no console logging
            setLoading(false);
            checkingAuthRef.current = false;
            return;
          }
          
          // Silently handle 404 errors (route not found) - endpoint might not exist
          // Only clear auth if it's an actual auth error (401), not a missing route
          if (error.response?.status === 401) {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('demo_user');
            localStorage.removeItem('last_auth_check');
            localStorage.removeItem('auth_check_cache');
          } else if (!isRouteNotFound) {
            // Only log non-404/route-not-found errors for debugging
            console.error('Auth check error:', error);
          }
          // For 404 or route not found errors, just keep the token and let the user proceed
          // The token might still be valid even if /auth/me endpoint doesn't exist
        }
      }
    } finally {
      checkingAuthRef.current = false;
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('Login attempt:', { email, password });
    
    // Try real API first
    try {
      const response = await api.post(API_ROUTES.AUTH.LOGIN, { email, password });
      
      // Handle nested response structure: response.data.data.user, response.data.data.token, response.data.data.refreshToken
      // API response: { success: true, message: "...", data: { user: {...}, token: "...", refreshToken: "..." } }
      const responseData = response.data?.data || response.data;
      const userData = responseData?.user;
      const token = responseData?.token || responseData?.access_token;
      const refreshToken = responseData?.refreshToken;
      
      if (!userData) {
        throw new Error('Invalid response format from server');
      }
      
      if (userData.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('admin_token', token);
      // Store refresh token if available
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      setUser(userData);
      toast.success(response.data?.message || 'Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      
      // Check if backend is unavailable (network error, 404, 500, etc.)
      const isNetworkError = !error.response;
      const isServerError = error.response?.status >= 500;
      const isNotFoundError = error.response?.status === 404;
      
      // If backend is unavailable, set demo mode
      if (isNetworkError || isServerError || isNotFoundError) {
        console.log('Backend unavailable - setting demo mode');
        
        // Create demo user
        const demoUser = {
          id: 1,
          name: 'Demo Admin',
          email: email,
          role: 'admin',
          created_at: new Date().toISOString()
        };
        
        // Set demo mode
        localStorage.setItem('admin_token', 'demo_token_' + Date.now());
        localStorage.setItem('demo_user', JSON.stringify(demoUser));
        setUser(demoUser);
        
        toast.success('Demo mode activated - Backend unavailable');
        return true;
      }
      
      // For other errors (auth validation, etc.), show the actual error
      const errorMessage = error.response?.data?.message || error.message;
      toast.error(errorMessage || 'Login failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post(API_ROUTES.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('demo_user');
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



