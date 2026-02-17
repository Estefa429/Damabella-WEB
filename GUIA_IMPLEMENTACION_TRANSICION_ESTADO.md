/**
 * 📚 GUÍA DE IMPLEMENTACIÓN - Transición de Estado de Pedidos
 * 
 * Documento paso a paso para integrar la lógica de transición de estado
 * en el componente PedidosManager.tsx
 */

# 🎯 Guía de Implementación: Transición Pedido → Completada con Sincronización a Ventas

## 📋 Resumen de Cambios

Este sistema implementa:
1. **Validación de transiciones** según reglas de negocio
2. **Sincronización automática** con módulo de Ventas
3. **Control de edición** por estado (solo Pendiente)
4. **Feedback visual** mediante notificaciones

---

## 🚀 PASO 1: Importar Servicios en PedidosManager.tsx

```typescript
// En la parte superior de PedidosManager.tsx
import {
  transicionarPedido,
  puedeSerEditado,
  puedeSerAnulado,
  puedeSerCompletado,
  obtenerClaseEstado,
  obtenerDescripcionEstado
} from '../services/transicionEstadoPedidoService';

import { usePedidoTransicion } from '../hooks/usePedidoTransicion';
```

---

## 🎣 PASO 2: Usar el Hook en el Componente

Dentro del componente `PedidosManager`, reemplaza la sección del estado:

```typescript
export default function PedidosManager() {
  // ... otros estados existentes ...

  // ✅ NUEVO: Hook para manejar transiciones
  const {
    cambiarEstado: transicionar,
    limpiarMensajes,
    puedeSerEditado: puedeEditarse,
    puedeSerCompletado: puedeCompletarse,
    puedeSerAnulado: puedeAnularse
  } = usePedidoTransicion({
    onTransicionExitosa: (resultado) => {
      // Actualizar lista local
      setPedidos(pedidos.map(p =>
        p.id === resultado.pedido?.id ? resultado.pedido! : p
      ));

      // Mostrar notificación
      setNotificationMessage(resultado.mensaje);
      setNotificationType('success');
      setShowNotificationModal(true);
    },
    onErrorTransicion: (error) => {
      // Mostrar error
      setNotificationMessage(error);
      setNotificationType('error');
      setShowNotificationModal(true);
    },
    onSincronizarVentas: (pedido) => {
      // Sincronizar con módulo de Ventas
      crearVentaDesdePedido(pedido);
    }
  });

  // ... resto del código ...
}
```

---

## 🔄 PASO 3: Reemplazar la Función cambiarEstado Existente

La función antigua:
```typescript
const cambiarEstado = (pedido: Pedido, nuevoEstado: Pedido['estado']) => {
  setPedidos(pedidos.map(p =>
    p.id === pedido.id ? { ...p, estado: nuevoEstado } : p
  ));

  if (nuevoEstado === 'Completada') {
    crearVentaDesdePedido({ ...pedido, estado: nuevoEstado });
  }
};
```

La nueva (mejorada):
```typescript
const cambiarEstado = async (pedido: Pedido, nuevoEstado: Pedido['estado']) => {
  // Usar el hook que maneja validación y sincronización
  await transicionar(pedido.numeroPedido, nuevoEstado);
};
```

---

## ✏️ PASO 4: Actualizar handleEdit para Bloquear Ediciones

```typescript
const handleEdit = (pedido: Pedido) => {
  // ✅ NUEVO: Validar si se puede editar
  if (!puedeEditarse(pedido.estado)) {
    setNotificationMessage(
      `No puedes editar un pedido en estado "${pedido.estado}". ` +
      `Solo se pueden editar pedidos Pendientes.`
    );
    setNotificationType('error');
    setShowNotificationModal(true);
    return;
  }

  // ... resto de la lógica de edición ...
  setEditingPedido(pedido);
  setShowModal(true);
};
```

---

## 🎨 PASO 5: Actualizar Botones en la Tabla

**ANTES:**
```tsx
<button
  onClick={() => handleEdit(pedido)}
  disabled={pedido.estado === 'Completada' || pedido.estado === 'Anulado'}
  className="..."
>
  Editar
</button>
```

**DESPUÉS:**
```tsx
<button
  onClick={() => handleEdit(pedido)}
  disabled={!puedeEditarse(pedido.estado)}
  className={`px-3 py-2 rounded transition-all ${
    puedeEditarse(pedido.estado)
      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
  }`}
  title={
    puedeEditarse(pedido.estado)
      ? 'Editar este pedido'
      : `No se puede editar en estado ${pedido.estado}`
  }
>
  ✎ Editar
</button>
```

---

## 🟢 PASO 6: Agregar Botones de Estado

En la tabla, después de los botones de edición:

```tsx
{/* Botones para cambiar estado */}
<div className="flex gap-2">
  {/* Completar (solo si está Pendiente) */}
  {puedeCompletarse(pedido.estado) && (
    <button
      onClick={() => cambiarEstado(pedido, 'Completada')}
      className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium"
      title="Marcar como completado y crear venta automáticamente"
    >
      ✓ Completar
    </button>
  )}

  {/* Anular (si está Pendiente o Completada) */}
  {puedeAnularse(pedido.estado) && (
    <button
      onClick={() => cambiarEstado(pedido, 'Anulado')}
      className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
      title="Cancelar este pedido"
    >
      ✕ Anular
    </button>
  )}

  {/* Indicador de estado terminal */}
  {pedido.estado === 'Anulado' && (
    <span className="px-3 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium">
      Estado terminal
    </span>
  )}
</div>
```

