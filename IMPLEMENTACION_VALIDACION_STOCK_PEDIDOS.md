# 🔒 Implementación: Validación de Stock en Pedidos

**Fecha:** 2024
**Módulo:** PedidosManager.tsx
**Estado:** ✅ COMPLETADO Y COMPILADO

---

## Resumen Ejecutivo

Se implementó **validación de stock** en el módulo **Pedidos** para evitar que los usuarios creen órdenes con cantidades que excedan el inventario disponible.

Esta validación:
- ✅ **Bloquea** la creación de items si no hay stock suficiente
- ✅ **Muestra** el stock disponible antes de agregar el producto
- ✅ **Impide** seleccionar cantidades mayores al stock disponible
- ✅ **Desactiva** el input si no hay stock
- ✅ **Usa** la misma estructura de variantes que Compras y Ventas

---

## Problema Identificado

### Situación Anterior
El módulo **PedidosManager** permitía crear órdenes con cantidades que **superaban** el inventario disponible:

```tsx
// ❌ ANTES: Función agregarItem() sin validación de stock
const agregarItem = () => {
  // ...validaciones básicas...
  const cantidad = parseInt(nuevoItem.cantidad);
  
  // 🔴 NO VERIFICA STOCK
  const item: ItemPedido = {
    id: Date.now().toString(),
    productoNombre: producto.nombre,
    talla: nuevoItem.talla,
    color: nuevoItem.color,
    cantidad, // ❌ Podría ser 1000 si solo hay 10 en stock
    precioUnitario,
    subtotal
  };
  
  setFormData({ ...formData, items: [...formData.items, item] });
};
```

**Consecuencia:** Un usuario podría pedir 1000 unidades de un producto con solo 50 en stock.

---

## Solución Implementada

### 1. **Agregar Estado para Stock Disponible**

```tsx
// Nuevo estado para rastrear el stock disponible
const [stockDisponible, setStockDisponible] = useState<number | null>(null);
```

**Propósito:** Mantener la cantidad disponible del producto seleccionado en memoria.

---

### 2. **Calcular Stock al Seleccionar Color**

Se modificó `handleNuevoItemChange()` para calcular automáticamente el stock cuando selecciona:

```tsx
const handleNuevoItemChange = (field: string, value: any) => {
  setNuevoItem((prev: any) => {
    let newItem = prev;
    
    if (field === 'color') {
      newItem = { ...prev, color: value };
      
      // 🔒 Buscar el stock disponible para este color
      const producto = productos.find((p: any) => p.id.toString() === prev.productoId);
      if (producto && producto.variantes) {
        const varianteTalla = producto.variantes.find((v: any) => v.talla === prev.talla);
        if (varianteTalla) {
          const colorItem = varianteTalla.colores?.find((c: any) => c.color === value);
          if (colorItem) {
            setStockDisponible(colorItem.cantidad); // ✅ Stock encontrado
          } else {
            setStockDisponible(0); // Sin ese color
          }
        } else {
          setStockDisponible(0); // Sin esa talla
        }
      }
    }
    // ... resto de lógica...
    return newItem;
  });
  // ... validaciones...
};
```

**Estructura de Datos:**
```
Producto
  → variantes
    → talla
      → colores
        → color
        → cantidad ✅ (Este es el stock)
```

---

### 3. **Agregar Guard Clauses en agregarItem()**

La función `agregarItem()` ahora valida el stock **antes** de crear el item:

