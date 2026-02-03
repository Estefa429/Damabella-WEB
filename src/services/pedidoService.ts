/**
 * Servicio de Pedidos - Gestión de cambios de estado y stock
 * Maneja la transición de estados de pedidos y el control de inventario
 */

// ============================================================
// INTERFACES
// ============================================================

export interface ProductoPedido {
  productoId: string;
  nombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioVenta: number;
}

export interface Pedido {
  id: string;
  clienteId: string;
  productos: ProductoPedido[];
  estado: 'Pendiente' | 'Completada' | 'Anulado';
  fecha: string;
  observaciones?: string;
  createdAt?: string;
  stockAjustado?: boolean; // Control para evitar ajustar stock más de una vez
  ventaId?: string; // 🔒 ID de la venta creada (bloquea conversiones duplicadas)
}

export interface Producto {
  id: string;
  nombre: string;
  stock: number;
  [key: string]: any;
}

export interface CambioEstadoResult {
  success: boolean;
  mensaje: string;
  pedido?: Pedido;
  detalleStock?: {
    productId: string;
    nombreProducto: string;
    cambio: number;
    stockAnterior: number;
    stockActual: number;
  }[];
}

// ============================================================
// CONSTANTES
// ============================================================

const PEDIDOS_KEY = 'damabella_pedidos';
const PRODUCTOS_KEY = 'damabella_productos';

// ============================================================
// FUNCIONES HELPER - localStorage
// ============================================================

/**
 * Obtener todos los pedidos desde localStorage
 */
function getStoredPedidos(): Pedido[] {
  try {
    const data = localStorage.getItem(PEDIDOS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('❌ Error leyendo pedidos:', error);
    return [];
  }
}

/**
 * Obtener todos los productos desde localStorage
 */
function getStoredProductos(): Producto[] {
  try {
    const data = localStorage.getItem(PRODUCTOS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('❌ Error leyendo productos:', error);
    return [];
  }
}

/**
 * Guardar pedidos en localStorage
 */
function savePedidos(pedidos: Pedido[]): void {
  try {
    localStorage.setItem(PEDIDOS_KEY, JSON.stringify(pedidos));
  } catch (error) {
    console.error('❌ Error guardando pedidos:', error);
    throw new Error('No se pudo guardar los pedidos');
  }
}

/**
 * Guardar productos en localStorage
 */
function saveProductos(productos: Producto[]): void {
  try {
    localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productos));
  } catch (error) {
    console.error('❌ Error guardando productos:', error);
    throw new Error('No se pudo guardar los productos');
  }
}

/**
 * Obtener un pedido por ID
 */
function getPedidoById(pedidoId: string): Pedido | null {
  const pedidos = getStoredPedidos();
  return pedidos.find(p => p.id === pedidoId) || null;
}

/**
 * Obtener un producto por ID
 */
function getProductoById(productoId: string): Producto | null {
  const productos = getStoredProductos();
  return productos.find(p => p.id === productoId) || null;
}

// ============================================================
// FUNCIONES DE VALIDACIÓN DE STOCK
// ============================================================

/**
 * Validar si hay suficiente stock para los productos del pedido
 * @returns { canProceed: boolean, faltantesProductos: Array }
 */
function validarStockDisponible(productos: ProductoPedido[]): {
  canProceed: boolean;
  faltantesProductos: {
    productoId: string;
    nombre: string;
    requerido: number;
    disponible: number;
  }[];
} {
  const faltantes: any[] = [];

  for (const item of productos) {
    const producto = getProductoById(item.productoId);

    if (!producto) {
      faltantes.push({
        productoId: item.productoId,
        nombre: item.nombre,
        requerido: item.cantidad,
        disponible: 0,
        motivo: 'Producto no encontrado'
      });
      continue;
    }

    if (producto.stock < item.cantidad) {
      faltantes.push({
        productoId: item.productoId,
        nombre: item.nombre,
        requerido: item.cantidad,
        disponible: producto.stock
      });
    }
  }

  return {
    canProceed: faltantes.length === 0,
    faltantesProductos: faltantes
  };
}

// ============================================================
// FUNCIONES DE ACTUALIZACIÓN DE STOCK
// ============================================================

/**
 * Descontar stock de productos (cuando se vende)
 */
