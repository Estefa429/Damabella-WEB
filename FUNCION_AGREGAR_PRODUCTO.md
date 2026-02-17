# 🆕 Función: agregarOActualizarProducto()

## Descripción

Función especializada para agregar o actualizar productos en el módulo **Productos** basado en items de una compra.

**Ubicación:** `src/features/purchases/components/ComprasManager.tsx` (línea ~55)

---

## Características

✅ **Busca por SKU/Referencia** - Si existe un producto con el mismo SKU, lo actualiza  
✅ **Suma el stock** - Si existe, suma la cantidad comprada al stock actual  
✅ **Actualiza precios** - Actualiza precioCompra, precioVenta e imagen  
✅ **Crea nuevos** - Si no existe, crea un producto con todos los campos  
✅ **ID único** - Genera IDs únicos con timestamp  
✅ **Logs detallados** - Muestra exactamente qué se hizo en la consola  
✅ **Actualiza localStorage** - Persiste los cambios automáticamente  

---

## Firma de la Función

```typescript
function agregarOActualizarProducto(
  itemCompra: ItemCompra,
  productosActuales: any[]
): any[]
```

### Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `itemCompra` | `ItemCompra` | Item de una compra con datos del producto |
| `productosActuales` | `any[]` | Array actual de productos |

### Retorna

`any[]` - Array actualizado de productos (con el producto nuevo/actualizado)

---

## Estructura de ItemCompra

```typescript
interface ItemCompra {
  id: string;                    // ID único del item
  productoId: string;            // ID del producto (si existe)
  productoNombre: string;        // Nombre del producto ✅ REQUERIDO
  categoriaId?: string;          // ID de la categoría
  categoriaNombre?: string;      // Nombre de la categoría
  talla?: string;                // Talla (M, L, XL, etc.)
  color?: string;                // Color del producto
  cantidad: number;              // Cantidad comprada ✅ REQUERIDO
  precioCompra: number;          // Precio de compra unitario ✅ REQUERIDO
  precioVenta: number;           // Precio de venta ✅ REQUERIDO
  subtotal: number;              // Subtotal (cantidad × precioCompra)
  imagen?: string;               // URL de la imagen
  referencia?: string;           // SKU/Referencia única ✅ MUY IMPORTANTE
}
```

---

## Estructura de Producto Creado/Actualizado

### Producto NUEVO

```javascript
{
  id: "prod_1704067200000_abc123def",        // ID único generado
  nombre: "Vestido Largo Elegante",
  referencia: "VES-LARGO-001",                // ⭐ Clave de búsqueda
  codigoInterno: "COD_1704067200000",
  categoria: "Vestidos Largos",
  categoriaId: "vestidos_largos",
  stock: 5,                                   // Cantidad del item
  precioCompra: 50000,
  precioVenta: 95000,
  talla: ["M"],
  tallas: ["M"],
  color: "Negro",
  colores: ["Negro"],
  imagen: "https://...",
  descripcion: "Producto creado desde compra - VES-LARGO-001",
  activo: true,
  createdAt: "2026-01-29T14:00:00.000Z",
  createdFromSKU: "VES-LARGO-001"
}
```

### Producto EXISTENTE (después de actualizar)

```javascript
{
  // ... campos originales se mantienen ...
  stock: 15,                                  // 10 anterior + 5 nuevo
  precioCompra: 50000,                        // Actualizado
  precioVenta: 95000,                         // Actualizado
  imagen: "https://nuevaUrl.jpg",             // Actualizado si se proporciona
  updatedAt: "2026-01-29T14:00:00.000Z",
  lastUpdatedFrom: "Compra - VES-LARGO-001"
}
```

---

## Cómo Funciona

### Caso 1: Producto NUEVO

```
ENTRADA:
  itemCompra = {
    productoNombre: "Vestido Largo",
    cantidad: 5,
    precioCompra: 50000,
    precioVenta: 95000,
    referencia: "VES-LARGO-001",
    ...
  }
  productosActuales = [...]

LÓGICA:
  1️⃣ Buscar si existe: find(p => p.referencia === "VES-LARGO-001")
  2️⃣ NO EXISTE → Crear nuevo
  3️⃣ Generar ID único: "prod_1704067200000_abc123"
  4️⃣ Copiar todos los campos del itemCompra
  5️⃣ Agregar al array
  6️⃣ Retornar array actualizado

SALIDA:
  [
    { id: 1, nombre: "Otro Producto", ... },
    { id: "prod_...", nombre: "Vestido Largo", stock: 5, ... },  // ✅ NUEVO
  ]

CONSOLA:
  🆕 [agregarOActualizarProducto] Creando nuevo producto: Vestido Largo
  ✅ [agregarOActualizarProducto] Nuevo producto creado:
     Nombre: Vestido Largo
     SKU: VES-LARGO-001
     Stock: 5
     Categoría: Vestidos Largos
     Precio Venta: $95000
```

