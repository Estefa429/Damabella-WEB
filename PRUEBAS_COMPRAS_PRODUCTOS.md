# 🧪 Guía de Pruebas: Sincronización Compras ↔ Productos

## 📋 Escenarios de Prueba

### ESCENARIO 1: Crear Compra con Nuevos Productos
**Objetivo**: Verificar que nuevos productos se crean automáticamente

#### Precondiciones:
- ✅ Existen categorías en Configuración > Categorías (ej: "Ropa")
- ✅ Existen proveedores en el sistema
- ✅ Base de datos de productos vacía o sin los productos a probar

#### Pasos:
1. Ir a **Compras** → **+ Nueva Compra**
2. Seleccionar:
   - Proveedor: "Proveedor A"
   - Fecha: 15/01/2024
   - IVA: 19
3. Agregar Producto 1:
   - Producto: "Camisa Azul" (nuevo, no existe)
   - Talla: "L"
   - Color: "Azul" (seleccionar de paleta)
   - Cantidad: 20
   - P. Compra: 12000
   - P. Venta: 28000
   - **Categoría: "Ropa"** ← OBLIGATORIO
   - Imagen: `https://example.com/camisa-azul.jpg`
   - Referencia: `SKU-CAMISA-AZ-L`
4. Hacer clic en **"Agregar Producto"**
5. Verificar que aparece en la tabla con:
   - Producto: "Camisa Azul"
   - Categoría: badge azul con "Ropa"
   - Color: cuadro visual azul + texto "Azul"
   - Cantidad: 20
   - Subtotal: $240.000
6. Hacer clic en **"Crear Compra"**

#### Resultados Esperados:
```
✅ Notificación: "Compra guardada correctamente | 🆕 1 producto(s) creado(s) en Productos"
```

#### Verificación en Productos:
1. Ir a módulo **Productos**
2. Buscar "Camisa Azul"
3. Debe existir con:
   - Nombre: "Camisa Azul"
   - Categoría: "Ropa"
   - Stock: 20
   - Precio Compra: $12.000
   - Precio Venta: $28.000
   - Talla: ["L"]
   - Color: ["Azul"]
   - Imagen: URL guardada
   - Referencia: "SKU-CAMISA-AZ-L"
   - Descripción: "Producto creado desde compra COMP-XXX"

---

### ESCENARIO 2: Crear Compra con Producto Existente
**Objetivo**: Verificar que stocks se actualizan en productos existentes

#### Precondiciones:
- ✅ Producto "Pantalón Negro" existe en Productos con stock actual = 30
- ✅ Existe categoría "Ropa"

#### Pasos:
1. Ir a **Compras** → **+ Nueva Compra**
2. Seleccionar:
   - Proveedor: "Proveedor B"
   - Fecha: 15/01/2024
   - IVA: 19
3. Agregar Producto:
   - Producto: "Pantalón Negro" (EXISTENTE)
   - Talla: "30" (existente en producto)
   - Color: "Negro" (existente en producto)
   - Cantidad: 15
   - P. Compra: 18000
   - P. Venta: 42000
   - **Categoría: "Ropa"**
   - Imagen: (dejar vacío)
   - Referencia: (dejar vacío - se auto-genera)
4. Hacer clic en **"Agregar Producto"**
5. Hacer clic en **"Crear Compra"**

#### Resultados Esperados:
```
✅ Notificación: "Compra guardada correctamente"
   (Sin "producto(s) creado(s)" porque el producto YA EXISTÍA)
```

#### Verificación en Productos:
1. Ir a módulo **Productos**
2. Buscar "Pantalón Negro"
3. Verificar:
   - Stock anterior: 30
   - Stock nuevo: 30 + 15 = **45** ✅
   - Otros datos sin cambios

---

### ESCENARIO 3: Compra con Múltiples Productos
**Objetivo**: Verificar creación de varios productos en una sola compra

#### Precondiciones:
- ✅ Categorías existen: "Ropa", "Accesorios"
- ✅ Proveedor disponible

#### Pasos:
1. **Nueva Compra** → Proveedor X, Fecha, IVA
2. **Producto 1 - Camiseta**:
   - Producto: "Camiseta Blanca"
   - Talla: "M"
   - Color: "Blanco"
   - Cantidad: 50
   - P. Compra: 8000
   - P. Venta: 18000
   - **Categoría: "Ropa"**
   - Agregar
