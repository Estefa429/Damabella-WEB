import React, { useState, useEffect } from "react";

// ✅ IMPORTS CORRECTOS (después de la reorganización)
import AppLayout from "./features/dashboard/components/AppLayout";
import ClienteApp from "./features/ecommerce/storefront/components/ClienteApp";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Verificar si hay sesión guardada al cargar
  useEffect(() => {
    const savedUser = localStorage.getItem("damabella_current_user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setIsAuthenticated(true);
      setCurrentUser(user);
    }
  }, []);

  const handleLogin = (user: any) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    // Guardar sesión
    localStorage.setItem("damabella_current_user", JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    // Limpiar sesión
    localStorage.removeItem("damabella_current_user");
  };

  // Si está autenticado y es Admin/Empleado, mostrar panel
  if (
    isAuthenticated &&
    (currentUser?.role === "Administrador" ||
      currentUser?.role === "Empleado")
  ) {
    return (
      <AppLayout currentUser={currentUser} onLogout={handleLogout} />
    );
  }

  // Para todos los demás (incluyendo no autenticados y clientes)
  return (
    <ClienteApp
      currentUser={currentUser}
      isAuthenticated={isAuthenticated}
      onLogin={handleLogin}
      onLogout={handleLogout}
    />
  );
}
