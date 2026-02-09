# 📊 Comparativa: Antes vs Después - Validación de Stock en Pedidos

---

## Tabla Resumen

| Aspecto | ANTES ❌ | DESPUÉS ✅ |
|---------|----------|-----------|
| **Stock Visible** | No mostraba stock | ✅ Muestra stock disponible |
| **Validación Stock** | No validaba | ✅ Valida antes de agregar |
| **Límite Cantidad** | Sin límite | ✅ Limitado al stock máximo |
| **Error Insuficiente** | Se agregaba igual | ✅ Se rechaza con error claro |
| **Input Deshabilitado** | Siempre habilitado | ✅ Se deshabilita si sin stock |
| **Flujo Completo** | Inconsistente | ✅ Guard clauses completas |
| **Mensajes Erro** | Mínimos | ✅ Descriptivos y claros |

---

## 1. VISUALIZACIÓN DE STOCK

### ANTES (❌ Sin información)
```jsx
{nuevoItem.productoId && (
  <>
    {/* Selecciona talla y color */}
    <select value={nuevoItem.talla} onChange={...}>
      {/* opciones */}
    </select>
    
    <select value={nuevoItem.color} onChange={...}>
      {/* opciones */}
    </select>

    {/* AQUÍ NO MUESTRA NADA SOBRE STOCK */}

    <input type="number" value={nuevoItem.cantidad} />
  </>
)}
```

**Problema:** El usuario no sabe cuánto stock hay disponible.

---

### DESPUÉS (✅ Con información clara)
```jsx
{nuevoItem.productoId && (
  <>
    <select value={nuevoItem.talla} onChange={...}>
      {/* opciones */}
    </select>
    
    <select value={nuevoItem.color} onChange={...}>
      {/* opciones */}
    </select>

    {/* ✅ NUEVO: Mostrar stock disponible */}
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
            <strong>❌ Sin stock:</strong> No hay disponibilidad
          </div>
        )}
      </div>
    )}

    <input 
      type="number" 
      value={nuevoItem.cantidad}
      max={stockDisponible || undefined}  // ✅ NUEVO
      disabled={!nuevoItem.color || stockDisponible === 0}  // ✅ NUEVO
    />
  </>
)}
```

**Mejora:** El usuario ve exactamente cuánto stock hay y el input está limitado.

---

## 2. FUNCIÓN handleNuevoItemChange()

### ANTES (❌ Sin cálculo de stock)
```tsx
const handleNuevoItemChange = (field: string, value: any) => {
  setNuevoItem((prev: any) => {
    if (field === 'productoId') {
      // Solo limpia, no calcula stock
      return { ...prev, productoId: value, talla: '', color: '', cantidad: '1' };
    }
    if (field === 'talla') {
      // Solo limpia, no calcula stock
      return { ...prev, talla: value, color: '' };
    }
    // El resto simplemente copia el valor
    return { ...prev, [field]: value };
  });

  // Validaciones básicas
  // ... pero SIN CALCULAR STOCK
};
```

**Problema:** Cuando selecciona color, no busca el stock disponible.

---

### DESPUÉS (✅ Calcula stock automáticamente)
```tsx
const handleNuevoItemChange = (field: string, value: any) => {
  setNuevoItem((prev: any) => {
    let newItem = prev;
    
    if (field === 'productoId') {
      newItem = { ...prev, productoId: value, talla: '', color: '', cantidad: '1' };
      setStockDisponible(null);  // ✅ NUEVO: Resetea stock
    } else if (field === 'talla') {
      newItem = { ...prev, talla: value, color: '' };
      setStockDisponible(null);  // ✅ NUEVO: Resetea stock
    } else if (field === 'color') {
      newItem = { ...prev, color: value };
      
      // ✅ NUEVO: Busca y calcula el stock disponible
      const producto = productos.find((p: any) => p.id.toString() === prev.productoId);
      if (producto && producto.variantes) {
        const varianteTalla = producto.variantes.find((v: any) => v.talla === prev.talla);
        if (varianteTalla) {
          const colorItem = varianteTalla.colores?.find((c: any) => c.color === value);
          if (colorItem) {
            setStockDisponible(colorItem.cantidad);  // ✅ Stock encontrado
          } else {
            setStockDisponible(0);  // Sin ese color
          }
        } else {
          setStockDisponible(0);  // Sin esa talla
        }
      }
    } else {
      newItem = { ...prev, [field]: value };
    }
    
    return newItem;
  });

  // ... validaciones ...
};
```

**Mejora:** Cuando selecciona color, automáticamente busca y calcula el stock.

---

## 3. FUNCIÓN agregarItem()

