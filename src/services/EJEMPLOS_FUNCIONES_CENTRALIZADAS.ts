/**
 * 📚 EJEMPLOS DE USO - FUNCIONES CENTRALIZADAS
 * 
 * Este archivo muestra cómo integrar las funciones centralizadas
 * de cambio de estado y anulación en tus componentes React
 */

import {
  cambiarEstadoCentralizado,
  puedeEditarse,
  puedeAnularse,
  puedeCompletarse,
  esEstadoTerminal,
  obtenerClaseEstado,
  obtenerDescripcionEstado,
} from '../services/cambiarEstadoCentralizado';

import {
  anularPedidoCentralizado,
  puedeAnularseActualmente,
} from '../services/anularPedidoCentralizado';

// ============================================================
// EJEMPLO 1: Cambiar estado de Pendiente a Completada
// ============================================================

export function ejemploCompletarPedido(pedido: any) {
  console.log('\n📋 EJEMPLO 1: Completar Pedido (Pendiente → Completada)\n');

  const resultado = cambiarEstadoCentralizado(pedido, 'Completada', {
    onNotificar: (titulo, mensaje, tipo) => {
      console.log(`[${tipo.toUpperCase()}] ${titulo}: ${mensaje}`);
    },
    onVentaCreada: (venta) => {
      console.log('✅ Nueva venta creada:', venta.numeroVenta);
    },
    onLog: (msg) => {
      console.log(msg);
    },
  });

  if (resultado.exitoso) {
    console.log('✅ Pedido completado exitosamente');
    console.log('   Venta creada:', resultado.ventaCreada?.numeroVenta);
    console.log('   Estado del pedido:', resultado.pedidoActualizado?.estado);
  } else {
    console.error('❌ Error:', resultado.error);
  }
}

// ============================================================
// EJEMPLO 2: Anular un pedido (con devolución de stock)
// ============================================================

export function ejemploAnularPedido(pedido: any) {
  console.log('\n📋 EJEMPLO 2: Anular Pedido (Completada → Anulado con devolución de stock)\n');

  // Verificar si puede anularse ANTES de llamar
  if (!puedeAnularseActualmente(pedido.estado)) {
    console.warn(`⚠️ No puedes anular un pedido en estado ${pedido.estado}`);
    return;
  }

  const resultado = anularPedidoCentralizado(pedido, {
    onNotificar: (titulo, mensaje, tipo) => {
      console.log(`[${tipo.toUpperCase()}] ${titulo}: ${mensaje}`);
    },
    onAnulado: (pedidoAnulado) => {
      console.log('✅ Pedido anulado:', pedidoAnulado.numeroPedido);
    },
    onLog: (msg) => {
      console.log(msg);
    },
  });

  if (resultado.exitoso) {
    console.log('✅ Pedido anulado exitosamente');
    if (resultado.stockDevuelto) {
      console.log(`📦 Stock devuelto (${resultado.stockDevuelto.length} productos):`);
      resultado.stockDevuelto.forEach((item) => {
        console.log(`   - ${item.nombreProducto} (${item.talla}/${item.color}): ${item.cantidad} unidades`);
      });
    }
  } else {
    console.error('❌ Error:', resultado.error);
  }
}

// ============================================================
// EJEMPLO 3: Validar transiciones antes de mostrar botones
// ============================================================

export function ejemploValidarTransiciones(pedido: any) {
  console.log('\n📋 EJEMPLO 3: Validar qué acciones son permitidas\n');

  console.log(`Estado actual: ${pedido.estado}\n`);

  // ✅ Edición
  const puedeEditar = puedeEditarse(pedido.estado);
  console.log(`¿Puede editarse? ${puedeEditar ? '✅ SÍ' : '❌ NO'}`);

  // ✅ Completar
  const puedeCompletar = puedeCompletarse(pedido.estado);
  console.log(`¿Puede completarse? ${puedeCompletar ? '✅ SÍ' : '❌ NO'}`);

  // ✅ Anular
  const puedeAnular = puedeAnularseActualmente(pedido.estado);
  console.log(`¿Puede anularse? ${puedeAnular ? '✅ SÍ' : '❌ NO'}`);

  // ✅ Es terminal
  const esTerminal = esEstadoTerminal(pedido.estado);
  console.log(`¿Es estado terminal? ${esTerminal ? '✅ SÍ (Anulado)' : '❌ NO'}`);
}

// ============================================================
// EJEMPLO 4: En un componente React (EJEMPLO)
// ============================================================

