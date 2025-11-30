import { useState } from 'react';
import { Card, Button, Input, Label, Select, Modal, DataTable, Badge, useToast } from '../../../shared/components/native';
import { Plus, Edit, Trash2, Search, User } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface UserType {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  role: string;
  status: 'Activo' | 'Inactivo';
  createdAt: string;
}

const mockUsers: UserType[] = [
  { id: '1', name: 'María García', document: '1234567890', email: 'maria@damabella.com', phone: '3001234567', role: 'Administrador', status: 'Activo', createdAt: '2024-01-15' },
  { id: '2', name: 'Juan Pérez', document: '9876543210', email: 'juan@damabella.com', phone: '3107654321', role: 'Empleado', status: 'Activo', createdAt: '2024-02-01' },
  { id: '3', name: 'Ana López', document: '5555555555', email: 'ana@damabella.com', phone: '3209876543', role: 'Empleado', status: 'Inactivo', createdAt: '2024-01-20' },
  { id: '4', name: 'Carlos Ramírez', document: '1111111111', email: 'carlos@example.com', phone: '3156789012', role: 'Cliente', status: 'Activo', createdAt: '2024-03-10' },
];

export function UsuariosPage() {
  const [users, setUsers] = useState<UserType[]>(mockUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    role: 'Cliente',
    status: 'Activo' as 'Activo' | 'Inactivo',
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const canDelete = currentUser?.role === 'Administrador';

  const validateField = (field: string, value: string) => {
    const errors: any = {};
    
    if (field === 'name') {
      if (!value.trim()) {
        errors.name = 'Este campo es obligatorio';
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        errors.name = 'Solo se permiten letras y espacios';
      }
    }
    
    if (field === 'document') {
      if (!value.trim()) {
        errors.document = 'Este campo es obligatorio';
      } else if (!/^\d{6,12}$/.test(value)) {
        errors.document = 'Debe tener entre 6 y 12 dígitos';
      }
    }
    
    if (field === 'email') {
      if (!value.trim()) {
        errors.email = 'Este campo es obligatorio';
      } else if (!/^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        errors.email = 'Email inválido (debe iniciar con letra)';
      }
    }
    
    if (field === 'phone') {
      if (!value.trim()) {
        errors.phone = 'Este campo es obligatorio';
      } else if (!/^\d{10}$/.test(value)) {
        errors.phone = 'Debe tener exactamente 10 dígitos';
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
        name: user.name,
        document: user.document,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        document: '',
        email: '',
        phone: '',
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
    ['name', 'document', 'email', 'phone'].forEach(field => {
      const fieldErrors = validateField(field, (formData as any)[field]);
      if (fieldErrors[field]) {
        allErrors[field] = fieldErrors[field];
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
      showToast('Usuario actualizado correctamente', 'success');
    } else {
      const newUser: UserType = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setUsers([...users, newUser]);
      showToast('Usuario creado correctamente', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      showToast('No tienes permisos para eliminar usuarios', 'error');
      return;
    }
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      setUsers(users.filter(u => u.id !== id));
      showToast('Usuario eliminado correctamente', 'success');
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
      key: 'name',
      label: 'Usuario',
      render: (user: UserType) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-600" />
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-gray-600">{user.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'document', label: 'Documento' },
    { key: 'phone', label: 'Teléfono' },
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(user)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          {canDelete && (
            <button
              onClick={() => handleDelete(user.id)}
              className="p-1 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          )}
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
            <option value="Administrador">Administrador</option>
            <option value="Empleado">Empleado</option>
            <option value="Cliente">Cliente</option>
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
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                required
              />
              {formErrors.name && (
                <p className="text-red-600 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">Documento</Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) => {
                  // Solo permitir números
                  const value = e.target.value.replace(/\D/g, '');
                  handleFieldChange('document', value);
                }}
                placeholder="Cédula o documento"
                maxLength={12}
                required
              />
              {formErrors.document && (
                <p className="text-red-600 text-xs mt-1">{formErrors.document}</p>
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
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => {
                  // Solo permitir números
                  const value = e.target.value.replace(/\D/g, '');
                  handleFieldChange('phone', value);
                }}
                placeholder="3001234567"
                maxLength={10}
                required
              />
              {formErrors.phone && (
                <p className="text-red-600 text-xs mt-1">{formErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="Administrador">Administrador</option>
                <option value="Empleado">Empleado</option>
                <option value="Cliente">Cliente</option>
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
