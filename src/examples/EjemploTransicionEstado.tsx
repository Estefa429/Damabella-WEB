/**
 * 📚 EJEMPLO COMPLETO DE INTEGRACIÓN
 * 
 * Muestra cómo usar la lógica de transición de estado en un componente React real.
 * 
 * Este ejemplo incluye:
 * - ✅ Hook usePedidoTransicion
 * - ✅ Cambio de estado Pendiente → Completada
 * - ✅ Sincronización automática con Ventas
 * - ✅ Validación de permisos
 * - ✅ Feedback visual al usuario
 */

import { useState, useCallback } from 'react';
import type { Pedido } from '../services/pedidoService';
import { usePedidoTransicion } from '../hooks/usePedidoTransicion';

/**
 * 📋 EJEMPLO 1: Componente simple con un pedido
 */
export function EjemploTransicionPedidoSimple({
  pedido: pedidoInicial,
  onActualizar
}: {
  pedido: Pedido;
  onActualizar: (pedido: Pedido) => void;
}) {
  // Usar el hook para manejar transiciones
  const {
    cargando,
    error,
    exito,
    cambiarEstado,
    limpiarMensajes,
    puedeSerCompletado,
    puedeSerAnulado,
    obtenerClaseEstado
  } = usePedidoTransicion({
    onTransicionExitosa: (resultado) => {
      console.log('✅ Transición exitosa:', resultado);
      if (resultado.pedido) {
        onActualizar(resultado.pedido);
      }
    },
    onErrorTransicion: (error) => {
      console.error('❌ Error en transición:', error);
    }
  });

  const [pedido, setPedido] = useState(pedidoInicial);

  const manejarCompletar = async () => {
    const resultado = await cambiarEstado(pedido.id, 'Completada');
    if (resultado.success && resultado.pedido) {
      setPedido(resultado.pedido);
    }
  };

  const manejarAnular = async () => {
    if (!window.confirm('¿Seguro que quieres anular este pedido?')) return;
    const resultado = await cambiarEstado(pedido.id, 'Anulado');
    if (resultado.success && resultado.pedido) {
      setPedido(resultado.pedido);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-white shadow-md">
      <h3 className="text-xl font-bold mb-4">Pedido {pedido.id}</h3>

      {/* 📊 Información del pedido */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-gray-600 text-sm">Cliente</p>
          <p className="font-semibold">{pedido.clienteId}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Total</p>
          <p className="font-semibold text-lg">${pedido.productos.reduce((acc, p) => acc + p.cantidad * p.precioVenta, 0).toLocaleString('es-CO')}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Estado</p>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${obtenerClaseEstado(pedido.estado)}`}>
            {pedido.estado}
          </span>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Items</p>
          <p className="font-semibold">{pedido.productos.length} productos</p>
        </div>
      </div>

      {/* ⚠️ Mensajes de estado */}
      {error && (
        <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {exito && (
        <div className="p-3 mb-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {exito}
        </div>
      )}

      {/* 🎯 Botones de acción */}
      <div className="flex gap-3">
        {/* Completar */}
        {puedeSerCompletado(pedido.estado) && (
          <button
            onClick={manejarCompletar}
            disabled={cargando}
            className="px-4 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600 disabled:bg-gray-400"
          >
            {cargando ? '⏳ Procesando...' : '✓ Marcar como Completada'}
          </button>
        )}

        {/* Anular */}
        {puedeSerAnulado(pedido.estado) && (
          <button
            onClick={manejarAnular}
            disabled={cargando}
            className="px-4 py-2 bg-red-500 text-white rounded font-medium hover:bg-red-600 disabled:bg-gray-400"
          >
            {cargando ? '⏳ Procesando...' : '✕ Anular'}
          </button>
        )}

        {/* Mensaje si está terminado */}
        {pedido.estado === 'Anulado' && (
          <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded font-medium">
            Este pedido no puede cambiar de estado
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 🎯 EJEMPLO 2: Lista de pedidos con transiciones
 */
export function EjemploListaPedidosConTransiciones({
  pedidosInicial,
  onCrearVenta
}: {
  pedidosInicial: Pedido[];
  onCrearVenta: (pedido: Pedido) => void;
}) {
  const [pedidos, setPedidos] = useState(pedidosInicial);
  const [cargandoId, setCargandoId] = useState<string | null>(null);

  const {
    cambiarEstado,
    puedeSerCompletado,
    puedeSerAnulado,
    obtenerClaseEstado
  } = usePedidoTransicion({
    onTransicionExitosa: (resultado) => {
      if (resultado.pedido) {
        // Actualizar lista local
        setPedidos(prev =>
          prev.map(p => p.id === resultado.pedido!.id ? resultado.pedido! : p)
        );

        // Si se completó, sincronizar con Ventas
        if (resultado.ventaCreada) {
          onCrearVenta(resultado.pedido);
        }
      }
    },
    onSincronizarVentas: (pedido) => {
      // Este callback se ejecuta cuando se pasa a Completada
      onCrearVenta(pedido);
    }
  });

  const manejarTransicion = async (pedidoId: string, nuevoEstado: Pedido['estado']) => {
    setCargandoId(pedidoId);
    try {
      await cambiarEstado(pedidoId, nuevoEstado);
    } finally {
      setCargandoId(null);
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Pedido</th>
            <th className="px-4 py-3 text-left font-semibold">Cliente</th>
            <th className="px-4 py-3 text-right font-semibold">Total</th>
            <th className="px-4 py-3 text-left font-semibold">Estado</th>
            <th className="px-4 py-3 text-left font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map(pedido => (
            <tr key={pedido.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{pedido.id}</td>
              <td className="px-4 py-3">{pedido.clienteId}</td>
              <td className="px-4 py-3 text-right">${pedido.productos.reduce((acc, p) => acc + p.cantidad * p.precioVenta, 0).toLocaleString('es-CO')}</td>
              <td className="px-4 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${obtenerClaseEstado(pedido.estado)}`}
                >
                  {pedido.estado}
                </span>
              </td>
              <td className="px-4 py-3 flex gap-2">
                {/* Completar */}
                {puedeSerCompletado(pedido.estado) && (
                  <button
                    onClick={() => manejarTransicion(pedido.id, 'Completada')}
                    disabled={cargandoId === pedido.id}
                    className="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                  >
                    {cargandoId === pedido.id ? '...' : 'Completar'}
                  </button>
                )}

                {/* Anular */}
                {puedeSerAnulado(pedido.estado) && (
                  <button
                    onClick={() => manejarTransicion(pedido.id, 'Anulado')}
                    disabled={cargandoId === pedido.id}
                    className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
                  >
                    {cargandoId === pedido.id ? '...' : 'Anular'}
                  </button>
                )}

                {/* Terminal */}
                {pedido.estado === 'Anulado' && (
                  <span className="px-2 py-1 text-sm text-gray-600">Terminal</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 🔌 EJEMPLO 3: Integración en PedidosManager existente
 * 
 * Este código muestra cómo reemplazar la lógica existente en PedidosManager.tsx
 * 
 * ANTES (código existente):
 * ```tsx
 * const cambiarEstado = (pedido: Pedido, nuevoEstado: Pedido['estado']) => {
 *   setPedidos(pedidos.map(p =>
 *     p.id === pedido.id ? { ...p, estado: nuevoEstado } : p
 *   ));
 *   // ... más lógica
 * };
 * ```
 * 
 * DESPUÉS (con el hook):
 * ```tsx
 * const { cambiarEstado: transicionar } = usePedidoTransicion({
 *   onTransicionExitosa: (resultado) => {
 *     setPedidos(pedidos.map(p =>
 *       p.id === resultado.pedido?.id ? resultado.pedido : p
 *     ));
 *   },
 *   onSincronizarVentas: (pedido) => {
 *     crearVentaDesdePedido(pedido);
 *   }
 * });
 * ```
 */

/**
 * 📋 EJEMPLO 4: Manejo completo de errores y transiciones
 */
export function EjemploTransicionConErrores() {
  const [estado, setEstado] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mensajeError, setMensajeError] = useState('');
  const [pedidoActual, setPedidoActual] = useState<Pedido | null>(null);

  const { cambiarEstado } = usePedidoTransicion({
    onTransicionExitosa: (resultado) => {
      setEstado('success');
      if (resultado.pedido) {
        setPedidoActual(resultado.pedido);
      }
      // Limpiar después de 3 segundos
      setTimeout(() => setEstado('idle'), 3000);
    },
    onErrorTransicion: (error) => {
      setEstado('error');
      setMensajeError(error);
      // Limpiar después de 5 segundos
      setTimeout(() => setEstado('idle'), 5000);
    }
  });

  const manejarCambio = async (pedidoId: string, nuevoEstado: Pedido['estado']) => {
    setEstado('loading');
    try {
      const resultado = await cambiarEstado(pedidoId, nuevoEstado);
      // El resultado ya se maneja en los callbacks
    } catch (err) {
      console.error('Error inesperado:', err);
      setEstado('error');
      setMensajeError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  return (
    <div className="p-4">
      {/* Loading */}
      {estado === 'loading' && (
        <div className="p-3 bg-blue-100 text-blue-700 rounded animate-pulse">
          ⏳ Procesando transición...
        </div>
      )}

      {/* Success */}
      {estado === 'success' && (
        <div className="p-3 bg-green-100 text-green-700 rounded">
          ✅ Pedido actualizado exitosamente
        </div>
      )}

      {/* Error */}
      {estado === 'error' && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          ❌ {mensajeError}
        </div>
      )}

      {/* Contenido principal */}
      {pedidoActual && (
        <div className="mt-4 p-4 border rounded">
          <p>Pedido actual: {pedidoActual.id}</p>
          <p>Estado: {pedidoActual.estado}</p>
        </div>
      )}
    </div>
  );
}
