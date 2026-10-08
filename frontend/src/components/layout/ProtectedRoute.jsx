import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center text-muted">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
