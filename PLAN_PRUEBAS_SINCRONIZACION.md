# 🧪 PLAN DE PRUEBAS: Sincronización Compras ↔ Productos

## 📋 Escenarios de Prueba

### Test 1: Crear Producto Nuevo desde Compra (con Categoría)
**Objetivo**: Verificar que la categoría se guarde correctamente

**Pasos**:
1. Abre DevTools (F12)
2. Ve a Módulo Compras → Nueva Compra
3. Completa:
   - Proveedor: [Selecciona uno]
   - Fecha: Hoy
   - Categoría: **"Vestidos Cortos"** ← IMPORTANTE
   - Producto: "Camisa Prueba" (nuevo nombre)
   - Talla: M
   - Color: Azul
   - Cantidad: 10
   - Precio Compra: 25000
   - Precio Venta: 50000
   - Imagen: [opcional]
4. Clic "Agregar Item"
5. Clic "Guardar Compra"

**Verificaciones en Console**:
```
Busca este mensaje (CRÍTICO):
🆕 [agregarOActualizarProducto] Creando nuevo producto: Camisa Prueba
   Categoría capturada: "Vestidos Cortos"  ← DEBE APARECER
✅ [agregarOActualizarProducto] Nuevo producto creado:
   Categoría: Vestidos Cortos  ← NO "Sin categoría"
```

**Verificación en localStorage**:
```
Application → Local Storage → damabella_productos
Busca "Camisa Prueba":
{
  "nombre": "Camisa Prueba",
  "categoria": "Vestidos Cortos",  ← DEBE SER LA CATEGORÍA, NO "Sin categoría"
  "precioCompra": 25000,
  "precioVenta": 50000,
  "variantes": [{"talla": "M", "colores": [{"color": "Azul", "cantidad": 10}]}]
}
```

**Verificación en Módulo Productos**:
1. Ve a Productos
2. Busca "Camisa Prueba"
3. Verifica:
   - [ ] Aparece el producto
   - [ ] Categoría = "Vestidos Cortos"
   - [ ] Variantes tiene M + Azul + Cantidad 10
   - [ ] Precios correctos

**Resultado Esperado**: ✅ PASS
- Mensaje de éxito en Compras
- Producto aparece en Productos después de 1-2 segundos
- Categoría es exacta (no "Sin categoría")

---

### Test 2: Actualizar Producto Existente desde Compra (sin perder datos)
**Objetivo**: Verificar que al actualizar un producto, NO se pierdan datos existentes

**Preparación**:
- El producto "Vestido Corto Casual" (SKU: VES-CORTA-001) debe estar en Productos
- Abre la consola y busca en localStorage el producto original:
```javascript
// En Console:
JSON.parse(localStorage.getItem('damabella_productos'))
  .find(p => p.referencia === 'VES-CORTA-001')
```
- Anota: categoria, imagen, precioCompra, precioVenta originales

**Pasos**:
1. Ve a Compras → Nueva Compra
2. Selecciona:
   - Proveedor: [Cualquiera]
   - Categoría: **"Accesorios"** (diferente a la original)
   - Producto: "Vestido Corto Casual"
   - Talla: L
   - Color: Rojo
   - Cantidad: 3
   - Precio Compra: 35000 (diferente al original)
   - Precio Venta: 70000 (diferente al original)
   - Imagen: [DEJAR VACÍO] ← IMPORTANTE
3. Clic "Guardar Compra"

**Verificaciones en Console**:
```
Busca este mensaje:
✏️ [agregarOActualizarProducto] Actualizando producto existente: Vestido Corto Casual
   Producto actual:
   ├─ nombre: Vestido Corto Casual
   ├─ categoria: Vestidos Cortos (ORIGINAL)
   ├─ precioCompra: 30000 (ORIGINAL)
   ├─ precioVenta: 65000 (ORIGINAL)
   └─ imagen: Sí (ORIGINAL)

✅ [agregarOActualizarProducto] Vestido Corto Casual actualizado:
   Precios mantenidos - Compra: 30000, Venta: 65000  ← MANTIENE ORIGINALES
   Categoría: Vestidos Cortos (NO CAMBIÓ)  ← MANTIENE ORIGINAL
   Imagen mantenida: Sí  ← MANTIENE ORIGINAL
```

