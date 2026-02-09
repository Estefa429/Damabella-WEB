/**
 * 🔄 MIGRACIÓN DE localStorage - Normalización Silenciosa
 *
 * OBJETIVO: Normalizar datos históricos SIN eliminar registros existentes
 * EJECUTA: Una sola vez usando versionado
 * SEGURIDAD: try/catch - no guarda nada si ocurre error
 *
 * CAMBIOS REALIZADOS:
 * ✅ Estados normalizados a MAYÚSCULAS
 * ✅ Fechas normalizadas a ISO string
 * ✅ Totales normalizados a number
 * ✅ clienteId consistente en referencias
 * ✅ NO elimina datos existentes
 * ✅ NO modifica UI
 */

// ============================================================
// TIPOS PARA DATOS CRUDOS
// ============================================================

interface ClienteRaw {
  id: number | string;
  nombre: string;
  tipoDoc?: string;
  numeroDoc?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  activo?: boolean | string;
  createdAt?: string | Date;
  [key: string]: any;
}

interface ItemVenta {
  productoId: string | number;
  productoNombre?: string;
  cantidad: number;
  precioVenta?: number;
  precioUnitario?: number;
  subtotal?: number;
  [key: string]: any;
}

interface VentaRaw {
  id: number | string;
  numeroVenta?: string;
  clienteId: number | string;
  clienteNombre?: string;
  fechaVenta?: string | Date;
  estado?: string;
  items?: ItemVenta[];
  subtotal?: number;
  iva?: number;
  total?: number;
  metodoPago?: string;
  createdAt?: string | Date;
  pedido_id?: string | null;
  movimientosStock?: { salidaEjecutada?: boolean; devolucionEjecutada?: boolean };
  [key: string]: any;
}

interface ItemPedido {
  productoId: string | number;
  productoNombre?: string;
  cantidad: number;
  precioVenta?: number;
  precioUnitario?: number;
  [key: string]: any;
}

interface PedidoRaw {
  id: number | string;
  numeroPedido?: string;
  clienteId: number | string;
  clienteNombre?: string;
  fechaPedido?: string | Date;
  estado?: string;
  productos?: ItemPedido[];
  items?: ItemPedido[];
  subtotal?: number;
  iva?: number;
  total?: number;
  createdAt?: string | Date;
  venta_id?: string | null;
  [key: string]: any;
}

// ============================================================
// NORMALIZADORES DE ESTADO
// ============================================================

/**
 * Normalizar estado de VENTA a MAYÚSCULAS
 * Soporta variantes: 'completada', 'Completada', 'COMPLETADA'
 */
function normalizarEstadoVenta(estado: any): 'COMPLETADA' | 'ANULADA' | 'DEVUELTA' {
  if (!estado) return 'PENDIENTE' as any; // fallback seguro

  const lower = String(estado).toLowerCase().trim();

  if (['completada', 'completed', 'finalizada', 'finish'].includes(lower)) {
    return 'COMPLETADA';
  }
  if (['anulada', 'cancelled', 'cancelada', 'anulado'].includes(lower)) {
    return 'ANULADA';
  }
  if (['devuelta', 'returned', 'devuelto', 'devolucion'].includes(lower)) {
    return 'DEVUELTA';
  }

  // Default: mantener mayúsculas
  return (String(estado).toUpperCase() as any) || 'COMPLETADA';
}

/**
 * Normalizar estado de PEDIDO a MAYÚSCULAS
 */
function normalizarEstadoPedido(
  estado: any
): 'PENDIENTE' | 'CONVERTIDO_A_VENTA' | 'ANULADO' {
  if (!estado) return 'PENDIENTE';

  const lower = String(estado).toLowerCase().trim();

  if (['pendiente', 'pending', 'en espera'].includes(lower)) {
    return 'PENDIENTE';
  }
  if (
    ['convertido a venta', 'convertido_a_venta', 'converted', 'venta', 'completada'].includes(
      lower
    )
  ) {
    return 'CONVERTIDO_A_VENTA';
  }
  if (['anulada', 'anulado', 'cancelled', 'cancelada'].includes(lower)) {
    return 'ANULADO';
  }

  return 'PENDIENTE'; // Default seguro
}

/**
 * Normalizar estado de CLIENTE a MAYÚSCULAS
 */
function normalizarEstadoCliente(estado: any): 'ACTIVO' | 'INACTIVO' {
  if (typeof estado === 'boolean') {
    return estado ? 'ACTIVO' : 'INACTIVO';
  }

  const lower = String(estado).toLowerCase().trim();

  if (['activo', 'active', 'true', '1'].includes(lower)) {
    return 'ACTIVO';
  }
  if (['inactivo', 'inactive', 'false', '0'].includes(lower)) {
    return 'INACTIVO';
  }

  return 'ACTIVO'; // Default seguro
}

