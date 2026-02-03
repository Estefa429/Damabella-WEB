/**
 * 🔄 SERVICIO CENTRAL DE DEVOLUCIONES Y CAMBIOS
 * 
 * Separa claramente dos flujos:
 * 1. DEVOLUCIÓN CON SALDO: Cliente devuelve producto → suma stock + saldo
 * 2. CAMBIO: Cliente cambia producto → valida stock, descuenta saldo
 */

const PRODUCTOS_KEY = 'damabella_productos';
const CLIENTES_KEY = 'damabella_clientes';

export interface ItemDevolucion {
  id: string;
  productoNombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/**
 * 🔄 DEVOLUCIÓN CON SALDO
 * 
 * Cuando un cliente devuelve un producto:
 * 1. Suma el stock al inventario (NO valida, solo suma)
 * 2. Incrementa el saldo a favor del cliente
 * 3. NO requiere seleccionar producto nuevo
 * 4. NO descuenta stock de nada
 * 
 * @param clienteId - ID del cliente
 * @param itemsDevolucion - Items que se devuelven
 * @param totalDevolucion - Monto total a crédito
 * @returns { exitoso: boolean; error?: string; saldoNuevo?: number }
 */
export const procesarDevolucionConSaldo = (
  clienteId: string,
  itemsDevolucion: ItemDevolucion[],
  totalDevolucion: number
): { exitoso: boolean; error?: string; saldoNuevo?: number } => {
  try {
    // 1️⃣ OBTENER PRODUCTOS ACTUALES
    const productosJSON = localStorage.getItem(PRODUCTOS_KEY);
    if (!productosJSON) {
      return {
        exitoso: false,
        error: '❌ Error: No hay productos en el sistema'
      };
    }

    const productos = JSON.parse(productosJSON);

    // 2️⃣ SUMAR STOCK DE PRODUCTOS DEVUELTOS (SIN VALIDAR)
    const productosActualizados = productos.map((prod: any) => {
      const itemsDelProducto = itemsDevolucion.filter((item: any) => 
        item.productoNombre === prod.nombre
      );
      
      if (itemsDelProducto.length === 0) {
        return prod; // Sin cambios
      }

      // 🔒 GUARD CLAUSE: Producto debe tener variantes
      if (!prod.variantes || prod.variantes.length === 0) {
        throw new Error(`❌ Producto ${prod.nombre} no tiene variantes`);
      }

      // 📦 Sumar stock (NO validar, solo SUMAR)
      const variantes = prod.variantes.map((variante: any) => ({
        ...variante,
        colores: variante.colores.map((color: any) => {
          const cantidadDevuelta = itemsDelProducto.reduce((sum: number, item: any) => {
            if (item.talla === variante.talla && item.color === color.color) {
              return sum + item.cantidad;
            }
            return sum;
          }, 0);
          
          if (cantidadDevuelta > 0) {
            const nuevoStock = color.cantidad + cantidadDevuelta; // ➕ SUMA, no resta
            console.log(
              `📦 [DevolucionConSaldo] ${prod.nombre} - ${variante.talla} ${color.color}: ` +
              `${color.cantidad} + ${cantidadDevuelta} = ${nuevoStock}`
            );
            return { ...color, cantidad: nuevoStock };
          }
          return color;
        })
      }));
      
      return { ...prod, variantes };
    });

    // 3️⃣ GUARDAR PRODUCTOS CON STOCK ACTUALIZADO
    localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosActualizados));

    // 4️⃣ INCREMENTAR SALDO A FAVOR DEL CLIENTE
    const clientesJSON = localStorage.getItem(CLIENTES_KEY);
    const clientes = clientesJSON ? JSON.parse(clientesJSON) : [];

    const clientesActualizados = clientes.map((cliente: any) => {
      if (cliente.id.toString() === clienteId.toString()) {
        const saldoAnterior = Number(cliente.saldoAFavor || 0);
        const saldoNuevo = saldoAnterior + totalDevolucion;
        console.log(
          `💰 [DevolucionConSaldo] Cliente ${cliente.nombre}: ` +
          `Saldo ${saldoAnterior} + ${totalDevolucion} = ${saldoNuevo}`
        );
        return { ...cliente, saldoAFavor: saldoNuevo };
      }
      return cliente;
    });

    localStorage.setItem(CLIENTES_KEY, JSON.stringify(clientesActualizados));

    // 5️⃣ DISPARAR EVENTOS DE SINCRONIZACIÓN
    window.dispatchEvent(new StorageEvent('storage', {
      key: PRODUCTOS_KEY,
      newValue: JSON.stringify(productosActualizados),
      oldValue: productosJSON,
      url: window.location.href
    }));

