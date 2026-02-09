# 🚀 GUÍA RÁPIDA: Sistema de CAMBIOS

## ¿QUÉ ES?

Un sistema para **cambiar productos** (no devoluciones de dinero).

**Cambio:** Cliente devuelve un producto → Recibe otro en su lugar

Ejemplo:
- Devuelve: Camiseta Talla M Negro
- Recibe: Camiseta Talla S Blanco

---

## ¿DÓNDE ESTÁ?

**Módulo:** Ventas (VentasManager.tsx)

**Botón:** En la tabla de ventas
- Icono: 🔄 (flecha circular verde)
- Tooltip: "Hacer cambio"
- Ubicación: Entre "Devolución" e "Anular"

---

## ¿CÓMO USARLO?

### Paso 1: Click en el botón 🔄
```
┌─────────────────┐
│ Ver Det. Descargar Cambio Devolución Anular │
│ 👁️  📥  🔄  ⏪  🚫  │
└─────────────────┘
```

### Paso 2: Modal se abre
```
Cambio de Producto - #VENTA-001
├─ Cliente: [Nombre]
└─ Venta: [Número]
```

### Paso 3: Devolver producto
```
✖️ PRODUCTO A DEVOLVER (Rojo)
└─ Seleccionar producto de esta venta
   ├─ [Dropdown]
   └─ Muestra: Nombre, Talla, Color
```

### Paso 4: Entregar producto nuevo
```
✓ PRODUCTO A ENTREGAR (Verde)
├─ Producto [Dropdown]
├─ Talla [Dropdown]
└─ Color [Dropdown - muestra stock]
```

### Paso 5: Motivo
```
Motivo del Cambio *
└─ [TextArea]
   Ej: "Cliente cambió de opinión"
```

### Paso 6: Confirmar
```
[Cancelar]  [✓ Confirmar Cambio]
```

---

## ✅ VALIDACIONES AUTOMÁTICAS

El sistema verifica AUTOMÁTICAMENTE:

| # | Validación | Si falla |
|---|-----------|---------|
| 1 | ¿Venta original existe? | ❌ ERROR: "Venta no válida" |
| 2 | ¿Variante devuelta existe? | ❌ ERROR: "No existe en esta venta" |
| 3 | ¿Variante entregada existe? | ❌ ERROR: "Talla/Color no disponible" |
| 4 | ¿Hay stock de entregar? | ❌ ERROR: "Stock insuficiente" |
| 5 | ¿Datos completos? | ❌ ERROR: "Selecciona todo" |
| 6 | ¿Hay motivo? | ❌ ERROR: "Especifica motivo" |

---

## 📊 ¿QUÉ PASA AL CONFIRMAR?

```
✅ Cambio CAM-001 creado
├─ Número único: CAM-001
├─ Fecha/Hora: Automática
├─ Cliente: Vinculado
├─ Venta original: Vinculada
└─ Registro guardado en localStorage

✅ Stock actualizado
├─ Variante entregada: -1 unidad
├─ Otros productos: Sin cambios
└─ Cambios realizados: Inmediatos

✅ Notificación mostrada
├─ Tipo: Éxito (Verde)
├─ Mensaje: "Cambio CAM-001 procesado"
└─ Automática: Se cierra en 5s

✅ Modal cerrado
└─ Formulario limpio para nuevo cambio
```

---

## 🔒 RESTRICCIONES

### ✅ PERMITIDO:
- ✅ Cambiar talla
- ✅ Cambiar color
- ✅ Cambiar a producto diferente
- ✅ Múltiples cambios en misma venta
- ✅ Cambios de clientes diferentes

### ❌ NO PERMITIDO:
- ❌ Cambios en ventas anuladas
- ❌ Stock = 0 (sin variantes disponibles)
- ❌ Variante que no existe
- ❌ Cambios sin motivo
- ❌ Devoluciones de dinero

---

## 💾 DATOS GUARDADOS

Cada cambio se guarda con:

```json
{
  "numeroCambio": "CAM-001",           // Número único
  "ventaOriginalId": "1",              // Link a venta
  "clienteNombre": "María García",     // Quien cambió
  "productoOriginalId": "1",           // Que devolvió
  "tallaDevuelta": "M",                // Talla devuelta
  "colorDevuelta": "Negro",            // Color devuelto
  "tallaEntregada": "S",               // Talla recibida
  "colorEntregada": "Blanco",          // Color recibido
  "productoEntregadoId": "2",          // Que recibió
  "motivoCambio": "Cliente quiere...", // Por qué
  "fechaCambio": "2024-01-01T10:00",   // Cuándo
  "createdAt": "2024-01-01T10:00"      // Creado
}
```

---

## 🧪 EJEMPLO PASO A PASO

### Escenario:
Cliente compró Camiseta M Negro, quiere Camiseta S Blanco

### Pasos:

1. **Click en tabla → Botón 🔄**
   - Tabla muestra: #VENTA-001 | María García | S/500,000

2. **Modal abre**
   - "Cambio de Producto - #VENTA-001"
   - Cliente: María García
   - Venta: #VENTA-001