3. **Producto 2 - Cinturón**:
   - Producto: "Cinturón Piel"
   - Talla: "Único"
   - Color: "Negro"
   - Cantidad: 25
   - P. Compra: 10000
   - P. Venta: 24000
   - **Categoría: "Accesorios"**
   - Agregar
4. **Producto 3 - Gorro** (existente):
   - Producto: "Gorro Lana" (YA EXISTE)
   - Cantidad: 30
   - Resto igual a su configuración
   - **Categoría: (su categoría)**
   - Agregar
5. Revisar tabla:
   ```
   Producto       | Categoría    | Talla | Color   | Cant. | P.Compra | P.Venta
   Camiseta B.    | Ropa         | M     | Blanco  | 50    | 8.000    | 18.000
   Cinturón Piel  | Accesorios   | Único | Negro   | 25    | 10.000   | 24.000
   Gorro Lana     | Ropa         | Única | Gris    | 30    | 5.000    | 12.000
   ```
6. Crear Compra

#### Resultados Esperados:
```
✅ Notificación: "Compra guardada correctamente | 🆕 2 producto(s) creado(s) en Productos"
   (2 porque Camiseta y Cinturón son nuevos; Gorro ya existía)
```

#### Verificación en Productos:
- "Camiseta Blanca": NUEVA, stock 50
- "Cinturón Piel": NUEVA, stock 25
- "Gorro Lana": ACTUALIZADO, stock anterior + 30

---

### ESCENARIO 4: Validación - Falta Categoría
**Objetivo**: Verificar que no se puede agregar item sin categoría

#### Pasos:
1. Nueva Compra
2. Ingresar datos de un producto
3. **NO seleccionar categoría** ← IMPORTANTE
4. Hacer clic en "Agregar Producto"

#### Resultado Esperado:
```
❌ Notificación Error: "Por favor selecciona una categoría para el producto"
   (El item NO se agrega a la tabla)
```

---

### ESCENARIO 5: Validación - Color Obligatorio
**Objetivo**: Verificar que color sigue siendo obligatorio

#### Pasos:
1. Nueva Compra
2. Ingresar todos los datos
3. **Dejar Color vacío** ← IMPORTANTE
4. Seleccionar categoría
5. Hacer clic en "Agregar Producto"

#### Resultado Esperado:
```
❌ Notificación Error: "Por favor completa todos los campos del item (incluyendo color)"
```

---

### ESCENARIO 6: Color con Código HEX
**Objetivo**: Verificar que colores HEX funcionan

#### Pasos:
1. Nueva Compra → Agregar Producto
2. En campo Color:
   - Ingresar: `#FF0000` (rojo)
   - O seleccionar picker de color y elegir rojo
3. Resto de datos normalmente
4. Seleccionar categoría
5. Agregar Producto

#### Verificación:
- Tabla debe mostrar:
  - Cuadro color rojo
  - Texto: "#FF0000"
- Producto creado con color "#FF0000"

---

### ESCENARIO 7: Nueva Talla
**Objetivo**: Verificar que se pueden crear nuevas tallas

#### Pasos:
1. Nueva Compra → Agregar Producto
2. En campo Talla:
   - Campo selector: "Seleccionar talla..."
   - Campo "O crear nueva": Escribir "XL" → Enter
3. Verificar que "XL" aparece en el selector
4. Completar resto y agregar

#### Verificación:
- "XL" debe aparecer en tabla
- "XL" debe ser guardada en el producto

---

### ESCENARIO 8: Referencia Auto-generada
**Objetivo**: Verificar que referencia se auto-genera si no se proporciona

#### Pasos:
1. Nueva Compra → Agregar Producto
2. Dejar campo **"Referencia (SKU)" VACÍO**
3. Completar resto y agregar

#### Verificación en Productos:
- El producto debe tener referencia como: `REF-{timestamp}`
- Ej: `REF-1704067200000`

---

### ESCENARIO 9: Imagen Opcional
**Objetivo**: Verificar que imagen es opcional

#### Pasos:
1. Nueva Compra → Agregar Producto
2. Dejar campo **"Imagen" VACÍO**
3. Completar resto y agregar → Crear Compra

#### Verificación en Productos:
- Producto se crea correctamente
- Campo imagen está vacío o es ""
- Resto de datos intactos

---

