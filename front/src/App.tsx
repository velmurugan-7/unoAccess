import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useAuthStore } from './store/authStore';
import { Spinner } from './components/ui';

export default function App() {
  const { fetchProfile,isLoading } = useAuthStore();

  useEffect(() => {
    // Try to restore session on app load
    fetchProfile();
  }, []);
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Spinner className="md" />
      </div>
    );
  }
  return <RouterProvider router={router} />;
}
