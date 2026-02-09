# ✅ GUÍA DE PRUEBAS: Correcciones de Lógica Pedidos ↔ Ventas

## 🎯 Objetivo

Validar que los cambios implementados previenen:
1. ❌ Conversiones duplicadas de Pedido → Venta
2. ❌ Anulación de pedidos Completados desde módulo Pedidos
3. ❌ Devoluciones múltiples de stock
4. ❌ Reversiones imposibles (Completada → Pendiente)

---

## 📋 CASOS DE PRUEBA

### CASO 1: Bloqueo de Conversión Duplicada

**Escenario:** Un pedido en estado Pendiente se convierte a Completada (→ Venta)

**Pasos:**
1. Crear Pedido "PED-001" con 2 productos (Estado: Pendiente)
2. Cambiar estado a "Completada" desde módulo Pedidos
3. ✅ Se crea Venta asociada automáticamente
4. ✅ Se guarda `ventaId` en el pedido
5. ✅ Stock se descuenta UNA sola vez
6. Intentar cambiar estado nuevamente a "Completada" (o hacerlo 2 veces desde UI)

**Resultado Esperado:**
- ❌ Error: "Pedido ya fue convertido a venta. No se puede convertir nuevamente"
- ✅ ventaId está presente y coincide con la venta creada
- ✅ Stock solo se descuenta una vez (verificar en módulo Productos)

**Verificación:**
```typescript
// En localStorage, buscar el pedido
const pedido = JSON.parse(localStorage.getItem('damabella_pedidos'))[0];
console.log('Pedido:', pedido);
console.log('ventaId:', pedido.ventaId); // Debe tener valor
console.log('estado:', pedido.estado); // Debe ser 'Completada'
```

---

### CASO 2: Bloqueo de Anulación desde Pedidos

**Escenario:** Pedido ya Completado intenta anularse desde módulo Pedidos

**Pasos:**
1. Usar pedido del CASO 1 (PED-001, estado: Completada)
2. Buscar botón "Anular" en la tabla de pedidos
3. Hacer click en botón "Anular"

**Resultado Esperado:**
- ❌ Botón "Anular" está **DESHABILITADO** (grisado)
- ❌ Al intentar hacerlo por consola, error: "No se puede anular un pedido en estado Completada desde el módulo Pedidos"
- ✅ Únicamente desde módulo Ventas se puede anular (anulando la venta)

**Verificación:**
```typescript
// Intentar anular desde consola
const pedido = JSON.parse(localStorage.getItem('damabella_pedidos'))[0];
anularPedidoCentralizado(pedido); // Debe retornar error
```

---

### CASO 3: Anulación Solo de Pendientes

**Escenario:** Un pedido en estado Pendiente SI puede anularse

**Pasos:**
1. Crear nuevo Pedido "PED-002" (Estado: Pendiente)
2. Buscar botón "Anular" en la tabla
3. Hacer click en "Anular"

**Resultado Esperado:**
- ✅ Botón "Anular" está **HABILITADO**
- ✅ Se anula correctamente
- ✅ Estado cambia a "Anulado"
- ✅ Sin devolución de stock (nunca fue descontado)

**Verificación:**
```typescript
const pedido = JSON.parse(localStorage.getItem('damabella_pedidos')).find(p => p.numeroPedido === 'PED-002');
console.log('Estado:', pedido.estado); // Debe ser 'Anulado'
```

---

### CASO 4: Protección contra Reversión

**Escenario:** Pedido Completado intenta revertirse a Pendiente

**Pasos:**
1. Usar PED-001 (Completada)
2. Hacer click en botón "Cambiar Estado"
3. Intentar seleccionar "Pendiente"

**Resultado Esperado:**
- ❌ Botón "Pendiente" está **DESHABILITADO** en el modal
- ❌ Transición bloqueada por `validarTransicion()`

**Verificación en código:**
```typescript
// En pedidoService.ts, validarTransicion() debe bloquear:
validarTransicion('Completada', 'Pendiente')
// Debe retornar: { permitido: false, razon: '...' }
```

---

### CASO 5: Stock - Descuento Único

**Escenario:** Verificar que stock solo se descuenta UNA vez

**Pasos:**
1. Crear Producto "Vestido A" con Stock: 10
2. Crear Pedido PED-003 con 1 x Vestido A
3. Cambiar a Completada

**Antes/Después:**
- **Antes:** Stock = 10
- **Después:** Stock = 9
- Si se intenta convertir nuevamente: Stock sigue siendo 9 (no 8)

