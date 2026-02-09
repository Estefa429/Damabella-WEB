import { StatsCard } from '../components/StatsCard';
import { Card, Badge } from '../../../shared/components/native';
import { DollarSign, ShoppingCart, RotateCcw, Users, Clock } from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';
import {
  getVentasDelMes,
  getPedidosPendientes,
  getClientesActivos,
  getDevolucionesDelMes,
  getSalesMonthlyData,
  getCategoryDistribution,
  getTopProducts,
  getPendingOrdersTable,
  getClientsRegisteredMonthly,
  formatCOP,
  auditarLocalStorage,
  subscribeToStorageChanges,
} from '../utils/dashboardHelpers';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export function Dashboard() {
  // ============================================================
  // ESTADO PARA FORZAR RE-RENDER CUANDO CAMBIA localStorage
  // ============================================================
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ============================================================
  // AUDITORÍA Y REACTIVIDAD - useEffect
  // ============================================================
  useEffect(() => {
    // 🔍 Auditoría inicial: listar keys en localStorage
    console.log('====== DASHBOARD INICIANDO ======');
    auditarLocalStorage();

    // 🔄 Suscribirse a cambios en localStorage
    const unsubscribe = subscribeToStorageChanges(() => {
      console.log('🔄 [DASHBOARD] Forzando re-cálculo de datos...');
      setRefreshTrigger((prev) => prev + 1); // Fuerza re-render
    });

    // Limpiar suscripción al desmontar
    return () => {
      console.log('[DASHBOARD] Limpiando suscripciones...');
      unsubscribe();
    };
  }, []);

  // ============================================================
  // CÁLCULOS CENTRALIZADOS - useMemo para evitar recálculos
  // ============================================================

  const ventasDelMes = useMemo(() => getVentasDelMes(), [refreshTrigger]);
  const pedidosPendientes = useMemo(() => getPedidosPendientes(), [refreshTrigger]);
  const clientesActivos = useMemo(() => getClientesActivos(), [refreshTrigger]);
  const devolucionesDelMes = useMemo(() => getDevolucionesDelMes(), [refreshTrigger]);
  const salesMonthlyData = useMemo(() => getSalesMonthlyData(), [refreshTrigger]);
  const categoryDistribution = useMemo(() => getCategoryDistribution(), [refreshTrigger]);
  const topProductsData = useMemo(() => getTopProducts(5), [refreshTrigger]);
  const pendingOrdersTable = useMemo(() => getPendingOrdersTable(5), [refreshTrigger]);
  const clientsRegisteredData = useMemo(() => getClientsRegisteredMonthly(), [refreshTrigger]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Vista general del negocio</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Ventas del Mes"
          value={formatCOP(ventasDelMes)}
          icon={DollarSign}
          growth={0}
        />
        <StatsCard
          title="Pedidos Pendientes"
          value={pedidosPendientes.toString()}
          icon={ShoppingCart}
          growth={0}
        />
        <StatsCard
          title="Devoluciones"
          value={devolucionesDelMes.toString()}
          icon={RotateCcw}
          growth={0}
        />
        <StatsCard
          title="Clientes Activos"
          value={clientesActivos.toString()}
          icon={Users}
          growth={0}
        />
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas mensuales */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Ventas Por Periodo (Pesos)</h3>
            <Badge variant="info">2024</Badge>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()} COP`} labelFormatter={(label) => `Mes: ${label}`} />
              <Area type="monotone" dataKey="ventas" stroke="#374151" fill="#9CA3AF" name="Ventas (COP)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Pedidos mensuales */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Pedidos Mensuales (Cantidad)</h3>
            <Badge variant="success">↑ 15%</Badge>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" label={{ value: 'Cantidad de Pedidos', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value} pedidos`} labelFormatter={(label) => `Mes: ${label}`} />
              <Line type="monotone" dataKey="pedidos" stroke="#374151" strokeWidth={2} name="Pedidos" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Productos por categoría */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Ventas por Categoría</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Clientes registrados */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Clientes Registrados (Cantidad)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clientsRegisteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" label={{ value: 'Cantidad de Clientes', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value} clientes`} labelFormatter={(label) => `Mes: ${label}`} />
              <Bar dataKey="clientes" fill="#6B7280" radius={[8, 8, 0, 0]} name="Clientes Registrados" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Productos más vendidos */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Productos Más Vendidos (Unidades Vendidas)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topProductsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" yAxisId="left" label={{ value: 'Cantidad Vendida', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} label={{ value: 'Ingresos (COP)', angle: 90, position: 'insideRight' }} />
            <Tooltip formatter={(value) => typeof value === 'number' ? value > 1000 ? `$${(value / 1000000).toFixed(2)}M` : `${value} unidades` : value} labelFormatter={(label) => `Producto: ${label}`} />
            <Bar yAxisId="left" dataKey="ventas" fill="#374151" radius={[8, 8, 0, 0]} name="Cantidad Vendida" />
            <Bar yAxisId="right" dataKey="ingresos" fill="#9CA3AF" radius={[8, 8, 0, 0]} name="Ingresos (COP)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Sección inferior: Pedidos y Notificaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos pendientes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Pedidos Pendientes</h3>
            <Badge variant="warning">{pedidosPendientes} pendientes</Badge>
          </div>
          <div className="space-y-3">
            {pendingOrdersTable.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{order.clienteNombre}</p>
                    <p className="text-xs text-gray-600">
                      {order.productoNombre}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCOP(order.monto)}</p>
                  <p className="text-xs text-yellow-600">{order.estado}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Resumen de información */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Resumen del Periodo</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Ventas procesadas</span>
              <span className="font-semibold">{formatCOP(ventasDelMes)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Pedidos pendientes</span>
              <span className="font-semibold">{pedidosPendientes}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Clientes activos</span>
              <span className="font-semibold">{clientesActivos}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Devoluciones este mes</span>
              <span className="font-semibold">{devolucionesDelMes}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Pedidos recientes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pedidos Recientes (Pendientes)</h3>
        <div className="space-y-3">
          {pendingOrdersTable.length > 0 ? (
            pendingOrdersTable.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{order.clienteNombre}</p>
                    <p className="text-xs text-gray-600">{order.productoNombre}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">{formatCOP(order.monto)}</p>
                  <Badge variant="warning">
                    {order.estado}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No hay pedidos pendientes</p>
          )}
        </div>
    </div>
  );
}
