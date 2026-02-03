/**
 * 🔒 VALIDADORES CENTRALIZADOS PARA CAMBIOS DE PRODUCTO
 * 
 * Diferenciar entre:
 * - Cambios REALES: tiene movimientos de stock aplicados
 * - Cambios FANTASMA: registro sin movimientos de stock
 * 
 * Validar si una venta puede ser anulada según sus cambios
 */

// ============================================================
// TIPOS
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
  // 🔒 Flags para detectar si el cambio se aplicó realmente
  stockAplicado?: boolean;      // Si se descargó el stock del producto nuevo
  devolverAplicada?: boolean;   // Si se devolvió el producto original
  reversado?: boolean;          // Si el cambio fue anulado
}

export interface ValidacionCambios {
  tieneReal: boolean;                    // Tiene cambios reales (con stock)
  tieneFantasma: boolean;                // Tiene cambios sin stock
  registrosReales: RegistroCambio[];     // Cambios que sí afectaron stock
  registrosFantasma: RegistroCambio[];   // Cambios que no afectaron stock
}

// ============================================================
// CONSTANTES
// ============================================================

const CAMBIOS_KEY = 'damabella_cambios';

// ============================================================
// FUNCIÓN PRINCIPAL: Validar estado de cambios
// ============================================================

/**
 * 🔍 Validar si una venta tiene cambios REALES o FANTASMA
 * 
 * Cambio REAL: Se aplicó stock (stockAplicado=true, devolverAplicada=true)
 * Cambio FANTASMA: Solo registro, sin stock (flags false o undefined)
 * 
 * @param ventaId - ID de la venta
 * @returns ValidacionCambios con detalles
 */
export function validarCambiosVenta(ventaId: string): ValidacionCambios {
  try {
    const cambiosJSON = localStorage.getItem(CAMBIOS_KEY);
    const cambios: RegistroCambio[] = cambiosJSON ? JSON.parse(cambiosJSON) : [];

    // Obtener todos los cambios asociados a esta venta
    const cambiosDeLaVenta = cambios.filter(
      (c: RegistroCambio) => c.ventaOriginalId === ventaId
    );

    // Separar en reales y fantasma
    const registrosReales = cambiosDeLaVenta.filter(
      (c: RegistroCambio) => 
        c.stockAplicado === true && 
        c.devolverAplicada === true &&
        c.reversado !== true  // Si fue reversado, no cuenta como "real" actualizante
    );

    const registrosFantasma = cambiosDeLaVenta.filter(
      (c: RegistroCambio) => 
        registrosReales.indexOf(c) === -1  // No está en reales
    );

    return {
      tieneReal: registrosReales.length > 0,
      tieneFantasma: registrosFantasma.length > 0,
      registrosReales,
      registrosFantasma,
    };
  } catch (error) {
    console.error('❌ Error validando cambios:', error);
    return {
      tieneReal: false,
      tieneFantasma: false,
      registrosReales: [],
      registrosFantasma: [],
    };
  }
}

/**
 * ✅ ¿Puede anularse una venta según sus cambios?
 * 
 * Reglas:
 * - Si tiene CAMBIOS REALES: NO puede anularse (debe anular cambios primero)
 * - Si tiene CAMBIOS FANTASMA: SÍ puede anularse (ignorar cambios)
 * - Si NO tiene cambios: SÍ puede anularse
 * 
 * @param ventaId - ID de la venta
 * @returns { puedeAnularse, razon }
 */
export function puedeAnularseVentaConCambios(
  ventaId: string
): { puedeAnularse: boolean; razon: string } {
  const validacion = validarCambiosVenta(ventaId);

  if (validacion.tieneReal) {
    return {
      puedeAnularse: false,
      razon: `Esta venta tiene ${validacion.registrosReales.length} cambio(s) con movimientos de stock. ` +
             `Debe anular el cambio primero para poder anular la venta.`,
    };
  }

  if (validacion.tieneFantasma) {
    return {
      puedeAnularse: true,
      razon: `Nota: Esta venta tiene cambios sin movimientos de stock que serán ignorados.`,
    };
  }

  return {
    puedeAnularse: true,
    razon: 'Esta venta no tiene cambios y puede ser anulada.',
  };
}

/**
 * 🔄 Obtener cambios reversibles (solo los reales)
 * 
 * @param ventaId - ID de la venta
 * @returns Lista de cambios que pueden ser anulados
 */
