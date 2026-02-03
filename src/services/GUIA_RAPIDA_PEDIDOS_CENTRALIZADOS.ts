/**
 * 📖 GUÍA RÁPIDA - FUNCIÓN MAESTRA CENTRALIZADA
 * 
 * Archivo: src/services/pedidosCentralizado.ts
 * Función Principal: cambiarEstadoPedidoCentralizado()
 */

import {
  cambiarEstadoPedidoCentralizado,
  puedeEditarse,
  puedeTransicionar,
  obtenerEstadosValidos,
  obtenerDescripcionEstado,
  obtenerClaseEstado,
  type EstadoPedido,
} from '../services/pedidosCentralizado';

// ============================================================
// USO 1: CAMBIAR ESTADO (COMPLETO)
// ============================================================

/*
// function ejemplo_cambiar_estado() {
//   const resultado = cambiarEstadoPedidoCentralizado(
//     pedido,
//     'Completada', // o 'Anulado'
//     {
//       // Llamado cuando la transición es exitosa
//       onExitoso: (resultado) => {
//         console.log(`✅ ${resultado.tipo}: ${resultado.mensaje}`);
//         console.log('Tipo de transición:', resultado.tipo); // 'completar' o 'anular'
//         console.log('Stock devuelto:', resultado.stockDevuelto); // Si aplica
//       },
//
//       // Llamado en caso de error
//       onError: (error) => {
//         console.error('❌ Error:', error);
//       },
//
//       // Para mostrar notificaciones en UI
//       onNotificar: (titulo, mensaje, tipo) => {
//         showToast(titulo, mensaje, tipo);
//       },
//
//       // Para logs detallados
//       onLog: (mensaje, nivel) => {
//         console.log(`[${nivel.toUpperCase()}] ${mensaje}`);
//       },
//     }
//   );
//
//   // Actualizar UI solo si fue exitoso
//   if (resultado.exitoso && resultado.pedidoActualizado) {
//     setPedidos(pedidos.map(p =>
//       p.id === pedido.id ? resultado.pedidoActualizado : p
//     ));
//   }
// }

// ============================================================
// USO 2: VALIDAR ANTES DE MOSTRAR BOTONES
// ============================================================

function ejemplo_validaciones() {
  const estado = pedido.estado;

  // ✅ ¿Puede editarse?
  const puedeEditar = puedeEditarse(estado);
  console.log('¿Puede editar?', puedeEditar); // true solo si Pendiente

  // ✅ ¿Puede pasar a otro estado?
  const puedeAAnular = puedeTransicionar(estado, 'Anulado');
  console.log('¿Puede anularse?', puedeAAnular); // true si Pendiente o Completada

  const puedeACompletar = puedeTransicionar(estado, 'Completada');
  console.log('¿Puede completarse?', puedeACompletar); // true solo si Pendiente

  // ✅ Obtener todos los estados válidos como destino
  const estadosValidos = obtenerEstadosValidos(estado);
  console.log('Estados permitidos:', estadosValidos);
  // Si estado === 'Pendiente': ['Completada', 'Anulado']
  // Si estado === 'Completada': ['Anulado']
  // Si estado === 'Anulado': []
}

// ============================================================
// USO 3: EN UN COMPONENTE REACT (EJEMPLO)
// ============================================================

/*
// export function PedidosComponent() {
//   const [pedidos, setPedidos] = useState<any[]>([]);
//
//   // Manejar cualquier cambio de estado
//   const handleCambiarEstado = (pedido: any, nuevoEstado: EstadoPedido) => {
//     // 1️⃣ Validar primero
//     if (!puedeTransicionar(pedido.estado, nuevoEstado)) {
//       alert(`No puedes cambiar de ${pedido.estado} a ${nuevoEstado}`);
//       return;
//     }
//
//     // 2️⃣ Ejecutar transición
//     const resultado = cambiarEstadoPedidoCentralizado(pedido, nuevoEstado, {
//       onExitoso: (res) => {
//         // Actualizar UI
//         setPedidos(pedidos.map(p =>
//           p.id === pedido.id ? res.pedidoActualizado! : p
//         ));
//       },
//       onNotificar: (titulo, msg, tipo) => {
//         showToast(titulo, msg, tipo);
//       },
//     });
//   };
//
//   // Completar pedido
  const handleCompletarPedido = (pedido: any) => {
    handleCambiarEstado(pedido, 'Completada');
    // Automáticamente:
    // - Crea Venta
    // - Descuenta stock
    // - Sincroniza módulos
  };

  // Anular pedido
  const handleAnularPedido = (pedido: any) => {
    handleCambiarEstado(pedido, 'Anulado');
    // Automáticamente:
    // - Si era Completada → Devuelve stock
    // - Marca Venta como Anulada
    // - Sincroniza módulos
  };

  // return (
  //   <div>
  //     {pedidos.map(pedido => (
  //       <div key={pedido.id} className="pedido-card">
  //         <h3>{pedido.numeroPedido}</h3>
  //
  //         {/* Mostrar estado con estilo }*/
  //         <span className={obtenerClaseEstado(pedido.estado)}>
  //           {obtenerDescripcionEstado(pedido.estado)}
  //         </span>
  //
  //         {/* Botones contextuales - SOLO mostrar si es válido */}
  //         <div className="acciones">
  //           {puedeEditarse(pedido.estado) && (
  //             <button onClick={() => handleEdit(pedido)}>
  //               ✏️ Editar
  //             </button>
  //           )}
  //
  //           {puedeTransicionar(pedido.estado, 'Completada') && (
  //             <button onClick={() => handleCompletarPedido(pedido)}>
  //               ✅ Completar
  //             </button>
  //           )}
  //
  //           {puedeTransicionar(pedido.estado, 'Anulado') && (
  //             <button onClick={() => handleAnularPedido(pedido)}>
  //               ❌ Anular
  //             </button>
  //           )}
  //         </div>
  //       </div>
  //     ))}
  //   </div>
  // );
