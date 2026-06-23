import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  Eye,
  Ban,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { Input, Modal } from '../../../shared/components/native';
import { 
  getAllReturns, createReturn, deleteReturn, getReturnMetrics, Return, CreateReturnDTO, getReturnById, exportAllReturns, annulReturn 
} from '../services/ReturnServices';
import { 
  getAllChanges, createChange, deleteChange, getChangeMetrics, Change, CreateChangeDTO, getChangeById 
} from '../services/ChangeServices';
import { getAllSales, Sale as SaleAPI } from '../../ecommerce/sales/services/SalesServices';
import { getAllVariants, VariantProduct } from '@/features/purchases/services/PurchasesService';
import { formatCOP } from '@/features/dashboard/utils/dashboardHelpers';

const STORAGE_KEY = 'damabella_devoluciones'; // Deprecated for display, kept for safety
const VENTAS_KEY = 'damabella_ventas';
const PRODUCTOS_KEY = 'damabella_productos';


interface ItemDevolucion {
  id: string;
  variantId?: number;
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
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalCount: 0,
    totalAmount: 0,
    pending: 0,
    completed: 0
  });

  const [ventas, setVentas] = useState([]);
  const [variants, setVariants] = useState<VariantProduct[]>([]);

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
  const [confirmAction, setConfirmAction] = useState<{ run: () => void } | null>(null);
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

  // ✅ Helpers (re-añadidos)
  const getVariantDetails = (variantId: string | number) => {
    const vId = Number(variantId);
    const variant = variants.find(v => v.id_variant === vId);
    return {
      nombre: variant?.product_name || `Ref: ${variant?.sku || variantId}`,
      talla: variant?.size_name || '',
      color: variant?.color_name || ''
    };
  };

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
      if (cantidad <= 0) return prev.filter((i) => i.itemId !== itemId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { itemId, cantidad };
        return copy;
      }
      return [...prev, { itemId, cantidad }];
    });
  };

  // ── MAPPING HELPERS ────────────────────────────────────────────────────────
  const mapApiReturnToLocal = (ret: Return): Devolucion => ({
    id: ret.id_return,
    numeroDevolucion: ret.return_number,
    ventaId: ret.sale,
    numeroVenta: ret.sale_number || `V-${ret.sale}`,
    clienteNombre: ret.client_name || 'Desconocido',
    fechaDevolucion: ret.created_at,
    motivo: ret.reason_of_return as any,
    items: (ret.details || []).map(d => ({
      id: String(d.id_detail),
      variantId: d.variant,
      productoNombre: d.variant_name || `ID: ${d.variant}`,
      talla: '',
      color: '',
      cantidad: d.quantity,
      precioUnitario: parseFloat(d.unit_price),
      subtotal: parseFloat(d.subtotal)
    })),
    total: (ret.details || []).reduce((acc, d) => acc + parseFloat(d.subtotal), 0),
    createdAt: ret.created_at,
    estadoGestion: ret.state ? 'Anulado' : 'Activo'
  });

  const mapApiChangeToLocal = (ch: Change): Devolucion => ({
    id: ch.id_change,
    numeroDevolucion: ch.change_number,
    ventaId: ch.sale,
    numeroVenta: ch.sale_number || `V-${ch.sale}`,
    clienteNombre: ch.client_name || 'Desconocido',
    fechaDevolucion: ch.created_at,
    motivo: ch.reason_of_change as any,
    items: [], // Los cambios no suelen mostrar los items originales en la lista unificada
    total: 0,
    createdAt: ch.created_at,
    estadoGestion: ch.stock_applied ? 'Cambiado' : 'Pendiente',
    productoNuevo: ch.details && ch.details[0] ? {
      id: String(ch.details[0].variant),
      nombre: ch.details[0].variant_name || `Cambio por Var: ${ch.details[0].variant}`,
      precio: parseFloat(ch.details[0].price_difference)
    } : null
  });

  // ── LOAD DATA ──────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [rets, changes, retMetrics, changeMetrics, salesData, variantsAPI] = await Promise.all([
        getAllReturns(),
        getAllChanges(),
        getReturnMetrics(),
        getChangeMetrics(),
        getAllSales(),
        getAllVariants()
      ]);

      const localReturns = (rets || []).map(mapApiReturnToLocal);
      const localChanges = (changes || []).map(mapApiChangeToLocal);

      // Unificar y ordenar por fecha descendente
      const unified = [...localReturns, ...localChanges].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setDevoluciones(unified);
      if (variantsAPI) setVariants(variantsAPI);
      
      // Adaptar ventas para el select del modal de creación
      if (salesData) {
        setVentas(salesData.map((s: SaleAPI) => ({
          id: s.id_sale,
          numeroVenta: s.number_sale,
          clienteNombre: s.client_name || 'Desconocido',
          total: parseFloat(s.total),
          items: (s.details || []).map(d => ({
            id: String(d.id_detail),
            variantId: d.variant,
            productoNombre: (d as any).variant_name || `ID: ${d.variant}`,
            cantidad: d.quantity,
            precioUnitario: parseFloat(d.unit_price || "0"),
            talla: '',
            color: ''
          }))
        })) as any);
      }

      // Sincronizar métricas calculadas localmente a partir de los datos reales de la BD
      const pendingCount = unified.filter(d => d.estadoGestion === 'Pendiente' || d.estadoGestion === 'Enviado a reparación').length;
      const completedCount = unified.filter(d => d.estadoGestion === 'Cambiado' || d.estadoGestion === 'Reparado').length;
      const totalAmountVal = unified.reduce((acc, curr) => {
        if (curr.estadoGestion !== 'Anulado') {
          return acc + (curr.total || 0);
        }
        return acc;
      }, 0);

      setMetrics({
        totalCount: unified.length,
        totalAmount: totalAmountVal,
        pending: pendingCount,
        completed: completedCount
      });

    } catch (error) {
      console.error('Error loading returns/changes data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => {
      const storedVentas = localStorage.getItem(VENTAS_KEY);
      const storedProductos = localStorage.getItem(PRODUCTOS_KEY);
      if (storedVentas) setVentas(JSON.parse(storedVentas));
      if (storedProductos) setProductos(JSON.parse(storedProductos));
    };
    
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('devolucionProcessed', loadData);
    window.addEventListener('cambioProcessed', loadData);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('devolucionProcessed', loadData);
      window.removeEventListener('cambioProcessed', loadData);
    };
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
${devolucion.items.map(item => {
  const details = getVariantDetails(item.variantId || 0);
  return `
${details.nombre || item.productoNombre}
Talla: ${details.talla || item.talla} | Color: ${details.color || item.color}
Cantidad: ${item.cantidad} x ${formatCOP(item.precioUnitario)}
Subtotal: ${formatCOP(item.subtotal)}
`;
}).join('\n')}

