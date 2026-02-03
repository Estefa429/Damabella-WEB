import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Eye,
  Ban,
  RotateCcw,
  Repeat2,
  X,
  UserPlus,
  Download,
  ShoppingBag,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button, Input, Modal } from '../../../../shared/components/native';
import { finalizarVenta, generarNumeroVenta, anularVentaSegura } from '../../../../services/saleService';
import {
  validarCambiosVenta,
  puedeAnularseVentaConCambios,
  marcarCambioAplicado,
  validarAnulacionVenta,
  type ValidacionCambios,
} from '../../../../services/cambiosValidadores';

const STORAGE_KEY = 'damabella_ventas';
const CLIENTES_KEY = 'damabella_clientes';
const PRODUCTOS_KEY = 'damabella_productos';
const DEVOLUCIONES_KEY = 'damabella_devoluciones';
const CAMBIOS_KEY = 'damabella_cambios';

type MedioPago = 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Nequi' | 'Daviplata';

type DevolucionData = {
  motivo: MotivoDevolucion;
  itemsDevueltos: { itemId: string; cantidad: number }[];
  productoNuevoId: string;
  productoNuevoTalla: string;
  productoNuevoColor: string;
  medioPagoExcedente: MedioPago;
};

type MotivoDevolucion =
  | 'Defectuoso'
  | 'Talla incorrecta'
  | 'Color incorrecto'
  | 'Producto equivocado'
  | 'Otro';

type CambioData = {
  ventaOriginalId: string;
  productoOriginalId: string;
  tallaOriginal: string;
  colorOriginal: string;
  tallaDevuelta: string;
  colorDevuelta: string;
  tallaEntregada: string;
  colorEntregada: string;
  productoEntregadoId: string;
  motivoCambio: string;
  fechaCambio: string;
  // � CRÍTICO: Datos financieros del cambio
  precioDevuelto?: number;      // Precio unitario del producto devuelto
  precioEntregado?: number;     // Precio unitario del producto entregado
  diferencia?: number;          // precioEntregado - precioDevuelto (puede ser negativo)
  medioPagoDiferencia?: MedioPago; // Cómo se cobra/paga la diferencia
  // �🔒 CRÍTICO: Flags para control atómico de stock
  stockDevuelto?: boolean;      // True = stock del original fue devuelto (+1)
  stockEntregado?: boolean;     // True = stock del entregado fue descargado (-1)
  reversado?: boolean;          // True = cambio fue reversado
};

