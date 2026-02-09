# ✅ CHECKLIST: Pruebas de Sincronización de Categorías

## 📋 Preparación

- [ ] Abrir navegador en modo incógnito (limpiar localStorage si es necesario)
- [ ] Abrir DevTools (F12)
- [ ] Ir a Console para ver logs
- [ ] Ir a Application → Local Storage para ver datos

---

## 🧪 Test 1: Crear Producto NUEVO en Compras

**Objetivo:** Verificar que al crear un producto nuevo en Compras, se guarden categoryId + categoria

### Pasos:
1. [ ] Ir a **Compras** módulo
2. [ ] Click en **"Nueva Compra"**
3. [ ] Rellenar datos:
   - Proveedor: Elige uno existente
   - Producto: **ESCRIBE UN NOMBRE NUEVO** (ej: "Vestido Flores Amarillas")
   - Referencia: Auto-llena o escribe (ej: SKU123)
   - Categoría: **Selecciona "Sets"** de la lista
   - Talla: M
   - Color: Rosa
   - Cantidad: 5
   - Precio Compra: $50
   - Precio Venta: $120
4. [ ] Click **"Crear Producto"**
5. [ ] Click **"Agregar"** para agregar a la compra
6. [ ] Verifica que aparezca en tabla con "Sets" como categoría
7. [ ] Click **"Guardar Compra"**

### Verificaciones en Console:
- [ ] Ves log: `✅ Categoría del producto existente: cat-001 (Sets)` o similar
- [ ] Ves log: `✅ [agregarOActualizarProducto] Nuevo producto creado:`
- [ ] Log muestra: `Category ID: cat-001` (o ID de Sets)
- [ ] No hay errores rojo

### Verificaciones en localStorage:
1. [ ] Abre DevTools → Application → Local Storage → damabella_productos
2. [ ] Busca el producto "Vestido Flores Amarillas"
3. [ ] **Verifica que tenga AMBOS:**
   - [ ] `"categoryId": "cat-001"` (o ID de Sets)
   - [ ] `"categoria": "Sets"`
4. [ ] Si falta `categoria`, **FALLA el test**

---

## 🧪 Test 2: Producto ANTIGUO Sin Categoría

**Objetivo:** Verificar que ProductosManager migra automáticamente productos antiguos

### Setup (Crear producto antiguo):
1. [ ] Abre DevTools → Application → Local Storage
2. [ ] Click en **damabella_productos**
3. [ ] Busca o crea manualmente un producto con este formato:
```json
{
  "id": 999999,
  "nombre": "Producto Antiguo",
  "categoryId": "3",
  "categoria": "",
  "proveedor": "ManualTest",
  "precioVenta": 100,
  "activo": true,
  "variantes": [],
  "createdAt": "2024-01-01T00:00:00Z"
}
```
4. [ ] Guarda los cambios en localStorage

### Test:
1. [ ] Recarga la página (F5)
2. [ ] Abre Console
3. [ ] **Verifica:**
   - [ ] Ves log: `🔄 [ProductosManager-INIT] Migrando Producto Antiguo: categoryId="3" → categoria="Sets"`
   - [ ] Ves log: `💾 [ProductosManager-INIT] Guardando productos migrados...`

### Verificación en localStorage:
1. [ ] Abre DevTools → damabella_productos nuevamente
2. [ ] Busca "Producto Antiguo"
3. [ ] **Verifica:**
   - [ ] Ahora tiene `"categoria": "Sets"` ✅
   - [ ] Mantiene `"categoryId": "3"` ✅

### En Productos Manager:
1. [ ] Ir a **Productos** módulo
2. [ ] Buscar "Producto Antiguo"
3. [ ] **Verifica:**
   - [ ] Se muestra con categoría "Sets"
   - [ ] NO dice "Sin categoría"

---

## 🧪 Test 3: Sincronización en Tiempo Real

**Objetivo:** Verificar que ProductosManager sincroniza continuamente

### Pasos:
1. [ ] Abre DOS pestañas:
   - Pestaña 1: **Compras** (ComprasManager)
   - Pestaña 2: **Productos** (ProductosManager)
2. [ ] En Pestaña 1 (Compras):
   - [ ] Crear una nueva compra
   - [ ] Crear producto nuevo "Vestido Seda" en categoría "Vestidos Largos"
   - [ ] Guardar compra
3. [ ] **SIN RECARGAR** Pestaña 2, observar Console
4. [ ] Esperar máximo 2 segundos
5. [ ] **Verifica en Console de Pestaña 2:**
   - [ ] Ves log: `✅ [ProductosManager-SYNC] Resolviendo categoría: Vestido Seda = "Vestidos Largos"`
6. [ ] En Pestaña 2, busca "Vestido Seda"
7. [ ] **Verifica:**
   - [ ] Aparece el producto
   - [ ] Muestra categoría "Vestidos Largos"

---

## 🧪 Test 4: Selector de Categorías Consistente

**Objetivo:** Verificar que el selector funciona igual en Compras y Productos

