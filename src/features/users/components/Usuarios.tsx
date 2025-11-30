import React, { useState } from 'react';
import { Card, Button, Input, Label, Select, Modal, DataTable, Badge, useToast } from '../../../shared/components/native';
import { mockUsers } from '../../../shared/utils/mockData';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  documento: string;
  rol: 'Administrador' | 'Empleado' | 'Cliente';
  estado: 'Activo' | 'Inactivo';
  fechaCreacion: string;
  creadoPor?: string;
  modificadoPor?: string;
}

export const Usuarios: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const usuariosIniciales: Usuario[] = mockUsers.map(u => ({
    id: u.id,
    nombre: u.name,
    email: u.email,
    telefono: u.phone,
    documento: u.document,
    rol: u.role as 'Administrador' | 'Empleado' | 'Cliente',
    estado: u.status as 'Activo' | 'Inactivo',
    fechaCreacion: u.createdAt.split('T')[0]
  }));

  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciales);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState<Partial<Usuario>>({});

  const canDelete = user?.role === 'Administrador';

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    { key: 'documento', label: 'Documento' },
    { key: 'telefono', label: 'Teléfono' },
    {
      key: 'rol',
      label: 'Rol',
      render: (item: Usuario) => (
        <Badge variant={item.rol === 'Administrador' ? 'danger' : 'default'}>
          {item.rol}
        </Badge>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (item: Usuario) => (
        <Badge variant={item.estado === 'Activo' ? 'success' : 'default'}>
          {item.estado}
        </Badge>
      ),
    },
  ];

  const handleAdd = () => {
    setSelectedUsuario(null);
    setFormData({ rol: 'Cliente', estado: 'Activo' });
    setIsDialogOpen(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setFormData(usuario);
    setIsDialogOpen(true);
  };

  const handleDelete = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUsuario) {
      setUsuarios(usuarios.filter(u => u.id !== selectedUsuario.id));
      showToast('Usuario eliminado correctamente', 'success');
      setIsDeleteDialogOpen(false);
      setSelectedUsuario(null);
    }
  };

  const handleSave = () => {
    // Validaciones básicas
    if (!formData.nombre?.trim() || !formData.email?.trim() || !formData.documento?.trim()) {
      showToast('Por favor complete todos los campos obligatorios', 'error');
      return;
    }

    // Validar duplicados
    const duplicateEmail = usuarios.find(u => u.email === formData.email && u.id !== selectedUsuario?.id);
    if (duplicateEmail) {
      showToast('Este correo ya está registrado', 'error');
      return;
    }

    const duplicateDocumento = usuarios.find(u => u.documento === formData.documento && u.id !== selectedUsuario?.id);
    if (duplicateDocumento) {
      showToast('Este número de documento ya está registrado', 'error');
      return;
    }

    if (selectedUsuario) {
      // Editar
      setUsuarios(
        usuarios.map(u =>
          u.id === selectedUsuario.id ? { ...u, ...formData, modificadoPor: user?.name } : u
        )
      );
      showToast('Usuario actualizado correctamente', 'success');
    } else {
      // Crear
      const newUsuario: Usuario = {
        id: String(Date.now()),
        nombre: formData.nombre!,
        email: formData.email!,
        telefono: formData.telefono || '',
        documento: formData.documento!,
        rol: (formData.rol as any) || 'Cliente',
        estado: (formData.estado as any) || 'Activo',
        fechaCreacion: new Date().toISOString().split('T')[0],
        creadoPor: user?.name,
      };
      setUsuarios([...usuarios, newUsuario]);
      showToast('Usuario creado correctamente', 'success');
    }

    setIsDialogOpen(false);
    setFormData({});
  };

  return (
    <>
      <DataTable
        data={usuarios}
        columns={columns}
        searchPlaceholder="Buscar por nombre, email o documento..."
      />

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo *</Label>
            <Input
              id="nombre"
              value={formData.nombre || ''}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: María González"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="Ej: maria@ejemplo.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="documento">Documento *</Label>
            <Input
              id="documento"
              value={formData.documento || ''}
              onChange={e => setFormData({ ...formData, documento: e.target.value })}
              placeholder="Ej: 1234567890"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              value={formData.telefono || ''}
              onChange={e => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="Ej: +57 300 123 4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rol">Rol *</Label>
            <Select
              value={formData.rol}
              onChange={e => setFormData({ ...formData, rol: e.target.value as any })}
            >
              <option value="">Seleccione un rol</option>
              <option value="Administrador">Administrador</option>
              <option value="Empleado">Empleado</option>
              <option value="Cliente">Cliente</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado *</Label>
            <Select
              value={formData.estado}
              onChange={e => setFormData({ ...formData, estado: e.target.value as any })}
            >
              <option value="">Seleccione un estado</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{selectedUsuario ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
        </div>
      </Modal>

      {/* Modal Confirmación Eliminación */}
      <Modal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Confirmar Eliminación"
      >
        <p className="text-gray-600">
          ¿Está seguro que desea eliminar al usuario <strong>{selectedUsuario?.nombre}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end pt-4">
          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Eliminar</Button>
        </div>
      </Modal>
    </>
  );
};