```tsx
const agregarItem = () => {
  // 1️⃣ Validaciones básicas (igual que antes)
  const newErrors: any = {};
  if (!nuevoItem.productoId) newErrors['nuevoItem_productoId'] = 'Selecciona un producto';
  if (!nuevoItem.talla) newErrors['nuevoItem_talla'] = 'Selecciona una talla';
  if (!nuevoItem.color) newErrors['nuevoItem_color'] = 'Selecciona un color';
  const cantidadNum = parseInt(nuevoItem.cantidad as any);
  if (isNaN(cantidadNum) || cantidadNum < 1) newErrors['nuevoItem_cantidad'] = 'Cantidad inválida';

  if (Object.keys(newErrors).length > 0) {
    setFormErrors((prev: any) => ({ ...prev, ...newErrors }));
    setNotificationMessage('Completa todos los campos del producto');
    setNotificationType('error');
    setShowNotificationModal(true);
    return;
  }

  const producto = productos.find((p: any) => p.id.toString() === nuevoItem.productoId);
  if (!producto) return;

  const cantidad = parseInt(nuevoItem.cantidad);

  // 2️⃣ 🔒 VALIDACIÓN: Verificar que el producto tiene variantes
  if (producto.variantes && producto.variantes.length > 0) {
    
    // 3️⃣ Guard Clause 1: Buscar variante por talla
    const varianteTalla = producto.variantes.find((v: any) => v.talla === nuevoItem.talla);
    if (!varianteTalla) {
      setNotificationMessage(`❌ Talla ${nuevoItem.talla} no tiene stock definido. Debe crearse desde Compras.`);
      setNotificationType('error');
      setShowNotificationModal(true);
      return; // ABORTA
    }

    // 4️⃣ Guard Clause 2: Buscar color en la talla
    const colorItem = varianteTalla.colores?.find((c: any) => c.color === nuevoItem.color);
    if (!colorItem) {
      setNotificationMessage(`❌ Color ${nuevoItem.color} no tiene stock definido. Debe crearse desde Compras.`);
      setNotificationType('error');
      setShowNotificationModal(true);
      return; // ABORTA
    }

    // 5️⃣ Guard Clause 3: VALIDACIÓN DE STOCK (La más importante)
    if (colorItem.cantidad < cantidad) {
      setNotificationMessage(
        `❌ Stock insuficiente para ${producto.nombre} (${nuevoItem.talla}, ${nuevoItem.color}).\n` +
        `Disponible: ${colorItem.cantidad} unidades\n` +
        `Solicitado: ${cantidad} unidades`
      );
      setNotificationType('error');
      setShowNotificationModal(true);
      return; // ABORTA - NO CREA EL ITEM
    }

    console.log(`✅ [PedidosManager] Stock validado: ${producto.nombre} - ${nuevoItem.talla} - ${nuevoItem.color}: ${colorItem.cantidad} disponible`);
  } else {
    // Producto sin variantes = error
    setNotificationMessage(`❌ El producto ${producto.nombre} no tiene variantes definidas. Debe crearse desde Compras.`);
    setNotificationType('error');
    setShowNotificationModal(true);
    return; // ABORTA
  }

  // 6️⃣ Si llegamos aquí, el stock es válido. Crear el item.
  const precioUnitario = producto.precioVenta;
  const subtotal = cantidad * precioUnitario;

  const item: ItemPedido = {
    id: Date.now().toString(),
    productoId: nuevoItem.productoId,
    productoNombre: producto.nombre,
    talla: nuevoItem.talla,
    color: nuevoItem.color,
    cantidad,
    precioUnitario,
    subtotal
  };

  setFormData({
    ...formData,
    items: [...formData.items, item]
  });
  
  // Limpiar formulario
  setNuevoItem({
    productoId: '',
    talla: '',
    color: '',
    cantidad: '1',
    precioUnitario: ''
  });

  setProductoQuery('');
  setShowProductoDropdown(false);
  setStockDisponible(null); // Resetear
};
```

---

### 4. **Mostrar Stock Disponible en UI**

Se agregó un mensaje informativo que muestra el stock disponible:

```tsx
{/* 🔒 Mostrar stock disponible */}
{nuevoItem.color && stockDisponible !== null && (
  <div className={`rounded-lg p-3 text-sm ${
    stockDisponible > 0
      ? 'bg-blue-50 border border-blue-200 text-blue-800'
      : 'bg-red-50 border border-red-200 text-red-800'
  }`}>
    {stockDisponible > 0 ? (
      <div>
        <strong>✅ Stock disponible:</strong> {stockDisponible} unidades
      </div>
    ) : (
      <div>
        <strong>❌ Sin stock:</strong> No hay disponibilidad para este producto
      </div>
    )}
  </div>
)}
```

---

### 5. **Limitar Input de Cantidad**

El input de cantidad ahora:
- ✅ **Limita el máximo** al stock disponible (`max={stockDisponible}`)
- ✅ **Se desactiva** si no hay stock seleccionado (`disabled={!nuevoItem.color || stockDisponible === 0}`)

```tsx
<div>
  <label className="block text-gray-700 mb-2 text-sm">Cantidad</label>
  <Input
    type="number"
    min="1"
    max={stockDisponible || undefined}  // ✅ Limita al stock disponible
    value={nuevoItem.cantidad}
    onChange={(e) => handleNuevoItemChange('cantidad', e.target.value)}
    placeholder="1"
    disabled={!nuevoItem.color || stockDisponible === 0}  // ✅ Desactiva si no hay stock
  />
  {formErrors['nuevoItem_cantidad'] && (
    <p className="text-red-500 text-sm mt-1">{formErrors['nuevoItem_cantidad']}</p>
  )}
</div>
```

---

## Flujo de Validación Completo

### Cuando el usuario intenta agregar un producto:

```
1. Usuario selecciona Producto
   ↓
2. Usuario selecciona Talla
   ↓
3. Usuario selecciona Color
   ↓ SE CALCULA STOCK
   ┌─────────────────────────────┐
   │ Se muestra stock disponible  │
   │ ✅ Stock: 50 unidades       │
   └─────────────────────────────┘
   ↓
4. Usuario ingresa Cantidad (limitado a stock)
   ┌─────────────────────────────┐
   │ input max=50                │
   └─────────────────────────────┘
   ↓
5. Usuario hace click en "Agregar Producto"
   ↓
6. Sistema ejecuta agregarItem()
   ├─ ✅ Valida que cantidad > 0
   ├─ ✅ Encuentra el producto
   ├─ ✅ Busca variante por talla
   │   └─ Si no existe → ❌ ABORTA (Error: Talla sin stock)
   ├─ ✅ Busca color en variante
   │   └─ Si no existe → ❌ ABORTA (Error: Color sin stock)
   ├─ ✅ VALIDA STOCK: colorItem.cantidad >= cantidad?
   │   ├─ SI → Continúa
   │   └─ NO → ❌ ABORTA (Error: Stock insuficiente)
   ├─ ✅ Crea ItemPedido
   ├─ ✅ Agrega a formData.items
   └─ ✅ Limpia el formulario
```

