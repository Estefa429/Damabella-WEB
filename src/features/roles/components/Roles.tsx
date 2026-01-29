import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Label, Textarea, Modal, DataTable, useToast } from '../../../shared/components/native';
import validateField from '../../../shared/utils/validation';


const validateRoleName = (value: string) => {
  if (!value?.trim()) return 'El nombre es obligatorio';
  if (value.trim().length < 3) return 'Debe tener al menos 3 caracteres';
  if (!/^[a-zA-Z0-9\s]+$/.test(value)) {
    return 'No se permiten caracteres especiales';
  }
  return '';
};

// ============== TIPOS ==============
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

// Para compatibilidad con código antiguo
interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  permisos: string[];
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

const DEFAULT_ROLES: Role[] = [
  {
    id: '1',
    name: 'Administrador',
    description: 'Usuario con todos los permisos',
    userCount: 1,
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
    name: 'Vendedor',
    description: 'Usuario con permisos de ventas',
    userCount: 0,
    permissions: availableModules.map(module => ({
      module,
      canView: ['Pedidos', 'Ventas', 'Productos', 'Clientes'].includes(module),
      canCreate: ['Pedidos', 'Ventas', 'Clientes'].includes(module),
      canEdit: ['Pedidos', 'Ventas', 'Clientes'].includes(module),
      canDelete: false,
    })),
  },
  {
    id: '3',
    name: 'Contador',
    description: 'Usuario con acceso a reportes y finanzas',
    userCount: 0,
    permissions: availableModules.map(module => ({
      module,
      canView: ['Ventas', 'Compras', 'Pedidos'].includes(module),
      canCreate: false,
      canEdit: false,
      canDelete: false,
    })),
  },
];

