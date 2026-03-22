// import axios from 'axios';
// import { useAuthStore } from '../store/authStore';

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || '',
//   withCredentials: true, // send cookies
//   headers: { 'Content-Type': 'application/json' },
// });

// // Auto-refresh on 401
// let isRefreshing = false;
// let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (v: unknown) => void }> = [];

// const processQueue = (error: unknown) => {
//   failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(null)));
//   failedQueue = [];
// };

// api.interceptors.response.use(
//   (res) => res,
//   async (error) => {
//     const originalRequest = error.config;
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         }).then(() => api(originalRequest)).catch((e) => Promise.reject(e));
//       }
//       originalRequest._retry = true;
//       isRefreshing = true;
//       try {
//         await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {}, { withCredentials: true });
//         processQueue(null);
//         return api(originalRequest);
//       } catch (e) {
//         processQueue(e);
//         // window.location.href = '/login';
//         useAuthStore.setState({ user: null, isAuthenticated: false });
//         return Promise.reject(e);
//       } finally {
//         isRefreshing = false;
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token from store to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (v: unknown) => void }> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(null)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest)).catch((e) => Promise.reject(e));
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${BASE}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        // Store new access token
        if (data.accessToken) {
          useAuthStore.setState({ accessToken: data.accessToken });
        }
        processQueue(null);
        return api(originalRequest);
      } catch (e) {
        processQueue(e);
        useAuthStore.setState({ user: null, isAuthenticated: false, accessToken: null });
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;