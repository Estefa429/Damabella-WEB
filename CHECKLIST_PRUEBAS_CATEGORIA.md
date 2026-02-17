# ✅ CHECKLIST DE PRUEBAS - Fixes Categoría, Información y Cantidad

## 📋 Antes de empezar:
- [ ] Guarda todos los cambios (Ctrl+S)
- [ ] Recarga la página con Ctrl+F5 (sin caché)
- [ ] Abre DevTools: F12 → Console
- [ ] Ten lista la lista de categorías: Vestidos Largos, Vestidos Cortos, Enterizos, Sets

---

## 🧪 TEST 1: CATEGORÍA NO SE PIERDE

### Paso 1: Seleccionar categoría
- [ ] Click en "Compras" en menú
- [ ] Click en "+ Nueva Compra"
- [ ] En "Categoría del Producto": Selecciona **"Vestidos Largos"**
- [ ] Deberías ver en consola: `✅ [ComprasManager] Categoría seleccionada en onChange:`

### Paso 2: Agregar primer item
- [ ] En "Proveedor": Selecciona cualquiera (ej: "Proveedor Test")
- [ ] En "Fecha Compra": Selecciona la fecha de hoy
- [ ] En "Producto": Selecciona "Vestido Corto Casual"
- [ ] En "Talla": Selecciona "M"
- [ ] En "Color": Selecciona "Rojo"
- [ ] En "Cantidad": Escribe **5**
- [ ] En "Precio Compra": Escribe **30000**
- [ ] En "Precio Venta": Escribe **60000**
- [ ] En "Imagen": (Opcional) Pega una URL de imagen
- [ ] En "Categoría del Producto": **Deberías SEGUIR viéndolo seleccionado en "Vestidos Largos"** ✅

### Paso 3: Click "Agregar Producto"
- [ ] Haz click en "+ Agregar Producto"
- [ ] En la consola deberías ver:
  ```
  📋 [ComprasManager] agregarItem llamado con estado:
  ✅ Categoría obtenida del select: vestidos_largos Vestidos Largos
  ✅ [ComprasManager] Validación de categoría OK: categoriaId= vestidos_largos
  ```
- [ ] **CRÍTICO:** No deberías ver: ❌ "Por favor selecciona una categoría"

### Paso 4: Verificar tabla de items
- [ ] En la tabla "Producto | Categoría | Talla | Color | Cant. | P. Compra | P. Venta | Subtotal"
- [ ] Deberías ver una fila con:
  - Producto: "Vestido Corto Casual"
  - **Categoría: "Vestidos Largos" (azul badge)** ✅
  - Talla: "M"
  - Color: "Rojo"
  - Cant.: "5"
  - P. Compra: "$30,000"
  - P. Venta: "$60,000"

### Paso 5: El dropdown mantiene la categoría
- [ ] Mira el dropdown "Categoría del Producto"
- [ ] **DEBE SEGUIR MOSTRANDO "Vestidos Largos" seleccionado** ✅
- [ ] NO debe cambiar a "Seleccionar categoría..."

---

## 🧪 TEST 2: AGREGAR SEGUNDO ITEM SIN RESELECCIONAR CATEGORÍA

### Paso 1: Llenar segundo item
- [ ] En "Producto": Selecciona "Vestido Midi Floral"
- [ ] En "Talla": Selecciona "L"
- [ ] En "Color": Selecciona "Multicolor"
- [ ] En "Cantidad": Escribe **3**
- [ ] En "Precio Compra": Escribe **25000**
- [ ] En "Precio Venta": Escribe **50000**
- [ ] **NO selecciones categoría nuevamente** (debe estar "Vestidos Largos")

### Paso 2: Click "Agregar Producto"
- [ ] Haz click en "+ Agregar Producto"
- [ ] **No deberías recibir error de categoría** ✅
- [ ] En la consola verifica:
  ```
  ✅ Categoría obtenida del select: vestidos_largos Vestidos Largos
  ```

### Paso 3: Verificar tabla
- [ ] Deberías tener 2 items en la tabla:
  - Item 1: Vestido Corto Casual | **Vestidos Largos** | M | Rojo | 5
  - Item 2: Vestido Midi Floral | **Vestidos Largos** | L | Multicolor | 3
- [ ] **Ambos con la misma categoría** ✅

---

## 🧪 TEST 3: CANTIDAD SE GUARDA CORRECTAMENTE

### Paso 1: Crear compra
- [ ] En la sección "RESUMEN" abajo:
  - Subtotal: deberías ver $300,000 (5×30,000 + 3×25,000)
  - IVA: calculado automáticamente
  - Total: calculado automáticamente