---------------------------------
TOTAL A DEVOLVER
---------------------------------
${formatCOP(devolucion.total)}

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

  const anularDevolucion = async (id: number) => {
    const item = devoluciones.find(d => d.id === id);
    if (!item) return;

    let success = false;
    if (item.numeroDevolucion.startsWith('DEV')) {
      success = await annulReturn(id);
    } else {
      success = await deleteChange(id);
    }

    setShowConfirmModal(false);

    if (success) {
      loadData();
      setShowNotificationModal(true);
      setNotificationMessage('Devolución anulada correctamente en el servidor');
      setNotificationType('success');
    } else {
      setShowNotificationModal(true);
      setNotificationMessage('Error al intentar anular la devolución en el servidor');
      setNotificationType('error');
    }
  };

  const eliminarDevolucion = async (id: number) => {
    const item = devoluciones.find(d => d.id === id);
    if (!item) return;

    let success = false;
    if (item.numeroDevolucion.startsWith('DEV')) {
      success = await deleteReturn(id);
    }

    setShowConfirmModal(false);

    if (success) {
      loadData();
      setShowNotificationModal(true);
      setNotificationMessage('Devolución eliminada permanentemente del servidor');
      setNotificationType('success');
    } else {
      setShowNotificationModal(true);
      setNotificationMessage('Error al intentar eliminar la devolución del servidor. Solo se pueden eliminar devoluciones anuladas.');
      setNotificationType('error');
    }
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


  const descargarExcel = async () => {
    setLoading(true);
    try {
      await exportAllReturns();
      setShowNotificationModal(true);
      setNotificationMessage('Reporte de devoluciones descargado correctamente');
      setNotificationType('success');
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };


  // El número de devolución ahora lo genera el backend automáticamente


  const crearDevolucion = async () => {
    if (!selectedVenta || itemsDevueltos.length === 0) {
      setNotificationMessage('Debes seleccionar una venta y al menos un producto');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    setLoading(true);
    try {
      let result;
      if (productoNuevoId) {
        // Es un CAMBIO
        const variantNueva = variants.find(v => 
          v.product === Number(productoNuevoId) &&
          v.size_name === productoNuevoTalla &&
          v.color_name === productoNuevoColor
        );
        if (!variantNueva) {
          setNotificationMessage('No se encontró la variante seleccionada del producto nuevo');
          setNotificationType('error');
          setShowNotificationModal(true);
          setLoading(false);
          return;
        }

        const dto: CreateChangeDTO = {
          sale: selectedVenta.id,
          reason_of_change: formMotivo,
          state: 2, // Pendiente por defecto
          details: itemsDevueltos.map(i => {
            const itemOriginal = selectedVenta.items.find((item: any) => String(item.id) === String(i.itemId));
            return {
              variant_returned: itemOriginal ? Number(itemOriginal.variantId) : 0,
              variant_delivered: variantNueva.id_variant
            };
          }).filter(d => d.variant_returned > 0)
        };
        result = await createChange(dto);
      } else {
        // Es una DEVOLUCIÓN
        const dto: CreateReturnDTO = {
          sale: selectedVenta.id,
          reason: formMotivo,
          state: 2, // Pendiente por defecto
          details: itemsDevueltos.map(i => {
            const itemOriginal = selectedVenta.items.find((item: any) => String(item.id) === String(i.itemId));
            return {
              variant: itemOriginal ? Number(itemOriginal.variantId) : 0,
              quantity: i.cantidad
            };
          }).filter(d => d.variant > 0)
        };
        result = await createReturn(dto);
      }

      if (result) {
        await loadData();
        setShowCreateModal(false);
        setNotificationMessage('Operación realizada con éxito en el servidor');
        setNotificationType('success');
        setShowNotificationModal(true);
        
        // Reset form
        setSelectedVenta(null);
        setItemsDevueltos([]);
        setProductoNuevoId('');
      } else {
        setNotificationMessage('El servidor rechazó la operación');
        setNotificationType('error');
        setShowNotificationModal(true);
      }
    } catch (error) {
      console.error('Error in creation flow:', error);
    } finally {
      setLoading(false);
    }
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
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Download size={16} />
              Descargar Excel
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

      {/* Info Cards - Dinámicas del Backend */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-500 text-sm mb-1">Total Movimientos</div>
          <div className="text-2xl font-bold text-gray-900">{metrics.totalCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-500 text-sm mb-1">Total Devoluciones</div>
          <div className="text-2xl font-bold text-gray-900">{formatCOP(metrics.totalAmount)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-500 text-sm mb-1">Pendientes</div>
          <div className="text-2xl font-bold text-yellow-600">{metrics.pending}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-500 text-sm mb-1">Completados</div>
          <div className="text-2xl font-bold text-green-600">{metrics.completed}</div>
        </div>
      </div>

      {/* Info Card */}
      {devoluciones.length === 0 && !loading && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <RotateCcw className="text-purple-600 mt-1" size={24} />
            <div>
              <h3 className="text-purple-900 mb-1">Sin devoluciones registradas</h3>
              <p className="text-purple-700 text-sm">
                No se encontraron registros en el servidor. Empieza creando una desde el botón de "+" en Ventas o aquí mismo.
              </p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
                        {devolucion.productoNuevo ? (() => {
                          const details = getVariantDetails(devolucion.productoNuevo.id);
                          const dispName = details.talla && details.color
                            ? `${details.nombre} (Talla: ${details.talla}, Color: ${details.color})`
                            : details.nombre;
                          return (
                            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200">
                              ✓ {dispName}
                            </span>
                          );
                        })() : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-gray-900">
                      {formatCOP(devolucion.total)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setViewingDevolucion(devolucion); setShowDetailModal(true); }}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
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
                        {devolucion.estadoGestion !== 'Anulado' ? (
                          <button
                            onClick={() => { 
                              setConfirmMessage(`¿Anular devolución ${devolucion.numeroDevolucion}?`); 
                              setConfirmAction({ run: () => anularDevolucion(devolucion.id) }); 
                              setShowConfirmModal(true); 
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                            title="Anular devolución"
                          >
                            <Ban size={18} />
                          </button>
                        ) : (
                          devolucion.numeroDevolucion.startsWith('DEV') && (
                            <button
                              onClick={() => { 
                                setConfirmMessage(`¿Eliminar definitivamente la devolución ${devolucion.numeroDevolucion}?`); 
                                setConfirmAction({ run: () => eliminarDevolucion(devolucion.id) }); 
                                setShowConfirmModal(true); 
                              }}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-700"
                              title="Eliminar devolución"
                            >
                              <Trash2 size={18} />
                            </button>
                          )
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
          <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-2">
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
                {viewingDevolucion.items.map((item, index) => {
                  const details = getVariantDetails(item.variantId || 0);
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="flex justify-between mb-1">
                        <div className="text-gray-900 font-medium">{details.nombre || item.productoNombre}</div>
                        <div className="text-gray-900 font-medium">{formatCOP(item.subtotal)}</div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Talla: {details.talla || item.talla} | Color: {details.color || item.color} | Cantidad: {item.cantidad} x {formatCOP(item.precioUnitario)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {viewingDevolucion.productoNuevo && (() => {
              const details = getVariantDetails(viewingDevolucion.productoNuevo.id);
              const dispName = details.talla && details.color
                ? `${details.nombre} (Talla: ${details.talla}, Color: ${details.color})`
                : details.nombre;
              return (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-600 mb-2 font-medium">Producto de Cambio</div>
                  <div className="text-green-900 font-medium mb-2">{dispName}</div>
                  <div className="text-sm text-green-700">Precio: {formatCOP(viewingDevolucion.productoNuevo.precio)}</div>
                </div>
              );
            })()}

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
                      {formatCOP(saldoAFavorNum)}
                    </span>
                  </div>
                )}

                {diferenciaPagarNum > 0 && (
                  <div className="flex justify-between text-sm text-blue-700">
                    <span>Diferencia a Pagar:</span>
                    <span className="font-medium text-red-600">
                      {formatCOP(diferenciaPagarNum)}
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
                <span>{formatCOP(viewingDevolucion.total)}</span>
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
                    confirmAction.run();
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
                    {venta.numeroVenta ?? venta.numero} - {venta.clienteNombre} - {formatCOP(venta.total)}
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
                                Precio: {formatCOP(Number(item.precioUnitario || 0))}
                              </div>
                            </div>

                            <div className="text-sm font-semibold text-gray-900">
                              {formatCOP(Number(item.subtotal || (item.cantidad * item.precioUnitario)))}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="text-xs text-gray-700">Cantidad a devolver:</label>

                            <input
                              type="number"
                              min="0"
                              max={Number(item.cantidad || 0)}
                              value={cantidadDevuelta}
                              onChange={(e) => {
                                const max = Number(item.cantidad || 0);
                                const val = parseInt(e.target.value, 10) || 0;
                                const safe = Math.max(0, Math.min(max, val));
                                handleToggleItemDevolucion(String(item.id), safe);
                              }}
                              className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />

                            <span className="text-xs text-gray-600">de {item.cantidad}</span>

                            {cantidadDevuelta > 0 && (
                              <span className="ml-auto text-xs text-green-700 font-medium">
                                Devolución: {formatCOP(cantidadDevuelta * Number(item.precioUnitario || 0))}
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
                          {p.nombre} - {formatCOP(p.precioVenta || 0)}
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

                    const cantidadVendida = Number(item.cantidad || 0);
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