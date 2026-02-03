/**
 * 🎯 HOOK: usePedidoTransicion
 * 
 * Hook personalizado para manejar transiciones de estado de pedidos
 * con sincronización automática a Ventas.
 * 
 * Características:
 * - ✅ Validación de transiciones
 * - ✅ Sincronización con Ventas
 * - ✅ Manejo de errores
 * - ✅ Notificaciones al usuario
 * - ✅ Control de permisos por estado
 */

import { useState, useCallback } from 'react';
import type { Pedido } from '../services/pedidoService';
import {
  transicionarPedido,
  puedeSerEditado,
  puedeSerAnulado,
  puedeSerCompletado,
  obtenerClaseEstado,
  obtenerDescripcionEstado,
  type ResultadoTransicion
} from '../services/transicionEstadoPedidoService';

/**
 * Estado interno del hook
 */
interface EstadoHook {
  cargando: boolean;
  error: string | null;
  exito: string | null;
  ultimoResultado: ResultadoTransicion | null;
}

/**
 * Props del hook
 */
interface UsePedidoTransicionProps {
  onTransicionExitosa?: (resultado: ResultadoTransicion) => void;
  onErrorTransicion?: (error: string) => void;
  onSincronizarVentas?: (pedido: Pedido) => void;
}

/**
 * 🎣 HOOK: Manejar transiciones de estado de pedidos
 */
export function usePedidoTransicion(props?: UsePedidoTransicionProps) {
  const [estado, setEstado] = useState<EstadoHook>({
    cargando: false,
    error: null,
    exito: null,
    ultimoResultado: null
  });

  /**
   * 🔄 Cambiar estado del pedido
   */
  const cambiarEstado = useCallback(
    async (pedidoId: string, nuevoEstado: 'Pendiente' | 'Completada' | 'Anulado') => {
      setEstado(prev => ({
        ...prev,
        cargando: true,
        error: null,
        exito: null
      }));

      try {
        const resultado = await transicionarPedido(
          pedidoId,
          nuevoEstado,
          props?.onSincronizarVentas
        );

        if (resultado.success) {
          setEstado(prev => ({
            ...prev,
            cargando: false,
            exito: resultado.mensaje,
            ultimoResultado: resultado
          }));

          props?.onTransicionExitosa?.(resultado);
        } else {
          setEstado(prev => ({
            ...prev,
            cargando: false,
            error: resultado.mensaje,
            ultimoResultado: resultado
          }));

          props?.onErrorTransicion?.(resultado.mensaje);
        }

        return resultado;
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error desconocido';
        setEstado(prev => ({
          ...prev,
          cargando: false,
          error: mensaje
        }));

        props?.onErrorTransicion?.(mensaje);
        throw err;
      }
    },
    [props]
  );

  /**
   * 🧹 Limpiar mensajes
   */
  const limpiarMensajes = useCallback(() => {
    setEstado(prev => ({
      ...prev,
      error: null,
      exito: null
    }));
  }, []);

  return {
    // Estado
    cargando: estado.cargando,
    error: estado.error,
    exito: estado.exito,
    ultimoResultado: estado.ultimoResultado,

    // Acciones
    cambiarEstado,
    limpiarMensajes,

    // Helpers
    puedeSerEditado,
    puedeSerAnulado,
    puedeSerCompletado,
    obtenerClaseEstado,
    obtenerDescripcionEstado
  };
}
