import React, { useState, useEffect } from 'react';
import { Package, Search, Eye, Clock, Truck, RotateCcw } from 'lucide-react';
import { Input, Modal } from '../../../../shared/components/native';

const PEDIDOS_KEY = 'damabella_pedidos';

interface MisPedidosPageProps {
  currentUser: any;
}

export default function MisPedidosPage({ currentUser }: MisPedidosPageProps) {
  const [pedidos, setPedidos] = useState(() => {
    const stored = localStorage.getItem(PEDIDOS_KEY);
    const allPedidos = stored ? JSON.parse(stored) : [];
    // Filtrar solo pedidos del usuario actual
    return allPedidos.filter((p: any) => p.clienteId?.toString() === currentUser.id.toString());
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredPedidos = pedidos.filter((p: any) =>
    p.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEstadoColor = (estado: string) => {
    switch(estado.toLowerCase()) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'enviado': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'entregado': return 'bg-green-100 text-green-700 border-green-200';
      case 'devolución': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch(estado.toLowerCase()) {
      case 'pendiente': return <Clock size={16} />;
      case 'enviado': return <Truck size={16} />;
      case 'entregado': return <Package size={16} />;
      case 'devolución': return <RotateCcw size={16} />;
      default: return <Package size={16} />;
    }
  };

  const handleVerDetalle = (pedido: any) => {
    setSelectedPedido(pedido);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 mb-2">Mis Pedidos</h2>
        <p className="text-gray-600">Consulta el estado de tus pedidos</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar por número de pedido o estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Pedidos List */}
      {filteredPedidos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-16 text-center">
          <Package className="mx-auto mb-4 text-gray-300" size={64} />
          <h3 className="text-gray-900 text-xl mb-2">No tienes pedidos</h3>
          <p className="text-gray-600">Tus pedidos aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPedidos.map((pedido: any) => (
            <div key={pedido.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900">{pedido.numeroPedido}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs border flex items-center gap-1 ${getEstadoColor(pedido.estado)}`}>
                      {getEstadoIcon(pedido.estado)}
                      {pedido.estado}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-500">Fecha:</span> {pedido.fechaPedido}
                    </div>
                    <div>
                      <span className="text-gray-500">Items:</span> {pedido.items?.length || 0}
                    </div>
                    <div>
                      <span className="text-gray-500">Total:</span> ${pedido.total?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleVerDetalle(pedido)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <Eye size={18} />
                  Ver Detalle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Detalle del Pedido ${selectedPedido?.numeroPedido}`}
      >
        {selectedPedido && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-600 mb-1 text-sm">Estado</div>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm border ${getEstadoColor(selectedPedido.estado)}`}>
                  {selectedPedido.estado}
                </span>
              </div>
              <div>
                <div className="text-gray-600 mb-1 text-sm">Fecha</div>
                <div className="text-gray-900">{selectedPedido.fechaPedido}</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-600 mb-1 text-sm">Dirección de Envío</div>
                <div className="text-gray-900">{selectedPedido.direccionEnvio}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1 text-sm">Teléfono</div>
                <div className="text-gray-900">{selectedPedido.telefonoContacto}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1 text-sm">Método de Pago</div>
                <div className="text-gray-900">{selectedPedido.metodoPago}</div>
              </div>
            </div>

            {selectedPedido.observaciones && (
              <div>
                <div className="text-gray-600 mb-1 text-sm">Observaciones</div>
                <div className="text-gray-900">{selectedPedido.observaciones}</div>
              </div>
            )}

            <div>
              <div className="text-gray-600 mb-2 text-sm">Productos</div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 text-gray-600">Producto</th>
                      <th className="text-center py-2 px-3 text-gray-600">Talla</th>
                      <th className="text-center py-2 px-3 text-gray-600">Color</th>
                      <th className="text-right py-2 px-3 text-gray-600">Cant.</th>
                      <th className="text-right py-2 px-3 text-gray-600">Precio</th>
                      <th className="text-right py-2 px-3 text-gray-600">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedPedido.items?.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="py-2 px-3 text-gray-900">{item.productoNombre}</td>
                        <td className="py-2 px-3 text-center text-gray-700">{item.talla}</td>
                        <td className="py-2 px-3 text-center text-gray-700">{item.color}</td>
                        <td className="py-2 px-3 text-right text-gray-700">{item.cantidad}</td>
                        <td className="py-2 px-3 text-right text-gray-700">${item.precioUnitario?.toLocaleString() || 0}</td>
                        <td className="py-2 px-3 text-right text-gray-900">${item.subtotal?.toLocaleString() || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-gray-900 text-lg">
                <span>Total:</span>
                <span>${selectedPedido.total?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
