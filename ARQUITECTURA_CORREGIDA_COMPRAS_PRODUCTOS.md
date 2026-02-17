# 🔄 Arquitectura Corregida - Compras vs Productos

## Antes (INCORRECTO ❌)

```
┌─────────────────────────────────────────────────────────┐
│                     FLUJO ANTERIOR                       │
└─────────────────────────────────────────────────────────┘

Compras                         Productos
  │                               │
  ├─ Requiere producto           ├─ Colores quemados
  │  existente (BLOQUEA)          │  (fantasmas)
  │                               │
  ├─ Colores de Productos         ├─ No permite
  │  (no los que necesito)         │  nuevos productos
  │                               │
  └─ Al crear compra:             └─ Datos se pierden
     ┌─────────────────────────────┐
     │ ❌ "Morado" aparece         │
     │ ❌ Categoría vacía          │
     │ ❌ Datos no se sincronizan  │
     │ ❌ NO FUNCIONA              │
     └─────────────────────────────┘
```

---

## Después (CORRECTO ✅)

```
┌─────────────────────────────────────────────────────────┐
│                    NUEVO FLUJO CORRECTO                 │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│      COMPRAS (Origen)    │         │    PRODUCTOS (Display)   │
├──────────────────────────┤         ├──────────────────────────┤
│                          │         │                          │
│ 1. Producto Name libre   │         │ Solo muestra lo que      │
│    (puede no existir)    │ ------> │ vino de Compras          │
│                          │         │                          │
│ 2. Categoría: requerida  │ Color   │ Edición preserva:        │
│    Talla: libre          │ Talla   │ - Categoría              │
│    Color: libre          │ Custom  │ - Precios                │
│                          │         │ - Imagen                 │
│ 3. Precios: requeridos   │         │ - Referencia             │
│    Imagen: opcional      │         │                          │
│    Referencia: auto SKU  │         │                          │
│                          │         │                          │
│ 4. Al guardar:           │         │ Con merge inteligente:   │
│    ├─ Busca por SKU      │         │ {                        │
│    ├─ Si existe:         │         │   ...producoAnterior,    │
│    │  Suma cantidad      │         │   ...cambios,            │
│    │  Preserva datos     │         │   id: mismoId            │
│    │                     │         │ }                        │
│    └─ Si NO existe:      │         │                          │
│       Crea con todos     │         │ ✅ DATOS PRESERVADOS     │
│       los datos          │         │                          │
│                          │         │                          │
└──────────────────────────┘         └──────────────────────────┘
```

---

## 📊 Flujo de Datos Detallado

### Paso 1: Crear Compra (ComprasManager)
```
Usuario ingresa:
┌────────────────────────────────────────┐
│ Producto: "Camisa Azul"                │
│ Categoría: "Vestidos Cortos"           │  ← REQUERIDO
│ Talla: "M"                             │  ← Viene del form
│ Color: "Azul Oscuro" (personalizado)   │  ← Viene del form
│ Cantidad: 10                           │  ← Viene del form
│ Precio Compra: 25000                   │  ← Viene del form
│ Precio Venta: 45000                    │  ← Viene del form
│ Imagen: "url-img.jpg"                  │  ← Opcional
└────────────────────────────────────────┘
```

### Paso 2: Generar SKU (agregarOActualizarProducto)
```
Referencia = itemCompra.referencia || 
  `SKU_${Date.now()}_${random}`

Ejemplo: SKU_1706182400000_A7K2M
```

### Paso 3: Buscar en Productos
```
const productoExistente = 
  productosActuales.find(p => 
    p.referencia === "SKU_1706182400000_A7K2M"
  )
```

### Paso 4a: Producto EXISTE
```
ACTUALIZAR (merge):
┌─────────────────────────────────────────────┐
│ Producto Anterior                           │
├─────────────────────────────────────────────┤
│ nombre: "Camisa Azul"                       │
│ categoria: "Vestidos Cortos"  ← Mantener   │
│ precioVenta: 45000           ← Mantener    │
│ imagen: "url-img.jpg"        ← Mantener    │
│ variantes: [                                │
│   { talla: "M",                            │
│     colores: [{ color: "Azul", cantidad: 5 }]
│   }                                         │
│ ]                                           │
└─────────────────────────────────────────────┘
                    ↓ Merge con nueva compra
             (talla L + color Rojo + cant 10)
                    ↓
┌─────────────────────────────────────────────┐
│ Producto Actualizado                        │
├─────────────────────────────────────────────┤
│ nombre: "Camisa Azul"                       │
│ categoria: "Vestidos Cortos" ✅ Preservada │
│ precioVenta: 45000          ✅ Preservado  │
│ imagen: "url-img.jpg"       ✅ Preservada  │
│ variantes: [                                │
│   { talla: "M",                            │
│     colores: [{ color: "Azul", cantidad: 5 }]
│   },                                        │
│   { talla: "L",  ← NUEVA                   │
│     colores: [{ color: "Rojo", cantidad: 10 }]
│   }                                         │
│ ]                                           │
└─────────────────────────────────────────────┘
```