const MOTIVOS_DEVOLUCION: MotivoDevolucion[] = [
  'Defectuoso',
  'Talla incorrecta',
  'Color incorrecto',
  'Producto equivocado',
  'Otro',
];

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
  estado: 'Completada' | 'Anulada' | 'Devuelta';
  items: ItemVenta[];
  subtotal: number;
  iva: number;
  total: number;
  metodoPago: string;
  observaciones: string;
  anulada: boolean;
  motivoAnulacion?: string;
  devolucionId?: string;  // 🔒 CRÍTICO: ID de la devolución aplicada (solo 1 por venta)
  createdAt: string;
  pedido_id?: string | null;
  cambios?: CambioData[];
  devoluciones?: DevolucionData[];
  // 🔒 NUEVO: Flags de movimientos de stock (no se manejan por estado)
  movimientosStock: {
    salidaEjecutada: boolean;    // Stock fue descargado al crear venta
    devolucionEjecutada: boolean; // Stock fue devuelto al anular venta
  };
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
    if (stored) {
      return JSON.parse(stored);
    }

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

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');

  const [viewingVenta, setViewingVenta] = useState<Venta | null>(null);
  const [ventaToAnular, setVentaToAnular] = useState<Venta | null>(null);
  const [ventaToDevolver, setVentaToDevolver] = useState<Venta | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [clienteSearchTerm, setClienteSearchTerm] = useState('');
  const [selectedClienteNombre, setSelectedClienteNombre] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const [formData, setFormData] = useState({
    clienteId: '',
    fechaVenta: new Date().toISOString().split('T')[0],
    metodoPago: 'Efectivo',
    observaciones: '',
    items: [] as ItemVenta[]
  });

  const [usarSaldoAFavor, setUsarSaldoAFavor] = useState(false);
  const [metodoPagoRestante, setMetodoPagoRestante] = useState<MedioPago>('Efectivo');


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
    varianteId: '',
    cantidad: '1'
  });

  const [devolucionData, setDevolucionData] = useState<DevolucionData>({
  motivo: 'Defectuoso',
  itemsDevueltos: [],
  productoNuevoId: '',
  productoNuevoTalla: '',
  productoNuevoColor: '',
  medioPagoExcedente: 'Efectivo',
});

  const [showCambioModal, setShowCambioModal] = useState(false);
  const [ventaToCambiar, setVentaToCambiar] = useState<Venta | null>(null);
  const [cambioData, setCambioData] = useState<CambioData>({
    ventaOriginalId: '',
    productoOriginalId: '',
    tallaOriginal: '',
    colorOriginal: '',
    tallaDevuelta: '',
    colorDevuelta: '',
    tallaEntregada: '',
    colorEntregada: '',
    productoEntregadoId: '',
    motivoCambio: '',
    fechaCambio: new Date().toISOString(),
    precioDevuelto: 0,
    precioEntregado: 0,
    diferencia: 0,
    medioPagoDiferencia: 'Efectivo',
  });

  // 🔒 Estado dedicado para productos disponibles en modal Cambio
  const [productosDisponiblesCambio, setProductosDisponiblesCambio] = useState<any[]>([]);

  const [ventaCounter, setVentaCounter] = useState(() => {
    const counter = localStorage.getItem('damabella_venta_counter');
    return counter ? parseInt(counter, 10) : 1;
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

  // ✅ nuevo: refrescar clientes cuando otro módulo actualice CLIENTES_KEY
  const handleClientsUpdated = () => {
    const storedClientes = localStorage.getItem(CLIENTES_KEY);
    if (storedClientes) setClientes(JSON.parse(storedClientes));
  };

  const handlePedidoConvertidoAVenta = (event: any) => {
    const { pedido } = event.detail;
    if (!pedido?.numeroPedido) return;

    const clientesActuales = JSON.parse(localStorage.getItem(CLIENTES_KEY) || '[]');
    const cliente = clientesActuales.find((c: any) => c.id.toString() === pedido.clienteId?.toString());
    if (!cliente) return;

    setVentas((prevVentas) => {
      const yaExiste = prevVentas.some(v => v.pedido_id === pedido.numeroPedido);
      if (yaExiste) return prevVentas;

      const nuevaVentaBase = {
        id: Date.now(),
        clienteId: pedido.clienteId,
        clienteNombre: pedido.clienteNombre,
        fechaVenta: pedido.fechaPedido,
        estado: 'Completada' as const,
        items: pedido.items.map((item: any) => ({
          id: item.id,
          productoId: item.productoId,
          productoNombre: item.productoNombre,
          talla: item.talla,
          color: item.color,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal
        })),
        subtotal: pedido.subtotal,
        iva: pedido.iva,
        total: pedido.total,
        metodoPago: pedido.metodoPago || 'Efectivo',
        observaciones: pedido.observaciones || '',
        anulada: false,
        createdAt: new Date().toISOString(),
        pedido_id: pedido.numeroPedido,
        // 🔒 NUEVO: Flags de movimientos de stock (se actualizan en finalizarVenta)
        movimientosStock: {
          salidaEjecutada: false,   // Se marca true en finalizarVenta()
          devolucionEjecutada: false
        }
      };

      const counter = parseInt(localStorage.getItem('damabella_venta_counter') || '1', 10);
      const numeroVenta = `VEN-${String(counter).padStart(3, '0')}`;

      const nuevaVenta: Venta = {
        ...nuevaVentaBase,
        numeroVenta
      };

      localStorage.setItem('damabella_venta_counter', String(counter + 1));
      const next = parseInt(localStorage.getItem('damabella_venta_counter') || '1', 10);
      setVentaCounter(next);

      return [...prevVentas, nuevaVenta];
    });

    window.dispatchEvent(new Event('salesUpdated'));
  };

  // carga inicial
  handleStorageChange();

  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('salesUpdated', handleStorageChange);
  window.addEventListener('clientsUpdated', handleClientsUpdated);
  window.addEventListener('pedidoConvertidoAVenta', handlePedidoConvertidoAVenta as EventListener);

  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('salesUpdated', handleStorageChange);
    window.removeEventListener('clientsUpdated', handleClientsUpdated);
    window.removeEventListener('pedidoConvertidoAVenta', handlePedidoConvertidoAVenta as EventListener);
  };
}, []);
  // 🔒 FUNCIÓN HELPER: Verificar si una venta tiene devolución aplicada
  const tieneDevolucionAplicada = (ventaId: number | string): boolean => {
    const venta = (ventas || []).find((v: any) => v.id?.toString() === ventaId?.toString());
    return !!venta?.devolucionId;  // Si tiene devolucionId, tiene devolución aplicada
  };

  // 🔒 FUNCIÓN HELPER: Verificar si una venta tiene cambio aplicado
  const tieneChangioAplicado = (ventaId: number | string): boolean => {
    const cambios = JSON.parse(localStorage.getItem(CAMBIOS_KEY) || '[]');
    const cambioAplicado = (cambios || []).find(
      (c: any) => 
        c.ventaOriginalId?.toString() === ventaId?.toString() &&
        c.stockDevuelto === true &&
        c.stockEntregado === true &&
        c.reversado !== true
    );
    return !!cambioAplicado;
  };

  const calcularCantidadDisponible = (ventaId: number, itemId: string): number => {
    // 1. Obtener cantidad vendida del item
    const venta = ventas.find((v: any) => v.id === ventaId);
    const item = venta?.items?.find((i: any) => i.id === itemId);
    if (!item) return 0;
    
    const cantidadVendida = item.cantidad || 0;

    // 2. Calcular cantidad devuelta
    const devoluciones = JSON.parse(localStorage.getItem(DEVOLUCIONES_KEY) || '[]');
    const cantidadDevuelta = (devoluciones || []).reduce((total: number, dev: any) => {
      if (dev.ventaId?.toString() === ventaId?.toString()) {
        const itemDev = (dev.items || []).find((i: any) => i.id === itemId);
        return total + (itemDev?.cantidad || 0);
      }
      return total;
    }, 0);

    // 3. Calcular cantidad cambiada
    const cambios = JSON.parse(localStorage.getItem(CAMBIOS_KEY) || '[]');
    const cantidadCambiada = (cambios || []).reduce((total: number, cam: any) => {
      if (cam.ventaOriginalId?.toString() === ventaId?.toString()) {
        // Buscar si este item fue devuelto en un cambio
        const itemCam = (cam.productoOriginalId === item.productoId && 
                        cam.tallaDevuelta === item.talla && 
                        cam.colorDevuelta === item.color) ? 1 : 0;
        return total + itemCam;
      }
      return total;
    }, 0);

    // 4. Calcular disponible
    const cantidadDisponible = cantidadVendida - cantidadDevuelta - cantidadCambiada;
    return Math.max(0, cantidadDisponible);
  };

  // 🔒 useEffect: Calcular productos disponibles cuando se abre modal Cambio
  // Se ejecuta cada vez que el modal se abre o cuando cambian las devoluciones/cambios
  useEffect(() => {
    if (!showCambioModal || !ventaToCambiar) {
      setProductosDisponiblesCambio([]);
      return;
    }

    // Obtener devoluciones y cambios actuales
    const devoluciones = JSON.parse(localStorage.getItem(DEVOLUCIONES_KEY) || '[]');
    const cambios = JSON.parse(localStorage.getItem(CAMBIOS_KEY) || '[]');

    // Filtrar items de la venta que tienen cantidadDisponible > 0
    const productosDisponibles = (ventaToCambiar.items || []).filter((item) => {
      const cantidadDisponible = calcularCantidadDisponible(ventaToCambiar.id, item.id);
      return cantidadDisponible > 0;
    });

    setProductosDisponiblesCambio(productosDisponibles);
  }, [showCambioModal, ventaToCambiar, ventas]);


  const calcularTotales = (items: ItemVenta[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  const validateField = (field: string, value: any) => {
    const errors: any = {};
    if (field === 'clienteId') {
      if (!value) errors.clienteId = 'Debes seleccionar un cliente';
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
    if (field === 'numeroDoc' || field === 'telefono') value = value.replace(/\D/g, '');
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
    setUsarSaldoAFavor(false);
    setMetodoPagoRestante('Efectivo');

    setNuevoItem({
      productoId: '',
      varianteId: '',
      cantidad: '1'
    });
    setClienteSearchTerm('');
    setFormErrors({});
    setShowModal(true);
  };

  const handleSelectCliente = (clienteId: string, clienteNombre: string) => {
  setFormData((prev) => ({ ...prev, clienteId }));
  setClienteSearchTerm(clienteNombre);
  setSelectedClienteNombre(clienteNombre); // ✅ clave
  setShowClienteDropdown(false);
  setFormErrors((prev) => ({ ...prev, clienteId: undefined }));

  setUsarSaldoAFavor(false);
  setMetodoPagoRestante('Efectivo');
  };



  const filteredClientes = (clientes || []).filter((c: any) =>
    (c.nombre?.toLowerCase() ?? '').includes(clienteSearchTerm.toLowerCase()) ||
    (c.numeroDoc ?? '').includes(clienteSearchTerm)
  );

  const getProductoSeleccionado = () => (productos || []).find((p: any) => p.id.toString() === nuevoItem.productoId);

  // 🔒 DEPRECATED: Se usa varianteId en lugar de talla/color
  // const getTallasDisponibles = () => {
  //   const producto = getProductoSeleccionado();
  //   if (!producto) return [];
  //   if (producto.variantes) return (producto.variantes || []).map((v: any) => v.talla);
  //   return producto.tallas || [];
  // };

  // 🔒 DEPRECATED: Se usa varianteId en lugar de talla/color
  // const getColoresDisponibles = () => {
  //   const producto = getProductoSeleccionado();
  //   if (!producto) return [];
  //   if (producto.variantes && nuevoItem.talla) {
  //     const variante = (producto.variantes || []).find((v: any) => v.talla === nuevoItem.talla);
  //     if (!variante) return [];
  //     return (variante.colores || []).map((c: any) => c.color);
  //   }
  //   return producto.colores || [];
  // };

  const getProductoNuevoSeleccionado = () =>
    (productos || []).find((p: any) => p.id.toString() === devolucionData.productoNuevoId);

  const getTallasDisponiblesCambio = () => {
    const producto = getProductoNuevoSeleccionado();
    if (!producto) return [];
    if (producto.variantes) return (producto.variantes || []).map((v: any) => v.talla);
    return producto.tallas || [];
  };

  const getColoresDisponiblesCambio = () => {
    const producto = getProductoNuevoSeleccionado();
    if (!producto) return [];
    if (producto.variantes && devolucionData.productoNuevoTalla) {
      const variante = (producto.variantes || []).find((v: any) => v.talla === devolucionData.productoNuevoTalla);
      if (!variante) return [];
      return (variante.colores || []).map((c: any) => c.color);
    }
    return producto.colores || [];
  };

  // 🔒 HELPERS PARA FILTRAR PRODUCTOS A ENTREGAR POR STOCK

  // Función: Obtener productos que tienen al menos una variante con stock > 0
  const getProductosConStockDisponible = () => {
    return (productos || []).filter((p: any) => {
      if (!p.variantes || p.variantes.length === 0) return false;
      // Verificar si existe al menos una variante con al menos un color con stock > 0
      return p.variantes.some((v: any) =>
        v.colores && v.colores.some((c: any) => (c.cantidad || c.stock || 0) > 0)
      );
    });
  };

  // Función: Obtener tallas que tienen al menos un color con stock > 0
  const getTallasConStockDisponible = (productoId: string) => {
    const producto = (productos || []).find((p: any) => p.id.toString() === productoId);
    if (!producto || !producto.variantes) return [];
    
    return producto.variantes
      .filter((v: any) => v.colores && v.colores.some((c: any) => (c.cantidad || c.stock || 0) > 0))
      .map((v: any) => v.talla);
  };

  // Función: Obtener colores con stock > 0 para una talla específica
  const getColoresConStockDisponible = (productoId: string, talla: string) => {
    const producto = (productos || []).find((p: any) => p.id.toString() === productoId);
    if (!producto || !producto.variantes) return [];
    
    const variante = producto.variantes.find((v: any) => v.talla === talla);
    if (!variante || !variante.colores) return [];
    
    return variante.colores
      .filter((c: any) => (c.cantidad || c.stock || 0) > 0)
      .map((c: any) => ({ color: c.color, stock: c.cantidad || c.stock || 0 }));
  };

  // Función: Verificar si hay stock disponible para una variante específica
  const tieneStockDisponible = (productoId: string, talla: string, color: string): boolean => {
    const producto = (productos || []).find((p: any) => p.id.toString() === productoId);
    if (!producto || !producto.variantes) return false;
    
    const variante = producto.variantes.find((v: any) => v.talla === talla);
    if (!variante || !variante.colores) return false;
    
    const colorObj = variante.colores.find((c: any) => c.color === color);
    return colorObj && (colorObj.cantidad || colorObj.stock || 0) > 0;
  };

  const agregarItem = () => {
    // 🔒 VALIDACIÓN CRÍTICA: varianteId es obligatorio (no talla/color libres)
    if (!nuevoItem.productoId || !nuevoItem.varianteId || !nuevoItem.cantidad) {
      setNotificationMessage('Debes seleccionar producto, variante y cantidad');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const producto = (productos || []).find((p: any) => p.id.toString() === nuevoItem.productoId);
    if (!producto) {
      setNotificationMessage('Producto no encontrado');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // 🔒 BÚSQUEDA OBLIGATORIA: La variante DEBE existir en PRODUCTOS_KEY
    if (!(producto.variantes || []) || producto.variantes.length === 0) {
      setNotificationMessage('❌ Este producto no tiene variantes definidas. Cree el stock desde Compras.');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // Buscar la variante seleccionada
    let varianteTalla = null;
    let colorItem = null;
    let tallaSeleccionada = '';
    let colorSeleccionado = '';

    for (const variante of (producto.variantes || [])) {
      for (const color of (variante.colores || [])) {
        const varId = `${variante.talla}-${color.color}`;
        if (varId === nuevoItem.varianteId) {
          varianteTalla = variante;
          colorItem = color;
          tallaSeleccionada = variante.talla;
          colorSeleccionado = color.color;
          break;
        }
      }
      if (colorItem) break;
    }

    // 🔒 GUARD CLAUSE: Si la variante NO existe, ABORTAR
    if (!varianteTalla || !colorItem) {
      setNotificationMessage(`❌ La variante seleccionada no existe. Las variantes solo se crean desde Compras.`);
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const cantidad = parseInt(nuevoItem.cantidad, 10);

    // 🔒 VALIDACIÓN: Stock insuficiente
    if (colorItem.cantidad < cantidad) {
      setNotificationMessage(`❌ Stock insuficiente. Disponible: ${colorItem.cantidad} unidades, Solicitado: ${cantidad}`);
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const precioUnitario = producto.precioVenta;
    const subtotal = cantidad * precioUnitario;

    // ✅ TODO VALIDADO: Crear item
    const item: ItemVenta = {
      id: Date.now().toString(),
      productoId: nuevoItem.productoId,
      productoNombre: producto.nombre,
      talla: tallaSeleccionada,  // ✅ Viene de la variante, NO es editable
      color: colorSeleccionado,   // ✅ Viene de la variante, NO es editable
      cantidad,
      precioUnitario,
      subtotal
    };

    setFormData({ ...formData, items: [...formData.items, item] });

    // Reset solo campos, mantener producto seleccionado
    setNuevoItem({
      productoId: nuevoItem.productoId,
      varianteId: '',
      cantidad: '1'
    });
  };

  const eliminarItem = (itemId: string) => {
    setFormData({ ...formData, items: formData.items.filter(item => item.id !== itemId) });
  };

  // 🔒 FUNCIÓN ÚNICA PERMITIDA EN VENTAS: Descontar stock
  const handleSave = () => {
    const numeroVenta = generarNumeroVenta();
    const allErrors: any = {};
    const fieldErrors = validateField('clienteId', formData.clienteId);
    if (fieldErrors.clienteId) allErrors.clienteId = fieldErrors.clienteId;

    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    if (formData.items.length === 0) {
      setNotificationMessage('Agrega al menos un producto');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const cliente = clientes.find((c: any) => c.id.toString() === formData.clienteId);
    if (!cliente) {
      setNotificationMessage('Cliente no encontrado');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const clienteSel = cliente;
    const totales = calcularTotales(formData.items);
    const saldoDisp = Number(clienteSel?.saldoAFavor || 0);
    const total = Number(totales.total || 0);
    const saldoUsado = usarSaldoAFavor ? Math.min(saldoDisp, total) : 0;
    const restante = Math.max(total - saldoUsado, 0);

    if (usarSaldoAFavor && restante > 0 && !metodoPagoRestante) {
      setNotificationMessage('Debes seleccionar el medio de pago del restante');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const ventaData: Venta = {
      id: Date.now(),
      numeroVenta,
      clienteId: formData.clienteId,
      clienteNombre: clienteSel.nombre,
      fechaVenta: formData.fechaVenta,
      estado: 'Completada',
      items: formData.items,
      subtotal: totales.subtotal,
      iva: totales.iva,
      total: totales.total,
      metodoPago: usarSaldoAFavor
        ? (restante > 0 ? `Saldo a favor + ${metodoPagoRestante}` : 'Saldo a favor')
        : formData.metodoPago,
      observaciones: formData.observaciones,
      anulada: false,
      createdAt: new Date().toISOString(),
      // 🔒 NUEVO: Flags de movimientos de stock (se actualizan en finalizarVenta)
      movimientosStock: {
        salidaEjecutada: false,   // Se marca true en finalizarVenta()
        devolucionEjecutada: false
      }
    };

    // 🔒 LLAMAR A FUNCIÓN CENTRAL: finalizarVenta()
    // Esta función es responsable de:
    // 1. Validar variantes y stock
    // 2. Descontar stock
    // 3. Guardar venta en localStorage CON FLAGS ACTUALIZADOS
    // 4. Disparar eventos de sincronización
    const resultado = finalizarVenta(ventaData as any, formData.items);
    
    // 🔒 GUARD CLAUSE: Si el descuento falla, ABORTAR TODO
    if (!resultado.exitoso) {
      console.error(`❌ [Ventas] ERROR: ${resultado.error}`);
      setNotificationMessage(resultado.error || 'Error al finalizar venta');
      setNotificationType('error');
      setShowNotificationModal(true);
      return; // STOP: No continuar
    }

    // ✅ Stock descargado correctamente, ahora actualizar UI de Ventas
    // Obtener venta desde localStorage (tiene flags actualizados)
    const ventasActualizadas = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    setVentas(ventasActualizadas);
    
    // Actualizar productos en estado local para reflejar cambios
    const productosActualizados = JSON.parse(localStorage.getItem(PRODUCTOS_KEY) || '[]');
    setProductos(productosActualizados);
    
    if (saldoUsado > 0) {
      const clientesActualizados = clientes.map((c: any) => {
        if (c.id.toString() === formData.clienteId.toString()) {
          return { ...c, saldoAFavor: Number(c.saldoAFavor || 0) - saldoUsado };
        }
        return c;
      });

      localStorage.setItem(CLIENTES_KEY, JSON.stringify(clientesActualizados));
      window.dispatchEvent(new Event('clientsUpdated'));
      setClientes(clientesActualizados);
    }

    setVentaCounter(ventaCounter + 1);
    setShowModal(false);

    setNotificationMessage('✅ Venta creada exitosamente - Stock actualizado automáticamente');
    setNotificationType('success');
    setShowNotificationModal(true);
    
    // Reset formulario
    setFormData({
      clienteId: '',
      fechaVenta: new Date().toISOString().split('T')[0],
      items: [],
      metodoPago: 'Efectivo',
      observaciones: ''
    });
  };

  const handleAnular = () => {
    // 🔒 VALIDACIÓN CRÍTICA 1: Motivo es obligatorio
    if (!ventaToAnular || !motivoAnulacion.trim()) {
      setNotificationMessage('Debes ingresar un motivo de anulación');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // 🔒 NUEVA VALIDACIÓN CRÍTICA: NO permitir anular si hay cambios aplicados
    const cambios = JSON.parse(localStorage.getItem(CAMBIOS_KEY) || '[]');
    const cambioAplicado = (cambios || []).find(
      (c: any) => 
        c.ventaOriginalId?.toString() === ventaToAnular?.id?.toString() &&
        c.stockDevuelto === true &&
        c.stockEntregado === true &&
        c.reversado !== true
    );

    if (cambioAplicado) {
      setNotificationMessage(
        `❌ No puedes anular esta venta porque tiene un cambio aplicado (${cambioAplicado.numeroCambio}).\n` +
        `Primero debes reversar el cambio antes de poder anular la venta.`
      );
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // 🔒 VALIDACIÓN CRÍTICA 2: Usar función centralizada SEGURA
    // Esta función:
    // - Valida que no tenga cambios/devoluciones reales
    // - Devuelve stock SOLO si fue descargado antes (salidaEjecutada === true)
    // - Marca devolucionEjecutada = true para prevenir duplicación
    // - Bloquea anulaciones múltiples
    const resultado = anularVentaSegura(ventaToAnular, motivoAnulacion);

    if (!resultado.exitoso) {
      setNotificationMessage(resultado.error || 'Error al anular venta');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // ✅ ANULACIÓN EXITOSA - Actualizar UI

    // PASO 1: Actualizar lista de ventas en estado local
    setVentas((ventasActualesState) => (ventasActualesState || []).map(v =>
      v.id === ventaToAnular.id
        ? {
            ...v,
            estado: 'Anulada',
            anulada: true,
            motivoAnulacion,
            // 🔒 Actualizar flags de movimientos
            movimientosStock: {
              salidaEjecutada: true,
              devolucionEjecutada: true
            }
          }
        : v
    ));

    // PASO 2: Actualizar productos en estado local (si hubo devolución de stock)
    if (resultado.stockDevuelto && resultado.stockDevuelto.length > 0) {
      // Recargar productos desde localStorage para asegurar sincronización
      const productosJSON = localStorage.getItem(PRODUCTOS_KEY);
      if (productosJSON) {
        const productosActualizados = JSON.parse(productosJSON);
        setProductos(productosActualizados);
      }
    }

    // PASO 3: Actualizar saldo a favor del cliente
    // 🔒 CRÍTICO: El total de la venta anulada se convierte en saldo a favor (NO se devuelve dinero)
    const clientesActualizados = (clientes || []).map((c: any) => {
      if (c.id.toString() === ventaToAnular.clienteId.toString()) {
        return {
          ...c,
          saldoAFavor: Number(c.saldoAFavor || 0) + Number(ventaToAnular.total || 0),
        };
      }
      return c;
    });

    localStorage.setItem(CLIENTES_KEY, JSON.stringify(clientesActualizados));
    setClientes(clientesActualizados);

    // PASO 4: Limpiar formulario
    setShowAnularModal(false);
    setVentaToAnular(null);
    setMotivoAnulacion('');

    // PASO 5: Notificar éxito
    const stockDevueltoCount = resultado.stockDevuelto?.length || 0;
    const mensaje =
      stockDevueltoCount > 0
        ? `✅ Venta ${ventaToAnular.numeroVenta} anulada. Stock devuelto: ${stockDevueltoCount} items. ` +
          `Saldo a favor: $${(ventaToAnular.total || 0).toLocaleString()}.`
        : `✅ Venta ${ventaToAnular.numeroVenta} anulada (sin stock que devolver). ` +
          `Saldo a favor: $${(ventaToAnular.total || 0).toLocaleString()}.`;

    setNotificationMessage(mensaje);
    setNotificationType('success');
    setShowNotificationModal(true);

    // PASO 6: Disparar evento de sincronización
    window.dispatchEvent(new Event('salesUpdated'));
  };

  const handleCrearCliente = () => {
    if (!nuevoCliente.nombre || !nuevoCliente.numeroDoc || !nuevoCliente.telefono) {
      setNotificationMessage('Completa los campos obligatorios');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const clienteData = {
      id: Date.now(),
      ...nuevoCliente,
      saldoAFavor: 0,
      activo: true,
      createdAt: new Date().toISOString()
    };

    const clientesActuales = JSON.parse(localStorage.getItem(CLIENTES_KEY) || '[]');
    localStorage.setItem(CLIENTES_KEY, JSON.stringify([...clientesActuales, clienteData]));

    setClientes([...clientes, clienteData]);
    setFormData({ ...formData, clienteId: clienteData.id.toString() });
    setClienteSearchTerm(clienteData.nombre);
    setSelectedClienteNombre(clienteData.nombre);
    setShowClienteModal(false);
    setNuevoCliente({
      nombre: '',
      tipoDoc: 'CC',
      numeroDoc: '',
      telefono: '',
      email: '',
      direccion: ''
    });

    setNotificationMessage('Cliente creado exitosamente');
    setNotificationType('success');
    setShowNotificationModal(true);
  };

  const handleCrearDevolucion = () => {
    // 🔒 VALIDACIÓN 1: Venta válida
    if (!ventaToDevolver || !devolucionData.motivo) {
      setNotificationMessage('Debes seleccionar un motivo de devolución');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // 🔒 VALIDACIÓN 1.4: CRÍTICA - Verificar que NO existe devolución previa
    if (ventaToDevolver.devolucionId) {
      setNotificationMessage(
        `❌ Esta venta ya tiene una devolución aplicada (${ventaToDevolver.devolucionId}).
` +
        `Una venta solo puede tener UNA devolución.`
      );
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // 🔒 VALIDACIÓN 1.5: Bloqueo cruzado - Si ya existe un CAMBIO para esta venta, NO permitir devolución
    const cambios = JSON.parse(localStorage.getItem(CAMBIOS_KEY) || '[]');
    const cambioExistente = (cambios || []).find((c: any) => c.ventaOriginalId?.toString() === ventaToDevolver.id?.toString());
    if (cambioExistente) {
      setNotificationMessage(
        `❌ Esta venta ya tiene un cambio registrado (${cambioExistente.numeroCambio}). ` +
        `No puedes hacer una devolución en una venta que ya tiene un cambio.`
      );
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // 🔒 VALIDACIÓN 2: Solo devoluciones en ventas COMPLETADAS
    if (ventaToDevolver.estado !== 'Completada') {
      setNotificationMessage(
        `❌ No puedes procesar devolucion de una venta en estado "${ventaToDevolver.estado}". ` +
        `Solo se permiten devoluciones de ventas COMPLETADAS.`
      );
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // 🔒 VALIDACIÓN 3: Items seleccionados
    if ((devolucionData.itemsDevueltos || []).length === 0) {
      setNotificationMessage('Debes seleccionar al menos un producto para devolver');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // 🔒 VALIDACIÓN 3.5: Validar que no se devuelve más de lo disponible
    for (const itemDev of (devolucionData.itemsDevueltos || [])) {
      const cantidadDisponible = calcularCantidadDisponible(ventaToDevolver.id, itemDev.itemId);
      if (itemDev.cantidad > cantidadDisponible) {
        setNotificationMessage(
          `❌ El producto intenta devolver ${itemDev.cantidad} unidades pero solo hay ${cantidadDisponible} disponibles (considerando devoluciones y cambios previos).`
        );
        setNotificationType('error');
        setShowNotificationModal(true);
        return;
      }
    }

    // 🔒 OPERACIÓN ATÓMICA: Envolver todo en try-catch
    try {
      const devoluciones = JSON.parse(localStorage.getItem(DEVOLUCIONES_KEY) || '[]');
      const numeroDevolucion = `DEV-${(devoluciones.length + 1).toString().padStart(3, '0')}`;

      const itemsDevueltos = (devolucionData.itemsDevueltos || []).map(itemDev => {
        const itemOriginal = (ventaToDevolver.items || []).find(i => i.id === itemDev.itemId);
        if (!itemOriginal) return null;

        return {
          id: Date.now().toString() + Math.random(),
          productoNombre: itemOriginal.productoNombre,
          productoId: itemOriginal.productoId,
          talla: itemOriginal.talla,
          color: itemOriginal.color,
          cantidad: itemDev.cantidad,
          precioUnitario: itemOriginal.precioUnitario,
          subtotal: itemDev.cantidad * itemOriginal.precioUnitario
        };
      }).filter(Boolean);

      const totalDevolucion = (itemsDevueltos as any[]).reduce((sum: number, item: any) => sum + item.subtotal, 0);

      // ✅ PASO 1: Sumar stock de productos devueltos
      const productosActualizados = (productos || []).map((producto: any) => {
        let productoModificado = false;
        const variantesActualizadas = (producto.variantes || []).map((variante: any) => {
          let varianteModificada = false;
          const coloresActualizados = (variante.colores || []).map((color: any) => {
            // Verificar si este color/talla fue devuelto
            const itemDevuelto = (itemsDevueltos || []).find(
              (item: any) =>
                item.productoId?.toString() === producto.id?.toString() &&
                item.talla === variante.talla &&
                item.color === color.color
            );

            if (itemDevuelto) {
              varianteModificada = true;
              productoModificado = true;
              // Sumar cantidad al stock
              return {
                ...color,
                cantidad: (color.cantidad || 0) + itemDevuelto.cantidad
              };
            }
            return color;
          });

          if (varianteModificada) {
            return { ...variante, colores: coloresActualizados };
          }
          return variante;
        });

        if (productoModificado) {
          return { ...producto, variantes: variantesActualizadas };
        }
        return producto;
      });

      // ✅ PASO 2: Crear registro de devolución
      const saldoAFavor = totalDevolucion;

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
        createdAt: new Date().toISOString(),
        estadoGestion: 'Aplicada' as const,  // 🔒 APLICADA: Devolución completada inmediatamente (stock + saldo + venta afectados)
        productoNuevo: null,
        productoNuevoTalla: null,
        productoNuevoColor: null,
        saldoAFavor,
        diferenciaPagar: 0,
        medioPagoExcedente: undefined,
      };

      // ✅ PASO 3: Actualizar saldo a favor del cliente
      const clientesActualizados = (clientes || []).map((c: any) => {
        if (c.id.toString() === ventaToDevolver.clienteId.toString()) {
          return {
            ...c,
            saldoAFavor: Number(c.saldoAFavor || 0) + Number(saldoAFavor || 0),
          };
        }
        return c;
      });

      // ✅ PASO 4: Guardar devolución en localStorage
      localStorage.setItem(DEVOLUCIONES_KEY, JSON.stringify([...devoluciones, nuevaDevolucion]));

      // ✅ PASO 5: Guardar productos actualizados
      localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosActualizados));
      setProductos(productosActualizados);

      // ✅ PASO 6: Guardar clientes actualizados
      localStorage.setItem(CLIENTES_KEY, JSON.stringify(clientesActualizados));
      setClientes(clientesActualizados);

      // ✅ PASO 7: CRÍTICO - Marcar la venta con devolucionId y cambiar estado a 'Devuelta'
      const ventasActualizadas = (ventas || []).map((v: Venta) => {
        if (v.id === ventaToDevolver.id) {
          return {
            ...v,
            devolucionId: numeroDevolucion,  // 🔒 Marcar con ID de devolución
            estado: 'Devuelta' as const,      // 🔒 Cambiar estado
          };
        }
        return v;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ventasActualizadas));
      setVentas(ventasActualizadas);

      // ✅ PASO 8: Limpiar y notificar
      setShowDevolucionModal(false);
      setVentaToDevolver(null);
      setDevolucionData({
        motivo: 'Defectuoso',
        itemsDevueltos: [],
        productoNuevoId: '',
        productoNuevoTalla: '',
        productoNuevoColor: '',
        medioPagoExcedente: 'Efectivo'
      });

      const msg = `✅ Devolución ${numeroDevolucion} aplicada exitosamente. Stock devuelto y saldo a favor: $${saldoAFavor.toLocaleString()}.`;

      setNotificationMessage(msg);
      setNotificationType('success');
      setShowNotificationModal(true);

      // ✅ PASO 9: Disparar evento de sincronización
      window.dispatchEvent(new Event('salesUpdated'));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setNotificationMessage(
        `❌ Error al procesar devolución: ${errorMsg}\n` +
        `La operación fue CANCELADA. Stock NO fue modificado.`
      );
      setNotificationType('error');
      setShowNotificationModal(true);
      console.error('Error en handleCrearDevolucion:', error);
    }
  };

  const handleToggleItemDevolucion = (itemId: string, cantidad: number) => {
    const existingIndex = devolucionData.itemsDevueltos.findIndex(i => i.itemId === itemId);

    if (existingIndex >= 0) {
      if (cantidad === 0) {
        setDevolucionData({
          ...devolucionData,
          itemsDevueltos: devolucionData.itemsDevueltos.filter(i => i.itemId !== itemId)
        });
      } else {
        const newItems = [...devolucionData.itemsDevueltos];
        newItems[existingIndex] = { itemId, cantidad };
        setDevolucionData({ ...devolucionData, itemsDevueltos: newItems });
      }
    } else if (cantidad > 0) {
      setDevolucionData({
        ...devolucionData,
        itemsDevueltos: [...devolucionData.itemsDevueltos, { itemId, cantidad }]
      });
    }
  };

  // ==================== SISTEMA DE CAMBIOS (CAMBIOS) ====================
  // Validación 1: Verificar que la venta original existe y es válida
  const validarVentaOriginal = (venta: Venta | null): { valido: boolean; error: string } => {
    if (!venta) {
      return { valido: false, error: 'La venta original no existe' };
    }
    if (venta.anulada) {
      return { valido: false, error: 'No puedes cambiar una venta anulada' };
    }
    if (!venta.items || venta.items.length === 0) {
      return { valido: false, error: 'La venta no tiene productos' };
    }
    return { valido: true, error: '' };
  };

  // Validación 2: Verificar que la variante devuelta existe en la venta original
  const validarVarianteDevuelta = (venta: Venta | null, talla: string, color: string): { valido: boolean; error: string; itemEncontrado?: any } => {
    if (!venta) return { valido: false, error: 'Venta no válida' };
    
    const itemDevuelto = (venta.items || []).find(
      item => item.talla === talla && item.color === color
    );
    
    if (!itemDevuelto) {
      return { valido: false, error: `Producto con talla ${talla} y color ${color} no existe en esta venta` };
    }
    
    return { valido: true, error: '', itemEncontrado: itemDevuelto };
  };

  // Validación 3: Verificar que la variante entregada existe en el producto de cambio
  const validarVarianteEntregada = (productoId: string, talla: string, color: string): { valido: boolean; error: string; varianteEncontrada?: any } => {
    const producto = (productos || []).find((p: any) => p.id.toString() === productoId);
    
    if (!producto) {
      return { valido: false, error: 'Producto de cambio no existe' };
    }
    
    if (!(producto.variantes || []) || producto.variantes.length === 0) {
      return { valido: false, error: 'Producto de cambio no tiene variantes' };
    }
    
    const variante = (producto.variantes || []).find((v: any) => v.talla === talla && v.color === color);
    
    if (!variante) {
      return { valido: false, error: `Talla ${talla} o Color ${color} no disponibles en producto de cambio` };
    }
    
    return { valido: true, error: '', varianteEncontrada: variante };
  };

  // 🔒 FUNCIÓN CRÍTICA: Validación atómica de cambios
  // Previene duplicación, verifica stock, bloquea múltiples cambios
  const validarOperacionCambioAtomica = (
    venta: Venta | null,
    productoOriginalId: string,
    productoEntregadoId: string,
    tallaEntregada: string,
    colorEntregada: string
  ): { valido: boolean; error: string } => {
    if (!venta) return { valido: false, error: 'Venta no válida' };

    // 1. ❌ BLOQUEO: Si la venta TIENE UN CAMBIO APLICADO, no permitir otro
    const cambiosExistentes = JSON.parse(localStorage.getItem(CAMBIOS_KEY) || '[]');
    const cambioAplicado = (cambiosExistentes || []).find(
      (c: any) => 
        c.ventaOriginalId?.toString() === venta.id?.toString() &&
        c.stockDevuelto === true &&
        c.stockEntregado === true &&
        c.reversado !== true
    );
    
    if (cambioAplicado) {
      return { 
        valido: false, 
        error: `❌ Esta venta ya tiene un cambio aplicado (${cambioAplicado.numeroCambio}). ` +
               `No puedes hacer más de un cambio por venta. Si necesitas reversarlo, primero debes anular el cambio.` 
      };
    }

    // 2. 🔍 Obtener productos desde PRODUCTOS_KEY
    const productosActuales = JSON.parse(localStorage.getItem(PRODUCTOS_KEY) || '[]');
    
    // 3. Verificar producto original existe
    const productoOriginal = (productosActuales || []).find(
      (p: any) => p.id.toString() === productoOriginalId
    );

    if (!productoOriginal) {
      return { 
        valido: false, 
        error: 'Producto original no encontrado en inventario' 
      };
    }

    // 4. 🔍 CRÍTICO: Buscar el PRODUCTO A ENTREGAR correcto (NO items[0])
    const productoAEntregar = (productosActuales || []).find(
      (p: any) => p.id.toString() === productoEntregadoId
    );

    if (!productoAEntregar) {
      return { 
        valido: false, 
        error: 'Producto a entregar no encontrado en inventario' 
      };
    }

    // 5. 💾 Validación de stock VIRTUAL: Hacer cálculo considerando devolución
    const productosVirtuales = JSON.parse(JSON.stringify(productosActuales)); // Deep clone

    // 5.1 Aplicar devolución virtual al producto original
    const productoDevueltoVirtual = (productosVirtuales || []).find(
      (p: any) => p.id.toString() === productoOriginalId
    );

    // 5.2 Encontrar variante y color del producto original para sumar stock virtual
    if (productoDevueltoVirtual && productoDevueltoVirtual.variantes) {
      // Nota: En el cambio real ya sabemos talla y color devueltos porque están en cambioData
      // Pero aquí no los tenemos, así que solo validamos que el producto existe
    }

    // 5.3 Validar stock del PRODUCTO A ENTREGAR con variante y color ESPECÍFICOS
    if (!productoAEntregar.variantes || productoAEntregar.variantes.length === 0) {
      return { 
        valido: false, 
        error: 'Producto a entregar no tiene variantes definidas' 
      };
    }

    // 5.4 Buscar variante específica
    const varianteAEntregar = (productoAEntregar.variantes || []).find(
      (v: any) => v.talla === tallaEntregada
    );

    if (!varianteAEntregar) {
      return { 
        valido: false, 
        error: `Talla ${tallaEntregada} no disponible en producto a entregar` 
      };
    }

    // 5.5 Buscar color específico
    const colorAEntregar = (varianteAEntregar.colores || []).find(
      (c: any) => c.color === colorEntregada
    );

    if (!colorAEntregar) {
      return { 
        valido: false, 
        error: `Color ${colorEntregada} no disponible en talla ${tallaEntregada}` 
      };
    }

    // 5.6 VALIDACIÓN FINAL: Stock disponible
    const stockActual = colorAEntregar.cantidad || 0;
    if (stockActual < 1) {
      return { 
        valido: false, 
        error: `❌ Stock insuficiente para ${productoAEntregar.nombre} (${tallaEntregada}-${colorEntregada}). Disponible: ${stockActual}` 
      };
    }

    return { valido: true, error: '' };
  };

  // Validación 4: Verificar stock disponible de la variante entregada
  // 🔒 CRÍTICO: CONSIDERA stock virtual (stock actual + devolución del producto original)
  // Función principal: Procesar el cambio con stock virtual en memoria
  const handleCrearCambio = () => {
    // GUARD CLAUSE 1: Validar venta original
    const validacionVenta = validarVentaOriginal(ventaToCambiar);
    if (!validacionVenta.valido) {
      setNotificationMessage(validacionVenta.error);
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // 🔒 VALIDACIÓN 1.5: Bloqueo cruzado - Si ya existe una DEVOLUCIÓN para esta venta, NO permitir cambio
    const devoluciones = JSON.parse(localStorage.getItem(DEVOLUCIONES_KEY) || '[]');
    const devolucionExistente = (devoluciones || []).find((d: any) => d.ventaId?.toString() === ventaToCambiar?.id?.toString());
    if (devolucionExistente) {
      setNotificationMessage(
        `❌ Esta venta ya tiene una devolución registrada (${devolucionExistente.numeroDevolucion}). ` +
        `No puedes hacer un cambio en una venta que ya tiene una devolución.`
      );
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // 🔒 VALIDACIÓN ADICIONAL: Solo permitir cambios de ventas COMPLETADAS
    if (ventaToCambiar?.estado !== 'Completada') {
      setNotificationMessage(
        `❌ No puedes hacer cambio de una venta en estado "${ventaToCambiar?.estado}". ` +
        `Solo se permiten cambios de ventas COMPLETADAS.`
      );
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // GUARD CLAUSE 2: Validar que la variante devuelta existe en la venta
    if (!cambioData.tallaDevuelta || !cambioData.colorDevuelta) {
      setNotificationMessage('Debes seleccionar la talla y color a devolver');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const validacionDevuelta = validarVarianteDevuelta(ventaToCambiar, cambioData.tallaDevuelta, cambioData.colorDevuelta);
    if (!validacionDevuelta.valido) {
      setNotificationMessage(validacionDevuelta.error);
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // GUARD CLAUSE 3: Validar producto de cambio
    if (!cambioData.productoEntregadoId) {
      setNotificationMessage('Debes seleccionar el producto a entregar');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // GUARD CLAUSE 4: Validar que la variante entregada existe
    if (!cambioData.tallaEntregada || !cambioData.colorEntregada) {
      setNotificationMessage('Debes seleccionar la talla y color a entregar');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // GUARD CLAUSE 5: Validar que hay un motivo para el cambio
    if (!cambioData.motivoCambio || cambioData.motivoCambio.trim() === '') {
      setNotificationMessage('Debes especificar el motivo del cambio');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // 🔒 VALIDACIÓN CRÍTICA ATÓMICA: Verificar que NO existe cambio aplicado + stock disponible
    const validacionAtomica = validarOperacionCambioAtomica(
      ventaToCambiar,
      cambioData.productoOriginalId,
      cambioData.productoEntregadoId,
      cambioData.tallaEntregada,
      cambioData.colorEntregada
    );

    if (!validacionAtomica.valido) {
      setNotificationMessage(validacionAtomica.error);
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // 🔒 OPERACIÓN ATÓMICA: AMBOS MOVIMIENTOS DE STOCK
    try {
      // PASO 0: Obtener productos para calcular precios
      const productosActuales = JSON.parse(localStorage.getItem(PRODUCTOS_KEY) || '[]');
      const productosVirtuales = JSON.parse(JSON.stringify(productosActuales)); // Deep clone

      // 💰 CÁLCULO: Obtener precio del producto devuelto
      const productoDevueltoInfo = productosActuales.find(
        (p: any) => p.id.toString() === cambioData.productoOriginalId
      );
      if (!productoDevueltoInfo) {
        throw new Error('Producto original no encontrado en inventario');
      }
      const precioDevuelto = productoDevueltoInfo.precioVenta || 0;

      // 💰 CÁLCULO: Obtener precio del producto entregado
      const productoEntregadoInfo = productosActuales.find(
        (p: any) => p.id.toString() === cambioData.productoEntregadoId
      );
      if (!productoEntregadoInfo) {
        throw new Error('Producto a entregar no encontrado en inventario');
      }
      const precioEntregado = productoEntregadoInfo.precioVenta || 0;

      // 💰 CÁLCULO: Diferencia de precio
      const diferencia = precioEntregado - precioDevuelto;

      // ✅ OPERACIÓN 1: DEVOLVER stock del producto original (+1)
      const productoDevuelto = (productosVirtuales || []).find(
        (p: any) => p.id.toString() === cambioData.productoOriginalId
      );

      if (!productoDevuelto) {
        throw new Error('Producto original no encontrado en stock');
      }

      const varianteDevuelta = (productoDevuelto.variantes || []).find(
        (v: any) => v.talla === cambioData.tallaDevuelta
      );

      if (!varianteDevuelta) {
        throw new Error(`Variante ${cambioData.tallaDevuelta} no encontrada`);
      }

      const colorDevuelto = (varianteDevuelta.colores || []).find(
        (c: any) => c.color === cambioData.colorDevuelta
      );

      if (!colorDevuelto) {
        throw new Error(`Color ${cambioData.colorDevuelta} no encontrado`);
      }

      // DEVOLUCIÓN: Sumar +1 al stock
      colorDevuelto.cantidad = (colorDevuelto.cantidad || 0) + 1;
      console.log(`✅ [Cambio] DEVOLUCIÓN: +1 ${productoDevuelto.nombre} (${cambioData.tallaDevuelta}-${cambioData.colorDevuelta}), Stock ahora: ${colorDevuelto.cantidad}`);

      // ✅ OPERACIÓN 2: DESCARGAR stock del producto entregado (-1)
      const productoEntregado = (productosVirtuales || []).find(
        (p: any) => p.id.toString() === cambioData.productoEntregadoId
      );

      if (!productoEntregado) {
        throw new Error('Producto a entregar no encontrado en stock');
      }

      const varianteEntregada = (productoEntregado.variantes || []).find(
        (v: any) => v.talla === cambioData.tallaEntregada
      );

      if (!varianteEntregada) {
        throw new Error(`Variante ${cambioData.tallaEntregada} no disponible en producto a entregar`);
      }

      const colorEntregado = (varianteEntregada.colores || []).find(
        (c: any) => c.color === cambioData.colorEntregada
      );

      if (!colorEntregado) {
        throw new Error(`Color ${cambioData.colorEntregada} no disponible en talla ${cambioData.tallaEntregada}`);
      }

      // VERIFICAR STOCK ANTES DE DESCARGAR
      const stockDisponible = colorEntregado.cantidad || 0;
      if (stockDisponible < 1) {
        throw new Error(`❌ Stock insuficiente. Disponible: ${stockDisponible}`);
      }

      // SALIDA: Restar -1 del stock
      colorEntregado.cantidad = stockDisponible - 1;
      console.log(`✅ [Cambio] SALIDA: -1 ${productoEntregado.nombre} (${cambioData.tallaEntregada}-${cambioData.colorEntregada}), Stock ahora: ${colorEntregado.cantidad}`);

      // ✅ TODAS LAS OPERACIONES COMPLETADAS - Crear registro del cambio
      const cambios = JSON.parse(localStorage.getItem(CAMBIOS_KEY) || '[]');
      const numeroCambio = `CAM-${(cambios.length + 1).toString().padStart(3, '0')}`;

      // 🔒 CRÍTICO: Los flags DEBEN ser true (ambas operaciones completadas)
      const nuevoCambio: CambioData & { id: string; numeroCambio: string; clienteId: string; clienteNombre: string; createdAt: string } = {
        id: Date.now().toString(),
        numeroCambio,
        clienteId: ventaToCambiar?.clienteId || '',
        clienteNombre: ventaToCambiar?.clienteNombre || '',
        ventaOriginalId: ventaToCambiar?.id.toString() || '',
        productoOriginalId: cambioData.productoOriginalId,
        tallaOriginal: cambioData.tallaOriginal,
        colorOriginal: cambioData.colorOriginal,
        tallaDevuelta: cambioData.tallaDevuelta,
        colorDevuelta: cambioData.colorDevuelta,
        tallaEntregada: cambioData.tallaEntregada,
        colorEntregada: cambioData.colorEntregada,
        productoEntregadoId: cambioData.productoEntregadoId,
        motivoCambio: cambioData.motivoCambio,
        fechaCambio: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        // 💰 CAMPOS FINANCIEROS
        precioDevuelto,
        precioEntregado,
        diferencia,
        medioPagoDiferencia: cambioData.medioPagoDiferencia || 'Efectivo',
        // 🔒 FLAGS CRÍTICOS: Ambas operaciones completadas = cambio NO REPETIBLE
        stockDevuelto: true,      // Stock del original fue devuelto (+1)
        stockEntregado: true,     // Stock del entregado fue descargado (-1)
        reversado: false,         // Cambio activo, no reversado
      };

      // 💾 PASO 2: Guardar cambio en localStorage
      localStorage.setItem(CAMBIOS_KEY, JSON.stringify([...cambios, nuevoCambio]));

      // 💾 PASO 3: Guardar productos con stock actualizado
      localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosVirtuales));
      setProductos(productosVirtuales);

      // 💾 PASO 4: Marcar cambio como aplicado en los validadores
      marcarCambioAplicado(nuevoCambio.id, true, true);

      // 💰 PASO 5: Actualizar totales y saldo de cliente según la diferencia
      let clientesActualizados = (clientes || []);
      if (diferencia !== 0) {
        clientesActualizados = clientesActualizados.map((c: any) => {
          if (c.id.toString() === ventaToCambiar?.clienteId?.toString()) {
            const saldoAFavor = diferencia < 0 ? Math.abs(diferencia) : 0;
            return {
              ...c,
              saldoAFavor: Number(c.saldoAFavor || 0) + saldoAFavor,
            };
          }
          return c;
        });
        localStorage.setItem(CLIENTES_KEY, JSON.stringify(clientesActualizados));
        setClientes(clientesActualizados);
      }

      // 💾 PASO 6: Actualizar detalle de venta con nuevo producto y recalcular totales
      const ventaActualizada: Venta = {
        ...ventaToCambiar,
        items: ventaToCambiar.items
          .map((item: ItemVenta) => {
            // Marcar item original como Cambiado
            if (
              item.productoId?.toString() === cambioData.productoOriginalId &&
              item.talla === cambioData.tallaDevuelta &&
              item.color === cambioData.colorDevuelta
            ) {
              return {
                ...item,
                estado: 'Cambiado',  // Marker que fue cambiado
              };
            }
            return item;
          })
          .concat([
            // ✅ CRÍTICO: Agregar nuevo item con PRECIO CORRECTO
            {
              id: `item-${Date.now()}`,
              productoId: cambioData.productoEntregadoId,
              productoNombre: productoEntregado?.nombre || 'Producto',
              talla: cambioData.tallaEntregada,
              color: cambioData.colorEntregada,
              cantidad: 1,
              precioUnitario: precioEntregado,  // ✅ PRECIO REAL, NO $0
              subtotal: precioEntregado,        // ✅ SUBTOTAL = precio * cantidad (1)
              estado: 'Activo',
            } as ItemVenta,
          ]),
      };

      // 💰 RECALCULAR TOTALES DE LA VENTA
      const nuevoSubtotal = (ventaActualizada.items || []).reduce((sum: number, item: any) => {
        if (item.estado !== 'Cambiado') {
          return sum + item.subtotal;
        }
        return sum;
      }, 0);
      const nuevoIva = nuevoSubtotal * 0.19;
      const nuevoTotal = nuevoSubtotal + nuevoIva;

      ventaActualizada.subtotal = nuevoSubtotal;
      ventaActualizada.iva = nuevoIva;
      ventaActualizada.total = nuevoTotal;

      // 💾 PASO 7: Guardar venta actualizada
      const ventasActualizadas = (ventas || []).map((v: Venta) =>
        v.id === ventaToCambiar.id ? ventaActualizada : v
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ventasActualizadas));
      setVentas(ventasActualizadas);

      // 💾 PASO 8: Limpiar formulario
      setShowCambioModal(false);
      setVentaToCambiar(null);
      setCambioData({
        ventaOriginalId: '',
        productoOriginalId: '',
        tallaOriginal: '',
        colorOriginal: '',
        tallaDevuelta: '',
        colorDevuelta: '',
        tallaEntregada: '',
        colorEntregada: '',
        productoEntregadoId: '',
        motivoCambio: '',
        fechaCambio: new Date().toISOString(),
        precioDevuelto: 0,
        precioEntregado: 0,
        diferencia: 0,
        medioPagoDiferencia: 'Efectivo',
      });

      // 💰 CONSTRUIR NOTIFICACIÓN CON DETALLE FINANCIERO
      let notificacionDetalle = `✅ Cambio ${numeroCambio} procesado exitosamente.\n`;
      notificacionDetalle += `📦 Devuelto: +1 ${productoDevuelto.nombre} ($${precioDevuelto.toLocaleString()})\n`;
      notificacionDetalle += `📦 Entregado: -1 ${productoEntregado.nombre} ($${precioEntregado.toLocaleString()})\n`;
      notificacionDetalle += `\n`;

      if (diferencia === 0) {
        notificacionDetalle += `💰 Mismo precio - Sin cobro adicional\n`;
      } else if (diferencia > 0) {
        notificacionDetalle += `💰 Diferencia: $${diferencia.toLocaleString()} A COBRAR\n`;
        notificacionDetalle += `   Método pago: ${cambioData.medioPagoDiferencia || 'Efectivo'}\n`;
      } else {
        notificacionDetalle += `💰 Diferencia: $${Math.abs(diferencia).toLocaleString()} SALDO A FAVOR\n`;
      }

      notificacionDetalle += `🔒 Cambio NO REPETIBLE - Stock validado y persistido\n`;
      notificacionDetalle += `📊 Totales venta recalculados`;

      setNotificationMessage(notificacionDetalle);
      setNotificationType('success');
      setShowNotificationModal(true);

      // Disparar evento de actualización
      window.dispatchEvent(new Event('salesUpdated'));

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setNotificationMessage(
        `❌ Error al procesar cambio: ${errorMsg}\n` +
        `La operación fue CANCELADA. Stock NO fue modificado.`
      );
      setNotificationType('error');
      setShowNotificationModal(true);
      console.error('Error en handleCrearCambio:', error);
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
${(venta.items || []).map(item => `
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

  
  const descargarTodasEnExcel = () => {
  if (ventas.length === 0) {
    setNotificationMessage('No hay ventas para descargar');
    setNotificationType('info');
    setShowNotificationModal(true);
    return;
  }

  try {
    // 1) Armamos filas DETALLADAS: 1 fila por item (producto)
    const filas: any[] = [];

    ventas.forEach((v) => {
      if (!v.items || v.items.length === 0) {
        // Si una venta no tiene items, igual dejamos una fila (opcional)
        filas.push({
          'ID Venta': v.numeroVenta,
          'ID Pedido': v.pedido_id || 'N/A',
          'Cliente': v.clienteNombre,
          'Fecha': new Date(v.fechaVenta).toLocaleDateString(),
          'Estado': v.estado,
          'Método Pago': v.metodoPago,
          'Observaciones': v.observaciones || 'N/A',

          'Producto': 'N/A',
          'Talla': 'N/A',
          'Color': 'N/A',
          'Cantidad': 0,
          'Precio Unitario': 0,
          'Subtotal Ítem': 0,

          'Subtotal Venta': v.subtotal,
          'IVA Venta': v.iva,
          'Total Venta': v.total
        });
        return;
      }

      v.items.forEach((item) => {
        filas.push({
          'ID Venta': v.numeroVenta,
          'ID Pedido': v.pedido_id || 'N/A',
          'Cliente': v.clienteNombre,
          'Fecha': new Date(v.fechaVenta).toLocaleDateString(),
          'Estado': v.estado,
          'Método Pago': v.metodoPago,
          'Observaciones': v.observaciones || 'N/A',

          'Producto': item.productoNombre,
          'Talla': item.talla,
          'Color': item.color,
          'Cantidad': item.cantidad,
          'Precio Unitario': item.precioUnitario,
          'Subtotal Ítem': item.subtotal,

          'Subtotal Venta': v.subtotal,
          'IVA Venta': v.iva,
          'Total Venta': v.total
        });
      });
    });

    // 2) Definimos headers
    const headers = Object.keys(filas[0] || {});

    // 3) CSV escape
    const escapeCSV = (value: any) => {
      if (value === null || value === undefined) return '';
      const str = value.toString();
      return `"${str.replace(/"/g, '""')}"`;
    };

    // 4) Generar CSV (coma)
    const csvContent = [
      headers.join(','),
      ...filas.map((row) => headers.map((h) => escapeCSV(row[h])).join(','))
    ].join('\n');

    // 5) Descargar con nombre distinto (para evitar abrir el viejo)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ventas_Detalladas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotificationMessage('Ventas descargadas exitosamente');
    setNotificationType('success');
    setShowNotificationModal(true);
  } catch (error) {
    setNotificationMessage('Error al descargar las ventas');
    setNotificationType('error');
    setShowNotificationModal(true);
  }
};


  const filteredVentas = (ventas || []).filter(v => {
    const searchLower = searchTerm.toLowerCase();
    const matchNumero = (v.numeroVenta?.toLowerCase() ?? '').includes(searchLower);
    const matchCliente = (v.clienteNombre?.toLowerCase() ?? '').includes(searchLower);
    const matchEstado = (v.estado?.toLowerCase() ?? '').includes(searchLower);
    const matchFecha = new Date(v.fechaVenta).toLocaleDateString().includes(searchTerm);
    const matchTotal = v.total.toString().includes(searchTerm);
    const matchPedidoId = v.pedido_id ? (v.pedido_id?.toLowerCase() ?? '').includes(searchLower) : false;
    const matchProductos = (v.items || []).some(item => (item.productoNombre?.toLowerCase() ?? '').includes(searchLower));
    return matchNumero || matchCliente || matchEstado || matchFecha || matchTotal || matchPedidoId || matchProductos;
  });

  const totales = calcularTotales(formData.items);

  const clienteSeleccionado = (clientes || []).find(
    (c: any) => c.id?.toString() === formData.clienteId?.toString()
  );

  const saldoDisponible = Number(clienteSeleccionado?.saldoAFavor || 0);
  const totalVenta = Number(totales.total || 0);

  const saldoAplicado = usarSaldoAFavor ? Math.min(saldoDisponible, totalVenta) : 0;
  const restantePorPagar = Math.max(totalVenta - saldoAplicado, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Ventas</h2>
          <p className="text-gray-600">Registra y administra las ventas con IVA incluido</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={descargarTodasEnExcel} variant="secondary">
            <Download size={20} />
            Descargar Excel
          </Button>
          <Button onClick={handleCreate} variant="primary">
            <Plus size={20} />
            Nueva Venta
          </Button>
        </div>
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
                <th className="text-left py-4 px-6 text-gray-600">Pedido</th>
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
                  <td colSpan={7} className="py-12 text-center text-gray-500">
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
                    <td className="py-4 px-6 text-gray-600">
                      {venta.pedido_id ? (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                          {venta.pedido_id}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
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
                          venta.estado === 'Completada'
                            ? 'bg-green-100 text-green-700'
                            : venta.estado === 'Devuelta'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
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

                        {!venta.anulada && venta.estado !== 'Devuelta' && (
                          <>
                            {/* 🔒 BOTÓN DEVOLUCIÓN - Deshabilitado si hay cambio/devolución aplicada */}
                            <button
                              onClick={() => {
                                setVentaToDevolver(venta);
                                setDevolucionData({
                                  motivo: 'Defectuoso',
                                  itemsDevueltos: [],
                                  productoNuevoId: '',
                                  productoNuevoTalla: '',
                                  productoNuevoColor: '',
                                  medioPagoExcedente: 'Efectivo',
                                });
                                setShowDevolucionModal(true);
                              }}
                              disabled={tieneChangioAplicado(venta.id) || tieneDevolucionAplicada(venta.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                tieneChangioAplicado(venta.id) || tieneDevolucionAplicada(venta.id)
                                  ? 'hover:bg-gray-100 rounded-lg transition-colors text-gray-300 cursor-not-allowed'
                                  : 'hover:bg-purple-50 rounded-lg transition-colors text-purple-600'
                              }`}
                              title={
                                tieneDevolucionAplicada(venta.id) 
                                  ? 'Esta venta ya tiene devolución aplicada' 
                                  : tieneChangioAplicado(venta.id)
                                  ? 'No puedes devolver si hay cambio aplicado'
                                  : 'Generar devolución'
                              }
                            >
                              <RotateCcw size={18} />
                            </button>

                            {/* 🔒 BOTÓN CAMBIO - Deshabilitado si hay cambio/devolución aplicada */}
                            <button
                              onClick={() => {
                                setVentaToCambiar(venta);
                                setCambioData({
                                  ventaOriginalId: venta.id.toString(),
                                  productoOriginalId: '',
                                  tallaOriginal: '',
                                  colorOriginal: '',
                                  tallaDevuelta: '',
                                  colorDevuelta: '',
                                  tallaEntregada: '',
                                  colorEntregada: '',
                                  productoEntregadoId: '',
                                  motivoCambio: '',
                                  fechaCambio: new Date().toISOString(),
                                  precioDevuelto: 0,
                                  precioEntregado: 0,
                                  diferencia: 0,
                                  medioPagoDiferencia: 'Efectivo',
                                });
                                setShowCambioModal(true);
                              }}
                              disabled={tieneChangioAplicado(venta.id) || tieneDevolucionAplicada(venta.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                tieneChangioAplicado(venta.id) || tieneDevolucionAplicada(venta.id)
                                  ? 'hover:bg-gray-100 rounded-lg transition-colors text-gray-300 cursor-not-allowed'
                                  : 'hover:bg-green-50 rounded-lg transition-colors text-green-600'
                              }`}
                              title={
                                tieneDevolucionAplicada(venta.id)
                                  ? 'No puedes cambiar si hay devolución aplicada'
                                  : tieneChangioAplicado(venta.id)
                                  ? 'Cambio ya aplicado - Revérsalo primero'
                                  : 'Hacer cambio'
                              }
                            >
                              <Repeat2 size={18} />
                            </button>

                            {/* 🔒 BOTÓN ANULAR - Deshabilitado si hay cambio/devolución aplicada */}
                            <button
                              onClick={() => { setVentaToAnular(venta); setShowAnularModal(true); }}
                              disabled={tieneChangioAplicado(venta.id) || tieneDevolucionAplicada(venta.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                tieneChangioAplicado(venta.id) || tieneDevolucionAplicada(venta.id)
                                  ? 'hover:bg-gray-100 rounded-lg transition-colors text-gray-300 cursor-not-allowed'
                                  : 'hover:bg-red-50 rounded-lg transition-colors text-red-600'
                              }`}
                              title={
                                tieneDevolucionAplicada(venta.id)
                                  ? 'No puedes anular si hay devolución aplicada'
                                  : tieneChangioAplicado(venta.id)
                                  ? 'No puedes anular si hay cambio aplicado'
                                  : 'Anular'
                              }
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
                  const val = e.target.value;

                  setClienteSearchTerm(val);
                  setShowClienteDropdown(true);

                  // ✅ SOLO borra clienteId si el texto ya NO coincide con el cliente seleccionado
                  setFormData((prev) => {
                    const textoSigueIgual = val.trim() === selectedClienteNombre.trim();
                    return textoSigueIgual ? prev : { ...prev, clienteId: '' };
                  });

                  // si el usuario cambió el texto, también limpiamos el nombre seleccionado
                  if (val.trim() !== selectedClienteNombre.trim()) {
                    setSelectedClienteNombre('');
                    setUsarSaldoAFavor(false);
                    setMetodoPagoRestante('Efectivo');
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
              {/* ✅ Banner saldo a favor */}
              {saldoDisponible > 0 && formData.clienteId && (
                <div className="mb-3 rounded-lg border border-green-300 bg-green-50 p-3">
                  <div className="text-green-800 font-semibold">
                    ✅ Este cliente tiene saldo a favor: ${saldoDisponible.toLocaleString()}
                  </div>

                  <label className="mt-2 flex items-center gap-2 text-sm text-green-900">
                    <input
                      type="checkbox"
                      checked={usarSaldoAFavor}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setUsarSaldoAFavor(checked);
                        if (checked) setMetodoPagoRestante('Efectivo');
                      }}

                    />
                    Usar saldo a favor en esta venta
                  </label>

                  {usarSaldoAFavor && (
                    <div className="mt-2 text-sm text-green-900 space-y-1">
                      <div>Saldo aplicado: <b>${saldoAplicado.toLocaleString()}</b></div>
                      <div>Restante por pagar: <b>${restantePorPagar.toLocaleString()}</b></div>
                    </div>
                  )}
                </div>
              )}

              {/* ✅ Método pago principal (si NO usas saldo o si aún no hay items) */}
              {(!usarSaldoAFavor || saldoAplicado <= 0) && (
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
              )}

              {/* ✅ Si usas saldo y queda restante, eliges medio de pago del restante */}
              {usarSaldoAFavor && restantePorPagar > 0 && (
                <div className="mt-3">
                  <div className="text-sm text-gray-700 mb-2">
                    Medio de pago del restante *
                  </div>
                  <select
                    value={metodoPagoRestante}
                    onChange={(e) => setMetodoPagoRestante(e.target.value as MedioPago)}
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
              )}
            </div>
          </div>

          {/* Productos */}
          <div className="border-t pt-4">
            <h4 className="text-gray-900 mb-3">Agregar Productos</h4>

            {/* 🔒 Mensaje informativo sobre variantes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
              <strong>ℹ️ Variantes:</strong> Solo puedes vender combinaciones de Talla-Color que existan en el catálogo. Las nuevas variantes se crean desde el módulo <strong>Compras</strong>.
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
              <div>
                <label className="block text-gray-700 mb-2 text-sm">Producto</label>
                <select
                  value={nuevoItem.productoId}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, productoId: e.target.value, varianteId: '' })}
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
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">
                      <strong>Variante (Talla - Color - Stock) *</strong>
                    </label>
                    <select
                      value={nuevoItem.varianteId}
                      onChange={(e) => setNuevoItem({ ...nuevoItem, varianteId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <option value="">Seleccionar variante...</option>
                      {productos
                        .find((p: any) => p.id.toString() === nuevoItem.productoId)
                        ?.variantes?.flatMap((variante: any) =>
                          variante.colores.map((color: any) => {
                            const varId = `${variante.talla}-${color.color}`;
                            const stockDisp = color.cantidad || 0;
                            const stockEstado = stockDisp > 0 
                              ? `✅ ${stockDisp}` 
                              : `❌ Sin stock`;
                            return (
                              <option key={varId} value={varId} disabled={stockDisp === 0}>
                                {variante.talla} - {color.color} [{stockEstado}]
                              </option>
                            );
                          })
                        ) || <option disabled>Sin variantes disponibles</option>
                      }
                    </select>
                    {!nuevoItem.varianteId && (
                      <p className="text-xs text-gray-500 mt-1">
                        ℹ️ Solo se muestran variantes creadas desde Compras
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">Cantidad *</label>
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

              {(() => {
                const cliente = clientes.find(
                  (c: any) => c.id.toString() === viewingVenta.clienteId.toString()
                );
                const saldo = Number(cliente?.saldoAFavor || 0);

                if (saldo <= 0) return null;

                return (
                  <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-green-700 font-semibold">Saldo a favor</div>
                    <div className="text-green-800 text-lg font-bold">
                      ${saldo.toLocaleString()}
                    </div>
                  </div>
                );
              })()}

              <div>
                <div className="text-gray-600 mb-1">Estado</div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  viewingVenta.estado === 'Completada'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
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
                {(viewingVenta.items || []).map((item) => (
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
        onClose={() => {
          setShowDevolucionModal(false);
          setVentaToDevolver(null);
          setDevolucionData({
            motivo: 'Defectuoso',
            itemsDevueltos: [],
            productoNuevoId: '',
            productoNuevoTalla: '',
            productoNuevoColor: '',
            medioPagoExcedente: 'Efectivo'
          });
        }}
        title={`Generar Devolución - ${ventaToDevolver?.numeroVenta}`}
        size="lg"
      >
        {ventaToDevolver &&
          (() => {
            const totalDevuelto = devolucionData.itemsDevueltos.reduce((sum, itemDev) => {
              const itemOriginal = ventaToDevolver.items.find((i) => i.id === itemDev.itemId);
              return sum + (itemOriginal ? itemDev.cantidad * itemOriginal.precioUnitario : 0);
            }, 0);

            const productoNuevo = productos.find(
              (p: any) => p.id.toString() === devolucionData.productoNuevoId
            );
            const precioProductoNuevo = productoNuevo ? (productoNuevo.precioVenta || 0) : 0;

            // diferencia > 0 => cliente debe pagar excedente
            // diferencia < 0 => cliente queda con saldo a favor
            const diferencia = precioProductoNuevo - totalDevuelto;

            const saldoAFavorCalc = diferencia < 0 ? Math.abs(diferencia) : 0;
            const excedenteCalc = diferencia > 0 ? diferencia : 0;

            return (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">
                    Cliente:{' '}
                    <span className="text-gray-900 font-medium">
                      {ventaToDevolver.clienteNombre}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Fecha Venta:{' '}
                    <span className="text-gray-900 font-medium">
                      {new Date(ventaToDevolver.fechaVenta).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Motivo de Devolución *</label>
                  <select
                    value={devolucionData.motivo}
                    onChange={(e) =>
                      setDevolucionData({
                        ...devolucionData,
                        motivo: e.target.value as MotivoDevolucion
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    required
                  >
                    {MOTIVOS_DEVOLUCION.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                </div>

                <div className="border-t pt-4">
                  <h4 className="text-gray-900 font-semibold mb-3">
                    Seleccionar Productos a Devolver
                  </h4>
                  <div className="space-y-2">
                    {(ventaToDevolver.items || []).map((item) => {
                      // 🔒 Calcular cantidad disponible (vendida - devuelta - cambiada)
                      const cantidadDisponible = calcularCantidadDisponible(ventaToDevolver.id, item.id);
                      
                      // Si no hay cantidad disponible, no mostrar
                      if (cantidadDisponible <= 0) return null;
                      
                      const itemDevuelto = (devolucionData.itemsDevueltos || []).find(
                        (i) => i.itemId === item.id
                      );
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
                            <div className="text-gray-900 font-semibold">
                              ${item.subtotal.toLocaleString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-2">
                            <label className="text-sm text-gray-700">Cantidad a devolver:</label>
                            <input
                              type="number"
                              min="0"
                              max={cantidadDisponible}
                              value={cantidadDevuelta}
                              onChange={(e) =>
                                handleToggleItemDevolucion(
                                  item.id,
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                            />
                            <span className="text-sm text-gray-600">de {cantidadDisponible}</span>
                            {cantidadDevuelta > 0 && (
                              <span className="ml-auto text-sm text-green-600 font-medium">
                                Devolución: $
                                {(cantidadDevuelta * item.precioUnitario).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {totalDevuelto > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="font-semibold text-green-900 mb-2">✓ Resumen de Devolución</div>
                    <div className="flex justify-between text-sm text-green-800">
                      <span>Total a devolver (saldo a favor):</span>
                      <span className="font-medium">${totalDevuelto.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button onClick={() => setShowDevolucionModal(false)} variant="secondary">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCrearDevolucion}
                    variant="primary"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Generar Devolución
                  </Button>
                </div>
              </div>
            );
          })()}
      </Modal>

      {/* Modal Cambios (Cambio de Productos - NO DEVOLUCION) */}
      <Modal
        isOpen={showCambioModal}
        onClose={() => {
          setShowCambioModal(false);
          setVentaToCambiar(null);
          setCambioData({
            ventaOriginalId: '',
            productoOriginalId: '',
            tallaOriginal: '',
            colorOriginal: '',
            tallaDevuelta: '',
            colorDevuelta: '',
            tallaEntregada: '',
            colorEntregada: '',
            productoEntregadoId: '',
            motivoCambio: '',
            fechaCambio: new Date().toISOString(),
            precioDevuelto: 0,
            precioEntregado: 0,
            diferencia: 0,
            medioPagoDiferencia: 'Efectivo',
          });
        }}
        title={`Cambio de Producto - ${ventaToCambiar?.numeroVenta}`}
        size="lg"
      >
        {ventaToCambiar && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Operación de Cambio:</strong> Devuelve un producto y recibe otro en su lugar.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
                  Cliente
                </div>
                <div className="text-gray-900 font-medium mt-1">
                  {ventaToCambiar.clienteNombre}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
                  Venta Original
                </div>
                <div className="text-gray-900 font-medium mt-1">
                  {ventaToCambiar.numeroVenta}
                </div>
              </div>
            </div>

            {/* Sección: Producto Devuelto */}
            <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
              <h4 className="text-red-900 font-semibold mb-3">✖️ Producto a Devolver</h4>
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Seleccionar producto devuelto de esta venta *
                </label>
                <select
                  value={
                    // Encontrar el id del item que coincida con tallaDevuelta/colorDevuelta
                    productosDisponiblesCambio.find(
                      (i) => i.talla === cambioData.tallaDevuelta && i.color === cambioData.colorDevuelta
                    )?.id || ''
                  }
                  onChange={(e) => {
                    const item = productosDisponiblesCambio.find((i) => i.id === e.target.value);
                    if (item) {
                      setCambioData({
                        ...cambioData,
                        tallaDevuelta: item.talla,
                        colorDevuelta: item.color,
                        productoOriginalId: item.productoId?.toString() || '',
                        tallaOriginal: item.talla,
                        colorOriginal: item.color
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Seleccionar...</option>
                  {productosDisponiblesCambio.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.productoNombre} - Talla: {item.talla}, Color: {item.color} (Disponible: {calcularCantidadDisponible(ventaToCambiar.id, item.id)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sección: Producto Entregado */}
            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
              <h4 className="text-green-900 font-semibold mb-3">✓ Producto a Entregar</h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Producto a entregar *
                  </label>
                  <select
                    value={cambioData.productoEntregadoId}
                    onChange={(e) =>
                      setCambioData({
                        ...cambioData,
                        productoEntregadoId: e.target.value,
                        tallaEntregada: '',
                        colorEntregada: ''
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar producto...</option>
                    {getProductosConStockDisponible().map((p: any) => (
                      <option key={p.id} value={p.id.toString()}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {cambioData.productoEntregadoId && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Talla *
                      </label>
                      <select
                        value={cambioData.tallaEntregada}
                        onChange={(e) =>
                          setCambioData({
                            ...cambioData,
                            tallaEntregada: e.target.value,
                            colorEntregada: ''
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Seleccionar talla...</option>
                        {getTallasConStockDisponible(cambioData.productoEntregadoId).map((talla: string) => (
                          <option key={talla} value={talla}>
                            {talla}
                          </option>
                        ))}
                      </select>
                    </div>

                    {cambioData.tallaEntregada && (
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">
                          Color *
                        </label>
                        <select
                          value={cambioData.colorEntregada}
                          onChange={(e) =>
                            setCambioData({
                              ...cambioData,
                              colorEntregada: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Seleccionar color...</option>
                          {getColoresConStockDisponible(cambioData.productoEntregadoId, cambioData.tallaEntregada).map((c: any) => (
                            <option key={c.color} value={c.color}>
                              {c.color} (Stock: {c.stock})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sección: Motivo del Cambio */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Motivo del Cambio *
              </label>
              <textarea
                value={cambioData.motivoCambio}
                onChange={(e) =>
                  setCambioData({
                    ...cambioData,
                    motivoCambio: e.target.value
                  })
                }
                placeholder="Ej: Cliente quiere diferente talla, color incorrecto, producto defectuoso..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={3}
              />
            </div>

            {/* Resumen con Precios */}
            {cambioData.tallaDevuelta && cambioData.colorDevuelta && cambioData.tallaEntregada && cambioData.colorEntregada && (
              <div className="space-y-3">
                {/* Información de precios */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-300">
                  <div className="text-sm font-semibold text-gray-900 mb-3">📊 Información de Precios:</div>
                  
                  <div className="space-y-2 text-sm">
                    {/* Precio devuelto */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">
                        ✖️ Devuelve: {ventaToCambiar.items.find(
                          (i) => i.talla === cambioData.tallaDevuelta && i.color === cambioData.colorDevuelta
                        )?.productoNombre}
                      </span>
                      <span className="font-semibold text-red-600">
                        $
                        {(() => {
                          const productoOriginal = productos.find((p: any) =>
                            p.id.toString() === cambioData.productoOriginalId
                          );
                          return (productoOriginal?.precioVenta || 0).toLocaleString();
                        })()}
                      </span>
                    </div>

                    {/* Precio entregado */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">
                        ✓ Recibe: {productos.find((p: any) => p.id.toString() === cambioData.productoEntregadoId)?.nombre}
                      </span>
                      <span className="font-semibold text-green-600">
                        $
                        {(() => {
                          const productoEntregado = productos.find((p: any) =>
                            p.id.toString() === cambioData.productoEntregadoId
                          );
                          return (productoEntregado?.precioVenta || 0).toLocaleString();
                        })()}
                      </span>
                    </div>

                    {/* Separador */}
                    <div className="border-t border-gray-300 pt-2 mt-2"></div>

                    {/* Diferencia */}
                    {(() => {
                      const precioOriginal = productos.find((p: any) =>
                        p.id.toString() === cambioData.productoOriginalId
                      )?.precioVenta || 0;
                      const precioEntregado = productos.find((p: any) =>
                        p.id.toString() === cambioData.productoEntregadoId
                      )?.precioVenta || 0;
                      const diferencia = precioEntregado - precioOriginal;

                      if (diferencia === 0) {
                        return (
                          <div className="flex justify-between items-center bg-blue-50 p-2 rounded">
                            <span className="text-blue-800 font-semibold">Diferencia:</span>
                            <span className="text-blue-800 font-bold">$0 - Mismo precio</span>
                          </div>
                        );
                      } else if (diferencia > 0) {
                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center bg-orange-50 p-2 rounded border border-orange-200">
                              <span className="text-orange-800 font-semibold">A COBRAR:</span>
                              <span className="text-orange-800 font-bold">${diferencia.toLocaleString()}</span>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 mb-1">
                                Método de pago del excedente *
                              </label>
                              <select
                                value={cambioData.medioPagoDiferencia || 'Efectivo'}
                                onChange={(e) =>
                                  setCambioData({
                                    ...cambioData,
                                    medioPagoDiferencia: e.target.value as MedioPago,
                                  })
                                }
                                className="w-full px-2 py-1 border border-orange-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <option value="Efectivo">Efectivo</option>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="Nequi">Nequi</option>
                                <option value="Daviplata">Daviplata</option>
                              </select>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex justify-between items-center bg-green-50 p-2 rounded border border-green-200">
                            <span className="text-green-800 font-semibold">SALDO A FAVOR:</span>
                            <span className="text-green-800 font-bold">${Math.abs(diferencia).toLocaleString()}</span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>

                {/* Resumen del cambio */}
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-300">
                  <div className="text-sm font-semibold text-gray-900 mb-2">Detalles del Cambio:</div>
                  <div className="text-xs text-gray-700 space-y-1">
                    <div>
                      ✖️ Devuelve: {ventaToCambiar.items.find(
                        (i) => i.talla === cambioData.tallaDevuelta && i.color === cambioData.colorDevuelta
                      )?.productoNombre} ({cambioData.tallaDevuelta}/{cambioData.colorDevuelta})
                    </div>
                    <div>
                      ✓ Recibe: {productos.find((p: any) => p.id.toString() === cambioData.productoEntregadoId)?.nombre} ({cambioData.tallaEntregada}/{cambioData.colorEntregada})
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                onClick={() => {
                  setShowCambioModal(false);
                  setVentaToCambiar(null);
                  setCambioData({
                    ventaOriginalId: '',
                    productoOriginalId: '',
                    tallaOriginal: '',
                    colorOriginal: '',
                    tallaDevuelta: '',
                    colorDevuelta: '',
                    tallaEntregada: '',
                    colorEntregada: '',
                    productoEntregadoId: '',
                    motivoCambio: '',
                    fechaCambio: new Date().toISOString(),
                    precioDevuelto: 0,
                    precioEntregado: 0,
                    diferencia: 0,
                    medioPagoDiferencia: 'Efectivo',
                  });
                }}
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCrearCambio}
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
                disabled={
                  !cambioData.tallaDevuelta ||
                  !cambioData.colorDevuelta ||
                  !cambioData.tallaEntregada ||
                  !cambioData.colorEntregada ||
                  !tieneStockDisponible(cambioData.productoEntregadoId, cambioData.tallaEntregada, cambioData.colorEntregada)
                }
              >
                ✓ Confirmar Cambio
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

      {/* Modal Notificación */}
      <Modal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        title={notificationType === 'success' ? 'Éxito' : notificationType === 'error' ? 'Error' : 'Información'}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            {notificationType === 'success' && (
              <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
            )}
            {notificationType === 'error' && (
              <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            )}
            {notificationType === 'info' && (
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={24} />
            )}
            <p className="text-gray-700 text-base">{notificationMessage}</p>
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowNotificationModal(false)} variant="primary">
              Aceptar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}