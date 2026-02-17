/**
 * 📊 NORMALIZADORES - Capa de validación sin modificar localStorage
 *
 * Funciones PURAS que validan y normalizan datos sin efectos secundarios.
 * Se usan SOLO para lectura en Dashboard y helpers.
 *
 * REGLAS:
 * ✅ NO modifican localStorage
 * ✅ NO tienen side effects
 * ✅ Devuelven datos corregidos o ignorados
 * ✅ Son determinísticas (mismo input = mismo output)
 */

// ============================================================
// TIPOS NORMALIZADOS
// ============================================================

export type EstadoClienteNormalizado = 'ACTIVO' | 'INACTIVO';
export type EstadoPedidoNormalizado = 'PENDIENTE' | 'ANULADO' | 'CONVERTIDO_A_VENTA';
export type EstadoVentaNormalizado = 'COMPLETADA' | 'ANULADA' | 'DEVUELTA';

/**
 * Cliente normalizado
 * Estructura canónica para Dashboard
 */
export interface ClienteNormalizado {
  id: string | number;
  nombre: string;
  estado: EstadoClienteNormalizado;
  activo: boolean;
  fechaCreacion: string; // ISO
}

/**
 * Pedido normalizado
 * Intención de compra, NO impacta contabilidad
 */
export interface PedidoNormalizado {
  id: string | number;
  clienteId: string | number;
  clienteNombre: string;
  estado: EstadoPedidoNormalizado;
  cantidad: number; // Items totales
  subtotal: number;
  iva: number;
  total: number;
  fechaCreacion: string; // ISO
  convertidoAVenta: boolean; // ¿Tiene venta_id?
}

/**
 * Venta normalizada
 * Fuente única de verdad contable
 */
export interface VentaNormalizada {
  id: string | number;
  clienteId: string | number;
  clienteNombre: string;
  pedidoId?: string | number;
  estado: EstadoVentaNormalizado;
  cantidad: number; // Items totales
  subtotal: number;
  iva: number;
  total: number;
  metodoPago: string;
  fechaISO: string; // ISO
  esContable: boolean; // ¿estado === 'COMPLETADA'?
}

// ============================================================
// NORMALIZADORES: CLIENTES
// ============================================================

/**
 * Normalizar estado de cliente a ACTIVO | INACTIVO
 */
function normalizarEstadoCliente(activo?: boolean | string): EstadoClienteNormalizado {
  if (typeof activo === 'boolean') {
    return activo ? 'ACTIVO' : 'INACTIVO';
  }

  if (typeof activo === 'string') {
    const lower = String(activo).toLowerCase();
    if (['activo', 'active', 'true', '1'].includes(lower)) return 'ACTIVO';
    if (['inactivo', 'inactive', 'false', '0'].includes(lower)) return 'INACTIVO';
  }

  return 'INACTIVO'; // Default seguro
}

/**
 * Validar cliente crudo y devolver normalizado
 * Si falta info crítica, devuelve null
 */
export function normalizarCliente(cliente: any): ClienteNormalizado | null {
  if (!cliente) return null;

  // Validaciones críticas
  const id = cliente.id;
  const nombre = String(cliente.nombre || '').trim();

  if (!id || !nombre) {
    console.warn('[NORMALIZERS] Cliente rechazado: falta id o nombre', cliente);
    return null;
  }

  const activo = cliente.activo;
  const estado = normalizarEstadoCliente(activo);

  // Intentar inferir fecha ISO
  let fechaCreacion = cliente.createdAt || new Date().toISOString();
  try {
    // Validar que sea fecha válida
    new Date(fechaCreacion).toISOString();
  } catch {
    fechaCreacion = new Date().toISOString();
  }

  return {
    id,
    nombre,
    estado,
    activo: estado === 'ACTIVO',
    fechaCreacion,
  };
}

/**
 * Normalizar lista completa de clientes
 */
export function normalizarClientes(clientes: any[]): ClienteNormalizado[] {
  if (!Array.isArray(clientes)) {
    console.warn('[NORMALIZERS] Clientes no es array:', typeof clientes);
    return [];
  }

  return clientes
    .map((c) => normalizarCliente(c))
    .filter((c): c is ClienteNormalizado => c !== null);
}

// ============================================================
// NORMALIZADORES: PEDIDOS
// ============================================================

/**
 * Normalizar estado de pedido
 */
function normalizarEstadoPedido(estado: any): EstadoPedidoNormalizado {
  if (!estado) return 'PENDIENTE';

  const lower = String(estado).toLowerCase();

  if (['pendiente', 'pending', 'nueva'].includes(lower)) return 'PENDIENTE';
  if (['anulado', 'anulada', 'cancelled'].includes(lower)) return 'ANULADO';
  if (
    [
      'convertido a venta',
      'convertido_a_venta',
      'converted',
      'completada',
      'completed',
    ].includes(lower)
  )
    return 'CONVERTIDO_A_VENTA';

  return 'PENDIENTE'; // Default
}

