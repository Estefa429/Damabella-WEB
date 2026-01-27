import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Button, Input, Label, Textarea, Modal, useToast } from '../../../shared/components/native';
import validateField from '../../../shared/utils/validation';
import { Plus, Search, Edit, Trash2, AlertCircle } from 'lucide-react';

interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  usuariosAsociados: number;
}

const INITIAL_ROLES: Rol[] = [
  { id: '1', nombre: 'Administrador', descripcion: 'Acceso completo al sistema', usuariosAsociados: 1 },
  { id: '2', nombre: 'Empleado', descripcion: 'Gestión de ventas y productos', usuariosAsociados: 1 },
  { id: '3', nombre: 'Cliente', descripcion: 'Acceso limitado para compras', usuariosAsociados: 3 }
];

export default function RolesModule() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [roles, setRoles] = useState<Rol[]>(() => {
    const stored = localStorage.getItem('damabella_roles');
    return stored ? JSON.parse(stored) : INITIAL_ROLES;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });
  const [formErrors, setFormErrors] = useState<any>({});

  const canDelete = user?.role === 'Administrador';

  // Validar nombre sin caracteres especiales
  const validateRoleName = (name: string): string => {
    if (!name.trim()) {
      return 'El nombre es obligatorio';
    }
    if (name.trim().length < 3) {
      return 'El nombre debe tener al menos 3 caracteres';
    }
    // Permitir solo letras, números y espacios
    const specialCharRegex = /^[a-zA-Z0-9\s]+$/;
    if (!specialCharRegex.test(name)) {
      return 'El nombre no puede contener caracteres especiales';
    }
    return '';
  };

  // Guardar en localStorage cuando cambien los roles
  useEffect(() => {
    localStorage.setItem('damabella_roles', JSON.stringify(roles));
  }, [roles]);

  const filteredRoles = roles.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    return (
      r.nombre.toLowerCase().includes(searchLower) ||
      r.descripcion.toLowerCase().includes(searchLower) ||
      r.usuariosAsociados.toString().includes(searchLower)
    );
  });

  const handleAdd = () => {
    setSelectedRol(null);
    setFormData({ nombre: '', descripcion: '' });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleEdit = (rol: Rol) => {
    setSelectedRol(rol);
    setFormData({
      nombre: rol.nombre,
      descripcion: rol.descripcion
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
    if (selectedRol) {
      setRoles(roles.filter(r => r.id !== selectedRol.id));
      showToast(`Rol "${selectedRol.nombre}" eliminado correctamente`, 'success');
      setDeleteDialogOpen(false);
      setSelectedRol(null);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    let err = '';
    if (field === 'nombre') {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nombreErr = validateRoleName(formData.nombre);
    const descripcionErr = validateField('description' as any, formData.descripcion);
    const errors: any = {};
    if (nombreErr) errors.nombre = nombreErr;
    if (descripcionErr) errors.descripcion = descripcionErr;
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (selectedRol) {
      setRoles(roles.map(r => 
        r.id === selectedRol.id 
          ? { ...r, ...formData }
          : r
      ));
      showToast('Rol actualizado correctamente', 'success');
    } else {
      const newRol: Rol = {
        id: Date.now().toString(),
        ...formData,
        usuariosAsociados: 0
      };
      setRoles([...roles, newRol]);
      showToast('Rol creado correctamente', 'success');
    }
    
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
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

      <div className="flex items-center gap-2 bg-white p-4 rounded-lg border border-gray-200">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, descripción o usuarios asociados..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0"
        />
      </div>

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

      <Modal
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={selectedRol ? 'Editar Rol' : 'Nuevo Rol'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Rol</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleFieldChange('nombre', e.target.value)}
              placeholder="Ej: Gerente, Supervisor"
              required
            />
            {formErrors.nombre && (
              <div className="flex items-start gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-500 text-sm">{formErrors.nombre}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleFieldChange('descripcion', e.target.value)}
              placeholder="Describe las responsabilidades de este rol"
              required
            />
            {formErrors.descripcion && (
              <div className="flex items-start gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-500 text-sm">{formErrors.descripcion}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-black hover:bg-gray-800">
              {selectedRol ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-900 font-medium">¿Estás seguro de que deseas eliminar este rol?</p>
              <p className="text-gray-600 text-sm mt-2">
                Esta acción no se puede deshacer. El rol <strong>{selectedRol?.nombre}</strong> será eliminado permanentemente del sistema.
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
    </div>
  );
}