export function obtenerCambiosReversibles(ventaId: string): RegistroCambio[] {
  const validacion = validarCambiosVenta(ventaId);
  return validacion.registrosReales.filter(
    (c: RegistroCambio) => c.reversado !== true
  );
}

/**
 * 🏷️ Marcar cambio como aplicado (actualizar flags)
 * 
 * @param cambioId - ID del cambio
 * @param stockAplicado - Si se descargó stock del nuevo producto
 * @param devolverAplicada - Si se devolvió el producto original
 */
export function marcarCambioAplicado(
  cambioId: string,
  stockAplicado: boolean = true,
  devolverAplicada: boolean = true
): boolean {
  try {
    const cambiosJSON = localStorage.getItem(CAMBIOS_KEY);
    const cambios: RegistroCambio[] = cambiosJSON ? JSON.parse(cambiosJSON) : [];

    const index = cambios.findIndex((c: RegistroCambio) => c.id === cambioId);
    if (index === -1) {
      console.error(`❌ Cambio ${cambioId} no encontrado`);
      return false;
    }

    cambios[index] = {
      ...cambios[index],
      stockAplicado,
      devolverAplicada,
    };

    localStorage.setItem(CAMBIOS_KEY, JSON.stringify(cambios));

    console.log(`✅ Cambio ${cambioId} marcado como aplicado`);
    return true;
  } catch (error) {
    console.error('❌ Error marcando cambio como aplicado:', error);
    return false;
  }
}

/**
 * ↩️ Marcar cambio como reversado (anulado)
 * 
 * @param cambioId - ID del cambio
 */
export function marcarCambioReversado(cambioId: string): boolean {
  try {
    const cambiosJSON = localStorage.getItem(CAMBIOS_KEY);
    const cambios: RegistroCambio[] = cambiosJSON ? JSON.parse(cambiosJSON) : [];

    const index = cambios.findIndex((c: RegistroCambio) => c.id === cambioId);
    if (index === -1) {
      console.error(`❌ Cambio ${cambioId} no encontrado`);
      return false;
    }

    cambios[index] = {
      ...cambios[index],
      reversado: true,
    };

    localStorage.setItem(CAMBIOS_KEY, JSON.stringify(cambios));

    console.log(`✅ Cambio ${cambioId} marcado como reversado`);
    return true;
  } catch (error) {
    console.error('❌ Error marcando cambio como reversado:', error);
    return false;
  }
}

// ============================================================
// FUNCIÓN: Validación de precondiciones para anulación
// ============================================================

/**
 * 🔒 Validación TOTAL antes de anular una venta
 * 
 * Valida:
 * - Estado de la venta es Completada
 * - No tiene devoluciones
 * - Si tiene cambios, son solo fantasma o reversibles
 * 
 * @param venta - Objeto venta
 * @returns { puedeAnularse, mensaje, requiereAnularCambios }
 */
export function validarAnulacionVenta(venta: any): {
  puedeAnularse: boolean;
  mensaje: string;
  requiereAnularCambios: boolean;
} {
  // Validar estado
  if (venta.estado !== 'Completada') {
    return {
      puedeAnularse: false,
      mensaje: `Solo se pueden anular ventas en estado COMPLETADA. Esta está en ${venta.estado}.`,
      requiereAnularCambios: false,
    };
  }

  // Validar devoluciones
  const devolucionesJSON = localStorage.getItem('damabella_devoluciones');
  const devoluciones = devolucionesJSON ? JSON.parse(devolucionesJSON) : [];
  const tieneDevolucion = devoluciones.some(
    (d: any) => d.ventaId === venta.id || d.numeroVenta === venta.numeroVenta
  );

  if (tieneDevolucion) {
    return {
      puedeAnularse: false,
      mensaje: 'Esta venta tiene devoluciones asociadas. Debe anularlas primero.',
      requiereAnularCambios: false,
    };
  }

  // Validar cambios
  const validacionCambios = validarCambiosVenta(venta.id.toString());

  if (validacionCambios.tieneReal) {
    return {
      puedeAnularse: false,
      mensaje: 'Esta venta tiene cambios con movimientos de stock. Debe anular los cambios primero.',
      requiereAnularCambios: true,
    };
  }

  return {
    puedeAnularse: true,
    mensaje: '',
    requiereAnularCambios: false,
  };
}
