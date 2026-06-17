import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'administrador' | 'cliente' | 'empleado';
  requiredRoles?: ('administrador' | 'cliente' | 'empleado' | string)[];
  allowAdminPanel?: boolean;
  requiredModule?: string;
  requiredAction?: 'view' | 'create' | 'edit' | 'delete';
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  allowAdminPanel = false,
  requiredModule,
  requiredAction = 'view',
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isAdmin, isCliente, hasPermission } = useAuth();

  // Sin sesión → login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Panel admin: cualquier rol excepto Cliente puede entrar
  // Los permisos granulares se validan dentro de cada módulo
  if (allowAdminPanel) {
    if (isCliente()) {
      return <Navigate to="/" replace />;  // clientes van a la tienda
    }
    return <>{children}</>;  // admin, empleado, gerente, etc. — pasan todos
  }

  // Rol único requerido
  if (requiredRole) {
    const hasRole =
      (requiredRole === 'administrador' && isAdmin()) ||
      (requiredRole === 'cliente' && isCliente()) ||
      (requiredRole === 'empleado' && user.rol_name?.toLowerCase() === 'empleado');

    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  // Múltiples roles permitidos
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = user.rol_name?.toLowerCase() ?? '';
    const hasAnyRole = requiredRoles.some(role => userRole === role.toLowerCase()) || isAdmin();
    if (!hasAnyRole) {
      return <Navigate to="/" replace />;
    }
  }

  // Permiso granular por módulo
  if (requiredModule && !hasPermission(requiredModule, requiredAction)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}