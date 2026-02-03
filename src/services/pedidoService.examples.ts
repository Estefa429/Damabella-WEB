/**
 * EJEMPLO DE USO - cambiarEstadoPedido (con control de stockAjustado)
 * 
 * Este archivo demuestra cómo usar la función cambiarEstadoPedido
 * con la nueva lógica de control de ajuste de stock.
 */

import {
  cambiarEstadoPedido,
  validarTransicion,
  obtenerDetallePedido,
  obtenerProductoConStock,
  marcarStockAjustado,
  verificarEstadoStockAjustado
} from './pedidoService';

// ============================================================
// EJEMPLO 1: Cambiar pedido de Pendiente a Completada
// ============================================================
export function ejemplo1_VenderPedido() {
  console.log('\n=== EJEMPLO 1: Completar un pedido ===\n');

  const resultado = cambiarEstadoPedido('ped_12345', 'Completada');

  if (resultado.success) {
    console.log('✅ Éxito:', resultado.mensaje);
    console.log('📋 Pedido actualizado:', resultado.pedido);

    // Mostrar detalles del cambio de stock
    if (resultado.detalleStock) {
      console.log('\n📦 Cambios de stock:');
      resultado.detalleStock.forEach(item => {
        console.log(
          `  • ${item.nombreProducto}: ${item.stockAnterior} → ${item.stockActual} (cambio: ${item.cambio})`
        );
      });
    }
  } else {
    console.error('❌ Error:', resultado.mensaje);
  }
}

// ============================================================
// EJEMPLO 2: Intentar vender sin stock suficiente
// ============================================================
export function ejemplo2_StockInsuficiente() {
  console.log('\n=== EJEMPLO 2: Stock insuficiente ===\n');

  // Este pedido probablemente no tiene stock suficiente
  const resultado = cambiarEstadoPedido('ped_99999', 'Completada');

  if (!resultado.success) {
    console.error('❌ Error esperado:', resultado.mensaje);
    // El mensaje incluirá detalles sobre qué productos faltan stock
  }
}

// ============================================================
// EJEMPLO 3: Anular un pedido que ya está vendido (devolver stock)
// ============================================================
export function ejemplo3_AnularCompletada() {
  console.log('\n=== EJEMPLO 3: Anular pedido vendido (devolver stock) ===\n');

  const resultado = cambiarEstadoPedido('ped_12345', 'Anulado');

  if (resultado.success) {
    console.log('✅ Éxito:', resultado.mensaje);

    // Mostrar cómo se devolvió el stock
    if (resultado.detalleStock) {
      console.log('\n📦 Stock devuelto:');
      resultado.detalleStock.forEach(item => {
        console.log(
          `  • ${item.nombreProducto}: ${item.stockAnterior} + ${item.cambio} = ${item.stockActual}`
        );
      });
    }
  }
}

// ============================================================
// EJEMPLO 4: Validar transición antes de ejecutar
// ============================================================
export function ejemplo4_ValidarAntes() {
  console.log('\n=== EJEMPLO 4: Validar transición ===\n');

  // Validar si se puede cambiar de Completada a Pendiente
  const validacion = validarTransicion('Completada', 'Pendiente');

  if (!validacion.permitido) {
    console.error('❌ Transición no permitida:', validacion.razon);
    return; // No intentar el cambio
  }

  // Si llegamos aquí, la transición es válida
  const resultado = cambiarEstadoPedido('ped_12345', 'Pendiente');
  console.log(resultado);
}

// ============================================================
// EJEMPLO 5: Obtener detalles del pedido antes de cambiar
// ============================================================
export function ejemplo5_ConsultarDetalles() {
  console.log('\n=== EJEMPLO 5: Consultar detalles del pedido ===\n');

  const pedidoId = 'ped_12345';
  const pedido = obtenerDetallePedido(pedidoId);

  if (pedido) {
    console.log('📋 Detalles del pedido:');
    console.log(`  ID: ${pedido.id}`);
    console.log(`  Cliente: ${pedido.clienteId}`);
    console.log(`  Estado actual: ${pedido.estado}`);
    console.log(`  Productos (${pedido.productos.length}):`);

    pedido.productos.forEach(p => {
      console.log(
        `    • ${p.nombre} (${p.talla}/${p.color}): ${p.cantidad} unidades @ $${p.precioVenta}`
      );
    });

    // Ahora podemos cambiar el estado con confianza
    const resultado = cambiarEstadoPedido(pedidoId, 'Completada');
    console.log('\n' + resultado.mensaje);
  } else {
    console.error('Pedido no encontrado');
  }
}

