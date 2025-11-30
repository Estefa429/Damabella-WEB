import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { TrendingUp, ShoppingCart, Users, RotateCcw } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const salesData = [
  { mes: 'Ene', ventas: 45000 },
  { mes: 'Feb', ventas: 52000 },
  { mes: 'Mar', ventas: 48000 },
  { mes: 'Abr', ventas: 61000 },
  { mes: 'May', ventas: 55000 },
  { mes: 'Jun', ventas: 67000 }
];

const topProducts = [
  { nombre: 'Vestido Largo Negro', ventas: 1250000, cantidad: 125 },
  { nombre: 'Set Casual Beige', ventas: 980000, cantidad: 98 },
  { nombre: 'Enterizo Elegante', ventas: 875000, cantidad: 87 },
  { nombre: 'Vestido Corto Rojo', ventas: 760000, cantidad: 76 }
];

const categoryData = [
  { nombre: 'Vestidos Largos', valor: 35, color: '#1f2937' },
  { nombre: 'Vestidos Cortos', valor: 28, color: '#4b5563' },
  { nombre: 'Sets', valor: 22, color: '#6b7280' },
  { nombre: 'Enterizos', valor: 15, color: '#9ca3af' }
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Bienvenida al panel administrativo de DAMABELLA</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-gray-600">Ventas del Mes</CardTitle>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900 mb-1">$67,000,000</div>
            <p className="text-sm text-green-600">+12.5% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-gray-600">Pedidos</CardTitle>
            <ShoppingCart className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900 mb-1">342</div>
            <p className="text-sm text-gray-600">28 pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-gray-600">Clientes</CardTitle>
            <Users className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900 mb-1">1,247</div>
            <p className="text-sm text-green-600">+23 nuevos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-gray-600">Devoluciones</CardTitle>
            <RotateCcw className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-gray-900 mb-1">12</div>
            <p className="text-sm text-yellow-600">2.8% del total</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Line type="monotone" dataKey="ventas" stroke="#1f2937" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nombre, valor }) => `${nombre} ${valor}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Productos Más Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="nombre" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Bar dataKey="ventas" fill="#1f2937" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { accion: 'Nuevo pedido registrado', detalle: 'Pedido #1024 - Vestido Largo Negro', usuario: 'Ana García', tiempo: 'Hace 5 minutos' },
              { accion: 'Devolución aprobada', detalle: 'Pedido #892 - Set Casual Beige', usuario: 'María López', tiempo: 'Hace 15 minutos' },
              { accion: 'Producto actualizado', detalle: 'Stock actualizado: Enterizo Elegante', usuario: 'Ana García', tiempo: 'Hace 1 hora' },
              { accion: 'Cliente registrado', detalle: 'Carolina Ruiz - cliente@example.com', usuario: 'Sistema', tiempo: 'Hace 2 horas' }
            ].map((actividad, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                <div className="w-2 h-2 bg-gray-900 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-gray-900">{actividad.accion}</p>
                  <p className="text-gray-600 text-sm">{actividad.detalle}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {actividad.usuario} • {actividad.tiempo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
