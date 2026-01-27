import React, { useState, useEffect } from 'react';
import { Plus, Shield, Search } from 'lucide-react';
import { Input } from '../../../shared/components/native';

const STORAGE_KEY = 'damabella_roles';

interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  permisos: Record<string, boolean>;
}

export default function RolesConfigPage() {
  const [roles, setRoles] = useState<Rol[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);

    const rolesDefault: Rol[] = [
      {
        id: 1,
        nombre: 'Administrador',
        descripcion: 'Acceso total al sistema',
        activo: true,
        permisos: {}
      },
      {
        id: 2,
        nombre: 'Empleado',
        descripcion: 'Puede registrar ventas pero no eliminar',
        activo: true,
        permisos: {}
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

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  }, [roles]);

  // Cantidad de módulos simulada por rol
  const getModulosPorRol = (rol: Rol) => {
    if (rol.nombre === 'Administrador') return 12;
    if (rol.nombre === 'Empleado') return 12;
    if (rol.nombre === 'Cliente') return 2;
    return 0;
  };

  // Filtro de búsqueda
  const filteredRoles = roles.filter((rol) => {
    const search = searchTerm.trim().toLowerCase();
    const modulos = getModulosPorRol(rol);

    const matchNumero = search.match(/\d+/);
    if (matchNumero) {
      return modulos === Number(matchNumero[0]);
    }

    return (
      rol.nombre.toLowerCase().includes(search) ||
      rol.descripcion.toLowerCase().includes(search)
    );
  });

  const handleEdit = (role: Rol) => {
    console.log('Editar rol:', role);
  };

  const handleDelete = (role: Rol) => {
    const confirmDelete = window.confirm(
      `¿Seguro que deseas eliminar el rol "${role.nombre}"?`
    );

    if (!confirmDelete) return;

    setRoles((prev) => prev.filter((r) => r.id !== role.id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Roles</h2>
          <p className="text-gray-600">
            Administra los roles del sistema y sus permisos
          </p>
        </div>

        <button className="px-4 py-2 bg-black text-white rounded-lg flex items-center gap-2">
          <Plus size={18} />
          Nuevo Rol
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            placeholder="Buscar por nombre o cantidad de módulos (ej: 12, 2)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center text-white mb-4">
              <Shield size={24} />
            </div>

            <h3 className="text-gray-900 mb-2">{role.nombre}</h3>
            <p className="text-gray-600 mb-4">{role.descripcion}</p>

            <div className="text-gray-600 mb-4">
              Permisos: {getModulosPorRol(role)} módulos
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                onClick={() => handleEdit(role)}
              >
                Editar
              </button>

              {role.nombre !== 'Administrador' && (
                <button
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => handleDelete(role)}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
