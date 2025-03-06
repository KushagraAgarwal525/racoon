"use client";

// User type definition
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Auth session response from server
interface AuthSession {
  user: User | null;
  token?: string;
}

// Define base API URL
const API_URL = 'racoon-server.vercel.app';
const TOKEN_KEY = 'racoon_auth_session';

/**
 * Client-side auth service that communicates with the server
 * for Firebase authentication without exposing Firebase credentials
 */
class AuthClient {
  private currentUser: User | null = null;
  private authListeners: Array<(user: User | null) => void> = [];

  constructor() {
    // Only try to restore session in browser
    if (typeof window !== 'undefined') {
      // Try to restore session from localStorage
      this.restoreSession();
      
      // Setup session storage listener for multi-tab support
      window.addEventListener('storage', (event) => {
        if (event.key === TOKEN_KEY) {
          this.restoreSession();
        }
      });
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmailAndPassword(email: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sign in');
      }
      
      const session = await response.json();
      this.setSession(session);
      return session.user;
      
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Create a new user with email and password
   */
  async createUserWithEmailAndPassword(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
        // credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create account');
      }
      
      const session = await response.json();
      this.setSession(session);
      return session.user;
      
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google via popup - temporarily disabled
   */
  async signInWithGoogle(): Promise<User> {
    throw new Error('Google sign-in is temporarily disabled');
    
    /* Original implementation commented out
    return new Promise((resolve, reject) => {
      try {
        // Open the Google sign-in popup window
        // ... (Google auth code)
      } catch (error) {
        console.error('Google sign-in error:', error);
        reject(error);
      }
    });
    */
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      this.clearSession();
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear the session even if the server call fails
      this.clearSession();
    }
  }

  /**
   * Get the current authenticated user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Add an auth state change listener
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.authListeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.authListeners = this.authListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Set the current session and notify listeners
   */
  private setSession(session: AuthSession): void {
    this.currentUser = session.user;
    
    // Save to localStorage for persistence
    if (typeof window !== 'undefined' && session.token) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
    }
    
    // Notify all listeners
    this.notifyListeners();
  }

  /**
   * Clear the current session
   */
  private clearSession(): void {
    this.currentUser = null;
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    
    // Notify all listeners
    this.notifyListeners();
  }

  /**
   * Restore session from localStorage
   */
  private async restoreSession(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const sessionData = localStorage.getItem(TOKEN_KEY);
      if (!sessionData) {
        return;
      }
      
      const session: AuthSession = JSON.parse(sessionData);
      if (!session.user || !session.token) {
        this.clearSession();
        return;
      }
      
      // Validate session with server using the user ID instead of verifying the token directly
      const response = await fetch(`${API_URL}/api/auth/validate-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: session.user.uid,
          token: session.token
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        this.clearSession();
        return;
      }
      
      const validatedSession = await response.json();
      this.currentUser = validatedSession.user;
      this.notifyListeners();
      
    } catch (error) {
      console.error('Error restoring auth session:', error);
      this.clearSession();
    }
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyListeners(): void {
    this.authListeners.forEach(listener => {
      try {
        listener(this.currentUser);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }
}

// Create singleton instance
const authClient = new AuthClient();
export default authClient;
