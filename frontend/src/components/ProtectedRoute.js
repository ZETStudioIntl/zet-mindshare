import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ZetSpinnerScreen } from './LoadingScreens';

const ProtectedRoute = ({ children, loader }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return loader ?? <ZetSpinnerScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
