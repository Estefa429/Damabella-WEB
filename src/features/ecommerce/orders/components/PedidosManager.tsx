// src/features/orders/PedidosManager.tsx
//
// Migración completa: localStorage → API
// - Pedidos: gestionados por useOrders() → ordersService.ts
// - Clientes: cargados desde API de clientsServices
// - Productos: siguen en localStorage hasta que tengan su propia API
// - Bug de cleanup en useEffect corregido
// - exportOrders() de la API reemplaza la exportación manual
// - Fix: variantId ahora usa id_variant real de la API
// - Fix: cálculos de totales unificados con precioVenta

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Search, Eye, X, CheckCircle, UserPlus,
  Download, AlertCircle, Pencil, Ban, ShoppingCart, Repeat,
} from 'lucide-react';
import { Button, Input, Modal } from '../../../../shared/components/native';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { validateField } from '../../../../shared/utils/validation';
import {
  puedeEditarse,
  puedeTransicionar,
  obtenerClaseEstado,
} from '../../../../services/pedidosCentralizado';
import { getAllClients, createClients, CreateClientsDTO, Clients } from '../../customers/services/clientsServices';
import { getAllProducts, Product, getAllVariants, getAllColors, getAllSizes, Color, Size, getAllInventory } from '../../products/services/productsService';
import { createSale, CreateSaleDTO } from '../../sales/services/SalesServices';
import { formatCOP } from '@/features/dashboard/utils/dashboardHelpers';

import { useOrders } from './UseOrder';
import {
  formDataToCreateOrderDTO,
  apiOrderToLocal,
  metodoPagoNameToId,
  apiStateToLocalState,
  type ItemPedidoLocal,
  type FormDataLocal,
} from './OrderMappers';
import { getAllStates, type OrderState } from '../services/OrderServices';

// ─── IVA ─────────────────────────────────────────────────────────────────────
const IVA_RATE = 0.19;

// ─── Tipo local enriquecido (API Order + campos de display) ──────────────────
type PedidoLocal = ReturnType<typeof apiOrderToLocal>;
type EstadoLocal = PedidoLocal['estado'];

