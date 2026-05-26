import { create } from 'zustand';
import { api } from '../services/api';

interface UserProfile {
  avatar?: string;
  bio?: string;
  preferences?: Record<string, any>;
  business_name?: string;
  contact_number?: string;
  is_verified?: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'SELLER' | 'CUSTOMER';
  profile: UserProfile | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => {
  // Listen for the custom logout event from our api interceptor
  if (typeof window !== 'undefined') {
    window.addEventListener('auth-logout', () => {
      get().logout();
    });
  }

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (username, password) => {
      set({ isLoading: true });
      try {
        const response = await api.post('auth/token/', { username, password });
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        
        // Fetch user profile info
        const profileResponse = await api.get('auth/profile/');
        // After login, redirect to previously saved path if any
        const savedPath = localStorage.getItem('last_path');
        if (savedPath) {
          // Clear saved path after using it
          localStorage.removeItem('last_path');
          window.location.replace(savedPath);
        }
        set({
          user: profileResponse.data,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    register: async (registerData) => {
      set({ isLoading: true });
      try {
        await api.post('auth/register/', registerData);
        set({ isLoading: false });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    logout: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    },

    checkAuth: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      try {
        const response = await api.get('auth/profile/');
        set({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    },

    updateProfile: async (profileData) => {
      try {
        const response = await api.put('auth/profile/', profileData);
        set({ user: response.data });
      } catch (error) {
        throw error;
      }
    }
  };
});
