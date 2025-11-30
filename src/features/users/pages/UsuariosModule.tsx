import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Button, Input, Label, Badge, Card, Modal, Select, useToast } from '../../../shared/components/native';
import { Plus, Search, Edit, Trash2, Eye, Users, UserCheck, UserX, Shield } from 'lucide-react';

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
    return stored ? JSON.parse(stored) : INITIAL_USERS;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    documento: '',
    rol: 'Cliente',
    estado: 'Activo' as 'Activo' | 'Inactivo',
    password: ''
  });

  const canDelete = user?.role === 'Administrador';

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
    const matchesSearch = u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.documento.includes(searchTerm) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRol = filterRol === 'todos' || u.rol === filterRol;
    const matchesEstado = filterEstado === 'todos' || u.estado === filterEstado;
    
    return matchesSearch && matchesRol && matchesEstado;
  });

  const handleAdd = () => {
    setSelectedUser(null);
    setFormData({ nombre: '', email: '', documento: '', rol: 'Cliente', estado: 'Activo', password: '' });
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
    
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      setUsuarios(usuarios.filter(u => u.id !== id));
      showToast('Usuario eliminado correctamente', 'success');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra usuarios, roles y permisos</p>
        </div>
        <Button onClick={handleAdd} className="bg-black hover:bg-gray-800">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Usuario
        </Button>
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
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4">Nombre</th>
                <th className="text-left py-3 px-4">Documento</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Rol</th>
                <th className="text-left py-3 px-4">Estado</th>
                <th className="text-right py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="py-3 px-4">{usuario.nombre}</td>
                  <td className="py-3 px-4">{usuario.documento}</td>
                  <td className="py-3 px-4">{usuario.email}</td>
                  <td className="py-3 px-4">
                    <Badge variant="default" className="bg-gray-100">
                      {usuario.rol}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={usuario.estado === 'Activo' ? 'success' : 'default'}>
                      {usuario.estado}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleView(usuario)} className="p-1 hover:bg-gray-100 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEdit(usuario)} className="p-1 hover:bg-gray-100 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(usuario.id)}
                          className="p-1 hover:bg-red-50 rounded text-red-600"
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
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="documento">Documento</Label>
            <Input
              id="documento"
              value={formData.documento}
              onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              {selectedUser ? 'Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!selectedUser}
            />
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
    </div>
  );
}
