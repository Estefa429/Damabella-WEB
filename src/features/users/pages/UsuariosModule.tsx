import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Button, Input, Label, Badge, Card, Modal, Select, useToast } from '../../../shared/components/native';
import validateField from '../../../shared/utils/validation';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Users, UserCheck, UserX, Shield, Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  tipoDoc: string;
  documento: string;
  celular: string;
  direccion: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
  fechaCreacion: string;
  creadoPor: string;
  password: string;
}

const INITIAL_USERS: Usuario[] = [
  { id: '1', nombre: 'Ana García', email: 'admin@damabella.com', tipoDoc: 'CC', documento: '1234567890', celular: '3001234567', direccion: 'Calle 123', rol: 'Administrador', estado: 'Activo', fechaCreacion: '2024-01-15', creadoPor: 'Sistema', password: 'Admin123!' },
  { id: '2', nombre: 'María López', email: 'empleado@damabella.com', tipoDoc: 'CC', documento: '0987654321', celular: '3107654321', direccion: 'Carrera 456', rol: 'Empleado', estado: 'Activo', fechaCreacion: '2024-02-20', creadoPor: 'Ana García', password: 'Empleado123!' },
  { id: '3', nombre: 'Laura Martínez', email: 'cliente@damabella.com', tipoDoc: 'CC', documento: '5555555555', celular: '3209876543', direccion: 'Avenida 789', rol: 'Cliente', estado: 'Activo', fechaCreacion: '2024-03-10', creadoPor: 'María López', password: 'Cliente123!' },
  { id: '4', nombre: 'Sofía Ramírez', email: 'sofia.r@example.com', tipoDoc: 'CE', documento: '1111222233', celular: '3156789012', direccion: 'Calle 321', rol: 'Cliente', estado: 'Activo', fechaCreacion: '2024-06-05', creadoPor: 'María López', password: 'Sofia123!' },
  { id: '5', nombre: 'Carolina Ruiz', email: 'carolina.r@example.com', tipoDoc: 'TI', documento: '4444555566', celular: '3145678901', direccion: 'Carrera 654', rol: 'Cliente', estado: 'Inactivo', fechaCreacion: '2024-05-12', creadoPor: 'Ana García', password: 'Carolina123!' }
];

