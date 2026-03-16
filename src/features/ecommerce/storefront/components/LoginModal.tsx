import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { Button, Input, Label, useToast } from '../../../../shared/components/native';
import { useAuth } from '@/shared';
import { registrarClienteDesdeEcommerce, isEmailUnique, isDocumentoUnique, CIUDADES_COLOMBIA } from '../../../../services/clienteRegistroService';
import { getAllTypesDocs, TypesDocs } from '@/features/suppliers/services/providersService'; 

interface LoginModalProps {
  onClose: () => void;
  onLogin: () => void;
}

const validatePassword = (password: string) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return regex.test(password);
};

const validateEmail = (email: string) => {
  const regex = /^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

const validateNombre = (nombre: string) => {
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return regex.test(nombre);
};

const validateDocumento = (tipoDoc: number, numeroDoc: string) => {
  switch(tipoDoc) {
    //  return /^\d+$/.test(numeroDoc) && numeroDoc.length >= 6 && numeroDoc.length <= 12;
    //  return /^\d+$/.test(numeroDoc) && numeroDoc.length >= 6 && numeroDoc.length <= 12;
    case 1:
    case 2:
    case 3:
      return /^\d+$/.test(numeroDoc) && numeroDoc.length >= 6 && numeroDoc.length <= 12;
    default:
      return numeroDoc.length >= 6;
  }
};

const validateCelular = (celular: string) => {
  return /^\d{10}$/.test(celular);
};

export function LoginModal({ onClose, onLogin }: LoginModalProps) {
  const [typesDocs, setTypesDocs] = useState<TypesDocs[]>([]);

    useEffect(() => {
      const fetchTypesDocs = async () => {
        const data = await getAllTypesDocs();
        if (data) setTypesDocs(data);
      };
      fetchTypesDocs();
    }, []);
  const [tab, setTab] = useState<'login' | 'register' | 'recovery'>('login');
  const { showToast } = useToast();
  const {login} = useAuth()

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register
  const [registerData, setRegisterData] = useState({
    nombre: '',
    tipoDoc: 1,
    numeroDoc: '',
    celular: '',
    ciudad: '',
    direccion: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [registerErrors, setRegisterErrors] = useState<any>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recovery
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');

  // ─── handleLogin — conectar a la API ─────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await login(loginEmail, loginPassword);

    if (result.success) {
      showToast('¡Bienvenido!', 'success');
      onLogin(); // solo para notificar al padre que hubo login
      onClose();
    } else {
      showToast(result.message || 'Correo o contraseña incorrectos', 'error');
    }
  };

  // Validar un campo individual
  const validateField = (fieldName: string, value: string): string | null => {
    switch (fieldName) {
      case 'nombre':
        if (!value.trim()) return 'El nombre es obligatorio';
        if (!validateNombre(value)) return 'Solo letras, espacios, tildes y ñ';
        return null;

      case 'tipoDoc':
        if (!value) return 'Selecciona un tipo de documento';
        return null;

      case 'numeroDoc':
        if (!value.trim()) return 'El número de documento es obligatorio';
        if (!validateDocumento(registerData.tipoDoc, value)) {
          return 'Documento inválido para el tipo seleccionado';
        }
        return null;

      case 'celular':
        if (!value.trim()) return 'El celular es obligatorio';
        if (!validateCelular(value)) return 'Debe tener 10 dígitos';
        return null;

      case 'ciudad':
        if (!value.trim()) return 'La ciudad es obligatoria';
        if (value.trim().length < 2) return 'La ciudad debe tener al menos 2 caracteres';
        return null;

      case 'direccion':
        if (!value.trim()) return 'La dirección es obligatoria';
        if (value.trim().length < 10) return 'Ingresa una dirección completa';
        return null;

      case 'email':
        if (!value.trim()) return 'El email es obligatorio';
        if (!validateEmail(value)) return 'Email inválido (debe comenzar con letra)';
        return null;

      case 'password':
        if (!value) return 'La contraseña es obligatoria';
        if (value.length < 8) return `${8 - value.length} caracteres faltantes`;
        if (!/[A-Z]/.test(value)) return 'Agrega una MAYÚSCULA';
        if (!/[a-z]/.test(value)) return 'Agrega una minúscula';
        if (!/\d/.test(value)) return 'Agrega un número (0-9)';
        if (!/[@$!%*?&#]/.test(value)) return 'Agrega un carácter especial (@$!%*?&#)';
        return null;

      case 'confirmPassword':
        if (!value) return 'Confirma tu contraseña';
        if (value !== registerData.password) return 'Las contraseñas no coinciden';
        return null;

      default:
        return null;
    }
  };

  // Manejar cambio de campo con validación en tiempo real
  const handleFieldChange = (fieldName: string, value: string) => {
    setRegisterData({ ...registerData, [fieldName]: value });

    // Validar solo si el campo fue tocado
    if (touchedFields.has(fieldName)) {
      const error = validateField(fieldName, value);
      if (error) {
        setRegisterErrors({ ...registerErrors, [fieldName]: error });
      } else {
        const newErrors = { ...registerErrors };
        delete newErrors[fieldName];
        setRegisterErrors(newErrors);
      }
    }
  };

  // Manejar blur para validar campo
  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields(new Set([...touchedFields, fieldName]));
    const value = String(registerData[fieldName as keyof typeof registerData] || '');
    const error = validateField(fieldName, value);
    if (error) {
      setRegisterErrors({ ...registerErrors, [fieldName]: error });
    } else {
      const newErrors = { ...registerErrors };
      delete newErrors[fieldName];
      setRegisterErrors(newErrors);
    }
  };

  const validateRegisterForm = (): boolean => {
    const newErrors: any = {};
    let hasErrors = false;

    // Validar todos los campos
    const fields = ['nombre', 'tipoDoc', 'numeroDoc', 'celular', 'ciudad', 'direccion', 'email', 'password', 'confirmPassword'];
    
    fields.forEach(fieldName => {
      const value = String(registerData[fieldName as keyof typeof registerData] || '');
      const error = validateField(fieldName, value);
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    });

    setRegisterErrors(newErrors);
    setTouchedFields(new Set(['nombre', 'tipoDoc', 'numeroDoc', 'celular', 'ciudad', 'direccion', 'email', 'password', 'confirmPassword']));
    
    return !hasErrors;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRegisterForm()) {
      showToast('Por favor corrige los errores', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // ─── Validaciones async contra la API ─────────────────────────────
      const emailUnico = await isEmailUnique(registerData.email);
      if (!emailUnico) {
        setRegisterErrors(prev => ({ ...prev, email: 'Este correo ya está registrado' }));
        setIsSubmitting(false);
        return;
      }

      const docUnico = await isDocumentoUnique(registerData.numeroDoc);
      if (!docUnico) {
        setRegisterErrors(prev => ({ ...prev, numeroDoc: 'Este documento ya está registrado' }));
        setIsSubmitting(false);
        return;
      }

      // ─── Llamada al servicio ───────────────────────────────────────────
      const result = await registrarClienteDesdeEcommerce({
        nombre:          registerData.nombre,
        tipoDocumento:   registerData.tipoDoc,
        numeroDocumento: registerData.numeroDoc,
        telefono:        registerData.celular,
        ciudad:          registerData.ciudad,
        email:           registerData.email,
        direccion:       registerData.direccion,
        password:        registerData.password,
      });

      if (!result.success) {
        showToast(result.error || 'Error al registrar', 'error');
        return;
      }

      showToast('¡Registro exitoso! Ahora puedes iniciar sesión', 'success');
      setTab('login');
      setRegisterData({
        nombre: '',
        tipoDoc: 0,
        numeroDoc: '',
        celular: '',
        ciudad: '',
        direccion: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      setRegisterErrors({});
      setTouchedFields(new Set());
      onClose();

    } catch (error) {
      showToast('Error al registrar. Intenta de nuevo.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── handleRecoveryStep1 — solicitar OTP a la API ────────────────────────────
  const handleRecoveryStep1 = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/request-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail }),
      });

      const data = await response.json();

      if (data.success) {
        setRecoveryStep(2);
        showToast('Código enviado a tu correo', 'success');
      } else {
        showToast('No se encontró una cuenta con este correo', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
  };

  // ─── handleRecoveryStep2 — validar OTP ───────────────────────────────────────
  const handleRecoveryStep2 = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/validate-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail, code: recoveryCode }),
      });

      const data = await response.json();

      if (data.success) {
        setRecoveryStep(3);
      } else {
        showToast('Código incorrecto o expirado', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
  };

    // ─── handleRecoveryStep3 — resetear contraseña ───────────────────────────────
  const handleRecoveryStep3 = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(recoveryNewPassword)) {
      showToast('La contraseña debe tener 8+ caracteres, mayúscula, minúscula, número y especial', 'error');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/reset-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recoveryEmail,
          code: recoveryCode,
          new_password: recoveryNewPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('¡Contraseña actualizada! Ahora puedes iniciar sesión', 'success');
        setTab('login');
        setRecoveryStep(1);
        setRecoveryEmail('');
        setRecoveryCode('');
        setRecoveryNewPassword('');
      } else {
        showToast('Error al actualizar la contraseña', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/50 z-[999999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-md md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">DAMABELLA</h2>
            <p className="text-sm text-gray-300 mt-1">Elegancia redefinida</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-xl transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        {tab !== 'recovery' && (
          <div className="shrink-0 border-b border-gray-200 bg-white">
            <div className="flex">
              <button
                onClick={() => setTab('login')}
                className={`flex-1 py-4 px-6 font-semibold text-sm transition-all relative ${
                  tab === 'login'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span>🔐</span>
                  <span>Iniciar sesión</span>
                </span>
                {tab === 'login' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setTab('register')}
                className={`flex-1 py-4 px-6 font-semibold text-sm transition-all relative ${
                  tab === 'register'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span>✨</span>
                  <span>Registrarse</span>
                </span>
                {tab === 'register' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* LOGIN FORM */}
          {tab === 'login' && (
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="login-email" className="text-sm font-semibold text-gray-800 block mb-2">
                  Correo electrónico
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoFocus
                  className="w-full h-10 px-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="login-password" className="text-sm font-semibold text-gray-800 block mb-2">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all placeholder:text-gray-400 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setTab('recovery')}
                  className="text-sm font-medium text-pink-600 hover:text-pink-700 transition"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <Button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Ingresar
              </Button>

              <div className="pt-4 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => setTab('register')}
                    className="font-semibold text-pink-600 hover:text-pink-700 transition"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            <div className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <Label htmlFor="reg-nombre" className="text-sm font-semibold text-gray-800 block mb-2">
                  Nombre completo
                </Label>
                <Input
                  id="reg-nombre"
                  placeholder="Andrea Pérez"
                  value={registerData.nombre}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                    handleFieldChange('nombre', filtered);
                  }}
                  onBlur={() => handleFieldBlur('nombre')}
                  className={`w-full h-10 px-3 rounded-xl border text-sm transition-all ${
                    touchedFields.has('nombre') && registerData.nombre
                      ? registerErrors.nombre 
                        ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-500' 
                        : 'border-green-400 bg-green-50 focus:ring-green-200 focus:border-green-500'
                      : 'border-gray-300 focus:border-pink-500 focus:ring-pink-200 focus:ring-2'
                  }`}
                />
                {registerErrors.nombre && touchedFields.has('nombre') && (
                  <p className="text-red-500 text-xs mt-1.5">{registerErrors.nombre}</p>
                )}
              </div>

              {/* Documento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reg-tipodoc" className="text-sm font-semibold text-gray-800 block mb-2">
                    Tipo de doc.
                  </Label>
                  <select
                    id="reg-tipodoc"
                    value={registerData.tipoDoc}
                    onChange={(e) => setRegisterData({...registerData, tipoDoc : Number(e.target.value)})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm"
                  >
                    {typesDocs.map(t => (
                      <option key={t.id_doc} value={t.id_doc}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="reg-numdoc" className="text-sm font-semibold text-gray-800 block mb-2">
                    Número
                  </Label>
                  <Input
                    id="reg-numdoc"
                    placeholder="123456789"
                    value={registerData.numeroDoc}
                    onChange={(e) => {
                      let filtered = e.target.value;
                      if (typesDocs.find(t => t.id_doc === registerData.tipoDoc)?.name?.toUpperCase() === 'PAS') {
                        filtered = e.target.value.replace(/[^A-Z0-9]/g, '').toUpperCase();
                      } else {
                        filtered = e.target.value.replace(/\D/g, '');
                      }
                      handleFieldChange('numeroDoc', filtered);
                    }}
                    onBlur={() => handleFieldBlur('numeroDoc')}
                    className={`w-full h-10 px-3 rounded-xl border text-sm transition-all ${
                      touchedFields.has('numeroDoc') && registerData.numeroDoc
                        ? registerErrors.numeroDoc 
                          ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-500' 
                          : 'border-green-400 bg-green-50 focus:ring-green-200 focus:border-green-500'
                        : 'border-gray-300 focus:border-pink-500 focus:ring-pink-200 focus:ring-2'
                    }`}
                  />
                  {registerErrors.numeroDoc && touchedFields.has('numeroDoc') && (
                    <p className="text-red-500 text-xs mt-1">{registerErrors.numeroDoc}</p>
                  )}
                </div>
              </div>

              {/* Celular y Ciudad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reg-celular" className="text-sm font-semibold text-gray-800 block mb-2">
                    Celular
                  </Label>
                  <Input
                    id="reg-celular"
                    type="tel"
                    maxLength={10}
                    placeholder="3001234567"
                    value={registerData.celular}
                    onChange={(e) => {
                      const filtered = e.target.value.replace(/\D/g, '');
                      handleFieldChange('celular', filtered);
                    }}
                    onBlur={() => handleFieldBlur('celular')}
                    className={`w-full h-10 px-3 rounded-xl border text-sm transition-all ${
                      touchedFields.has('celular') && registerData.celular
                        ? registerErrors.celular 
                          ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-500' 
                          : 'border-green-400 bg-green-50 focus:ring-green-200 focus:border-green-500'
                        : 'border-gray-300 focus:border-pink-500 focus:ring-pink-200 focus:ring-2'
                    }`}
                  />
                  {registerErrors.celular && touchedFields.has('celular') && (
                    <p className="text-red-500 text-xs mt-1">{registerErrors.celular}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="reg-ciudad" className="text-sm font-semibold text-gray-800 block mb-2">
                    Ciudad
                  </Label>
                  <select
                    id="reg-ciudad"
                    value={registerData.ciudad}
                    onChange={(e) => handleFieldChange('ciudad', e.target.value)}
                    onBlur={() => handleFieldBlur('ciudad')}
                    className={`w-full h-10 px-3 rounded-xl border text-sm transition-all ${
                      touchedFields.has('ciudad') && registerData.ciudad
                        ? registerErrors.ciudad
                          ? 'border-red-400 bg-red-50'
                          : 'border-green-400 bg-green-50'
                        : 'border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200'
                    }`}
                  >
                    <option value="">Selecciona tu ciudad</option>
                    {CIUDADES_COLOMBIA.map(ciudad => (
                      <option key={ciudad} value={ciudad}>{ciudad}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dirección */}
              <div>
                <Label htmlFor="reg-direccion" className="text-sm font-semibold text-gray-800 block mb-2">
                  Dirección
                </Label>
                <Input
                  id="reg-direccion"
                  placeholder="Calle 123 #45-67"
                  value={registerData.direccion}
                  onChange={(e) => handleFieldChange('direccion', e.target.value)}
                  onBlur={() => handleFieldBlur('direccion')}
                  className={`w-full h-10 px-3 rounded-xl border text-sm transition-all ${
                    touchedFields.has('direccion') && registerData.direccion
                      ? registerErrors.direccion 
                        ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-500' 
                        : 'border-green-400 bg-green-50 focus:ring-green-200 focus:border-green-500'
                      : 'border-gray-300 focus:border-pink-500 focus:ring-pink-200 focus:ring-2'
                  }`}
                />
                {registerErrors.direccion && touchedFields.has('direccion') && (
                  <p className="text-red-500 text-xs mt-1">{registerErrors.direccion}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="reg-email" className="text-sm font-semibold text-gray-800 block mb-2">
                  Correo electrónico
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={registerData.email}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase();
                    handleFieldChange('email', value);
                  }}
                  onBlur={() => handleFieldBlur('email')}
                  className={`w-full h-10 px-3 rounded-xl border text-sm transition-all ${
                    touchedFields.has('email') && registerData.email
                      ? registerErrors.email 
                        ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-500' 
                        : 'border-green-400 bg-green-50 focus:ring-green-200 focus:border-green-500'
                      : 'border-gray-300 focus:border-pink-500 focus:ring-pink-200 focus:ring-2'
                  }`}
                />
                {registerErrors.email && touchedFields.has('email') && (
                  <p className="text-red-500 text-xs mt-1">{registerErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="reg-password" className="text-sm font-semibold text-gray-800 block mb-2">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showRegisterPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    onBlur={() => handleFieldBlur('password')}
                    className={`w-full h-10 px-3 rounded-xl border text-sm pr-10 transition-all ${
                      touchedFields.has('password') && registerData.password
                        ? registerErrors.password 
                          ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-500' 
                          : 'border-green-400 bg-green-50 focus:ring-green-200 focus:border-green-500'
                        : 'border-gray-300 focus:border-pink-500 focus:ring-pink-200 focus:ring-2'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {registerData.password && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                    <div className={`flex items-center gap-2 text-xs ${registerData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="font-bold">{registerData.password.length >= 8 ? '✓' : '○'}</span>
                      <span>8+ caracteres</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${/[A-Z]/.test(registerData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="font-bold">{/[A-Z]/.test(registerData.password) ? '✓' : '○'}</span>
                      <span>Una mayúscula</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${/[a-z]/.test(registerData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="font-bold">{/[a-z]/.test(registerData.password) ? '✓' : '○'}</span>
                      <span>Una minúscula</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${/\d/.test(registerData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="font-bold">{/\d/.test(registerData.password) ? '✓' : '○'}</span>
                      <span>Un número</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${/[@$!%*?&#]/.test(registerData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="font-bold">{/[@$!%*?&#]/.test(registerData.password) ? '✓' : '○'}</span>
                      <span>Un carácter especial</span>
                    </div>
                  </div>
                )}
                {registerErrors.password && touchedFields.has('password') && (
                  <p className="text-red-500 text-xs mt-1.5">{registerErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="reg-confirm" className="text-sm font-semibold text-gray-800 block mb-2">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="reg-confirm"
                    type={showRegisterConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={registerData.confirmPassword}
                    onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                    onBlur={() => handleFieldBlur('confirmPassword')}
                    className={`w-full h-10 px-3 rounded-xl border text-sm pr-10 transition-all ${
                      touchedFields.has('confirmPassword') && registerData.confirmPassword
                        ? registerErrors.confirmPassword 
                          ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-500' 
                          : 'border-green-400 bg-green-50 focus:ring-green-200 focus:border-green-500'
                        : 'border-gray-300 focus:border-pink-500 focus:ring-pink-200 focus:ring-2'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showRegisterConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {registerErrors.confirmPassword && touchedFields.has('confirmPassword') && (
                  <p className="text-red-500 text-xs mt-1.5">{registerErrors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleRegister}
                disabled={Object.keys(registerErrors).length > 0 || isSubmitting}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </div>
          )}

          {/* PASSWORD RECOVERY */}
          {tab === 'recovery' && (
            <div className="p-6 space-y-4">
              {/* Back Header */}
              <div className="flex items-center gap-2 -mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setRecoveryStep(1);
                    setRecoveryEmail('');
                    setRecoveryCode('');
                    setRecoveryNewPassword('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <span className="text-gray-600">←</span>
                </button>
                <h3 className="text-lg font-semibold text-gray-800">Recuperar contraseña</h3>
              </div>

              {/* Step 1: Email */}
              {recoveryStep === 1 && (
                <div className="space-y-3">
                  <input type="hidden" />
                  <Label htmlFor="recovery-email" className="text-sm font-semibold text-gray-800 block mb-2">
                    Ingresa tu correo  electrónico
                  </Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm"
                  />
                  <Button
                    onClick={handleRecoveryStep1}
                    disabled={!recoveryEmail.trim()}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    Enviar código
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Te enviaremos un código de verificación por correo
                  </p>
                </div>
              )}

              {/* Step 2: Verification Code */}
              {recoveryStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="recovery-code" className="text-sm font-semibold text-gray-800 block mb-2">
                      Código de verificación
                    </Label>
                    <Input
                      id="recovery-code"
                      placeholder="000000"
                      value={recoveryCode}
                      onChange={(e) => {
                        const filtered = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setRecoveryCode(filtered);
                      }}
                      maxLength={6}
                      className="w-full h-10 px-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm text-center text-lg font-mono tracking-widest"
                    />
                  </div>
                  <Button
                    onClick={handleRecoveryStep2}
                    disabled={recoveryCode.length !== 6}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    Verificar código
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Revisa tu bandeja de entrada y copia el código
                  </p>
                </div>
              )}

              {/* Step 3: New Password */}
              {recoveryStep === 3 && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="recovery-new-password" className="text-sm font-semibold text-gray-800 block mb-2">
                      Nueva contraseña
                    </Label>
                    <Input
                      id="recovery-new-password"
                      type="password"
                      placeholder="••••••••"
                      value={recoveryNewPassword}
                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleRecoveryStep3}
                    disabled={!recoveryNewPassword.trim() || isSubmitting}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? 'Recuperando...' : 'Restablecer contraseña'}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Debe cumplir con los requisitos de seguridad
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

