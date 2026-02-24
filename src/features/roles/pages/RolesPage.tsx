import { useState, useEffect } from 'react';
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
  active?: boolean;
}

const STORAGE_KEY = 'damabella_roles';

const availableModules = [
  'Usuarios',
  'Roles',
  'Clientes',
  'Proveedores',
  'Categorias',
  'Productos',
  'Tallas',
  'Colores',
  'Pedidos',
  'Ventas',
  'Compras',
  'Devoluciones',
];

// Roles por defecto si no existen en localStorage
const DEFAULT_ROLES: Role[] = [
  {
    id: '1',
    name: 'Administrador',
    description: 'Acceso completo al sistema',
    userCount: 2,
    active: true,
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
    active: true,
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
    active: true,
    permissions: [
      { module: 'Pedidos', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'Productos', canView: true, canCreate: false, canEdit: false, canDelete: false },
    ],
  },
];

export function RolesPage() {
  // 🔧 CARGAR DESDE LOCALSTORAGE
  const [roles, setRoles] = useState<Role[]>(() => {
    console.log('🔍 [RolesPage] Inicializando roles...');
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`✅ [RolesPage] Roles cargados desde localStorage:`, parsed.map(r => r.name || r.nombre));
          // Convertir formato si es necesario (por compatibilidad)
          return parsed.map(r => ({
            id: r.id,
            name: r.name || r.nombre,
            description: r.description || r.descripcion,
            permissions: r.permissions || [],
            userCount: r.userCount || 0,
            active: typeof r.active === 'boolean' ? r.active : true,
          }));
        }
      } catch (e) {
        console.error('❌ [RolesPage] Error parsing roles:', e);
      }
    }
    
    console.log('ℹ️ [RolesPage] Usando roles por defecto');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ROLES));
    return DEFAULT_ROLES;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleToToggle, setRoleToToggle] = useState<Role | null>(null);
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

  // Permitir eliminación a cualquier usuario que pueda acceder al panel administrativo.
  // El control de acceso al panel se gestiona fuera de esta página.
  const canDelete = true;

  // 🔄 SINCRONIZAR CAMBIOS EN OTROS TABS/VENTANAS
  useEffect(() => {
    console.log('📡 [RolesPage] Configurando listeners de sincronización...');
    let lastStoredData: string | null = null;

    const checkForChanges = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== lastStoredData) {
        lastStoredData = stored;
          if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              console.log('🔄 [RolesPage] Roles actualizados en otro tab/ventana');
              setRoles(parsed.map(r => ({
                id: r.id,
                name: r.name || r.nombre,
                description: r.description || r.descripcion,
                permissions: r.permissions || [],
                userCount: r.userCount || 0,
                active: typeof r.active === 'boolean' ? r.active : true,
              })));
            }
          } catch (e) {
            console.error('Error updating roles:', e);
          }
        }
      }
    };

    // Verificar inmediatamente
    checkForChanges();

    // Escuchar cambios en otros tabs
    window.addEventListener('storage', checkForChanges);
    
    // Verificar periódicamente para cambios en el mismo tab
    const interval = setInterval(checkForChanges, 500);

    return () => {
      window.removeEventListener('storage', checkForChanges);
      clearInterval(interval);
    };
  }, []);

  // 💾 GUARDAR EN LOCALSTORAGE CUANDO CAMBIEN LOS ROLES
  useEffect(() => {
    if (roles && roles.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
        console.log(`✅ [RolesPage] ${roles.length} roles guardados en localStorage`);
      } catch (error) {
        console.error('Error guardando roles:', error);
        showToast('Error al guardar roles', 'error');
      }
    }
  }, [roles, showToast]);

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
      // ✏️ EDITAR ROL
      const updatedRoles = roles.map(r => 
        r.id === editingRole.id 
          ? { ...r, ...formData } 
          : r
      );
      setRoles(updatedRoles);
      showToast('Rol actualizado correctamente', 'success');
    } else {
      // ✨ CREAR NUEVO ROL
      const newRole: Role = {
        id: Date.now().toString(),
        ...formData,
        userCount: 0,
        active: true,
      };
      setRoles([...roles, newRole]);
      showToast('Rol creado correctamente', 'success');
      console.log('✅ [RolesPage] Nuevo rol creado:', newRole);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
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
      const updatedRoles = roles.filter(r => r.id !== roleToDelete.id);
      setRoles(updatedRoles);
      showToast(`Rol "${roleToDelete.name}" eliminado correctamente`, 'success');
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  };

  const confirmToggle = () => {
    if (roleToToggle) {
      const updatedRoles = roles.map(r => r.id === roleToToggle.id ? { ...r, active: !(r.active ?? true) } : r);
      setRoles(updatedRoles);
      try {
        // Escribir inmediatamente para evitar reversiones por sincronizadores/intervals
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRoles));
      } catch (e) {
        console.warn('[RolesPage] No se pudo escribir roles en localStorage inmediatamente', e);
      }
      const newState = (roleToToggle.active ?? true) ? 'inactivado' : 'activado';
      showToast(`Rol "${roleToToggle.name}" ${newState} correctamente`, 'success');
      setIsStatusModalOpen(false);
      setRoleToToggle(null);
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
        <div className="flex items-center gap-2 justify-end">
          {/* Toggle active/inactive */}
          <button
            onMouseDown={(e) => e.preventDefault()} /* evitar efecto :active visual */
            onClick={() => {
              if (role.active === false) {
                // activar inmediatamente
                const updated = roles.map(r => r.id === role.id ? { ...r, active: true } : r);
                setRoles(updated);
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}
                showToast(`Rol "${role.name}" activado`, 'success');
              } else {
                // Abrir modal de confirmación para inactivar
                setRoleToToggle(role);
                setIsStatusModalOpen(true);
              }
            }}
            aria-pressed={role.active !== false}
            className={`relative w-12 h-6 rounded-full transition-colors ${role.active !== false ? 'bg-green-500' : 'bg-gray-400'}`}
            title={role.active === false ? 'Activar rol' : 'Inactivar rol'}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${role.active !== false ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>

          <button
            onClick={() => handleOpenModal(role)}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            title="Editar rol"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          {role.name !== 'Administrador' ? (
            <button
              onClick={() => handleDelete(role.id)}
              className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
              title="Eliminar rol"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          ) : (
            // 👇 reserva el mismo espacio del botón eliminar sin mostrarlo
            <span className="p-1.5 rounded-md opacity-0 pointer-events-none select-none">
              <Trash2 className="h-4 w-4" />
            </span>
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
          Agregar Rol
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
        size="xl" 
      >
        {/* Contenedor general sin scroll */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col h-full min-h-0 gap-2 text-[11px] leading-tight"
        >
          {/* A) TOP (no scroll) */}
          <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Nombre */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-[10px]">Nombre del Rol</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Ej: Supervisor, Vendedor"
                className="h-8 text-[11px] px-2"
                required
              />
              {formErrors.name && (
                <div className="flex items-start gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-500 text-[10px]">{formErrors.name}</p>
                </div>
              )}
            </div>

            {/* Descripción (más pequeña) */}
            <div className="space-y-1">
              <Label htmlFor="description" className="text-[10px]">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Descripción del rol"
                rows={1}
                className="text-[10px] px-2 py-1 leading-snug h-10 resize-none"
                required
              />
              {formErrors.description && (
                <div className="flex items-start gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-500 text-[10px]">{formErrors.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* B) MIDDLE (la tabla ocupa lo que reste, con scroll interno) */}
          <div className="space-y-1 flex-1 min-h-0">
  <Label className="text-[10px]">Permisos por Módulo</Label>

  <div className="border border-gray-200 rounded-md overflow-auto flex-1 min-h-0">
    <table className="w-full min-w-[560px]">
      <thead className="bg-gray-50 sticky top-0 z-10">
        <tr>
          <th className="px-2 py-1 text-left text-[9.5px] font-medium text-gray-700">Módulo</th>
          <th className="px-2 py-1 text-center text-[9.5px] font-medium text-gray-700">Ver</th>
          <th className="px-2 py-1 text-center text-[9.5px] font-medium text-gray-700">Crear</th>
          <th className="px-2 py-1 text-center text-[9.5px] font-medium text-gray-700">Editar</th>
          <th className="px-2 py-1 text-center text-[9.5px] font-medium text-gray-700">Eliminar</th>
          <th className="px-2 py-1 text-center text-[9.5px] font-medium text-gray-700">Todos</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200">
        {formData.permissions.map((permission, index) => (
          <tr key={permission.module} className="hover:bg-gray-50">
            <td className="px-2 py-[6px] text-[9.5px] font-medium whitespace-nowrap">
              {permission.module}
            </td>

            {/* Checkboxes más compactos */}
            {(['canView','canCreate','canEdit','canDelete'] as const).map((k) => (
              <td key={k} className="px-2 py-[6px] text-center">
                <input
                  type="checkbox"
                  checked={(permission as any)[k]}
                  onChange={(e) => handlePermissionChange(index, k, e.target.checked)}
                  className="h-3 w-3 rounded border-gray-300 text-gray-700 focus:ring-gray-700"
                />
              </td>
            ))}

            <td className="px-2 py-[6px] text-center">
              <div className="flex justify-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleAllPermissions(index, true)}
                  className="p-0.5 hover:bg-green-50 rounded transition"
                  title="Habilitar todos"
                >
                  <Check className="h-3 w-3 text-green-600" />
                </button>

                <button
                  type="button"
                  onClick={() => toggleAllPermissions(index, false)}
                  className="p-0.5 hover:bg-red-50 rounded transition"
                  title="Deshabilitar todos"
                >
                  <X className="h-3 w-3 text-red-600" />
                </button>
              </div>
            </td>

          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


          {/* C) BOTTOM (no scroll, siempre visible) */}
          <div className="flex-shrink-0 flex justify-end gap-2 pt-2 mt-2 border-t border-gray-100 bg-white">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="h-8 px-3 text-[11px]"
            >
              Cancelar
            </Button>
            <Button type="submit" className="h-8 px-3 text-[11px]">
              {editingRole ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>

      </Modal>


        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => { setIsStatusModalOpen(false); setRoleToToggle(null); }}
          title="Confirmar cambio de estado"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-900 font-medium">¿Estás seguro de que deseas inactivar este rol?</p>
                <p className="text-gray-600 text-sm mt-2">
                  Esta acción deshabilitará el rol <strong>{roleToToggle?.name}</strong> y puede afectar permisos de usuarios asignados.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setIsStatusModalOpen(false); setRoleToToggle(null); }}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                className="bg-orange-600 hover:bg-orange-700"
                onClick={confirmToggle}
              >
                <X className="w-4 h-4 mr-2" />
                Inactivar
              </Button>
            </div>
          </div>
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