### En ComprasManager:
1. [ ] Ir a **Compras**
2. [ ] Nueva Compra
3. [ ] En sección de Producto, hay dropdown "Categoría"
4. [ ] **Verifica:**
   - [ ] Muestra todas las categorías
   - [ ] Son las mismas de CATEGORIAS_KEY
   - [ ] Puede seleccionar

### En ProductosManager:
1. [ ] Ir a **Productos**
2. [ ] Editar un producto
3. [ ] En form de edición, hay dropdown "Categoría"
4. [ ] **Verifica:**
   - [ ] Muestra mismas categorías que en Compras
   - [ ] Categoría actual está pre-seleccionada
   - [ ] Puede cambiar

---

## 🧪 Test 5: Producto Existente Con Categoría

**Objetivo:** Verificar que productos existentes se mantienen correctamente

### Setup:
1. [ ] En Productos, hay un producto que ya tiene categoría (ej: de tests anteriores)
2. [ ] En localStorage damabella_productos, verifica que tiene `categoria` y `categoryId`

### Test:
1. [ ] En Compras, Nueva Compra
2. [ ] En selector de productos, **selecciona un producto existente**
3. [ ] **Verifica en Console:**
   - [ ] Ves log: `✅ Categoría del producto existente: [categoryId] ([nombre])`
4. [ ] El campo "Categoría" se llena automáticamente
5. [ ] Agrega a compra y guarda
6. [ ] Verifica en localStorage que NO se perdió la categoría

---

## 🧪 Test 6: Edición de Producto en ProductosManager

**Objetivo:** Verificar que editar producto NO pierde categoryId

### Pasos:
1. [ ] En **Productos**, editar un producto
2. [ ] Cambiar solo el nombre (ej: "Vestido" → "Vestido Premium")
3. [ ] Click "Guardar"
4. [ ] En localStorage damabella_productos:
   - [ ] Verifica que tiene `categoryId` intacto
   - [ ] Verifica que tiene `categoria` intacto
   - [ ] NO debe estar vacío

---

## 🧪 Test 7: Export a Excel

**Objetivo:** Verificar que exportación incluye categoría

### Pasos:
1. [ ] En **Productos**, click botón **"Descargar Excel"**
2. [ ] Abrir archivo descargado
3. [ ] Columna "Categoría":
   - [ ] Todos los productos tienen categoría
   - [ ] NO hay celdas vacías
   - [ ] Nombres correctos (ej: "Sets", "Vestidos Largos")

---

## 🧪 Test 8: Búsqueda por Categoría

**Objetivo:** Verificar que búsqueda funciona correctamente

### Pasos:
1. [ ] En **Productos**, en barra de búsqueda, escribir **"Sets"**
2. [ ] **Verifica:**
   - [ ] Aparecen todos los productos de esa categoría
   - [ ] NO aparecen productos de otras categorías
3. [ ] Escribir nombre de producto que tiene categoría (ej: "Vestido")
4. [ ] **Verifica:**
   - [ ] Encuentra el producto
   - [ ] Muestra su categoría

---

## 🔴 SIGNOS DE ERROR - NO DEBE PASAR:

- [ ] ❌ En ProductosManager, un producto dice "Sin categoría" si tiene categoryId
- [ ] ❌ Console muestra errores rojos al crear compra
- [ ] ❌ En localStorage, un producto tiene categoryId pero categoria vacío y NO se migró
- [ ] ❌ Selector de categorías en Compras diferente al de Productos
- [ ] ❌ Al editar producto, pierde la categoría
- [ ] ❌ Excel exportado tiene celdas de categoría vacías
- [ ] ❌ Logs no muestran migraciones ni sincronizaciones

---

## ✅ PRUEBA FINAL - SI TODO PASA:

**Resumen esperado:**
```
✅ Productos creados en Compras aparecen con categoría en Productos
✅ Productos antiguos se migran automáticamente
✅ Sincronización en tiempo real funciona (<2 segundos)
✅ Selector de categorías consistente en ambos módulos
✅ No se pierden datos al editar
✅ Export a Excel muestra categorías correctamente
✅ Búsqueda por categoría funciona
✅ No hay "Sin categoría" si el producto tiene categoryId
```

---

## 🗂️ Archivos Clave para Revisar (si falla algo)

| Archivo | Qué Revisar |
|---------|------------|
| ComprasManager.tsx | Líneas ~213, ~267: ¿Guarda `categoria`? |
| ProductosManager.tsx | Líneas ~63-100: ¿Se ejecuta migración al cargar? |
| ProductosManager.tsx | Líneas ~120-150: ¿Se ejecuta sincronización continua? |
| localStorage PRODUCTOS_KEY | ¿Tienen `categoryId` + `categoria`? |
| localStorage CATEGORIAS_KEY | ¿Tiene todas las categorías? |

---

## 📝 Notas

- Los logs de `🔄 [ProductosManager-INIT]` y `✅ [ProductosManager-SYNC]` indican que la migración/sincronización funciona
- Si no ves esos logs, la lógica no se ejecutó (revisar console de errores)
- La sincronización ocurre CADA 1 SEGUNDO, así que no es instantáneo pero es muy rápido
- Si durante el test ves que categoría falta, espera 2 segundos y verifica de nuevo (polling)
