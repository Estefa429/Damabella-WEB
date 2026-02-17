import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import { useEcommerce } from '../../../../shared/contexts';

interface OrdersPageProps {
  onNavigate: (view: string) => void;
  currentUser: any;
}

export function OrdersPage({ onNavigate, currentUser }: OrdersPageProps) {
  const { orders } = useEcommerce();
  const [allOrders, setAllOrders] = useState<any[]>([]);

  useEffect(() => {
    // Indicar montaje del componente (log inicial)
    try { console.log('[OrdersPage] useEffect start - component mounted'); } catch (e) {}
    // Leer usuario desde localStorage (priorizar 'damabella_current_user' según petición)
    const currentUserRaw = localStorage.getItem('damabella_current_user');
    const fallbackUserRaw = localStorage.getItem('damabella_user');

    try { console.log('[OrdersPage] localStorage.getItem("damabella_current_user") =>', currentUserRaw === null ? 'NULL' : currentUserRaw); } catch (e) {}
    try { console.log('[OrdersPage] localStorage.getItem("damabella_user") =>', fallbackUserRaw === null ? 'NULL' : fallbackUserRaw); } catch (e) {}

    const storedUserRaw = currentUserRaw || fallbackUserRaw;
    if (!storedUserRaw) {
      try { console.log('[OrdersPage] no damabella_current_user or damabella_user found; aborting filter'); } catch (e) {}
      setAllOrders([]);
      return;
    }

    let storedUser: any = null;
    try {
      storedUser = JSON.parse(storedUserRaw);
    } catch (e) {
      try { console.log('[OrdersPage] error parsing stored user (current_user or user)', e); } catch (e2) {}
      setAllOrders([]);
      return;
    }

    // Extraer id intentando varios campos comunes
    const userIdRaw = storedUser?.id ?? storedUser?.userId ?? storedUser?.clienteId ?? storedUser?.cliente?.id ?? storedUser?.data?.id ?? null;
    try { console.log('[OrdersPage] resolved storedUser id candidates ->', { id: storedUser?.id, userId: storedUser?.userId, clienteId: storedUser?.clienteId }); } catch (e) {}

    if (userIdRaw === undefined || userIdRaw === null) {
      try { console.log('[OrdersPage] stored user has no identifiable id; aborting filter'); } catch (e) {}
      setAllOrders([]);
      return;
    }

    const userIdStr = String(userIdRaw);

    // --- LOGS DE DEPURACIÓN (se muestran en la consola del navegador) ---
    try {
      console.log('[OrdersPage] mounted - clientId (from damabella_user):', userIdStr);

      const ordersRawKey = localStorage.getItem('orders');
      const salesRawKey = localStorage.getItem('sales');
      const damabellaOrdersRaw = localStorage.getItem('damabella_orders');
      const damabellaVentasRaw = localStorage.getItem('damabella_ventas');

      console.log('[OrdersPage] localStorage.getItem("orders") =>', ordersRawKey === null ? 'NULL' : ordersRawKey);
      console.log('[OrdersPage] localStorage.getItem("sales") =>', salesRawKey === null ? 'NULL' : salesRawKey);
      console.log('[OrdersPage] localStorage.getItem("damabella_orders") =>', damabellaOrdersRaw === null ? 'NULL' : damabellaOrdersRaw);
      console.log('[OrdersPage] localStorage.getItem("damabella_ventas") =>', damabellaVentasRaw === null ? 'NULL' : damabellaVentasRaw);

      const parsedOrdersRaw = ordersRawKey ? JSON.parse(ordersRawKey) : [];
      const parsedSalesRaw = salesRawKey ? JSON.parse(salesRawKey) : [];
      const parsedDamabellaOrders = damabellaOrdersRaw ? JSON.parse(damabellaOrdersRaw) : [];
      const parsedDamabellaVentas = damabellaVentasRaw ? JSON.parse(damabellaVentasRaw) : [];

      console.log('[OrdersPage] parsed - orders (key "orders"):', Array.isArray(parsedOrdersRaw) && parsedOrdersRaw.length ? parsedOrdersRaw : 'EMPTY_OR_NOT_ARRAY');
      console.log('[OrdersPage] parsed - sales (key "sales"):', Array.isArray(parsedSalesRaw) && parsedSalesRaw.length ? parsedSalesRaw : 'EMPTY_OR_NOT_ARRAY');
      console.log('[OrdersPage] parsed - damabella_orders:', Array.isArray(parsedDamabellaOrders) && parsedDamabellaOrders.length ? parsedDamabellaOrders : 'EMPTY_OR_NOT_ARRAY');
      console.log('[OrdersPage] parsed - damabella_ventas:', Array.isArray(parsedDamabellaVentas) && parsedDamabellaVentas.length ? parsedDamabellaVentas : 'EMPTY_OR_NOT_ARRAY');
    } catch (logErr) {
      console.error('[OrdersPage] error logging localStorage contents', logErr);
    }

    // Cargar datos administrativos: pedidos y ventas
    const pedidosRaw = localStorage.getItem('damabella_pedidos');
    const ventasRaw = localStorage.getItem('damabella_ventas');

    try { console.log('[OrdersPage] localStorage.getItem("damabella_pedidos") =>', pedidosRaw === null ? 'NULL' : pedidosRaw); } catch (e) {}
    try { console.log('[OrdersPage] localStorage.getItem("damabella_ventas") =>', ventasRaw === null ? 'NULL' : ventasRaw); } catch (e) {}

    const parsedPedidos = pedidosRaw ? JSON.parse(pedidosRaw) : [];
    const parsedVentas = ventasRaw ? JSON.parse(ventasRaw) : [];

    // Helper: comparar ids tolerante (extrae dígitos si es necesario)
    const idMatches = (userId: string, candidate: any) => {
      try {
        if (candidate == null) return false;
        const candStr = String(candidate);
        const userDigits = (userId.match(/\d+/) || [userId])[0];
        const candDigits = (candStr.match(/\d+/) || [candStr])[0];
        return userDigits === candDigits || candStr.includes(userDigits) || String(userId).includes(candDigits);
      } catch (e) {
        return false;
      }
    };

    // Filtrar pedidos y ventas por cliente
    const pedidosFiltrados = Array.isArray(parsedPedidos) ? parsedPedidos.filter((p: any) => idMatches(userIdStr, p.clienteId ?? p.cliente_id ?? p.clientId ?? p.client ?? p.cliente)) : [];
    const ventasFiltradas = Array.isArray(parsedVentas) ? parsedVentas.filter((v: any) => idMatches(userIdStr, v.clienteId ?? v.cliente_id ?? v.clientId ?? v.client ?? v.cliente)) : [];

    try { console.log('[OrdersPage] pedidosFiltrados ->', pedidosFiltrados.length ? pedidosFiltrados : 'EMPTY'); } catch (e) {}
    try { console.log('[OrdersPage] ventasFiltradas ->', ventasFiltradas.length ? ventasFiltradas : 'EMPTY'); } catch (e) {}

    // Mapear entradas a la forma esperada por la UI
    const mapItems = (items: any[]) => (items || []).map((it: any) => ({
      productName: it.productoNombre || it.productName || it.name || '',
      color: it.color || it.colorName || '',
      size: it.talla || it.size || it.sizeName || '',
      quantity: it.cantidad || it.quantity || 1,
      price: it.precioUnitario || it.price || 0
    }));

    const pedidosUI = pedidosFiltrados.map((p: any) => ({
      id: String(p.id || p.numeroPedido || Date.now()),
      origin: 'pedido',
      items: mapItems(p.items || p.productos || p.productosPedido || []),
      subtotal: p.subtotal || 0,
      iva: p.iva || 0,
      total: p.total || p.subtotal || 0,
      paymentMethod: p.metodoPago || p.paymentMethod || 'unknown',
      clientName: p.clienteNombre || p.clientName || '',
      clientEmail: p.clienteEmail || p.email || '',
      clientPhone: p.clienteTelefono || p.telefono || '',
      clientAddress: p.direccion || p.clientAddress || '',
      date: p.fechaPedido || p.date || p.createdAt || new Date().toISOString(),
      status: p.estado || p.status || 'Pendiente',
      createdAt: p.createdAt || new Date().toISOString()
    }));

    const ventasUI = ventasFiltradas.map((v: any) => ({
      id: String(v.id || v.numeroVenta || Date.now()),
      origin: 'venta',
      items: mapItems(v.items || []),
      subtotal: v.subtotal || 0,
      iva: v.iva || 0,
      total: v.total || v.subtotal || 0,
      paymentMethod: v.metodoPago || v.paymentMethod || 'unknown',
      clientName: v.clienteNombre || v.clientName || '',
      clientEmail: v.clienteEmail || v.email || '',
      clientPhone: v.clienteTelefono || v.telefono || '',
      clientAddress: v.direccion || v.clientAddress || '',
      date: v.fechaVenta || v.date || v.createdAt || new Date().toISOString(),
      status: v.estado || v.status || 'Completada',
      createdAt: v.createdAt || new Date().toISOString()
    }));

    // Combinar: mostrar primero pedidos, luego ventas
    const combined = [...pedidosUI, ...ventasUI];
    setAllOrders(combined);
  }, [orders]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entregado': return 'bg-green-100 text-green-800';
      case 'Enviado': return 'bg-blue-100 text-blue-800';
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Determina si el status representa una compra completada
  const isCompletedStatus = (status: string | undefined) => {
    if (!status) return false;
    const s = status.toString().toLowerCase();
    return s === 'completado' || s === 'entregado' || s === 'pagado' || s === 'confirmado';
  };

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => onNavigate('profile')}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Mis Pedidos</h1>
      </header>

      {allOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96">
          <Package size={64} className="text-gray-300 mb-4" />
          <p className="text-gray-600 mb-4">Aún no tienes pedidos</p>
          <button
            onClick={() => onNavigate('home')}
            className="bg-[#FFB6C1] text-white px-6 py-2 rounded-lg hover:bg-[#FF9EB1]"
          >
            Explorar Productos
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {allOrders.map((order) => (
            <div key={`${order.origin}-${order.id}`} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-lg">{order.id}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.date || order.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isCompletedStatus(order.status) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {isCompletedStatus(order.status) ? 'Compra completada' : 'Pedido'}
                  </span>
                  <span className="text-xs text-gray-600 mt-1">{order.status}</span>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                      <p className="text-xs text-gray-600">{item.color} | Talla: {item.size} | x{item.quantity}</p>
                      <p className="text-sm font-bold">${item.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-lg font-bold text-[#FFB6C1]">${order.total.toLocaleString()}</p>
                </div>
                <p className="text-xs text-gray-600">{order.paymentMethod}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}