import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'staff';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  // TODO: Implement actual authentication check
  const isAuthenticated = localStorage.getItem('token') !== null;
  const userRole = localStorage.getItem('userRole') || 'staff';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};