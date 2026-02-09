/**
 * 📊 DASHBOARD HELPERS - AUDITORÍA Y DEPURACIÓN
 *
 * ⚠️ OBJETIVO: Leer EXACTAMENTE los mismos datos que VentasManager, PedidosManager, ClientesManager
 *
 * REGLAS:
 * ✅ Solo lectura, sin modificaciones
 * ✅ Normalización defensiva de estados
 * ✅ console.log explícitos para depuración
 * ✅ Manejo robusto de datos faltantes
 * ⚠️ Si datos están vacíos, mostrar warning en consola
 */

// ============================================================
// IMPORTAR NORMALIZADORES
// ============================================================
import {
  normalizarClientes,
  normalizarPedidos,
  normalizarVentas,
  ventasContables,
  clientesActivos,
  pedidosPendientes,
  ventasDelMesActual,
  devolucionesDelMesActual,
  ventaTieneClienteValido,
  auditarIntegridad,
  type ClienteNormalizado,
  type PedidoNormalizado,
  type VentaNormalizada,
} from './normalizers';

// ============================================================
// PASO 0: AUDITORÍA DE localStorage
// ============================================================

/**
 * 🔍 Auditoría: Listar todas las keys en localStorage
 * Ejecutar al iniciar para verificar qué datos existen
 */
export function auditarLocalStorage(): void {
  console.group('🔍 [DASHBOARD AUDIT] localStorage Keys');
  console.log('='.repeat(60));

  const keys = Object.keys(localStorage);
  console.log(`Total de keys: ${keys.length}`);
  console.log('Keys encontradas:');

  keys.forEach((key) => {
    try {
      const data = localStorage.getItem(key);
      const parsed = data ? JSON.parse(data) : null;
      const tipo = Array.isArray(parsed) ? 'Array' : typeof parsed;
      const cantidad = Array.isArray(parsed) ? parsed.length : 'N/A';

      console.log(
        `  📦 ${key.padEnd(35)} | Tipo: ${tipo.padEnd(10)} | Items: ${cantidad}`
      );
    } catch {
      console.log(`  ❌ ${key.padEnd(35)} | [NO PARSEABLE]`);
    }
  });

  console.log('='.repeat(60));
  console.groupEnd();
}

// ============================================================
// PASO 1: NORMALIZACIÓN DE ESTADOS
// ============================================================

/**
 * Normalizar estado de venta a minúsculas y aceptar variantes
 */
function normalizarEstadoVenta(estado: any): string {
  if (!estado) return 'desconocido';
  const normalizado = String(estado).toLowerCase();

  // Mapear variantes a forma estándar
  if (['completada', 'completado', 'applied', 'aplicada'].includes(normalizado)) {
    return 'completada';
  }
  if (['anulada', 'anulado', 'cancelled'].includes(normalizado)) {
    return 'anulada';
  }
  if (['devuelta', 'devuelto'].includes(normalizado)) {
    return 'devuelta';
  }

  return normalizado;
}

/**
 * Normalizar estado de pedido
 */
function normalizarEstadoPedido(estado: any): string {
  if (!estado) return 'desconocido';
  const normalizado = String(estado).toLowerCase();

  if (['pendiente', 'pending'].includes(normalizado)) return 'pendiente';
  if (['completada', 'completado', 'completed'].includes(normalizado)) return 'completada';
  if (['anulado', 'anulada', 'cancelled'].includes(normalizado)) return 'anulado';
  if (['convertido a venta', 'convertido'].includes(normalizado)) return 'convertido';

  return normalizado;
}

/**
 * Normalizar estado de cliente
 */
function normalizarEstadoCliente(estado: any): string {
  if (!estado) return 'desconocido';
  const normalizado = String(estado).toLowerCase();

  if (['activo', 'active', 'verdadero', 'true'].includes(normalizado)) return 'activo';
  if (['inactivo', 'inactive', 'falso', 'false'].includes(normalizado)) return 'inactivo';

  return normalizado;
}

// ============================================================
// PASO 2: FUNCIONES DE LECTURA - localStorage
// ============================================================

