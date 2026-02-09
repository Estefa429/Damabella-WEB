# 📋 Plan de Pruebas - Nuevo Flujo de Sincronización Compras-Productos

## 🎯 Objetivo
Verificar que el nuevo flujo permite:
1. ✅ Crear compras con productos que NO existen previamente
2. ✅ Los colores se definen en la compra, no en Productos
3. ✅ Los productos se crean con categoría correcta (no "Sin categoría")
4. ✅ La edición de productos preserva todos los campos

---

## 📊 Cambios Implementados

### ComprasManager.tsx
- ✅ Selector de producto ahora es **OPTIONAL** - permite escribir el nombre
- ✅ Talla y Color se seleccionan **SOLO para la compra** - no dependen de Productos
- ✅ Validación actualizada: requiere nombre + color + cantidad + precios + categoría
- ✅ Eliminados productos temporales con colores "fantasma"

### agregarOActualizarProducto()
- ✅ Crea productos nuevos que NO existen en Productos
- ✅ Respeta la categoría proporcionada (no cambia a "Sin categoría")
- ✅ Genera SKU automáticamente si no viene referencia

### ProductosManager.tsx
- ✅ Merge inteligente al editar: preserva referencia, precioCompra, createdFromSKU
- ✅ Los productos creados desde Compras mantienen todos sus campos

---

## 🧪 Test 1: Crear Compra con Producto Nuevo

### Paso 1: Abrir Compras
1. Ve a la sección **Compras**
2. Haz clic en **Nueva Compra**

### Paso 2: Completar Datos de Compra
- **Proveedor**: Selecciona uno existente (ej: "Proveedor A")
- **Fecha**: Hoy
- **IVA**: 19

### Paso 3: Agregar Producto NUEVO (que no existe)
Completa estos campos:

```
📝 Nombre del Producto: "Camisa Casual Azul"  (⭐ ESTE NO EXISTE)
📐 Talla: "M"
🎨 Color: "Azul"
🔢 Cantidad: 10
💰 Precio Compra: 25000
💰 Precio Venta: 45000
📁 Categoría: "Vestidos Cortos" (selecciona del dropdown)
🖼️ Imagen: (opcional)
```

### Paso 4: Verificar en Consola (DevTools)
Abre **F12 → Console** y busca:

```
🆕 [agregarOActualizarProducto] Creando nuevo producto: Camisa Casual Azul
   Categoría capturada: "Vestidos Cortos"
   SKU: SKU_[timestamp]_[código]
```

### Paso 5: Guardar Compra
- Haz clic en **Guardar Compra**
- Deberías ver: ✅ "Compra guardada correctamente | 🆕 1 nuevo(s) en Productos"

### Paso 6: Verificar en Productos
1. Ve a **Productos**
2. Busca "Camisa Casual Azul"
3. **Debería aparecer con**:
   - ✅ Nombre: "Camisa Casual Azul"
   - ✅ Categoría: "Vestidos Cortos" (NO "Sin categoría")
   - ✅ Talla M con color Azul
   - ✅ Precio Venta: 45000

---

## 🧪 Test 2: Actualizar Producto Existente (Merge)

### Paso 1: Crear Segunda Compra del Mismo Producto
1. Nueva Compra
2. Mismo proveedor
3. Agregar el mismo "Camisa Casual Azul"

```
📝 Nombre: "Camisa Casual Azul"
📐 Talla: "L"  ← DIFERENTE talla
🎨 Color: "Rojo"  ← DIFERENTE color
🔢 Cantidad: 5
💰 Precio Compra: 25000
💰 Precio Venta: 45000  ← MISMO precio
📁 Categoría: "Vestidos Cortos"
```

### Paso 2: Guardar
- Deberías ver: ✅ "Compra guardada correctamente | 📦 1 actualizado(s) en Productos"

### Paso 3: Verificar en Productos
1. Abre "Camisa Casual Azul"
2. **Debería tener**:
   - ✅ Talla M con 10 unidades en Azul (de la compra anterior)
   - ✅ Talla L con 5 unidades en Rojo (nueva compra)
   - ✅ Categoría sigue siendo "Vestidos Cortos" (preservada)
   - ✅ Precios sin cambios (mantenidos del anterior)

---

## 🧪 Test 3: Editar Producto (Preserve Data)

