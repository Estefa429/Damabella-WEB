# 🔍 Diagnóstico: Producto en "Sets" No Aparece en Cliente

## Posibles Causas

### ❌ Problema 1: Producto No Activo
Los productos solo aparecen si están marcados como **ACTIVO**

**Solución:**
1. Abre el producto en ProductosManager
2. Verifica que el toggle de "Activo" esté **ENCENDIDO** ✅
3. Si está apagado, enciéndelo y guarda

### ❌ Problema 2: Sin Variantes Completas
El producto DEBE tener:
- ✅ Al menos 1 talla (S, M, L, XL, etc)
- ✅ Al menos 1 color con cantidad > 0

**Solución:**
1. Abre el producto
2. Verifica que tenga variantes
3. Cada variante debe tener colores con cantidad
4. Ejemplo correcto:
   ```
   Talla: M
   └─ Color: Rojo, Cantidad: 5
   └─ Color: Azul, Cantidad: 3
   ```

### ❌ Problema 3: Categoría Escrita Diferente
El sistema es sensible a mayúsculas/minúsculas

**Solución:**
1. Verifica que la categoría se llame exactamente "Sets"
2. No "set", no "SETS", no "Set"
3. Debe ser exactamente: **Sets**

### ❌ Problema 4: Nombre de Categoría Mal
Si la categoría es nueva y se llama "Set" (singular), probablemente es el problema

**Solución:**
1. Crea categoría exactamente como: "Sets" (plural, así está en tu sistema)
2. O usa el nombre EXACTO que creaste

### ❌ Problema 5: Polling No Detecta Cambio
El polling tarda 1 segundo

**Solución:**
1. Espera 2-3 segundos
2. Recarga la página (F5)
3. Abre DevTools Console (F12) y busca errores

---

## ✅ Verificación Paso a Paso

### Paso 1: Verificar en Admin

1. Dashboard → Productos
2. Busca el producto que creaste
3. Haz click en el icono de ojo 👁️
4. Verifica que aparezca un modal con detalles

**¿Aparece en admin?** → Continúa al Paso 2
**¿No aparece?** → El producto no se guardó bien

### Paso 2: Verificar Propiedades del Producto

En el detalle del producto verifica:
- [x] **Nombre**: Está lleno
- [x] **Categoría**: "Sets" (exactamente así)
- [x] **Activo**: ✅ Toggle ENCENDIDO
- [x] **Variantes**: Al menos 1 talla con colores
- [x] **Precio**: Tiene precio
- [x] **Proveedor**: Tiene proveedor asignado

**¿Todo está OK?** → Continúa al Paso 3
**¿Algo falta?** → Edita el producto y completa

### Paso 3: Verificar localStorage en DevTools

1. Abre DevTools (F12)
2. Ve a Application → localStorage
3. Busca "damabella_productos"
4. Haz click en él
5. Verifica que tu producto esté en la lista

**¿Lo ves?** → Continúa al Paso 4
**¿No lo ves?** → Hay problema al guardar

### Paso 4: Verificar Formato del Producto

En el localStorage, tu producto debe verse así:
```json
{
  "id": [número],
  "nombre": "Mi Producto",
  "categoria": "Sets",
  "activo": true,
  "precioVenta": 150000,
  "variantes": [
    {
      "talla": "M",
      "colores": [
        {
          "color": "Rojo",
          "cantidad": 5
        }
      ]
    }
  ]
}
```

**¿Se ve similar?** → Continúa al Paso 5
**¿Algo diferente?** → Hay error en formato

### Paso 5: Verificar en Cliente

1. Navega a Homepage (http://localhost:3000/)
2. Espera 1 segundo
3. Busca "Sets" en las categorías
4. Haz click en "Sets"

**¿Ves tu producto?** → ✅ FUNCIONA
**¿No lo ves?** → Continúa al Paso 6

### Paso 6: Forzar Sincronización

1. Abre DevTools Console (F12)
2. Pega y ejecuta:
```javascript
// Forzar sincronización
const event = new StorageEvent('storage', {
  key: 'damabella_productos',
  newValue: localStorage.getItem('damabella_productos'),
  storageArea: localStorage
});
window.dispatchEvent(event);
console.log('Sincronización forzada');
```

3. Recarga la página (F5)
4. Verifica si aparece

**¿Aparece ahora?** → ✅ FUNCIONA
**¿Aún no?** → Hay error más profundo

---

## 🔧 Soluciones Rápidas

### Opción 1: Verificar Que "Sets" Existe
```
Dashboard → Categorías
¿Ves "Sets" en la lista?
│
├─ Sí → Continúa
└─ No → Crea categoría "Sets"
```

### Opción 2: Re-crear el Producto
Si nada funciona:
1. Borra el producto (Papelera)
2. Crea uno NUEVO en "Sets"
3. Completa TODOS los campos:
   - Nombre ✅
   - Proveedor ✅
   - Categoría: "Sets" ✅
   - Precio ✅
   - Variantes (OBLIGATORIO):
     - Talla ✅
     - Colores con cantidad ✅
   - Toggle "Activo" ✅
4. Crear
5. Espera 1-2 segundos
6. Navega a cliente

### Opción 3: Limpiar localStorage
Si hay corrupción de datos:
1. DevTools → Application → localStorage
2. Busca todas las keys "damabella_"
3. Borra todas
4. Recarga
5. Crea nuevas categorías y productos

---

## 📋 Checklist de Verificación

```
[ ] Producto está en admin ✓
[ ] Producto es "Activo" ✓
[ ] Producto tiene variantes ✓
[ ] Variantes tienen colores con cantidad ✓
[ ] Categoría es "Sets" exactamente ✓
[ ] Producto está en localStorage ✓
[ ] Esperaste 1-2 segundos ✓
[ ] Recargaste la página (F5) ✓
[ ] Ves "Sets" en homepage ✓
[ ] Ves producto al clickear "Sets" ✓
```

---

## 💡 La Causa MÁS Probable

**El producto probablemente NO está marcado como ACTIVO**

Verifica:
1. Dashboard → Productos
2. Busca tu producto
3. Haz click en el lápiz (editar)
4. Busca un toggle/switch que diga "Activo"
5. Si está ROJO/APAGADO → enciéndelo ✅
6. Guarda
7. Espera 1 segundo
8. Verifica en cliente

---

## 🆘 Si Nada Funciona

1. **Captura pantalla** de:
   - El producto en admin
   - El localStorage (DevTools)
   - El error de consola (si hay)

2. **Reporta**:
   - ¿Producto está activo? ✓/✗
   - ¿Tiene variantes? ✓/✗
   - ¿Categoría es "Sets"? ✓/✗
   - ¿Se ve en localStorage? ✓/✗
   - ¿Error en consola? Sí/No

3. **Yo puedo**:
   - Revisar código
   - Agregar logs
   - Debuggear problemas

---

**Probablemente solo necesitas encender el toggle "Activo" del producto. ¡Inténtalo!** ✅