/**
 * 📖 Leer VENTAS desde damabella_ventas (MISMO KEY que VentasManager)
 */
function getVentas(): any[] {
  try {
    const data = localStorage.getItem('damabella_ventas');
    const parsed = data ? JSON.parse(data) : [];

    if (!Array.isArray(parsed)) {
      console.warn('⚠️ [DASHBOARD] damabella_ventas NO es array:', typeof parsed);
      return [];
    }

    if (parsed.length === 0) {
      console.warn('⚠️ [DASHBOARD] damabella_ventas está VACÍO');
    } else {
      console.log(`✅ [DASHBOARD] Leyendo ${parsed.length} ventas de localStorage`);
    }

    return parsed;
  } catch (error) {
    console.error('❌ [DASHBOARD] Error leyendo damabella_ventas:', error);
    return [];
  }
}

/**
 * 📖 Leer PEDIDOS desde damabella_pedidos (MISMO KEY que PedidosManager)
 */
function getPedidos(): any[] {
  try {
    const data = localStorage.getItem('damabella_pedidos');
    const parsed = data ? JSON.parse(data) : [];

    if (!Array.isArray(parsed)) {
      console.warn('⚠️ [DASHBOARD] damabella_pedidos NO es array:', typeof parsed);
      return [];
    }

    if (parsed.length === 0) {
      console.warn('⚠️ [DASHBOARD] damabella_pedidos está VACÍO');
    } else {
      console.log(`✅ [DASHBOARD] Leyendo ${parsed.length} pedidos de localStorage`);
    }

    return parsed;
  } catch (error) {
    console.error('❌ [DASHBOARD] Error leyendo damabella_pedidos:', error);
    return [];
  }
}

/**
 * 📖 Leer CLIENTES desde damabella_clientes (MISMO KEY que ClientesManager)
 */
function getClientes(): any[] {
  try {
    const data = localStorage.getItem('damabella_clientes');
    const parsed = data ? JSON.parse(data) : [];

    if (!Array.isArray(parsed)) {
      console.warn('⚠️ [DASHBOARD] damabella_clientes NO es array:', typeof parsed);
      return [];
    }

    if (parsed.length === 0) {
      console.warn('⚠️ [DASHBOARD] damabella_clientes está VACÍO');
    } else {
      console.log(`✅ [DASHBOARD] Leyendo ${parsed.length} clientes de localStorage`);
    }

    return parsed;
  } catch (error) {
    console.error('❌ [DASHBOARD] Error leyendo damabella_clientes:', error);
    return [];
  }
}

/**
 * 📖 Leer PRODUCTOS desde damabella_productos (MISMO KEY que ProductosManager)
 */