function descontarStock(
  productos: ProductoPedido[]
): { success: boolean; detalleStock: any[] } {
  console.log('\n📦 [descontarStock] Iniciando descuento de stock');

  const detalleStock: any[] = [];
  const productosActualizados = getStoredProductos();

  for (const item of productos) {
    const productoIndex = productosActualizados.findIndex(
      p => p.id === item.productoId
    );

    if (productoIndex !== -1) {
      const stockAnterior = productosActualizados[productoIndex].stock;
      productosActualizados[productoIndex].stock -= item.cantidad;
      const stockActual = productosActualizados[productoIndex].stock;

      detalleStock.push({
        productId: item.productoId,
        nombreProducto: item.nombre,
        cambio: -item.cantidad,
        stockAnterior,
        stockActual
      });

      console.log(
        `   ✓ ${item.nombre} (${item.talla}/${item.color}): ${stockAnterior} → ${stockActual}`
      );
    }
  }

  try {
    saveProductos(productosActualizados);
    console.log('✅ Stock descontado exitosamente\n');
    return { success: true, detalleStock };
  } catch (error) {
    console.error('❌ Error al descontar stock:', error);
    return { success: false, detalleStock: [] };
  }
}

/**
 * Devolver stock de productos (cuando se anula)
 */
function devolverStock(
  productos: ProductoPedido[]
): { success: boolean; detalleStock: any[] } {
  console.log('\n📦 [devolverStock] Iniciando devolución de stock');

  const detalleStock: any[] = [];
  const productosActualizados = getStoredProductos();

  for (const item of productos) {
    const productoIndex = productosActualizados.findIndex(
      p => p.id === item.productoId
    );

    if (productoIndex !== -1) {
      const stockAnterior = productosActualizados[productoIndex].stock;
      productosActualizados[productoIndex].stock += item.cantidad;
      const stockActual = productosActualizados[productoIndex].stock;

      detalleStock.push({
        productId: item.productoId,
        nombreProducto: item.nombre,
        cambio: item.cantidad,
        stockAnterior,
        stockActual
      });

      console.log(
        `   ✓ ${item.nombre} (${item.talla}/${item.color}): ${stockAnterior} → ${stockActual}`
      );
    }
  }

  try {
    saveProductos(productosActualizados);
    console.log('✅ Stock devuelto exitosamente\n');
    return { success: true, detalleStock };
  } catch (error) {
    console.error('❌ Error al devolver stock:', error);
    return { success: false, detalleStock: [] };
  }
}

// ============================================================
// FUNCIÓN PRINCIPAL - CAMBIAR ESTADO PEDIDO
// ============================================================

/**
 * Cambiar el estado de un pedido con aplicación de reglas de negocio
 *
 * Reglas:
 * - Pendiente → Venta (descuenta stock) | Anulado (sin efecto)
 * - Venta → NO Pendiente | Anulado (devuelve stock solo si stockAjustado=true)
 * - Anulado → NO cambiar a otro estado
 * - Previene múltiples ajustes de stock con el campo stockAjustado
 *
 * @param pedidoId ID del pedido
 * @param nuevoEstado Nuevo estado deseado
 * @returns Resultado con éxito, mensaje y detalles de cambios
 */
