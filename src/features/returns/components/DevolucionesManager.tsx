import React, { useState, useEffect, useMemo } from 'react';
import { Search, RotateCcw, Eye, Download, AlertCircle, CheckCircle, Ban, Plus } from 'lucide-react';
import { Input, Modal, Button } from '../../../shared/components/native';

const STORAGE_KEY = 'damabella_devoluciones';
const VENTAS_KEY = 'damabella_ventas';
const PRODUCTOS_KEY = 'damabella_productos';
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
  const [itemsDevueltos, setItemsDevueltos] = useState<{ itemId: string; cantidad: number }[]>([]);
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0]);
  type MedioPago = 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Nequi' | 'Daviplata';

  const [productoNuevoId, setProductoNuevoId] = useState('');
  const [productoNuevoTalla, setProductoNuevoTalla] = useState('');
  const [productoNuevoColor, setProductoNuevoColor] = useState('');
  const [medioPagoExcedente, setMedioPagoExcedente] = useState<MedioPago>('Efectivo');

  // ✅ Helpers (deben estar en el componente para poder usarlos en el JSX)
  const getProductoNuevoSeleccionado = () =>
    productos.find((p: any) => p.id?.toString() === productoNuevoId?.toString());

  const getTallasDisponiblesCambio = () => {
    const producto = getProductoNuevoSeleccionado();
    if (!producto) return [];
    if (producto.variantes) return producto.variantes.map((v: any) => v.talla);
    return producto.tallas || [];
  };

  const getColoresDisponiblesCambio = () => {
    const producto = getProductoNuevoSeleccionado();
    if (!producto) return [];
    if (producto.variantes && productoNuevoTalla) {
      const variante = producto.variantes.find((v: any) => v.talla === productoNuevoTalla);
      if (!variante) return [];
      return (variante.colores || []).map((c: any) => c.color);
    }
    return producto.colores || [];
  };

  const handleToggleItemDevolucion = (itemId: string, cantidad: number) => {
    setItemsDevueltos((prev) => {
      const idx = prev.findIndex((i) => i.itemId === itemId);

      if (cantidad <= 0) {
        return prev.filter((i) => i.itemId !== itemId);
      }

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { itemId, cantidad };
        return copy;
      }

      return [...prev, { itemId, cantidad }];
    });
  };

  const getCantidadMaximaDevolucion = (item: any) => {
    const cantidadDirecta = Number(item?.cantidad ?? 0);
    if (Number.isFinite(cantidadDirecta) && cantidadDirecta > 0) return cantidadDirecta;

    const subtotal = Number(item?.subtotal ?? 0);
    const precio = Number(item?.precioUnitario ?? 0);
    if (Number.isFinite(subtotal) && Number.isFinite(precio) && precio > 0) {
      const estimada = Math.floor(subtotal / precio);
      if (estimada > 0) return estimada;
    }

    return 1;
  };




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

  const normalize = (s: any) =>
    String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const onlyDigits = (s: any) => String(s ?? '').replace(/[^\d]/g, '');

  const filteredDevoluciones = devoluciones.filter((d) => {
    const q = normalize(searchTerm);
    const qDigits = onlyDigits(searchTerm); // para $100.000, 100000, etc.

    const matchNumero = normalize(d.numeroDevolucion).includes(q);
    const matchVenta = normalize(d.numeroVenta).includes(q);
    const matchCliente = normalize(d.clienteNombre).includes(q);
    const matchMotivo = normalize(d.motivo).includes(q);
    const matchEstado = normalize(d.estadoGestion).includes(q);

    const matchFecha = d.fechaDevolucion
      ? new Date(d.fechaDevolucion).toLocaleDateString().includes(searchTerm)
      : false;

    // ✅ 1) Buscar por productos devueltos
    const matchProductoDevuelto =
      d.items?.some((item) => {
        return (
          normalize(item.productoNombre).includes(q) ||
          normalize(item.talla).includes(q) ||
          normalize(item.color).includes(q)
        );
      }) || false;

    // ✅ 2) Buscar por "Cambio" (producto nuevo: vestido, set, etc)
    const matchCambio =
      (d.productoNuevo && normalize(d.productoNuevo.nombre).includes(q)) ||
      normalize(d.productoNuevoTalla).includes(q) ||
      normalize(d.productoNuevoColor).includes(q);

    // ✅ 3) Buscar por Total (100000 o $100.000)
    const totalDigits = onlyDigits(String(d.total ?? ''));
    const matchTotal = qDigits.length > 0 ? totalDigits.includes(qDigits) : false;

    return (
      matchNumero ||
      matchVenta ||
      matchCliente ||
      matchMotivo ||
      matchEstado ||
      matchFecha ||
      matchProductoDevuelto ||
      matchCambio ||
      matchTotal
    );
  });


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
      'Total': `$${d.total.toLocaleString()}`,
      'Medio Pago Excedente': d.medioPagoExcedente || '—'

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


  const crearDevolucion = () => {
    if (!selectedVenta || itemsDevueltos.length === 0) {
      setShowNotificationModal(true);
      setNotificationMessage('Debes seleccionar una venta y al menos un producto con cantidad > 0');
      setNotificationType('error');
      return;
    }

    if (!productoNuevoId) {
      setShowNotificationModal(true);
      setNotificationMessage('Debes seleccionar la referencia (producto nuevo) por la que se hará el cambio');
      setNotificationType('error');
      return;
    }

    if (!productoNuevoTalla || !productoNuevoColor) {
      setShowNotificationModal(true);
      setNotificationMessage('Debes seleccionar talla y color del producto nuevo');
      setNotificationType('error');
      return;
    }

    // Calcular número de devolución
    const nuevoNumero = generarNumeroDevolucion();

    
    // Obtener items seleccionados de la venta
    const itemsDevolucion = itemsDevueltos
      .map((sel) => {
        const item = selectedVenta.items.find((i: any) => String(i.id) === String(sel.itemId));
        if (!item) return null;

        const cantidadVendida = Number(item.cantidad || 0);
        const cantidad = Math.max(0, Math.min(cantidadVendida, Number(sel.cantidad || 0)));
        if (cantidad <= 0) return null;

        const precioUnitario = Number(item.precioUnitario ?? 0);
        const subtotal = cantidad * precioUnitario;

        return {
          id: String(item.id),
          productoNombre: item.productoNombre,
          talla: item.talla,
          color: item.color,
          cantidad,
          precioUnitario,
          subtotal,
        };
      })
      .filter(Boolean) as any[];

    if (itemsDevolucion.length === 0) {
      setShowNotificationModal(true);
      setNotificationMessage('Debes ingresar una cantidad mayor a 0 en al menos un producto');
      setNotificationType('error');
      return;
    }


    // Calcular total
    const totalDevolucion = itemsDevolucion.reduce(
      (sum: number, item: any) => sum + Number(item.subtotal ?? 0),
      0
    );

    const productoNuevo = productos.find((p: any) => p.id?.toString() === productoNuevoId?.toString());
    if (!productoNuevo) {
      setShowNotificationModal(true);
      setNotificationMessage('Producto de cambio no encontrado');
      setNotificationType('error');
      return;
    }

    const precioProductoNuevo = Number(productoNuevo.precioVenta || 0);
    const diferencia = precioProductoNuevo - totalDevolucion;

    const saldoAFavor = diferencia < 0 ? Math.abs(diferencia) : 0;
    const diferenciaPagar = diferencia > 0 ? diferencia : 0;

    if (diferenciaPagar > 0 && !medioPagoExcedente) {
      setShowNotificationModal(true);
      setNotificationMessage('Debes seleccionar el medio de pago del excedente');
      setNotificationType('error');
      return;
    }


    // Crear nueva devolución
    const nuevaDevolucion: Devolucion = {
      id: Date.now(),
      numeroDevolucion: nuevoNumero,
      ventaId: selectedVenta.id,
      numeroVenta: selectedVenta.numeroVenta ?? selectedVenta.numero,
      clienteNombre: selectedVenta.clienteNombre,
      fechaDevolucion: formFecha,
      motivo: formMotivo,
      items: itemsDevolucion,
      total: totalDevolucion,
      createdAt: new Date().toISOString(),
      estadoGestion: 'Cambiado',
      productoNuevo: {
        id: productoNuevo.id,
        nombre: productoNuevo.nombre,
        precio: precioProductoNuevo,
      },
      productoNuevoTalla,
      productoNuevoColor,
      saldoAFavor,
      diferenciaPagar,
      medioPagoExcedente: diferenciaPagar > 0 ? medioPagoExcedente : undefined,

      fechaAnulacion: undefined
    };

    // Guardar en localStorage
    const updated = [...devoluciones, nuevaDevolucion];
    setDevoluciones(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Cerrar modal y mostrar notificación
    setShowCreateModal(false);
    setSelectedVenta(null);
    setItemsDevueltos([]);
    setFormMotivo('Defectuoso');
    setFormFecha(new Date().toISOString().split('T')[0]);
    setProductoNuevoId('');
    setProductoNuevoTalla('');
    setProductoNuevoColor('');
    setMedioPagoExcedente('Efectivo');

    
    setShowNotificationModal(true);
    setNotificationMessage(`Devolución ${nuevoNumero} creada correctamente`);
    setNotificationType('success');
  };


  const ITEMS_PER_PAGE = 5; // Cambiado a 5 devoluciones por página
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedDevoluciones = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDevoluciones.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredDevoluciones]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredDevoluciones.length / ITEMS_PER_PAGE);
  }, [filteredDevoluciones]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Devoluciones</h2>
          <p className="text-gray-600">Crea y gestiona todas tus devoluciones</p>
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
                Selecciona una venta desde el flujo correspondiente para crear una devolución,
                luego elige los productos y el motivo.
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
              {paginatedDevoluciones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <RotateCcw className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron devoluciones</p>
                    <p className="text-sm mt-2">Crea devoluciones desde el módulo de Ventas</p>
                  </td>
                </tr>
              ) : (
                paginatedDevoluciones.map((devolucion) => (
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
                            onClick={() => { 
                              setConfirmMessage(`¿Anular devolución ${devolucion.numeroDevolucion}?`); 
                              setConfirmAction(() => anularDevolucion(devolucion.id)); 
                              setShowConfirmModal(true); 
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                            title="Anular devolución"
                          >
                            <Ban size={18} />
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-600 rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span>Página {currentPage} de {totalPages}</span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-600 rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Texto informativo */}
      <span className="text-sm text-gray-500">
        {`Mostrando ${Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredDevoluciones.length || 0)} a ${Math.min(currentPage * ITEMS_PER_PAGE, filteredDevoluciones.length)} de ${filteredDevoluciones.length} devoluciones`}
      </span>

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

      {/* Modal Crear Devolución */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedVenta(null);
            setItemsDevueltos([]);
            setProductoNuevoId('');
            setProductoNuevoTalla('');
            setProductoNuevoColor('');
            setMedioPagoExcedente('Efectivo');
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
                  setItemsDevueltos([]);
                }}

                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Selecciona una venta --</option>
                {ventas.map((venta: any) => (
                  <option key={venta.id} value={venta.id}>
                    {venta.numeroVenta ?? venta.numero} - {venta.clienteNombre} - ${venta.total.toLocaleString()}
                  </option>
                ))}
              </select>

              {selectedVenta && (() => {
                const clientes = JSON.parse(localStorage.getItem('damabella_clientes') || '[]');
                const cliente = clientes.find((c: any) => String(c.id) === String(selectedVenta.clienteId));
                const saldoDisponible = Number(cliente?.saldoAFavor || 0);
                return (
                  <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-2">
                    <div className="text-sm text-green-800 font-medium">
                      Saldo disponible: ${saldoDisponible.toLocaleString()}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Productos de la Venta Seleccionada */}
            {selectedVenta && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Seleccionar Productos
                </label>

                {/* 1) Lista de productos (cantidad a devolver por item) */}
                <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                  {selectedVenta.items && selectedVenta.items.length > 0 ? (
                    selectedVenta.items.map((item: any) => {
                      const found = itemsDevueltos.find((i) => i.itemId === String(item.id));
                      const cantidadDevuelta = found?.cantidad || 0;

                      return (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{item.productoNombre}</div>
                              <div className="text-xs text-gray-600">
                                Talla: {item.talla} | Color: {item.color}
                              </div>
                              <div className="text-xs text-gray-600">
                                Precio: ${Number(item.precioUnitario || 0).toLocaleString()}
                              </div>
                            </div>

                            <div className="text-sm font-semibold text-gray-900">
                              ${Number(item.subtotal || (item.cantidad * item.precioUnitario)).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="text-xs text-gray-700">Cantidad a devolver:</label>

                            <input
                              type="number"
                              min="0"
                              max={getCantidadMaximaDevolucion(item)}
                              value={cantidadDevuelta}
                              onChange={(e) => {
                                const max = getCantidadMaximaDevolucion(item);
                                const val = parseInt(e.target.value, 10) || 0;
                                const safe = Math.max(0, Math.min(max, val));
                                handleToggleItemDevolucion(String(item.id), safe);
                              }}
                              step="1"
                              className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />

                            <span className="text-xs text-gray-600">de {getCantidadMaximaDevolucion(item)}</span>

                            {cantidadDevuelta > 0 && (
                              <span className="ml-auto text-xs text-green-700 font-medium">
                                Devolución: $
                                {(cantidadDevuelta * Number(item.precioUnitario || 0)).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                })
              ) : (
                <p className="text-sm text-gray-500">No hay productos en esta venta</p>
              )}
</div>


                {/* 2) Producto por el que se cambia */}
                {itemsDevueltos.length > 0 && (
                  <div className="border-t pt-4 mt-4">

                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      ¿Por cuál referencia se hará el cambio? *
                    </label>

                    <select
                      value={productoNuevoId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setProductoNuevoId(id);
                        setProductoNuevoTalla('');
                        setProductoNuevoColor('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Selecciona el producto nuevo --</option>
                      {productos.filter((p: any) => p.activo).map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} - ${(p.precioVenta || 0).toLocaleString()}
                        </option>
                      ))}
                    </select>

                    {/* talla / color */}
                    {productoNuevoId && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Talla *</label>
                          <select
                            value={productoNuevoTalla}
                            onChange={(e) => {
                              setProductoNuevoTalla(e.target.value);
                              setProductoNuevoColor('');
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Seleccionar...</option>
                            {getTallasDisponiblesCambio().map((t: string) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Color *</label>
                          <select
                            value={productoNuevoColor}
                            onChange={(e) => setProductoNuevoColor(e.target.value)}
                            disabled={!productoNuevoTalla}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Seleccionar...</option>
                            {getColoresDisponiblesCambio().map((c: string) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3) Balance del cambio */}
                {itemsDevueltos.length > 0 && productoNuevoId && (() => {
                  const totalDevuelto = itemsDevueltos.reduce((sum: number, sel) => {
                    const item = selectedVenta.items.find((i: any) => String(i.id) === String(sel.itemId));
                    if (!item) return sum;

                    const cantidadVendida = getCantidadMaximaDevolucion(item);
                    const cantidad = Math.max(0, Math.min(cantidadVendida, Number(sel.cantidad || 0)));
                    return sum + (cantidad * Number(item.precioUnitario || 0));
                  }, 0);

                  const prodNuevo = productos.find((p: any) => p.id?.toString() === productoNuevoId?.toString());
                  const precioProductoNuevo = prodNuevo ? Number(prodNuevo.precioVenta || 0) : 0;

                  const diferencia = precioProductoNuevo - totalDevuelto;
                  const saldoAFavorCalc = diferencia < 0 ? Math.abs(diferencia) : 0;
                  const excedenteCalc = diferencia > 0 ? diferencia : 0;

                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 mt-3">
                      <div className="font-semibold text-blue-900">Balance del cambio</div>

                      <div className="flex justify-between text-sm text-blue-800">
                        <span>Total devuelto:</span>
                        <span className="font-medium">${totalDevuelto.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between text-sm text-blue-800">
                        <span>Producto nuevo:</span>
                        <span className="font-medium">${precioProductoNuevo.toLocaleString()}</span>
                      </div>

                      {saldoAFavorCalc > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">Saldo a favor:</span>
                          <span className="font-semibold text-green-700">
                            ${saldoAFavorCalc.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {excedenteCalc > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-red-700">Excedente por pagar:</span>
                            <span className="font-semibold text-red-700">
                              ${excedenteCalc.toLocaleString()}
                            </span>
                          </div>

                          <div>
                            <label className="block text-gray-700 mb-2 text-sm">
                              Medio de pago del excedente *
                            </label>
                            <select
                              value={medioPagoExcedente}
                              onChange={(e) => setMedioPagoExcedente(e.target.value as MedioPago)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="Efectivo">Efectivo</option>
                              <option value="Transferencia">Transferencia</option>
                              <option value="Tarjeta">Tarjeta</option>
                              <option value="Nequi">Nequi</option>
                              <option value="Daviplata">Daviplata</option>
                            </select>
                          </div>
                        </>
                      )}

                      {saldoAFavorCalc === 0 && excedenteCalc === 0 && (
                        <div className="text-sm text-blue-700">
                          El cambio queda en <span className="font-semibold">0</span> (sin saldo ni excedente).
                        </div>
                      )}
                    </div>
                  );
                })()}

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
                  setItemsDevueltos([]);
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
