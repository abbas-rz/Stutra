import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/auth';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return authService.isAuthenticated() ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
