# 🔧 LISTA DE MÓDULOS PARA CONECTAR

## ✅ Estado Actual

```
┌─────────────────────────────────────────────┐
│  MÓDULO DE CATEGORÍAS                       │
│  Status: ✅ CONECTADO                       │
│  Archivo: CategoriasManager.tsx             │
│  Permiso de: getModulePermissions('Categorias')
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  PRÓXIMOS A CONECTAR                        │
│  Tiempo estimado: 5 minutos c/uno            │
│  Total: ~45 minutos para los 11             │
└─────────────────────────────────────────────┘
```

---

## 📦 Módulos y Ubicaciones

### 1️⃣ **Usuarios**
- **Ubicación**: `src/features/users/components/UsuariosManager.tsx`
- **Permiso**: `'Usuarios'`
- **Acciones**: Ver, Crear, Editar, Eliminar
- **Tiempo**: 5 min

```typescript
// Reemplaza esto:
// const canDelete = user?.role === 'Administrador';

// Por esto:
const { getModulePermissions } = usePermissions();
const { canCreate, canEdit, canDelete } = getModulePermissions('Usuarios');
```

---

### 2️⃣ **Roles**
- **Ubicación**: `src/features/roles/components/Roles.tsx` o `RolesPage.tsx`
- **Permiso**: `'Roles'`
- **Acciones**: Ver, Crear, Editar, Eliminar
- **Tiempo**: 5 min

---

### 3️⃣ **Productos**
- **Ubicación**: `src/features/ecommerce/products/components/ProductosManager.tsx`
- **Permiso**: `'Productos'`
- **Acciones**: Ver, Crear, Editar, Eliminar
- **Tiempo**: 5 min

---

### 4️⃣ **Clientes**
- **Ubicación**: `src/features/customers/components/ClientesManager.tsx` (o similar)
- **Permiso**: `'Clientes'`
- **Acciones**: Ver, Crear, Editar, Eliminar
- **Tiempo**: 5 min

---

### 5️⃣ **Proveedores**
- **Ubicación**: `src/features/suppliers/components/ProveedoresManager.tsx`
- **Permiso**: `'Proveedores'`
- **Acciones**: Ver, Crear, Editar, Eliminar
- **Tiempo**: 5 min

---

### 6️⃣ **Tallas**
- **Ubicación**: `src/features/[location]/components/TallasManager.tsx`
- **Permiso**: `'Tallas'`
- **Acciones**: Ver, Crear, Editar, Eliminar
- **Tiempo**: 5 min

---

### 7️⃣ **Colores**
- **Ubicación**: `src/features/[location]/components/ColoresManager.tsx`
- **Permiso**: `'Colores'`
- **Acciones**: Ver, Crear, Editar, Eliminar
- **Tiempo**: 5 min

---

### 8️⃣ **Pedidos**
- **Ubicación**: `src/features/purchases/components/PedidosManager.tsx` (o `OrdersManager`)
- **Permiso**: `'Pedidos'`
- **Acciones**: Ver, Crear, Editar, Eliminar
- **Tiempo**: 5 min

---

### 9️⃣ **Ventas**
- **Ubicación**: `src/features/sales/components/VentasManager.tsx`
- **Permiso**: `'Ventas'`
- **Acciones**: Ver, Crear, Editar, Eliminar
- **Tiempo**: 5 min

---

### 🔟 **Compras**
- **Ubicación**: `src/features/purchases/components/ComprasManager.tsx`
- **Permiso**: `'Compras'`
- **Acciones**: Ver, Crear, Editar, Eliminar
- **Tiempo**: 5 min

---

### 1️⃣1️⃣ **Devoluciones**
- **Ubicación**: `src/features/returns/components/DevolucionesManager.tsx`
- **Permiso**: `'Devoluciones'`
- **Acciones**: Ver, Crear, Editar, Eliminar
- **Tiempo**: 5 min

---

## 📝 Código a Agregar (Template)

En **cada** `*Manager.tsx`:

### Paso 1: Importar
```typescript
import { usePermissions } from '../../../../shared/hooks/usePermissions';
```

### Paso 2: Dentro del componente
```typescript
const { getModulePermissions } = usePermissions();
const permisos = getModulePermissions('NOMBRE_DEL_MODULO');
const { canCreate, canEdit, canDelete } = permisos;
```

### Paso 3: En los botones
```typescript
// Busca estos botones y añade disabled:

<Button disabled={!canCreate} onClick={handleCreate}>
  Crear
</Button>

<Button disabled={!canEdit} onClick={handleEdit}>
  Editar
</Button>

<Button disabled={!canDelete} onClick={handleDelete}>
  Eliminar
</Button>
```

