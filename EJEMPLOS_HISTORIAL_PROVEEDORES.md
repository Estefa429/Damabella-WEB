# 📊 Ejemplos Prácticos: Historial de Compras por Proveedor

## Escenario 1: Cargar Compras de un Proveedor

### Datos en localStorage
```javascript
// localStorage['damabella_compras']
[
  {
    id: 1704067200000,
    numeroCompra: "COMP-040",
    proveedorId: "5",          // Distribuidora XYZ
    proveedorNombre: "Distribuidora XYZ",
    fechaCompra: "2025-01-13",
    items: [
      { cantidad: 30, productoNombre: "Camiseta Azul" },
      { cantidad: 20, productoNombre: "Pantalón Negro" }
    ],
    subtotal: 400_000,
    iva: 76_000,
    total: 476_000,
    estado: "Anulada"
  },
  {
    id: 1705336800000,
    numeroCompra: "COMP-041",
    proveedorId: "5",          // Distribuidora XYZ
    proveedorNombre: "Distribuidora XYZ",
    fechaCompra: "2025-01-14",
    items: [
      { cantidad: 60, productoNombre: "Camiseta Roja" }
    ],
    subtotal: 1_200_000,
    iva: 228_000,
    total: 1_428_000,
    estado: "Recibida"
  },
  {
    id: 1705423200000,
    numeroCompra: "COMP-042",
    proveedorId: "3",          // Otro Proveedor
    proveedorNombre: "Otro Proveedor",
    fechaCompra: "2025-01-15",
    items: [
      { cantidad: 50, productoNombre: "Zapatos" }
    ],
    subtotal: 500_000,
    iva: 95_000,
    total: 595_000,
    estado: "Recibida"
  }
]
```

### Usuario Abre Modal de Distribuidora XYZ

```tsx
const handleVerHistorial = (proveedor: Proveedor) => {
  setViewingProveedor(proveedor);      // Distribuidora XYZ (id: 5)
  setShowHistorialModal(true);         // Abre modal
};
```

### useEffect se Dispara
```tsx
useEffect(() => {
  if (showHistorialModal) {
    const stored = localStorage.getItem(COMPRAS_KEY);
    // stored = [COMP-040, COMP-041, COMP-042, ...]
    if (stored) {
      try {
        setCompras(JSON.parse(stored));
        // compras = [array completo de compras]
      } catch (error) {
        console.error('Error al cargar compras:', error);
      }
    }
  }
}, [showHistorialModal]);
```

### getComprasProveedor() Filtra
```typescript
const getComprasProveedor = (proveedorId: number) => {
  // proveedorId = 5 (Distribuidora XYZ)
  const comprasFiltered = compras.filter((c: any) => {
    return c.proveedorId === 5 || c.proveedorId === "5";
    //      ✓ COMP-040     ✓ COMP-041 están aquí
    //      ✗ COMP-042 tiene proveedorId: "3", no incluida
  });
  
  // Ordenar por fecha descendente
  return comprasFiltered.sort((a: any, b: any) => {
    const fechaA = new Date("2025-01-13").getTime();  // COMP-040
    const fechaB = new Date("2025-01-14").getTime();  // COMP-041
    return fechaB - fechaA;  // COMP-041 primero
  });
  
  // Resultado:
  // [COMP-041, COMP-040]  (más reciente primero)
};
```

### Cálculos de Totales

#### getTotalComprasProveedor(5)
```typescript
getComprasProveedor(5).reduce((sum, c) => sum + c.total, 0);
// COMP-041: 1_428_000
// COMP-040: 476_000
// Total: 1_904_000
```

#### getCantidadProductosProveedor(5)
```typescript
getComprasProveedor(5).reduce((sum, c) => {
  const cantidadCompra = c.items.reduce((itemSum, item) => 
    itemSum + item.cantidad, 0);
  return sum + cantidadCompra;
}, 0);

// COMP-041: 60 productos
// COMP-040: 30 + 20 = 50 productos
// Total: 110 productos
```

### Resultado Mostrado

```
┌──────────────────────────────────────────────────────────────┐
│ Historial de Compras – Distribuidora XYZ                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Total Compras: 2  │  Productos: 110  │  Monto: $1.904.000  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ FECHA      │ N° COMPRA │ CANTIDAD │ SUBTOTAL │ IVA │ TOTAL │ │
├──────────────────────────────────────────────────────────────┤
│ 14/01/2025 │ COMP-041  │ 60       │ $1.2M    │ ... │ $1.4M │ │
│ 13/01/2025 │ COMP-040  │ 50       │ $400.0K  │ ... │ $476K │ │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                    🟢 Recibida    🔴 Anulada               │
└──────────────────────────────────────────────────────────────┘
```

