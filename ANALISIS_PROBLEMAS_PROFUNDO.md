# 🔍 ANÁLISIS PROFUNDO DE PROBLEMAS DE LÓGICA DE NEGOCIO

## 📋 Resumen Ejecutivo

Existen inconsistencias graves en el flujo **Pedidos → Ventas → Cambios/Anulaciones** que causan:
- ❌ Reajustes de stock no atómicos
- ❌ Estados inconsistentes entre módulos
- ❌ Ventas bloqueadas sin razón válida
- ❌ "Cambios fantasma" (registros sin movimientos reales)
- ❌ Fallos de reversión de cambios

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1️⃣ PROBLEMA: Anulación de Pedidos Completados Bloqueada Incorrectamente

**Ubicación:** `anularPedidoCentralizado.ts` líneas 246-254

**Problema:**
```typescript
if (pedido.estado === 'Completada') {
  const error = `❌ OPERACIÓN BLOQUEADA: No se puede anular un pedido en estado "Completada" desde el módulo Pedidos.`
  // Retorna FALSO
}
```

**¿Por qué es un problema?**
- Bloquea anulación de Completada pero la regla de negocio dice que SÍ se puede anular
- Fuerza al usuario a pasar por Ventas (complejidad innecesaria)
- Un pedido Completada es apenas una Venta con venta_id asociado
- Debe poder anularse desde Pedidos si la Venta no ha sido Completada aún

**Comportamiento esperado (según reglas):**
```
Pedido: Completada → Anulado:
  ✅ SI el pedido fue convertido a venta (venta_id existe)
  ✅ Devolver stock de items
  ✅ Marcar venta como Anulada
  ✅ Cambiar estado a Anulado
```

---

### 2️⃣ PROBLEMA: Flag "tieneCambio" Sin Validación de Movimientos Reales

**Ubicación:** `VentasManager.tsx` líneas 857-877

**Problema:**
```typescript
const tieneCambio = (cambios || []).some(
  (cam: any) => cam.ventaOriginalId === ventaToAnular.id.toString()
);

if (tieneDevolucion || tieneCambio) {
  // BLOQUEA anulación
}
```

**¿Por qué es un problema?**
- Solo verifica que existe un REGISTRO de cambio
- NO verifica si el cambio tuvo movimientos reales de stock
- Bloquea anulación de una venta incluso si el cambio falló
- Un "cambio fantasma" (registro sin stock) debería permitir anulación

**Comportamiento esperado:**
```
Anulación de venta:
  ✅ SI tiene cambios REALES (stock ajustado)
     → Debe exigir anular el cambio PRIMERO
  ✅ SI tiene cambios FANTASMA (registro sin stock)
     → Debe permitir anular normalmente (ignorar el cambio)
  ✅ SI NO tiene cambios
     → Anular directamente
```

---

### 3️⃣ PROBLEMA: handleCrearCambio No es Atómico

**Ubicación:** `VentasManager.tsx` líneas 1273-1480

**Problema:**
- Valida sobre stock ACTUAL, no stock VIRTUAL
- No aplica devolución ANTES de validar
- Múltiples llamadas a localStorage.setItem (no atómico)
- Si falla en medio, deja datos inconsistentes

**Comportamiento esperado:**
```
Cambio de Producto (OPERACIÓN ATÓMICA):
  1. Clone productos en memoria
  2. Suma +1 al producto devuelto (en virtual)
  3. Valida producto nuevo contra virtual
  4. Valida stock virtual ≥ 1
  5. SI TODAS PASAN:
     → UN SOLO setItem con el resultado
     → Crea registro de cambio
     → Actualiza detalle de venta
  6. SI ALGUNA FALLA:
     → NO modifica nada
     → No bloquea venta
     → Mensaje claro al usuario
```

---

### 4️⃣ PROBLEMA: Venta No Registra Cambios Aplicados

**Ubicación:** `VentasManager.tsx` líneas 1450-1480

**Problema:**
```typescript
// Se crea registro en CAMBIOS_KEY
// Pero Venta.items NO se actualiza
// No hay trazabilidad dentro de la venta

const nuevoCambio = { /* registro */ };
localStorage.setItem(CAMBIOS_KEY, JSON.stringify([...cambios, nuevoCambio]));

// FALTA actualizar:
// venta.items[item].estado = 'Cambiado'
// venta.items.push({ ...nuevo item })
```

