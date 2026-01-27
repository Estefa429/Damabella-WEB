
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
  
  console.log('🔐 [AuthContext.initializeAuthSystem] Verificando datos de autenticación...');
  
  // Limpiar SOLO la sesión actual, NO borrar los usuarios guardados
  localStorage.removeItem('damabella_user');
  console.log('✅ [AuthContext] Sesión local limpiada');
  
  // Solo crear admin si NO existen usuarios
  const existingUsers = localStorage.getItem(USERS_STORAGE_KEY);
  if (!existingUsers) {
    console.log('📝 [AuthContext] No existen usuarios, creando admin por defecto...');
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
    console.log('✅ [AuthContext] Admin creado por defecto');
  } else {
    console.log('✅ [AuthContext] Usuarios existentes preservados');
  }
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
    console.log(`🔐 [AuthContext.login] Intentando login: ${email}`);
    // Buscar usuario en localStorage
    const USERS_STORAGE_KEY = 'damabella_users';
    const usersData = localStorage.getItem(USERS_STORAGE_KEY);
    
    console.log(`📦 [AuthContext.login] usuarios almacenados:`, usersData ? JSON.parse(usersData).length : 0);
    
    if (usersData) {
      const users = JSON.parse(usersData);
      const foundUser = users.find((u: any) => u.email === email && u.password === password && (u.activo || u.estado === 'Activo'));
      
      if (foundUser) {
        console.log(`✅ [AuthContext.login] Usuario encontrado:`, foundUser);
        // Convertir usuario a formato compatible
        const authenticatedUser: User = {
          id: foundUser.id.toString(),
          name: foundUser.nombre || foundUser.name,
          email: foundUser.email,
          document: foundUser.numeroDoc || foundUser.documento,
          phone: foundUser.celular || foundUser.phone,
          address: foundUser.direccion || foundUser.address,
          role: foundUser.role || foundUser.rol || 'Cliente', // ← Buscar en ambos campos
          status: foundUser.activo ? 'Activo' : (foundUser.estado || 'Inactivo'),
          image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
          createdAt: foundUser.createdAt || foundUser.fechaCreacion,
        };
        
        console.log(`✅ [AuthContext.login] Usuario autenticado con rol:`, authenticatedUser.role);
        setUser(authenticatedUser);
        localStorage.setItem('damabella_user', JSON.stringify(authenticatedUser));
        return true;
      } else {
        console.log(`❌ [AuthContext.login] Usuario no encontrado o credenciales incorrectas`);
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