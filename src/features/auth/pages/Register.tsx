import { useState } from "react";
import { validateEmail, validatePhone, validateDocument } from "../../auth/services/validators";

export default function Registro() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    tipoDocumento: "",
    documento: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    nombre: "",
    email: "",
    telefono: "",
    tipoDocumento: "",
    documento: "",
    password: "",
  });

  // 👉 FUNCIÓN CENTRAL PARA VALIDAR CAMPOS INDIVIDUALES
  const validateField = (name: string, value: string) => {
    let error = "";

    switch (name) {
      case "nombre":
        error = value.trim().length >= 3 ? "" : "El nombre debe tener mínimo 3 caracteres";
        break;

      case "email":
        error = validateEmail(value) ? "" : "Correo inválido";
        break;

      case "telefono":
        error = validatePhone(value) ? "" : "Número inválido";
        break;

      case "tipoDocumento":
        error = value ? "" : "Selecciona un tipo de documento";
        break;

      case "documento":
        if (!formData.tipoDocumento) error = "Selecciona un tipo de documento";
        else error = validateDocument(formData.tipoDocumento, value) ? "" : "Documento inválido";
        break;

      case "password":
        error = value.length >= 6 ? "" : "La contraseña debe tener mínimo 6 caracteres";
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // 👉 ACTUALIZA VALOR + VALIDA AL MISMO TIEMPO
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));

    validateField(name, value); // 🔥 VALIDACIÓN EN TIEMPO REAL
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let newErrors: any = {};

    Object.keys(formData).forEach(key => {
      // @ts-ignore
      validateField(key, formData[key]);
      // @ts-ignore
      newErrors[key] = errors[key];
    });

    // Si aún hay errores, no envía
    if (Object.values(newErrors).some(error => error !== "")) {
      return;
    }

    alert("Usuario registrado correctamente");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Crear Cuenta</h1>
            <p className="text-gray-600 text-sm">Completa todos los campos para registrarte</p>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>

            {/* NOMBRE */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Nombre</label>
              <input
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Tu nombre completo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
              />
              {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Correo electrónico</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* TELÉFONO */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Teléfono</label>
              <input
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="3001234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
              />
              {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>}
            </div>

            {/* TIPO DOCUMENTO */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Tipo de documento</label>
              <select
                name="tipoDocumento"
                value={formData.tipoDocumento}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
              >
                <option value="">Selecciona</option>
                <option value="CC">Cédula de ciudadanía</option>
                <option value="TI">Tarjeta de identidad</option>
                <option value="CE">Cédula de extranjería</option>
              </select>
              {errors.tipoDocumento && <p className="text-red-500 text-xs mt-1">{errors.tipoDocumento}</p>}
            </div>

            {/* DOCUMENTO */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Número de documento</label>
              <input
                name="documento"
                value={formData.documento}
                onChange={handleChange}
                placeholder="1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
              />
              {errors.documento && <p className="text-red-500 text-xs mt-1">{errors.documento}</p>}
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" className="w-full bg-black text-white font-medium py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm mt-4">
              Crear Cuenta
            </button>
          </form>

          <div className="text-center text-xs text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-gray-900 hover:underline font-medium">
              Inicia sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
