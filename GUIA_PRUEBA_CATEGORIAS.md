# GUÍA DE PRUEBA - Sistema de Permisos Categorías

## 🎬 Guía Paso a Paso para Probar

### PASO 1: Crear un Rol con Permisos Limitados

```
📍 Ruta: Admin → Roles (o Configuración → Roles)
```

**Haciendo clic en "Crear Rol":**

1. **Nombre del Rol**: `Empleado Prueba`
2. **Descripción**: `Usuario con acceso solo para ver categorías`
3. **Permisos** - Marcar SOLO ESTO:
   - ✅ Usuarios → **Desmarcar todo**
   - ✅ Categorias → **Marcar solo "Ver"** (canView)
   - ❌ Categorias → Crear (canCreate) **DESMARCAR**
   - ❌ Categorias → Editar (canEdit) **DESMARCAR**
   - ❌ Categorias → Eliminar (canDelete) **DESMARCAR**
   - ✅ Todos los otros módulos → **Desmarcar todo**

4. **Guardar** → Debe aparecer mensaje "Rol creado correctamente"

---

### PASO 2: Crear un Usuario con ese Rol

```
📍 Ruta: Admin → Gestión de Usuarios → Crear Usuario
```

**Datos del usuario:**
- **Nombre**: `TestEmpleado`
- **Email**: `test.empleado@ejemplo.com`
- **Documento**: `123456789`
- **Contraseña**: `TestPass123!` (mayúscula, minúscula, número, carácter especial)
- **Rol**: `Empleado Prueba` ← **IMPORTANTE: Seleccionar el rol que creamos**
- **Estado**: `Activo`

**Crear usuario** → Debe aparecer "Usuario creado correctamente"

---

### PASO 3: Cerrar Sesión

```
📍 Click en perfil (arriba a la derecha) → Cerrar sesión
```

---

### PASO 4: Login como Empleado

```
📍 Página de login
```

**Ingresar:**
- **Email**: `test.empleado@ejemplo.com`
- **Contraseña**: `TestPass123!`
- **Iniciar Sesión**

---

### PASO 5: Ir a Categorías

```
📍 Menu lateral → Categorías
```

---

## ✅ RESULTADO ESPERADO

### En la página de Categorías deberías VER:

1. **Lista de categorías visible** ✅
   - Vestidos Largos
   - Vestidos Cortos
   - Sets
   - Enterizos
   
2. **Botón "Nueva Categoría"** 
   - ✅ Visible pero **GRIS/DESHABILITADO**
   - 🔄 Al pasar el cursor, debe cambiar a `cursor: not-allowed`
   - 💬 Tooltip dice: "No tienes permiso para crear categorías"

3. **Botones de Editar (✏️)**
   - ✅ Visibles pero **GRISES/DESHABILITADOS**
   - 🔄 Al pasar el cursor, debe cambiar a `cursor: not-allowed`
   - 💬 Tooltip dice: "No tienes permiso para editar"

4. **Botones de Eliminar (🗑️)**
   - ✅ Visibles pero **GRISES/DESHABILITADOS**
   - 🔄 Al pasar el cursor, debe cambiar a `cursor: not-allowed`
   - 💬 Tooltip dice: "No tienes permiso para eliminar"

5. **Botones de Ver (👁️)**
   - ✅ **Activos** - puede hacer clic para ver productos
   - 🔄 Color azul normal

---

## 🐛 Si ALGO NO FUNCIONA COMO ESPERADO

### Escenario A: Botones NO están deshabilitados
```
Posible causa: 
- El usuario no tiene el rol asignado correctamente
- El localStorage 'damabella_roles' no tiene los permisos

Solución:
1. Abre DevTools (F12)
2. Consola → ejecuta:
   console.log(JSON.parse(localStorage.getItem('damabella_current_user')))
   console.log(JSON.parse(localStorage.getItem('damabella_roles')))
3. Verifica que el usuario tenga rol "Empleado Prueba"
4. Verifica que el rol tenga permisos para Categorias
```

### Escenario B: No ves las categorías
```
Posible causa:
- Las categorías no están almacenadas en localStorage

Solución:
1. Abre DevTools (F12)
2. Consola → ejecuta:
   console.log(JSON.parse(localStorage.getItem('damabella_categorias')))
3. Si devuelve null, crea una categoría como admin
4. Luego vuelve a login como empleado
```

### Escenario C: Los botones están visibles pero NO deshabilitados
```
Posible causa:
- Los permisos no se leyeron correctamente del localStorage

Solución:
1. Abre DevTools (F12)
2. Consola → mira los logs que dicen:
   ✅ [CategoriasManager] Permisos cargados para...
   📋 [CategoriasManager] Permisos del usuario...
3. Si NO ves estos logs, recarga la página (F5)
```

---

## 📊 Información en Consola

Cuando el usuario "Empleado Prueba" abre la página de Categorías, en la consola verás:

```javascript
✅ [CategoriasManager] Permisos cargados para Empleado Prueba: {
  categorias: {
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false
  },
  usuarios: {},
  // ... otros módulos sin permisos
}

📋 [CategoriasManager] Permisos del usuario Empleado Prueba: {
  canViewCategorias: true,
  canCreateCategorias: false,
  canEditCategorias: false,
  canDeleteCategorias: false
}
```

---

## 🎯 Comparación ANTES vs DESPUÉS

### ANTES (Problema)
```
Usuario: Empleado Prueba
Rol: Empleado Prueba (solo permiso Ver)
Resultado: ❌ PODÍA crear, editar y eliminar categorías
```

### DESPUÉS (Solución)
```
Usuario: Empleado Prueba  
Rol: Empleado Prueba (solo permiso Ver)
Resultado: ✅ SOLO puede ver categorías
           ❌ No puede crear (botón deshabilitado)
           ❌ No puede editar (botón deshabilitado)
           ❌ No puede eliminar (botón deshabilitado)
```

---

## 💡 Alternativa: Probar con Otro Rol

Si quieres probar con permisos de Crear pero NO Editar/Eliminar:

**Paso 1:** Crear rol "Empleado Con Crear"
- Categorias → Ver: ✅
- Categorias → Crear: ✅
- Categorias → Editar: ❌
- Categorias → Eliminar: ❌

**Paso 2:** Crear usuario con ese rol

**Paso 3:** Verificar que:
- ✅ Botón "Nueva Categoría" esté **ACTIVO**
- ❌ Botones "Editar" estén **DESHABILITADOS**
- ❌ Botones "Eliminar" estén **DESHABILITADOS**

---

## ✨ Resumen de Validación

| Acción | Debe estar deshabilitado? | Comportamiento esperado |
|--------|---------------------------|------------------------|
| Ver Categorías | ❌ No | Puede ver lista completa |
| Ver Productos | ❌ No | Puede hacer clic en botón 👁️ |
| Crear Categoría | ✅ Sí | Gris, cursor: not-allowed |
| Editar Categoría | ✅ Sí | Gris, cursor: not-allowed |
| Eliminar Categoría | ✅ Sí | Gris, cursor: not-allowed |

---

## 🚀 Una vez que TODO funciona:

Puedes probar con otros módulos y permisos diferentes para validar que el sistema de permisos está funcionando globalmente.

