/**
 * 🔒 SERVICIO MAESTRO CENTRALIZADO DE PEDIDOS
 * 
 * Función única que orquesta TODOS los cambios de estado de un pedido:
 * - Cambios de estado genéricos
 * - Anulaciones con devolución de stock
 * - Validaciones y bloqueos
 * - Sincronización automática con Ventas
 * 
 * Este es el punto de entrada único para cualquier modificación de pedidos
 */

import { cambiarEstadoCentralizado } from './cambiarEstadoCentralizado';
import { anularPedidoCentralizado } from './anularPedidoCentralizado';

// ============================================================
// TIPOS E INTERFACES
// ============================================================

export type EstadoPedido = 'Pendiente' | 'Completada' | 'Anulado' | 'Convertido a venta';

export type TipoTransicion = 
  | 'completar'      // Pendiente → Completada (crea Venta + descuenta stock)
  | 'anular'         // Pendiente/Completada → Anulado (devuelve stock si aplica)
  | 'cambiar-estado'; // Cambio genérico de estado

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
  stockAjustado?: boolean; // Flag para saber si ya se descargó stock
}

export interface ResultadoTransicion {
  exitoso: boolean;
  error?: string;
  mensaje: string;
  tipo: TipoTransicion;
  pedidoActualizado?: Pedido;
  ventaCreada?: any;
  stockDevuelto?: Array<{
    productoId: string;
    nombreProducto: string;
    talla: string;
    color: string;
    cantidad: number;
  }>;
}

export interface ConfiguracionTransicion {
  // Callbacks de eventos
  onExitoso?: (resultado: ResultadoTransicion) => void;
  onError?: (error: string) => void;
  onNotificar?: (titulo: string, mensaje: string, tipo: 'success' | 'error' | 'info') => void;
  onLog?: (mensaje: string, nivel: 'log' | 'warn' | 'error') => void;
}

// ============================================================
// VALIDADORES - Punto central de reglas de negocio
// ============================================================

/**
 * ✅ ¿Puede editarse un pedido en este estado?
 * 
 * Regla: Solo Pendiente es editable
 * - Pendiente: ✅ (aún no hay venta)
 * - Completada: ❌ (venta ya existe, cambios afectarían Ventas)
 * - Anulado: ❌ (estado terminal)
 */
export function puedeEditarse(estado: EstadoPedido): boolean {
  return estado === 'Pendiente';
}

/**
 * ✅ ¿Puede cambiar de estado este pedido?
 * 
 * Regla: Transiciones permitidas
 * - Pendiente → Completada: ✅ (crear venta)
 * - Pendiente → Anulado: ✅ (cancelar)
 * - Completada → Anulado: ✅ (anular después de venta)
 * - Completada → Pendiente: ❌ (no se permite reversa)
 * - Anulado → *: ❌ (estado terminal)
 */
export function puedeTransicionar(
  estadoActual: EstadoPedido,
  estadoDestino: EstadoPedido
): boolean {
  // Anulado es terminal
  if (estadoActual === 'Anulado') return false;

  // Transiciones válidas
  if (estadoActual === 'Pendiente') {
    return estadoDestino === 'Completada' || estadoDestino === 'Anulado';
  }

  if (estadoActual === 'Completada') {
    return estadoDestino === 'Anulado'; // Solo permite anular
  }

  return false;
}

/**
 * ✅ Determinar qué tipo de transición es
 */
export function determinarTipoTransicion(
  estadoActual: EstadoPedido,
  estadoDestino: EstadoPedido
): TipoTransicion | null {
  if (estadoDestino === 'Completada' && estadoActual === 'Pendiente') {
    return 'completar';
  }

  if (estadoDestino === 'Anulado' && (estadoActual === 'Pendiente' || estadoActual === 'Completada')) {
    return 'anular';
  }

  return null; // Transición inválida o no soportada
}

// ============================================================
// FUNCIÓN MAESTRO CENTRALIZADA
// ============================================================

/**
 * 🔒 FUNCIÓN MAESTRO: Cambiar estado de un pedido
 * 
 * Punto de entrada ÚNICO para cualquier cambio de estado.
 * Orquesta automáticamente la transición correcta según las reglas.
 * 
 * @param pedido - El pedido a modificar
 * @param nuevoEstado - Estado destino
 * @param config - Configuración (callbacks)
 * @returns Resultado con detalles de la transición
 */
