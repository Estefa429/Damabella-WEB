import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit2, Eye, Search, Phone, Mail, Trash2, Users, Loader } from 'lucide-react';
import { Button, Input, Modal } from '../../../../shared/components/native';
import {
  getAllClients,
  createClients,
  updateClients,
  deleteClients,
  searchClients,
  StateClient,
  Clients,
  CreateClientsDTO,
  UpdateClientsDTO,
} from '@/features/ecommerce/customers/services/clientsServices'; // ← ajusta el path si difiere
import {
  getAllTypesDocs,
  TypesDocs,
} from '@/features/suppliers/services/providersService'; // ← mismo getAllTypesDocs que usan otros managers
import ClienteDetallePage from '../pages/ClienteDetallePage';

// ─── Tipos locales ────────────────────────────────────────────────────────────
// Las ventas siguen en localStorage (módulo independiente)
const VENTAS_KEY = 'damabella_ventas';

export default function ClientesManager() {
  // ─── Datos ──────────────────────────────────────────────────────────────────
  const [clientes, setClientes] = useState<Clients[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [typesDocs, setTypesDocs] = useState<TypesDocs[]>([]);
  const [loadingTypesDocs, setLoadingTypesDocs] = useState(false);
  const [detalleClienteId, setDetalleClienteId] = useState<number | null>(null);

  // ─── Búsqueda ────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Paginación ──────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ─── Modales ─────────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Clients | null>(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<Clients | null>(null);
  const [showCannotDeleteModal, setShowCannotDeleteModal] = useState(false);
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [clienteToToggle, setClienteToToggle] = useState<Clients | null>(null);

  // ─── Notificaciones ──────────────────────────────────────────────────────────
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'error' | 'success' | 'warning'>('success');
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Formulario ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: '',
    type_doc: 0,
    doc: '',
    phone: '',
    email: '',
    address: '',
    city: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ─── Auto-cerrar notificación ─────────────────────────────────────────────────
  useEffect(() => {
    if (showNotificationModal) {
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = setTimeout(() => setShowNotificationModal(false), 2500);
    }
    return () => {
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    };
  }, [showNotificationModal]);

  // ─── Carga inicial ────────────────────────────────────────────────────────────
  const fetchClientes = useCallback(async () => {
    setLoading(true);
    const data = await getAllClients();
    setClientes(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  // ─── Tipos de documento ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchTypesDocs = async () => {
      setLoadingTypesDocs(true);
      const data = await getAllTypesDocs();
      if (data) setTypesDocs(data);
      setLoadingTypesDocs(false);
    };
    fetchTypesDocs();
  }, []);

  // Inicializar type_doc del form cuando carguen los tipos
  useEffect(() => {
    if (typesDocs.length > 0 && !editingCliente) {
      setFormData(prev => ({ ...prev, type_doc: typesDocs[0].id_doc }));
    }
  }, [typesDocs]);

  // ─── Búsqueda con debounce ────────────────────────────────────────────────────
  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setCurrentPage(1);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!query.trim()) {
      fetchClientes();
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const results = await searchClients({ name: query });
      if (results && results.length > 0) {
        setClientes(results);
      } else {
        const byDoc = await searchClients({ doc: query });
        setClientes(byDoc ?? []);
      }
      setSearchLoading(false);
    }, 350);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const notify = (message: string, type: 'success' | 'error' | 'warning') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotificationModal(true);
  };

  const tipoDocLabel = (type_doc: number) => {
    const found = typesDocs.find(t => t.id_doc === type_doc);
    return found ? found.name : String(type_doc);
  };

  // Verificar si el cliente tiene ventas en localStorage
  const tieneVentas = (id_client: number): boolean => {
    const ventas = JSON.parse(localStorage.getItem(VENTAS_KEY) || '[]');
    return ventas.some((v: any) =>
      v.clienteId === id_client || v.clienteId?.toString() === String(id_client)
    );
  };

  // ─── Validaciones ─────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.name)) {
      errors.name = 'Solo se permiten letras y espacios';
    }

    if (!formData.doc.trim()) {
      errors.doc = 'El número de documento es obligatorio';
    } else if (!/^\d{6,12}$/.test(formData.doc)) {
      errors.doc = 'Debe tener entre 6 y 12 dígitos';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'El teléfono es obligatorio';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      errors.phone = 'Debe tener exactamente 10 dígitos';
    }

    if (!formData.city.trim()) {
      errors.city = 'La ciudad es obligatoria';
    }

    if (!formData.email.trim()) {
      errors.email = 'El correo es obligatorio';
    } else if (!/^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      errors.email = 'Email inválido (debe iniciar con letra)';
    }

    if (!formData.address.trim()) {
      errors.address = 'La dirección es obligatoria';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field: string, value: string) => {
    if (field === 'doc' || field === 'phone') value = value.replace(/\D/g, '');
    if (field === 'name') value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo al editar
    if (formErrors[field]) setFormErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  // ─── CRUD ─────────────────────────────────────────────────────────────────────
  const handleCreate = () => {
    setEditingCliente(null);
    setFormData({
      name: '',
      type_doc: typesDocs.length > 0 ? typesDocs[0].id_doc : 0,
      doc: '',
      phone: '',
      email: '',
      address: '',
      city: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEdit = (cliente: Clients) => {
    setEditingCliente(cliente);
    setFormData({
      name: cliente.name || '',
      type_doc: cliente.type_doc ?? (typesDocs[0]?.id_doc ?? 0),
      doc: cliente.doc || '',
      phone: cliente.phone || '',
      email: cliente.email || '',
      address: cliente.address || '',
      city: cliente.city || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      notify('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    setActionLoading(true);

    if (editingCliente) {
      // ── Editar ──
      const payload: UpdateClientsDTO = {
        name: formData.name,
        type_doc: formData.type_doc,
        doc: formData.doc,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
      };
      const updated = await updateClients(editingCliente.id_client, payload);
      if (updated) {
        setClientes(prev => prev.map(c => c.id_client === editingCliente.id_client ? updated : c));
        notify(`Cliente "${updated.name}" actualizado correctamente`, 'success');
        setShowModal(false);
      } else {
        notify('Error al actualizar el cliente', 'error');
      }
    } else {
      // ── Crear ──
      const payload: CreateClientsDTO = {
        name: formData.name,
        type_doc: formData.type_doc,
        doc: formData.doc,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
      };
      const nuevo = await createClients(payload);
      if (nuevo) {
        setClientes(prev => [...prev, nuevo]);
        notify(`Cliente "${nuevo.name}" creado correctamente`, 'success');
        setShowModal(false);
      } else {
        notify('Error al crear el cliente', 'error');
      }
    }

    setActionLoading(false);
  };

  // ─── Eliminar ─────────────────────────────────────────────────────────────────
  const handleDeleteCliente = (cliente: Clients) => {
    if (tieneVentas(cliente.id_client)) {
      setClienteToDelete(cliente);
      setShowCannotDeleteModal(true);
      return;
    }
    setClienteToDelete(cliente);
    setShowConfirmDeleteModal(true);
  };

  const confirmDeleteCliente = async () => {
    if (!clienteToDelete) return;
    const idAEliminar = clienteToDelete.id_client;
    const nombreAEliminar = clienteToDelete.name;

    // Cierre optimista
    setShowConfirmDeleteModal(false);
    setClienteToDelete(null);
    setClientes(prev => prev.filter(c => c.id_client !== idAEliminar));

    const success = await deleteClients(idAEliminar);
    if (success) {
      notify(`Cliente "${nombreAEliminar}" eliminado correctamente`, 'success');
    } else {
      notify('No se pudo eliminar el cliente', 'error');
      await fetchClientes(); // Restaurar si falla
    }
  };

  // ─── Toggle estado ────────────────────────────────────────────────────────────
  const handleToggleState = (cliente: Clients) => {
    if (!cliente.state) {
      // Activar directamente sin confirmación
      (async () => {
        setActionLoading(true);
        const result = await StateClient(cliente.id_client, true);
        if (result) {
          setClientes(prev => prev.map(c => c.id_client === cliente.id_client ? { ...c, state: true } : c));
          notify(`Cliente "${cliente.name}" activado`, 'success');
        } else {
          notify('Error al activar el cliente', 'error');
        }
        setActionLoading(false);
      })();
    } else {
      // Inactivar: verificar ventas y pedir confirmación
      if (tieneVentas(cliente.id_client)) {
        setClienteToDelete(cliente);
        setShowCannotDeleteModal(true);
        return;
      }
      setClienteToToggle(cliente);
      setShowStatusConfirmModal(true);
    }
  };

  const confirmToggleStatus = async () => {
    if (!clienteToToggle) return;
    setActionLoading(true);
    const result = await StateClient(clienteToToggle.id_client, false);
    if (result) {
      setClientes(prev => prev.map(c => c.id_client === clienteToToggle.id_client ? { ...c, state: false } : c));
      notify(`Cliente "${clienteToToggle.name}" desactivado`, 'success');
    } else {
      notify('Error al desactivar el cliente', 'error');
    }
    setActionLoading(false);
    setShowStatusConfirmModal(false);
    setClienteToToggle(null);
  };

  // ─── Paginación ───────────────────────────────────────────────────────────────
  const totalItems = clientes.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedClientes = clientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages]);

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  if (detalleClienteId !== null) {
    return (
      <ClienteDetallePage
        clientId={detalleClienteId}
        onBack={() => setDetalleClienteId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Clientes</h2>
          <p className="text-gray-600">Administra la información de tus clientes</p>
        </div>
        <Button onClick={handleCreate} variant="primary" disabled={actionLoading}>
          <Plus size={20} />
          Nuevo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar clientes por nombre, documento, email..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            // ✅ Sin disabled — el input nunca pierde el foco
          />
          {searchLoading && (
            <Loader className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={20} />
          )}
        </div>
      </div>

      {/* Clientes List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-gray-600">Cliente</th>
                <th className="text-left py-4 px-6 text-gray-600">Documento</th>
                <th className="text-left py-4 px-6 text-gray-600">Contacto</th>
                <th className="text-left py-4 px-6 text-gray-600">Ciudad</th>
                <th className="text-center py-4 px-6 text-gray-600">Estado</th>
                <th className="text-right py-4 px-6 text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedClientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <Users className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron clientes</p>
                  </td>
                </tr>
              ) : (
                paginatedClientes.map((cliente) => (
                  <tr key={cliente.id_client} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white">
                          {cliente.name[0]?.toUpperCase()}
                        </div>
                        <div className="text-gray-900">{cliente.name}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-700">{tipoDocLabel(cliente.type_doc)}</div>
                      <div className="text-gray-500">{cliente.doc}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {cliente.phone && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone size={14} className="text-gray-400" />
                            {cliente.phone}
                          </div>
                        )}
                        {cliente.email && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Mail size={14} className="text-gray-400" />
                            {cliente.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{cliente.city || 'N/A'}</td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          cliente.state ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {cliente.state ? 'Activo' : 'Inactivo'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        {/* Ver detalle */}
                        <button
                          onClick={() => setDetalleClienteId(cliente.id_client)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => handleEdit(cliente)}
                          disabled={actionLoading}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 disabled:opacity-50"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>

                        {/* Eliminar */}
                        <button
                          onClick={() => handleDeleteCliente(cliente)}
                          disabled={actionLoading}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                          title="Eliminar cliente"
                        >
                          <Trash2 size={18} />
                        </button>

                        {/* Toggle estado */}
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleToggleState(cliente)}
                          disabled={actionLoading}
                          aria-pressed={cliente.state}
                          title={cliente.state ? 'Inactivar cliente' : 'Activar cliente'}
                          className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                            cliente.state ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            cliente.state ? 'translate-x-6' : 'translate-x-0'
                          }`} />
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

      {/* Paginación */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Mostrando {totalItems === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}–{Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} clientes
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
          >Anterior</button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`}
            >{i + 1}</button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
          >Siguiente</button>
          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="ml-2 border rounded px-2 py-1"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODALES                                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* Modal Crear / Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Tipo de documento — cargado desde API */}
            <div>
              <label className="block text-gray-700 mb-2">Tipo de Documento *</label>
              <select
                value={formData.type_doc}
                onChange={(e) => setFormData(prev => ({ ...prev, type_doc: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={loadingTypesDocs || actionLoading}
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
              <Input
                value={formData.doc}
                onChange={(e) => handleFieldChange('doc', e.target.value)}
                placeholder="1234567890"
                maxLength={12}
                disabled={actionLoading}
                required
              />
              {formErrors.doc && <p className="text-red-500 text-sm mt-1">{formErrors.doc}</p>}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Nombre Completo *</label>
            <Input
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Juan Pérez"
              disabled={actionLoading}
              required
            />
            {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Teléfono *</label>
              <Input
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="3001234567"
                maxLength={10}
                disabled={actionLoading}
                required
              />
              {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Ciudad *</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                disabled={actionLoading}
                required
              >
                <option value="">Seleccionar ciudad...</option>
                <option value="Bogotá">Bogotá</option>
                <option value="Medellín">Medellín</option>
                <option value="Cali">Cali</option>
                <option value="Barranquilla">Barranquilla</option>
                <option value="Bucaramanga">Bucaramanga</option>
              </select>
              {formErrors.city && <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Correo Electrónico *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="cliente@ejemplo.com"
              disabled={actionLoading}
              required
            />
            {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Dirección *</label>
            <Input
              value={formData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              placeholder="Calle 123 # 45-67"
              disabled={actionLoading}
              required
            />
            {formErrors.address && <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={() => setShowModal(false)} variant="secondary" disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="primary" disabled={actionLoading}>
              {actionLoading ? (
                <><Loader size={16} className="animate-spin" />{editingCliente ? 'Guardando...' : 'Creando...'}</>
              ) : (
                editingCliente ? 'Guardar Cambios' : 'Crear Cliente'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        isOpen={showConfirmDeleteModal}
        onClose={() => { setShowConfirmDeleteModal(false); setClienteToDelete(null); }}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Deseas eliminar al cliente <strong>{clienteToDelete?.name}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 justify-end pt-4">
            <Button onClick={() => { setShowConfirmDeleteModal(false); setClienteToDelete(null); }} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={confirmDeleteCliente} variant="primary" className="bg-red-600 hover:bg-red-700">
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal No se puede eliminar / desactivar */}
      <Modal
        isOpen={showCannotDeleteModal}
        onClose={() => { setShowCannotDeleteModal(false); setClienteToDelete(null); }}
        title="No se puede completar la acción"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <span className="text-yellow-600 text-lg">⚠️</span>
            <p className="text-yellow-800">
              No puedes eliminar ni desactivar al cliente <strong>{clienteToDelete?.name}</strong> porque tiene ventas asociadas.
              Puedes editar su información si lo necesitas.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => { setShowCannotDeleteModal(false); setClienteToDelete(null); }} variant="secondary">
              Entendido
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmar Cambio de Estado */}
      <Modal
        isOpen={showStatusConfirmModal}
        onClose={() => { setShowStatusConfirmModal(false); setClienteToToggle(null); }}
        title="Confirmar Desactivación"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-gray-700">
              ¿Deseas desactivar al cliente <strong>{clienteToToggle?.name}</strong>?
            </p>
            <p className="text-yellow-800 text-sm mt-2">
              Puedes reactivarlo en cualquier momento desde el toggle de estado.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button onClick={() => { setShowStatusConfirmModal(false); setClienteToToggle(null); }} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={confirmToggleStatus} variant="primary" disabled={actionLoading}>
              {actionLoading ? <><Loader size={16} className="animate-spin" />Desactivando...</> : 'Desactivar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Notificación */}
      <Modal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        title={notificationType === 'error' ? 'Error' : notificationType === 'success' ? 'Éxito' : 'Advertencia'}
      >
        <div className="space-y-4">
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            notificationType === 'error' ? 'bg-red-50 border-red-200' :
            notificationType === 'success' ? 'bg-green-50 border-green-200' :
            'bg-yellow-50 border-yellow-200'
          }`}>
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-sm ${
              notificationType === 'error' ? 'bg-red-600' :
              notificationType === 'success' ? 'bg-green-600' :
              'bg-yellow-600'
            }`}>
              {notificationType === 'error' ? '!' : notificationType === 'success' ? '✓' : '⚠'}
            </div>
            <p className={
              notificationType === 'error' ? 'text-red-800' :
              notificationType === 'success' ? 'text-green-800' :
              'text-yellow-800'
            }>
              {notificationMessage}
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowNotificationModal(false)} variant="primary">Aceptar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
