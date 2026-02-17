# 🔐 Guía de Conexión de Permisos Dinámicos

## Resumen
El sistema de permisos está completamente conectado. Aquí te muestro cómo funciona:

---

## 🔄 Flujo Completo

### 1️⃣ Admin Asigna Permisos
**Ubicación**: `Módulo → Roles y Permisos`

El administrador puede:
- ✅ Crear nuevos roles
- ✅ Editar permisos para cada rol
- ✅ Asignar permisos específicos a cada módulo (ver, crear, editar, eliminar)

**Los permisos se guardan en**: `localStorage['damabella_roles']`

```json
{
  "id": "2",
  "name": "Empleado",
  "description": "Usuario con permisos limitados",
  "permissions": [
    { "module": "Categorias", "canView": true, "canCreate": false, "canEdit": false, "canDelete": false },
    { "module": "Productos", "canView": true, "canCreate": true, "canEdit": true, "canDelete": false },
    ...
  ]
}
```

---

### 2️⃣ Empleado Inicia Sesión
**Ubicación**: Pantalla de Login

Cuando un empleado ingresa su email y contraseña:

1. **AuthContext** busca el usuario en `damabella_users`
2. Valida credenciales
3. **Guarda en localStorage**:
   ```
   damabella_user = {
     "id": "123",
     "name": "Juan Pérez",
     "email": "juan@ejemplo.com",
     "role": "Empleado",  // ← El rol asignado
     ...
   }
   ```

---

### 3️⃣ Módulos Leen los Permisos
**Ejemplo**: Módulo de Categorías

Cada módulo usa el hook `usePermissions`:

```typescript
// En CategoriasManager.tsx
import { usePermissions } from '../../../../shared/hooks/usePermissions';

const CategoriasManager = () => {
  const { getModulePermissions } = usePermissions();
  
  // Obtiene todos los permisos para "Categorias"
  const permisos = getModulePermissions('Categorias');
  
  // permisos = { canView: true, canCreate: false, canEdit: false, canDelete: false }
  
  return (
    <>
      {/* Botón crear DESHABILITADO si no tiene permiso */}
      <Button disabled={!permisos.canCreate}>
        Crear Categoría
      </Button>
    </>
  );
};
```

---

## 🎯 Cómo Implementar en Otros Módulos

### Para **Productos**, **Clientes**, **Proveedores**, etc:

**1. Importar el hook**
```typescript
import { usePermissions } from '../../../../shared/hooks/usePermissions';
```

**2. Usar el hook**
```typescript
const { getModulePermissions, hasPermission } = usePermissions();

// Opción A: Obtener todos los permisos del módulo
const permisos = getModulePermissions('Productos');
const canCreate = permisos.canCreate;

// Opción B: Verificar permiso específico
const canDelete = hasPermission('Productos', 'delete');
```

**3. Deshabilitar botones según permisos**
```typescript
<Button disabled={!permisos.canCreate} onClick={handleCreate}>
  Crear Producto
</Button>

<Button disabled={!permisos.canEdit} onClick={handleEdit}>
  Editar
</Button>

<Button disabled={!permisos.canDelete} onClick={handleDelete}>
  Eliminar
</Button>
```

---

## 🧪 Caso de Uso Completo

### Escenario:
1. **Admin crea rol "Supervisor"**
   - Ve Categorías ✅
   - Crea Categorías ✅
   - Edita Categorías ✅
   - Elimina Categorías ❌

2. **Admin asigna rol "Supervisor" a María**
   - Guarda en `damabella_users` con `role: "Supervisor"`

3. **María inicia sesión**
   - AuthContext carga su perfil
   - `damabella_user` ahora tiene `role: "Supervisor"`

4. **María accede a Categorías**
   - CategoriasManager llama `getModulePermissions('Categorias')`
   - usePermissions busca rol "Supervisor" en `damabella_roles`
   - Encuentra los permisos asignados
   - Botón "Crear" está **habilitado** ✅
   - Botón "Eliminar" está **deshabilitado** ❌

---

## 📋 Módulos Disponibles

El sistema soporta estos 12 módulos:

```
✅ Usuarios
✅ Roles
✅ Categorias
✅ Productos
✅ Clientes
✅ Proveedores
✅ Tallas
✅ Colores
✅ Pedidos
✅ Ventas
✅ Compras
✅ Devoluciones
```

