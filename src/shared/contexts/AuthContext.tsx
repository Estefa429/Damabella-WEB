import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Loader } from 'lucide-react';
import { API } from '@/services/ApiConfigure';
// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Permissions {
  [module: string]: string[];
}

interface PermissionObject {
  modulo: string;
  action: string;
}

interface AuthUser {
  id: number;
  name: string;
  email: string;
  rol: number | string;
  rol_name: string;
  role?: string;
  permissions: Permissions;
  [key: string]: any;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: AuthUser }>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
  isAuthenticated: boolean;
  isAdmin: () => boolean;
  isCliente: () => boolean;
  hasPermission: (module: string, action: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeModuleName = (name: string): string => {
  return name
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const normalizePermissionAction = (action: any): string => {
  const normalized = action?.toString().trim().toLowerCase();
  switch (normalized) {
    case 'view':
      return 'View';
    case 'create':
      return 'Create';
    case 'edit':
      return 'Edit';
    case 'delete':
      return 'Delete';
    default:
      return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '';
  }
};

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

const modulesMatch = (moduleKey: string, targetModule: string): boolean => {
  const normalizedKey = normalizeModuleName(moduleKey);
  const normalizedTarget = normalizeModuleName(targetModule);

  if (normalizedKey === normalizedTarget) return true;
  if (MODULE_ALIASES[normalizedKey]?.includes(normalizedTarget)) return true;
  if (MODULE_ALIASES[normalizedTarget]?.includes(normalizedKey)) return true;

  return false;
};

const normalizePermissions = (rawPermissions: any): Permissions => {
  if (!rawPermissions) return {};

  if (Array.isArray(rawPermissions)) {
    const permissions: Permissions = {};

    rawPermissions.forEach((entry: any) => {
      const moduleName = entry?.modulo ?? entry?.module ?? entry?.mod ?? '';
      const actionName = entry?.action ?? entry?.accion ?? entry?.permiso ?? '';
      if (!moduleName || !actionName) return;

      const action = normalizePermissionAction(actionName);
      const existingModule = Object.keys(permissions).find((key) => modulesMatch(key, moduleName));
      const moduleKey = existingModule ?? moduleName;

      permissions[moduleKey] = Array.from(new Set([...(permissions[moduleKey] ?? []), action]));
    });

    return permissions;
  }

  if (typeof rawPermissions === 'object') {
    const permissions: Permissions = {};
    Object.entries(rawPermissions).forEach(([moduleName, actions]) => {
      if (!Array.isArray(actions)) return;
      permissions[moduleName] = Array.from(
        new Set(actions.map((action) => normalizePermissionAction(action)))
      );
    });
    return permissions;
  }

  return {};
};

const normalizeAuthUser = (rawUser: any): AuthUser => {
  if (!rawUser) {
    return {
      id: 0,
      name: '',
      email: '',
      rol: 0,
      rol_name: '',
      permissions: {},
    };
  }

  const rawRoleName = rawUser?.role_name ?? rawUser?.rol_name ?? rawUser?.role ?? rawUser?.rol ?? '';

  return {
    ...rawUser,
    id: rawUser?.id ?? rawUser?.userId ?? rawUser?.id_usuario ?? rawUser?.id_user ?? 0,
    name: rawUser?.name ?? rawUser?.nombre ?? '',
    email: rawUser?.email ?? '',
    rol: rawUser?.rol ?? rawUser?.roleId ?? rawUser?.rol_id ?? rawUser?.role ?? rawUser?.id_rol ?? 0,
    role: rawUser?.role ?? rawUser?.role_name ?? rawUser?.rol_name ?? rawUser?.rol ?? undefined,
    rol_name: String(rawRoleName),
    permissions: normalizePermissions(rawUser?.permissions ?? rawUser?.permisos ?? rawUser?.permissions_array ?? rawUser?.permisos_array),
  };
};

const AUTH_TOKEN_KEY = 'damabella_access_token';
const AUTH_TOKEN_ALIAS_KEY = 'damabella_token';
const AUTH_REFRESH_TOKEN_KEY = 'damabella_refresh_token';
const AUTH_USER_KEY = 'damabella_current_user';
const AUTH_USER_ALIAS_KEY = 'damabella_user';

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al montar — verificar si hay sesión guardada y rehidratar sesión
  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(AUTH_USER_ALIAS_KEY);
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_ALIAS_KEY);

    if (savedUser && token) {
      try {
        setUser(normalizeAuthUser(JSON.parse(savedUser)));
      } catch {
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem(AUTH_USER_ALIAS_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_TOKEN_ALIAS_KEY);
        localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
          <p className="text-gray-600">Validando sesión...</p>
        </div>
      </div>
    );
  }

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string; user?: AuthUser }> => {
    try {
      const response = await API.post('/auth/login/', {
        email,
        password,
      });

      const data = response.data;

      if (data.success) {
        const normalizedUser = normalizeAuthUser(data.user);
        const accessToken = data.access ?? data.token ?? data.access_token;
        const refreshToken = data.refresh ?? data.refresh_token;

        if (accessToken) {
          localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
          localStorage.setItem(AUTH_TOKEN_ALIAS_KEY, accessToken);
        }

        if (refreshToken) {
          localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
        }

        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser));
        localStorage.setItem(AUTH_USER_ALIAS_KEY, JSON.stringify(normalizedUser));

        setUser(normalizedUser);
        return { success: true, user: normalizedUser };
      }

      return { success: false, message: 'Credenciales incorrectas' };
    } catch (error) {
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_TOKEN_ALIAS_KEY);
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_USER_ALIAS_KEY);
  };

  const updateUser = (updatedUser: AuthUser) => {
    const normalizedUser = normalizeAuthUser(updatedUser);
    setUser(normalizedUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser));
    localStorage.setItem(AUTH_USER_ALIAS_KEY, JSON.stringify(normalizedUser));
  };

  const isAdmin = () => {
    if (!user) return false;
    const roleName = (user.rol_name ?? user.role ?? '').toString().toLowerCase().trim();
    const roleId = Number(user.rol);
    return roleName === 'administrador' || roleName === 'admin' || roleId === 1;
  };

  const isCliente = () => {
    if (!user) return false;
    const roleName = (user.rol_name ?? user.role ?? user.rol ?? '').toString().toLowerCase().trim();
    const roleId = Number(user.rol);
    return roleName === 'cliente' || roleName === 'clientes' || roleName === 'client' || roleName === 'clients' || roleId === 2;
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    if (isAdmin()) return true;
    if (!user.permissions) return false;

    const normalizedAction = normalizePermissionAction(action);

    return Object.entries(user.permissions).some(([moduleName, actions]) => {
      return modulesMatch(moduleName, module) && actions.includes(normalizedAction);
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateUser,
      isAuthenticated: !!user,
      isAdmin,
      isCliente,
      hasPermission,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}