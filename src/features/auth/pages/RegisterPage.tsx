import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../../shared/components/native/Toast';
import { Input } from '../../../shared/components/native/Input';
import { Label } from '../../../shared/components/native/Label';
import { registrarClienteDesdeEcommerce, isEmailUnique, isDocumentoUnique } from './Register.service';

export function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    tipoDocumento: '1',
    numeroDocumento: '',
    telefono: '',
    ciudad: '',
    direccion: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    // Solo números para documento
    if (name === 'numeroDocumento') {
      finalValue = value.replace(/\D/g, '');
    }
    // Solo números para teléfono
    if (name === 'telefono') {
      finalValue = value.replace(/\D/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    // Validar en tiempo real
    const newErrors = { ...errors };
    
    if (name === 'nombre' && finalValue.trim()) {
      delete newErrors.nombre;
    } else if (name === 'nombre' && !finalValue.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (name === 'email' && finalValue.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(finalValue)) {
        delete newErrors.email;
      } else {
        newErrors.email = 'Email inválido';
      }
    } else if (name === 'email' && !finalValue.trim()) {
      newErrors.email = 'El email es obligatorio';
    }

    if (name === 'numeroDocumento' && finalValue.trim()) {
      if (finalValue.length >= 8) {
        delete newErrors.numeroDocumento;
      } else {
        newErrors.numeroDocumento = 'Mínimo 8 dígitos';
      }
    } else if (name === 'numeroDocumento' && !finalValue.trim()) {
      newErrors.numeroDocumento = 'El documento es obligatorio';
    }

    if (name === 'telefono' && finalValue.trim()) {
      if (finalValue.length >= 10) {
        delete newErrors.telefono;
      } else {
        newErrors.telefono = 'Mínimo 10 dígitos';
      }
    } else if (name === 'telefono' && !finalValue.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    }

    if (name === 'ciudad' && finalValue.trim()) {
      delete newErrors.ciudad;
    } else if (name === 'ciudad' && !finalValue.trim()) {
      newErrors.ciudad = 'La ciudad es obligatoria';
    }

    if (name === 'direccion' && finalValue.trim()) {
      delete newErrors.direccion;
    } else if (name === 'direccion' && !finalValue.trim()) {
      newErrors.direccion = 'La dirección es obligatoria';
    }

    if (name === 'password' && finalValue) {
      const hasUpperCase = /[A-Z]/.test(finalValue);
      const hasLowerCase = /[a-z]/.test(finalValue);
      const hasNumber = /[0-9]/.test(finalValue);
      const isLongEnough = finalValue.length >= 8;

      if (isLongEnough && hasUpperCase && hasLowerCase && hasNumber) {
        delete newErrors.password;
      } else {
        const missing = [];
        if (!isLongEnough) missing.push('8+ caracteres');
        if (!hasUpperCase) missing.push('mayúscula');
        if (!hasLowerCase) missing.push('minúscula');
        if (!hasNumber) missing.push('número');
        newErrors.password = `Necesitas: ${missing.join(', ')}`;
      }
    } else if (name === 'password' && !finalValue) {
      newErrors.password = 'La contraseña es obligatoria';
    }

    if (name === 'confirmPassword' && finalValue) {
      if (finalValue === formData.password) {
        delete newErrors.confirmPassword;
      } else {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    } else if (name === 'confirmPassword' && !finalValue) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    }

    setErrors(newErrors);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = 'El email es inválido';
    }
    
    if (!formData.tipoDocumento.trim()) newErrors.tipoDocumento = 'Selecciona un tipo de documento';
    
    if (!formData.numeroDocumento.trim() || formData.numeroDocumento.length < 8) {
      newErrors.numeroDocumento = 'Documento inválido (mínimo 8 dígitos)';
    }
    
    if (!formData.telefono.trim() || formData.telefono.length < 10) {
      newErrors.telefono = 'Teléfono inválido (mínimo 10 dígitos)';
    }
    
    if (!formData.ciudad.trim()) newErrors.ciudad = 'La ciudad es obligatoria';
    if (!formData.direccion.trim()) newErrors.direccion = 'La dirección es obligatoria';
    
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const isLongEnough = formData.password.length >= 8;
    
    if (!formData.password || !isLongEnough || !hasUpperCase || !hasLowerCase || !hasNumber) {
      newErrors.password = 'Contraseña débil';
    }
    
    if (!formData.confirmPassword || formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Por favor completa todos los campos', 'error');
      return;
    }

    setLoading(true);

    try {
      // Validar email único
      const emailUnique = await isEmailUnique(formData.email);
      if (!emailUnique) {
        setErrors(prev => ({ ...prev, email: 'Este email ya está registrado' }));
        showToast('Este email ya está registrado', 'error');
        setLoading(false);
        return;
      }

      // Validar documento único
      const docUnique = await isDocumentoUnique(formData.numeroDocumento);
      if (!docUnique) {
        setErrors(prev => ({ ...prev, numeroDocumento: 'Este documento ya está registrado' }));
        showToast('Este documento ya está registrado', 'error');
        setLoading(false);
        return;
      }

      // Registrar cliente
      const result = await registrarClienteDesdeEcommerce({
        nombre: formData.nombre,
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento,
        telefono: formData.telefono,
        ciudad: formData.ciudad,
        email: formData.email,
        direccion: formData.direccion,
        password: formData.password,
      });

      if (result.success) {
        showToast('¡Registro exitoso! Redirigiendo al login...', 'success');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showToast(result.error || 'Error al registrarse', 'error');
      }
    } catch (error) {
      showToast('Error al registrarse', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* IMAGEN IZQUIERDA */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 items-center justify-center">
        <img
          src="https://pinkrose.com.co/cdn/shop/files/Romper-sin-mangas-con-cuello-y-correa-1_5d00b54c-7abe-41df-9681-2bb6cc5ef32b.jpg?v=1774408487"
          alt="Fashion Model"
          className="max-h-[50vh] w-auto object-cover"
        />
      </div>

      {/* FORMULARIO DERECHA */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 bg-white">
        <div className="w-full max-w-sm py-3">
          {/* HEADER */}
          <div className="mb-3">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Crea tu cuenta</h1>
            <p className="text-gray-600 text-sm">Únete a DAMABELLA</p>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} className="space-y-1.5">
            {/* NOMBRE */}
            <div className="space-y-1">
              <Label htmlFor="nombre" className="text-sm font-semibold text-gray-900">
                Nombre completo
              </Label>
              <Input
                id="nombre"
                name="nombre"
                type="text"
                placeholder="Tu nombre"
                value={formData.nombre}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 ${
                  errors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.nombre && <p className="text-red-500 text-xs">{errors.nombre}</p>}
            </div>

            {/* EMAIL */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
            </div>

            {/* TIPO Y NÚMERO DE DOCUMENTO */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="tipoDocumento" className="text-sm font-semibold text-gray-900">
                  Tipo doc.
                </Label>
                <select
                  id="tipoDocumento"
                  name="tipoDocumento"
                  value={formData.tipoDocumento}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm ${
                    errors.tipoDocumento ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="1">CC - Cédula</option>
                  <option value="2">TI - Tarjeta Identidad</option>
                  <option value="3">PA - Pasaporte</option>
                  <option value="4">CE - Cédula Extranjería</option>
                </select>
                {errors.tipoDocumento && <p className="text-red-500 text-xs">{errors.tipoDocumento}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="numeroDocumento" className="text-sm font-semibold text-gray-900">
                  Número
                </Label>
                <Input
                  id="numeroDocumento"
                  name="numeroDocumento"
                  type="text"
                  placeholder="1234567890"
                  value={formData.numeroDocumento}
                  onChange={handleChange}
                  disabled={loading}
                  inputMode="numeric"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 text-sm ${
                    errors.numeroDocumento ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.numeroDocumento && <p className="text-red-500 text-xs">{errors.numeroDocumento}</p>}
              </div>
            </div>

            {/* TELÉFONO Y CIUDAD */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="telefono" className="text-sm font-semibold text-gray-900">
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="text"
                  placeholder="3001234852"
                  value={formData.telefono}
                  onChange={handleChange}
                  disabled={loading}
                  inputMode="numeric"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 text-sm ${
                    errors.telefono ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.telefono && <p className="text-red-500 text-xs">{errors.telefono}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="ciudad" className="text-sm font-semibold text-gray-900">
                  Ciudad
                </Label>
                <select
                  id="ciudad"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm cursor-pointer ${
                    errors.ciudad ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar ciudad...</option>
                  <option value="Bogotá">Bogotá</option>
                  <option value="Medellín">Medellín</option>
                  <option value="Cali">Cali</option>
                  <option value="Barranquilla">Barranquilla</option>
                  <option value="Cartagena">Cartagena</option>
                  <option value="Santa Marta">Santa Marta</option>
                  <option value="Cúcuta">Cúcuta</option>
                  <option value="Bucaramanga">Bucaramanga</option>
                  <option value="Manizales">Manizales</option>
                  <option value="Pereira">Pereira</option>
                  <option value="Armenia">Armenia</option>
                  <option value="Ibagué">Ibagué</option>
                  <option value="Villavicencio">Villavicencio</option>
                  <option value="Honda">Honda</option>
                  <option value="Tunja">Tunja</option>
                  <option value="Duitama">Duitama</option>
                  <option value="Socorro">Socorro</option>
                  <option value="Guatavita">Guatavita</option>
                  <option value="Zipaquirá">Zipaquirá</option>
                  <option value="Fusagasugá">Fusagasugá</option>
                  <option value="Soacha">Soacha</option>
                  <option value="Chía">Chía</option>
                  <option value="Cajicá">Cajicá</option>
                  <option value="Envigado">Envigado</option>
                  <option value="Itagüí">Itagüí</option>
                  <option value="La Ceja">La Ceja</option>
                  <option value="Rionegro">Rionegro</option>
                  <option value="Sabaneta">Sabaneta</option>
                  <option value="Copacabana">Copacabana</option>
                  <option value="Girardota">Girardota</option>
                  <option value="Remedios">Remedios</option>
                  <option value="Peque">Peque</option>
                  <option value="Valdivia">Valdivia</option>
                  <option value="Yarumal">Yarumal</option>
                </select>
                {errors.ciudad && <p className="text-red-500 text-xs">{errors.ciudad}</p>}
              </div>
            </div>

            {/* DIRECCIÓN */}
            <div className="space-y-1">
              <Label htmlFor="direccion" className="text-sm font-semibold text-gray-900">
                Dirección
              </Label>
              <Input
                id="direccion"
                name="direccion"
                type="text"
                placeholder="Calle 123 #45-67"
                value={formData.direccion}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 text-sm ${
                  errors.direccion ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.direccion && <p className="text-red-500 text-xs">{errors.direccion}</p>}
            </div>

            {/* PASSWORD */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-900">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 text-sm ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-900">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 text-sm ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 transition"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
            </div>

            {/* BOTÓN SUBMIT */}
            <button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
              className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          {/* ENLACE A LOGIN */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-black font-bold hover:underline transition"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