---

## 🔧 Hook usePermissions - Referencia Completa

### Importar
```typescript
import { usePermissions } from '../../../../shared/hooks/usePermissions';
```

### Métodos Disponibles

#### `getModulePermissions(module: string)`
Retorna todos los permisos para un módulo:
```typescript
const { getModulePermissions } = usePermissions();
const permisos = getModulePermissions('Categorias');
// { canView: true, canCreate: true, canEdit: true, canDelete: false }
```

#### `hasPermission(module: string, action: 'view' | 'create' | 'edit' | 'delete')`
Verifica un permiso específico:
```typescript
const { hasPermission } = usePermissions();
const canCreate = hasPermission('Categorias', 'create');
// true o false
```

#### `getUserRole()`
Obtiene el rol actual del usuario:
```typescript
const { getUserRole } = usePermissions();
const rol = getUserRole();
// "Administrador" | "Empleado" | "Cliente" | etc
```

#### `getVisibleModules()`
Lista de módulos que el usuario puede ver:
```typescript
const { getVisibleModules } = usePermissions();
const modulos = getVisibleModules();
// ["Categorias", "Productos", "Usuarios"]
```

#### `canAccessModule(module: string)`
Verifica si puede acceder a cualquier función en un módulo:
```typescript
const { canAccessModule } = usePermissions();
const puedeAcceder = canAccessModule('Categorias');
// true si puede ver, crear, editar O eliminar
```

---

## 🔄 Cambios en Tiempo Real

Cuando cambies permisos desde **Roles y Permisos**:

1. ✅ Los cambios se guardan en `localStorage['damabella_roles']`
2. ✅ Los módulos escuchan cambios en localStorage
3. ✅ Se recalculan automáticamente los permisos
4. ✅ La UI se actualiza (botones se habilitan/deshabilitan)

**Nota**: Si estás en otra pestaña/navegador, recarga la página para ver los cambios.

---

## 🛡️ Admin Fallback

Si un usuario es **Administrador**, obtendrá automáticamente acceso total a todos los módulos, sin necesidad de tener permisos explícitos guardados.

```typescript
const { hasPermission } = usePermissions();
const puedo = hasPermission('Categorias', 'delete');
// true (siempre, porque es Administrador)
```

---

## ❓ Preguntas Frecuentes

### P: ¿Qué pasa si el usuario no tiene un rol asignado?
**R**: Se bloquean todos los permisos. Solo Administrador tiene acceso.

### P: ¿Puedo cambiar los permisos sin recargar la página?
**R**: Sí, el sistema escucha cambios en localStorage automáticamente.

### P: ¿Qué pasa si edito un rol mientras el usuario está usando el módulo?
**R**: Los permisos se recalculan automáticamente (se recarga el componente).

### P: ¿Cómo creo un nuevo rol con permisos personalizados?
**R**: Abre **Roles y Permisos**, crea un nuevo rol y asigna los permisos que necesites.

---

## 🚀 Próximos Pasos

Para conectar los demás módulos (Productos, Clientes, etc.):

1. Abre el archivo `*Manager.tsx` de cada módulo
2. Importa `usePermissions`
3. Obtén permisos con `getModulePermissions('NombreDelModulo')`
4. Deshabilita botones según `permisos.canCreate`, `permisos.canEdit`, etc.

**Ejemplo rápido** (copiar y pegar):
```typescript
import { usePermissions } from '../../../../shared/hooks/usePermissions';

// Dentro del componente
const { getModulePermissions } = usePermissions();
const permisos = getModulePermissions('Productos');

// En JSX
<Button disabled={!permisos.canCreate}>Crear</Button>
<Button disabled={!permisos.canEdit}>Editar</Button>
<Button disabled={!permisos.canDelete}>Eliminar</Button>
```

---

## 📞 Soporte

Si algo no funciona:
1. Abre la **Consola** (F12)
2. Busca logs con `🔐 [usePermissions]`
3. Verifica que:
   - ✅ El usuario está autenticado (`damabella_user` existe)
   - ✅ El rol existe en `damabella_roles`
   - ✅ El módulo tiene permisos definidos

---

**Sistema listo para usar. ¡A disfrutar! 🎉**