export function cambiarEstadoPedido(
  pedidoId: string,
  nuevoEstado: 'Pendiente' | 'Completada' | 'Anulado'
): CambioEstadoResult {
  console.log(
    '\n========== 🔄 [cambiarEstadoPedido] INICIANDO CAMBIO DE ESTADO =========='
  );
  console.log(`📋 Pedido ID: ${pedidoId}`);
  console.log(`🎯 Nuevo estado: ${nuevoEstado}\n`);

  // ====== VALIDACIÓN 1: Existencia del pedido ======
  const pedido = getPedidoById(pedidoId);

  if (!pedido) {
    console.error('❌ Pedido no encontrado');
    return {
      success: false,
      mensaje: `Pedido ${pedidoId} no encontrado`
    };
  }

  const estadoActual = pedido.estado;
  const stockAjustado = pedido.stockAjustado || false;

  console.log(`📌 Estado actual: ${estadoActual}`);
  console.log(`📌 Stock ajustado anteriormente: ${stockAjustado}`);

  // ====== VALIDACIÓN 2: Cambios inválidos según el estado actual ======
  if (estadoActual === 'Anulado') {
    console.error('❌ No se puede cambiar estado de pedido anulado');
    return {
      success: false,
      mensaje: 'No se puede cambiar el estado de un pedido anulado'
    };
  }

  if (estadoActual === 'Completada' && nuevoEstado === 'Pendiente') {
    console.error('❌ No se puede volver de Completada a Pendiente');
    return {
      success: false,
      mensaje: 'No se puede cambiar un pedido completado a estado Pendiente'
    };
  }

  // ====== VALIDACIÓN 3: Prevenir cambio a mismo estado ======
  if (estadoActual === nuevoEstado) {
    console.warn('⚠️  El pedido ya está en el estado deseado');
    return {
      success: false,
      mensaje: `El pedido ya se encuentra en estado ${nuevoEstado}`
    };
  }

  // ====== LÓGICA DE CAMBIOS POR TRANSICIÓN ======
  let detalleStock: any[] = [];

  // CASO 1: Pendiente → Completada (Descontar stock)
  if (estadoActual === 'Pendiente' && nuevoEstado === 'Completada') {
    console.log('📍 Transición: Pendiente → Completada');

    // 🔒 VALIDACIÓN CRÍTICA: ¿Ya se convirtió a venta?
    if (pedido.ventaId) {
      console.error('❌ Este pedido ya fue convertido a venta');
      return {
        success: false,
        mensaje: `Pedido ya fue convertido a venta (ID: ${pedido.ventaId}). No se puede convertir nuevamente.`
      };
    }

    // Validar stock antes de proceder
    const validacion = validarStockDisponible(pedido.productos);

    if (!validacion.canProceed) {
      console.error('❌ Stock insuficiente:');
      validacion.faltantesProductos.forEach(p => {
        console.error(
          `   - ${p.nombre}: necesita ${p.requerido}, hay ${p.disponible}`
        );
      });
      return {
        success: false,
        mensaje: `Stock insuficiente para los siguientes productos:\n${validacion.faltantesProductos
          .map(p => `- ${p.nombre}: necesita ${p.requerido}, disponible ${p.disponible}`)
          .join('\n')}`
      };
    }

    // Descontar stock
    const resultadoDescuento = descontarStock(pedido.productos);
    if (!resultadoDescuento.success) {
      return {
        success: false,
        mensaje: 'Error al descontar el stock'
      };
    }
    detalleStock = resultadoDescuento.detalleStock;
  }

  // CASO 2: Pendiente → Anulado (Sin efecto en stock)
  else if (estadoActual === 'Pendiente' && nuevoEstado === 'Anulado') {
    console.log('📍 Transición: Pendiente → Anulado (sin efecto en stock)');
  }

  // CASO 3: Completada → Anulado (Devolver stock SOLO si aún no se ajustó)
  else if (estadoActual === 'Completada' && nuevoEstado === 'Anulado') {
    console.log('📍 Transición: Completada → Anulado');

    if (stockAjustado) {
      console.log('📦 Stock ya fue ajustado anteriormente, procediendo a devolución...');

      // Devolver stock
      const resultadoDevolucion = devolverStock(pedido.productos);
      if (!resultadoDevolucion.success) {
        return {
          success: false,
          mensaje: 'Error al devolver el stock'
        };
      }
      detalleStock = resultadoDevolucion.detalleStock;
    } else {
      console.warn('⚠️  Stock no fue ajustado antes, sin cambios en inventario');
    }
  }

  // ====== ACTUALIZAR ESTADO DEL PEDIDO ======
  console.log(`\n💾 Actualizando estado del pedido...`);

  const pedidosActualizados = getStoredPedidos();
  const pedidoIndex = pedidosActualizados.findIndex(p => p.id === pedidoId);

  if (pedidoIndex === -1) {
    console.error('❌ Error: Pedido desapareció después de validación');
    return {
      success: false,
      mensaje: 'Error interno: pedido no encontrado'
    };
  }

  // Crear nueva instancia del pedido sin mutar el original
  const pedidoActualizado: Pedido = {
    ...pedidosActualizados[pedidoIndex],
    estado: nuevoEstado,
    // Marcar stockAjustado como true si se hizo una transición que afecta stock
    stockAjustado: 
      (estadoActual === 'Pendiente' && nuevoEstado === 'Completada') || 
      (estadoActual === 'Completada' && nuevoEstado === 'Anulado' && stockAjustado)
        ? false // Se resetea después de devolver
        : (estadoActual === 'Pendiente' && nuevoEstado === 'Completada') 
          ? true // Se marca como ajustado cuando se completa
          : stockAjustado // Mantiene el valor anterior en otros casos
  };

  pedidosActualizados[pedidoIndex] = pedidoActualizado;

  try {
    savePedidos(pedidosActualizados);
    console.log(`✅ Estado actualizado: ${estadoActual} → ${nuevoEstado}`);
    console.log(`📌 Stock ajustado: ${pedidoActualizado.stockAjustado}`);
    console.log(
      '========== ✅ CAMBIO DE ESTADO COMPLETADO EXITOSAMENTE ==========\n'
    );

    return {
      success: true,
      mensaje: `Pedido actualizado exitosamente a estado ${nuevoEstado}`,
      pedido: pedidoActualizado,
      detalleStock:
        detalleStock.length > 0
          ? detalleStock
          : undefined
    };
  } catch (error) {
    console.error('❌ Error al guardar cambios:', error);
    return {
      success: false,
      mensaje: 'Error al guardar los cambios del pedido'
    };
  }
}

