import { useState, useEffect } from 'react';
import { Card, Button, Input, Label, Select, Modal, DataTable, Badge, useToast } from '../../../shared/components/native';
import { Plus, Edit, Trash2, Search, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';

const STORAGE_KEY = 'damabella_users'; // Cambiar de 'damabella_usuarios' a 'damabella_users' para sincronizar con AuthContext

interface UserType {
  id: string;
  nombre: string;
  name?: string;
  numeroDoc?: string;
  document?: string;
  email: string;
  celular?: string;
  phone?: string;
  direccion?: string;
  address?: string;
  password: string;
  tipoDoc?: string;
  role: string;
  roleId?: number;
  status: 'Activo' | 'Inactivo';
  activo?: boolean;
  createdAt: string;
  creadoPor?: string;
}

const mockUsers: UserType[] = [
  { id: '1', nombre: 'María García', email: 'maria@damabella.com', numeroDoc: '1234567890', celular: '3001234567', role: 'Administrador', status: 'Activo', createdAt: '2024-01-15', password: 'Password123!' },
  { id: '2', nombre: 'Juan Pérez', email: 'juan@damabella.com', numeroDoc: '9876543210', celular: '3107654321', role: 'Empleado', status: 'Activo', createdAt: '2024-02-01', password: 'Password123!' },
  { id: '3', nombre: 'Ana López', email: 'ana@damabella.com', numeroDoc: '5555555555', celular: '3209876543', role: 'Empleado', status: 'Inactivo', createdAt: '2024-01-20', password: 'Password123!' },
  { id: '4', nombre: 'Carlos Ramírez', email: 'carlos@example.com', numeroDoc: '1111111111', celular: '3156789012', role: 'Cliente', status: 'Activo', createdAt: '2024-03-10', password: 'Password123!' },
];

export function UsuariosPage() {
  const [users, setUsers] = useState<UserType[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored users:', e);
      }
    }
    return mockUsers;
  });
  const [roles, setRoles] = useState<any[]>(() => {
    const stored = localStorage.getItem('damabella_roles');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`✅ Roles cargados desde localStorage en UsuariosPage`);
          return parsed;
        }
      } catch (e) {
        console.error('Error loading roles:', e);
      }
    }
    const defaultRoles = [
      { 
        id: '1', 
        nombre: 'Administrador', 
        name: 'Administrador',
        descripcion: 'Acceso completo al sistema', 
        description: 'Acceso completo al sistema',
        usuariosAsociados: 1,
        userCount: 1,
        permisos: [],
        permissions: [
          { module: 'Usuarios', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { module: 'Roles', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { module: 'Categorias', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { module: 'Productos', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { module: 'Clientes', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { module: 'Proveedores', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { module: 'Tallas', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { module: 'Colores', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { module: 'Pedidos', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { module: 'Ventas', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { module: 'Compras', canView: true, canCreate: true, canEdit: true, canDelete: true },
          { module: 'Devoluciones', canView: true, canCreate: true, canEdit: true, canDelete: true },
        ]
      },
      { 
        id: '2', 
        nombre: 'Empleado', 
        name: 'Empleado',
        descripcion: 'Gestión de ventas y productos', 
        description: 'Gestión de ventas y productos',
        usuariosAsociados: 1,
        userCount: 1,
        permisos: [],
        permissions: [
          { module: 'Usuarios', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { module: 'Roles', canView: false, canCreate: false, canEdit: false, canDelete: false },
          { module: 'Categorias', canView: true, canCreate: false, canEdit: false, canDelete: false },
          { module: 'Productos', canView: true, canCreate: false, canEdit: false, canDelete: false },
        ]
      },
      { 
        id: '3', 
        nombre: 'Cliente', 
        name: 'Cliente',
        descripcion: 'Acceso limitado para compras', 
        description: 'Acceso limitado para compras',
        usuariosAsociados: 3,
        userCount: 3,
        permisos: [],
        permissions: []
      }
    ];
    localStorage.setItem('damabella_roles', JSON.stringify(defaultRoles));
    return defaultRoles;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [formData, setFormData] = useState({
    nombre: '',
    numeroDoc: '',
    email: '',
    celular: '',
    password: '',
    role: 'Cliente',
    status: 'Activo' as 'Activo' | 'Inactivo',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  // Guardar usuarios en localStorage cuando cambien
  useEffect(() => {
    if (users && users.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        console.log(`✅ Usuarios guardados: ${users.length} registros`);
      } catch (error) {
        console.error('Error guardando usuarios:', error);
        showToast('Error al guardar usuarios', 'error');
      }
    }
  }, [users, showToast]);

  // Escuchar cambios en roles desde otros módulos
  useEffect(() => {
    let lastStoredRoles: string | null = null;

    const checkForChanges = () => {
      const stored = localStorage.getItem('damabella_roles');
      if (stored !== lastStoredRoles) {
        lastStoredRoles = stored;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              console.log(`🔄 [UsuariosPage] Roles actualizados`);
              setRoles(parsed);
            }
          } catch (e) {
            console.error('Error updating roles:', e);
          }
        }
      }
    };

    checkForChanges();
    window.addEventListener('storage', checkForChanges);
    const interval = setInterval(checkForChanges, 300);

    return () => {
      window.removeEventListener('storage', checkForChanges);
      clearInterval(interval);
    };
  }, []);

  // 🔄 ACTUALIZAR CONTADORES DE USUARIOS EN ROLES
  useEffect(() => {
    const updateUserCountsInRoles = () => {
      try {
        const rolesStored = localStorage.getItem('damabella_roles');
        if (rolesStored) {
          const rolesData = JSON.parse(rolesStored);
          
          // Contar usuarios por rol
          const userCountByRole: Record<string, number> = {};
          users.forEach(usuario => {
            const roleName = usuario.role;
            userCountByRole[roleName] = (userCountByRole[roleName] || 0) + 1;
          });
          
          // Actualizar contadores en roles
          const updatedRoles = rolesData.map((role: any) => ({
            ...role,
            userCount: userCountByRole[role.name || role.nombre] || 0,
          }));
          
          localStorage.setItem('damabella_roles', JSON.stringify(updatedRoles));
          console.log('📊 [UsuariosPage] Contadores de usuarios actualizados en roles:', userCountByRole);
          
          // Actualizar estado local también
          setRoles(updatedRoles);
        }
      } catch (error) {
        console.error('❌ [UsuariosPage] Error actualizando contadores:', error);
      }
    };

    // Actualizar después de cualquier cambio en usuarios
    if (users && users.length >= 0) {
      updateUserCountsInRoles();
    }
  }, [users]);

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('una letra mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('una letra minúscula');
    }
    if (!/\d/.test(password)) {
      errors.push('un número');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('un carácter especial (!@#$%^&*)');
    }

    return errors;
  };

  const validateField = (field: string, value: string) => {
    const errors: any = {};
    
    if (field === 'nombre') {
      if (!value.trim()) {
        errors.nombre = 'Este campo es obligatorio';
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        errors.nombre = 'Solo se permiten letras y espacios';
      }
    }
    
    if (field === 'numeroDoc') {
      if (!value.trim()) {
        errors.numeroDoc = 'Este campo es obligatorio';
      } else if (!/^\d{6,12}$/.test(value)) {
        errors.numeroDoc = 'Debe tener entre 6 y 12 dígitos';
      }
    }
    
    if (field === 'email') {
      if (!value.trim()) {
        errors.email = 'Este campo es obligatorio';
      } else if (!/^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        errors.email = 'Email inválido (debe iniciar con letra)';
      }
    }
    
    if (field === 'celular') {
      if (!value.trim()) {
        errors.celular = 'Este campo es obligatorio';
      } else if (!/^\d{10}$/.test(value)) {
        errors.celular = 'Debe tener exactamente 10 dígitos';
      }
    }

    if (field === 'password') {
      if (!value && !editingUser) {
        errors.password = 'La contraseña es obligatoria';
      } else if (value) {
        const passwordErrors = validatePassword(value);
        if (passwordErrors.length > 0) {
          errors.password = `La contraseña debe contener: ${passwordErrors.join(', ')}`;
        }
      }
    }
    
    return errors;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    const fieldErrors = validateField(field, value);
    setFormErrors({ ...formErrors, ...fieldErrors, [field]: fieldErrors[field] });
  };

  const handleOpenModal = (user?: UserType) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        numeroDoc: user.numeroDoc || '',
        email: user.email,
        celular: user.celular || '',
        password: user.password || '',
        role: user.role,
        status: user.status,
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        numeroDoc: '',
        email: '',
        celular: '',
        password: '',
        role: 'Cliente',
        status: 'Activo',
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos
    const allErrors: any = {};
    ['nombre', 'numeroDoc', 'email', 'celular', 'password'].forEach(field => {
      const fieldErrors = validateField(field, (formData as any)[field]);
      if (fieldErrors[field]) {
        allErrors[field] = fieldErrors[field];
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      showToast('Por favor corrige los errores del formulario', 'error');
      return;
    }

    try {
      if (editingUser) {
        const updatedUsers = users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u);
        setUsers(updatedUsers);
        // Guardar inmediatamente en localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));
        showToast('Usuario actualizado correctamente', 'success');
      } else {
        const newUser: UserType = {
          id: Date.now().toString(),
          nombre: formData.nombre,
          numeroDoc: formData.numeroDoc,
          email: formData.email,
          celular: formData.celular,
          password: formData.password,
          role: formData.role,
          status: formData.status,
          createdAt: new Date().toISOString().split('T')[0],
        };
        const newUsers = [...users, newUser];
        setUsers(newUsers);
        // Guardar inmediatamente en localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsers));
        showToast('Usuario creado correctamente', 'success');
      }

      setIsModalOpen(false);
      setFormData({ nombre: '', numeroDoc: '', email: '', celular: '', password: '', role: '', status: 'Activo' });
      setFormErrors({});
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      showToast('Error al guardar el usuario', 'error');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        const updatedUsers = users.filter(u => u.id !== id);
        setUsers(updatedUsers);
        // Guardar inmediatamente en localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));
        showToast('Usuario eliminado correctamente', 'success');
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        showToast('Error al eliminar el usuario', 'error');
      }
    }
  };

  // Filtrado de usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.document.includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'Todos' || user.role === filterRole;
    const matchesStatus = filterStatus === 'Todos' || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const columns = [
    {
      key: 'nombre',
      label: 'Usuario',
      render: (user: UserType) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-600" />
          <div>
            <p className="font-medium">{user.nombre}</p>
            <p className="text-xs text-gray-600">{user.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'numeroDoc', label: 'Documento' },
    { key: 'celular', label: 'Teléfono' },
    {
      key: 'role',
      label: 'Rol',
      render: (user: UserType) => (
        <Badge variant={
          user.role === 'Administrador' ? 'danger' :
          user.role === 'Empleado' ? 'info' :
          'default'
        }>
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (user: UserType) => (
        <Badge variant={user.status === 'Activo' ? 'success' : 'default'}>
          {user.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Fecha Registro',
      render: (user: UserType) => new Date(user.createdAt).toLocaleDateString('es-ES'),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (user: UserType) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => handleOpenModal(user)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title="Editar usuario"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => handleDelete(user.id)}
            className="p-1 hover:bg-red-50 rounded-md transition-colors"
            title="Eliminar usuario"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-gray-600">Gestión de usuarios del sistema</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, documento o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="Todos">Todos los roles</option>
            {roles.map((rol: any) => (
              <option key={rol.id} value={rol.name || rol.nombre}>
                {rol.name || rol.nombre}
              </option>
            ))}
          </Select>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="Todos">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </Select>
        </div>
      </Card>

      <Card className="p-6">
        <DataTable
          data={filteredUsers}
          columns={columns}
          searchPlaceholder="Buscar usuarios..."
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleFieldChange('nombre', e.target.value)}
                required
              />
              {formErrors.nombre && (
                <p className="text-red-600 text-xs mt-1">{formErrors.nombre}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroDoc">Documento</Label>
              <Input
                id="numeroDoc"
                value={formData.numeroDoc}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  handleFieldChange('numeroDoc', value);
                }}
                placeholder="Cédula o documento"
                maxLength={12}
                required
              />
              {formErrors.numeroDoc && (
                <p className="text-red-600 text-xs mt-1">{formErrors.numeroDoc}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                required
              />
              {formErrors.email && (
                <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="celular">Teléfono</Label>
              <Input
                id="celular"
                value={formData.celular}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  handleFieldChange('celular', value);
                }}
                placeholder="3001234567"
                maxLength={10}
                required
              />
              {formErrors.celular && (
                <p className="text-red-600 text-xs mt-1">{formErrors.celular}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="password">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  placeholder="Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo"
                  required={!editingUser}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.password && (
                <div className="text-xs space-y-1 mt-2 p-2 bg-blue-50 rounded">
                  <div className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-green-700' : 'text-gray-600'}`}>
                    <span>✓ Mínimo 8 caracteres</span>
                  </div>
                  <div className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-green-700' : 'text-gray-600'}`}>
                    <span>✓ Una letra mayúscula (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) ? 'text-green-700' : 'text-gray-600'}`}>
                    <span>✓ Una letra minúscula (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${/\d/.test(formData.password) ? 'text-green-700' : 'text-gray-600'}`}>
                    <span>✓ Un número (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-700' : 'text-gray-600'}`}>
                    <span>✓ Un carácter especial (!@#$%^&*)</span>
                  </div>
                </div>
              )}
              {formErrors.password && (
                <p className="text-red-600 text-xs mt-1">{formErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="">Seleccione un rol</option>
                {roles.map((rol: any) => (
                  <option key={rol.id} value={rol.name || rol.nombre}>
                    {rol.name || rol.nombre}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Activo' | 'Inactivo' })}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingUser ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