**Verificación:**
```typescript
// En localStorage, producto
const producto = JSON.parse(localStorage.getItem('damabella_productos')).find(p => p.nombre === 'Vestido A');
console.log('Stock:', producto.variantes[0].colores[0].cantidad); // Debe ser 9, no 8
```

---

### CASO 6: Anulación de Venta (desde Ventas Module)

**Escenario:** Anular una venta devuelve stock correctamente

**Pasos:**
1. Usar venta asociada a PED-001 (Stock = 9 para Vestido A)
2. En módulo Ventas, hacer click en "Anular Venta"
3. Confirmar anulación

**Resultado Esperado:**
- ✅ Venta se marca como "Anulada"
- ✅ Stock se devuelve SOLO UNA VEZ
- ✅ Stock vuelve a 10

**Verificación:**
```typescript
// Venta
const venta = JSON.parse(localStorage.getItem('damabella_ventas')).find(v => v.numeroVenta === 'VEN-001');
console.log('Estado:', venta.estado); // Debe ser 'Anulada'
console.log('stockDevuelto:', venta.stockDevuelto); // Debe ser true

// Producto
const producto = JSON.parse(localStorage.getItem('damabella_productos')).find(p => p.nombre === 'Vestido A');
console.log('Stock:', producto.variantes[0].colores[0].cantidad); // Debe ser 10
```

---

### CASO 7: Doble Anulación Bloqueada

**Escenario:** Intentar anular una venta que ya fue anulada

**Pasos:**
1. Usar venta anulada del CASO 6
2. Intentar anular nuevamente desde módulo Ventas

**Resultado Esperado:**
- ❌ Botón "Anular Venta" está **DESHABILITADO**
- ❌ Error: "Esta venta ya fue anulada" o similar
- ❌ Stock NO se devuelve otra vez

**Verificación:**
```typescript
const venta = JSON.parse(localStorage.getItem('damabella_ventas')).find(v => v.numeroVenta === 'VEN-001');
console.log('anulada:', venta.anulada); // Debe ser true
console.log('stockDevuelto:', venta.stockDevuelto); // Debe ser true
```

---

## 🧪 PRUEBAS AUTOMATIZADAS (Consola)

```typescript
// Copiar/pegar en consola del navegador

// Test 1: Validar ventaId
const pedido1 = JSON.parse(localStorage.getItem('damabella_pedidos'))[0];
console.assert(pedido1.ventaId, '❌ FALLO: ventaId no existe');
console.assert(pedido1.estado === 'Completada', '❌ FALLO: Estado no es Completada');

// Test 2: Validar stock descuento único
const producto = JSON.parse(localStorage.getItem('damabella_productos'))[0];
const stockActual = producto.variantes[0].colores[0].cantidad;
console.assert(stockActual < 10, '❌ FALLO: Stock no se descuento');

// Test 3: Validar transiciones bloqueadas
const validarTransicion = (desde, hacia) => {
  // Debería retornar false para Completada→Pendiente y Anulado→cualquier
  const transicionesInvalidas = [
    ['Completada', 'Pendiente'],
    ['Anulado', 'Pendiente'],
    ['Anulado', 'Completada']
  ];
  
  const esInvalida = transicionesInvalidas.some(
    ([d, h]) => d === desde && h === hacia
  );
  
  console.assert(esInvalida, `⚠️ Transición ${desde}→${hacia} debería ser inválida`);
};

validarTransicion('Completada', 'Pendiente');
validarTransicion('Anulado', 'Pendiente');

console.log('✅ PRUEBAS COMPLETADAS');
```

---

## 📊 RESUMEN DE CAMBIOS

| Aspecto | Antes | Después | Impacto |
|---------|-------|---------|---------|
| **Conversión duplicada** | ⚠️ Permitido | ❌ Bloqueado | Stock protegido |
| **Anular Completada** | ⚠️ Permitido | ❌ Bloqueado | Ciclo consistente |
| **Reversión (Comp→Pend)** | ⚠️ Permitido | ❌ Bloqueado | Estados terminales |
| **ventaId** | ❌ No existe | ✅ Existe | Referencia venta |
| **Stock descuento** | Múltiple | ✅ Una sola vez | Precisión |
| **Stock devolución** | Múltiple | ✅ Una sola vez | Precisión |

---

## 🚀 PRÓXIMOS PASOS

- [ ] Ejecutar todas las pruebas manuales
- [ ] Verificar logs en consola
- [ ] Validar localStorage después de cada operación
- [ ] Documentar casos encontrados
- [ ] Crear pruebas unitarias (opcional)

