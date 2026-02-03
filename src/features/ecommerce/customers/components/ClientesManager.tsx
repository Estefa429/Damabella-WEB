import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Eye, Search, Phone, Mail, AlertTriangle, TrendingUp, DollarSign, BarChart3, Users } from 'lucide-react';
import { Button, Input, Modal } from '../../../../shared/components/native';
import validateField from '../../../../shared/utils/validation';

const STORAGE_KEY = 'damabella_clientes';
const VENTAS_KEY = 'damabella_ventas';
const DEVOLUCIONES_KEY = 'damabella_devoluciones';
const CAMBIOS_KEY = 'damabella_cambios';

interface Cliente {
  id: number;
  nombre: string;
  tipoDoc: string;
  numeroDoc: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  activo: boolean;
  createdAt: string;
}

export default function ClientesManager() {
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<any>({});
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'error' | 'success' | 'warning'>('error');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipoDoc: 'CC',
    numeroDoc: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: ''
  });

  // 🔒 LÓGICA DE ESTADO AUTOMÁTICO DEL CLIENTE
  // Determina si un cliente debe estar ACTIVO basado en sus ventas
  const debeEstarActivo = (clienteId: number): boolean => {
    const ventas = JSON.parse(localStorage.getItem(VENTAS_KEY) || '[]');
    return ventas.some((v: any) => 
      v.clienteId === clienteId && 
      (v.estado === 'Aplicada' || v.estado === 'APLICADA' || v.estado === 'Completada' || v.estado === 'COMPLETADA')
    );
  };

  // 🔒 AUTO-ACTIVAR clientes si tienen ventas aplicadas
  const sincronizarEstadoClientes = (clientesActuales: Cliente[]): Cliente[] => {
    return clientesActuales.map(cliente => {
      const debeActivo = debeEstarActivo(cliente.id);
      if (debeActivo && !cliente.activo) {
        console.log(`✅ [ClientesManager] Cliente "${cliente.nombre}" activado automáticamente (tiene venta APLICADA)`);
        return { ...cliente, activo: true };
      }
      return cliente;
    });
  };

  useEffect(() => {
    // Auto-sincronizar estado antes de guardar
    const clientesSincronizados = sincronizarEstadoClientes(clientes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clientesSincronizados));
    if (JSON.stringify(clientesSincronizados) !== JSON.stringify(clientes)) {
      setClientes(clientesSincronizados);
    }
  }, [clientes]);

  // 🔗 ACTIVAR/DESACTIVAR CLIENTE
  const handleToggleCliente = (cliente: Cliente) => {
    const clienteActualizado = { ...cliente, activo: !cliente.activo };
    const clientesActualizados = clientes.map(c => 
      c.id === cliente.id ? clienteActualizado : c
    );
    setClientes(clientesActualizados);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clientesActualizados));
    
    const accion = clienteActualizado.activo ? 'activado' : 'desactivado';
    console.log(`✅ Cliente "${cliente.nombre}" ${accion}`);
    setNotificationMessage(`Cliente "${cliente.nombre}" ha sido ${accion}`);
    setNotificationType('success');
    setShowNotificationModal(true);
  };

  const handleFieldChange = (field: string, value: string) => {
    // Validación de entrada: solo permitir números en campos numéricos
    if (field === 'numeroDoc' || field === 'telefono') {
      value = value.replace(/\D/g, '');
    }
    
    // No permitir caracteres especiales en nombre
    if (field === 'nombre') {
      value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    }

    setFormData({ ...formData, [field]: value });

    // Real-time validation por campo
    if (field === 'nombre') {
      const err = validateField('nombre', value);
      if (err) setFormErrors({ ...formErrors, nombre: err });
      else {
        const { nombre: _n, ...rest } = formErrors;
        setFormErrors(rest);
      }
      return;
    }

    if (field === 'numeroDoc') {
      if (value.length < 6 || value.length > 10) {
        setFormErrors({ ...formErrors, numeroDoc: 'Debe tener entre 6 y 10 dígitos' });
      } else {
        const { numeroDoc: _d, ...rest } = formErrors;
        setFormErrors(rest);
      }
      return;
    }

    if (field === 'telefono') {
      if (value.trim() && value.length !== 10) {
        setFormErrors({ ...formErrors, telefono: 'Debe tener exactamente 10 dígitos' });
      } else {
        const { telefono: _t, ...rest } = formErrors;
        setFormErrors(rest);
      }
      return;
    }

    if (field === 'email') {
      if (value.trim()) {
        const err = validateField('email', value);
        if (err) {
          setFormErrors({ ...formErrors, email: err });
        } else {
          // verificar unicidad en tiempo real (excepto si editando el mismo cliente)
          const emailExists = clientes.some(c => (c.email?.toLowerCase() ?? '') === (value?.toLowerCase() ?? '') && c.id !== editingCliente?.id);
          if (emailExists) setFormErrors({ ...formErrors, email: 'Este correo electrónico ya está registrado' });
          else {
            const { email: _e, ...rest } = formErrors;
            setFormErrors(rest);
          }
        }
      } else {
        const { email: _e, ...rest } = formErrors;
        setFormErrors(rest);
      }
      return;
    }
  };

  const handleCedulaBlur = () => {
    // Validar si la cédula ya existe
    if (formData.numeroDoc.trim()) {
      const cedulaExists = clientes.some(c => 
        c.numeroDoc === formData.numeroDoc && c.id !== editingCliente?.id
      );
      if (cedulaExists) {
        setNotificationMessage('Este cliente ya está registrado en el sistema');
        setNotificationType('warning');
        setShowNotificationModal(true);
      }
    }
  };

  const handleCreate = () => {
    setEditingCliente(null);
    setFormData({
      nombre: '',
      tipoDoc: 'CC',
      numeroDoc: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: ''
    });
    setShowModal(true);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre || '',
      tipoDoc: cliente.tipoDoc || 'CC',
      numeroDoc: cliente.numeroDoc || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || ''
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const errors: any = {};
    
    // Validación nombre
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.nombre)) {
      errors.nombre = 'Solo se permiten letras y espacios';
    }
    
    // Validación documento
    if (!formData.numeroDoc.trim()) {
      errors.numeroDoc = 'El número de documento es obligatorio';
    } else if (!/^\d{6,12}$/.test(formData.numeroDoc)) {
      errors.numeroDoc = 'Debe tener entre 6 y 12 dígitos';
    }
    
    // Validación teléfono - OBLIGATORIO
    if (!formData.telefono.trim()) {
      errors.telefono = 'El teléfono es obligatorio';
    } else if (!/^\d{10}$/.test(formData.telefono)) {
      errors.telefono = 'Debe tener exactamente 10 dígitos';
    }
    
    // Validación ciudad - OBLIGATORIA
    if (!formData.ciudad.trim()) {
      errors.ciudad = 'La ciudad es obligatoria';
    }
    
    // Validación email - OBLIGATORIO
    if (!formData.email.trim()) {
      errors.email = 'El correo es obligatorio';
    } else if (!/^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      errors.email = 'Email inválido (debe iniciar con letra)';
    } else {
      // Verificar que el correo no exista (excepto si estamos editando el mismo cliente)
      const emailExists = clientes.some(c => 
        (c.email?.toLowerCase() ?? '') === (formData.email?.toLowerCase() ?? '') && 
        c.id !== editingCliente?.id
      );
      if (emailExists) {
        errors.email = 'Este correo electrónico ya está registrado';
      }
    }
    
    // Validación dirección - OBLIGATORIA
    if (!formData.direccion.trim()) {
      errors.direccion = 'La dirección es obligatoria';
    }
    
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setNotificationMessage('Por favor completa todos los campos requeridos');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const clienteData = {
      ...formData,
      activo: editingCliente ? editingCliente.activo : false,  // 🔒 Nuevos clientes inician INACTIVOS
      createdAt: editingCliente?.createdAt || new Date().toISOString()
    };

    if (editingCliente) {
      setClientes(clientes.map(c => 
        c.id === editingCliente.id ? { ...c, ...clienteData } : c
      ));
    } else {
      setClientes([...clientes, { id: Date.now(), ...clienteData }]);
    }
    
    setShowModal(false);
  };

  const filteredClientes = clientes.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (c.nombre?.toLowerCase() ?? '').includes(searchLower) ||
      (c.numeroDoc ?? '').includes(searchTerm) ||
      (c.email?.toLowerCase() ?? '').includes(searchLower) ||
      (c.telefono ?? '').includes(searchTerm) ||
      (c.tipoDoc?.toLowerCase() ?? '').includes(searchLower) ||
      (c.ciudad?.toLowerCase() ?? '').includes(searchLower) ||
      (c.direccion?.toLowerCase() ?? '').includes(searchLower)
    );
  });

  // 📊 FUNCIONES DE CÁLCULO COMERCIAL (Read-only)
  const calcularDatosComerciales = (clienteId: number) => {
    const ventas = JSON.parse(localStorage.getItem(VENTAS_KEY) || '[]');
    const devoluciones = JSON.parse(localStorage.getItem(DEVOLUCIONES_KEY) || '[]');
    const cambios = JSON.parse(localStorage.getItem(CAMBIOS_KEY) || '[]');

    // 🔒 Normalizar clienteId para comparación (string o número)
    const clienteIdStr = clienteId.toString();

    // Total de ventas del cliente
    const ventasCliente = ventas.filter((v: any) => 
      v.clienteId === clienteId || 
      v.clienteId?.toString() === clienteIdStr ||
      v.clienteId === clienteIdStr
    );
    const totalVentas = ventasCliente.reduce((sum: number, v: any) => sum + (v.total || 0), 0);

    // Total de devoluciones del cliente
    const devolucionesCliente = devoluciones.filter((d: any) => 
      d.clienteId === clienteId || 
      d.clienteId?.toString() === clienteIdStr ||
      d.clienteId === clienteIdStr
    );
    const totalDevoluciones = devolucionesCliente.reduce((sum: number, d: any) => sum + (d.total || 0), 0);

    // Total de cambios del cliente (diferencia financiera - SOLO INFORMATIVO)
    const cambiosCliente = cambios.filter((c: any) => 
      c.clienteId === clienteId || 
      c.clienteId?.toString() === clienteIdStr ||
      c.clienteId === clienteIdStr
    );
    const totalCambios = cambiosCliente.reduce((sum: number, c: any) => sum + (c.diferencia || 0), 0);

    // 🔒 Saldo a favor del cliente - SOLO afectado por devoluciones, NO por cambios
    // Representa el saldo disponible por devoluciones no aplicadas
    const saldoAFavor = totalDevoluciones;

    return {
      totalVentas,
      totalDevoluciones,
      totalCambios,
      saldoAFavor,
      ventasCliente,
      devolucionesCliente,
      cambiosCliente,
    };
  };

  const obtenerHistorialCliente = (clienteId: number) => {
    const ventas = JSON.parse(localStorage.getItem(VENTAS_KEY) || '[]');
    const devoluciones = JSON.parse(localStorage.getItem(DEVOLUCIONES_KEY) || '[]');
    const cambios = JSON.parse(localStorage.getItem(CAMBIOS_KEY) || '[]');

    const historial: any[] = [];

    // Agregar ventas del cliente
    ventas
      .filter((v: any) => v.clienteId === clienteId)
      .forEach((v: any) => {
        historial.push({
          tipo: 'Venta',
          numero: v.numeroVenta || v.id,
          fecha: v.createdAt || v.fechaVenta,
          valor: v.total,
          estado: v.estado || 'Completada',
          icon: '🛍️',
        });
      });

    // Agregar devoluciones del cliente
    devoluciones
      .filter((d: any) => d.clienteId === clienteId)
      .forEach((d: any) => {
        historial.push({
          tipo: 'Devolución',
          numero: d.numeroDevolucion,
          fecha: d.fechaDevolucion || d.createdAt,
          valor: d.total,
          estado: d.estadoGestion,
          icon: '📦',
        });
      });

    // Agregar cambios del cliente
    cambios
      .filter((c: any) => c.clienteId === clienteId)
      .forEach((c: any) => {
        historial.push({
          tipo: 'Cambio',
          numero: c.numeroCambio,
          fecha: c.fechaCambio || c.createdAt,
          valor: c.diferencia,
          estado: c.stockDevuelto && c.stockEntregado ? 'Aplicado' : 'Pendiente',
          icon: '♻️',
        });
      });

    // Ordenar por fecha descendente
    return historial.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Clientes</h2>
          <p className="text-gray-600">Administra la información de tus clientes</p>
        </div>
        <Button onClick={handleCreate} variant="primary">
          <Plus size={20} />
          Nuevo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
                <th className="text-left py-4 px-6 text-gray-600">Resumen Comercial</th>
                <th className="text-center py-4 px-6 text-gray-600">Estado</th>
                <th className="text-right py-4 px-6 text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <Users className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron clientes</p>
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente) => {
                  const datos = calcularDatosComerciales(cliente.id);
                  return (
                  <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white">
                          {cliente.nombre[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-gray-900">{cliente.nombre}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-700">{cliente.tipoDoc}</div>
                      <div className="text-gray-500">{cliente.numeroDoc}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {cliente.telefono && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone size={14} className="text-gray-400" />
                            {cliente.telefono}
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
                    <td className="py-4 px-6 text-gray-600">{cliente.ciudad || 'N/A'}</td>
                    
                    {/* 🔒 RESUMEN COMERCIAL: Mini card vertical */}
                    <td className="py-4 px-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 shadow-sm">
                        <div className="flex flex-col gap-3">
                          {/* Total Ventas */}
                          <div className="flex justify-between items-baseline border-b border-blue-200 pb-2">
                            <span className="text-xs font-medium text-gray-600">Total Ventas</span>
                            <span className="text-sm font-bold text-gray-900">${datos.totalVentas.toLocaleString()}</span>
                          </div>
                          
                          {/* Devoluciones */}
                          <div className="flex justify-between items-baseline border-b border-blue-200 pb-2">
                            <span className="text-xs font-medium text-gray-600">Devoluciones</span>
                            <span className={`text-sm font-bold ${datos.totalDevoluciones > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              ${datos.totalDevoluciones.toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Saldo a Favor - Destacado */}
                          <div className="flex justify-between items-baseline pt-1">
                            <span className="text-xs font-bold text-green-700">Saldo a Favor</span>
                            <span className={`text-base font-bold ${datos.saldoAFavor > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                              ${datos.saldoAFavor.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          cliente.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {cliente.activo ? 'Activo' : 'Inactivo'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            // ✅ Validación defensiva: asegurar que el cliente tiene ID válido
                            if (!cliente || !cliente.id) {
                              console.error('❌ [ClientesManager] Error: Cliente sin ID', cliente);
                              setNotificationMessage('Error: No se puede abrir el detalle del cliente');
                              setNotificationType('error');
                              setShowNotificationModal(true);
                              return;
                            }
                            // 🔗 Guardar cliente temporal para navegación
                            sessionStorage.setItem('cliente_detalle_actual', JSON.stringify(cliente));
                            // Navegar a detalle
                            window.dispatchEvent(new CustomEvent('navigate-cliente-detalle', { detail: cliente }));
                          }}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(cliente)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleCliente(cliente)}
                          className={`p-2 rounded-lg transition-colors ${
                            cliente.activo
                              ? 'hover:bg-red-50 text-red-600'
                              : 'hover:bg-green-50 text-green-600'
                          }`}
                          title={cliente.activo ? 'Desactivar cliente' : 'Activar cliente'}
                        >
                          <div className="flex items-center justify-center w-5 h-5 text-xs font-bold">
                            {cliente.activo ? '✕' : '✓'}
                          </div>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="PAS">Pasaporte</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Número de Documento *</label>
              <Input
                value={formData.numeroDoc}
                onChange={(e) => handleFieldChange('numeroDoc', e.target.value)}
                onBlur={handleCedulaBlur}
                placeholder="1234567890"
                maxLength={10}
                required
              />
              {formErrors.numeroDoc && <p className="text-red-500 text-sm">{formErrors.numeroDoc}</p>}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Nombre Completo *</label>
            <Input
              value={formData.nombre}
              onChange={(e) => handleFieldChange('nombre', e.target.value)}
              placeholder="Juan Pérez"
              required
            />
            {formErrors.nombre && <p className="text-red-500 text-sm">{formErrors.nombre}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Teléfono *</label>
              <Input
                value={formData.telefono}
                onChange={(e) => handleFieldChange('telefono', e.target.value)}
                placeholder="3001234567"
                maxLength={10}
                required
              />
              {formErrors.telefono && <p className="text-red-500 text-sm">{formErrors.telefono}</p>}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Ciudad *</label>
              <select
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              >
                <option value="">Seleccionar ciudad...</option>
                <option value="Bogotá">Bogotá</option>
                <option value="Medellín">Medellín</option>
                <option value="Cali">Cali</option>
                <option value="Barranquilla">Barranquilla</option>
                <option value="Bucaramanga">Bucaramanga</option>
              </select>
              {formErrors.ciudad && <p className="text-red-500 text-sm">{formErrors.ciudad}</p>}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Correo Electrónico *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="cliente@ejemplo.com"
              required
            />
            {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Dirección *</label>
            <Input
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Calle 123 # 45-67"
              required
            />
            {formErrors.direccion && <p className="text-red-500 text-sm">{formErrors.direccion}</p>}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={() => setShowModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="primary">
              {editingCliente ? 'Guardar Cambios' : 'Crear Cliente'}
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
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${
              notificationType === 'error' ? 'bg-red-600' :
              notificationType === 'success' ? 'bg-green-600' :
              'bg-yellow-600'
            }`}>
              {notificationType === 'error' ? '!' : notificationType === 'success' ? '✓' : '⚠'}
            </div>
            <p className={notificationType === 'error' ? 'text-red-800' : 
                        notificationType === 'success' ? 'text-green-800' : 'text-yellow-800'}>
              {notificationMessage}
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowNotificationModal(false)} variant="primary">
              Aceptar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmación */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar acción"
      >
        <div className="space-y-4">
          <p className="text-gray-700">{confirmMessage}</p>
          <div className="flex gap-3 justify-end">
            <Button 
              onClick={() => setShowConfirmModal(false)} 
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => confirmAction && confirmAction()} 
              variant="primary"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
