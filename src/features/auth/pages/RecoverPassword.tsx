import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../../shared/components/native/Button';
import { Input } from '../../../shared/components/native/Input';
import { Label } from '../../../shared/components/native/Label';
import { Mail, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import {
  generateRecoveryCode,
  verifyRecoveryCode,
  updateUserPassword,
  findUserByEmail,
  clearRecoveryCode,
} from '../services/authService';

export function RecoverPassword() {
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!email.trim()) newErrors.email = 'El email es obligatorio';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const user = findUserByEmail(email);
    if (!user) {
      setErrors({ email: 'No existe una cuenta con este correo' });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      generateRecoveryCode(email);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('code');
    } catch (error) {
      setErrors({ form: 'Error al enviar el código. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!code.trim()) newErrors.code = 'El código es obligatorio';
    if (code.length !== 6) newErrors.code = 'El código debe tener 6 dígitos';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      if (verifyRecoveryCode(email, code)) {
        setStep('password');
      } else {
        setErrors({ code: 'El código es inválido o ha expirado' });
      }
    } catch (error) {
      setErrors({ form: 'Error al verificar el código. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!newPassword.trim()) newErrors.newPassword = 'La contraseña es obligatoria';
    if (newPassword.length < 6) newErrors.newPassword = 'Mínimo 6 caracteres';
    if (!confirmPassword.trim()) newErrors.confirmPassword = 'Confirma tu contraseña';
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const success = updateUserPassword(email, newPassword);
      
      if (success) {
        clearRecoveryCode(email);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setErrors({ form: 'Error al actualizar la contraseña' });
      }
    } catch (error) {
      setErrors({ form: 'Error al actualizar la contraseña. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 items-center justify-center">
        <img
          src="https://pinkrose.com.co/cdn/shop/files/Romper-sin-mangas-con-cuello-y-correa-1_5d00b54c-7abe-41df-9681-2bb6cc5ef32b.jpg?v=1774408487"
          alt="Fashion Model"
          className="max-h-[50vh] w-auto object-cover"
        />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 bg-white overflow-y-auto">
        <div className="w-full max-w-sm py-6">
          <div className="mb-6">
            {step !== 'email' && (
              <button
                onClick={() => { setStep('email'); setErrors({}); }}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Cambiar correo
              </button>
            )}
            {step === 'email' && (
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-4">
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </Link>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
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

          {/* ERROR GENERAL */}
          {errors.form && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.form}</p>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSubmitEmail} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: '' })); }}
                    disabled={loading}
                    className={`pl-10 w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>
              <Button type="submit" className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-900" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Código'}
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleSubmitCode} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="code" className="text-sm font-semibold text-gray-900">
                  Código de Verificación
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Ingresa el código de 6 dígitos"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); if (errors.code) setErrors(prev => ({ ...prev, code: '' })); }}
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                <p className="text-xs text-gray-500 mt-2">Revisa tu correo: {email}</p>
                <p className="text-xs text-gray-400">El código expira en 10 minutos</p>
              </div>
              <Button type="submit" className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-900" disabled={loading}>
                {loading ? 'Verificando...' : 'Verificar Código'}
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleSubmitPassword} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-900">
                  Nueva Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: '' })); }}
                    disabled={loading}
                    className={`pl-10 w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-red-500 text-xs">{errors.newPassword}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-900">
                  Confirmar Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repite tu nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' })); }}
                    disabled={loading}
                    className={`pl-10 w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
                {newPassword && confirmPassword && !errors.confirmPassword && (
                  <p className={newPassword === confirmPassword ? 'text-xs text-green-600' : 'text-xs text-red-600'}>
                    {newPassword === confirmPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-900" disabled={loading || newPassword !== confirmPassword}>
                {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
