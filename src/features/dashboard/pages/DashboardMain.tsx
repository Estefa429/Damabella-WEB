import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, ShoppingBag, Package, RotateCcw, Truck, DollarSign, Loader } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  getDashboardSummary,
  getDineroVentasPorMes,
  getCantidadVentasPorMes,
  type DashboardSummary,
  type ProductoMasVendido,
  type DistribucionCategoria,
  type DatoMensual,
} from '../services/dashboardServices';

export default function DashboardMain() {
  console.log('🔴 [DashboardMain] Componente montándose...');

  // ============================================================
  // ESTADO
  // ============================================================
  const [summary, setSummary] = useState<DashboardSummary>({
    usersActive: 0,
    pendingOrders: 0,
    ventasMes: 0,
    dineroVentasMes: 0,
  });
  const [productosMasVendidos, setProductosMasVendidos] = useState<ProductoMasVendido[]>([]);
  const [distribucionCategorias, setDistribucionCategorias] = useState<DistribucionCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dineroVentasPorMes, setDineroVentasPorMes] = useState<DatoMensual[]>([]);
  const [cantidadVentasPorMes, setCantidadVentasPorMes] = useState<DatoMensual[]>([]);

  // ============================================================
  // CARGA DE DATOS - useEffect
  // ============================================================
  useEffect(() => {
    console.log('🔴 [DashboardMain] useEffect ejecutándose...');
    
    const loadDashboardData = async () => {
      try {
        console.log('🔴 [DashboardMain] Iniciando carga de datos...');
        setLoading(true);
        setError(null);

        // Cargar resumen principal y datos mensuales
        console.log('🔴 [DashboardMain] Llamando servicios...');
        const [summaryData, dineroData, cantidadData] = await Promise.all([
          getDashboardSummary(),
          getDineroVentasPorMes(),
          getCantidadVentasPorMes(),
        ]);
        
        console.log('🔴 [DashboardMain] Respuesta dineroData:', dineroData);
        console.log('🔴 [DashboardMain] Respuesta cantidadData:', cantidadData);

        // Actualizar estado
        setSummary(summaryData);
        setProductosMasVendidos(summaryData.productosMasVendidos || []);
        setDistribucionCategorias(summaryData.distribucionCategorias || []);
        setDineroVentasPorMes(dineroData || []);
        setCantidadVentasPorMes(cantidadData || []);

        if (summaryData.error) {
          console.log('🔴 [DashboardMain] Error en summaryData:', summaryData.error);
          setError(summaryData.error);
        }
      } catch (err: any) {
        console.error('🔴 [DashboardMain] Error crítico:', err);
        setError(err?.message || 'Error al cargar el dashboard');
      } finally {
        setLoading(false);
        console.log('🔴 [DashboardMain] Carga completada');
      }
    };

    loadDashboardData();
  }, []);

  // ============================================================
  // PREPARACIÓN DE DATOS PARA GRÁFICOS
  // ============================================================

  // Transformar productos más vendidos para el gráfico
  const topProductsData = useMemo(() => {
    return (productosMasVendidos || []).slice(0, 5).map((p) => ({
      name: p.nombre,
      sales: p.cantidad_vendida,
      revenue: p.ingresos,
    }));
  }, [productosMasVendidos]);

  // Transformar distribución de categorías para el gráfico
  const categoryData = useMemo(() => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#34d399', '#60a5fa'];
    return (distribucionCategorias || []).map((cat, index) => ({
      name: cat.categoria,
      value: cat.porcentaje,
      color: colors[index % colors.length],
    }));
  }, [distribucionCategorias]);

  // Stats cards
  const stats = [
    {
      title: 'Dinero en Ventas',
      value: `$${summary.dineroVentasMes.toLocaleString()}`,
      change: '',
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Pedidos Pendientes',
      value: String(summary.pendingOrders),
      change: '',
      trend: summary.pendingOrders > 0 ? 'down' : 'up',
      icon: Package,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Cantidad de Ventas',
      value: String(summary.ventasMes),
      change: '',
      trend: 'up',
      icon: ShoppingBag,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Usuarios Activos',
      value: String(summary.usersActive),
      change: '',
      trend: 'up',
      icon: Users,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  // ============================================================
  // DATOS PARA GRÁFICO DE VENTAS MENSUALES (simulado)
  // ============================================================
  const salesData = useMemo(() => {
    // Si tenemos datos del backend, los usamos
    if (dineroVentasPorMes.length > 0 && cantidadVentasPorMes.length > 0) {
      console.log('🔴 [DashboardMain] Usando datos reales del backend');
      return dineroVentasPorMes.map((dinero, index) => ({
        month: dinero.mes,
        ventas: dinero.valor,
        pedidos: cantidadVentasPorMes[index]?.valor || 0,
      }));
    }
    
    // Si no tenemos datos, generamos datos simulados
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      data.push({
        month: monthNames[d.getMonth()],
        ventas: Math.floor(Math.random() * summary.dineroVentasMes * 0.8),
        pedidos: Math.floor(Math.random() * summary.ventasMes * 0.8),
      });
    }
    
    return data;
  }, [dineroVentasPorMes, cantidadVentasPorMes, summary.dineroVentasMes, summary.ventasMes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">Vista general de tu tienda DAMABELLA</p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
            <p className="text-gray-600">Cargando datos del dashboard...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">⚠️ {error}</p>
        </div>
      )}

      {!loading && (
        <>
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
                  <div className="text-gray-900 font-semibold text-lg">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ventas por Mes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-gray-900 mb-4">Ventas mensuales (COP)</h3>
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
                      position: 'insideBottom' as const,
                      offset: -10
                    }}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    tickMargin={12}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(value) => `$${Number(value).toLocaleString()}`}  
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
                    label={({ name, value }) => `${name} ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Productos más vendidos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-4">Productos Más Vendidos (Top 5)</h3>
            {topProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProductsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#6366f1" name="Unidades Vendidas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No hay datos de productos disponibles</p>
            )}
          </div>

          {/* Resumen del período */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-4">Resumen del Período</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="pb-4 border-b">
                <span className="text-gray-600 block text-sm">Dinero en ventas</span>
                <span className="text-gray-900 font-semibold text-lg">${summary.dineroVentasMes.toLocaleString()}</span>
              </div>
              <div className="pb-4 border-b">
                <span className="text-gray-600 block text-sm">Cantidad de ventas</span>
                <span className="text-gray-900 font-semibold text-lg">{summary.ventasMes}</span>
              </div>
              <div className="pb-4 border-b">
                <span className="text-gray-600 block text-sm">Pedidos pendientes</span>
                <span className="text-gray-900 font-semibold text-lg">{summary.pendingOrders}</span>
              </div>
              <div className="pb-4 border-b">
                <span className="text-gray-600 block text-sm">Usuarios activos</span>
                <span className="text-gray-900 font-semibold text-lg">{summary.usersActive}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