// ============================================================
// FUNCIONES AUXILIARES EXPORTADAS
// ============================================================

/**
 * Obtener detalles de un pedido para validación
 */
export function obtenerDetallePedido(pedidoId: string): Pedido | null {
  return getPedidoById(pedidoId);
}

/**
 * Validar transición de estado antes de aplicarla
 * Retorna si la transición es permitida y por qué si no lo es
 */
export function validarTransicion(
  estadoActual: 'Pendiente' | 'Completada' | 'Anulado',
  nuevoEstado: 'Pendiente' | 'Completada' | 'Anulado'
): { permitido: boolean; razon?: string } {
  if (estadoActual === nuevoEstado) {
    return {
      permitido: false,
      razon: 'El estado es el mismo'
    };
  }

  if (estadoActual === 'Anulado') {
    return {
      permitido: false,
      razon: 'No se puede cambiar un pedido anulado'
    };
  }

  if (estadoActual === 'Completada' && nuevoEstado === 'Pendiente') {
    return {
      permitido: false,
      razon: 'No se puede volver de Completada a Pendiente'
    };
  }

  return { permitido: true };
}

/**
 * Obtener historial de stock de un producto
 * (Utilidad para auditoría)
 */
export function obtenerProductoConStock(productoId: string): Producto | null {
  return getProductoById(productoId);
}

/**
 * Marcar un pedido como stock ajustado manualmente
 * Utilidad para sincronización en caso de inconsistencias
 */
export function marcarStockAjustado(
  pedidoId: string,
  ajustado: boolean
): { success: boolean; mensaje: string } {
  console.log(`\n🔧 [marcarStockAjustado] Marcando pedido ${pedidoId} como ${ajustado ? 'AJUSTADO' : 'NO AJUSTADO'}`);

  const pedidosActualizados = getStoredPedidos();
  const pedidoIndex = pedidosActualizados.findIndex(p => p.id === pedidoId);

  if (pedidoIndex === -1) {
    console.error('❌ Pedido no encontrado');
    return {
      success: false,
      mensaje: 'Pedido no encontrado'
    };
  }

  const pedidoActualizado = {
    ...pedidosActualizados[pedidoIndex],
    stockAjustado: ajustado
  };

  pedidosActualizados[pedidoIndex] = pedidoActualizado;

  try {
    savePedidos(pedidosActualizados);
    console.log(`✅ Pedido marcado correctamente`);
    return {
      success: true,
      mensaje: `Pedido marcado como ${ajustado ? 'stock ajustado' : 'stock no ajustado'}`
    };
  } catch (error) {
    console.error('❌ Error al marcar pedido:', error);
    return {
      success: false,
      mensaje: 'Error al actualizar el pedido'
    };
  }
}

/**
 * Verificar estado de ajuste de stock de un pedido
 */
export function verificarEstadoStockAjustado(pedidoId: string): {
  encontrado: boolean;
  estado?: 'Pendiente' | 'Completada' | 'Anulado';
  stockAjustado?: boolean;
} {
  const pedido = getPedidoById(pedidoId);

  if (!pedido) {
    return { encontrado: false };
  }

  return {
    encontrado: true,
    estado: pedido.estado,
    stockAjustado: pedido.stockAjustado || false
  };
}
