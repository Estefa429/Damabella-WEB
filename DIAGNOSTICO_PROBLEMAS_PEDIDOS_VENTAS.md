# 🔴 DIAGNÓSTICO CRÍTICO: Problemas Lógica Pedidos ↔ Ventas

## 📋 PROBLEMAS IDENTIFICADOS

### ❌ PROBLEMA 1: Un Pedido puede convertirse en Venta MÚLTIPLES VECES

**Ubicación:** `pedidoService.ts` → función `cambiarEstadoPedido()`
**Causa:** No hay campo `ventaId` en la interfaz `Pedido` para bloquear conversiones duplicadas
**Impacto:** 
- Mismo pedido crea múltiples ventas si se ejecuta transición Pendiente→Completada varias veces
- Stock se descuenta múltiples veces por el mismo pedido
- Inconsistencia entre módulos

**Evidencia:**
```typescript
// En pedidoService.ts línea 350-370
// CASO 1: Pendiente → Completada (Descontar stock)
if (estadoActual === 'Pendiente' && nuevoEstado === 'Completada') {
    // Valida stock pero NO valida si ya se convirtió a venta
    const validacion = validarStockDisponible(pedido.productos);
    const resultadoDescuento = descontarStock(pedido.productos);
    // ❌ NO hay validación de ventaId
}
```

---

### ❌ PROBLEMA 2: Pedido Completado puede volver a Pendiente

**Ubicación:** `pedidoService.ts` → función `validarTransicion()`
**Causa:** Solo prohíbe Completada→Pendiente en cambiarEstadoPedido, pero no en todas las rutas
**Impacto:** 
- Un pedido ya convertido a venta puede revertirse
- Stock puede descontarse/restaurarse múltiples veces
- Venta queda huérfana

---

### ❌ PROBLEMA 3: Pedido Completado se puede anular desde Pedidos

**Ubicación:** `PedidosManager.tsx` línea 1076-1083
**Causa:** Botón de "Anular" está habilitado para pedidos Completados
**Impacto:**
- Ventas que fueron creadas se anulan desde módulo Pedidos
- Stock se devuelve doble (una vez en Pedidos, otra en Ventas)
- Inconsistencia: el sistema de "origen de verdad" no es claro

**Evidencia:**
```tsx
// PedidosManager.tsx línea 1076
disabled={!puedeTransicionar(pedido.estado, 'Anulado')} // ❌ Permite anular Completada
```

---

### ❌ PROBLEMA 4: Stock se descuenta/devuelve MÚLTIPLES VECES

**Ubicación:** 
- `pedidoService.ts` → `descontarStock()` y `devolverStock()`
- `anularPedidoCentralizado.ts` → `devolverStockAlInventario()`
- `VentasManager.tsx` → `handleAnular()` línea 857-900

**Causa:** 
- Múltiples funciones manejan stock sin coordinación
- No hay flag `stockDevuelto` para prevenir devoluciones duplicadas
- Módulo Pedidos devuelve stock cuando se anula

**Flujo problemático:**
1. Pedido Pendiente → Completada = descuento stock ✓
2. Anula desde Pedidos = devuelve stock ✓
3. Venta también devuelve stock = DUPLICADO ❌

---

### ❌ PROBLEMA 5: Venta se anula sin protección de stock

**Ubicación:** `VentasManager.tsx` línea 838-930
**Causa:** 
- No hay flag para saber si stock fue devuelto
- Puede devolverse stock multiple veces
- No hay validación de si la venta ya tiene devoluciones/cambios

**Evidencia:**
```tsx
// VentasManager.tsx línea 857-900
const handleAnular = () => {
    // ... validaciones ...
    // PASO 1: Sumar stock de todos los items vendidos
    const productosActualizados = (productos || []).map((producto: any) => {
        // ❌ Siempre devuelve stock sin validar si ya fue devuelto
        // ❌ Sin flag como stockDevuelto
    });
};
```

---

### ❌ PROBLEMA 6: Pedidos sin ventaId no se bloquean

**Ubicación:** Interfaz `Pedido` en `pedidoService.ts`
**Causa:** Campo `ventaId` no existe
**Impacto:**
- No hay forma de saber qué venta corresponde a qué pedido
- Anulación sin saber si la venta asociada ya existe

---

## 🎯 SOLUCIONES REQUERIDAS

