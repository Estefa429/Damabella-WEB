export function isEmpty(value: any) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

export function validateField(field: string, value: any) {
  if (field === 'nombre' || field === 'name') {
    if (isEmpty(value)) return 'Este campo es obligatorio';
    if (String(value).trim().length < 3) return 'Debe tener al menos 3 caracteres';
    if (!/^[a-zA-Z0-9\s\-áéíóúñÁÉÍÓÚÑ]+$/.test(String(value))) return 'No se permiten caracteres especiales';
    return '';
  }

  if (field === 'email') {
    if (isEmpty(value)) return 'Este campo es obligatorio';
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;
    if (!re.test(String(value).toLowerCase())) return 'Correo inválido';
    return '';
  }

  if (field === 'password') {
    if (isEmpty(value)) return 'Este campo es obligatorio';
    if (String(value).length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return '';
  }

  if (field === 'documento') {
    if (isEmpty(value)) return 'Este campo es obligatorio';
    if (!/^[0-9]+$/.test(String(value))) return 'El documento debe ser numérico';
    if (String(value).length < 6) return 'Documento demasiado corto';
    return '';
  }

  if (field === 'price' || field === 'precio' || field === 'price') {
    if (isEmpty(value)) return 'Este campo es obligatorio';
    const n = parseFloat(value);
    if (isNaN(n) || n <= 0) return 'Debe ser un número mayor a 0';
    return '';
  }

  if (field === 'hex' || field === 'hexCode' || field === 'newColorHex') {
    if (isEmpty(value)) return 'Este campo es obligatorio';
    if (!/^#([0-9A-Fa-f]{3}){1,2}$/.test(String(value))) return 'Código hex inválido';
    return '';
  }

  // Default: no error
  return '';
}

export default validateField;
