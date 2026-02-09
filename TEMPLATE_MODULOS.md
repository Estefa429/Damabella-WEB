# 🚀 TEMPLATE: Conectar Permisos a Cualquier Módulo

## 📋 Pasos Rápidos

### Paso 1: Abrir tu archivo `*Manager.tsx`
Ejemplo: `ProductosManager.tsx`, `ClientesManager.tsx`, etc.

### Paso 2: Importar el hook
```typescript
import { usePermissions } from '../../../../shared/hooks/usePermissions';
```

### Paso 3: Dentro del componente, obtener permisos
```typescript
const { getModulePermissions } = usePermissions();

// ⬇️ CAMBIAR "Productos" por tu módulo
const permisos = getModulePermissions('Productos');

// Desestructurar (opcional pero recomendado)
const { canView, canCreate, canEdit, canDelete } = permisos;
```

### Paso 4: Usar los permisos en tus botones

```typescript
// ✅ Botón Crear
<Button disabled={!canCreate} onClick={handleCreate}>
  Crear
</Button>

// ✅ Botón Editar
<Button disabled={!canEdit} onClick={handleEdit}>
  Editar
</Button>

// ✅ Botón Eliminar
<Button disabled={!canDelete} onClick={handleDelete}>
  Eliminar
</Button>

// ✅ Vista protegida
{!canView && (
  <div className="text-red-600 p-4">
    No tienes permisos para ver este módulo
  </div>
)}
```

---

## 📑 Módulos Disponibles

Reemplaza `'Productos'` con uno de estos:

```
'Usuarios'
'Roles'
'Categorias'
'Productos'        ⬅️ EJEMPLO
'Clientes'
'Proveedores'
'Tallas'
'Colores'
'Pedidos'
'Ventas'
'Compras'
'Devoluciones'
```

---

## 🔧 Opciones Avanzadas

### Opción 1: Sin desestructurar
```typescript
const permisos = getModulePermissions('Productos');

<Button disabled={!permisos.canCreate}>Crear</Button>
<Button disabled={!permisos.canEdit}>Editar</Button>
<Button disabled={!permisos.canDelete}>Eliminar</Button>
```

### Opción 2: hasPermission (para más control)
```typescript
const { hasPermission } = usePermissions();

const puedoCrear = hasPermission('Productos', 'create');
const puedoEditar = hasPermission('Productos', 'edit');
const puedoEliminar = hasPermission('Productos', 'delete');
const puedoVer = hasPermission('Productos', 'view');

<Button disabled={!puedoCrear}>Crear</Button>
```

### Opción 3: Listar módulos accesibles
```typescript
const { getVisibleModules } = usePermissions();
const modulos = getVisibleModules();
// Retorna: ["Productos", "Categorias", ...]
```

---

## 🧪 Checklist de Implementación

- [ ] Importé `usePermissions`
- [ ] Llamé `getModulePermissions('MiModulo')`
- [ ] Agregué `disabled={!permisos.canCreate}` a botón crear
- [ ] Agregué `disabled={!permisos.canEdit}` a botón editar
- [ ] Agregué `disabled={!permisos.canDelete}` a botón eliminar
- [ ] Probé cambiando permisos en "Roles y Permisos"
- [ ] Los botones se habilitan/deshabilitan correctamente
- [ ] ¡Listo! ✅

---

## 🎯 Ejemplo Completo (Copy & Paste)

```typescript
import React, { useState, useEffect } from 'react';
import { Button, Modal, useToast } from '../../../../shared/components/native';
import { usePermissions } from '../../../../shared/hooks/usePermissions';  // ← AGREGAR

export default function ProductosManager() {
  const { showToast } = useToast();
  const { getModulePermissions } = usePermissions();  // ← AGREGAR
  
  // ← AGREGAR (reemplazar 'Productos' según tu módulo)
  const { canView, canCreate, canEdit, canDelete } = getModulePermissions('Productos');
  
  const [showModal, setShowModal] = useState(false);
  const [productos, setProductos] = useState([]);

  // ... tu lógica existente ...

  return (
    <>
      {/* BOTÓN CREAR - Deshabilitado si no tiene permisos */}
      <Button disabled={!canCreate} onClick={() => setShowModal(true)}>
        ➕ Crear Producto
      </Button>

      {/* TABLA DE PRODUCTOS */}
      {productos.map(producto => (
        <div key={producto.id}>
          <span>{producto.name}</span>
          
          {/* BOTÓN EDITAR - Solo si tiene permisos */}
          <Button disabled={!canEdit} onClick={() => handleEdit(producto)}>
            ✏️ Editar
          </Button>
          
          {/* BOTÓN ELIMINAR - Solo si tiene permisos */}
          <Button disabled={!canDelete} onClick={() => handleDelete(producto)}>
            🗑️ Eliminar
          </Button>
        </div>
      ))}

      {/* MODAL CREAR/EDITAR */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        {/* Tu contenido del modal */}
      </Modal>
    </>
  );
}
```

---

## ⚠️ Notas Importantes

### 1️⃣ UI es solo la primera defensa
Deshabilitar botones previene clicks accidentales, pero:
- ❌ NO previene manipulación manual de URLs
- ❌ NO previene llamadas directas a API si existe backend
- ✅ SÍ deshabilita acceso desde la UI

**Recomendación**: Valida también en tu lógica de negocio
```typescript
const handleDelete = async (id) => {
  if (!canDelete) {
    showToast('No tienes permisos', 'error');
    return;
  }
  // Proceder con eliminación
};
```

### 2️⃣ Cambios en tiempo real
Cuando cambias permisos en "Roles y Permisos":
- ✅ Se actualizan automáticamente en localStorage
- ✅ El componente se re-renderiza
- ✅ Botones se habilitan/deshabilitan

Si no ves cambios:
- Recarga la página (F5)
- Abre DevTools (F12) y busca logs con `🔐`

### 3️⃣ El rol "Administrador" siempre tiene acceso
Incluso si no está explícitamente en permisos, admin puede hacer todo:
```typescript
const { hasPermission } = usePermissions();
const puedoEliminar = hasPermission('Productos', 'delete');
// true (si el usuario es Admin, siempre retorna true)
```

---

## 🐛 Troubleshooting

### Problema: Los botones no se deshabilitan
**Solución**:
1. Abre Consola (F12)
2. Verifica que veas logs con `🔐 [usePermissions]`
3. Asegúrate que el usuario tiene un rol asignado
4. Verifica el nombre del módulo sea exacto (mayúsculas importan)

### Problema: "No puedo encontrar usePermissions"
**Solución**:
- Verifica que el hook existe en: `src/shared/hooks/usePermissions.ts`
- Comprueba que la ruta de importación es correcta
- Asegúrate de tener `../../../../` correcto según tu ubicación

### Problema: Los permisos no cambian al cambiar rol
**Solución**:
1. Recarga la página
2. Abre "Roles y Permisos"
3. Edita los permisos
4. Guarda
5. El componente debe reaccionar automáticamente

---

## 📞 Resumen

| Paso | Código |
|------|--------|
| **1. Importar** | `import { usePermissions } from '...'` |
| **2. Obtener** | `const { getModulePermissions } = usePermissions()` |
| **3. Usar** | `const permisos = getModulePermissions('MiModulo')` |
| **4. Aplicar** | `<Button disabled={!permisos.canCreate}>` |
| **5. Probar** | Recarga página y cambia permisos en Admin |

**¡Listo en 5 minutos por módulo! ⚡**
