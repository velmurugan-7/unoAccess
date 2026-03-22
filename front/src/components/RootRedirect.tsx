import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Spinner } from './ui';

const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Spinner/>
      </div>
    );
  }

  return isAuthenticated
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/landing" replace />;
};

export default RootRedirect;
