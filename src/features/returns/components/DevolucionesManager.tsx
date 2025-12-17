import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Eye, Download, FileText, AlertCircle, CheckCircle, Trash2, Plus } from 'lucide-react';
import { Input, Modal, Button } from '../../../shared/components/native';

const STORAGE_KEY = 'damabella_devoluciones';
const VENTAS_KEY = 'damabella_ventas';
const PRODUCTOS_KEY = 'damabella_productos';

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
  estadoGestion: 'Pendiente' | 'Enviado a reparación' | 'Reparado' | 'Cambiado' | 'Anulado';
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
  
  // Estados para crear nueva devolución
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<any>(null);
  const [formMotivo, setFormMotivo] = useState<'Defectuoso' | 'Talla incorrecta' | 'Color incorrecto' | 'Producto equivocado' | 'Otro'>('Defectuoso');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedDevoluciones = localStorage.getItem(STORAGE_KEY);
      const storedVentas = localStorage.getItem(VENTAS_KEY);
      const storedProductos = localStorage.getItem(PRODUCTOS_KEY);
      if (storedDevoluciones) setDevoluciones(JSON.parse(storedDevoluciones));
      if (storedVentas) setVentas(JSON.parse(storedVentas));
      if (storedProductos) setProductos(JSON.parse(storedProductos));
    };
    
    handleStorageChange(); // Load initial data
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  const descargarExcel = () => {
    if (filteredDevoluciones.length === 0) {
      setShowNotificationModal(true);
      setNotificationMessage('No hay devoluciones para descargar');
      setNotificationType('info');
      return;
    }

    const datosExcel = filteredDevoluciones.map(d => ({
      'Número Devolución': d.numeroDevolucion,
      'Venta Original': d.numeroVenta,
      'Cliente': d.clienteNombre,
      'Motivo': d.motivo,
      'Estado': d.estadoGestion,
      'Producto Cambio': d.productoNuevo ? d.productoNuevo.nombre : '—',
      'Saldo a Favor': d.saldoAFavor ? `$${d.saldoAFavor}` : '—',
      'Diferencia a Pagar': d.diferenciaPagar ? `$${d.diferenciaPagar}` : '—',
      'Fecha': new Date(d.fechaDevolucion).toLocaleDateString(),
      'Total': `$${d.total.toLocaleString()}`
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

  const crearDevolucion = () => {
    if (!selectedVenta || selectedItems.length === 0) {
      setShowNotificationModal(true);
      setNotificationMessage('Debes seleccionar una venta y al menos un producto');
      setNotificationType('error');
      return;
    }

    // Calcular número de devolución
    const nuevoNumero = `DEV-${Date.now()}`;
    
    // Obtener items seleccionados de la venta
    const itemsDevolucion = selectedVenta.items.filter((item: any) => 
      selectedItems.includes(item.id)
    ).map((item: any) => ({
      id: item.id,
      productoNombre: item.productoNombre,
      talla: item.talla,
      color: item.color,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal: item.subtotal
    }));

    // Calcular total
    const totalDevolucion = itemsDevolucion.reduce((sum: number, item: any) => sum + item.subtotal, 0);

    // Crear nueva devolución
    const nuevaDevolucion: Devolucion = {
      id: Date.now(),
      numeroDevolucion: nuevoNumero,
      ventaId: selectedVenta.id,
      numeroVenta: selectedVenta.numero,
      clienteNombre: selectedVenta.clienteNombre,
      fechaDevolucion: formFecha,
      motivo: formMotivo,
      items: itemsDevolucion,
      total: totalDevolucion,
      createdAt: new Date().toISOString(),
      estadoGestion: 'Pendiente',
      productoNuevo: null,
      saldoAFavor: 0,
      diferenciaPagar: 0,
      fechaAnulacion: undefined
    };

    // Guardar en localStorage
    const updated = [...devoluciones, nuevaDevolucion];
    setDevoluciones(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Cerrar modal y mostrar notificación
    setShowCreateModal(false);
    setSelectedVenta(null);
    setSelectedItems([]);
    setFormMotivo('Defectuoso');
    setFormFecha(new Date().toISOString().split('T')[0]);
    
    setShowNotificationModal(true);
    setNotificationMessage(`Devolución ${nuevoNumero} creada correctamente`);
    setNotificationType('success');
  };

  const filteredDevoluciones = devoluciones.filter(d => {
    const searchLower = searchTerm.toLowerCase();
    const matchNumero = d.numeroDevolucion?.toLowerCase?.().includes(searchLower) || false;
    const matchVenta = d.numeroVenta?.toLowerCase?.().includes(searchLower) || false;
    const matchCliente = d.clienteNombre?.toLowerCase?.().includes(searchLower) || false;
    const matchMotivo = d.motivo?.toLowerCase?.().includes(searchLower) || false;
    const matchEstado = d.estadoGestion?.toLowerCase?.().includes(searchLower) || false;
    const matchFecha = d.fechaDevolucion ? new Date(d.fechaDevolucion).toLocaleDateString().includes(searchTerm) : false;
    const matchProducto = d.items?.some(item => item.productoNombre?.toLowerCase?.().includes(searchLower)) || false;
    const matchProductoNuevo = d.productoNuevo ? d.productoNuevo.nombre?.toLowerCase?.().includes(searchLower) : false;
    
    return matchNumero || matchVenta || matchCliente || matchMotivo || matchEstado || matchFecha || matchProducto || matchProductoNuevo;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Devoluciones</h2>
          <p className="text-gray-600">Crea y gestiona todas tus devoluciones</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={16} />
            Nueva Devolución
          </button>
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
                <th className="text-left py-4 px-6 text-gray-600">Número</th>
                <th className="text-left py-4 px-6 text-gray-600">Venta Original</th>
                <th className="text-left py-4 px-6 text-gray-600">Cliente</th>
                <th className="text-left py-4 px-6 text-gray-600">Motivo</th>
                <th className="text-center py-4 px-6 text-gray-600">Estado</th>
                <th className="text-center py-4 px-6 text-gray-600">Cambio</th>
                <th className="text-right py-4 px-6 text-gray-600">Total</th>
                <th className="text-right py-4 px-6 text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDevoluciones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <RotateCcw className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron devoluciones</p>
                    <p className="text-sm mt-2">Crea devoluciones desde el módulo de Ventas</p>
                  </td>
                </tr>
              ) : (
                filteredDevoluciones.map((devolucion) => (
                  <tr key={devolucion.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 rounded-full">
                          <RotateCcw size={16} />
                        </span>
                        <div className="text-gray-900">{devolucion.numeroDevolucion}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-600">{devolucion.numeroVenta}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{devolucion.clienteNombre}</td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600 max-w-xs truncate" title={devolucion.motivo}>
                        {devolucion.motivo}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          devolucion.estadoGestion === 'Anulado' ? 'bg-red-100 text-red-700' :
                          devolucion.estadoGestion === 'Reparado' ? 'bg-blue-100 text-blue-700' :
                          devolucion.estadoGestion === 'Cambiado' ? 'bg-green-100 text-green-700' :
                          devolucion.estadoGestion === 'Enviado a reparación' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {devolucion.estadoGestion}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        {devolucion.productoNuevo ? (
                          <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200">
                            ✓ {devolucion.productoNuevo.nombre}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-gray-900">
                      ${devolucion.total.toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setViewingDevolucion(devolucion); setShowDetailModal(true); }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => descargarComprobante(devolucion)}
                          className="p-2 hover:bg-purple-50 rounded-lg transition-colors text-purple-600"
                          title="Descargar comprobante"
                        >
                          <Download size={18} />
                        </button>
                        {devolucion.estadoGestion !== 'Anulado' && (
                          <button
                            onClick={() => { setConfirmMessage(`¿Anular devolución ${devolucion.numeroDevolucion}?`); setConfirmAction(() => () => anularDevolucion(devolucion.id)); setShowConfirmModal(true); }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                            title="Anular devolución"
                          >
                            <Trash2 size={18} />
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

            {(viewingDevolucion.saldoAFavor || viewingDevolucion.diferenciaPagar) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="font-medium text-blue-900">Balance Financiero</div>
                {viewingDevolucion.saldoAFavor && (
                  <div className="flex justify-between text-sm text-blue-700">
                    <span>Saldo a Favor:</span>
                    <span className="font-medium text-green-600">${viewingDevolucion.saldoAFavor.toLocaleString()}</span>
                  </div>
                )}
                {viewingDevolucion.diferenciaPagar && (
                  <div className="flex justify-between text-sm text-blue-700">
                    <span>Diferencia a Pagar:</span>
                    <span className="font-medium text-red-600">${viewingDevolucion.diferenciaPagar.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

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
                    confirmAction()();
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

      {/* Modal Crear Devolución */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedVenta(null);
            setSelectedItems([]);
          }}
          title="Crear Nueva Devolución"
        >
          <div className="space-y-4">
            {/* Seleccionar Venta */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Seleccionar Venta
              </label>
              <select
                value={selectedVenta?.id || ''}
                onChange={(e) => {
                  const ventaId = e.target.value;
                  const venta = ventas.find((v: any) => v.id === parseInt(ventaId));
                  setSelectedVenta(venta || null);
                  setSelectedItems([]);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Selecciona una venta --</option>
                {ventas.map((venta: any) => (
                  <option key={venta.id} value={venta.id}>
                    {venta.numero} - {venta.clienteNombre} - ${venta.total.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Productos de la Venta Seleccionada */}
            {selectedVenta && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Seleccionar Productos
                </label>
                <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {selectedVenta.items && selectedVenta.items.length > 0 ? (
                    selectedVenta.items.map((item: any) => (
                      <label key={item.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, item.id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== item.id));
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{item.productoNombre}</div>
                          <div className="text-xs text-gray-600">
                            Talla: {item.talla} | Color: {item.color} | Cantidad: {item.cantidad} x ${item.precioUnitario.toLocaleString()}
                          </div>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No hay productos en esta venta</p>
                  )}
                </div>
              </div>
            )}

            {/* Motivo de Devolución */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Motivo de Devolución
              </label>
              <select
                value={formMotivo}
                onChange={(e) => setFormMotivo(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Defectuoso">Defectuoso</option>
                <option value="Talla incorrecta">Talla incorrecta</option>
                <option value="Color incorrecto">Color incorrecto</option>
                <option value="Producto equivocado">Producto equivocado</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Fecha de Devolución */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Fecha de Devolución
              </label>
              <input
                type="date"
                value={formFecha}
                onChange={(e) => setFormFecha(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedVenta(null);
                  setSelectedItems([]);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={crearDevolucion}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Crear Devolución
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