### Paso 4b: Producto NO EXISTE
```
CREAR:
┌─────────────────────────────────────────────┐
│ Nuevo Producto                              │
├─────────────────────────────────────────────┤
│ id: Date.now()  (1706182400000)             │
│ nombre: "Camisa Azul"                       │
│ categoria: "Vestidos Cortos" ✅ De Compra   │
│ precioCompra: 25000         ✅ De Compra    │
│ precioVenta: 45000          ✅ De Compra    │
│ imagen: "url-img.jpg"       ✅ De Compra    │
│ referencia: "SKU_17061824_A7K2M"            │
│ createdFromSKU: "SKU_17061824_A7K2M"        │
│ variantes: [                                │
│   { talla: "M",                            │
│     colores: [{ color: "Azul", cantidad: 10 }]
│   }                                         │
│ ]                                           │
│ createdAt: "2024-01-25T..."                 │
└─────────────────────────────────────────────┘
```

### Paso 5: Guardar en localStorage
```javascript
localStorage.setItem('damabella_productos', 
  JSON.stringify([
    // productos existentes...
    // +
    // nuevo/actualizado
  ])
)

// Disparar evento para sincronizar
window.dispatchEvent(new StorageEvent('storage', {
  key: 'damabella_productos',
  newValue: JSON.stringify([...]),
  oldValue: null
}))
```

### Paso 6: Mostrar en Productos
```
EcommerceContext detecta cambio y actualiza
  ↓
ProductosManager recibe productos sincronizados
  ↓
UI muestra el nuevo/actualizado producto
```

---

## 🔧 Validaciones Implementadas

### En ComprasManager.agregarItem():
```typescript
// ✅ CAMBIO: Permitir productos que NO existen

const productoNombre = nuevoItem.productoNombre || 
  (nuevoItem.productoId ? productos.find(...)?.nombre : '');

if (!productoNombre || !nuevoItem.color || 
    !nuevoItem.cantidad || !nuevoItem.precioCompra || 
    !nuevoItem.precioVenta) {
  // Error - pero SIN requerir que exista el producto
}

if (!categoriaIdFinal) {
  // Error - categoría es OBLIGATORIA
}
```

### En agregarOActualizarProducto():
```typescript
// ✅ Merge inteligente

const referencia = itemCompra.referencia || 
  `SKU_${Date.now()}_${random}`;

// Buscar por referencia/SKU (NO por nombre)
const productoExistente = productosActuales.find(
  p => String(p.referencia).trim() === String(referencia).trim()
);

if (productoExistente) {
  // ✅ ACTUALIZAR manteniendo datos
  categoria: itemCompra.categoriaNombre && 
            itemCompra.categoriaNombre.trim() !== '' 
    ? itemCompra.categoriaNombre 
    : p.categoria  // ← Preservar si no viene nueva
    
  imagen: itemCompra.imagen && 
          itemCompra.imagen.trim() !== '' 
    ? itemCompra.imagen 
    : p.imagen  // ← Preservar si no viene nueva
} else {
  // ✅ CREAR con todos los datos de Compra
  categoria: itemCompra.categoriaNombre && 
            itemCompra.categoriaNombre.trim() !== '' 
    ? itemCompra.categoriaNombre 
    : 'Sin categoría'  // ← Última opción, casi nunca ocurre
}
```

### En ProductosManager.handleSave():
```typescript
// ✅ Merge en edición

const productoActualizado = {
  ...editingProduct,  // ← TODO primero
  ...productoData,    // ← Cambios después
  id: editingProduct.id  // ← ID nunca cambia
};

// Preserva automáticamente:
// - referencia (no está en productoData)
// - precioCompra (no está en form)
// - createdFromSKU (no está en form)
// - updatedAt (actualiza fecha)
```

---

## 🎯 Resultado Final

### ✅ Lo que FUNCIONABA y se MANTIENE:
- Crear compras (siempre funcionó)
- Guardar en localStorage (siempre funcionó)
- Mostrar productos en lista (siempre funcionó)

### ✅ Lo que AHORA FUNCIONA:
- **Crear compras CON productos nuevos** (ANTES NO)
- **Colores personalizados sin fantasmas** (ANTES tenía "Morado", etc.)
- **Categoría se preserva** (ANTES se perdía)
- **Edición preserva datos** (ANTES se sobrescribía)
- **SKU se genera automáticamente** (ANTES manual)

### ✅ Garantías:
1. **Compras es ORIGEN**: Define productos, categorías, colores, precios
2. **Productos es DISPLAY**: Solo muestra y permite editar, sin perder datos
3. **Merge inteligente**: Usa lógica `valor_nuevo || valor_existente`
4. **SKU = identificador único**: Busca por referencia, no por nombre

