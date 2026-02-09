# 🔧 RESUMEN TÉCNICO: Cambios en Sincronización Compras ↔ Productos

## 📁 Archivos Modificados

### 1. `src/features/purchases/components/ComprasManager.tsx`

#### Cambio 1.1: Validación de Categoría en Nueva Creación
**Línea aproximada**: ~145

```typescript
// ANTES
categoria: itemCompra.categoriaNombre || 'Sin categoría',

// DESPUÉS  
categoria: itemCompra.categoriaNombre && itemCompra.categoriaNombre.trim() !== '' 
  ? itemCompra.categoriaNombre 
  : 'Sin categoría',
```

**Impacto**: Asegura que solo si hay una categoría válida se use, si no, usa "Sin categoría" como fallback.

---

#### Cambio 1.2: Merge Completo en Actualización de Producto
**Línea aproximada**: ~80-130

```typescript
// ANTES
const productoActualizado = {
  ...p,
  variantes,
  precioCompra: itemCompra.precioCompra || p.precioCompra,
  precioVenta: itemCompra.precioVenta || p.precioVenta,
  imagen: itemCompra.imagen || p.imagen,
  updatedAt: new Date().toISOString(),
};

// DESPUÉS
const productoActualizado = {
  ...p,  // Primero todo lo existente
  variantes,
  // Solo actualiza si el nuevo valor es válido (no 0, no vacío)
  precioCompra: itemCompra.precioCompra && itemCompra.precioCompra > 0 
    ? itemCompra.precioCompra 
    : p.precioCompra,
  precioVenta: itemCompra.precioVenta && itemCompra.precioVenta > 0 
    ? itemCompra.precioVenta 
    : p.precioVenta,
  imagen: itemCompra.imagen && itemCompra.imagen.trim() !== '' 
    ? itemCompra.imagen 
    : p.imagen,
  categoria: itemCompra.categoriaNombre && itemCompra.categoriaNombre.trim() !== '' 
    ? itemCompra.categoriaNombre 
    : p.categoria,
  updatedAt: new Date().toISOString(),
};
```

**Impacto**: 
- Evita sobrescribir con valores vacíos o 0
- Mantiene datos existentes si no hay nuevos valores válidos
- Preserva categoría original si no viene una nueva

---

#### Cambio 1.3: Mejora de Logs
**Línea aproximada**: ~140-180

```typescript
// ANTES
console.log(`✅ [agregarOActualizarProducto] ${p.nombre}:`);
console.log(`   Talla: ...`);

// DESPUÉS
console.log(`✏️ [agregarOActualizarProducto] Actualizando producto existente: ${productoExistente.nombre}`);
console.log(`   Producto actual:`, {
  nombre: productoExistente.nombre,
  categoria: productoExistente.categoria,
  precioCompra: productoExistente.precioCompra,
  precioVenta: productoExistente.precioVenta,
  imagen: productoExistente.imagen ? 'Sí' : 'No'
});
// ... más logs ...
console.log(`   Categoría: ${productoActualizado.categoria}`);
console.log(`   Imagen mantenida: ${productoActualizado.imagen ? 'Sí' : 'No'}`);
```

**Impacto**: Mejora la trazabilidad y debugging del proceso

---

#### Cambio 1.4: Captura de Referencia en handleSelectProducto
**Línea aproximada**: ~930

```typescript
// ANTES
setNuevoItem({ 
  ...nuevoItem, 
  productoId,
  talla: '',
  color: ''
});

// DESPUÉS
setNuevoItem({ 
  ...nuevoItem, 
  productoId,
  productoNombre,
  referencia: producto?.referencia || '',  // NUEVO
  talla: '',
  color: ''
});
```

**Impacto**: Asegura que la referencia/SKU se capture cuando se selecciona un producto

---

### 2. `src/features/ecommerce/products/components/ProductosManager.tsx`

#### Cambio 2.1: Merge Correcto en Edición de Producto
**Línea aproximada**: ~300-340

```typescript
// ANTES
if (editingProduct) {
  setProductos(productos.map(p => 
    p.id === editingProduct.id ? { ...p, ...productoData } : p
  ));

// DESPUÉS
if (editingProduct) {
  const productoActualizado = {
    ...editingProduct,  // Primero TODO del producto existente
    ...productoData,     // Luego sobrescribir solo lo nuevo
    id: editingProduct.id  // Asegurar que ID no cambie
  };
  
  console.log(`📝 [ProductosManager] Actualizando producto:`, {
    idAnterior: editingProduct.id,
    idActual: productoActualizado.id,
    camposMantenidos: ['referencia', 'precioCompra', 'createdFromSKU'],
    referencia: productoActualizado.referencia,
    precioCompra: productoActualizado.precioCompra
  });
  
  setProductos(productos.map(p => 
    p.id === editingProduct.id ? productoActualizado : p
  ));
}
```