/**
 * Validar pedido crudo y devolver normalizado
 */
export function normalizarPedido(pedido: any): PedidoNormalizado | null {
  if (!pedido) return null;

  // Validaciones críticas
  const id = pedido.id;
  const clienteId = pedido.clienteId;
  const clienteNombre = String(pedido.clienteNombre || 'Desconocido').trim();

  if (!id || !clienteId) {
    console.warn('[NORMALIZERS] Pedido rechazado: falta id o clienteId', pedido);
    return null;
  }

  // Contar items
  const items = Array.isArray(pedido.items) ? pedido.items : [];
  const cantidad = items.reduce((sum, item) => sum + (item.cantidad || 0), 0);

  const estado = normalizarEstadoPedido(pedido.estado);
  const convertidoAVenta = !!pedido.venta_id;

  // Dinero
  const subtotal = Number(pedido.subtotal) || 0;
  const iva = Number(pedido.iva) || 0;
  const total = Number(pedido.total) || 0;

  // Fecha ISO
  let fechaCreacion = pedido.fechaPedido || pedido.createdAt || new Date().toISOString();
  try {
    new Date(fechaCreacion).toISOString();
  } catch {
    fechaCreacion = new Date().toISOString();
  }

  return {
    id,
    clienteId,
    clienteNombre,
    estado,
    cantidad,
    subtotal,
    iva,
    total,
    fechaCreacion,
    convertidoAVenta,
  };
}

/**
 * Normalizar lista de pedidos
 */
export function normalizarPedidos(pedidos: any[]): PedidoNormalizado[] {
  if (!Array.isArray(pedidos)) {
    console.warn('[NORMALIZERS] Pedidos no es array:', typeof pedidos);
    return [];
  }

  return pedidos
    .map((p) => normalizarPedido(p))
    .filter((p): p is PedidoNormalizado => p !== null);
}

// ============================================================
// NORMALIZADORES: VENTAS
// ============================================================

/**
 * Normalizar estado de venta
 */
function normalizarEstadoVenta(estado: any): EstadoVentaNormalizado {
  if (!estado) return 'COMPLETADA';

  const lower = String(estado).toLowerCase();

  if (['completada', 'completado', 'applied', 'aplicada'].includes(lower))
    return 'COMPLETADA';
  if (['anulada', 'anulado', 'cancelled'].includes(lower)) return 'ANULADA';
  if (['devuelta', 'devuelto', 'returned'].includes(lower)) return 'DEVUELTA';

  return 'COMPLETADA'; // Default
}

/**
 * Validar venta cruda y devolver normalizada
 */
export function normalizarVenta(venta: any): VentaNormalizada | null {
  if (!venta) return null;

  // Validaciones críticas
  const id = venta.id;
  const clienteId = venta.clienteId;
  const clienteNombre = String(venta.clienteNombre || 'Desconocido').trim();

  if (!id || !clienteId) {
    console.warn('[NORMALIZERS] Venta rechazada: falta id o clienteId', venta);
    return null;
  }

  // Contar items
  const items = Array.isArray(venta.items) ? venta.items : [];
  const cantidad = items.reduce((sum, item) => sum + (item.cantidad || 0), 0);

  const estado = normalizarEstadoVenta(venta.estado);
  const esContable = estado === 'COMPLETADA';
  const pedidoId = venta.pedido_id || venta.pedidoId;

  // Dinero
  const subtotal = Number(venta.subtotal) || 0;
  const iva = Number(venta.iva) || 0;
  const total = Number(venta.total) || 0;
  const metodoPago = String(venta.metodoPago || 'No especificado').trim();

  // Fecha ISO
  let fechaISO = venta.fechaVenta || venta.createdAt || new Date().toISOString();
  try {
    fechaISO = new Date(fechaISO).toISOString();
  } catch {
    fechaISO = new Date().toISOString();
  }

  return {
    id,
    clienteId,
    clienteNombre,
    pedidoId,
    estado,
    cantidad,
    subtotal,
    iva,
    total,
    metodoPago,
    fechaISO,
    esContable,
  };
}

/**
 * Normalizar lista de ventas
 */
export function normalizarVentas(ventas: any[]): VentaNormalizada[] {
  if (!Array.isArray(ventas)) {
    console.warn('[NORMALIZERS] Ventas no es array:', typeof ventas);
    return [];
  }

  return ventas
    .map((v) => normalizarVenta(v))
    .filter((v): v is VentaNormalizada => v !== null);
}

// ============================================================
// VALIDADORES: Integridad entre Pedidos y Ventas
// ============================================================

/**
 * Validar que una venta tenga cliente válido
 */
