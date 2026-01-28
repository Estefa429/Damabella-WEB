import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Eye,
  Ban,
  RotateCcw,
  X,
  UserPlus,
  Download,
  ShoppingBag,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button, Input, Modal } from '../../../../shared/components/native';

const STORAGE_KEY = 'damabella_ventas';
const CLIENTES_KEY = 'damabella_clientes';
const PRODUCTOS_KEY = 'damabella_productos';
const DEVOLUCIONES_KEY = 'damabella_devoluciones';

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
  estado: 'Completada' | 'Anulada' | 'Devolución';
  items: ItemVenta[];
  subtotal: number;
  iva: number;
  total: number;
  metodoPago: string;
  observaciones: string;
  anulada: boolean;
  motivoAnulacion?: string;
  createdAt: string;
  pedido_id?: string | null;
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
    talla: '',
    color: '',
    cantidad: '1',
    precioUnitario: ''
  });

  const [devolucionData, setDevolucionData] = useState<DevolucionData>({
  motivo: 'Defectuoso',
  itemsDevueltos: [],
  productoNuevoId: '',
  productoNuevoTalla: '',
  productoNuevoColor: '',
  medioPagoExcedente: 'Efectivo',
});



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
        pedido_id: pedido.numeroPedido
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


  const generarNumeroVenta = () => `VEN-${ventaCounter.toString().padStart(3, '0')}`;

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
  setFormData((prev) => ({ ...prev, clienteId }));
  setClienteSearchTerm(clienteNombre);
  setSelectedClienteNombre(clienteNombre); // ✅ clave
  setShowClienteDropdown(false);
  setFormErrors((prev) => ({ ...prev, clienteId: undefined }));

  setUsarSaldoAFavor(false);
  setMetodoPagoRestante('Efectivo');
  };



  const filteredClientes = clientes.filter((c: any) =>
    (c.nombre?.toLowerCase() ?? '').includes(clienteSearchTerm.toLowerCase()) ||
    (c.numeroDoc ?? '').includes(clienteSearchTerm)
  );

  const getProductoSeleccionado = () => productos.find((p: any) => p.id.toString() === nuevoItem.productoId);

  const getTallasDisponibles = () => {
    const producto = getProductoSeleccionado();
    if (!producto) return [];
    if (producto.variantes) return producto.variantes.map((v: any) => v.talla);
    return producto.tallas || [];
  };

  const getColoresDisponibles = () => {
    const producto = getProductoSeleccionado();
    if (!producto) return [];
    if (producto.variantes && nuevoItem.talla) {
      const variante = producto.variantes.find((v: any) => v.talla === nuevoItem.talla);
      if (!variante) return [];
      return variante.colores.map((c: any) => c.color);
    }
    return producto.colores || [];
  };

  const getProductoNuevoSeleccionado = () =>
    productos.find((p: any) => p.id.toString() === devolucionData.productoNuevoId);

  const getTallasDisponiblesCambio = () => {
    const producto = getProductoNuevoSeleccionado();
    if (!producto) return [];
    if (producto.variantes) return producto.variantes.map((v: any) => v.talla);
    return producto.tallas || [];
  };

  const getColoresDisponiblesCambio = () => {
    const producto = getProductoNuevoSeleccionado();
    if (!producto) return [];
    if (producto.variantes && devolucionData.productoNuevoTalla) {
      const variante = producto.variantes.find((v: any) => v.talla === devolucionData.productoNuevoTalla);
      if (!variante) return [];
      return (variante.colores || []).map((c: any) => c.color);
    }
    return producto.colores || [];
  };


  const agregarItem = () => {
    if (!nuevoItem.productoId || !nuevoItem.talla || !nuevoItem.color || !nuevoItem.cantidad) {
      setNotificationMessage('Completa todos los campos del producto');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const producto = productos.find((p: any) => p.id.toString() === nuevoItem.productoId);
    if (!producto) return;

    const cantidad = parseInt(nuevoItem.cantidad, 10);
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

    setFormData({ ...formData, items: [...formData.items, item] });

    setNuevoItem({
      productoId: '',
      talla: '',
      color: '',
      cantidad: '1',
      precioUnitario: ''
    });
  };

  const eliminarItem = (itemId: string) => {
    setFormData({ ...formData, items: formData.items.filter(item => item.id !== itemId) });
  };

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
      createdAt: new Date().toISOString()
    };

    setVentas(prev => [...prev, ventaData]);
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

    setNotificationMessage('Venta creada exitosamente');
    setNotificationType('success');
    setShowNotificationModal(true);
  };

  const handleAnular = () => {
    if (!ventaToAnular || !motivoAnulacion.trim()) {
      setNotificationMessage('Debes ingresar un motivo de anulación');
      setNotificationType('error');
      setShowNotificationModal(true);
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

    setNotificationMessage('Venta anulada exitosamente');
    setNotificationType('success');
    setShowNotificationModal(true);
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
    if (!ventaToDevolver || !devolucionData.motivo) {
      setNotificationMessage('Debes seleccionar un motivo de devolución');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }


    if (devolucionData.itemsDevueltos.length === 0) {
      setNotificationMessage('Debes seleccionar al menos un producto para devolver');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    if (!devolucionData.productoNuevoId) {
      setNotificationMessage('Debes seleccionar el producto por el que se hará el cambio');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }
    if (!devolucionData.productoNuevoTalla || !devolucionData.productoNuevoColor) {
      setNotificationMessage('Debes seleccionar talla y color del producto nuevo');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }


    const devoluciones = JSON.parse(localStorage.getItem(DEVOLUCIONES_KEY) || '[]');
    const numeroDevolucion = `DEV-${(devoluciones.length + 1).toString().padStart(3, '0')}`;

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

    const totalDevolucion = (itemsDevueltos as any[]).reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const productoNuevo = productos.find((p: any) => p.id.toString() === devolucionData.productoNuevoId);
    if (!productoNuevo) {
      setNotificationMessage('Producto de cambio no encontrado');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const precioProductoNuevo = productoNuevo.precioVenta || 0;
    const diferencia = precioProductoNuevo - totalDevolucion;

    const saldoAFavor = diferencia < 0 ? Math.abs(diferencia) : 0;
    const diferenciaPagar = diferencia > 0 ? diferencia : 0;

    if (diferenciaPagar > 0 && !devolucionData.medioPagoExcedente) {
      setNotificationMessage('Debes seleccionar el medio de pago del excedente');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }


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

      // NUEVO: estado y datos del cambio
      estadoGestion: 'Cambiado',
      productoNuevo: {
        id: productoNuevo.id,
        nombre: productoNuevo.nombre,
        precio: precioProductoNuevo,
      },
      productoNuevoTalla: devolucionData.productoNuevoTalla,
      productoNuevoColor: devolucionData.productoNuevoColor,

      // NUEVO: balance
      saldoAFavor,
      diferenciaPagar,
      medioPagoExcedente: diferenciaPagar > 0 ? devolucionData.medioPagoExcedente : undefined,
    };


    localStorage.setItem(DEVOLUCIONES_KEY, JSON.stringify([...devoluciones, nuevaDevolucion]));

    // Actualizar saldo a favor del cliente
    const clientesActualizados = clientes.map((c: any) => {
      if (c.id.toString() === ventaToDevolver.clienteId.toString()) {
        return {
          ...c,
          saldoAFavor: Number(c.saldoAFavor || 0) + Number(saldoAFavor || 0),
        };
      }
      return c;
    });


    localStorage.setItem(CLIENTES_KEY, JSON.stringify(clientesActualizados));
    setClientes(clientesActualizados);

    // ✅ CAMBIO CLAVE: Marcar la venta como "Devolución"
    setVentas(prev =>
      prev.map(v =>
        v.id === ventaToDevolver.id
          ? { ...v, estado: 'Devolución' }
          : v
      )
    );

    // (Opcional) Notificar para sincronizar otras pestañas/listeners
    window.dispatchEvent(new Event('salesUpdated'));

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


    let msg = `Devolución ${numeroDevolucion} creada exitosamente. `;

    if (saldoAFavor > 0) {
      msg += `Saldo a favor: $${saldoAFavor.toLocaleString()}.`;
    } else if (diferenciaPagar > 0) {
      msg += `Excedente pagado: $${diferenciaPagar.toLocaleString()} (${devolucionData.medioPagoExcedente}).`;
    } else {
      msg += `Cambio exacto (sin saldo ni excedente).`;
    }

    setNotificationMessage(msg);

    setNotificationType('success');
    setShowNotificationModal(true);
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


  const filteredVentas = ventas.filter(v => {
    const searchLower = searchTerm.toLowerCase();
    const matchNumero = (v.numeroVenta?.toLowerCase() ?? '').includes(searchLower);
    const matchCliente = (v.clienteNombre?.toLowerCase() ?? '').includes(searchLower);
    const matchEstado = (v.estado?.toLowerCase() ?? '').includes(searchLower);
    const matchFecha = new Date(v.fechaVenta).toLocaleDateString().includes(searchTerm);
    const matchTotal = v.total.toString().includes(searchTerm);
    const matchPedidoId = v.pedido_id ? (v.pedido_id?.toLowerCase() ?? '').includes(searchLower) : false;
    const matchProductos = v.items.some(item => (item.productoNombre?.toLowerCase() ?? '').includes(searchLower));
    return matchNumero || matchCliente || matchEstado || matchFecha || matchTotal || matchPedidoId || matchProductos;
  });

  const totales = calcularTotales(formData.items);

  const clienteSeleccionado = clientes.find(
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
                        {/* ✅ CAMBIO: color para "Devolución" */}
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm ${
                          venta.estado === 'Completada'
                            ? 'bg-green-100 text-green-700'
                            : venta.estado === 'Devolución'
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

                        {!venta.anulada && (
                          <>
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
                        {getTallasDisponibles().map((talla: string) => (
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
                        {getColoresDisponibles().map((color: string) => (
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
                {/* ✅ CAMBIO: color para "Devolución" */}
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  viewingVenta.estado === 'Completada'
                    ? 'bg-green-100 text-green-700'
                    : viewingVenta.estado === 'Devolución'
                      ? 'bg-orange-100 text-orange-700'
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
                    {ventaToDevolver.items.map((item) => {
                      const itemDevuelto = devolucionData.itemsDevueltos.find(
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
                              max={item.cantidad}
                              value={cantidadDevuelta}
                              onChange={(e) =>
                                handleToggleItemDevolucion(
                                  item.id,
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                            />
                            <span className="text-sm text-gray-600">de {item.cantidad}</span>
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

                <div className="border-t pt-4">
                  <h4 className="text-gray-900 font-semibold mb-3">
                    Producto por el que se cambia *
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm">Producto nuevo</label>
                      <select
                        value={devolucionData.productoNuevoId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setDevolucionData({
                            ...devolucionData,
                            productoNuevoId: id,
                            productoNuevoTalla: '',
                            productoNuevoColor: '',
                          });
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        <option value="">Seleccionar producto...</option>
                        {productos
                          .filter((p: any) => p.activo)
                          .map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} - ${(p.precioVenta || 0).toLocaleString()}
                            </option>
                          ))}
                      </select>
                    </div>

                    {productoNuevo && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-700 mb-2 text-sm">Talla</label>
                          <select
                            value={devolucionData.productoNuevoTalla}
                            onChange={(e) =>
                              setDevolucionData({
                                ...devolucionData,
                                productoNuevoTalla: e.target.value,
                                productoNuevoColor: '',
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                          >
                            <option value="">Seleccionar...</option>
                            {getTallasDisponiblesCambio().map((t: string) => (
                              <option key={t} value={t}>{t}</option>
                            ))}

                          </select>
                        </div>

                        <div>
                          <label className="block text-gray-700 mb-2 text-sm">Color</label>
                          <select
                            value={devolucionData.productoNuevoColor}
                            onChange={(e) =>
                              setDevolucionData({
                                ...devolucionData,
                                productoNuevoColor: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                            disabled={!devolucionData.productoNuevoTalla}
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
                </div>

                {totalDevuelto > 0 && devolucionData.productoNuevoId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
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
                            value={devolucionData.medioPagoExcedente}
                            onChange={(e) =>
                              setDevolucionData({
                                ...devolucionData,
                                medioPagoExcedente: e.target.value as any,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                        El cambio queda en <span className="font-semibold">0</span> (sin saldo ni
                        excedente).
                      </div>
                    )}
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