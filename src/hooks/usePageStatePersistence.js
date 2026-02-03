import { useState, useEffect } from 'react';

/**
 * Custom hook for persisting page state to localStorage
 * Ensures that page state (filters, pagination, etc.) is maintained on refresh
 * 
 * @param {string} storageKey - Unique key for localStorage
 * @param {Object} defaultState - Default state values
 * @returns {Array} [state, setState] - React state setter and getter
 */
export const usePageStatePersistence = (storageKey, defaultState) => {
  // Helper function to load state from localStorage
  const loadStateFromStorage = () => {
    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Merge with default state to ensure all properties exist
        return { ...defaultState, ...parsed };
      }
    } catch (error) {
      console.warn(`Failed to load state from localStorage (${storageKey}):`, error);
    }
    return defaultState;
  };
  
  // Helper function to save state to localStorage
  const saveStateToStorage = (state) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to save state to localStorage (${storageKey}):`, error);
    }
  };
  
  // Load initial state from localStorage
  const initialState = loadStateFromStorage();
  
  // Initialize state with loaded or default values
  const [state, setState] = useState(initialState);
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveStateToStorage(state);
  }, [state, storageKey]);
  
  // Custom setState that also updates localStorage
  const setPersistedState = (newState) => {
    setState(prevState => {
      const updatedState = typeof newState === 'function' ? newState(prevState) : newState;
      return { ...prevState, ...updatedState };
    });
  };
  
  return [state, setPersistedState];
};

/**
 * Hook specifically for filter state persistence
 * 
 * @param {string} pageKey - Page identifier for storage key
 * @param {Object} defaultFilters - Default filter values
 * @returns {Array} [filters, setFilters] - Filter state and setter
 */
export const useFilterPersistence = (pageKey, defaultFilters = {}) => {
  const storageKey = `${pageKey}_filters`;
  const defaultState = { ...defaultFilters };
  
  return usePageStatePersistence(storageKey, defaultState);
};

/**
 * Hook for page state including filters and pagination
 * 
 * @param {string} pageKey - Page identifier for storage key
 * @param {Object} defaultState - Default state including filters and pagination
 * @returns {Array} [pageState, setPageState] - Complete page state and setter
 */
export const useCompletePageState = (pageKey, defaultState = {}) => {
  const storageKey = `${pageKey}_state`;
  const defaultCompleteState = {
    page: 1,
    limit: 12,
    searchTerm: '',
    sortBy: '',
    sortOrder: 'asc',
    ...defaultState
  };
  
  return usePageStatePersistence(storageKey, defaultCompleteState);
};
