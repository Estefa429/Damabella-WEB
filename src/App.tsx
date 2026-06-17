import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './shared/contexts/AuthContext';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import AppLayout from './features/dashboard/components/AppLayout';
import ClienteApp from './features/ecommerce/storefront/components/ClienteApp';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { RecoverPassword } from './features/auth/pages/RecoverPassword';

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/recover-password" element={<RecoverPassword />} />

      <Route
        path="/admin/*"
        element={
          <ErrorBoundary>
            <ProtectedRoute allowAdminPanel={true}>
              <AppLayout />
            </ProtectedRoute>
          </ErrorBoundary>
        }
      />

      <Route
        path="/*"
        element={
          <ErrorBoundary>
            <ClienteApp
              currentUser={user}
              isAuthenticated={isAuthenticated}
              onLogout={logout}
            />
          </ErrorBoundary>
        }
      />
    </Routes>
  );
}