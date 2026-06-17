import React, { useState, useEffect, useMemo } from 'react';
import { Package, ChevronLeft, ChevronRight, Loader, AlertCircle, Search } from 'lucide-react';
import { useOrders } from '../../ecommerce/orders/components/UseOrder';
import { apiOrderToLocal } from '../../ecommerce/orders/components/OrderMappers';
import { obtenerClaseEstado, obtenerDescripcionEstado } from '../../../services/pedidosCentralizado';
import { formatCOP } from '../utils/dashboardHelpers';
import { getAllClients } from '../../ecommerce/customers/services/clientsServices';

type PedidoLocal = ReturnType<typeof apiOrderToLocal>;

const ITEMS_PER_PAGE = 10;

export default function DashboardOrdersTable() {
  const {
    pedidos: pedidosAPI,
    loading,
    error,
  } = useOrders();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [clientes, setClientes] = useState<any[]>([]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await getAllClients();
        if (res) {
          setClientes(res);
        }
      } catch (err) {
        console.error('Error fetching clients in DashboardOrdersTable:', err);
      }
    };
    fetchClientes();
  }, []);

  const getClienteDocumento = (clienteId: string) => {
    const cliente = clientes.find((c: any) => c.id_client?.toString() === clienteId);
    return cliente ? cliente.doc : '-';
  };

  // Normalizar pedidos de API al formato local y filtrar para que únicamente se muestren los pedidos con estado "Pendiente"
  const pedidos: PedidoLocal[] = useMemo(
    () => pedidosAPI.map(apiOrderToLocal).filter((p) => p.estado === 'Pendiente'),
    [pedidosAPI],
  );

  // Filtrar pedidos según la búsqueda
  const filteredPedidos = useMemo(() => {
    if (!searchTerm.trim()) {
      return pedidos;
    }

    const lowerSearch = searchTerm.toLowerCase();
    return pedidos.filter(
      (p) =>
        p.numeroPedido.toLowerCase().includes(lowerSearch) ||
        p.clienteNombre.toLowerCase().includes(lowerSearch) ||
        getClienteDocumento(p.clienteId).toLowerCase().includes(lowerSearch) ||
        p.estado.toLowerCase().includes(lowerSearch)
    );
  }, [pedidos, searchTerm, clientes]);

  // Paginación
  const totalPages = Math.ceil(filteredPedidos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPedidos = filteredPedidos.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambia el búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Manejar cambios de página
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages || 1));
    setCurrentPage(validPage);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
            <p className="text-gray-600">Cargando pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-gray-900 font-semibold text-lg">Pedidos Pendientes</h3>
            <p className="text-gray-600 text-sm">Pedidos pendientes de procesamiento</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{filteredPedidos.length}</p>
            <p className="text-gray-600 text-sm">pendientes</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por número, cliente o estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-6 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Número</th>
              <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Cliente</th>
              <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Documento</th>
              <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Fecha</th>
              <th className="text-right py-4 px-6 text-gray-600 font-medium text-sm">Total</th>
              <th className="text-center py-4 px-6 text-gray-600 font-medium text-sm">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedPedidos.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Package className="mx-auto mb-4 text-gray-300" size={48} />
                  <p className="text-gray-500">
                    {filteredPedidos.length === 0 && searchTerm
                      ? 'No se encontraron pedidos pendientes'
                      : 'No hay pedidos pendientes disponibles'}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedPedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-gray-900 font-medium">{pedido.numeroPedido}</td>
                  <td className="py-4 px-6 text-gray-600">{pedido.clienteNombre}</td>
                  <td className="py-4 px-6 text-gray-600">{getClienteDocumento(pedido.clienteId)}</td>
                  <td className="py-4 px-6 text-gray-600">
                    {new Date(pedido.fechaPedido).toLocaleDateString('es-ES')}
                  </td>
                  <td className="py-4 px-6 text-right text-gray-900 font-medium">
                    {formatCOP(pedido.total)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${obtenerClaseEstado(
                          pedido.estado
                        )}`}
                      >
                        {obtenerDescripcionEstado(pedido.estado)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredPedidos.length)} de {filteredPedidos.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

