# 🔐 Sistema de Permisos Dinámicos - Guía Completa

## ✅ Cambios Implementados

El sistema ahora conecta **Gestión de Usuarios** con **Gestión de Permisos de Roles** para que cada empleado tenga exactamente las capacidades que el administrador le asigne.

### 📁 Archivos Modificados

#### 1. **src/features/roles/pages/RolesModule.tsx**
- ✅ Estructura de Rol actualizada para incluir `permisos[]`
- ✅ Agregado modal para editar permisos por rol
- ✅ Botón de "Editar Permisos" (Shield icon) en la tabla de roles
- ✅ Matriz de permisos: Ver, Crear, Editar, Eliminar por módulo

#### 2. **src/features/dashboard/components/AppLayout.tsx**
- ✅ Método `getUserPermissions()` ahora lee permisos dinámicos de localStorage
- ✅ Lee los permisos asignados al rol del usuario actual
- ✅ Valida contra fallback (permisos por defecto si no hay permisos definidos)
- ✅ Filtra menú según permisos reales del usuario

### 🎯 Flujo de Funcionalidad

```
1. Admin va a "Gestión de Roles"
   ↓
2. Selecciona un rol (ej: "Empleado")
   ↓
3. Hace clic en el botón Shield (Editar Permisos)
   ↓
4. Ve matriz de módulos disponibles
   ↓
5. Marca qué puede hacer en cada módulo:
   - Ver (lectura)
   - Crear (escritura/creación)
   - Editar (modificación)
   - Eliminar (eliminación)
   ↓
6. Guarda los permisos
   ↓
7. Cuando un empleado inicia sesión:
   - Lee su rol
   - Obtiene los permisos asignados a ese rol
   - Ve SOLO lo que puede hacer
```

## 🧪 Pasos para Probar

### Paso 1: Asignar Permisos a "Empleado"

1. **Inicia sesión como Administrador**
   - Email: `pabonjuanjose6@gmail.com` o `superadmin@damabella.com`
   - Contraseña: La que uses

2. **Ve a Gestión de Roles**
   - Dashboard → Configuración → Gestión de Roles

3. **Busca el rol "Empleado"**
   - Verás una tabla con roles disponibles

4. **Haz clic en el botón Shield (Editar Permisos)**
   - Se abrirá un modal con todos los módulos

5. **Configura los permisos** (por defecto ya están configurados):
   
   | Módulo | Ver | Crear | Editar | Eliminar |
   |--------|-----|-------|--------|----------|
   | Dashboard | ✅ | ❌ | ❌ | ❌ |
   | Productos | ✅ | ❌ | ❌ | ❌ |
   | Clientes | ✅ | ✅ | ✅ | ❌ |
   | Pedidos | ✅ | ✅ | ✅ | ❌ |
   | Ventas | ✅ | ✅ | ❌ | ❌ |
   | Devoluciones | ✅ | ✅ | ❌ | ❌ |
   | (Resto deshabilitados) | ❌ | ❌ | ❌ | ❌ |

6. **Haz clic en "Guardar Permisos"**
   - Los permisos se guardarán en localStorage

### Paso 2: Probar como Empleado

1. **Cierra sesión**
   - Click en avatar → Logout

2. **Inicia sesión como Empleado**
   - Email: `marta@gmail.com`
   - Contraseña: `Estefa01*`
   - (O usa cualquier otro usuario con rol "Empleado")

3. **Observa el menú lateral**
   - Solo verá módulos para los que tiene permisos "Ver"
   - Dashboard ✅
   - Compras (Productos, Categorías, etc.) - SOLO si tiene permisos
   - Ventas (Clientes, Pedidos, Ventas, Devoluciones) ✅

4. **Intenta acciones**
   - Si no tiene permiso "crear": No verá botón "Nuevo"
   - Si no tiene permiso "editar": No verá botón "Editar"
   - Si no tiene permiso "eliminar": No verá botón "Eliminar"

### Paso 3: Modificar Permisos

1. **Como Admin, vuelve a Roles**

2. **Edita permisos del Empleado**
   - Agrega "Crear" en "Productos"
   - Remueve "Editar" de "Clientes"

3. **Guarda**

4. **Empleado ve cambios al actualizar la página**
   - Los botones de acción se actualizan según nuevos permisos

## 📊 Estructura de Datos

### localStorage: `damabella_roles`

```json
{
  "id": "2",
  "nombre": "Empleado",
  "descripcion": "Gestión de ventas y productos",
  "usuariosAsociados": 5,
  "permisos": [
    {
      "modulo": "Dashboard",
      "ver": true,
      "crear": false,
      "editar": false,
      "eliminar": false
    },
    {
      "modulo": "Productos",
      "ver": true,
      "crear": false,
      "editar": false,
      "eliminar": false
    },
    {
      "modulo": "Clientes",
      "ver": true,
      "crear": true,
      "editar": true,
      "eliminar": false
    }
    // ... más módulos
  ]
}
```

## 🔄 Cómo Funciona Internamente

### Cuando Un Empleado Inicia Sesión:

1. **Lectura de rol desde currentUser**: `user.role = "Empleado"`

2. **Búsqueda de rol en `damabella_roles`**:
   ```typescript
   const userRole = roles.find(r => r.nombre === "Empleado");
   ```

3. **Extracción de permisos**:
   ```typescript
   userRole.permisos = [
     { modulo: "Dashboard", ver: true, ... },
     { modulo: "Productos", ver: true, crear: false, ... },
     // ...
   ]
   ```

4. **Creación de mapa de permisos**:
   ```typescript
   const permisosMap = {
     "dashboard": { ver: true, crear: false, ... },
     "productos": { ver: true, crear: false, ... },
     "clientes": { ver: true, crear: true, editar: true, ... },
     // ...
   }
   ```

5. **Verificación en cada acción**:
   ```typescript
   hasPermission("productos", "crear") // false → no muestra botón "Nuevo"
   hasPermission("clientes", "editar") // true → muestra botón "Editar"
   ```

## 🎨 Módulos Disponibles

Los siguientes módulos pueden ser configurados con permisos:

- Dashboard
- Roles
- Permisos
- Usuarios
- Categorías
- Productos
- Proveedores
- Compras
- Clientes
- Pedidos
- Ventas
- Devoluciones

## 🚀 Características Clave

✅ **Permisos Dinámicos**: Se asignan por rol y se aplican en tiempo real
✅ **Control Granular**: Niveles de acceso: Ver, Crear, Editar, Eliminar
✅ **Interfaz Intuitiva**: Matriz de checkboxes fácil de usar
✅ **Persistencia**: Los permisos se guardan en localStorage
✅ **Escalable**: Nuevos módulos se pueden agregar fácilmente
✅ **Seguridad**: El menú se filtra según permisos reales

## ⚠️ Notas Importantes

- Los permisos se cargan CADA VEZ que el usuario inicia sesión
- Si no hay permisos definidos para un rol, se usan valores por defecto
- Administrador siempre tiene acceso total
- Los cambios en permisos se aplican en la siguiente sesión del empleado

## 🔧 Agregar Nuevos Módulos

Para agregar un nuevo módulo:

1. Actualiza `MODULOS_DISPONIBLES` en RolesModule.tsx
2. Los roles existentes automáticamente lo incluirán con permisos deshabilitados
3. Los admins pueden editarlos

---

**¿Dudas? Revisa el código en:**
- RolesModule.tsx - Lógica de edición de permisos
- AppLayout.tsx - Lógica de aplicación de permisos