### Paso 1: Abrir Producto para Editar
1. Ve a **Productos**
2. Busca "Camisa Casual Azul"
3. Haz clic en editar (lápiz)

### Paso 2: Cambiar SOLO el nombre
- **Nombre**: "Camisa Casual Azul XL"
- Mantén igual todo lo demás

### Paso 3: Guardar
- Haz clic en **Guardar**

### Paso 4: Verificar Consola
Busca:
```
📝 [ProductosManager] Actualizando producto:
   camposMantenidos: ['referencia', 'precioCompra', 'createdFromSKU']
   referencia: SKU_[timestamp]_[código]
```

### Paso 5: Verificar que se preservó
Reabre el producto:
- ✅ **Nombre**: "Camisa Casual Azul XL" (cambió)
- ✅ **Categoría**: "Vestidos Cortos" (preservada)
- ✅ **Tallas/Colores**: M-Azul (10) + L-Rojo (5) (preservados)
- ✅ **Precios**: Sin cambios (preservados)
- ✅ **Referencia**: Sigue siendo el SKU original (preservada)

---

## 🧪 Test 4: Verificar NO Hay Colores Fantasma

### Paso 1: Crear Nueva Compra con Color Personalizado
1. Nueva Compra
2. Nuevo Producto: "Falda Larga"
3. **Color**: Escribe "Morado Oscuro" (NO selecciones de lista)

```
📝 Nombre: "Falda Larga"
📐 Talla: "XS"
🎨 Color: "Morado Oscuro"  ← Color PERSONALIZADO
🔢 Cantidad: 3
💰 Precio Compra: 35000
💰 Precio Venta: 60000
📁 Categoría: "Vestidos Largos"
```

### Paso 2: Guardar

### Paso 3: Verificar en Productos
1. Abre "Falda Larga"
2. **Debería tener**:
   - ✅ Talla XS con 1 color: "Morado Oscuro"
   - ✅ NO debería tener "Rojo", "Negro", "Blanco" (sin fantasmas)
   - ✅ Categoría "Vestidos Largos"

---

## ✅ Checklist de Éxito

### Compras
- [ ] Puedo crear compra con producto que NO existe
- [ ] No aparece error "producto no existe"
- [ ] El selector permite escribir nombre libre
- [ ] Colores y tallas se seleccionan sin depender de Productos
- [ ] Se puede usar color personalizado (ej: "Morado Oscuro")

### Productos
- [ ] El producto nuevo aparece inmediatamente
- [ ] Tiene categoría correcta (no "Sin categoría")
- [ ] Solo tiene los colores/tallas que agregué
- [ ] Editar preserva categoría, precios e imagen
- [ ] NO hay colores "fantasma" de temporales

### Sincronización
- [ ] Mensajes en consola son claros y útiles
- [ ] El SKU se genera automáticamente si no viene
- [ ] Múltiples compras del mismo producto suman cantidades
- [ ] Los precios se actualizan inteligentemente (no sobrescriben)

---

## 🐛 Si Algo Falla

### Problema: "Producto no existe" error
- **Causa**: El sistema aún requiere producto existente
- **Solución**: Verifica que el código de ComprasManager está actualizado

### Problema: Aparecen colores fantasma (Rojo, Negro, etc.)
- **Causa**: Hay productos temporales con colores quemados
- **Solución**: Limpia localStorage y recrea productos desde Compras

### Problema: Categoría se pierde al editar
- **Causa**: El merge no está funcionando
- **Solución**: Verifica ProductosManager handleSave() tiene merge correcto

### Problema: Precios se sobrescriben con 0
- **Causa**: No hay validación en agregarOActualizarProducto
- **Solución**: Verifica condición `precioCompra && precioCompra > 0`

---

## 📱 Cómo Limpiar y Empezar desde Cero

Si quieres limpiar todo y empezar:

```javascript
// En DevTools Console:
localStorage.clear();
location.reload();
```

Luego crea compras nuevas y verifica el flujo.

---

## 📝 Notas Técnicas

- **ComprasManager**: Es la FUENTE de inventario
- **agregarOActualizarProducto**: Busca por SKU, actualiza o crea
- **ProductosManager**: Muestra y edita, usa merge para preservar datos
- **Color/Talla**: Se definen en Compras, no en Productos
- **Categoría**: Viene de Compras, se preserva en Productos

