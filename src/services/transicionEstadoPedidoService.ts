/**
 * 📦 SERVICIO DE TRANSICIÓN DE ESTADO DE PEDIDOS
 * 
 * Maneja la lógica centralizada para:
 * 1. Validar transiciones de estado según reglas de negocio
 * 2. Actualizar Pedidos cuando cambian de estado
 * 3. Sincronizar automáticamente con Ventas cuando Pedido → Completada
 * 4. Mantener consistencia de stock
 */

import {
  cambiarEstadoPedido,
  validarTransicion,
  type Pedido,
  type CambioEstadoResult
} from './pedidoService';

/**
 * Resultado de la transición de estado
 */
export interface ResultadoTransicion {
  success: boolean;
  mensaje: string;
  pedido?: Pedido;
  detalleStock?: any[];
  ventaCreada?: boolean;
  ventaId?: string;
  error?: string;
}

/**
 * 🔄 FUNCIÓN PRINCIPAL: Manejar transición de estado de un pedido
 * 
 * @param pedidoId - ID del pedido a cambiar
 * @param nuevoEstado - Nuevo estado: 'Pendiente', 'Completada', 'Anulado'
 * @param onSincronizarVentas - Callback para sincronizar con módulo Ventas
 * @returns {ResultadoTransicion}
 * 
 * @example
 * const resultado = await transicionarPedido(
 *   'ped_12345',
 *   'Completada',
 *   (pedido) => agregarAVentas(pedido)
 * );
 */
