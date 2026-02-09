# 📊 Mapa Visual: Sincronización Compras ↔ Productos

## 🗺️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                   USUARIO FINAL                             │
│              (Módulo de Compras)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                    Usuario hace clic
                   "Crear Compra"
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            ComprasManager.tsx (1487 líneas)                 │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. handleSave()                                       │  │
│  │    ├─ Valida campos                                  │  │
│  │    ├─ Crea objeto Compra                             │  │
│  │    ├─ Guarda en localStorage['damabella_compras']    │  │
│  │    │                                                  │  │
│  │    ├─ Actualiza stocks (productos existentes)        │  │
│  │    │  └─ stock += cantidad_comprada                  │  │
│  │    │                                                  │  │
│  │    └─ ✨ CREA NUEVOS PRODUCTOS                       │  │
│  │       ├─ Para cada item sin id existente             │  │
│  │       ├─ Genera id único                             │  │
│  │       ├─ Asigna categoría (del selector)             │  │
│  │       ├─ Asigna imagen (si se proporcionó)           │  │
│  │       ├─ Asigna referencia (o auto-genera)           │  │
│  │       └─ Guarda en localStorage['damabella_productos']│  │
│  │                                                        │  │
│  │    └─ Muestra notificación de éxito                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 2. agregarItem()                                      │  │
│  │    ├─ Valida campos obligatorios                      │  │
│  │    │  ├─ Producto ✓                                  │  │
│  │    │  ├─ Talla ✓                                     │  │
│  │    │  ├─ Color ✓                                     │  │
│  │    │  ├─ Cantidad ✓                                  │  │
│  │    │  ├─ Precios ✓                                   │  │
│  │    │  └─ CATEGORÍA ✓ ← NUEVO                         │  │
│  │    │                                                  │  │
│  │    ├─ Si falta algo → Error                          │  │
│  │    └─ Si OK → Agrega a tabla                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 3. useEffect (Sincronización de Categorías)           │  │
│  │    ├─ Carga desde localStorage['damabella_categorias']│  │
│  │    ├─ Escucha cambios en otros tabs (Storage Event)  │  │
│  │    └─ Poll cada 500ms para mismo tab                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 4. Estados (State)                                   │  │
│  │    ├─ formData: { items: [ { ... } ] }              │  │
│  │    ├─ nuevoItem: { productoId, talla, color, ...}   │  │
│  │    ├─ productos: [ { id, nombre, ... } ]             │  │
│  │    ├─ categorias: [ { id, name, active } ] ← NUEVO  │  │
│  │    └─ compras: [ { id, items, ... } ]               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
        localStorage['damabella_productos']
        localStorage['damabella_compras']
        localStorage['damabella_categorias']
        localStorage['damabella_tallas']
        localStorage['damabella_colores']
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Módulo Productos                               │
│         (ProductosManager.tsx)                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Muestra nuevos productos creados automáticamente      │  │
│  │ ✅ Con categoría                                      │  │
│  │ ✅ Con stock (cantidad de la compra)                  │  │
│  │ ✅ Con precios (compra y venta)                       │  │
│  │ ✅ Con talla y color                                 │  │
│  │ ✅ Con imagen (si se proporcionó)                    │  │
│  │ ✅ Con referencia (si se proporcionó o auto-generada)│  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos Detallado

### 1️⃣ Usuario Abre Nueva Compra
```
┌──────────────────────┐
│   Modal abierto      │
│  Categorías se cargan│
│   desde localStorage │
└──────────────────────┘
     │
     └─→ useEffect
         └─→ localStorage.getItem('damabella_categorias')
             └─→ setState(categorias)
```

