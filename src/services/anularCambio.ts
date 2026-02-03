/**
 * 🔒 SERVICIO CENTRALIZADO DE ANULACIÓN DE CAMBIOS
 * 
 * Función única responsable de:
 * 1. Validar que el cambio está aplicado (flags correctos)
 * 2. Devolver stock del producto entregado (+1)
 * 3. Devolver producto original a stock anterior (-1 ya estaba sumado)
 * 4. Actualizar items de venta (revertir estado)
 * 5. Marcar cambio como reversado
 * 6. Permitir nueva anulación de venta si corresponde
 */

// ============================================================
// TIPOS E INTERFACES
// ============================================================

export interface RegistroCambio {
  id: string;
  numeroCambio: string;
  ventaOriginalId: string;
  productoOriginalId: string;
  tallaDevuelta: string;
  colorDevuelta: string;
  productoEntregadoId: string;
  tallaEntregada: string;
  colorEntregada: string;
  motivoCambio: string;
  createdAt: string;
  stockAplicado?: boolean;
  devolverAplicada?: boolean;
  reversado?: boolean;
}

export interface ResultadoAnulacionCambio {
  exitoso: boolean;
  error?: string;
  mensaje: string;
  cambioReversado?: RegistroCambio;
  stockRevertido?: Array<{
    productoId: string;
    nombreProducto: string;
    talla: string;
    color: string;
    cantidad: number;
    accion: 'devuelto' | 'redescargado';
  }>;
}

export interface ConfiguracionAnulacionCambio {
  onReversado?: (cambio: RegistroCambio) => void;
  onNotificar?: (titulo: string, mensaje: string, tipo: 'success' | 'error' | 'info') => void;
  onLog?: (mensaje: string, nivel: 'log' | 'warn' | 'error') => void;
}

// ============================================================
// CONSTANTES
// ============================================================

const CAMBIOS_KEY = 'damabella_cambios';
const PRODUCTOS_KEY = 'damabella_productos';
const VENTAS_KEY = 'damabella_ventas';

// ============================================================
// HELPERS
// ============================================================

/**
 * Obtener un cambio por ID
 */
function obtenerCambio(cambioId: string): RegistroCambio | null {
  try {
    const cambiosJSON = localStorage.getItem(CAMBIOS_KEY);
    const cambios: RegistroCambio[] = cambiosJSON ? JSON.parse(cambiosJSON) : [];
    return cambios.find((c) => c.id === cambioId) || null;
  } catch (error) {
    console.error('❌ Error obteniendo cambio:', error);
    return null;
  }
}

/**
 * Obtener venta por ID
 */
function obtenerVenta(ventaId: string): any | null {
  try {
    const ventasJSON = localStorage.getItem(VENTAS_KEY);
    const ventas = ventasJSON ? JSON.parse(ventasJSON) : [];
    return ventas.find((v: any) => v.id?.toString() === ventaId.toString()) || null;
  } catch (error) {
    console.error('❌ Error obteniendo venta:', error);
    return null;
  }
}

/**
 * Revertir stock: Devolver -1 del nuevo, sumar -1 del original
 * (Ya que el original estaba +1)
 */