**Verificación en localStorage**:
```
Busca el producto actualizado:
{
  "nombre": "Vestido Corto Casual",
  "categoria": "Vestidos Cortos",  ← MANTIENE ORIGINAL
  "precioCompra": 30000,           ← MANTIENE ORIGINAL
  "precioVenta": 65000,            ← MANTIENE ORIGINAL
  "imagen": "[url]",               ← MANTIENE ORIGINAL
  "variantes": [
    {"talla": "M", "colores": [{"color": "Negro", "cantidad": 5}]},  ← ORIGINAL
    {"talla": "L", "colores": [{"color": "Rojo", "cantidad": 3}]}    ← NUEVO
  ]
}
```

**Resultado Esperado**: ✅ PASS
- Cantidad se suma (5 + 3 = 8)
- Categoría NO cambia (mantiene "Vestidos Cortos")
- Precios NO cambian (mantienen originales)
- Imagen NO se pierde
- Nueva talla/color se agrega correctamente

---

### Test 3: Editar Producto en Módulo Productos (sin perder datos)
**Objetivo**: Verificar que al editar un producto, NO se pierdan campos invisibles

**Preparación**:
- Producto: "Vestido Largo Elegante"
- Abre localStorage y anota el producto completo:
```javascript
JSON.parse(localStorage.getItem('damabella_productos'))
  .find(p => p.nombre === 'Vestido Largo Elegante')
```
- Anota: `referencia`, `precioCompra`, `createdFromSKU`, etc.

**Pasos**:
1. Ve a Módulo Productos
2. Busca "Vestido Largo Elegante"
3. Clic en editar (icono de lápiz)
4. Realiza SOLO estos cambios:
   - Categoría: Cambia a "Sets" (diferente)
   - Precio Venta: Cambia a 110000
   - Deja todo lo demás igual
5. Clic "Guardar"

**Verificaciones en Console**:
```
Busca este mensaje:
📝 [ProductosManager] Actualizando producto:
   idAnterior: [ID]
   idActual: [ID]  ← DEBE SER IGUAL
   camposMantenidos: ['referencia', 'precioCompra', 'createdFromSKU']
   referencia: VES-LARGO-002  ← DEBE APARECER
   precioCompra: 30000        ← DEBE APARECER (NO cambió)
```

**Verificación en localStorage**:
```
{
  "nombre": "Vestido Largo Elegante",
  "categoria": "Sets",              ← CAMBIÓ (como esperado)
  "precioVenta": 110000,            ← CAMBIÓ (como esperado)
  "precioCompra": 30000,            ← MANTIENE (NO DEBE CAMBIAR)
  "referencia": "VES-LARGO-002",    ← MANTIENE (CRÍTICO)
  "createdFromSKU": "[...]",        ← MANTIENE
  "imagen": "[...]"                 ← MANTIENE
}
```

**Resultado Esperado**: ✅ PASS
- Categoría se actualiza a "Sets"
- Precio Venta se actualiza a 110000
- Referencia se mantiene (no se pierde)
- precioCompra se mantiene
- ID no cambia
- Imagen se mantiene

---

### Test 4: Flujo Completo: Crear → Comprar → Editar
**Objetivo**: Verificar el ciclo completo de vida del producto

**Pasos**:
1. **Crear producto nuevo** desde Compra
   - Nombre: "Pantalón Básico"
   - Categoría: "Pantalones"
   - SKU: Auto-generado
   - Precio Compra: 20000
   - Precio Venta: 45000
   - Variantes: M + Negro + Cantidad 10

2. **Editar en Productos**
   - Cambiar: Categoria → "Ropa Casual", Precio Venta → 50000