### 2️⃣ Usuario Rellena Formulario
```
┌──────────────────────────────────────────┐
│  Form Input Fields                       │
│  ├─ Proveedor (select)                  │
│  ├─ Fecha (date picker)                 │
│  ├─ Producto (select dinámico)          │
│  ├─ Talla (select o crear)              │
│  ├─ Color (picker + text)               │
│  ├─ Cantidad (number)                   │
│  ├─ Precio Compra (number)              │
│  ├─ Precio Venta (number)               │
│  ├─ CATEGORÍA (select) ← NUEVO          │
│  ├─ Imagen (text URL) ← NUEVO           │
│  └─ Referencia (text SKU) ← NUEVO       │
│                                           │
│  onChange → setState(nuevoItem)         │
└──────────────────────────────────────────┘
```

### 3️⃣ Usuario Hace Clic "Agregar Producto"
```
┌─────────────────────────────────────────┐
│  agregarItem()                          │
│  ├─ Validar todos campos                │
│  │  ├─ Si falta:                       │
│  │  │  ├─ Mostrar error                │
│  │  │  └─ Return (no agregar)          │
│  │  │                                   │
│  │  ├─ Si falta CATEGORÍA: ← NUEVO    │
│  │  │  ├─ Mostrar error específico    │
│  │  │  └─ Return (no agregar)          │
│  │  │                                   │
│  │  └─ Si TODO OK:                      │
│  │     └─ Continuar                    │
│  │                                      │
│  ├─ Crear objeto ItemCompra con:       │
│  │  ├─ productoId                      │
│  │  ├─ productoNombre                  │
│  │  ├─ talla                           │
│  │  ├─ color                           │
│  │  ├─ cantidad                        │
│  │  ├─ precioCompra                    │
│  │  ├─ precioVenta                     │
│  │  ├─ categoriaId ← NUEVO             │
│  │  ├─ categoriaNombre ← NUEVO         │
│  │  ├─ imagen ← NUEVO                  │
│  │  └─ referencia ← NUEVO              │
│  │                                      │
│  ├─ Agregar a formData.items[]         │
│  ├─ Limpiar nuevoItem state            │
│  └─ Mostrar en tabla                   │
└─────────────────────────────────────────┘
```

### 4️⃣ Tabla Muestra Items Agregados
```
┌────────────────────────────────────────────────────────────────┐
│ Tabla de Items Agregados                                       │
├────────────────────────────────────────────────────────────────┤
│ Producto | Categoría | Talla | Color | Cant | P.C | P.V | Tot │
├────────────────────────────────────────────────────────────────┤
│ Camisa   │ 🔵 Ropa   │ L     │ Azul  │ 20   │ 12k │ 28k │ 240k│
│ Pantalón │ 🟢 Ropa   │ 30    │ Negro │ 15   │ 18k │ 42k │ 270k│
├────────────────────────────────────────────────────────────────┤
│ Subtotal: $510.000 | IVA 19%: $96.900 | Total: $606.900      │
└────────────────────────────────────────────────────────────────┘
```

