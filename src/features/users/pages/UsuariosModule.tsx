import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Users, Search, Download, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Modal } from '../../../shared/components/native';
import { useToast } from '../../../shared/components/native';

// ─── Services ─────────────────────────────────────────────────────────────────
import {
  getAllUsers, getAllRoles, getAllTypeDocs, createUser, updateUser,
  patchUserState, deleteUser, exportUsers,
  User, Role, TypeDoc, CreateUserDTO,
} from '@/features/users/Services/userService';

// ─── Utils ────────────────────────────────────────────────────────────────────
const validatePassword = (p: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(p);

// ─── Component ────────────────────────────────────────────────────────────────
export default function UsuariosModule() {
  const { showToast } = useToast();

  // ─── Data ────────────────────────────────────────────────────────────────────
  const [users,     setUsers]     = useState<User[]>([]);
  const [roles,     setRoles]     = useState<Role[]>([]);
  const [typeDocs,  setTypeDocs]  = useState<TypeDoc[]>([]);
  const [loading,   setLoading]   = useState(true);

  // ─── UI ──────────────────────────────────────────────────────────────────────
  const [searchTerm,  setSearchTerm]  = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ─── Modals ──────────────────────────────────────────────────────────────────
  const [showModal,       setShowModal]       = useState(false);
  const [showViewModal,   setShowViewModal]   = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [showReporte,     setShowReporte]     = useState(false);

  const [editingUser,  setEditingUser]  = useState<User | null>(null);
  const [viewingUser,  setViewingUser]  = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [togglingUser, setTogglingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Form ────────────────────────────────────────────────────────────────────
  const emptyForm = {
    name: '', type_doc: '', doc_identity: '', phone: '',
    email: '', address: '', password: '', confirmPassword: '', id_rol: '',
  };
  const [formData,   setFormData]   = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPass,   setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ─── Load data ───────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [us, ro, td] = await Promise.all([getAllUsers(), getAllRoles(), getAllTypeDocs()]);
      console.log('roles cargados:', ro);
      console.log('primer usuario:', us?.[0]);
      if (us) setUsers(us);
      if (ro) setRoles(ro);
      if (td) setTypeDocs(td);
    } catch {
      showToast('Error cargando datos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {  loadData(); }, [loadData]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // ─── Filter & paginate ───────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const q = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.doc_identity.includes(q) ||
      (u.role_name ?? '').toLowerCase().includes(q)
    );
  });
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ─── Helpers form ────────────────────────────────────────────────────────────
  const setField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim())         errors.name         = 'Nombre requerido';
    if (!formData.type_doc)            errors.type_doc     = 'Tipo de documento requerido';
    if (!formData.doc_identity.trim()) errors.doc_identity = 'Número de documento requerido';
    if (!formData.phone.trim())        errors.phone        = 'Celular requerido';
    if (!formData.email.trim())        errors.email        = 'Email requerido';
    if (!formData.id_rol)              errors.id_rol       = 'Rol requerido';

    // Contraseña — obligatoria solo al crear
    if (!editingUser || formData.password) {
      if (!editingUser && !formData.password)
        errors.password = 'Contraseña requerida';
      if (formData.password && !validatePassword(formData.password))
        errors.password = 'Mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial';
      if (formData.password && formData.password !== formData.confirmPassword)
        errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Duplicados
    if (users.some(u => u.email === formData.email && u.id_user !== editingUser?.id_user))
      errors.email = 'Este email ya está registrado';
    if (users.some(u => u.doc_identity === formData.doc_identity && u.id_user !== editingUser?.id_user))
      errors.doc_identity = 'Este documento ya está registrado';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── Crear ───────────────────────────────────────────────────────────────────
  const handleCreate = () => {
    setEditingUser(null);
    setFormData(emptyForm);
    setFormErrors({});
    setShowModal(true);
  };

  // ─── Editar ──────────────────────────────────────────────────────────────────
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name:         user.name,
      type_doc:     String(user.type_doc),
      doc_identity: user.doc_identity,
      phone:        user.phone,
      email:        user.email,
      address:      user.address ?? '',
      password:     '',
      confirmPassword: '',
      id_rol:       String(user.id_rol ?? user.id_rol),
    });
    setFormErrors({});
    setShowModal(true);
  };

  // ─── Guardar ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    console.log('formData completo:', formData);
    const valid = validateForm();
    console.log('validateForm resultado:', valid, 'errors:', formErrors);
    if (!validateForm()) return;
    setIsSubmitting(true);

    const payload: CreateUserDTO = {
      type_doc:     Number(formData.type_doc),
      doc_identity: formData.doc_identity.trim(),
      name:         formData.name.trim(),
      email:        formData.email.trim(),
      phone:        formData.phone.trim(),
      address:      formData.address.trim() || undefined,
      id_rol:       Number(formData.id_rol),
      password:     formData.password,
    };

    let result: User | null = null;

    if (editingUser) {
      const updatePayload: any = { ...payload };
      if (!formData.password) delete updatePayload.password;
      result = await updateUser(editingUser.id_user, updatePayload);
    } else {
      result = await createUser(payload);
    }

    if (result) {
      showToast(editingUser ? 'Usuario actualizado' : 'Usuario creado', 'success');
      await loadData();
      setShowModal(false);
    } else {
      showToast('Error al guardar el usuario', 'error');
    }
    setIsSubmitting(false);
  };

  // ─── Toggle estado ───────────────────────────────────────────────────────────
  const handleToggle = (user: User) => {
    setTogglingUser(user);
    setShowToggleModal(true);
  };

  const confirmToggle = async () => {
    if (!togglingUser) return;
    setIsSubmitting(true);
    const ok = await patchUserState(togglingUser.id_user, !togglingUser.is_active);
    if (ok) {
      showToast(`Usuario ${!togglingUser.is_active ? 'activado' : 'desactivado'}`, 'success');
      await loadData();
    } else {
      showToast('Error al cambiar estado', 'error');
    }
    setIsSubmitting(false);
    setShowToggleModal(false);
  };

  // ─── Eliminar ────────────────────────────────────────────────────────────────
  const handleDelete = (user: User) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setIsSubmitting(true);
    const ok = await deleteUser(deletingUser.id_user);
    if (ok) {
      showToast('Usuario eliminado', 'success');
      await loadData();
    } else {
      showToast('No se pudo eliminar', 'error');
    }
    setIsSubmitting(false);
    setShowDeleteModal(false);
  };

  // ─── Export ──────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      await exportUsers();
    } catch {
      showToast('Error al exportar', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-lg mb-1">Gestión de Usuarios</h2>
          <p className="text-gray-500 text-xs">Administra los usuarios del sistema y sus roles</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowReporte(true)} variant="secondary">
            <Download size={16} /> Reporte
          </Button>
          <Button onClick={handleCreate} variant="primary">
            <Plus size={16} /> Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Buscar por nombre, email, documento o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Usuario</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Documento</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Contacto</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Rol</th>
                <th className="text-center py-3 px-4 text-gray-600 font-medium">Estado</th>
                <th className="text-right py-3 px-4 text-gray-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Users className="mx-auto mb-2 text-gray-300" size={40} />
                    <p className="text-sm">No se encontraron usuarios</p>
                  </td>
                </tr>
              ) : (
                paginated.map(user => (
                  <tr key={user.id_user} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">
                          {user.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs text-gray-500">{user.type_doc_name}</p>
                      <p className="text-sm text-gray-700">{user.doc_identity}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-700">{user.phone}</p>
                      {user.address && <p className="text-xs text-gray-500 truncate max-w-[140px]">{user.address}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        user.role_name?.toLowerCase() === 'administrador' ? 'bg-purple-100 text-purple-700' :
                        user.role_name?.toLowerCase() === 'empleado'      ? 'bg-blue-100 text-blue-700' :
                                                                             'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role_name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleToggle(user)}
                          title={user.is_active ? 'Desactivar' : 'Activar'}
                          style={{
                            position: 'relative',
                            width: '44px',
                            height: '24px',
                            borderRadius: '9999px',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: user.is_active ? '#22c55e' : '#9ca3af',
                            transition: 'background-color 0.2s',
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '2px',
                            left: user.is_active ? '22px' : '2px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '9999px',
                            backgroundColor: 'white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            transition: 'left 0.2s',
                          }} />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => { setViewingUser(user); setShowViewModal(true); }}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => handleEdit(user)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(user)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {filtered.length} usuarios — página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40">
                Anterior
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, currentPage - 2) + i;
                if (page > totalPages) return null;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      currentPage === page ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}>
                    {page}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal Crear / Editar ───────────────────────────────────────────── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'} size="lg">
        <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">

          {/* Nombre */}
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Nombre completo *</label>
            <Input value={formData.name} onChange={(e) => setField('name', e.target.value)} placeholder="Juan Pérez"
              className={formErrors.name ? 'border-red-400' : ''} />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>

          {/* Tipo doc + Número doc */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-xs">Tipo de documento *</label>
              <select value={formData.type_doc} onChange={(e) => setField('type_doc', e.target.value)}
                className={`w-full h-9 px-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 ${formErrors.type_doc ? 'border-red-400' : 'border-gray-300'}`}>
                <option value="">Seleccionar...</option>
                {typeDocs.map(t => <option key={t.id_doc} value={t.id_doc}>{t.name}</option>)}
              </select>
              {formErrors.type_doc && <p className="text-red-500 text-xs mt-1">{formErrors.type_doc}</p>}
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-xs">Número de documento *</label>
              <Input value={formData.doc_identity} onChange={(e) => setField('doc_identity', e.target.value)} placeholder="1234567890"
                className={formErrors.doc_identity ? 'border-red-400' : ''} />
              {formErrors.doc_identity && <p className="text-red-500 text-xs mt-1">{formErrors.doc_identity}</p>}
            </div>
          </div>

          {/* Celular + Rol */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-xs">Celular *</label>
              <Input value={formData.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="3001234567"
                className={formErrors.phone ? 'border-red-400' : ''} />
              {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-xs">Rol *</label>
              <select value={formData.id_rol} onChange={(e) => setField('id_rol', e.target.value)}
                className={`w-full h-9 px-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 ${formErrors.id_rol ? 'border-red-400' : 'border-gray-300'}`}>
                <option value="">Seleccionar rol...</option>
                {roles.filter(r => r.is_active).map(r => <option key={r.idRol} value={r.idRol}>{r.name}</option>)}
              </select>
              {formErrors.id_rol && <p className="text-red-500 text-xs mt-1">{formErrors.id_rol}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Correo electrónico *</label>
            <Input type="email" value={formData.email} onChange={(e) => setField('email', e.target.value)} placeholder="usuario@ejemplo.com"
              className={formErrors.email ? 'border-red-400' : ''} />
            {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Dirección</label>
            <Input value={formData.address} onChange={(e) => setField('address', e.target.value)} placeholder="Calle 123 # 45-67" />
          </div>

          {/* Contraseñas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-xs">
                Contraseña {editingUser ? '(dejar vacío para no cambiar)' : '*'}
              </label>
              <div className="relative">
                <Input type={showPass ? 'text' : 'password'} value={formData.password}
                  onChange={(e) => setField('password', e.target.value)} placeholder="••••••••"
                  className={formErrors.password ? 'border-red-400' : ''} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
              <p className="text-xs text-gray-400 mt-1">8+ chars, mayúscula, minúscula, número y símbolo</p>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-xs">
                Repetir contraseña {editingUser ? '' : '*'}
              </label>
              <div className="relative">
                <Input type={showConfirm ? 'text' : 'password'} value={formData.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)} placeholder="••••••••"
                  className={formErrors.confirmPassword ? 'border-red-400' : ''} />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {formErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t">
            <Button onClick={() => setShowModal(false)} variant="secondary">Cancelar</Button>
            <Button onClick={handleSave} variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : editingUser ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal Ver Usuario ──────────────────────────────────────────────── */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Detalle del Usuario" size="md">
        {viewingUser && (
          <div className="space-y-5 text-sm">
            <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
                {viewingUser.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900">{viewingUser.name}</p>
                <p className="text-xs text-gray-500">{viewingUser.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  viewingUser.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {viewingUser.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tipo de documento</p>
                <p className="font-medium text-gray-900">{viewingUser.type_doc_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Número de documento</p>
                <p className="font-medium text-gray-900">{viewingUser.doc_identity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Celular</p>
                <p className="font-medium text-gray-900">{viewingUser.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Rol</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  viewingUser.role_name?.toLowerCase() === 'administrador' ? 'bg-purple-100 text-purple-700' :
                  viewingUser.role_name?.toLowerCase() === 'empleado'      ? 'bg-blue-100 text-blue-700' :
                                                                              'bg-gray-100 text-gray-700'
                }`}>
                  {viewingUser.role_name}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Fecha de creación</p>
                <p className="font-medium text-gray-900">{new Date(viewingUser.created_at).toLocaleDateString('es-CO')}</p>
              </div>
              {viewingUser.address && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Dirección</p>
                  <p className="font-medium text-gray-900">{viewingUser.address}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowViewModal(false)} variant="primary">Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Modal Eliminar ─────────────────────────────────────────────────── */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Eliminar Usuario" size="sm">
        <div className="space-y-4 text-sm">
          <p className="text-gray-700">¿Eliminar a <strong>{deletingUser?.name}</strong>? Esta acción no se puede deshacer.</p>
          <div className="flex gap-3 justify-end">
            <Button onClick={() => setShowDeleteModal(false)} variant="secondary">Cancelar</Button>
            <Button onClick={confirmDelete} variant="primary" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal Toggle Estado ────────────────────────────────────────────── */}
      <Modal isOpen={showToggleModal} onClose={() => setShowToggleModal(false)} title="Cambiar Estado" size="sm">
        <div className="space-y-4 text-sm">
          <p className="text-gray-700">
            ¿Deseas <strong>{togglingUser?.is_active ? 'desactivar' : 'activar'}</strong> a <strong>{togglingUser?.name}</strong>?
          </p>
          <div className="flex gap-3 justify-end">
            <Button onClick={() => setShowToggleModal(false)} variant="secondary">Cancelar</Button>
            <Button onClick={confirmToggle} variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal Reporte ──────────────────────────────────────────────────── */}
      <Modal isOpen={showReporte} onClose={() => setShowReporte(false)} title="Reporte de Usuarios" size="sm">
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Activos</p>
              <p className="text-2xl font-bold text-green-600">{users.filter(u => u.is_active).length}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Inactivos</p>
              <p className="text-2xl font-bold text-red-500">{users.filter(u => !u.is_active).length}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2">Por rol</p>
            {roles.map(r => (
              <div key={r.idRol} className="flex justify-between py-1 text-xs">
                <span className="text-gray-700">{r.name}</span>
                <span className="font-medium text-gray-900">{users.filter(u => u.id_rol === r.idRol).length}</span>
              </div>
            ))}
          </div>

          <Button onClick={handleExport} variant="primary" className="w-full">
            <Download size={16} /> Exportar Excel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
