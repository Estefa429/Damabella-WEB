# ✅ CHECKLIST DE PRUEBAS - SELECTOR CAMBIOS

## 🎯 Objetivo
Validar que el selector "Producto a Devolver" en el modal de Cambio:
- ✓ NO aparece vacío
- ✓ Muestra items con cantidad disponible
- ✓ Calcula correctamente (vendidos - devoluciones - cambios)

---

## 🧪 PRUEBA 1: Selector No Aparece Vacío

### Setup
```
1. Crear venta con productos:
   - Producto A: Cantidad 2
   - Producto B: Cantidad 1
```

### Pasos
```
1. Botón "Crear Cambio" en la venta
2. Modal Cambio abre
3. En sección "✖️ Producto a Devolver"
4. Clickear dropdown del selector
```

### Resultado Esperado
```
✓ Aparecen opciones:
  - Producto A - Talla: M, Color: Rojo (Disponible: 2)
  - Producto B - Talla: L, Color: Azul (Disponible: 1)

✗ NO debe estar vacío
```

### Resultado Actual
```
[ ] Aparece vacío
[ ] Aparecen opciones
[ ] Cantidad mostrada es correcta
```

---

## 🧪 PRUEBA 2: Sincronización con Cambios Previos

### Setup
```
1. Crear venta:
   - Producto A: Cantidad 3
   
2. Crear cambio:
   - Devolver: Producto A (1 unidad)
   - Recibir: Producto C
```

### Pasos
```
1. Modal de esta venta: Botón "Crear Cambio" 
2. Modal abre
3. Ver selector "Producto a Devolver"
```

### Resultado Esperado
```
✓ Selector muestra:
  - Producto A (Disponible: 2)  ← Restó el cambio previo
  
✓ Cantidad correcta:
  - 3 vendidos
  - 1 cambiado
  - = 2 disponibles
```

### Resultado Actual
```
[ ] Cantidad muestra 2
[ ] Cantidad muestra 3
[ ] Cantidad es otra
[ ] Producto no aparece
```

---

## 🧪 PRUEBA 3: Cantidad Cero No Aparece

### Setup
```
1. Crear venta:
   - Producto A: Cantidad 1
   
2. Crear cambio:
   - Devolver: Producto A (1 unidad)
   - Recibir: Producto C
```

### Pasos
```
1. Intentar crear otro cambio
2. Ver modal "Producto a Devolver"
```

### Resultado Esperado
```
✓ Selector VACÍO o dice "No hay productos disponibles"

✗ NO debe mostrar:
  - Producto A (Disponible: 0)  ← NO debe aparecer
```

### Resultado Actual
```
[ ] Selector vacío
[ ] Muestra producto con 0 cantidad
[ ] Muestra mensaje de "No disponibles"
```

---

## 🧪 PRUEBA 4: Stock "Producto a Entregar"

### Setup
```
1. Crear venta con Producto A
2. Abrir modal Cambio
```

### Pasos
```
1. En sección "✓ Producto a Entregar"
2. Selector de Producto
3. Seleccionar producto con stock > 0 vs stock = 0
```

### Resultado Esperado
```
✓ Opciones mostradas:
  - Productos con Stock > 0: Aparecen
  - Productos con Stock = 0: NO aparecen
  
✓ Botón "Confirmar Cambio":
  - Con stock disponible: HABILITADO
  - Sin stock disponible: DESHABILITADO
```

### Resultado Actual
```
[ ] Solo muestra productos con stock > 0
[ ] Muestra productos con stock = 0
[ ] Botón se deshabilita correctamente
[ ] Botón permanece habilitado
```

---

## 🧪 PRUEBA 5: Múltiples Cambios

### Setup
```
1. Venta con 3 productos (A, B, C)
2. Cambio 1: Devolver A → Recibir X
3. Cambio 2: Devolver B → Recibir Y
```

### Pasos
```
1. Intentar Cambio 3
2. Ver qué aparece en "Producto a Devolver"
```

### Resultado Esperado
```
✓ Solo aparece C (los otros ya fueron cambiados)
✓ No hay opción de volver a cambiar A o B
```

### Resultado Actual
```
[ ] Solo aparece C
[ ] Aparecen A y B
[ ] Muestra cantidad = 0 para A y B
```

---

## ✅ Resumen de Validación

| Prueba | Estado | Detalles |
|--------|--------|----------|
| 1. No vacío | [ ] ✓ | Selector muestra opciones |
| 2. Sincronización | [ ] ✓ | Cantidad correcta |
| 3. Cantidad 0 | [ ] ✓ | No aparecen |
| 4. Stock filtrado | [ ] ✓ | Solo stock > 0 |
| 5. Múltiples cambios | [ ] ✓ | Evita duplicados |

---

## 🚨 Si Algo Falla

### Selector sigue vacío
```
Verificar:
1. ¿Venta tiene productos?
2. ¿calcularCantidadDisponible() retorna > 0?
3. ¿useEffect se ejecuta? (F12 → Console)
4. ¿productosDisponiblesCambio tiene valores?
```

### Cantidad incorrecta
```
Verificar:
1. localStorage con devoluciones y cambios
2. Fórmula: vendidos - devueltos - cambiados
3. IDs coinciden (ventaId, itemId)
```

### Stock no filtra
```
Verificar:
1. getProductosConStockDisponible() existe
2. Productos en localStorage tienen stock
3. getTallasConStockDisponible() filtra correctamente
```

---

## 📋 Notas para Testing
- Limpiar localStorage si datos están "sucios": `localStorage.clear()`
- Recargar página: `Ctrl + F5` o `Cmd + Shift + R`
- Abrir DevTools (F12) para ver console errors
- Verificar Network si modal no abre

---

**Último update:** 2024  
**Status:** Ready for manual testing
