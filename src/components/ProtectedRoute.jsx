import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token || token === 'null' || token === 'undefined') {
    // Not logged in, redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Role not authorized, redirect to their respective dashboards or login
    if (role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (role === 'UTILISATEUR_COOP' || role === 'COOP' || role === 'COOPERATIVE') {
      return <Navigate to="/coop/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
