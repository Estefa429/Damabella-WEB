/**
 * 🎯 SERVICIO CENTRALIZADO: Cambio de Estado de Pedidos
 * 
 * Función única y centralizada que maneja:
 * 1. Validación de transiciones permitidas
 * 2. Cambio de estado con persistencia
 * 3. Sincronización automática con Ventas
 * 4. Control de stock
 * 5. Logging y auditoría
 * 
 * Uso:
 * const resultado = await cambiarEstadoPedidoCentralizado(
 *   pedidoId,
 *   'Completada',
 *   { onSincronizarVentas: crearVenta, onNotificar: mostrarMensaje }
 * );
 */

import type { Pedido, CambioEstadoResult } from './pedidoService';
import { cambiarEstadoPedido, validarTransicion } from './pedidoService';

/**
 * Configuración para el cambio de estado
 */
interface ConfigCambioEstado {
  /** Callback cuando se sincroniza a Ventas */
  onSincronizarVentas?: (pedido: Pedido) => void | Promise<void>;
  /** Callback para notificaciones al usuario */
  onNotificar?: (tipo: 'exito' | 'error' | 'info', mensaje: string) => void;
  /** Callback para logging */
  onLog?: (nivel: 'info' | 'warn' | 'error', mensaje: string) => void;
  /** Si debe continuar incluso si Ventas falla */
  continuarSiError?: boolean;
}

/**
 * Resultado extendido del cambio de estado
 */
interface ResultadoCambioEstadoCentralizado {
  success: boolean;
  mensaje: string;
  pedido?: Pedido;
  ventaCreada?: boolean;
  error?: {
    codigo: string;
    detalle: string;
  };
}

/**
 * ✅ FUNCIÓN CENTRALIZADA: Cambiar estado de un pedido
 *
 * Punto único de entrada para todos los cambios de estado.
 * Maneja validación, persistencia, sincronización y notificaciones.
 *
 * @param pedidoId - ID del pedido a cambiar
 * @param nuevoEstado - Estado destino: 'Pendiente', 'Completada', 'Anulado'
 * @param config - Configuración de callbacks
 * @returns Resultado con detalles de la operación
 *
 * @example
 * // Desde un componente
 * const resultado = await cambiarEstadoPedidoCentralizado('ped_123', 'Completada', {
 *   onSincronizarVentas: (pedido) => crearVentaDesdePedido(pedido),
 *   onNotificar: (tipo, msg) => setNotification({ tipo, mensaje: msg })
 * });
 *
 * if (resultado.success) {
 *   // Actualizar UI con nuevo estado
 *   setPedidos(prev => prev.map(p => p.id === resultado.pedido?.id ? resultado.pedido : p));
 * }
 */