3. **Comprar el mismo producto** nuevamente desde Compras
   - SKU: VES-CORTA-001 (debe encontrar el producto)
   - Talla: L + Rojo + Cantidad 5
   - Precio Compra: 22000 (nuevo)
   - Precio Venta: 48000 (nuevo)
   - Imagen: [Dejar vacío]

4. **Verificar en Productos**
   - Categoría: "Ropa Casual" (mantenida de edición)
   - Precio Venta: 50000 (mantenida de edición, NO cambia a 48000)
   - Variantes: M+Negro (10) + L+Rojo (5)

**Resultado Esperado**: ✅ PASS
- El producto se crea correctamente
- La edición se mantiene después de nueva compra
- Los precios editados no se sobrescriben con compras nuevas
- Las variantes se suman correctamente

---

## 📊 Tabla Comparativa: Antes vs Después

| Escenario | ANTES ❌ | DESPUÉS ✅ |
|-----------|---------|-----------|
| Crear producto sin categoría | "Sin categoría" | Categoría correcta |
| Actualizar producto existente | Pierde imagen y precios | Mantiene datos existentes |
| Editar en Productos | Pierde referencia | Mantiene referencia y precioCompra |
| Editar categoría | Funciona pero pierde otros datos | Mantiene todos excepto lo editado |
| Crear → Editar → Comprar | Se pierde edición anterior | Se mantiene edición anterior |

---

## 🔍 Datos a Verificar en localStorage

Para cada producto, verifica que tenga:
```javascript
{
  "id": 1234567890,
  "nombre": "Nombre Producto",
  "referencia": "SKU-UNICO-001",        ← CRÍTICO
  "proveedor": "Compras",
  "categoria": "Categoría Correcta",    ← NO "Sin categoría"
  "precioCompra": 25000,                ← CRÍTICO
  "precioVenta": 50000,
  "activo": true,
  "variantes": [
    {
      "talla": "M",
      "colores": [
        {
          "color": "Negro",
          "cantidad": 10
        }
      ]
    }
  ],
  "imagen": "url.jpg",
  "createdAt": "2026-01-29T...",
  "createdFromSKU": "SKU-UNICO-001"      ← CRÍTICO
}
```

---

## ✅ Checklist Final de Validación

Después de correr todos los tests:

- [ ] Test 1 PASS: Nueva categoría se guarda correctamente
- [ ] Test 2 PASS: Actualización mantiene datos existentes
- [ ] Test 3 PASS: Edición mantiene campos invisibles
- [ ] Test 4 PASS: Flujo completo funciona sin conflictos
- [ ] localStorage tiene campos: referencia, precioCompra, createdFromSKU
- [ ] ProductosManager mantiene ID en ediciones
- [ ] ComprasManager valida categoriaNombre antes de usar
- [ ] Logs en console son claros y útiles
- [ ] Ningún producto muestra "Sin categoría" sin razón
- [ ] Las ediciones no se pierden después de nuevas compras

---

## 🚨 Si Algo Falla

### Síntoma: Categoría aún es "Sin categoría"
```
1. Abre DevTools → Console
2. Busca: "Categoría capturada:"
3. Si no aparece → El select no está pasando la categoría
4. Verifica: agregarItem() en ComprasManager está leyendo categoriaSelectRef
```

### Síntoma: Al editar se pierde imagen
```
1. Abre localStorage → damabella_productos
2. Antes de editar, anota: imagen original
3. Después de editar, verifica: ¿imagen es undefined?
4. Si es undefined → ProductosManager no está haciendo merge correcto
```

### Síntoma: Al actualizar desde Compra cambian los precios
```
1. Console → Busca: "Precios mantenidos"
2. Si NOT aparece → agregarOActualizarProducto está sobrescribiendo
3. Verifica: línea de "precioCompra: itemCompra.precioCompra && itemCompra.precioCompra > 0 ? ..."
```

---

**Versión de Tests**: 2026-01-29
**Estado**: Listos para ejecutar
**Estimado**: 20-30 minutos todos los tests
