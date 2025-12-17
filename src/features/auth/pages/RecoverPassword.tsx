import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../../shared/components/native/Button';
import { Input } from '../../../shared/components/native/Input';
import { Label } from '../../../shared/components/native/Label';
import { Card } from '../../../shared/components/native/Card';
import { useToast } from '../../../shared/components/native/Toast';
import { Mail, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';

export function RecoverPassword() {
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Por favor ingresa tu correo electrónico', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      showToast('Código enviado al correo ' + email, 'success');
      setLoading(false);
      setStep('code');
    }, 1500);
  };

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast('Por favor ingresa el código de verificación', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      showToast('Código verificado correctamente', 'success');
      setLoading(false);
      setStep('password');
    }, 1500);
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showToast('Por favor ingresa una nueva contraseña', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      showToast('Contraseña actualizada correctamente', 'success');
      setLoading(false);
      setTimeout(() => navigate('/login'), 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        {/* Título */}
        <div className="space-y-2">
          {step !== 'email' && (
            <button
              onClick={() => setStep('email')}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              Cambiar correo
            </button>
          )}
          {step === 'email' && (
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          )}
          <h1 className="text-2xl font-bold">
            {step === 'email' && 'Recuperar Contraseña'}
            {step === 'code' && 'Verificar Código'}
            {step === 'password' && 'Nueva Contraseña'}
          </h1>
          <p className="text-gray-600 text-sm">
            {step === 'email' && 'Ingresa tu correo electrónico y te enviaremos un código.'}
            {step === 'code' && 'Ingresa el código de verificación que hemos enviado a tu correo.'}
            {step === 'password' && 'Crea una nueva contraseña segura para tu cuenta.'}
          </p>
        </div>

        {/* Paso 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleSubmitEmail} className="space-y-4">
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
              {loading ? 'Enviando...' : 'Enviar Código'}
            </Button>
          </form>
        )}

        {/* Paso 2: Código */}
        {step === 'code' && (
          <form onSubmit={handleSubmitCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de Verificación</Label>
              <Input
                id="code"
                type="text"
                placeholder="Ingresa el código de 6 dígitos"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
              <p className="text-xs text-gray-500">Revisa tu correo: {email}</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verificando...' : 'Verificar Código'}
            </Button>
          </form>
        )}

        {/* Paso 3: Nueva Contraseña */}
        {step === 'password' && (
          <form onSubmit={handleSubmitPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && confirmPassword && (
                <p className={`text-sm ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                  {newPassword === confirmPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading || newPassword !== confirmPassword}>
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
