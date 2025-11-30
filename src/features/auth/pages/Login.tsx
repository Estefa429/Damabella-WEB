import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../../shared/components/native/Button';
import { Input } from '../../../shared/components/native/Input';
import { Label } from '../../../shared/components/native/Label';
import { Card } from '../../../shared/components/native/Card';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        {/* Logo y título */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">DAMABELLA</h1>
          <p className="text-gray-600">Panel Administrativo</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/recuperar-contraseña"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        {/* Link a registro */}
        <div className="text-center text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-gray-900 hover:underline font-medium">
            Regístrate aquí
          </Link>
        </div>
      </Card>
    </div>
  );
}
