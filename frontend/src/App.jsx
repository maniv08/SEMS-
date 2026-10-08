
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DesignPreview } from './pages/DesignPreview';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { History } from './pages/History';
import { Alerts } from './pages/Alerts';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminUnits } from './pages/admin/AdminUnits';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminBuildings } from './pages/admin/AdminBuildings';
import { AdminEnergyMonitoring } from './pages/admin/AdminEnergyMonitoring';
import { AdminReports } from './pages/admin/AdminReports';
import { Predictions } from './pages/Predictions';
import { Recommendations } from './pages/Recommendations';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { Landing } from './pages/Landing';
import { NotFound } from './pages/NotFound';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Welcome } from './pages/Welcome';
import { CookieBanner } from './components/shared/CookieBanner';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CookieBanner />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/welcome" element={<Welcome />} />
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/history" element={<History />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/predictions" element={<Predictions />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/profile" element={<Profile />} />
                
                <Route element={<ProtectedRoute requireAdmin={true} />}>
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/units" element={<AdminUnits />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/buildings" element={<AdminBuildings />} />
                  <Route path="/admin/energy" element={<AdminEnergyMonitoring />} />
                  <Route path="/admin/reports" element={<AdminReports />} />
                </Route>
                <Route path="/design-preview" element={<DesignPreview />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
