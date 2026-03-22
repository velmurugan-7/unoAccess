// import { create } from 'zustand';
// import api from '../lib/api';

// interface User {
//   id: string; name: string; email: string; role: string;
//   avatarUrl?: string; twoFactorEnabled?: boolean; isVerified?: boolean;
//   emailPreferences?: { securityAlerts: boolean; loginNotifications: boolean; productUpdates: boolean; weeklyDigest: boolean; };
// }

// interface AuthState {
//   user: User | null; isLoading: boolean; isAuthenticated: boolean;
//   login: (email: string, password: string, twoFaCode?: string) => Promise<void>;
//   logout: () => Promise<void>;
//   fetchProfile: () => Promise<void>;
//   updateProfile: (data: Partial<User>) => Promise<void>;
// }

// export const useAuthStore = create<AuthState>((set) => ({
//   user: null, isLoading: true, isAuthenticated: false,

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
//     const { data } = await api.post('/api/auth/login', { email, password, ...(twoFaCode ? { twoFaCode } : {}) });
//     set({ user: data.user, isAuthenticated: true });
//   },

//   logout: async () => {
//     await api.post('/api/auth/logout');
//     set({ user: null, isAuthenticated: false });
//   },

//   updateProfile: async (updates) => {
//     const { data } = await api.put('/api/user/profile', updates);
//     set({ user: data.user });
//   },
// }));

import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string; name: string; email: string; role: string;
  avatarUrl?: string; twoFactorEnabled?: boolean; isVerified?: boolean;
  emailPreferences?: {
    securityAlerts: boolean; loginNotifications: boolean;
    productUpdates: boolean; weeklyDigest: boolean;
  };
}

interface AuthState {
  user: User | null; isLoading: boolean; isAuthenticated: boolean;
  login: (email: string, password: string, twoFaCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, isLoading: true, isAuthenticated: false,

  fetchProfile: async () => {
    try {
      const { data } = await api.get('/api/user/profile');
      set({ user: data.user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password, twoFaCode) => {
    // Step 1: authenticate and get session cookie
    await api.post('/api/auth/login', {
      email, password,
      ...(twoFaCode ? { twoFaCode } : {}),
    });
    // Step 2: fetch FULL profile so avatarUrl and all fields are populated
    // This is the fix for avatar not appearing after login without refresh
    await get().fetchProfile();
  },

  logout: async () => {
    await api.post('/api/auth/logout');
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: async (updates) => {
    const { data } = await api.put('/api/user/profile', updates);
    set({ user: data.user });
  },
}));