/**
 * Archivo: clienteRegistroService.ts
 * Propósito: Manejo de registro de clientes desde el Ecommerce
 * Funcionalidad:
 *  - Crear usuario automáticamente al registrar cliente
 *  - Crear cliente asociado automáticamente
 *  - Validaciones de email único y documento único
 *  - Relaciones entre usuario y cliente
 */

const USERS_KEY = 'damabella_users';
const CLIENTES_KEY = 'damabella_clientes';

/**
 * Interface para Usuario en localStorage
 */
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password: string;
  tipoDoc: string;
  numeroDoc: string;
  celular: string;
  direccion: string;
  role: 'Administrador' | 'Empleado' | 'Cliente';
  roleId: number;
  status: 'Activo' | 'Inactivo';
  clienteId?: string; // ID del cliente asociado
  createdAt: string;
}

/**
 * Interface para Cliente en localStorage
 */
export interface Cliente {
  id: string;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  ciudad: string;
  email: string;
  direccion: string;
  userId?: string; // ID del usuario asociado (si existe)
  estado: 'Activo' | 'Inactivo';
  createdAt: string;
}

/**
 * Obtener todos los usuarios desde localStorage
 */
export const getStoredUsers = (): Usuario[] => {
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Obtener todos los clientes desde localStorage
 */
export const getStoredClientes = (): Cliente[] => {
  const stored = localStorage.getItem(CLIENTES_KEY);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Guardar usuarios en localStorage
 */
export const saveUsers = (users: Usuario[]): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

/**
 * Guardar clientes en localStorage
 */
export const saveClientes = (clientes: Cliente[]): void => {
  localStorage.setItem(CLIENTES_KEY, JSON.stringify(clientes));
};

/**
 * Validar que el email sea único en usuarios
 */
export const isEmailUnique = (email: string, excludeUserId?: string): boolean => {
  const users = getStoredUsers();
  return !users.some(u => u.email === email && u.id !== excludeUserId);
};

/**
 * Validar que el documento sea único en clientes
 */
export const isDocumentoUnique = (numeroDocumento: string, tipoDocumento: string, excludeClienteId?: string): boolean => {
  const clientes = getStoredClientes();
  return !clientes.some(c => 
    c.numeroDocumento === numeroDocumento && 
    c.tipoDocumento === tipoDocumento &&
    c.id !== excludeClienteId
  );
};

/**
 * FUNCIÓN PRINCIPAL: Registrar cliente desde Ecommerce
 * Crea tanto usuario como cliente en una transacción
 */
export const registrarClienteDesdeEcommerce = (data: {
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  ciudad: string;
  email: string;
  direccion: string;
  password: string;
}): { success: boolean; usuario?: Usuario; cliente?: Cliente; error?: string } => {
  try {
    // 1. Validaciones de unicidad
    if (!isEmailUnique(data.email)) {
      return { success: false, error: 'Este correo ya está registrado en el sistema' };
    }

    if (!isDocumentoUnique(data.numeroDocumento, data.tipoDocumento)) {
      return { success: false, error: 'Este documento ya está registrado' };
    }

    // 2. Crear usuario
    const usuarioId = `CLI-${Date.now()}`;
    const usuario: Usuario = {
      id: usuarioId,
      nombre: data.nombre,
      email: data.email,
      password: data.password,
      tipoDoc: data.tipoDocumento,
      numeroDoc: data.numeroDocumento,
      celular: data.telefono,
      direccion: data.direccion,
      role: 'Cliente',
      roleId: 3, // ID role Cliente
      status: 'Activo',
      clienteId: undefined, // Se asignará después de crear el cliente
      createdAt: new Date().toISOString(),
    };

    // 3. Crear cliente
    const clienteId = `CLI-${Date.now()}-CLIENT`;
    const cliente: Cliente = {
      id: clienteId,
      nombre: data.nombre,
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.numeroDocumento,
      telefono: data.telefono,
      ciudad: data.ciudad,
      email: data.email,
      direccion: data.direccion,
      userId: usuarioId,
      estado: 'Activo',
      createdAt: new Date().toISOString(),
    };

    // 4. Actualizar usuario con ID del cliente
    usuario.clienteId = clienteId;

    // 5. Guardar en localStorage
    const users = getStoredUsers();
    users.push(usuario);
    saveUsers(users);

    const clientes = getStoredClientes();
    clientes.push(cliente);
    saveClientes(clientes);

    console.log('✅ [registrarClienteDesdeEcommerce] Cliente registrado exitosamente');
    console.log(`   - Usuario ID: ${usuarioId}`);
    console.log(`   - Cliente ID: ${clienteId}`);

    return { success: true, usuario, cliente };
  } catch (error) {
    console.error('❌ [registrarClienteDesdeEcommerce] Error:', error);
    return { success: false, error: 'Error al registrar el cliente' };
  }
};

/**
 * Obtener usuario por email
 */
export const getUserByEmail = (email: string): Usuario | undefined => {
  const users = getStoredUsers();
  return users.find(u => u.email === email);
};

/**
 * Obtener cliente por userId
 */
export const getClienteByUserId = (userId: string): Cliente | undefined => {
  const clientes = getStoredClientes();
  return clientes.find(c => c.userId === userId);
};

/**
 * Obtener usuario con su cliente asociado
 */
export const getUserWithCliente = (email: string): { usuario?: Usuario; cliente?: Cliente } => {
  const usuario = getUserByEmail(email);
  if (!usuario || !usuario.clienteId) {
    return { usuario };
  }
  const clientes = getStoredClientes();
  const cliente = clientes.find(c => c.id === usuario.clienteId);
  return { usuario, cliente };
};

/**
 * Validar acceso al panel administrativo
 * Retorna true si el usuario puede acceder (NO es Cliente)
 */
export const canAccessAdmin = (usuario: Usuario | null): boolean => {
  if (!usuario) return false;
  return usuario.role !== 'Cliente';
};

/**
 * Validar acceso al Ecommerce
 * Los usuarios con rol Cliente tienen acceso completo
 */
export const canAccessEcommerce = (usuario: Usuario | null): boolean => {
  if (!usuario) return true; // Invitados pueden ver ecommerce
  return true; // Todos los usuarios autenticados pueden acceder
};

/**
 * Obtener ruta de redirección después del login
 */
export const getRedirectAfterLogin = (usuario: Usuario): string => {
  if (usuario.role === 'Cliente') {
    return '/ecommerce'; // O la ruta que uses para ecommerce
  }
  return '/admin'; // Panel administrativo
};

/**
 * Crear cliente desde Admin (sin crear usuario)
 * IMPORTANTE: Esta función NO crea usuario
 */
export const crearClienteDesdeAdmin = (data: {
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  ciudad: string;
  email: string;
  direccion: string;
  estado?: 'Activo' | 'Inactivo';
}): { success: boolean; cliente?: Cliente; error?: string } => {
  try {
    // Validación: documento único
    if (!isDocumentoUnique(data.numeroDocumento, data.tipoDocumento)) {
      return { success: false, error: 'Este documento ya está registrado' };
    }

    const clienteId = `CLI-${Date.now()}-ADMIN`;
    const cliente: Cliente = {
      id: clienteId,
      nombre: data.nombre,
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.numeroDocumento,
      telefono: data.telefono,
      ciudad: data.ciudad,
      email: data.email,
      direccion: data.direccion,
      // userId: undefined, // No tiene usuario asociado
      estado: data.estado || 'Activo',
      createdAt: new Date().toISOString(),
    };

    const clientes = getStoredClientes();
    clientes.push(cliente);
    saveClientes(clientes);

    console.log('✅ [crearClienteDesdeAdmin] Cliente creado exitosamente');
    console.log(`   - Cliente ID: ${clienteId}`);
    console.log(`   - Sin usuario asociado`);

    return { success: true, cliente };
  } catch (error) {
    console.error('❌ [crearClienteDesdeAdmin] Error:', error);
    return { success: false, error: 'Error al crear el cliente' };
  }
};

export default {
  registrarClienteDesdeEcommerce,
  crearClienteDesdeAdmin,
  getStoredUsers,
  getStoredClientes,
  saveUsers,
  saveClientes,
  isEmailUnique,
  isDocumentoUnique,
  getUserByEmail,
  getClienteByUserId,
  getUserWithCliente,
  canAccessAdmin,
  canAccessEcommerce,
  getRedirectAfterLogin,
};
