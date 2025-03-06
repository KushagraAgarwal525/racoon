/**
 * Authentication service that uses the Express server APIs 
 * instead of direct Firebase client SDK
 */

// Types for user data
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthTokens {
  token: string;
  user: User;
}

// Helper for API requests
const API_BASE = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

// Store tokens in localStorage
const TOKEN_KEY = 'racoon_auth_token';

// Helper to check if code is running in browser
const isBrowser = typeof window !== 'undefined';

export class AuthService {
  currentUser: User | null = null;
  
  constructor() {
    // Only try to load from storage in browser environment
    if (isBrowser) {
      try {
        // Check for existing token on initialization
        this.loadUserFromStorage();
      } catch (error) {
        console.error('Error in auth service initialization:', error);
      }
    }
  }
  
  async login(email: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      const auth: AuthTokens = await response.json();
      this.setCurrentUser(auth);
      
      return auth.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  async register(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, displayName })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      
      const auth: AuthTokens = await response.json();
      this.setCurrentUser(auth);
      
      return auth.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  async loginWithGoogle(idToken: string): Promise<User> {
    try {
      console.log(`Sending Google ID token to server: ${API_BASE}/api/auth/google`);
      
      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google login server error:', errorData);
        throw new Error(errorData.message || 'Google login failed');
      }
      
      const auth: AuthTokens = await response.json();
      this.setCurrentUser(auth);
      
      return auth.user;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }
  
  async validateToken(token: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
      
      if (!response.ok) {
        this.logout();
        return null;
      }
      
      const data = await response.json();
      this.currentUser = data.user;
      
      return data.user;
    } catch (error) {
      console.error('Token validation error:', error);
      this.logout();
      return null;
    }
  }
  
  logout(): void {
    this.currentUser = null;
    if (isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
  
  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }
  
  getCurrentUser(): User | null {
    return this.currentUser;
  }
  
  getAuthToken(): string | null {
    if (!isBrowser) return null;
    
    try {
      const authData = localStorage.getItem(TOKEN_KEY);
      if (!authData) return null;
      
      const parsed = JSON.parse(authData);
      return parsed.token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }
  
  private setCurrentUser(auth: AuthTokens): void {
    this.currentUser = auth.user;
    if (isBrowser) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(auth));
    }
  }
  
  private loadUserFromStorage(): void {
    if (!isBrowser) return;
    
    try {
      const authData = localStorage.getItem(TOKEN_KEY);
      if (!authData) return;
      
      const auth = JSON.parse(authData);
      if (auth && auth.token && auth.user) {
        this.currentUser = auth.user;
        // Validate token in background
        this.validateToken(auth.token).catch(() => this.logout());
      }
    } catch (error) {
      console.error('Error loading auth from storage:', error);
      this.logout();
    }
  }
}

// Create singleton instance
const authService = new AuthService();
export default authService;