export async function cambiarEstadoPedidoCentralizado(
  pedidoId: string,
  nuevoEstado: 'Pendiente' | 'Completada' | 'Anulado',
  config: ConfigCambioEstado = {}
): Promise<ResultadoCambioEstadoCentralizado> {
  const { onSincronizarVentas, onNotificar, onLog, continuarSiError = false } = config;

  try {
    // 1️⃣ VALIDACIÓN: Obtener pedido y verificar transición
    onLog?.('info', `[CAMBIO_ESTADO] Iniciando cambio de estado: ${pedidoId} → ${nuevoEstado}`);

    const pedidoActual = obtenerPedidoDelStorage(pedidoId);
    if (!pedidoActual) {
      const error = {
        codigo: 'PEDIDO_NO_ENCONTRADO',
        detalle: `Pedido ${pedidoId} no existe`
      };
      onLog?.('error', `[CAMBIO_ESTADO] ${error.detalle}`);
      onNotificar?.('error', `Pedido no encontrado`);
      return { success: false, mensaje: error.detalle, error };
    }

    // 2️⃣ VALIDAR: Transición permitida según reglas de negocio
    const validacion = validarTransicion(pedidoActual.estado, nuevoEstado);
    if (!validacion.permitido) {
      const error = {
        codigo: 'TRANSICION_NO_PERMITIDA',
        detalle: validacion.razon || `No se puede cambiar de ${pedidoActual.estado} a ${nuevoEstado}`
      };
      onLog?.('warn', `[CAMBIO_ESTADO] Transición rechazada: ${error.detalle}`);
      onNotificar?.('error', error.detalle);
      return { success: false, mensaje: error.detalle, error };
    }

    // 3️⃣ CAMBIAR: Actualizar estado del pedido
    const resultadoCambio = cambiarEstadoPedido(pedidoId, nuevoEstado);
    if (!resultadoCambio.success) {
      const error = {
        codigo: 'ERROR_CAMBIO_ESTADO',
        detalle: resultadoCambio.mensaje
      };
      onLog?.('error', `[CAMBIO_ESTADO] Error al cambiar estado: ${error.detalle}`);
      onNotificar?.('error', error.detalle);
      return { success: false, mensaje: error.detalle, error };
    }

    // 4️⃣ SINCRONIZAR: Si cambió a Completada, agregar a Ventas
    let ventaCreada = false;
    if (nuevoEstado === 'Completada' && onSincronizarVentas && resultadoCambio.pedido) {
      try {
        onLog?.('info', `[CAMBIO_ESTADO] Sincronizando a Ventas: ${pedidoId}`);
        await onSincronizarVentas(resultadoCambio.pedido);
        ventaCreada = true;
        onLog?.('info', `[CAMBIO_ESTADO] Venta creada exitosamente`);
      } catch (errorVenta) {
        const detalle = errorVenta instanceof Error ? errorVenta.message : 'Error desconocido';
        onLog?.('error', `[CAMBIO_ESTADO] Error al sincronizar Ventas: ${detalle}`);

        if (!continuarSiError) {
          // Revertir cambio si falla sincronización
          onLog?.('warn', `[CAMBIO_ESTADO] Revirtiendo cambio de estado`);
          cambiarEstadoPedido(pedidoId, pedidoActual.estado);
          onNotificar?.('error', `Error al crear venta. Operación revertida.`);
          return {
            success: false,
            mensaje: `Fallo en sincronización con Ventas`,
            error: { codigo: 'ERROR_SINCRONIZACION_VENTAS', detalle }
          };
        }
        // Si continuarSiError=true, continuar pero registrar el error
        onNotificar?.('info', `Pedido actualizado pero hay problema con Ventas`);
      }
    }

    // 5️⃣ RESULTADO: Operación exitosa
    const mensaje = obtenerMensajeTransicion(pedidoActual.estado, nuevoEstado, ventaCreada);
    onLog?.('info', `[CAMBIO_ESTADO] Operación completada: ${mensaje}`);
    onNotificar?.('exito', mensaje);

    return {
      success: true,
      mensaje,
      pedido: resultadoCambio.pedido,
      ventaCreada
    };
  } catch (errorInesperado) {
    const detalle = errorInesperado instanceof Error ? errorInesperado.message : 'Error desconocido';
    onLog?.('error', `[CAMBIO_ESTADO] Error inesperado: ${detalle}`);
    onNotificar?.('error', `Error interno: ${detalle}`);
    return {
      success: false,
      mensaje: `Error inesperado: ${detalle}`,
      error: { codigo: 'ERROR_INTERNO', detalle }
    };
  }
}

/**
 * 🛡️ VALIDADORES: Reglas de edición
 * 
 * Funciones de utilidad para controlar qué acciones permitir
 */

/**
 * ✅ Puede ser editado (solo si está Pendiente)
 */
export function puedeEditarse(estado: Pedido['estado']): boolean {
  return estado === 'Pendiente';
}

/**
 * ✅ Puede ser anulado - SOLO SI ESTÁ PENDIENTE
 * 
 * CAMBIO CRÍTICO: Esta función ahora retorna true ÚNICAMENTE para 'Pendiente'.
 * Ya no permite anular pedidos en estado 'Completada'.
 */
export function puedeAnularse(estado: Pedido['estado']): boolean {
  return estado === 'Pendiente';
}

/**
 * ✅ Puede ser completado
 */
