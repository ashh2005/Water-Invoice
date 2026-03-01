import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface CustomerProtectedRouteProps {
  children: React.ReactNode;
}

export const CustomerProtectedRoute: React.FC<CustomerProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useCustomerAuth();

  if (loading) return <LoadingSpinner />;

  if (!isAuthenticated) return <Navigate to="/customer-login" replace />;

  return <>{children}</>;
};
