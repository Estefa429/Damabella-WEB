# ✅ VERIFICACIÓN RÁPIDA - Formulario de Edición

## 🧪 Test 1: Crear Producto (Mode CREATE)

### Paso 1: Abrir Productos → Nueva Producto
```
Verificar:
□ El formulario está completamente vacío
□ nuevaVariante.talla = ''
□ nuevaVariante.color = ''
```

### Paso 2: Agregar Primera Talla
```
Llenar:
- Talla: "M"
- Color: "Azul"
- Cantidad: 5

Verificar:
□ NO aparece "Morado" ni ningún color por defecto
□ El color se toma del que escribo
□ Botón "Agregar esta Talla" está VISIBLE
```

### Paso 3: Click "Agregar esta Talla"
```
Verificar:
□ Aparece en tabla "Variantes agregadas"
□ El formulario se RESETEA (nuevaVariante vacío)
□ Puedo agregar otra talla
```

---

## 🧪 Test 2: Editar Producto (Mode EDIT)

### Paso 1: Crear un producto primero
```
Crear: "Camiseta Roja"
- Talla M: Rojo (5)
- Talla L: Blanco (3)
```

### Paso 2: Click para Editar
```
Verificar:
□ Se cargan los datos del producto
□ nuevaVariante se RESETEA a vacío
□ Aparecen dos tallas: M y L
□ NO aparece "Morado" en el formulario
```

### Paso 3: Verificar Botones
```
Verificar:
□ Botón "Agregar esta Talla" está OCULTO
□ Mensaje azul dice: "En modo edición, no se pueden agregar nuevas..."
□ Puedo solo eliminar tallas (× al lado)
```

### Paso 4: Intentar Agregar Talla
```
Llenar:
- Talla: "XL"
- Color: "Verde"
- Click "Agregar"

Verificar:
□ Aparece alerta: "En modo edición, no se pueden agregar nuevas..."
□ XL NO se agrega a la lista
□ NO ocurre nada
```

### Paso 5: Cambiar Solo Nombre
```
Cambiar: "Camiseta Roja" → "Camiseta Roja XL"
Click "Guardar"

Verificar:
□ Se guarda el cambio
□ Las variantes (M: Rojo, L: Blanco) se preservan
□ NO se agregó XL
```

---

## 🧪 Test 3: Cambiar de Crear a Editar

### Paso 1: Crear producto
```
"Falda Larga"
- Talla S: Morado (2)
```

### Paso 2: Click "Nueva Producto"
```
Verificar:
□ editMode = false
□ Form se limpia
□ Botón "Agregar Talla" aparece
```

### Paso 3: Click editar ese producto
```
Verificar:
□ editMode = true
□ Form se carga con "Falda Larga"
□ Talla S: Morado aparece
□ Botón "Agregar Talla" desaparece
□ Mensaje azul aparece
```

### Paso 4: Click "Nueva Producto" nuevamente
```
Verificar:
□ Form se limpia COMPLETAMENTE
□ NO aparece "Falda Larga" ni "Morado"
□ Botón "Agregar Talla" aparece de nuevo
```

---

## 🔍 Dónde Mirar

### En el Navegador
```
1. Abrir Productos
2. Click "Nueva Producto" o editar uno
3. Ver formulario "Tallas y Colores"
4. Observar:
   - ¿El color está vacío?
   - ¿Hay un botón "Agregar Talla"?
   - ¿Hay un mensaje en modo edit?
```

### En DevTools (F12 → Console)
```
No hay mensajes especiales que buscar,
pero verifica que:
- No hay errores
- No hay warnings sobre undefined
```

---

## ✅ Checklist Final

Si TODO está ✅:
- [ ] Crear producto: NO hay color por defecto
- [ ] Botón "Agregar" visible solo en CREATE
- [ ] Botón "Agregar" oculto en EDIT
- [ ] Mensaje informativo en EDIT
- [ ] No se pueden agregar tallas en EDIT
- [ ] Se pueden eliminar tallas en EDIT
- [ ] Los datos se preservan al editar
- [ ] Cambiar entre CREATE/EDIT funciona bien

**La solución está ✅ COMPLETA**

