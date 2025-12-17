import React, { useState, useEffect } from "react";

// ✅ IMPORTS CORRECTOS (después de la reorganización)
import AppLayout from "./features/dashboard/components/AppLayout";
import ClienteApp from "./features/ecommerce/storefront/components/ClienteApp";
import { initializeAdminStorage, addSuperAdmin } from "./shared/utils/initializeStorage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar storage administrativo al cargar la app
  useEffect(() => {
    console.log('\n🚀 [App] ========== INICIANDO APLICACIÓN ==========');
    
    // Solo inicializar si es la primera vez (no existe damabella_users)
    if (!localStorage.getItem('damabella_users')) {
      console.log('📝 [App] Primera inicialización, creando usuario admin...');
      initializeAdminStorage();
    } else {
      console.log('✅ [App] Storage ya inicializado, sin reset');
    }
    
    // Agregar super admin si no existe (sin tocar nada)
    addSuperAdmin();
    
    setIsInitialized(true);
  }, []);

  // Verificar si hay sesión guardada al cargar
  useEffect(() => {
    if (!isInitialized) return;
    
    console.log('\n👤 [App] Verificando sesión guardada...');
    const savedUser = localStorage.getItem("damabella_current_user");
    
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        console.log(`✅ [App] Sesión encontrada: ${user.email} (Rol: ${user.role})`);
        setIsAuthenticated(true);
        setCurrentUser(user);
      } catch (error) {
        console.error("❌ [App] Error cargando sesión guardada:", error);
        localStorage.removeItem("damabella_current_user");
      }
    } else {
      console.log('ℹ️ [App] No hay sesión guardada. Usuario no autenticado.');
    }
  }, [isInitialized]);

  const handleLogin = (user: any) => {
    console.log(`\n✅ [App.handleLogin] Login exitoso`);
    console.log(`👤 [App.handleLogin] Usuario: ${user.nombre}`);
    console.log(`📧 [App.handleLogin] Email: ${user.email}`);
    console.log(`🎭 [App.handleLogin] Rol: ${user.role}`);
    
    setIsAuthenticated(true);
    setCurrentUser(user);
    // Guardar sesión
    localStorage.setItem("damabella_current_user", JSON.stringify(user));
    
    console.log(`💾 [App.handleLogin] Sesión guardada en localStorage\n`);
  };

  const handleLogout = () => {
    console.log(`\n🚪 [App.handleLogout] Cerrando sesión...`);
    console.log(`👤 [App.handleLogout] Usuario: ${currentUser?.email}`);
    
    setIsAuthenticated(false);
    setCurrentUser(null);
    // Limpiar sesión
    localStorage.removeItem("damabella_current_user");
    
    console.log(`✅ [App.handleLogout] Sesión cerrada\n`);
  };

  // Si no se ha inicializado el storage, no renderizar nada
  if (!isInitialized) {
    return <div>Cargando...</div>;
  }

  // Log del estado actual
  console.log(`\n🔄 [App.render] Estado actual:`);
  console.log(`  - isAuthenticated: ${isAuthenticated}`);
  console.log(`  - currentUser: ${currentUser ? currentUser.email : 'null'}`);
  console.log(`  - role: ${currentUser ? currentUser.role : 'null'}`);

  // Si está autenticado y es Admin, mostrar panel administrativo
  if (isAuthenticated && currentUser?.role === "Administrador") {
    console.log(`✅ [App.render] Renderizando: DASHBOARD ADMINISTRATIVO\n`);
    return (
      <AppLayout currentUser={currentUser} onLogout={handleLogout} />
    );
  }

  // Para todos los demás (incluyendo no autenticados y clientes)
  console.log(`✅ [App.render] Renderizando: MÓDULO DE CLIENTE\n`);
  return (
    <ClienteApp
      currentUser={currentUser}
      isAuthenticated={isAuthenticated}
      onLogin={handleLogin}
      onLogout={handleLogout}
    />
  );
}
