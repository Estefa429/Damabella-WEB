import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Eye, Download, AlertCircle, CheckCircle, Trash2, Plus } from 'lucide-react';
import { Input, Modal, Button } from '../../../shared/components/native';
import { procesarDevolucionConSaldo, procesarCambioConSaldo } from '../../../services/returnService';

const STORAGE_KEY = 'damabella_devoluciones';
const VENTAS_KEY = 'damabella_ventas';
const PRODUCTOS_KEY = 'damabella_productos';
const CLIENTES_KEY = 'damabella_clientes';
const DEVOLUCION_COUNTER_KEY = 'damabella_devolucion_counter';


interface ItemDevolucion {
  id: string;
  productoNombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Devolucion {
  medioPagoExcedente?: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Nequi' | 'Daviplata';
  productoNuevoTalla?: string;
  productoNuevoColor?: string;
  id: number;
  numeroDevolucion: string;
  ventaId: number;
  numeroVenta: string;
  clienteNombre: string;
  fechaDevolucion: string;
  motivo: 'Defectuoso' | 'Talla incorrecta' | 'Color incorrecto' | 'Producto equivocado' | 'Otro';
  items: ItemDevolucion[];
  total: number;
  createdAt: string;
  estadoGestion: 'Aplicada' | 'Pendiente' | 'Enviado a reparación' | 'Reparado' | 'Cambiado' | 'Anulado';
  productoNuevo?: { id: string; nombre: string; precio: number } | null;
  saldoAFavor?: number;
  diferenciaPagar?: number;
  fechaAnulacion?: string;
}

export function DevolucionesManager() {
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [ventas, setVentas] = useState(() => {
    const stored = localStorage.getItem(VENTAS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [productos, setProductos] = useState(() => {
    const stored = localStorage.getItem(PRODUCTOS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Productos de ejemplo - Ropa femenina
    const productosEjemplo = [
      {
        id: '1',
        nombre: 'Vestido Corto Casual',
        referencia: 'VES-CORTA-001',
        codigoInterno: 'VCC-001',
        precioVenta: 65000,
        activo: true,
        tallas: ['XS', 'S', 'M', 'L', 'XL'],
        colores: ['Rojo', 'Negro', 'Blanco', 'Azul', 'Rosa'],
      },
      {
        id: '2',
        nombre: 'Vestido Largo Elegante',
        referencia: 'VES-LARGO-002',
        codigoInterno: 'VLE-002',
        precioVenta: 95000,
        activo: true,
        tallas: ['XS', 'S', 'M', 'L', 'XL'],
        colores: ['Negro', 'Rojo', 'Champagne', 'Azul Marino'],
      },
      {
        id: '3',
        nombre: 'Enterizo Ejecutivo',
        referencia: 'ENT-EJE-003',
        codigoInterno: 'ENE-003',
        precioVenta: 85000,
        activo: true,
        tallas: ['XS', 'S', 'M', 'L', 'XL'],
        colores: ['Negro', 'Beige', 'Azul Marino', 'Gris'],
      },
      {
        id: '4',
        nombre: 'Enterizo Casual Denim',
        referencia: 'ENT-CAS-004',
        codigoInterno: 'ECD-004',
        precioVenta: 75000,
        activo: true,
        tallas: ['XS', 'S', 'M', 'L', 'XL'],
        colores: ['Azul Claro', 'Azul Oscuro', 'Negro'],
      },
      {
        id: '5',
        nombre: 'Vestido Corto de Fiesta',
        referencia: 'VES-FIESTA-005',
        codigoInterno: 'VCF-005',
        precioVenta: 78000,
        activo: true,
        tallas: ['XS', 'S', 'M', 'L', 'XL'],
        colores: ['Dorado', 'Plata', 'Negro', 'Rojo'],
      },
      {
        id: '6',
        nombre: 'Vestido Largo de Gala',
        referencia: 'VES-GALA-006',
        codigoInterno: 'VLG-006',
        precioVenta: 120000,
        activo: true,
        tallas: ['XS', 'S', 'M', 'L', 'XL'],
        colores: ['Blanco', 'Negro', 'Azul Marino', 'Vino'],
      },
      {
        id: '7',
        nombre: 'Enterizo Premium',
        referencia: 'ENT-PREM-007',
        codigoInterno: 'EPR-007',
        precioVenta: 105000,
        activo: true,
        tallas: ['XS', 'S', 'M', 'L', 'XL'],
        colores: ['Negro', 'Blanco', 'Rosa Palo', 'Azul Cielo'],
      },
    ];
    localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosEjemplo));
    return productosEjemplo;
  });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [viewingDevolucion, setViewingDevolucion] = useState<Devolucion | null>(null);
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    const handleStorageChange = () => {
      const storedDevoluciones = localStorage.getItem(STORAGE_KEY);
      const storedVentas = localStorage.getItem(VENTAS_KEY);
      const storedProductos = localStorage.getItem(PRODUCTOS_KEY);
      if (storedDevoluciones) setDevoluciones(JSON.parse(storedDevoluciones));
      if (storedVentas) setVentas(JSON.parse(storedVentas));
      if (storedProductos) setProductos(JSON.parse(storedProductos));
      // ❌ NO cargar cambios aquí - Módulo de devoluciones SOLO debe mostrar devoluciones
    };
    
    handleStorageChange(); // Load initial data
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 🔒 NUEVA FUNCIÓN: Sincronizar productos desde localStorage (fuente de verdad)
  const sincronizarProductos = () => {
    const productosActualizados = localStorage.getItem(PRODUCTOS_KEY);
    if (productosActualizados) {
      try {
        const datos = JSON.parse(productosActualizados);
        setProductos(datos);
        return datos;
      } catch (error) {
        console.error('Error al sincronizar productos:', error);
      }
    }
    return null;
  };

  const descargarComprobante = (devolucion: Devolucion) => {
    const contenido = `
=================================
COMPROBANTE DE DEVOLUCIÓN
${devolucion.numeroDevolucion}
=================================

Fecha de Devolución: ${new Date(devolucion.fechaDevolucion).toLocaleDateString()}
Venta Original: ${devolucion.numeroVenta}
Cliente: ${devolucion.clienteNombre}

---------------------------------
MOTIVO DE DEVOLUCIÓN
---------------------------------
${devolucion.motivo}

---------------------------------
PRODUCTOS DEVUELTOS
---------------------------------
${devolucion.items.map(item => `
${item.productoNombre}
Talla: ${item.talla} | Color: ${item.color}
Cantidad: ${item.cantidad} x $${item.precioUnitario.toLocaleString()}
Subtotal: $${item.subtotal.toLocaleString()}
`).join('\n')}

---------------------------------
TOTAL A DEVOLVER
---------------------------------
$${devolucion.total.toLocaleString()}

=================================
DAMABELLA - Moda Femenina
=================================
    `.trim();

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${devolucion.numeroDevolucion}.txt`;
    a.click();
  };

  const anularDevolucion = (id: number) => {
    const updated = devoluciones.map(d => 
      d.id === id ? { ...d, estadoGestion: 'Anulado' as const, fechaAnulacion: new Date().toISOString() } : d
    );
    setDevoluciones(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setShowConfirmModal(false);
    setShowNotificationModal(true);
    setNotificationMessage('Devolución anulada correctamente');
    setNotificationType('success');
  };

  // 🔒 NUEVA FUNCIÓN: Crear historial unificado de devoluciones y cambios
  const getHistorialUnificado = () => {
    // 🔒 CRÍTICO: SOLO mostrar devoluciones, NO cambios
    // Los cambios deben estar SOLO en el módulo de Cambios
    const historial: any[] = [];

    // ✅ Agregar SOLO devoluciones reales
    devoluciones.forEach((dev) => {
      historial.push({
        id: dev.id,
        tipo: 'DEVOLUCIÓN',  // Marcador de tipo
        numero: dev.numeroDevolucion,
        numeroVenta: dev.numeroVenta,
        clienteNombre: dev.clienteNombre,
        fecha: dev.fechaDevolucion || dev.createdAt,
        estado: dev.estadoGestion,
        total: dev.total,
        motivo: dev.motivo,
        items: dev.items,
        datos: dev,  // Guardar datos completos
      });
    });

    // ❌ NO agregar cambios aquí - Los cambios deben estar en su propio módulo
    // cambios.forEach(...) - ELIMINADO INTENCIONALMENTE

    // Ordenar por fecha descendente
    return historial.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  const normalize = (s: any) =>
    String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const onlyDigits = (s: any) => String(s ?? '').replace(/[^\d]/g, '');

  // 🔒 NUEVO: Filtro para historial unificado
  const historialCompleto = getHistorialUnificado();
  const filteredHistorial = historialCompleto.filter((h) => {
    const q = normalize(searchTerm);
    const qDigits = onlyDigits(searchTerm);

    const matchNumero = normalize(h.numero).includes(q);
    const matchVenta = normalize(h.numeroVenta).includes(q);
    const matchCliente = normalize(h.clienteNombre).includes(q);
    const matchEstado = normalize(h.estado).includes(q);
    const matchTipo = normalize(h.tipo).includes(q);  // Buscar por tipo (DEVOLUCIÓN o CAMBIO)
    const matchMotivo = h.motivo ? normalize(h.motivo).includes(q) : false;

    const matchFecha = h.fecha
      ? new Date(h.fecha).toLocaleDateString().includes(searchTerm)
      : false;

    // Buscar por productos si es devolución
    const matchProducto = h.items?.some((item: any) =>
      normalize(item.productoNombre).includes(q) ||
      normalize(item.talla).includes(q) ||
      normalize(item.color).includes(q)
    ) || false;

    const totalDigits = onlyDigits(h.total);
    const matchTotal = qDigits.length > 0 ? totalDigits.includes(qDigits) : false;

    return (
      matchNumero ||
      matchVenta ||
      matchCliente ||
      matchEstado ||
      matchTipo ||
      matchMotivo ||
      matchFecha ||
      matchProducto ||
      matchTotal
    );
  });

  const descargarExcel = () => {
    if (filteredHistorial.length === 0) {
      setShowNotificationModal(true);
      setNotificationMessage('No hay registros para descargar');
      setNotificationType('info');
      return;
    }

    const datosExcel = filteredHistorial.map(h => ({
      'Tipo': h.tipo,
      'Número': h.numero,
      'Venta Original': h.numeroVenta,
      'Cliente': h.clienteNombre,
      'Descripción': h.motivo || 'Cambio de producto',
      'Estado': h.estado,
      'Monto': `$${h.total?.toLocaleString() || '0'}`,
      'Fecha': new Date(h.fecha).toLocaleDateString(),
    }));

    const headers = Object.keys(datosExcel[0] || {});
    const csvContent = [
      headers.join(','),
      ...datosExcel.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          const stringValue = String(value || '');
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devoluciones_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    setShowNotificationModal(true);
    setNotificationMessage('Reporte de devoluciones descargado correctamente');
    setNotificationType('success');
  };


  const generarNumeroDevolucion = () => {
    // 1) Si ya existe contador, úsalo
    const storedCounter = parseInt(localStorage.getItem(DEVOLUCION_COUNTER_KEY) || '', 10);
    if (!isNaN(storedCounter) && storedCounter > 0) {
      const numero = `DEV-${String(storedCounter).padStart(3, '0')}`;
      localStorage.setItem(DEVOLUCION_COUNTER_KEY, String(storedCounter + 1));
      return numero;
    }

    // 2) Si NO hay contador, inicialízalo basado SOLO en DEV-XXX (3 dígitos)
    const maxBonito = (devoluciones || []).reduce((max, d) => {
      const num = d?.numeroDevolucion;
      if (!num) return max;

      // SOLO acepta DEV-001, DEV-002... (3 dígitos)
      const match = num.match(/^DEV-(\d{3})$/);
      if (!match) return max;

      const n = parseInt(match[1], 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);

    // 3) Si no hay “bonitos”, usa un arranque seguro (por cantidad)
    const inicioSeguro = maxBonito > 0 ? maxBonito + 1 : (devoluciones?.length || 0) + 1;

    localStorage.setItem(DEVOLUCION_COUNTER_KEY, String(inicioSeguro + 1));
    return `DEV-${String(inicioSeguro).padStart(3, '0')}`;
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Historial de Devoluciones y Cambios</h2>
          <p className="text-gray-600">Visualiza todas tus devoluciones y cambios (creados desde Ventas)</p>
        </div>
        <div className="flex gap-2">
          {devoluciones.length > 0 && (
            <button
              onClick={descargarExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              Excel
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar por número de devolución, venta o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Info Card */}
      {devoluciones.length === 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <RotateCcw className="text-purple-600 mt-1" size={24} />
            <div>
              <h3 className="text-purple-900 mb-1">¿Cómo crear devoluciones?</h3>
              <p className="text-purple-700 text-sm">
                Haz clic en el botón <strong>"Nueva Devolución"</strong> en la esquina superior derecha para crear una nueva devolución. 
                Selecciona una venta, los productos y el motivo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Devoluciones Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-gray-600 text-sm">Tipo</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm">Número</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm">Venta Original</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm">Cliente</th>
                <th className="text-center py-3 px-4 text-gray-600 text-sm">Estado</th>
                <th className="text-right py-3 px-4 text-gray-600 text-sm">Monto</th>
                <th className="text-center py-3 px-4 text-gray-600 text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredHistorial.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <RotateCcw className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron devoluciones ni cambios</p>
                    <p className="text-sm mt-2">Crea devoluciones y cambios desde el módulo de Ventas</p>
                  </td>
                </tr>
              ) : (
                filteredHistorial.map((h) => (
                  <tr key={`${h.tipo}-${h.id}`} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        h.tipo === 'DEVOLUCIÓN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {h.tipo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {h.tipo === 'DEVOLUCIÓN' ? '📦' : '♻️'}
                        </span>
                        <div className="text-gray-900 font-medium text-sm">{h.numero}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600 text-sm">{h.numeroVenta}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{h.clienteNombre}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          h.estado === 'Anulado' ? 'bg-red-100 text-red-700' :
                          h.estado === 'Reparado' ? 'bg-blue-100 text-blue-700' :
                          h.estado === 'Cambiado' ? 'bg-green-100 text-green-700' :
                          h.estado === 'Enviado a reparación' ? 'bg-yellow-100 text-yellow-700' :
                          h.estado === 'Aplicada' || h.estado === 'Aplicado' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {h.estado}
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900 font-medium text-sm">
                      ${h.total?.toLocaleString() || '0'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (h.tipo === 'DEVOLUCIÓN') {
                            setViewingDevolucion(h.datos);
                          } else {
                            setViewingDevolucion(h.datos);  // También mostrar cambios en modal
                          }
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                        title="Ver detalles completos"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalle */}
      {viewingDevolucion && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Detalle Devolución ${viewingDevolucion.numeroDevolucion}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div>
                <div className="text-sm text-purple-600 mb-1">Número de Devolución</div>
                <div className="text-purple-900 font-medium">{viewingDevolucion.numeroDevolucion}</div>
              </div>
              <div>
                <div className="text-sm text-purple-600 mb-1">Venta Original</div>
                <div className="text-purple-900 font-medium">{viewingDevolucion.numeroVenta}</div>
              </div>
              <div>
                <div className="text-sm text-purple-600 mb-1">Cliente</div>
                <div className="text-purple-900 font-medium">{viewingDevolucion.clienteNombre}</div>
              </div>
              <div>
                <div className="text-sm text-purple-600 mb-1">Fecha de Devolución</div>
                <div className="text-purple-900 font-medium">
                  {new Date(viewingDevolucion.fechaDevolucion).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-purple-600 mb-1">Estado de Gestión</div>
                <div className={`px-2 py-1 rounded font-medium text-xs inline-block ${
                  viewingDevolucion.estadoGestion === 'Anulado' ? 'bg-red-100 text-red-700' :
                  viewingDevolucion.estadoGestion === 'Reparado' ? 'bg-blue-100 text-blue-700' :
                  viewingDevolucion.estadoGestion === 'Cambiado' ? 'bg-green-100 text-green-700' :
                  viewingDevolucion.estadoGestion === 'Enviado a reparación' ? 'bg-yellow-100 text-yellow-700' :
                  viewingDevolucion.estadoGestion === 'Aplicada' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {viewingDevolucion.estadoGestion}
                </div>
              </div>
              {viewingDevolucion.fechaAnulacion && (
                <div>
                  <div className="text-sm text-purple-600 mb-1">Fecha de Anulación</div>
                  <div className="text-purple-900 font-medium">
                    {new Date(viewingDevolucion.fechaAnulacion).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Motivo de la Devolución</div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 font-medium">
                {viewingDevolucion.motivo}
              </div>
            </div>

            <div>
              <h4 className="text-gray-900 font-medium mb-3">Productos Devueltos</h4>
              <div className="space-y-2">
                {viewingDevolucion.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex justify-between mb-1">
                      <div className="text-gray-900 font-medium">{item.productoNombre}</div>
                      <div className="text-gray-900 font-medium">${item.subtotal.toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Talla: {item.talla} | Color: {item.color} | Cantidad: {item.cantidad} x ${item.precioUnitario.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {viewingDevolucion.productoNuevo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-600 mb-2 font-medium">Producto de Cambio</div>
                <div className="text-green-900 font-medium mb-2">{viewingDevolucion.productoNuevo.nombre}</div>
                <div className="text-sm text-green-700">Precio: ${viewingDevolucion.productoNuevo.precio.toLocaleString()}</div>
              </div>
            )}

            {(() => {
            const saldoAFavorNum = Number(viewingDevolucion.saldoAFavor ?? 0);
            const diferenciaPagarNum = Number(viewingDevolucion.diferenciaPagar ?? 0);

            if (saldoAFavorNum <= 0 && diferenciaPagarNum <= 0) return null;

            return (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="font-medium text-blue-900">Balance Financiero</div>

                {saldoAFavorNum > 0 && (
                  <div className="flex justify-between text-sm text-blue-700">
                    <span>Saldo a Favor:</span>
                    <span className="font-medium text-green-600">
                      ${saldoAFavorNum.toLocaleString()}
                    </span>
                  </div>
                )}

                {diferenciaPagarNum > 0 && (
                  <div className="flex justify-between text-sm text-blue-700">
                    <span>Diferencia a Pagar:</span>
                    <span className="font-medium text-red-600">
                      ${diferenciaPagarNum.toLocaleString()}
                    </span>
                  </div>
                )}

                {diferenciaPagarNum > 0 && viewingDevolucion.medioPagoExcedente && (
                  <div className="flex justify-between text-sm text-blue-700">
                    <span>Medio pago excedente:</span>
                    <span className="font-medium">{viewingDevolucion.medioPagoExcedente}</span>
                  </div>
                )}
              </div>
            );
          })()}


            <div className="border-t pt-4 bg-purple-50 rounded-lg p-4">
              <div className="flex justify-between text-purple-900 font-medium">
                <span>Total a Devolver:</span>
                <span>${viewingDevolucion.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => descargarComprobante(viewingDevolucion)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Download size={16} />
                Descargar Comprobante
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Notificación */}
      {showNotificationModal && (
        <Modal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          title=""
        >
          <div className="space-y-4 text-center py-6">
            <div className="flex justify-center">
              {notificationType === 'success' && (
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
              )}
              {notificationType === 'error' && (
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={32} />
                </div>
              )}
              {notificationType === 'info' && (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <AlertCircle className="text-blue-600" size={32} />
                </div>
              )}
            </div>
            <p className="text-gray-900 font-medium text-lg">{notificationMessage}</p>
            <button
              onClick={() => setShowNotificationModal(false)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Aceptar
            </button>
          </div>
        </Modal>
      )}

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirmar acción"
        >
          <div className="space-y-4 py-4">
            <p className="text-gray-700">{confirmMessage}</p>
            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (confirmAction) {
                    confirmAction();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}