**Impacto**: 
- Mantiene campos que no están en el formulario (referencia, precioCompra, etc.)
- Preserva la integridad de datos en ediciones
- Visible en logs qué campos se mantuvieron

---

## 📊 Impacto en el Flujo de Datos

### Flujo 1: Crear Producto desde Compra
```
ComprasManager
  ├─ agregarItem() 
  │   ├─ Captura: categoriaNombre (NUEVA CAPTURA)
  │   ├─ Captura: referencia (NUEVA CAPTURA)
  │   └─ Crea ItemCompra con todos los datos
  │
  └─ handleSave()
      └─ agregarOActualizarProducto()
          ├─ Valida: categoriaNombre (NUEVA VALIDACIÓN)
          ├─ Valida: Genera SKU si no existe
          └─ Crea Producto con:
              ├─ categoria: categoriaNombre (validada)
              ├─ referencia: del producto o auto-generada
              ├─ precioCompra: siempre incluido
              ├─ precioVenta: del item
              └─ imagen: del item
```

### Flujo 2: Actualizar Producto desde Compra
```
agregarOActualizarProducto()
  ├─ Busca por referencia (SKU)
  ├─ SI existe:
  │   └─ Actualiza variantes PERO:
  │       ├─ Mantiene: precioCompra original (SI item.precioCompra = 0 o undefined)
  │       ├─ Mantiene: precioVenta original (SI item.precioVenta = 0 o undefined)
  │       ├─ Mantiene: imagen original (SI item.imagen = vacío)
  │       ├─ Mantiene: categoria original (SI item.categoriaNombre = vacío)
  │       └─ Suma: cantidad en variantes
  └─ SI no existe:
      └─ Crea como producto nuevo
```

### Flujo 3: Editar Producto en ProductosManager
```
ProductosManager.handleSave()
  ├─ Crea productoData solo con campos del formulario
  ├─ Hace merge: {...editingProduct, ...productoData}
  └─ Mantiene automáticamente:
      ├─ referencia (no en el formulario)
      ├─ precioCompra (no en el formulario)
      ├─ createdFromSKU (no en el formulario)
      ├─ createdAt (se preserva)
      └─ Todos los campos no explícitamente sobrescritos
```

---

## 🧮 Lógica de Decisión para Actualizar Campos

### Regla General de Merge
```typescript
// Patrón usado en ComprasManager:
campo: (nuevoValor && nuevoValor > 0 && nuevoValor.trim?.() !== '')
  ? nuevoValor
  : valorExistente
```

### Aplicado a Cada Campo

| Campo | Lógica | Ejemplo |
|-------|--------|---------|
| `referencia` | Nunca cambia | SKU-001 → SKU-001 ✓ |
| `precioCompra` | Solo si nuevo > 0 | (0 → mantiene original) |
| `precioVenta` | Solo si nuevo > 0 | (0 → mantiene original) |
| `imagen` | Solo si no vacío | ("" → mantiene original) |
| `categoria` | Solo si no vacío | ("" → mantiene original) |
| `variantes` | Siempre actualiza | (Se suma cantidad) |
| `nombre` | No cambia desde Compras | Mantiene siempre |

---

## 🔄 Estados Posibles de un Producto

### Estado 1: Creado desde Compras
```javascript
{
  id: Date.now(),
  nombre: "Nombre del item",
  referencia: "SKU_[timestamp]_[random]" || "SKU del producto",
  categoria: "Categoría del item", // Validada
  precioCompra: itemCompra.precioCompra,
  precioVenta: itemCompra.precioVenta,
  variantes: [{talla: "", colores: [...]}],
  activo: true,
  createdAt: new Date(),
  createdFromSKU: referencia
}
```