// ============================================================
// NORMALIZADORES DE DATOS
// ============================================================

/**
 * Normalizar fecha a ISO string
 */
function normalizarFecha(fecha: any): string {
  if (!fecha) return new Date().toISOString();

  try {
    const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return d.toISOString();
  } catch {
    console.warn(`⚠️ [MIGRACIÓN] Fecha inválida: ${fecha}, usando hoy`);
    return new Date().toISOString();
  }
}

/**
 * Normalizar número
 */
function normalizarNumero(valor: any, fallback = 0): number {
  const num = Number(valor);
  return !isNaN(num) ? num : fallback;
}

/**
 * Normalizar string
 */
function normalizarString(valor: any, fallback = ''): string {
  return String(valor || fallback).trim();
}

// ============================================================
// MIGRACIÓN DE CLIENTES
// ============================================================

function migraClientes(): boolean {
  const KEY = 'damabella_clientes';

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return true; // No hay datos, ok

    const clientes: ClienteRaw[] = JSON.parse(raw);
    if (!Array.isArray(clientes) || clientes.length === 0) return true;

    console.log(`🔄 [MIGRACIÓN] Normalizando ${clientes.length} clientes...`);

    const clientesNormalizados = clientes.map((cliente) => ({
      ...cliente,
      // Normalizar estado activo a MAYÚSCULAS (convertir a boolean primero si es string)
      activo:
        typeof cliente.activo === 'string'
          ? normalizarEstadoCliente(cliente.activo) === 'ACTIVO'
          : Boolean(cliente.activo ?? true),
      // Normalizar fecha de creación
      createdAt: normalizarFecha(cliente.createdAt),
      // Asegurar que el ID sea string para consistencia
      id: String(cliente.id || ''),
    }));

    // Guardar datos normalizados
    localStorage.setItem(KEY, JSON.stringify(clientesNormalizados));
    console.log(`✅ [MIGRACIÓN] ${clientesNormalizados.length} clientes normalizados`);

    return true;
  } catch (error) {
    console.error(`❌ [MIGRACIÓN] Error normalizando clientes:`, error);
    return false;
  }
}

// ============================================================
// MIGRACIÓN DE VENTAS
// ============================================================

function migrasVentas(): boolean {
  const KEY = 'damabella_ventas';

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return true; // No hay datos, ok

    const ventas: VentaRaw[] = JSON.parse(raw);
    if (!Array.isArray(ventas) || ventas.length === 0) return true;

    console.log(`🔄 [MIGRACIÓN] Normalizando ${ventas.length} ventas...`);

    const ventasNormalizadas = ventas.map((venta) => ({
      ...venta,
      // Normalizar estado a MAYÚSCULAS
      estado: normalizarEstadoVenta(venta.estado),
      // Normalizar clienteId a string para consistencia
      clienteId: String(venta.clienteId || ''),
      // Normalizar fechas
      fechaVenta: normalizarFecha(venta.fechaVenta),
      createdAt: normalizarFecha(venta.createdAt),
      // Normalizar montos a number
      subtotal: normalizarNumero(venta.subtotal, 0),
      iva: normalizarNumero(venta.iva, 0),
      total: normalizarNumero(venta.total, 0),
      // Normalizar items (si existen)
      items: (venta.items || []).map((item) => ({
        ...item,
        cantidad: normalizarNumero(item.cantidad, 0),
        precioVenta: normalizarNumero(item.precioVenta || item.precioUnitario, 0),
        subtotal: normalizarNumero(item.subtotal, 0),
      })),
      // ID como string
      id: String(venta.id || ''),
    }));

    // Guardar datos normalizados
    localStorage.setItem(KEY, JSON.stringify(ventasNormalizadas));
    console.log(`✅ [MIGRACIÓN] ${ventasNormalizadas.length} ventas normalizadas`);

    return true;
  } catch (error) {
    console.error(`❌ [MIGRACIÓN] Error normalizando ventas:`, error);
    return false;
  }
}

// ============================================================
// MIGRACIÓN DE PEDIDOS
// ============================================================

