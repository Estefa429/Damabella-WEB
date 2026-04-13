import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../../shared/components/native/Button';
import { Input } from '../../../shared/components/native/Input';
import { Label } from '../../../shared/components/native/Label';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useToast } from '../../../shared/components/native/Toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        showToast('Sesión iniciada correctamente', 'success');
        navigate('/');
      } else {
        showToast('Credenciales inválidas', 'error');
      }
    } catch (error) {
      showToast('Error al iniciar sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Imagen izquierda */}
      <div className="hidden lg:flex w-1/2 bg-gray-900">
        <img
          src="https://images.unsplash.com/photo-1525887367275-1cdffcd1f58f?w=800&h=900&fit=crop"
          alt="Fashion"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Formulario derecha */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Título */}
          <div className="text-left space-y-3">
            <h1 className="text-4xl font-bold text-gray-900">INICIA SESIÓN</h1>
            <p className="text-gray-600">Accede a tu cuenta de DAMABELLA</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-8 border-b border-gray-300 bg-transparent focus:border-gray-900 focus:outline-none rounded-none py-2"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Botón Continuar */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-gray-900 border-2 border-gray-900 py-3 font-bold hover:bg-gray-900 hover:text-white transition-colors"
            >
              {loading ? 'Iniciando sesión...' : 'CONTINUAR'}
            </Button>
          </form>

          {/* Opciones sociales */}
          <div className="space-y-3 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 font-medium">ACCEDER CON</p>
            
            <button className="w-full flex items-center justify-center gap-3 border-2 border-gray-900 text-gray-900 py-3 font-bold hover:bg-gray-900 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              CONTINUAR CON GOOGLE
            </button>

            <button className="w-full flex items-center justify-center gap-3 border-2 border-gray-900 text-gray-900 py-3 font-bold hover:bg-gray-900 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.905-.08 1.77-.67 3.02-.76 1.71-.05 3.35.37 4.26 1.86-4.04 2.41-3.37 7.26.38 8.77z"/>
              </svg>
              CONTINUAR CON APPLE
            </button>
          </div>

          {/* Política de privacidad */}
          <p className="text-xs text-gray-600">
            Al iniciar sesión, acepto vincular mi cuenta conforme a la{' '}
            <Link to="#" className="underline font-semibold text-gray-900">
              Política de Privacidad
            </Link>
          </p>

          {/* Link a registro */}
          <div className="text-center text-sm text-gray-600 pt-4 border-t border-gray-200">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-gray-900 font-bold hover:underline">
              Regístrate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
