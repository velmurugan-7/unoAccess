import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useAuthStore } from './store/authStore';

export default function App() {
  const { fetchProfile } = useAuthStore();

  useEffect(() => {
    // Try to restore session on app load
    fetchProfile();
  }, []);

  return <RouterProvider router={router} />;
}
