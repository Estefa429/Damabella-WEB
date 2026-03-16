import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Plus, Edit2, Trash2, Search, Loader,
  Check, X, AlertCircle
} from 'lucide-react';
import { Button, Input, Modal, useToast } from '../../../shared/components/native';
import {
  getAllRoles, getAllPermissions, getPermissionsByRol,
  syncRolePermissions, createRole, updateRole,
  patchRoleState, deleteRole,
  Role, Permission, RolPermission
} from '@/features/roles/services/rolesServices';

// ─── Acciones disponibles en orden fijo ──────────────────────────────────────
const ACTIONS = ['View', 'Create', 'Edit', 'Delete'];
const ACTION_LABELS: Record<string, string> = {
  View: 'Ver',
  Create: 'Crear',
  Edit: 'Editar',
  Delete: 'Eliminar',
};

// ─── Estructura agrupada por módulo para el formulario ────────────────────────
interface ModulePerms {
  module: string;
  perms: { permission: Permission; assigned: boolean }[];
}

export default function RolesPage() {
  const { showToast } = useToast();

  // ─── Estado principal ───────────────────────────────────────────────────────
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Modales ────────────────────────────────────────────────────────────────
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleToToggle, setRoleToToggle] = useState<Role | null>(null);

  // ─── Formulario ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [modulePerms, setModulePerms] = useState<ModulePerms[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);

  // ─── Carga inicial ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.all([
        getAllRoles(),
        getAllPermissions(),
      ]);
      if (rolesData) setRoles(rolesData);
      else showToast('Error al cargar roles', 'error');
      if (permsData) setAllPermissions(permsData);
      else showToast('Error al cargar permisos', 'error');
    } catch {
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Agrupar permisos por módulo ─────────────────────────────────────────────
  const groupPermsByModule = useCallback(
    (assignedIds: number[]): ModulePerms[] => {
      const modules: Record<string, ModulePerms> = {};
      allPermissions.forEach((p) => {
        if (!modules[p.Module_permission]) {
          modules[p.Module_permission] = { module: p.Module_permission, perms: [] };
        }
        modules[p.Module_permission].perms.push({
          permission: p,
          assigned: assignedIds.includes(p.id_permissions),
        });
      });
      // Ordenar permisos de cada módulo según ACTIONS
      Object.values(modules).forEach((mod) => {
        mod.perms.sort(
          (a, b) =>
            ACTIONS.indexOf(a.permission.Action) - ACTIONS.indexOf(b.permission.Action)
        );
      });
      return Object.values(modules);
    },
    [allPermissions]
  );

  // IDs de permisos actualmente seleccionados en el formulario
  const getAssignedIds = (): number[] =>
    modulePerms.flatMap((m) =>
      m.perms.filter((p) => p.assigned).map((p) => p.permission.id_permissions)
    );

  // ─── Abrir modal crear ───────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setModulePerms(groupPermsByModule([]));
    setShowFormModal(true);
  };

  // ─── Abrir modal editar ──────────────────────────────────────────────────────
  const handleOpenEdit = async (role: Role) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description ?? '' });
    setFormErrors({});
    setShowFormModal(true);
    setLoadingPerms(true);
    try {
      const rolPerms: RolPermission[] | null = await getPermissionsByRol(role.idRol);
      const assignedIds = rolPerms ? rolPerms.map((rp) => rp.permission) : [];
      setModulePerms(groupPermsByModule(assignedIds));
    } catch {
      showToast('Error cargando permisos del rol', 'error');
      setModulePerms(groupPermsByModule([]));
    } finally {
      setLoadingPerms(false);
    }
  };

  // ─── Toggle permiso individual ────────────────────────────────────────────────
  const handleTogglePerm = (moduleIdx: number, permIdx: number) => {
    setModulePerms((prev) =>
      prev.map((m, mi) =>
        mi !== moduleIdx ? m : {
          ...m,
          perms: m.perms.map((p, pi) =>
            pi !== permIdx ? p : { ...p, assigned: !p.assigned }
          ),
        }
      )
    );
  };

  // ─── Toggle todos los permisos de un módulo ───────────────────────────────────
  const handleToggleModule = (moduleIdx: number, enable: boolean) => {
    setModulePerms((prev) =>
      prev.map((m, mi) =>
        mi !== moduleIdx ? m : {
          ...m,
          perms: m.perms.map((p) => ({ ...p, assigned: enable })),
        }
      )
    );
  };

  // ─── Guardar rol (crear o editar) ─────────────────────────────────────────────
  const handleSave = async () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'El nombre es obligatorio';
    else if (formData.name.trim().length < 3) errors.name = 'Mínimo 3 caracteres';
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    try {
      setActionLoading(true);
      if (editingRole) {
        // Editar
        const updated = await updateRole(editingRole.idRol, {
          name: formData.name,
          description: formData.description,
        });
        if (!updated) { showToast('Error al actualizar el rol', 'error'); return; }
        const synced = await syncRolePermissions(editingRole.idRol, getAssignedIds());
        if (!synced) showToast('Rol actualizado pero hubo un error sincronizando permisos', 'error');
        else showToast(`Rol "${formData.name}" actualizado correctamente`, 'success');
      } else {
        // Crear
        const newRole = await createRole({
          name: formData.name,
          description: formData.description,
          permissions: getAssignedIds(),
        });
        if (!newRole) { showToast('Error al crear el rol', 'error'); return; }
        // Sincronizar permisos por si el backend no los asignó todos
        if (getAssignedIds().length > 0) {
          await syncRolePermissions(newRole.idRol, getAssignedIds());
        }
        showToast(`Rol "${formData.name}" creado correctamente`, 'success');
      }
      setShowFormModal(false);
      await loadData();
    } catch {
      showToast('Error al guardar el rol', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Eliminar ─────────────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
  if (!roleToDelete) return;
  try {
    setActionLoading(true);
    const result = await deleteRole(roleToDelete.idRol);
    if (result.success) {
      showToast(`Rol "${roleToDelete.name}" eliminado`, 'success');
      setShowDeleteModal(false);
      setRoleToDelete(null);
      await loadData();
    } else if (result.hasUsers) {
      showToast('No se puede eliminar — hay usuarios asignados a este rol', 'error');
      setShowDeleteModal(false);
    } else {
      showToast('Error al eliminar el rol', 'error');
    }
  } catch {
    showToast('Error al eliminar el rol', 'error');
  } finally {
    setActionLoading(false);
  }
};

  // ─── Toggle estado ────────────────────────────────────────────────────────────
  const handleConfirmToggle = async () => {
    if (!roleToToggle) return;
    try {
      setActionLoading(true);
      const success = await patchRoleState(roleToToggle.idRol, !roleToToggle.is_active);
      if (success) {
        showToast(
          `Rol "${roleToToggle.name}" ${!roleToToggle.is_active ? 'activado' : 'desactivado'}`,
          'success'
        );
        setShowToggleModal(false);
        setRoleToToggle(null);
        await loadData();
      } else {
        showToast('Error al cambiar estado del rol', 'error');
      }
    } catch {
      showToast('Error al cambiar estado del rol', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Filtrado ─────────────────────────────────────────────────────────────────
  const filtered = roles.filter((r) => {
    const s = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(s) ||
      (r.description ?? '').toLowerCase().includes(s)
    );
  });

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Cargando roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-1">Gestión de Roles y Permisos</h2>
          <p className="text-gray-600">Administra los roles del sistema y sus permisos por módulo</p>
        </div>
        <Button onClick={handleOpenCreate} variant="primary">
          <Plus size={18} />
          Nuevo Rol
        </Button>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Rol</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Descripción</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Estado</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-gray-400">
                  <Shield className="mx-auto mb-3" size={40} />
                  <p>No se encontraron roles</p>
                </td>
              </tr>
            ) : (
              filtered.map((role) => (
                <tr key={role.idRol} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Shield size={18} className="text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-900">{role.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{role.description || '—'}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => { setRoleToToggle(role); setShowToggleModal(true); }}
                      title={role.is_active ? 'Desactivar' : 'Activar'}
                      style={{
                        position: 'relative',
                        width: '44px',
                        height: '24px',
                        borderRadius: '9999px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: role.is_active ? '#22c55e' : '#9ca3af',
                        transition: 'background-color 0.2s',
                        display: 'inline-block',
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: role.is_active ? '22px' : '2px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '9999px',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'left 0.2s',
                      }} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(role)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        title="Editar rol y permisos"
                      >
                        <Edit2 size={17} />
                      </button>
                      {role.name.toLowerCase() !== 'administrador' && (
                        <button
                          onClick={() => { setRoleToDelete(role); setShowDeleteModal(true); }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          title="Eliminar rol"
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal Crear / Editar ──────────────────────────────────────────────── */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingRole ? `Editar: ${editingRole.name}` : 'Nuevo Rol'}
      >
        <div className="space-y-5">

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Vendedor, Contador"
              disabled={actionLoading}
            />
            {formErrors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={14} /> {formErrors.name}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Describe brevemente el rol"
              disabled={actionLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm resize-none disabled:opacity-50"
            />
          </div>

          {/* Permisos por módulo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permisos por módulo</label>
            {loadingPerms ? (
              <div className="flex items-center justify-center py-10">
                <Loader className="animate-spin text-gray-400" size={28} />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Módulo</th>
                      {ACTIONS.map((action) => (
                        <th key={action} className="px-2 py-2 text-center font-semibold text-gray-700 text-xs w-14">
                          {ACTION_LABELS[action]}
                        </th>
                      ))}
                      <th className="px-2 py-2 text-center font-semibold text-gray-700 text-xs w-16">Todos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {modulePerms.map((mod, mi) => (
                      <tr key={mod.module} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-800 text-sm">{mod.module}</td>
                        {ACTIONS.map((action) => {
                          const entry = mod.perms.find((p) => p.permission.Action === action);
                          if (!entry) {
                            return (
                              <td key={action} className="px-2 py-2 text-center text-gray-300 text-xs">—</td>
                            );
                          }
                          const pi = mod.perms.indexOf(entry);
                          return (
                            <td key={action} className="px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={entry.assigned}
                                onChange={() => handleTogglePerm(mi, pi)}
                                disabled={actionLoading}
                                className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                              />
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleModule(mi, true)}
                              className="p-1 hover:bg-green-50 rounded"
                              title="Activar todos"
                            >
                              <Check size={14} className="text-green-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleModule(mi, false)}
                              className="p-1 hover:bg-red-50 rounded"
                              title="Desactivar todos"
                            >
                              <X size={14} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowFormModal(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={actionLoading || loadingPerms}>
              {actionLoading ? (
                <><Loader size={16} className="animate-spin" /> Guardando...</>
              ) : (
                editingRole ? 'Guardar cambios' : 'Crear Rol'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Toggle Estado ───────────────────────────────────────────────── */}
      <Modal
        isOpen={showToggleModal}
        onClose={() => { setShowToggleModal(false); setRoleToToggle(null); }}
        title={roleToToggle?.is_active ? 'Desactivar Rol' : 'Activar Rol'}
      >
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border ${roleToToggle?.is_active ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <p className="text-gray-700">
              ¿Estás seguro de que deseas{' '}
              <strong>{roleToToggle?.is_active ? 'desactivar' : 'activar'}</strong> el rol{' '}
              <strong>{roleToToggle?.name}</strong>?
            </p>
            {roleToToggle?.is_active && (
              <p className="text-yellow-800 text-sm mt-2 font-medium">
                ⚠️ Los usuarios con este rol podrían perder acceso al sistema.
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => { setShowToggleModal(false); setRoleToToggle(null); }}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleConfirmToggle} disabled={actionLoading}>
              {actionLoading
                ? <Loader size={16} className="animate-spin" />
                : roleToToggle?.is_active ? 'Desactivar' : 'Activar'
              }
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Eliminar ────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setRoleToDelete(null); }}
        title="Eliminar Rol"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-gray-700 mb-1">
              ¿Estás seguro de que deseas eliminar el rol <strong>{roleToDelete?.name}</strong>?
            </p>
            <p className="text-red-800 text-sm font-medium">
              ⚠️ Esta acción es irreversible. Los usuarios con este rol perderán sus permisos.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => { setShowDeleteModal(false); setRoleToDelete(null); }}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}
              disabled={actionLoading}
            >
              {actionLoading
                ? <><Loader size={16} className="animate-spin" /> Eliminando...</>
                : 'Eliminar Rol'
              }
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
