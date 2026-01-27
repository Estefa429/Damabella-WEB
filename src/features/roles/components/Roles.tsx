import React, { useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState(''); // 👈 NUEVO
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
    render: (item: Rol) => item.permisos.join(', '),
  },
  {
    key: 'id', // 👈 usamos una key que SÍ existe
    label: 'Acciones',
    render: (item: Rol) => (
      <div className="flex gap-2 justify-end">
        <Button size="sm" onClick={() => handleEdit(item)}>
          Editar
        </Button>
        <Button
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={() => handleDelete(item)}
        >
          Eliminar
        </Button>
      </div>
    ),
  },
];



  // 🔍 FILTRADO POR TEXTO Y CANTIDAD DE MÓDULOS
  const filteredRoles = roles.filter((rol) => {
    const search = searchTerm.toLowerCase().trim();

    const nombre = rol.nombre.toLowerCase();
    const descripcion = rol.descripcion.toLowerCase();
    const cantidad = rol.permisos.length;

    const busquedasCantidad = [
      `${cantidad}`,
      `${cantidad} permiso`,
      `${cantidad} permisos`,
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