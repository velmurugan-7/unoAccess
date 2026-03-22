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
//   user: User | null; isLoading: boolean; isAuthenticated: boolean;
//   login: (email: string, password: string, twoFaCode?: string) => Promise<void>;
//   logout: () => Promise<void>;
//   fetchProfile: () => Promise<void>;
//   updateProfile: (data: Partial<User>) => Promise<void>;
// }

// export const useAuthStore = create<AuthState>((set, get) => ({
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
//     // Step 1: authenticate and get session cookie
//     await api.post('/api/auth/login', {
//       email, password,
//       ...(twoFaCode ? { twoFaCode } : {}),
//     });
//     // Step 2: fetch FULL profile so avatarUrl and all fields are populated
//     // This is the fix for avatar not appearing after login without refresh
//     await get().fetchProfile();
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
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;  // ← new
  login: (email: string, password: string, twoFaCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  accessToken: null,  // ← new

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
    // Step 1: authenticate — backend returns accessToken in body now
    const { data } = await api.post('/api/auth/login', {
      email, password,
      ...(twoFaCode ? { twoFaCode } : {}),
    });
    // Step 2: store the access token so interceptor can attach it
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