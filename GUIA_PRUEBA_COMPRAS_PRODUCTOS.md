# 📖 GUÍA DE PRUEBA: Sincronización Compras ↔ Productos

## ✅ Problema Resuelto

El producto no se estaba creando en el módulo de Productos cuando agregabas una compra. Se mostraba el mensaje de éxito pero el producto no aparecía.

### 🔧 Causas Identificadas y Corregidas:

1. **Referencia (SKU) no se capturaba** 
   - Cuando seleccionabas un producto en el formulario de compra, no se guardaba su `referencia/SKU`
   - Sin SKU, no se podía crear el producto correctamente

2. **Formato de datos incompatible**
   - Los productos creados no usaban la estructura de `variantes` esperada por ProductosManager
   - Esto causaba que EcommerceContext no los reconociera

3. **Falta de sincronización en tiempo real**
   - No se disparaba el evento de almacenamiento
   - EcommerceContext no se enteraba de los nuevos productos

## 🚀 PASOS PARA PROBAR

### 1️⃣ Abre la Developer Console (F12)
```
Presiona: F12
Pestaña: Console
```

### 2️⃣ Ve al Módulo de Compras
- Click en **"Compras"** en el menú lateral
- Click en **"Nueva Compra"**

### 3️⃣ Completa el Formulario

Rellena estos campos:
- **Proveedor**: Selecciona uno existente
- **Fecha Compra**: Elige una fecha
- **IVA**: Mantén 19%
- **Observaciones**: Opcional

### 4️⃣ Agregar Producto

En la sección "Agregar Producto":

```
📋 Campos a completar:
├─ Categoría: Selecciona una categoría
├─ Producto: Selecciona "Vestido Corto Casual"
├─ Talla: Elige una (ej: M)
├─ Color: Elige un color (ej: Negro)
├─ Cantidad: 5
├─ Precio Compra: 30000
├─ Precio Venta: 65000
├─ Imagen: (opcional)
└─ SKU: DEJAR VACÍO (se asigna automáticamente del producto)
```

### 5️⃣ Presiona "Agregar Item"

En la consola deberías ver:
```
✅ Producto seleccionado: Vestido Corto Casual
📦 SKU/Referencia: VES-CORTA-001
✅ Item agregado a tabla. Total items ahora: 1
```

### 6️⃣ Guarda la Compra

Click en **"Guardar Compra"**

### 7️⃣ Verifica los Logs en Console

Busca estos mensajes (en orden):

```javascript
// ✅ Paso 1: Item se agregó correctamente
✅ Item agregado a tabla. Total items ahora: 1

// ✅ Paso 2: Se buscó si el producto existe
📊 [ComprasManager] Estado actual de productos en localStorage:
   Total de productos: 6
   1. Vestido Corto Casual (SKU: VES-CORTA-001) - Activo: true
   2. Vestido Largo Elegante (SKU: VES-LARGO-002) - Activo: true
   ...

// ✅ Paso 3: Se actualizó el producto
✏️ [agregarOActualizarProducto] Actualizando producto existente: Vestido Corto Casual
   Talla: M, Color: Negro, Cantidad: 5
   Precio Compra: $30000
   Precio Venta: $65000

// ✅ Paso 4: Se guardó en localStorage
📦 [ComprasManager] Se actualizaron 1 productos: Vestido Corto Casual en Productos

// ✅ Paso 5: Se sincronizó con EcommerceContext
[EcommerceContext] Productos encontrados en localStorage: 6
[EcommerceContext] Producto 1: Vestido Corto Casual | Categoría: Vestidos Cortos | activo: true
✅ Producto incluido: Vestido Corto Casual
```

### 8️⃣ Verifica en el Módulo de Productos

1. Abre el módulo **"Productos"** en el menú
2. Busca **"Vestido Corto Casual"**
3. Deberías ver:
   - El campo **M** (talla) con **Negro** 
   - Stock actualizado: **5 unidades**
   - Precio de Compra: **$30,000**
   - Precio de Venta: **$65,000**

### 9️⃣ Prueba con un Producto Nuevo (Sin SKU previo)

Ahora prueba creando un item **sin usar un producto existente**:

```
Campos:
├─ Producto: "Camisa Azul" (escribe el nombre)
├─ Talla: L
├─ Color: Azul
├─ Cantidad: 3
├─ Precio Compra: 25000
├─ Precio Venta: 55000
└─ SKU: (dejar vacío)
```

En la consola deberías ver:
```
🆕 [agregarOActualizarProducto] Creando nuevo producto: Camisa Azul
✅ [agregarOActualizarProducto] Nuevo producto creado:
   Nombre: Camisa Azul
   SKU: SKU_[timestamp]_[random] ← Generado automáticamente
   Categoría: [Tu categoría]
   Precio Venta: $55000
   Variantes: [{"talla":"L","colores":[{"color":"Azul","cantidad":3}]}]
```

## 🎯 Verificar en localStorage Directamente

Abre la DevTools y ve a **Application → Local Storage**:

Busca `damabella_productos` y deberías ver una estructura como:

```json
[
  {
    "id": 1,
    "nombre": "Vestido Corto Casual",
    "referencia": "VES-CORTA-001",
    "proveedor": "Temporal",
    "categoria": "Vestidos Cortos",
    "precioVenta": 65000,
    "activo": true,
    "variantes": [
      {
        "talla": "M",
        "colores": [
          {
            "color": "Negro",
            "cantidad": 5
          }
        ]
      }
    ],
    "createdAt": "2026-01-29T..."
  }
]
```

## ✅ Checklist de Validación

- [ ] Aparece el mensaje "Compra guardada correctamente | 🆕 1 nuevo(s) en Productos"
- [ ] El producto aparece en el módulo de Productos dentro de 1-2 segundos
- [ ] La cantidad se sumó correctamente (si actualizó)
- [ ] El precio de compra y venta se actualizó
- [ ] La categoría es correcta
- [ ] Las variantes (talla/color) están bien estructura
- [ ] En localStorage aparece el SKU del producto
- [ ] En el e-commerce se ve el nuevo producto

## 🐛 Si Algo Falla

### Caso 1: El producto no aparece en Productos
```
1. Abre DevTools (F12)
2. Ve a Application → Local Storage
3. Busca damabella_productos
4. Verifica que el producto esté ahí con referencia
5. Recarga la página (Ctrl+R)
6. Si aún no aparece, hay un error en EcommerceContext
```

### Caso 2: El mensaje de éxito aparece pero sin producto
```
Revisa la consola para estos errores:
- ❌ [agregarOActualizarProducto] Item sin referencia/SKU
- ❌ Error al convertir productos del admin

Esto significa que la referencia no se está capturando correctamente
```

### Caso 3: El producto aparece pero sin variantes
```
Verifica que en localStorage el campo "variantes" tenga esta estructura:
[
  {
    "talla": "M",
    "colores": [
      {
        "color": "Negro",
        "cantidad": 5
      }
    ]
  }
]

Si tiene "talla" y "colores" como arrays simples, está en formato antiguo
```

## 📊 Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                      COMPRAS                                │
│  Seleccionar Producto → Asignar SKU (referencia)            │
│                         ↓                                    │
│              Guardar en formData.items[]                     │
│                         ↓                                    │
│            agregarOActualizarProducto()                      │
│    (Busca por SKU, actualiza o crea)                         │
│                         ↓                                    │
│        localStorage.setItem(PRODUCTOS_KEY, ...)             │
│        window.dispatchEvent(StorageEvent)                   │
│                         ↓                                    │
│   ┌──────────────────────────────────────────────────┐     │
│   │         ECOMMERCE CONTEXT                        │     │
│   │  Listener Storage + Polling (cada 1 segundo)     │     │
│   │                    ↓                              │     │
│   │    convertAdminProductsToDisplayFormat()         │     │
│   │                    ↓                              │     │
│   │           setProducts([...])                      │     │
│   │                    ↓                              │     │
│   └──────────────────────────────────────────────────┘     │
│                         ↓                                    │
│                  MÓDULO PRODUCTOS                            │
│              (Aparece el nuevo producto)                     │
└─────────────────────────────────────────────────────────────┘
```

## 🎉 ¡Listo!

Si todo funciona correctamente, verás:
1. ✅ Mensaje de éxito en la modal
2. ✅ El producto en el módulo de Productos después de 1-2 segundos
3. ✅ Los logs en la consola indicando el flujo completo
4. ✅ En localStorage el producto con todas sus variantes
