import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Eye, X, CheckCircle, UserPlus, Download, AlertCircle, Pencil, Ban, ShoppingCart, Repeat } from 'lucide-react';
import { Button, Input, Modal } from '../../../../shared/components/native';
import { validateField } from '../../../../shared/utils/validation';
import { finalizarVenta, generarNumeroVenta } from '../../../../services/saleService';
import {
  cambiarEstadoPedidoCentralizado,
  puedeEditarse,
  puedeTransicionar,
  obtenerClaseEstado,
  obtenerDescripcionEstado,
  obtenerEstadosValidos,
  type EstadoPedido,
  type TipoTransicion,
} from '../../../../services/pedidosCentralizado';

const STORAGE_KEY = 'damabella_pedidos';
const CLIENTES_KEY = 'damabella_clientes';
const PRODUCTOS_KEY = 'damabella_productos';

// ✅ NUEVO: keys para Ventas (persistencia)
const VENTAS_KEY = 'damabella_ventas';
const VENTA_COUNTER_KEY = 'damabella_venta_counter';

interface ItemPedido {
  id: string;
  productoId: string;
  productoNombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Pedido {
  id: number;
  numeroPedido: string;
  tipo: 'Pedido';
  clienteId: string;
  clienteNombre: string;
  fechaPedido: string;
  estado: 'Pendiente' | 'Anulado' | 'Completada' | 'Convertido a venta';
  items: ItemPedido[];
  subtotal: number;
  iva: number;
  total: number;
  metodoPago: string;
  observaciones: string;
  direccionEnvio?: string;
  personaRecibe?: string;
  createdAt: string;
  venta_id?: string | null;
}

export default function PedidosManager() {
  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
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

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [viewingPedido, setViewingPedido] = useState<Pedido | null>(null);
  const [pedidoParaCambiarEstado, setPedidoParaCambiarEstado] = useState<Pedido | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteSearch, setClienteSearch] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState<Pedido['estado']>('Pendiente');

  // ====== BUSCADORES (Cliente / Producto) ======
  const [clienteQuery, setClienteQuery] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [selectedClienteNombre, setSelectedClienteNombre] = useState('');