    window.dispatchEvent(new Event('clientsUpdated'));
    window.dispatchEvent(new Event('devolucionProcessed'));

    const saldoNuevo = clientesActualizados.find((c: any) => c.id.toString() === clienteId)?.saldoAFavor || 0;

    console.log(`✅ [DevolucionConSaldo] Devolución procesada - Stock sumado, Saldo incrementado`);

    return { 
      exitoso: true,
      saldoNuevo
    };
  } catch (error: any) {
    const mensajeError = error.message || 'Error desconocido al procesar devolución';
    console.error(`❌ [DevolucionConSaldo] ${mensajeError}`);
    return {
      exitoso: false,
      error: mensajeError
    };
  }
};

/**
 * 🔄 CAMBIO CON SALDO
 * 
 * Cuando un cliente cambia un producto por otro:
 * 1. Valida que el producto nuevo EXISTE
 * 2. Valida que hay STOCK del producto nuevo (OBLIGATORIO)
 * 3. Descuenta stock del producto nuevo
 * 4. Suma stock del producto devuelto
 * 5. Descuenta saldo del cliente (si hay diferencia negativa)
 * 6. Incrementa saldo del cliente (si hay diferencia positiva)
 * 
 * @param clienteId - ID del cliente
 * @param itemsDevolucion - Items que devuelve
 * @param productoNuevoId - ID del producto nuevo
 * @param tallaProductoNuevo - Talla del producto nuevo
 * @param colorProductoNuevo - Color del producto nuevo
 * @param cantidadProductoNuevo - Cantidad del producto nuevo
 * @param totalDevolucion - Total de items devueltos
 * @param precioProductoNuevo - Precio del producto nuevo
 * @returns { exitoso: boolean; error?: string; diferencia?: number; saldoNuevo?: number }
 */