// ─────────────────────────────────────────────────────────────────────────────
export default function PedidosManager({ initialSearchTerm = '' }: { initialSearchTerm?: string }) {
  const { hasPermission } = usePermissions();

  // ── API ──────────────────────────────────────────────────────────────────
  const {
    pedidos: pedidosAPI,
    loading: apiLoading,
    error: apiError,
    fetchPedidos,
    crearPedido,
    editarPedido,
    cambiarEstado: apiCambiarEstado,
    descargarExcel,
  } = useOrders();

  // Normalizar pedidos de API al formato local
  const pedidos: PedidoLocal[] = useMemo(
    () => pedidosAPI.map(apiOrderToLocal),
    [pedidosAPI],
  );

  // ── localStorage: clientes y productos ───────────────────────────────────
  const [clientes, setClientes] = useState<any[]>([]);
  const [clientesLoading, setClientesLoading] = useState(false);

  const [productos, setProductos] = useState<any[]>([]);
  const [tallas, setTallas] = useState<Size[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [dbStates, setDbStates] = useState<OrderState[]>([]);
  const [inventarios, setInventarios] = useState<any[]>([]);

  // ── Modales ───────────────────────────────────────────────────────────────
  const [showModal,             setShowModal]             = useState(false);
  const [showDetailModal,       setShowDetailModal]       = useState(false);
  const [showClienteModal,      setShowClienteModal]      = useState(false);
  const [showEstadoModal,       setShowEstadoModal]       = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showConfirmModal,      setShowConfirmModal]      = useState(false);

  const [editingPedido,           setEditingPedido]           = useState<PedidoLocal | null>(null);
  const [viewingPedido,           setViewingPedido]           = useState<PedidoLocal | null>(null);
  const [pedidoParaCambiarEstado, setPedidoParaCambiarEstado] = useState<PedidoLocal | null>(null);
  const [nuevoEstadoModal,        setNuevoEstadoModal]        = useState<EstadoLocal>('Pendiente');

  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType,    setNotificationType]    = useState<'success' | 'error' | 'info'>('info');
  const [confirmMessage,      setConfirmMessage]      = useState('');
  const [confirmAction,       setConfirmAction]       = useState<(() => void) | null>(null);

  // ── Búsqueda ──────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  // ── Dropdowns buscables ───────────────────────────────────────────────────
  const [clienteQuery,          setClienteQuery]          = useState('');
  const [selectedClienteNombre, setSelectedClienteNombre] = useState('');
  const [showClienteDropdown,   setShowClienteDropdown]   = useState(false);
  const [variantSearch,         setVariantSearch]         = useState('');
  const [showVariantDrop,       setShowVariantDrop]       = useState(false);
  const [selectedVariant,       setSelectedVariant]       = useState<any | null>(null);
  const [itemTalla,             setItemTalla]             = useState('');
  const [itemColor,             setItemColor]             = useState('');
  const [itemCantidad,          setItemCantidad]          = useState('1');
  const [itemPrecioCompra,      setItemPrecioCompra]      = useState('');
  const [itemPrecioVenta,       setItemPrecioVenta]       = useState('');

  // ── Formulario pedido ─────────────────────────────────────────────────────
  const emptyForm = (): FormDataLocal => ({
    clienteId:      '',
    fechaPedido:    new Date().toISOString().split('T')[0],
    metodoPago:     'Efectivo',
    observaciones:  '',
    items:          [],
    direccionEnvio: '',
    personaRecibe:  '',
    estadoId:       1,
  });

  const [formData,   setFormData]   = useState<FormDataLocal>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ── Formulario nuevo cliente ──────────────────────────────────────────────
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '', tipoDoc: 'CC', numeroDoc: '', telefono: '', email: '', direccion: '',
  });

  // ── Paginación ────────────────────────────────────────────────────────────
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────

  // useEffect totales — sin cambios, ya estaba bien
  // useEffect(() => {
  //   const total    = formData.items.reduce((sum, item) => sum + item.cantidad * item.precioVenta, 0);
  //   const subtotal = total / (1 + IVA_RATE);
  //   const iva      = total - subtotal;
  //   setTotales({ subtotal, iva, total });
  // }, [formData.items]);

  useEffect(() => {
    const loadClients = async () => {
      setClientesLoading(true);
      try {
        const clientesAPI = await getAllClients();
        if (clientesAPI) {
          const clientesMapeados = clientesAPI.map((client: Clients) => ({
            id:         client.id_client,
            nombre:     client.name,
            tipoDoc:    client.type_doc,
            numeroDoc:  client.doc,
            telefono:   client.phone,
            email:      client.email,
            direccion:  client.address,
            ciudad:     client.city,
            activo:     client.state,
            saldoAFavor: client.saldoAFavor ?? (client as any).saldo_a_favor ?? 0,
          }));
          setClientes(clientesMapeados);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setClientesLoading(false);
      }
    };

    const loadProductos = async () => {
      try {
        const productosAPI = await getAllProducts();
        if (productosAPI) {
          const productosMapeados = productosAPI.map((product: Product) => ({
            id:              product.id_product.toString(),
            id_product:      product.id_product,
            nombre:          product.name,
            categoria:       product.category,
            categoriaNombre: product.category_name,
            precioVenta:     product.price,
            precioCompra:    product.purchase_price,
            activo:          product.is_active,
          }));
          setProductos(productosMapeados);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    const loadTallasYColores = async () => {
      try {
        const tallasAPI  = await getAllSizes();
        const coloresAPI = await getAllColors();
        if (tallasAPI)  setTallas(tallasAPI);
        if (coloresAPI) setColores(coloresAPI);
      } catch (error) {
        console.error('Error loading sizes and colors:', error);
      }
    };

    const loadStates = async () => {
      try {
        const states = await getAllStates();
        if (states) setDbStates(states);
      } catch (error) {
        console.error('Error loading states:', error);
      }
    };

    const loadInventarios = async () => {
      try {
        const invAPI = await getAllInventory();
        if (invAPI) setInventarios(invAPI);
      } catch (error) {
        console.error('Error loading inventory:', error);
      }
    };

    loadClients();
    loadProductos();
    loadTallasYColores();
    loadStates();
    loadInventarios();
  }, []);

  const refreshInventarios = async () => {
    try {
      const invAPI = await getAllInventory();
      if (invAPI) {
        setInventarios(invAPI);
        return invAPI;
      }
    } catch (error) {
      console.error('Error refreshing inventory:', error);
    }
    return null;
  };

  const getVariantStock = (variantId: number): number => {
    const inv = inventarios.find((i: any) => Number(i.variant ?? i.id_variant) === Number(variantId));
    if (inv) return Number(inv.stock ?? 0);
    return 0;
  };

  // Cerrar dropdowns al click fuera
  useEffect(() => {
    const close = () => {
      setShowClienteDropdown(false);
      setShowVariantDrop(false);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  const notify = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotificationMessage(msg);
    setNotificationType(type);
    setShowNotificationModal(true);
  }, []);


  const normalizeOptionValue = (value: string) =>
    value?.replace(/-/g, ' ').trim() ?? '';

  const getFirstValidOption = (values: string[]) =>
    values.find(value => value && value.trim() && value !== '-');

  const getTallasDisponibles = (): string[] =>
    tallas.map(t => t.name).filter(Boolean);

  const getColoresDisponibles = (): string[] =>
    colores.map(c => c.name).filter(Boolean);

  const resetItemSelection = () => {
    setSelectedVariant(null);
    setVariantSearch('');
    setItemTalla('');
    setItemColor('');
    setItemCantidad('1');
    setItemPrecioCompra('');
    setItemPrecioVenta('');
  };

  // Fix: cargar variantes reales desde API al seleccionar producto
  // handleSelectProduct — talla y color desde variante real de la API
  const handleSelectProduct = async (product: any) => {
    let variantsData: any[] = [];
    try {
      const todas = await getAllVariants();
      variantsData = (todas || []).filter(
        (v: any) => Number(v.product ?? v.id_product) === Number(product.id_product ?? product.id)
      );
    } catch (e) {
      console.warn('[PedidosManager] No se pudieron cargar variantes:', e);
    }

    // Talla y color desde la primera variante REAL de la API
    const primeraVariante = variantsData[0];
    const firstTalla = primeraVariante
      ? String(primeraVariante.size_name ?? primeraVariante.talla ?? primeraVariante.size ?? '').trim()
      : normalizeOptionValue(getFirstValidOption(getTallasDisponibles()) ?? '');
    const firstColor = primeraVariante
      ? String(primeraVariante.color_name ?? primeraVariante.color ?? '').trim()
      : normalizeOptionValue(getFirstValidOption(getColoresDisponibles()) ?? '');

    const precioVenta  = product.precioVenta  ?? product.price ?? 0;
    const precioCompra = product.precioCompra ?? 0;

    setSelectedVariant({
      ...product,
      talla:       firstTalla,
      color:       firstColor,
      precioVenta,
      variants:    variantsData,
    });
    setVariantSearch(product.nombre || '');
    setItemPrecioCompra(String(precioCompra));
    setItemPrecioVenta(String(precioVenta));
    setShowVariantDrop(false);
    setItemTalla(firstTalla);
    setItemColor(firstColor);
  };

  // Clases del badge de estado. El estado proviene SIEMPRE de la API
  // (pedido.estado, derivado de la tabla States de Django vía apiOrderToLocal),
  // nunca de localStorage. Nombres/IDs reales: 1 Pendiente · 2 Entregado ·
  // 3 Cancelado · 4 Anulado.
  // Clases del badge de estado unificadas desde el servicio centralizado
  const getEstadoBadgeClass = (estado: EstadoLocal) => {
    return obtenerClaseEstado(estado);
  };

  const getClienteDocumento = (clienteId: string) => {
    const cliente = clientes.find((c: any) => c.id?.toString() === clienteId);
    return cliente ? cliente.numeroDoc : '-';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FORMULARIO: CAMPO A CAMPO
  // ─────────────────────────────────────────────────────────────────────────

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'clienteId' && !value)
      setFormErrors(prev => ({ ...prev, clienteId: 'Debes seleccionar un cliente' }));
    if (field === 'fechaPedido' && !value)
      setFormErrors(prev => ({ ...prev, fechaPedido: 'La fecha del pedido es obligatoria' }));
  };

  const handleNuevoClienteChange = (field: string, value: any) => {
    setNuevoCliente(prev => ({ ...prev, [field]: value }));
    let err = '';
    if (field === 'nombre')    err = validateField('nombre', value) || '';
    if (field === 'numeroDoc') err = validateField('documento', value) || '';
    if (field === 'email' && value) {
      if (!/^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value))
        err = 'Correo electrónico inválido';
    }
    if (field === 'telefono') {
      if (!value)                    err = 'Teléfono obligatorio';
      else if (!/^\d+$/.test(value)) err = 'Solo números';
    }
    setFormErrors(prev => ({ ...prev, [`nuevoCliente_${field}`]: err }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ABRIR MODAL CREAR / EDITAR
  // ─────────────────────────────────────────────────────────────────────────

  const handleCreate = () => {
    refreshInventarios();
    setEditingPedido(null);
    setFormData(emptyForm());
    resetItemSelection();
    setClienteQuery('');
    setShowClienteDropdown(false);
    setShowVariantDrop(false);
    setFormErrors({});
    setShowModal(true);
  };

  const handleEdit = (pedido: PedidoLocal) => {
    if (!puedeEditarse(pedido.estado)) {
      notify(`No puedes editar un pedido en estado "${pedido.estado}".`, 'error');
      return;
    }
    refreshInventarios();
    setEditingPedido(pedido);
    setFormData({
      clienteId:      pedido.clienteId,
      fechaPedido:    pedido.fechaPedido,
      metodoPago:     pedido.metodoPago,
      metodoPagoId:   pedido.metodoPagoId,
      observaciones:  pedido.observaciones,
      items:          pedido.items,
      direccionEnvio: pedido.direccionEnvio,
      personaRecibe:  pedido.personaRecibe,
      estadoId:       pedido.estadoId,
    });
    const cliente = clientes.find((c: any) => c.id.toString() === pedido.clienteId);
    const label   = cliente
      ? `${cliente.nombre} - ${cliente.numeroDoc}`
      : pedido.clienteNombre;
    setClienteQuery(label);
    setSelectedClienteNombre(label);
    resetItemSelection();
    setShowClienteDropdown(false);
    setShowVariantDrop(false);
    setFormErrors({});
    setShowModal(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // AGREGAR ÍTEM AL FORMULARIO
  // ─────────────────────────────────────────────────────────────────────────

  const agregarItem = () => {
    const errs: Record<string, string> = {};
    if (!selectedVariant)                      errs['item_selectedVariant'] = 'Selecciona un producto';
    if (!itemTalla)                            errs['item_talla']           = 'Selecciona una talla';
    if (!itemColor)                            errs['item_color']           = 'Selecciona un color';
    const cantNum = parseInt(itemCantidad, 10);
    if (isNaN(cantNum) || cantNum < 1)         errs['itemCantidad']         = 'Cantidad inválida';
    if (!itemPrecioVenta)                      errs['item_precioVenta']     = 'Precio de venta no definido';
    if (!itemPrecioCompra)                     errs['item_precioCompra']    = 'Precio de compra no definido';

    if (Object.keys(errs).length) {
      setFormErrors(prev => ({ ...prev, ...errs }));
      notify('Completa todos los campos del producto', 'error');
      return;
    }

    if (!selectedVariant) return;

    const variantTalla = itemTalla.trim().toLowerCase();
    const variantColor = itemColor.trim().toLowerCase();

    // Buscar variante real por talla Y color para obtener id_variant correcto
    const varianteReal = (selectedVariant.variants ?? []).find((v: any) => {
      const talla = String(v.size_name ?? v.talla ?? v.size ?? '').trim().toLowerCase();
      const color = String(v.color_name ?? v.color ?? '').trim().toLowerCase();
      return talla === variantTalla && color === variantColor;
    });

    // Fallback: buscar solo por talla si no hay coincidencia exacta
    const varianteFallback = (selectedVariant.variants ?? []).find((v: any) => {
      const talla = String(v.size_name ?? v.talla ?? v.size ?? '').trim().toLowerCase();
      return talla === variantTalla;
    });

    const variantId = Number(
      varianteReal?.id_variant ??
      varianteReal?.id ??
      varianteFallback?.id_variant ??
      varianteFallback?.id ??
      null
    );

    if (!variantId) {
      notify(`No se encontró variante para talla "${itemTalla}" y color "${itemColor}". Verifica el inventario.`, 'error');
      return;
    }

    // Validar Stock disponible
    const stockDisponible = getVariantStock(variantId);
    const cantidadPrevia = formData.items
      .filter(it => Number(it.variantId) === variantId)
      .reduce((sum, it) => sum + it.cantidad, 0);

    const cantidadTotalSolicitada = cantidadPrevia + cantNum;

    if (cantidadTotalSolicitada > stockDisponible) {
      notify(`No hay suficiente stock disponible para "${selectedVariant.nombre}" (Talla: ${itemTalla}, Color: ${itemColor}). Stock actual: ${stockDisponible} unidad(es). Ya has solicitado: ${cantidadPrevia} unidad(es).`, 'error');
      return;
    }

    const precioCompra = parseFloat(itemPrecioCompra) || 0;
    const precioVenta  = parseFloat(itemPrecioVenta)  || 0;
    const subtotal     = cantNum * precioVenta;

    // agregarItem — precioVenta garantizado como number
  const item: ItemPedidoLocal = {
    id:             Date.now().toString(),
    productoId:     String(selectedVariant.id_product ?? selectedVariant.id),
    variantId,
    productoNombre: selectedVariant.nombre,
    talla:          itemTalla,
    color:          itemColor,
    cantidad:       cantNum,
    precioCompra:   parseFloat(itemPrecioCompra) || 0,
    precioVenta:    parseFloat(itemPrecioVenta)  || 0,  // nunca undefined
    precioUnitario: parseFloat(itemPrecioVenta)  || 0,
    subtotal:       cantNum * (parseFloat(itemPrecioVenta) || 0),
  };

    setFormData(prev => ({ ...prev, items: [...prev.items, item] }));
    resetItemSelection();
    setShowVariantDrop(false);
    setFormErrors(prev => ({
      ...prev,
      item_selectedVariant: '',
      item_talla:           '',
      item_color:           '',
      itemCantidad:         '',
      item_precioVenta:     '',
      item_precioCompra:    '',
    }));
  };

  const eliminarItem = (itemId: string) =>
    setFormData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== itemId) }));

  // ─────────────────────────────────────────────────────────────────────────
  // GUARDAR (CREAR / EDITAR) → API
  // ─────────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (editingPedido && !puedeEditarse(editingPedido.estado)) {
      notify(`No puedes editar un pedido en estado "${editingPedido.estado}".`, 'error');
      return;
    }

    const errs: Record<string, string> = {};
    if (!formData.clienteId)   errs.clienteId   = 'Debes seleccionar un cliente';
    if (!formData.fechaPedido) errs.fechaPedido  = 'La fecha del pedido es obligatoria';
    if (!formData.direccionEnvio || !formData.direccionEnvio.trim()) {
      errs.direccionEnvio = 'La dirección de envío es obligatoria';
    }
    if (!formData.personaRecibe || !formData.personaRecibe.trim()) {
      errs.personaRecibe = 'La persona que recibe es obligatoria';
    }
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      notify('Por favor completa todos los campos obligatorios', 'error');
      return;
    }
    if (!formData.items.length) {
      notify('Agrega al menos un producto', 'error');
      return;
    }

    // Validar Stock disponible antes de guardar (refrescar inventario primero)
    const latestInventory = await refreshInventarios();
    const inventoryToUse = latestInventory || inventarios;

    const getVariantStockHelper = (variantId: number, invs: any[]): number => {
      const inv = invs.find((i: any) => Number(i.variant ?? i.id_variant) === Number(variantId));
      if (inv) return Number(inv.stock ?? 0);
      return 0;
    };

    for (const item of formData.items) {
      const stockDisponible = getVariantStockHelper(Number(item.variantId), inventoryToUse);
      const cantidadTotalSolicitada = formData.items
        .filter(it => Number(it.variantId) === Number(item.variantId))
        .reduce((sum, it) => sum + it.cantidad, 0);

      if (cantidadTotalSolicitada > stockDisponible) {
        notify(`Stock insuficiente para el producto "${item.productoNombre}" (Talla: ${item.talla}, Color: ${item.color}). Stock disponible: ${stockDisponible} unidad(es).`, 'error');
        return;
      }
    }

    const dto = formDataToCreateOrderDTO(formData);

    if (editingPedido) {
      const result = await editarPedido(editingPedido.id, dto);
      if (result) {
        notify(`Pedido ${result.number_order} actualizado correctamente`, 'success');
        setShowModal(false);
      } else {
        notify('Error al actualizar el pedido. Verifica la conexión.', 'error');
      }
    } else {
      const result = await crearPedido(dto);
      if (result) {
        notify(`Pedido ${result.number_order} creado correctamente`, 'success');
        setShowModal(false);
      } else {
        notify('Error al crear el pedido. Verifica la conexión.', 'error');
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CAMBIAR ESTADO → API
  // ─────────────────────────────────────────────────────────────────────────

  const handleCambiarEstado = async (pedido: PedidoLocal, estadoDestino: EstadoLocal) => {
    // Buscar el ID real en los estados cargados de la BD
    const matchingState = dbStates.find(s => 
      apiStateToLocalState(s) === estadoDestino
    );

    if (!matchingState) {
      notify(`No se encontró el ID para el estado "${estadoDestino}" en la base de datos.`, 'error');
      console.warn('Estados disponibles:', dbStates);
      return;
    }

    const estadoIdReal = matchingState.id_state;

    const msg = estadoDestino === 'Entregado'
      ? `¿Confirmas convertir el pedido ${pedido.numeroPedido} a venta?`
      : `¿Confirmas cambiar el estado del pedido ${pedido.numeroPedido} a "${estadoDestino}"?`;

    setConfirmMessage(msg);
    setConfirmAction(() => async () => {
      console.debug('[handleCambiarEstado] Enviando a API:', { id: pedido.id, stateId: estadoIdReal });
      
      try {
        const result = await apiCambiarEstado(pedido.id, estadoIdReal);
        
        if (result) {
          if (estadoDestino === 'Entregado') {
            console.debug('[handleCambiarEstado] Iniciando creación automática de venta para pedido:', pedido.numeroPedido);
            
            const salePayload: any = {
              client: parseInt(pedido.clienteId, 10),
              order: pedido.id,
              payment_method: pedido.metodoPagoId || 1, 
              date_sale: new Date().toISOString().split('T')[0],
              state: 1, 
              observations: `Venta automática desde pedido nº ${pedido.numeroPedido}. ${pedido.observaciones || ''}`,
              details: pedido.items.map(item => ({
                variant: item.variantId,
                quantity: item.cantidad,
                unit_price: item.precioUnitario.toString(),
                subtotal: item.subtotal.toString()
              }))
            };

            try {
              const ventaCreada = await createSale(salePayload);
              if (ventaCreada) {
                notify('Pedido convertido a venta exitosamente', 'success');
                window.dispatchEvent(new Event('salesUpdated'));
              }
            } catch (saleErr) {
              console.error('Error creando venta automática:', saleErr);
              notify('Pedido entregado, pero hubo un error al registrar la venta en el servidor.', 'warning');
            }
          } else {
            notify(`Estado actualizado a "${estadoDestino}"`, 'success');
          }

          // Notificar a otros módulos y cerrar modales
          setTimeout(() => {
            window.dispatchEvent(new Event('ordersUpdated'));
          }, 500);
        }
      } catch (err) {
        console.error('[handleCambiarEstado] Error:', err);
        notify('Ocurrió un error al procesar el cambio de estado.', 'error');
      }
      setShowEstadoModal(false);
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CREAR CLIENTE → API
  // ─────────────────────────────────────────────────────────────────────────

  const handleCrearCliente = async () => {
    const errs: Record<string, string> = {};
    const nombreErr = validateField('nombre', nuevoCliente.nombre);
    const docErr    = validateField('documento', nuevoCliente.numeroDoc);
    if (nombreErr)              errs['nuevoCliente_nombre']    = nombreErr;
    if (docErr)                 errs['nuevoCliente_numeroDoc'] = docErr;
    if (!nuevoCliente.telefono) errs['nuevoCliente_telefono']  = 'Teléfono obligatorio';
    if (nuevoCliente.email) {
      const emailErr = validateField('email', nuevoCliente.email);
      if (emailErr)             errs['nuevoCliente_email']     = emailErr;
    }
    if (Object.keys(errs).length) {
      setFormErrors(prev => ({ ...prev, ...errs }));
      notify('Completa los campos obligatorios correctamente', 'error');
      return;
    }

    try {
      setClientesLoading(true);

      const clienteDTO: CreateClientsDTO = {
        name:     nuevoCliente.nombre,
        type_doc: nuevoCliente.tipoDoc === 'CC' ? 1 : nuevoCliente.tipoDoc === 'CE' ? 2 : 3,
        doc:      nuevoCliente.numeroDoc,
        phone:    nuevoCliente.telefono,
        email:    nuevoCliente.email,
        address:  nuevoCliente.direccion,
        city:     '',
      };

      const clienteCreado = await createClients(clienteDTO);

      if (clienteCreado) {
        const clienteMapeado = {
          id:          clienteCreado.id_client,
          nombre:      clienteCreado.name,
          tipoDoc:     clienteCreado.type_doc,
          numeroDoc:   clienteCreado.doc,
          telefono:    clienteCreado.phone,
          email:       clienteCreado.email,
          direccion:   clienteCreado.address,
          ciudad:      clienteCreado.city,
          activo:      clienteCreado.state,
          saldoAFavor: 0,
        };

        setClientes(prev => [...prev, clienteMapeado]);
        handleFieldChange('clienteId', clienteMapeado.id.toString());
        const label = `${clienteMapeado.nombre} - ${clienteMapeado.numeroDoc}`;
        setClienteQuery(label);
        setSelectedClienteNombre(label);
        setShowClienteModal(false);
        setNuevoCliente({ nombre: '', tipoDoc: 'CC', numeroDoc: '', telefono: '', email: '', direccion: '' });
        notify(`Cliente ${clienteMapeado.nombre} creado correctamente`, 'success');
      } else {
        notify('Error al crear el cliente', 'error');
      }
    } catch (error) {
      console.error('Error al crear cliente:', error);
      notify('Error al crear el cliente', 'error');
    } finally {
      setClientesLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DESCARGAR COMPROBANTE
  // ─────────────────────────────────────────────────────────────────────────

  const descargarComprobante = (pedido: PedidoLocal) => {
    const contenido = `
=================================
PEDIDO ${pedido.numeroPedido}
=================================
Fecha: ${new Date(pedido.fechaPedido).toLocaleDateString()}
Cliente: ${pedido.clienteNombre}
Estado: ${pedido.estado}
Dirección de Envío: ${pedido.direccionEnvio || '-'}
Persona que recibe: ${pedido.personaRecibe || '-'}

---------------------------------
PRODUCTOS
---------------------------------
${pedido.items.map(i => `
${i.productoNombre}
Talla: ${i.talla} | Color: ${i.color}
Cantidad: ${i.cantidad} x ${formatCOP(i.precioUnitario)}
Subtotal: ${formatCOP(i.subtotal)}
`).join('\n')}

---------------------------------
TOTALES
---------------------------------
Subtotal: ${formatCOP(pedido.subtotal)}
IVA (19%): ${formatCOP(pedido.iva)}
TOTAL: ${formatCOP(pedido.total)}

Método de Pago: ${pedido.metodoPago}
${pedido.observaciones ? `\nObservaciones:\n${pedido.observaciones}` : ''}

=================================
DAMABELLA - Moda Femenina
=================================`.trim();

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${pedido.numeroPedido}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FILTRADO Y PAGINACIÓN
  // ─────────────────────────────────────────────────────────────────────────

  const filteredPedidos = useMemo(() => {
    return pedidos.filter(p => {
      // ELIMINADO: if (p.estado !== 'Pendiente') return false; 
      // Ahora se muestran todos los pedidos (Pendientes, Entregados, etc.)
      const q = searchTerm.toLowerCase();
      if (!q) return true;
      const doc = getClienteDocumento(p.clienteId).toLowerCase();
      return (
        p.numeroPedido.toLowerCase().includes(q) ||
        p.clienteNombre.toLowerCase().includes(q) ||
        doc.includes(q) ||
        p.estado.toLowerCase().includes(q) ||
        new Date(p.fechaPedido).toLocaleDateString().includes(searchTerm) ||
        p.total.toString().includes(searchTerm) ||
        p.items.some(i =>
          i.productoNombre.toLowerCase().includes(q) ||
          i.talla.toLowerCase().includes(q) ||
          i.color.toLowerCase().includes(q)
        )
      );
    });
  }, [pedidos, searchTerm, clientes]);

  const totalPages = Math.ceil(filteredPedidos.length / ITEMS_PER_PAGE);

  const paginatedPedidos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPedidos.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPedidos, currentPage]);

  const clientesFiltradosSelect = useMemo(() =>
    clientes
      .filter((c: any) => c.activo !== false)
      .filter((c: any) => {
        const q = clienteQuery.toLowerCase();
        return (
          (c.nombre?.toLowerCase()  ?? '').includes(q) ||
          (c.numeroDoc              ?? '').includes(clienteQuery) ||
          (c.telefono               ?? '').includes(clienteQuery)
        );
      }),
    [clientes, clienteQuery]);

  const productosFiltradosSelect = useMemo(() =>
    productos
      .filter((p: any) => p.activo)
      .filter((p: any) => {
        const q = variantSearch.toLowerCase();
        return (
          (p.nombre?.toLowerCase()          ?? '').includes(q) ||
          (p.categoriaNombre?.toLowerCase() ?? '').includes(q)
        );
      }),
    [productos, variantSearch]);

  const clienteSeleccionado = clientes.find(
    (c: any) => c.id?.toString() === formData.clienteId?.toString()
  );
  const saldoDisponible = Number(clienteSeleccionado?.saldoAFavor || 0);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Pedidos</h2>
          <p className="text-gray-600">Administra pedidos con IVA incluido</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={descargarExcel}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Download size={20} />
            Descargar Pedidos
          </Button>
          {hasPermission('pedidos', 'create') && (
            <Button onClick={handleCreate} variant="primary" className="flex items-center gap-2">
              <Plus size={20} />
              Registrar Pedido
            </Button>
          )}
        </div>
      </div>

      {/* Error de API */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{apiError}</span>
          <button onClick={fetchPedidos} className="ml-auto underline text-sm">Reintentar</button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar por número, cliente o estado..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-gray-600">Número</th>
                <th className="text-left py-4 px-6 text-gray-600">Cliente</th>
                <th className="text-left py-4 px-6 text-gray-600">Documento</th>
                <th className="text-left py-4 px-6 text-gray-600">Fecha</th>
                <th className="text-right py-4 px-6 text-gray-600">Total</th>
                <th className="text-center py-4 px-6 text-gray-600">Estado</th>
                <th className="text-right py-4 px-6 text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {apiLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <ShoppingCart className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron pedidos</p>
                  </td>
                </tr>
              ) : (
                paginatedPedidos.map(pedido => (
                  <tr
                    key={pedido.id}
                    className={`transition-colors ${
                      pedido.estado === 'Cancelado' || pedido.estado === 'Anulado'
                        ? 'opacity-50 line-through bg-gray-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-4 px-6 text-gray-900">{pedido.numeroPedido}</td>
                    <td className="py-4 px-6 text-gray-600">{pedido.clienteNombre}</td>
                    <td className="py-4 px-6 text-gray-600">{getClienteDocumento(pedido.clienteId)}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {new Date(pedido.fechaPedido).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right text-gray-900">
                      {formatCOP(pedido.total)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center ${getEstadoBadgeClass(pedido.estado)}`}>
                          {pedido.estado}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setViewingPedido(pedido); setShowDetailModal(true); }}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => descargarComprobante(pedido)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                          title="Descargar comprobante"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setPedidoParaCambiarEstado(pedido);
                            setNuevoEstadoModal(pedido.estado);
                            setShowEstadoModal(true);
                          }}
                          disabled={!hasPermission('pedidos', 'edit')}
                          className={`p-2 rounded-lg transition-colors ${
                            !hasPermission('pedidos', 'edit')
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'hover:bg-purple-50 text-purple-600'
                          }`}
                          title={!hasPermission('pedidos', 'edit') ? "Sin permiso de edición" : "Cambiar estado"}
                        >
                          <Repeat size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(pedido)}
                          disabled={!puedeEditarse(pedido.estado) || !hasPermission('pedidos', 'edit')}
                          className={`p-2 rounded-lg transition-colors ${
                            !puedeEditarse(pedido.estado) || !hasPermission('pedidos', 'edit')
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'hover:bg-gray-100 text-gray-600'
                          }`}
                          title={
                            !hasPermission('pedidos', 'edit')
                              ? 'Sin permiso de edición'
                              : !puedeEditarse(pedido.estado)
                                ? `No editable en estado ${pedido.estado}`
                                : 'Editar'
                          }
                        >
                          <Pencil size={18} />
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
            <span>
              {`Mostrando ${Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredPedidos.length)} a ${Math.min(currentPage * ITEMS_PER_PAGE, filteredPedidos.length)} de ${filteredPedidos.length} pedidos`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={
                    currentPage === page
                      ? 'px-3 py-1.5 rounded-md bg-gray-900 text-white text-sm font-semibold'
                      : 'px-3 py-1.5 rounded-md border text-sm text-gray-700 hover:bg-gray-100'
                  }
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Crear/Editar ───────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPedido ? 'Editar Pedido' : 'Nuevo Pedido'}
        size="xxl"
        noScroll
      >
        <div className="w-[95vw] max-w-[1400px] max-h-[90vh] pr-0.5 text-[10px] leading-tight overflow-hidden mx-auto flex flex-col">

          {/* Header fijo */}
          <div className="border border-gray-200 rounded-md bg-white p-2 shrink-0 relative z-10">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 mb-2">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Número de pedido</label>
                  <Input
                    value={editingPedido?.numeroPedido ?? 'Auto-generado'}
                    readOnly disabled
                    className="h-6 px-2 text-[10px] bg-gray-50 w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Fecha de creación</label>
                  <Input
                    type="date"
                    value={formData.fechaPedido}
                    onChange={e => handleFieldChange('fechaPedido', e.target.value)}
                    disabled={!!editingPedido}
                    className="h-6 px-2 text-[10px] bg-gray-50 w-full"
                  />
                  {formErrors.fechaPedido && <p className="text-red-500 text-[10px] mt-1">{formErrors.fechaPedido}</p>}
                </div>
                <div className="lg:col-span-2 flex items-end">
                  <Button onClick={() => setShowClienteModal(true)} variant="secondary" className="w-full h-6 px-2 text-[10px]">
                    <UserPlus size={14} /> Crear cliente
                  </Button>
                </div>
              </div>

              {/* Buscador cliente */}
              <div>
                <label className="block text-gray-700 mb-1 text-[10px]">Cliente *</label>
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <Input
                    value={clienteQuery}
                    onChange={e => {
                      const v = e.target.value;
                      setClienteQuery(v);
                      setShowClienteDropdown(true);
                      if (v.trim() !== selectedClienteNombre.trim()) {
                        handleFieldChange('clienteId', '');
                        setSelectedClienteNombre('');
                      }
                    }}
                    onFocus={() => setShowClienteDropdown(true)}
                    onBlur={() => setTimeout(() => setShowClienteDropdown(false), 200)}
                    placeholder="Buscar cliente..."
                    className="h-6 px-2 text-[10px] w-full"
                  />
                  {showClienteDropdown && (
                    <div className="absolute z-[9999] mt-1 w-full max-h-40 bg-white border border-gray-200 rounded-md shadow-md overflow-y-auto">
                      {clientesFiltradosSelect.length === 0
                        ? <div className="px-2 py-1.5 text-[10px] text-gray-500">No hay resultados</div>
                        : clientesFiltradosSelect.map((c: any) => (
                          <button
                            type="button"
                            key={c.id}
                            className="w-full text-left px-2 py-1 hover:bg-gray-50"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleFieldChange('clienteId', c.id.toString());
                              const label = `${c.nombre} - ${c.numeroDoc}`;
                              setClienteQuery(label);
                              setSelectedClienteNombre(label);
                              setShowClienteDropdown(false);
                            }}
                          >
                            <div className="text-[10px] text-gray-900">{c.nombre}</div>
                            <div className="text-[10px] text-gray-500">{c.numeroDoc}{c.telefono ? ` • ${c.telefono}` : ''}</div>
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
                {formErrors.clienteId && <p className="text-red-500 text-[10px] mt-1">{formErrors.clienteId}</p>}
              </div>

              {/* Resumen cliente */}
              {clienteSeleccionado && (
                <div className="mt-2 border border-gray-200 rounded-md p-2 bg-gray-50 grid grid-cols-2 lg:grid-cols-4 gap-2 text-[10px]">
                  <div><span className="text-gray-500">Nombre:</span><div className="text-gray-900 font-medium truncate">{clienteSeleccionado.nombre || '-'}</div></div>
                  <div><span className="text-gray-500">Documento:</span><div className="text-gray-900 font-medium">{clienteSeleccionado.numeroDoc || '-'}</div></div>
                  <div><span className="text-gray-500">Teléfono:</span><div className="text-gray-900 font-medium">{clienteSeleccionado.telefono || '-'}</div></div>
                  <div><span className="text-gray-500">Ciudad:</span><div className="text-gray-900 font-medium">{clienteSeleccionado.ciudad || clienteSeleccionado.direccion || '-'}</div></div>
                </div>
              )}
            </div>
          </div>

          {/* Body scrolleable */}
          <div className="flex-1 overflow-y-auto space-y-2 pb-2 min-h-0">
            <div className="border border-gray-200 rounded-md bg-white p-2">
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
                  <div>
                    <label className="block text-gray-700 mb-1 text-[10px]">Método de Pago *</label>
                    {saldoDisponible > 0 && formData.clienteId && (
                      <div className="mb-1 rounded-md border border-green-300 bg-green-50 p-1 text-[10px]">
                        <span className="text-green-800 font-semibold">✅ Saldo: {formatCOP(saldoDisponible)}</span>
                      </div>
                    )}
                    <select
                      value={formData.metodoPago}
                      onChange={e => setFormData(prev => ({ ...prev, metodoPago: e.target.value, metodoPagoId: metodoPagoNameToId(e.target.value) }))}
                      className="w-full h-6 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-[10px]"
                    >
                      {['Efectivo','Transferencia','Tarjeta','Nequi','Daviplata'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1 text-[10px]">Dirección de Envío *</label>
                    <Input value={formData.direccionEnvio} onChange={e => handleFieldChange('direccionEnvio', e.target.value)} placeholder="Dirección" className="h-6 px-2 text-[10px]" />
                    {formErrors.direccionEnvio && <p className="text-red-500 text-[10px] mt-1">{formErrors.direccionEnvio}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1 text-[10px]">Persona que recibe *</label>
                    <Input value={formData.personaRecibe} onChange={e => handleFieldChange('personaRecibe', e.target.value)} placeholder="Nombre" className="h-6 px-2 text-[10px]" />
                    {formErrors.personaRecibe && <p className="text-red-500 text-[10px] mt-1">{formErrors.personaRecibe}</p>}
                  </div>
                </div>

                {/* Agregar producto */}
                <h4 className="text-gray-900 text-[10px] font-semibold mb-2 mt-2">Agregar productos</h4>
                <div className="bg-gray-50 rounded-md p-2 mb-2 border border-gray-200">
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[200px] relative">
                      <Input
                        value={variantSearch}
                        onChange={e => { setVariantSearch(e.target.value); setSelectedVariant(null); setShowVariantDrop(true); }}
                        onFocus={() => setShowVariantDrop(true)}
                        onBlur={() => setTimeout(() => setShowVariantDrop(false), 200)}
                        placeholder="Buscar producto..."
                        className="w-full h-7 px-2 text-[10px]"
                      />
                      {selectedVariant && (
                        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md text-[10px] text-gray-700">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="font-semibold text-gray-900">Producto</p>
                              <p className="text-gray-600 truncate">{selectedVariant.nombre}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Cantidad</p>
                              <p className="text-gray-600">{itemCantidad || '0'}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Talla</p>
                              <p className="text-gray-600">{itemTalla || '-'}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Color</p>
                              <p className="text-gray-600">{itemColor || '-'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {showVariantDrop && variantSearch.trim() !== '' && (
                        <div className="absolute z-50 mt-1 w-full max-h-60 bg-white border border-gray-200 rounded-md shadow-lg overflow-y-auto text-[10px]">
                          {productosFiltradosSelect.length === 0 ? (
                            <div className="px-3 py-3 text-center text-gray-500">No hay resultados</div>
                          ) : (
                            productosFiltradosSelect.map((p: any) => (
                              <button
                                key={p.id}
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); handleSelectProduct(p); }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-semibold text-gray-900">{p.nombre}</div>
                                <div className="text-gray-500 text-[10px]">
                                  {p.categoriaNombre || 'Sin categoría'} · Venta {formatCOP(p.precioVenta ?? 0)}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <div className="w-24">
                      <select
                        value={itemTalla}
                        onChange={e => {
                          const value = normalizeOptionValue(e.target.value);
                          setItemTalla(value);
                          if (selectedVariant) {
                            setSelectedVariant({ ...selectedVariant, talla: value });
                          }
                        }}
                        className="w-full h-7 px-2 border border-gray-300 rounded-md text-[10px]"
                      >
                        <option value="">Talla</option>
                        {getTallasDisponibles().map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="w-24">
                      <select
                        value={itemColor}
                        onChange={e => {
                          const value = normalizeOptionValue(e.target.value);
                          setItemColor(value);
                          if (selectedVariant) {
                            setSelectedVariant({ ...selectedVariant, color: value });
                          }
                        }}
                        className="w-full h-7 px-2 border border-gray-300 rounded-md text-[10px]"
                      >
                        <option value="">Color</option>
                        {getColoresDisponibles().map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="w-20">
                      <Input
                        type="number" min="1"
                        value={itemCantidad}
                        onChange={e => setItemCantidad(e.target.value)}
                        className="w-full h-7 px-2 text-[10px]"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        value={itemPrecioCompra}
                        readOnly
                        placeholder="P. Compra"
                        className="w-full h-7 px-2 text-[10px] bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        value={itemPrecioVenta}
                        readOnly
                        placeholder="P. Venta"
                        className="w-full h-7 px-2 text-[10px] bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    <Button onClick={agregarItem} variant="secondary" className="h-7 px-3 text-[10px] whitespace-nowrap">
                      <Plus size={14} /> Agregar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabla items */}
              <div className="border border-gray-200 rounded-md overflow-x-auto mt-2">
                <table className="w-full text-[10px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-2 px-3 text-gray-600">Producto</th>
                      <th className="text-left py-2 px-3 text-gray-600">Talla</th>
                      <th className="text-left py-2 px-3 text-gray-600">Color</th>
                      <th className="text-right py-2 px-3 text-gray-600">Cant.</th>
                      <th className="text-right py-2 px-3 text-gray-600">P. Venta</th>
                      <th className="text-right py-2 px-3 text-gray-600">IVA</th>
                      <th className="text-right py-2 px-3 text-gray-600">Total parcial</th>
                      <th className="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.items.length === 0 ? (
                      <tr><td colSpan={8} className="px-3 py-4 text-center text-gray-500">No hay productos agregados</td></tr>
                    ) : (
                      formData.items.map((item) => {
                        // Fix: usar siempre precioVenta para consistencia con los totales
                        const precioVenta  = item.precioVenta;
                        const totalParcial = item.cantidad * precioVenta;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-900 font-medium">{item.productoNombre}</td>
                            <td className="py-2 px-3 text-gray-700">{item.talla}</td>
                            <td className="py-2 px-3 text-gray-700">{item.color}</td>
                            <td className="py-2 px-3 text-right tabular-nums">{item.cantidad}</td>
                            <td className="py-2 px-3 text-right tabular-nums">{formatCOP(precioVenta)}</td>
                            <td className="py-2 px-3 text-right tabular-nums">{Math.round(IVA_RATE * 100)}%</td>
                            <td className="py-2 px-3 text-right tabular-nums font-medium">{formatCOP(totalParcial)}</td>
                            <td className="py-2 px-3 text-right">
                              <button onClick={() => eliminarItem(item.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer sticky */}
          <div className="sticky bottom-0 bg-white/95 border-t border-gray-200 pt-2 shrink-0">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 items-end">
                <div className="lg:col-span-2 rounded-md bg-gray-50 border border-gray-200 p-2">
                  {(() => {
                    // Cálculos inline para evitar desincronización
                    const total    = formData.items.reduce((sum, item) => sum + item.cantidad * (item.precioVenta || item.precioUnitario || 0), 0);
                    const subtotal = total / (1 + IVA_RATE);
                    const iva      = total - subtotal;
                    return (
                      <>
                        <div className="flex justify-between text-gray-600 text-[10px]">
                          <span>Total parcial</span><span>{formatCOP(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 text-[10px] mt-1">
                          <span>IVA ( {Math.round(IVA_RATE * 100)} % )</span><span>{formatCOP(iva)}</span>
                        </div>
                        <div className="flex justify-between text-gray-900 text-[11px] font-semibold mt-2 pt-2 border-t border-gray-200">
                          <span>Total a pagar</span><span>{formatCOP(total)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="lg:col-span-2 flex gap-2 justify-end">
                  <Button onClick={() => setShowModal(false)} variant="secondary" className="h-6 px-3 text-[10px]">Cancelar</Button>
                  <Button onClick={handleSave} variant="primary" className="h-6 px-3 text-[10px]" disabled={apiLoading}>
                    {apiLoading ? 'Guardando...' : editingPedido ? 'Guardar Cambios' : 'Crear Pedido'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Modal Detalle ────────────────────────────────────────────────── */}
      {viewingPedido && (
        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`Detalle Pedido ${viewingPedido.numeroPedido}`}>
          <div className="space-y-0 p-0 -mt-4 max-h-[85vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-1 p-1 bg-gray-50 rounded-lg">
              {[
                ['Cliente',         viewingPedido.clienteNombre],
                ['Fecha',           new Date(viewingPedido.fechaPedido).toLocaleDateString()],
                ['Método de Pago',  viewingPedido.metodoPago],
                ['Dirección Envío', viewingPedido.direccionEnvio || '-'],
                ['Persona recibe',  viewingPedido.personaRecibe || '-'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div className="text-sm text-gray-600 mb-1">{label}</div>
                  <div className="text-gray-900">{val}</div>
                </div>
              ))}
              <div>
                <div className="text-sm text-gray-600 mb-1">Estado</div>
                <span className={`inline-flex items-center ${getEstadoBadgeClass(viewingPedido.estado)}`}>
                  {viewingPedido.estado}
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-gray-900 mb-1">Productos</h4>
              <div className="grid grid-cols-2 gap-1">
                {viewingPedido.items.map((item, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-1 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-900">{item.productoNombre}</span>
                      <span>{formatCOP(item.subtotal)}</span>
                    </div>
                    <div className="text-gray-600">
                      {item.talla && `Talla: ${item.talla} | `}
                      {item.color && `Color: ${item.color} | `}
                      {`Cant: ${item.cantidad} × ${formatCOP(item.precioUnitario)}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-2 bg-gray-50 rounded-lg p-2 space-y-1">
              <div className="flex justify-between text-gray-600"><span>Subtotal:</span><span>{formatCOP(viewingPedido.subtotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>IVA (19%):</span><span>{formatCOP(viewingPedido.iva)}</span></div>
              <div className="flex justify-between text-gray-900 pt-1 border-t font-semibold"><span>Total:</span><span>{formatCOP(viewingPedido.total)}</span></div>
            </div>
            {viewingPedido.observaciones && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Observaciones</div>
                <div className="text-gray-900 bg-gray-50 p-2 rounded-lg">{viewingPedido.observaciones}</div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── Modal Nuevo Cliente ──────────────────────────────────────────── */}
      <Modal isOpen={showClienteModal} onClose={() => setShowClienteModal(false)} title="Nuevo Cliente">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Tipo de Documento *</label>
              <select value={nuevoCliente.tipoDoc} onChange={e => setNuevoCliente(p => ({ ...p, tipoDoc: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
                {[['CC','Cédula de Ciudadanía'],['CE','Cédula de Extranjería'],['TI','Tarjeta de Identidad'],['PAS','Pasaporte']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Número de Documento *</label>
              <Input value={nuevoCliente.numeroDoc} onChange={e => handleNuevoClienteChange('numeroDoc', e.target.value)} placeholder="1234567890" />
              {formErrors['nuevoCliente_numeroDoc'] && <p className="text-red-500 text-sm mt-1">{formErrors['nuevoCliente_numeroDoc']}</p>}
            </div>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Nombre Completo *</label>
            <Input value={nuevoCliente.nombre} onChange={e => handleNuevoClienteChange('nombre', e.target.value)} placeholder="Nombre del cliente" />
            {formErrors['nuevoCliente_nombre'] && <p className="text-red-500 text-sm mt-1">{formErrors['nuevoCliente_nombre']}</p>}
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Teléfono *</label>
            <Input value={nuevoCliente.telefono} onChange={e => handleNuevoClienteChange('telefono', e.target.value)} placeholder="3001234567" />
            {formErrors['nuevoCliente_telefono'] && <p className="text-red-500 text-sm mt-1">{formErrors['nuevoCliente_telefono']}</p>}
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Correo Electrónico</label>
            <Input type="email" value={nuevoCliente.email} onChange={e => handleNuevoClienteChange('email', e.target.value)} placeholder="correo@ejemplo.com" />
            {formErrors['nuevoCliente_email'] && <p className="text-red-500 text-sm mt-1">{formErrors['nuevoCliente_email']}</p>}
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Dirección</label>
            <Input value={nuevoCliente.direccion} onChange={e => setNuevoCliente(p => ({ ...p, direccion: e.target.value }))} placeholder="Calle 123 # 45-67" />
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button onClick={() => setShowClienteModal(false)} variant="secondary">Cancelar</Button>
            <Button onClick={handleCrearCliente} variant="primary" disabled={clientesLoading}>
              {clientesLoading ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Cambiar Estado ─────────────────────────────────────────── */}
      <Modal isOpen={showEstadoModal} onClose={() => setShowEstadoModal(false)} title="Cambiar Estado del Pedido">
        <div className="space-y-4">
          {pedidoParaCambiarEstado && (() => {
            const esConvertido = pedidoParaCambiarEstado.estado === 'Entregado';
            return (
              <>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-gray-700 space-y-1">
                  <p><span className="font-semibold">Pedido:</span> {pedidoParaCambiarEstado.numeroPedido}</p>
                  <p><span className="font-semibold">Cliente:</span> {pedidoParaCambiarEstado.clienteNombre}</p>
                  <p><span className="font-semibold">Estado actual:</span>{' '}
                    <span className={`inline-block ${getEstadoBadgeClass(pedidoParaCambiarEstado.estado)}`}>
                      {pedidoParaCambiarEstado.estado}
                    </span>
                  </p>
                </div>

                {esConvertido ? (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300 text-sm text-yellow-900">
                    Este pedido ya fue convertido en venta. Modifícalo desde el módulo de Ventas.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* SECCIÓN: ESTADOS DEL FLUJO */}
                    <div>
                      <label className="block text-gray-700 mb-3 font-semibold text-sm">Estados del Flujo</label>
                      <div className="flex flex-wrap gap-2">
                        {(['Pendiente', 'Entregado', 'Cancelado', 'Anulado'] as EstadoLocal[]).map(estado => {
                          const esActual = pedidoParaCambiarEstado.estado === estado;
                          const valido = puedeTransicionar(pedidoParaCambiarEstado.estado, estado);
                          const esAnulacionOCancelacion = estado === 'Cancelado' || estado === 'Anulado';
                          const tienePermisoEstado = esAnulacionOCancelacion ? hasPermission('pedidos', 'delete') : true;
                          const botDisabled = !valido || esActual || !tienePermisoEstado;
                          
                          return (
                            <button 
                              key={estado}
                              onClick={() => valido && tienePermisoEstado && handleCambiarEstado(pedidoParaCambiarEstado, estado)}
                              disabled={botDisabled}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                esActual
                                  ? 'bg-zinc-100 text-zinc-500 border-zinc-200 cursor-default'
                                  : (valido && tienePermisoEstado)
                                    ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                                    : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                              }`}
                            >
                              {estado}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SECCIÓN: ACCIÓN (CONVERTIR A VENTA) */}
                    <div className="border-t pt-4">
                      <label className="block text-gray-700 mb-3 font-semibold text-sm">Acción Principal</label>
                        <button
                        onClick={() => handleCambiarEstado(pedidoParaCambiarEstado, 'Entregado')}
                        disabled={!puedeTransicionar(pedidoParaCambiarEstado.estado, 'Entregado')}
                        className={`w-full px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                          puedeTransicionar(pedidoParaCambiarEstado.estado, 'Entregado')
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle size={18} />
                        Convertir a Venta
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button onClick={() => setShowEstadoModal(false)} variant="secondary">
                    {esConvertido ? 'Cerrar' : 'Cancelar'}
                  </Button>
                  {!esConvertido && (
                    <Button
                      onClick={() => handleCambiarEstado(pedidoParaCambiarEstado, nuevoEstadoModal)}
                      variant="primary"
                      disabled={apiLoading}
                    >
                      {apiLoading ? 'Guardando...' : 'Guardar Cambio'}
                    </Button>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </Modal>

      {/* ── Modal Notificación ───────────────────────────────────────────── */}
      <Modal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        title={notificationType === 'success' ? 'Éxito' : notificationType === 'error' ? 'Error' : 'Información'}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            {notificationType === 'success' && <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />}
            {notificationType === 'error'   && <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />}
            {notificationType === 'info'    && <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={24} />}
            <p className="text-gray-700">{notificationMessage}</p>
          </div>
          <div className="flex justify-end pt-2 border-t">
            <Button onClick={() => setShowNotificationModal(false)} variant="primary">Aceptar</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Confirmación ───────────────────────────────────────────── */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirmar Acción">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
            <p className="text-gray-700">{confirmMessage}</p>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button onClick={() => setShowConfirmModal(false)} variant="secondary">Cancelar</Button>
            <Button
              onClick={() => { if (confirmAction) confirmAction(); }}
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
