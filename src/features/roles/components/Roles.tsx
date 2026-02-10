import React, { useState } from 'react';
import { Card, Button, Input, Label, Textarea, Modal, useToast } from '../../../shared/components/native';
import validateField from '../../../shared/utils/validation';
import { Trash2, Edit2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';

// Mock roles ya tipados correctamente
interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  permisos: string[];
}

const mockRoles: Rol[] = [
  {
    id: '1',
    nombre: 'Administrador',
    descripcion: 'Usuario con todos los permisos',
    permisos: ['crear', 'editar', 'eliminar', 'ver'],
  },
  {
    id: '2',
    nombre: 'Vendedor',
    descripcion: 'Usuario con permisos de ventas',
    permisos: ['ver', 'crear'],
  },
  {
    id: '3',
    nombre: 'Contador',
    descripcion: 'Usuario con acceso a reportes y finanzas',
    permisos: ['ver', 'editar'],
  },
];

export const Roles: React.FC = () => {
  const { showToast } = useToast();
  const [roles, setRoles] = useState<Rol[]>(mockRoles);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
  const [formData, setFormData] = useState<Partial<Rol>>({});
  const [formErrors, setFormErrors] = useState<any>({});

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción' },
    {
      key: 'permisos',
      label: 'Permisos',
      render: (item: Rol) => (
        <span className="text-sm text-gray-600">
          {item.permisos.length} permisos
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (item: Rol) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(item)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Edit2 className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => handleDelete(item)}
            className="p-1 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  const handleAdd = () => {
    setSelectedRol(null);
    setFormData({ permisos: [] });
    setIsDialogOpen(true);
  };

  const handleEdit = (rol: Rol) => {
    setSelectedRol(rol);
    setFormData(rol);
    setIsDialogOpen(true);
  };

  const handleDelete = (rol: Rol) => {
    setSelectedRol(rol);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRol) {
      setRoles(roles.filter((r) => r.id !== selectedRol.id));
      showToast('Rol eliminado correctamente', 'success');
      setIsDeleteDialogOpen(false);
      setSelectedRol(null);
    }
  };

  const handleSave = () => {
    const errors: any = {};
    ['nombre', 'descripcion'].forEach((f) => {
      const err = validateField(f, (formData as any)[f]);
      if (err) errors[f] = err;
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Por favor corrige los errores del formulario', 'error');
      return;
    }

    if (selectedRol) {
      setRoles(roles.map((r) => (r.id === selectedRol.id ? { ...r, ...formData } as Rol : r)));
      showToast('Rol actualizado correctamente', 'success');
    } else {
      const newRol: Rol = {
        id: String(Date.now()),
        nombre: formData.nombre!,
        descripcion: formData.descripcion || '',
        permisos: formData.permisos || [],
      };
      setRoles([...roles, newRol]);
      showToast('Rol creado correctamente', 'success');
    }

    setIsDialogOpen(false);
    setFormData({});
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    const err = validateField(field, value);
    if (err) setFormErrors({ ...formErrors, [field]: err });
    else {
      const { [field]: _removed, ...rest } = formErrors;
      setFormErrors(rest);
    }
  };

  return (
    <>
      <DataTable
        data={roles}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        // searchPlaceholder="Buscar rol..."
      />

      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedRol ? 'Editar Rol' : 'Nuevo Rol'}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Rol *</Label>
            <Input
              id="nombre"
              value={formData.nombre || ''}
              onChange={(e) => handleFieldChange('nombre', e.target.value)}
            />
            {formErrors.nombre && <p className="text-red-600 text-sm mt-1">{formErrors.nombre}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion || ''}
              onChange={(e) => handleFieldChange('descripcion', e.target.value)}
            />
            {formErrors.descripcion && <p className="text-red-600 text-sm mt-1">{formErrors.descripcion}</p>}
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-4">
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-black hover:bg-gray-800">
            {selectedRol ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Confirmar Eliminación"
      >
        <p className="text-gray-600">
          ¿Está seguro que desea eliminar el rol <strong>{selectedRol?.nombre}</strong>?
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
