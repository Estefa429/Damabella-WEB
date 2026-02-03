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
        if (value.length < 6) return 'Mínimo 6 caracteres';
        if (!validatePassword(value)) {
          return '8+ caracteres, mayúscula, minúscula, número y especial';
        }
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

  return (
    <div className="fixed inset-0 bg-black/50 z-[999999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="font-bold text-lg">
            {tab === 'login' ? 'Iniciar Sesión' : tab === 'register' ? 'Crear Cuenta' : 'Recuperar Contraseña'}
          </h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        {tab !== 'recovery' && (
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === 'login'
                  ? 'text-[#FFB6C1] border-b-2 border-[#FFB6C1]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === 'register'
                  ? 'text-[#FFB6C1] border-b-2 border-[#FFB6C1]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Registrarse
            </button>
          </div>
        )}

        <div className="p-6">
          {/* LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Correo Electrónico</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="login-password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTab('recovery')}
                className="text-sm text-[#FFB6C1] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>

              <Button type="submit" className="w-full bg-[#FFB6C1] hover:bg-[#FF9EB1]">
                Iniciar Sesión
              </Button>
            </form>
          )}

          {/* REGISTRO */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <Label htmlFor="reg-nombre">Nombre Completo *</Label>
                <Input
                  id="reg-nombre"
                  value={registerData.nombre}
                  onChange={(e) => handleFieldChange('nombre', e.target.value)}
                  onBlur={() => handleFieldBlur('nombre')}
                  className={registerErrors.nombre && touchedFields.has('nombre') ? 'border-red-500' : ''}
                />
                {registerErrors.nombre && touchedFields.has('nombre') && <p className="text-red-600 text-xs mt-1">{registerErrors.nombre}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="reg-tipodoc">Tipo Doc. *</Label>
                  <select
                    id="reg-tipodoc"
                    value={registerData.tipoDoc}
                    onChange={(e) => handleFieldChange('tipoDoc', e.target.value)}
                    onBlur={() => handleFieldBlur('tipoDoc')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]"
                  >
                    <option value="CC">Cédula</option>
                    <option value="TI">Tarjeta Identidad</option>
                    <option value="CE">C. Extranjería</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="reg-numdoc">Número *</Label>
                  <Input
                    id="reg-numdoc"
                    value={registerData.numeroDoc}
                    onChange={(e) => handleFieldChange('numeroDoc', e.target.value)}
                    onBlur={() => handleFieldBlur('numeroDoc')}
                    className={registerErrors.numeroDoc && touchedFields.has('numeroDoc') ? 'border-red-500' : ''}
                  />
                  {registerErrors.numeroDoc && touchedFields.has('numeroDoc') && <p className="text-red-600 text-xs mt-1">{registerErrors.numeroDoc}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="reg-celular">Celular *</Label>
                <Input
                  id="reg-celular"
                  type="tel"
                  maxLength={10}
                  placeholder="3001234567"
                  value={registerData.celular}
                  onChange={(e) => handleFieldChange('celular', e.target.value.replace(/\D/g, ''))}
                  onBlur={() => handleFieldBlur('celular')}
                  className={registerErrors.celular && touchedFields.has('celular') ? 'border-red-500' : ''}
                />
                {registerErrors.celular && touchedFields.has('celular') && <p className="text-red-600 text-xs mt-1">{registerErrors.celular}</p>}
              </div>

              <div>
                <Label htmlFor="reg-ciudad">Ciudad *</Label>
                <Input
                  id="reg-ciudad"
                  placeholder="Bogotá, Medellín, Cali, etc."
                  value={registerData.ciudad}
                  onChange={(e) => handleFieldChange('ciudad', e.target.value)}
                  onBlur={() => handleFieldBlur('ciudad')}
                  className={registerErrors.ciudad && touchedFields.has('ciudad') ? 'border-red-500' : ''}
                />
                {registerErrors.ciudad && touchedFields.has('ciudad') && <p className="text-red-600 text-xs mt-1">{registerErrors.ciudad}</p>}
              </div>

              <div>
                <Label htmlFor="reg-direccion">Dirección *</Label>
                <Input
                  id="reg-direccion"
                  placeholder="Calle 123 #45-67, Apto 101"
                  value={registerData.direccion}
                  onChange={(e) => handleFieldChange('direccion', e.target.value)}
                  onBlur={() => handleFieldBlur('direccion')}
                  className={registerErrors.direccion && touchedFields.has('direccion') ? 'border-red-500' : ''}
                />
                {registerErrors.direccion && touchedFields.has('direccion') && <p className="text-red-600 text-xs mt-1">{registerErrors.direccion}</p>}
              </div>

              <div>
                <Label htmlFor="reg-email">Correo Electrónico *</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => handleFieldBlur('email')}
                  className={registerErrors.email && touchedFields.has('email') ? 'border-red-500' : ''}
                />
                {registerErrors.email && touchedFields.has('email') && <p className="text-red-600 text-xs mt-1">{registerErrors.email}</p>}
              </div>

              <div>
                <Label htmlFor="reg-password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showRegisterPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    onBlur={() => handleFieldBlur('password')}
                    className={registerErrors.password && touchedFields.has('password') ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showRegisterPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {registerErrors.password && touchedFields.has('password') && <p className="text-red-600 text-xs mt-1">{registerErrors.password}</p>}
              </div>

              <div>
                <Label htmlFor="reg-confirm">Confirmar Contraseña *</Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  onBlur={() => handleFieldBlur('confirmPassword')}
                  className={registerErrors.confirmPassword && touchedFields.has('confirmPassword') ? 'border-red-500' : ''}
                />
                {registerErrors.confirmPassword && touchedFields.has('confirmPassword') && <p className="text-red-600 text-xs mt-1">{registerErrors.confirmPassword}</p>}
              </div>

              <Button 
                type="submit" 
                disabled={Object.keys(registerErrors).length > 0 || isSubmitting}
                className="w-full bg-[#FFB6C1] hover:bg-[#FF9EB1] disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
            </form>
          )}

          {/* RECUPERAR CONTRASEÑA */}
          {tab === 'recovery' && (
            <>
              {recoveryStep === 1 && (
                <form onSubmit={handleRecoveryStep1} className="space-y-4">
                  <p className="text-sm text-gray-600">Ingresa tu correo electrónico para recuperar tu contraseña</p>
                  <div>
                    <Label htmlFor="recovery-email">Correo Electrónico</Label>
                    <Input
                      id="recovery-email"
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-[#FFB6C1] hover:bg-[#FF9EB1]">
                    Enviar Código
                  </Button>
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="w-full text-sm text-gray-600 hover:text-gray-900"
                  >
                    Volver al inicio
                  </button>
                </form>
              )}

              {recoveryStep === 2 && (
                <form onSubmit={handleRecoveryStep2} className="space-y-4">
                  <p className="text-sm text-gray-600">Ingresa el código de verificación de 6 dígitos</p>
                  <div>
                    <Label htmlFor="recovery-code">Código de Verificación</Label>
                    <Input
                      id="recovery-code"
                      type="text"
                      maxLength={6}
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-[#FFB6C1] hover:bg-[#FF9EB1]">
                    Verificar Código
                  </Button>
                  <button
                    type="button"
                    onClick={() => setRecoveryStep(1)}
                    className="w-full text-sm text-gray-600 hover:text-gray-900"
                  >
                    Volver atrás
                  </button>
                </form>
              )}

              {recoveryStep === 3 && (
                <form onSubmit={handleRecoveryStep3} className="space-y-4">
                  <p className="text-sm text-gray-600">Ingresa tu nueva contraseña</p>
                  <div>
                    <Label htmlFor="recovery-newpass">Nueva Contraseña</Label>
                    <Input
                      id="recovery-newpass"
                      type="password"
                      value={recoveryNewPassword}
                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      8+ caracteres, mayúscula, minúscula, número y especial
                    </p>
                  </div>
                  <Button type="submit" className="w-full bg-[#FFB6C1] hover:bg-[#FF9EB1]">
                    Cambiar Contraseña
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
