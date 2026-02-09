# TEST: Verificación de Fix de Categoría en Compras

## 🎯 Objetivo
Verificar que el `categoryId` se copia correctamente desde productos existentes cuando se crea una compra, y se persiste en localStorage.

## 📋 Escenarios de Prueba

### Escenario 1: Seleccionar Producto Existente con Categoría
**Pasos:**
1. Ir a ComprasManager → "Nueva Compra"
2. En "Seleccionar o crear producto", hacer click en combobox
3. Seleccionar un producto existente QUE TENGA CATEGORÍA (ej: "Laptop" en categoría "Electrónica")
4. **VERIFICAR:** 
   - ✅ Campo "Categoría" debe llenarse automáticamente
   - ✅ Console debe mostrar: `[handleSelectProducto] Categoría copiada: Electrónica`
   - ✅ El estado `nuevoItem.categoriaId` debe tener valor

**Resultado Esperado:**
- Categoría aparece en el formulario sin usuario hacer nada
- Log en console confirma que fue copiada

---

### Escenario 2: Crear Producto Nuevo Sin Categoría Inicial
**Pasos:**
1. Ir a ComprasManager → "Nueva Compra"
2. En "Seleccionar o crear producto", escribir nombre NUEVO (que no existe)
3. Llenar: Nombre, Referencia, Precios
4. En dropdown "Categoría", seleccionar una categoría (ej: "Electrónica")
5. Click "Crear Producto"
6. Click "Agregar" para agregar item a la compra
7. **VERIFICAR:**
   - ✅ El item en la tabla de compra debe mostrar la categoría
   - ✅ Console debe mostrar: `[agregarItem] categoriaId final encontrado`
   - ✅ Cuando se guarde la compra, debe guardar el producto CON categoría

**Resultado Esperado:**
- Producto se crea con la categoría seleccionada
- Al guardar compra, producto en PRODUCTOS_KEY tiene `categoryId` poblado

---

### Escenario 3: Editar Producto Existente - Agregar Categoría Faltante
**Pasos:**
1. En ProductosManager, buscar un producto sin categoría (si existe)
2. En ComprasManager, seleccionar ese producto en Nueva Compra
3. Manualmente seleccionar una categoría en el dropdown
4. Agregar a la compra
5. Guardar compra
6. **VERIFICAR:**
   - ✅ El producto debe actualizarse en PRODUCTOS_KEY con nueva categoría
   - ✅ Al volver a ProductosManager, debe mostrar la categoría

**Resultado Esperado:**
- Producto sin categoría recibe categoría al pasar por compra
- Cambio persiste en localStorage

---

## 🔍 Verificación en Console

Cuando se selecciona un producto, deberías ver estos logs:

```
[handleSelectProducto] Producto seleccionado: Laptop (ID: 123)
[handleSelectProducto] Categoría copiada: Electrónica (categoryId: cat-001)
[handleSelectProducto] Estado nuevoItem actualizado con categoriaId

[agregarItem] categoriaId en nuevoItem: cat-001
[agregarItem] categoriaId final encontrado: Electrónica
[agregarItem] Item agregado a tabla con categoriaId: cat-001
```

---

## 📊 Verificación en localStorage

**Herramientas:** DevTools (F12) → Application → Local Storage

### Antes de Fix:
```json
// PRODUCTOS_KEY
{
  "id": "prod-001",
  "nombre": "Laptop",
  "categoryId": ""  ❌ VACÍO
}
```

### Después de Fix:
```json
// PRODUCTOS_KEY
{
  "id": "prod-001",
  "nombre": "Laptop",
  "categoryId": "cat-001"  ✅ POBLADO
}
```

---

## ✅ Checklist de Validación

- [ ] Producto existente CON categoría → se copia automáticamente
- [ ] Producto nuevo + selección de categoría → se guarda con categoría
- [ ] Producto sin categoría → se puede agregar categoría en compra
- [ ] Console logs muestran flujo correcto de categoría
- [ ] localStorage PRODUCTOS_KEY muestra categoryId para todos los productos
- [ ] ProductosManager refleja categorías correctas después de crear compra
- [ ] No hay regresiones: compras sin categoría requerida no se crean

---

## 🐛 Si Falla

Si un producto sigue sin categoría después de esto:

1. Abre Console (F12) durante el proceso
2. Verifica que aparezcan los logs esperados
3. Si no aparecen logs:
   - Revisa que `handleSelectProducto()` fue actualizado correctamente
   - Verisa que `agregarItem()` tiene la lógica de 3 fallbacks
4. Si aparecen logs pero categoría no se guarda:
   - Verifica `agregarOActualizarProducto()` en línea ~200
   - Busca: `categoryId: (itemCompra.categoriaId ...`
   - Debe estar usando `itemCompra.categoriaId` como prioridad

---

## 📝 Funciones Modificadas

**ComprasManager.tsx**
- `handleSelectProducto()` - línea ~725
- `select onChange` - línea ~1434
- `agregarItem()` - línea ~757
- `agregarOActualizarProducto()` - línea ~200-220

Todas ahora garantizan que `categoryId` fluye correctamente de:
1. Producto seleccionado → 
2. nuevoItem state → 
3. itemCompra → 
4. agregarOActualizarProducto() → 
5. localStorage PRODUCTOS_KEY
