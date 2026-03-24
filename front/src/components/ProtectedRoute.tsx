// import { useEffect } from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuthStore } from '../store/authStore';
// import { Spinner } from './ui';

// interface Props {
//   children: React.ReactNode;
//   requireAdmin?: boolean;
// }

// export const ProtectedRoute: React.FC<Props> = ({ children, requireAdmin }) => {
//   const { isAuthenticated, isLoading, user, fetchProfile } = useAuthStore();
//   const location = useLocation();

//   useEffect(() => {
//     if (!isAuthenticated && !isLoading) fetchProfile();
//   }, []);

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-surface-50">
//         <Spinner className='md' />
//       </div>
//     );
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   if (requireAdmin && user?.role !== 'admin') {
//     return <Navigate to="/403" replace />;
//   }

//   return <>{children}</>;
// };
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<Props> = ({ children, requireAdmin }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // isLoading check is gone — App.tsx already blocks until auth is resolved.
  // By the time any route renders, we know the auth state for certain.

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};