// ============================================================
// EJEMPLO 6: Verificar stock antes de cambiar a Completada
// ============================================================
export function ejemplo6_VerificarStock() {
  console.log('\n=== EJEMPLO 6: Verificar stock disponible ===\n');

  const pedido = obtenerDetallePedido('ped_12345');

  if (pedido) {
    console.log('Verificando stock para cada producto del pedido:\n');

    pedido.productos.forEach(p => {
      const producto = obtenerProductoConStock(p.productoId);

      if (producto) {
        const tieneStock = producto.stock >= p.cantidad;
        const estado = tieneStock ? '✅' : '❌';
        console.log(
          `${estado} ${p.nombre}: necesita ${p.cantidad}, disponible ${producto.stock}`
        );
      }
    });
  }
}

// ============================================================
// EJEMPLO 7: Uso en un componente React
// ============================================================
export function EjemploComponenteReact() {
  return `
// En un componente React
import { cambiarEstadoPedido } from '../../services/pedidoService';

function GestorPedidos({ pedidoId }) {
  const handleConfirmarVenta = async () => {
    const resultado = cambiarEstadoPedido(pedidoId, 'Completada');

    if (resultado.success) {
      toast.success(resultado.mensaje);
      // Actualizar UI con el pedido actualizado
      setPedido(resultado.pedido);
    } else {
      toast.error(resultado.mensaje);
    }
  };

  const handleAnular = () => {
    const resultado = cambiarEstadoPedido(pedidoId, 'Anulado');

    if (resultado.success) {
      toast.success(resultado.mensaje);
      // Mostrar detalles del stock devuelto
      if (resultado.detalleStock) {
        console.log('Stock devuelto:', resultado.detalleStock);
      }
    } else {
      toast.error(resultado.mensaje);
    }
  };

  return (
    <div>
      <button onClick={handleConfirmarVenta}>Confirmar Completada</button>
      <button onClick={handleAnular}>Anular Pedido</button>
    </div>
  );
}
`;
}

// ============================================================
// EJEMPLO 8: Verificar estado de ajuste de stock
// ============================================================
export function ejemplo8_VerificarStockAjustado() {
  console.log('\n=== EJEMPLO 8: Verificar si stock fue ajustado ===\n');

  const estado = verificarEstadoStockAjustado('ped_12345');

  if (estado.encontrado) {
    console.log(`📋 Pedido encontrado`);
    console.log(`   Estado: ${estado.estado}`);
    console.log(`   Stock ajustado: ${estado.stockAjustado ? 'SÍ ✅' : 'NO ❌'}`);

    if (estado.estado === 'Completada' && estado.stockAjustado) {
      console.log(`   → Se puede anular y devolver stock`);
    } else if (estado.estado === 'Completada' && !estado.stockAjustado) {
      console.log(`   → ⚠️ Stock no fue ajustado, anulación no devolverá stock`);
    }
  } else {
    console.error('Pedido no encontrado');
  }
}

// ============================================================
// EJEMPLO 9: Marcar stock como ajustado manualmente (sincronización)
// ============================================================
export function ejemplo9_SincronizarStockAjustado() {
  console.log('\n=== EJEMPLO 9: Sincronizar estado de ajuste de stock ===\n');

  // Si se descubrió una inconsistencia, se puede marcar manualmente
  const resultado = marcarStockAjustado('ped_12345', true);

  if (resultado.success) {
    console.log(`✅ ${resultado.mensaje}`);
  } else {
    console.error(`❌ ${resultado.mensaje}`);
  }
}

