import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Button, Input, Label, Badge, Card, Modal, Select, useToast } from '../../../shared/components/native';
import validateField from '../../../shared/utils/validation';
import { Plus, Search, Edit, Trash2, Eye, Users, UserCheck, UserX, Shield, Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  documento: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
  fechaCreacion: string;
  creadoPor: string;
}

const INITIAL_USERS: Usuario[] = [
  { id: '1', nombre: 'Ana García', email: 'admin@damabella.com', documento: '1234567890', rol: 'Administrador', estado: 'Activo', fechaCreacion: '2024-01-15', creadoPor: 'Sistema' },
  { id: '2', nombre: 'María López', email: 'empleado@damabella.com', documento: '0987654321', rol: 'Empleado', estado: 'Activo', fechaCreacion: '2024-02-20', creadoPor: 'Ana García' },
  { id: '3', nombre: 'Laura Martínez', email: 'cliente@damabella.com', documento: '5555555555', rol: 'Cliente', estado: 'Activo', fechaCreacion: '2024-03-10', creadoPor: 'María López' },
  { id: '4', nombre: 'Sofía Ramírez', email: 'sofia.r@example.com', documento: '1111222233', rol: 'Cliente', estado: 'Activo', fechaCreacion: '2024-06-05', creadoPor: 'María López' },
  { id: '5', nombre: 'Carolina Ruiz', email: 'carolina.r@example.com', documento: '4444555566', rol: 'Cliente', estado: 'Inactivo', fechaCreacion: '2024-05-12', creadoPor: 'Ana García' }
];

export default function UsuariosModule() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    const stored = localStorage.getItem('damabella_users');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validar que tengan la estructura correcta
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].documento && parsed[0].fechaCreacion) {
        return parsed;
      }
    }
    // Si no hay datos válidos, usar datos iniciales
    localStorage.setItem('damabella_users', JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleStateDialogOpen, setToggleStateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    documento: '',
    rol: 'Cliente',
    estado: 'Activo' as 'Activo' | 'Inactivo',
    password: ''
  });
  const [formErrors, setFormErrors] = useState<any>({});

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
    // Solo letras, números y espacios
    if (!/^[a-zA-Z0-9\s]+$/.test(value)) {
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
    if (value && value.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  };

  // Guardar en localStorage cuando cambien los usuarios
  useEffect(() => {
    localStorage.setItem('damabella_users', JSON.stringify(usuarios));
  }, [usuarios]);

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
    setFormData({ nombre: '', email: '', documento: '', rol: 'Cliente', estado: 'Activo', password: '' });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      documento: usuario.documento,
      rol: usuario.rol,
      estado: usuario.estado,
      password: ''
    });
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
      setUsuarios(usuarios.filter(u => u.id !== selectedUser.id));
      showToast(`Usuario "${selectedUser.nombre}" eliminado correctamente`, 'success');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleToggleState = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setToggleStateDialogOpen(true);
  };

  const confirmToggleState = () => {
    if (selectedUser) {
      const nuevoEstado = selectedUser.estado === 'Activo' ? 'Inactivo' : 'Activo';
      setUsuarios(usuarios.map(u => 
        u.id === selectedUser.id 
          ? { ...u, estado: nuevoEstado }
          : u
      ));
      showToast(`Usuario "${selectedUser.nombre}" ${nuevoEstado === 'Activo' ? 'activado' : 'desactivado'} correctamente`, 'success');
      setToggleStateDialogOpen(false);
      setSelectedUser(null);
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
    const emailErr = validateEmail(formData.email);
    const passwordErr = validatePassword(formData.password, !selectedUser);

    const errors: any = {};
    if (nombreErr) errors.nombre = nombreErr;
    if (documentoErr) errors.documento = documentoErr;
    if (emailErr) errors.email = emailErr;
    if (passwordErr) errors.password = passwordErr;

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (selectedUser) {
      // Edit
      setUsuarios(usuarios.map(u => 
        u.id === selectedUser.id 
          ? { ...u, ...formData }
          : u
      ));
      showToast('Usuario actualizado correctamente', 'success');
    } else {
      // Add new
      const newUser: Usuario = {
        id: Date.now().toString(),
        ...formData,
        fechaCreacion: new Date().toISOString().split('T')[0],
        creadoPor: user?.name || 'Sistema'
      };
      setUsuarios([...usuarios, newUser]);
      showToast('Usuario creado correctamente', 'success');
    }
    
    setDialogOpen(false);
  };

  const handleFieldChange = (field: string, rawValue: string) => {
    let cleanValue = rawValue;

    // PASO 1: Filtrar caracteres según el campo
    if (field === 'nombre') {
      // Solo a-z, A-Z, 0-9 y espacios
      cleanValue = rawValue.split('').filter(char => /^[a-zA-Z0-9\s]$/.test(char)).join('');
    } else if (field === 'documento') {
      // Solo dígitos
      cleanValue = rawValue.split('').filter(char => /^\d$/.test(char)).join('');
    } else if (field === 'password') {
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
    } else if (field === 'email') {
      errorMsg = validateEmail(cleanValue);
    } else if (field === 'password') {
      errorMsg = validatePassword(cleanValue, !selectedUser);
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
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={filterRol} onChange={(e) => setFilterRol(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="Administrador">Administrador</option>
          <option value="Empleado">Empleado</option>
          <option value="Cliente">Cliente</option>
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
              {filteredUsers.map((usuario) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Modal
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleFieldChange('nombre', e.target.value)}
              placeholder="Ej: Juan Pérez"
              required
            />
            {formErrors.nombre && (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-500 text-sm">{formErrors.nombre}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="documento">Documento (números)</Label>
            <Input
              id="documento"
              value={formData.documento}
              onChange={(e) => handleFieldChange('documento', e.target.value)}
              placeholder="Ej: 1234567890"
              required
            />
            {formErrors.documento && (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-500 text-sm">{formErrors.documento}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="Ej: usuario@ejemplo.com"
              required
            />
            {formErrors.email && (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-500 text-sm">{formErrors.email}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              {selectedUser ? 'Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              placeholder={selectedUser ? 'Dejar en blanco para no cambiar' : 'Mínimo 6 caracteres'}
              required={!selectedUser}
            />
            {formErrors.password && (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-500 text-sm">{formErrors.password}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rol">Rol</Label>
            <Select value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })}>
              <option value="Administrador">Administrador</option>
              <option value="Empleado">Empleado</option>
              <option value="Cliente">Cliente</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'Activo' | 'Inactivo' })}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </Select>
          </div>
          <div className="flex gap-3 justify-end pt-4">
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
