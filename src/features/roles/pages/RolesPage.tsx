import { useState } from 'react';
import { Card, Button, Input, Label, Textarea, Modal, DataTable, Badge, useToast } from '../../../shared/components/native';
import { Plus, Edit, Trash2, Shield, Check, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface Permission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
}

const availableModules = [
  'Usuarios',
  'Roles',
  'Clientes',
  'Proveedores',
  'Categorías',
  'Productos',
  'Tallas',
  'Colores',
  'Pedidos',
  'Ventas',
  'Compras',
  'Devoluciones',
];

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Administrador',
    description: 'Acceso completo al sistema',
    userCount: 2,
    permissions: availableModules.map(module => ({
      module,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    })),
  },
  {
    id: '2',
    name: 'Empleado',
    description: 'Puede gestionar ventas y pedidos',
    userCount: 5,
    permissions: availableModules.map(module => ({
      module,
      canView: true,
      canCreate: ['Pedidos', 'Ventas', 'Clientes', 'Productos'].includes(module),
      canEdit: ['Pedidos', 'Ventas', 'Clientes', 'Productos'].includes(module),
      canDelete: false,
    })),
  },
  {
    id: '3',
    name: 'Cliente',
    description: 'Acceso limitado a su perfil',
    userCount: 150,
    permissions: [
      { module: 'Pedidos', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'Productos', canView: true, canCreate: false, canEdit: false, canDelete: false },
    ],
  },
];

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: availableModules.map(module => ({
      module,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    })),
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const { showToast } = useToast();
  const { user } = useAuth();

  const canDelete = user?.role === 'Administrador';

  const validateField = (field: string, value: string) => {
    const errors: any = {};
    
    if (field === 'name') {
      if (!value.trim()) {
        errors.name = 'El nombre es obligatorio';
      } else if (value.trim().length < 3) {
        errors.name = 'Debe tener al menos 3 caracteres';
      } else if (!/^[a-zA-Z0-9\s]+$/.test(value)) {
        errors.name = 'No puede contener caracteres especiales';
      }
    }
    
    if (field === 'description') {
      if (!value.trim()) {
        errors.description = 'Este campo es obligatorio';
      } else if (value.trim().length < 10) {
        errors.description = 'Debe tener al menos 10 caracteres';
      }
    }
    
    return errors;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    const fieldErrors = validateField(field, value);
    setFormErrors({ ...formErrors, ...fieldErrors, [field]: fieldErrors[field] });
  };

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions.length > 0 
          ? role.permissions 
          : availableModules.map(module => ({
              module,
              canView: false,
              canCreate: false,
              canEdit: false,
              canDelete: false,
            })),
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: availableModules.map(module => ({
          module,
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
        })),
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handlePermissionChange = (moduleIndex: number, field: keyof Permission, value: boolean) => {
    const newPermissions = [...formData.permissions];
    newPermissions[moduleIndex] = {
      ...newPermissions[moduleIndex],
      [field]: value,
    };
    setFormData({ ...formData, permissions: newPermissions });
  };

  const toggleAllPermissions = (moduleIndex: number, enable: boolean) => {
    const newPermissions = [...formData.permissions];
    newPermissions[moduleIndex] = {
      ...newPermissions[moduleIndex],
      canView: enable,
      canCreate: enable,
      canEdit: enable,
      canDelete: enable,
    };
    setFormData({ ...formData, permissions: newPermissions });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos
    const allErrors: any = {};
    ['name', 'description'].forEach(field => {
      const fieldErrors = validateField(field, (formData as any)[field]);
      if (fieldErrors[field]) {
        allErrors[field] = fieldErrors[field];
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    if (editingRole) {
      setRoles(roles.map(r => r.id === editingRole.id ? { ...r, ...formData } : r));
      showToast('Rol actualizado correctamente', 'success');
    } else {
      const newRole: Role = {
        id: Date.now().toString(),
        ...formData,
        userCount: 0,
      };
      setRoles([...roles, newRole]);
      showToast('Rol creado correctamente', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      showToast('No tienes permisos para eliminar roles', 'error');
      return;
    }
    
    const rol = roles.find(r => r.id === id);
    if (rol && rol.name === 'Administrador') {
      showToast('No se puede eliminar el rol Administrador', 'error');
      return;
    }
    
    setRoleToDelete(rol || null);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      setRoles(roles.filter(r => r.id !== roleToDelete.id));
      showToast(`Rol "${roleToDelete.name}" eliminado correctamente`, 'success');
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Rol',
      render: (role: Role) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-600" />
          <span className="font-medium">{role.name}</span>
        </div>
      ),
    },
    { key: 'description', label: 'Descripción' },
    {
      key: 'userCount',
      label: 'Usuarios',
      render: (role: Role) => (
        <Badge variant="info">{role.userCount}</Badge>
      ),
    },
    {
      key: 'permissions',
      label: 'Permisos',
      render: (role: Role) => (
        <span className="text-sm text-gray-600">
          {role.permissions.filter(p => p.canView).length} módulos
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (role: Role) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(role)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          {canDelete && role.name !== 'Administrador' && (
            <button
              onClick={() => handleDelete(role.id)}
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
          <h1 className="text-3xl font-bold">Roles y Permisos</h1>
          <p className="text-gray-600">Gestión de roles y permisos del sistema</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Rol
        </Button>
      </div>

      <Card className="p-6">
        <DataTable
          data={roles}
          columns={columns}
          searchPlaceholder="Buscar roles..."
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? 'Editar Rol' : 'Nuevo Rol'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Rol</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Ej: Supervisor, Vendedor"
                required
              />
              {formErrors.name && (
                <div className="flex items-start gap-2 mt-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-500 text-sm">{formErrors.name}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Descripción del rol"
                required
              />
              {formErrors.description && (
                <div className="flex items-start gap-2 mt-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-500 text-sm">{formErrors.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Permisos por módulo */}
          <div className="space-y-3">
            <Label>Permisos por Módulo</Label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Módulo</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700">Ver</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700">Crear</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700">Editar</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700">Eliminar</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700">Todos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formData.permissions.map((permission, index) => (
                    <tr key={permission.module} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{permission.module}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={permission.canView}
                          onChange={(e) => handlePermissionChange(index, 'canView', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-gray-700 focus:ring-gray-700"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={permission.canCreate}
                          onChange={(e) => handlePermissionChange(index, 'canCreate', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-gray-700 focus:ring-gray-700"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={permission.canEdit}
                          onChange={(e) => handlePermissionChange(index, 'canEdit', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-gray-700 focus:ring-gray-700"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={permission.canDelete}
                          onChange={(e) => handlePermissionChange(index, 'canDelete', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-gray-700 focus:ring-gray-700"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleAllPermissions(index, true)}
                            className="p-1 hover:bg-green-50 rounded"
                            title="Habilitar todos"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAllPermissions(index, false)}
                            className="p-1 hover:bg-red-50 rounded"
                            title="Deshabilitar todos"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingRole ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-900 font-medium">¿Estás seguro de que deseas eliminar este rol?</p>
              <p className="text-gray-600 text-sm mt-2">
                Esta acción no se puede deshacer. El rol <strong>{roleToDelete?.name}</strong> será eliminado permanentemente del sistema.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
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
    </div>
  );
}