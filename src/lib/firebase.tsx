/**
 * This file is kept for backward compatibility but doesn't initialize Firebase directly.
 * Authentication is now handled through the server API.
 */

import authService, { User } from './auth-service';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Compatibility methods for existing code
export const getCurrentUser = (): User | null => {
  // Skip on server-side
  if (!isBrowser) return null;
  return authService.getCurrentUser();
};

export const isLoggedIn = (): boolean => {
  // Skip on server-side
  if (!isBrowser) return false;
  return authService.isLoggedIn();
};

export const logout = (): void => {
  // Skip on server-side
  if (!isBrowser) return;
  return authService.logout();
};

// For components that might still expect these
export const auth = null;
export const googleProvider = null;