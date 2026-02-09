# ✅ PRUEBA PASO A PASO: Categoría en Tabla de Compras

## 📋 Pre-Requisitos

- [ ] Proyecto compilado exitosamente (`npm run build`)
- [ ] DevTools abiertos en página (`F12`)
- [ ] Console tab visible para ver logs
- [ ] localStorage accesible (Application tab)

---

## 🧪 ESCENARIO 1: Producto Existente CON Categoría

### Setup
- Asume que existe al menos 1 producto en PRODUCTOS_KEY con `categoryId` y `categoria`
- Si no existe, ejecuta primero el ESCENARIO 3

### Ejecución
1. [ ] Abre aplicación
2. [ ] Navega a **Compras** → **Nueva Compra**
3. [ ] Completa datos básicos:
   - [ ] Proveedor: selecciona uno
   - [ ] Fecha: auto-llena (hoy)
4. [ ] En sección "Productos a Comprar":
   - [ ] Campo "Nombre del Producto" → Usa el **SELECT DROPDOWN**
   - [ ] Selecciona un producto existente
5. [ ] **VERIFICACIÓN EN CONSOLE:**
   - [ ] Debe haber log: `✅ [select-onChange] Producto seleccionado:`
   - [ ] Log muestra: `nombre: "..."`, `categoryId: "..."`, `categoriaNombre: "..."`
   - [ ] Si NO ves este log, el producto NO tiene categoría asignada
6. [ ] Observa formulario:
   - [ ] Campo "Categoría" debe estar LLENO con el nombre
   - [ ] NO debe estar vacío
7. [ ] Completa resto del formulario:
   - [ ] Talla: selecciona una
   - [ ] Color: selecciona uno
   - [ ] Cantidad: 5 (ej)
   - [ ] Precio Compra: 50 (ej)
   - [ ] Precio Venta: 120 (ej)
8. [ ] Click **"Agregar"**
9. [ ] **VERIFICACIÓN EN CONSOLE:**
   - [ ] Logs deben mostrar el estado final del item
   - [ ] Debe haber: `categoriaNombre: "Sets"` (o el nombre que sea)
   - [ ] Busca log: `✅ [agregarItem] Resolviendo nombre desde categoryId:`
10. [ ] **VERIFICACIÓN EN TABLA:**
    - [ ] Aparece una fila con el producto
    - [ ] Columna "Categoría" muestra: `Sets` (o el nombre)
    - [ ] ✅ **NO dice "⚠️ ERROR: Sin asignar"**

### ✅ Si pasa: ESCENARIO 1 OK
- [ ] Anota el nombre del producto y categoría para Test 2

---

## 🧪 ESCENARIO 2: Agregar OTRO Item del Mismo Producto

### Objetivo
Verificar que al agregar el mismo producto de nuevo, la categoría se llena automáticamente

### Ejecución
1. [ ] Aún en la misma compra (abierto el form)
2. [ ] Campo "Nombre del Producto":
   - [ ] Usa el **SELECT DROPDOWN** de nuevo
   - [ ] Selecciona el MISMO producto que acabas de agregar
3. [ ] Completa diferentes datos:
   - [ ] Talla: DIFERENTE a la anterior
   - [ ] Color: DIFERENTE a la anterior
   - [ ] Cantidad: 3 (ej)
   - [ ] Precios: iguales o diferentes
4. [ ] Click **"Agregar"**
5. [ ] **VERIFICACIÓN EN TABLA:**
   - [ ] Ahora hay 2 filas del mismo producto (tallas/colores diferentes)
   - [ ] AMBAS filas muestran la categoría correctamente
   - [ ] ✅ NINGUNA dice "Sin asignar"

### ✅ Si pasa: ESCENARIO 2 OK

---

## 🧪 ESCENARIO 3: Crear Producto NUEVO

### Objetivo
Verificar que al crear un producto nuevo, la categoría se llena desde el select

### Ejecución
1. [ ] En Compras → Nueva Compra
2. [ ] Campo "Nombre del Producto":
   - [ ] **ESCRIBE UN NOMBRE NUEVO** (ej: "Vestido Flores Amarillas")
   - [ ] Que NO exista en la lista de productos
