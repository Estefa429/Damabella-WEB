import { useState, useEffect } from "react";

export const useRegister = () => {
  const [form, setForm] = useState({
    email: "",
    telefono: "",
    documento: "",
    nombres: "",
    apellidos: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    telefono: "",
    documento: "",
    nombres: "",
    apellidos: "",
  });

  const validateField = (field: string, value: string) => {
    let error = "";

    switch (field) {
      case "email":
        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
          error = "Email inválido";
        }
        break;

      case "telefono":
        if (!/^\d{10}$/.test(value)) {
          error = "Teléfono inválido";
        }
        break;

      case "documento":
        if (!/^\d{6,10}$/.test(value)) {
          error = "Documento inválido";
        }
        break;

      case "nombres":
        if (value.trim().length < 3) {
          error = "Nombres muy cortos";
        }
        break;

      case "apellidos":
        if (value.trim().length < 3) {
          error = "Apellidos muy cortos";
        }
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // 🎯 VALIDACIONES EN TIEMPO REAL — AQUÍ ESTABA TU PROBLEMA
  useEffect(() => validateField("email", form.email), [form.email]);
  useEffect(() => validateField("telefono", form.telefono), [form.telefono]);
  useEffect(() => validateField("documento", form.documento), [form.documento]);
  useEffect(() => validateField("nombres", form.nombres), [form.nombres]);
  useEffect(() => validateField("apellidos", form.apellidos), [form.apellidos]);

  // EVENTO ONCHANGE
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const canSubmit =
    Object.values(errors).every((e) => e === "") &&
    Object.values(form).every((v) => v !== "");

  return {
    form,
    errors,
    onChange,
    canSubmit,
  };
};