export default function UsuariosModule() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    console.log(`📋 [UsuariosModule] INICIALIZANDO - Verificando localStorage...`);
    const stored = localStorage.getItem('damabella_users');
    console.log(`   📦 damabella_users existe: ${!!stored}`);
    if (stored) {
      console.log(`   📏 Largo de dato: ${stored.length} caracteres`);
    }
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log(`   ✅ JSON parseado correctamente`);
        console.log(`   📊 Total de registros: ${Array.isArray(parsed) ? parsed.length : 'no es array'}`);
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Convertir datos de cualquier formato a formato UsuariosModule
          const converted = parsed.map((u: any) => {
            const usuario: Usuario = {
              id: u.id?.toString() || String(Date.now()),
              nombre: u.nombre || u.name || '',
              email: u.email || '',
              tipoDoc: u.tipoDoc || 'CC',
              documento: u.documento || u.numeroDoc || '',
              celular: u.celular || u.phone || '',
              direccion: u.direccion || u.address || '',
              rol: u.rol || u.role || 'Cliente',
              estado: (u.estado === 'Activo' || u.estado === 'Inactivo') ? u.estado : (u.status === 'Activo' ? 'Activo' : 'Inactivo'),
              fechaCreacion: u.fechaCreacion || u.createdAt || new Date().toISOString().split('T')[0],
              creadoPor: u.creadoPor || 'Sistema',
              password: u.password || ''
            };
            return usuario;
          });
          console.log(`✅ [Init] Cargados ${converted.length} usuarios desde localStorage`);
          console.log(`   Usuarios cargados:`, converted.map(u => ({ nombre: u.nombre, rol: u.rol, email: u.email })));
          return converted;
        }
      } catch (e) {
        console.error('❌ [Init] Error parsing users:', e);
      }
    }
    // Si no hay datos válidos, usar datos iniciales
    console.log('ℹ️ [Init] Usando INITIAL_USERS');
    localStorage.setItem('damabella_users', JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  });
  const [roles, setRoles] = useState<any[]>(() => {
    console.log(`📋 [UsuariosModule] Cargando roles desde localStorage...`);
    const stored = localStorage.getItem('damabella_roles');
    console.log(`   📦 localStorage.damabella_roles:`, stored);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`✅ Roles cargados desde localStorage: ${parsed.map((r: any) => r.nombre).join(', ')}`);
          return parsed;
        }
      } catch (e) {
        console.error('❌ Error loading roles:', e);
      }
    }
    // Roles por defecto si no existen en localStorage
    console.log('ℹ️ Usando roles por defecto');
    const defaultRoles = [
      { id: '1', nombre: 'Administrador', descripcion: 'Acceso completo al sistema', usuariosAsociados: 1, permisos: [] },
      { id: '2', nombre: 'Empleado', descripcion: 'Gestión de ventas y productos', usuariosAsociados: 1, permisos: [] },
      { id: '3', nombre: 'Cliente', descripcion: 'Acceso limitado para compras', usuariosAsociados: 3, permisos: [] }
    ];
    // Guardar los roles por defecto en localStorage para que persistan
    console.log(`   💾 Guardando roles por defecto en localStorage`);
    localStorage.setItem('damabella_roles', JSON.stringify(defaultRoles));
    return defaultRoles;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleStateDialogOpen, setToggleStateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipoDoc: 'CC',
    email: '',
    documento: '',
    celular: '',
    direccion: '',
    rol: 'Cliente',
    estado: 'Activo' as 'Activo' | 'Inactivo',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const canDelete = user?.role === 'Administrador';

  // Funciones de filtro para prevenir caracteres especiales
  const filterNombre = (value: string): string => {
    // Solo letras, números y espacios
    return value.replace(/[^a-zA-Z0-9\s]/g, '');
  };

  const filterDocumento = (value: string): string => {
    // Solo números
    return value.replace(/[^\d]/g, '');
  };

  const filterPassword = (value: string): string => {
    // Permitir todo excepto comillas y backticks
    return value.replace(/['"`]/g, '');
  };

  // Funciones de validación mejoradas
  const validateNombre = (value: string): string => {
    if (!value.trim()) {
      return 'El nombre es obligatorio';
    }
    if (value.trim().length < 3) {
      return 'El nombre debe tener al menos 3 caracteres';
    }
    // Permitir letras (incluyendo tildes), números y espacios
    if (!/^[a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s]+$/.test(value)) {
      return 'El nombre no puede contener caracteres especiales';
    }
    return '';
  };

  const validateDocumento = (value: string): string => {
    if (!value.trim()) {
      return 'El documento es obligatorio';
    }
    // Solo números
    if (!/^\d+$/.test(value)) {
      return 'El documento solo puede contener números';
    }
    if (value.length < 8) {
      return 'El documento debe tener al menos 8 dígitos';
    }
    return '';
  };

  const validateEmail = (value: string): string => {
    if (!value.trim()) {
      return 'El email es obligatorio';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'El email no es válido';
    }
    return '';
  };

  const validatePassword = (value: string, isNew: boolean): string => {
    if (isNew && !value) {
      return 'La contraseña es obligatoria';
    }
    if (value) {
      const errors: string[] = [];
      if (value.length < 8) {
        errors.push('al menos 8 caracteres');
      }
      if (!/[A-Z]/.test(value)) {
        errors.push('una letra mayúscula');
      }
      if (!/[a-z]/.test(value)) {
        errors.push('una letra minúscula');
      }
      if (!/\d/.test(value)) {
        errors.push('un número');
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
        errors.push('un carácter especial');
      }
      
      if (errors.length > 0) {
        return `La contraseña debe contener: ${errors.join(', ')}`;
      }
    }
    return '';
  };

  const validatePasswordStrength = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    return regex.test(password);
  };

  const validateCelular = (value: string): string => {
    if (!value.trim()) {
      return 'El celular es obligatorio';
    }
    // Solo números
    if (!/^\d+$/.test(value)) {
      return 'El celular solo puede contener números';
    }
    // Validar que tenga 10 dígitos (formato colombiano)
    if (value.length !== 10) {
      return 'El celular debe tener exactamente 10 dígitos';
    }
    return '';
  };

  // Guardar en localStorage cuando cambien los usuarios
  useEffect(() => {
    if (usuarios && usuarios.length > 0) {
      try {
        const dataToSave = JSON.stringify(usuarios);
        localStorage.setItem('damabella_users', dataToSave);
        
        // Verificar que se guardó correctamente
        const saved = localStorage.getItem('damabella_users');
        if (saved === dataToSave) {
          console.log(`✅ [UsuariosModule] Guardados ${usuarios.length} usuarios correctamente`);
        } else {
          console.error('⚠️ [UsuariosModule] Error: datos no guardados correctamente');
        }
      } catch (error) {
        console.error('❌ [UsuariosModule] Error guardando usuarios:', error);
      }
    }
  }, [usuarios]);

  // Escuchar cambios en roles desde otros módulos (Gestión de Roles)
  useEffect(() => {
    console.log(`🔔 [UsuariosModule] useEffect iniciado - Roles actuales:`, roles.map((r: any) => r.nombre));
    let lastStoredRoles: string | null = null;

    const checkForChanges = () => {
      const stored = localStorage.getItem('damabella_roles');
      
      // Si los datos RAW son diferentes, actualizar
      if (stored !== lastStoredRoles) {
        console.log(`🔍 [UsuariosModule] Storage cambió. Antes:`, lastStoredRoles ? `${lastStoredRoles.length} chars` : 'null', `Ahora:`, stored ? `${stored.length} chars` : 'null');
        lastStoredRoles = stored;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              console.log(`🔄 [UsuariosModule] Roles actualizados:`, parsed.map((r: any) => r.nombre));
              setRoles(parsed);
            }
          } catch (e) {
            console.error('❌ Error updating roles:', e);
          }
        }
      }
    };

    // Verificar inmediatamente
    checkForChanges();

    // Escuchar cambios de storage desde otros tabs/ventanas
    const handleStorageChange = () => {
      console.log('🔔 [UsuariosModule] Storage cambió en otro tab');
      checkForChanges();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // También verificar periódicamente (para cambios en el mismo tab)
    const interval = setInterval(checkForChanges, 300);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Estadísticas
  const totalUsuarios = usuarios.length;
  const usuariosActivos = usuarios.filter(u => u.estado === 'Activo').length;
  const usuariosInactivos = usuarios.filter(u => u.estado === 'Inactivo').length;
  const administradores = usuarios.filter(u => u.rol === 'Administrador').length;

  const filteredUsers = usuarios.filter(u => {
    const searchLower = searchTerm.toLowerCase();
    
    // Busca en TODOS los campos de la tabla
    const matchesSearch = 
      u.nombre.toLowerCase().includes(searchLower) ||
      u.documento.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.rol.toLowerCase().includes(searchLower) ||
      u.estado.toLowerCase().includes(searchLower) ||
      u.fechaCreacion.toLowerCase().includes(searchLower) ||
      u.creadoPor.toLowerCase().includes(searchLower);
    
    const matchesRol = filterRol === 'todos' || u.rol === filterRol;
    const matchesEstado = filterEstado === 'todos' || u.estado === filterEstado;
    
    return matchesSearch && matchesRol && matchesEstado;
  });

  const handleAdd = () => {
    setSelectedUser(null);
    setFormData({ nombre: '', tipoDoc: 'CC', email: '', documento: '', celular: '', direccion: '', rol: 'Cliente', estado: 'Activo', password: '', confirmPassword: '' });
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setDialogOpen(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setFormData({
      nombre: usuario.nombre,
      tipoDoc: usuario.tipoDoc,
      email: usuario.email,
      documento: usuario.documento,
      celular: usuario.celular,
      direccion: usuario.direccion || '',
      rol: usuario.rol,
      estado: usuario.estado,
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setDialogOpen(true);
  };

  const handleView = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      showToast('No tienes permisos para eliminar usuarios', 'error');
      return;
    }
    
    const usuario = usuarios.find(u => u.id === id);
    setSelectedUser(usuario || null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      try {
        const updatedUsers = usuarios.filter(u => u.id !== selectedUser.id);
        setUsuarios(updatedUsers);
        // Guardar inmediatamente en localStorage
        localStorage.setItem('damabella_users', JSON.stringify(updatedUsers));
        showToast(`Usuario "${selectedUser.nombre}" eliminado correctamente`, 'success');
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        showToast('Error al eliminar el usuario', 'error');
      }
    }
  };

  const handleToggleState = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setToggleStateDialogOpen(true);
  };

  const confirmToggleState = () => {
    if (selectedUser) {
      try {
        const nuevoEstado: 'Activo' | 'Inactivo' = selectedUser.estado === 'Activo' ? 'Inactivo' : 'Activo';
        const updatedUsers = usuarios.map(u => 
          u.id === selectedUser.id 
            ? { ...u, estado: nuevoEstado }
            : u
        );
        setUsuarios(updatedUsers);
        // Guardar inmediatamente en localStorage
        localStorage.setItem('damabella_users', JSON.stringify(updatedUsers));
        showToast(`Usuario "${selectedUser.nombre}" ${nuevoEstado === 'Activo' ? 'activado' : 'desactivado'} correctamente`, 'success');
        setToggleStateDialogOpen(false);
        setSelectedUser(null);
      } catch (error) {
        console.error('Error al cambiar estado:', error);
        showToast('Error al cambiar el estado del usuario', 'error');
      }
    }
  };

  const downloadExcel = () => {
    // Crear datos para el Excel
    const data = filteredUsers.map(u => ({
      ID: u.id,
      Nombre: u.nombre,
      Email: u.email,
      Rol: u.rol,
      Estado: u.estado,
      'Fecha de Creación': u.fechaCreacion
    }));

    // Convertir a CSV y descargar como Excel
    const headers = ['ID', 'Nombre', 'Email', 'Rol', 'Estado', 'Fecha de Creación'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.ID,
        `"${row.Nombre}"`,
        row.Email,
        row.Rol,
        row.Estado,
        row['Fecha de Creación']
      ].join(','))
    ].join('\n');

    // Agregar BOM para UTF-8
    const bom = '\ufeff';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Reporte descargado correctamente', 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validación final antes de enviar con las nuevas funciones
    const nombreErr = validateNombre(formData.nombre);
    const documentoErr = validateDocumento(formData.documento);
    const celularErr = validateCelular(formData.celular);
    const emailErr = validateEmail(formData.email);
    const passwordErr = validatePassword(formData.password, !selectedUser);

    const errors: any = {};
    if (nombreErr) errors.nombre = nombreErr;
    if (documentoErr) errors.documento = documentoErr;
    if (celularErr) errors.celular = celularErr;
    if (emailErr) errors.email = emailErr;
    if (passwordErr) errors.password = passwordErr;

    // Validar duplicados de email
    const emailDuplicado = usuarios.some(u => 
      u.email.toLowerCase() === formData.email.toLowerCase() && 
      u.id !== selectedUser?.id
    );
    if (emailDuplicado) errors.email = 'Este email ya está registrado';

    // Validar duplicados de documento
    const docDuplicado = usuarios.some(u => 
      u.documento === formData.documento && 
      u.id !== selectedUser?.id
    );
    if (docDuplicado) errors.documento = 'Este número de documento ya está registrado';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      if (selectedUser) {
        // Edit
        const updatedUser: any = {
          ...selectedUser,
          nombre: formData.nombre,
          tipoDoc: formData.tipoDoc,
          documento: formData.documento,
          email: formData.email,
          celular: formData.celular,
          direccion: formData.direccion,
          rol: formData.rol,
          role: formData.rol, // ← GUARDAR TAMBIÉN EN 'role' PARA COMPATIBILIDAD
          estado: selectedUser.estado, // Mantener estado actual
          password: formData.password || selectedUser.password,
          // Mantener fechaCreacion y creadoPor originales
          fechaCreacion: selectedUser.fechaCreacion,
          creadoPor: selectedUser.creadoPor
        };
        const updatedUsers = usuarios.map(u => 
          u.id === selectedUser.id ? updatedUser : u
        );
        setUsuarios(updatedUsers);
        // Guardar inmediatamente en localStorage
        localStorage.setItem('damabella_users', JSON.stringify(updatedUsers));
        showToast('Usuario actualizado correctamente', 'success');
      } else {
        // Add new
        const nuevoEstado: 'Activo' | 'Inactivo' = 'Activo';
        console.log(`📝 [handleSubmit] Creando nuevo usuario con rol: ${formData.rol}`);
        const newUser: any = {
          id: Date.now().toString(),
          nombre: formData.nombre,
          tipoDoc: formData.tipoDoc,
          documento: formData.documento,
          email: formData.email,
          celular: formData.celular,
          direccion: formData.direccion,
          rol: formData.rol,
          role: formData.rol, // ← GUARDAR TAMBIÉN EN 'role' PARA COMPATIBILIDAD
          estado: nuevoEstado,
          password: formData.password,
          fechaCreacion: new Date().toISOString().split('T')[0],
          creadoPor: user?.name || 'Sistema'
        };
        console.log(`✅ [handleSubmit] Usuario creado:`, JSON.stringify(newUser, null, 2));
        console.log(`   ✓ rol: ${newUser.rol}, role: ${newUser.role}`);
        const newUsers = [...usuarios, newUser];
        setUsuarios(newUsers);
        // Guardar inmediatamente en localStorage
        localStorage.setItem('damabella_users', JSON.stringify(newUsers));
        console.log(`💾 [handleSubmit] Guardados en localStorage:`, localStorage.getItem('damabella_users'));
        showToast('Usuario creado correctamente', 'success');
      }
      
      setDialogOpen(false);
      setFormData({
        nombre: '',
        tipoDoc: 'CC',
        email: '',
        documento: '',
        celular: '',
        direccion: '',
        rol: 'Cliente',
        estado: 'Activo' as 'Activo' | 'Inactivo',
        password: '',
        confirmPassword: ''
      });
      setFormErrors({});
      setCurrentPage(1);
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      showToast('Error al guardar el usuario', 'error');
    }
  };

  const handleFieldChange = (field: string, rawValue: string) => {
    let cleanValue = rawValue;

    // PASO 1: Filtrar caracteres según el campo
    if (field === 'nombre') {
      // Permitir letras (incluyendo tildes), números y espacios
      cleanValue = rawValue.split('').filter(char => /^[a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s]$/.test(char)).join('');
    } else if (field === 'documento') {
      // Solo dígitos
      cleanValue = rawValue.split('').filter(char => /^\d$/.test(char)).join('');
    } else if (field === 'celular') {
      // Solo dígitos (máximo 10)
      cleanValue = rawValue.split('').filter(char => /^\d$/.test(char)).join('').slice(0, 10);
    } else if (field === 'password' || field === 'confirmPassword') {
      // Filtrar caracteres problemáticos
      cleanValue = rawValue.split('').filter(char => !/['"`]/.test(char)).join('');
    }

    // PASO 2: Actualizar el estado con el valor limpio
    setFormData({ ...formData, [field]: cleanValue });

    // PASO 3: Validar el valor limpio
    let errorMsg = '';
    if (field === 'nombre') {
      errorMsg = validateNombre(cleanValue);
    } else if (field === 'documento') {
      errorMsg = validateDocumento(cleanValue);
    } else if (field === 'celular') {
      errorMsg = validateCelular(cleanValue);
    } else if (field === 'email') {
      errorMsg = validateEmail(cleanValue);
    } else if (field === 'password') {
      errorMsg = validatePassword(cleanValue, !selectedUser);
      // Validar coincidencia también
      if (formData.confirmPassword && cleanValue !== formData.confirmPassword) {
        setFormErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
      } else if (formData.confirmPassword && cleanValue === formData.confirmPassword) {
        const { confirmPassword: _c, ...rest } = formErrors;
        setFormErrors(rest);
      }
    } else if (field === 'confirmPassword') {
      if (!cleanValue && !selectedUser) {
        errorMsg = 'Debes repetir la contraseña';
      } else if (formData.password && cleanValue !== formData.password) {
        errorMsg = 'Las contraseñas no coinciden';
      }
    } else if (field === 'direccion') {
      if (cleanValue && cleanValue.trim().length > 0 && cleanValue.trim().length < 5) {
        errorMsg = 'La dirección debe tener al menos 5 caracteres';
      }
    }

    // PASO 4: Actualizar errores
    if (errorMsg) {
      setFormErrors({ ...formErrors, [field]: errorMsg });
    } else {
      const { [field]: _removed, ...rest } = formErrors;
      setFormErrors(rest);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra usuarios, roles y permisos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadExcel} variant="outline" className="border-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Descargar Reporte
          </Button>
          <Button onClick={handleAdd} className="bg-black hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Usuario
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-white p-4 rounded-lg border border-gray-200">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, documento o email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="border-0 focus-visible:ring-0"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={filterRol} onChange={(e) => setFilterRol(e.target.value)}>
          <option value="todos">Todos</option>
          {roles.map((rol: any) => (
            <option key={rol.id} value={rol.nombre}>
              {rol.nombre}
            </option>
          ))}
        </Select>
        <Select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </Select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Usuarios</p>
              <p className="text-3xl">{totalUsuarios}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Activos</p>
              <p className="text-3xl">{usuariosActivos}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Inactivos</p>
              <p className="text-3xl">{usuariosInactivos}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Administradores</p>
              <p className="text-3xl">{administradores}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 whitespace-nowrap">Nombre</th>
                <th className="text-left py-3 px-4 whitespace-nowrap">Documento</th>
                <th className="text-left py-3 px-4 whitespace-nowrap">Email</th>
                <th className="text-left py-3 px-4 whitespace-nowrap">Rol</th>
                <th className="text-left py-3 px-4 whitespace-nowrap">Estado</th>
                <th className="text-left py-3 px-4 whitespace-nowrap">Fecha Creación</th>
                <th className="text-left py-3 px-4 whitespace-nowrap">Creado por</th>
                <th className="text-center py-3 px-4 whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(() => {
                const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
                
                if (paginatedUsers.length === 0) {
                  return (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        <Users className="mx-auto mb-2 text-gray-300" size={40} />
                        <p>No se encontraron usuarios</p>
                      </td>
                    </tr>
                  );
                }

                return paginatedUsers.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap text-sm">{usuario.nombre}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm">{usuario.documento}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm">{usuario.email}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge variant="default" className="bg-gray-100">
                      {usuario.rol}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge variant={usuario.estado === 'Activo' ? 'success' : 'default'}>
                      {usuario.estado}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600">{usuario.fechaCreacion}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600">{usuario.creadoPor}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handleView(usuario)} className="p-1 hover:bg-gray-100 rounded" title="Ver">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleToggleState(usuario)}
                        className={`p-1 rounded transition-colors ${usuario.estado === 'Activo' ? 'hover:bg-red-50 text-red-600' : 'hover:bg-green-50 text-green-600'}`}
                        title={usuario.estado === 'Activo' ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        {usuario.estado === 'Activo' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleEdit(usuario)} className="p-1 hover:bg-gray-100 rounded" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(usuario.id)}
                          className="p-1 hover:bg-red-50 rounded text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))})()}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> de <span className="font-medium">{filteredUsers.length}</span> usuarios
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.ceil(filteredUsers.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredUsers.length / itemsPerPage)))}
              disabled={currentPage === Math.ceil(filteredUsers.length / itemsPerPage) || filteredUsers.length === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Modal
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleFieldChange('nombre', e.target.value)}
              placeholder="Ej: Juan Pérez"
              className={formData.nombre && !formErrors.nombre ? 'border-green-500' : formErrors.nombre ? 'border-red-500' : ''}
              required
            />
            {formErrors.nombre && (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-500 text-sm">{formErrors.nombre}</p>
              </div>
            )}
            {formData.nombre && !formErrors.nombre && <p className="text-green-600 text-xs">✓ Nombre válido</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipoDoc">Tipo de Documento</Label>
              <Select value={formData.tipoDoc} onChange={(e) => setFormData({ ...formData, tipoDoc: e.target.value })}>
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="PAS">Pasaporte</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento">Documento (números)</Label>
              <Input
                id="documento"
                value={formData.documento}
                onChange={(e) => handleFieldChange('documento', e.target.value)}
                placeholder="Ej: 1234567890"
                className={formData.documento && !formErrors.documento ? 'border-green-500' : formErrors.documento ? 'border-red-500' : ''}
                required
              />
              {formErrors.documento && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-500 text-sm">{formErrors.documento}</p>
                </div>
              )}
              {formData.documento && !formErrors.documento && <p className="text-green-600 text-xs">✓ Documento válido</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                value={formData.celular}
                onChange={(e) => handleFieldChange('celular', e.target.value)}
                placeholder="Ej: 3001234567"
                className={formData.celular && !formErrors.celular ? 'border-green-500' : formErrors.celular ? 'border-red-500' : ''}
                required
              />
              {formErrors.celular && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-500 text-sm">{formErrors.celular}</p>
                </div>
              )}
              {formData.celular && !formErrors.celular && <p className="text-green-600 text-xs">✓ Celular válido</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <Select value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                className={formData.rol && !formErrors.rol ? 'border-green-500' : formErrors.rol ? 'border-red-500' : ''}
              >
                <option value="">Seleccione un rol</option>
                {roles.map((rol: any) => (
                  <option key={rol.id} value={rol.nombre}>
                    {rol.nombre}
                  </option>
                ))}
              </Select>
              {formData.rol && !formErrors.rol && <p className="text-green-600 text-xs">✓ Rol seleccionado</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="Ej: usuario@ejemplo.com"
              className={formData.email && !formErrors.email ? 'border-green-500' : formErrors.email ? 'border-red-500' : ''}
              required
            />
            {formErrors.email && (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-500 text-sm">{formErrors.email}</p>
              </div>
            )}
            {formData.email && !formErrors.email && <p className="text-green-600 text-xs">✓ Email válido</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={formData.direccion}
              onChange={(e) => handleFieldChange('direccion', e.target.value)}
              placeholder="Ej: Calle 123 # 45-67"
              className={formData.direccion && !formErrors.direccion ? 'border-green-500' : formErrors.direccion ? 'border-red-500' : ''}
            />
            {formErrors.direccion && (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-500 text-sm">{formErrors.direccion}</p>
              </div>
            )}
            {formData.direccion && !formErrors.direccion && <p className="text-green-600 text-xs">✓ Dirección válida</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                {selectedUser ? 'Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  placeholder={selectedUser ? 'Dejar en blanco para no cambiar' : 'Mínimo 6 caracteres'}
                  className={formData.password && !formErrors.password ? 'border-green-500' : formErrors.password ? 'border-red-500' : ''}
                  required={!selectedUser}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formErrors.password && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-500 text-sm">{formErrors.password}</p>
                </div>
              )}
              {formData.password && !formErrors.password && <p className="text-green-600 text-xs">✓ Contraseña válida</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {selectedUser ? 'Repetir Contraseña' : 'Repetir Contraseña'}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  placeholder="Repetir contraseña"
                  className={formData.confirmPassword && !formErrors.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500' : formErrors.confirmPassword ? 'border-red-500' : ''}
                  required={!selectedUser}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-500 text-sm">{formErrors.confirmPassword}</p>
                </div>
              )}
              {formData.password && formData.confirmPassword && !formErrors.confirmPassword && (
                <p className="text-green-600 text-xs">✓ Las contraseñas coinciden</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'Activo' | 'Inactivo' })}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </Select>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-black hover:bg-gray-800">
              {selectedUser ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Dialog */}
      <Modal
        isOpen={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        title="Detalles del Usuario"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <Label className="text-gray-600">Nombre</Label>
              <p className="text-gray-900">{selectedUser.nombre}</p>
            </div>
            <div>
              <Label className="text-gray-600">Documento</Label>
              <p className="text-gray-900">{selectedUser.documento}</p>
            </div>
            <div>
              <Label className="text-gray-600">Email</Label>
              <p className="text-gray-900">{selectedUser.email}</p>
            </div>
            <div>
              <Label className="text-gray-600">Rol</Label>
              <p className="text-gray-900">{selectedUser.rol}</p>
            </div>
            <div>
              <Label className="text-gray-600">Estado</Label>
              <Badge variant={selectedUser.estado === 'Activo' ? 'success' : 'default'}>
                {selectedUser.estado}
              </Badge>
            </div>
            <div>
              <Label className="text-gray-600">Fecha de Creación</Label>
              <p className="text-gray-900">{selectedUser.fechaCreacion}</p>
            </div>
            <div>
              <Label className="text-gray-600">Creado por</Label>
              <p className="text-gray-900">{selectedUser.creadoPor}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-900 font-medium">¿Deseas eliminar este usuario?</p>
              <p className="text-gray-600 text-sm mt-2">
                Esta acción no se puede deshacer. El usuario <strong>{selectedUser?.nombre}</strong> será eliminado permanentemente del sistema.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toggle State Confirmation Dialog */}
      <Modal
        isOpen={toggleStateDialogOpen}
        onClose={() => setToggleStateDialogOpen(false)}
        title={selectedUser?.estado === 'Activo' ? 'Desactivar Usuario' : 'Activar Usuario'}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${selectedUser?.estado === 'Activo' ? 'text-orange-500' : 'text-blue-500'}`} />
            <div>
              <p className="text-gray-900 font-medium">
                {selectedUser?.estado === 'Activo' 
                  ? '¿Estás seguro de que deseas desactivar este usuario?'
                  : '¿Estás seguro de que deseas activar este usuario?'
                }
              </p>
              <p className="text-gray-600 text-sm mt-2">
                {selectedUser?.estado === 'Activo' 
                  ? (
                    <>
                      El usuario <strong>{selectedUser?.nombre}</strong> será desactivado y no podrá acceder al sistema.
                    </>
                  )
                  : (
                    <>
                      El usuario <strong>{selectedUser?.nombre}</strong> será activado y podrá acceder al sistema nuevamente.
                    </>
                  )
                }
              </p>
              {selectedUser?.estado === 'Activo' && (
                <p className="text-orange-600 text-xs mt-2 bg-orange-50 p-2 rounded">
                  ⚠️ Esta acción desactivará el usuario temporalmente. Podrás reactivarlo en cualquier momento.
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setToggleStateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              className={selectedUser?.estado === 'Activo' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
              onClick={confirmToggleState}
            >
              {selectedUser?.estado === 'Activo' ? (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Desactivar Usuario
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activar Usuario
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
