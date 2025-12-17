import { StatsCard } from '../components/StatsCard';
import { Card, Badge } from '../../../shared/components/native';
import { DollarSign, ShoppingCart, RotateCcw, Users, Package, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { mockDashboardStats, mockTransactions, mockProducts, mockNotifications } from '../../../shared/utils/mockData';
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

// Datos para gráficas
const salesData = [
  { month: 'Ene', ventas: 8500000, pedidos: 45 },
  { month: 'Feb', ventas: 9200000, pedidos: 52 },
  { month: 'Mar', ventas: 10100000, pedidos: 58 },
  { month: 'Abr', ventas: 9800000, pedidos: 54 },
  { month: 'May', ventas: 11200000, pedidos: 63 },
  { month: 'Jun', ventas: 10500000, pedidos: 59 },
  { month: 'Jul', ventas: 11800000, pedidos: 67 },
  { month: 'Ago', ventas: 12000000, pedidos: 69 },
  { month: 'Sep', ventas: 11500000, pedidos: 65 },
  { month: 'Oct', ventas: 12200000, pedidos: 70 },
  { month: 'Nov', ventas: 12500000, pedidos: 72 },
  { month: 'Dic', ventas: 13800000, pedidos: 82 },
];

const categoryData = [
  { name: 'Vestidos Largos', value: 45, color: '#374151' },
  { name: 'Vestidos Cortos', value: 38, color: '#6B7280' },
  { name: 'Sets', value: 25, color: '#9CA3AF' },
  { name: 'Enterizos', value: 32, color: '#D1D5DB' },
];

const categorySalesData = [
  { name: 'Vestidos Largos', ventas: 12500000, cantidad: 145, color: '#374151' },
  { name: 'Vestidos Cortos', ventas: 9200000, cantidad: 110, color: '#6B7280' },
  { name: 'Sets', ventas: 7800000, cantidad: 98, color: '#9CA3AF' },
  { name: 'Enterizos', ventas: 8900000, cantidad: 87, color: '#D1D5DB' },
];

const topProducts = [
  { name: 'Vestido Largo Elegante', ventas: 145, ingresos: 23155000 },
  { name: 'Set Deportivo Premium', ventas: 132, ingresos: 17148000 },
  { name: 'Vestido Corto Casual', ventas: 98, ingresos: 8810200 },
  { name: 'Enterizo Formal', ventas: 87, ingresos: 11571000 },
  { name: 'Vestido Largo Fiesta', ventas: 76, ingresos: 13452000 },
];

const clientsRegistered = [
  { month: 'Ene', clientes: 12 },
  { month: 'Feb', clientes: 18 },
  { month: 'Mar', clientes: 25 },
  { month: 'Abr', clientes: 22 },
  { month: 'May', clientes: 30 },
  { month: 'Jun', clientes: 28 },
  { month: 'Jul', clientes: 35 },
  { month: 'Ago', clientes: 42 },
  { month: 'Sep', clientes: 38 },
  { month: 'Oct', clientes: 45 },
  { month: 'Nov', clientes: 52 },
  { month: 'Dic', clientes: 60 },
];

export function Dashboard() {
  const stats = mockDashboardStats;
  const pedidosPendientes = mockTransactions.filter(t => t.status === 'Procesando').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Vista general del negocio</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Ventas Totales"
          value={`$${(stats.totalSales / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          growth={stats.salesGrowth}
        />
        <StatsCard
          title="Pedidos"
          value={stats.totalOrders}
          icon={ShoppingCart}
          growth={stats.ordersGrowth}
        />
        <StatsCard
          title="Devoluciones"
          value={stats.totalReturns}
          icon={RotateCcw}
          growth={stats.returnsGrowth}
        />
        <StatsCard
          title="Clientes"
          value={stats.totalClients}
          icon={Users}
          growth={stats.clientsGrowth}
        />
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas mensuales */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Ventas por Mes (Pesos)</h3>
            <Badge variant="info">2024</Badge>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
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
            <LineChart data={salesData}>
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
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value} unidades`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} unidades`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Clientes registrados */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Clientes Registrados (Cantidad)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clientsRegistered}>
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
          <BarChart data={topProducts}>
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
            {mockTransactions
              .filter(t => t.status === 'Procesando')
              .slice(0, 5)
              .map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{transaction.userName}</p>
                      <p className="text-xs text-gray-600">
                        Pedido #{transaction.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${transaction.total.toLocaleString()}</p>
                    <p className="text-xs text-yellow-600">Procesando</p>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {/* Notificaciones recientes */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Notificaciones Recientes</h3>
          <div className="space-y-3">
            {mockNotifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${
                  !notification.read ? 'bg-gray-50 border-gray-300' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-2 w-2 rounded-full mt-2 ${
                      notification.type === 'success'
                        ? 'bg-green-500'
                        : notification.type === 'warning'
                        ? 'bg-yellow-500'
                        : notification.type === 'error'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pedidos recientes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pedidos Recientes (Pendientes)</h3>
        <div className="space-y-3">
          {mockTransactions
            .filter(t => t.status === 'Procesando')
            .slice(0, 5)
            .map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{transaction.userName}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(transaction.date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">${transaction.total.toLocaleString()} COP</p>
                  <Badge variant="warning">
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
        </div>
        {mockTransactions.filter(t => t.status === 'Procesando').length === 0 && (
          <p className="text-center text-gray-500 py-8">No hay pedidos pendientes</p>
        )}
      </Card>
    </div>
  );
}