---

### Caso 2: Producto EXISTENTE

```
ENTRADA:
  itemCompra = {
    productoNombre: "Vestido Largo",
    cantidad: 5,
    precioCompra: 50000,
    precioVenta: 95000,
    referencia: "VES-LARGO-001",
    ...
  }
  productosActuales = [
    {
      id: 1,
      nombre: "Vestido Largo",
      referencia: "VES-LARGO-001",
      stock: 10,
      precioCompra: 48000,
      precioVenta: 90000,
      ...
    },
    ...
  ]

LÓGICA:
  1️⃣ Buscar: find(p => p.referencia === "VES-LARGO-001")
  2️⃣ EXISTE → Actualizar
  3️⃣ Calcular nuevo stock: 10 + 5 = 15
  4️⃣ Actualizar campos:
     - stock: 15
     - precioCompra: 50000  (nuevo)
     - precioVenta: 95000   (nuevo)
     - imagen: URL nueva (si se proporciona)
     - updatedAt: timestamp
     - lastUpdatedFrom: "Compra - VES-LARGO-001"
  5️⃣ Reemplazar en array
  6️⃣ Retornar array actualizado

SALIDA:
  [
    {
      id: 1,
      nombre: "Vestido Largo",
      referencia: "VES-LARGO-001",
      stock: 15,               // ✅ ACTUALIZADO
      precioCompra: 50000,     // ✅ ACTUALIZADO
      precioVenta: 95000,      // ✅ ACTUALIZADO
      updatedAt: "2026-01-29T14:00:00.000Z",
      lastUpdatedFrom: "Compra - VES-LARGO-001"
    },
    ...
  ]

CONSOLA:
  ✏️ [agregarOActualizarProducto] Actualizando producto existente: Vestido Largo
  ✅ [agregarOActualizarProducto] Vestido Largo:
     Stock: 10 + 5 = 15
     Precio Compra: $50000
     Precio Venta: $95000
```

---

## Uso en ComprasManager

La función se llama automáticamente en `handleSave()`:

```typescript
formData.items.forEach((item: ItemCompra) => {
  // Verificar si existía antes
  const existía = productosFinales.some(
    (p: any) => String(p.referencia).trim() === String(item.referencia).trim()
  );
  
  // Aplicar la función
  productosFinales = agregarOActualizarProducto(item, productosFinales);
  
  // Registrar qué pasó
  if (!existía) {
    productosAgregados.push(item.productoNombre);
  } else {
    productosActualizados_.push(item.productoNombre);
  }
});

// Guardar en localStorage
localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosFinales));
setProductos(productosFinales);
```

---

## Campos Críticos

### ✅ REQUERIDOS

```
itemCompra.productoNombre     // ¿Qué se llama?
itemCompra.cantidad            // ¿Cuántos se compran?
itemCompra.precioCompra        // ¿Cuánto se pagó?
itemCompra.precioVenta         // ¿A qué precio se vende?
itemCompra.referencia          // ⭐ SKU para buscar/crear
```

### 📋 OPCIONALES

```
itemCompra.imagen              // URL de imagen (se actualiza)
itemCompra.categoriaNombre     // Categoría
itemCompra.talla               // Talla del producto
itemCompra.color               // Color
itemCompra.categoriaId         // ID de categoría
```

---

## Comportamiento por Campo

| Campo | Nuevo Producto | Producto Existente |
|-------|--|--|
| `nombre` | Del itemCompra | No se modifica |
| `referencia` | Del itemCompra | No se modifica |
| `stock` | Del itemCompra | itemCompra + stock anterior |
| `precioCompra` | Del itemCompra | Se actualiza con itemCompra |
| `precioVenta` | Del itemCompra | Se actualiza con itemCompra |
| `imagen` | Del itemCompra | Se actualiza si existe en itemCompra |
| `categoría` | Del itemCompra | No se modifica |
| `talla` | Del itemCompra | No se modifica |
| `color` | Del itemCompra | No se modifica |

---

## Validación

### ✅ Válido

