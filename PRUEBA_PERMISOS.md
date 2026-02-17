# Prueba del Sistema de Permisos - Categorías

## ✅ Cambios Realizados

1. **Normalización de módulos**: Removido acento de "Categorías" → "Categorias" en:
   - `src/features/roles/components/Roles.tsx`
   - `src/features/roles/pages/RolesPage.tsx`
   - `src/features/roles/pages/RolesModule.tsx`

2. **Función de normalización mejorada en AppLayout**:
   - Agregada función `normalizeModuleName()` que remueve acentos y convierte a minúsculas
   - Mejorada función `hasPermission()` para buscar módulos normalizados

## 🧪 Pasos para Probar

### Escenario 1: Crear rol de Empleado con permiso SOLO de Ver Categorías

1. **Ir a Admin → Roles** (o Configuración → Roles)
2. **Crear nuevo rol**:
   - Nombre: `Empleado Limitado`
   - Descripción: `Empleado con acceso limitado a categorías`
   - Permisos:
     - **Categorias**: ✅ Ver / ❌ Crear / ❌ Editar / ❌ Eliminar
     - Todos los otros módulos: **NO SELECCIONAR**
3. **Guardar rol**

### Escenario 2: Crear usuario con este rol

1. **Ir a Gestión de Usuarios → Crear usuario**
2. **Datos**:
   - Nombre: `TestEmpleado`
   - Email: `test@empleado.com`
   - Contraseña: `test123`
   - Rol: `Empleado Limitado`
3. **Crear usuario**

### Escenario 3: Probar con login como empleado

1. **Cerrar sesión** (si estás como admin)
2. **Login con**:
   - Email: `test@empleado.com`
   - Contraseña: `test123`
3. **Verificaciones**:
   - ✅ **DEBE aparecer**: Módulo "Categorias" en el menú
   - ❌ **NO DEBE aparecer**: Otros módulos (Usuarios, Productos, Roles, etc.)
   - ✅ **DEBE poder**: Ver categorías existentes
   - ❌ **NO DEBE poder**: 
     - Botón "Crear Categoría"
     - Botones "Editar" y "Eliminar" en categorías
     - Acciones que modifiquen datos

### Escenario 4: Verificar logs en consola

1. **Abrir DevTools** (F12) → Pestaña **Console**
2. **Buscar logs que digan**:
   - `✅ [getUserPermissions] Permisos dinámicos encontrados`
   - `🔍 [hasPermission] Módulo: "categorias"...`
3. **Verificar que el acceso sea**: `Acceso: true` para canView

## 📊 Resultado Esperado

```
Usuario: TestEmpleado (Empleado Limitado)
Módulos Visibles: [Categorias]
Módulos Ocultos: [Usuarios, Roles, Clientes, Proveedores, Productos, Tallas, Colores, Pedidos, Ventas, Compras, Devoluciones]
Acciones en Categorias: [Ver ✅] [Crear ❌] [Editar ❌] [Eliminar ❌]
```

## 🐛 Si algo no funciona:

1. **Categorias no aparece en menú**:
   - Verificar en DevTools → Console si hay logs de hasPermission
   - Buscar "getUserPermissions" logs
   - Verificar que el localStorage `damabella_roles` tiene el rol correctamente guardado

2. **Ve botones de crear/editar/eliminar**:
   - Significa que CategoriasManager no está checando permisos
   - Necesitamos agregar validación en CategoriasManager.tsx

3. **Categorias aparece pero no puede ver categorías**:
   - Problema de renderizado de datos
   - Verificar que el módulo "Categorias" está disponible en STORAGE_KEY

## 💡 Siguiente paso si todo funciona:

Cuando confirmes que funciona:
1. Probaremos con otros módulos (Usuarios, Productos)
2. Probaremos permisos de Crear/Editar/Eliminar
3. Implementaremos checks granulares en componentes