export function puedeCompletarse(estado: Pedido['estado']): boolean {
  return estado === 'Pendiente';
}

/**
 * ✅ Permite cambios de estado (no es terminal)
 */
export function esEstadoTerminal(estado: Pedido['estado']): boolean {
  return estado === 'Anulado';
}

/**
 * 🎨 HELPERS: UI y Display
 */

/**
 * Obtener clase CSS para el badge del estado
 */
export function obtenerClaseEstado(estado: Pedido['estado']): string {
  const clases: Record<Pedido['estado'], string> = {
    'Pendiente': 'bg-blue-100 text-blue-800',
    'Completada': 'bg-green-100 text-green-800',
    'Anulado': 'bg-red-100 text-red-800'
  };
  return clases[estado];
}

/**
 * Obtener descripción legible del estado
 */
export function obtenerDescripcionEstado(estado: Pedido['estado']): string {
  const descripciones: Record<Pedido['estado'], string> = {
    'Pendiente': 'Esperando confirmación',
    'Completada': 'Orden procesada y enviada a Ventas',
    'Anulado': 'Orden cancelada'
  };
  return descripciones[estado];
}

/**
 * 🔧 HELPERS INTERNOS
 */

/**
 * Obtener pedido del localStorage
 * @internal
 */
function obtenerPedidoDelStorage(pedidoId: string): Pedido | null {
  try {
    const pedidosJson = localStorage.getItem('damabella_pedidos');
    if (!pedidosJson) return null;
    const pedidos: Pedido[] = JSON.parse(pedidosJson);
    return pedidos.find(p => p.id === pedidoId) || null;
  } catch (error) {
    console.error('[CAMBIO_ESTADO] Error al leer pedido:', error);
    return null;
  }
}

/**
 * Generar mensaje descriptivo de la transición
 * @internal
 */
function obtenerMensajeTransicion(
  estadoAnterior: Pedido['estado'],
  nuevoEstado: Pedido['estado'],
  ventaCreada: boolean
): string {
  const transiciones: Record<string, string> = {
    'Pendiente→Completada': ventaCreada 
      ? 'Pedido completado y venta creada en el módulo de Ventas'
      : 'Pedido completado',
    'Pendiente→Anulado': 'Pedido anulado',
    'Completada→Anulado': 'Pedido anulado. Stock devuelto.'
  };
  
  const key = `${estadoAnterior}→${nuevoEstado}`;
  return transiciones[key] || `Estado cambiado a ${nuevoEstado}`;
}

/**
 * 📋 REGLAS DE NEGOCIO DOCUMENTADAS
 * 
 * TABLA DE TRANSICIONES PERMITIDAS:
 * ┌─────────────┬─────────────┬──────────────────────────────┐
 * │ Estado      │ Destino     │ Validaciones                 │
 * ├─────────────┼─────────────┼──────────────────────────────┤
 * │ Pendiente   │ Completada  │ Stock suficiente ✓           │
 * │ Pendiente   │ Anulado     │ Siempre permitido ✓          │
 * │ Completada  │ Anulado     │ BLOQUEADO ❌ (CAMBIO CRÍTICO)│
 * │ Completada  │ Pendiente   │ ❌ BLOQUEADO                 │
 * │ Anulado     │ *           │ ❌ BLOQUEADO (terminal)      │
 * └─────────────┴─────────────┴──────────────────────────────┘
 * 
 * EVENTOS Y SINCRONIZACIÓN:
 * - Pendiente → Completada: Descuenta stock, crea venta
 * - Pendiente → Anulado: Sin cambio de stock
 * - Completada → Anulado: ❌ BLOQUEADO (cambio crítico)
 * 
 * PERMISOS DE EDICIÓN:
 * - Solo se pueden editar pedidos en estado "Pendiente"
 * - Completada y Anulado son inmutables
 * 
 * PERMISOS DE ANULACIÓN (CAMBIO CRÍTICO):
 * - Solo se pueden anular pedidos en estado "Pendiente"
 * - YA NO se pueden anular pedidos en estado "Completada"
 */