export function cambiarEstadoPedidoCentralizado(
  pedido: Pedido,
  nuevoEstado: EstadoPedido,
  config?: ConfiguracionTransicion
): ResultadoTransicion {
  const log = config?.onLog || console.log;
  const notificar = config?.onNotificar || (() => {});

  try {
    log(
      `\n🔄 [cambiarEstadoPedidoCentralizado] ${pedido.numeroPedido}: ${pedido.estado} → ${nuevoEstado}`,
      'log'
    );

    // ================================================================
    // 1️⃣ VALIDAR: ¿Es una transición permitida?
    // ================================================================

    const esValida = puedeTransicionar(pedido.estado, nuevoEstado);
    if (!esValida) {
      const error = `❌ Transición no permitida: ${pedido.estado} → ${nuevoEstado}`;
      log(error, 'error');
      notificar('Error', 'No puedes hacer este cambio de estado', 'error');
      return {
        exitoso: false,
        error,
        mensaje: `No se puede pasar de ${pedido.estado} a ${nuevoEstado}`,
        tipo: 'cambiar-estado',
      };
    }

    // ================================================================
    // 2️⃣ DETERMINAR: ¿Qué tipo de transición es?
    // ================================================================

    const tipoTransicion = determinarTipoTransicion(pedido.estado, nuevoEstado);
    if (!tipoTransicion) {
      const error = `❌ Tipo de transición no identificado`;
      log(error, 'error');
      return {
        exitoso: false,
        error,
        mensaje: 'Error al procesar el cambio de estado',
        tipo: 'cambiar-estado',
      };
    }

    log(`✅ Tipo de transición: ${tipoTransicion}`, 'log');

    // ================================================================
    // 3️⃣ EJECUTAR: La función correcta según el tipo
    // ================================================================

    let resultado: any;

    if (tipoTransicion === 'completar') {
      // Cambiar a Completada: Crea Venta + descuenta stock
      log(`\n📋 Ejecutando: COMPLETAR PEDIDO`, 'log');
      resultado = cambiarEstadoCentralizado(pedido, 'Completada', {
        onNotificar: notificar,
        onLog: log,
      });
    } else if (tipoTransicion === 'anular') {
      // Anular: Devuelve stock si aplica
      log(`\n🚫 Ejecutando: ANULAR PEDIDO`, 'log');
      resultado = anularPedidoCentralizado(pedido, {
        onNotificar: notificar,
        onLog: log,
      });
    }

    // ================================================================
    // 4️⃣ RETORNAR: Resultado unificado
    // ================================================================

    if (resultado.exitoso) {
      const resultadoFinal: ResultadoTransicion = {
        exitoso: true,
        mensaje: resultado.mensaje,
        tipo: tipoTransicion,
        pedidoActualizado: resultado.pedidoActualizado || resultado.pedidoAnulado,
        ventaCreada: resultado.ventaCreada,
        stockDevuelto: resultado.stockDevuelto,
      };

      if (config?.onExitoso) {
        config.onExitoso(resultadoFinal);
      }

      return resultadoFinal;
    } else {
      const resultadoFinal: ResultadoTransicion = {
        exitoso: false,
        error: resultado.error,
        mensaje: resultado.mensaje,
        tipo: tipoTransicion,
      };

      if (config?.onError) {
        config.onError(resultado.error);
      }

      return resultadoFinal;
    }
  } catch (error: any) {
    const mensajeError = error.message || 'Error desconocido';
    log(`❌ [ERROR] ${mensajeError}`, 'error');
    notificar('Error', mensajeError, 'error');

    return {
      exitoso: false,
      error: mensajeError,
      mensaje: 'Error al cambiar el estado del pedido',
      tipo: 'cambiar-estado',
    };
  }
}

// ============================================================
// HELPERS PARA UI/COMPONENTES
// ============================================================

/**
 * Obtener qué estados son válidos como destino desde un estado actual
 * Útil para mostrar solo opciones válidas en UI
 */
export function obtenerEstadosValidos(estadoActual: EstadoPedido): EstadoPedido[] {
  const estados: EstadoPedido[] = ['Pendiente', 'Completada', 'Anulado'];
  return estados.filter(estado => 
    estado !== estadoActual && puedeTransicionar(estadoActual, estado)
  );
}

/**
 * Obtener descripción legible de un estado
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
 * Obtener color de estado para componentes
 */
export function obtenerColorEstado(estado: EstadoPedido): string {
  switch (estado) {
    case 'Pendiente':
      return 'yellow';
    case 'Completada':
      return 'green';
    case 'Anulado':
      return 'red';
    default:
      return 'gray';
  }
}

// ============================================================
// DOCUMENTACIÓN DE REGLAS DE NEGOCIO
// ============================================================

/*
MATRIZ DE TRANSICIONES - REGLAS CENTRALIZADAS:

┌──────────────┬────────────┬──────────────┬─────────┬────────────┐
│ Estado Actual │ Editable?  │ → Pendiente  │→Completa│ → Anulado  │
├──────────────┼────────────┼──────────────┼─────────┼────────────┤
│ Pendiente    │     ✅     │      -       │   ✅    │     ✅     │
│              │            │              │Crea Venta  Cancelar  │
│              │            │              │Stock ⬇️    (sin Venta)│
├──────────────┼────────────┼──────────────┼─────────┼────────────┤
│ Completada   │     ❌     │      ❌      │    -    │     ✅     │
│              │            │   (reversa   │         │Anula Venta │
│              │            │   prohibida) │         │Stock ⬆️    │
├──────────────┼────────────┼──────────────┼─────────┼────────────┤
│ Anulado      │     ❌     │      ❌      │    ❌   │      -     │
│              │ (terminal) │   (no)       │  (no)   │(ya anulado)│
└──────────────┴────────────┴──────────────┴─────────┴────────────┘

FLUJOS PRINCIPALES:

1. COMPLETAR (Pendiente → Completada):
   - Validar stock disponible
   - Descontar stock (stockAjustado = true)
   - Crear Venta automáticamente
   - Sincronizar módulos
   - Disparar eventos

2. ANULAR (Pendiente → Anulado):
   - No hay stock que devolver (aún es Pendiente)
   - Cambiar estado a Anulado
   - Sin Venta asociada aún
   - Cancelación simple

3. ANULAR (Completada → Anulado):
   - Devolver stock (stockAjustado era true)
   - Cambiar estado a Anulado en Pedidos
   - Marcar Venta como "Anulada"
   - Sincronizar módulos

BLOQUEOS:

- Edición: Solo si estado === 'Pendiente'
- Cambio de estado: Solo según matriz anterior
- Reversa (Completada → Pendiente): PROHIBIDA
- Terminal (Anulado): No se puede cambiar
*/