### Estado 2: Actualizado desde Compras (mismo referencia)
```javascript
{
  id: ORIGINAL_ID,  // No cambia
  nombre: ORIGINAL_NOMBRE,  // No cambia
  referencia: ORIGINAL_REF,  // No cambia
  categoria: itemCompra.categoriaNombre || ORIGINAL_CATEGORIA,  // Usa nueva SI válida
  precioCompra: itemCompra.precioCompra > 0 ? ... : ORIGINAL,  // Usa nueva SI válida
  precioVenta: itemCompra.precioVenta > 0 ? ... : ORIGINAL,  // Usa nueva SI válida
  variantes: VARIANTES_SUMADAS,  // Suma cantidad
  activo: true,
  updatedAt: new Date(),
  lastUpdatedFrom: "Compra - [referencia]"
}
```

### Estado 3: Editado en ProductosManager
```javascript
{
  id: ORIGINAL_ID,  // Siempre se preserva
  nombre: NUEVO_NOMBRE,  // Si cambió
  referencia: ORIGINAL_REF,  // Se mantiene (no en form)
  categoria: NUEVA_CATEGORIA,  // Si cambió
  precioVenta: NUEVO_PRECIO,  // Si cambió
  variantes: NUEVAS_VARIANTES,  // Si cambió
  precioCompra: ORIGINAL_PRECIO_COMPRA,  // Se mantiene (no en form)
  createdFromSKU: ORIGINAL_VALUE,  // Se mantiene
  updatedAt: new Date()  // Se actualiza siempre
}
```

---

## ⚙️ Validaciones Implementadas

### En ComprasManager
1. ✅ `categoriaNombre` debe ser string no-vacío
2. ✅ `referencia` se captura o auto-genera
3. ✅ `precioCompra` y `precioVenta` deben ser > 0 para actualizar
4. ✅ `imagen` debe ser string no-vacío para actualizar

### En ProductosManager  
1. ✅ `editingProduct` ID se preserva siempre
2. ✅ Campos del formulario se aplican (merge)
3. ✅ Campos no del formulario se mantienen automáticamente

### En agregarOActualizarProducto
1. ✅ SKU se genera si no existe
2. ✅ Búsqueda es case-insensitive
3. ✅ Categoría se valida antes de usar
4. ✅ Precios se validan antes de actualizar
5. ✅ Imagen se valida antes de actualizar

---

## 🧪 Casos de Prueba Críticos

### Test: Crear producto sin llenar imagen
```typescript
// Input
itemCompra = {
  productoNombre: "Camisa",
  categoriaNombre: "Camisas",
  imagen: "",  // VACÍO
  precioVenta: 50000
}

// Expected Output
nuevoProducto.imagen = ""  // Vacío está bien para nuevos
```

### Test: Actualizar sin cambiar imagen
```typescript
// Input
productoExistente.imagen = "url.jpg"
itemCompra.imagen = ""  // VACÍO

// Expected Output
productoActualizado.imagen = "url.jpg"  // Se mantiene original
```

### Test: Actualizar sin cambiar precios
```typescript
// Input
productoExistente.precioCompra = 25000
itemCompra.precioCompra = 0  // CERO

// Expected Output
productoActualizado.precioCompra = 25000  // Se mantiene original
```

### Test: Cambiar categoría en edición
```typescript
// Input
editingProduct.categoria = "Camisas"
formData.categoria = "Accesorios"  // CAMBIO

// Expected Output
productoActualizado.categoria = "Accesorios"  // Se actualiza
productoActualizado.referencia = editingProduct.referencia  // Se mantiene
```

---

## 📈 Mejoras Implementadas

| Mejora | Beneficio |
|--------|-----------|
| Validación de categoriaNombre | Evita "Sin categoría" innecesarios |
| Merge en lugar de sobrescritura | Preserva datos no editados |
| Generación automática de SKU | Permite items sin referencia |
| Validación de precios > 0 | Evita sobrescribir con 0 |
| Validación de strings no-vacíos | Evita perder datos a cadenas vacías |
| Logs detallados | Facilita debugging |
| Preservación de ID en ediciones | Evita conflictos de integridad |

---

## 🚀 Próximas Mejoras Sugeridas

1. **Versionado de Cambios**: Agregar historial de cambios en cada producto
2. **Validación en UI**: Mostrar errores de categoría faltante antes de guardar
3. **Confirmación de Merge**: Mostrar qué datos se mantendrán antes de editar
4. **Caché Inteligente**: No recargar productos si no cambiaron
5. **Sincronización bidireccional**: Que ediciones en Productos se reflejen en Compras

---

**Versión Técnica**: 2026-01-29
**Compilación**: ✅ Exitosa (sin errores)
**Cobertura**: ComprasManager.tsx + ProductosManager.tsx
**Compatibilidad**: Backward compatible con datos existentes
