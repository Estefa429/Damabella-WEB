import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API } from '@/services/ApiConfigure';
// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Permissions {
  [module: string]: string[];
}

interface AuthUser {
  id: number;
  name: string;
  email: string;
  rol: number;
  rol_name: string;
  permissions: Permissions;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (module: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Al montar — verificar si hay sesión guardada
  useEffect(() => {
    const savedUser = localStorage.getItem('damabella_current_user');
    const token = localStorage.getItem('damabella_access_token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('damabella_current_user');
        localStorage.removeItem('damabella_access_token');
        localStorage.removeItem('damabella_refresh_token');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await API.post('/auth/login/', {
        email,
        password
      });

      const data = response.data;

      if (data.success) {
        // Guardar tokens
        localStorage.setItem('damabella_access_token', data.access);
        localStorage.setItem('damabella_refresh_token', data.refresh);
        localStorage.setItem('damabella_current_user', JSON.stringify(data.user));

        setUser(data.user);
        return { success: true };
      }

      return { success: false, message: 'Credenciales incorrectas' };

    } catch (error) {
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('damabella_access_token');
    localStorage.removeItem('damabella_refresh_token');
    localStorage.removeItem('damabella_current_user');
  };

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (module: string, action: string): boolean => {
    if (!user?.permissions) return false;
    return user.permissions[module]?.includes(action) ?? false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      hasPermission,
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