### ✅ SOLUCIÓN 1: Agregar campo `ventaId` a Pedido
```typescript
interface Pedido {
  id: string;
  clienteId: string;
  productos: ProductoPedido[];
  estado: 'Pendiente' | 'Completada' | 'Anulado';
  fecha: string;
  observaciones?: string;
  createdAt?: string;
  stockAjustado?: boolean;
  ventaId?: string; // ← NUEVO: referencia a venta creada
}
```

---

### ✅ SOLUCIÓN 2: Validar conversión única
```typescript
// En cambiarEstadoPedido cuando Pendiente → Completada
if (estadoActual === 'Pendiente' && nuevoEstado === 'Completada') {
    // NUEVA VALIDACIÓN
    if (pedido.ventaId) {
        return {
            success: false,
            mensaje: `Pedido ya fue convertido a venta (${pedido.ventaId})`
        };
    }
    // ... resto del código ...
}
```

---

### ✅ SOLUCIÓN 3: Bloquear edición de Completados
En PedidosManager:
- Deshabilitar botón "Editar" si estado === 'Completada'
- Deshabilitar botón "Anular" si estado === 'Completada'
- Hacer formulario solo-lectura

---

### ✅ SOLUCIÓN 4: Anulación solo desde Ventas
- **Regla:** Solo VentasManager puede anular Pedido Completado
- **anularPedidoCentralizado:** solo permite anular si estado === 'Pendiente'
- **anularVentaEnVentasManager:** maneja anulación y devolución de stock

---

### ✅ SOLUCIÓN 5: Flag `stockDevuelto` en Venta
```typescript
interface Venta {
  id: number;
  // ... otros campos ...
  estado: 'Completada' | 'Anulada';
  stockDevuelto?: boolean; // ← NUEVO: flag para prevenir devoluciones múltiples
  fechaAnulacion?: string;
  motivoAnulacion?: string;
}
```

---

### ✅ SOLUCIÓN 6: Guardar ventaId al crear venta
```typescript
// En cambiarEstadoPedidoCentralizado o cambiarEstadoPedido
if (nuevoEstado === 'Completada' && onSincronizarVentas) {
    // Crear venta, obtener su ID
    const venta = await crearVenta(...);
    // Guardar ventaId en pedido
    pedido.ventaId = venta.id;
    savePedidos(pedidosActualizados);
}
```

---

## 📊 MATRIZ DE RESPONSABILIDADES

| Operación | Módulo | Validación | Acción Stock |
|-----------|--------|-----------|--------------|
| Crear Pedido | Pedidos | - | - |
| Completar Pedido (Pendiente→Completada) | Pedidos | ✓ ventaId no existe | Descuenta |
| Anular Pedido (Pendiente→Anulado) | Pedidos | Solo si Pendiente | - |
| Anular Pedido (Completada→Anulado) | **Ventas** | ❌ BLOQUEADO en Pedidos | ❌ BLOQUEADO |
| Crear Venta desde Pedido | Pedidos + Ventas | ✓ Una sola vez | ✓ |
| Anular Venta | Ventas | ✓ stockDevuelto no existe | Devuelve (una sola vez) |
| Devolver/Cambiar en Venta | Ventas | ✓ stockDevuelto no existe | Devuelve |

---

## 🔐 REGLAS DE NEGOCIO FINALES

### Estados del Pedido
- **Pendiente** → Puede cambiar a Completada o Anulado
- **Completada** → Solo lectura, NO se puede cambiar estado desde Pedidos
- **Anulado** → Terminal, no hay cambios

### Conversión Pedido → Venta
- ✅ Un pedido se convierte en venta UNA sola vez
- ✅ Se guarda `ventaId` en el pedido
- ✅ Se descuenta stock una sola vez
- ✅ Si ya tiene `ventaId`, se bloquea nueva conversión

### Anulación
- ✅ Pedido Pendiente: puede anularse desde Pedidos
- ❌ Pedido Completado: SOLO puede anularse desde Ventas (anulando la venta)
- ✅ Venta: puede anularse desde Ventas (devuelve stock una sola vez)

### Stock
- ✅ Descuento: cuando Pedido pasa de Pendiente a Completada
- ✅ Devolución en Venta: cuando Venta se anula (si stockDevuelto === false)
- ❌ Devolución en Pedido: NO permitir (anulación de Completada)
- ✅ Cambios/Devoluciones en Ventas: gestiona stock sin afectar Pedidos

