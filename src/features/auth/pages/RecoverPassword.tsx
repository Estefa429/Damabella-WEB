import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../../shared/components/native/Button';
import { Input } from '../../../shared/components/native/Input';
import { Label } from '../../../shared/components/native/Label';
import { Card } from '../../../shared/components/native/Card';
import { useToast } from '../../../shared/components/native/Toast';
import { Mail, ArrowLeft } from 'lucide-react';

export function RecoverPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      showToast('Se ha enviado un correo de recuperación', 'success');
      setLoading(false);
      setTimeout(() => navigate('/login'), 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        {/* Título */}
        <div className="space-y-2">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio de sesión
          </Link>
          <h1 className="text-2xl font-bold">Recuperar Contraseña</h1>
          <p className="text-gray-600">
            Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
          </p>
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
                placeholder="admin@damabella.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Instrucciones'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