```javascript
agregarOActualizarProducto(
  {
    productoNombre: "Vestido Largo",
    cantidad: 5,
    precioCompra: 50000,
    precioVenta: 95000,
    referencia: "VES-LARGO-001",
    categoriaNombre: "Vestidos Largos",
    imagen: "https://..."
  },
  productosActuales
)
```

### ❌ Inválido

```javascript
// Falta referencia
agregarOActualizarProducto(
  {
    productoNombre: "Vestido Largo",
    cantidad: 5,
    // ❌ referencia faltante
  },
  productosActuales
)
// ⚠️ Resultado: producto NO se agrega, log: "Item sin referencia/SKU"
```

---

## Salida de Consola

### Nuevo Producto

```
🆕 [agregarOActualizarProducto] Creando nuevo producto: Vestido Largo
✅ [agregarOActualizarProducto] Nuevo producto creado:
   Nombre: Vestido Largo
   SKU: VES-LARGO-001
   Stock: 5
   Categoría: Vestidos Largos
   Precio Venta: $95000
```

### Producto Existente

```
✏️ [agregarOActualizarProducto] Actualizando producto existente: Vestido Largo
✅ [agregarOActualizarProducto] Vestido Largo:
   Stock: 10 + 5 = 15
   Precio Compra: $50000
   Precio Venta: $95000
```

### Resumen en handleSave()

```
✅ [ComprasManager] Se crearon 2 nuevos productos: Vestido Corto, Vestido Midi
📦 [ComprasManager] Se actualizaron 1 productos: Enterizo Ejecutivo
✅ [ComprasManager] Productos sincronizados correctamente con el módulo Productos
```

---

## Ejemplo Completo

### Escenario: Compra con 3 items

**Compra Items:**
1. Vestido Largo - SKU: VES-LARGO-001 - Cantidad: 5 - Precio Venta: $95000
2. Vestido Corto - SKU: VES-CORTA-001 - Cantidad: 3 - Precio Venta: $60000 (YA EXISTE en BD)
3. Enterizo - SKU: ENT-001 - Cantidad: 8 - Precio Venta: $85000

**Estado Inicial de Productos:**
```javascript
[
  { id: 1, nombre: "Vestido Corto", referencia: "VES-CORTA-001", stock: 10, ... }
  // Vestido Largo y Enterizo NO existen
]
```

**Después de Compra:**

```javascript
[
  { 
    id: 1,
    nombre: "Vestido Corto",
    referencia: "VES-CORTA-001",
    stock: 13,                    // ✅ 10 + 3 = 13
    precioVenta: 60000,           // ✅ Actualizado
    updatedAt: "2026-01-29T14:00:00.000Z"
  },
  {
    id: "prod_1704067200000_abc123",
    nombre: "Vestido Largo",       // 🆕 NUEVO
    referencia: "VES-LARGO-001",
    stock: 5,
    precioVenta: 95000,
    createdAt: "2026-01-29T14:00:00.000Z"
  },
  {
    id: "prod_1704067200001_def456",
    nombre: "Enterizo",             // 🆕 NUEVO
    referencia: "ENT-001",
    stock: 8,
    precioVenta: 85000,
    createdAt: "2026-01-29T14:00:00.000Z"
  }
]
```

**Notificación:**
```
✅ Compra guardada correctamente | 🆕 2 nuevos | 📦 1 actualizado en Productos
```

---

## Ventajas

✅ **Evita duplicados** - Busca por SKU, no por ID  
✅ **Suma automática** - No necesitas calcular el stock manualmente  
✅ **Actualización inteligente** - Solo actualiza lo necesario  
✅ **Trazabilidad** - Registra cuándo y por qué se modificó  
✅ **Logs detallados** - Fácil de debuggear  
✅ **Reutilizable** - Puedes importar y usar en otros módulos  

---

## Posibles Extensiones Futuras

```typescript
// Versión mejorada con más validaciones
function agregarOActualizarProducto(
  itemCompra: ItemCompra,
  productosActuales: any[],
  opciones?: {
    permitirActualizarNombre?: boolean,        // Actualizar nombre si cambia
    permitirActualizarCategoria?: boolean,     // Actualizar categoría
    registrarHistorial?: boolean,              // Guardar log de cambios
    notificar?: boolean                        // Disparar evento
  }
): any[]
```

---

**Estado:** ✅ Implementado y funcionando  
**Compilación:** ✅ 0 errores  
**Tests:** ✅ Probado en handleSave()
