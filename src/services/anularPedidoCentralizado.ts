// /**
//  * 🔒 SERVICIO CENTRALIZADO DE ANULACIÓN DE PEDIDOS
//  * 
//  * Función única responsable de:
//  * 1. Validar que el pedido no esté ya anulado
//  * 2. Si el pedido estaba "Completada", devolver stock automáticamente
//  * 3. Cambiar estado a "Anulado" en módulo Pedidos
//  * 4. Actualizar módulo Ventas para reflejar anulación
//  * 5. Mantener consistencia entre módulos
//  * 6. Disparar eventos de sincronización
//  */

// // ============================================================
// // TIPOS E INTERFACES
// // ============================================================

// export interface ItemPedido {
//   id: string;
//   productoId: string;
//   productoNombre: string;
//   talla: string;
//   color: string;
//   cantidad: number;
//   precioUnitario: number;
//   subtotal: number;
// }

// export interface Pedido {
//   id: number;
//   numeroPedido: string;
//   tipo: 'Pedido';
//   clienteId: string;
//   clienteNombre: string;
//   fechaPedido: string;
//   estado: 'Pendiente' | 'Completada' | 'Anulado' | 'Convertido a venta';
//   items: ItemPedido[];
//   subtotal: number;
//   iva: number;
//   total: number;
//   metodoPago: string;
//   observaciones: string;
//   createdAt: string;
//   venta_id?: string | null;
// }

// export interface ResultadoAnulacion {
//   exitoso: boolean;
//   error?: string;
//   mensaje: string;
//   pedidoAnulado?: Pedido;
//   stockDevuelto?: Array<{
//     productoId: string;
//     nombreProducto: string;
//     talla: string;
//     color: string;
//     cantidad: number;
//   }>;
// }

// export interface ConfiguracionAnulacion {
//   // Callback cuando anulación se completa exitosamente
//   onAnulado?: (pedido: Pedido) => void;
//   // Callback para notificaciones
//   onNotificar?: (titulo: string, mensaje: string, tipo: 'success' | 'error' | 'info') => void;
//   // Callback para logging
//   onLog?: (mensaje: string, nivel: 'log' | 'warn' | 'error') => void;
// }

// // ============================================================
// // CONSTANTES
// // ============================================================

// const PEDIDOS_KEY = 'damabella_pedidos';
// const VENTAS_KEY = 'damabella_ventas';
// const PRODUCTOS_KEY = 'damabella_productos';

// // ============================================================
// // HELPERS DE PRODUCTOS
// // ============================================================

// /**
//  * Devuelve stock de productos al inventario
//  * Se utiliza cuando un pedido Completada se anula
//  */
// function devolverStockAlInventario(
//   items: ItemPedido[]
// ): { exitoso: boolean; error?: string; productosActualizados?: any[] } {
//   try {
//     const productosJSON = localStorage.getItem(PRODUCTOS_KEY);
//     if (!productosJSON) {
//       return {
//         exitoso: false,
//         error: '❌ Error crítico: No hay productos en localStorage',
//       };
//     }

//     const productos = JSON.parse(productosJSON);

//     // Actualizar stock: sumar cantidad devuelta
//     const productosActualizados = productos.map((prod: any) => {
//       const itemsDelProducto = items.filter(
//         (item) => String(item.productoId) === String(prod.id)
//       );

//       if (itemsDelProducto.length === 0) {
//         return prod; // Sin cambios
//       }

//       // 🔒 VALIDACIÓN: El producto debe tener variantes
//       if (!prod.variantes || prod.variantes.length === 0) {
//         throw new Error(
//           `❌ CRÍTICO: Producto "${prod.nombre}" no tiene variantes. No se puede devolver stock.`
//         );
//       }

//       // 📦 Actualizar stock de variantes (DEVOLVER = sumar)
//       const variantes = prod.variantes.map((variante: any) => ({
//         ...variante,
//         colores: variante.colores.map((color: any) => {
//           // Calcular cantidad a devolver
//           const cantidadADevolver = itemsDelProducto.reduce((sum: number, item) => {
//             if (item.talla === variante.talla && item.color === color.color) {
//               return sum + item.cantidad;
//             }
//             return sum;
//           }, 0);

//           if (cantidadADevolver > 0) {
//             const stockAnterior = color.cantidad;
//             const nuevoStock = stockAnterior + cantidadADevolver;

//             console.log(
//               `📦 [devolverStock] ${prod.nombre} - ${variante.talla} ${color.color}: ` +
//               `${stockAnterior} + ${cantidadADevolver} = ${nuevoStock}`
//             );

//             return { ...color, cantidad: nuevoStock };
//           }
//           return color;
//         }),
//       }));

//       return { ...prod, variantes };
//     });

//     // Guardar productos actualizados
//     localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosActualizados));

