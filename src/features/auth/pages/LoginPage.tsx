import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useToast } from '../../../shared/components/native/Toast';
import { Input } from '../../../shared/components/native/Input';
import { Label } from '../../../shared/components/native/Label';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'El email es obligatorio';
    if (!password.trim()) newErrors.password = 'La contraseña es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        showToast('¡Bienvenido!', 'success');
        navigate('/');
      } else {
        setErrors({ form: result.message || 'Correo o contraseña incorrectos' });
      }
    } catch (error) {
      setErrors({ form: 'Error al iniciar sesión' });
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
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 bg-white overflow-hidden">
        <div className="w-full max-w-sm">
          {/* BOTÓN VOLVER HOME */}
          <button
            onClick={() => navigate('/')}
            className="mb-6 text-sm text-gray-600 hover:text-black transition"
          >
            ← Volver a inicio
          </button>

          {/* HEADER */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Inicia sesión</h1>
            <p className="text-gray-600 text-lg">Bienvenido a DAMABELLA</p>
          </div>

          {/* ERROR GENERAL */}
          {errors.form && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.form}</p>
            </div>
          )}

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* EMAIL */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={loading}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* PASSWORD */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-900">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 ${
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
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* BOTÓN SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-4"
            >
              {loading ? 'Iniciando sesión...' : 'Continuar'}
            </button>
          </form>

          {/* ENLACE A REGISTRO */}
          <div className="mt-4 text-center">
            <p className="text-gray-600 text-xs">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => navigate('/registro')}
                className="text-black font-bold hover:underline transition"
              >
                Regístrate aquí
              </button>
            </p>
          </div>

          {/* ENLACE A RECUPERAR CONTRASEÑA */}
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => navigate('/recover-password')}
              className="text-gray-600 text-xs hover:text-gray-900 transition"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}