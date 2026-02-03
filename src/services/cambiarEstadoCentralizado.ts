/**
 * 🔒 SERVICIO CENTRALIZADO DE CAMBIO DE ESTADO DE PEDIDOS
 * 
 * Función única responsable de:
 * 1. Validar transiciones de estado según reglas estrictas
 * 2. Completar pedido → crear venta automáticamente + descontar stock
 * 3. Anular pedido → actualizar estado (con opción de devolver stock)
 * 4. Prevenir edición de pedidos Completados o Anulados
 * 5. Mantener consistencia entre módulos Pedidos y Ventas
 */

import { finalizarVenta, generarNumeroVenta } from './saleService';

// ============================================================
// TIPOS Y INTERFACES
// ============================================================

export type EstadoPedido = 'Pendiente' | 'Completada' | 'Anulado' | 'Convertido a venta';

export interface ItemPedido {
  id: string;
  productoId: string;
  productoNombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  numeroPedido: string;
  tipo: 'Pedido';
  clienteId: string;
  clienteNombre: string;
  fechaPedido: string;
  estado: EstadoPedido;
  items: ItemPedido[];
  subtotal: number;
  iva: number;
  total: number;
  metodoPago: string;
  observaciones: string;
  createdAt: string;
  venta_id?: string | null;
  stockAjustado?: boolean;
}

export interface ResultadoCambioEstado {
  exitoso: boolean;
  error?: string;
  mensaje: string;
  pedidoActualizado?: Pedido;
  ventaCreada?: any;
  detalleStock?: Array<{
    productId: string;
    nombreProducto: string;
    cambio: number;
    stockAnterior: number;
    stockActual: number;
  }>;
}

export interface ConfiguracionCambioEstado {
  // Callback cuando venta se crea exitosamente
  onVentaCreada?: (venta: any) => void;
  // Callback para notificaciones
  onNotificar?: (titulo: string, mensaje: string, tipo: 'success' | 'error' | 'info') => void;
  // Callback para logging
  onLog?: (mensaje: string, nivel: 'log' | 'warn' | 'error') => void;
  // Si es true, continúa aunque haya errores de stock (no recomendado)
  continuarSiError?: boolean;
}

// ============================================================
// CONSTANTES
// ============================================================

const PEDIDOS_KEY = 'damabella_pedidos';
const VENTAS_KEY = 'damabella_ventas';
const VENTA_COUNTER_KEY = 'damabella_venta_counter';

// ============================================================
// VALIDADORES - Sin efectos secundarios
// ============================================================

/**
 * ✅ ¿Puede editarse este pedido?
 * Solo Pendiente puede ser editado
 */
export function puedeEditarse(estado: EstadoPedido): boolean {
  return estado === 'Pendiente';
}

/**
 * ✅ ¿Puede anularse este pedido?
 * Pendiente y Completada pueden anularse
 * Anulado es terminal (no se puede hacer nada)
 */
export function puedeAnularse(estado: EstadoPedido): boolean {
  return estado === 'Pendiente' || estado === 'Completada';
}

/**
 * ✅ ¿Puede completarse este pedido?
 * Solo Pendiente puede completarse
 */
export function puedeCompletarse(estado: EstadoPedido): boolean {
  return estado === 'Pendiente';
}

/**
 * ✅ ¿Es un estado terminal?
 * Anulado no puede transicionar a nada
 */
export function esEstadoTerminal(estado: EstadoPedido): boolean {
  return estado === 'Anulado';
}

// ============================================================
// HELPERS UI
// ============================================================

/**
 * Obtener clases Tailwind para badge de estado
 */
export function obtenerClaseEstado(estado: EstadoPedido): string {
  switch (estado) {
    case 'Pendiente':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    case 'Completada':
      return 'bg-green-100 text-green-800 border border-green-300';
    case 'Anulado':
      return 'bg-red-100 text-red-800 border border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-300';
  }
}

/**
 * Obtener descripción legible del estado
 */
