/**
 * 📚 EJEMPLOS DE INTEGRACIÓN
 * 
 * Este archivo contiene ejemplos listos para copiar-pegar en tus componentes.
 * Copiar solo la parte que necesites según tu caso de uso.
 */

import { useState } from 'react';
import { useCambioEstadoPedido } from '../hooks/useCambioEstadoPedido';
import { cambiarEstadoPedidoCentralizado } from '../services/cambioEstadoCentralizado';
import type { Pedido } from '../services/pedidoService';

// ============================================================================
// EJEMPLO 1: Botones de Acción Simples en una Tabla
// ============================================================================

/**
 * Uso: Renderizar en una columna de tabla de pedidos
 * Comportamiento: Botones que cambian según el estado
 */
export function BotonesEstadoTabla({ pedido, onActualizar }: {
  pedido: Pedido;
  onActualizar: () => void;
}) {
  const { cambiarEstado, cargando, puedeCompletarse, puedeAnularse } = useCambioEstadoPedido({
    onNotificar: (tipo, msg) => {
      console.log(`[${tipo}] ${msg}`);
      // Aquí iría tu toast/notificación
    }
  });

  return (
    <div className="flex gap-2">
      {/* BOTÓN COMPLETAR */}
      {puedeCompletarse(pedido.estado) && (
        <button
          onClick={async () => {
            await cambiarEstado(pedido.id, 'Completada');
            onActualizar();
          }}
          disabled={cargando}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {cargando ? '⏳' : '✓'} Completar
        </button>
      )}

      {/* BOTÓN ANULAR */}
      {puedeAnularse(pedido.estado) && (
        <button
          onClick={async () => {
            await cambiarEstado(pedido.id, 'Anulado');
            onActualizar();
          }}
          disabled={cargando}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          ✕ Anular
        </button>
      )}
    </div>
  );
}

// ============================================================================
// EJEMPLO 2: Card de Detalle con Estado y Acciones
// ============================================================================

/**
 * Uso: Mostrar detalles de un pedido con barra de estado y acciones
 * Características: Badge de estado, descripción, botones contextuales
 */