3. [ ] Completa los campos de nuevo producto:
   - [ ] Referencia: escribe algo (ej: SKU-2025-001)
   - [ ] Talla: selecciona una (ej: M)
   - [ ] Color: selecciona uno (ej: Rosa)
   - [ ] Cantidad: 5
   - [ ] Precio Compra: 50
   - [ ] Precio Venta: 120
4. [ ] **CRÍTICO:** Dropdown "Categoría":
   - [ ] Debe estar visible
   - [ ] SELECCIONA UNA CATEGORÍA (ej: "Sets")
   - [ ] ✅ Asegúrate que NO esté vacío
5. [ ] Click **"Crear Producto"**
6. [ ] **VERIFICACIÓN EN CONSOLE:**
   - [ ] Busca log: `🆕 [agregarOActualizarProducto] Creando nuevo producto:`
   - [ ] Debe mostrar: `Category ID: cat-001` (o similar)
   - [ ] NO debe mostrar vacío
7. [ ] Click **"Agregar"**
8. [ ] **VERIFICACIÓN EN CONSOLE:**
   - [ ] Log: `✅ [agregarItem] Resolviendo nombre desde categoryId:`
   - [ ] Estado final debe tener: `categoriaNombre: "Sets"`
9. [ ] **VERIFICACIÓN EN TABLA:**
   - [ ] Aparece el nuevo producto
   - [ ] Columna Categoría muestra "Sets"
   - [ ] ✅ NO dice "Sin asignar"

### ✅ Si pasa: ESCENARIO 3 OK

---

## 🧪 ESCENARIO 4: Producto SIN Categoría Inicial

### Objetivo
Verificar que si un producto NO tiene categoría en BD, el sistema lo maneja correctamente

### Setup Manual
1. [ ] Abre DevTools → Application → Local Storage
2. [ ] Busca `damabella_productos`
3. [ ] Copia el contenido (para restaurar después si falla)
4. [ ] Edita el array para crear/modificar un producto:
```json
{
  "id": 99999,
  "nombre": "Producto Test Sin Categoría",
  "categoryId": "",
  "categoria": "",
  "proveedor": "Test",
  "precioVenta": 100,
  "activo": true,
  "variantes": [],
  "createdAt": "2024-01-01T00:00:00Z"
}
```
5. [ ] Guarda los cambios

### Ejecución
1. [ ] Aún en Compras
2. [ ] Campo "Nombre del Producto" → SELECT DROPDOWN
3. [ ] Selecciona "Producto Test Sin Categoría"
4. [ ] **VERIFICACIÓN EN CONSOLE:**
   - [ ] Debe haber warning: `⚠️ Producto existente SIN categoría`
   - [ ] O similar
5. [ ] Observa formulario:
   - [ ] Campo "Categoría" estará VACÍO
   - [ ] ✅ Esto es correcto - no hay categoría en BD
6. [ ] **MANUALMENTE** selecciona una categoría en dropdown "Categoría"
7. [ ] Completa resto (talla, color, cantidad, precios)
8. [ ] Click **"Agregar"**
9. [ ] **VERIFICACIÓN EN TABLA:**
   - [ ] Aparece el producto
   - [ ] Columna Categoría muestra el nombre que seleccionaste
   - [ ] ✅ NO dice "Sin asignar"
10. [ ] Click **"Guardar Compra"**
11. [ ] **VERIFICACIÓN EN localStorage:**
    - [ ] Application → `damabella_productos`
    - [ ] Busca "Producto Test Sin Categoría"
    - [ ] Ahora debe tener: `"categoryId": "cat-001"` (o lo que seleccionaste)
    - [ ] Y: `"categoria": "Sets"` (el nombre resuelto)
    - [ ] ✅ NO debe estar vacío

### ✅ Si pasa: ESCENARIO 4 OK

---

## 🧪 ESCENARIO 5: Verifi cación en Productos Manager

### Objetivo
Verificar que los productos creados en Compras aparecen correctamente en Productos

