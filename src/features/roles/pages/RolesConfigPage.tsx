import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, Check, X, Search } from 'lucide-react';
import { Button, Input, Modal } from '../../../shared/components/native';
import validateField from '../../../shared/utils/validation';

const STORAGE_KEY = 'damabella_roles';

export default function RolesConfigPage() {
  const [roles, setRoles] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    
    // Roles por defecto
    const rolesDefault = [
      {
        id: 1,
        nombre: 'Administrador',
        descripcion: 'Acceso total al sistema',
        activo: true,
        permisos: {
          dashboard: { ver: true },
          roles: { ver: true, crear: true, editar: true, eliminar: true },
          permisos: { ver: true, crear: true, editar: true, eliminar: true },
          usuarios: { ver: true, crear: true, editar: true, eliminar: true },
          categorias: { ver: true, crear: true, editar: true, eliminar: true },
          productos: { ver: true, crear: true, editar: true, eliminar: true },
          proveedores: { ver: true, crear: true, editar: true, eliminar: true },
          compras: { ver: true, crear: true, editar: true, eliminar: true },
          clientes: { ver: true, crear: true, editar: true, eliminar: true },
          pedidos: { ver: true, crear: true, editar: true, eliminar: true },
          ventas: { ver: true, crear: true, editar: true, eliminar: true },
          devoluciones: { ver: true, crear: true, editar: true, eliminar: true }
        }
      },
      {
        id: 2,
        nombre: 'Empleado',
        descripcion: 'Puede registrar ventas pero no eliminar',
        activo: true,
        permisos: {
          dashboard: { ver: true },
          productos: { ver: true, crear: false, editar: false, eliminar: false },
          clientes: { ver: true, crear: true, editar: true, eliminar: false },
          pedidos: { ver: true, crear: true, editar: true, eliminar: false },
          ventas: { ver: true, crear: true, editar: false, eliminar: false },
          devoluciones: { ver: true, crear: true, editar: false, eliminar: false }
        }
      },
      {
        id: 3,
        nombre: 'Cliente',
        descripcion: 'Acceso limitado',
        activo: true,
        permisos: {}
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rolesDefault));
    return rolesDefault;
  });

  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
  const [formErrors, setFormErrors] = useState<any>({});
  const [selectedPermisos, setSelectedPermisos] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');

  const modulos = [
    { id: 'dashboard', label: 'Dashboard', categoria: 'General' },
    { id: 'roles', label: 'Gestión de Roles', categoria: 'Configuración' },
    { id: 'permisos', label: 'Gestión de Permisos', categoria: 'Configuración' },
    { id: 'usuarios', label: 'Gestión de Usuarios', categoria: 'Usuarios' },
    { id: 'categorias', label: 'Categorías', categoria: 'Compras' },
    { id: 'productos', label: 'Productos', categoria: 'Compras' },
    { id: 'proveedores', label: 'Proveedores', categoria: 'Compras' },
    { id: 'compras', label: 'Compras', categoria: 'Compras' },
    { id: 'clientes', label: 'Clientes', categoria: 'Ventas' },
    { id: 'pedidos', label: 'Pedidos', categoria: 'Ventas' },
    { id: 'ventas', label: 'Ventas', categoria: 'Ventas' },
    { id: 'devoluciones', label: 'Devoluciones', categoria: 'Ventas' }
  ];

  const acciones = ['ver', 'crear', 'editar', 'eliminar'];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  }, [roles]);

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({ nombre: '', descripcion: '' });
    setShowModal(true);
  };

  const handleEdit = (role: any) => {
    setEditingRole(role);
    setFormData({ nombre: role.nombre, descripcion: role.descripcion });
    setShowModal(true);
  };

  const handleSave = () => {
    const errors: any = {};
    ['nombre', 'descripcion'].forEach((f) => {
      const err = validateField(f, (formData as any)[f]);
      if (err) errors[f] = err;
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingRole) {
      setRoles(roles.map((r: any) => r.id === editingRole.id ? { ...r, ...formData } : r));
    } else {
      setRoles([...roles, { id: Date.now(), ...formData, activo: true, permisos: {} }]);
    }
    setShowModal(false);
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

  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de eliminar este rol?')) {
      setRoles(roles.filter((r: any) => r.id !== id));
    }
  };

  const toggleActive = (id: number) => {
    setRoles(roles.map((r: any) => 
      r.id === id ? { ...r, activo: !r.activo } : r
    ));
  };

  const handleEditPermissions = (role: any) => {
    setEditingRole(role);
    setSelectedPermisos(role.permisos || {});
    setShowPermissionsModal(true);
  };

  const togglePermiso = (moduloId: string, accion: string) => {
    setSelectedPermisos((prev: any) => {
      const moduloPermisos = prev[moduloId] || {};
      
      // Si se marca "ver", se debe activar
      // Si se desmarca "ver", desmarcar todas las demás
      if (accion === 'ver') {
        if (moduloPermisos.ver) {
          // Si ya está marcado "ver", desmarcar todo
          const newPermisos = { ...prev };
          delete newPermisos[moduloId];
          return newPermisos;
        } else {
          // Marcar solo "ver"
          return {
            ...prev,
            [moduloId]: { ver: true }
          };
        }
      } else {
        // Para otras acciones, requiere que "ver" esté activo
        if (!moduloPermisos.ver) {
          alert('Primero debes habilitar "Ver" para este módulo');
          return prev;
        }
        
        return {
          ...prev,
          [moduloId]: {
            ...moduloPermisos,
            [accion]: !moduloPermisos[accion]
          }
        };
      }
    });
  };

  const handleSavePermissions = () => {
    setRoles(roles.map((r: any) => 
      r.id === editingRole.id ? { ...r, permisos: selectedPermisos } : r
    ));
    setShowPermissionsModal(false);
  };

  const getPermisosCount = (permisos: any) => {
    if (!permisos) return 0;
    return Object.keys(permisos).length;
  };

  const filteredRoles = roles.filter((r: any) =>
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Roles</h2>
          <p className="text-gray-600">Administra los roles del sistema y sus permisos</p>
        </div>
        <Button onClick={handleCreate} variant="primary">
          <Plus size={20} />
          Nuevo Rol
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Roles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role: any) => (
          <div key={role.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center text-white">
                  <Shield size={24} />
                </div>
                <button
                  onClick={() => toggleActive(role.id)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    role.activo ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    role.activo ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <h3 className="text-gray-900 mb-2">{role.nombre}</h3>
              <p className="text-gray-600 mb-4">{role.descripcion}</p>

              <div className="mb-4">
                <div className="text-gray-600 mb-2">
                  Permisos: {getPermisosCount(role.permisos)} módulos
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEditPermissions(role)}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Configurar Permisos
                </button>
                <button
                  onClick={() => handleEdit(role)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  title="Editar"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(role.id)}
                  className="p-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Create/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRole ? 'Editar Rol' : 'Nuevo Rol'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Nombre del Rol *</label>
            <Input
              value={formData.nombre}
              onChange={(e) => handleFieldChange('nombre', e.target.value)}
              placeholder="Ej: Gerente"
              required
            />
            {formErrors.nombre && <p className="text-red-600 text-sm mt-1">{formErrors.nombre}</p>}
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleFieldChange('descripcion', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows={3}
              placeholder="Describe las responsabilidades de este rol"
            />
            {formErrors.descripcion && <p className="text-red-600 text-sm mt-1">{formErrors.descripcion}</p>}
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button onClick={() => setShowModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="primary">
              {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Permisos */}
      <Modal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        title={`Configurar Permisos - ${editingRole?.nombre}`}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-gray-600">
            Selecciona los permisos que tendrá este rol en cada módulo del sistema
          </p>

          {/* Agrupar por categoría */}
          {['General', 'Configuración', 'Usuarios', 'Compras', 'Ventas'].map(categoria => {
            const modulosCategoria = modulos.filter(m => m.categoria === categoria);
            if (modulosCategoria.length === 0) return null;

            return (
              <div key={categoria} className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-gray-900 mb-3">{categoria}</h4>
                <div className="space-y-3">
                  {modulosCategoria.map(modulo => (
                    <div key={modulo.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-700 mb-2">{modulo.label}</div>
                      <div className="grid grid-cols-4 gap-2">
                        {acciones.map(accion => {
                          const isChecked = selectedPermisos[modulo.id]?.[accion] === true;
                          const isDisabled = accion !== 'ver' && !selectedPermisos[modulo.id]?.ver;
                          
                          return (
                            <button
                              key={accion}
                              onClick={() => !isDisabled && togglePermiso(modulo.id, accion)}
                              disabled={isDisabled}
                              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                isChecked
                                  ? 'bg-green-500 text-white'
                                  : isDisabled
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {isChecked && <Check size={14} className="inline mr-1" />}
                              {accion.charAt(0).toUpperCase() + accion.slice(1)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex gap-3 justify-end pt-4 border-t sticky bottom-0 bg-white">
            <Button onClick={() => setShowPermissionsModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions} variant="primary">
              Guardar Permisos
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