function getProductos(): any[] {
  try {
    const data = localStorage.getItem('damabella_productos');
    const parsed = data ? JSON.parse(data) : [];

    if (!Array.isArray(parsed)) {
      console.warn('⚠️ [DASHBOARD] damabella_productos NO es array:', typeof parsed);
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('❌ [DASHBOARD] Error leyendo damabella_productos:', error);
    return [];
  }
}

/**
 * 📖 Leer CATEGORÍAS desde damabella_categorias
 */
function getCategorias(): any[] {
  try {
    const data = localStorage.getItem('damabella_categorias');
    const parsed = data ? JSON.parse(data) : [];

    if (!Array.isArray(parsed)) {
      console.warn('⚠️ [DASHBOARD] damabella_categorias NO es array:', typeof parsed);
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('❌ [DASHBOARD] Error leyendo damabella_categorias:', error);
    return [];
  }
}

/**
 * 📖 Leer DEVOLUCIONES desde damabella_devoluciones
 */
function getDevoluciones(): any[] {
  try {
    const data = localStorage.getItem('damabella_devoluciones');
    const parsed = data ? JSON.parse(data) : [];

    if (!Array.isArray(parsed)) {
      console.warn('⚠️ [DASHBOARD] damabella_devoluciones NO es array:', typeof parsed);
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('❌ [DASHBOARD] Error leyendo damabella_devoluciones:', error);
    return [];
  }
}

// ============================================================
// PASO 3: CÁLCULOS DE ESTADÍSTICAS
// ============================================================

/**
 * 💰 Calcular VENTAS DEL MES ACTUAL
 * SOLO ventas COMPLETADA con cliente válido que sumen en métricas
 */
export function getVentasDelMes(): number {
  // 🔍 AUDITORÍA DETALLADA - SOLO PARA "VENTAS DEL MES"
  console.group('📊 [AUDITORÍA] Cálculo de Ventas del Mes');
  console.log('='.repeat(70));

  // PASO 1: Leer datos RAW directamente de localStorage (sin normalizers)
  const ventasRaw = (() => {
    try {
      const data = localStorage.getItem('damabella_ventas');
      const parsed = data ? JSON.parse(data) : [];
      console.log(`✅ Leyendo localStorage: ${parsed.length} ventas totales`);
      return parsed;
    } catch (error) {
      console.error('❌ Error leyendo localStorage:', error);
      return [];
    }
  })();

  if (ventasRaw.length === 0) {
    console.log('⚠️ No hay ventas en localStorage');
    console.log('='.repeat(70));
    console.groupEnd();
    return 0;
  }

  // PASO 2: Inspeccionar estructura de primera venta
  console.log('\n📋 Estructura de primera venta:');
  const primeraVenta = ventasRaw[0];
  console.log({
    id: primeraVenta.id,
    numeroVenta: primeraVenta.numeroVenta,
    estado: primeraVenta.estado,
    fechaVenta: primeraVenta.fechaVenta,
    createdAt: primeraVenta.createdAt,
    total: primeraVenta.total,
    anulada: primeraVenta.anulada,
  });

  // PASO 3: Filtrar por ESTADO "Completada" (case-insensitive)
  console.log('\n🔍 Paso 1: Filtrando por estado COMPLETADA...');
  const ventasCompletadas = ventasRaw.filter((v) => {
    const estadoNormalizado = String(v.estado || '').toLowerCase().trim();
    const esCompletada = estadoNormalizado === 'completada';
    return esCompletada;
  });
  console.log(
    `   → Encontradas: ${ventasCompletadas.length} ventas con estado 'Completada'`
  );

  // PASO 4: Filtrar por MES ACTUAL
  console.log('\n🔍 Paso 2: Filtrando por mes actual...');
  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const anioActual = ahora.getFullYear();
  console.log(`   → Mes: ${mesActual + 1}/${anioActual} (JS month: ${mesActual})`);

  const ventasDelMesActual = ventasCompletadas.filter((v) => {
    // Intentar parsear fecha desde fechaVenta o createdAt
    let fecha: Date | null = null;

    if (v.fechaVenta) {
      try {
        fecha = new Date(v.fechaVenta);
      } catch {}
    }

    if (!fecha && v.createdAt) {
      try {
        fecha = new Date(v.createdAt);
      } catch {}
    }

    if (!fecha) {
      console.warn(`   ⚠️ Venta ${v.id} sin fecha válida (fechaVenta: ${v.fechaVenta}, createdAt: ${v.createdAt})`);
      return false;
    }

    const esMesActual = fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    
    if (!esMesActual && v.id === primeraVenta.id) {
      console.log(
        `   → Venta ${v.id}: ${fecha.toLocaleDateString('es-CO')} (mes: ${fecha.getMonth() + 1}/${fecha.getFullYear()}) - NO es mes actual`
      );
    }

    return esMesActual;
  });
  console.log(
    `   → Encontradas: ${ventasDelMesActual.length} ventas en mes actual`
  );

  // PASO 5: Verificar TOTALES
  console.log('\n🔍 Paso 3: Sumando totales...');
  const detalleVentas = ventasDelMesActual.map((v, idx) => ({
    id: v.id,
    numeroVenta: v.numeroVenta,
    fecha: v.fechaVenta || v.createdAt,
    estado: v.estado,
    total: Number(v.total || 0),
  }));

  if (detalleVentas.length > 0 && detalleVentas.length <= 10) {
    console.log('   Detalle de ventas:');
    detalleVentas.forEach((v) => {
      console.log(
        `   → #${v.numeroVenta} (ID: ${v.id}): $${Number(v.total).toLocaleString('es-CO')} (${v.fecha})`
      );
    });
  } else if (detalleVentas.length > 10) {
    console.log(
      `   Mostrando primeras 10 de ${detalleVentas.length} ventas:`
    );
    detalleVentas.slice(0, 10).forEach((v) => {
      console.log(
        `   → #${v.numeroVenta} (ID: ${v.id}): $${Number(v.total).toLocaleString('es-CO')}`
      );
    });
  }

  const totalCalculado = ventasDelMesActual.reduce((sum, v) => {
    const total = Number(v.total || 0);
    return sum + total;
  }, 0);

  console.log(`\n💰 TOTAL CALCULADO: $${totalCalculado.toLocaleString('es-CO')}`);
  console.log(`📊 Resumen:`);
  console.log(`   - Ventas totales: ${ventasRaw.length}`);
  console.log(`   - Ventas completadas: ${ventasCompletadas.length}`);
  console.log(`   - Ventas del mes actual: ${ventasDelMesActual.length}`);
  console.log(`   - Suma total (COP): ${totalCalculado}`);
  console.log('='.repeat(70));
  console.groupEnd();

  return totalCalculado;
}

/**
 * 📦 Calcular PEDIDOS PENDIENTES
 * Solo intención de compra, NO impacta contabilidad
 */
export function getPedidosPendientes(): number {
  const pedidosRaw = getPedidos();
  const clientesRaw = getClientes();

  const pedidosNorm = normalizarPedidos(pedidosRaw);
  const clientesNorm = normalizarClientes(clientesRaw);

  // Filtrar SOLO pendientes con cliente válido
  const pendientes = pedidosPendientes(pedidosNorm).filter((p) =>
    clientesNorm.some((c) => String(c.id) === String(p.clienteId))
  );

  console.log(`📦 [DASHBOARD] Pedidos pendientes: ${pendientes.length}`);

  return pendientes.length;
}

/**
 * 👥 Calcular CLIENTES ACTIVOS
 * Solo cuenta clientes con estado "Activo" (normalizado)
 */
export function getClientesActivos(): number {
  const clientesRaw = getClientes();

  const clientesNorm = normalizarClientes(clientesRaw);
  const activos = clientesActivos(clientesNorm);

  console.log(`👥 [DASHBOARD] Clientes activos: ${activos.length}`);

  return activos.length;
}

/**
 * ↩️ Calcular DEVOLUCIONES DEL MES
 */
export function getDevolucionesDelMes(): number {
  const ventasRaw = getVentas();
  const clientesRaw = getClientes();

  const ventasNorm = normalizarVentas(ventasRaw);
  const clientesNorm = normalizarClientes(clientesRaw);

  // Filtrar SOLO devoluciones del mes actual
  const devolucionesDelMes = devolucionesDelMesActual(
    ventasNorm.filter((v) => clientesNorm.some((c) => String(c.id) === String(v.clienteId)))
  );

  console.log(`↩️ [DASHBOARD] Devoluciones del mes: ${devolucionesDelMes.length}`);

  return devolucionesDelMes.length;
}

// ============================================================
// PASO 4: DATOS PARA GRÁFICOS
// ============================================================

/**
 * 📈 Datos para gráfico de ventas mensuales
 * Estructura: { month, ventas (total $), pedidos (cantidad) }
 */
export function getSalesMonthlyData(): Array<{
  month: string;
  ventas: number;
  pedidos: number;
}> {
  const ventasRaw = getVentas();
  const pedidosRaw = getPedidos();
  const clientesRaw = getClientes();

  const ventasNorm = normalizarVentas(ventasRaw);
  const pedidosNorm = normalizarPedidos(pedidosRaw);
  const clientesNorm = normalizarClientes(clientesRaw);

  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const datos: Record<
    number,
    { month: string; ventas: number; pedidos: number }
  > = {};

  // Inicializar todos los meses
  meses.forEach((mes, idx) => {
    datos[idx] = { month: mes, ventas: 0, pedidos: 0 };
  });

  // Agrupar ventas completadas por mes
  ventasContables(ventasNorm, clientesNorm).forEach((v) => {
    try {
      const fecha = new Date(v.fechaISO);
      const mes = fecha.getMonth();
      if (datos[mes]) {
        datos[mes].ventas += v.total || 0;
      }
    } catch {
      // Ignorar fechas inválidas
    }
  });

  // Agrupar pedidos por mes
  pedidosNorm.forEach((p) => {
    try {
      const fecha = new Date(p.fechaCreacion);
      const mes = fecha.getMonth();
      if (datos[mes]) {
        datos[mes].pedidos += 1;
      }
    } catch {
      // Ignorar fechas inválidas
    }
  });

  const resultado = Object.values(datos);

  console.log(`📈 [DASHBOARD] Datos de ventas mensuales preparados (${resultado.length} meses)`);

  return resultado;
}

/**
 * 🥧 Distribución de productos por categoría
 * Estructura: { name, value (%), color }
 */
export function getCategoryDistribution(): Array<{
  name: string;
  value: number;
  color: string;
}> {
  const productos = getProductos();
  const categorias = getCategorias();

  // Crear mapa de categorías por ID
  const categoriaMap = new Map(categorias.map((c) => [c.id, c.nombre]));

  // Contar productos por categoría (solo activos)
  const conteo: Record<string, number> = {};
  let totalProductos = 0;

  productos.forEach((p) => {
    if (p.activo !== false) {
      // Solo contar productos activos
      const categoriaNombre = categoriaMap.get(p.categoriaId) || 'Sin categoría';
      conteo[categoriaNombre] = (conteo[categoriaNombre] || 0) + 1;
      totalProductos += 1;
    }
  });

  // Colores predefinidos
  const colores = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
  ];

  const resultado = Object.entries(conteo)
    .map(([nombre, cantidad], idx) => ({
      name: nombre,
      value: totalProductos > 0 ? Math.round((cantidad / totalProductos) * 100) : 0,
      color: colores[idx % colores.length],
    }))
    .sort((a, b) => b.value - a.value);

  console.log(`🥧 [DASHBOARD] Distribución de categorías: ${resultado.length} categorías`);

  return resultado;
}

/**
 * 🏆 Top 5 productos más vendidos
 */
export function getTopProducts(limit: number = 5): Array<{
  name: string;
  ventas: number;
  ingresos: number;
}> {
  const ventasRaw = getVentas();
  const productosRaw = getProductos();
  const clientesRaw = getClientes();

  const ventasNorm = normalizarVentas(ventasRaw);
  const clientesNorm = normalizarClientes(clientesRaw);
  const productos = productosRaw;

  // Crear mapa de productos por ID
  const productoMap = new Map(productos.map((p) => [p.id, p.nombre]));

  // Contar cantidad y monto por producto
  const conteo: Record<
    string,
    { nombre: string; cantidad: number; monto: number }
  > = {};

  ventasContables(ventasNorm, clientesNorm).forEach((v) => {
    (v as any).items || [];
    // Access items from raw venta to get product details
    const ventaRaw = ventasRaw.find((vr) => String(vr.id) === String(v.id));
    (ventaRaw?.items || []).forEach((item: any) => {
      const productoId = item.productoId;
      const productoNombre =
        item.productoNombre || productoMap.get(productoId) || 'Desconocido';

      if (!conteo[productoId]) {
        conteo[productoId] = { nombre: productoNombre, cantidad: 0, monto: 0 };
      }

      conteo[productoId].cantidad += item.cantidad || 0;
      conteo[productoId].monto += item.subtotal || 0;
    });
  });

  const resultado = Object.values(conteo)
    .map((p) => ({
      name: p.nombre,
      ventas: p.cantidad,
      ingresos: p.monto,
    }))
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, limit);

  console.log(`🏆 [DASHBOARD] Top ${limit} productos: ${resultado.length} productos`);

  return resultado;
}

/**
 * 📊 Clientes registrados por mes
 */
export function getClientsRegisteredMonthly(): Array<{
  month: string;
  clientes: number;
}> {
  const clientesRaw = getClientes();
  const clientesNorm = normalizarClientes(clientesRaw);

  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const conteo: Record<number, number> = {};

  meses.forEach((_, idx) => {
    conteo[idx] = 0;
  });

  clientesNorm.forEach((c) => {
    try {
      const fecha = new Date(c.fechaCreacion);
      const mes = fecha.getMonth();
      conteo[mes] = (conteo[mes] || 0) + 1;
    } catch {
      // Ignorar fechas inválidas
    }
  });

  const resultado = meses.map((mes, idx) => ({
    month: mes,
    clientes: conteo[idx] || 0,
  }));

  console.log(
    `📊 [DASHBOARD] Clientes registrados por mes: ${clientesNorm.length} total`
  );

  return resultado;
}

// ============================================================
// PASO 5: DATOS PARA TABLAS
// ============================================================

/**
 * 📋 Últimos 5 pedidos pendientes
 */
export function getPendingOrdersTable(limit: number = 5): Array<{
  id: string;
  clienteNombre: string;
  productoNombre: string;
  monto: number;
  estado: string;
  fecha: string;
}> {
  const pedidosRaw = getPedidos();
  const productosRaw = getProductos();
  const clientesRaw = getClientes();

  const pedidosNorm = normalizarPedidos(pedidosRaw);
  const clientesNorm = normalizarClientes(clientesRaw);

  // Mapas para búsqueda rápida
  const productoMap = new Map(productosRaw.map((p) => [p.id, p.nombre]));
  const clienteMap = new Map(clientesNorm.map((c) => [String(c.id), c.nombre]));

  // Filtrar pedidos pendientes con cliente válido y transformar
  const resultado = pedidosPendientes(pedidosNorm)
    .filter((p) => clientesNorm.some((c) => String(c.id) === String(p.clienteId)))
    .sort((a, b) => {
      const fechaA = new Date(a.fechaCreacion).getTime();
      const fechaB = new Date(b.fechaCreacion).getTime();
      return fechaB - fechaA; // Más recientes primero
    })
    .slice(0, limit)
    .map((pedido) => {
      const cliente = clienteMap.get(String(pedido.clienteId)) || 'Desconocido';
      
      // Get first product from raw pedido to get product details
      const pedidoRaw = pedidosRaw.find((pr) => String(pr.id) === String(pedido.id));
      const primerProducto = pedidoRaw?.productos?.[0];
      const producto = primerProducto
        ? productoMap.get(primerProducto.productoId) ||
          primerProducto.productoNombre ||
          'Desconocido'
        : 'Desconocido';

      const monto = pedidoRaw?.productos
        ? pedidoRaw.productos.reduce(
            (sum, p) => sum + (p.precioVenta * p.cantidad || 0),
            0
          )
        : 0;

      return {
        id: String(pedido.id),
        clienteNombre: String(cliente),
        productoNombre: String(producto),
        monto: monto,
        estado: pedido.estado.toLowerCase(),
        fecha: new Date(pedido.fechaCreacion).toLocaleDateString('es-CO'),
      };
    });

  console.log(`📋 [DASHBOARD] Pedidos pendientes para tabla: ${resultado.length}`);

  return resultado;
}

// ============================================================
// UTILIDADES
// ============================================================

/**
 * 💱 Formatear número a moneda COP
 */
export function formatCOP(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '$0';
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * 🔄 Suscriptor para cambios en localStorage
 * Permite que Dashboard reaccione a cambios en otros módulos
 */
export function subscribeToStorageChanges(
  callback: () => void
): () => void {
  const handleStorageChange = (event: StorageEvent) => {
    // Reaccionar solo si cambió alguna de nuestras keys
    const keysOfInterest = [
      'damabella_ventas',
      'damabella_pedidos',
      'damabella_clientes',
      'damabella_categorias',
      'damabella_productos',
      'damabella_devoluciones',
    ];

    if (keysOfInterest.includes(event.key || '')) {
      console.log(
        `🔄 [DASHBOARD] Cambio detectado en ${event.key}, recalculando...`
      );
      callback();
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Retornar función para desuscribirse
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}
