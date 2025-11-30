import React, { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, Eye, Ban, RotateCcw, X, UserPlus, Download, ShoppingBag } from 'lucide-react';
import { Button, Input, Modal } from '../../../../shared/components/native';

const STORAGE_KEY = 'damabella_ventas';
const CLIENTES_KEY = 'damabella_clientes';
const PRODUCTOS_KEY = 'damabella_productos';
const DEVOLUCIONES_KEY = 'damabella_devoluciones';

interface ItemVenta {
  id: string;
  productoId: string;
  productoNombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Venta {
  id: number;
  numeroVenta: string;
  clienteId: string;
  clienteNombre: string;
  fechaVenta: string;
  estado: 'Completada' | 'Anulada';
  items: ItemVenta[];
  subtotal: number;
  iva: number;
  total: number;
  metodoPago: string;
  observaciones: string;
  anulada: boolean;
  motivoAnulacion?: string;
  createdAt: string;
}

export default function VentasManager() {
  const [ventas, setVentas] = useState<Venta[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [clientes, setClientes] = useState(() => {
    const stored = localStorage.getItem(CLIENTES_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [productos, setProductos] = useState(() => {
    const stored = localStorage.getItem(PRODUCTOS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [viewingVenta, setViewingVenta] = useState<Venta | null>(null);
  const [ventaToAnular, setVentaToAnular] = useState<Venta | null>(null);
  const [ventaToDevolver, setVentaToDevolver] = useState<Venta | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteSearchTerm, setClienteSearchTerm] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  
  const [formData, setFormData] = useState({
    clienteId: '',
    fechaVenta: new Date().toISOString().split('T')[0],
    metodoPago: 'Efectivo',
    observaciones: '',
    items: [] as ItemVenta[]
  });

  const [formErrors, setFormErrors] = useState<any>({});

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    tipoDoc: 'CC',
    numeroDoc: '',
    telefono: '',
    email: '',
    direccion: ''
  });

  const [clienteErrors, setClienteErrors] = useState<any>({});

  const [nuevoItem, setNuevoItem] = useState({
    productoId: '',
    talla: '',
    color: '',
    cantidad: '1',
    precioUnitario: ''
  });

  const [devolucionData, setDevolucionData] = useState({
    motivo: '',
    itemsDevueltos: [] as { itemId: string; cantidad: number }[]
  });

  // Contador para el número de venta
  const [ventaCounter, setVentaCounter] = useState(() => {
    const counter = localStorage.getItem('damabella_venta_counter');
    return counter ? parseInt(counter) : 1;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ventas));
  }, [ventas]);

  useEffect(() => {
    localStorage.setItem('damabella_venta_counter', ventaCounter.toString());
  }, [ventaCounter]);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedProductos = localStorage.getItem(PRODUCTOS_KEY);
      const storedClientes = localStorage.getItem(CLIENTES_KEY);
      const storedVentas = localStorage.getItem(STORAGE_KEY);
      if (storedProductos) setProductos(JSON.parse(storedProductos));
      if (storedClientes) setClientes(JSON.parse(storedClientes));
      if (storedVentas) setVentas(JSON.parse(storedVentas));
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('salesUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('salesUpdated', handleStorageChange);
    };
  }, []);

  const generarNumeroVenta = () => {
    const numeroVenta = `VEN-${ventaCounter.toString().padStart(3, '0')}`;
    return numeroVenta;
  };

  const calcularTotales = (items: ItemVenta[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  const validateField = (field: string, value: any) => {
    const errors: any = {};
    
    if (field === 'clienteId') {
      if (!value) {
        errors.clienteId = 'Debes seleccionar un cliente';
      }
    }
    
    return errors;
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    const fieldErrors = validateField(field, value);
    setFormErrors({ ...formErrors, [field]: fieldErrors[field] });
  };

  const validateClienteField = (field: string, value: string) => {
    const errors: any = {};
    
    if (field === 'nombre') {
      if (!value.trim()) {
        errors.nombre = 'Este campo es obligatorio';
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        errors.nombre = 'Solo se permiten letras y espacios';
      }
    }
    
    if (field === 'numeroDoc') {
      if (!value.trim()) {
        errors.numeroDoc = 'Este campo es obligatorio';
      } else if (!/^\d{6,12}$/.test(value)) {
        errors.numeroDoc = 'Debe tener entre 6 y 12 dígitos';
      }
    }
    
    if (field === 'telefono') {
      if (!value.trim()) {
        errors.telefono = 'Este campo es obligatorio';
      } else if (!/^\d{10}$/.test(value)) {
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

  const handleClienteFieldChange = (field: string, value: string) => {
    // Solo permitir números en documento y teléfono
    if (field === 'numeroDoc' || field === 'telefono') {
      value = value.replace(/\D/g, '');
    }
    
    setNuevoCliente({ ...nuevoCliente, [field]: value });
    const fieldErrors = validateClienteField(field, value);
    setClienteErrors({ ...clienteErrors, [field]: fieldErrors[field] });
  };

  const handleCreate = () => {
    setFormData({
      clienteId: '',
      fechaVenta: new Date().toISOString().split('T')[0],
      metodoPago: 'Efectivo',
      observaciones: '',
      items: []
    });
    setNuevoItem({
      productoId: '',
      talla: '',
      color: '',
      cantidad: '1',
      precioUnitario: ''
    });
    setClienteSearchTerm('');
    setFormErrors({});
    setShowModal(true);
  };

  const handleSelectCliente = (clienteId: string, clienteNombre: string) => {
    setFormData({ ...formData, clienteId });
    setClienteSearchTerm(clienteNombre);
    setShowClienteDropdown(false);
    setFormErrors({ ...formErrors, clienteId: undefined });
  };

  const filteredClientes = clientes.filter((c: any) => 
    c.nombre.toLowerCase().includes(clienteSearchTerm.toLowerCase()) ||
    c.numeroDoc.includes(clienteSearchTerm)
  );

  const getProductoSeleccionado = () => {
    return productos.find((p: any) => p.id.toString() === nuevoItem.productoId);
  };

  const getTallasDisponibles = () => {
    const producto = getProductoSeleccionado();
    if (!producto || !producto.variantes) return [];
    return producto.variantes.map((v: any) => v.talla);
  };

  const getColoresDisponibles = () => {
    const producto = getProductoSeleccionado();
    if (!producto || !producto.variantes || !nuevoItem.talla) return [];
    const variante = producto.variantes.find((v: any) => v.talla === nuevoItem.talla);
    if (!variante) return [];
    return variante.colores.map((c: any) => c.color);
  };

  const agregarItem = () => {
    if (!nuevoItem.productoId || !nuevoItem.talla || !nuevoItem.color || !nuevoItem.cantidad) {
      alert('Completa todos los campos del producto');
      return;
    }

    const producto = productos.find((p: any) => p.id.toString() === nuevoItem.productoId);
    if (!producto) return;

    const cantidad = parseInt(nuevoItem.cantidad);
    const precioUnitario = producto.precioVenta;
    const subtotal = cantidad * precioUnitario;

    const item: ItemVenta = {
      id: Date.now().toString(),
      productoId: nuevoItem.productoId,
      productoNombre: producto.nombre,
      talla: nuevoItem.talla,
      color: nuevoItem.color,
      cantidad,
      precioUnitario,
      subtotal
    };

    setFormData({
      ...formData,
      items: [...formData.items, item]
    });

    setNuevoItem({
      productoId: '',
      talla: '',
      color: '',
      cantidad: '1',
      precioUnitario: ''
    });
  };

  const eliminarItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== itemId)
    });
  };

  const handleSave = () => {
    // Validar
    const allErrors: any = {};
    const fieldErrors = validateField('clienteId', formData.clienteId);
    if (fieldErrors.clienteId) {
      allErrors.clienteId = fieldErrors.clienteId;
    }

    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    if (formData.items.length === 0) {
      alert('Agrega al menos un producto');
      return;
    }

    const cliente = clientes.find((c: any) => c.id.toString() === formData.clienteId);
    if (!cliente) {
      alert('Cliente no encontrado');
      return;
    }

    const totales = calcularTotales(formData.items);
    const numeroVenta = generarNumeroVenta();

    const ventaData: Venta = {
      id: Date.now(),
      numeroVenta,
      clienteId: formData.clienteId,
      clienteNombre: cliente.nombre,
      fechaVenta: formData.fechaVenta,
      estado: 'Completada',
      items: formData.items,
      subtotal: totales.subtotal,
      iva: totales.iva,
      total: totales.total,
      metodoPago: formData.metodoPago,
      observaciones: formData.observaciones,
      anulada: false,
      createdAt: new Date().toISOString()
    };

    setVentas([...ventas, ventaData]);
    setVentaCounter(ventaCounter + 1);
    setShowModal(false);
  };

  const handleAnular = () => {
    if (!ventaToAnular || !motivoAnulacion.trim()) {
      alert('Debes ingresar un motivo de anulación');
      return;
    }

    setVentas(ventas.map(v => 
      v.id === ventaToAnular.id 
        ? { ...v, estado: 'Anulada', anulada: true, motivoAnulacion }
        : v
    ));

    setShowAnularModal(false);
    setVentaToAnular(null);
    setMotivoAnulacion('');
  };

  const handleCrearCliente = () => {
    if (!nuevoCliente.nombre || !nuevoCliente.numeroDoc || !nuevoCliente.telefono) {
      alert('Completa los campos obligatorios');
      return;
    }

    const clienteData = {
      id: Date.now(),
      ...nuevoCliente,
      activo: true,
      createdAt: new Date().toISOString()
    };

    const clientesActuales = JSON.parse(localStorage.getItem(CLIENTES_KEY) || '[]');
    localStorage.setItem(CLIENTES_KEY, JSON.stringify([...clientesActuales, clienteData]));
    
    setClientes([...clientes, clienteData]);
    setFormData({ ...formData, clienteId: clienteData.id.toString() });
    setClienteSearchTerm(clienteData.nombre);
    setShowClienteModal(false);
    setNuevoCliente({
      nombre: '',
      tipoDoc: 'CC',
      numeroDoc: '',
      telefono: '',
      email: '',
      direccion: ''
    });
  };

  const handleCrearDevolucion = () => {
    if (!ventaToDevolver || !devolucionData.motivo.trim()) {
      alert('Debes ingresar un motivo de devolución');
      return;
    }

    if (devolucionData.itemsDevueltos.length === 0) {
      alert('Debes seleccionar al menos un producto para devolver');
      return;
    }

    const devoluciones = JSON.parse(localStorage.getItem(DEVOLUCIONES_KEY) || '[]');
    const numeroDevolucion = `DEV-${(devoluciones.length + 1).toString().padStart(3, '0')}`;

    // Calcular items devueltos con sus detalles
    const itemsDevueltos = devolucionData.itemsDevueltos.map(itemDev => {
      const itemOriginal = ventaToDevolver.items.find(i => i.id === itemDev.itemId);
      if (!itemOriginal) return null;

      return {
        id: Date.now().toString() + Math.random(),
        productoNombre: itemOriginal.productoNombre,
        talla: itemOriginal.talla,
        color: itemOriginal.color,
        cantidad: itemDev.cantidad,
        precioUnitario: itemOriginal.precioUnitario,
        subtotal: itemDev.cantidad * itemOriginal.precioUnitario
      };
    }).filter(Boolean);

    const totalDevolucion = itemsDevueltos.reduce((sum: number, item: any) => sum + item.subtotal, 0);

    const nuevaDevolucion = {
      id: Date.now(),
      numeroDevolucion,
      ventaId: ventaToDevolver.id,
      numeroVenta: ventaToDevolver.numeroVenta,
      clienteId: ventaToDevolver.clienteId,
      clienteNombre: ventaToDevolver.clienteNombre,
      fechaDevolucion: new Date().toISOString().split('T')[0],
      motivo: devolucionData.motivo,
      items: itemsDevueltos,
      total: totalDevolucion,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(DEVOLUCIONES_KEY, JSON.stringify([...devoluciones, nuevaDevolucion]));

    // Actualizar saldo a favor del cliente
    const clientesActualizados = clientes.map((c: any) => {
      if (c.id.toString() === ventaToDevolver.clienteId) {
        return {
          ...c,
          saldoAFavor: (c.saldoAFavor || 0) + totalDevolucion
        };
      }
      return c;
    });
    localStorage.setItem(CLIENTES_KEY, JSON.stringify(clientesActualizados));
    setClientes(clientesActualizados);

    setShowDevolucionModal(false);
    setVentaToDevolver(null);
    setDevolucionData({ motivo: '', itemsDevueltos: [] });
    
    alert(`Devolución ${numeroDevolucion} creada exitosamente.\nSaldo a favor generado: $${totalDevolucion.toLocaleString()}`);
  };

  const handleToggleItemDevolucion = (itemId: string, cantidad: number) => {
    const existingIndex = devolucionData.itemsDevueltos.findIndex(i => i.itemId === itemId);
    
    if (existingIndex >= 0) {
      // Si ya existe, actualizar cantidad o remover si es 0
      if (cantidad === 0) {
        setDevolucionData({
          ...devolucionData,
          itemsDevueltos: devolucionData.itemsDevueltos.filter(i => i.itemId !== itemId)
        });
      } else {
        const newItems = [...devolucionData.itemsDevueltos];
        newItems[existingIndex] = { itemId, cantidad };
        setDevolucionData({
          ...devolucionData,
          itemsDevueltos: newItems
        });
      }
    } else if (cantidad > 0) {
      // Agregar nuevo
      setDevolucionData({
        ...devolucionData,
        itemsDevueltos: [...devolucionData.itemsDevueltos, { itemId, cantidad }]
      });
    }
  };

  const descargarComprobante = (venta: Venta) => {
    const contenido = `
=================================
COMPROBANTE DE VENTA
${venta.numeroVenta}
=================================

Fecha: ${new Date(venta.fechaVenta).toLocaleDateString()}
Cliente: ${venta.clienteNombre}
Estado: ${venta.estado}

---------------------------------
PRODUCTOS
---------------------------------
${venta.items.map(item => `
${item.productoNombre}
Talla: ${item.talla} | Color: ${item.color}
Cantidad: ${item.cantidad} x $${item.precioUnitario.toLocaleString()}
Subtotal: $${item.subtotal.toLocaleString()}
`).join('\n')}

---------------------------------
TOTALES
---------------------------------
Subtotal: $${venta.subtotal.toLocaleString()}
IVA (19%): $${venta.iva.toLocaleString()}
TOTAL: $${venta.total.toLocaleString()}

Método de Pago: ${venta.metodoPago}

${venta.observaciones ? `Observaciones:\n${venta.observaciones}` : ''}
${venta.anulada ? `\n*** VENTA ANULADA ***\nMotivo: ${venta.motivoAnulacion}` : ''}

=================================
DAMABELLA - Moda Femenina
Gracias por su compra
=================================
    `.trim();

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${venta.numeroVenta}.txt`;
    a.click();
  };

  const filteredVentas = ventas.filter(v =>
    v.numeroVenta.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totales = calcularTotales(formData.items);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Ventas</h2>
          <p className="text-gray-600">Registra y administra las ventas con IVA incluido</p>
        </div>
        <Button onClick={handleCreate} variant="primary">
          <Plus size={20} />
          Nueva Venta
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar por número, cliente o estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Ventas Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-gray-600">Número</th>
                <th className="text-left py-4 px-6 text-gray-600">Cliente</th>
                <th className="text-left py-4 px-6 text-gray-600">Fecha</th>
                <th className="text-right py-4 px-6 text-gray-600">Total</th>
                <th className="text-center py-4 px-6 text-gray-600">Estado</th>
                <th className="text-right py-4 px-6 text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVentas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <ShoppingBag className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron ventas</p>
                  </td>
                </tr>
              ) : (
                filteredVentas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="text-gray-900 font-medium">{venta.numeroVenta}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{venta.clienteNombre}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {new Date(venta.fechaVenta).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right text-gray-900 font-semibold">
                      ${venta.total.toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm ${
                          venta.estado === 'Completada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {venta.estado}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setViewingVenta(venta); setShowDetailModal(true); }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => descargarComprobante(venta)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          title="Descargar"
                        >
                          <Download size={18} />
                        </button>
                        {!venta.anulada && (
                          <>
                            <button
                              onClick={() => { 
                                setVentaToDevolver(venta); 
                                setDevolucionData({ motivo: '', itemsDevueltos: [] });
                                setShowDevolucionModal(true); 
                              }}
                              className="p-2 hover:bg-purple-50 rounded-lg transition-colors text-purple-600"
                              title="Generar devolución"
                            >
                              <RotateCcw size={18} />
                            </button>
                            <button
                              onClick={() => { setVentaToAnular(venta); setShowAnularModal(true); }}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                              title="Anular"
                            >
                              <Ban size={18} />
                            </button>
                          </>
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

      {/* Modal Crear Venta */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva Venta"
        size="lg"
      >
        <div className="space-y-4">
          {/* Cliente con búsqueda */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-700">Cliente *</label>
              <button
                onClick={() => setShowClienteModal(true)}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm"
              >
                <UserPlus size={14} />
                Nuevo Cliente
              </button>
            </div>
            <div className="relative">
              <Input
                value={clienteSearchTerm}
                onChange={(e) => {
                  setClienteSearchTerm(e.target.value);
                  setShowClienteDropdown(true);
                  if (!e.target.value) {
                    setFormData({ ...formData, clienteId: '' });
                  }
                }}
                onFocus={() => setShowClienteDropdown(true)}
                placeholder="Buscar cliente..."
                className={formErrors.clienteId ? 'border-red-500' : ''}
              />
              {showClienteDropdown && filteredClientes.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredClientes.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCliente(c.id.toString(), c.nombre)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{c.nombre}</div>
                      <div className="text-sm text-gray-600">{c.numeroDoc} - {c.telefono}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {formErrors.clienteId && (
              <p className="text-red-600 text-xs mt-1">{formErrors.clienteId}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Fecha *</label>
              <Input
                type="date"
                value={formData.fechaVenta}
                onChange={(e) => handleFieldChange('fechaVenta', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Método de Pago *</label>
              <select
                value={formData.metodoPago}
                onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Nequi">Nequi</option>
                <option value="Daviplata">Daviplata</option>
              </select>
            </div>
          </div>

          {/* Productos */}
          <div className="border-t pt-4">
            <h4 className="text-gray-900 mb-3">Agregar Productos</h4>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
              <div>
                <label className="block text-gray-700 mb-2 text-sm">Producto</label>
                <select
                  value={nuevoItem.productoId}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, productoId: e.target.value, talla: '', color: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">Seleccionar producto...</option>
                  {productos.filter((p: any) => p.activo).map((producto: any) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} - ${(producto.precioVenta || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {nuevoItem.productoId && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm">Talla</label>
                      <select
                        value={nuevoItem.talla}
                        onChange={(e) => setNuevoItem({ ...nuevoItem, talla: e.target.value, color: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        <option value="">Seleccionar...</option>
                        {getTallasDisponibles().map(talla => (
                          <option key={talla} value={talla}>{talla}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2 text-sm">Color</label>
                      <select
                        value={nuevoItem.color}
                        onChange={(e) => setNuevoItem({ ...nuevoItem, color: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        disabled={!nuevoItem.talla}
                      >
                        <option value="">Seleccionar...</option>
                        {getColoresDisponibles().map(color => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">Cantidad</label>
                    <Input
                      type="number"
                      min="1"
                      value={nuevoItem.cantidad}
                      onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                </>
              )}

              <Button onClick={agregarItem} variant="secondary" className="w-full">
                <Plus size={16} />
                Agregar Producto
              </Button>
            </div>

            {/* Lista de items */}
            {formData.items.length > 0 && (
              <div className="space-y-2">
                {formData.items.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-white flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-gray-900 font-medium">{item.productoNombre}</div>
                      <div className="text-sm text-gray-600">
                        Talla: {item.talla} | Color: {item.color} | Cant: {item.cantidad} x ${item.precioUnitario.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-gray-900 font-semibold">${item.subtotal.toLocaleString()}</div>
                      <button
                        onClick={() => eliminarItem(item.id)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales */}
          {formData.items.length > 0 && (
            <div className="border-t pt-4 bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>${totales.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>IVA (19%):</span>
                  <span>${totales.iva.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-900 text-lg font-semibold pt-2 border-t">
                  <span>Total:</span>
                  <span>${totales.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-gray-700 mb-2">Observaciones</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows={2}
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={() => setShowModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="primary">
              Crear Venta
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Ver Detalle */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Detalle de Venta ${viewingVenta?.numeroVenta}`}
      >
        {viewingVenta && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-600 mb-1">Cliente</div>
                <div className="text-gray-900 font-medium">{viewingVenta.clienteNombre}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Estado</div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  viewingVenta.estado === 'Completada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {viewingVenta.estado}
                </span>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Fecha</div>
                <div className="text-gray-900">{new Date(viewingVenta.fechaVenta).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Método de Pago</div>
                <div className="text-gray-900">{viewingVenta.metodoPago}</div>
              </div>
            </div>

            {viewingVenta.observaciones && (
              <div>
                <div className="text-gray-600 mb-1">Observaciones</div>
                <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingVenta.observaciones}</div>
              </div>
            )}

            {viewingVenta.anulada && viewingVenta.motivoAnulacion && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-red-700 font-semibold mb-1">Motivo de Anulación</div>
                <div className="text-red-600">{viewingVenta.motivoAnulacion}</div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="text-gray-900 font-semibold mb-3">Productos</h4>
              <div className="space-y-2">
                {viewingVenta.items.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-gray-900 font-medium">{item.productoNombre}</div>
                        <div className="text-sm text-gray-600">
                          Talla: {item.talla} | Color: {item.color}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.cantidad} x ${item.precioUnitario.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-gray-900 font-semibold">${item.subtotal.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span>${viewingVenta.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>IVA (19%):</span>
                <span>${viewingVenta.iva.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-900 text-lg font-semibold pt-2 border-t border-gray-300">
                <span>Total:</span>
                <span>${viewingVenta.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Anular */}
      <Modal
        isOpen={showAnularModal}
        onClose={() => setShowAnularModal(false)}
        title="Anular Venta"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de anular la venta <strong>{ventaToAnular?.numeroVenta}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div>
            <label className="block text-gray-700 mb-2">Motivo de Anulación *</label>
            <textarea
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows={3}
              placeholder="Describe el motivo de la anulación..."
              required
            />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={() => setShowAnularModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleAnular} variant="primary" className="bg-red-600 hover:bg-red-700">
              Anular Venta
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Generar Devolución */}
      <Modal
        isOpen={showDevolucionModal}
        onClose={() => setShowDevolucionModal(false)}
        title={`Generar Devolución - ${ventaToDevolver?.numeroVenta}`}
        size="lg"
      >
        {ventaToDevolver && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">Cliente: <span className="text-gray-900 font-medium">{ventaToDevolver.clienteNombre}</span></div>
              <div className="text-sm text-gray-600">Fecha Venta: <span className="text-gray-900 font-medium">{new Date(ventaToDevolver.fechaVenta).toLocaleDateString()}</span></div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Motivo de Devolución *</label>
              <textarea
                value={devolucionData.motivo}
                onChange={(e) => setDevolucionData({ ...devolucionData, motivo: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                rows={2}
                placeholder="Describe el motivo de la devolución..."
                required
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-gray-900 font-semibold mb-3">Seleccionar Productos a Devolver</h4>
              <div className="space-y-2">
                {ventaToDevolver.items.map((item) => {
                  const itemDevuelto = devolucionData.itemsDevueltos.find(i => i.itemId === item.id);
                  const cantidadDevuelta = itemDevuelto?.cantidad || 0;

                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="text-gray-900 font-medium">{item.productoNombre}</div>
                          <div className="text-sm text-gray-600">
                            Talla: {item.talla} | Color: {item.color}
                          </div>
                          <div className="text-sm text-gray-600">
                            Precio: ${item.precioUnitario.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-gray-900 font-semibold">${item.subtotal.toLocaleString()}</div>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <label className="text-sm text-gray-700">Cantidad a devolver:</label>
                        <input
                          type="number"
                          min="0"
                          max={item.cantidad}
                          value={cantidadDevuelta}
                          onChange={(e) => handleToggleItemDevolucion(item.id, parseInt(e.target.value) || 0)}
                          className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                        <span className="text-sm text-gray-600">de {item.cantidad}</span>
                        {cantidadDevuelta > 0 && (
                          <span className="ml-auto text-sm text-green-600 font-medium">
                            Devolución: ${(cantidadDevuelta * item.precioUnitario).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {devolucionData.itemsDevueltos.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-green-700 font-semibold mb-1">Saldo a Favor para el Cliente</div>
                <div className="text-2xl text-green-600 font-bold">
                  ${devolucionData.itemsDevueltos.reduce((sum, itemDev) => {
                    const itemOriginal = ventaToDevolver.items.find(i => i.id === itemDev.itemId);
                    return sum + (itemOriginal ? itemDev.cantidad * itemOriginal.precioUnitario : 0);
                  }, 0).toLocaleString()}
                </div>
                <div className="text-sm text-green-600 mt-1">
                  Este monto se agregará como saldo a favor del cliente
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button onClick={() => setShowDevolucionModal(false)} variant="secondary">
                Cancelar
              </Button>
              <Button onClick={handleCrearDevolucion} variant="primary" className="bg-purple-600 hover:bg-purple-700">
                Generar Devolución
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Nuevo Cliente */}
      <Modal
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        title="Nuevo Cliente"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Nombre *</label>
            <Input
              value={nuevoCliente.nombre}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
              placeholder="Nombre completo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Tipo Doc *</label>
              <select
                value={nuevoCliente.tipoDoc}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipoDoc: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="TI">TI</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Número Doc *</label>
              <Input
                value={nuevoCliente.numeroDoc}
                onChange={(e) => handleClienteFieldChange('numeroDoc', e.target.value)}
                placeholder="123456789"
                required
              />
              {clienteErrors.numeroDoc && (
                <p className="text-red-600 text-xs mt-1">{clienteErrors.numeroDoc}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Teléfono *</label>
              <Input
                value={nuevoCliente.telefono}
                onChange={(e) => handleClienteFieldChange('telefono', e.target.value)}
                placeholder="3001234567"
                required
              />
              {clienteErrors.telefono && (
                <p className="text-red-600 text-xs mt-1">{clienteErrors.telefono}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Email</label>
              <Input
                type="email"
                value={nuevoCliente.email}
                onChange={(e) => handleClienteFieldChange('email', e.target.value)}
                placeholder="cliente@ejemplo.com"
              />
              {clienteErrors.email && (
                <p className="text-red-600 text-xs mt-1">{clienteErrors.email}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Dirección</label>
            <Input
              value={nuevoCliente.direccion}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
              placeholder="Calle 123 # 45-67"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={() => setShowClienteModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleCrearCliente} variant="primary">
              Crear Cliente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
