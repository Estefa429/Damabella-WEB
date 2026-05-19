/**
 * 🎣 HOOK CENTRALIZADO: Cambio de Estado de Pedidos
 * 
 * Hook único que maneja toda la lógica de cambio de estado
 * para cualquier componente que lo necesite.
 * 
 * Uso:
 * const { cambiarEstado, cargando, error, exito } = useCambioEstadoPedido({
 *   onSincronizarVentas: crearVentaCallback
 * });
 */

import { useState, useCallback } from 'react';
import {
  cambiarEstadoPedidoCentralizado,
  puedeEditarse,
  puedeAnularse,
  puedeCompletarse,
  obtenerClaseEstado,
  obtenerDescripcionEstado,
  esEstadoTerminal
} from './cambioEstadoCentralizado';
import type { Pedido } from './pedidoService';

interface UseCambioEstadoPedidoProps {
  onSincronizarVentas?: (pedido: Pedido) => void | Promise<void>;
  onNotificar?: (tipo: 'exito' | 'error' | 'info', mensaje: string) => void;
  continuarSiError?: boolean;
}

interface EstadoHook {
  cargando: boolean;
  error: string | null;
  exito: boolean;
  ultimoPedidoActualizado?: Pedido;
}

interface RetornoHook extends EstadoHook {
  cambiarEstado: (pedidoId: string, nuevoEstado: Pedido['estado']) => Promise<void>;
  limpiarMensajes: () => void;
  puedeEditarse: (estado: Pedido['estado']) => boolean;
  puedeAnularse: (estado: Pedido['estado']) => boolean;
  puedeCompletarse: (estado: Pedido['estado']) => boolean;
  esEstadoTerminal: (estado: Pedido['estado']) => boolean;
  obtenerClaseEstado: (estado: Pedido['estado']) => string;
  obtenerDescripcionEstado: (estado: Pedido['estado']) => string;
}

/**
 * ✅ HOOK CENTRAL: useCambioEstadoPedido
 * 
 * Proporciona toda la funcionalidad para cambiar estados de pedidos
 * desde cualquier componente.
 * 
 * @param props - Configuración del hook
 * @returns Objeto con funciones y estado
 * 
 * @example
 * function MiComponente() {
 *   const { cambiarEstado, cargando, error, exito } = useCambioEstadoPedido({
 *     onSincronizarVentas: (pedido) => crearVentaEnModulo(pedido)
 *   });
 * 
 *   const handleClickCompletarPedido = async () => {
 *     await cambiarEstado(pedidoId, 'Completada');
 *   };
 * 
 *   return (
 *     <>
 *       <button 
 *         onClick={handleClickCompletarPedido}
 *         disabled={cargando || !puedeCompletarse(pedido.estado)}
 *       >
 *         {cargando ? 'Procesando...' : 'Completar Pedido'}
 *       </button>
 *       {error && <div className="text-red-600">{error}</div>}
 *       {exito && <div className="text-green-600">Operación exitosa</div>}
 *     </>
 *   );
 * }
 */
export function useCambioEstadoPedido(props?: UseCambioEstadoPedidoProps): RetornoHook {
  const { onSincronizarVentas, onNotificar, continuarSiError } = props || {};
  
  const [estado, setEstado] = useState<EstadoHook>({
    cargando: false,
    error: null,
    exito: false
  });

  // Función para cambiar estado
  const cambiarEstado = useCallback(
    async (pedidoId: string, nuevoEstado: Pedido['estado']) => {
      try {
        setEstado({ cargando: true, error: null, exito: false });

        const resultado = await cambiarEstadoPedidoCentralizado(
          pedidoId,
          nuevoEstado,
          {
            onSincronizarVentas,
            onNotificar,
            continuarSiError,
            onLog: (nivel, msg) => console.log(`[${nivel.toUpperCase()}] ${msg}`)
          }
        );

        if (resultado.success && resultado.pedido) {
          setEstado({
            cargando: false,
            error: null,
            exito: true,
            ultimoPedidoActualizado: resultado.pedido
          });
        } else {
          setEstado({
            cargando: false,
            error: resultado.error?.detalle || resultado.mensaje,
            exito: false
          });
        }
      } catch (errorCapturado) {
        const mensaje = errorCapturado instanceof Error 
          ? errorCapturado.message 
          : 'Error desconocido';
        setEstado({
          cargando: false,
          error: mensaje,
          exito: false
        });
      }
    },
    [onSincronizarVentas, onNotificar, continuarSiError]
  );

  // Limpiar mensajes
  const limpiarMensajes = useCallback(() => {
    setEstado({
      cargando: false,
      error: null,
      exito: false
    });
  }, []);

  return {
    cargando: estado.cargando,
    error: estado.error,
    exito: estado.exito,
    ultimoPedidoActualizado: estado.ultimoPedidoActualizado,
    cambiarEstado,
    limpiarMensajes,
    puedeEditarse,
    puedeAnularse,
    puedeCompletarse,
    esEstadoTerminal,
    obtenerClaseEstado,
    obtenerDescripcionEstado
  };
}

export type { UseCambioEstadoPedidoProps, RetornoHook, EstadoHook };\n