export function obtenerDescripcionEstado(estado: EstadoPedido): string {
  switch (estado) {
    case 'Pendiente':
      return 'Pendiente de procesamiento';
    case 'Completada':
      return 'Convertido a venta';
    case 'Anulado':
      return 'Anulado';
    default:
      return 'Estado desconocido';
  }
}

// ============================================================
// FUNCIÓN PRINCIPAL CENTRALIZADA
// ============================================================

/**
 * 🔒 FUNCIÓN CENTRALIZADA DE CAMBIO DE ESTADO
 * 
 * Punto de entrada único para CUALQUIER cambio de estado de pedido
 * Maneja automáticamente la sincronización con módulo de Ventas
 * 
 * @param pedidoId - ID del pedido a cambiar
 * @param nuevoEstado - Nuevo estado: 'Completada' | 'Anulado'
 * @param config - Configuración opcional (callbacks, opciones)
 * @returns ResultadoCambioEstado con detalles de lo realizado
 */
export function cambiarEstadoCentralizado(
  pedido: Pedido,
  nuevoEstado: EstadoPedido,
  config?: ConfiguracionCambioEstado
): ResultadoCambioEstado {
  const log = config?.onLog || console.log;
  const notificar = config?.onNotificar || (() => {});

  try {
    log(
      `\n🔄 [cambiarEstadoCentralizado] Iniciando transición: ${pedido.estado} → ${nuevoEstado}`,
      'log'
    );

    // ================================================================
    // 1️⃣ VALIDACIÓN: ¿Es una transición válida?
    // ================================================================

    // Si el estado actual es terminal, no se puede hacer nada
    if (esEstadoTerminal(pedido.estado)) {
      const error = `❌ No se puede cambiar estado de un pedido ANULADO. Estado terminal.`;
      log(error, 'warn');
      return {
        exitoso: false,
        error,
        mensaje: 'Un pedido anulado no puede cambiar de estado',
      };
    }

    // Validar según el nuevo estado solicitado
    if (nuevoEstado === 'Completada') {
      if (!puedeCompletarse(pedido.estado)) {
        const error = `❌ No se puede pasar de ${pedido.estado} a Completada. Solo Pendiente puede completarse.`;
        log(error, 'warn');
        return {
          exitoso: false,
          error,
          mensaje: 'Solo pedidos Pendientes pueden completarse',
        };
      }
    } else if (nuevoEstado === 'Anulado') {
      if (!puedeAnularse(pedido.estado)) {
        const error = `❌ No se puede pasar de ${pedido.estado} a Anulado. Solo Pendiente o Completada pueden anularse.`;
        log(error, 'warn');
        return {
          exitoso: false,
          error,
          mensaje: 'No se puede anular este pedido en su estado actual',
        };
      }
    } else if (nuevoEstado === 'Pendiente') {
      const error = `❌ No se permite reversa: ${pedido.estado} → Pendiente. Un pedido Completado no puede volver a Pendiente.`;
      log(error, 'error');
      return {
        exitoso: false,
        error,
        mensaje: 'No se permite revertir un pedido completado',
      };
    }

    // ================================================================
    // 2️⃣ CASO: CAMBIO A COMPLETADA (Crear venta + descontar stock)
    // ================================================================

    if (nuevoEstado === 'Completada' && pedido.estado === 'Pendiente') {
      log(`\n📦 [Completada] Creando venta y descontando stock...`, 'log');

      // Crear objeto Venta
      const numeroVenta = generarNumeroVenta();
      const nuevaVenta = {
        id: Date.now(),
        numeroVenta,
        clienteId: pedido.clienteId,
        clienteNombre: pedido.clienteNombre,
        fechaVenta: pedido.fechaPedido,
        estado: 'Completada' as const,
        items: pedido.items,
        subtotal: pedido.subtotal,
        iva: pedido.iva,
        total: pedido.total,
        metodoPago: pedido.metodoPago || 'Efectivo',
        observaciones: pedido.observaciones || '',
        anulada: false,
        createdAt: new Date().toISOString(),
        pedido_id: pedido.numeroPedido,
        // 🔒 NUEVO: Flags de movimientos de stock (se actualizan en finalizarVenta)
        movimientosStock: {
          salidaEjecutada: false,   // Se marca true en finalizarVenta()
          devolucionEjecutada: false
        }
      };

      // Llamar a función central de ventas para descontar stock
      const resultadoVenta = finalizarVenta(nuevaVenta, pedido.items);

      if (!resultadoVenta.exitoso) {
        const error = `❌ Error al crear venta: ${resultadoVenta.error}`;
        log(error, 'error');
        notificar('Error', resultadoVenta.error || 'Error al crear venta', 'error');
        
        if (!config?.continuarSiError) {
          return {
            exitoso: false,
            error,
            mensaje: 'No se pudo descontar stock. Verifique disponibilidad.',
          };
        }
      }

      // ✅ Stock descargado exitosamente, actualizar pedido
      const pedidoActualizado: Pedido = {
        ...pedido,
        estado: 'Completada',
        venta_id: numeroVenta,
      };

      // Persistir cambio en localStorage
      const pedidosActuales = JSON.parse(localStorage.getItem(PEDIDOS_KEY) || '[]');
      const pedidosActualizados = pedidosActuales.map((p: Pedido) =>
        p.id === pedido.id ? pedidoActualizado : p
      );
      localStorage.setItem(PEDIDOS_KEY, JSON.stringify(pedidosActualizados));

      // Disparar eventos de sincronización
      window.dispatchEvent(
        new CustomEvent('pedidoConvertidoAVenta', {
          detail: { pedido: pedidoActualizado },
        })
      );
      window.dispatchEvent(new Event('ventaFinalizada'));
      window.dispatchEvent(new Event('salesUpdated'));

      const mensaje = `✅ Pedido ${pedido.numeroPedido} completado. Venta ${numeroVenta} creada.`;
      log(mensaje, 'log');
      notificar('Éxito', mensaje, 'success');
      if (config?.onVentaCreada) {
        config.onVentaCreada(nuevaVenta);
      }

      return {
        exitoso: true,
        mensaje,
        pedidoActualizado,
        ventaCreada: nuevaVenta,
      };
    }

    // ================================================================
    // 3️⃣ CASO: CAMBIO A ANULADO (Pendiente → Anulado o Completada → Anulado)
    // ================================================================

    if (nuevoEstado === 'Anulado') {
      log(`\n🚫 [Anulado] Anulando pedido...`, 'log');

      const pedidoActualizado: Pedido = {
        ...pedido,
        estado: 'Anulado',
      };

      // Persistir cambio en localStorage
      const pedidosActuales = JSON.parse(localStorage.getItem(PEDIDOS_KEY) || '[]');
      const pedidosActualizados = pedidosActuales.map((p: Pedido) =>
        p.id === pedido.id ? pedidoActualizado : p
      );
      localStorage.setItem(PEDIDOS_KEY, JSON.stringify(pedidosActualizados));

      // Disparar evento
      window.dispatchEvent(
        new CustomEvent('pedidoAnulado', {
          detail: { pedido: pedidoActualizado },
        })
      );

      const mensaje = `✅ Pedido ${pedido.numeroPedido} anulado correctamente`;
      log(mensaje, 'log');
      notificar('Éxito', mensaje, 'success');

      return {
        exitoso: true,
        mensaje,
        pedidoActualizado,
      };
    }

    // Si llegamos aquí, es un estado no manejado
    return {
      exitoso: false,
      error: `❌ Transición no implementada: ${pedido.estado} → ${nuevoEstado}`,
      mensaje: 'Transición de estado no soportada',
    };
  } catch (error: any) {
    const mensajeError = error.message || 'Error desconocido';
    log(`❌ [ERROR] ${mensajeError}`, 'error');
    notificar('Error', mensajeError, 'error');

    return {
      exitoso: false,
      error: mensajeError,
      mensaje: 'Error al cambiar el estado del pedido',
    };
  }
}