// ============================================================
// EJEMPLO 10: Flujo completo con control de stock
// ============================================================
export function ejemplo10_FlujoCmpletoConControl() {
  console.log('\n=== EJEMPLO 10: Flujo completo Pendiente → Completada → Anulado ===\n');

  const pedidoId = 'ped_12345';

  // Paso 1: Verificar estado inicial
  console.log('PASO 1: Verificar estado inicial');
  const estadoInicial = verificarEstadoStockAjustado(pedidoId);
  console.log(`  Estado: ${estadoInicial.estado}, Stock ajustado: ${estadoInicial.stockAjustado}\n`);

  // Paso 2: Cambiar a Completada (descontar stock)
  console.log('PASO 2: Cambiar a Completada');
  const resultadoVenta = cambiarEstadoPedido(pedidoId, 'Completada');
  if (!resultadoVenta.success) {
    console.error(`  ❌ ${resultadoVenta.mensaje}`);
    return;
  }
  console.log(`  ✅ ${resultadoVenta.mensaje}`);
  if (resultadoVenta.detalleStock) {
    resultadoVenta.detalleStock.forEach(item => {
      console.log(`     • ${item.nombreProducto}: ${item.stockAnterior} → ${item.stockActual}`);
    });
  }

  // Paso 3: Verificar que stock fue ajustado
  console.log('\nPASO 3: Verificar ajuste');
  const estadoDespuesVenta = verificarEstadoStockAjustado(pedidoId);
  console.log(`  Estado: ${estadoDespuesVenta.estado}, Stock ajustado: ${estadoDespuesVenta.stockAjustado}\n`);

  // Paso 4: Anular (devolver stock)
  console.log('PASO 4: Anular y devolver stock');
  const resultadoAnulacion = cambiarEstadoPedido(pedidoId, 'Anulado');
  if (!resultadoAnulacion.success) {
    console.error(`  ❌ ${resultadoAnulacion.mensaje}`);
    return;
  }
  console.log(`  ✅ ${resultadoAnulacion.mensaje}`);
  if (resultadoAnulacion.detalleStock) {
    resultadoAnulacion.detalleStock.forEach(item => {
      console.log(`     • ${item.nombreProducto}: ${item.stockAnterior} → ${item.stockActual}`);
    });
  }

  // Paso 5: Verificar que stock no se ajusta más
  console.log('\nPASO 5: Verificar que no se puede anular nuevamente');
  const estadoFinal = verificarEstadoStockAjustado(pedidoId);
  console.log(`  Estado: ${estadoFinal.estado}, Stock ajustado: ${estadoFinal.stockAjustado}`);
  console.log(`  Resultado: ${estadoFinal.estado === 'Anulado' ? '✅ Anulado correctamente' : '❌ Error'}`);
}
// ============================================================
// MATRIZ DE TRANSICIONES VÁLIDAS (CON CONTROL DE STOCK)
// ============================================================
export const TRANSICIONES_VALIDAS = {
  'Pendiente→Venta': {
    descripcion: 'Descontar stock del inventario',
    requiereStock: true,
    afectaStock: true,
    marcaStockAjustado: true,
    notas: 'Verifica stock disponible, descuenta y marca stockAjustado=true'
  },
  'Pendiente→Anulado': {
    descripcion: 'Cancelar pedido sin vender',
    requiereStock: false,
    afectaStock: false,
    marcaStockAjustado: false,
    notas: 'No afecta inventario'
  },
  'Venta→Anulado': {
    descripcion: 'Devolver los productos vendidos al stock',
    requiereStock: false,
    afectaStock: true,
    soloSiStockAjustado: true,
    marcaStockAjustado: false,
    notas: 'Solo devuelve stock si stockAjustado=true (para evitar dobles devoluciones)'
  },
  'Venta→Pendiente': {
    permitido: false,
    descripcion: '❌ NO PERMITIDO - No se puede revertir una venta',
    notas: 'Una venta debe ser anulada, nunca volver a pendiente'
  },
  'Anulado→*': {
    permitido: false,
    descripcion: '❌ NO PERMITIDO - No se puede cambiar un pedido anulado',
    notas: 'Estado terminal: un pedido anulado no puede volver a venderse'
  }
};

// ============================================================
// TIPOS DE ERROR ESPERADOS
// ============================================================
export const ERRORES_POSIBLES = {
  PEDIDO_NO_ENCONTRADO: 'Pedido {id} no encontrado',
  STOCK_INSUFICIENTE: 'Stock insuficiente para los siguientes productos:\n...',
  TRANSICION_INVALIDA: 'No se puede cambiar un pedido en estado {estado} a {nuevoEstado}',
  PEDIDO_ANULADO: 'No se puede cambiar el estado de un pedido anulado',
  ESTADO_ACTUAL: 'El pedido ya se encuentra en estado {estado}',
  ERROR_GUARDADO: 'Error al guardar los cambios del pedido',
  VENTA_A_PENDIENTE: 'No se puede cambiar un pedido vendido a estado Pendiente'
};

// ============================================================
// NOTAS IMPORTANTES SOBRE CONTROL DE STOCK
// ============================================================
export const NOTAS_IMPORTANTES = {
  stockAjustado: {
    descripcion: 'Campo booleano para evitar ajustes de stock múltiples',
    valores: {
      true: 'Stock fue descontado cuando se pasó a Venta',
      false: 'Stock no fue ajustado o ya fue devuelto cuando se anuló'
    },
    casosUso: [
      'Evitar descontar stock dos veces si se ejecuta cambiarEstadoPedido dos veces',
      'Permitir devolución de stock solo una vez cuando se anula',
      'Sincronizar estado si hay inconsistencias entre pedidos y productos'
    ],
    sincronizacion: 'Usar marcarStockAjustado() si hay inconsistencias en localStorage'
  },
  
  transicionesConStockAjustado: [
    {
      caso: 'Pendiente → Venta',
      stockAjustado_antes: false,
      stockAjustado_despues: true,
      descripcion: 'Marca como ajustado para permitir devolución luego'
    },
    {
      caso: 'Venta → Anulado (stockAjustado=true)',
      stockAjustado_antes: true,
      stockAjustado_despues: false,
      descripcion: 'Devuelve stock y resetea el flag'
    },
    {
      caso: 'Venta → Anulado (stockAjustado=false)',
      stockAjustado_antes: false,
      stockAjustado_despues: false,
      descripcion: 'No devuelve stock porque nunca fue descontado'
    },
    {
      caso: 'Pendiente → Anulado',
      stockAjustado_antes: false,
      stockAjustado_despues: false,
      descripcion: 'Sin cambios en stock ni en el flag'
    }
  ]
};
