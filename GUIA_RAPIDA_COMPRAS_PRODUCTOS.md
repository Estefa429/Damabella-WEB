# ⚡ Guía Rápida - Flujo Correcto Compras-Productos

## 🎯 Lo Importante

### ✅ Compras ES el ORIGEN
- Define productos, categorías, colores, precios, tallas
- Puede crear productos que NO existen en Productos
- Los datos vienen de lo que escribas en el formulario

### ✅ Productos ES el DISPLAY
- Solo muestra lo que vino de Compras
- Permite editar, pero PRESERVA datos con merge
- No tiene colores pre-cargados

### ✅ Categoría ES OBLIGATORIA
- En Compras: debe seleccionar una categoría
- Si no viene categoría: se queda como "Sin categoría" (AVISO en consola)
- En Productos: se preserva la categoría

---

## 📱 Pasos para Crear Compra Correcta

### 1. Abrir Compras → Nueva Compra

### 2. Llenar Datos Generales
```
Proveedor: Selecciona uno
Fecha: Hoy (por defecto)
IVA: 19% (por defecto)
```

### 3. Agregar Producto (puede no existir)
```
📝 NOMBRE: "Mi Producto" (LIBRE - puede ser uno nuevo)

📁 CATEGORÍA: Selecciona del dropdown (OBLIGATORIO)
   ├─ Vestidos Cortos
   ├─ Vestidos Largos
   ├─ Sets
   └─ Enterizos

📐 TALLA: Selecciona o crea (global, no del producto)
   └─ XS, S, M, L, XL, XXL, o nueva custom

🎨 COLOR: Selecciona de paleta o escribe (LIBRE)
   ├─ De COLOR_MAP: Negro, Blanco, Rojo, Azul, Verde, etc.
   └─ Custom: "Morado Oscuro", "Verde Neon", etc.

🔢 CANTIDAD: Número (cuánto compras)

💰 PRECIO COMPRA: Número (a cuánto me costó)

💰 PRECIO VENTA: Número (a cuánto lo vendo)

🖼️ IMAGEN: URL/Ruta (opcional, para display)

📋 REFERENCIA: Código único (opcional, se genera automático)
```

### 4. Agregar Producto (botón)
- Verifica en consola que aparezca el item
- Puedes agregar más items

### 5. Guardar Compra
```
✅ Si todo está bien:
   "Compra guardada correctamente | 🆕 X nuevos | 📦 Y actualizados en Productos"

❌ Si algo falla:
   "Por favor completa: [campo]"
```

### 6. Verificar en Productos
```
El producto debería aparecer con:
✅ Nombre: exactamente lo que escribiste
✅ Categoría: la que seleccionaste (NO "Sin categoría")
✅ Talla/Color: exactamente lo que agregaste
✅ Precios: los que pusiste
✅ NO debería tener colores extras
```

---

## 🔍 Verificar en Consola (F12 → Console)

### Al guardar compra con producto NUEVO:
```
🆕 [agregarOActualizarProducto] Creando nuevo producto: Camisa Azul
   Categoría capturada: "Vestidos Cortos"
   SKU: SKU_1706182400000_A7K2M
   Categoría: Vestidos Cortos
   Precio Compra: $25000
   Precio Venta: $45000
   Imagen: ✓ Sí (o ✗ No)
   Variantes: [{"talla":"M","colores":[{"color":"Azul","cantidad":10}]}]

✅ [agregarOActualizarProducto] Nuevo producto creado:
   Nombre: Camisa Azul
   SKU: SKU_1706182400000_A7K2M
   Categoría: Vestidos Cortos
   Precio Compra: $25000
   Precio Venta: $45000
   Imagen: ✓ Sí
   Variantes: [...]
```

### Al guardar compra con producto EXISTENTE:
```
✏️ [agregarOActualizarProducto] Actualizando producto existente: Camisa Azul
   Producto actual: {nombre, categoria, precioCompra, precioVenta, imagen}

✅ [agregarOActualizarProducto] Camisa Azul actualizado:
   Talla: M, Color: Azul, Cantidad: 10
   Precios mantenidos - Compra: $25000, Venta: $45000
   Categoría: Vestidos Cortos
   Imagen mantenida: Sí
```

---

## 🚨 Si Algo Sale Mal

