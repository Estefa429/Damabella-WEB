import React from "react";
import { useAuth } from "./shared/contexts/AuthContext"; // ← ajusta el path
import AppLayout from "./features/dashboard/components/AppLayout";
import ClienteApp from "./features/ecommerce/storefront/components/ClienteApp";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";

export default function App() {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Admin o rol con nombre que contenga 'admin'
  const isAdmin = user?.rol_name?.toLowerCase() === 'administrador';

  const handleLogin = () => {};

  if (isAuthenticated && isAdmin) {
    return (
      <ErrorBoundary>
        <AppLayout currentUser={user} onLogout={logout} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ClienteApp
        currentUser={user}
        isAuthenticated={isAuthenticated}
        onLogin={handleLogin}
        onLogout={logout}
      />
    </ErrorBoundary>
  );
}