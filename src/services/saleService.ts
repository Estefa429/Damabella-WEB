/**
 * 🔒 SERVICIO CENTRAL DE VENTAS
 * 
 * Función única y central responsable de:
 * 1. Validar variantes y stock
 * 2. Descontar stock del inventario
 * 3. Guardar la venta en localStorage
 * 4. Disparar eventos de sincronización
 * 
 * NOTA: Esta función es llamada por:
 * - VentasManager (cuando crea una venta desde UI)
 * - PedidosManager (cuando convierte pedido en venta)
 */

const PRODUCTOS_KEY = 'damabella_productos';
const VENTAS_KEY = 'damabella_ventas';
const VENTA_COUNTER_KEY = 'damabella_venta_counter';

export interface ItemVenta {
  id?: string;
  productoId: string;
  productoNombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  id: number;
  numeroVenta: string;
  clienteId: string;
  clienteNombre: string;
  fechaVenta: string;
  estado: 'Completada' | 'Anulada' | 'Devuelta';
  items: ItemVenta[];
  subtotal: number;
  iva: number;
  total: number;
  metodoPago: string;
  observaciones: string;
  anulada: boolean;
  createdAt: string;
  pedido_id?: string;
  motivoAnulacion?: string;
  devolucionId?: string;  // 🔒 CRÍTICO: ID de la devolución aplicada (solo 1 por venta)
  
  // 🔒 NUEVO: Flags de movimientos de stock (no se manejan por estado)
  movimientosStock: {
    salidaEjecutada: boolean;    // Stock fue descargado al crear venta
    devolucionEjecutada: boolean; // Stock fue devuelto al anular venta
  };
}

/**
 * 🔒 FUNCIÓN CENTRAL: Finalizar Venta
 * 
 * Responsabilidades:
 * 1. Validar que todos los productos tienen variantes
 * 2. Verificar stock disponible para cada item
 * 3. Descontar stock de forma atómica
 * 4. Guardar venta en localStorage
 * 5. Disparar eventos para sincronización
 * 
 * @param ventaData - Objeto Venta completo con datos de cliente, items, totales
 * @param items - Array de ItemVenta a descontar del stock
 * @returns { exitoso: boolean; error?: string }
 */
export const finalizarVenta = (ventaData: Venta, items: ItemVenta[]): { exitoso: boolean; error?: string } => {
  try {
    // 1️⃣ OBTENER PRODUCTOS ACTUALES
    const productosJSON = localStorage.getItem(PRODUCTOS_KEY);
    if (!productosJSON) {
      return {
        exitoso: false,
        error: '❌ Error crítico: No hay productos en localStorage'
      };
    }

    const productos = JSON.parse(productosJSON);

    // 2️⃣ 🔒 DESCONTAR STOCK (Operación atómica)
    const productosActualizados = productos.map((prod: any) => {
      const itemsDelProducto = items.filter((item: any) => 
        String(item.productoId) === String(prod.id)
      );
      
      if (itemsDelProducto.length === 0) {
        return prod; // Sin cambios
      }

      // 🔒 GUARD CLAUSE: Validar que el producto tiene variantes
      if (!prod.variantes || prod.variantes.length === 0) {
        throw new Error(`❌ CRÍTICO: Producto "${prod.nombre}" no tiene variantes. Stock no puede descontarse.`);
      }

      // 📦 Actualizar stock de variantes
      const variantes = prod.variantes.map((variante: any) => ({
        ...variante,
        colores: variante.colores.map((color: any) => {
          // Calcular cantidad vendida para este color
          const cantidadVendida = itemsDelProducto.reduce((sum: number, item: any) => {
            if (item.talla === variante.talla && item.color === color.color) {
              return sum + item.cantidad;
            }
            return sum;
          }, 0);
          
          if (cantidadVendida > 0) {
            // 🔒 GUARD CLAUSE: Validar stock suficiente
            if (color.cantidad < cantidadVendida) {
              throw new Error(
                `❌ Stock insuficiente para ${prod.nombre} (${variante.talla}, ${color.color}).\n` +
                `Disponible: ${color.cantidad} | Solicitado: ${cantidadVendida}`
              );
            }

            const nuevoStock = Math.max(0, color.cantidad - cantidadVendida);
            console.log(
              `📦 [finalizarVenta] ${prod.nombre} - ${variante.talla} ${color.color}: ` +
              `${color.cantidad} - ${cantidadVendida} = ${nuevoStock}`
            );
            return { ...color, cantidad: nuevoStock };
          }
          return color;
        })
      }));
      
      return { ...prod, variantes };
    });

    // 3️⃣ 💾 GUARDAR VENTA CON FLAGS DE MOVIMIENTOS
    const ventaConFlags: Venta = {
      ...ventaData,
      // 🔒 Marcar que el movimiento de salida fue ejecutado
      movimientosStock: {
        salidaEjecutada: true,   // Stock ya fue descargado
        devolucionEjecutada: false // Aún no ha sido devuelto
      }
    };
    
    const ventasActuales = JSON.parse(localStorage.getItem(VENTAS_KEY) || '[]');
    const ventasActualizadas = [...ventasActuales, ventaConFlags];
    localStorage.setItem(VENTAS_KEY, JSON.stringify(ventasActualizadas));

    // 4️⃣ 💾 GUARDAR PRODUCTOS CON STOCK ACTUALIZADO
    localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosActualizados));

    // 5️⃣ 🔔 DISPARAR EVENTOS PARA SINCRONIZACIÓN
    // Evento de almacenamiento para Compras/Productos
    window.dispatchEvent(new StorageEvent('storage', {
      key: PRODUCTOS_KEY,
      newValue: JSON.stringify(productosActualizados),
      oldValue: productosJSON,
      url: window.location.href
    }));

    // Evento personalizado para sincronización de Ventas
    window.dispatchEvent(new Event('ventaFinalizada'));
    window.dispatchEvent(new Event('salesUpdated'));

    console.log(`✅ [finalizarVenta] Venta ${ventaData.numeroVenta} finalizada - Stock descargado`);

    return { exitoso: true };
  } catch (error: any) {
    const mensajeError = error.message || 'Error desconocido al finalizar venta';
    console.error(`❌ [finalizarVenta] ${mensajeError}`);
    return {
      exitoso: false,
      error: mensajeError
    };
  }
};

