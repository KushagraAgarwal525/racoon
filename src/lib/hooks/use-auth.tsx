"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_URL = 'https://racoon-server-kushagraagarwal-kushagraagarwals-projects.vercel.app';

interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, displayname: string) => Promise<void>;
  setUserFromToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Parse and validate JWT token
  const parseToken = (token: string): User | null => {
    try {
      // For JWT tokens - split and decode the payload
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      console.log(payload);
      return {
        uid: payload.sub || payload.user_id,
        email: payload.email,
        displayName: payload.name,
        photoURL: payload.picture ? payload.picture : null,
      };
    } catch (error) {
      console.error("Error parsing auth token:", error);
      return null;
    }
  };

  const setUserFromToken = (token: string) => {
    if (token) {
      // Store token
      localStorage.setItem('authToken', token);
      
      // Parse user info from token
      const userData = parseToken(token);
      setUser(userData);
    }
  };

  const register = async (email: string, password: string, displayname: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayname }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      setUserFromToken(data.token);
      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Implement your API call to login endpoint
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      setUserFromToken(data.token);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  // Check for existing token on mount
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        const userData = parseToken(token);
        setUser(userData);
      }
      setLoading(false);
    };
    
    checkToken();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUserFromToken, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};