//     // Disparar evento de sincronización
//     window.dispatchEvent(
//       new StorageEvent('storage', {
//         key: PRODUCTOS_KEY,
//         newValue: JSON.stringify(productosActualizados),
//         oldValue: productosJSON,
//         url: window.location.href,
//       })
//     );

//     return { exitoso: true, productosActualizados };
//   } catch (error: any) {
//     const mensajeError = error.message || 'Error desconocido devolviendo stock';
//     return {
//       exitoso: false,
//       error: mensajeError,
//     };
//   }
// }

// /**
//  * Obtiene una venta por pedido_id
//  */
// function obtenerVentaPorPedido(numeroPedido: string): any | null {
//   try {
//     const ventasJSON = localStorage.getItem(VENTAS_KEY);
//     if (!ventasJSON) return null;

//     const ventas = JSON.parse(ventasJSON);
//     return ventas.find((v: any) => v.pedido_id === numeroPedido) || null;
//   } catch (error) {
//     console.error('❌ Error obteniendo venta:', error);
//     return null;
//   }
// }

// /**
//  * Marca venta como anulada (mantiene el registro)
//  */
// function anularVentaAsociada(numeroPedido: string): boolean {
//   try {
//     const ventasJSON = localStorage.getItem(VENTAS_KEY);
//     if (!ventasJSON) return true; // No hay ventas que anular

//     const ventas = JSON.parse(ventasJSON);
//     const ventaIndex = ventas.findIndex((v: any) => v.pedido_id === numeroPedido);

//     if (ventaIndex === -1) {
//       console.log(`ℹ️ No hay venta asociada al pedido ${numeroPedido}`);
//       return true; // No hay venta, pero no es error
//     }

//     // Marcar venta como anulada
//     ventas[ventaIndex] = {
//       ...ventas[ventaIndex],
//       estado: 'Anulada',
//       anulada: true,
//       fechaAnulacion: new Date().toISOString(),
//     };

//     localStorage.setItem(VENTAS_KEY, JSON.stringify(ventas));

//     // Disparar evento
//     window.dispatchEvent(
//       new StorageEvent('storage', {
//         key: VENTAS_KEY,
//         newValue: JSON.stringify(ventas),
//         oldValue: ventasJSON,
//         url: window.location.href,
//       })
//     );

//     return true;
//   } catch (error) {
//     console.error('❌ Error anulando venta:', error);
//     return false;
//   }
// }

// // ============================================================
// // FUNCIÓN PRINCIPAL CENTRALIZADA DE ANULACIÓN
// // ============================================================

// /**
//  * 🔒 FUNCIÓN CENTRALIZADA DE ANULACIÓN DE PEDIDOS
//  * 
//  * Maneja TODAS las aspectos de la anulación:
//  * - Validaciones de estado
//  * - Devolución de stock si aplica
//  * - Actualización de Pedidos
//  * - Sincronización con Ventas
//  * - Eventos de sincronización
//  * 
//  * @param pedido - El pedido a anular
//  * @param config - Configuración opcional (callbacks, opciones)
//  * @returns ResultadoAnulacion con detalles de lo realizado
//  */
// export function anularPedidoCentralizado(
//   pedido: Pedido,
//   config?: ConfiguracionAnulacion
// ): ResultadoAnulacion {
//   const log = config?.onLog || console.log;
//   const notificar = config?.onNotificar || (() => {});

//   try {
//     log(
//       `\n🚫 [anularPedidoCentralizado] Iniciando anulación del pedido ${pedido.numeroPedido}`,
//       'log'
//     );

//     // ================================================================
//     // 1️⃣ VALIDACIÓN: ¿Ya está anulado?
//     // ================================================================

//     if (pedido.estado === 'Anulado') {
//       const error = `⚠️ El pedido ${pedido.numeroPedido} ya está en estado ANULADO. No hay nada que hacer.`;
//       log(error, 'warn');
//       return {
//         exitoso: true, // No es un error, solo que ya está anulado
//         mensaje: error,
//         pedidoAnulado: pedido,
//       };
//     }

//     // ================================================================
//     // 1.5️⃣ VALIDACIÓN: ¿Es Completado? → PERMITIR CON DEVOLUCIÓN
//     // ================================================================
//     // 🔒 Un pedido Completada es solo un Pedido con venta_id
//     // Se permite anular desde Pedidos (devuelve stock automáticamente)
//     // Si la venta ya fue modificada (cambios), debe anularse desde Ventas
    
//     // Los pedidos Completada se pueden anular normalmente
//     // El stock se devuelve automáticamente

//     // ================================================================
//     // 2️⃣ DEVOLVER STOCK: Solo si estaba "Completada"
//     // ================================================================
    
//     let stockDevuelto: Array<{
//       productoId: string;
//       nombreProducto: string;
//       talla: string;
//       color: string;
//       cantidad: number;
//     }> = [];

