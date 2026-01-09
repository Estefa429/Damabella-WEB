import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Card, Button, Input, Label, Select, Modal, DataTable, Badge, useToast } from '../../../shared/components/native';
import { mockUsers } from '../../../shared/utils/mockData';
import { useAuth } from '../../../shared/contexts/AuthContext';
import validateField from '../../../shared/utils/validation';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  documento: string;
  direccion: string;
  password: string;
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
  const [formData, setFormData] = useState<Partial<Usuario & { confirmPassword: string }>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const canDelete = user?.role === 'Administrador';

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    return regex.test(password);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });

    if (field === 'password') {
      if (!value && !selectedUsuario) {
        setFormErrors({ ...formErrors, password: 'Por favor ingresa la contraseña' });
      } else if (value && !validatePassword(value)) {
        setFormErrors({ ...formErrors, password: 'La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y carácter especial' });
      } else {
        const { password: _p, ...rest } = formErrors;
        setFormErrors(rest);
      }
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setFormErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
      } else if (formData.confirmPassword && value === formData.confirmPassword) {
        const { confirmPassword: _c, ...rest } = formErrors;
        setFormErrors(rest);
      }
      return;
    }

    if (field === 'confirmPassword') {
      if (!value && !selectedUsuario) {
        setFormErrors({ ...formErrors, confirmPassword: 'Por favor repite la contraseña' });
      } else if (formData.password && value !== formData.password) {
        setFormErrors({ ...formErrors, confirmPassword: 'Las contraseñas no coinciden' });
      } else {
        const { confirmPassword: _c, ...rest } = formErrors;
        setFormErrors(rest);
      }
      return;
    }

    if (field === 'direccion') {
      if (value && value.trim().length > 0 && value.trim().length < 5) {
        setFormErrors({ ...formErrors, direccion: 'La dirección debe tener al menos 5 caracteres' });
      } else {
        const { direccion: _d, ...rest } = formErrors;
        setFormErrors(rest);
      }
      return;
    }

    const err = validateField(field, value);
    if (err) setFormErrors({ ...formErrors, [field]: err });
    else {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

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
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setFormData({ 
      ...usuario,
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
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
    const errors: Record<string, string> = {};

    // Validaciones
    if (!formData.nombre?.trim()) errors.nombre = 'Por favor completa el nombre';
    if (!formData.documento?.trim()) errors.documento = 'Por favor completa el documento';
    if (!formData.email?.trim()) errors.email = 'Por favor completa el correo';
    if (!formData.rol) errors.rol = 'Por favor selecciona un rol';

    // Validar duplicados
    const duplicateEmail = usuarios.find(u => u.email === formData.email && u.id !== selectedUsuario?.id);
    if (duplicateEmail) errors.email = 'Este correo ya está registrado';

    const duplicateDocumento = usuarios.find(u => u.documento === formData.documento && u.id !== selectedUsuario?.id);
    if (duplicateDocumento) errors.documento = 'Este documento ya está registrado';

    // Validar contraseña solo si es creación o si se proporciona
    if (!selectedUsuario || formData.password || formData.confirmPassword) {
      if (!formData.password) errors.password = 'Por favor ingresa la contraseña';
      if (!formData.confirmPassword) errors.confirmPassword = 'Por favor repite la contraseña';
      if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
      if (formData.password && !validatePassword(formData.password)) {
        errors.password = 'La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y carácter especial';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    if (selectedUsuario) {
      // Editar
      const updatedData: Partial<Usuario> = {
        nombre: formData.nombre!,
        email: formData.email!,
        telefono: formData.telefono || '',
        documento: formData.documento!,
        direccion: formData.direccion || '',
        rol: (formData.rol as any) || 'Cliente',
        estado: (formData.estado as any) || 'Activo',
        modificadoPor: user?.name,
      };
      if (formData.password) {
        updatedData.password = formData.password;
      }
      setUsuarios(
        usuarios.map(u =>
          u.id === selectedUsuario.id ? { ...u, ...updatedData } : u
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
        direccion: formData.direccion || '',
        password: formData.password || '',
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
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <Label htmlFor="nombre">Nombre completo *</Label>
            <Input
              id="nombre"
              value={formData.nombre || ''}
              onChange={e => handleFieldChange('nombre', e.target.value)}
              placeholder="Ej: María González"
              className={formData.nombre && !formErrors.nombre ? 'border-green-500' : formErrors.nombre ? 'border-red-500' : ''}
            />
            {formErrors.nombre && <p className="text-red-600 text-sm mt-1">{formErrors.nombre}</p>}
            {formData.nombre && !formErrors.nombre && <p className="text-green-600 text-xs mt-1">✓ Nombre válido</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="documento">Documento *</Label>
              <Input
                id="documento"
                value={formData.documento || ''}
                onChange={e => handleFieldChange('documento', e.target.value)}
                placeholder="Ej: 1234567890"
                className={formData.documento && !formErrors.documento ? 'border-green-500' : formErrors.documento ? 'border-red-500' : ''}
              />
              {formErrors.documento && <p className="text-red-600 text-sm mt-1">{formErrors.documento}</p>}
              {formData.documento && !formErrors.documento && <p className="text-green-600 text-xs mt-1">✓ Documento válido</p>}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={e => handleFieldChange('email', e.target.value)}
                placeholder="Ej: maria@ejemplo.com"
                className={formData.email && !formErrors.email ? 'border-green-500' : formErrors.email ? 'border-red-500' : ''}
              />
              {formErrors.email && <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>}
              {formData.email && !formErrors.email && <p className="text-green-600 text-xs mt-1">✓ Email válido</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono || ''}
                onChange={e => handleFieldChange('telefono', e.target.value)}
                placeholder="Ej: +57 300 123 4567"
                className={formData.telefono && !formErrors.telefono ? 'border-green-500' : formErrors.telefono ? 'border-red-500' : ''}
              />
              {formErrors.telefono && <p className="text-red-600 text-sm mt-1">{formErrors.telefono}</p>}
            </div>

            <div>
              <Label htmlFor="rol">Rol *</Label>
              <Select
                id="rol"
                value={formData.rol || ''}
                onChange={e => handleFieldChange('rol', e.target.value)}
                className={formData.rol && !formErrors.rol ? 'border-green-500' : formErrors.rol ? 'border-red-500' : ''}
              >
                <option value="">Seleccione un rol</option>
                <option value="Administrador">Administrador</option>
                <option value="Empleado">Empleado</option>
                <option value="Cliente">Cliente</option>
              </Select>
              {formErrors.rol && <p className="text-red-600 text-sm mt-1">{formErrors.rol}</p>}
              {formData.rol && !formErrors.rol && <p className="text-green-600 text-xs mt-1">✓ Rol seleccionado</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={formData.direccion || ''}
              onChange={e => handleFieldChange('direccion', e.target.value)}
              placeholder="Ej: Calle 123 # 45-67"
              className={formData.direccion && !formErrors.direccion ? 'border-green-500' : formErrors.direccion ? 'border-red-500' : ''}
            />
            {formErrors.direccion && <p className="text-red-600 text-sm mt-1">{formErrors.direccion}</p>}
            {formData.direccion && !formErrors.direccion && <p className="text-green-600 text-xs mt-1">✓ Dirección válida</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">
                Contraseña {selectedUsuario ? '(dejar vacío para no cambiar)' : '*'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password || ''}
                  onChange={e => handleFieldChange('password', e.target.value)}
                  placeholder="••••••••"
                  className={formData.password && !formErrors.password ? 'border-green-500' : formErrors.password ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formErrors.password && <p className="text-red-600 text-sm mt-1">{formErrors.password}</p>}
              {formData.password && !formErrors.password && <p className="text-green-600 text-xs mt-1">✓ Contraseña válida</p>}
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">
                Repetir Contraseña {selectedUsuario ? '' : '*'}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword || ''}
                  onChange={e => handleFieldChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className={formData.confirmPassword && !formErrors.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500' : formErrors.confirmPassword ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formErrors.confirmPassword && <p className="text-red-600 text-sm mt-1">{formErrors.confirmPassword}</p>}
              {formData.password && formData.confirmPassword && !formErrors.confirmPassword && (
                <p className="text-green-600 text-xs mt-1">✓ Las contraseñas coinciden</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{selectedUsuario ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
          </div>
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