function revertirStockCambio(cambio: RegistroCambio): {
  exitoso: boolean;
  error?: string;
  productosActualizados?: any[];
  stockRevertido?: Array<{
    productoId: string;
    nombreProducto: string;
    talla: string;
    color: string;
    cantidad: number;
    accion: 'devuelto' | 'redescargado';
  }>;
} {
  try {
    const productosJSON = localStorage.getItem(PRODUCTOS_KEY);
    if (!productosJSON) {
      return {
        exitoso: false,
        error: '❌ Error crítico: No hay productos en localStorage',
      };
    }

    let productos = JSON.parse(productosJSON);
    const stockRevertido: Array<{
      productoId: string;
      nombreProducto: string;
      talla: string;
      color: string;
      cantidad: number;
      accion: 'devuelto' | 'redescargado';
    }> = [];

    // 1️⃣ DESCONTAR 1 del producto ENTREGADO (revertir descuento anterior)
    let productoEntregadoModificado = false;
    const productoEntregado = productos.find(
      (p: any) => p.id.toString() === cambio.productoEntregadoId
    );

    if (productoEntregado) {
      const varianteEntregada = productoEntregado.variantes?.find(
        (v: any) => v.talla === cambio.tallaEntregada
      );

      if (varianteEntregada) {
        const colorEntregado = varianteEntregada.colores?.find(
          (c: any) => c.color === cambio.colorEntregada
        );

        if (colorEntregado) {
          const nuevoStock = Math.max(0, (colorEntregado.cantidad || 0) - 1);
          colorEntregado.cantidad = nuevoStock;
          productoEntregadoModificado = true;

          stockRevertido.push({
            productoId: productoEntregado.id,
            nombreProducto: productoEntregado.nombre,
            talla: cambio.tallaEntregada,
            color: cambio.colorEntregada,
            cantidad: 1,
            accion: 'redescargado', // Volvió a ser descargado
          });

          console.log(
            `📦 [revertirStockCambio] Redescargado 1 de ${productoEntregado.nombre} ` +
            `${cambio.tallaEntregada}/${cambio.colorEntregada} (nuevo: ${nuevoStock})`
          );
        }
      }
    }

    // 2️⃣ SUMAR 1 al producto ORIGINAL (revertir devolución anterior)
    let productoOriginalModificado = false;
    const productoOriginal = productos.find(
      (p: any) => p.id.toString() === cambio.productoOriginalId
    );

    if (productoOriginal) {
      const varianteOriginal = productoOriginal.variantes?.find(
        (v: any) => v.talla === cambio.tallaDevuelta
      );

      if (varianteOriginal) {
        const colorOriginal = varianteOriginal.colores?.find(
          (c: any) => c.color === cambio.colorDevuelta
        );

        if (colorOriginal) {
          const nuevoStock = (colorOriginal.cantidad || 0) + 1;
          colorOriginal.cantidad = nuevoStock;
          productoOriginalModificado = true;

          stockRevertido.push({
            productoId: productoOriginal.id,
            nombreProducto: productoOriginal.nombre,
            talla: cambio.tallaDevuelta,
            color: cambio.colorDevuelta,
            cantidad: 1,
            accion: 'devuelto', // Volvió al original
          });

          console.log(
            `📦 [revertirStockCambio] Devuelto 1 de ${productoOriginal.nombre} ` +
            `${cambio.tallaDevuelta}/${cambio.colorDevuelta} (nuevo: ${nuevoStock})`
          );
        }
      }
    }

    if (!productoEntregadoModificado && !productoOriginalModificado) {
      return {
        exitoso: false,
        error: '❌ No se pudo modificar el stock de los productos del cambio',
      };
    }

    // Persistir cambios
    localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productos));

    return {
      exitoso: true,
      productosActualizados: productos,
      stockRevertido,
    };
  } catch (error: any) {
    return {
      exitoso: false,
      error: error.message || 'Error revirtiendo stock',
    };
  }
}

/**
 * Actualizar items de venta: Revertir estado de items
 */
function revertirItemsVenta(ventaId: string, cambio: RegistroCambio): boolean {
  try {
    const ventasJSON = localStorage.getItem(VENTAS_KEY);
    const ventas = ventasJSON ? JSON.parse(ventasJSON) : [];

    const ventaIndex = ventas.findIndex((v: any) => v.id?.toString() === ventaId.toString());
    if (ventaIndex === -1) {
      console.error(`❌ Venta ${ventaId} no encontrada`);
      return false;
    }

    const venta = ventas[ventaIndex];

    // Actualizar items:
    // - Producto original: cambiar de 'Cambiado' a 'Activo'
    // - Producto nuevo: remover
    venta.items = venta.items
      .map((item: any) => {
        if (
          item.productoId?.toString() === cambio.productoOriginalId &&
          item.talla === cambio.tallaDevuelta &&
          item.color === cambio.colorDevuelta &&
          item.estado === 'Cambiado'
        ) {
          return { ...item, estado: 'Activo' };
        }
        return item;
      })
      .filter((item: any) => {
        // Remover el item nuevo (que fue agregado durante el cambio)
        return !(
          item.productoId?.toString() === cambio.productoEntregadoId &&
          item.talla === cambio.tallaEntregada &&
          item.color === cambio.colorEntregada &&
          item.estado === 'Activo'
        );
      });

    localStorage.setItem(VENTAS_KEY, JSON.stringify(ventas));

    console.log(`✅ Items de venta revertidos para cambio ${cambio.numeroCambio}`);
    return true;
  } catch (error) {
    console.error('❌ Error revirtiendo items de venta:', error);
    return false;
  }
}

// ============================================================
// FUNCIÓN PRINCIPAL: ANULAR CAMBIO
// ============================================================

/**
 * 🔒 FUNCIÓN CENTRALIZADA DE ANULACIÓN DE CAMBIOS
 * 
 * Invierte TODO lo que hizo el cambio:
 * - Revierte stock (-1 nuevo, +1 original)
 * - Actualiza items de venta
 * - Marca cambio como reversado
 * - Permite anular venta después
 * 
 * @param cambioId - ID del cambio a anular
 * @param config - Configuración (callbacks)
 * @returns ResultadoAnulacionCambio
 */
