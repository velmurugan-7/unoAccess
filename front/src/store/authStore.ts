// import { create } from 'zustand';
// import api from '../lib/api';

// interface User {
//   id: string; name: string; email: string; role: string;
//   avatarUrl?: string; twoFactorEnabled?: boolean; isVerified?: boolean;
//   emailPreferences?: {
//     securityAlerts: boolean; loginNotifications: boolean;
//     productUpdates: boolean; weeklyDigest: boolean;
//   };
// }

// interface AuthState {
//   user: User | null;
//   isLoading: boolean;
//   isAuthenticated: boolean;
//   accessToken: string | null;  // ← new
//   login: (email: string, password: string, twoFaCode?: string) => Promise<void>;
//   logout: () => Promise<void>;
//   fetchProfile: () => Promise<void>;
//   updateProfile: (data: Partial<User>) => Promise<void>;
// }

// export const useAuthStore = create<AuthState>((set, get) => ({
//   user: null,
//   isLoading: true,
//   isAuthenticated: false,
//   accessToken: null,  // ← new

//   fetchProfile: async () => {
//     try {
//       const { data } = await api.get('/api/user/profile');
//       set({ user: data.user, isAuthenticated: true });
//     } catch {
//       set({ user: null, isAuthenticated: false });
//     } finally {
//       set({ isLoading: false });
//     }
//   },

//   login: async (email, password, twoFaCode) => {
//     // Step 1: authenticate — backend returns accessToken in body now
//     const { data } = await api.post('/api/auth/login', {
//       email, password,
//       ...(twoFaCode ? { twoFaCode } : {}),
//     });
//     // Step 2: store the access token so interceptor can attach it
//     if (data.accessToken) {
//       set({ accessToken: data.accessToken });
//     }
//     // Step 3: fetch full profile so avatarUrl and all fields are populated
//     await get().fetchProfile();
//   },

//   logout: async () => {
//     await api.post('/api/auth/logout');
//     set({ user: null, isAuthenticated: false, accessToken: null });
//   },

//   updateProfile: async (updates) => {
//     const { data } = await api.put('/api/user/profile', updates);
//     set({ user: data.user });
//   },
// }));

import { create } from 'zustand';
import axios from 'axios';
import api from '../lib/api';

const BASE = import.meta.env.VITE_API_URL || '';

interface User {
  id: string; name: string; email: string; role: string;
  avatarUrl?: string; twoFactorEnabled?: boolean; isVerified?: boolean;
  emailPreferences?: {
    securityAlerts: boolean; loginNotifications: boolean;
    productUpdates: boolean; weeklyDigest: boolean;
  };
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (email: string, password: string, twoFaCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  accessToken: null,

  fetchProfile: async () => {
    try {
      // First attempt — use existing accessToken (attached by api interceptor)
      const { data } = await api.get('/api/user/profile');
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      // Profile failed — browser may have reopened and accessToken was wiped from memory
      // The refresh token cookie is still in the browser — try to use it
      try {
        const { data: refreshData } = await axios.post(
          `${BASE}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        // Got a new access token — store it
        if (refreshData.accessToken) {
          set({ accessToken: refreshData.accessToken });
        }
        // Retry profile now that we have a fresh token
        const { data } = await api.get('/api/user/profile');
        set({ user: data.user, isAuthenticated: true, isLoading: false });
      } catch {
        // Refresh also failed — session is truly expired or user never logged in
        set({ user: null, isAuthenticated: false, isLoading: false, accessToken: null });
      }
    }
  },

  login: async (email, password, twoFaCode) => {
    // Step 1: authenticate — backend returns accessToken in body
    const { data } = await api.post('/api/auth/login', {
      email, password,
      ...(twoFaCode ? { twoFaCode } : {}),
    });
    // Step 2: store access token so interceptor can attach it to every request
    if (data.accessToken) {
      set({ accessToken: data.accessToken });
    }
    // Step 3: fetch full profile so avatarUrl and all fields are populated
    await get().fetchProfile();
  },

  logout: async () => {
    await api.post('/api/auth/logout');
    set({ user: null, isAuthenticated: false, accessToken: null });
  },

  updateProfile: async (updates) => {
    const { data } = await api.put('/api/user/profile', updates);
    set({ user: data.user });
  },
}));