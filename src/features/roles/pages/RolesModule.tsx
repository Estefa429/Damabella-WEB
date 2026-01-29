import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Button, Input, Label, Textarea, Modal, useToast } from '../../../shared/components/native';
import validateField from '../../../shared/utils/validation';
import { Plus, Search, Edit, Trash2, AlertCircle, Shield } from 'lucide-react';

interface Permiso {
  modulo: string;
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  usuariosAsociados: number;
  permisos: Permiso[];
}

const MODULOS_DISPONIBLES = [
  'Dashboard', 'Roles', 'Permisos', 'Usuarios', 'Categorias',
  'Productos', 'Proveedores', 'Compras', 'Clientes', 'Pedidos',
  'Ventas', 'Devoluciones'
];

const INITIAL_ROLES: Rol[] = [
  { 
    id: '1', 
    nombre: 'Administrador', 
    descripcion: 'Acceso completo al sistema', 
    usuariosAsociados: 1,
    permisos: MODULOS_DISPONIBLES.map(modulo => ({ modulo, ver: true, crear: true, editar: true, eliminar: true }))
  },
  { 
    id: '2', 
    nombre: 'Empleado', 
    descripcion: 'Gestión de ventas y productos', 
    usuariosAsociados: 1,
    permisos: [
      { modulo: 'Dashboard', ver: true, crear: false, editar: false, eliminar: false },
      { modulo: 'Productos', ver: true, crear: false, editar: false, eliminar: false },
      { modulo: 'Clientes', ver: true, crear: true, editar: true, eliminar: false },
      { modulo: 'Pedidos', ver: true, crear: true, editar: true, eliminar: false },
      { modulo: 'Ventas', ver: true, crear: true, editar: false, eliminar: false },
      { modulo: 'Devoluciones', ver: true, crear: true, editar: false, eliminar: false }
    ]
  },
  { 
    id: '3', 
    nombre: 'Cliente', 
    descripcion: 'Acceso limitado para compras', 
    usuariosAsociados: 3,
    permisos: [
      { modulo: 'Dashboard', ver: true, crear: false, editar: false, eliminar: false }
    ]
  }
];

