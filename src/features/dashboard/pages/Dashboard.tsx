import { StatsCard } from '../components/StatsCard';
import { Card, Badge } from '../../../shared/components/native';
import { DollarSign, ShoppingCart, RotateCcw, Users, Clock, Loader } from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';
import {
  getDashboardSummary,
  getProductosMasVendidos,
  getDistribucionCategorias,
  type DashboardSummary,
  type ProductoMasVendido,
  type DistribucionCategoria,
} from '../services/dashboardServices';
import { formatCOP } from '../utils/dashboardHelpers';
import {
  BarChart,
  Bar,
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
  // ESTADO PARA DATOS DEL DASHBOARD
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

  // ============================================================
  // CARGA DE DATOS - useEffect
  // ============================================================
  useEffect(() => {
    console.log('🔴 [DASHBOARD] useEffect ejecutándose...');
    
    const loadDashboardData = async () => {
      try {
        console.log('🔴 [DASHBOARD] Iniciando carga de datos...');
        setLoading(true);
        setError(null);

        // Cargar resumen principal
        console.log('🔴 [DASHBOARD] Llamando getDashboardSummary()...');
        const summaryData = await getDashboardSummary();
        console.log('🔴 [DASHBOARD] Respuesta getDashboardSummary:', summaryData);

        // Actualizar estado
        setSummary(summaryData);
        setProductosMasVendidos(summaryData.productosMasVendidos || []);
        setDistribucionCategorias(summaryData.distribucionCategorias || []);

        if (summaryData.error) {
          console.log('🔴 [DASHBOARD] Error en summaryData:', summaryData.error);
          setError(summaryData.error);
        }
      } catch (err: any) {
        console.error('🔴 [DASHBOARD] Error crítico:', err);
        setError(err?.message || 'Error al cargar el dashboard');
      } finally {
        setLoading(false);
        console.log('🔴 [DASHBOARD] Carga completada');
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
      ventas: p.cantidad_vendida,
      ingresos: p.ingresos,
    }));
  }, [productosMasVendidos]);

  // Transformar distribución de categorías para el gráfico
  const categoryDistribution = useMemo(() => {
    const colors = [
      '#374151', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6',
      '#6B7280', '#4B5563', '#8B9DC3', '#A0AEC0', '#CBD5E0',
    ];
    return (distribucionCategorias || []).map((cat, index) => ({
      name: cat.categoria,
      value: cat.porcentaje,
      color: colors[index % colors.length],
    }));
  }, [distribucionCategorias]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Vista general del negocio</p>
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
          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Ventas (Últimos 30 días)"
              value={formatCOP(summary.dineroVentasMes)}
              icon={DollarSign}
              growth={0}
            />
            <StatsCard
              title="Pedidos Pendientes"
              value={summary.pendingOrders.toString()}
              icon={ShoppingCart}
              growth={0}
            />
            <StatsCard
              title="Cantidad de Ventas (Últimos 30 días)"
              value={summary.ventasMes.toString()}
              icon={ShoppingCart}
              growth={0}
            />
            <StatsCard
              title="Usuarios Activos"
              value={summary.usersActive.toString()}
              icon={Users}
              growth={0}
            />
          </div>

          {/* Gráficas principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            {/* Productos más vendidos */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top 5 Productos Más Vendidos</h3>
              <div className="space-y-4">
                {topProductsData.length > 0 ? (
                  topProductsData.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-gray-600">{product.ventas} unidades</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatCOP(product.ingresos)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No hay datos disponibles</p>
                )}
              </div>
            </Card>
          </div>

          {/* Sección inferior: Resumen */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resumen de información */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Resumen del Periodo</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Dinero en ventas (Últimos 30 días)</span>
                  <span className="font-semibold">{formatCOP(summary.dineroVentasMes)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Cantidad de ventas (Últimos 30 días)</span>
                  <span className="font-semibold">{summary.ventasMes}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Pedidos pendientes</span>
                  <span className="font-semibold">{summary.pendingOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Usuarios activos</span>
                  <span className="font-semibold">{summary.usersActive}</span>
                </div>
              </div>
            </Card>

            {/* Categorías más vendidas */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Categorías Principales</h3>
              <div className="space-y-3">
                {distribucionCategorias.length > 0 ? (
                  distribucionCategorias.slice(0, 5).map((cat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">{cat.categoria}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{cat.porcentaje}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No hay datos disponibles</p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