//     if (pedido.estado === 'Completada') {
//       // 🔒 El pedido fue convertido a Venta, se descontó stock
//       // Al anular, devolver stock automáticamente
//       log(`\n📦 Pedido estaba COMPLETADA. Devolviendo stock...`, 'log');
      
//       const resultadoDevolucion = devolverStockAlInventario(pedido.items);
      
//       if (!resultadoDevolucion.exitoso) {
//         const error = `❌ Error al devolver stock: ${resultadoDevolucion.error}`;
//         log(error, 'error');
//         notificar('Error', `No se pudo devolver el stock: ${resultadoDevolucion.error}`, 'error');
//         return {
//           exitoso: false,
//           error,
//           mensaje: 'Error al devolver stock'
//         };
//       }
      
//       // Registrar qué se devolvió
//       pedido.items.forEach((item) => {
//         stockDevuelto.push({
//           productoId: item.productoId,
//           nombreProducto: item.productoNombre,
//           talla: item.talla,
//           color: item.color,
//           cantidad: item.cantidad,
//         });
//       });
      
//       log(`✅ Stock devuelto para ${stockDevuelto.length} items`, 'log');
//     } else if (pedido.estado === 'Pendiente') {
//       // El pedido nunca fue convertido a Venta
//       // Stock ya está en inventario, no hay nada que devolver
//       log(`ℹ️ Pedido estaba PENDIENTE. Stock ya estaba en inventario (sin cambios).`, 'log');
//     }

//     // ================================================================
//     // 3️⃣ ACTUALIZAR PEDIDO A "ANULADO"
//     // ================================================================

//     const pedidoAnulado: Pedido = {
//       ...pedido,
//       estado: 'Anulado',
//     };

//     // Persistir cambio en localStorage
//     const pedidosActuales = JSON.parse(localStorage.getItem(PEDIDOS_KEY) || '[]');
//     const pedidosActualizados = pedidosActuales.map((p: Pedido) =>
//       p.id === pedido.id ? pedidoAnulado : p
//     );
//     localStorage.setItem(PEDIDOS_KEY, JSON.stringify(pedidosActualizados));

//     log(`✅ Pedido actualizado a estado ANULADO en módulo Pedidos`, 'log');

//     // ================================================================
//     // 4️⃣ ACTUALIZAR VENTAS: Marcar como anulada
//     // ================================================================

//     if (pedido.venta_id) {
//       log(`\n📋 [Sincronización Ventas] Marcando venta ${pedido.venta_id} como anulada...`, 'log');

//       const resultadoVenta = anularVentaAsociada(pedido.numeroPedido);

//       if (!resultadoVenta) {
//         log(
//           `⚠️ No se pudo actualizar la venta asociada. Continuando de todas formas...`,
//           'warn'
//         );
//       } else {
//         log(`✅ Venta marcada como anulada en módulo Ventas`, 'log');
//       }
//     } else {
//       log(`ℹ️ El pedido no tiene venta asociada. No hay ventas que anular.`, 'log');
//     }

//     // ================================================================
//     // 5️⃣ DISPARAR EVENTOS DE SINCRONIZACIÓN
//     // ================================================================

//     window.dispatchEvent(
//       new CustomEvent('pedidoAnulado', {
//         detail: { pedido: pedidoAnulado, stockDevuelto },
//       })
//     );

//     window.dispatchEvent(new Event('pedidosActualizados'));

//     // ================================================================
//     // 6️⃣ RETORNAR RESULTADO EXITOSO
//     // ================================================================

//     const mensaje = `✅ Pedido ${pedido.numeroPedido} anulado correctamente${
//       stockDevuelto.length > 0 ? ` (Stock devuelto: ${stockDevuelto.length} productos)` : ''
//     }`;

//     log(mensaje, 'log');
//     notificar('Éxito', mensaje, 'success');

//     if (config?.onAnulado) {
//       config.onAnulado(pedidoAnulado);
//     }

//     return {
//       exitoso: true,
//       mensaje,
//       pedidoAnulado,
//       stockDevuelto: stockDevuelto.length > 0 ? stockDevuelto : undefined,
//     };
//   } catch (error: any) {
//     const mensajeError = error.message || 'Error desconocido';
//     log(`❌ [ERROR] ${mensajeError}`, 'error');
//     notificar('Error', mensajeError, 'error');

//     return {
//       exitoso: false,
//       error: mensajeError,
//       mensaje: 'Error al anular el pedido',
//     };
//   }
// }

// // ============================================================
// // FUNCIÓN HELPER: Validar si un pedido puede ser anulado
// // ============================================================

// /**
//  * Verifica si un pedido puede ser anulado
//  * (Útil para habilitar/deshabilitar botones)
//  */
// export function puedeAnularseActualmente(estado: Pedido['estado']): boolean {
//   // Solo Pendiente y Completada pueden anularse
//   // Anulado ya está anulado, así que no "puede" anularse (ya lo está)
//   return estado === 'Pendiente' || estado === 'Completada';
// }
