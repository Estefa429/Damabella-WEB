# Separación de Modales: Devoluciones vs Cambios

## 📋 Resumen de Cambios

Se ha completado la separación completa de los flujos de **Devoluciones** y **Cambios** a nivel UI en el módulo `DevolucionesManager.tsx`. Ahora existen dos modales independientes con lógica separada y validaciones específicas para cada flujo.

---

## 🔄 Cambios Realizados

### 1. **Nuevos Estados de Modales Separados**
```typescript
const [showDevolucionModal, setShowDevolucionModal] = useState(false); // Modal SOLO para devoluciones
const [showCambioModal, setShowCambioModal] = useState(false);         // Modal SOLO para cambios
```

### 2. **Dos Botones Separados en Header**
#### Botón "Nueva Devolución" (Púrpura)
- Abre modal de Devolución
- Establece `tipoOperacion = 'Devolucion'`
- NO muestra selector de producto nuevo

#### Botón "Nuevo Cambio" (Azul)
- Abre modal de Cambio
- Establece `tipoOperacion = 'Cambio'`
- MUESTRA selector de producto nuevo con stock filtrado

### 3. **Mejora: Filtrado de Stock en Cambios**

#### `getTallasDisponiblesCambio()` - MODIFICADO
```typescript
// Antes: Retornaba TODAS las tallas
// Ahora: Retorna SOLO tallas con al menos un color en stock
return producto.variantes
  .filter((v: any) => v.colores && v.colores.some((c: any) => c.cantidad > 0))
  .map((v: any) => v.talla);
```

#### `getColoresDisponiblesCambio()` - MODIFICADO
```typescript
// Antes: Retornaba TODOS los colores
// Ahora: Retorna SOLO colores con cantidad > 0
return (variante.colores || [])
  .filter((c: any) => c.cantidad > 0)
  .map((c: any) => c.color);
```

### 4. **Nuevas Funciones Helper**

#### `getStockDisponible(talla, color): number`
- Obtiene la cantidad exacta de stock disponible
- Usado para mostrar información visual

#### `tieneStockDisponible(): boolean`
- Verifica si el producto seleccionado tiene al menos una variante con stock > 0
- Muestra advertencia si no hay stock disponible

### 5. **Controles Deshabilitados para Stock**

```tsx
// Selects deshabilitados cuando no hay opciones disponibles
<select
  disabled={getTallasDisponiblesCambio().length === 0}
  className="... disabled:bg-gray-100 disabled:cursor-not-allowed"
>
```

### 6. **Indicadores Visuales de Stock**

```tsx
{productoNuevoTalla && productoNuevoColor && (
  <div className="mt-2 text-xs text-blue-600">
    ✓ Stock disponible: {getStockDisponible(...)} unidades
  </div>
)}
```

---

## 📊 Estructura de los Modales

### Modal de Devolución
```
Modal: "Crear Nueva Devolución" (Púrpura)
├─ Seleccionar Venta
├─ Seleccionar Productos (checkboxes)
├─ ❌ NO: Selector de producto nuevo
├─ Motivo de Devolución
├─ Fecha de Devolución
└─ Botones: Cancelar | Crear Devolución
```

### Modal de Cambio
```
Modal: "Crear Nuevo Cambio" (Azul)
├─ Seleccionar Venta
├─ Seleccionar Productos (checkboxes)
├─ ✅ Seleccionar Producto Nuevo
│  ├─ Selector con productos activos
│  ├─ Talla (filtrado: solo con stock > 0)
│  ├─ Color (filtrado: solo con cantidad > 0)
│  ├─ Indicador: "⚠️ Sin stock" si necesario
│  ├─ Indicador: "✓ Stock disponible: N"
│  └─ Balance del Cambio
├─ Motivo de Devolución
├─ Fecha de Devolución
└─ Botones: Cancelar | Crear Cambio
```

---

## ✅ Validaciones Implementadas

### Devolución Modal
- ✓ Requiere Venta seleccionada
- ✓ Requiere al menos 1 producto seleccionado
- ✓ Botón deshabilitado si faltan campos

### Cambio Modal
- ✓ Requiere Venta seleccionada
- ✓ Requiere al menos 1 producto a cambiar
- ✓ Requiere Producto Nuevo seleccionado
- ✓ Requiere Talla (solo con stock > 0)
- ✓ Requiere Color (solo con cantidad > 0)
- ✓ SOLO muestra variantes con stock disponible
- ✓ Botón deshabilitado si faltan campos o no hay stock
- ✓ Indicador visual cuando no hay stock

---

## 🎨 Cambios Visuales

