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
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Registro</h1>

      <form className="space-y-4" onSubmit={handleSubmit}>

        {/* NOMBRE */}
        <div>
          <label>Nombre</label>
          <input
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="border p-2 w-full"
          />
          {errors.nombre && <p className="text-red-500 text-sm">{errors.nombre}</p>}
        </div>

        {/* EMAIL */}
        <div>
          <label>Correo electrónico</label>
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="border p-2 w-full"
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        {/* TELÉFONO */}
        <div>
          <label>Teléfono</label>
          <input
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className="border p-2 w-full"
          />
          {errors.telefono && <p className="text-red-500 text-sm">{errors.telefono}</p>}
        </div>

        {/* TIPO DOCUMENTO */}
        <div>
          <label>Tipo de documento</label>
          <select
            name="tipoDocumento"
            value={formData.tipoDocumento}
            onChange={handleChange}
            className="border p-2 w-full"
          >
            <option value="">Selecciona</option>
            <option value="CC">Cédula de ciudadanía</option>
            <option value="TI">Tarjeta de identidad</option>
            <option value="CE">Cédula de extranjería</option>
          </select>
          {errors.tipoDocumento && <p className="text-red-500 text-sm">{errors.tipoDocumento}</p>}
        </div>

        {/* DOCUMENTO */}
        <div>
          <label>Número de documento</label>
          <input
            name="documento"
            value={formData.documento}
            onChange={handleChange}
            className="border p-2 w-full"
          />
          {errors.documento && <p className="text-red-500 text-sm">{errors.documento}</p>}
        </div>

        {/* PASSWORD */}
        <div>
          <label>Contraseña</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="border p-2 w-full"
          />
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Registrarme
        </button>
      </form>
    </div>
  );
}