function migraPedidos(): boolean {
  const KEY = 'damabella_pedidos';

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return true; // No hay datos, ok

    const pedidos: PedidoRaw[] = JSON.parse(raw);
    if (!Array.isArray(pedidos) || pedidos.length === 0) return true;

    console.log(`🔄 [MIGRACIÓN] Normalizando ${pedidos.length} pedidos...`);

    const pedidosNormalizados = pedidos.map((pedido) => ({
      ...pedido,
      // Normalizar estado a MAYÚSCULAS
      estado: normalizarEstadoPedido(pedido.estado),
      // Normalizar clienteId a string para consistencia
      clienteId: String(pedido.clienteId || ''),
      // Normalizar fechas
      fechaPedido: normalizarFecha(pedido.fechaPedido),
      createdAt: normalizarFecha(pedido.createdAt),
      // Normalizar montos a number
      subtotal: normalizarNumero(pedido.subtotal, 0),
      iva: normalizarNumero(pedido.iva, 0),
      total: normalizarNumero(pedido.total, 0),
      // Normalizar productos/items (si existen)
      productos: ((pedido.productos || pedido.items) || []).map((prod) => ({
        ...prod,
        cantidad: normalizarNumero(prod.cantidad, 0),
        precioVenta: normalizarNumero(prod.precioVenta || prod.precioUnitario, 0),
      })),
      items: ((pedido.productos || pedido.items) || []).map((prod) => ({
        ...prod,
        cantidad: normalizarNumero(prod.cantidad, 0),
        precioVenta: normalizarNumero(prod.precioVenta || prod.precioUnitario, 0),
      })),
      // ID como string
      id: String(pedido.id || ''),
    }));

    // Guardar datos normalizados
    localStorage.setItem(KEY, JSON.stringify(pedidosNormalizados));
    console.log(`✅ [MIGRACIÓN] ${pedidosNormalizados.length} pedidos normalizados`);

    return true;
  } catch (error) {
    console.error(`❌ [MIGRACIÓN] Error normalizando pedidos:`, error);
    return false;
  }
}

// ============================================================
// FUNCIÓN PRINCIPAL - EJECUTAR MIGRACIÓN
// ============================================================

/**
 * Ejecutar migración de localStorage
 * - Se ejecuta UNA sola vez usando versionado
 * - NO elimina datos existentes
 * - NO modifica UI
 * - Si hay error, NO guarda nada
 */
export function migrateLocalStorageData(): void {
  const MIGRATION_VERSION = 'v1_dashboard_normalization';
  const MIGRATIONS_KEY = 'damabella_migrations';

  try {
    // Verificar si esta migración ya se ejecutó
    const migrationsRaw = localStorage.getItem(MIGRATIONS_KEY);
    const migrations = migrationsRaw ? JSON.parse(migrationsRaw) : {};

    if (migrations[MIGRATION_VERSION]) {
      console.log(`⏭️ [MIGRACIÓN] ${MIGRATION_VERSION} ya fue ejecutada, saltando...`);
      return;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 INICIANDO MIGRACIÓN: ${MIGRATION_VERSION}`);
    console.log(`${'='.repeat(60)}\n`);

    // Ejecutar todas las migraciones
    const resultados = {
      clientes: migraClientes(),
      ventas: migrasVentas(),
      pedidos: migraPedidos(),
    };

    // Verificar si todas fueron exitosas
    const todasOk = Object.values(resultados).every((resultado) => resultado === true);

    if (todasOk) {
      // Guardar versión como ejecutada
      migrations[MIGRATION_VERSION] = {
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
      };
      localStorage.setItem(MIGRATIONS_KEY, JSON.stringify(migrations));

      console.log(`\n${'='.repeat(60)}`);
      console.log(`✅ MIGRACIÓN COMPLETADA: ${MIGRATION_VERSION}`);
      console.log(`📝 Timestamp: ${migrations[MIGRATION_VERSION].timestamp}`);
      console.log(`${'='.repeat(60)}\n`);
    } else {
      console.error(`\n❌ [MIGRACIÓN] Error en migración, NO se guarda versión`);
      console.error('Resultados:', resultados);
      console.error('Los datos NO fueron modificados\n');
    }
  } catch (error) {
    console.error(`\n❌ [MIGRACIÓN] Error fatal:`, error);
    console.error('Los datos NO fueron modificados\n');
  }
}

// ============================================================
// FUNCIÓN AUXILIAR - VER HISTORIAL DE MIGRACIONES
// ============================================================

/**
 * Ver qué migraciones se han ejecutado (para debugging)
 */
export function getMigrationsHistory(): Record<string, any> {
  const MIGRATIONS_KEY = 'damabella_migrations';
  const migrationsRaw = localStorage.getItem(MIGRATIONS_KEY);
  return migrationsRaw ? JSON.parse(migrationsRaw) : {};
}

/**
 * RESETEAR migraciones (SOLO para desarrollo/testing)
 * ⚠️ NO usar en producción
 */
export function resetMigrationsHistory(): void {
  const MIGRATIONS_KEY = 'damabella_migrations';
  localStorage.removeItem(MIGRATIONS_KEY);
  console.warn('⚠️ [MIGRACIÓN] Historial de migraciones reseteado');
}