### ❌ Error: "Por favor completa: nombre del producto"
**Causa**: No escribiste nombre ni seleccionaste producto  
**Solución**: Escribe el nombre del producto en el campo "Nombre del Producto"

### ❌ Error: "Por favor selecciona una categoría"
**Causa**: No seleccionaste categoría  
**Solución**: Selecciona una categoría del dropdown

### ❌ Aparecen colores como "Rojo", "Negro", etc. sin querer
**Causa**: Hay productos temporales en localStorage  
**Solución**: Limpia localStorage:
```javascript
// En DevTools Console:
localStorage.removeItem('damabella_productos');
location.reload();
```

### ❌ La categoría se pierde al editar
**Causa**: La edición no está haciendo merge  
**Solución**: Verifica en ProductosManager que handleSave() tenga:
```typescript
const productoActualizado = {
  ...editingProduct,  // Todo anterior
  ...productoData,    // Cambios
  id: editingProduct.id
};
```

### ❌ Los precios se sobrescriben con 0
**Causa**: Validación de agregarOActualizarProducto no funciona  
**Solución**: Verifica que tenga `precioCompra && precioCompra > 0`

---

## 📊 Casos de Uso

### Caso 1: Nuevo Producto, Primera Compra
```
Compra 001:
├─ Producto nuevo: "Vestido A"
├─ Color: Azul, Talla: M, Cant: 5
├─ Categoría: Vestidos Cortos
└─ Resultado en Productos: Crea nuevo con Azul/M/5
```

### Caso 2: Mismo Producto, Segundo Color/Talla
```
Compra 001:
├─ Producto: "Vestido A"
├─ Color: Azul, Talla: M, Cant: 5
└─ En Productos: Crea Vestido A con Azul/M/5

Compra 002:
├─ Producto: "Vestido A"  (mismo nombre/SKU)
├─ Color: Rojo, Talla: L, Cant: 3
└─ En Productos: Actualiza Vestido A
                 - Azul/M/5 (anterior)
                 - Rojo/L/3 (nuevo)
                 - Categoría: Vestidos Cortos (preservada)
```

### Caso 3: Editar Producto en Productos
```
Producto: "Vestido A"
├─ Tiene: Categoría "Vestidos Cortos", Precio 45000, Imagen "x.jpg"
└─ Usuario edita solo el nombre a "Vestido A XL"

Resultado:
├─ Nombre: "Vestido A XL" (cambió)
├─ Categoría: "Vestidos Cortos" (se preservó)
├─ Precio: 45000 (se preservó)
└─ Imagen: "x.jpg" (se preservó)
```

---

## ✅ Checklist Antes de Guardar

```
Antes de hacer click en "Guardar Compra":

□ Proveedor seleccionado
□ Fecha completada
□ IVA >= 0
□ Para cada Producto:
  □ Nombre: Escrito o seleccionado
  □ Categoría: Seleccionada del dropdown
  □ Talla: Seleccionada o creada
  □ Color: Seleccionado o escrito
  □ Cantidad: > 0
  □ Precio Compra: > 0
  □ Precio Venta: > 0

Si todo está ✅ → Guardar
Si algo está ❌ → El sistema te dirá qué falta
```

---

## 🎓 Conceptos Clave

### SKU (Referencia)
- Identificador ÚNICO del producto
- Se genera automático: `SKU_[timestamp]_[random]`
- Se usa para buscar si el producto existe
- Si 2 compras tienen el mismo SKU → se actualizan en lugar de crear 2

### Merge Inteligente
```
merge({...anterior}, {...cambios}) = 
  {
    ...campos_que_no_cambiaste,  // Se preservan
    ...campos_que_si_cambiaste   // Se actualizan
  }
```

### Origen vs Display
- **Compras (Origen)**: De aquí vienen los datos
- **Productos (Display)**: Aquí se ven y editan, sin perder

---

## 🔗 Documentos Relacionados

- **PLAN_PRUEBAS_COMPRAS_PRODUCTOS_NUEVO.md** → Pruebas detalladas
- **ARQUITECTURA_CORREGIDA_COMPRAS_PRODUCTOS.md** → Diagramas y flujos
- **RESUMEN_CAMBIOS_COMPRAS_PRODUCTOS_NUEVO.md** → Cambios técnicos

