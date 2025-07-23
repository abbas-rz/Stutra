import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/auth';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return authService.isAuthenticated() ? children : <Navigate to="/login" replace />;
}
