/**
 * Cliente Registro Service
 * Maneja la creación de usuarios y clientes desde el Ecommerce
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
  role: 'Cliente' | 'Admin' | 'Vendedor';
  status: 'Activo' | 'Inactivo';
  clienteId: string;
  createdAt: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  documento: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  direccion: string;
  ciudad: string;
  totalCompras?: number;
  pedidos?: number;
  userId?: string | null;
  estado: 'Activo' | 'Inactivo';
  createdAt?: string;
}

export interface RegistroData {
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  ciudad: string;
  email: string;
  direccion: string;
  password: string;
}

export interface RegistroResult {
  success: boolean;
  usuario?: Usuario;
  cliente?: Cliente;
  error?: string;
}

// ============================================================
// FUNCIONES HELPER - localStorage
// ============================================================

function getStoredUsers(): Usuario[] {
  try {
    const data = localStorage.getItem('damabella_users');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error leyendo usuarios:', error);
    return [];
  }
}

function getStoredClientes(): Cliente[] {
  try {
    const data = localStorage.getItem('damabella_clientes');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error leyendo clientes:', error);
    return [];
  }
}

function saveUsers(users: Usuario[]): void {
  try {
    localStorage.setItem('damabella_users', JSON.stringify(users));
  } catch (error) {
    console.error('Error guardando usuarios:', error);
  }
}

function saveClientes(clientes: Cliente[]): void {
  try {
    localStorage.setItem('damabella_clientes', JSON.stringify(clientes));
  } catch (error) {
    console.error('Error guardando clientes:', error);
  }
}

// ============================================================
// VALIDADORES
// ============================================================

export function isEmailUnique(email: string): boolean {
  const users = getStoredUsers();
  return !users.some(u => u.email.toLowerCase() === email.toLowerCase());
}

export function isDocumentoUnique(numero: string, tipo: string): boolean {
  const clientes = getStoredClientes();
  return !clientes.some(c => c.numeroDocumento === numero && c.tipoDocumento === tipo);
}

export function validateEmail(email: string): boolean {
  const regex = /^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

export function validatePassword(password: string): boolean {
  // Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 especial
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return regex.test(password);
}

// ============================================================
// FUNCIONES PRINCIPALES
// ============================================================

export function registrarClienteDesdeEcommerce(data: RegistroData): RegistroResult {
  console.log('\n🔍 [registrarClienteDesdeEcommerce] Iniciando registro...');
  console.log('📋 Datos recibidos:', data);

  // Validaciones
  if (!data.nombre || !data.email || !data.password || !data.numeroDocumento) {
    return {
      success: false,
      error: 'Faltan datos requeridos'
    };
  }

  // Validar email único
  if (!isEmailUnique(data.email)) {
    return {
      success: false,
      error: 'Este correo ya está registrado'
    };
  }

  // Validar documento único
  if (!isDocumentoUnique(data.numeroDocumento, data.tipoDocumento)) {
    return {
      success: false,
      error: 'Este documento ya está registrado'
    };
  }

  // Validar formato email
  if (!validateEmail(data.email)) {
    return {
      success: false,
      error: 'Email inválido'
    };
  }

  // Crear IDs únicos
  const usuarioId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const clienteId = 'cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  const now = new Date().toISOString();

  // Crear Usuario
  const nuevoUsuario: Usuario = {
    id: usuarioId,
    nombre: data.nombre,
    email: data.email,
    password: data.password, // En producción, debería estar hasheado
    tipoDoc: data.tipoDocumento,
    numeroDoc: data.numeroDocumento,
    celular: data.telefono,
    direccion: data.direccion,
    role: 'Cliente',
    status: 'Activo',
    clienteId: clienteId,
    createdAt: now
  };

  // Crear Cliente
  const nuevoCliente: Cliente = {
    id: clienteId,
    nombre: data.nombre,
    email: data.email,
    telefono: data.telefono,
    documento: data.numeroDocumento, // Campo esperado por Clientes.tsx
    tipoDocumento: data.tipoDocumento, // Para referencia
    numeroDocumento: data.numeroDocumento, // Para referencia
    direccion: data.direccion,
    ciudad: data.ciudad,
    userId: usuarioId,
    estado: 'Activo', // Estado inicial: Activo
    totalCompras: 0,  // Sin compras inicialmente
    pedidos: 0,       // Sin pedidos inicialmente
    createdAt: now
  };

  try {
    // Guardar Usuario
    const users = getStoredUsers();
    users.push(nuevoUsuario);
    saveUsers(users);
    console.log('✅ Usuario creado:', nuevoUsuario.id);

    // Guardar Cliente
    const clientes = getStoredClientes();
    clientes.push(nuevoCliente);
    saveClientes(clientes);
    console.log('✅ Cliente creado:', nuevoCliente.id);

    console.log('✅ [registrarClienteDesdeEcommerce] Registro exitoso\n');

    return {
      success: true,
      usuario: nuevoUsuario,
      cliente: nuevoCliente
    };
  } catch (error) {
    console.error('❌ Error al guardar:', error);
    return {
      success: false,
      error: 'Error al guardar los datos'
    };
  }
}

export function crearClienteDesdeAdmin(data: RegistroData): RegistroResult {
  console.log('\n🔍 [crearClienteDesdeAdmin] Creando cliente desde admin...');

  if (!data.nombre || !data.numeroDocumento) {
    return {
      success: false,
      error: 'Faltan datos requeridos'
    };
  }

  // Validar documento único
  if (!isDocumentoUnique(data.numeroDocumento, data.tipoDocumento)) {
    return {
      success: false,
      error: 'Este documento ya está registrado'
    };
  }

  const clienteId = 'cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();

  const nuevoCliente: Cliente = {
    id: clienteId,
    nombre: data.nombre,
    email: data.email,
    telefono: data.telefono,
    documento: data.numeroDocumento, // Campo esperado por Clientes.tsx
    tipoDocumento: data.tipoDocumento, // Para referencia
    numeroDocumento: data.numeroDocumento, // Para referencia
    direccion: data.direccion,
    ciudad: data.ciudad,
    userId: null, // Sin usuario asociado
    estado: 'Activo', // Estado inicial: Activo
    totalCompras: 0,  // Sin compras inicialmente
    pedidos: 0,       // Sin pedidos inicialmente
    createdAt: now
  };

  try {
    const clientes = getStoredClientes();
    clientes.push(nuevoCliente);
    saveClientes(clientes);
    console.log('✅ Cliente creado desde admin:', clienteId);

    return {
      success: true,
      cliente: nuevoCliente
    };
  } catch (error) {
    console.error('❌ Error al guardar cliente:', error);
    return {
      success: false,
      error: 'Error al guardar el cliente'
    };
  }
}

// ============================================================
// FUNCIONES DE CONSULTA
// ============================================================

export function getUserWithCliente(email: string): { usuario: Usuario | null; cliente: Cliente | null } {
  const users = getStoredUsers();
  const usuario = users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;

  let cliente = null;
  if (usuario) {
    const clientes = getStoredClientes();
    cliente = clientes.find(c => c.id === usuario.clienteId) || null;
  }

  return { usuario, cliente };
}

export function canAccessAdmin(usuario: Usuario | null): boolean {
  if (!usuario) return false;
  return usuario.role !== 'Cliente';
}

export function getRedirectAfterLogin(usuario: Usuario | null): string {
  if (!usuario) return '/';
  if (usuario.role === 'Cliente') {
    return '/ecommerce';
  }
  return '/admin';
}