**Comportamiento esperado:**
```
Después de un cambio:
  Venta.items:
    - Producto original: { ...props, estado: 'Cambiado' }
    - Producto nuevo: { ...props, estado: 'Activo' }
```

---

### 5️⃣ PROBLEMA: Pedido Completada Puede Ser Modificado

**Ubicación:** `PedidosManager.tsx` líneas 1061-1070

**Problema:**
```typescript
// Solo bloquea si tiene venta_id
disabled={!puedeEditarse(pedido.estado) || !!pedido.venta_id}

// PERO después de convertir a Completada:
// El venta_id NO siempre se asigna
// El pedido puede ser editado aunque ya sea Venta
```

**Comportamiento esperado:**
```
Pedido Completada:
  ❌ NO editable (estado terminal desde módulo Pedidos)
  ❌ NO anulable directamente (solo desde Ventas)
  ✅ Solo lectura o abrir venta asociada
```

---

### 6️⃣ PROBLEMA: Reversión de Cambios No Implementada

**Ubicación:** No existe función de anular cambio

**Problema:**
- Un cambio aplicado no se puede deshacer
- Si cambio falló parcialmente, no hay reversa
- Venta queda en estado inconsistente

**Comportamiento esperado:**
```
Función: anularCambio(cambioId):
  1. Obtener registro de cambio
  2. Validar que está aplicado (check flags)
  3. Devolver stock del nuevo producto (-1)
  4. Devolver stock del original (+1)
  5. Actualizar items de venta:
     - Original: estado='Activo'
     - Nuevo: eliminar o marcar 'Reversado'
  6. Marcar cambio como 'Reversado'
  7. Permitir nueva anulación de venta si corresponde
```

---

### 7️⃣ PROBLEMA: Stock Devuelto Flag Insuficiente

**Ubicación:** `saleService.ts`, `VentasManager.tsx` múltiples lugares

**Problema:**
```typescript
// Un flag booleano no es suficiente para:
// - Verificar si cambios se aplicaron
// - Revertir cambios
// - Conocer qué se cambió exactamente

venta.stockDevuelto: boolean // ❌ Insuficiente
```

**Comportamiento esperado:**
```typescript
venta.movimientos: {
  creacion: { fecha, stock_descargado: [...] },
  cambios: [{
    cambioId, fecha, stock_devuelto, stock_descargado
  }],
  anulacion: { fecha, stock_devuelto: [...] }
}
```

---

## 🛠️ SOLUCIONES PROPUESTAS

### A. Refactorizar `anularPedidoCentralizado`

**Cambio:**
- Permitir anular Completada desde Pedidos
- Devolver stock automáticamente
- Marcar venta asociada como Anulada

```typescript
if (pedido.estado === 'Completada') {
  // ✅ PERMITIR pero con condiciones
  const venta = obtenerVentaPorPedido(pedido.numeroPedido);
  
  if (venta?.estado === 'Anulada') {
    // Ya fue anulada, no hacer nada
    return { exitoso: true, ... };
  }
  
  // Devolver stock de items
  const resultado = devolverStockAlInventario(pedido.items);
  if (!resultado.exitoso) return { exitoso: false, ... };
  
  // Actualizar venta como Anulada
  // Cambiar pedido a Anulado
  // Disparar eventos
}
```

---

### B. Validación Inteligente de Cambios

**Cambio:**
- Validar cambios REALES vs FANTASMA
- Permitir anular si no hay cambios reales

```typescript
function validarCambiosReales(ventaId: string): {
  tieneReal: boolean;
  registros: any[];
} {
  const cambios = getCambios();
  const movimientosReales = cambios.filter(c => 
    c.ventaOriginalId === ventaId && 
    c.stockAplicado === true  // NEW: Flag que indica si se aplicó
  );
  
  return {
    tieneReal: movimientosReales.length > 0,
    registros: movimientosReales
  };
}

// En anularVenta:
const { tieneReal } = validarCambiosReales(venta.id);
if (tieneReal) {
  // Exigir anular cambios primero
} else {
  // Permitir anular normalmente
}
```

---

### C. Operación Atómica de Cambio