export async function transicionarPedido(
  pedidoId: string,
  nuevoEstado: 'Pendiente' | 'Completada' | 'Anulado',
  onSincronizarVentas?: (pedido: Pedido) => void
): Promise<ResultadoTransicion> {
  try {
    // 1️⃣ VALIDAR: Obtener pedido actual y verificar transición
    const pedidoActual = obtenerPedidoDelLocalStorage(pedidoId);

    if (!pedidoActual) {
      return {
        success: false,
        mensaje: `❌ Pedido ${pedidoId} no encontrado`,
        error: 'PEDIDO_NO_ENCONTRADO'
      };
    }

    // 2️⃣ VALIDAR: Verificar si la transición es permitida
    const validacion = validarTransicion(pedidoActual.estado, nuevoEstado);
    if (!validacion.permitido) {
      return {
        success: false,
        mensaje: `❌ Transición no permitida: ${pedidoActual.estado} → ${nuevoEstado}. ${validacion.razon}`,
        error: 'TRANSICION_NO_PERMITIDA'
      };
    }

    // 3️⃣ EJECUTAR: Cambiar estado del pedido usando la función central
    const resultadoCambio = cambiarEstadoPedido(pedidoId, nuevoEstado);

    if (!resultadoCambio.success) {
      return {
        success: false,
        mensaje: resultadoCambio.mensaje,
        error: 'ERROR_CAMBIO_ESTADO'
      };
    }

    // 4️⃣ SINCRONIZAR: Si cambió a Completada, agregar a Ventas
    let ventaCreada = false;
    let ventaId = undefined;

    if (nuevoEstado === 'Completada' && onSincronizarVentas && resultadoCambio.pedido) {
      try {
        // Llamar callback para crear la venta
        onSincronizarVentas(resultadoCambio.pedido);
        ventaCreada = true;
        ventaId = `vta_${Date.now()}`;

        console.log(
          `✅ [transicionarPedido] Pedido ${pedidoId} sincronizado a Ventas como ${ventaId}`
        );
      } catch (errorVenta) {
        console.error(
          `⚠️ [transicionarPedido] Venta creada parcialmente: ${errorVenta}`
        );
        // No fallar si la sincronización de ventas tiene problema
        // El pedido ya cambió de estado exitosamente
      }
    }

    // 5️⃣ RETORNAR: Respuesta exitosa
    return {
      success: true,
      mensaje: `✅ Pedido ${pedidoId} transicionó de ${pedidoActual.estado} a ${nuevoEstado}`,
      pedido: resultadoCambio.pedido,
      detalleStock: resultadoCambio.detalleStock,
      ventaCreada,
      ventaId
    };
  } catch (error) {
    console.error('❌ Error en transicionarPedido:', error);
    return {
      success: false,
      mensaje: `❌ Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      error: 'ERROR_INESPERADO'
    };
  }
}

/**
 * 🛡️ VALIDAR SI UN PEDIDO PUEDE SER EDITADO
 * 
 * Solo se pueden editar pedidos en estado "Pendiente"
 * 
 * @param estado - Estado actual del pedido
 * @returns {boolean} true si se puede editar
 */
export function puedeSerEditado(estado: Pedido['estado']): boolean {
  return estado === 'Pendiente';
}

/**
 * 🛡️ VALIDAR SI UN PEDIDO PUEDE SER ANULADO
 * 
 * Se pueden anular pedidos en estado "Pendiente" o "Completada"
 * No se pueden anular pedidos ya "Anulados"
 * 
 * @param estado - Estado actual del pedido
 * @returns {boolean} true si se puede anular
 */
export function puedeSerAnulado(estado: Pedido['estado']): boolean {
  return estado === 'Pendiente' || estado === 'Completada';
}

/**
 * 🛡️ VALIDAR SI UN PEDIDO PUEDE PASAR A COMPLETADA
 * 
 * Solo pedidos en estado "Pendiente" pueden pasar a "Completada"
 * 
 * @param estado - Estado actual del pedido
 * @returns {boolean} true si se puede completar
 */
export function puedeSerCompletado(estado: Pedido['estado']): boolean {
  return estado === 'Pendiente';
}

/**
 * 🎨 OBTENER CLASE CSS PARA ESTADO
 * 
 * Retorna clase para colorear el badge de estado
 * 
 * @param estado - Estado del pedido
 * @returns {string} Clase CSS para aplicar
 */
export function obtenerClaseEstado(
  estado: Pedido['estado']
): string {
  switch (estado) {
    case 'Pendiente':
      return 'bg-blue-100 text-blue-800';
    case 'Completada':
      return 'bg-green-100 text-green-800';
    case 'Anulado':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}


/**
 * 📝 OBTENER DESCRIPCIÓN DE ESTADO
 * 
 * @param estado - Estado del pedido
 * @returns {string} Descripción legible del estado
 */
export function obtenerDescripcionEstado(estado: Pedido['estado']): string {
  const descripciones: Record<Pedido['estado'], string> = {
    'Pendiente': 'Esperando confirmación',
    'Completada': 'Orden procesada y enviada a Ventas',
    'Anulado': 'Orden cancelada'
  };
  return descripciones[estado] || 'Estado desconocido';
}

/**
 * 🔍 HELPER: Obtener pedido del localStorage
 * @internal
 */
function obtenerPedidoDelLocalStorage(pedidoId: string): Pedido | null {
  try {
    const pedidosJson = localStorage.getItem('damabella_pedidos');
    if (!pedidosJson) return null;

    const pedidos: Pedido[] = JSON.parse(pedidosJson);
    return pedidos.find(p => p.id === pedidoId) || null;
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    return null;
  }
}

/**
 * 📊 REGLAS DE NEGOCIO DOCUMENTADAS
 * 
 * TRANSICIONES PERMITIDAS:
 * ┌─────────────┬──────────────┬──────────────┐
 * │ Estado      │ Puede ir a   │ Restricción  │
 * ├─────────────┼──────────────┼──────────────┤
 * │ Pendiente   │ Completada   │ Stock OK     │
 * │ Pendiente   │ Anulado      │ Siempre OK   │
 * │ Completada  │ Anulado      │ Siempre OK   │
 * │ Completada  │ Pendiente    │ ❌ BLOQUEADO │
 * │ Anulado     │ (Cualquiera) │ ❌ BLOQUEADO │
 * └─────────────┴──────────────┴──────────────┘
 * 
 * STOCK Y SINCRONIZACIÓN:
 * - Pendiente → Completada: Descuenta stock, crea venta automáticamente
 * - Completada → Anulado: Devuelve stock, actualiza venta
 * - Pendiente → Anulado: No toca stock (nunca se descargó)
 */
