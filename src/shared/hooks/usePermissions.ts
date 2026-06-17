import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// ─── Módulos públicos (acceso View sin autenticación) ─────────────────────────
const PUBLIC_MODULES = ['Productos', 'Categorias'];

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface ModulePermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const MODULE_ALIASES: Record<string, string[]> = {
  ventas: ['sales'],
  sales: ['ventas'],
  compras: ['purchases'],
  purchases: ['compras'],
  productos: ['products'],
  products: ['productos'],
  categorias: ['categories', 'category'],
  categories: ['categorias', 'categoria'],
  clientes: ['clients'],
  clients: ['clientes'],
  pedidos: ['orders'],
  orders: ['pedidos'],
  devoluciones: ['returns'],
  returns: ['devoluciones'],
  proveedores: ['suppliers'],
  suppliers: ['proveedores'],
  usuarios: ['users'],
  users: ['usuarios'],
  permisos: ['permissions'],
  permissions: ['permisos'],
  dashboard: ['dashboard'],
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function usePermissions() {
  const { user, isAdmin: isUserAdmin } = useAuth();

  // Normalizar nombre de módulo (sin acentos, minúsculas)
  const normalizeModuleName = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }, []);

  // Verificar si dos nombres de módulo coinciden (considerando aliases)
  const modulesMatch = useCallback((moduleKey: string, targetModule: string): boolean => {
    const normalizedKey = normalizeModuleName(moduleKey);
    const normalizedTarget = normalizeModuleName(targetModule);

    if (normalizedKey === normalizedTarget) return true;
    if (MODULE_ALIASES[normalizedKey]?.includes(normalizedTarget)) return true;
    if (MODULE_ALIASES[normalizedTarget]?.includes(normalizedKey)) return true;

    return false;
  }, [normalizeModuleName]);

  // ¿Es módulo público?
  const isPublicModule = useCallback((module: string): boolean => {
    const normalized = normalizeModuleName(module);
    return PUBLIC_MODULES.some((m) => normalizeModuleName(m) === normalized);
  }, [normalizeModuleName]);

  // ¿Es administrador?
  const isAdmin = useCallback((): boolean => {
    return isUserAdmin();
  }, [isUserAdmin]);

  // Buscar acciones del usuario para un módulo desde el token
  // user.permissions = { "Usuarios": ["View", "Create", ...], ... }
  const getModuleActions = useCallback((module: string): string[] => {
    if (!user?.permissions) return [];
    for (const [key, actions] of Object.entries(user.permissions)) {
      if (modulesMatch(key, module)) {
        return actions;
      }
    }
    return [];
  }, [user?.permissions, modulesMatch]);

  // ─── getModulePermissions ─────────────────────────────────────────────────
  const getModulePermissions = useCallback((module: string): ModulePermissions => {
    // Admin: acceso total
    if (isAdmin()) {
      return { canView: true, canCreate: true, canEdit: true, canDelete: true };
    }

    // Sin sesión: solo View en módulos públicos
    if (!user) {
      const isPublic = isPublicModule(module);
      return {
        canView:   isPublic,
        canCreate: false,
        canEdit:   false,
        canDelete: false,
      };
    }

    // Usuario autenticado: leer del token
    const actions = getModuleActions(module);
    return {
      canView:   actions.includes('View'),
      canCreate: actions.includes('Create'),
      canEdit:   actions.includes('Edit'),
      canDelete: actions.includes('Delete'),
    };
  }, [user, isAdmin, isPublicModule, getModuleActions]);

  // ─── hasPermission ────────────────────────────────────────────────────────
  const hasPermission = useCallback((
    module: string,
    action: 'view' | 'create' | 'edit' | 'delete' | 'canView' | 'canCreate' | 'canEdit' | 'canDelete' = 'view'
  ): boolean => {
    // Admin: acceso total
    if (isAdmin()) return true;

    // Sin sesión: solo View en módulos públicos
    if (!user) {
      const normalized = action.replace('can', '').toLowerCase();
      return normalized === 'view' && isPublicModule(module);
    }

    // Normalizar acción: 'canView' → 'View', 'view' → 'View'
    const normalized = action
      .replace('can', '')
      .replace(/^\w/, (c) => c.toUpperCase());

    return getModuleActions(module).includes(normalized);
  }, [user, isAdmin, isPublicModule, getModuleActions]);

  // ─── canAccessModule ──────────────────────────────────────────────────────
  const canAccessModule = useCallback((module: string): boolean => {
    if (isAdmin()) return true;
    if (!user) return isPublicModule(module);
    return getModuleActions(module).length > 0;
  }, [user, isAdmin, isPublicModule, getModuleActions]);

  // ─── getVisibleModules ────────────────────────────────────────────────────
  const getVisibleModules = useCallback((): string[] => {
    if (isAdmin()) {
      return [
        'Usuarios', 'Roles', 'Categorias', 'Productos', 'Clientes',
        'Proveedores', 'Tallas', 'Colores', 'Pedidos', 'Ventas',
        'Compras', 'Devoluciones',
      ];
    }

    // Sin sesión: solo módulos públicos
    if (!user) return PUBLIC_MODULES;

    // Usuario autenticado: módulos donde tiene View
    return Object.entries(user.permissions)
      .filter(([, actions]) => actions.includes('View'))
      .map(([module]) => module);
  }, [user, isAdmin]);

  return {
    isLoading: false,
    isAdmin,
    hasPermission,
    getModulePermissions,
    canAccessModule,
    getVisibleModules,
    modulesMatch,
    normalizeModuleName,
  };
}