**Cambio:**
- Validar TODO antes de modificar
- UN SOLO setItem
- Actualizar venta.items

```typescript
const handleCrearCambio = () => {
  // 1. Validaciones previas (guard clauses) - SIN efectos secundarios
  
  // 2. OPERACIÓN ATÓMICA EN MEMORIA
  const productosVirtuales = clone(productosActuales);
  
  // 2.1 Aplicar devolución en virtual
  aplicarDevolucion(productosVirtuales, ...);
  
  // 2.2 Validar contra virtual
  const valido = validarContraVirtual(productosVirtuales, ...);
  if (!valido) return;
  
  // 2.3 Calcular cambios a items de venta
  const ventaActualizada = {
    ...venta,
    items: venta.items.map(i => 
      i.productoId === productoOriginalId 
        ? { ...i, estado: 'Cambiado' }
        : i
    )
  };
  ventaActualizada.items.push({ /* nuevo item */ });
  
  // 3. PERSISTIR (una sola vez)
  localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosVirtuales));
  localStorage.setItem(VENTAS_KEY, 
    JSON.stringify(actualizar(ventas, ventaActualizada))
  );
  localStorage.setItem(CAMBIOS_KEY, 
    JSON.stringify([...cambios, nuevoCambio])
  );
  
  // 4. Disparar eventos
  // 5. Mostrar confirmación
};
```

---

### D. Función de Anular Cambio

**Nuevo:**
```typescript
export function anularCambio(
  cambioId: string,
  config?: ConfiguracionAnulacion
): ResultadoAnulacion {
  // 1. Obtener cambio y validar
  // 2. Devolver stock (producto nuevo -1, original +1)
  // 3. Actualizar items de venta
  // 4. Marcar cambio como Reversado
  // 5. Permitir nueva anulación si corresponde
}
```

---

### E. Rastreo Completo de Movimientos

**Cambio:**
- Reemplazar `stockDevuelto` boolean con histórico

```typescript
interface Venta {
  ...
  movimientos: {
    creacion: { 
      fecha: string;
      stock_descargado: ItemStock[]
    };
    cambios: {
      cambioId: string;
      fecha: string;
      reversado: boolean;
      stock_devuelto: ItemStock[];
      stock_descargado: ItemStock[];
    }[];
    anulacion?: {
      fecha: string;
      stock_devuelto: ItemStock[];
    };
  }
}
```

---

## 📊 MATRIZ DE TRANSICIONES CORREGIDA

```
┌────────────┬──────────┬────────┬──────────┬────────────┬─────────────┐
│ Módulo     │ Operación│ Previo │ Nuevo    │ Stock      │ Condiciones │
├────────────┼──────────┼────────┼──────────┼────────────┼─────────────┤
│ PEDIDOS    │ Crear    │ -      │ Pendiente│ -          │ -           │
│ PEDIDOS    │ Editar   │ Pend.  │ Pend.    │ -          │ Solo si es  │
│            │          │        │          │            │ Pendiente   │
│ PEDIDOS    │ Completa │ Pend.  │ Complet. │ ⬇️ (una)    │ Stock OK    │
│ PEDIDOS    │ Anular   │ Pend.  │ Anulado  │ -          │ -           │
│ PEDIDOS    │ Anular   │ Comp.  │ Anulado  │ ⬆️         │ Devuelve    │
├────────────┼──────────┼────────┼──────────┼────────────┼─────────────┤
│ VENTAS     │ Ver      │ Complet│ Complet. │ -          │ Solo lectura│
│ VENTAS     │ Cambio   │ Complet│ Complet. │ ⬇️ +⬆️ (una)│ Stock OK    │
│ VENTAS     │ Anular   │ Complet│ Anulada  │ ⬆️         │ SIN cambios │
│            │ Cambio   │ Cambio │ Revers.  │ ⬆️ -⬇️     │ Reversible  │
└────────────┴──────────┴────────┴──────────┴────────────┴─────────────┘
```

---

## ✅ PRÓXIMAS ACCIONES

1. Refactorizar `anularPedidoCentralizado.ts`
2. Crear validador de cambios reales
3. Reescribir `handleCrearCambio` como operación atómica
4. Implementar `anularCambio`
5. Actualizar interfaz Venta con movimientos
6. Tests de flujos completos
7. Compilación y validación