---

## Cambios Realizados

### Archivo: `src/features/ecommerce/orders/components/PedidosManager.tsx`

#### 1. **Línea ~194** - Agregar estado
```tsx
const [stockDisponible, setStockDisponible] = useState<number | null>(null);
```

#### 2. **Línea ~211-243** - Actualizar handleNuevoItemChange()
- Calcular stock cuando se selecciona color
- Limpiar stock cuando se cambia talla/producto
- Mantener lógica de validación existente

#### 3. **Línea ~405-472** - Reescribir agregarItem()
- Agregar 3 guard clauses para validar:
  1. ✅ Variante de talla existe
  2. ✅ Color existe en talla
  3. ✅ Stock disponible >= cantidad solicitada
- Mostrar mensajes de error descriptivos
- Solo crear item si TODO valida

#### 4. **Línea ~1271-1325** - Actualizar JSX del formulario
- Agregar mensaje de stock disponible (azul/rojo)
- Limitar max del input a stockDisponible
- Desactivar input si stockDisponible es 0

---

## Mensajes de Error Implementados

### ✅ Stock Disponible
```
✅ Stock disponible: 50 unidades
```

### ❌ Sin Stock
```
❌ Sin stock: No hay disponibilidad para este producto
```

### ❌ Talla sin Stock
```
❌ Talla M no tiene stock definido. Debe crearse desde Compras.
```

### ❌ Color sin Stock
```
❌ Color Rojo no tiene stock definido. Debe crearse desde Compras.
```

### ❌ Stock Insuficiente (Principal)
```
❌ Stock insuficiente para Vestido Corto (M, Rojo).
Disponible: 10 unidades
Solicitado: 25 unidades
```

---

## Validación & Testing

### ✅ Compilación
```
✓ npm run build
✓ No hay errores de TypeScript
✓ Builds exitosamente con Vite
```

### ✅ Escenarios de Prueba

#### Caso 1: Producto con Stock
1. Seleccionar un producto (ej: Vestido M Rojo con 50 en stock)
2. Input muestra: "✅ Stock disponible: 50 unidades"
3. Input cantidad está habilitado con max=50
4. Ingresar 30 unidades → ✅ Se agrega correctamente

#### Caso 2: Stock Insuficiente
1. Seleccionar un producto (ej: Vestido M Rojo con 10 en stock)
2. Input muestra: "✅ Stock disponible: 10 unidades"
3. Intentar ingresar 25 unidades
4. Hacer click "Agregar Producto"
5. ❌ Aparece notificación: "Stock insuficiente. Disponible: 10, Solicitado: 25"
6. Item NO se agrega a la lista

#### Caso 3: Sin Stock
1. Seleccionar un producto (ej: Vestido M Rojo con 0 en stock)
2. Input muestra: "❌ Sin stock: No hay disponibilidad"
3. Input cantidad está DESHABILITADO
4. No se puede ingresar cantidad

#### Caso 4: Cambiar Talla/Color
1. Seleccionar Talla M, Color Rojo (10 en stock)
2. Input muestra: "✅ Stock disponible: 10"
3. Cambiar a Color Azul (50 en stock)
4. Input actualiza: "✅ Stock disponible: 50"

#### Caso 5: Producto sin Variantes
1. Seleccionar un producto inválido sin variantes
2. Intentar agregar
3. ❌ Mensaje: "El producto X no tiene variantes definidas. Debe crearse desde Compras."

---

## Diferencia con Compras y Ventas

### 🛒 Compras (ComprasManager)
- **Crea** stock automáticamente
- Recibe cantidad → crea producto con variantes

### 💰 Ventas (VentasManager)
- **Valida** stock ✅
- **Descuenta** stock automáticamente
- No permite vender más de lo disponible

### 📋 Pedidos (PedidosManager) - NUEVO
- **Valida** stock ✅ (como Ventas)
- **NO descuenta** stock
- **NO crea** stock (a diferencia de Compras)
- Solo crea una "promesa de venta" sin afectar inventario

---

## Console Logs para Debugging

```tsx
console.log(`✅ [PedidosManager] Stock validado: ${producto.nombre} - ${nuevoItem.talla} - ${nuevoItem.color}: ${colorItem.cantidad} disponible`);
```

Cuando un item pasa la validación, aparece en la consola del navegador.

---

## Conclusión

✅ **La validación de stock está completamente implementada en PedidosManager.**

El módulo ahora:
- ✅ Valida stock disponible
- ✅ Muestra información clara al usuario
- ✅ Previene overselling
- ✅ Funciona como esperado
- ✅ Se compila sin errores

**Estado:** 🎉 LISTO PARA PRODUCCIÓN