export const Roles: React.FC = () => {
  const { showToast } = useToast();
  
  // 🔧 CARGAR DESDE LOCALSTORAGE
  const [roles, setRoles] = useState<Role[]>(() => {
    console.log('🔍 [Roles] Inicializando roles...');
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`✅ [Roles] Roles cargados desde localStorage:`, parsed.map((r: Role) => r.name));
          return parsed;
        }
      } catch (e) {
        console.error('❌ [Roles] Error parsing roles:', e);
      }
    }
    
    console.log('ℹ️ [Roles] Usando roles por defecto');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ROLES));
    return DEFAULT_ROLES;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
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

  // 🔄 SINCRONIZAR CAMBIOS EN OTROS TABS/VENTANAS
  useEffect(() => {
    console.log('📡 [Roles] Configurando listeners de sincronización...');
    let lastStoredData: string | null = null;

    const checkForChanges = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== lastStoredData) {
        lastStoredData = stored;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              console.log('🔄 [Roles] Roles actualizados en otro tab/ventana');
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
        console.log(`✅ [Roles] ${roles.length} roles guardados en localStorage`);
      } catch (error) {
        console.error('Error guardando roles:', error);
        showToast('Error al guardar roles', 'error');
      }
    }
  }, [roles, showToast]);

  const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'description', label: 'Descripción' },
  {
    key: 'permissions',
    label: 'Módulos',
    render: (item: Role) => {
      const modulosConVista = item.permissions.filter(p => p.canView).length;
      return <span>{modulosConVista} módulos</span>;
    },
  },
  {
    key: 'userCount',
    label: 'Usuarios',
    render: (item: Role) => <span>{item.userCount || 0}</span>,
  },
  {
    key: 'id',
    label: 'Acciones',
    render: (item: Role) => (
      <div className="flex gap-2 justify-end">
        <Button size="sm" onClick={() => handleEdit(item)}>
          Editar
        </Button>
        {item.name !== 'Administrador' && (
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => handleDelete(item)}
          >
            Eliminar
          </Button>
        )}
      </div>
    ),
  },
];



  // 🔍 FILTRADO POR TEXTO Y CANTIDAD DE MÓDULOS
  const filteredRoles = roles.filter((rol) => {
    const search = searchTerm.toLowerCase().trim();

    const nombre = rol.name.toLowerCase();
    const descripcion = rol.description.toLowerCase();
    const cantidad = rol.permissions.filter(p => p.canView).length;

    const busquedasCantidad = [
      `${cantidad}`,
      `${cantidad} módulo`,
      `${cantidad} módulos`,
    ];

    return (
      nombre.includes(search) ||
      descripcion.includes(search) ||
      busquedasCantidad.some((t) => t.includes(search))
    );
  });

  const handleAdd = () => {
    setSelectedRole(null);
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
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleEdit = (rol: Role) => {
    setSelectedRole(rol);
    setFormData({
      name: rol.name,
      description: rol.description,
      permissions: rol.permissions.length > 0 
        ? rol.permissions 
        : availableModules.map(module => ({
            module,
            canView: false,
            canCreate: false,
            canEdit: false,
            canDelete: false,
          })),
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleDelete = (rol: Role) => {
    setSelectedRole(rol);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRole) {
      setRoles(roles.filter((r) => r.id !== selectedRole.id));
      showToast(`Rol "${selectedRole.name}" eliminado correctamente`, 'success');
      setIsDeleteDialogOpen(false);
      setSelectedRole(null);
    }
  };

  const handleSave = () => {
    const errors: any = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'El nombre es obligatorio';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Debe tener al menos 3 caracteres';
    } else if (!/^[a-zA-Z0-9\s]+$/.test(formData.name)) {
      errors.name = 'No se permiten caracteres especiales';
    }

    if (!formData.description?.trim()) {
      errors.description = 'La descripción es obligatoria';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Debe tener al menos 10 caracteres';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Por favor corrige los errores del formulario', 'error');
      return;
    }

    if (selectedRole) {
      // ✏️ EDITAR ROL
      setRoles(roles.map((r) => 
        r.id === selectedRole.id 
          ? { ...r, name: formData.name, description: formData.description, permissions: formData.permissions } 
          : r
      ));
      showToast('Rol actualizado correctamente', 'success');
    } else {
      // ✨ CREAR NUEVO ROL
      const newRole: Role = {
        id: String(Date.now()),
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
        userCount: 0,
      };
      setRoles([...roles, newRole]);
      showToast('Rol creado correctamente', 'success');
      console.log('✅ [Roles] Nuevo rol creado:', newRole);
    }

    setIsDialogOpen(false);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });

    let err = '';
    if (field === 'name') {
      err = validateRoleName(value);
    } else {
      err = validateField(field, value);
    }

    if (err) {
      setFormErrors({ ...formErrors, [field]: err });
    } else {
      const { [field]: _removed, ...rest } = formErrors;
      setFormErrors(rest);
    }
  };

  const handlePermissionChange = (moduleIndex: number, permissionType: keyof Omit<Permission, 'module'>, value: boolean) => {
    const newPermissions = [...formData.permissions];
    newPermissions[moduleIndex] = {
      ...newPermissions[moduleIndex],
      [permissionType]: value,
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


  return (
    <>
      {/*🔍 BUSCADOR CONTROLADO --------*/}
      <div className="mb-4">
        <Input
          placeholder="Buscar por rol, descripción o cantidad de módulos"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <DataTable
        data={filteredRoles}
        columns={columns}
      />



      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedRole ? 'Editar Rol' : 'Nuevo Rol'}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Rol *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Ej: Supervisor, Vendedor"
            />
            {formErrors.name && <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Descripción del rol"
            />
            {formErrors.description && <p className="text-red-600 text-sm mt-1">{formErrors.description}</p>}
          </div>

          {/* Permisos por módulo */}
          <div className="space-y-3">
            <Label>Permisos por Módulo</Label>
            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Módulo</th>
                    <th className="px-3 py-2 text-center font-medium text-xs">Ver</th>
                    <th className="px-3 py-2 text-center font-medium text-xs">Crear</th>
                    <th className="px-3 py-2 text-center font-medium text-xs">Editar</th>
                    <th className="px-3 py-2 text-center font-medium text-xs">Eliminar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formData.permissions.map((permission, index) => (
                    <tr key={permission.module} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{permission.module}</td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={permission.canView}
                          onChange={(e) => handlePermissionChange(index, 'canView', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={permission.canCreate}
                          onChange={(e) => handlePermissionChange(index, 'canCreate', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={permission.canEdit}
                          onChange={(e) => handlePermissionChange(index, 'canEdit', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={permission.canDelete}
                          onChange={(e) => handlePermissionChange(index, 'canDelete', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-4">
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-black hover:bg-gray-800">
            {selectedRole ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Confirmar Eliminación"
      >
        <p className="text-gray-600">
          ¿Está seguro que desea eliminar el rol <strong>{selectedRole?.name}</strong>?
        </p>
        <div className="flex gap-3 justify-end pt-4">
          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
            Eliminar
          </Button>
        </div>
      </Modal>
    </>
  );
};