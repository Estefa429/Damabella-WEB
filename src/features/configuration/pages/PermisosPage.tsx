import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Lock, Shield } from 'lucide-react';
import { Button, Input, Modal, Select } from '../../../shared/components/native';

export default function PermisosPage() {
  const [permissions, setPermissions] = useState([
    { id: 1, name: 'Crear Usuarios', module: 'Usuarios', description: 'Permite crear nuevos usuarios en el sistema' },
    { id: 2, name: 'Editar Usuarios', module: 'Usuarios', description: 'Permite editar información de usuarios existentes' },
    { id: 3, name: 'Eliminar Usuarios', module: 'Usuarios', description: 'Permite eliminar usuarios del sistema' },
    { id: 4, name: 'Ver Productos', module: 'Productos', description: 'Permite ver el catálogo de productos' },
    { id: 5, name: 'Crear Productos', module: 'Productos', description: 'Permite crear y registrar nuevos productos' },
    { id: 6, name: 'Editar Productos', module: 'Productos', description: 'Permite editar productos existentes' },
    { id: 7, name: 'Eliminar Productos', module: 'Productos', description: 'Permite eliminar productos del catálogo' },
    { id: 8, name: 'Ver Ventas', module: 'Ventas', description: 'Permite ver registros de ventas' },
    { id: 9, name: 'Crear Ventas', module: 'Ventas', description: 'Permite registrar nuevas ventas' },
    { id: 10, name: 'Ver Reportes', module: 'Reportes', description: 'Permite acceder a reportes del sistema' },
    { id: 11, name: 'Exportar Datos', module: 'Reportes', description: 'Permite exportar información en diferentes formatos' },
    { id: 12, name: 'Gestionar Roles', module: 'Configuración', description: 'Permite administrar roles y permisos del sistema' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', module: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');

  const modules = ['all', ...new Set(permissions.map(p => p.module))];

  const handleCreate = () => {
    setEditingPermission(null);
    setFormData({ name: '', module: '', description: '' });
    setShowModal(true);
  };

  const handleEdit = (permission: any) => {
    setEditingPermission(permission);
    setFormData(permission);
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingPermission) {
      setPermissions(permissions.map(p => p.id === editingPermission.id ? { ...p, ...formData } : p));
    } else {
      setPermissions([...permissions, { id: Date.now(), ...formData }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de eliminar este permiso?')) {
      setPermissions(permissions.filter(p => p.id !== id));
    }
  };

  const filteredPermissions = permissions
    .filter(p => filterModule === 'all' || p.module === filterModule)
    .filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const groupedPermissions = filteredPermissions.reduce((acc: any, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Permisos</h2>
          <p className="text-gray-600">Define y administra los permisos del sistema</p>
        </div>
        <Button onClick={handleCreate} variant="primary">
          <Plus size={20} />
          Crear Permiso
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              placeholder="Buscar permisos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="all">Todos los módulos</option>
              {modules.filter(m => m !== 'all').map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Permissions by Module */}
      <div className="space-y-6">
        {Object.keys(groupedPermissions).map((module) => (
          <div key={module} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center text-white">
                <Shield size={20} />
              </div>
              <h3 className="text-gray-900">{module}</h3>
              <span className="text-gray-500">({groupedPermissions[module].length})</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600">Nombre</th>
                    <th className="text-left py-3 px-4 text-gray-600">Descripción</th>
                    <th className="text-right py-3 px-4 text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedPermissions[module].map((permission: any) => (
                    <tr key={permission.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Lock size={16} className="text-gray-400" />
                          <span className="text-gray-900">{permission.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{permission.description}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(permission)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(permission.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Create/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPermission ? 'Editar Permiso' : 'Crear Permiso'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Nombre del Permiso</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Crear Productos"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Módulo</label>
            <Input
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
              placeholder="Ej: Productos"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              rows={3}
              placeholder="Describe qué permite hacer este permiso"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button onClick={() => setShowModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="primary">
              {editingPermission ? 'Guardar Cambios' : 'Crear Permiso'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