- [ ] Click en "+ Crear Compra" (botón negro al final)

### Paso 2: Notificación de éxito
- [ ] Deberías ver una notificación:
  ```
  ✅ Compra guardada correctamente | 🆕 2 producto(s) creado(s) en Productos
  ```
- [ ] En la consola:
  ```
  🆕 [Producto Creado] Vestido Corto Casual - Stock: 5, Categoría: Vestidos Largos
  🆕 [Producto Creado] Vestido Midi Floral - Stock: 3, Categoría: Vestidos Largos
  ✅ [ComprasManager] Se crearon 2 nuevos productos
  ```

### Paso 3: Verificar en Productos
- [ ] Ve a "Productos" en el menú izquierdo
- [ ] Busca los productos que acabas de crear
- [ ] Verifica cada uno:

**Producto 1: Vestido Corto Casual**
- [ ] Nombre: "Vestido Corto Casual"
- [ ] **Categoría: "Vestidos Largos"** ✅
- [ ] **Stock: 5** ✅ (LA CANTIDAD QUE PUSISTE)
- [ ] Precio Venta: $60,000
- [ ] Imagen: Muestra si pusiste URL

**Producto 2: Vestido Midi Floral**
- [ ] Nombre: "Vestido Midi Floral"
- [ ] **Categoría: "Vestidos Largos"** ✅
- [ ] **Stock: 3** ✅ (LA CANTIDAD QUE PUSISTE)
- [ ] Precio Venta: $50,000
- [ ] Imagen: Muestra si pusiste URL

---

## 🧪 TEST 4: CAMBIAR A OTRA CATEGORÍA Y REPETIR

### Paso 1: Nueva compra
- [ ] Click "+ Nueva Compra" nuevamente
- [ ] Selecciona categoría diferente: **"Enterizos"**

### Paso 2: Agregar un item
- [ ] Producto: "Enterizo Ejecutivo"
- [ ] Talla: "XL"
- [ ] Color: "Negro"
- [ ] Cantidad: **10**
- [ ] Precios: Compra $40,000, Venta $85,000
- [ ] Click "+ Agregar Producto"
- [ ] Deberías ver: "Enterizos" en la tabla ✅

### Paso 3: Crear compra
- [ ] Click "+ Crear Compra"
- [ ] Deberías ver en consola: `Stock: 10, Categoría: Enterizos`

### Paso 4: Verificar en Productos
- [ ] Busca "Enterizo Ejecutivo"
- [ ] **Stock debe ser 10** ✅
- [ ] **Categoría debe ser "Enterizos"** ✅

---

## 🔴 SI ALGO FALLA

### Error: "Por favor selecciona una categoría"
**Causas posibles:**
1. El `ref={categoriaSelectRef}` no está bien conectado
2. Las categorías no cargaron correctamente de localStorage

**Qué hacer:**
- Abre DevTools Console (F12)
- Busca si aparece: `✅ Categoría obtenida del select:`
- Si NO aparece, significa que `categoriaSelectRef.current?.value` está vacío
- Intenta: Cierra y abre la página nuevamente

### Error: Cantidad aparece como "0" o vacía en Productos
**Causas posibles:**
1. La cantidad se está guardando como string
2. El parsing no funciona correctamente

**Qué hacer:**
- Abre DevTools Console
- Busca: `🆕 [Producto Creado]`
- Mira el valor de "Stock:" en el log
- Si dice "Stock: 5" pero en Productos sale "0", hay un issue de parsing

---

## 📊 TABLA DE RESULTADOS

Marca X en lo que funcione:

| Funcionalidad | ¿Funciona? | Observaciones |
|---|---|---|
| Seleccionar categoría sin error | [ ] | |
| Categoría NO se borra al agregar item | [ ] | |
| Segundo item hereda la categoría | [ ] | |
| Cantidad se guarda en Productos | [ ] | |
| Categoría se ve en Productos | [ ] | |
| Imagen se guarda (si la proporcionas) | [ ] | |
| Compra se crea correctamente | [ ] | |

---

## 📞 REPORTAR RESULTADOS

Si todo funciona ✅:
- Borra los logs de la consola para limpiar
- Reporta: "Todo funciona correctamente"

Si algo falla ❌:
- Copia el mensaje de error exacto de la consola
- Reporta: El error + en qué paso falla
- Incluye screenshot si es posible

---

**Documento de referencia:** `FIXES_CATEGORIA_CANTIDAD.md`
**Archivo modificado:** `src/features/purchases/components/ComprasManager.tsx`
**Estado compilación:** ✅ 0 errores
