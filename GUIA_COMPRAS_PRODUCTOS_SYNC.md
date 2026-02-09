# Guía: Sincronización Automática Compras → Productos

## 📋 Descripción General

Cuando creas una **Compra** en el módulo de **Compras**, el sistema ahora **crea automáticamente los productos** en el módulo de **Productos** con todos los datos especificados.

## ✨ Características Nuevas

### 1. **Selector de Categoría**
- Cada producto que agregues a una compra debe tener una **categoría asignada**
- Las categorías vienen del módulo de **Configuración > Categorías**
- La categoría se guarda en el producto cuando se crea

### 2. **Campo de Imagen**
- Puedes agregar la **URL o ruta** de la imagen del producto
- La imagen se guarda en el módulo de Productos
- Es opcional pero recomendado para mejor identificación

### 3. **Referencia (SKU)**
- Campo para asignar un **código único** al producto (REF-001, SKU-ABC, etc.)
- Si no lo proporcionas, se genera automáticamente
- Útil para rastreo y control de inventario

### 4. **Creación Automática de Productos**
- Al presionar "**Crear Compra**":
  1. Se guarda la compra en el módulo de Compras
  2. Se actualizan stocks de productos existentes
  3. **Se crean nuevos productos** en el módulo de Productos con:
     - Nombre del producto
     - Categoría asignada
     - Talla
     - Color
     - Stock inicial (cantidad comprada)
     - Precio de compra
     - Precio de venta
     - Imagen
     - Referencia
     - Descripción (incluye número de compra)

## 🔧 Cómo Usar

### Paso 1: Crear una Compra
1. Abre el módulo de **Compras**
2. Haz clic en **+ Nueva Compra**

### Paso 2: Completar Datos Generales
- **Proveedor**: Selecciona de la lista
- **Fecha Compra**: Selecciona la fecha
- **IVA**: Ingresa el porcentaje (ej: 19)

### Paso 3: Agregar Productos a la Compra

Para cada producto que desees agregar:

#### a) Información del Producto
- **Producto**: Selecciona un producto existente o ingresa uno nuevo
  - Si es nuevo, aparecerá como "Producto desconocido" pero se creará en Productos

