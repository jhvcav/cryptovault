import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: ReactNode;
}

// Mock admin check - in a real app, this would check against an actual admin role
const isAdmin = () => {
  // This is just a placeholder
  // In a real application, you would check if the current user has admin privileges
  return true;
};

const AdminRoute = ({ children }: AdminRouteProps) => {
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;