export default function RolesModule() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Inicializa desde localStorage para persistencia
  const [roles, setRoles] = useState<Rol[]>(() => {
    const stored = localStorage.getItem('damabella_roles');
    return stored ? JSON.parse(stored) : INITIAL_ROLES;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permisosDialogOpen, setPermisosDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    permisos: [] as Permiso[]
  });
  const [formErrors, setFormErrors] = useState<any>({});

  const canDelete = user?.role === 'Administrador';

  // Validar nombre sin caracteres especiales
  const validateRoleName = (name: string): string => {
    if (!name.trim()) return 'El nombre es obligatorio';
    if (name.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
    if (!/^[a-zA-Z0-9\s]+$/.test(name)) return 'El nombre no puede contener caracteres especiales';
    return '';
  };

  // Filtrado de roles por búsqueda
  const filteredRoles = roles.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    return (
      r.nombre.toLowerCase().includes(searchLower) ||
      r.descripcion.toLowerCase().includes(searchLower) ||
      r.usuariosAsociados.toString().includes(searchLower)
    );
  });

  // --- Handlers ---

  const handleAdd = () => {
    setSelectedRol(null);
    setFormData({ 
      nombre: '', 
      descripcion: '',
      permisos: MODULOS_DISPONIBLES.map(modulo => ({ modulo, ver: false, crear: false, editar: false, eliminar: false }))
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleEdit = (rol: Rol) => {
    setSelectedRol(rol);
    setFormData({
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      permisos: rol.permisos || MODULOS_DISPONIBLES.map(modulo => ({ modulo, ver: false, crear: false, editar: false, eliminar: false }))
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      showToast('No tienes permisos para eliminar roles', 'error');
      return;
    }
    const rol = roles.find(r => r.id === id);
    if (rol && rol.usuariosAsociados > 0) {
      showToast('No se puede eliminar un rol con usuarios asociados', 'error');
      return;
    }
    setSelectedRol(rol || null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedRol) return;
    const updatedRoles = roles.filter(r => r.id !== selectedRol.id);
    setRoles(updatedRoles);
    localStorage.setItem('damabella_roles', JSON.stringify(updatedRoles));
    showToast(`Rol "${selectedRol.nombre}" eliminado correctamente`, 'success');
    setDeleteDialogOpen(false);
    setSelectedRol(null);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    let err = '';
    if (field === 'nombre') err = validateRoleName(value);
    else err = validateField(field, value);
    if (err) setFormErrors({ ...formErrors, [field]: err });
    else {
      const { [field]: _removed, ...rest } = formErrors;
      setFormErrors(rest);
    }
  };

  const handlePermissionChange = (moduloIndex: number, permission: string, checked: boolean) => {
    const updatedPermisos = [...formData.permisos];
    updatedPermisos[moduloIndex] = { ...updatedPermisos[moduloIndex], [permission]: checked };
    setFormData({ ...formData, permisos: updatedPermisos });
  };

  const handleEditPermissions = (rol: Rol) => {
    setSelectedRol(rol);
    setFormData({
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      permisos: rol.permisos || MODULOS_DISPONIBLES.map(modulo => ({ modulo, ver: false, crear: false, editar: false, eliminar: false }))
    });
    setPermisosDialogOpen(true);
  };

  const handleSavePermissions = () => {
    if (!selectedRol) return;
    const permisos = formData.permisos.length > 0
      ? formData.permisos
      : MODULOS_DISPONIBLES.map(modulo => ({ modulo, ver: false, crear: false, editar: false, eliminar: false }));

    const updatedRoles = roles.map(r =>
      r.id === selectedRol.id ? { ...r, permisos } : r
    );
    setRoles(updatedRoles);
    localStorage.setItem('damabella_roles', JSON.stringify(updatedRoles));
    showToast('Permisos actualizados correctamente', 'success');
    setPermisosDialogOpen(false);
    setSelectedRol(null);
  };

  // --- Crear o editar rol ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nombreErr = validateRoleName(formData.nombre);
    const descripcionErr = validateField('description' as any, formData.descripcion);
    const errors: any = {};
    if (nombreErr) errors.nombre = nombreErr;
    if (descripcionErr) errors.descripcion = descripcionErr;
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const permisos = formData.permisos.length > 0
      ? formData.permisos
      : MODULOS_DISPONIBLES.map(modulo => ({ modulo, ver: false, crear: false, editar: false, eliminar: false }));

    if (selectedRol) {
      // EDITAR
      const updatedRoles = roles.map(r =>
        r.id === selectedRol.id
          ? { ...r, nombre: formData.nombre, descripcion: formData.descripcion, permisos }
          : r
      );
      setRoles(updatedRoles);
      localStorage.setItem('damabella_roles', JSON.stringify(updatedRoles));
      showToast('Rol actualizado correctamente', 'success');
    } else {
      // CREAR
      const newRol: Rol = {
        id: Date.now().toString(),
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        permisos,
        usuariosAsociados: 0
      };
      const updatedRoles = [...roles, newRol];
      setRoles(updatedRoles);
      localStorage.setItem('damabella_roles', JSON.stringify(updatedRoles));
      showToast('Rol creado correctamente', 'success');
    }

    setDialogOpen(false);
    setSelectedRol(null);
  };

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900">Gestión de Roles</h1>
          <p className="text-gray-600">Administra los roles del sistema</p>
        </div>
        <Button onClick={handleAdd} className="bg-black hover:bg-gray-800">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Rol
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white p-4 rounded-lg border border-gray-200">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, descripción o usuarios asociados..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4">Nombre</th>
                <th className="text-left py-3 px-4">Descripción</th>
                <th className="text-left py-3 px-4">Usuarios Asociados</th>
                <th className="text-right py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRoles.map((rol) => (
                <tr key={rol.id}>
                  <td className="py-3 px-4">{rol.nombre}</td>
                  <td className="py-3 px-4 text-gray-600">{rol.descripcion}</td>
                  <td className="py-3 px-4">{rol.usuariosAsociados}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEditPermissions(rol)} 
                        className="p-1 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                        title="Editar permisos"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(rol)} 
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Editar rol"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(rol.id)}
                          className="p-1 hover:bg-red-50 rounded text-red-600 transition-colors"
                          title="Eliminar rol"
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

      {/* Aquí irían los Modales de Crear/Editar, Eliminar y Permisos, idénticos al ejemplo anterior pero usando handleSubmit y handleSavePermissions */}

    </div>
  );
}