### Ejecución
1. [ ] Guarda la compra del ESCENARIO 3 (si no lo has hecho)
2. [ ] Navega a **Productos**
3. [ ] **VERIFICACIÓN EN CONSOLE:**
   - [ ] Debe haber logs de ProductosManager cargando
   - [ ] Si hay migraciones, verá: `🔄 [ProductosManager-INIT] Migrando...`
4. [ ] En la tabla de Productos:
   - [ ] Busca "Vestido Flores Amarillas" (del ESCENARIO 3)
   - [ ] Debe estar en la lista
5. [ ] Haz click en ese producto (View/Edit)
6. [ ] En el modal de detalles:
   - [ ] Campo "Categoría" debe mostrar: "Sets"
   - [ ] ✅ NO dice "Sin categoría" o vacío
7. [ ] Cierra modal
8. [ ] En la tabla principal, hay una columna de categoría:
   - [ ] El producto debe mostrar "Sets"

### ✅ Si pasa: ESCENARIO 5 OK

---

## 🧪 ESCENARIO 6: Export a Excel

### Objetivo
Verificar que el export incluye categoría correctamente

### Ejecución
1. [ ] En Productos, click botón **"Descargar Excel"**
2. [ ] Se descarga archivo
3. [ ] Abre con Excel/Sheets
4. [ ] Busca el producto que creaste ("Vestido Flores Amarillas")
5. [ ] Columna "Categoría":
   - [ ] Debe mostrar "Sets"
   - [ ] ✅ NO está vacío

### ✅ Si pasa: ESCENARIO 6 OK

---

## 🔴 SIGN OS DE ERROR - COSAS QUE NO DEBEN PASAR

- [ ] ❌ Console muestra error rojo al agregar item
- [ ] ❌ Tabla muestra "⚠️ ERROR: Sin asignar" cuando hay categoría seleccionada
- [ ] ❌ Al guardar compra, se pierde la categoría
- [ ] ❌ En Productos, el producto aparece sin categoría
- [ ] ❌ Excel exportado tiene celda de categoría vacía
- [ ] ❌ No hay logs de resolución de categoría en console
- [ ] ❌ Campo "Categoría" en form está siempre vacío aunque haya producto

---

## ✅ RESUMEN FINAL - SI TODOS PASAN

```
ESCENARIO 1 ✅ - Producto existente muestra categoría en tabla
ESCENARIO 2 ✅ - Múltiples items del mismo producto mantienen categoría
ESCENARIO 3 ✅ - Nuevo producto + categoría seleccionada se muestra
ESCENARIO 4 ✅ - Producto sin categoría puede recibir categoría en compra
ESCENARIO 5 ✅ - Productos Manager refleja categoría correctamente
ESCENARIO 6 ✅ - Export a Excel incluye categoría

→ FIX COMPLETADO EXITOSAMENTE ✅
→ No aparece "Sin asignar" en ningún caso
→ Categoría funciona consistentemente
```

---

## 📞 Si Algo Falla

1. **Tabla muestra "Sin asignar":**
   - [ ] Abre Console → Busca logs de `agregarItem`
   - [ ] Verifica que `categoriaNombre` está en el log
   - [ ] Si está vacío, revisa si `categoryId` se llenó
   - [ ] Revisa que producto en BD tiene `categoryId`

2. **Console muestra errores rojo:**
   - [ ] Anota el error completo
   - [ ] Revisa línea mencionada en ComprasManager.tsx
   - [ ] Busca si falta alguna variable

3. **Categoría no se llena en form:**
   - [ ] Verifica que el producto en BD tiene `categoryId` poblado
   - [ ] En Application → `damabella_productos`, busca el producto
   - [ ] Revisa que tiene: `"categoryId": "cat-001"` (o similar)

4. **Excel está vacío:**
   - [ ] Exporta de nuevo
   - [ ] Verifica que hay productos en la tabla
   - [ ] Revisa en DevTools que productos en memoria tienen categoría

---

## 📝 Notas Importantes

- La resolución de categoría ocurre en `agregarItem()` automáticamente
- NO necesitas hacer nada especial - es automático
- Logs en console ayudan a entender qué está pasando
- Si todo funciona, verás "Sets" o el nombre en la tabla, NO "Sin asignar"