### ANTES (❌ Sin validación de stock)
```tsx
const agregarItem = () => {
  const newErrors: any = {};
  
  // Validaciones básicas
  if (!nuevoItem.productoId) newErrors['nuevoItem_productoId'] = 'Selecciona un producto';
  if (!nuevoItem.talla) newErrors['nuevoItem_talla'] = 'Selecciona una talla';
  if (!nuevoItem.color) newErrors['nuevoItem_color'] = 'Selecciona un color';
  const cantidadNum = parseInt(nuevoItem.cantidad as any);
  if (isNaN(cantidadNum) || cantidadNum < 1) newErrors['nuevoItem_cantidad'] = 'Cantidad inválida';

  if (Object.keys(newErrors).length > 0) {
    setFormErrors((prev: any) => ({ ...prev, ...newErrors }));
    setNotificationMessage('Completa todos los campos');
    setNotificationType('error');
    setShowNotificationModal(true);
    return;
  }

  const producto = productos.find((p: any) => p.id.toString() === nuevoItem.productoId);
  if (!producto) return;

  const cantidad = parseInt(nuevoItem.cantidad);
  const precioUnitario = producto.precioVenta;
  const subtotal = cantidad * precioUnitario;

  // ❌ CREA EL ITEM SIN VALIDAR STOCK
  const item: ItemPedido = {
    id: Date.now().toString(),
    productoId: nuevoItem.productoId,
    productoNombre: producto.nombre,
    talla: nuevoItem.talla,
    color: nuevoItem.color,
    cantidad,  // ❌ PODRÍA SER 1000 CON SOLO 50 EN STOCK
    precioUnitario,
    subtotal
  };

  // El item se agrega aunque no haya stock
  setFormData({
    ...formData,
    items: [...formData.items, item]
  });
};
```

**Problemas:**
- ❌ No verifica si el producto tiene variantes
- ❌ No busca la talla en las variantes
- ❌ No busca el color en la talla
- ❌ **No valida stock**
- ❌ Crea el item así tenga 0 stock

---

### DESPUÉS (✅ Con 3 guard clauses)
```tsx
const agregarItem = () => {
  const newErrors: any = {};
  
  // 1️⃣ Validaciones básicas (igual que antes)
  if (!nuevoItem.productoId) newErrors['nuevoItem_productoId'] = 'Selecciona un producto';
  if (!nuevoItem.talla) newErrors['nuevoItem_talla'] = 'Selecciona una talla';
  if (!nuevoItem.color) newErrors['nuevoItem_color'] = 'Selecciona un color';
  const cantidadNum = parseInt(nuevoItem.cantidad as any);
  if (isNaN(cantidadNum) || cantidadNum < 1) newErrors['nuevoItem_cantidad'] = 'Cantidad inválida';

  if (Object.keys(newErrors).length > 0) {
    setFormErrors((prev: any) => ({ ...prev, ...newErrors }));
    setNotificationMessage('Completa todos los campos');
    setNotificationType('error');
    setShowNotificationModal(true);
    return;
  }

  const producto = productos.find((p: any) => p.id.toString() === nuevoItem.productoId);
  if (!producto) return;

  const cantidad = parseInt(nuevoItem.cantidad);

  // 2️⃣ ✅ NUEVA VALIDACIÓN: Verificar que el producto tiene variantes
  if (producto.variantes && producto.variantes.length > 0) {
    
    // 3️⃣ ✅ GUARD CLAUSE 1: Buscar variante por talla
    const varianteTalla = producto.variantes.find((v: any) => v.talla === nuevoItem.talla);
    if (!varianteTalla) {
      setNotificationMessage(`❌ Talla ${nuevoItem.talla} no tiene stock definido. Debe crearse desde Compras.`);
      setNotificationType('error');
      setShowNotificationModal(true);
      return;  // ❌ ABORTA AQUÍ
    }

    // 4️⃣ ✅ GUARD CLAUSE 2: Buscar color en la talla
    const colorItem = varianteTalla.colores?.find((c: any) => c.color === nuevoItem.color);
    if (!colorItem) {
      setNotificationMessage(`❌ Color ${nuevoItem.color} no tiene stock definido. Debe crearse desde Compras.`);
      setNotificationType('error');
      setShowNotificationModal(true);
      return;  // ❌ ABORTA AQUÍ
    }

    // 5️⃣ ✅ GUARD CLAUSE 3: VALIDAR STOCK (LA MÁS IMPORTANTE)
    if (colorItem.cantidad < cantidad) {
      setNotificationMessage(
        `❌ Stock insuficiente para ${producto.nombre} (${nuevoItem.talla}, ${nuevoItem.color}).\n` +
        `Disponible: ${colorItem.cantidad} unidades\n` +
        `Solicitado: ${cantidad} unidades`
      );
      setNotificationType('error');
      setShowNotificationModal(true);
      return;  // ❌ ABORTA AQUÍ - NO CREA EL ITEM
    }

    console.log(`✅ [PedidosManager] Stock validado: ${producto.nombre} - ${nuevoItem.talla} - ${nuevoItem.color}: ${colorItem.cantidad} disponible`);
  } else {
    // ❌ Producto sin variantes = error
    setNotificationMessage(`❌ El producto ${producto.nombre} no tiene variantes definidas. Debe crearse desde Compras.`);
    setNotificationType('error');
    setShowNotificationModal(true);
    return;  // ❌ ABORTA AQUÍ
  }

  // 6️⃣ ✅ Si llegamos aquí, TODO es válido. Crear el item.
  const precioUnitario = producto.precioVenta;
  const subtotal = cantidad * precioUnitario;

  const item: ItemPedido = {
    id: Date.now().toString(),
    productoId: nuevoItem.productoId,
    productoNombre: producto.nombre,
    talla: nuevoItem.talla,
    color: nuevoItem.color,
    cantidad,  // ✅ AHORA SABEMOS QUE HAY SUFICIENTE STOCK
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
  setStockDisponible(null);  // ✅ Resetear stock
};
```

