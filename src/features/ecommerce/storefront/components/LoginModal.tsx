import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { Button, Input, Label, useToast } from '../../../../shared/components/native';
import { validateCredentials } from '../../../../shared/utils/initializeStorage';
import { registrarClienteDesdeEcommerce, isEmailUnique, isDocumentoUnique } from '../../../../services/clienteRegistroService';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (user: any) => void;
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

const validateDocumento = (tipoDoc: string, numeroDoc: string) => {
  switch(tipoDoc) {
    case 'TI':
    case 'CC':
      return /^\d+$/.test(numeroDoc) && numeroDoc.length >= 6 && numeroDoc.length <= 12;
    case 'CE':
      return /^\d{10,11}$/.test(numeroDoc);
    case 'PAS':
      return /^[A-Z0-9]{6,9}$/.test(numeroDoc);
    default:
      return false;
  }
};

const validateCelular = (celular: string) => {
  return /^\d{10}$/.test(celular);
};

export function LoginModal({ onClose, onLogin }: LoginModalProps) {
  const [tab, setTab] = useState<'login' | 'register' | 'recovery'>('login');
  const { showToast } = useToast();

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register
  const [registerData, setRegisterData] = useState({
    nombre: '',
    tipoDoc: 'CC',
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
  const [generatedCode, setGeneratedCode] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('\n📱 [LoginModal.handleLogin] ========== INICIANDO LOGIN ==========');
    console.log(`📧 Email: ${loginEmail}`);
    console.log(`🔒 Password: ${loginPassword ? '(ingresada)' : '(vacía)'}`);

    const user = validateCredentials(loginEmail, loginPassword);

    if (user) {
      console.log('\n✅ [LoginModal.handleLogin] Credenciales válidas');
      
      if (user.status === 'Inactivo') {
        console.log('❌ [LoginModal.handleLogin] Cuenta inactiva');
        showToast('Tu cuenta está inactiva. Contacta al administrador.', 'error');
        return;
      }
      
      const loginUser = {
        id: user.id,
        name: user.nombre,
        email: user.email,
        role: user.role,
        roleId: user.roleId,
        avatar: null,
        tipoDoc: user.tipoDoc,
        numeroDoc: user.numeroDoc,
        celular: user.celular,
        direccion: user.direccion,
        status: user.status,
      };
      
      console.log(`\n👤 [LoginModal.handleLogin] Preparando usuario para login:`);
      console.log(`  - name: ${loginUser.name}`);
      console.log(`  - email: ${loginUser.email}`);
      console.log(`  - role: ${loginUser.role}`);
      console.log(`  - status: ${loginUser.status}`);
      console.log(`  - OBJETO COMPLETO:`, JSON.stringify(loginUser, null, 2));
      
      console.log('\n📤 [LoginModal.handleLogin] Llamando onLogin()...');
      onLogin(loginUser);
      showToast('¡Bienvenido!', 'success');
      console.log('✅ [LoginModal.handleLogin] ===========================================\n');
      onClose();
    } else {
      console.log('❌ [LoginModal.handleLogin] Credenciales inválidas');
      console.log('✅ [LoginModal.handleLogin] ===========================================\n');
      showToast('Correo o contraseña incorrectos', 'error');
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
        if (!isDocumentoUnique(value, registerData.tipoDoc)) {
          return 'Este documento ya está registrado';
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
        if (!isEmailUnique(value)) return 'Este correo ya está registrado';
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
    const value = registerData[fieldName as keyof typeof registerData] || '';
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
      const value = registerData[fieldName as keyof typeof registerData] || '';
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

    console.log('\n📝 [LoginModal.handleRegister] ========== INICIANDO REGISTRO ==========');
    console.log('📋 Datos del formulario:', registerData);

    if (!validateRegisterForm()) {
      console.log('❌ [LoginModal.handleRegister] Validaciones fallaron');
      showToast('Por favor corrige los errores', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('✅ [LoginModal.handleRegister] Validaciones pasadas');
      console.log('🔄 [LoginModal.handleRegister] Llamando registrarClienteDesdeEcommerce...');

      // Usar el servicio de registro que crea tanto usuario como cliente
      const result = registrarClienteDesdeEcommerce({
        nombre: registerData.nombre,
        tipoDocumento: registerData.tipoDoc,
        numeroDocumento: registerData.numeroDoc,
        telefono: registerData.celular,
        ciudad: registerData.ciudad,
        email: registerData.email,
        direccion: registerData.direccion,
        password: registerData.password,
      });

      if (!result.success) {
        console.log('❌ [LoginModal.handleRegister] Error:', result.error);
        showToast(result.error || 'Error al registrar', 'error');
        return;
      }

      console.log('✅ [LoginModal.handleRegister] Registro exitoso');
      console.log('   - Usuario ID:', result.usuario?.id);
      console.log('   - Cliente ID:', result.cliente?.id);
      console.log('   - Usuario objeto:', JSON.stringify(result.usuario, null, 2));
      console.log('   - Cliente objeto:', JSON.stringify(result.cliente, null, 2));

      showToast('¡Registro exitoso! Ahora puedes iniciar sesión', 'success');
      
      // Resetear formulario
      setTab('login');
      setRegisterData({
        nombre: '',
        tipoDoc: 'CC',
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
      
      console.log('✅ [LoginModal.handleRegister] Formulario reseteado\n');
      onClose();
    } catch (error) {
      console.error('❌ [LoginModal.handleRegister] Error inesperado:', error);
      showToast('Error al registrar. Intenta de nuevo.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoveryStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    
    const users = localStorage.getItem('damabella_users') ? JSON.parse(localStorage.getItem('damabella_users') || '[]') : [];
    const user = users.find((u: any) => u.email === recoveryEmail);

    if (!user) {
      showToast('No se encontró una cuenta con este correo', 'error');
      return;
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setRecoveryStep(2);
    showToast(`Código de verificación: ${code} (guárdalo)`, 'success');
  };

  const handleRecoveryStep2 = (e: React.FormEvent) => {
    e.preventDefault();

    if (recoveryCode !== generatedCode) {
      showToast('Código incorrecto', 'error');
      return;
    }

    setRecoveryStep(3);
  };

  const handleRecoveryStep3 = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(recoveryNewPassword)) {
      showToast('La contraseña debe tener 8+ caracteres, mayúscula, minúscula, número y especial', 'error');
      return;
    }

    const users = localStorage.getItem('damabella_users') ? JSON.parse(localStorage.getItem('damabella_users') || '[]') : [];
    const userIndex = users.findIndex((u: any) => u.email === recoveryEmail);

    if (userIndex !== -1) {
      users[userIndex].password = recoveryNewPassword;
      localStorage.setItem('damabella_users', JSON.stringify(users));
      showToast('¡Contraseña actualizada! Ahora puedes iniciar sesión', 'success');
      setTab('login');
      setRecoveryStep(1);
      setRecoveryEmail('');
      setRecoveryCode('');
      setRecoveryNewPassword('');
      setGeneratedCode('');
    }
  };

  const handlePasswordReset = () => {
    if (!validatePassword(recoveryNewPassword)) {
      showToast('La contraseña debe tener 8+ caracteres, mayúscula, minúscula, número y especial', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const users = localStorage.getItem('damabella_users') ? JSON.parse(localStorage.getItem('damabella_users') || '[]') : [];
      const userIndex = users.findIndex((u: any) => u.email === recoveryEmail);

      if (userIndex !== -1) {
        users[userIndex].password = recoveryNewPassword;
        localStorage.setItem('damabella_users', JSON.stringify(users));
        showToast('¡Contraseña actualizada! Ahora puedes iniciar sesión', 'success');
        setTab('login');
        setRecoveryStep(1);
        setRecoveryEmail('');
        setRecoveryCode('');
        setRecoveryNewPassword('');
        setGeneratedCode('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/50 z-[999999] flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gray-600 px-4 py-4 flex items-center justify-center rounded-t-2xl z-10">
          <div className="flex-1 text-center">
            <h2 className="text-xl font-bold text-white">DAMABELLA</h2>
          </div>
          <button onClick={onClose} className="absolute right-4 text-white hover:bg-white/30 p-2 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Botón Volver */}
        <div className="bg-gray-600 px-4 py-3">
          <button onClick={onClose} className="w-full bg-white text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 font-semibold text-sm">
            <span>←</span>
            <span>Volver a Inicio</span>
          </button>
        </div>

        {/* Tabs */}
        {tab !== 'recovery' && (
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2 px-3 text-xs font-bold transition-all ${
                tab === 'login'
                  ? 'text-[#FFB6C1] border-b-2 border-[#FFB6C1] bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔐 Iniciar
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-2 px-3 text-xs font-bold transition-all ${
                tab === 'register'
                  ? 'text-[#FFB6C1] border-b-2 border-[#FFB6C1] bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ✨ Registro
            </button>
          </div>
        )}

        <div className="p-4">
          {/* LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <Label htmlFor="login-email" className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Correo
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#FFB6C1] focus:ring-1 focus:ring-[#FFB6C1]"
                />
              </div>

              <div>
                <Label htmlFor="login-password" className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#FFB6C1] focus:ring-1 focus:ring-[#FFB6C1]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTab('recovery')}
                className="text-xs text-[#FFB6C1] hover:text-[#FF9EB1] font-semibold"
              >
                ¿Olvidaste contraseña?
              </button>

              <Button 
                type="submit" 
                className="w-full bg-[#FFB6C1] hover:bg-[#FF9EB1] text-white font-bold py-2 rounded text-sm transition"
              >
                Entrar
              </Button>
            </form>
          )}

          {/* REGISTRO */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* NOMBRE - Full width */}
                <div className="col-span-2">
                  <Label htmlFor="reg-nombre" className="text-sm font-semibold text-gray-700 block mb-1">
                    Nombre
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
                    className={`w-full border rounded px-2 py-1.5 text-sm transition ${
                      touchedFields.has('nombre') && registerData.nombre
                        ? registerErrors.nombre 
                          ? 'border-red-400 bg-red-50' 
                          : 'border-green-400 bg-green-50'
                        : 'border-gray-300 focus:border-[#FFB6C1] focus:ring-1 focus:ring-[#FFB6C1]'
                    }`}
                  />
                  {registerErrors.nombre && touchedFields.has('nombre') && (
                    <p className="text-red-500 text-xs mt-0.5">{registerErrors.nombre}</p>
                  )}
                </div>

                {/* TIPO DOC y NÚMERO */}
                <div>
                  <Label htmlFor="reg-tipodoc" className="text-sm font-semibold text-gray-700 block mb-1">
                    Tipo Doc
                  </Label>
                  <select
                    id="reg-tipodoc"
                    value={registerData.tipoDoc}
                    onChange={(e) => handleFieldChange('tipoDoc', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:border-[#FFB6C1] focus:ring-1 focus:ring-[#FFB6C1] text-xs"
                  >
                    <option value="CC">Cédula</option>
                    <option value="TI">TI</option>
                    <option value="CE">CE</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="reg-numdoc" className="text-sm font-semibold text-gray-700 block mb-1">
                    Número
                  </Label>
                  <Input
                    id="reg-numdoc"
                    placeholder="123456"
                    value={registerData.numeroDoc}
                    onChange={(e) => {
                      let filtered = e.target.value;
                      if (registerData.tipoDoc === 'PAS') {
                        filtered = e.target.value.replace(/[^A-Z0-9]/g, '').toUpperCase();
                      } else {
                        filtered = e.target.value.replace(/\D/g, '');
                      }
                      handleFieldChange('numeroDoc', filtered);
                    }}
                    onBlur={() => handleFieldBlur('numeroDoc')}
                    className={`w-full border rounded px-2 py-1.5 text-sm transition ${
                      touchedFields.has('numeroDoc') && registerData.numeroDoc
                        ? registerErrors.numeroDoc 
                          ? 'border-red-400 bg-red-50' 
                          : 'border-green-400 bg-green-50'
                        : 'border-gray-300 focus:border-[#FFB6C1] focus:ring-1 focus:ring-[#FFB6C1]'
                    }`}
                  />
                  {registerErrors.numeroDoc && touchedFields.has('numeroDoc') && (
                    <p className="text-red-500 text-xs mt-0.5">{registerErrors.numeroDoc}</p>
                  )}
                </div>

                {/* CELULAR y CIUDAD */}
                <div>
                  <Label htmlFor="reg-celular" className="text-sm font-semibold text-gray-700 block mb-1">
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
                    className={`w-full border rounded px-2 py-1.5 text-sm transition ${
                      touchedFields.has('celular') && registerData.celular
                        ? registerErrors.celular 
                          ? 'border-red-400 bg-red-50' 
                          : 'border-green-400 bg-green-50'
                        : 'border-gray-300 focus:border-[#FFB6C1] focus:ring-1 focus:ring-[#FFB6C1]'
                    }`}
                  />
                  {registerErrors.celular && touchedFields.has('celular') && (
                    <p className="text-red-500 text-xs mt-0.5">{registerErrors.celular}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="reg-ciudad" className="text-sm font-semibold text-gray-700 block mb-1">
                    Ciudad
                  </Label>
                  <Input
                    id="reg-ciudad"
                    placeholder="Bogotá"
                    value={registerData.ciudad}
                    onChange={(e) => handleFieldChange('ciudad', e.target.value)}
                    onBlur={() => handleFieldBlur('ciudad')}
                    className={`w-full border rounded px-2 py-1.5 text-sm transition ${
                      touchedFields.has('ciudad') && registerData.ciudad
                        ? registerErrors.ciudad 
                          ? 'border-red-400 bg-red-50' 
                          : 'border-green-400 bg-green-50'
                        : 'border-gray-300 focus:border-[#FFB6C1] focus:ring-1 focus:ring-[#FFB6C1]'
                    }`}
                  />
                  {registerErrors.ciudad && touchedFields.has('ciudad') && (
                    <p className="text-red-500 text-xs mt-0.5">{registerErrors.ciudad}</p>
                  )}
                </div>

                {/* DIRECCIÓN - Full width */}
                <div className="col-span-2">
                  <Label htmlFor="reg-direccion" className="text-sm font-semibold text-gray-700 block mb-1">
                    Dirección
                  </Label>
                  <Input
                    id="reg-direccion"
                    placeholder="Calle 123"
                    value={registerData.direccion}
                    onChange={(e) => handleFieldChange('direccion', e.target.value)}
                    onBlur={() => handleFieldBlur('direccion')}
                    className={`w-full border rounded px-2 py-1.5 text-sm transition ${
                      touchedFields.has('direccion') && registerData.direccion
                        ? registerErrors.direccion 
                          ? 'border-red-400 bg-red-50' 
                          : 'border-green-400 bg-green-50'
                        : 'border-gray-300 focus:border-[#FFB6C1] focus:ring-1 focus:ring-[#FFB6C1]'
                    }`}
                  />
                  {registerErrors.direccion && touchedFields.has('direccion') && (
                    <p className="text-red-500 text-xs mt-0.5">{registerErrors.direccion}</p>
                  )}
                </div>

                {/* EMAIL - Full width */}
                <div className="col-span-2">
                  <Label htmlFor="reg-email" className="text-sm font-semibold text-gray-700 block mb-1">
                    Email
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
                    className={`w-full border rounded px-2 py-1.5 text-sm transition ${
                      touchedFields.has('email') && registerData.email
                        ? registerErrors.email 
                          ? 'border-red-400 bg-red-50' 
                          : 'border-green-400 bg-green-50'
                        : 'border-gray-300 focus:border-[#FFB6C1] focus:ring-1 focus:ring-[#FFB6C1]'
                    }`}
                  />
                  {registerErrors.email && touchedFields.has('email') && (
                    <p className="text-red-500 text-xs mt-0.5">{registerErrors.email}</p>
                  )}
                </div>

                {/* PASSWORD */}
                <div>
                  <Label htmlFor="reg-password" className="text-sm font-semibold text-gray-700 block mb-1">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={registerData.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      onBlur={() => handleFieldBlur('password')}
                      placeholder="Min 8 caracteres"
                      className={`w-full border rounded px-2 py-1.5 pr-8 text-sm transition ${
                        touchedFields.has('password') && registerData.password
                          ? registerErrors.password 
                            ? 'border-red-400 bg-red-50' 
                            : 'border-green-400 bg-green-50'
                          : 'border-gray-300 focus:border-[#FFB6C1] focus:ring-1 focus:ring-[#FFB6C1]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showRegisterPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {registerData.password && (
                    <div className="mt-1 p-1.5 bg-gray-50 rounded border border-gray-200 space-y-0.5">
                      <div className={`flex items-center gap-1 text-xs ${registerData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="w-3">{registerData.password.length >= 8 ? '✓' : '○'}</span>
                        <span>8+ caracteres</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${/[A-Z]/.test(registerData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="w-3">{/[A-Z]/.test(registerData.password) ? '✓' : '○'}</span>
                        <span>Mayúscula</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${/[a-z]/.test(registerData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="w-3">{/[a-z]/.test(registerData.password) ? '✓' : '○'}</span>
                        <span>Minúscula</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${/\d/.test(registerData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="w-3">{/\d/.test(registerData.password) ? '✓' : '○'}</span>
                        <span>Número</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${/[@$!%*?&#]/.test(registerData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="w-3">{/[@$!%*?&#]/.test(registerData.password) ? '✓' : '○'}</span>
                        <span>Especial</span>
                      </div>
                    </div>
                  )}
                  {registerErrors.password && touchedFields.has('password') && (
                    <p className="text-red-500 text-xs mt-0.5">{registerErrors.password}</p>
                  )}
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <Label htmlFor="reg-confirm" className="text-sm font-semibold text-gray-700 block mb-1">
                    Confirmar
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-confirm"
                      type={showRegisterConfirmPassword ? 'text' : 'password'}
                      value={registerData.confirmPassword}
                      onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                      onBlur={() => handleFieldBlur('confirmPassword')}
                      placeholder="Repite contraseña"
                      className={`w-full border rounded px-2 py-1.5 text-sm pr-8 transition ${
                        touchedFields.has('confirmPassword') && registerData.confirmPassword
                          ? registerErrors.confirmPassword 
                            ? 'border-red-400 bg-red-50' 
                            : 'border-green-400 bg-green-50'
                          : 'border-gray-300 focus:border-[#FFB6C1] focus:ring-1 focus:ring-[#FFB6C1]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showRegisterConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {registerErrors.confirmPassword && touchedFields.has('confirmPassword') && (
                    <p className="text-red-500 text-xs mt-0.5">{registerErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={Object.keys(registerErrors).length > 0 || isSubmitting}
                className="w-full bg-[#FFB6C1] hover:bg-[#FF9EB1] disabled:bg-gray-400 text-white font-bold py-2 rounded text-sm transition mt-3"
              >
                {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
              </Button>
            </form>
          )}

          {/* RECUPERACIÓN */}
          {tab === 'recovery' && (
            <div className="space-y-3">
              {recoveryStep === 1 && (
                <div>
                  <Label htmlFor="recovery-email" className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Ingresa tu correo
                  </Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-[#FFB6C1] focus:ring-1 focus:ring-[#FFB6C1]"
                  />
                  <Button
                    onClick={() => setRecoveryStep(2)}
                    disabled={!recoveryEmail.trim()}
                    className="w-full mt-3 bg-[#FFB6C1] hover:bg-[#FF9EB1] disabled:bg-gray-400 text-white font-bold py-2 rounded text-sm transition"
                  >
                    Continuar
                  </Button>
                </div>
              )}

              {recoveryStep === 2 && (
                <div>
                  <Label htmlFor="recovery-code" className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Ingresa el código
                  </Label>
                  <Input
                    id="recovery-code"
                    placeholder="123456"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-[#FFB6C1] focus:ring-1 focus:ring-[#FFB6C1] text-center tracking-widest"
                  />
                  <Button
                    onClick={() => setRecoveryStep(3)}
                    disabled={recoveryCode.length !== 6}
                    className="w-full mt-3 bg-[#FFB6C1] hover:bg-[#FF9EB1] disabled:bg-gray-400 text-white font-bold py-2 rounded text-sm transition"
                  >
                    Verificar
                  </Button>
                </div>
              )}

              {recoveryStep === 3 && (
                <div>
                  <Label htmlFor="recovery-new-password" className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Nueva contraseña
                  </Label>
                  <Input
                    id="recovery-new-password"
                    type="password"
                    placeholder="Nueva contraseña"
                    value={recoveryNewPassword}
                    onChange={(e) => setRecoveryNewPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-[#FFB6C1] focus:ring-1 focus:ring-[#FFB6C1]"
                  />
                  <Button
                    onClick={handlePasswordReset}
                    disabled={!recoveryNewPassword.trim() || isSubmitting}
                    className="w-full mt-3 bg-[#FFB6C1] hover:bg-[#FF9EB1] disabled:bg-gray-400 text-white font-bold py-2 rounded text-sm transition"
                  >
                    {isSubmitting ? 'Recuperando...' : 'Recuperar'}
                  </Button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setRecoveryStep(1);
                  setRecoveryEmail('');
                  setRecoveryCode('');
                  setRecoveryNewPassword('');
                  setTab('login');
                }}
                className="text-xs text-[#FFB6C1] hover:text-[#FF9EB1] font-semibold text-center w-full mt-2"
              >
                Volver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

