import React, { useState } from 'react';
import { Card, Button, Input, Label, Textarea, Modal, DataTable, useToast } from '../../../shared/components/native';

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

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción' },
    {
      key: 'permisos',
      label: 'Permisos',
      render: (item: Rol) => item.permisos.join(', '),
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
    if (!formData.nombre) {
      showToast('El nombre del rol es obligatorio', 'error');
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

  return (
    <>
      <DataTable
        data={roles}
        columns={columns}
        searchPlaceholder="Buscar rol..."
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
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion || ''}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
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
