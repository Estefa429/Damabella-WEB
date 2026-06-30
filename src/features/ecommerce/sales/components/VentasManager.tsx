import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { usePermissions } from '@/shared/hooks/usePermissions';
import { jsPDF } from 'jspdf';
import { getAllSales, createSale, annulSale, exportSales, CreateSaleDTO, Sale } from '../services/SalesServices';
import { getAllClients, createClients, CreateClientsDTO, Clients } from '../../customers/services/clientsServices';
import { getAllProducts, Product, getAllColors, getAllSizes, Color, Size, getAllInventory } from '../../products/services/productsService';
import { getAllVariants, VariantProduct } from '@/features/purchases/services/PurchasesService';
import { getAllIvas, Iva } from '@/features/purchases/services/ivaService';
import { createReturn, CreateReturnDTO, getAllReturns } from '@/features/returns/services/ReturnServices';
import { createChange, CreateChangeDTO, getAllChanges } from '@/features/returns/services/ChangeServices';
import { formatCOP } from '@/features/dashboard/utils/dashboardHelpers';

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
  productoNuevoCantidad: number;
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
  number_pedido?: string;
  pedido?: {
    client?: {
      name?: string;
    };
    user?: {
      username?: string;
      email?: string;
    };
  };
  user?: {
    username?: string;
    email?: string;
  };
}