---

## Escenario 2: Sincronización Cross-Módulos

### Usuario en Compras: Crea Nueva Compra

```typescript
// ComprasManager.tsx - guardarCompra()
const compraData: Compra = {
  id: 1705509600000,
  numeroCompra: "COMP-043",
  proveedorId: "5",  // Distribuidora XYZ
  proveedorNombre: "Distribuidora XYZ",
  fechaCompra: "2025-01-15",
  items: [
    { cantidad: 100, productoNombre: "Pantalón Azul" }
  ],
  subtotal: 2_000_000,
  iva: 380_000,
  total: 2_380_000,
  estado: "Recibida"
};

// Guardar en localStorage
localStorage.setItem('damabella_compras', JSON.stringify([
  ...comprasExistentes,
  compraData
]));
// Ahora localStorage contiene: COMP-040, COMP-041, COMP-042, COMP-043
```

### Usuario Abre Modal en Proveedores

```typescript
// ProveedoresManager.tsx
const handleVerHistorial = (proveedor: Proveedor) => {
  setViewingProveedor(proveedor);      // Distribuidora XYZ
  setShowHistorialModal(true);         // showHistorialModal = true
};

// useEffect se dispara porque [showHistorialModal] cambió
useEffect(() => {
  if (showHistorialModal) {  // true
    const stored = localStorage.getItem(COMPRAS_KEY);
    // stored = [COMP-040, COMP-041, COMP-042, COMP-043]
    // ← Ahora incluye COMP-043 (la compra recién creada)
    setCompras(JSON.parse(stored));
  }
}, [showHistorialModal]);
```

### Resultado: Datos Sincronizados

```
Total Compras:  3
Productos:      210  (60 + 50 + 100)
Monto:          $4.284.000  (1.428.000 + 476.000 + 2.380.000)

Tabla actualizada:
├─ COMP-043 (15/01): 100 productos, $2.380.000 🟢
├─ COMP-041 (14/01): 60 productos,  $1.428.000 🟢
└─ COMP-040 (13/01): 50 productos,  $476.000 🔴
```

---

## Escenario 3: Manejo de Datos Incompletos

### Compra con Estado Faltante

```javascript
// localStorage['damabella_compras']
{
  id: 1704067200000,
  numeroCompra: "COMP-001",
  proveedorId: "5",
  // ⚠️ FALTA: estado (null o undefined)
  total: 500_000,
  items: [...]
}
```

### Rendering de Estado

```tsx
<span className={`... ${
  compra.estado === 'Recibida' ? 'bg-green-100 text-green-700' :
  compra.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
  compra.estado === 'Anulada' ? 'bg-red-100 text-red-700' :
  'bg-blue-100 text-blue-700'
}`}>
  {compra.estado || 'Confirmada'}
  //  ↑ undefined, entonces muestra 'Confirmada'
</span>
```

**Resultado visual:**
```
┌─────────────────────┐
│ 🔵 Confirmada       │
└─────────────────────┘
```

---

## Escenario 4: Formateo de Moneda COP

### Entrada
```javascript
const valor = 1_428_000;
```

### Función formatearCOP()
```typescript
const formatearCOP = (valor: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
};

const resultado = formatearCOP(1_428_000);
```

### Salida
```
$1.428.000
  ↑ Signo peso
   ↑ Separador de miles
              ↑ Sin decimales (COP nunca usa decimales)
```

### Comparación con toLocaleString()

| Método | Entrada | Salida | Problema |
|--------|---------|--------|----------|
| `toLocaleString()` | 1428000 | `1,428,000` | No tiene $ |
| `formatearCOP()` | 1428000 | `$1.428.000` | ✅ Completo |

---

## Escenario 5: Empty State - Proveedor sin Compras

### Datos en localStorage
```javascript
// localStorage['damabella_compras']
[
  { proveedorId: "5", ... },  // Distribuidora XYZ
  { proveedorId: "3", ... }   // Otro proveedor
  // ← NO hay compras para proveedorId "7" (Nuevo Proveedor)
]
```

### Usuario Abre Historial de Nuevo Proveedor