---

## 🎯 Orden Recomendado de Implementación

1. **Usuarios** (es importante que el admin controle quién puede crear/editar usuarios)
2. **Roles** (control sobre quién puede crear roles)
3. **Productos** (módulo importante de e-commerce)
4. **Clientes** (importante para CRM)
5. **Proveedores** (supply chain)
6. **Tallas** y **Colores** (configuración de productos)
7. **Pedidos**, **Ventas**, **Compras** (operaciones principales)
8. **Devoluciones** (operaciones de postventa)

---

## ⏱️ Estimado de Tiempo

| Acción | Tiempo |
|--------|--------|
| Conectar 1 módulo | 5 min |
| Conectar 5 módulos | 25 min |
| Conectar 10 módulos | 50 min |
| Conectar todos (11) | ~55 min |

---

## ✅ Verificación Rápida

Después de conectar cada módulo:

1. **Abre la consola** (F12)
2. **Busca**: logs con `🔐`
3. **Verifica**: que vea "Permisos cargados para [Rol]"
4. **Prueba**: Edita un permiso en "Roles y Permisos"
5. **Recarga**: La página
6. **Resultado**: Los botones deben cambiar de estado

---

## 🚀 Velocidad de Ejecución

### ⚡ Rápido (Copy-Paste)
```typescript
// 1. Copiar template
// 2. Reemplazar 'Productos' con nombre correcto
// 3. Buscar botones Create, Edit, Delete
// 4. Agregar disabled={!canCreate}, etc.
// 5. Listo ✅
```

### Con Verificación Completa
```
1. Importar hook (30 seg)
2. Obtener permisos (30 seg)
3. Encontrar botones (2 min)
4. Agregar disabled (1 min)
5. Probar en navegador (1 min)
Total: ~5 min
```

---

## 📊 Matriz de Implementación

```
┌────────────────┬──────────┬────────────────┬─────────┐
│ Módulo         │ Archivo  │ Estado         │ Tiempo  │
├────────────────┼──────────┼────────────────┼─────────┤
│ Usuarios       │ *.tsx    │ ⏳ Pendiente   │ 5 min   │
│ Roles          │ *.tsx    │ ⏳ Pendiente   │ 5 min   │
│ Productos      │ *.tsx    │ ⏳ Pendiente   │ 5 min   │
│ Clientes       │ *.tsx    │ ⏳ Pendiente   │ 5 min   │
│ Proveedores    │ *.tsx    │ ⏳ Pendiente   │ 5 min   │
│ Tallas         │ *.tsx    │ ⏳ Pendiente   │ 5 min   │
│ Colores        │ *.tsx    │ ⏳ Pendiente   │ 5 min   │
│ Pedidos        │ *.tsx    │ ⏳ Pendiente   │ 5 min   │
│ Ventas         │ *.tsx    │ ⏳ Pendiente   │ 5 min   │
│ Compras        │ *.tsx    │ ⏳ Pendiente   │ 5 min   │
│ Devoluciones   │ *.tsx    │ ⏳ Pendiente   │ 5 min   │
├────────────────┼──────────┼────────────────┼─────────┤
│ TOTAL          │          │ 11 módulos     │ ~55 min │
└────────────────┴──────────┴────────────────┴─────────┘
```

---

## 🎓 Documentación Asociada

- **TEMPLATE_MODULOS.md** - Copia y pega el código
- **GUIA_CONEXION_PERMISOS.md** - Entiende cómo funciona
- **START_PERMISOS.md** - Resumen general

---

## 💡 Notas Importantes

### ✨ Sistema Automático
Una vez conectados, el sistema:
- ✅ Detecta cambios en RolesPage automáticamente
- ✅ Deshabilita/habilita botones sin recargar código
- ✅ Funciona entre tabs y ventanas
- ✅ Fallback automático para Admin

### ⚠️ Validación
Recuerda que deshabilitar botones es solo UI:
- ✅ Deshabilita clicks accidentales
- ❌ No previene manipulación avanzada
- Siempre valida también en la lógica

### 📱 Responsive
Los permisos funcionan en:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

---

## 🎯 Meta Final

**Objetivo**: Conectar todos los 12 módulos

**Estimado**: 1 hora
**Esfuerzo**: Bajo (es principalmente copy-paste)
**Complejidad**: Muy baja (mismo patrón en todos)

---

**¡Vamos con la implementación! 🚀**