export function ventaTieneClienteValido(
  venta: VentaNormalizada,
  clientesNormalizados: ClienteNormalizado[]
): boolean {
  if (!venta.clienteId) return false;

  const existe = clientesNormalizados.some(
    (c) => String(c.id) === String(venta.clienteId)
  );

  if (!existe) {
    console.warn(
      `[NORMALIZERS] Venta ${venta.id} referencias cliente ${venta.clienteId} que no existe`
    );
  }

  return existe;
}

/**
 * Validar que un pedido tenga cliente válido
 */
export function pedidoTieneClienteValido(
  pedido: PedidoNormalizado,
  clientesNormalizados: ClienteNormalizado[]
): boolean {
  if (!pedido.clienteId) return false;

  const existe = clientesNormalizados.some(
    (c) => String(c.id) === String(pedido.clienteId)
  );

  if (!existe) {
    console.warn(
      `[NORMALIZERS] Pedido ${pedido.id} referencias cliente ${pedido.clienteId} que no existe`
    );
  }

  return existe;
}

// ============================================================
// FILTROS: Datos contables
// ============================================================

/**
 * Filtrar SOLO ventas que cuentan en métricas
 * Condiciones:
 * - Estado = COMPLETADA
 * - clienteId válido
 * - total > 0
 */
export function ventasContables(
  ventas: VentaNormalizada[],
  clientesNormalizados: ClienteNormalizado[]
): VentaNormalizada[] {
  return ventas.filter((v) => {
    if (!v.esContable) {
      return false; // Estado !== COMPLETADA
    }

    if (!ventaTieneClienteValido(v, clientesNormalizados)) {
      return false; // Cliente no existe
    }

    if (v.total <= 0) {
      console.warn(`[NORMALIZERS] Venta ${v.id} descartada: total <= 0`);
      return false; // Dinero inválido
    }

    return true;
  });
}

/**
 * Filtrar pedidos PENDIENTES
 */
export function pedidosPendientes(pedidos: PedidoNormalizado[]): PedidoNormalizado[] {
  return pedidos.filter((p) => p.estado === 'PENDIENTE');
}

/**
 * Filtrar pedidos CONVERTIDOS a venta
 */
export function pedidosConvertidos(pedidos: PedidoNormalizado[]): PedidoNormalizado[] {
  return pedidos.filter((p) => p.estado === 'CONVERTIDO_A_VENTA');
}

/**
 * Filtrar clientes ACTIVOS
 */
export function clientesActivos(
  clientes: ClienteNormalizado[]
): ClienteNormalizado[] {
  return clientes.filter((c) => c.estado === 'ACTIVO');
}

// ============================================================
// VALIDACIÓN: Estados mes actual
// ============================================================

/**
 * Comprobar si fecha está en mes actual
 */
export function estaMesActual(fechaISO: string): boolean {
  try {
    const fecha = new Date(fechaISO);
    const ahora = new Date();

    return (
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    );
  } catch {
    return false;
  }
}

/**
 * Filtrar ventas del mes actual
 */
export function ventasDelMesActual(ventas: VentaNormalizada[]): VentaNormalizada[] {
  return ventas.filter((v) => estaMesActual(v.fechaISO));
}

/**
 * Filtrar devoluciones del mes actual
 */
export function devolucionesDelMesActual(
  ventas: VentaNormalizada[]
): VentaNormalizada[] {
  return ventas.filter(
    (v) => v.estado === 'DEVUELTA' && estaMesActual(v.fechaISO)
  );
}

// ============================================================
// DEBUG: Reportes de integridad
// ============================================================

/**
 * Generar reporte de problemas encontrados
 */
export interface ReporteIntegridad {
  ventasConClienteInvalido: number;
  pedidosConClienteInvalido: number;
  ventasConTotalInvalido: number;
  pedidosSinConvertir: number;
}

/**
 * Auditar integridad de datos
 */
export function auditarIntegridad(
  ventasRaw: any[],
  pedidosRaw: any[],
  clientesRaw: any[]
): ReporteIntegridad {
  const ventasNorm = normalizarVentas(ventasRaw);
  const pedidosNorm = normalizarPedidos(pedidosRaw);
  const clientesNorm = normalizarClientes(clientesRaw);

  const reporte: ReporteIntegridad = {
    ventasConClienteInvalido: ventasNorm.filter(
      (v) => !ventaTieneClienteValido(v, clientesNorm)
    ).length,
    pedidosConClienteInvalido: pedidosNorm.filter(
      (p) => !pedidoTieneClienteValido(p, clientesNorm)
    ).length,
    ventasConTotalInvalido: ventasNorm.filter((v) => v.total <= 0).length,
    pedidosSinConvertir: pedidosPendientes(pedidosNorm).length,
  };

  if (Object.values(reporte).some((v) => v > 0)) {
    console.warn('[NORMALIZERS] ⚠️ Problemas de integridad detectados:', reporte);
  } else {
    console.log('[NORMALIZERS] ✅ Datos con integridad válida');
  }

  return reporte;
}