### ESCENARIO 10: Sincronización Entre Pestañas
**Objetivo**: Verificar que categorías se sincronizan entre pestañas

#### Pasos:
1. Abrir DOS pestañas del navegador:
   - Pestaña A: En módulo Compras
   - Pestaña B: En Configuración > Categorías
2. En Pestaña B:
   - Crear nueva categoría: "Electrónica"
   - Guardar
3. En Pestaña A:
   - Ir a Nueva Compra → Agregar Producto
   - Hacer clic en selector de categoría

#### Resultado Esperado:
- "Electrónica" debe aparecer en la lista
- (Puede tomar hasta 500ms)

---

## 🔍 Verificaciones de Console

Abre F12 → Console y busca estos mensajes:

### Creación de Producto:
```
✅ [ComprasManager] Categorías sincronizadas: ['Ropa', 'Accesorios']
🆕 [Producto Creado] Camisa Azul - Stock: 20, Precio: $28000
✅ [ComprasManager] Se crearon 1 nuevos productos: Camisa Azul
✅ [ComprasManager] Stock de productos actualizado
```

### Actualización de Stock:
```
📦 [Producto] Pantalón Negro: Stock 30 + 15 = 45
✅ [ComprasManager] Stock de productos actualizado
```

---

## 🚨 Posibles Problemas y Soluciones

### Problema 1: "Selector de categoría está vacío"
**Causa**: No existen categorías en localStorage
**Solución**: 
1. Ir a Configuración > Categorías
2. Crear al menos una categoría
3. Refrescar Compras (F5)

### Problema 2: "El producto no aparece después de crear compra"
**Causa**: localStorage no se sincronizó
**Solución**:
1. Ir a módulo Productos
2. Presionar F5 (refrescar)
3. Buscar el producto por nombre

### Problema 3: "Stock no se actualizó"
**Causa**: Producto existente no se encontró
**Solución**:
1. Verificar que el producto existe en Productos
2. Verificar que el ID es correcto
3. Ver console para mensajes de error

### Problema 4: "Notificación no aparece"
**Causa**: Modal se cierra muy rápido
**Solución**:
1. Revisar console (F12)
2. Buscar mensajes de error

---

## 📊 Datos de Prueba Sugeridos

### Categorías para crear:
- Ropa
- Accesorios
- Calzado
- Electrónica
- Hogar

### Proveedores para crear:
- Proveedor Ropa ABC
- Distribuidor Accesorios XYZ
- Import Zapatos S.A.

### Productos para crear (primero en Productos):
- Pantalón Negro (stock: 30, talla: 30, color: Negro)
- Gorro Lana (stock: 20, talla: Única, color: Gris)
- Zapato Deporte (stock: 40, talla: 42, color: Azul)

### Compras para probar:
- Compra con 1 producto nuevo
- Compra con 1 producto existente
- Compra con 3 productos (mezcla de nuevos y existentes)

---

## ✅ Checklist de Validación Completa

- [ ] Crear compra con 1 producto nuevo → verifica creación
- [ ] Crear compra con 1 producto existente → verifica actualización stock
- [ ] Crear compra con 3 productos → verifica múltiples creaciones
- [ ] Dejar categoría vacía → verifica validación
- [ ] Dejar color vacío → verifica validación
- [ ] Usar color HEX → verifica almacenamiento
- [ ] Crear nueva talla → verifica sincronización
- [ ] Omitir imagen → verifica que sea opcional
- [ ] Omitir referencia → verifica auto-generación
- [ ] Abrir console → verifica mensajes de creación
- [ ] Refrescar página → verifica persistencia en localStorage
- [ ] Abrir otra pestaña → verifica sincronización de categorías
- [ ] Revisar módulo Productos → verifica productos creados
- [ ] Cambiar a Categorías en otra pestaña → verifica sincronización

---

## 🎯 Confirmación de Éxito

Si todos los escenarios funcionan correctamente, puedes confirmar que:

✅ La sincronización Compras ↔ Productos está **FUNCIONANDO CORRECTAMENTE**

✅ Los productos se crean **AUTOMÁTICAMENTE** cuando se crean compras

✅ Los stocks se **ACTUALIZAN** correctamente

✅ Las categorías se **SINCRONIZAN** entre módulos

✅ Las validaciones funcionan **CORRECTAMENTE**

✅ La persistencia en localStorage es **CONFIABLE**