export const procesarCambioConSaldo = (
  clienteId: string,
  itemsDevolucion: ItemDevolucion[],
  productoNuevoId: string,
  tallaProductoNuevo: string,
  colorProductoNuevo: string,
  cantidadProductoNuevo: number,
  totalDevolucion: number,
  precioProductoNuevo: number
): { exitoso: boolean; error?: string; diferencia?: number; saldoNuevo?: number } => {
  try {
    // 1️⃣ OBTENER PRODUCTOS ACTUALES
    const productosJSON = localStorage.getItem(PRODUCTOS_KEY);
    if (!productosJSON) {
      return {
        exitoso: false,
        error: '❌ Error: No hay productos en el sistema'
      };
    }

    const productos = JSON.parse(productosJSON);

    // 2️⃣ 🔒 VALIDAR PRODUCTO NUEVO EXISTE
    const productoNuevo = productos.find((p: any) => p.id.toString() === productoNuevoId);
    if (!productoNuevo) {
      return {
        exitoso: false,
        error: '❌ Producto nuevo no encontrado'
      };
    }

    // 3️⃣ 🔒 VALIDAR VARIANTES DEL PRODUCTO NUEVO
    if (!productoNuevo.variantes || productoNuevo.variantes.length === 0) {
      return {
        exitoso: false,
        error: `❌ Producto ${productoNuevo.nombre} no tiene variantes. No se puede hacer cambio.`
      };
    }

    // 4️⃣ 🔒 VALIDAR STOCK DEL PRODUCTO NUEVO (CRITICAL)
    const varianteNueva = productoNuevo.variantes.find((v: any) => v.talla === tallaProductoNuevo);
    if (!varianteNueva) {
      return {
        exitoso: false,
        error: `❌ Talla ${tallaProductoNuevo} no disponible para cambio`
      };
    }

    const colorNuevo = varianteNueva.colores?.find((c: any) => c.color === colorProductoNuevo);
    if (!colorNuevo) {
      return {
        exitoso: false,
        error: `❌ Color ${colorProductoNuevo} no disponible para cambio`
      };
    }

    // 🔒 GUARD CLAUSE: Stock suficiente para cambio (OBLIGATORIO)
    if (colorNuevo.cantidad < cantidadProductoNuevo) {
      return {
        exitoso: false,
        error: 
          `❌ Stock insuficiente para cambio.\n` +
          `Disponible: ${colorNuevo.cantidad} | Solicitado: ${cantidadProductoNuevo}`
      };
    }

    // 5️⃣ ACTUALIZAR STOCK (Sumar devuelto + Restar nuevo)
    const productosActualizados = productos.map((prod: any) => {
      let esProductoDevuelto = false;
      let esProductoNuevo = false;

      // Verificar si es un producto devuelto
      const itemsDevueltos = itemsDevolucion.filter((item: any) => 
        item.productoNombre === prod.nombre
      );
      if (itemsDevueltos.length > 0) esProductoDevuelto = true;

      // Verificar si es el producto nuevo
      if (prod.id.toString() === productoNuevoId) esProductoNuevo = true;

      if (!esProductoDevuelto && !esProductoNuevo) {
        return prod;
      }

      if (!prod.variantes || prod.variantes.length === 0) {
        throw new Error(`❌ Producto ${prod.nombre} no tiene variantes`);
      }

      const variantes = prod.variantes.map((variante: any) => ({
        ...variante,
        colores: variante.colores.map((color: any) => {
          let cantidadACambiar = 0;

          // Si es producto devuelto: SUMAR
          if (esProductoDevuelto) {
            cantidadACambiar += itemsDevueltos.reduce((sum: number, item: any) => {
              if (item.talla === variante.talla && item.color === color.color) {
                return sum + item.cantidad;
              }
              return sum;
            }, 0);
          }

          // Si es producto nuevo: RESTAR
          if (esProductoNuevo && variante.talla === tallaProductoNuevo && color.color === colorProductoNuevo) {
            cantidadACambiar -= cantidadProductoNuevo;
          }

          if (cantidadACambiar !== 0) {
            const nuevoStock = color.cantidad + cantidadACambiar;
            console.log(
              `🔄 [CambioConSaldo] ${prod.nombre} - ${variante.talla} ${color.color}: ` +
              `${color.cantidad} ${cantidadACambiar > 0 ? '+' : ''} ${cantidadACambiar} = ${nuevoStock}`
            );
            return { ...color, cantidad: nuevoStock };
          }
          return color;
        })
      }));
      
      return { ...prod, variantes };
    });

    // 6️⃣ CALCULAR DIFERENCIA Y AJUSTAR SALDO
    const totalProductoNuevo = precioProductoNuevo * cantidadProductoNuevo;
    const diferencia = precioProductoNuevo - totalDevolucion;

    console.log(
      `💰 [CambioConSaldo] Cálculo: ` +
      `Precio nuevo ${precioProductoNuevo} - Total devuelto ${totalDevolucion} = ${diferencia}`
    );

    // 7️⃣ ACTUALIZAR SALDO CLIENTE
    const clientesJSON = localStorage.getItem(CLIENTES_KEY);
    const clientes = clientesJSON ? JSON.parse(clientesJSON) : [];

    const clientesActualizados = clientes.map((cliente: any) => {
      if (cliente.id.toString() === clienteId.toString()) {
        const saldoAnterior = Number(cliente.saldoAFavor || 0);
        let saldoNuevo = saldoAnterior;

        if (diferencia > 0) {
          // Cliente debe pagar más (descuenta saldo)
          saldoNuevo = Math.max(0, saldoAnterior - diferencia);
          console.log(
            `💰 [CambioConSaldo] Cliente debe pagar: ${diferencia} ` +
            `(Saldo: ${saldoAnterior} - ${diferencia} = ${saldoNuevo})`
          );
        } else if (diferencia < 0) {
          // Cliente recibe saldo (incrementa saldo)
          saldoNuevo = saldoAnterior + Math.abs(diferencia);
          console.log(
            `💰 [CambioConSaldo] Cliente recibe crédito: ${Math.abs(diferencia)} ` +
            `(Saldo: ${saldoAnterior} + ${Math.abs(diferencia)} = ${saldoNuevo})`
          );
        }

        return { ...cliente, saldoAFavor: saldoNuevo };
      }
      return cliente;
    });

    // 8️⃣ GUARDAR TODO EN LOCALSTORAGE
    localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosActualizados));
    localStorage.setItem(CLIENTES_KEY, JSON.stringify(clientesActualizados));

    // 9️⃣ DISPARAR EVENTOS
    window.dispatchEvent(new StorageEvent('storage', {
      key: PRODUCTOS_KEY,
      newValue: JSON.stringify(productosActualizados),
      oldValue: productosJSON,
      url: window.location.href
    }));

    window.dispatchEvent(new Event('clientsUpdated'));
    window.dispatchEvent(new Event('cambioProcessed'));

    const saldoNuevo = clientesActualizados.find((c: any) => c.id.toString() === clienteId)?.saldoAFavor || 0;

    console.log(`✅ [CambioConSaldo] Cambio procesado - Stock actualizado, Saldo ajustado`);

    return { 
      exitoso: true,
      diferencia,
      saldoNuevo
    };
  } catch (error: any) {
    const mensajeError = error.message || 'Error desconocido al procesar cambio';
    console.error(`❌ [CambioConSaldo] ${mensajeError}`);
    return {
      exitoso: false,
      error: mensajeError
    };
  }
};
