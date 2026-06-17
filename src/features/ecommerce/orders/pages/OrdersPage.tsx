import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Truck, Store, X } from 'lucide-react';
import { useEcommerce } from '@/shared/contexts';
import { getMyOrders } from '../services/OrderServices';
import { formatCOP } from '@/features/dashboard/utils/dashboardHelpers';

interface OrdersPageProps {
  onNavigate: (view: string) => void;
  currentUser: any;
}

export function OrdersPage({ onNavigate, currentUser }: OrdersPageProps) {
  const { products } = useEcommerce();
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const findVariantDetails = (variantId: number) => {
    for (const product of products || []) {
      for (const variant of product.variants || []) {
        for (const sizeItem of variant.sizes || []) {
          if (Number(sizeItem.variantId) === Number(variantId)) {
            return {
              productName: product.name,
              image: product.image,
              color: variant.color,
              size: sizeItem.size
            };
          }
        }
      }
    }
    return null;
  };

  const fetchOrders = async () => {
    // Si el usuario no es un cliente, evitamos hacer la llamada a getMyOrders()
    // ya que causará un 401 que desloguea al usuario debido al interceptor.
    const isUserCliente = () => {
      if (!currentUser) return false;
      const roleName = (currentUser.rol_name ?? currentUser.role ?? currentUser.rol ?? '').toString().toLowerCase().trim();
      const roleId = Number(currentUser.rol);
      return roleName === 'cliente' || roleName === 'clientes' || roleName === 'client' || roleName === 'clients' || roleId === 2;
    };

    if (!isUserCliente()) {
      setAllOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getMyOrders();
      if (data) {
        const mapped = data.map((p: any) => {
          const stateName = p.state?.name_state || p.state_name || 'Pendiente';
          
          const mapItems = (details: any[]) => (details || []).map((it: any) => {
            const variantId = it.variant;
            const foundDetails = findVariantDetails(variantId);
            
            const parts = (it.variant_name || '').split(' - ');
            const prodName = foundDetails?.productName || parts[0] || 'Producto';
            const color = foundDetails?.color || parts[1] || '';
            const size = foundDetails?.size || parts[2] || '';
            
            return {
              productName: prodName,
              color: color,
              size: size,
              quantity: it.quantity || 1,
              price: it.sales_price || it.price || 0,
              image: foundDetails?.image || it.image || ''
            };
          });

          return {
            id: String(p.id_order || p.number_order || Date.now()),
            numberOrder: p.number_order || '',
            origin: 'pedido',
            items: mapItems(p.detail || []),
            subtotal: Number(p.subtotal) || 0,
            iva: Number(p.iva) || 0,
            total: Number(p.total) || 0,
            paymentMethod: p.payment_method_name || 'Desconocido',
            clientName: p.client_name || '',
            address: p.address_shipment || '',
            personReceives: p.person_receives || '',
            date: p.order_date || p.created_at || new Date().toISOString(),
            status: stateName
          };
        });

        // Ordenar por fecha descendente (más recientes primero)
        mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAllOrders(mapped);
      } else {
        setAllOrders([]);
      }
    } catch (err: any) {
      console.error('[OrdersPage] fetchOrders error:', err);
      // Si el backend devuelve un 404 (por ejemplo, perfil de cliente inexistente en DB), se trata como 0 pedidos
      if (err.response?.status === 404) {
        setAllOrders([]);
      } else {
        setError('Hubo un error al cargar tus pedidos. Por favor, reintenta.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [products]);

  const isCompletedStatus = (status: string | undefined) => {
    if (!status) return false;
    const s = status.toString().toLowerCase();
    return s === 'completado' || s === 'entregado' || s === 'pagado' || s === 'confirmado';
  };

  const getShippingMethod = (order: any) => {
    if (order.address || order.address_shipment) {
      return { 
        text: 'delivery', 
        icon: <Truck size={14} className="text-[#701A75]" />,
        isDelivery: true
      };
    }
    return { 
      text: 'Recogida en tienda', 
      icon: <Store size={14} className="text-gray-400" />,
      isDelivery: false
    };
  };

  const formatDateSpanish = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  const formatOrderId = (order: any, index: number, total: number) => {
    if (order.numberOrder) {
      const match = order.numberOrder.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        const padded = num < 10 ? `0${num}` : `${num}`;
        return `Pedido #${padded}`;
      }
      return order.numberOrder;
    }
    const num = total - index;
    const padded = num < 10 ? `0${num}` : `${num}`;
    return `Pedido #${padded}`;
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-[450px] p-6 sm:p-8 flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Cargando tus pedidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-50 min-h-[450px] p-6 sm:p-8 flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500 border border-red-100">
          <X size={32} />
        </div>
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <button
          onClick={fetchOrders}
          className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-6 py-2 rounded-full hover:from-pink-500 hover:to-purple-500 transition-all font-medium shadow-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-[450px] p-4 sm:p-6">
      {allOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400 border border-gray-100">
            <Package size={32} />
          </div>
          <p className="text-gray-600 mb-6 text-base font-medium">Aún no tienes pedidos registrados</p>
          <button
            onClick={() => onNavigate('home')}
            className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-8 py-3 rounded-full hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-105 shadow-md font-medium"
          >
            Explorar Productos
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl mx-auto">
          {allOrders.map((order, orderIdx) => {
            const isPendiente = order.status.toLowerCase() === 'pendiente';
            const isEntregado = order.status.toLowerCase() === 'entregado' || isCompletedStatus(order.status);
            
            return (
              <div 
                key={`${order.origin}-${order.id}`} 
                className="bg-white rounded-xl p-4 border border-gray-100/80 shadow-sm mb-4"
              >
                {/* Header del Pedido */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: '#701A75' }}>
                      {formatOrderId(order, orderIdx, allOrders.length)}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isPendiente 
                      ? 'bg-[#F3E8FF] text-[#7E22CE]' 
                      : isEntregado
                      ? 'bg-[#FCE7F3] text-[#DB2777]'
                      : 'bg-red-50 text-red-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDateSpanish(order.date)}
                  </span>
                </div>

                {/* Items del Pedido */}
                <div className="space-y-2">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-start">
                      {/* Miniatura */}
                      <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                        <img 
                          src={item.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="55" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="%239ca3af">DAMABELLA</text></svg>'} 
                          alt={item.productName} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="55" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="%239ca3af">DAMABELLA</text></svg>';
                          }}
                        />
                      </div>

                      {/* Detalles del producto */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">
                            {item.productName}
                          </h4>
                          <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">
                            {formatCOP(item.price)} c/u
                          </span>
                        </div>

                        <div className="text-[11px] text-gray-500 mt-0.5">
                          <span>Talla: <strong className="text-gray-800 font-bold">{item.size}</strong></span>
                          <span className="mx-1.5 text-gray-300">|</span>
                          <span>Color: <strong className="text-gray-800 font-bold">{item.color}</strong></span>
                          <span className="mx-1.5 text-gray-300">|</span>
                          <span>Cantidad: <strong className="text-gray-800 font-bold">{item.quantity}</strong></span>
                        </div>

                        {order.items.length === 1 && (
                          <div className="flex justify-between items-end mt-1.5 border-t border-gray-50 pt-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: getShippingMethod(order).isDelivery ? '#701A75' : '#6b7280' }}>
                              {getShippingMethod(order).icon}
                              <span>{getShippingMethod(order).text}</span>
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] text-gray-400 font-medium leading-none">Total del pedido</p>
                              <p className="text-base font-bold mt-1 leading-none" style={{ color: isPendiente ? '#701A75' : '#1f2937' }}>
                                {formatCOP(order.total)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {order.items.length > 1 && (
                  <>
                    <div className="border-t border-gray-100 my-2" />
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: getShippingMethod(order).isDelivery ? '#701A75' : '#6b7280' }}>
                        {getShippingMethod(order).icon}
                        <span>{getShippingMethod(order).text}</span>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-medium leading-none">Total del pedido</p>
                        <p className="text-base font-bold mt-1 leading-none" style={{ color: isPendiente ? '#701A75' : '#1f2937' }}>
                          {formatCOP(order.total)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Botón en el fondo del listado */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => onNavigate('profile')}
              style={{ backgroundColor: '#701A75', color: '#ffffff' }}
              className="hover:opacity-90 px-8 py-2.5 rounded-full text-xs font-bold transition-all shadow-md"
            >
              Volver a mi perfil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}