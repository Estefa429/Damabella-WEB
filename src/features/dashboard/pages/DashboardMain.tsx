import React from 'react';
import { TrendingUp, TrendingDown, Users, ShoppingBag, Package, RotateCcw, Truck, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardMain() {
  const stats = [
    {
      title: 'Ventas del Mes',
      value: '$45,280',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Pedidos Pendientes',
      value: '28',
      change: '-5.2%',
      trend: 'down',
      icon: Package,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Clientes Activos',
      value: '1,245',
      change: '+8.1%',
      trend: 'up',
      icon: Users,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Devoluciones',
      value: '12',
      change: '+2.3%',
      trend: 'up',
      icon: RotateCcw,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const salesData = [
    { month: 'Ene', ventas: 35000, pedidos: 120 },
    { month: 'Feb', ventas: 42000, pedidos: 145 },
    { month: 'Mar', ventas: 38000, pedidos: 132 },
    { month: 'Abr', ventas: 51000, pedidos: 178 },
    { month: 'May', ventas: 48000, pedidos: 165 },
    { month: 'Jun', ventas: 45280, pedidos: 152 }
  ];

  const topProducts = [
    { name: 'Vestido Largo Elegante', sales: 45, revenue: 22500 },
    { name: 'Set Casual Primavera', sales: 38, revenue: 19000 },
    { name: 'Vestido Corto Floral', sales: 32, revenue: 16000 },
    { name: 'Enterizo Formal', sales: 28, revenue: 14000 },
    { name: 'Set Ejecutivo', sales: 25, revenue: 12500 }
  ];

  const categoryData = [
    { name: 'Vestidos Largos', value: 35, color: '#6366f1' },
    { name: 'Vestidos Cortos', value: 28, color: '#8b5cf6' },
    { name: 'Sets', value: 22, color: '#ec4899' },
    { name: 'Enterizos', value: 15, color: '#f59e0b' }
  ];

  const recentOrders = [
    { id: 'PED-001', customer: 'María González', product: 'Vestido Largo Elegante', amount: 450, status: 'Enviado' },
    { id: 'PED-002', customer: 'Ana Rodríguez', product: 'Set Casual', amount: 380, status: 'Pendiente' },
    { id: 'PED-003', customer: 'Laura Martínez', product: 'Enterizo Formal', amount: 520, status: 'Enviado' },
    { id: 'PED-004', customer: 'Carmen Silva', product: 'Vestido Corto', amount: 290, status: 'En Proceso' },
    { id: 'PED-005', customer: 'Sofía Torres', product: 'Set Ejecutivo', amount: 410, status: 'Devolución' }
  ];

  const pendingOrders = recentOrders.filter(
    (order) => order.status === 'Pendiente'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">Vista general de tu tienda DAMABELLA</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                  <stat.icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {stat.change}
                </div>
              </div>
              <div className="text-gray-600 mb-1">{stat.title}</div>
              <div className="text-gray-900">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por Mes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">
            Ventas mensuales (COP) 
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart 
            data={salesData}
            margin={{top: 20, right: 20, left: 60, bottom: 20}}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

              <XAxis 
              dataKey="month" 
              stroke="#6b7280" 
              label={{
                value: 'Mes',
                position: 'InsideBottom',
                offset: -10
                }}
                />

              <YAxis 
              stroke="#6b7280" 
              tickMargin={12}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            
                />

              <Tooltip
                formatter={(value) =>
                   `$${Number(value).toLocaleString()}`}  
              />

              <Legend />

              <Line type="monotone" dataKey="ventas" stroke="#6366f1" strokeWidth={2} name="Ventas" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución por Categoría */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Distribución porcentual de ventas por categoría</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Productos más vendidos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-gray-900 mb-4">Productos Más Vendidos</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topProducts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="sales" fill="#6366f1" name="Unidades Vendidas" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pedidos Recientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-gray-900 mb-4">Pedidos Pendientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600">ID</th>
                <th className="text-left py-3 px-4 text-gray-600">Cliente</th>
                <th className="text-left py-3 px-4 text-gray-600">Producto</th>
                <th className="text-left py-3 px-4 text-gray-600">Monto</th>
                <th className="text-left py-3 px-4 text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{order.id}</td>
                  <td className="py-3 px-4 text-gray-600">{order.customer}</td>
                  <td className="py-3 px-4 text-gray-600">{order.product}</td>
                  <td className="py-3 px-4 text-gray-900">${order.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                      order.status === 'Enviado' ? 'bg-green-100 text-green-700' :
                      order.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'Devolución' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
