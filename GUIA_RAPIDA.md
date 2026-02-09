# ⚡ Guía Rápida: Categorías y Productos Nuevos

## 🎯 Lo que Cambió

Ya **NO necesitas refresh** cuando agregas categorías y productos. Todo se sincroniza automáticamente.

---

## ✅ Pasos para Agregar Categoría + Productos

### 1. Ir al Panel Admin

```
Dashboard → Categorías
```

### 2. Crear Categoría Nueva
- Click en "+ Agregar Categoría"
- Nombre: "Bolsas"
- Descripción: "Bolsas de mano"
- Click "Crear"

**RESULTADO**: Se guarda en `damabella_categorias`

---

### 3. Ir a Productos

```
Dashboard → Productos
```

### 4. Crear Producto en Categoría Nueva
- Click en "+ Nuevo Producto"
- Nombre: "Bolsa de Mano Roja"
- Categoría: **Selecciona "Bolsas"** (aparecerá la nueva)
- Agrega variantes, colores, tallas
- Click "Crear"

**RESULTADO**: Se guarda en `damabella_productos`

---

## 🚀 Qué Pasa Automáticamente

### 1️⃣ Segundos 0-1
- Productos se guardan en localStorage
- EcommerceContext hace polling

### 2️⃣ Segundo 1
- ✅ EcommerceContext detecta cambio
- ✅ Convierte productos
- ✅ HomePage recarga categorías
- ✅ SearchPage actualiza filtros

### 3️⃣ Segundo 2+
- Cliente ve categoría "Bolsas"
- Cliente ve producto "Bolsa de Mano Roja"
- Cliente puede filtrar por "Bolsas"

---

## 📍 Dónde Ver

### En Página del Cliente:

**1. HOME → Categorías**
```
👗 Vestidos Largos | 👚 Vestidos Cortos | 👠 BOLSAS (NEW!) | ...
                    ↓ Click en BOLSAS
            Ver todos los productos de Bolsas
```

**2. BÚSQUEDA → Filtros**
```
Todas ✓
Vestidos Largos
Vestidos Cortos
Enterizos
Sets
BOLSAS (NEW!)   ← Click para filtrar
```

**3. BÚSQUEDA → Resultados**
```
Mostrando productos de "Bolsas"
┌─────────────────────┐
│ Bolsa de Mano Roja  │
│    $150.000         │
│  [Agregar Carrito]  │
└─────────────────────┘
```

---

## ⏱️ Timing

| Acción | Tiempo |
|--------|--------|
| Crear categoría | Inmediato |
| Crear producto | Inmediato |
| Ver en cliente (mismo tab) | ~1 segundo |
| Ver en cliente (otra tab) | ~1 segundo |

---

## 🔄 Si Algo No Aparece

### Opción 1: Esperar 2 segundos
El polling tarda 1 segundo en detectar cambios

### Opción 2: Forzar Sincronización (en consola)
```javascript
// Abre DevTools (F12) → Console
// Pega esto:
(async () => {
  const { forceSync } = await import('./src/shared/utils/syncUtils.ts');
  forceSync();
})();
```

### Opción 3: Refresh (F5)
Funciona pero no debería ser necesario

---

## ❓ Preguntas Frecuentes

**P: ¿Necesito hacer refresh?**
R: No, se sincroniza automáticamente en ~1 segundo

**P: ¿Funciona en otra pestaña?**
R: Sí, también se sincroniza en otras pestañas

**P: ¿Cuántas categorías puedo tener?**
R: Sin límite, todas aparecerán automáticamente

**P: ¿Se perderán datos si cierro pestaña?**
R: No, todo se guarda en localStorage

**P: ¿Qué pasa con los productos que creo en otra categoría?**
R: Se sincronizan igual, aparecen en su categoría correspondiente

---

## 🎨 Personalización (Opcional)

### Cambiar intervalo de polling
**Archivo**: `src/shared/contexts/EcommerceContext.tsx`

Encuentra esta línea:
```typescript
const pollInterval = setInterval(() => {
  // ...
}, 1000); // ← 1000ms = 1 segundo
```

Cámbialo a:
```typescript
}, 2000); // 2 segundos
// o
}, 500);  // 0.5 segundos
```

---

## 📞 Resumen

✅ Categorías dinámicas
✅ Productos sincronizados automáticamente
✅ Sin refresh necesario
✅ Funciona en múltiples tabs
✅ Escalable a infinitas categorías

**¡Listo para usar! 🚀**