// }

// ============================================================
// USO 4: MODAL DE SELECCIÓN DE ESTADO (EJEMPLO)
// ============================================================

// export function ModalCambiarEstado({ pedido, onClose }: any) {
//   const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoPedido>(pedido.estado);
//
//   // Obtener SOLO estados válidos para mostrar
//   const estadosDisponibles = obtenerEstadosValidos(pedido.estado);
//
//   const handleConfirmar = () => {
//     const resultado = cambiarEstadoPedidoCentralizado(pedido, estadoSeleccionado, {
//       onExitoso: () => onClose(true), // Cerrar y actualizar
//       onError: () => {
//         // Mostrar error, mantener modal abierto
//       },
//     });
//   };
//
//   return (
//     <div className="modal">
//       <h2>Cambiar Estado</h2>
//       <p>Pedido: {pedido.numeroPedido}</p>
//       <p>Estado actual: <strong>{pedido.estado}</strong></p>
//
//       <p>Selecciona nuevo estado:</p>
//       <div className="opciones">
//         {estadosDisponibles.map(estado => (
//           <button
//             key={estado}
//             onClick={() => setEstadoSeleccionado(estado)}
//             className={estadoSeleccionado === estado ? 'selected' : ''}
//           >
//             {estado}
//           </button>
//         ))}
//       </div>
//
//       <div className="acciones">
//         <button onClick={onClose}>Cancelar</button>
//         <button onClick={handleConfirmar}>Confirmar</button>
//       </div>
//     </div>
//   );
// }

// ============================================================
// USO 5: FLUJO COMPLETO CON CONFIRMACIÓN
// ============================================================

export function AnularConConfirmacion({ pedido, onClose }: any) {
  const handleConfirmar = () => {
    const resultado = cambiarEstadoPedidoCentralizado(pedido, 'Anulado', {
      onExitoso: (res) => {
        // Mostrar qué se hizo
        if (res.tipo === 'anular' && res.stockDevuelto) {
          alert(
            `✅ Pedido anulado.\n` +
            `📦 Stock devuelto: ${res.stockDevuelto.length} productos`
          );
        }
        onClose(true);
      },
      onNotificar: (titulo, msg) => {
        alert(`${titulo}: ${msg}`);
      },
    });
  };

  // return (
  //   <div className="modal-confirmacion">
  //     <h2>⚠️ Confirmar Anulación</h2>
  //     <p>¿Estás seguro de anular {pedido.numeroPedido}?</p>
  //
  //     {pedido.estado === 'Completada' && (
  //       <div className="aviso">
  //         📦 El stock será devuelto automáticamente al inventario
  //       </div>
  //     )}
  //
  //     <div className="acciones">
  //       <button onClick={onClose}>Cancelar</button>
  //       <button onClick={handleConfirmar} className="danger">
  //         Sí, Anular
  //       </button>
  //     </div>
  //   </div>
  // );
// }

// ============================================================
// REFERENCIA: TIPOS DE TRANSICIÓN
// ============================================================

/*
TIPO: 'completar' (Pendiente → Completada)
  - Crea Venta automáticamente
  - Descuenta stock de inventario
  - Sincroniza módulo Ventas
  - Retorna: ventaCreada, pedidoActualizado
  
  Ejemplo:
  resultado.tipo === 'completar'
  resultado.ventaCreada?.numeroVenta // 'VEN-001'

---

TIPO: 'anular' (Pendiente/Completada → Anulado)
  - Si era Pendiente: Solo cambiar estado
  - Si era Completada: Devolver stock + marcar Venta como Anulada
  - Sincroniza módulos Pedidos y Ventas
  - Retorna: stockDevuelto[], pedidoActualizado

  Ejemplo:
  resultado.tipo === 'anular'
  resultado.stockDevuelto?.map(item => `${item.nombreProducto}: ${item.cantidad}`)
*/

// ============================================================
// MATRIZ RÁPIDA DE VALIDACIÓN
// ============================================================

/*
VALIDACIONES CON puedeTransicionar():

┌─────────────────────┬──────────────────────────────────────────┐
│ Estado Actual       │ Estados Válidos Destino                  │
├─────────────────────┼──────────────────────────────────────────┤
│ Pendiente           │ → Completada (crear Venta)               │
│                     │ → Anulado (cancelar)                     │
├─────────────────────┼──────────────────────────────────────────┤
│ Completada          │ → Anulado (anular con devolución)        │
├─────────────────────┼──────────────────────────────────────────┤
│ Anulado             │ (Ninguno - estado terminal)              │
└─────────────────────┴──────────────────────────────────────────┘

BLOQUEOS:

// ❌ No permitido: reversa
puedeTransicionar('Completada', 'Pendiente') === false

// ❌ No permitido: modificar terminal
puedeTransicionar('Anulado', 'Pendiente') === false
puedeTransicionar('Anulado', 'Completada') === false

// ✅ Permitido
puedeTransicionar('Pendiente', 'Completada') === true
puedeTransicionar('Completada', 'Anulado') === true

// ❌ Edición bloqueada
puedeEditarse('Completada') === false
puedeEditarse('Anulado') === false
puedeEditarse('Pendiente') === true
*/}