  const [productoQuery, setProductoQuery] = useState('');
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);

  const [formData, setFormData] = useState({
    tipo: 'Pedido' as 'Pedido',
    clienteId: '',
    fechaPedido: new Date().toISOString().split('T')[0],
    metodoPago: 'Efectivo',
    observaciones: '',
    items: [] as ItemPedido[],
    direccionEnvio: '',
    personaRecibe: ''
  });

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    tipoDoc: 'CC',
    numeroDoc: '',
    telefono: '',
    email: '',
    direccion: ''
  });

  const [nuevoItem, setNuevoItem] = useState({
    productoId: '',
    talla: '',
    color: '',
    cantidad: '1',
    precioUnitario: ''
  });

  const [stockDisponible, setStockDisponible] = useState<number | null>(null);

  const [formErrors, setFormErrors] = useState<any>({});

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });

    // per-field validation for pedido form
    const errors: any = {};
    if (field === 'clienteId') {
      if (!value) errors.clienteId = 'Debes seleccionar un cliente';
    }
    if (field === 'fechaPedido') {
      if (!value) errors.fechaPedido = 'La fecha del pedido es obligatoria';
    }

    setFormErrors((prev: any) => ({ ...prev, ...errors, [field]: errors[field] }));
  };

  const handleNuevoItemChange = (field: string, value: any) => {
    setNuevoItem((prev: any) => {
      let newItem = prev;
      if (field === 'productoId') {
        // Limpiar talla, color y otros campos cuando se cambia el producto
        newItem = { ...prev, productoId: value, talla: '', color: '', cantidad: '1', precioUnitario: '' };
        setStockDisponible(null);
      } else if (field === 'talla') {
        // Limpiar color cuando se cambia la talla
        newItem = { ...prev, talla: value, color: '' };
        setStockDisponible(null);
      } else if (field === 'color') {
        newItem = { ...prev, color: value };
        // Calcular stock disponible cuando se selecciona color
        const producto = productos.find((p: any) => p.id.toString() === prev.productoId);
        if (producto && producto.variantes) {
          const varianteTalla = producto.variantes.find((v: any) => v.talla === prev.talla);
          if (varianteTalla) {
            const colorItem = varianteTalla.colores?.find((c: any) => c.color === value);
            if (colorItem) {
              setStockDisponible(colorItem.cantidad);
            } else {
              setStockDisponible(0);
            }
          } else {
            setStockDisponible(0);
          }
        } else {
          setStockDisponible(null);
        }
      } else {
        newItem = { ...prev, [field]: value };
      }
      return newItem;
    });

    // validate nuevo item minimal
    const key = `nuevoItem_${field}`;
    let err = '';
    if ((field === 'productoId' || field === 'talla' || field === 'color') && !value) {
      err = 'Campo obligatorio';
    }
    if (field === 'cantidad') {
      const n = parseInt(value as any);
      if (isNaN(n) || n < 1) err = 'Cantidad inválida';
    }
    setFormErrors((prev: any) => ({ ...prev, [key]: err }));
  };

  const handleNuevoClienteChange = (field: string, value: any) => {
    setNuevoCliente({ ...nuevoCliente, [field]: value });

    // validate nuevo cliente using shared validator where possible
    let err = '';
    if (field === 'nombre') {
      err = validateField('nombre', value) || '';
    }
    if (field === 'numeroDoc') {
      err = validateField('documento', value) || '';
    }
    if (field === 'email') {
      if (!value) return '';

      const emailRegex =
        /^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!emailRegex.test(value)) {
        err = 'Correo electrónico inválido';
      }
    }
    if (field === 'telefono') {
      if (!value) {
        err = 'Teléfono obligatorio';
      } else if (!/^\d+$/.test(value)) {
        err = 'El teléfono solo debe contener números';
      }
    }

    setFormErrors((prev: any) => ({ ...prev, [`nuevoCliente_${field}`]: err }));
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
  }, [pedidos]);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedProductos = localStorage.getItem(PRODUCTOS_KEY);
      const storedClientes = localStorage.getItem(CLIENTES_KEY);
      if (storedProductos) setProductos(JSON.parse(storedProductos));
      if (storedClientes) setClientes(JSON.parse(storedClientes));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('salesUpdated', handleStorageChange);

    return () => 
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('salesUpdated', handleStorageChange);
  }, []);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const onClick = () => {
      setShowClienteDropdown(false);
      setShowProductoDropdown(false);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const generarNumeroPedido = () => {
    const ultimoPedido = pedidos.length > 0
      ? Math.max(...pedidos.map(p => parseInt(p.numeroPedido.split('-')[1])))
      : 0;
    const nuevoNumero = (ultimoPedido + 1).toString().padStart(3, '0');
    return `PED-${nuevoNumero}`;
  };

  const calcularTotales = (items: ItemPedido[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  const handleCreate = () => {
    setEditingPedido(null);
    setFormData({
      tipo: 'Pedido',
      clienteId: '',
      fechaPedido: new Date().toISOString().split('T')[0],
      metodoPago: 'Efectivo',
      observaciones: '',
      items: [],
      direccionEnvio: '',
      personaRecibe: ''
    });
    setNuevoItem({
      productoId: '',
      talla: '',
      color: '',
      cantidad: '1',
      precioUnitario: ''
    });

    setClienteQuery('');
    setProductoQuery('');
    setShowClienteDropdown(false);
    setShowProductoDropdown(false);

    setShowModal(true);
  };

  const handleEdit = (pedido: Pedido) => {
    // ✅ USAR VALIDADOR CENTRALIZADO
    if (!puedeEditarse(pedido.estado)) {
      setNotificationMessage(`No puedes editar un pedido en estado "${pedido.estado}".`);
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    setEditingPedido(pedido);
    setFormData({
      tipo: pedido.tipo,
      clienteId: pedido.clienteId,
      fechaPedido: pedido.fechaPedido,
      metodoPago: pedido.metodoPago,
      observaciones: pedido.observaciones,
      direccionEnvio: (pedido as any).direccionEnvio || '',
      personaRecibe: (pedido as any).personaRecibe || '',
      items: pedido.items
    });

    const cliente = clientes.find((c: any) => c.id.toString() === pedido.clienteId?.toString());
    setClienteQuery(cliente ? `${cliente.nombre} - ${cliente.numeroDoc}` : (pedido.clienteNombre || ''));
    const label = cliente ? `${cliente.nombre} - ${cliente.numeroDoc}` : (pedido.clienteNombre || '');
    setClienteQuery(label);
    setSelectedClienteNombre(label);

    setProductoQuery('');
    setShowClienteDropdown(false);
    setShowProductoDropdown(false);

    setShowModal(true);
  };

  const getProductoSeleccionado = () => {
    return productos.find((p: any) => p.id.toString() === nuevoItem.productoId);
  };

  const getTallasDisponibles = () => {
    const producto = getProductoSeleccionado();
    if (!producto) return [];
    // Si tiene estructura de variantes (antiguo formato)
    if (producto.variantes) {
      return producto.variantes.map((v: any) => v.talla);
    }
    // Si tiene tallas directas (nuevo formato)
    if (producto.tallas) {
      return producto.tallas;
    }
    return [];
  };

  const getColoresDisponibles = () => {
    const producto = getProductoSeleccionado();
    if (!producto) return [];

    // Si tiene estructura de variantes (antiguo formato)
    if (producto.variantes && nuevoItem.talla) {
      const variante = producto.variantes.find((v: any) => v.talla === nuevoItem.talla);
      if (!variante) return [];
      return variante.colores.map((c: any) => c.color);
    }

    // Si tiene colores directos (nuevo formato)
    if (producto.colores) {
      return producto.colores;
    }

    return [];
  };

  const agregarItem = () => {
    const newErrors: any = {};
    if (!nuevoItem.productoId) newErrors['nuevoItem_productoId'] = 'Selecciona un producto';
    if (!nuevoItem.talla) newErrors['nuevoItem_talla'] = 'Selecciona una talla';
    if (!nuevoItem.color) newErrors['nuevoItem_color'] = 'Selecciona un color';
    const cantidadNum = parseInt(nuevoItem.cantidad as any);
    if (isNaN(cantidadNum) || cantidadNum < 1) newErrors['nuevoItem_cantidad'] = 'Cantidad inválida';

    if (Object.keys(newErrors).length > 0) {
      setFormErrors((prev: any) => ({ ...prev, ...newErrors }));
      setNotificationMessage('Completa todos los campos del producto');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const producto = productos.find((p: any) => p.id.toString() === nuevoItem.productoId);
    if (!producto) return;

    const cantidad = parseInt(nuevoItem.cantidad);

    // 🔒 VALIDACIÓN: Verificar stock disponible (si el producto tiene variantes)
    if (producto.variantes && producto.variantes.length > 0) {
      // Buscar la variante de talla
      const varianteTalla = producto.variantes.find((v: any) => v.talla === nuevoItem.talla);
      
      if (!varianteTalla) {
        setNotificationMessage(`❌ Talla ${nuevoItem.talla} no tiene stock definido. Debe crearse desde Compras.`);
        setNotificationType('error');
        setShowNotificationModal(true);
        return;
      }

      // Buscar el color en la talla
      const colorItem = varianteTalla.colores?.find((c: any) => c.color === nuevoItem.color);
      
      if (!colorItem) {
        setNotificationMessage(`❌ Color ${nuevoItem.color} no tiene stock definido. Debe crearse desde Compras.`);
        setNotificationType('error');
        setShowNotificationModal(true);
        return;
      }

      // 🔒 VALIDACIÓN: Stock insuficiente
      if (colorItem.cantidad < cantidad) {
        setNotificationMessage(
          `❌ Stock insuficiente para ${producto.nombre} (${nuevoItem.talla}, ${nuevoItem.color}).\n` +
          `Disponible: ${colorItem.cantidad} unidades\n` +
          `Solicitado: ${cantidad} unidades`
        );
        setNotificationType('error');
        setShowNotificationModal(true);
        return;
      }

      console.log(`✅ [PedidosManager] Stock validado: ${producto.nombre} - ${nuevoItem.talla} - ${nuevoItem.color}: ${colorItem.cantidad} disponible`);
    } else {
      // Si el producto NO tiene variantes definidas, es un error
      console.warn(`⚠️ [PedidosManager] Producto sin variantes: ${producto.nombre}. Stock no puede validarse.`);
      setNotificationMessage(`❌ El producto ${producto.nombre} no tiene variantes definidas. Debe crearse desde Compras.`);
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const precioUnitario = producto.precioVenta;
    const subtotal = cantidad * precioUnitario;

    const item: ItemPedido = {
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

    setProductoQuery('');
    setShowProductoDropdown(false);

    setFormErrors((prev: any) => ({
      ...prev,
      'nuevoItem_productoId': '',
      'nuevoItem_talla': '',
      'nuevoItem_color': '',
      'nuevoItem_cantidad': ''
    }));
    setFormErrors((prev: any) => ({
      ...prev,
      'nuevoItem_productoId': '',
      'nuevoItem_talla': '',
      'nuevoItem_color': '',
      'nuevoItem_cantidad': ''
    }));
  };

  const eliminarItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== itemId)
    });
  };

  const handleSave = () => {
    // ✅ Bloqueo extra si intentan guardar un pedido ya finalizado
    if (editingPedido && (editingPedido.estado === 'Completada' || editingPedido.estado === 'Anulado')) {
      setNotificationMessage(`No puedes editar un pedido en estado "${editingPedido.estado}".`);
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // Validar campos obligatorios
    const errors: any = {};

    if (!formData.clienteId) {
      errors.clienteId = 'Debes seleccionar un cliente';
    }

    if (!formData.fechaPedido) {
      errors.fechaPedido = 'La fecha del pedido es obligatoria';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setNotificationMessage('Por favor completa todos los campos obligatorios');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    if (formData.items.length === 0) {
      setNotificationMessage('Agrega al menos un producto');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const cliente = clientes.find((c: any) => c.id.toString() === formData.clienteId);
    if (!cliente) return;

    const totales = calcularTotales(formData.items);

    const pedidoData: Pedido = {
      id: editingPedido?.id || Date.now(),
      numeroPedido: editingPedido?.numeroPedido || generarNumeroPedido(),
      tipo: formData.tipo,
      clienteId: formData.clienteId,
      clienteNombre: cliente.nombre,
      fechaPedido: formData.fechaPedido,
      // ✅ Mantener el estado si se edita (no forzar Pendiente)
      estado: editingPedido?.estado || 'Pendiente',
      items: formData.items,
      subtotal: totales.subtotal,
      iva: totales.iva,
      total: totales.total,
      metodoPago: formData.metodoPago,
      observaciones: formData.observaciones,
      direccionEnvio: (formData as any).direccionEnvio || '',
      personaRecibe: (formData as any).personaRecibe || '',
      createdAt: editingPedido?.createdAt || new Date().toISOString()
    };

    if (editingPedido) {
      setPedidos(pedidos.map(p => p.id === editingPedido.id ? pedidoData : p));
      setNotificationMessage(`Pedido ${pedidoData.numeroPedido} actualizado correctamente`);
    } else {
      setPedidos([...pedidos, pedidoData]);
      setNotificationMessage(`Pedido ${pedidoData.numeroPedido} creado correctamente`);
    }
    setNotificationType('success');
    setShowNotificationModal(true);
    setShowModal(false);
  };

  const handleAnular = (pedido: Pedido) => {
    setConfirmMessage(`¿Seguro que deseas ANULAR este pedido ${pedido.numeroPedido}? Esta acción no se puede deshacer.`);
    setConfirmAction(() => () => {
      anularPedido(pedido);
    });
    setShowConfirmModal(true);
  };

  const anularPedido = (pedido: Pedido) => {
    // 🔒 USAR FUNCIÓN MAESTRA CENTRALIZADA
    // Automáticamente ejecuta cambiarEstadoPedidoCentralizado con tipo 'anular'
    const resultado = cambiarEstadoPedidoCentralizado(pedido, 'Anulado', {
      onNotificar: (titulo, mensaje, tipo) => {
        setNotificationMessage(mensaje);
        setNotificationType(tipo);
        setShowNotificationModal(true);
      },
      onExitoso: (res) => {
        console.log('✅ Anulación completada:', res);
        if (res.stockDevuelto && res.stockDevuelto.length > 0) {
          console.log(`📦 Stock devuelto: ${res.stockDevuelto.length} productos`);
        }
      },
      onLog: (msg, nivel) => {
        if (nivel === 'error') {
          console.error(msg);
        } else if (nivel === 'warn') {
          console.warn(msg);
        } else {
          console.log(msg);
        }
      },
    });

    if (resultado.exitoso && resultado.pedidoActualizado) {
      setPedidos(pedidos.map(p =>
        p.id === pedido.id ? resultado.pedidoActualizado! : p
      ));
    }
    setShowConfirmModal(false);
  };

  // ✅ DEPRECATED: Esta función fue reemplazada por cambiarEstadoCentralizado
  // La mantengo aquí para referencia pero ya no se usa
  const crearVentaDesdePedido = (pedido: Pedido) => {
    // 1️⃣ Crear objeto Venta con datos del Pedido
    const numeroVenta = generarNumeroVenta();
    
    const nuevaVenta = {
      id: Date.now(),
      numeroVenta,
      clienteId: pedido.clienteId,
      clienteNombre: pedido.clienteNombre,
      fechaVenta: pedido.fechaPedido,
      estado: 'Completada' as const,
      items: pedido.items,
      subtotal: pedido.subtotal,
      iva: pedido.iva,
      total: pedido.total,
      metodoPago: pedido.metodoPago || 'Efectivo',
      observaciones: pedido.observaciones || '',
      anulada: false,
      createdAt: new Date().toISOString(),
      pedido_id: pedido.numeroPedido,
      // 🔒 NUEVO: Flags de movimientos de stock
      movimientosStock: {
        salidaEjecutada: false,   // Se marca true en finalizarVenta()
        devolucionEjecutada: false
      }
    };

    // 2️⃣ 🔒 LLAMAR A FUNCIÓN CENTRAL: finalizarVenta()
    // Esta función es responsable de:
    // - Validar variantes y stock
    // - Descontar stock automáticamente
    // - Guardar venta en localStorage
    // - Disparar eventos para sincronización
    const resultado = finalizarVenta(nuevaVenta, pedido.items);

    // 3️⃣ GUARD CLAUSE: Si el descuento falla, mostrar error
    if (!resultado.exitoso) {
      console.error(`❌ [PedidosManager] Error al convertir pedido a venta: ${resultado.error}`);
      setNotificationMessage(`❌ Error: ${resultado.error}`);
      setNotificationType('error');
      setShowNotificationModal(true);
      return; // ABORTA - No cambiar estado a Completada
    }

    // ✅ Éxito: Stock descuento correctamente, marcar como éxito
    console.log(`✅ [PedidosManager] Pedido ${pedido.numeroPedido} convertido a venta ${numeroVenta} - Stock descargado`);
  };

  const cambiarEstado = (pedido: Pedido, nuevoEstado: EstadoPedido) => {
    // 🔒 USAR FUNCIÓN MAESTRA CENTRALIZADA
    // Orquesta automáticamente el tipo correcto de transición
    const resultado = cambiarEstadoPedidoCentralizado(pedido, nuevoEstado, {
      onNotificar: (titulo, mensaje, tipo) => {
        setNotificationMessage(mensaje);
        setNotificationType(tipo);
        setShowNotificationModal(true);
      },
      onExitoso: (res) => {
        console.log(`✅ Transición completada (${res.tipo}):`, res);
      },
      onLog: (msg, nivel) => {
        if (nivel === 'error') {
          console.error(msg);
        } else if (nivel === 'warn') {
          console.warn(msg);
        } else {
          console.log(msg);
        }
      },
    });

    if (resultado.exitoso && resultado.pedidoActualizado) {
      setPedidos(pedidos.map(p =>
        p.id === pedido.id ? resultado.pedidoActualizado! : p
      ));
    }
  };

  const handleCrearCliente = () => {
    const newErrors: any = {};
    const nombreErr = validateField('nombre', nuevoCliente.nombre);
    if (nombreErr) newErrors['nuevoCliente_nombre'] = nombreErr;
    const docErr = validateField('documento', nuevoCliente.numeroDoc);
    if (docErr) newErrors['nuevoCliente_numeroDoc'] = docErr;
    const telErr = !nuevoCliente.telefono ? 'Teléfono obligatorio' : '';
    if (telErr) newErrors['nuevoCliente_telefono'] = telErr;
    const emailErr = nuevoCliente.email ? validateField('email', nuevoCliente.email) : '';
    if (emailErr) newErrors['nuevoCliente_email'] = emailErr;

    if (Object.keys(newErrors).length > 0) {
      setFormErrors((prev: any) => ({ ...prev, ...newErrors }));
      setNotificationMessage('Completa los campos obligatorios correctamente');
      setNotificationType('error');
      setShowNotificationModal(true);
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
    setSelectedClienteNombre(`${clienteData.nombre} - ${clienteData.numeroDoc}`);

    setClienteQuery(`${clienteData.nombre} - ${clienteData.numeroDoc}`);
    setShowClienteDropdown(false);

    setShowClienteModal(false);
    setNuevoCliente({
      nombre: '',
      tipoDoc: 'CC',
      numeroDoc: '',
      telefono: '',
      email: '',
      direccion: ''
    });
    setNotificationMessage(`Cliente ${clienteData.nombre} creado correctamente`);
    setNotificationType('success');
    setShowNotificationModal(true);
  };

  const descargarComprobante = (pedido: Pedido) => {
    const contenido = `
=================================
${pedido.tipo.toUpperCase()}
${pedido.numeroPedido}
=================================

Fecha: ${new Date(pedido.fechaPedido).toLocaleDateString()}
Cliente: ${pedido.clienteNombre}
Estado: ${pedido.estado}
  Dirección de Envío: ${pedido.direccionEnvio || '-'}
  Persona que recibe: ${pedido.personaRecibe || '-'}

---------------------------------
PRODUCTOS
---------------------------------
${pedido.items.map(item => `
${item.productoNombre}
Talla: ${item.talla} | Color: ${item.color}
Cantidad: ${item.cantidad} x $${item.precioUnitario.toLocaleString()}
Subtotal: $${item.subtotal.toLocaleString()}
`).join('\n')}

---------------------------------
TOTALES
---------------------------------
Subtotal: $${pedido.subtotal.toLocaleString()}
IVA (19%): $${pedido.iva.toLocaleString()}
TOTAL: $${pedido.total.toLocaleString()}

Método de Pago: ${pedido.metodoPago}

${pedido.observaciones ? `Observaciones:\n${pedido.observaciones}` : ''}

=================================
DAMABELLA - Moda Femenina
=================================
    `.trim();

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pedido.numeroPedido}.txt`;
    a.click();
  };

  const filteredPedidos = pedidos.filter(p => {
    // Mostrar SOLO pedidos pendientes en el módulo de Pedidos
    if (p.estado !== 'Pendiente') return false;
    const searchLower = searchTerm.toLowerCase();
    const matchPedido = (p.numeroPedido?.toLowerCase() ?? '').includes(searchLower);
    const matchCliente = (p.clienteNombre?.toLowerCase() ?? '').includes(searchLower);
    const matchEstado = (p.estado?.toLowerCase() ?? '').includes(searchLower);
    const matchFecha = new Date(p.fechaPedido).toLocaleDateString().includes(searchTerm);
    const matchTotal = p.total.toString().includes(searchTerm);
    const matchProducto = p.items.some(item => {
      const producto = productos.find((prod: any) => prod.id.toString() === item.productoId);
      return (
        (item.productoNombre?.toLowerCase().includes(searchLower)) ||
        (item.talla?.toLowerCase().includes(searchLower)) ||
        (item.color?.toLowerCase().includes(searchLower)) ||
        (producto?.referencia?.toLowerCase().includes(searchLower)) ||
        (producto?.codigoInterno?.toLowerCase().includes(searchLower))
      );
    });
    return matchPedido || matchCliente || matchEstado || matchFecha || matchTotal || matchProducto;
  });

  // PAGINACIÓN: mostrar 5 pedidos por página (useMemo + useState)
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredPedidos.length / ITEMS_PER_PAGE);

  const paginatedPedidos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredPedidos.slice(start, end);
  }, [filteredPedidos, currentPage]);

  const filteredClientes = clientes.filter((c: any) =>
    (c.nombre?.toLowerCase() ?? '').includes(clienteSearch.toLowerCase()) ||
    (c.numeroDoc ?? '').includes(clienteSearch) ||
    (c.telefono && c.telefono.includes(clienteSearch))
  );

  // ====== LISTAS FILTRADAS PARA SELECT BUSCABLE ======
  const clientesFiltradosSelect = clientes
    .filter((c: any) => c.activo !== false)
    .filter((c: any) => {
      const q = clienteQuery.toLowerCase();
      return (
        (c.nombre?.toLowerCase() ?? '').includes(q) ||
        (c.numeroDoc ?? '').includes(clienteQuery) ||
        (c.telefono ?? '').includes(clienteQuery)
      );
    });

  const productosFiltradosSelect = productos
    .filter((p: any) => p.activo)
    .filter((p: any) => {
      const q = productoQuery.toLowerCase();
      const nombre = (p.nombre?.toLowerCase() ?? '');
      const ref = (p.referencia?.toLowerCase() ?? '');
      const cod = (p.codigoInterno?.toLowerCase() ?? '');
      return nombre.includes(q) || ref.includes(q) || cod.includes(q);
    });

  const getEstadoColor = (estado: Pedido['estado']) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-700';
      case 'Completada': return 'bg-green-100 text-green-700';
      case 'Anulado': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const descargarTodosEnExcel = () => {
    try {
      // Crear estructura de datos para Excel
      const datosExcel = filteredPedidos.map(p => ({
        'Número Pedido': p.numeroPedido,
        'Fecha': new Date(p.fechaPedido).toLocaleDateString(),
        'Cliente': p.clienteNombre,
        'Productos': p.items.map(i => `${i.productoNombre} (Talla: ${i.talla}, Color: ${i.color}, Cant: ${i.cantidad})`).join('; '),
        'Cantidades': p.items.map(i => i.cantidad).join('; '),
        'Valores Unitarios': p.items.map(i => `$${i.precioUnitario.toLocaleString()}`).join('; '),
        'Subtotales': p.items.map(i => `$${i.subtotal.toLocaleString()}`).join('; '),
        'Subtotal': `$${p.subtotal.toLocaleString()}`,
        'IVA (19%)': `$${p.iva.toLocaleString()}`,
        'Total': `$${p.total.toLocaleString()}`,
        'Estado': p.estado,
        'Método Pago': p.metodoPago,
        'Dirección Envío': p.direccionEnvio || '',
        'Persona recibe': p.personaRecibe || ''
      }));
      // Crear contenido TSV para exportar a Excel (archivo .xlsx con tab-separado)
      const headers = Object.keys(datosExcel[0] || {});
      const tsvContent = [
        headers.join('\t'),
        ...datosExcel.map(row =>
          headers.map(header => {
            const valor = row[header as keyof typeof row];
            const valorStr = String(valor || '');
            // Escapar tabs y nuevas líneas reemplazándolas por espacios simples
            return valorStr.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
          }).join('\t')
        )
      ].join('\n');

      // Crear blob y descargar con extensión .xlsx (contenido tab-separado)
      const blob = new Blob([tsvContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pedidos_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
      link.click();
      URL.revokeObjectURL(url);
      setNotificationMessage('Pedidos exportados correctamente');
      setNotificationType('success');
      setShowNotificationModal(true);
    } catch (error) {
      setNotificationMessage('Error al exportar pedidos');
      setNotificationType('error');
      setShowNotificationModal(true);
    }
  };
  const totales = calcularTotales(formData.items);
  const clienteSeleccionado = clientes.find(
    (c: any) => c.id?.toString() === formData.clienteId?.toString()
  );

  const saldoDisponible = Number(clienteSeleccionado?.saldoAFavor || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Pedidos</h2>
          <p className="text-gray-600">Administra pedidos y cotizaciones con IVA incluido</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={descargarTodosEnExcel} variant="secondary" className="flex items-center gap-2">
            <Download size={20} />
            Descargar Pedidos
          </Button>
          <Button onClick={handleCreate} variant="primary" className="flex items-center gap-2">
            <Plus size={20} />
            Nuevo Pedido
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

      {/* Pedidos Table */}
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
              {filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <ShoppingCart className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron pedidos</p>
                  </td>
                </tr>
              ) : (
                paginatedPedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="text-gray-900">{pedido.numeroPedido}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{pedido.clienteNombre}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {new Date(pedido.fechaPedido).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right text-gray-900">
                      ${pedido.total.toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm ${getEstadoColor(pedido.estado)}`}>
                          {pedido.estado}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setViewingPedido(pedido); setShowDetailModal(true); }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => descargarComprobante(pedido)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          title="Descargar"
                        >
                          <Download size={18} />
                        </button>

                        <button
                          onClick={() => {
                            setPedidoParaCambiarEstado(pedido);
                            setNuevoEstado(pedido.estado);
                            setShowEstadoModal(true);
                          }}
                          className="p-2 hover:bg-purple-50 rounded-lg transition-colors text-purple-600"
                          title="Cambiar estado"
                        >
                          <Repeat size={18} />
                        </button>

                        {/* ✅ Editar (solo si NO está en Venta ni Anulado ni tiene ventaId) */}
                        <button
                          onClick={() => handleEdit(pedido)}
                          disabled={!puedeEditarse(pedido.estado) || !!pedido.venta_id}
                          className={`p-2 rounded-lg transition-colors ${
                            !puedeEditarse(pedido.estado) || !!pedido.venta_id
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'hover:bg-gray-100 text-gray-600'
                          }`}
                          title={
                            !!pedido.venta_id
                              ? 'Este pedido tiene una venta asociada'
                              : !puedeEditarse(pedido.estado)
                              ? `No se puede editar en estado ${pedido.estado}`
                              : 'Editar'
                          }
                        >
                          <Pencil size={18} />
                        </button>

                        {/* ✅ Anular (bloqueado si tiene ventaId) */}
                        <button
                          onClick={() => handleAnular(pedido)}
                          disabled={!puedeTransicionar(pedido.estado, 'Anulado') || !!pedido.venta_id}
                          className={`p-2 rounded-lg transition-colors ${
                            !puedeTransicionar(pedido.estado, 'Anulado') || !!pedido.venta_id
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'hover:bg-red-50 text-red-600'
                          }`}
                          title={
                            !!pedido.venta_id
                              ? 'Pedido bloqueado: tiene una venta asociada'
                              : !puedeTransicionar(pedido.estado, 'Anulado')
                              ? `No se puede anular en estado ${pedido.estado}`
                              : 'Anular'
                          }
                        >
                          <Ban size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
            {/* Texto informativo */}
            <span className="text-sm text-gray-500">
              {`Mostrando ${Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredPedidos.length || 0)} a ${Math.min(currentPage * ITEMS_PER_PAGE, filteredPedidos.length)} de ${filteredPedidos.length} pedidos`}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-md border text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Anterior
              </button>

              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;
                const isActive = currentPage === page;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={isActive ? 'px-3 py-1.5 rounded-md bg-gray-900 text-white text-sm font-semibold' : 'px-3 py-1.5 rounded-md border text-sm text-gray-700 hover:bg-gray-100 transition'}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-md border text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPedido ? `Editar Pedido` : 'Nuevo Pedido'}
      >
        <div className="space-y-0 p-0 -mt-4">
          {/* Cliente */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-gray-700">Cliente *</label>
              <button
                onClick={() => setShowClienteModal(true)}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm"
              >
                <UserPlus size={14} />
                Nuevo Cliente
              </button>
            </div>

            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <Input
                value={clienteQuery}
                onChange={(e) => {
                  const value = e.target.value;

                  setClienteQuery(value);
                  setShowClienteDropdown(true);

                  // ✅ Solo limpiar clienteId si el texto YA no es el del cliente seleccionado
                  const sigueIgual = value.trim() === selectedClienteNombre.trim();
                  if (!sigueIgual) {
                    handleFieldChange('clienteId', '');
                    setSelectedClienteNombre('');
                  }

                  // si quedó vacío, sí o sí limpiar
                  if (value.trim() === '') {
                    handleFieldChange('clienteId', '');
                    setSelectedClienteNombre('');
                  }
                }}

                onFocus={() => setShowClienteDropdown(true)}
                placeholder="Buscar cliente por nombre, documento o teléfono..."
              />

              {showClienteDropdown && (
                <div className="absolute z-[9999] mt-1 w-full max-h-[40vh] bg-white border border-gray-200 rounded-lg shadow-lg">
                  {clientesFiltradosSelect.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">No hay resultados</div>
                  ) : (
                    clientesFiltradosSelect.map((cliente: any) => (
                      <button
                        type="button"
                        key={cliente.id}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50"
                        onClick={() => {
                          handleFieldChange('clienteId', cliente.id.toString());

                          const label = `${cliente.nombre} - ${cliente.numeroDoc}`;
                          setClienteQuery(label);

                          setSelectedClienteNombre(label);

                          setShowClienteDropdown(false);
                        }}

                      >
                        <div className="text-sm text-gray-900">{cliente.nombre}</div>
                        <div className="text-xs text-gray-500">
                          {cliente.numeroDoc} {cliente.telefono ? `• ${cliente.telefono}` : ''}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {formErrors.clienteId && <p className="text-red-500 text-sm mt-1">{formErrors.clienteId}</p>}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-gray-700 mb-1">Fecha *</label>
              <Input
                type="date"
                value={formData.fechaPedido}
                onChange={(e) => handleFieldChange('fechaPedido', e.target.value)}
                required
                disabled={!!editingPedido}
              />
              {formErrors.fechaPedido && <p className="text-red-500 text-sm mt-1">{formErrors.fechaPedido}</p>}
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Método de Pago *</label>
              {saldoDisponible > 0 && formData.clienteId && (
                <div className="mb-2 rounded-lg border border-green-300 bg-green-50 p-2 text-sm">
                  <div className="text-green-800 font-semibold">
                    ✅ Este cliente tiene saldo a favor: ${saldoDisponible.toLocaleString()}
                  </div>
                </div>
              )}

              <select
                value={formData.metodoPago}
                onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Nequi">Nequi</option>
                <option value="Daviplata">Daviplata</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Dirección de Envío</label>
              <Input
                value={(formData as any).direccionEnvio}
                onChange={(e) => handleFieldChange('direccionEnvio', e.target.value)}
                placeholder="Dirección de envío (opcional)"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Persona que recibe</label>
              <Input
                value={(formData as any).personaRecibe}
                onChange={(e) => handleFieldChange('personaRecibe', e.target.value)}
                placeholder="Nombre de la persona que recibe (opcional)"
              />
            </div>
          </div>

          {/* Productos */}
          <div className="border-t pt-1">
            <h4 className="text-gray-900 mb-1">Agregar Productos</h4>

            <div className="bg-gray-50 rounded-lg p-1 mb-1 space-y-1">
              <div>
                <label className="block text-gray-700 mb-1 text-sm">Producto</label>

                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={productoQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setProductoQuery(value);
                      setShowProductoDropdown(true);

                      if (value === '') {
                        handleNuevoItemChange('productoId', '');
                      }
                    }}
                    onFocus={() => setShowProductoDropdown(true)}
                    placeholder="Buscar producto por nombre, ref o código..."
                  />

                  {showProductoDropdown && (
                    <div className="absolute z-[9999] mt-1 w-full max-h-[40vh] bg-white border border-gray-200 rounded-lg shadow-lg">
                      {productosFiltradosSelect.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">No hay resultados</div>
                      ) : (
                        productosFiltradosSelect.map((producto: any) => (
                          <button
                            type="button"
                            key={producto.id}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50"
                            onClick={() => {
                              handleNuevoItemChange('productoId', producto.id.toString());
                              const label = `${producto.nombre}${producto.referencia ? ` (REF: ${producto.referencia})` : ''}${producto.codigoInterno ? ` [${producto.codigoInterno}]` : ''} - $${(producto.precioVenta || 0).toLocaleString()}`;
                              setProductoQuery(label);
                              setShowProductoDropdown(false);
                            }}
                          >
                            <div className="text-sm text-gray-900">{producto.nombre}</div>
                            <div className="text-xs text-gray-500">
                              {producto.referencia ? `REF: ${producto.referencia}` : 'REF: N/A'}
                              {producto.codigoInterno ? ` • ${producto.codigoInterno}` : ''}
                              {` • $${(producto.precioVenta || 0).toLocaleString()}`}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {nuevoItem.productoId && (
                <>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="block text-gray-700 mb-1 text-sm">Talla</label>
                        <select
                          value={nuevoItem.talla}
                          onChange={(e) => handleNuevoItemChange('talla', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          <option value="">Seleccionar...</option>
                          {getTallasDisponibles().map((talla: string) => (
                            <option key={talla} value={talla}>{talla}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-1 text-sm">Color</label>
                        <select
                          value={nuevoItem.color}
                          onChange={(e) => handleNuevoItemChange('color', e.target.value)}
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

                  </div>

                  {/* 🔒 Mostrar stock disponible */}
                  {nuevoItem.color && stockDisponible !== null && (
                    <div className={`rounded-lg p-3 text-sm ${
                      stockDisponible > 0
                        ? 'bg-blue-50 border border-blue-200 text-blue-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                      {stockDisponible > 0 ? (
                        <div>
                          <strong>✅ Stock disponible:</strong> {stockDisponible} unidades
                        </div>
                      ) : (
                        <div>
                          <strong>❌ Sin stock:</strong> No hay disponibilidad para este producto
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-700 mb-1 text-sm">Cantidad</label>
                    <Input
                      type="number"
                      min="1"
                      max={stockDisponible || undefined}
                      value={nuevoItem.cantidad}
                      onChange={(e) => handleNuevoItemChange('cantidad', e.target.value)}
                      placeholder="1"
                      disabled={!nuevoItem.color || stockDisponible === 0}
                    />
                    {formErrors['nuevoItem_cantidad'] && <p className="text-red-500 text-sm mt-1">{formErrors['nuevoItem_cantidad']}</p>}
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
              <div className="space-y-1">
                {formData.items.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-1 bg-white flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <div className="text-gray-900">{item.productoNombre}</div>
                      <div className="text-sm text-gray-600">
                        Talla: {item.talla} | Color: {item.color} | Cant: {item.cantidad} x ${item.precioUnitario.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-gray-900">${item.subtotal.toLocaleString()}</div>
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
            <div className="border-t pt-2 bg-gray-50 rounded-lg p-2">
              <div className="space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>${totales.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>IVA (19%):</span>
                  <span>${totales.iva.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-900 pt-1 border-t">
                  <span>Total:</span>
                  <span>${totales.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows={2}
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button onClick={() => setShowModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="primary">
              {editingPedido ? 'Guardar Cambios' : `Crear ${formData.tipo}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Detalle */}
      {viewingPedido && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Detalle ${viewingPedido.tipo} ${viewingPedido.numeroPedido}`}
        >
          <div className="space-y-0 p-0 -mt-4">
            <div className="grid grid-cols-2 gap-1 p-1 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600 mb-1">Cliente</div>
                <div className="text-gray-900">{viewingPedido.clienteNombre}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Fecha</div>
                <div className="text-gray-900">
                  {new Date(viewingPedido.fechaPedido).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Estado</div>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm ${getEstadoColor(viewingPedido.estado)}`}>
                  {viewingPedido.estado}
                </span>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Método de Pago</div>
                <div className="text-gray-900">{viewingPedido.metodoPago}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Dirección de Envío</div>
                <div className="text-gray-900">{viewingPedido.direccionEnvio || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Persona que recibe</div>
                <div className="text-gray-900">{viewingPedido.personaRecibe || '-'}</div>
              </div>
            </div>

            <div>
              <h4 className="text-gray-900 mb-1">Productos</h4>
              <div className="grid grid-cols-2 gap-1">
                {viewingPedido.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-1 text-sm">
                    <div className="flex justify-between mb-1">
                      <div className="text-gray-900">{item.productoNombre}</div>
                      <div className="text-gray-900">${item.subtotal.toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Talla: {item.talla} | Color: {item.color} | Cantidad: {item.cantidad} x ${item.precioUnitario.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-2 bg-gray-50 rounded-lg p-2">
              <div className="space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>${viewingPedido.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>IVA (19%):</span>
                  <span>${viewingPedido.iva.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-900 pt-1 border-t">
                  <span>Total:</span>
                  <span>${viewingPedido.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {viewingPedido.observaciones && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Observaciones</div>
                <div className="text-gray-900 bg-gray-50 p-2 rounded-lg">
                  {viewingPedido.observaciones}
                </div>
              </div>
            )}

            <div className="border-t pt-2">
              <div className="text-sm text-gray-600 mb-1">Estado Actual</div>
              <div className="flex items-center gap-2">
                <span className={`px-4 py-2 rounded-lg text-sm font-medium ${obtenerClaseEstado(viewingPedido.estado)}`}>
                  {obtenerDescripcionEstado(viewingPedido.estado)}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Crear Cliente */}
      <Modal
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        title="Nuevo Cliente"
      >
        <div className="space-y-4">

          {/* ✅ DOCUMENTO PRIMERO */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Tipo de Documento *</label>
              <select
                value={nuevoCliente.tipoDoc}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipoDoc: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="PAS">Pasaporte</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Número de Documento *</label>
              <Input
                value={nuevoCliente.numeroDoc}
                onChange={(e) => handleNuevoClienteChange('numeroDoc', e.target.value)}
                placeholder="1234567890"
                required
              />
              {formErrors['nuevoCliente_numeroDoc'] && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors['nuevoCliente_numeroDoc']}
                </p>
              )}
            </div>
          </div>

          {/* ✅ NOMBRE DESPUÉS */}
          <div>
            <label className="block text-gray-700 mb-1">Nombre Completo *</label>
            <Input
              value={nuevoCliente.nombre}
              onChange={(e) => handleNuevoClienteChange('nombre', e.target.value)}
              placeholder="Nombre del cliente"
              required
            />
            {formErrors['nuevoCliente_nombre'] && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors['nuevoCliente_nombre']}
              </p>
            )}
          </div>

          {/* RESTO IGUAL */}
          <div>
            <label className="block text-gray-700 mb-1">Teléfono *</label>
            <Input
              value={nuevoCliente.telefono}
              onChange={(e) =>
                handleNuevoClienteChange('telefono', e.target.value)
              }
              placeholder="3001234567"
              required
            />
            {formErrors['nuevoCliente_telefono'] && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors['nuevoCliente_telefono']}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Correo Electrónico</label>
            <Input
              type="email"
              value={nuevoCliente.email}
              onChange={(e) => handleNuevoClienteChange('email', e.target.value)}
              placeholder="correo@ejemplo.com"
            />
            {formErrors['nuevoCliente_email'] && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors['nuevoCliente_email']}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Dirección</label>
            <Input
              value={nuevoCliente.direccion}
              onChange={(e) => handleNuevoClienteChange('direccion', e.target.value)}
              placeholder="Calle 123 # 45-67"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button onClick={() => setShowClienteModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleCrearCliente} variant="primary">
              Crear Cliente
            </Button>
          </div>

        </div>
      </Modal>

      {/* Modal de Notificación */}
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
          <div className="flex justify-end pt-2 border-t">
            <Button onClick={() => setShowNotificationModal(false)} variant="primary">
              Aceptar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmación */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar Acción"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
            <p className="text-gray-700 text-base">{confirmMessage}</p>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button onClick={() => setShowConfirmModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (confirmAction) confirmAction();
              }}
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Cambiar Estado */}
      <Modal
        isOpen={showEstadoModal}
        onClose={() => setShowEstadoModal(false)}
        title="Cambiar Estado del Pedido"
      >
        <div className="space-y-4">
          {pedidoParaCambiarEstado && (
            <>
              {/* 📋 Información del Pedido */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Pedido:</span> {pedidoParaCambiarEstado.numeroPedido}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Cliente:</span> {pedidoParaCambiarEstado.clienteNombre}
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  <span className="font-semibold">Estado Actual:</span>{' '}
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${obtenerClaseEstado(pedidoParaCambiarEstado.estado)}`}>
                    {obtenerDescripcionEstado(pedidoParaCambiarEstado.estado)}
                  </span>
                </p>
              </div>

              {/* 🔒 HELPER: Detectar si pedido fue convertido a venta (con múltiples criterios) */}
              {(() => {
                const esConvertidoAVenta = 
                  pedidoParaCambiarEstado.estado?.toLowerCase?.()?.includes('convertido') ||
                  pedidoParaCambiarEstado.estado === 'Convertido a venta' ||
                  pedidoParaCambiarEstado.venta_id !== null;

                return (
                  <>
                    {/* Mensaje informativo - Solo si está convertido a venta */}
                    {esConvertidoAVenta && (
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300 space-y-3">
                        <div className="flex gap-3">
                          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
                          <div className="text-sm">
                            <p className="text-yellow-900 font-semibold mb-2">
                              Este pedido ya fue convertido en una venta
                            </p>
                            <p className="text-yellow-800">
                              Cualquier modificación debe realizarse desde el módulo de Ventas.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Selector de estado - Solo si NO está convertido a venta */}
                    {!esConvertidoAVenta && (
                      <div>
                        <label className="block text-gray-700 mb-3 font-semibold">Nuevo Estado</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['Pendiente', 'Completada', 'Anulado'] as const).map((estado) => {
                            const esTransicionValida = puedeTransicionar(pedidoParaCambiarEstado.estado, estado);
                            
                            return (
                              <button
                                key={estado}
                                onClick={() => {
                                  if (esTransicionValida) {
                                    setNuevoEstado(estado);
                                  }
                                }}
                                disabled={!esTransicionValida}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  esTransicionValida
                                    ? nuevoEstado === estado
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                                title={!esTransicionValida ? `No puedes pasar de ${pedidoParaCambiarEstado.estado} a ${estado}` : undefined}
                              >
                                {estado}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 🔘 Botones de acción */}
                    <div className="flex gap-3 justify-end pt-4 border-t">
                      {/* Botón Cancelar/Cerrar */}
                      <Button onClick={() => setShowEstadoModal(false)} variant="secondary">
                        {esConvertidoAVenta ? 'Cerrar' : 'Cancelar'}
                      </Button>

                      {/* Botón Guardar - Solo visible si NO está "Convertido a venta" */}
                      {!esConvertidoAVenta && (
                        <Button
                          onClick={() => {
                            if (pedidoParaCambiarEstado) {
                              cambiarEstado(pedidoParaCambiarEstado, nuevoEstado);
                              setShowEstadoModal(false);
                            }
                          }}
                          variant="primary"
                        >
                          Guardar Cambio
                        </Button>
                      )}
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