/**
 * Generar número de venta secuencial
 */
export const generarNumeroVenta = (): string => {
  const counter = parseInt(localStorage.getItem(VENTA_COUNTER_KEY) || '1', 10);
  const numeroVenta = `VEN-${counter.toString().padStart(3, '0')}`;
  localStorage.setItem(VENTA_COUNTER_KEY, String(counter + 1));
  return numeroVenta;
};

// ============================================================
// 🔒 FUNCIÓN: Anular Venta (Segura con flags)
// ============================================================

/**
 * 🔒 ANULAR VENTA DE FORMA SEGURA
 * 
 * Garantiza:
 * - Stock se devuelve SOLO UNA VEZ
 * - Solo si salidaEjecutada === true && devolucionEjecutada === false
 * - Bloquea anulación múltiple
 * - Requiere que no haya cambios ni devoluciones
 * 
 * @param venta - Venta a anular
 * @param motivoAnulacion - Motivo de la anulación
 * @returns { exitoso, error?, stockDevuelto? }
 */
export const anularVentaSegura = (
  venta: Venta,
  motivoAnulacion: string
): {
  exitoso: boolean;
  error?: string;
  stockDevuelto?: Array<{ productoId: string; nombreProducto: string; talla: string; color: string; cantidad: number }>;
} => {
  try {
    // ================================================================
    // 1️⃣ VALIDACIONES PREVIAS
    // ================================================================

    // Validar que no tiene cambios ni devoluciones
    const CAMBIOS_KEY = 'damabella_cambios';
    const DEVOLUCIONES_KEY = 'damabella_devoluciones';

    const cambios = JSON.parse(localStorage.getItem(CAMBIOS_KEY) || '[]');
    const devoluciones = JSON.parse(localStorage.getItem(DEVOLUCIONES_KEY) || '[]');

    const tieneDevolucion = devoluciones.some(
      (d: any) => d.ventaId === venta.id || d.numeroVenta === venta.numeroVenta
    );

    const tieneCambioReal = cambios.some((c: any) =>
      c.ventaOriginalId === venta.id.toString() &&
      c.stockAplicado === true &&
      c.devolverAplicada === true &&
      c.reversado !== true
    );

    if (tieneDevolucion) {
      return {
        exitoso: false,
        error: '❌ Esta venta tiene devoluciones asociadas. Debe anularlas primero.'
      };
    }

    if (tieneCambioReal) {
      return {
        exitoso: false,
        error: '❌ Esta venta tiene cambios con movimientos de stock. Debe anular los cambios primero.'
      };
    }

    // ================================================================
    // 2️⃣ VALIDAR FLAGS DE MOVIMIENTOS
    // ================================================================

    // Si ya fue devuelto, no hacer nada
    if (venta.movimientosStock?.devolucionEjecutada === true) {
      return {
        exitoso: true, // No es error, solo que ya fue devuelto
        error: undefined,
        stockDevuelto: [] // No hay stock que devolver (ya fue devuelto)
      };
    }

    // Solo devolver stock si la salida fue ejecutada
    if (venta.movimientosStock?.salidaEjecutada !== true) {
      // La venta nunca tuvo stock descargado, no hay nada que devolver
      console.log(`ℹ️ Venta ${venta.numeroVenta} nunca tuvo stock descargado. Anulación sin devolución.`);
      
      const ventasActuales = JSON.parse(localStorage.getItem(VENTAS_KEY) || '[]');
      const ventasActualizadas = ventasActuales.map((v: Venta) =>
        v.id === venta.id
          ? {
              ...v,
              estado: 'Anulada',
              anulada: true,
              motivoAnulacion,
              movimientosStock: {
                salidaEjecutada: false,
                devolucionEjecutada: false
              }
            }
          : v
      );
      localStorage.setItem(VENTAS_KEY, JSON.stringify(ventasActualizadas));
      
      return {
        exitoso: true,
        stockDevuelto: []
      };
    }

    // ================================================================
    // 3️⃣ DEVOLVER STOCK (Operación atómica)
    // ================================================================

    const productosJSON = localStorage.getItem(PRODUCTOS_KEY);
    if (!productosJSON) {
      return {
        exitoso: false,
        error: '❌ Error crítico: No hay productos en localStorage'
      };
    }

    const productos = JSON.parse(productosJSON);
    const stockDevuelto: Array<{
      productoId: string;
      nombreProducto: string;
      talla: string;
      color: string;
      cantidad: number;
    }> = [];

    const productosActualizados = productos.map((producto: any) => {
      const itemsDeVenta = venta.items.filter(
        (item: ItemVenta) => String(item.productoId) === String(producto.id)
      );

      if (itemsDeVenta.length === 0) {
        return producto; // Sin cambios
      }

      const variantes = producto.variantes.map((variante: any) => ({
        ...variante,
        colores: variante.colores.map((color: any) => {
          // Calcular cantidad a devolver
          const cantidadADevolver = itemsDeVenta.reduce((sum: number, item: ItemVenta) => {
            if (item.talla === variante.talla && item.color === color.color) {
              return sum + item.cantidad;
            }
            return sum;
          }, 0);

          if (cantidadADevolver > 0) {
            const stockAnterior = color.cantidad;
            const nuevoStock = stockAnterior + cantidadADevolver;

            console.log(
              `📦 [anularVentaSegura] ${producto.nombre} - ${variante.talla} ${color.color}: ` +
              `${stockAnterior} + ${cantidadADevolver} = ${nuevoStock}`
            );

            stockDevuelto.push({
              productoId: producto.id,
              nombreProducto: producto.nombre,
              talla: variante.talla,
              color: color.color,
              cantidad: cantidadADevolver
            });

            return { ...color, cantidad: nuevoStock };
          }
          return color;
        })
      }));

      return { ...producto, variantes };
    });

    // ================================================================
    // 4️⃣ ACTUALIZAR VENTA: Marcar como anulada + devolucion ejecutada
    // ================================================================

    const ventasActuales = JSON.parse(localStorage.getItem(VENTAS_KEY) || '[]');
    const ventasActualizadas = ventasActuales.map((v: Venta) =>
      v.id === venta.id
        ? {
            ...v,
            estado: 'Anulada',
            anulada: true,
            motivoAnulacion,
            // 🔒 Marcar que la devolución fue ejecutada
            movimientosStock: {
              salidaEjecutada: true,      // Fue descargado
              devolucionEjecutada: true   // Ahora fue devuelto
            }
          }
        : v
    );

    // ================================================================
    // 5️⃣ PERSISTIR CAMBIOS (Operación atómica)
    // ================================================================

    localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosActualizados));
    localStorage.setItem(VENTAS_KEY, JSON.stringify(ventasActualizadas));

    // Disparar eventos
    window.dispatchEvent(new StorageEvent('storage', {
      key: PRODUCTOS_KEY,
      newValue: JSON.stringify(productosActualizados),
      oldValue: productosJSON,
      url: window.location.href
    }));

    window.dispatchEvent(new Event('salesUpdated'));

    console.log(`✅ [anularVentaSegura] Venta ${venta.numeroVenta} anulada - Stock devuelto (${stockDevuelto.length} items)`);

    return {
      exitoso: true,
      stockDevuelto
    };
  } catch (error: any) {
    const mensajeError = error.message || 'Error desconocido al anular venta';
    console.error(`❌ [anularVentaSegura] ${mensajeError}`);
    return {
      exitoso: false,
      error: mensajeError
    };
  }
};