```typescript
const proveedor = { id: 7, nombre: "Nuevo Proveedor" };
handleVerHistorial(proveedor);
// showHistorialModal = true
// getComprasProveedor(7).length = 0
```

### Rendereo de Empty State

```tsx
{getComprasProveedor(viewingProveedor.id).length === 0 ? (
  <div className="text-center py-12 text-gray-500">
    <Store className="mx-auto mb-4 text-gray-300" size={48} />
    <p className="text-lg font-medium">
      Este proveedor aún no tiene compras registradas.
    </p>
    <p className="text-sm mt-2">
      Las compras aparecerán aquí cuando se registren en el módulo de Compras.
    </p>
  </div>
) : (
  // ... tabla
)}
```

**Resultado visual:**
```
┌─────────────────────────────────────────────┐
│                                             │
│                 🏪                          │
│                                             │
│ Este proveedor aún no tiene compras         │
│ registradas.                                │
│                                             │
│ Las compras aparecerán aquí cuando se       │
│ registren en el módulo de Compras.          │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Escenario 6: Comparación proveedorId (número vs string)

### Problema: Inconsistencia de tipos

```javascript
// En algunas compras:
compra.proveedorId = "5"          // string

// En otras:
compra.proveedorId = 5            // number

// Al filtrar por:
getComprasProveedor(5)  // parámetro es número
```

### Solución con Double Comparison

```typescript
const getComprasProveedor = (proveedorId: number) => {
  return compras.filter((c: any) => {
    return c.proveedorId === proveedorId ||      // numero === numero
           c.proveedorId === String(proveedorId); // string === "numero"
  });
};

// Ejemplo:
// Proveedor: id = 5 (número)
// Compra 1: proveedorId = "5" (string) ← matches || condition
// Compra 2: proveedorId = 5 (número)   ← matches = condition
// Ambas se incluyen ✓
```

---

## Escenario 7: Ordenamiento por Fecha

### Entrada (sin ordenar)
```javascript
[
  { numeroCompra: "COMP-043", fechaCompra: "2025-01-15" },
  { numeroCompra: "COMP-041", fechaCompra: "2025-01-14" },
  { numeroCompra: "COMP-040", fechaCompra: "2025-01-13" }
]
```

### Ordenamiento
```typescript
return comprasFiltered.sort((a, b) => {
  const fechaA = new Date("2025-01-15").getTime();  // 1705276800000
  const fechaB = new Date("2025-01-14").getTime();  // 1705190400000
  return fechaB - fechaA;  // 1705190400000 - 1705276800000 = -86400000
  // Si resultado < 0, b va primero
});
```

### Salida (descendente - más reciente primero)
```javascript
[
  { numeroCompra: "COMP-043", fechaCompra: "2025-01-15" },  // Primero
  { numeroCompra: "COMP-041", fechaCompra: "2025-01-14" },
  { numeroCompra: "COMP-040", fechaCompra: "2025-01-13" }   // Último
]
```

---

## Escenario 8: Suma de Cantidad de Productos

### Estructura de Compra con Items

```javascript
{
  numeroCompra: "COMP-041",
  items: [
    { productoNombre: "Camiseta Roja", cantidad: 30 },
    { productoNombre: "Camiseta Azul", cantidad: 20 },
    { productoNombre: "Pantalón Negro", cantidad: 10 }
  ]
}
```

### Cálculo de getCantidadProductosProveedor()

```typescript
const getCantidadProductosProveedor = (proveedorId: number) => {
  return getComprasProveedor(proveedorId).reduce((sum, c) => {
    const cantidadCompra = (c.items || []).reduce((itemSum, item) => {
      return itemSum + (item.cantidad || 0);
      //     0 + 30 = 30
      //     30 + 20 = 50
      //     50 + 10 = 60
    }, 0);
    // cantidadCompra = 60
    return sum + cantidadCompra;
    // sum + 60
  }, 0);
};

// Resultado: 60 productos en COMP-041
```

---

## Validación de Tipos

### Type Safety

```typescript
// ProveedoresManager define:
interface Proveedor {
  id: number;  // ← getComprasProveedor espera number
  // ...
}

// getComprasProveedor acepta:
const getComprasProveedor = (proveedorId: number) => {
  // ...
}

// Llamado como:
getComprasProveedor(viewingProveedor.id)
//                 ↑ number, type-safe ✓
```

---

**Documentación Práctica Completa**
**Status:** ✅ LISTA PARA TESTING
