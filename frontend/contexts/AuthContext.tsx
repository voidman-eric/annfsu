import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { uploadAvatar, deleteAvatar } from '../utils/supabase';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  institution: string;
  committee: string;
  position?: string;
  blood_group?: string;
  photo?: string;
  role: string;
  status: string;
  membership_id?: string;
  issue_date?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithOTP: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserPhoto: (base64Image: string, mimeType: string) => Promise<void>;
  removeUserPhoto: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user_data');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login/email`, {
        email,
        password,
      });

      const { access_token, user: userData } = response.data;
      
      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const loginWithOTP = async (phone: string, otp: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        phone,
        otp,
      });

      const { access_token, user: userData } = response.data;
      
      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'OTP verification failed');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ user, token, loginWithEmail, loginWithOTP, logout, isLoading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
