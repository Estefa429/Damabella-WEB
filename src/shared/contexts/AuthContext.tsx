
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Función para inicializar sistema de autenticación limpio
const initializeAuthSystem = () => {
  const USERS_STORAGE_KEY = 'damabella_users';
  
  // Limpiar SOLO datos de sesión y usuarios, preservar datos administrativos
  localStorage.removeItem('damabella_user');
  localStorage.removeItem(USERS_STORAGE_KEY);
  
  // Crear cuenta de administrador
  const adminUser = {
    id: 1,
    nombre: 'Administrador Damabella',
    email: 'pabonjuanjose6@gmail.com',
    password: 'Joses421700#',
    tipoDoc: 'CC',
    numeroDoc: '0000000001',
    celular: '3001234567',
    direccion: 'Administración',
    roleId: 1,
    role: 'Administrador',
    activo: true,
    createdAt: new Date().toISOString()
  };
  
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([adminUser]));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Inicializar sistema de autenticación limpio
    initializeAuthSystem();
    
    // Verificar si hay sesión guardada
    const savedUser = localStorage.getItem('damabella_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Buscar usuario en localStorage
    const USERS_STORAGE_KEY = 'damabella_users';
    const usersData = localStorage.getItem(USERS_STORAGE_KEY);
    
    if (usersData) {
      const users = JSON.parse(usersData);
      const foundUser = users.find((u: any) => u.email === email && u.password === password && u.activo);
      
      if (foundUser) {
        // Convertir usuario a formato compatible
        const authenticatedUser: User = {
          id: foundUser.id.toString(),
          name: foundUser.nombre,
          email: foundUser.email,
          document: foundUser.numeroDoc,
          phone: foundUser.celular,
          address: foundUser.direccion,
          role: foundUser.role,
          status: foundUser.activo ? 'Activo' : 'Inactivo',
          image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
          createdAt: foundUser.createdAt,
        };
        
        setUser(authenticatedUser);
        localStorage.setItem('damabella_user', JSON.stringify(authenticatedUser));
        return true;
      }
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('damabella_user');
  };

  const updateProfile = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('damabella_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateProfile,
        isAuthenticated: !!user,
      }}
    >
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