### 5️⃣ Usuario Hace Clic "Crear Compra"
```
┌───────────────────────────────────────────────────────────────┐
│  handleSave()                                                  │
│                                                                │
│  PASO 1: Validaciones                                          │
│  ├─ ¿Proveedor seleccionado?                                 │
│  ├─ ¿Fecha ingresada?                                        │
│  ├─ ¿Al menos 1 item?                                        │
│  └─ Si todo OK → Continuar                                   │
│                                                                │
│  PASO 2: Crear Compra                                         │
│  ├─ compraData = {                                           │
│  │    id, numeroCompra, proveedorId, fechaCompra,            │
│  │    items[], subtotal, iva, total, estado,                │
│  │    observaciones, createdAt                               │
│  │  }                                                          │
│  └─ setCompras([...compras, compraData])                     │
│                                                                │
│  PASO 3: Actualizar localStorage['damabella_compras']        │
│  ├─ useEffect detecta cambio                                 │
│  └─ localStorage.setItem('damabella_compras', JSON)          │
│                                                                │
│  PASO 4: Actualizar Stocks (Productos Existentes)            │
│  ├─ Para cada producto en BD:                                │
│  │  ├─ ¿Tiene items en la compra?                           │
│  │  └─ Si SÍ:                                               │
│  │     └─ stock += cantidad_total_items                      │
│  │                                                             │
│  ├─ productosActualizados = [...]                           │
│  └─ localStorage.setItem('damabella_productos', JSON)        │
│                                                                │
│  PASO 5: CREAR NUEVOS PRODUCTOS ✨                            │
│  ├─ Para cada item en formData.items:                        │
│  │  ├─ ¿El producto YA EXISTE en BD?                        │
│  │  │  ├─ SÍ → Stock ya se actualizó en Paso 4             │
│  │  │  └─ NO → Crear nuevo producto                         │
│  │  │                                                         │
│  │  └─ Si es NUEVO:                                          │
│  │     ├─ Generar ID único                                   │
│  │     ├─ nuevoProducto = {                                  │
│  │     │    id, nombre, categoria, categoriaId,              │
│  │     │    stock (= cantidad), precioCompra, precioVenta,  │
│  │     │    tallas: [talla], colores: [color],              │
│  │     │    imagen, referencia (o auto-gen),                │
│  │     │    activo: true, descripcion, createdAt            │
│  │     │  }                                                   │
│  │     └─ productosFinales.push(nuevoProducto)              │
│  │        productosCreados.push(nombre)                      │
│  │                                                             │
│  ├─ localStorage.setItem('damabella_productos', JSON)        │
│  └─ setProductos(productosFinales)                           │
│                                                                │
│  PASO 6: Mostrar Notificación                                 │
│  ├─ Si productosCreados.length > 0:                          │
│  │  └─ "✅ Compra guardada | 🆕 2 producto(s) creado(s)"    │
│  └─ Si no:                                                    │
│     └─ "✅ Compra guardada correctamente"                    │
│                                                                │
│  PASO 7: Limpiar Formulario                                   │
│  ├─ setFormData({...empty})                                  │
│  ├─ setFormErrors({})                                        │
│  ├─ setItemsError('')                                        │
│  └─ setShowModal(false)                                      │
│                                                                │
│  PASO 8: Console Logs ✅                                      │
│  ├─ 🆕 [Producto Creado] Camisa Azul - Stock: 20            │
│  ├─ 📦 [Producto] Pantalón: Stock 30 + 15 = 45              │
│  └─ ✅ [ComprasManager] Stock actualizado                    │
└───────────────────────────────────────────────────────────────┘
```

---

## 📦 Estructuras de Datos

### ItemCompra (Interfaz Expandida)
```typescript
interface ItemCompra {
  // Campos existentes
  id: string;
  productoId: string;
  productoNombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioCompra: number;
  precioVenta: number;
  subtotal?: number;
  
  // NUEVOS CAMPOS ✨
  categoriaId?: string;        // ID de categoría
  categoriaNombre?: string;    // Nombre de categoría
  imagen?: string;             // URL o ruta de imagen
  referencia?: string;         // SKU o código único
}
```

### Producto Creado Automáticamente
```typescript
{
  id: "prod_1704067200000_abc123def",        // Auto-generado
  nombre: "Camisa Azul",                     // Del item.productoNombre
  categoria: "Ropa",                         // Del item.categoriaNombre
  categoriaId: "cat_001",                    // Del item.categoriaId
  stock: 20,                                 // = item.cantidad
  precioCompra: 12000,                       // Del item.precioCompra
  precioVenta: 28000,                        // Del item.precioVenta
  talla: ["L"],                              // Array con [item.talla]
  tallas: ["L"],
  color: "Azul",                             // Del item.color
  colores: ["Azul"],
  imagen: "https://example.com/camisa.jpg",  // Del item.imagen
  referencia: "SKU-CAMISA-AZ-L",             // Del item.referencia
  activo: true,                              // Auto-set
  descripcion: "Producto creado desde compra COMP-001",  // Auto
  createdAt: "2024-01-15T10:30:00Z"         // Auto-timestamp
}
```

---

## 🔀 Caminos de Ejecución

