import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../../shared/components/native/Button';
import { Input } from '../../../shared/components/native/Input';
import { Label } from '../../../shared/components/native/Label';
import { useToast } from '../../../shared/components/native/Toast';
import { Mail, Lock, Eye, EyeOff, User, Phone, MapPin } from 'lucide-react';
import { registrarClienteDesdeEcommerce, RegistroData } from './Register.service';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    numeroDocumento: '',
    telefono: '',
    ciudad: '',
    direccion: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setLoading(true);

    try {
      const registroData: RegistroData = {
        nombre: formData.nombre,
        tipoDocumento: 'CC',
        numeroDocumento: formData.numeroDocumento,
        telefono: formData.telefono,
        ciudad: formData.ciudad,
        email: formData.email,
        direccion: formData.direccion,
        password: formData.password,
      };

      const result = await registrarClienteDesdeEcommerce(registroData);

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
    <div className="min-h-screen flex">
      {/* Imagen izquierda */}
      <div className="hidden lg:flex w-1/2 bg-gray-900">
        <img
          src="https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&h=900&fit=crop"
          alt="Fashion"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Formulario derecha */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Título */}
          <div className="text-left space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">REGÍSTRATE</h1>
            <p className="text-gray-600">Crea tu cuenta en DAMABELLA</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <div className="relative">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="pl-8 border-b border-gray-300 bg-transparent focus:border-gray-900 focus:outline-none rounded-none py-2"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-8 border-b border-gray-300 bg-transparent focus:border-gray-900 focus:outline-none rounded-none py-2"
                />
              </div>
            </div>

            {/* Documento */}
            <div className="space-y-2">
              <Label htmlFor="numeroDocumento">Número de Documento</Label>
              <Input
                id="numeroDocumento"
                name="numeroDocumento"
                type="text"
                placeholder="1234567890"
                value={formData.numeroDocumento}
                onChange={handleChange}
                required
                className="border-b border-gray-300 bg-transparent focus:border-gray-900 focus:outline-none rounded-none py-2"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  placeholder="3001234567"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  className="pl-8 border-b border-gray-300 bg-transparent focus:border-gray-900 focus:outline-none rounded-none py-2"
                />
              </div>
            </div>

            {/* Ciudad */}
            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <div className="relative">
                <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="ciudad"
                  name="ciudad"
                  type="text"
                  placeholder="Bogotá"
                  value={formData.ciudad}
                  onChange={handleChange}
                  required
                  className="pl-8 border-b border-gray-300 bg-transparent focus:border-gray-900 focus:outline-none rounded-none py-2"
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                name="direccion"
                type="text"
                placeholder="Calle 123 #45-67"
                value={formData.direccion}
                onChange={handleChange}
                required
                className="border-b border-gray-300 bg-transparent focus:border-gray-900 focus:outline-none rounded-none py-2"
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="pl-8 pr-10 border-b border-gray-300 bg-transparent focus:border-gray-900 focus:outline-none rounded-none py-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="pl-8 pr-10 border-b border-gray-300 bg-transparent focus:border-gray-900 focus:outline-none rounded-none py-2"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Botón Continuar */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-gray-900 border-2 border-gray-900 py-3 font-bold hover:bg-gray-900 hover:text-white transition-colors mt-6"
            >
              {loading ? 'Registrando...' : 'CONTINUAR'}
            </Button>
          </form>

          {/* Política de privacidad */}
          <p className="text-xs text-gray-600">
            Al registrarte, acepto vincular mi cuenta conforme a la{' '}
            <Link to="#" className="underline font-semibold text-gray-900">
              Política de Privacidad
            </Link>
          </p>

          {/* Link a login */}
          <div className="text-center text-sm text-gray-600 pt-4 border-t border-gray-200">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-gray-900 font-bold hover:underline">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}