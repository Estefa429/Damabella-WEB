# ✅ INTEGRACIÓN COMPLETA - DAMABELLA

## 🔗 Conexión Panel Admin ↔️ E-commerce

### **1. PRODUCTOS: Panel Admin → E-commerce**

**Keys de LocalStorage:**
- Panel Admin guarda en: `damabella_productos`
- E-commerce lee de: `damabella_productos` ✅

**Estructura del Panel Admin:**
```javascript
{
  id: 123456789,
  nombre: "Vestido Rojo",
  categoria: "Vestidos Largos",
  precioVenta: 120000,
  activo: true,
  imagen: "data:image/...",
  variantes: [
    {
      talla: "S",
      colores: [
        { color: "Rojo", cantidad: 10 },
        { color: "Negro", cantidad: 5 }
      ]
    },
    {
      talla: "M",
      colores: [
        { color: "Rojo", cantidad: 15 }
      ]
    }
  ]
}
```

**Transformación al E-commerce:**
```javascript
{
  id: "123456789",
  name: "Vestido Rojo",
  category: "Vestidos Largos",
  price: 120000,
  image: "data:image/...",
  variants: [
    {
      color: "Rojo",
      colorHex: "#FF0000",
      sizes: [
        { size: "S", stock: 10 },
        { size: "M", stock: 15 }
      ]
    },
    {
      color: "Negro",
      colorHex: "#000000",
      sizes: [
        { size: "S", stock: 5 }
      ]
    }
  ]
}
```

---

### **2. VENTAS: E-commerce → Panel Admin**

**Keys de LocalStorage:**
- E-commerce guarda en: `damabella_ventas` ✅
- Panel Admin lee de: `damabella_ventas` ✅

**Estructura de Venta (EXACTA del Panel Admin):**
```javascript
{
  id: 1,
  numeroVenta: "VEN-001",
  clienteId: "123",
  clienteNombre: "María García",
  fechaVenta: "2024-01-15",
  estado: "Completada",
  items: [
    {
      id: "item-1234567890-0",
      productoId: "123456789",
      productoNombre: "Vestido Rojo",
      talla: "M",
      color: "Rojo",
      cantidad: 2,
      precioUnitario: 120000,
      subtotal: 240000
    }
  ],
  subtotal: 240000,
  iva: 45600,         // 19%
  total: 285600,
  metodoPago: "Transferencia",
  observaciones: "",
  anulada: false,
  createdAt: "2024-01-15T10:30:00.000Z"
}
```

---

### **3. CLIENTES: E-commerce → Panel Admin**

**Keys de LocalStorage:**
- E-commerce crea/lee de: `damabella_clientes` ✅
- Panel Admin lee de: `damabella_clientes` ✅

**Estructura de Cliente:**
```javascript
{
  id: 1,
  nombre: "María García",
  tipoDoc: "CC",
  numeroDoc: "",
  telefono: "3001234567",
  email: "maria@email.com",
  direccion: "Calle 123 # 45-67",
  ciudad: "",
  activo: true,
  createdAt: "2024-01-15T10:30:00.000Z"
}
```

---

### **4. ACTUALIZACIÓN DE STOCK**

Cuando se crea una venta en el E-commerce:

1. Se busca el producto por `productoId`
2. Se busca la variante por `talla`
3. Se busca el color dentro de la variante
4. Se reduce la `cantidad` del color

```javascript
// Antes de la compra
variantes: [
  {
    talla: "M",
    colores: [
      { color: "Rojo", cantidad: 15 }
    ]
  }
]

// Después de comprar 2 unidades
variantes: [
  {
    talla: "M",
    colores: [
      { color: "Rojo", cantidad: 13 }  // ✅ Reducido
    ]
  }
]
```

---

## 🧪 CÓMO PROBAR LA INTEGRACIÓN

### **Paso 1: Crear Productos en el Panel Admin**
1. Iniciar sesión como Admin/Empleado
2. Ir a: **Compras → Productos**
3. Clic en **"+ Nuevo Producto"**
4. Llenar:
   - Nombre: "Vestido Prueba"
   - Categoría: Vestidos Largos
   - Precio Venta: 150000
   - Subir imagen (opcional)
   - Agregar variantes:
     * Talla: S → Color: Rojo → Cantidad: 10
     * Talla: M → Color: Rojo → Cantidad: 15
5. Guardar

### **Paso 2: Ver Productos en el E-commerce**
1. Ir al E-commerce (inicio)
2. Verás el banner: **"✨ 1 productos sincronizados desde el Panel Administrativo"**
3. El producto "Vestido Prueba" debe aparecer en la página principal

### **Paso 3: Hacer una Compra**
1. En el E-commerce, clic en el producto
2. Seleccionar Talla: M, Color: Rojo
3. Agregar al carrito
4. Ir al carrito → Proceder al Checkout
5. Llenar los datos:
   - Nombre: Juan Pérez
   - Email: juan@email.com
   - Teléfono: 3009876543
   - Dirección: Calle 1 # 2-3
   - Método de pago: Transferencia
6. Confirmar Orden

### **Paso 4: Verificar en el Panel Admin**

**4.1 Ver la Venta:**
1. Panel Admin → **Ventas → Ventas**
2. Debe aparecer: **VEN-001**
3. Cliente: Juan Pérez
4. Total: Precio + IVA(19%)
5. Estado: Completada

**4.2 Ver el Cliente:**
1. Panel Admin → **Ventas → Clientes**
2. Debe aparecer: Juan Pérez
3. Con email y teléfono

**4.3 Ver el Stock Reducido:**
1. Panel Admin → **Compras → Productos**
2. Buscar "Vestido Prueba"
3. Ver variantes: Talla M, Color Rojo
4. La cantidad debe ser 14 (era 15, se compraron 1)

---

## 🎯 EVENTOS DE SINCRONIZACIÓN

El sistema dispara eventos para mantener todo sincronizado:

```javascript
// Cuando se crea una venta
window.dispatchEvent(new Event('salesUpdated'));

// Cuando se actualiza el stock
window.dispatchEvent(new Event('productsUpdated'));

// Cuando hay cambios generales
window.dispatchEvent(new Event('storage'));
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Productos del panel aparecen en el e-commerce
- [ ] Banner muestra cantidad de productos sincronizados
- [ ] Compra desde e-commerce crea venta en panel admin
- [ ] Venta tiene formato correcto (VEN-001, VEN-002, etc.)
- [ ] Cliente se crea automáticamente si no existe
- [ ] Stock se reduce al hacer la compra
- [ ] IVA se calcula correctamente (19%)
- [ ] Total incluye subtotal + IVA

---

## 🚀 TODO ESTÁ CONECTADO

**Panel Admin ← → E-commerce**
- ✅ Productos
- ✅ Ventas
- ✅ Clientes
- ✅ Stock en tiempo real
- ✅ Eventos de sincronización
