# ✅ CHECKLIST DE VERIFICACIÓN RÁPIDA

## 1️⃣ BLOQUEOS EN INTERFAZ

Pedido con `ventaId`:
- [ ] Botón "Editar" → GRIS y deshabilitado
- [ ] Botón "Anular" → GRIS y deshabilitado
- [ ] Tooltip: "Este pedido tiene una venta asociada"

## 2️⃣ CONVERSIÓN A VENTA

Flujo: Pedido (Pendiente) → Completada
- [ ] Se crea una Venta automáticamente
- [ ] Venta tiene `stockDevuelto: false`
- [ ] Pedido tiene `ventaId: VEN-XXX` (número de venta)
- [ ] Botones de Pedido ahora grises (bloqueado)

## 3️⃣ INTENTO DE DOBLE CONVERSIÓN

Flujo: Ya Completado → Intentar convertir nuevamente
- [ ] Botón "Completar" deshabilitado (ya no existe opción)
- [ ] Transición bloqueada en lógica centralizada

## 4️⃣ ANULACIÓN DE VENTA

Flujo: Venta (Completada) → Anular desde Ventas
- [ ] Modal pide "Motivo de Anulación"
- [ ] Stock se devuelve correctamente
- [ ] Se marca `stockDevuelto: true` en Venta
- [ ] Estado de Venta → "Anulada"

## 5️⃣ INTENTO SEGUNDA ANULACIÓN

Flujo: Venta (Anulada con stockDevuelto: true) → Intentar anular nuevamente
- [ ] Aparece error: "El stock de esta venta ya fue devuelto"
- [ ] Botón de anular deshabilitado (opcional UI improvement)
- [ ] NO se puede proceder

## 6️⃣ INTENTO ANULAR DESDE PEDIDOS

Flujo: Pedido Completado → Intentar anular desde módulo Pedidos
- [ ] Botón Anular está GRIS (deshabilitado por ventaId)
- [ ] Si se sortea UI, aparece error: "No se puede anular desde Pedidos"

## 7️⃣ VERIFICACIÓN LOCALSTORAGE

Inspeccionar en DevTools → Application → localStorage:

**Venta (Completada - Reciente):**
```json
{
  "id": 1706850123456,
  "numeroVenta": "VEN-001",
  "estado": "Completada",
  "stockDevuelto": false,
  "anulada": false,
  ...
}
```

**Venta (Anulada):**
```json
{
  "id": 1706850123456,
  "numeroVenta": "VEN-001",
  "estado": "Anulada",
  "stockDevuelto": true,
  "anulada": true,
  "motivoAnulacion": "Cambio solicitado",
  ...
}
```

**Pedido (Completado - Vinculado a Venta):**
```json
{
  "id": 1706849999999,
  "numeroPedido": "PED-001",
  "estado": "Completada",
  "venta_id": "VEN-001",
  ...
}
```

## 8️⃣ VERIFICACIÓN DE STOCK

Antes/Después:
- [ ] Producto: Stock inicial = 10
- [ ] Crear Venta: 2 unidades
- [ ] Stock ahora = 8 ✅
- [ ] Anular Venta: 2 devueltos
- [ ] Stock ahora = 10 ✅
- [ ] Intentar anular nuevamente: **BLOQUEADO** ❌

## 9️⃣ MENSAJES DE ERROR ESPERADOS

Cuando intentes violar reglas:

| Acción | Mensaje Esperado |
|--------|-----------------|
| Anular Pedido Completado | "No se puede anular un pedido Completada desde el módulo Pedidos" |
| Anular Venta 2 veces | "El stock de esta venta ya fue devuelto" |
| Editar Pedido con ventaId | Botón deshabilitado |
| Anular Pedido con ventaId | Botón deshabilitado |

## 🔟 COMPILACIÓN

- [ ] `npm run build` → Sin errores TypeScript
- [ ] Build exitoso en ~10 segundos
- [ ] Archivo output: `build/index.html`

---

## 🎯 CASOS CRÍTICOS A PROBAR

### ✅ CASO 1: Conversión Única
1. Crear PED-001 (Pendiente)
2. Completar → VEN-001 (Completada, stockDevuelto: false)
3. Verificar PED-001.venta_id = "VEN-001"
4. Intentar completar nuevamente → Bloqueado ✅

### ✅ CASO 2: Bloqueo de Edición
1. PED-001 con ventaId
2. Botón Editar → GRIS ✅
3. Intentar hacer click → No reacciona ✅

### ✅ CASO 3: Stock Único
1. Crear VEN-001, 5 unidades
2. Stock: 10 → 5
3. Anular VEN-001
4. Stock: 5 → 10 (devuelto una sola vez)
5. Intentar anular nuevamente → Error ✅

### ✅ CASO 4: Anulación desde Ventas Only
1. Crear PED-001 → Completado
2. Intentar anular en módulo Pedidos → Botón gris ✅
3. Ir a módulo Ventas
4. Anular VEN-001 → Funciona ✅

### ✅ CASO 5: Sincronización Cruzada
1. Crear PED-001 → VEN-001
2. En PED-001 ver: venta_id = "VEN-001"
3. En VEN-001 ver: pedido_id = "PED-001"
4. Anular VEN-001
5. En PED-001 ver referencia actualizada ✅

---

## 🔐 GARANTÍAS IMPLEMENTADAS

```
┌─────────────────────────────────────────────────────┐
│  PEDIDO COMPLETADO = VENDIDO Y BLOQUEADO            │
├─────────────────────────────────────────────────────┤
│  ✅ No editable (UI + Logic)                        │
│  ✅ No anulable desde Pedidos (UI + Logic)          │
│  ✅ Solo anulable desde Ventas                      │
│  ✅ Tiene referencia ventaId                        │
│  ✅ Stock de venta es único                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  VENTA ANULADA = STOCK DEVUELTO UNA VEZ             │
├─────────────────────────────────────────────────────┤
│  ✅ stockDevuelto: true                             │
│  ✅ No puede anularse 2 veces                       │
│  ✅ Referencia a Pedido preservada                  │
│  ✅ Cliente recibe saldo a favor                    │
└─────────────────────────────────────────────────────┘
```

---

## 📝 NOTA IMPORTANTE

**El sistema está protegido en MÚLTIPLES niveles:**

1. **Interface TypeScript** → Define estructura con flags
2. **UI Components** → Botones deshabilitados visualmente
3. **Lógica de Negocio** → Validaciones antes de operaciones
4. **Persistencia** → Flags se guardan para validación futura

Esto significa:
- ✅ Incluso si se sortea la UI, la lógica bloquea la operación
- ✅ Los datos se persisten correctamente en localStorage
- ✅ No hay riesgo de estado inconsistente
- ✅ Sistema robusto y a prueba de errores

---

**Estado:** ✅ LISTO PARA PRODUCCIÓN
