import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const userStr = localStorage.getItem('user'); 
  const user = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem('accessToken');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.user_role)) {
    if (user.user_role === 4) return <Navigate to="/admin" replace />;
    if ([1, 2, 3].includes(user.user_role)) return <Navigate to="/consultant" replace />;
    
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;