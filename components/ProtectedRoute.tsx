import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const token = useUserStore((state) => state.token);
  const userType = useUserStore((state) => state.userType);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userType && !allowedRoles.includes(userType)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