#### b) Características (Obligatorio)
- **Talla**: Selecciona una talla o crea una nueva
- **Color**: Elige de la paleta o ingresa nombre/HEX
  - Paleta incluye: Negro, Blanco, Rojo, Azul, Verde, Rosa, Gris, Beige
  - También aceptas HEX (#FF0000)

#### c) Cantidad y Precios (Obligatorio)
- **Cantidad**: Número de unidades compradas
- **Precio Compra**: Precio unitario de compra
- **Precio Venta**: Precio sugerido de venta

#### d) Datos de Producto (IMPORTANTE para sincronización)
- **Categoría del Producto**: Selecciona la categoría (OBLIGATORIO)
  - Las categorías se gestionan en **Configuración > Categorías**
  - Ejemplo: Ropa, Accesorios, Zapatos, etc.
  
- **Imagen del Producto**: Ingresa URL o ruta (opcional)
  - Ejemplo: `https://example.com/imagen.jpg`
  - O: `assets/productos/camisa-roja.jpg`
  
- **Referencia (SKU)**: Código único del producto (opcional)
  - Ejemplo: `REF-001`, `SKU-CAMISA-RJ`, `COMP-001-ITEM-1`
  - Si no lo ingrestas, se genera automáticamente

### Paso 4: Revisar Items
Verás una tabla con todos los productos agregados mostrando:
- Nombre del producto
- **Categoría** (en badge azul)
- Talla
- Color (con cuadro visual)
- Cantidad
- Precios
- Subtotal

### Paso 5: Crear Compra
1. Revisa el resumen: Subtotal, IVA, Total
2. Haz clic en **Crear Compra**
3. El sistema automáticamente:
   - ✅ Guarda la compra
   - ✅ Actualiza stocks de productos existentes
   - ✅ Crea nuevos productos en el módulo de Productos

## 📊 Datos Sincronizados

### Cuando se crea un producto desde una compra:

```
Nuevo Producto en Productos = {
  nombre: "Camisa Azul",
  categoria: "Ropa",
  categoriaId: "cat_001",
  stock: 10,                    // Cantidad de la compra
  precioCompra: 15000,
  precioVenta: 35000,
  talla: ["M"],                 // Array con talla del item
  tallas: ["M"],
  color: "Azul",
  colores: ["Azul"],
  imagen: "https://example.com/camisa.jpg",
  referencia: "REF-CAMISA-AZ",
  activo: true,
  descripcion: "Producto creado desde compra COMP-001",
  createdAt: "2024-01-15T10:30:00Z"
}
```

## 🔄 Sincronización de Datos

### Storage Keys Utilizadas
- `damabella_compras` - Guarda las compras
- `damabella_productos` - Guarda los productos
- `damabella_categorias` - Categorías disponibles
- `damabella_tallas` - Tallas globales
- `damabella_colores` - Colores disponibles
- `damabella_proveedores` - Proveedores

### Sincronización Automática
- Los datos se sincronizan en tiempo real entre pestañas
- Los cambios en Productos se reflejan inmediatamente en Compras
- Los cambios en Categorías se reflejan automáticamente

## ✅ Checklist de Uso Correcto

- [ ] Categorías creadas en **Configuración > Categorías**
- [ ] Proveedor seleccionado
- [ ] Fecha de compra establecida
- [ ] Para cada producto:
  - [ ] Producto seleccionado o nombre ingresado
  - [ ] Talla elegida o creada
  - [ ] Color seleccionado
  - [ ] Cantidad ingresada (> 0)
  - [ ] Precio Compra ingresado (> 0)
  - [ ] Precio Venta ingresado (> 0)
  - [ ] **Categoría OBLIGATORIA seleccionada**
  - [ ] Imagen ingresada (opcional pero recomendado)
  - [ ] Referencia ingresada (opcional)
- [ ] Al menos un producto agregado
- [ ] Revisar tabla de items
- [ ] Hacer clic en **Crear Compra**

## 🎯 Ejemplos Prácticos

### Ejemplo 1: Compra de Camisas
```
Producto: Camisa Manga Larga
Cantidad: 20 unidades
Talla: L
Color: Blanco
P. Compra: $12,000
P. Venta: $28,000
Categoría: Ropa (OBLIGATORIO)
Imagen: assets/camisas/manga-larga-blanca.jpg
Referencia: SKU-CAMISA-ML-BL

→ Se crea automáticamente en Productos:
  - Stock inicial: 20
  - Con categoría: Ropa
  - Con imagen asignada
  - Con referencia: SKU-CAMISA-ML-BL
```

### Ejemplo 2: Compra de Accesorios
```
Producto: Cinturón Piel
Cantidad: 15 unidades
Talla: Único
Color: Negro
P. Compra: $8,000
P. Venta: $18,000
Categoría: Accesorios (OBLIGATORIO)
Imagen: (dejar vacío)
Referencia: CINTURON-PL-01

→ Se crea automáticamente en Productos:
  - Stock inicial: 15
  - Con categoría: Accesorios
  - Sin imagen
  - Con referencia: CINTURON-PL-01
```

## 📱 Notificaciones

Después de crear la compra, verás un mensaje como:
```
✅ Compra guardada correctamente | 🆕 3 producto(s) creado(s) en Productos
```

Esto indica que:
- 1 compra fue guardada
- 3 nuevos productos fueron creados en el módulo de Productos

## 🔍 Verificación

Para verificar que los productos se crearon correctamente:

1. Abre el módulo **Productos**
2. Busca los productos por:
   - Nombre (ej: "Camisa Azul")
   - Categoría
   - Referencia
3. Deberías ver:
   - Stock actualizado
   - Categoría asignada
   - Talla y color guardados
   - Imagen y referencia (si se proporcionaron)

## ⚠️ Notas Importantes

1. **Categoría Obligatoria**: No puedes crear una compra sin asignar categoría a cada producto
2. **Stocks se suman**: Si el producto ya existe, el stock se incrementa
3. **Nuevos Productos**: Si el producto no existe en Productos, se crea con el stock de la compra
4. **Datos Guardados en localStorage**: Todos los datos se guardan localmente en el navegador
5. **Sincronización**: Los cambios se sincronizan automáticamente entre pestañas abiertas

## 🐛 Solución de Problemas

### "No puedo seleccionar categoría"
- Verifica que existan categorías en **Configuración > Categorías**
- Si no existen, crea al menos una

### "El producto no aparece después de crear la compra"
- Abre el módulo de **Productos** y recarga la página (F5)
- Busca el producto por nombre

### "La imagen no se muestra"
- Verifica que la URL de imagen sea válida
- Comprueba que el enlace sea accesible

### "Stock no se actualizó"
- Verifica que el producto ya existe en Productos
- Si es nuevo, debería tener el stock de la compra
- Recarga la página si es necesario

## 📞 Soporte

Si tienes problemas:
1. Abre la Consola (F12 → Console)
2. Busca mensajes con 🆕 [Producto Creado] para verificar creación
3. Busca mensajes con 📦 [Producto] para verificar actualización de stocks
