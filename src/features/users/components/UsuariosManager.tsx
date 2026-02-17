import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Search, Download, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Modal } from '../../../shared/components/native';
import validateField from '../../../shared/utils/validation';

const STORAGE_KEY = 'damabella_users';
const ROLES_KEY = 'damabella_roles';

interface Usuario {
  id: number;
  nombre: string;
  tipoDoc: string;
  numeroDoc: string;
  celular: string;
  email: string;
  direccion: string;
  password: string;
  role: string;
  roleId?: number;
  activo: boolean;
  createdAt: string;
}

export default function UsuariosManager() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [roles, setRoles] = useState(() => {
    const stored = localStorage.getItem(ROLES_KEY);
    if (stored) return JSON.parse(stored);
    
    const rolesDefault = [
      { id: 1, nombre: 'Administrador', descripcion: 'Acceso total al sistema', activo: true },
      { id: 2, nombre: 'Empleado', descripcion: 'Puede registrar ventas pero no eliminar', activo: true },
      { id: 3, nombre: 'Cliente', descripcion: 'Acceso limitado', activo: true }
    ];
    localStorage.setItem(ROLES_KEY, JSON.stringify(rolesDefault));
    return rolesDefault;
  });

  const [showModal, setShowModal] = useState(false);
  const [showReporte, setShowReporte] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    nombre: '',
    tipoDoc: 'CC',
    numeroDoc: '',
    celular: '',
    email: '',
    direccion: '',
    password: '',
    confirmPassword: '',
    roleId: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
  }, [usuarios]);

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    return regex.test(password);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });

    // field-specific validation: use shared helper when applicable
    if (field === 'password') {
      if (!value && !editingUsuario) {
        setFormErrors({ ...formErrors, password: 'Por favor ingresa la contraseña' });
      } else if (value && !validatePassword(value)) {
        setFormErrors({ ...formErrors, password: 'La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y carácter especial' });
      } else {
        const { password: _p, ...rest } = formErrors;
        setFormErrors(rest);
      }
      // Validar coincidencia también
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setFormErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
      } else if (formData.confirmPassword && value === formData.confirmPassword) {
        const { confirmPassword: _c, ...rest } = formErrors;
        setFormErrors(rest);
      }
      return;
    }

    if (field === 'confirmPassword') {
      if (!value && !editingUsuario) {
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
      // Dirección no es requerida, pero si se ingresa, validar que tenga formato
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
        delete newErrors[field as keyof typeof newErrors];
        return newErrors;
      });
    }
  };

  const handleCreate = () => {
    setEditingUsuario(null);
    setFormData({
      nombre: '',
      tipoDoc: 'CC',
      numeroDoc: '',
      celular: '',
      email: '',
      direccion: '',
      password: '',
      confirmPassword: '',
      roleId: ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      nombre: usuario.nombre || '',
      tipoDoc: usuario.tipoDoc || 'CC',
      numeroDoc: usuario.numeroDoc || '',
      celular: usuario.celular || '',
      email: usuario.email || '',
      direccion: usuario.direccion || '',
      password: '',
      confirmPassword: '',
      roleId: usuario.roleId?.toString() || ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = () => {
    const errors: typeof formErrors = {};

    if (!formData.nombre.trim()) errors.nombre = 'Por favor completa el nombre';
    if (!formData.numeroDoc.trim()) errors.numeroDoc = 'Por favor completa el número de documento';
    if (!formData.email.trim()) errors.email = 'Por favor completa el correo';
    if (!formData.roleId) errors.roleId = 'Por favor selecciona un rol';
    if (!formData.celular.trim()) errors.celular = 'Por favor completa el celular';

    // Validar duplicados de email
    const emailDuplicado = usuarios.some(u => 
      u.email.toLowerCase() === formData.email.toLowerCase() && 
      u.id !== editingUsuario?.id
    );
    if (emailDuplicado) errors.email = 'Este email ya está registrado';

    // Validar duplicados de documento
    const docDuplicado = usuarios.some(u => 
      u.numeroDoc === formData.numeroDoc && 
      u.id !== editingUsuario?.id
    );
    if (docDuplicado) errors.numeroDoc = 'Este número de documento ya está registrado';

    if (!editingUsuario || formData.password || formData.confirmPassword) {
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

    const rolSeleccionado = roles.find((r: any) => r.id.toString() === formData.roleId);
    if (!rolSeleccionado) {
      setFormErrors({ roleId: 'Rol no válido' });
      return;
    }

    const usuarioData: any = {
      nombre: formData.nombre,
      tipoDoc: formData.tipoDoc,
      numeroDoc: formData.numeroDoc,
      celular: formData.celular,
      email: formData.email,
      direccion: formData.direccion,
      roleId: parseInt(formData.roleId),
      role: rolSeleccionado.nombre,
      activo: true,
      createdAt: new Date().toISOString()
    };

    if (formData.password) {
      usuarioData.password = formData.password;
    } else if (editingUsuario) {
      usuarioData.password = editingUsuario.password;
    }

    if (editingUsuario) {
      setUsuarios(usuarios.map(u =>
        u.id === editingUsuario.id ? { ...u, ...usuarioData } : u
      ));
    } else {
      setUsuarios([...usuarios, { id: Date.now(), ...usuarioData }]);
    }

    setShowModal(false);
    setCurrentPage(1);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      setUsuarios(usuarios.filter(u => u.id !== id));
    }
  };

  const toggleActive = (id: number) => {
    setUsuarios(usuarios.map(u =>
      u.id === id ? { ...u, activo: !u.activo } : u
    ));
  };

  const exportarReporte = () => {
    const csv = [
      ['Nombre', 'Documento', 'Email', 'Celular', 'Rol', 'Estado'].join(','),
      ...usuarios.map(u => [
        u.nombre,
        `${u.tipoDoc} ${u.numeroDoc}`,
        u.email,
        u.celular,
        u.role,
        u.activo ? 'Activo' : 'Inactivo'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-usuarios-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredUsuarios = usuarios.filter(u =>
    (u.nombre?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (u.email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (u.numeroDoc ?? '').includes(searchTerm) ||
    (u.role?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsuarios = filteredUsuarios.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Usuarios</h2>
          <p className="text-gray-600">Administra los usuarios del sistema y sus roles</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowReporte(true)} variant="secondary">
            <Download size={20} />
            Reporte
          </Button>
          <Button onClick={handleCreate} variant="primary">
            <Plus size={20} />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Usuarios List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-gray-600">Usuario</th>
                <th className="text-left py-4 px-6 text-gray-600">Documento</th>
                <th className="text-left py-4 px-6 text-gray-600">Contacto</th>
                <th className="text-left py-4 px-6 text-gray-600">Rol</th>
                <th className="text-center py-4 px-6 text-gray-600">Estado</th>
                <th className="text-right py-4 px-6 text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <Users className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron usuarios</p>
                  </td>
                </tr>
              ) : (
                paginatedUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white">
                          {usuario.nombre[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-gray-900">{usuario.nombre}</div>
                          <div className="text-gray-500">{usuario.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-700">{usuario.tipoDoc}</div>
                      <div className="text-gray-500">{usuario.numeroDoc}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-700">{usuario.celular}</div>
                      <div className="text-gray-500 text-sm">{usuario.direccion}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs ${
                        usuario.role === 'Administrador' ? 'bg-purple-100 text-purple-700' :
                        usuario.role === 'Empleado' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {usuario.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleActive(usuario.id)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            usuario.activo ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            usuario.activo ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => toggleActive(usuario.id)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            usuario.activo ? 'bg-green-500' : 'bg-gray-300'
                          } mr-1`}
                          title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                          aria-pressed={usuario.activo}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            usuario.activo ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(usuario.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{Math.min(endIndex, filteredUsuarios.length)}</span> de <span className="font-medium">{filteredUsuarios.length}</span> usuarios
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal Create/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-gray-700 mb-2">Nombre Completo *</label>
            <Input
              value={formData.nombre}
              onChange={(e) => handleFieldChange('nombre', e.target.value)}
              placeholder="Juan Pérez"
              className={formData.nombre && !formErrors.nombre ? 'border-green-500' : formErrors.nombre ? 'border-red-500' : ''}
            />
            {formErrors.nombre && <p className="text-red-600 text-sm mt-1">{formErrors.nombre}</p>}
            {formData.nombre && !formErrors.nombre && <p className="text-green-600 text-xs mt-1">✓ Nombre válido</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Tipo de Documento *</label>
              <select
                value={formData.tipoDoc}
                onChange={(e) => handleFieldChange('tipoDoc', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="PAS">Pasaporte</option>
              </select>
              {formErrors.tipoDoc && <p className="text-red-600 text-sm mt-1">{formErrors.tipoDoc}</p>}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Número de Documento *</label>
              <Input
                value={formData.numeroDoc}
                onChange={(e) => handleFieldChange('numeroDoc', e.target.value)}
                placeholder="1234567890"
                className={formData.numeroDoc && !formErrors.numeroDoc ? 'border-green-500' : formErrors.numeroDoc ? 'border-red-500' : ''}
              />
              {formErrors.numeroDoc && <p className="text-red-600 text-sm mt-1">{formErrors.numeroDoc}</p>}
              {formData.numeroDoc && !formErrors.numeroDoc && <p className="text-green-600 text-xs mt-1">✓ Documento válido</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Celular *</label>
              <Input
                value={formData.celular}
                onChange={(e) => handleFieldChange('celular', e.target.value)}
                placeholder="3001234567"
                className={formData.celular && !formErrors.celular ? 'border-green-500' : formErrors.celular ? 'border-red-500' : ''}
              />
              {formErrors.celular && <p className="text-red-600 text-sm mt-1">{formErrors.celular}</p>}
              {formData.celular && !formErrors.celular && <p className="text-green-600 text-xs mt-1">✓ Celular válido</p>}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Rol *</label>
              <select
                value={formData.roleId}
                onChange={(e) => handleFieldChange('roleId', e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${formData.roleId && !formErrors.roleId ? 'border-green-500' : formErrors.roleId ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Seleccionar rol...</option>
                {roles.filter((r: any) => r.activo).map((r: any) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
              {formErrors.roleId && <p className="text-red-600 text-sm mt-1">{formErrors.roleId}</p>}
              {formData.roleId && !formErrors.roleId && <p className="text-green-600 text-xs mt-1">✓ Rol seleccionado</p>}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Correo Electrónico *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="usuario@ejemplo.com"
              className={formData.email && !formErrors.email ? 'border-green-500' : formErrors.email ? 'border-red-500' : ''}
            />
            {formErrors.email && <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>}
            {formData.email && !formErrors.email && <p className="text-green-600 text-xs mt-1">✓ Email válido</p>}
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Dirección</label>
            <Input
              value={formData.direccion}
              onChange={(e) => handleFieldChange('direccion', e.target.value)}
              placeholder="Calle 123 # 45-67"
              className={formData.direccion && !formErrors.direccion ? 'border-green-500' : formErrors.direccion ? 'border-red-500' : ''}
            />
            {formErrors.direccion && <p className="text-red-600 text-sm mt-1">{formErrors.direccion}</p>}
            {formData.direccion && !formErrors.direccion && <p className="text-green-600 text-xs mt-1">✓ Dirección válida</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">
                Contraseña {editingUsuario ? '(dejar vacío para no cambiar)' : '*'}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  placeholder="••••••••"
                  className={formErrors.password ? 'border-red-500' : formData.password && !formErrors.password ? 'border-green-500' : ''}
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
              <label className="block text-gray-700 mb-2">
                Repetir Contraseña {editingUsuario ? '' : '*'}
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className={formErrors.confirmPassword ? 'border-red-500' : formData.confirmPassword && !formErrors.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500' : ''}
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
            <Button onClick={() => setShowModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="primary">
              {editingUsuario ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Reporte */}
      <Modal
        isOpen={showReporte}
        onClose={() => setShowReporte(false)}
        title="Reporte de Usuarios"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-gray-600 mb-1">Total Usuarios</div>
              <div className="text-2xl text-gray-900">{usuarios.length}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-gray-600 mb-1">Activos</div>
              <div className="text-2xl text-green-600">{usuarios.filter(u => u.activo).length}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-gray-600 mb-1">Inactivos</div>
              <div className="text-2xl text-red-600">{usuarios.filter(u => !u.activo).length}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-gray-600 mb-2">Por Rol</div>
            {roles.map((rol: any) => {
              const count = usuarios.filter(u => u.role === (rol.name || rol.nombre)).length;
              return (
                <div key={rol.id} className="flex justify-between items-center py-1">
                  <span className="text-gray-700">{rol.name || rol.nombre}</span>
                  <span className="text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>

          <Button onClick={exportarReporte} variant="primary" className="w-full">
            <Download size={20} />
            Exportar Reporte
          </Button>
        </div>
      </Modal>
    </div>
  );
}