/*
// export function EjemploComponenteReact() {
//   // Hook ficticio para estado
//   const [pedidos, setPedidos] = useState<any[]>([]);
//
//   // Manejar cambio a Completada
//   const handleCompletarPedido = (pedido: any) => {
//     const resultado = cambiarEstadoCentralizado(pedido, 'Completada', {
//       onNotificar: (titulo, mensaje, tipo) => {
//         // showToast(titulo, mensaje, tipo) - Usar tu sistema de notificaciones
//       },
//     });
//
//     if (resultado.exitoso) {
//       // Actualizar estado local
//       setPedidos(pedidos.map(p => 
//         p.id === pedido.id ? resultado.pedidoActualizado : p
//       ));
//     }
//   };
//
//   // Manejar anulación
//   const handleAnularPedido = (pedido: any) => {
//     // Primero validar
//     if (!puedeAnularseActualmente(pedido.estado)) {
//       alert(`No puedes anular un pedido en estado ${pedido.estado}`);
//       return;
//     }
//
//     const resultado = anularPedidoCentralizado(pedido, {
//       onNotificar: (titulo, mensaje, tipo) => {
//         // showToast(titulo, mensaje, tipo) - Usar tu sistema de notificaciones
//       },
//     });
//
//     if (resultado.exitoso) {
//       // Actualizar estado local
//       setPedidos(pedidos.map(p => 
//         p.id === pedido.id ? resultado.pedidoAnulado : p
//       ));
//     }
//   };

  // ============================================================
  // RETORNA: JSX para renderizar pedidos con botones de acción
  // ============================================================
  // return (
  //   <div>
  //     {pedidos.map(pedido => (
  //       <div key={pedido.id}>
  //         <h3>{pedido.numeroPedido}</h3>
  //
  //         {/* Mostrar estado con estilo */
  //         <span className={obtenerClaseEstado(pedido.estado)}>
  //           {obtenerDescripcionEstado(pedido.estado)}
  //         </span>
  //
  //         {/* Botones contextuales */}
  //         <div className="flex gap-2">
  //           {/* Editar - solo si puede editarse */}
  //           {puedeEditarse(pedido.estado) && (
  //             <button onClick={() => /* handleEdit */}>
  //               Editar
  //             </button>
  //           )}
  //
  //           {/* Completar - solo si puede completarse */}
  //           {puedeTransicionar(pedido.estado, 'Completada') && (
  //             <button onClick={() => handleCompletarPedido(pedido)}>
  //               Completar
  //             </button>
  //           )}
  //
  //           {/* Anular - solo si puede anularse */}
  //           {puedeTransicionar(pedido.estado, 'Anulado') && (
  //             <button onClick={() => handleAnularPedido(pedido)}>
  //               Anular
  //             </button>
  //           )}
  //         </div>
  //       </div>
  //     ))}
  //   </div>
  // );

// ============================================================
// EJEMPLO 5: Modal de confirmación antes de anular
// ============================================================

export function ConfirmarAnulacionModal({ pedido, onConfirm, onCancel }: any) {
  const handleConfirmar = () => {
    const resultado = anularPedidoCentralizado(pedido);
    
    if (resultado.exitoso) {
      onConfirm(resultado);
    }
  };

  // return (
  //   <div className="modal">
  //     <h2>⚠️ Confirmar Anulación</h2>
  //     <p>¿Estás seguro que deseas anular el pedido {pedido.numeroPedido}?</p>
  //     
  //     {pedido.estado === 'Completada' && (
  //       <div className="warning">
  //         📦 <strong>Nota:</strong> El stock será devuelto al inventario automáticamente.
  //       </div>
  //     )}
  //
  //     {pedido.estado === 'Pendiente' && (
  //       <div className="info">
  //         ℹ️ <strong>Nota:</strong> Este pedido aún no tiene venta asociada.
  //       </div>
  //     )}
  //
  //     <div className="actions">
  //       <button onClick={onCancel}>Cancelar</button>
  //       <button onClick={handleConfirmar} className="danger">
  //         Sí, Anular Pedido
  //       </button>
  //     </div>
  //   </div>
  // );
// }

// ============================================================
// TABLA DE TRANSICIONES
// ============================================================

/*
MATRIZ DE TRANSICIONES VÁLIDAS:

┌──────────┬───────────────┬──────────────┬──────────┐
│ Estado   │ Puede editar? │ Puede pasar? │ Terminal │
├──────────┼───────────────┼──────────────┼──────────┤
│Pendiente │      ✅       │   Completa  │    ❌    │
│          │               │   Anular    │          │
├──────────┼───────────────┼──────────────┼──────────┤
│Completada│      ❌       │   Anular    │    ❌    │
│          │               │              │          │
├──────────┼───────────────┼──────────────┼──────────┤
│Anulado   │      ❌       │   (Ninguno)  │    ✅    │
└──────────┴───────────────┴──────────────┴──────────┘

ANULACIÓN ESPECIAL:
- Pediente → Anulado: No afecta stock (aún no hay venta)
- Completada → Anulado: DEVUELVE stock automáticamente
- Anulado → (ninguno): Estado terminal, no se puede cambiar

DEVOLUCIÓN DE STOCK:
- Solo ocurre cuando un pedido Completada es anulado
- Se devuelve el stock de TODOS los productos del pedido
- La venta asociada se marca como "Anulada"
*/}
