import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Button, Input, Label, Textarea, Modal, useToast } from '../../../shared/components/native';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

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
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  const canDelete = user?.role === 'Administrador';

  // Guardar en localStorage cuando cambien los roles
  useEffect(() => {
    localStorage.setItem('damabella_roles', JSON.stringify(roles));
  }, [roles]);

  const filteredRoles = roles.filter(r => 
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedRol(null);
    setFormData({ nombre: '', descripcion: '' });
    setDialogOpen(true);
  };

  const handleEdit = (rol: Rol) => {
    setSelectedRol(rol);
    setFormData({
      nombre: rol.nombre,
      descripcion: rol.descripcion
    });
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
    
    if (confirm('¿Estás seguro de eliminar este rol?')) {
      setRoles(roles.filter(r => r.id !== id));
      showToast('Rol eliminado correctamente', 'success');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
          placeholder="Buscar rol..."
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
                      <button onClick={() => handleEdit(rol)} className="p-1 hover:bg-gray-100 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(rol.id)}
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
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              required
            />
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
    </div>
  );
}