| Elemento | Devolución | Cambio |
|----------|-----------|--------|
| **Color Botón** | Púrpura (#6D28D9) | Azul (#2563EB) |
| **Título Modal** | "Crear Nueva Devolución" | "Crear Nuevo Cambio" |
| **Producto Nuevo** | ❌ No existe | ✅ Selector con stock |
| **Talla/Color** | ❌ No aparecen | ✅ Filtradas por stock |
| **Stock Info** | ❌ No necesaria | ✅ "Stock disponible: N" |
| **Balance** | ❌ No se muestra | ✅ Balance del cambio |

---

## 🔧 Funciones Afectadas

### Mantienen Lógica Anterior:
- `crearDevolucion()` - Ejecuta devolución pura
- `crearCambio()` - Ejecuta cambio con validación
- `ejecutarDevolucion()` - Llama a `procesarDevolucionConSaldo()`
- `ejecutarCambio()` - Llama a `procesarCambioConSaldo()`

### Nuevas/Modificadas:
- `getTallasDisponiblesCambio()` - ✅ Ahora filtra por stock > 0
- `getColoresDisponiblesCambio()` - ✅ Ahora filtra por cantidad > 0
- `getStockDisponible()` - ✅ NUEVA función helper
- `tieneStockDisponible()` - ✅ NUEVA función helper

---

## 📝 Casos de Uso

### Caso 1: Usuario intenta Devolución
1. Hace clic en "Nueva Devolución"
2. Modal de Devolución abre
3. Selecciona venta
4. Elige productos a devolver
5. ✅ NO puede seleccionar otro producto (no aparece el campo)
6. Confirma devolución

### Caso 2: Usuario intenta Cambio SIN Stock
1. Hace clic en "Nuevo Cambio"
2. Modal de Cambio abre
3. Selecciona venta y productos a cambiar
4. Selecciona producto nuevo
5. ⚠️ Selector de Talla: Deshabilitado (No hay stock)
6. ❌ No puede proceder sin stock

### Caso 3: Usuario intenta Cambio CON Stock
1. Hace clic en "Nuevo Cambio"
2. Modal de Cambio abre
3. Selecciona venta y productos a cambiar
4. Selecciona producto nuevo
5. ✅ Selector de Talla: Habilitado, muestra solo tallas con stock
6. ✅ Selector de Color: Habilitado, muestra solo colores en stock
7. ✅ Muestra "Stock disponible: N unidades"
8. ✅ Confirma cambio

---

## 🧪 Pruebas Sugeridas

1. **Devolución Pura**
   - [ ] Abrir "Nueva Devolución"
   - [ ] Verificar que NO hay selector de producto nuevo
   - [ ] Crear devolución exitosa

2. **Cambio Sin Stock**
   - [ ] Abrir "Nuevo Cambio"
   - [ ] Seleccionar producto sin variantes con stock
   - [ ] Verificar que Talla/Color están deshabilitados
   - [ ] Verificar que aparece "⚠️ Este producto no tiene variantes con stock disponible"

3. **Cambio Con Stock**
   - [ ] Abrir "Nuevo Cambio"
   - [ ] Seleccionar producto con stock
   - [ ] Verificar que Talla/Color muestran solo opciones con stock
   - [ ] Verificar "✓ Stock disponible: N" se muestra
   - [ ] Crear cambio exitoso

4. **Integridad de Datos**
   - [ ] Verificar que stock se deduce correctamente
   - [ ] Verificar que balance se calcula correctamente
   - [ ] Verificar que datos se guardan en localStorage

---

## 📦 Archivos Modificados

- `src/features/returns/components/DevolucionesManager.tsx` (1490 líneas)
  - ✅ Compilación exitosa
  - ✅ 0 errores TypeScript
  - ✅ Todos los cambios aplicados correctamente

---

## 🎯 Conclusión

Se ha logrado una **separación completa** de los flujos de Devoluciones y Cambios a nivel de UI, asegurando que:

✅ El usuario no puede seleccionar producto nuevo en devoluciones  
✅ El usuario solo puede seleccionar variantes con stock en cambios  
✅ Las validaciones se aplican a nivel UI (no solo backend)  
✅ Se proporciona feedback visual claro sobre stock disponible  
✅ Los modales tienen títulos, colores y campos específicos  
✅ La compilación es correcta y sin errores  

Este cambio **completa el ciclo de protección del inventario** iniciado con la validación en Pedidos y la creación de `returnService.ts`.

---

**Estado de Compilación:** ✅ EXITOSA (0 errores TypeScript)  
**Hora de Cambio:** Fase Final - Separación UI  
**Impacto:** Crítico - Mejora Significativa en UX y Prevención de Errores