export default function VentasManager() {
  const { hasPermission } = usePermissions();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [variants, setVariants] = useState<VariantProduct[]>([]);
  const [tallas, setTallas] = useState<Size[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [ivas, setIvas] = useState<Iva[]>([]);
  const [inventarios, setInventarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    items: [] as ItemVenta[],
    pedidoId: null as number | null
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
    variantId: '',
    cantidad: '1',
    precioUnitario: ''
  });

  const [variantSearch, setVariantSearch] = useState('');
  const [showVariantDrop, setShowVariantDrop] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const [itemTalla, setItemTalla] = useState('');
  const [itemColor, setItemColor] = useState('');
  const [itemCantidad, setItemCantidad] = useState('1');
  const [itemPrecioUnitario, setItemPrecioUnitario] = useState('');

  const getVariantIvaRate = (variantId: string | number) => {
    const variantIdStr = String(variantId);
    const variant = variants.find(v => String(v.id_variant) === variantIdStr);
    if (!variant) return 0.19; // Default Damabella IVA

    const product = productos.find(p => Number(p.id) === variant.product);
    if (!product) return 0.19;

    const ivaId = Number(product.iva ?? 0);
    const ivaItem = ivas.find(i => i.id_iva === ivaId);
    if (ivaItem) return ivaItem.value;

    return 0.19;
  };

  const [devolucionData, setDevolucionData] = useState<DevolucionData>({
    motivo: 'Defectuoso',
    itemsDevueltos: [],
    productoNuevoId: '',
    productoNuevoTalla: '',
    productoNuevoColor: '',
    productoNuevoCantidad: 0,
    medioPagoExcedente: 'Efectivo',
  });



  // Cargar datos desde API al montar el componente
  const loadVentas = useCallback(async () => {
    setLoading(true);
    try {
      const [ventasAPI, returnsAPI, changesAPI] = await Promise.all([
        getAllSales(),
        getAllReturns(),
        getAllChanges()
      ]);
      console.log('Ventas cargadas de API:', ventasAPI?.length);
      
      const returnedSaleIds = new Set<number>();
      if (returnsAPI) {
        returnsAPI.forEach((r) => { if (r.sale) returnedSaleIds.add(r.sale); });
      }
      if (changesAPI) {
        changesAPI.forEach((c) => { if (c.sale) returnedSaleIds.add(c.sale); });
      }

      if (ventasAPI) {
        const ventasMapeadas = ventasAPI.map((sale: Sale): Venta => ({
          id: sale.id_sale,
          numeroVenta: sale.number_sale,
          clienteId: sale.client.toString(),
          clienteNombre: sale.client_name ||
                         (sale as any).pedido?.client?.name ||
                         (sale as any).pedido?.user?.username ||
                         (sale as any).pedido?.user?.email ||
                         (sale as any).user?.username ||
                         (sale as any).user?.email ||
                         'Consumidor Final',
          fechaVenta: sale.date_sale,
          estado: (sale.state ? 'Anulada' : ((sale.void || returnedSaleIds.has(sale.id_sale)) ? 'Devolución' : 'Completada')) as 'Completada' | 'Anulada' | 'Devolución',
          items: (sale.details || []).map(detail => ({
            id: detail.id_detail?.toString() || '',
            productoId: detail.variant.toString(),
            productoNombre: '',
            talla: '',
            color: '',
            cantidad: detail.quantity,
            precioUnitario: parseFloat(detail.unit_price || '0'),
            subtotal: parseFloat(detail.subtotal || '0')
          })),
          subtotal: parseFloat(sale.subtotal),
          iva: parseFloat(sale.iva),
          total: parseFloat(sale.total),
          metodoPago: sale.payment_method_name || 'Efectivo',
          observaciones: sale.observations || '',
          anulada: sale.state || false,
          motivoAnulacion: sale.void_reason || '',
          createdAt: sale.created_at || new Date().toISOString(),
          number_pedido: (sale as any).number_pedido || '',
          pedido: (sale as any).pedido,
          user: (sale as any).user,
        }));
        setVentas(ventasMapeadas);
      }
    } catch (error) {
      console.error('Error refreshing sales:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos desde API al montar el componente
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Cargar ventas (usando la función ya definida)
        await loadVentas();

        // Cargar clientes
        const clientesAPI = await getAllClients();
        if (clientesAPI) {
          const clientesMapeados = clientesAPI.map((client: Clients) => ({
            id: client.id_client,
            nombre: client.name,
            tipoDoc: client.type_doc,
            numeroDoc: client.doc,
            telefono: client.phone,
            email: client.email,
            direccion: client.address,
            ciudad: client.city,
            activo: client.state,
            saldoAFavor: client.saldoAFavor ?? (client as any).saldo_a_favor ?? 0
          }));
          setClientes(clientesMapeados);
        }

        // Cargar productos
        const productosAPI = await getAllProducts();
        if (productosAPI) {
          const productosMapeados = productosAPI.map((product: Product) => ({
            id: product.id_product.toString(),
            nombre: product.name,
            categoria: product.category,
            categoriaNombre: product.category_name,
            precioVenta: product.price,
            precioCompra: product.purchase_price,
            activo: product.is_active,
            iva: product.iva,
          }));
          setProductos(productosMapeados);
        }

        // Cargar tallas, colores, variantes, IVAs e inventarios
        const [tallasAPI, coloresAPI, variantesAPI, ivasAPI, inventariosAPI] = await Promise.all([
          getAllSizes(),
          getAllColors(),
          getAllVariants(),
          getAllIvas(),
          getAllInventory()
        ]);
        if (tallasAPI) setTallas(tallasAPI);
        if (coloresAPI) setColores(coloresAPI);
        if (variantesAPI) setVariants(variantesAPI);
        if (ivasAPI) setIvas(ivasAPI);
        if (inventariosAPI) setInventarios(inventariosAPI);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadVentas]);

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

  const getVariantDetails = useCallback((variantId: string | number) => {
    const vId = Number(variantId);
    const variant = variants.find(v => v.id_variant === vId);
    return {
      nombre: variant?.product_name || `Ref: ${variant?.sku || variantId}`,
      talla: variant?.size_name || '',
      color: variant?.color_name || ''
    };
  }, [variants]);

  useEffect(() => {
    const handleStorageChange = () => {
      loadVentas();
    };

    window.addEventListener('salesUpdated', handleStorageChange);
    window.addEventListener('pedidoConvertidoAVenta', handleStorageChange);

    return () => {
      window.removeEventListener('salesUpdated', handleStorageChange);
      window.removeEventListener('pedidoConvertidoAVenta', handleStorageChange);
    };
  }, [loadVentas]);


  const generarNumeroVenta = () => `VEN-${(ventas.length + 1).toString().padStart(3, '0')}`;

  const totals = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
    const iva = formData.items.reduce((sum, item) => {
      const rate = getVariantIvaRate(item.productoId);
      return sum + (item.subtotal * rate);
    }, 0);
    const total = subtotal + iva;
    return { subtotal, iva, total };
  }, [formData.items, variants, productos, ivas]);

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
    refreshInventarios();
    setFormData({
      clienteId: '',
      fechaVenta: new Date().toISOString().split('T')[0],
      metodoPago: 'Efectivo',
      observaciones: '',
      items: [],
      pedidoId: null
    });
    setUsarSaldoAFavor(false);
    setMetodoPagoRestante('Efectivo');
    resetItemSelection();
    setClienteSearchTerm('');
    setSelectedClienteNombre('');
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



  const filteredClientes = useMemo(() => {
    // Si el campo de búsqueda está vacío, mostrar todos los clientes
    if (!clienteSearchTerm.trim()) {
      return clientes;
    }
    // Si hay texto, filtrar por nombre o documento
    return clientes.filter((c: any) =>
      (c.nombre?.toLowerCase() ?? '').includes(clienteSearchTerm.toLowerCase()) ||
      (c.numeroDoc ?? '').includes(clienteSearchTerm)
    );
  }, [clientes, clienteSearchTerm]);

  const getTallasDisponibles = (): string[] =>
    tallas.map(t => t.name).filter(Boolean);

  const getColoresDisponibles = (): string[] =>
    colores.map(c => c.name).filter(Boolean);

  const getTallasDisponiblesCambio = (): string[] => {
    const prodId = Number(devolucionData.productoNuevoId);
    if (!prodId) return [];
    const productVariants = variants.filter(v => Number(v.product) === prodId);
    const sizesWithStock = productVariants
      .filter(v => getVariantStock(v.id_variant) > 0)
      .map(v => v.size_name);
    return Array.from(new Set(sizesWithStock)).filter(Boolean);
  };

  const getColoresDisponiblesCambio = (): string[] => {
    const prodId = Number(devolucionData.productoNuevoId);
    const tallaSel = devolucionData.productoNuevoTalla;
    if (!prodId || !tallaSel) return [];
    const productVariants = variants.filter(v => 
      Number(v.product) === prodId && 
      v.size_name === tallaSel
    );
    const colorsWithStock = productVariants
      .filter(v => getVariantStock(v.id_variant) > 0)
      .map(v => v.color_name);
    return Array.from(new Set(colorsWithStock)).filter(Boolean);
  };

  const getStockDisponibleCambio = (tallaValue: string, colorValue: string): number => {
    const prodId = Number(devolucionData.productoNuevoId);
    if (!prodId || !tallaValue || !colorValue) return 0;
    const variant = variants.find(v => 
      Number(v.product) === prodId && 
      v.size_name === tallaValue && 
      v.color_name === colorValue
    );
    return variant ? getVariantStock(variant.id_variant) : 0;
  };

  const resetItemSelection = () => {
    setSelectedProduct(null);
    setVariantSearch('');
    setItemTalla('');
    setItemColor('');
    setItemCantidad('1');
    setItemPrecioUnitario('');
  };

  const handleSelectProduct = async (product: any) => {
    const variantsData = variants.filter(v => Number(v.product) === Number(product.id));
    
    const primeraVariante = variantsData[0];
    const firstTalla = primeraVariante ? String(primeraVariante.size_name || '') : '';
    const firstColor = primeraVariante ? String(primeraVariante.color_name || '') : '';

    setSelectedProduct({
      ...product,
      variants: variantsData
    });
    setVariantSearch(product.nombre);
    setItemTalla(firstTalla);
    setItemColor(firstColor);
    setItemPrecioUnitario(String(product.precioVenta || 0));
    setShowVariantDrop(false);
  };

  // Helper: obtener stock actual para un item de venta (por talla/color si aplica)
  const getAvailableStockForItem = (ventaItem: ItemVenta) => {
    try {
      const prod = productos.find((p: any) => String(p.id) === String(ventaItem.productoId));
      if (!prod) return Number(ventaItem.cantidad || 0);

      // Variantes con colores que guardan cantidad
      if (Array.isArray(prod.variantes)) {
        const variante = prod.variantes.find((v: any) => String(v.talla) === String(ventaItem.talla));
        if (variante && Array.isArray(variante.colores)) {
          const colorObj = variante.colores.find((c: any) => String(c.color) === String(ventaItem.color) || String(c.nombre) === String(ventaItem.color));
          if (colorObj && (typeof colorObj.cantidad !== 'undefined')) return Number(colorObj.cantidad || 0);
        }
      }

      // Stock directo en el producto
      if (typeof prod.stock !== 'undefined') return Number(prod.stock || 0);
      if (typeof prod.cantidad !== 'undefined') return Number(prod.cantidad || 0);

      // Fallback: usar la cantidad vendida (no permitir más que lo comprado)
      return Number(ventaItem.cantidad || 0);
    } catch (err) {
      return Number(ventaItem.cantidad || 0);
    }
  };


  const agregarItem = () => {
    if (!selectedProduct || !itemTalla || !itemColor || !itemCantidad) {
      setNotificationMessage('Completa todos los campos del producto');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const vt = itemTalla.trim().toLowerCase();
    const vc = itemColor.trim().toLowerCase();

    const variant = selectedProduct.variants.find((v: any) => 
      String(v.size_name || '').trim().toLowerCase() === vt &&
      String(v.color_name || '').trim().toLowerCase() === vc
    );

    if (!variant) {
      setNotificationMessage('No se encontró la variante seleccionada');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const cantidad = parseInt(itemCantidad, 10);
    const precioUnitario = parseFloat(itemPrecioUnitario);
    const subtotal = cantidad * precioUnitario;

    const variantId = Number(variant.id_variant);
    const stockDisponible = getVariantStock(variantId);

    const cantidadPrevia = formData.items
      .filter(it => Number(it.productoId) === variantId)
      .reduce((sum, it) => sum + it.cantidad, 0);

    const cantidadTotalSolicitada = cantidadPrevia + cantidad;

    if (cantidadTotalSolicitada > stockDisponible) {
      setNotificationMessage(`No hay suficiente stock disponible para "${selectedProduct.nombre}" (Talla: ${itemTalla}, Color: ${itemColor}). Stock actual: ${stockDisponible} unidad(es). Ya has solicitado: ${cantidadPrevia} unidad(es).`);
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const item: ItemVenta = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      productoId: String(variant.id_variant),
      productoNombre: selectedProduct.nombre,
      talla: itemTalla,
      color: itemColor,
      cantidad,
      precioUnitario,
      subtotal
    };

    setFormData({ ...formData, items: [...formData.items, item] });
    resetItemSelection();
  };

  const eliminarItem = (itemId: string) => {
    setFormData({ ...formData, items: formData.items.filter(item => item.id !== itemId) });
  };

  const actualizarCantidadItem = (itemId: string, value: string) => {
    const parsed = parseInt(value, 10);
    const cantidad = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;

    const itemToUpdate = formData.items.find(it => it.id === itemId);
    if (!itemToUpdate) return;

    const variantId = Number(itemToUpdate.productoId);
    const stockDisponible = getVariantStock(variantId);

    // Sumar cantidad total de esta misma variante en otros ítems
    const cantidadOtrosItems = formData.items
      .filter(it => it.id !== itemId && Number(it.productoId) === variantId)
      .reduce((sum, it) => sum + it.cantidad, 0);

    const cantidadTotalSolicitada = cantidadOtrosItems + cantidad;

    if (cantidadTotalSolicitada > stockDisponible) {
      setNotificationMessage(`No hay suficiente stock disponible para "${itemToUpdate.productoNombre}" (Talla: ${itemToUpdate.talla}, Color: ${itemToUpdate.color}). Stock actual: ${stockDisponible} unidad(es).`);
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const precio = Number.isFinite(Number(item.precioUnitario)) ? Number(item.precioUnitario) : 0;
        return {
          ...item,
          cantidad,
          subtotal: cantidad * Math.max(precio, 0)
        };
      })
    }));
  };

  const actualizarPrecioItem = (itemId: string, value: string) => {
    const parsed = Number(value);
    const precioUnitario = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const cantidad = Number.isFinite(Number(item.cantidad)) && Number(item.cantidad) >= 1 ? Number(item.cantidad) : 1;
        return {
          ...item,
          precioUnitario,
          subtotal: cantidad * precioUnitario
        };
      })
    }));
  };

  const handleSave = async () => {
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

    // Validar Stock disponible antes de guardar (refrescar inventario primero)
    const latestInventory = await refreshInventarios();
    const inventoryToUse = latestInventory || inventarios;

    const getVariantStockHelper = (variantId: number, invs: any[]): number => {
      const inv = invs.find((i: any) => Number(i.variant ?? i.id_variant) === Number(variantId));
      if (inv) return Number(inv.stock ?? 0);
      return 0;
    };

    for (const item of formData.items) {
      const variantId = Number(item.productoId);
      const stockDisponible = getVariantStockHelper(variantId, inventoryToUse);
      const cantidadTotalSolicitada = formData.items
        .filter(it => Number(it.productoId) === variantId)
        .reduce((sum, it) => sum + it.cantidad, 0);

      if (cantidadTotalSolicitada > stockDisponible) {
        setNotificationMessage(`Stock insuficiente para el producto "${item.productoNombre}" (Talla: ${item.talla}, Color: ${item.color}). Stock disponible: ${stockDisponible} unidad(es).`);
        setNotificationType('error');
        setShowNotificationModal(true);
        return;
      }
    }

    const cliente = clientes.find((c: any) => c.id.toString() === formData.clienteId);
    if (!cliente) {
      setNotificationMessage('Cliente no encontrado');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const clienteSel = cliente;
    // Recalcular totales con el IVA real de cada producto
    const subtotal = formData.items.reduce((acc, current) => acc + (current.precioUnitario * current.cantidad), 0);
    const iva = formData.items.reduce((acc, current) => {
      const rate = getVariantIvaRate(current.productoId);
      return acc + (current.subtotal * rate);
    }, 0);
    const total = subtotal + iva;

    const saldoDisp = Number(clienteSel?.saldoAFavor || 0);
    const saldoUsado = usarSaldoAFavor ? Math.min(saldoDisp, total) : 0;
    const restante = Math.max(total - saldoUsado, 0);

    if (usarSaldoAFavor && restante > 0 && !metodoPagoRestante) {
      setNotificationMessage('Debes seleccionar el medio de pago del restante');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    try {
      setLoading(true);
      
      // Crear la venta en la API
      const saleDTO: CreateSaleDTO = {
        client: parseInt(formData.clienteId, 10),
        payment_method: 1, // ID del método de pago (ajustar según tu API)
        date_sale: formData.fechaVenta,
        order: formData.pedidoId ? Number(formData.pedidoId) : null,
        state: 1, // Estado: Completada
        observations: formData.observaciones,
        details: formData.items.map(item => ({
          variant: parseInt(item.productoId, 10),
          quantity: item.cantidad,
          unit_price: item.precioUnitario.toString(),
          subtotal: item.subtotal.toString()
        }))
      };

      const resultado = await createSale(saleDTO);
      
      if (resultado) {
        // Recargar ventas desde el API
        await loadVentas();

        // Actualizar saldo del cliente si se utilizó (actualización local)
        if (saldoUsado > 0) {
          const clientesActualizados = clientes.map((c: any) => {
            if (c.id.toString() === formData.clienteId.toString()) {
              return { ...c, saldoAFavor: Number(c.saldoAFavor || 0) - saldoUsado };
            }
            return c;
          });

          setClientes(clientesActualizados);
        }

        setShowModal(false);
        setFormData({
          clienteId: '',
          fechaVenta: new Date().toISOString().split('T')[0],
          metodoPago: 'Efectivo',
          observaciones: '',
          items: [],
          pedidoId: null
        });

        setNotificationMessage('Venta creada exitosamente');
        setNotificationType('success');
        setShowNotificationModal(true);
      } else {
        setNotificationMessage('Error al crear la venta');
        setNotificationType('error');
        setShowNotificationModal(true);
      }
    } catch (error) {
      console.error('Error al guardar venta:', error);
      setNotificationMessage('Error al crear la venta');
      setNotificationType('error');
      setShowNotificationModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAnular = async () => {
    if (!ventaToAnular || !motivoAnulacion.trim()) {
      setNotificationMessage('Debes ingresar un motivo de anulación');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    try {
      setLoading(true);
      const resultado = await annulSale(ventaToAnular.id, motivoAnulacion.trim());
      if (resultado) {
        // Recargar ventas desde la API
        await loadVentas();

        setShowAnularModal(false);
        setVentaToAnular(null);
        setMotivoAnulacion('');

        setNotificationMessage('Venta anulada exitosamente');
        setNotificationType('success');
        setShowNotificationModal(true);
      } else {
        setNotificationMessage('Error al anular la venta');
        setNotificationType('error');
        setShowNotificationModal(true);
      }
    } catch (error) {
      console.error('Error al anular venta:', error);
      setNotificationMessage('Error al anular la venta');
      setNotificationType('error');
      setShowNotificationModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.numeroDoc || !nuevoCliente.telefono) {
      setNotificationMessage('Completa los campos obligatorios');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    try {
      setLoading(true);

      const clienteDTO: CreateClientsDTO = {
        name: nuevoCliente.nombre,
        type_doc: nuevoCliente.tipoDoc === 'CC' ? 1 : nuevoCliente.tipoDoc === 'CE' ? 2 : 3,
        doc: nuevoCliente.numeroDoc,
        phone: nuevoCliente.telefono,
        email: nuevoCliente.email,
        address: nuevoCliente.direccion,
        city: ''
      };

      const clienteCreado = await createClients(clienteDTO);

      if (clienteCreado) {
        const clienteMapeado = {
          id: clienteCreado.id_client,
          nombre: clienteCreado.name,
          tipoDoc: clienteCreado.type_doc,
          numeroDoc: clienteCreado.doc,
          telefono: clienteCreado.phone,
          email: clienteCreado.email,
          direccion: clienteCreado.address,
          ciudad: clienteCreado.city,
          activo: clienteCreado.state,
          saldoAFavor: clienteCreado.saldoAFavor ?? (clienteCreado as any).saldo_a_favor ?? 0
        };

        setClientes([...clientes, clienteMapeado]);
        setFormData({ ...formData, clienteId: clienteMapeado.id.toString() });
        setClienteSearchTerm(clienteMapeado.nombre);
        setSelectedClienteNombre(clienteMapeado.nombre);
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
      } else {
        setNotificationMessage('Error al crear el cliente');
        setNotificationType('error');
        setShowNotificationModal(true);
      }
    } catch (error) {
      console.error('Error al crear cliente:', error);
      setNotificationMessage('Error al crear el cliente');
      setNotificationType('error');
      setShowNotificationModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearDevolucion = async () => {
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

    // Validación de cantidades
    for (const it of devolucionData.itemsDevueltos) {
      const itemOriginal = ventaToDevolver.items.find(i => i.id === it.itemId);
      if (!itemOriginal) continue;
      const maxDevolver = Math.max(0, Number(itemOriginal.cantidad || 0));
      if (it.cantidad > maxDevolver) {
        setNotificationMessage(`La cantidad a devolver para ${itemOriginal.productoNombre} no puede ser mayor a la cantidad vendida (${maxDevolver}).`);
        setNotificationType('error');
        setShowNotificationModal(true);
        return;
      }
      if (it.cantidad <= 0) {
        setNotificationMessage('La cantidad a devolver debe ser un número válido mayor a 0.');
        setNotificationType('error');
        setShowNotificationModal(true);
        return;
      }
    }

    const isChange = !!devolucionData.productoNuevoId;

    if (isChange) {
      if (!devolucionData.productoNuevoTalla || !devolucionData.productoNuevoColor) {
        setNotificationMessage('Debes seleccionar talla y color del producto nuevo');
        setNotificationType('error');
        setShowNotificationModal(true);
        return;
      }
      if ((devolucionData.productoNuevoCantidad || 0) <= 0) {
        setNotificationMessage('La cantidad a entregar del producto nuevo debe ser mayor a 0');
        setNotificationType('error');
        setShowNotificationModal(true);
        return;
      }
    }

    // Mapear detalles de la devolución (los items que se devuelven)
    const itemsMapeados = devolucionData.itemsDevueltos.map(itemDev => {
      const itemOriginal = ventaToDevolver.items.find(i => i.id === itemDev.itemId);
      if (!itemOriginal) return null;

      return {
        variant: parseInt(itemOriginal.productoId, 10),
        quantity: itemDev.cantidad,
        subtotal: itemDev.cantidad * itemOriginal.precioUnitario
      };
    }).filter(Boolean) as { variant: number; quantity: number; subtotal: number }[];

    const totalDevolucion = itemsMapeados.reduce((sum, item) => sum + item.subtotal, 0);
    const productoNuevo = isChange ? productos.find((p: any) => p.id.toString() === devolucionData.productoNuevoId) : null;
    const precioProductoNuevo = productoNuevo ? (productoNuevo.precioVenta || 0) * (devolucionData.productoNuevoCantidad || 0) : 0;
    const diferencia = precioProductoNuevo - totalDevolucion;

    const saldoAFavor = diferencia < 0 ? Math.abs(diferencia) : 0;
    const diferenciaPagar = diferencia > 0 ? diferencia : 0;

    if (isChange && diferenciaPagar > 0 && !devolucionData.medioPagoExcedente) {
      setNotificationMessage('Debes seleccionar el medio de pago del excedente');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    try {
      setLoading(true);
      let result;

      if (isChange) {
        // Buscar variant ID del producto nuevo para cambio
        const variantNueva = variants.find(v => 
          v.product === Number(devolucionData.productoNuevoId) &&
          v.size_name === devolucionData.productoNuevoTalla &&
          v.color_name === devolucionData.productoNuevoColor
        );
        if (!variantNueva) {
          setNotificationMessage('No se encontró la variante seleccionada del producto nuevo');
          setNotificationType('error');
          setShowNotificationModal(true);
          setLoading(false);
          return;
        }

        const stockDisponible = getVariantStock(variantNueva.id_variant);
        const cantidadEntregada = devolucionData.productoNuevoCantidad || 1;

        if (stockDisponible < cantidadEntregada) {
          setNotificationMessage(`El producto nuevo seleccionado no tiene suficiente stock disponible. Stock actual: ${stockDisponible} unidades.`);
          setNotificationType('error');
          setShowNotificationModal(true);
          setLoading(false);
          return;
        }

        // Crear listas planas de variantes devueltas y entregadas para emparejar
        const returnedVariantsFlat: number[] = [];
        itemsMapeados.forEach(i => {
          for (let q = 0; q < i.quantity; q++) {
            returnedVariantsFlat.push(i.variant);
          }
        });

        const deliveredVariantsFlat: number[] = [];
        for (let q = 0; q < cantidadEntregada; q++) {
          deliveredVariantsFlat.push(variantNueva.id_variant);
        }

        // Emparejar 1-a-1
        const pairCount = Math.min(returnedVariantsFlat.length, deliveredVariantsFlat.length);
        const changeDetails = [];
        for (let i = 0; i < pairCount; i++) {
          changeDetails.push({
            variant_returned: returnedVariantsFlat[i],
            variant_delivered: deliveredVariantsFlat[i]
          });
        }

        // Estructurar el DTO de cambio
        const dto: CreateChangeDTO = {
          sale: ventaToDevolver.id,
          reason_of_change: devolucionData.motivo,
          state: 2, // Pendiente
          details: changeDetails
        };

        result = await createChange(dto);

        // Si hay prendas devueltas sobrantes que no se emparejaron con prendas entregadas (sobra saldo/devolución pura)
        if (returnedVariantsFlat.length > pairCount && result) {
          const leftoversMap = new Map<number, number>();
          for (let i = pairCount; i < returnedVariantsFlat.length; i++) {
            const v = returnedVariantsFlat[i];
            leftoversMap.set(v, (leftoversMap.get(v) || 0) + 1);
          }

          const returnDetails = Array.from(leftoversMap.entries()).map(([variant, quantity]) => ({
            variant,
            quantity
          }));

          const dtoDevolucion: CreateReturnDTO = {
            sale: ventaToDevolver.id,
            reason: devolucionData.motivo,
            state: 2, // Pendiente
            details: returnDetails
          };

          await createReturn(dtoDevolucion);
        }
      } else {
        // Estructurar el DTO de devolución
        const dto: CreateReturnDTO = {
          sale: ventaToDevolver.id,
          reason: devolucionData.motivo,
          state: 2, // Pendiente
          details: itemsMapeados.map(i => ({
            variant: i.variant,
            quantity: i.quantity
          }))
        };

        result = await createReturn(dto);
      }

      if (result) {
        // Recargar ventas de la API
        await loadVentas();

        // Recargar clientes de la API para traer saldos actualizados
        const clientesAPI = await getAllClients();
        if (clientesAPI) {
          const clientesMapeados = clientesAPI.map((client: Clients) => ({
            id: client.id_client,
            nombre: client.name,
            tipoDoc: client.type_doc,
            numeroDoc: client.doc,
            telefono: client.phone,
            email: client.email,
            direccion: client.address,
            ciudad: client.city,
            activo: client.state,
            saldoAFavor: client.saldoAFavor ?? (client as any).saldo_a_favor ?? 0
          }));
          setClientes(clientesMapeados);
        }

        // Recargar inventarios de la API
        await refreshInventarios();

        // Notificar eventos de sincronización para otros paneles
        window.dispatchEvent(new Event('salesUpdated'));
        if (isChange) {
          window.dispatchEvent(new Event('cambioProcessed'));
        } else {
          window.dispatchEvent(new Event('devolucionProcessed'));
        }

        setShowDevolucionModal(false);
        setVentaToDevolver(null);
        setDevolucionData({
          motivo: 'Defectuoso',
          itemsDevueltos: [],
          productoNuevoId: '',
          productoNuevoTalla: '',
          productoNuevoColor: '',
          productoNuevoCantidad: 0,
          medioPagoExcedente: 'Efectivo'
        });

        let msg = isChange
          ? `Cambio registrado exitosamente en el servidor. `
          : `Devolución registrada exitosamente en el servidor. `;

        if (isChange) {
          if (saldoAFavor > 0) {
            msg += `Saldo a favor generado para el cliente: ${formatCOP(saldoAFavor)}.`;
          } else if (diferenciaPagar > 0) {
            msg += `Excedente pagado: ${formatCOP(diferenciaPagar)} (${devolucionData.medioPagoExcedente}).`;
          } else {
            msg += `Cambio exacto (sin saldo ni excedente).`;
          }
        } else {
          msg += `Saldo a favor generado para el cliente: ${formatCOP(totalDevolucion)}.`;
        }

        setNotificationMessage(msg);
        setNotificationType('success');
        setShowNotificationModal(true);
      } else {
        setNotificationMessage('El servidor rechazó el registro de la operación. Revisa los datos.');
        setNotificationType('error');
        setShowNotificationModal(true);
      }
    } catch (error: any) {
      console.error('Error al registrar devolución/cambio:', error);
      setNotificationMessage('Error al intentar registrar la operación en el servidor.');
      setNotificationType('error');
      setShowNotificationModal(true);
    } finally {
      setLoading(false);
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

  const descargarComprobante = (venta: Venta) => {
    // Generar PDF del comprobante usando jsPDF
    const doc = new jsPDF();
    const left = 14;
    let y = 16;
    const lineHeight = 7;

    const push = (text: string, opts?: any) => {
      const lines = doc.splitTextToSize(text, 180);
      doc.text(lines, left, y);
      y += lines.length * lineHeight;
      if (y > 280) { doc.addPage(); y = 16; }
    };

    push('COMPROBANTE DE VENTA');
    y += 2;
    push(`Número: ${venta.numeroVenta}`);
    push(`Fecha: ${new Date(venta.fechaVenta).toLocaleDateString()}`);
    push(`Cliente: ${venta.clienteNombre}`);
    push(`Estado: ${venta.estado}`);
    y += 4;
    push('PRODUCTOS:');
    venta.items.forEach((item) => {
      push(`${item.productoNombre}`);
      push(`Talla: ${item.talla} | Color: ${item.color}`);
      push(`Cantidad: ${item.cantidad} x ${formatCOP(item.precioUnitario)}  Subtotal: ${formatCOP(item.subtotal)}`);
      y += 2;
    });
    y += 2;
    push('TOTALES:');
    push(`Subtotal: ${formatCOP(venta.subtotal)}`);
    push(`IVA: ${formatCOP(venta.iva)}`);
    push(`TOTAL: ${formatCOP(venta.total)}`);
    y += 2;
    push(`Método de Pago: ${venta.metodoPago}`);
    if (venta.observaciones) push(`Observaciones: ${venta.observaciones}`);
    if (venta.anulada) push(`*** VENTA ANULADA *** Motivo: ${venta.motivoAnulacion || ''}`);

    // Guardar PDF
    try {
      doc.save(`${venta.numeroVenta}.pdf`);
    } catch (err) {
      console.error('Error generando PDF', err);
      setNotificationMessage('Error al generar el PDF');
      setNotificationType('error');
      setShowNotificationModal(true);
    }
  };

  
  const descargarTodasEnExcel = async () => {
    if (ventas.length === 0) {
      setNotificationMessage('No hay ventas para descargar');
      setNotificationType('info');
      setShowNotificationModal(true);
      return;
    }

    try {
      setLoading(true);
      await exportSales();
      setNotificationMessage('Ventas descargadas exitosamente');
      setNotificationType('success');
      setShowNotificationModal(true);
    } catch (error) {
      console.error('Error al descargar ventas:', error);
      setNotificationMessage('Error al descargar las ventas');
      setNotificationType('error');
      setShowNotificationModal(true);
    } finally {
      setLoading(false);
    }
  };


  const filteredVentas = ventas.filter(v => {
    const searchLower = searchTerm.toLowerCase();
    const matchNumero = (v.numeroVenta?.toLowerCase() ?? '').includes(searchLower);
    const matchCliente = (v.clienteNombre?.toLowerCase() ?? '').includes(searchLower);
    const matchEstado = (v.estado?.toLowerCase() ?? '').includes(searchLower);
    const matchFecha = new Date(v.fechaVenta).toLocaleDateString().includes(searchTerm);
    const matchTotal = v.total.toString().includes(searchTerm);
    // Defensive: pedido_id puede ser number o null; convertir a string antes de toLowerCase
    const pedidoIdStr = v.pedido_id != null ? String(v.pedido_id).toLowerCase() : '';
    const matchPedidoId = pedidoIdStr.includes(searchLower);
    const matchProductos = v.items.some(item => (item.productoNombre?.toLowerCase() ?? '').includes(searchLower));
    return matchNumero || matchCliente || matchEstado || matchFecha || matchTotal || matchPedidoId || matchProductos;
  });

  // Leer devoluciones para saber qué ventas ya tienen una devolución
  const devolucionesStored = JSON.parse(localStorage.getItem(DEVOLUCIONES_KEY) || '[]');

  // Totales calculados vía useMemo (totals)

  const clienteSeleccionado = clientes.find(
    (c: any) => c.id?.toString() === formData.clienteId?.toString()
  );

  const saldoDisponible = Number(clienteSeleccionado?.saldoAFavor || 0);
  const totalVenta = Number(totals.total || 0);

  const saldoAplicado = usarSaldoAFavor ? Math.min(saldoDisponible, totalVenta) : 0;
  const restantePorPagar = Math.max(totalVenta - saldoAplicado, 0);

  // PAGINACIÓN: mostrar 5 ventas por página (useMemo + useState)
const ITEMS_PER_PAGE = 5;
const [currentPage, setCurrentPage] = useState(1);

const totalPages = Math.ceil(filteredVentas.length / ITEMS_PER_PAGE);

const paginatedVentas = useMemo(() => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  return filteredVentas.slice(start, end);
}, [filteredVentas, currentPage]);


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
          {hasPermission('ventas', 'create') && (
            <Button onClick={handleCreate} variant="primary">
              <Plus size={20} />
               Registrar Venta
            </Button>
          )}
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
                <th className="text-left py-4 px-6 text-gray-600">Pedido de Origen</th>
                <th className="text-left py-4 px-6 text-gray-600">Cliente</th>
                <th className="text-left py-4 px-6 text-gray-600">Fecha</th>
                <th className="text-right py-4 px-6 text-gray-600">Total</th>
                <th className="text-center py-4 px-6 text-gray-600">Estado</th>
                <th className="text-right py-4 px-6 text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVentas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <ShoppingBag className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron ventas</p>
                  </td>
                </tr>
              )}

              {paginatedVentas.map((venta) => {
                const hasDevolucion = devolucionesStored && Array.isArray(devolucionesStored)
                  ? devolucionesStored.some((d: any) => String(d.ventaId) === String(venta.id) || String(d.numeroVenta) === String(venta.numeroVenta))
                  : false;
                const displayEstado = hasDevolucion ? 'Devuelta' : venta.estado;

                return (
                  <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="text-gray-900 font-medium">{venta.numeroVenta}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {venta.number_pedido && venta.number_pedido.trim() ? (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                          {venta.number_pedido}
                        </span>
                      ) : (
                        <span className="text-gray-600">Venta Directa</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {venta.pedido?.client?.name
                        || venta.pedido?.user?.username
                        || venta.pedido?.user?.email
                        || venta.user?.username
                        || venta.user?.email
                        || venta.clienteNombre
                        || 'Consumidor Final'}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {new Date(venta.fechaVenta).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right text-gray-900 font-semibold">
                      {formatCOP(venta.total)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm ${
                          displayEstado === 'Completada'
                            ? 'bg-green-100 text-green-700'
                            : (displayEstado === 'Devuelta' || displayEstado === 'Devolución')
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {displayEstado}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setViewingVenta(venta); setShowDetailModal(true); }}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
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
                        <button
                          onClick={() => {
                            setVentaToAnular(venta);
                            setMotivoAnulacion('');
                            setShowAnularModal(true);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                          title="Anular"
                          disabled={venta.estado === 'Anulada' || venta.estado === 'Devolución' || !hasPermission('ventas', 'delete')}
                        >
                          <Ban size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setVentaToDevolver(venta);
                            setDevolucionData({
                              motivo: 'Defectuoso',
                              itemsDevueltos: [],
                              productoNuevoId: '',
                              productoNuevoTalla: '',
                              productoNuevoColor: '',
                              productoNuevoCantidad: 0,
                              medioPagoExcedente: 'Efectivo',
                            });
                            setShowDevolucionModal(true);
                          }}
                          className="p-2 hover:bg-purple-50 rounded-lg transition-colors text-purple-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                          title="Generar devolución"
                          disabled={hasDevolucion || venta.estado === 'Anulada' || !hasPermission('devoluciones', 'create')}
                        >
                          <RotateCcw size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginador */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
          {/* Texto informativo */}
          <span className="text-sm text-gray-500">
            {`Mostrando ${Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredVentas.length || 0)} a ${Math.min(currentPage * ITEMS_PER_PAGE, filteredVentas.length)} de ${filteredVentas.length} ventas`}
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

      {/* Modal Crear Venta */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva Venta"
        size="xxl"
        noScroll
      >
        {/* CORRECCIÓN: Cambiad de grid a flex flex-col para mejor control del layout */}
        {/* flex flex-col mantiene: header fijo → body con scroll → footer sticky */}
        <div className="w-[95vw] max-w-[1400px] max-h-[90vh] pr-0.5 text-[10px] leading-tight overflow-hidden mx-auto flex flex-col">
          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECCIÓN 1: DATOS DE VENTA Y CLIENTE (HEADER FIJO) */}
          {/* CORRECCIÓN: Sin flex-1, ocupa solo el espacio necesario */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="border border-gray-200 rounded-md bg-white p-2 shrink-0 relative z-10">
              {/* Contenedor centrado con max-width para inputs */}
              <div className="max-w-5xl mx-auto">
              
              {/* Fila 1: Número, Fecha y Botón crear cliente */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 mb-2">
                <div className="lg:col-span-1">
                  <label className="block text-[10px] text-gray-500 mb-1">Número de venta</label>
                  <Input value={generarNumeroVenta()} readOnly disabled className="h-6 px-2 text-[10px] bg-gray-50 w-full" />
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-[10px] text-gray-500 mb-1">Fecha de creación</label>
                  <Input value={formData.fechaVenta} readOnly disabled className="h-6 px-2 text[10px] bg-gray-50 w-full" />
                </div>
                <div className="lg:col-span-2 flex items-end">
                  <Button onClick={() => setShowClienteModal(true)} variant="secondary" className="w-full h-6 px-2 text-[10px]">
                    <UserPlus size={14} />
                    Crear cliente
                  </Button>
                </div>
              </div>

              {/* Fila 2: Búsqueda de cliente */}
              <div>
                <label className="block text-gray-700 mb-1 text-[10px]">Cliente *</label>
                <div className="relative text-[10px]">
                  <Input
                    value={clienteSearchTerm}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClienteSearchTerm(val);
                      setShowClienteDropdown(true);
                      setFormData((prev) => {
                        const textoSigueIgual = val.trim() === selectedClienteNombre.trim();
                        return textoSigueIgual ? prev : { ...prev, clienteId: '' };
                      });
                      if (val.trim() !== selectedClienteNombre.trim()) {
                        setSelectedClienteNombre('');
                        setUsarSaldoAFavor(false);
                        setMetodoPagoRestante('Efectivo');
                      }
                    }}
                    onFocus={() => setShowClienteDropdown(true)}
                    placeholder="Buscar cliente por nombre o documento..."
                    className={`h-6 px-2 text-[10px] leading-tight w-full ${formErrors.clienteId ? 'border-red-500' : ''}`}
                  />
                  {showClienteDropdown && filteredClientes.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-md max-h-40 overflow-y-auto">
                      {filteredClientes.map((c: any) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCliente(c.id.toString(), c.nombre)}
                          className="w-full text-left px-2 py-1 hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-[10px] text-gray-900">{c.nombre}</div>
                          <div className="text-[10px] text-gray-600">{c.numeroDoc} - {c.telefono}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {formErrors.clienteId && <p className="text-red-600 text-xs mt-1">{formErrors.clienteId}</p>}
              </div>

              {/* Fila 3: Resumen de cliente */}
              {clienteSeleccionado && (
                <div className="mt-2 border border-gray-200 rounded-md p-2 bg-gray-50 grid grid-cols-2 lg:grid-cols-4 gap-2 text-[10px] leading-tight">
                  <div><span className="text-gray-500">Nombre:</span><div className="text-gray-900 font-medium truncate">{clienteSeleccionado.nombre || '-'}</div></div>
                  <div><span className="text-gray-500">Documento:</span><div className="text-gray-900 font-medium">{clienteSeleccionado.numeroDoc || '-'}</div></div>
                  <div><span className="text-gray-500">Teléfono:</span><div className="text-gray-900 font-medium">{clienteSeleccionado.telefono || '-'}</div></div>
                  <div><span className="text-gray-500">Ciudad:</span><div className="text-gray-900 font-medium">{clienteSeleccionado.ciudad || clienteSeleccionado.direccion || '-'}</div></div>
                </div>
              )}
              </div>
              {/* Cierre del contenedor centrado max-width */}
            </div>
            {/* Cierre del header border */}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECCIÓN 2: CONTENIDO CON SCROLL */}
          {/* CORRECCIÓN: flex-1 overflow-y-auto para expansión + scroll vertical */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="flex-1 overflow-y-auto space-y-2 pb-2 min-h-0">
            {/* Sección: Método de Pago y Productos */}
            {/* CORRECCIÓN: Removido flex-1 flex flex-col, solo space de separación */}
            <div className="border border-gray-200 rounded-md bg-white p-2">
              {/* Contenedor centrado con max-width */}
              <div className="max-w-5xl mx-auto">
              
              {/* Fila 1: Método de Pago */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
                <div className="lg:col-span-1">
                  <label className="block text-gray-700 mb-1 text-[10px]">Método de Pago *</label>
                  {(!usarSaldoAFavor || saldoAplicado <= 0) && (
                    <select
                      value={formData.metodoPago}
                      onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                      className="w-full h-6 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-[10px]"
                      required
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Nequi">Nequi</option>
                      <option value="Daviplata">Daviplata</option>
                    </select>
                  )}
                </div>
                {usarSaldoAFavor && restantePorPagar > 0 && (
                  <div className="lg:col-span-1">
                    <label className="block text-gray-700 mb-1 text-[10px]">Medio de pago restante *</label>
                    <select
                      value={metodoPagoRestante}
                      onChange={(e) => setMetodoPagoRestante(e.target.value as MedioPago)}
                      className="w-full h-6 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-[10px]"
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

              {/* Fila 2: Saldo a favor */}
              {saldoDisponible > 0 && formData.clienteId && (
                <div className="mb-2 rounded-md border border-green-300 bg-green-50 p-2">
                  <div className="text-green-800 text-[10px] font-semibold">✅ Este cliente tiene saldo a favor: {formatCOP(saldoDisponible)}</div>
                  <label className="mt-2 flex items-center gap-2 text-[10px] text-green-900">
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
                    <div className="mt-2 text-[10px] text-green-900 space-y-0.5">
                      <div>Saldo aplicado: <b>{formatCOP(saldoAplicado)}</b></div>
                      <div>Restante por pagar: <b>{formatCOP(restantePorPagar)}</b></div>
                    </div>
                  )}
                </div>
              )}

              {/* Fila 3: Agregar Productos - Diseño de PedidosManager */}
              <div className="bg-gray-50 rounded-md p-3 mb-2 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Selector de Producto (Buscable) */}
                  <div className="relative">
                    <label className="block text-[10px] text-gray-500 mb-1">Producto</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                      <Input
                        placeholder="Buscar producto..."
                        value={variantSearch}
                        onChange={(e) => {
                          setVariantSearch(e.target.value);
                          setShowVariantDrop(true);
                          setSelectedProduct(null);
                        }}
                        onFocus={() => setShowVariantDrop(true)}
                        className="h-7 pl-7 text-[10px]"
                      />
                    </div>
                    {showVariantDrop && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {productos
                          .filter(p => !variantSearch || p.nombre.toLowerCase().includes(variantSearch.toLowerCase()))
                          .map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectProduct(p)}
                              className="w-full text-left px-2 py-1.5 hover:bg-gray-50 text-[10px] border-b border-gray-100 last:border-0"
                            >
                              <div className="font-medium text-gray-900">{p.nombre}</div>
                              <div className="text-gray-500">{formatCOP(Number(p.precioVenta))}</div>
                            </button>
                          ))
                        }
                      </div>
                    )}
                  </div>

                  {/* Talla */}
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Talla</label>
                    <select
                      value={itemTalla}
                      onChange={(e) => setItemTalla(e.target.value)}
                      className="w-full h-7 px-2 border border-gray-300 rounded-md text-[10px] focus:outline-none focus:ring-1 focus:ring-gray-400"
                    >
                      <option value="">Seleccionar Talla</option>
                      {getTallasDisponibles().map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Color</label>
                    <select
                      value={itemColor}
                      onChange={(e) => setItemColor(e.target.value)}
                      className="w-full h-7 px-2 border border-gray-300 rounded-md text-[10px] focus:outline-none focus:ring-1 focus:ring-gray-400"
                    >
                      <option value="">Seleccionar Color</option>
                      {getColoresDisponibles().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Cantidad y Agregar */}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] text-gray-500 mb-1">Cant.</label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setItemCantidad(prev => String(Math.max(1, parseInt(prev) - 1)))}
                          className="h-7 px-2 border border-r-0 border-gray-300 rounded-l-md hover:bg-gray-50"
                        >
                          -
                        </button>
                        <Input
                          type="number"
                          value={itemCantidad}
                          onChange={(e) => setItemCantidad(e.target.value)}
                          className="h-7 px-2 text-[10px] text-center border-gray-300 rounded-none w-full"
                        />
                        <button
                          type="button"
                          onClick={() => setItemCantidad(prev => String(parseInt(prev) + 1))}
                          className="h-7 px-2 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <Button onClick={agregarItem} variant="secondary" className="h-7 px-3 text-[10px]">
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabla de productos */}
              {/* CORRECCIÓN: Removido flex-1, la tabla ocupa el espacio necesario en scroll */}
              </div>
              {/* Cierre del contenedor centrado max-width */}
              
              <div className="border border-gray-200 rounded-md overflow-x-auto mt-2">
                <table className="w-full text-[10px] leading-tight">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-2 py-1.5 font-semibold text-gray-700 whitespace-nowrap">Num</th>
                      <th className="text-left px-2 py-1.5 font-semibold text-gray-700 whitespace-nowrap">Producto</th>
                      <th className="text-left px-2 py-1.5 font-semibold text-gray-700 whitespace-nowrap">Talla</th>
                      <th className="text-left px-2 py-1.5 font-semibold text-gray-700 whitespace-nowrap">Color</th>
                      <th className="text-right px-2 py-1.5 font-semibold text-gray-700 tabular-nums whitespace-nowrap">Unitario</th>
                      <th className="text-right px-2 py-1.5 font-semibold text-gray-700 tabular-nums whitespace-nowrap">Cant.</th>
                      <th className="text-right px-2 py-1.5 font-semibold text-gray-700 tabular-nums whitespace-nowrap">Total</th>
                      <th className="text-center px-2 py-1.5 font-semibold text-gray-700 whitespace-nowrap">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-2 py-2 text-center text-gray-500">No hay productos agregados</td>
                      </tr>
                    ) : (
                      formData.items.map((item, index) => (
                        <tr key={item.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                          <td className="px-2 py-1.5 text-gray-700">{index + 1}</td>
                          <td className="px-2 py-1.5 text-gray-900 font-medium truncate max-w-xs">{item.productoNombre}</td>
                          <td className="px-2 py-1.5 text-gray-700">{item.talla}</td>
                          <td className="px-2 py-1.5 text-gray-700">{item.color}</td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={Number.isFinite(Number(item.precioUnitario)) ? item.precioUnitario : 0}
                              onChange={(e) => actualizarPrecioItem(item.id, e.target.value)}
                              className="h-6 px-1.5 text-[10px] text-right tabular-nums w-16"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={Number.isFinite(Number(item.cantidad)) ? item.cantidad : 1}
                              onChange={(e) => actualizarCantidadItem(item.id, e.target.value)}
                              className="h-6 px-1.5 text-[10px] text-right tabular-nums w-12"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-gray-900 whitespace-nowrap">
                            {formatCOP(((Number(item.precioUnitario) >= 0 ? Number(item.precioUnitario) : 0) * (Number(item.cantidad) >= 1 ? Number(item.cantidad) : 1)))}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button
                              onClick={() => eliminarItem(item.id)}
                              className="text-red-600 hover:bg-red-50 p-1.5 rounded inline-flex items-center justify-center"
                              title="Eliminar fila"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECCIÓN 3: TOTALES Y BOTONES (STICKY) */}
          {/* CORRECCIÓN: Añadido shrink-0 para que no se comprima en flex col */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="sticky bottom-0 bg-white/95 border-t border-gray-200 pt-2 mt-0 shrink-0">
            {/* Contenedor centrado con max-width */}
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 items-end">
                 <div className="lg:col-span-2 rounded-md bg-gray-50 border border-gray-200 p-2">
                  <div className="flex justify-between text-gray-600 text-[10px]">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-medium">{formatCOP(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-[10px] mt-1">
                    <span>IVA (19%)</span>
                    <span className="tabular-nums font-medium">{formatCOP(totals.iva)}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 text-[11px] font-semibold mt-2 pt-2 border-t border-gray-200">
                    <span>Total a pagar</span>
                    <span className="tabular-nums">{formatCOP(totals.total)}</span>
                  </div>
                </div>
                <div className="lg:col-span-2 flex gap-2 justify-end">
                  <Button onClick={() => setShowModal(false)} variant="secondary" className="h-6 px-3 text-[10px]">Cancelar</Button>
                  <Button onClick={handleSave} variant="primary" className="h-6 px-3 text-[10px]">Crear Venta</Button>
                </div>
              </div>
            </div>
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
          <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-2">
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
                      {formatCOP(saldo)}
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
                {viewingVenta.items.map((item) => {
                  const details = getVariantDetails(item.productoId);
                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-gray-900 font-medium">{details.nombre || item.productoNombre}</div>
                          <div className="text-sm text-gray-600">
                            Talla: {details.talla || item.talla} | Color: {details.color || item.color}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.cantidad} x {formatCOP(item.precioUnitario)}
                          </div>
                        </div>
                        <div className="text-gray-900 font-semibold">{formatCOP(item.subtotal)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span>{formatCOP(viewingVenta.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>IVA:</span>
                <span>{formatCOP(viewingVenta.iva)}</span>
              </div>
              <div className="flex justify-between text-gray-900 text-lg font-semibold pt-2 border-t border-gray-300">
                <span>Total:</span>
                <span>{formatCOP(viewingVenta.total)}</span>
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
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                rows={2}
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
            const precioProductoNuevo = productoNuevo ? (productoNuevo.precioVenta || 0) * (devolucionData.productoNuevoCantidad || 0) : 0;

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
                      {ventaToDevolver.pedido?.client?.name ||
                       ventaToDevolver.pedido?.user?.username ||
                       ventaToDevolver.pedido?.user?.email ||
                       ventaToDevolver.user?.username ||
                       ventaToDevolver.user?.email ||
                       ventaToDevolver.clienteNombre ||
                       'Consumidor Final'}
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
                  <label className="block text-gray-700 mb-1.5 text-sm">Motivo de Devolución *</label>
                  <select
                    value={devolucionData.motivo}
                    onChange={(e) =>
                      setDevolucionData({
                        ...devolucionData,
                        motivo: e.target.value as MotivoDevolucion
                      })
                    }
                    className="w-full h-8 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-xs"
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
                      const details = getVariantDetails(item.productoId);

                      return (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="text-gray-900 font-medium">{details.nombre || item.productoNombre}</div>
                              <div className="text-sm text-gray-600">
                                Talla: {details.talla || item.talla} | Color: {details.color || item.color}
                              </div>
                              <div className="text-sm text-gray-600">
                                Precio: {formatCOP(item.precioUnitario)}
                              </div>
                            </div>
                            <div className="text-gray-900 font-semibold">
                              {formatCOP(item.subtotal)}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-2">
                            <label className="text-sm text-gray-700">Cantidad a devolver:</label>
                            <input
                              type="number"
                              min="0"
                              max={Math.max(0, Number(item.cantidad || 0))}
                              value={cantidadDevuelta}
                              onChange={(e) => {
                                const parsed = parseInt(e.target.value, 10) || 0;
                                const maxAllowed = Math.max(0, Number(item.cantidad || 0));
                                const clamped = Math.min(parsed, maxAllowed);
                                handleToggleItemDevolucion(item.id, clamped);
                              }}
                              className="w-16 h-8 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-xs"
                            />
                            <span className="text-sm text-gray-600">de {item.cantidad}</span>
                            {cantidadDevuelta > 0 && (
                              <span className="ml-auto text-sm text-green-600 font-medium">
                                Devolución: {formatCOP(cantidadDevuelta * item.precioUnitario)}
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
                    Producto por el que se cambia (Opcional - Dejar vacío para devolución pura)
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-700 mb-1.5 text-sm">Producto nuevo</label>
                      <select
                        value={devolucionData.productoNuevoId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setDevolucionData({
                            ...devolucionData,
                            productoNuevoId: id,
                            productoNuevoTalla: '',
                            productoNuevoColor: '',
                            productoNuevoCantidad: 0,
                          });
                        }}
                        className="w-full h-8 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-xs"
                      >
                        <option value="">Seleccionar producto...</option>
                        {productos
                          .filter((p: any) => p.activo)
                          .map((p: any) => (
                             <option key={p.id} value={p.id}>
                               {p.nombre} - {formatCOP(p.precioVenta || 0)}
                             </option>
                          ))}
                      </select>
                    </div>

                    {productoNuevo && (
                      <>
                        {getTallasDisponiblesCambio().length === 0 && (
                          <div className="text-red-600 text-xs">
                            ⚠️ Este producto no tiene variantes con stock disponible
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-gray-700 mb-1 text-sm">Talla</label>
                            <select
                              value={devolucionData.productoNuevoTalla}
                              onChange={(e) =>
                                setDevolucionData({
                                  ...devolucionData,
                                  productoNuevoTalla: e.target.value,
                                  productoNuevoColor: '',
                                  productoNuevoCantidad: 0
                                })
                              }
                              disabled={getTallasDisponiblesCambio().length === 0}
                              className="w-full h-8 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">Seleccionar...</option>
                              {getTallasDisponiblesCambio().map((t: string) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-gray-700 mb-1 text-sm">Color</label>
                            <select
                              value={devolucionData.productoNuevoColor}
                              onChange={(e) => {
                                const newColor = e.target.value;
                                const stockVal = getStockDisponibleCambio(devolucionData.productoNuevoTalla, newColor);
                                const initialQty = stockVal > 0 ? 1 : 0;
                                setDevolucionData({
                                  ...devolucionData,
                                  productoNuevoColor: newColor,
                                  productoNuevoCantidad: initialQty
                                });
                              }}
                              className="w-full h-8 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                              disabled={!devolucionData.productoNuevoTalla || getColoresDisponiblesCambio().length === 0}
                            >
                              <option value="">Seleccionar...</option>
                              {getColoresDisponiblesCambio().map((c: string) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-gray-700 mb-1 text-sm">Cantidad</label>
                            <input
                              type="number"
                              min="0"
                              max={devolucionData.productoNuevoTalla && devolucionData.productoNuevoColor ? getStockDisponibleCambio(devolucionData.productoNuevoTalla, devolucionData.productoNuevoColor) : undefined}
                              value={devolucionData.productoNuevoCantidad}
                              onChange={(e) => {
                                const enteredVal = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                let val = Math.max(0, enteredVal);
                                if (devolucionData.productoNuevoTalla && devolucionData.productoNuevoColor) {
                                  const stockVal = getStockDisponibleCambio(devolucionData.productoNuevoTalla, devolucionData.productoNuevoColor);
                                  val = Math.min(stockVal, val);
                                }
                                setDevolucionData({
                                  ...devolucionData,
                                  productoNuevoCantidad: val
                                });
                              }}
                              className="w-full h-8 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-xs"
                            />
                          </div>
                        </div>

                        {devolucionData.productoNuevoTalla && devolucionData.productoNuevoColor && (
                          (() => {
                            const stockVal = getStockDisponibleCambio(devolucionData.productoNuevoTalla, devolucionData.productoNuevoColor);
                            return (
                              <div className={`text-xs font-medium ${stockVal > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stockVal > 0 ? `✓ Stock disponible: ${stockVal} unidades` : '⚠️ Sin stock disponible'}
                              </div>
                            );
                          })()
                        )}
                      </>
                    )}
                  </div>
                </div>

                {totalDevuelto > 0 && devolucionData.productoNuevoId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <div className="font-semibold text-blue-900">Balance del cambio</div>

                    <div className="flex justify-between text-sm text-blue-800">
                      <span>Total devuelto:</span>
                      <span className="font-medium">{formatCOP(totalDevuelto)}</span>
                    </div>

                    <div className="flex justify-between text-sm text-blue-800">
                      <span>Producto nuevo:</span>
                      <span className="font-medium">{formatCOP(precioProductoNuevo)}</span>
                    </div>

                    {saldoAFavorCalc > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-700">Saldo a favor:</span>
                        <span className="font-semibold text-green-700">
                          {formatCOP(saldoAFavorCalc)}
                        </span>
                      </div>
                    )}

                    {excedenteCalc > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-red-700">Excedente por pagar:</span>
                          <span className="font-semibold text-red-700">
                            {formatCOP(excedenteCalc)}
                          </span>
                        </div>

                        <div>
                          <label className="block text-gray-700 mb-1 text-sm">
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
                            className="w-full h-8 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-xs"
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
                  {
                    (() => {
                      const isChange = !!devolucionData.productoNuevoId;
                      const isFormInvalid = isChange && (!devolucionData.productoNuevoTalla || !devolucionData.productoNuevoColor);
                      const isAlreadyReturned = ventaToDevolver ? (ventaToDevolver.estado === 'Devolución' || ventaToDevolver.estado === 'Anulada') : false;
                      return (
                        <Button
                          onClick={handleCrearDevolucion}
                          variant="primary"
                          className={isChange ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700"}
                          disabled={isAlreadyReturned || isFormInvalid}
                        >
                          {isChange ? "Generar Cambio" : "Generar Devolución"}
                        </Button>
                      );
                    })()
                  }
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
        <div className="space-y-3">
          <div>
            <label className="block text-gray-700 mb-2">Nombre *</label>
            <Input
              value={nuevoCliente.nombre}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
              placeholder="Nombre completo"
              className="h-8 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-700 mb-2">Tipo Doc *</label>
              <select
                value={nuevoCliente.tipoDoc}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipoDoc: e.target.value })}
                className="w-full h-8 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-xs"
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
                className="h-8 text-xs"
                required
              />
              {clienteErrors.numeroDoc && (
                <p className="text-red-600 text-xs mt-1">{clienteErrors.numeroDoc}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-700 mb-2">Teléfono *</label>
              <Input
                value={nuevoCliente.telefono}
                onChange={(e) => handleClienteFieldChange('telefono', e.target.value)}
                placeholder="3001234567"
                className="h-8 text-xs"
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
                className="h-8 text-xs"
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
              className="h-8 text-xs"
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