---

## 🎨 PASO 7: Mejorar Badge de Estado

Actualizar la columna de estado en la tabla:

```tsx
<td className="px-4 py-3">
  <span
    className={`px-3 py-1 rounded-full text-sm font-semibold ${obtenerClaseEstado(
      pedido.estado
    )}`}
    title={obtenerDescripcionEstado(pedido.estado)}
  >
    {pedido.estado}
  </span>
</td>
```

---

## 🔐 PASO 8: Validar en handleSave

Cuando se intente guardar un pedido editado:

```typescript
const handleSave = () => {
  // Bloquear si el estado no permite edición
  if (editingPedido && !puedeEditarse(editingPedido.estado)) {
    setNotificationMessage(
      `No puedes editar un pedido en estado "${editingPedido.estado}".`
    );
    setNotificationType('error');
    setShowNotificationModal(true);
    return;
  }

  // ... resto de la lógica de guardado ...
};
```

---

## 📊 REGLAS DE NEGOCIO IMPLEMENTADAS

| Transición | Permitida | Restricción |
|-----------|-----------|-----------|
| Pendiente → Completada | ✅ Sí | Stock suficiente, crea venta automáticamente |
| Pendiente → Anulado | ✅ Sí | Siempre permitido |
| Completada → Anulado | ✅ Sí | Siempre permitido |
| Completada → Pendiente | ❌ No | **BLOQUEADO** |
| Anulado → Cualquiera | ❌ No | **BLOQUEADO** (terminal) |

---

## 📦 MANEJO DE STOCK

- **Pendiente → Completada**: Descuenta stock automáticamente
- **Completada → Anulado**: Devuelve stock
- **Pendiente → Anulado**: Sin cambio de stock (nunca se descargó)

---

## 🔔 EVENTOS Y SINCRONIZACIÓN

Cuando se cambia a "Completada":

1. ✅ Valida que sea posible (Pendiente → Completada)
2. ✅ Descuenta stock automáticamente
3. ✅ Llama callback `onSincronizarVentas(pedido)`
4. ✅ Crea automáticamente una venta en el módulo Ventas
5. ✅ Dispara evento personalizado para compatibilidad

---

## 🧪 PRUEBAS SUGERIDAS

```typescript
// Test 1: Crear pedido Pendiente y completarlo
test('Puede completar pedido Pendiente', async () => {
  const pedido = crear pedido con estado: 'Pendiente'
  await cambiarEstado(pedido, 'Completada')
  // Verificar: pedido.estado === 'Completada'
  // Verificar: venta fue creada
  // Verificar: stock fue descargado
});

// Test 2: No puede completar dos veces
test('No puede volver de Completada a Pendiente', async () => {
  const pedido = { ...pedidoCompletado }
  const resultado = await cambiarEstado(pedido, 'Pendiente')
  // Verificar: resultado.success === false
  // Verificar: error message contiene "no permitida"
});

// Test 3: Solo se pueden editar Pendiente
test('Solo edita si estado es Pendiente', () => {
  // Pendiente: puede editar ✅
  assert(puedeEditarse('Pendiente') === true)
  // Completada: no puede editar ❌
  assert(puedeEditarse('Completada') === false)
  // Anulado: no puede editar ❌
  assert(puedeEditarse('Anulado') === false)
});
```

---

## 🐛 TROUBLESHOOTING

### Problema: Venta no se crea al completar
**Solución:** Verificar que el callback `onSincronizarVentas` esté pasado correctamente

```typescript
// ❌ INCORRECTO
const { cambiarEstado } = usePedidoTransicion();

// ✅ CORRECTO
const { cambiarEstado } = usePedidoTransicion({
  onSincronizarVentas: (pedido) => {
    crearVentaDesdePedido(pedido);
  }
});
```

### Problema: Errores de TypeScript
**Solución:** Importar tipos correctamente

```typescript
import type { Pedido } from '../services/pedidoService';
import type { ResultadoTransicion } from '../services/transicionEstadoPedidoService';
```

### Problema: Botones no desaparecen
**Solución:** Verificar que `puedeCompletarse()` se actualiza al cambiar estado

```typescript
// Asegurarse que setPedidos dispara re-render
const nuevoPedido = { ...pedido, estado: 'Completada' };
setPedidos(prev => prev.map(p => p.id === pedido.id ? nuevoPedido : p));
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Importar servicios y hook
- [ ] Reemplazar función `cambiarEstado`
- [ ] Actualizar `handleEdit` con validación
- [ ] Actualizar botones de edición
- [ ] Agregar botones de Completar/Anular
- [ ] Mejorar badge de estado
- [ ] Validar en `handleSave`
- [ ] Probar transiciones:
  - [ ] Pendiente → Completada (crea venta)
  - [ ] Pendiente → Anulado
  - [ ] Completada → Anulado
  - [ ] Completada → Pendiente (debe fallar)
  - [ ] Anulado → X (debe fallar)
- [ ] Verificar stock se ajusta correctamente
- [ ] Probar notificaciones
- [ ] Verificar botones se habilitan/deshabilitan correctamente

---

## 📞 CONTACTO Y SOPORTE

Para dudas sobre la implementación, revisar:
- `src/services/transicionEstadoPedidoService.ts` - Lógica central
- `src/hooks/usePedidoTransicion.ts` - Hook y componentes
- `src/examples/EjemploTransicionEstado.tsx` - Ejemplos
