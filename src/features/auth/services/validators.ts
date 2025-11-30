// -----------------------------------------
// VALIDAR EMAIL
// -----------------------------------------
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

// -----------------------------------------
// VALIDAR CELULAR
// solo números, 10 dígitos
// -----------------------------------------
export function validatePhone(phone: string): boolean {
  const regex = /^[0-9]{10}$/;
  return regex.test(phone.trim());
}

// -----------------------------------------
// VALIDAR NOMBRE
// mínimo 3 letras, solo letras y espacios
// -----------------------------------------
export function validateNombre(nombre: string): boolean {
  const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,}$/;
  return regex.test(nombre.trim());
}

// -----------------------------------------
// VALIDAR DIRECCIÓN
// mínimo 5 caracteres
// -----------------------------------------
export function validateDireccion(direccion: string): boolean {
  return direccion.trim().length >= 5;
}

// -----------------------------------------
// VALIDAR PASSWORD
// 8 caracteres, mayúscula, minúscula, número y símbolo
// -----------------------------------------
export function validatePassword(pass: string): boolean {
  const regex =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=?<>]).{8,}$/;
  return regex.test(pass.trim());
}

// -----------------------------------------
// VALIDACIÓN DOCUMENTO POR TIPO
// -----------------------------------------
export function validateDocument(tipo: string, numero: string): boolean {
  if (!tipo || !numero) return false;

  const clean = numero.trim();

  switch (tipo) {
    case "CC":
      return /^[0-9]{6,10}$/.test(clean);

    case "TI":
      return /^[0-9]{6,10}$/.test(clean);

    case "CE":
      return /^[A-Za-z0-9]{6,12}$/.test(clean);

    case "PAS":
      return /^[A-Za-z0-9]{5,15}$/.test(clean);

    default:
      return false;
  }
}