**Mejoras:**
- ✅ Guard Clause 1: Valida que la talla existe en variantes
- ✅ Guard Clause 2: Valida que el color existe en la talla
- ✅ Guard Clause 3: **Valida que hay suficiente stock**
- ✅ Mensajes descriptivos para cada error
- ✅ Solo crea el item si TODO valida
- ✅ Console.log para debugging

---

## 4. EJEMPLOS DE USO

### Escenario A: Producto Disponible
```
Usuario: Selecciona "Vestido M, Rojo"
Sistema: Busca en productos → variantes → M → colores → Rojo
Resultado: cantidad = 50

UI Muestra:
  ✅ Stock disponible: 50 unidades
  
Input de cantidad:
  - max="50"
  - enabled
  
Usuario: Ingresa 30
Sistema: 30 <= 50 ✅
Resultado: ✅ Item agregado
```

### Escenario B: Stock Insuficiente
```
Usuario: Selecciona "Vestido M, Azul"
Sistema: Busca en productos → variantes → M → colores → Azul
Resultado: cantidad = 10

UI Muestra:
  ✅ Stock disponible: 10 unidades
  
Input de cantidad:
  - max="10"
  - enabled
  
Usuario: Intenta ingresar 25
Sistema: 25 > 10 ❌
Resultado: ❌ Se rechaza, muestra error
```

### Escenario C: Sin Stock
```
Usuario: Selecciona "Vestido M, Verde"
Sistema: Busca en productos → variantes → M → colores → Verde
Resultado: cantidad = 0

UI Muestra:
  ❌ Sin stock: No hay disponibilidad
  
Input de cantidad:
  - disabled
  - Usuario no puede ingresar nada
  
Resultado: ❌ No permite agregar
```

---

## 5. RESUMEN DE CAMBIOS TÉCNICOS

| Cambio | Línea | Tipo | Impacto |
|--------|-------|------|---------|
| Agregar `stockDisponible` state | ~194 | Estado | Rastrear stock en tiempo real |
| Calcular stock en `handleNuevoItemChange()` | ~211-243 | Lógica | Buscar automáticamente stock al seleccionar |
| Agregar guard clauses en `agregarItem()` | ~405-472 | Validación | 🔒 Bloquear si no hay stock |
| Mostrar stock en UI | ~1271-1325 | Componente | Informar al usuario |
| Limitar input de cantidad | ~1320 | Validación | Imposibilitar seleccionar más que stock |

---

## 6. MATRIZ DE COMPATIBILIDAD

Pedidos ahora funciona igual a Ventas en cuanto a **validación de stock**:

| Módulo | Valida Stock | Descuenta Stock | Crea Stock |
|--------|:---:|:---:|:---:|
| **Compras** | ❌ | ❌ | ✅ |
| **Ventas** | ✅ | ✅ | ❌ |
| **Pedidos (ANTES)** | ❌ | ❌ | ❌ |
| **Pedidos (DESPUÉS)** | ✅ | ❌ | ❌ |

✅ Pedidos ahora tiene la validación que faltaba.

---

## 7. TESTING EFECTUADO

```
✅ npm run build
   - 0 errores de TypeScript
   - Build exitoso
   - Assets generados correctamente

✅ Validación manual:
   - Stock se muestra correctamente
   - Input se deshabilita si sin stock
   - Error se muestra si insuficiente
   - Guard clauses previenen overselling
```

---

## Conclusión

**Antes:** Pedidos permitía overselling.
**Después:** Pedidos valida stock como Ventas.

✅ **Implementación exitosa y compilada.**