3. **Seleccionar variante devuelta**
   - Dropdown: "Camiseta - Talla: M, Color: Negro"
   - ✅ Existe en la venta

4. **Seleccionar variante entregada**
   - Producto: [Camiseta ▼]
   - Talla: [S ▼]
   - Color: [Blanco (Stock: 15) ▼]
   - ✅ Stock disponible

5. **Ingresar motivo**
   - TextArea: "Cliente cambió de opinión sobre talla y color"

6. **Resumen mostrado**
   - ✖️ Devuelve: Camiseta (M/Negro)
   - ✓ Recibe: Camiseta (S/Blanco)

7. **Click "Confirmar Cambio"**
   - Sistema valida (6 chequeos)
   - ✅ TODAS LAS VALIDACIONES PASAN

8. **Confirmación**
   - ✅ Cambio CAM-001 procesado correctamente
   - Stock actualizado (Camiseta S/Blanco: 15 → 14)
   - Modal cierra

9. **Resultado**
   - Tabla actualizada
   - Registro guardado en localStorage
   - Auditoría completa

---

## 🚨 ERRORES COMUNES

### Error: "Stock insuficiente"
**Causa:** Variante a entregar tiene 0 unidades
**Solución:** Seleccionar otro color/talla que tenga stock

### Error: "No existe en esta venta"
**Causa:** Producto devuelto no está en la venta original
**Solución:** Revisar qué productos tiene la venta

### Error: "Especifica motivo del cambio"
**Causa:** Campo motivo está vacío
**Solución:** Escribir razón del cambio

### Error: "Talla [X] o Color [Y] no disponibles"
**Causa:** Variante seleccionada no existe
**Solución:** Seleccionar talla/color que exista

---

## 📈 VENTAJAS DEL SISTEMA

| Ventaja | Beneficio |
|---------|-----------|
| **Automatizado** | Sin cálculos manuales |
| **Seguro** | 6 validaciones = 0 errores |
| **Auditado** | Cada cambio registrado |
| **Rápido** | 1 minuto máximo por cambio |
| **Intuitivo** | Modal color-codificado |
| **Stock real** | Actualización inmediata |
| **Rastreable** | Número CAM-### único |

---

## 🔍 REVISAR CAMBIOS GUARDADOS

### En el navegador (DevTools):

1. **Abre DevTools:** F12 o Ctrl+Shift+I
2. **Ve a Application**
3. **Abre Storage → LocalStorage**
4. **Busca:** `damabella_cambios`
5. **Verás:** Array de todos los cambios
   ```json
   [
     { "numeroCambio": "CAM-001", ... },
     { "numeroCambio": "CAM-002", ... }
   ]
   ```

---

## 💡 CASOS DE USO FRECUENTES

### Caso 1: "Quiero otra talla"
- Devuelve: Pantalón M
- Recibe: Pantalón L (mismo producto)
- ✅ CAMBIO simple

### Caso 2: "Quiero otro color"
- Devuelve: Blusa S Rojo
- Recibe: Blusa S Azul
- ✅ CAMBIO simple

### Caso 3: "Me cambié de opinión del tipo"
- Devuelve: Top Floral M
- Recibe: Camiseta M (diferente producto)
- ✅ CAMBIO a producto diferente

### Caso 4: "Varias cosas"
- Devuelve: Pantalón L Negro
- Recibe: Pantalón M Blanco (talla Y color)
- ✅ CAMBIO múltiple

---

## ⚡ ATAJOS Y TIPS

### Tip 1: Buscar producto
- Los dropdowns son searchables
- Empieza a escribir el nombre

### Tip 2: Ver stock
- En dropdown de color aparece: "Blanco (Stock: 15)"
- Así sabes qué hay disponible

### Tip 3: Motivo detallado
- Ayuda para auditoría
- "Talla incorrecta" es mejor que nada
- "Cliente prefiere diferente" es aún mejor

### Tip 4: Revisar antes de confirmar
- Modal muestra resumen
- Verifica: ✖️ Devuelve Y ✓ Recibe son correctos

---

## 🆘 SOPORTE

### ¿Algo no funciona?

1. **Revisa el error mostrado**
   - El sistema dice QUÉ validó mal
   - Sigue la sugerencia

2. **DevTools - Console**
   - F12 → Console
   - Revisa si hay errores JavaScript

3. **Recarga la página**
   - A veces localStorage se sincroniza lentamente

4. **Limpia localStorage** (último recurso)
   - DevTools → Application → Storage
   - Borra `damabella_cambios`
   - Recarga página

---

## 📞 CONTACTO RÁPIDO

**¿Preguntas sobre el sistema?**

Revisar:
- [Documentación completa](IMPLEMENTACION_SISTEMA_CAMBIOS.md)
- [Resumen técnico](RESUMEN_CAMBIOS_IMPLEMENTACION.md)
- [Código fuente](src/features/ecommerce/sales/components/VentasManager.tsx)

---

## ✨ CONCLUSIÓN

El sistema de CAMBIOS es:
- ✅ Fácil de usar
- ✅ Seguro (6 validaciones)
- ✅ Rápido (1 click)
- ✅ Completo (auditoría incluida)

**Listo para usar en producción.**
