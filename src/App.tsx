import React from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "./shared/contexts/AuthContext";
import AppLayout from "./features/dashboard/components/AppLayout";
import ClienteApp from "./features/ecommerce/storefront/components/ClienteApp";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { RecoverPassword } from "./features/auth/pages/RecoverPassword";

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();

  // Admin o rol con nombre que contenga 'admin'
  const isAdmin = user?.rol_name?.toLowerCase() === 'administrador';

  return (
    <Routes>
      {/* Rutas públicas de autenticación */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/recover-password" element={<RecoverPassword />} />

      {/* Ruta comodín para el cliente o admin */}
      <Route
        path="/*"
        element={
          <ErrorBoundary>
            {isAuthenticated && isAdmin ? (
              <AppLayout currentUser={user} onLogout={logout} />
            ) : (
              <ClienteApp
                currentUser={user}
                isAuthenticated={isAuthenticated}
                onLogout={logout}
              />
            )}
          </ErrorBoundary>
        }
      />
    </Routes>
  );
}