export function anularCambio(
  cambioId: string,
  config?: ConfiguracionAnulacionCambio
): ResultadoAnulacionCambio {
  const log = config?.onLog || console.log;
  const notificar = config?.onNotificar || (() => {});

  try {
    log(`\n🔄 [anularCambio] Iniciando anulación de cambio ${cambioId}`, 'log');

    // ================================================================
    // 1️⃣ OBTENER Y VALIDAR CAMBIO
    // ================================================================

    const cambio = obtenerCambio(cambioId);
    if (!cambio) {
      const error = `❌ Cambio ${cambioId} no encontrado`;
      log(error, 'error');
      notificar('Error', 'Cambio no encontrado', 'error');
      return {
        exitoso: false,
        error,
        mensaje: 'El cambio no existe',
      };
    }

    log(`✅ Cambio encontrado: ${cambio.numeroCambio}`, 'log');

    // ================================================================
    // 2️⃣ VALIDAR QUE EL CAMBIO ESTÁ APLICADO
    // ================================================================

    if (cambio.reversado === true) {
      const error = `⚠️ El cambio ${cambio.numeroCambio} ya fue reversado`;
      log(error, 'warn');
      notificar('Advertencia', 'Este cambio ya fue anulado', 'info');
      return {
        exitoso: true, // No es error, solo que ya está reversado
        mensaje: error,
        cambioReversado: cambio,
      };
    }

    if (cambio.stockAplicado !== true || cambio.devolverAplicada !== true) {
      const error = `⚠️ El cambio ${cambio.numeroCambio} no tiene movimientos reales de stock aplicados`;
      log(error, 'warn');
      // Es un cambio fantasma, permitir anular (no hay stock que revertir)
      log(`Ignorando anulación de cambio fantasma`, 'log');
      return {
        exitoso: true,
        mensaje: 'Cambio fantasma no requiere reversión de stock',
        cambioReversado: cambio,
      };
    }

    // ================================================================
    // 3️⃣ REVERTIR STOCK
    // ================================================================

    log(`\n📦 Revirtiendo stock...`, 'log');
    const resultadoStock = revertirStockCambio(cambio);

    if (!resultadoStock.exitoso) {
      const error = `❌ Error revirtiendo stock: ${resultadoStock.error}`;
      log(error, 'error');
      notificar('Error', `No se pudo revertir el stock: ${resultadoStock.error}`, 'error');
      return {
        exitoso: false,
        error,
        mensaje: 'Error revirtiendo stock del cambio',
      };
    }

    log(`✅ Stock revertido exitosamente`, 'log');

    // ================================================================
    // 4️⃣ REVERTIR ITEMS DE VENTA
    // ================================================================

    log(`\n📋 Revirtiendo items de venta...`, 'log');
    const resultadoItems = revertirItemsVenta(cambio.ventaOriginalId, cambio);

    if (!resultadoItems) {
      log(
        `⚠️ Advertencia: No se pudieron revertir items de venta. Continuando de todas formas...`,
        'warn'
      );
    } else {
      log(`✅ Items de venta revertidos exitosamente`, 'log');
    }

    // ================================================================
    // 5️⃣ MARCAR CAMBIO COMO REVERSADO
    // ================================================================

    log(`\n🏷️ Marcando cambio como reversado...`, 'log');
    try {
      const cambiosJSON = localStorage.getItem(CAMBIOS_KEY);
      const cambios: RegistroCambio[] = cambiosJSON ? JSON.parse(cambiosJSON) : [];

      const index = cambios.findIndex((c) => c.id === cambioId);
      if (index !== -1) {
        cambios[index] = {
          ...cambios[index],
          reversado: true,
        };

        localStorage.setItem(CAMBIOS_KEY, JSON.stringify(cambios));
        log(`✅ Cambio marcado como reversado`, 'log');
      }
    } catch (error) {
      log(`⚠️ Advertencia: No se pudo marcar cambio como reversado`, 'warn');
    }

    // ================================================================
    // 6️⃣ DISPARAR EVENTOS Y RETORNAR
    // ================================================================

    window.dispatchEvent(
      new CustomEvent('cambioAnulado', {
        detail: { cambioId, ventaId: cambio.ventaOriginalId },
      })
    );

    const mensaje = `✅ Cambio ${cambio.numeroCambio} anulado correctamente. ` +
                    `Stock revertido, ahora puede anular la venta si lo desea.`;

    log(mensaje, 'log');
    notificar('Éxito', mensaje, 'success');

    if (config?.onReversado) {
      config.onReversado(cambio);
    }

    return {
      exitoso: true,
      mensaje,
      cambioReversado: cambio,
      stockRevertido: resultadoStock.stockRevertido,
    };
  } catch (error: any) {
    const mensajeError = error.message || 'Error desconocido';
    log(`❌ [ERROR] ${mensajeError}`, 'error');
    notificar('Error', mensajeError, 'error');

    return {
      exitoso: false,
      error: mensajeError,
      mensaje: 'Error al anular el cambio',
    };
  }
}
