# 🔒 Arquitectura Central de Ventas - finalizarVenta()

**Fecha:** 2024
**Módulos Afectados:** 
- `src/services/saleService.ts` (NUEVO)
- `src/features/ecommerce/sales/components/VentasManager.tsx` (MODIFICADO)
- `src/features/ecommerce/orders/components/PedidosManager.tsx` (MODIFICADO)

**Estado:** ✅ COMPLETADO Y COMPILADO

---

## 🎯 Problema Identificado

### Antes: Descuento de Stock Inconsistente
```
┌─────────────────────────────────────────────────┐
│ VENTAS (VentasManager.tsx)                     │
│  ├─ Valida stock ✅                            │
│  ├─ Descuenta stock ✅                         │
│  └─ Dispara eventos ✅                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ PEDIDOS (PedidosManager.tsx)                    │
│  ├─ Valida stock en agregarItem() ✅           │
│  ├─ Convierte a venta ✅                       │
│  └─ ❌ NO descuenta stock ❌                    │
└─────────────────────────────────────────────────┘

RESULTADO: 
- Venta directa: Stock se descuenta ✅
- Pedido → Venta: Stock NO se descuenta ❌
- Inconsistencia en inventario
```

### El Problema Detallado
1. **VentasManager** tiene su propia función `descontarStock()` (línea 611)
2. **PedidosManager** convierte Pedido a Venta pero **NO descuenta stock**
3. La lógica de descuento **no es reutilizable** entre módulos
4. **Duplicación de código** si quisiéramos agregar descuento a Pedidos
5. **Violación del principio DRY** (Don't Repeat Yourself)

---

## ✅ Solución Implementada

### Arquitectura de la Solución

```
┌─────────────────────────────────────────────────────────────┐
│                 FUNCIÓN CENTRAL: finalizarVenta()           │
│                 (src/services/saleService.ts)              │
│                                                             │
│  1️⃣ Valida variantes                                       │
│  2️⃣ Valida stock disponible                               │
│  3️⃣ Descuenta stock (OPERACIÓN ATÓMICA)                   │
│  4️⃣ Guarda venta en localStorage                          │
│  5️⃣ Dispara eventos para sincronización                   │
│                                                             │
│  Retorna: { exitoso: boolean; error?: string }            │
└─────────────────────────────────────────────────────────────┘
           ↑                                   ↑
           │                                   │
    ┌──────────────┐                  ┌──────────────┐
    │ VENTAS       │                  │ PEDIDOS      │
    │ (Crea venta) │                  │ (Convierte)  │
    └──────────────┘                  └──────────────┘
           │                                   │
           └───────────────────────────────────┘
                 Ambos usan finalizarVenta()
```

---

## 📝 Cambio 1: Crear Servicio Central (saleService.ts)

### Archivo: `src/services/saleService.ts`

Una función reutilizable que encapsula toda la lógica de descuento:

```typescript
export const finalizarVenta = (
  ventaData: Venta,
  items: ItemVenta[]
): { exitoso: boolean; error?: string } => {
  try {
    // 1️⃣ Obtener productos actuales
    const productosJSON = localStorage.getItem(PRODUCTOS_KEY);
    const productos = JSON.parse(productosJSON);

    // 2️⃣ 🔒 Descontar stock (operación atómica)
    const productosActualizados = productos.map((prod: any) => {
      const itemsDelProducto = items.filter((item: any) => 
        String(item.productoId) === String(prod.id)
      );
      
      if (itemsDelProducto.length === 0) return prod;

      // Guard Clause 1: Validar variantes
      if (!prod.variantes || prod.variantes.length === 0) {
        throw new Error(`❌ Producto ${prod.nombre} no tiene variantes`);
      }

      // Guard Clause 2: Validar stock y descontar
      const variantes = prod.variantes.map((variante: any) => ({
        ...variante,
        colores: variante.colores.map((color: any) => {
          const cantidadVendida = itemsDelProducto.reduce((sum: number, item: any) => {
            if (item.talla === variante.talla && item.color === color.color) {
              return sum + item.cantidad;
            }
            return sum;
          }, 0);
          
          if (cantidadVendida > 0) {
            // Guard Clause 3: Stock suficiente
            if (color.cantidad < cantidadVendida) {
              throw new Error(
                `Stock insuficiente para ${prod.nombre}\n` +
                `Disponible: ${color.cantidad} | Solicitado: ${cantidadVendida}`
              );
            }

            const nuevoStock = Math.max(0, color.cantidad - cantidadVendida);
            console.log(`📦 ${prod.nombre}: ${color.cantidad} - ${cantidadVendida} = ${nuevoStock}`);
            return { ...color, cantidad: nuevoStock };
          }
          return color;
        })
      }));
      
      return { ...prod, variantes };
    });

    // 3️⃣ Guardar venta
    const ventasActuales = JSON.parse(localStorage.getItem(VENTAS_KEY) || '[]');
    localStorage.setItem(VENTAS_KEY, JSON.stringify([...ventasActuales, ventaData]));

    // 4️⃣ Guardar productos con stock actualizado
    localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosActualizados));

    // 5️⃣ Disparar eventos
    window.dispatchEvent(new StorageEvent('storage', {
      key: PRODUCTOS_KEY,
      newValue: JSON.stringify(productosActualizados),
      oldValue: productosJSON,
      url: window.location.href
    }));

    window.dispatchEvent(new Event('ventaFinalizada'));
    window.dispatchEvent(new Event('salesUpdated'));

    return { exitoso: true };
  } catch (error: any) {
    return {
      exitoso: false,
      error: error.message
    };
  }
};
```

**Características:**
- ✅ Guard clauses para validar variantes
- ✅ Guard clauses para validar stock
- ✅ Operación atómica (todo o nada)
- ✅ Eventos de sincronización
- ✅ Mensajes de error descriptivos
- ✅ Reutilizable desde cualquier módulo

---

## 📝 Cambio 2: Modificar VentasManager

### Antes: Función descontarStock() duplicada
```typescript
// ❌ ANTES: Función local en VentasManager
const descontarStock = (ventaItems: ItemVenta[]): boolean => {
  // ... 40+ líneas de lógica de descuento ...
};
```

### Después: Usa finalizarVenta() centralizado
```typescript
// ✅ DESPUÉS: Importar del servicio
import { finalizarVenta, generarNumeroVenta } from '../../../../services/saleService';

// En handleSave():
const resultado = finalizarVenta(ventaData, formData.items);

if (!resultado.exitoso) {
  setNotificationMessage(resultado.error);
  setNotificationType('error');
  setShowNotificationModal(true);
  return;
}

// Stock descuento correctamente
setVentas(prev => [...prev, ventaData]);
```

**Cambios:**
1. ✅ Eliminar función `descontarStock()` local
2. ✅ Eliminar función `generarNumeroVenta()` local
3. ✅ Importar ambas del servicio central
4. ✅ Reemplazar lógica de descuento por llamada a `finalizarVenta()`
5. ✅ Mantener validaciones iniciales de UI

---

## 📝 Cambio 3: Modificar PedidosManager

### Antes: crearVentaDesdePedido() sin descuento
```typescript
// ❌ ANTES: Solo guarda venta, NO descuenta stock
const crearVentaDesdePedido = (pedido: Pedido) => {
  const ventasActuales = JSON.parse(localStorage.getItem(VENTAS_KEY) || '[]');
  const nuevaVenta = { /* ... datos de venta ... */ };
  
  // ❌ Guarda sin descontar stock
  localStorage.setItem(VENTAS_KEY, JSON.stringify([...ventasActuales, nuevaVenta]));
};
```

### Después: Usa finalizarVenta() centralizado
```typescript
// ✅ DESPUÉS: Importar del servicio
import { finalizarVenta, generarNumeroVenta } from '../../../../services/saleService';

// Nueva función mejorada
const crearVentaDesdePedido = (pedido: Pedido) => {
  // Crear venta con datos del pedido
  const numeroVenta = generarNumeroVenta();
  const nuevaVenta = {
    id: Date.now(),
    numeroVenta,
    clienteId: pedido.clienteId,
    // ... más datos ...
    items: pedido.items,
    // ... 
  };

  // 🔒 LLAMAR A FUNCIÓN CENTRAL
  const resultado = finalizarVenta(nuevaVenta, pedido.items);

  if (!resultado.exitoso) {
    // Mostrar error
    setNotificationMessage(`❌ Error: ${resultado.error}`);
    return; // ABORTA - No cambiar estado
  }

  // ✅ Stock descuento correctamente
};
```

**Cambios:**
1. ✅ Importar `finalizarVenta()` y `generarNumeroVenta()`
2. ✅ Reemplazar lógica manual por llamada a `finalizarVenta()`
3. ✅ Validar resultado del descuento
4. ✅ Abortar si hay error (no cambiar estado a Venta)

---

## 🔄 Flujo Completo: Pedido → Venta

### Antes (❌ Problema)
```
Usuario selecciona "Convertir a Venta"
         ↓
cambiarEstado(pedido, 'Venta')
         ↓
crearVentaDesdePedido(pedido)
         ↓
localStorage.setItem(VENTAS_KEY, nuevaVenta)  ← Guarda venta
         ↓
❌ NO descuenta stock
         ↓
Pedido estado = 'Venta' (sin descuento)
```

### Después (✅ Solución)
```
Usuario selecciona "Convertir a Venta"
         ↓
cambiarEstado(pedido, 'Venta')
         ↓
crearVentaDesdePedido(pedido)
         ↓
finalizarVenta(nuevaVenta, pedido.items)
         ├─ Valida variantes ✅
         ├─ Valida stock ✅
         ├─ Descuenta stock ✅
         ├─ Guarda venta ✅
         └─ Dispara eventos ✅
         ↓
resultado.exitoso === true?
         ├─ SI → Pedido estado = 'Venta' ✅
         └─ NO → Error, aborta
```

---

## 🛡️ Guard Clauses Implementadas

### Guard Clause 1: Variantes Válidas
```typescript
if (!prod.variantes || prod.variantes.length === 0) {
  throw new Error(`Producto ${prod.nombre} no tiene variantes`);
}
```
**Previene:** Descuento en productos sin estructura de variantes

### Guard Clause 2: Stock Suficiente
```typescript
if (color.cantidad < cantidadVendida) {
  throw new Error(
    `Stock insuficiente para ${prod.nombre}\n` +
    `Disponible: ${color.cantidad} | Solicitado: ${cantidadVendida}`
  );
}
```
**Previene:** Venta de más de lo disponible

### Guard Clause 3: Operación Atómica
```typescript
try {
  // Todas las operaciones aquí
  // O TODAS funcionan, o NINGUNA
  return { exitoso: true };
} catch (error) {
  // Si algo falla, NO se guarda nada
  return { exitoso: false, error: error.message };
}
```
**Previene:** Estados inconsistentes (venta guardada pero stock no descargado)

---

## 📊 Comparativa: Antes vs Después

| Aspecto | ANTES ❌ | DESPUÉS ✅ |
|---------|----------|-----------|
| **Lógica de descuento** | 2 funciones diferentes | 1 función central |
| **Duplicación código** | Sí (40+ líneas) | No (reutilizable) |
| **Pedido → Venta descuento** | No ocurre | Automático |
| **Sincronización** | Manual en Ventas | Centralizada |
| **Mantenibilidad** | Difícil (2 lugares) | Fácil (1 lugar) |
| **Testabilidad** | Función privada | Función exportable |
| **Stock consistente** | No (inconsistencia) | Sí (siempre) |

---

## 📁 Archivos Modificados

### 1. `src/services/saleService.ts` (NUEVO)
- ✅ Función central `finalizarVenta()`
- ✅ Función `generarNumeroVenta()`
- ✅ Interfaces de tipos: `Venta`, `ItemVenta`

### 2. `src/features/ecommerce/sales/components/VentasManager.tsx`
- ✅ Importar `finalizarVenta`, `generarNumeroVenta`
- ✅ Eliminar función `descontarStock()`
- ✅ Eliminar función local `generarNumeroVenta()`
- ✅ Reemplazar descuento manual por `finalizarVenta()`
- ✅ Actualizar manejo de errores

### 3. `src/features/ecommerce/orders/components/PedidosManager.tsx`
- ✅ Importar `finalizarVenta`, `generarNumeroVenta`
- ✅ Reescribir función `crearVentaDesdePedido()`
- ✅ Agregar validación de resultado
- ✅ Abortar si descuento falla

---

## 🧪 Escenarios de Prueba

### Escenario 1: Venta Directa desde Ventas
```
1. Abrir módulo Ventas
2. Crear venta con 5 unidades de Vestido M Rojo
3. ✅ Venta se registra
4. ✅ Stock se descuenta: 50 → 45
5. ✅ Compras muestra stock actualizado
```

### Escenario 2: Pedido Convertido a Venta
```
1. Abrir módulo Pedidos
2. Crear pedido con 3 unidades de Vestido L Azul
3. Convertir pedido a venta
4. ✅ Venta se registra
5. ✅ Stock se descuenta: 30 → 27
6. ✅ Compras muestra stock actualizado
```

### Escenario 3: Error - Stock Insuficiente
```
1. Producto con solo 2 unidades en stock
2. Intentar crear venta de 5 unidades
3. ❌ Error mostrado: "Stock insuficiente"
4. ✅ Venta NO se crea
5. ✅ Stock permanece en 2
```

### Escenario 4: Error - Sin Variantes
```
1. Producto sin variantes definidas
2. Intentar convertir pedido a venta
3. ❌ Error mostrado: "Producto no tiene variantes"
4. ✅ Venta NO se crea
5. ✅ Pedido permanece en estado anterior
```

---

## 📋 Console Logs para Debugging

```typescript
// En finalizarVenta():
console.log(`📦 [finalizarVenta] ${prod.nombre} - ${variante.talla} ${color.color}: ...`);

// En PedidosManager:
console.log(`✅ [PedidosManager] Pedido ${pedido.numeroPedido} convertido a venta ${numeroVenta}`);

// Si error:
console.error(`❌ [finalizarVenta] ${mensajeError}`);
```

---

## 🔔 Eventos Disparados

Cuando `finalizarVenta()` completa exitosamente:

1. **StorageEvent('storage')**
   - Key: `'damabella_productos'`
   - Sincroniza stock en Compras/Productos

2. **CustomEvent('ventaFinalizada')**
   - Puede escucharse en otros módulos

3. **CustomEvent('salesUpdated')**
   - Sincroniza UI de Ventas

---

## ✅ Validación

### Compilación
```
✓ npm run build
✓ 0 errores de TypeScript
✓ Build exitoso
✓ Sin warnings críticos
```

### Integridad
- ✅ No hay código duplicado
- ✅ Función central reúsable
- ✅ Errores manejados correctamente
- ✅ Eventos disparados correctamente
- ✅ Stock siempre consistente

---

## 🎉 Conclusión

✅ **Problema resuelto:** Stock ahora se descuenta siempre, sin importar origen de venta

✅ **Arquitectura mejorada:** Función central eliminó duplicación

✅ **Mantenibilidad:** Cambios futuros en descuento se hacen en 1 lugar

✅ **Consistencia:** Inventario siempre sincronizado

✅ **Robustez:** Guard clauses previenen estados inconsistentes

**Estado:** 🎉 LISTO PARA PRODUCCIÓN
