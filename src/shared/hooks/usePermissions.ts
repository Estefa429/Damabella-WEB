import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Permission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
}

const STORAGE_KEY = 'damabella_roles';

export function usePermissions() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  // Normalizar nombre de módulo (remover acentos)
  const normalizeModuleName = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }, []);

  // Obtener rol actual del usuario
  const getUserRole = useCallback((): string => {
    // Usar el estado que ya está cacheado
    if (currentUserRole) {
      return currentUserRole;
    }

    if (user?.role) {
      console.log(`✅ [usePermissions.getUserRole] User role from AuthContext:`, user.role);
      return user.role;
    }
    
    // Intento 2: localStorage damabella_user
    const savedUser = localStorage.getItem('damabella_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser.role) {
          console.log(`✅ [usePermissions.getUserRole] User role from localStorage['damabella_user']:`, parsedUser.role);
          return parsedUser.role;
        }
      } catch (e) {
        console.error('Error parsing saved user:', e);
      }
    }

    // Intento 3: Buscar en damabella_users el usuario Administrador
    try {
      const usersData = localStorage.getItem('damabella_users');
      if (usersData) {
        const users = JSON.parse(usersData);
        const adminUser = users.find((u: any) => 
          (u.nombre === 'Administrador Damabella' || u.name === 'Administrador Damabella') &&
          (u.activo === true || u.estado === 'Activo')
        );
        if (adminUser) {
          console.log(`✅ [usePermissions.getUserRole] Detected admin from damabella_users`);
          return 'Administrador';
        }
      }
    } catch (e) {
      console.error('Error detecting admin:', e);
    }
    
    console.warn(`⚠️ [usePermissions.getUserRole] No role found anywhere`);
    return '';
  }, [currentUserRole, user?.role]);

  useEffect(() => {
    const loadUserRole = () => {
      try {
        console.log(`📦 [usePermissions.loadUserRole] INICIANDO - user?.role:`, user?.role);
        
        // Determinar el rol actual
        let actualRole = '';
        
        // Prioridad 1: AuthContext
        if (user?.role) {
          actualRole = user.role;
          console.log(`✅ [usePermissions.loadUserRole] Rol desde AuthContext:`, actualRole);
        } 
        // Prioridad 2: localStorage damabella_user
        else {
          const savedUser = localStorage.getItem('damabella_user');
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              if (parsedUser.role) {
                actualRole = parsedUser.role;
                console.log(`✅ [usePermissions.loadUserRole] Rol desde localStorage['damabella_user']:`, actualRole);
              }
            } catch (e) {
              console.error('❌ [usePermissions.loadUserRole] Error parsing saved user:', e);
            }
          }
        }

        if (!actualRole) {
          console.warn(`⚠️ [usePermissions.loadUserRole] No se encontró rol de usuario, buscando en damabella_users...`);
          // Último intento: buscar en damabella_users
          const usersData = localStorage.getItem('damabella_users');
          if (usersData) {
            try {
              const users = JSON.parse(usersData);
              const currentLoggedUser = users.find((u: any) => u.activo === true || u.estado === 'Activo');
              if (currentLoggedUser?.role) {
                actualRole = currentLoggedUser.role;
                console.log(`✅ [usePermissions.loadUserRole] Rol desde damabella_users:`, actualRole);
              }
            } catch (e) {
              console.error('❌ Error parsing users:', e);
            }
          }
        }

        // Actualizar estado del rol
        setCurrentUserRole(actualRole);

        if (!actualRole) {
          console.warn(`⚠️ [usePermissions.loadUserRole] FINAL: No se encontró rol de usuario en ningún lado`);
          setUserRole(null);
          setIsLoading(false);
          return;
        }

        // Si es Admin, no necesita buscar en roles definidos
        if (actualRole === 'Administrador') {
          console.log(`🔑 [usePermissions.loadUserRole] Usuario es Administrador - Acceso Total`);
          setUserRole(null); // null = admin sin restricciones
          setIsLoading(false);
          return;
        }

        // Para otros roles, buscar en damabella_roles
        const stored = localStorage.getItem('damabella_roles');
        if (stored) {
          const roles: Role[] = JSON.parse(stored);
          console.log(`📋 [usePermissions.loadUserRole] Roles disponibles:`, roles.map(r => r.name));
          const found = roles.find(r => r.name === actualRole);
          if (found) {
            console.log(`✅ [usePermissions.loadUserRole] Permisos cargados para rol: ${actualRole}`, found);
            setUserRole(found);
          } else {
            console.warn(`⚠️ [usePermissions.loadUserRole] Rol "${actualRole}" no encontrado en damabella_roles`);
            setUserRole(null);
          }
        } else {
          console.warn(`⚠️ [usePermissions.loadUserRole] No hay roles definidos en localStorage['damabella_roles']`);
          setUserRole(null);
        }
      } catch (error) {
        console.error('❌ [usePermissions.loadUserRole] Error cargando permisos:', error);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserRole();

    // Escuchar cambios en roles desde otros tabs
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === 'damabella_roles' || e.key === 'damabella_user') && e.newValue) {
        console.log('🔄 [usePermissions] Roles/Usuario actualizados desde otro tab, recargando...');
        loadUserRole();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user?.role]);

  // Verificar si el usuario puede realizar una acción en un módulo
  const hasPermission = useCallback((module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'canView' | 'canCreate' | 'canEdit' | 'canDelete'): boolean => {
    // Normalizar acción (soportar ambos formatos)
    const normalizedAction = action.replace('can', '').toLowerCase() as 'view' | 'create' | 'edit' | 'delete';
    
    // Si es admin, acceso total
    if (currentUserRole === 'Administrador') {
      console.log(`🔑 [usePermissions.hasPermission] ADMIN: Acceso total a ${module}.${action}`);
      return true;
    }

    if (!userRole) {
      // Fallback: si no hay rol cargado, asumir admin
      if (!currentUserRole) {
        console.warn(`⚠️ [usePermissions.hasPermission] No hay rol, asumiendo Administrador por fallback para ${module}.${action}`);
        return true;
      }
      
      console.warn(`⚠️ [usePermissions.hasPermission] No hay rol cargado`);
      return false;
    }

    const normalizedModule = normalizeModuleName(module);
    const permission = userRole.permissions.find(p => normalizeModuleName(p.module) === normalizedModule);
    
    if (!permission) {
      console.warn(`⚠️ [usePermissions.hasPermission] Módulo no encontrado: ${module}`);
      return false;
    }

    const permissionKey = `can${normalizedAction.charAt(0).toUpperCase()}${normalizedAction.slice(1)}` as keyof Omit<Permission, 'module'>;
    const hasAccess = permission[permissionKey] === true;
    
    console.log(`🔐 [usePermissions.hasPermission] ${module}.${action} = ${hasAccess}`);
    return hasAccess;
  }, [userRole, currentUserRole, normalizeModuleName]);

  // Obtener todos los módulos que el usuario puede ver
  const getVisibleModules = useCallback((): string[] => {
    if (currentUserRole === 'Administrador') {
      // Admin puede ver todos
      return ['Usuarios', 'Roles', 'Categorias', 'Productos', 'Clientes', 'Proveedores', 'Tallas', 'Colores', 'Pedidos', 'Ventas', 'Compras', 'Devoluciones'];
    }
    
    if (!userRole) return [];
    
    return userRole.permissions
      .filter(p => p.canView)
      .map(p => p.module);
  }, [userRole, currentUserRole]);

  // Verificar si el usuario puede realizar cualquier acción en un módulo
  const canAccessModule = useCallback((module: string): boolean => {
    if (currentUserRole === 'Administrador') {
      return true;
    }
    
    if (!userRole || !currentUserRole) {
      return false;
    }
    
    const normalizedModule = normalizeModuleName(module);
    const permission = userRole.permissions.find(p => normalizeModuleName(p.module) === normalizedModule);
    return permission ? permission.canView || permission.canCreate || permission.canEdit || permission.canDelete : false;
  }, [userRole, currentUserRole, normalizeModuleName]);

  // Obtener todos los permisos para un módulo específico
  const getModulePermissions = useCallback((module: string): { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean } => {
    console.log(`🔍 [usePermissions.getModulePermissions] Buscando permisos para: ${module}, currentUserRole: ${currentUserRole}, userRole: ${userRole ? 'loaded' : 'null'}`);
    
    // Si es admin, acceso total
    if (currentUserRole === 'Administrador') {
      console.log(`🔑 [usePermissions.getModulePermissions] ADMIN: Acceso total a ${module}`);
      return { canView: true, canCreate: true, canEdit: true, canDelete: true };
    }

    if (!userRole) {
      // Fallback: si currentUserRole está vacío, asumimos que debería ser Admin
      if (!currentUserRole) {
        console.warn(`⚠️ [usePermissions.getModulePermissions] No hay rol cargado para ${module}, asumiendo Administrador por fallback`);
        return { canView: true, canCreate: true, canEdit: true, canDelete: true };
      }
      
      console.warn(`⚠️ [usePermissions.getModulePermissions] No hay rol cargado para ${module}`);
      return { canView: false, canCreate: false, canEdit: false, canDelete: false };
    }

    const normalizedModule = normalizeModuleName(module);
    const permission = userRole.permissions.find(p => normalizeModuleName(p.module) === normalizedModule);
    
    if (!permission) {
      console.warn(`⚠️ [usePermissions.getModulePermissions] Módulo no encontrado: ${module}`);
      return { canView: false, canCreate: false, canEdit: false, canDelete: false };
    }

    console.log(`✅ [usePermissions.getModulePermissions] ${module}:`, permission);
    return {
      canView: permission.canView,
      canCreate: permission.canCreate,
      canEdit: permission.canEdit,
      canDelete: permission.canDelete,
    };
  }, [userRole, currentUserRole, normalizeModuleName]);

  return {
    userRole,
    isLoading,
    getUserRole,
    hasPermission,
    getVisibleModules,
    canAccessModule,
    getModulePermissions,
  };
}
