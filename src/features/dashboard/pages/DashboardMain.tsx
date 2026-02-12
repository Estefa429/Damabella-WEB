import React from 'react';
import { TrendingUp, TrendingDown, Users, ShoppingBag, Package, RotateCcw, Truck, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardMain() {
  // Leer datos reales desde localStorage (solo lectura)
  const ventasStored = JSON.parse(localStorage.getItem('damabella_ventas') || '[]');
  const pedidosStored = JSON.parse(localStorage.getItem('damabella_pedidos') || '[]');
  const clientesStored = JSON.parse(localStorage.getItem('damabella_clientes') || '[]');
  const devolucionesStored = JSON.parse(localStorage.getItem('damabella_devoluciones') || '[]');

  // 1) Ventas del Mes: sumar el total de todas las ventas registradas (no creamos filtros nuevos)
  const ventasTotal = (ventasStored || []).reduce((acc: number, v: any) => acc + Number(v.total || 0), 0);

  // 2) Pedidos Pendientes: contar pedidos con estado exactamente 'Pendiente'
  const pedidosPendientesCount = (pedidosStored || []).filter((p: any) => p?.estado === 'Pendiente').length;

  // 3) Clientes Activos: contar clientes con campo 'activo' truthy (boolean o string)
  const clientesActivosCount = (clientesStored || []).filter((c: any) => {
    if (c == null) return false;
    if (typeof c.activo === 'boolean') return c.activo === true;
    return String(c.activo).toLowerCase() === 'true';
  }).length;

  // 4) Devoluciones (incluye cambios): contar entradas en la llave de devoluciones
  const devolucionesCount = (devolucionesStored || []).length;

  const stats = [
    {
      title: 'Ventas del Mes',
      value: `$${ventasTotal.toLocaleString()}`,
      change: '',
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Pedidos Pendientes',
      value: String(pedidosPendientesCount),
      change: '',
      trend: pedidosPendientesCount > 0 ? 'down' : 'up',
      icon: Package,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Clientes Activos',
      value: String(clientesActivosCount),
      change: '',
      trend: 'up',
      icon: Users,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Devoluciones',
      value: String(devolucionesCount),
      change: '',
      trend: 'up',
      icon: RotateCcw,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  // 1) Construir ventas mensuales (últimos 6 meses) a partir de `damabella_ventas`
  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const now = new Date();
  const months: { key: string; label: string; year: number; month: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`; // e.g. 2026-2
    months.push({ key, label: monthNames[d.getMonth()], year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const ventasByMonth: Record<string, { ventas: number; pedidos: number }> = {};
  months.forEach((m) => { ventasByMonth[m.key] = { ventas: 0, pedidos: 0 }; });

  (ventasStored || []).forEach((v: any) => {
    try {
      const fecha = v?.fechaVenta ? new Date(v.fechaVenta) : null;
      if (!fecha || isNaN(fecha.getTime())) return;
      const key = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;
      if (ventasByMonth[key]) {
        ventasByMonth[key].ventas += Number(v.total || 0);
        ventasByMonth[key].pedidos += 1;
      }
    } catch (err) {
      // ignorar registros inválidos
      return;
    }
  });

  const salesData = months.map((m) => ({ month: m.label, ventas: ventasByMonth[m.key]?.ventas || 0, pedidos: ventasByMonth[m.key]?.pedidos || 0 }));

  // Leer productos y categorías desde localStorage (necesario antes de calcular topProducts)
  const productosStored = JSON.parse(localStorage.getItem('damabella_productos') || '[]');
  const categoriasStored = JSON.parse(localStorage.getItem('damabella_categorias') || '[]');

  // Productos más vendidos: agregar unidades y revenue desde damabella_ventas
  const productSalesMap: Record<string, { units: number; revenue: number }> = {};
  (ventasStored || []).forEach((v: any) => {
    const items = v?.items || [];
    items.forEach((it: any) => {
      const prodId = String(it.productoId ?? it.producto_id ?? it.productoId ?? '');
      if (!prodId) return;
      const qty = Number(it.cantidad ?? it.quantity ?? 1) || 0;
      const subtotal = Number(it.subtotal ?? (it.precioUnitario ? it.precioUnitario * qty : 0)) || 0;
      if (!productSalesMap[prodId]) productSalesMap[prodId] = { units: 0, revenue: 0 };
      productSalesMap[prodId].units += qty;
      productSalesMap[prodId].revenue += subtotal;
    });
  });

  const topProducts = Object.keys(productSalesMap)
    .map((id) => {
      const prod = (productosStored || []).find((p: any) => String(p.id) === String(id));
      return {
        name: prod?.nombre || prod?.name || `#${id}`,
        sales: productSalesMap[id].units,
        revenue: productSalesMap[id].revenue
      };
    })
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // 2) Distribución porcentual por categoría usando ventas reales
  

  // Determinar lista de categorías a considerar: preferir damabella_categorias, si no hay, derivar de productos
  let categoryNames: string[] = [];
  if (Array.isArray(categoriasStored) && categoriasStored.length > 0) {
    categoryNames = categoriasStored.map((c: any) => c.name).filter(Boolean);
  } else if (Array.isArray(productosStored) && productosStored.length > 0) {
    const set = new Set<string>();
    productosStored.forEach((p: any) => {
      const cat = p.categoria || p.category || null;
      if (cat) set.add(cat);
    });
    categoryNames = Array.from(set);
  }

  const totalsByCategory: Record<string, number> = {};
  categoryNames.forEach((c) => (totalsByCategory[c] = 0));

  (ventasStored || []).forEach((v: any) => {
    const items = v?.items || [];
    items.forEach((it: any) => {
      const prodId = it.productoId ?? it.productoId;
      const producto = (productosStored || []).find((p: any) => String(p.id) === String(prodId));
      const categoria = producto ? (producto.categoria || producto.category) : null;
      if (!categoria) return;
      if (!totalsByCategory.hasOwnProperty(categoria)) return; // no crear nuevas categorías
      const monto = Number(it.subtotal ?? (it.precioUnitario ? it.precioUnitario * (it.cantidad || 1) : 0)) || 0;
      totalsByCategory[categoria] += monto;
    });
  });

  const totalAll = Object.values(totalsByCategory).reduce((s, n) => s + n, 0) || 0;
  const palette = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#34d399', '#60a5fa'];
  const categoryData = categoryNames.map((name, idx) => ({ name, value: totalsByCategory[name] || 0, color: palette[idx % palette.length] }));

  // Pedidos recientes: derivar pendientes desde damabella_pedidos
  const recentOrders = (pedidosStored || []).map((p: any) => {
    const id = p?.numeroPedido ?? (typeof p.id !== 'undefined' ? `PED-${p.id}` : '—');
    const customer = p?.clienteNombre || p?.cliente?.nombre || 'Cliente desconocido';
    const firstItem = Array.isArray(p?.items) && p.items.length > 0 ? p.items[0] : null;
    const productName = firstItem
      ? ((productosStored || []).find((pr: any) => String(pr.id) === String(firstItem.productoId))?.nombre || firstItem.productoNombre || firstItem.nombre || '—')
      : '—';
    const amount = Number(p?.total ?? p?.subtotal ?? (firstItem ? (Number(firstItem.subtotal ?? (firstItem.precioUnitario ? firstItem.precioUnitario * (firstItem.cantidad || 1) : 0))) : 0)) || 0;
    return {
      id,
      customer,
      product: productName,
      amount,
      status: p?.estado ?? 'Pendiente'
    };
  });

  const pendingOrders = recentOrders.filter((order) => order.status === 'Pendiente');

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
