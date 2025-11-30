import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Package, Users, Truck, Target, Calendar } from 'lucide-react';

export default function DashboardAdvanced() {
  const [period, setPeriod] = useState('month');

  const performanceData = [
    { date: '2024-01', ventas: 42000, compras: 25000, utilidad: 17000, clientes: 145 },
    { date: '2024-02', ventas: 48000, compras: 28000, utilidad: 20000, clientes: 162 },
    { date: '2024-03', ventas: 51000, compras: 30000, utilidad: 21000, clientes: 178 },
    { date: '2024-04', ventas: 46000, compras: 27000, utilidad: 19000, clientes: 158 },
    { date: '2024-05', ventas: 55000, compras: 32000, utilidad: 23000, clientes: 192 },
    { date: '2024-06', ventas: 58000, compras: 33000, utilidad: 25000, clientes: 205 }
  ];

  const providerPerformance = [
    { proveedor: 'Textiles del Norte', pedidos: 45, cumplimiento: 95, calidad: 98 },
    { proveedor: 'Modas Internacional', pedidos: 38, cumplimiento: 92, calidad: 96 },
    { proveedor: 'Distribuidora Fashion', pedidos: 32, cumplimiento: 88, calidad: 94 },
    { proveedor: 'Importadora Elite', pedidos: 28, cumplimiento: 90, calidad: 95 },
    { proveedor: 'Telas Premium', pedidos: 25, cumplimiento: 93, calidad: 97 }
  ];

  const deliveryEfficiency = [
    { mes: 'Ene', entregados: 95, tardios: 5, cancelados: 2 },
    { mes: 'Feb', entregados: 96, tardios: 4, cancelados: 1 },
    { mes: 'Mar', entregados: 94, tardios: 6, cancelados: 2 },
    { mes: 'Abr', entregados: 97, tardios: 3, cancelados: 1 },
    { mes: 'May', entregados: 98, tardios: 2, cancelados: 1 },
    { mes: 'Jun', entregados: 97, tardios: 3, cancelados: 2 }
  ];

  const kpis = [
    {
      title: 'Margen de Utilidad',
      value: '43.1%',
      target: '40%',
      icon: Target,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Tasa de Conversión',
      value: '24.5%',
      target: '20%',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Valor Promedio Pedido',
      value: '$385',
      target: '$350',
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Rotación de Inventario',
      value: '8.2x',
      target: '7x',
      icon: Package,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Dashboard Avanzado</h2>
          <p className="text-gray-600">Métricas e indicadores en tiempo real</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="quarter">Último trimestre</option>
            <option value="year">Último año</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white`}>
                <kpi.icon size={24} />
              </div>
              <div className="text-right">
                <div className="text-gray-500">Meta: {kpi.target}</div>
              </div>
            </div>
            <div className="text-gray-600 mb-1">{kpi.title}</div>
            <div className="text-gray-900">{kpi.value}</div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`bg-gradient-to-r ${kpi.color} h-2 rounded-full`}
                style={{ width: '85%' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Performance Trends */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-gray-900 mb-4">Tendencias de Desempeño</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={performanceData}>
            <defs>
              <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorUtilidad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="ventas" stroke="#6366f1" fillOpacity={1} fill="url(#colorVentas)" name="Ventas ($)" />
            <Area type="monotone" dataKey="utilidad" stroke="#10b981" fillOpacity={1} fill="url(#colorUtilidad)" name="Utilidad ($)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rendimiento por Proveedor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Rendimiento por Proveedor</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={providerPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="proveedor" type="category" stroke="#6b7280" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="cumplimiento" fill="#6366f1" name="Cumplimiento %" />
              <Bar dataKey="calidad" fill="#10b981" name="Calidad %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Eficiencia de Entregas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Eficiencia de Entregas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={deliveryEfficiency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="entregados" stroke="#10b981" strokeWidth={2} name="Entregados %" />
              <Line type="monotone" dataKey="tardios" stroke="#f59e0b" strokeWidth={2} name="Tardíos %" />
              <Line type="monotone" dataKey="cancelados" stroke="#ef4444" strokeWidth={2} name="Cancelados %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-gray-900 mb-4">Métricas Detalladas por Periodo</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600">Periodo</th>
                <th className="text-left py-3 px-4 text-gray-600">Ventas</th>
                <th className="text-left py-3 px-4 text-gray-600">Compras</th>
                <th className="text-left py-3 px-4 text-gray-600">Utilidad</th>
                <th className="text-left py-3 px-4 text-gray-600">Margen %</th>
                <th className="text-left py-3 px-4 text-gray-600">Clientes</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((row) => (
                <tr key={row.date} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{row.date}</td>
                  <td className="py-3 px-4 text-gray-600">${row.ventas.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-600">${row.compras.toLocaleString()}</td>
                  <td className="py-3 px-4 text-green-600">${row.utilidad.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-900">
                    {((row.utilidad / row.ventas) * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-gray-600">{row.clientes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