### Escenario 1: Item Nuevo (Producto NO existe)
```
agregarItem() ✓
    ↓
handleSave()
    ├─ Guardar compra ✓
    ├─ Actualizar stocks (skip, no existe)
    └─ CREAR NUEVO PRODUCTO ✨
        ├─ Verificar que no existe → SÍ es nuevo
        ├─ Crear objeto con datos del item
        └─ Agregar a productosFinales
             ↓
        localStorage['damabella_productos']
             ↓
        Módulo Productos muestra el nuevo producto
```

### Escenario 2: Item Existente (Producto YA existe)
```
agregarItem() ✓
    ↓
handleSave()
    ├─ Guardar compra ✓
    ├─ Actualizar stocks
    │  ├─ Encontrar producto por ID
    │  └─ stock += cantidad
    └─ CREAR NUEVO PRODUCTO
        ├─ Verificar que existe → NO es nuevo
        └─ SKIP (no crear)
             ↓
        localStorage['damabella_productos']
        (actualizado, sin duplicados)
             ↓
        Módulo Productos muestra stock actualizado
```

### Escenario 3: Sin Categoría (Error)
```
agregarItem()
    ├─ Validar campos ✓
    ├─ Verificar categoriaId
    │  └─ NO existe ✗
    └─ Mostrar error
        └─ "Por favor selecciona una categoría"
             ↓
        ❌ Item NO se agrega
        ❌ Estado no cambia
```

---

## 📊 localStorage Keys

```
localStorage = {
  // Existentes
  'damabella_compras': [ {...}, {...} ],
  'damabella_productos': [ {...}, {...} ],
  'damabella_proveedores': [ {...}, {...} ],
  'damabella_tallas': [ {...}, {...} ],
  'damabella_colores': [ {...}, {...} ],
  'damabella_compra_counter': '42',
  
  // NUEVO ✨
  'damabella_categorias': [ {...}, {...} ]
}
```

---

## 🎯 Puntos de Sincronización

```
Usuario hace clic "Crear Compra"
              │
              ▼
    handleSave() ejecuta
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
  Compra   Stocks   Productos
    │         │         │
    └─────────┼─────────┘
              │
              ▼
    localStorage actualiza
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
  Compras  Productos  Categorías
   módulo   módulo    sincronizadas
              │
              ▼
    useEffect detecta cambios
              │
              ▼
    React re-renderiza componentes
              │
              ▼
    ✅ UI actualizada
```

---

## 🧪 Validaciones Visualizadas

```
┌─────────────────────────────────────────────┐
│  Validaciones en agregarItem()              │
│                                              │
│  if (!productoId)        ❌ Error           │
│  if (!color)             ❌ Error           │
│  if (!cantidad)          ❌ Error           │
│  if (!precioCompra)      ❌ Error           │
│  if (!precioVenta)       ❌ Error           │
│  if (!categoriaId) ✨    ❌ Error ← NUEVO  │
│                                              │
│  Todos OK ✓              ✅ Agregar item   │
└─────────────────────────────────────────────┘
```

---

## 📈 Impacto en Performance

```
Sin la funcionalidad:
  User Input → handleSave() → 1 localStorage write

Con la funcionalidad:
  User Input → handleSave() → 3 localStorage writes
                                 (compras + productos + update)
  
  Impacto: Mínimo
  Razón: localStorage es muy rápido (<1ms)
```

---

## ✅ Estado de la Implementación

```
┌──────────────────────────────────────────┐
│  Componentes Implementados                │
│                                            │
│  ✅ Interface ItemCompra expandida        │
│  ✅ Estado categorias                     │
│  ✅ useEffect sincronización categorías   │
│  ✅ Campos formulario nuevos              │
│  ✅ Validación categoría                  │
│  ✅ Tabla actualizada                     │
│  ✅ Lógica creación automática            │
│  ✅ Notificaciones mejoradas              │
│  ✅ Console logs informativos             │
│  ✅ Sin errores TypeScript                │
│                                            │
│  Estado: ✅ 100% COMPLETADO               │
└──────────────────────────────────────────┘
```

---

**Última actualización**: Enero 2024
**Diagrama versión**: 1.0
