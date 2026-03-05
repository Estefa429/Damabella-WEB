import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Store, Search, History, AlertTriangle, Eye as ViewIcon, Trash2 } from 'lucide-react';
import { Button, Input, Modal } from '../../../shared/components/native';
import {
  getAllProviders,
  createProviders,
  updateProviders,
  deleteProviders,
  searchProviders,
  patchState,
  getAllTypesDocs,
  Providers,
  TypesDocs,
  createProviderDTO,
  updateProviderDTO,
} from '@/features/suppliers/services/providersService';

const COMPRAS_KEY = 'damabella_compras';

export function ProveedoresManager({ onlyModal = false, openOnMount = false }: { onlyModal?: boolean; openOnMount?: boolean }) {
  const [proveedores, setProveedores] = useState<Providers[]>([]);
  const [loading, setLoading] = useState(false);
  const [typesDocs, setTypesDocs] = useState<TypesDocs[]>([]);
  const [loadingTypesDocs, setLoadingTypesDocs] = useState(false);

  const [compras, setCompras] = useState(() => {
    const stored = localStorage.getItem(COMPRAS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [showModal, setShowModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Providers | null>(null);
  const [viewingProveedor, setViewingProveedor] = useState<Providers | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [proveedorToToggle, setProveedorToToggle] = useState<Providers | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showCannotDeleteModal, setShowCannotDeleteModal] = useState(false);
  const [proveedorToDelete, setProveedorToDelete] = useState<Providers | null>(null);

  const [formData, setFormData] = useState({
    number_doc: '',
    type_doc: 1,
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    published: false,
    is_active: true,
  });

  const [formErrors, setFormErrors] = useState<any>({});

  // ─── Carga inicial de proveedores ─────────────────────────────────────────────
  const fetchProveedores = useCallback(async () => {
    setLoading(true);
    const data = await getAllProviders();
    setProveedores(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  // ─── Carga de tipos de documento ──────────────────────────────────────────────
  useEffect(() => {
    const fetchTypesDocs = async () => {
      setLoadingTypesDocs(true);
      const data = await getAllTypesDocs();
      if (data) setTypesDocs(data);
      setLoadingTypesDocs(false);
    };
    fetchTypesDocs();
  }, []);

  useEffect(() => {
    if (typesDocs.length > 0 && !editingProveedor) {
      setFormData(prev => ({ ...prev, type_doc: typesDocs[0].id_doc }));
    }
  }, [typesDocs]);

  // ─── Búsqueda con debounce ────────────────────────────────────────────────────
  useEffect(() => {
    setCurrentPage(1);

    if (!searchTerm.trim()) {
      fetchProveedores();
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const results = await searchProviders({ name: searchTerm });
      if (results && results.length > 0) {
        setProveedores(results);
      } else {
        const byDoc = await searchProviders({ number_doc: searchTerm });
        setProveedores(byDoc ?? []);
      }
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // ─── Recargar compras ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (showHistorialModal) {
      const stored = localStorage.getItem(COMPRAS_KEY);
      if (stored) {
        try { setCompras(JSON.parse(stored)); } catch (e) { console.error(e); }
      }
    }
  }, [showHistorialModal]);

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(COMPRAS_KEY);
      if (stored) setCompras(JSON.parse(stored));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ─── Listener externo para abrir modal ───────────────────────────────────────
  useEffect(() => {
    const handler = () => handleCreate();
    window.addEventListener('proveedor:abrir', handler as EventListener);
    return () => window.removeEventListener('proveedor:abrir', handler as EventListener);
  }, []);

  useEffect(() => {
    if (openOnMount) {
      setEditingProveedor(null);
      setFormData({ number_doc: '', type_doc: 1, name: '', contact_name: '', phone: '', email: '', address: '', published: false, is_active: true });
      setFormErrors({});
      setShowModal(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Validaciones ─────────────────────────────────────────────────────────────
  const validateField = (field: string, value: string) => {
    const errors: any = {};

    if (field === 'name') {
      if (!value.trim()) errors.name = 'Este campo es obligatorio';
      else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s&.,-]+$/.test(value)) errors.name = 'Solo letras, espacios y caracteres & . , -';
    }
    if (field === 'contact_name') {
      if (!value.trim()) errors.contact_name = 'Este campo es obligatorio';
      else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) errors.contact_name = 'Solo se permiten letras y espacios';
    }
    if (field === 'number_doc') {
      if (!value.trim()) errors.number_doc = 'Este campo es obligatorio';
      else if (!/^\d{6,15}$/.test(value)) errors.number_doc = 'Debe tener entre 6 y 15 dígitos';
    }
    if (field === 'phone') {
      if (value && !/^\d{10}$/.test(value)) errors.phone = 'Debe tener exactamente 10 dígitos';
    }
    if (field === 'email') {
      if (value && !/^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) errors.email = 'Email inválido (debe iniciar con letra)';
    }
    return errors;
  };

  const handleFieldChange = (field: string, value: string) => {
    if (field === 'number_doc' || field === 'phone') value = value.replace(/\D/g, '');
    setFormData({ ...formData, [field]: value });
    const fieldErrors = validateField(field, value);
    setFormErrors({ ...formErrors, [field]: fieldErrors[field] });
  };

  // ─── Abrir modal crear ────────────────────────────────────────────────────────
  const handleCreate = () => {
    setEditingProveedor(null);
    setFormData({
      number_doc: '',
      type_doc: typesDocs.length > 0 ? typesDocs[0].id_doc : 0,
      name: '',
      contact_name: '',
      phone: '',
      email: '',
      address: '',
      published: false,
      is_active: true,
    });
    setFormErrors({});
    setShowModal(true);
  };

  // ─── Abrir modal editar ───────────────────────────────────────────────────────
  const handleEdit = (proveedor: Providers) => {
    setEditingProveedor(proveedor);
    setFormData({
      number_doc: proveedor.number_doc || '',
      type_doc: proveedor.type_doc ?? 1,
      name: proveedor.name || '',
      contact_name: proveedor.contact_name || '',
      phone: proveedor.phone || '',
      email: proveedor.email || '',
      address: proveedor.address || '',
      published: proveedor.published || false,
      is_active: proveedor.is_active ?? true,
    });
    setFormErrors({});
    setShowModal(true);
  };

  // ─── Guardar (crear / editar) ─────────────────────────────────────────────────
  const handleSave = async () => {
    const allErrors: any = {};
    ['name', 'contact_name', 'number_doc', 'phone', 'email'].forEach(field => {
      const fieldErrors = validateField(field, (formData as any)[field]);
      if (fieldErrors[field]) allErrors[field] = fieldErrors[field];
    });
    if (Object.keys(allErrors).length > 0) { setFormErrors(allErrors); return; }

    if (editingProveedor) {
      const payload: updateProviderDTO = {
        name: formData.name,
        number_doc: formData.number_doc,
        type_doc: formData.type_doc,
        contact_name: formData.contact_name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        published: formData.published,
        is_active: formData.is_active,
      };
      const updated = await updateProviders(editingProveedor.id_provider, payload);
      if (updated) {
        setProveedores(prev => prev.map(p => p.id_provider === editingProveedor.id_provider ? updated : p));
        window.dispatchEvent(new CustomEvent('proveedor:guardado', { detail: { proveedor: updated } }));
      }
    } else {
      const payload: createProviderDTO = {
        name: formData.name,
        number_doc: formData.number_doc,
        type_doc: formData.type_doc,
        contact_name: formData.contact_name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        published: formData.published,
        is_active: formData.is_active,
      };
      const nuevo = await createProviders(payload);
      if (nuevo) {
        setProveedores(prev => [...prev, nuevo]);
        window.dispatchEvent(new CustomEvent('proveedor:creado', { detail: { proveedor: nuevo } }));
      }
    }
    setShowModal(false);
  };

  // ─── Toggle activo / inactivo ─────────────────────────────────────────────────
  const toggleActive = (id: number) => {
    const proveedor = proveedores.find(p => p.id_provider === id);
    if (!proveedor) return;

    if (!proveedor.is_active) {
      (async () => {
        const result = await patchState(id, true);
        if (result) setProveedores(prev => prev.map(p => p.id_provider === id ? { ...p, is_active: true } : p));
      })();
    } else {
      setProveedorToToggle(proveedor);
      setShowStatusConfirmModal(true);
    }
  };

  const confirmToggleStatus = async () => {
    if (!proveedorToToggle) return;
    const nuevoEstado = !proveedorToToggle.is_active;
    const result = await patchState(proveedorToToggle.id_provider, nuevoEstado);
    if (result) {
      setProveedores(prev => prev.map(p => p.id_provider === proveedorToToggle.id_provider ? { ...p, is_active: nuevoEstado } : p));
    }
    setShowStatusConfirmModal(false);
    setProveedorToToggle(null);
  };

  // ─── Eliminar proveedor ───────────────────────────────────────────────────────
  const handleDeleteProveedor = (id: number) => {
    try {
      const proveedor = proveedores.find(p => p.id_provider === id);
      if (!proveedor) return;

      const stored = localStorage.getItem(COMPRAS_KEY);
      const comprasFromStorage = stored ? JSON.parse(stored) : [];
      const hasCompras = comprasFromStorage.some((c: any) =>
        c.proveedorId === id || c.proveedorId === String(id) ||
        (c.proveedor && (c.proveedor.id === id || String(c.proveedor.id) === String(id)))
      );

      if (hasCompras) {
        setProveedorToDelete(proveedor);
        setShowCannotDeleteModal(true);
        return;
      }

      setProveedorToDelete(proveedor);
      setShowDeleteConfirmModal(true);
    } catch (e) {
      console.error('Error al intentar eliminar proveedor:', e);
      setProveedorToDelete(null);
      setShowCannotDeleteModal(true);
    }
  };

  const confirmDeleteProveedor = async () => {
    if (!proveedorToDelete) return;

    const idAEliminar = proveedorToDelete.id_provider;

    setShowDeleteConfirmModal(false);
    setProveedorToDelete(null);

    setProveedores(prev => prev.filter(p => p.id_provider !== idAEliminar));

    const success = await deleteProviders(idAEliminar);
    if (!success) {
      await fetchProveedores();
    }
  };

  // ─── Historial / Ver ──────────────────────────────────────────────────────────
  const handleVerHistorial = (proveedor: Providers) => {
    setViewingProveedor(proveedor);
    setShowHistorialModal(true);
  };

  const handleVerProveedor = (proveedor: Providers) => {
    setViewingProveedor(proveedor);
    setShowViewModal(true);
  };

  // ─── Helpers compras ──────────────────────────────────────────────────────────
  const getComprasProveedor = (proveedorId: number) => {
    if (!compras || !Array.isArray(compras)) return [];
    return compras
      .filter((c: any) => c.proveedorId === proveedorId || c.proveedorId === String(proveedorId))
      .sort((a: any, b: any) => {
        const fechaA = new Date(a.fechaCompra || a.fechaRegistro || 0).getTime();
        const fechaB = new Date(b.fechaCompra || b.fechaRegistro || 0).getTime();
        return fechaB - fechaA;
      });
  };

  const getTotalComprasProveedor = (proveedorId: number) =>
    getComprasProveedor(proveedorId).reduce((sum: number, c: any) => sum + (c.total || 0), 0);

  const getCantidadProductosProveedor = (proveedorId: number) =>
    getComprasProveedor(proveedorId).reduce((sum: number, c: any) =>
      sum + (c.items || []).reduce((itemSum: number, item: any) => itemSum + (item.cantidad || 0), 0), 0);

  const formatearCOP = (valor: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(valor);

  // ─── Paginación ───────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(proveedores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProveedores = proveedores.slice(startIndex, startIndex + itemsPerPage);

  const tipoDocLabel = (type_doc: number) => {
    const found = typesDocs.find(t => t.id_doc === type_doc);
    return found ? found.name : String(type_doc);
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER onlyModal
  // ═══════════════════════════════════════════════════════════════════════════════
  if (onlyModal) {
    return (
      <>
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Tipo de Documento *</label>
                <select
                  value={formData.type_doc}
                  onChange={(e) => setFormData({ ...formData, type_doc: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={loadingTypesDocs}
                  required
                >
                  {loadingTypesDocs ? (
                    <option value="">Cargando...</option>
                  ) : (
                    typesDocs.map(t => (
                      <option key={t.id_doc} value={t.id_doc}>{t.name}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Número de Documento *</label>
                <Input value={formData.number_doc} onChange={(e) => handleFieldChange('number_doc', e.target.value)} placeholder="900123456" maxLength={15} required />
                {formErrors.number_doc && <p className="text-red-600 text-xs mt-1">{formErrors.number_doc}</p>}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Nombre del Proveedor *</label>
              <Input value={formData.name} onChange={(e) => handleFieldChange('name', e.target.value)} placeholder="Distribuidora XYZ" required />
              {formErrors.name && <p className="text-red-600 text-xs mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Persona de Contacto *</label>
              <Input value={formData.contact_name} onChange={(e) => handleFieldChange('contact_name', e.target.value)} placeholder="Nombre del contacto" required />
              {formErrors.contact_name && <p className="text-red-600 text-xs mt-1">{formErrors.contact_name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Teléfono</label>
                <Input value={formData.phone} onChange={(e) => handleFieldChange('phone', e.target.value)} placeholder="3001234567" maxLength={10} />
                {formErrors.phone && <p className="text-red-600 text-xs mt-1">{formErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Email</label>
                <Input type="email" value={formData.email} onChange={(e) => handleFieldChange('email', e.target.value)} placeholder="proveedor@ejemplo.com" />
                {formErrors.email && <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Dirección</label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Calle 123 # 45-67" />
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button onClick={() => setShowModal(false)} variant="secondary">Cancelar</Button>
              <Button onClick={handleSave} variant="primary">{editingProveedor ? 'Guardar Cambios' : 'Crear Proveedor'}</Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER COMPLETO
  // ═══════════════════════════════════════════════════════════════════════════════
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
          Nuevo Proveedor
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">Cargando proveedores...</td>
                </tr>
              ) : paginatedProveedores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <Store className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron proveedores</p>
                  </td>
                </tr>
              ) : (
                paginatedProveedores.map((proveedor) => (
                  <tr key={proveedor.id_provider} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white">
                          {proveedor.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-gray-900">{proveedor.name}</div>
                          <div className="text-gray-500 text-sm">{proveedor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="text-gray-700">{proveedor.contact_name || '-'}</div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="text-gray-700">{tipoDocLabel(proveedor.type_doc)}</div>
                      <div className="text-gray-500">{proveedor.number_doc}</div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="text-gray-700">{proveedor.phone || '-'}</div>
                      <div className="text-gray-500 text-sm">{proveedor.address || '-'}</div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex justify-center">
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => toggleActive(proveedor.id_provider)}
                          aria-pressed={proveedor.is_active}
                          title={proveedor.is_active ? 'Inactivar proveedor' : 'Activar proveedor'}
                          className={`relative w-12 h-6 rounded-full transition-colors ${proveedor.is_active ? 'bg-green-500' : 'bg-gray-400'}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${proveedor.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleVerProveedor(proveedor)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          title="Ver proveedor"
                        >
                          <ViewIcon size={18} />
                        </button>
                        <button onClick={() => handleVerHistorial(proveedor)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" title="Ver historial">
                          <History size={18} />
                        </button>
                        <button onClick={() => handleEdit(proveedor)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" title="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteProveedor(proveedor.id_provider)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600" title="Eliminar">
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

      {/* Pagination */}
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
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const startPage = Math.max(1, currentPage - 2);
              const page = startPage + i;
              if (page > totalPages) return null;
              return (
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
              );
            })}
          </div>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
          <span className="ml-4 text-sm text-gray-600">Página {currentPage} de {totalPages}</span>
        </div>
      )}

      {/* Modal Create/Edit */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Tipo de Documento *</label>
              <select
                value={formData.type_doc}
                onChange={(e) => setFormData({ ...formData, type_doc: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={loadingTypesDocs}
                required
              >
                {loadingTypesDocs ? (
                  <option value="">Cargando...</option>
                ) : (
                  typesDocs.map(t => (
                    <option key={t.id_doc} value={t.id_doc}>{t.name}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Número de Documento *</label>
              <Input value={formData.number_doc} onChange={(e) => handleFieldChange('number_doc', e.target.value)} placeholder="900123456" maxLength={15} required />
              {formErrors.number_doc && <p className="text-red-600 text-xs mt-1">{formErrors.number_doc}</p>}
            </div>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Nombre del Proveedor *</label>
            <Input value={formData.name} onChange={(e) => handleFieldChange('name', e.target.value)} placeholder="Distribuidora XYZ" required />
            {formErrors.name && <p className="text-red-600 text-xs mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Persona de Contacto *</label>
            <Input value={formData.contact_name} onChange={(e) => handleFieldChange('contact_name', e.target.value)} placeholder="Nombre del contacto" required />
            {formErrors.contact_name && <p className="text-red-600 text-xs mt-1">{formErrors.contact_name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Teléfono</label>
              <Input value={formData.phone} onChange={(e) => handleFieldChange('phone', e.target.value)} placeholder="3001234567" maxLength={10} />
              {formErrors.phone && <p className="text-red-600 text-xs mt-1">{formErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Email</label>
              <Input type="email" value={formData.email} onChange={(e) => handleFieldChange('email', e.target.value)} placeholder="proveedor@ejemplo.com" />
              {formErrors.email && <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>}
            </div>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Dirección</label>
            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Calle 123 # 45-67" />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={() => setShowModal(false)} variant="secondary">Cancelar</Button>
            <Button onClick={handleSave} variant="primary">{editingProveedor ? 'Guardar Cambios' : 'Crear Proveedor'}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Historial de Compras */}
      <Modal isOpen={showHistorialModal} onClose={() => setShowHistorialModal(false)} title={`Historial de Compras – ${viewingProveedor?.name}`}>
        <div className="space-y-6">
          {viewingProveedor && (
            <>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-blue-600 text-sm font-medium mb-1">Total Compras</div>
                    <div className="text-3xl font-bold text-blue-900">{getComprasProveedor(viewingProveedor.id_provider).length}</div>
                  </div>
                  <div>
                    <div className="text-blue-600 text-sm font-medium mb-1">Productos Recibidos</div>
                    <div className="text-3xl font-bold text-blue-900">{getCantidadProductosProveedor(viewingProveedor.id_provider)}</div>
                  </div>
                  <div>
                    <div className="text-blue-600 text-sm font-medium mb-1">Monto Acumulado</div>
                    <div className="text-2xl font-bold text-green-600">{formatearCOP(getTotalComprasProveedor(viewingProveedor.id_provider))}</div>
                  </div>
                </div>
              </div>
              {getComprasProveedor(viewingProveedor.id_provider).length === 0 ? (
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
                      {getComprasProveedor(viewingProveedor.id_provider).map((compra: any) => (
                        <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-gray-900">{new Date(compra.fechaCompra || compra.fechaRegistro).toLocaleDateString('es-CO')}</td>
                          <td className="py-3 px-4 text-gray-900 font-medium">{compra.numeroCompra}</td>
                          <td className="py-3 px-4 text-center text-gray-700">{(compra.items || []).reduce((sum: number, item: any) => sum + (item.cantidad || 0), 0)}</td>
                          <td className="py-3 px-4 text-right text-gray-900">{formatearCOP(compra.subtotal || 0)}</td>
                          <td className="py-3 px-4 text-right text-gray-900">{formatearCOP(compra.iva || 0)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatearCOP(compra.total || 0)}</td>
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
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={`Ver Proveedor - ${viewingProveedor?.name}`}>
        <div className="space-y-4">
          {viewingProveedor && (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-600 text-sm mb-1">Nombre</div>
                    <div className="text-gray-900 font-semibold">{viewingProveedor.name}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-sm mb-1">Documento</div>
                    <div className="text-gray-900 font-semibold">{tipoDocLabel(viewingProveedor.type_doc)}: {viewingProveedor.number_doc}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-sm mb-1">Contacto</div>
                    <div className="text-gray-900">{viewingProveedor.contact_name}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-sm mb-1">Teléfono</div>
                    <div className="text-gray-900">{viewingProveedor.phone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-sm mb-1">Email</div>
                    <div className="text-gray-900">{viewingProveedor.email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-sm mb-1">Dirección</div>
                    <div className="text-gray-900">{viewingProveedor.address || '-'}</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-gray-600 text-sm mb-1">Estado</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${viewingProveedor.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-gray-900 font-semibold">{viewingProveedor.is_active ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="text-gray-600 text-sm mb-1">Fecha de Creación</div>
                <div className="text-gray-900">{new Date(viewingProveedor.created_at).toLocaleDateString('es-ES')}</div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button onClick={() => setShowViewModal(false)} variant="primary">Cerrar</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal Confirmation - Change Status */}
      <Modal
        isOpen={showStatusConfirmModal}
        onClose={() => { setShowStatusConfirmModal(false); setProveedorToToggle(null); }}
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
            ¿Está seguro de que desea <strong>{proveedorToToggle?.is_active ? 'inactivar' : 'activar'}</strong> el proveedor <strong>{proveedorToToggle?.name}</strong>?
          </p>
          {proveedorToToggle?.is_active && (
            <p className="text-gray-600 text-sm">Al inactivar este proveedor, no podrá realizar nuevas compras hasta que sea reactivado.</p>
          )}
          <div className="flex gap-3 justify-end pt-4">
            <Button onClick={() => { setShowStatusConfirmModal(false); setProveedorToToggle(null); }} variant="secondary">Cancelar</Button>
            <Button onClick={confirmToggleStatus} variant="primary">{proveedorToToggle?.is_active ? 'Inactivar' : 'Activar'}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: No se puede eliminar */}
      <Modal
        isOpen={showCannotDeleteModal}
        onClose={() => { setShowCannotDeleteModal(false); setProveedorToDelete(null); }}
        title="No se puede eliminar"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <p className="text-yellow-800 font-semibold">Operación no permitida</p>
              <p className="text-yellow-700 text-sm">El proveedor <strong>{proveedorToDelete?.name}</strong> tiene compras asociadas y no puede ser eliminado. Puedes inactivarlo desde el estado.</p>
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
          <p className="text-gray-700">¿Estás seguro de que deseas eliminar al proveedor <strong>{proveedorToDelete?.name}</strong>? Esta acción no se puede deshacer.</p>
          <div className="flex gap-3 justify-end pt-4">
            <Button onClick={() => { setShowDeleteConfirmModal(false); setProveedorToDelete(null); }} variant="secondary">Cancelar</Button>
            <Button onClick={confirmDeleteProveedor} variant="primary" className="bg-red-600 hover:bg-red-700">Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