export function CardDetallePedido({ pedido, onActualizado }: {
  pedido: Pedido;
  onActualizado?: (pedidoActualizado: Pedido) => void;
}) {
  const {
    cambiarEstado,
    cargando,
    error,
    exito,
    limpiarMensajes,
    puedeEditarse,
    puedeCompletarse,
    puedeAnularse,
    obtenerClaseEstado,
    obtenerDescripcionEstado,
    ultimoPedidoActualizado
  } = useCambioEstadoPedido();

  // Actualizar pedido visible cuando cambia
  const pedidoMostrado = ultimoPedidoActualizado || pedido;

  const handleCambiarEstado = async (nuevoEstado: Pedido['estado']) => {
    await cambiarEstado(pedido.id, nuevoEstado);
    if (ultimoPedidoActualizado) {
      onActualizado?.(ultimoPedidoActualizado);
      limpiarMensajes();
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      {/* HEADER CON ESTADO */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold">Pedido {pedidoMostrado.id}</h2>
          <p className="text-gray-600">Cliente: {pedidoMostrado.clienteId}</p>
        </div>
        <span className={`px-3 py-1 rounded text-sm font-medium ${obtenerClaseEstado(pedidoMostrado.estado)}`}>
          {pedidoMostrado.estado}
        </span>
      </div>

      {/* DESCRIPCIÓN DEL ESTADO */}
      <p className="text-gray-700 mb-4">
        ℹ️ {obtenerDescripcionEstado(pedidoMostrado.estado)}
      </p>

      {/* DETALLES */}
      <div className="bg-gray-50 p-4 rounded mb-4">
        <p><strong>Fecha:</strong> {new Date(pedidoMostrado.fecha).toLocaleDateString('es-ES')}</p>
        <p><strong>Productos:</strong> {pedidoMostrado.productos.length} items</p>
        <p><strong>Editable:</strong> {puedeEditarse(pedidoMostrado.estado) ? '✓ Sí' : '✗ No'}</p>
      </div>

      {/* MENSAJES */}
      {error && (
        <div className="mb-3 p-3 bg-red-100 text-red-700 rounded">
          ❌ {error}
        </div>
      )}
      {exito && (
        <div className="mb-3 p-3 bg-green-100 text-green-700 rounded">
          ✓ Cambio realizado exitosamente
        </div>
      )}

      {/* BOTONES DE ACCIÓN */}
      <div className="flex gap-2">
        {puedeCompletarse(pedidoMostrado.estado) && (
          <button
            onClick={() => handleCambiarEstado('Completada')}
            disabled={cargando}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {cargando ? '⏳ Procesando...' : '✓ Completar Pedido'}
          </button>
        )}

        {puedeAnularse(pedidoMostrado.estado) && (
          <button
            onClick={() => handleCambiarEstado('Anulado')}
            disabled={cargando}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {cargando ? '⏳ Procesando...' : '✕ Anular Pedido'}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EJEMPLO 3: Modal para Cambiar Estado
// ============================================================================

/**
 * Uso: Modal que permite seleccionar el nuevo estado
 * Características: Dropdown dinámico, validación integrada
 */
export function ModalCambiarEstado({
  pedido,
  isOpen,
  onClose,
  onExito
}: {
  pedido: Pedido;
  isOpen: boolean;
  onClose: () => void;
  onExito?: () => void;
}) {
  const [nuevoEstadoSeleccionado, setNuevoEstadoSeleccionado] = useState<Pedido['estado']>(pedido.estado);
  const {
    cambiarEstado,
    cargando,
    error,
    puedeCompletarse,
    puedeAnularse
  } = useCambioEstadoPedido();

  const handleAplicar = async () => {
    if (nuevoEstadoSeleccionado === pedido.estado) {
      onClose();
      return;
    }
    await cambiarEstado(pedido.id, nuevoEstadoSeleccionado);
    if (!error) {
      onExito?.();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Cambiar Estado del Pedido</h2>

        <p className="text-gray-600 mb-4">
          Pedido <strong>{pedido.id}</strong> - Estado actual: <strong>{pedido.estado}</strong>
        </p>

        {/* SELECTOR DE ESTADO */}
        <select
          value={nuevoEstadoSeleccionado}
          onChange={(e) => setNuevoEstadoSeleccionado(e.target.value as Pedido['estado'])}
          className="w-full px-3 py-2 border rounded mb-4"
        >
          <option value={pedido.estado} disabled>
            {pedido.estado} (actual)
          </option>
          {puedeCompletarse(pedido.estado) && (
            <option value="Completada">→ Completada</option>
          )}
          {puedeAnularse(pedido.estado) && (
            <option value="Anulado">→ Anulado</option>
          )}
        </select>

        {/* ERROR */}
        {error && (
          <div className="mb-3 p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* BOTONES */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={cargando}
            className="px-4 py-2 text-gray-700 border rounded hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleAplicar}
            disabled={cargando || nuevoEstadoSeleccionado === pedido.estado}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {cargando ? 'Procesando...' : 'Aplicar Cambio'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EJEMPLO 4: Usar en Servicio (sin React)
// ============================================================================

/**
 * Uso: En funciones de servicio, eventos, o lógica de negocio
 * Características: Promesas, callbacks, manejo de errores
 */
export async function procesarCompletacionPedido(
  pedidoId: string,
  callbacks?: {
    onInicio?: () => void;
    onExito?: (resultado: any) => void;
    onError?: (error: string) => void;
  }
) {
  try {
    callbacks?.onInicio?.();

    // Crear venta cuando se completa
    const crearVenta = async (pedido: Pedido) => {
      const ventasJson = localStorage.getItem('damabella_ventas') || '[]';
      const ventas = JSON.parse(ventasJson);

      const nuevaVenta = {
        id: `vta_${Date.now()}`,
        pedidoId: pedido.id,
        clienteId: pedido.clienteId,
        productos: pedido.productos,
        total: pedido.productos.reduce((sum, p) => sum + (p.precioVenta * p.cantidad), 0),
        fecha: new Date().toISOString(),
        estado: 'Completada'
      };

      ventas.push(nuevaVenta);
      localStorage.setItem('damabella_ventas', JSON.stringify(ventas));
      console.log('✓ Venta creada:', nuevaVenta.id);
    };

    // Usar la función centralizada
    const resultado = await cambiarEstadoPedidoCentralizado(
      pedidoId,
      'Completada',
      {
        onSincronizarVentas: crearVenta,
        onLog: (nivel, msg) => console.log(`[${nivel}] ${msg}`)
      }
    );

    if (resultado.success) {
      callbacks?.onExito?.(resultado);
      return resultado;
    } else {
      callbacks?.onError?.(resultado.error?.detalle || resultado.mensaje);
      throw new Error(resultado.mensaje);
    }
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    callbacks?.onError?.(mensaje);
    throw error;
  }
}

// ============================================================================
// EJEMPLO 5: Hook Personalizado para tu Caso de Uso
// ============================================================================

/**
 * Uso: Crear un hook personalizado que encapsula tu lógica
 * Ventaja: Reutilizable en múltiples componentes
 */
export function usePedidosManager() {
  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const stored = localStorage.getItem('damabella_pedidos');
    return stored ? JSON.parse(stored) : [];
  });

  const {
    cambiarEstado,
    cargando,
    error,
    ultimoPedidoActualizado
  } = useCambioEstadoPedido({
    // Sincronizar con Ventas
    onSincronizarVentas: (pedido) => {
      const ventasJson = localStorage.getItem('damabella_ventas') || '[]';
      const ventas = JSON.parse(ventasJson);
      ventas.push({
        id: `vta_${Date.now()}`,
        pedidoId: pedido.id,
        clienteId: pedido.clienteId,
        productos: pedido.productos,
        total: pedido.productos.reduce((sum, p) => sum + (p.precioVenta * p.cantidad), 0),
        fecha: new Date().toISOString()
      });
      localStorage.setItem('damabella_ventas', JSON.stringify(ventas));
    },

    // Notificar cambios
    onNotificar: (tipo, mensaje) => {
      console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    }
  });

  // Actualizar state local cuando hay cambios
  const handleCambiarEstado = async (pedidoId: string, estado: Pedido['estado']) => {
    await cambiarEstado(pedidoId, estado);
    if (ultimoPedidoActualizado) {
      setPedidos(prev =>
        prev.map(p => p.id === ultimoPedidoActualizado.id ? ultimoPedidoActualizado : p)
      );
    }
  };

  return {
    pedidos,
    cargando,
    error,
    cambiarEstado: handleCambiarEstado
  };
}

// ============================================================================
// EJEMPLO 6: Acciones Masivas (Cambiar múltiples pedidos)
// ============================================================================

/**
 * Uso: Anular o completar varios pedidos de una vez
 * Características: Control de progreso, manejo de errores parciales
 */
export async function procesarPedidosMasivos(
  pedidosIds: string[],
  accion: 'completar' | 'anular',
  onProgreso?: (actual: number, total: number) => void
): Promise<{ exitosos: string[]; fallidos: string[] }> {
  const exitosos: string[] = [];
  const fallidos: string[] = [];

  const nuevoEstado = accion === 'completar' ? 'Completada' : 'Anulado';

  for (let i = 0; i < pedidosIds.length; i++) {
    const pedidoId = pedidosIds[i];

    try {
      const resultado = await cambiarEstadoPedidoCentralizado(
        pedidoId,
        nuevoEstado,
        {
          continuarSiError: true
        }
      );

      if (resultado.success) {
        exitosos.push(pedidoId);
      } else {
        fallidos.push(pedidoId);
      }
    } catch (error) {
      fallidos.push(pedidoId);
    }

    onProgreso?.(i + 1, pedidosIds.length);
  }

  return { exitosos, fallidos };
}