import React from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import { useEcommerce } from '../../../../shared/contexts';

interface OrdersPageProps {
  onNavigate: (view: string) => void;
  currentUser: any;
}

export function OrdersPage({ onNavigate, currentUser }: OrdersPageProps) {
  const { orders } = useEcommerce();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entregado': return 'bg-green-100 text-green-800';
      case 'Enviado': return 'bg-blue-100 text-blue-800';
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => onNavigate('profile')}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Mis Pedidos</h1>
      </header>

      {orders.length === 0 ? (
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
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-lg">{order.id}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                {order.items.map((item, idx) => (
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