import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Store, Search, Eye, History, AlertTriangle, Eye as ViewIcon, Trash2 } from 'lucide-react';
import { Button, Input, Modal } from '../../../shared/components/native';

const STORAGE_KEY = 'damabella_proveedores';
const COMPRAS_KEY = 'damabella_compras';

interface Proveedor {
  id: number;
  nombre: string;
  contacto: string;
  tipoDoc: string;
  numeroDoc: string;
  telefono: string;
  email: string;
  direccion: string;
  activo: boolean;
  publicado?: boolean;
  createdAt: string;
}

export function ProveedoresManager({ onlyModal = false, openOnMount = false }: { onlyModal?: boolean; openOnMount?: boolean }) {
  const [proveedores, setProveedores] = useState<Proveedor[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [compras, setCompras] = useState(() => {
    const stored = localStorage.getItem(COMPRAS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [showModal, setShowModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [viewingProveedor, setViewingProveedor] = useState<Proveedor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [proveedorToToggle, setProveedorToToggle] = useState<Proveedor | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showCannotDeleteModal, setShowCannotDeleteModal] = useState(false);
  const [proveedorToDelete, setProveedorToDelete] = useState<Proveedor | null>(null);
  
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    numeroDoc: '',
    tipoDoc: 'NIT',
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    publicado: false
  });

  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proveedores));
  }, [proveedores]);

  // Recargar compras cuando se abre el modal de historial
  useEffect(() => {
    if (showHistorialModal) {
      const stored = localStorage.getItem(COMPRAS_KEY);
      if (stored) {
        try {
          setCompras(JSON.parse(stored));
        } catch (error) {
          console.error('Error al cargar compras:', error);
        }
      }
    }
  }, [showHistorialModal]);

  // Recargar compras cuando cambian en otro contexto (cross-tab)
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(COMPRAS_KEY);
      if (stored) setCompras(JSON.parse(stored));
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Limpieza del listener 'proveedor:abrir' cuando el componente se desmonte
  useEffect(() => {
    const handler = (e: any) => handleCreate();
    window.addEventListener('proveedor:abrir', handler as EventListener);
    return () => window.removeEventListener('proveedor:abrir', handler as EventListener);
  }, []);

  // Si se monta con openOnMount, abrir el modal de creación inmediatamente
  useEffect(() => {
    if (openOnMount) {
      setEditingProveedor(null);
      setFormData({
        numeroDoc: '',
        tipoDoc: 'NIT',
        nombre: '',
        contacto: '',
        telefono: '',
        email: '',
        direccion: '',
        publicado: false
      });
      setFormErrors({});
      setShowModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openOnMount]);

  const validateField = (field: string, value: string) => {
    const errors: any = {};
    
    if (field === 'nombre') {
      if (!value.trim()) {
        errors.nombre = 'Este campo es obligatorio';
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s&.,-]+$/.test(value)) {
        errors.nombre = 'Solo letras, espacios y caracteres & . , -';
      }
    }

    if (field === 'contacto') {
      if (!value.trim()) {
        errors.contacto = 'Este campo es obligatorio';
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        errors.contacto = 'Solo se permiten letras y espacios';
      }
    }
    
    if (field === 'numeroDoc') {
      if (!value.trim()) {
        errors.numeroDoc = 'Este campo es obligatorio';
      } else if (!/^\d{6,15}$/.test(value)) {
        errors.numeroDoc = 'Debe tener entre 6 y 15 dígitos';
      }
    }
    
    if (field === 'telefono') {
      if (value && !/^\d{10}$/.test(value)) {
        errors.telefono = 'Debe tener exactamente 10 dígitos';
      }
    }
    
    if (field === 'email') {
      if (value && !/^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        errors.email = 'Email inválido (debe iniciar con letra)';
      }
    }
    
    return errors;
  };

  const handleFieldChange = (field: string, value: string) => {
    // Solo permitir números en el campo de documento
    if (field === 'numeroDoc') {
      value = value.replace(/\D/g, '');
    }
    // Solo permitir números en teléfono
    if (field === 'telefono') {
      value = value.replace(/\D/g, '');
    }
    
    setFormData({ ...formData, [field]: value });
    const fieldErrors = validateField(field, value);
    setFormErrors({ ...formErrors, [field]: fieldErrors[field] });
  };

  const handleCreate = () => {
    setEditingProveedor(null);
    setFormData({
      numeroDoc: '',
      tipoDoc: 'NIT',
      nombre: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      publicado: false
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEdit = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor);
    setFormData({
      numeroDoc: proveedor.numeroDoc || '',
      tipoDoc: proveedor.tipoDoc || 'NIT',
      nombre: proveedor.nombre || '',
      contacto: proveedor.contacto || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      direccion: proveedor.direccion || '',
      publicado: proveedor.publicado || false
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = () => {
    // Validar todos los campos
    const allErrors: any = {};
    ['nombre', 'contacto', 'numeroDoc', 'telefono', 'email'].forEach(field => {
      const fieldErrors = validateField(field, (formData as any)[field]);
      if (fieldErrors[field]) {
        allErrors[field] = fieldErrors[field];
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    // Verificar duplicados de documento
    if (!editingProveedor) {
      if (proveedores.find((p: any) => p.numeroDoc === formData.numeroDoc)) {
        setFormErrors({ ...formErrors, numeroDoc: 'Ya existe un proveedor con este documento' });
        return;
      }
      // Verificar duplicado de email
      if (formData.email && proveedores.find((p: any) => (p.email?.toLowerCase() ?? '') === (formData.email?.toLowerCase() ?? ''))) {
        setFormErrors({ ...formErrors, email: 'Ya existe un proveedor con este email' });
        return;
      }
    } else {
      if (proveedores.find((p: any) => p.numeroDoc === formData.numeroDoc && p.id !== editingProveedor.id)) {
        setFormErrors({ ...formErrors, numeroDoc: 'Ya existe un proveedor con este documento' });
        return;
      }
      // Verificar duplicado de email al editar
      if (formData.email && proveedores.find((p: any) => (p.email?.toLowerCase() ?? '') === (formData.email?.toLowerCase() ?? '') && p.id !== editingProveedor.id)) {
        setFormErrors({ ...formErrors, email: 'Ya existe un proveedor con este email' });
        return;
      }
    }

    const proveedorData = {
      ...formData,
      activo: editingProveedor?.activo ?? true,
      createdAt: editingProveedor?.createdAt ?? new Date().toISOString()
    };

    if (editingProveedor) {
      const updated = proveedores.map(p => 
        p.id === editingProveedor.id ? { ...p, ...proveedorData } : p
      );
      setProveedores(updated);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (e) { console.warn('No se pudo escribir proveedores en localStorage', e); }
      // Emitir evento para notificar edición (opcional)
      window.dispatchEvent(new CustomEvent('proveedor:guardado', { detail: { proveedor: proveedorData } }));
    } else {
      const nuevo = { id: Date.now(), ...proveedorData };
      const nuevoArray = [...proveedores, nuevo];
      setProveedores(nuevoArray);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevoArray)); } catch (e) { console.warn('No se pudo escribir proveedores en localStorage', e); }
      // Emitir evento para notificar creación de proveedor y pasar el proveedor creado
      window.dispatchEvent(new CustomEvent('proveedor:creado', { detail: { proveedor: nuevo } }));
    }

    setShowModal(false);
  };

  const toggleActive = (id: number) => {
    const proveedor = proveedores.find(p => p.id === id);
    if (proveedor) {
      // Si está inactivo -> activar inmediatamente (consistente con Roles)
      if (proveedor.activo === false) {
        const updated = proveedores.map(p => p.id === id ? { ...p, activo: true } : p);
        setProveedores(updated);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (e) { console.warn('No se pudo escribir proveedores en localStorage', e); }
      } else {
        // Si está activo -> pedir confirmación para inactivar
        setProveedorToToggle(proveedor);
        setShowStatusConfirmModal(true);
      }
    }
  };

  // Eliminar proveedor (validación contra compras asociadas)
  const handleDeleteProveedor = (id: number) => {
    try {
      const proveedor = proveedores.find(p => p.id === id);
      if (!proveedor) return;

      // Leer compras desde localStorage (fuente de verdad)
      const stored = localStorage.getItem(COMPRAS_KEY);
      const comprasFromStorage = stored ? JSON.parse(stored) : [];

      // Verificar si existen compras asociadas (comparar proveedorId)
      const hasCompras = comprasFromStorage.some((c: any) => {
        return c.proveedorId === id || c.proveedorId === String(id) || (c.proveedor && (c.proveedor.id === id || String(c.proveedor.id) === String(id)));
      });

      // Abrir modal informativo si tiene compras asociadas
      if (hasCompras) {
        setProveedorToDelete(proveedor);
        setShowCannotDeleteModal(true);
        return;
      }

      // Abrir modal de confirmación para eliminar
      setProveedorToDelete(proveedor);
      setShowDeleteConfirmModal(true);
    } catch (e) {
      console.error('Error al intentar eliminar proveedor:', e);
      setProveedorToDelete(null);
      setShowCannotDeleteModal(true);
    }
  };

  const confirmDeleteProveedor = () => {
    if (!proveedorToDelete) return;
    try {
      const updated = proveedores.filter(p => p.id !== proveedorToDelete.id);
      setProveedores(updated);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (e) { console.warn('No se pudo actualizar proveedores en localStorage', e); }
    } catch (e) {
      console.error('Error al eliminar proveedor:', e);
    }
    setShowDeleteConfirmModal(false);
    setProveedorToDelete(null);
  };

  const confirmToggleStatus = () => {
    if (proveedorToToggle) {
      setProveedores(proveedores.map(p =>
        p.id === proveedorToToggle.id ? { ...p, activo: !p.activo } : p
      ));
    }
    setShowStatusConfirmModal(false);
    setProveedorToToggle(null);
  };

  const handleVerHistorial = (proveedor: Proveedor) => {
    setViewingProveedor(proveedor);
    setShowHistorialModal(true);
  };

  const handleVerProveedor = (proveedor: Proveedor) => {
    setViewingProveedor(proveedor);
    setShowViewModal(true);
  };

  // 📊 Helper: Obtener compras de un proveedor específico
  const getComprasProveedor = (proveedorId: number) => {
    if (!compras || !Array.isArray(compras)) return [];
    const comprasFiltered = compras.filter((c: any) => {
      // Comparar como número y string para flexibilidad
      return c.proveedorId === proveedorId || c.proveedorId === String(proveedorId);
    });
    // Ordenar por fecha descendente (más reciente primero)
    return comprasFiltered.sort((a: any, b: any) => {
      const fechaA = new Date(a.fechaCompra || a.fechaRegistro || 0).getTime();
      const fechaB = new Date(b.fechaCompra || b.fechaRegistro || 0).getTime();
      return fechaB - fechaA;
    });
  };

  // 💰 Helper: Calcular total de monto de compras de un proveedor
  const getTotalComprasProveedor = (proveedorId: number) => {
    return getComprasProveedor(proveedorId).reduce((sum: number, c: any) => {
      return sum + (c.total || 0);
    }, 0);
  };

  // 📦 Helper: Contar cantidad total de productos en compras
  const getCantidadProductosProveedor = (proveedorId: number) => {
    return getComprasProveedor(proveedorId).reduce((sum: number, c: any) => {
      const cantidadCompra = (c.items || []).reduce((itemSum: number, item: any) => {
        return itemSum + (item.cantidad || 0);
      }, 0);
      return sum + cantidadCompra;
    }, 0);
  };

  // 🎨 Helper: Formatear valor en COP
  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  const filteredProveedores = proveedores.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (p.nombre?.toLowerCase() ?? '').includes(searchLower) ||
      (p.numeroDoc ?? '').includes(searchTerm) ||
      (p.email?.toLowerCase() ?? '').includes(searchLower) ||
      ((p.activo ? 'activo' : 'inactivo').includes(searchLower))
    );
  });

  // Aplicar paginación
  const totalPages = Math.ceil(filteredProveedores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProveedores = filteredProveedores.slice(startIndex, startIndex + itemsPerPage);

  // Resetear página si el término de búsqueda cambia
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (onlyModal) {
    return (
      <>
        {/* Modal Create/Edit (solo modal, sin el resto del UI) */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Tipo de Documento *</label>
                <select
                  value={formData.tipoDoc}
                  onChange={(e) => setFormData({ ...formData, tipoDoc: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  required
                >
                  <option value="NIT">NIT</option>
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Número de Documento *</label>
                <Input
                  value={formData.numeroDoc}
                  onChange={(e) => handleFieldChange('numeroDoc', e.target.value)}
                  placeholder="900123456"
                  maxLength={15}
                  required
                />
                {formErrors.numeroDoc && (
                  <p className="text-red-600 text-xs mt-1">{formErrors.numeroDoc}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Nombre del Proveedor *</label>
              <Input
                value={formData.nombre}
                onChange={(e) => handleFieldChange('nombre', e.target.value)}
                placeholder="Distribuidora XYZ"
                required
              />
              {formErrors.nombre && (
                <p className="text-red-600 text-xs mt-1">{formErrors.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Persona de Contacto *</label>
              <Input
                value={formData.contacto}
                onChange={(e) => handleFieldChange('contacto', e.target.value)}
                placeholder="Nombre del contacto"
                required
              />
              {formErrors.contacto && (
                <p className="text-red-600 text-xs mt-1">{formErrors.contacto}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Teléfono</label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => handleFieldChange('telefono', e.target.value)}
                  placeholder="3001234567"
                  maxLength={10}
                />
                {formErrors.telefono && (
                  <p className="text-red-600 text-xs mt-1">{formErrors.telefono}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder="proveedor@ejemplo.com"
                />
                {formErrors.email && (
                  <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Dirección</label>
              <Input
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Calle 123 # 45-67"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button onClick={() => setShowModal(false)} variant="secondary">
                Cancelar
              </Button>
              <Button onClick={handleSave} variant="primary">
                {editingProveedor ? 'Guardar Cambios' : 'Crear Proveedor'}
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-gray-900 mb-1">Gestión de Proveedores</h2>
              <p className="text-gray-600">Administra los proveedores y su información de contacto</p>
            </div>
            <Button onClick={handleCreate} variant="primary">
              <Plus size={20} />
              Agregar Proveedor
            </Button>
          </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Proveedores List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-gray-600">Proveedor</th>
                <th className="text-left py-4 px-6 text-gray-600">Contacto</th>
                <th className="text-left py-4 px-6 text-gray-600">Documento</th>
                <th className="text-left py-4 px-6 text-gray-600">Teléfono</th>
                <th className="text-center py-4 px-6 text-gray-600">Estado</th>
                <th className="text-right py-4 px-6 text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedProveedores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <Store className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron proveedores</p>
                  </td>
                </tr>
              ) : (
                paginatedProveedores.map((proveedor) => (
                  <tr key={proveedor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white">
                          {proveedor.nombre[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-gray-900">{proveedor.nombre}</div>
                          <div className="text-gray-500 text-sm">{proveedor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="text-gray-700">{proveedor.contacto || '-'}</div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="text-gray-700">{proveedor.tipoDoc}</div>
                      <div className="text-gray-500">{proveedor.numeroDoc}</div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="text-gray-700">{proveedor.telefono || '-'}</div>
                      <div className="text-gray-500 text-sm">{proveedor.direccion || '-'}</div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex justify-center">
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => toggleActive(proveedor.id)}
                          aria-pressed={proveedor.activo !== false}
                          title={proveedor.activo === false ? 'Activar proveedor' : 'Inactivar proveedor'}
                          className={`relative w-12 h-6 rounded-full transition-colors ${proveedor.activo !== false ? 'bg-green-500' : 'bg-gray-400'}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${proveedor.activo !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleVerProveedor(proveedor)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Ver proveedor"
                        >
                          <ViewIcon size={18} />
                        </button>
                        <button
                          onClick={() => handleVerHistorial(proveedor)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Ver historial"
                        >
                          <History size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(proveedor)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteProveedor(proveedor.id)}
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
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>

          <span className="ml-4 text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
        </div>
      )}

      {/* Modal Create/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Tipo de Documento *</label>
              <select
                value={formData.tipoDoc}
                onChange={(e) => setFormData({ ...formData, tipoDoc: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              >
                <option value="NIT">NIT</option>
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Número de Documento *</label>
              <Input
                value={formData.numeroDoc}
                onChange={(e) => handleFieldChange('numeroDoc', e.target.value)}
                placeholder="900123456"
                maxLength={15}
                required
              />
              {formErrors.numeroDoc && (
                <p className="text-red-600 text-xs mt-1">{formErrors.numeroDoc}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Nombre del Proveedor *</label>
            <Input
              value={formData.nombre}
              onChange={(e) => handleFieldChange('nombre', e.target.value)}
              placeholder="Distribuidora XYZ"
              required
            />
            {formErrors.nombre && (
              <p className="text-red-600 text-xs mt-1">{formErrors.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Persona de Contacto *</label>
            <Input
              value={formData.contacto}
              onChange={(e) => handleFieldChange('contacto', e.target.value)}
              placeholder="Nombre del contacto"
              required
            />
            {formErrors.contacto && (
              <p className="text-red-600 text-xs mt-1">{formErrors.contacto}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Teléfono</label>
              <Input
                value={formData.telefono}
                onChange={(e) => handleFieldChange('telefono', e.target.value)}
                placeholder="3001234567"
                maxLength={10}
              />
              {formErrors.telefono && (
                <p className="text-red-600 text-xs mt-1">{formErrors.telefono}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="proveedor@ejemplo.com"
              />
              {formErrors.email && (
                <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Dirección</label>
            <Input
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Calle 123 # 45-67"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={() => setShowModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="primary">
              {editingProveedor ? 'Guardar Cambios' : 'Crear Proveedor'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Historial de Compras */}
      <Modal
        isOpen={showHistorialModal}
        onClose={() => setShowHistorialModal(false)}
        title={`Historial de Compras – ${viewingProveedor?.nombre}`}
      >
        <div className="space-y-6">
          {viewingProveedor && (
            <>
              {/* Resumen de Totales */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-blue-600 text-sm font-medium mb-1">Total Compras</div>
                    <div className="text-3xl font-bold text-blue-900">
                      {getComprasProveedor(viewingProveedor.id).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-600 text-sm font-medium mb-1">Productos Recibidos</div>
                    <div className="text-3xl font-bold text-blue-900">
                      {getCantidadProductosProveedor(viewingProveedor.id)}
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-600 text-sm font-medium mb-1">Monto Acumulado</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatearCOP(getTotalComprasProveedor(viewingProveedor.id))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Compras */}
              {getComprasProveedor(viewingProveedor.id).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Store className="mx-auto mb-4 text-gray-300" size={48} />
                  <p className="text-lg font-medium">Este proveedor aún no tiene compras registradas.</p>
                  <p className="text-sm mt-2">Las compras aparecerán aquí cuando se registren en el módulo de Compras.</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 text-gray-700 font-semibold">Fecha</th>
                        <th className="text-left py-3 px-4 text-gray-700 font-semibold">N° Compra</th>
                        <th className="text-center py-3 px-4 text-gray-700 font-semibold">Cantidad</th>
                        <th className="text-right py-3 px-4 text-gray-700 font-semibold">Subtotal</th>
                        <th className="text-right py-3 px-4 text-gray-700 font-semibold">IVA</th>
                        <th className="text-right py-3 px-4 text-gray-700 font-semibold">Total</th>
                        <th className="text-center py-3 px-4 text-gray-700 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {getComprasProveedor(viewingProveedor.id).map((compra: any) => (
                        <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-gray-900">
                            {new Date(compra.fechaCompra || compra.fechaRegistro).toLocaleDateString('es-CO')}
                          </td>
                          <td className="py-3 px-4 text-gray-900 font-medium">{compra.numeroCompra}</td>
                          <td className="py-3 px-4 text-center text-gray-700">
                            {(compra.items || []).reduce((sum: number, item: any) => sum + (item.cantidad || 0), 0)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900">
                            {formatearCOP(compra.subtotal || 0)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900">
                            {formatearCOP(compra.iva || 0)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">
                            {formatearCOP(compra.total || 0)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              compra.estado === 'Recibida' ? 'bg-green-100 text-green-700' :
                              compra.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
                              compra.estado === 'Anulada' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {compra.estado || 'Confirmada'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Modal Ver Proveedor */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={`Ver Proveedor - ${viewingProveedor?.nombre}`}
      >
        <div className="space-y-4">
          {viewingProveedor && (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-600 text-sm mb-1">Nombre</div>
                    <div className="text-gray-900 font-semibold">{viewingProveedor.nombre}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-sm mb-1">Documento</div>
                    <div className="text-gray-900 font-semibold">{viewingProveedor.tipoDoc}: {viewingProveedor.numeroDoc}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-sm mb-1">Contacto</div>
                    <div className="text-gray-900">{viewingProveedor.contacto}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-sm mb-1">Teléfono</div>
                    <div className="text-gray-900">{viewingProveedor.telefono || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-sm mb-1">Email</div>
                    <div className="text-gray-900">{viewingProveedor.email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-sm mb-1">Dirección</div>
                    <div className="text-gray-900">{viewingProveedor.direccion || '-'}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-gray-600 text-sm mb-1">Estado</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${viewingProveedor.activo ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-gray-900 font-semibold">
                      {viewingProveedor.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 rounded-lg p-3">
                <div className="text-gray-600 text-sm mb-1">Fecha de Creación</div>
                <div className="text-gray-900">
                  {new Date(viewingProveedor.createdAt).toLocaleDateString('es-ES')}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button onClick={() => setShowViewModal(false)} variant="primary">
                  Cerrar
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal Confirmation - Change Status */}
      <Modal
        isOpen={showStatusConfirmModal}
        onClose={() => {
          setShowStatusConfirmModal(false);
          setProveedorToToggle(null);
        }}
        title="Confirmar Cambio de Estado"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <p className="text-yellow-800 font-semibold">Cambio de estado</p>
              <p className="text-yellow-700 text-sm">Esta acción modificará el estado del proveedor</p>
            </div>
          </div>
          <p className="text-gray-700">
            ¿Está seguro de que desea <strong>{proveedorToToggle?.activo ? 'inactivar' : 'activar'}</strong> el proveedor <strong>{proveedorToToggle?.nombre}</strong>?
          </p>
          {proveedorToToggle?.activo && (
            <p className="text-gray-600 text-sm">
              Al inactivar este proveedor, no podrá realizar nuevas compras hasta que sea reactivado.
            </p>
          )}
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              onClick={() => {
                setShowStatusConfirmModal(false);
                setProveedorToToggle(null);
              }} 
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button onClick={confirmToggleStatus} variant="primary">
              {proveedorToToggle?.activo ? 'Inactivar' : 'Activar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: No se puede eliminar (tiene compras asociadas) */}
      <Modal
        isOpen={showCannotDeleteModal}
        onClose={() => {
          setShowCannotDeleteModal(false);
          setProveedorToDelete(null);
        }}
        title="No se puede eliminar"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <p className="text-yellow-800 font-semibold">Operación no permitida</p>
              <p className="text-yellow-700 text-sm">El proveedor <strong>{proveedorToDelete?.nombre}</strong> tiene compras asociadas y no puede ser eliminado. Puedes inactivarlo desde el estado.</p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => { setShowCannotDeleteModal(false); setProveedorToDelete(null); }} variant="primary">Aceptar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar eliminación */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={() => { setShowDeleteConfirmModal(false); setProveedorToDelete(null); }}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <p className="text-gray-700">¿Estás seguro de que deseas eliminar al proveedor <strong>{proveedorToDelete?.nombre}</strong>? Esta acción no se puede deshacer.</p>
          <div className="flex gap-3 justify-end pt-4">
            <Button onClick={() => { setShowDeleteConfirmModal(false); setProveedorToDelete(null); }} variant="secondary">Cancelar</Button>
            <Button onClick={confirmDeleteProveedor} variant="primary" className="bg-red-600 hover:bg-red-700">Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
