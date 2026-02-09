import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Phone, MapPin, FileText, Save, X, Lock, Eye, EyeOff, Camera, AlertCircle } from 'lucide-react';
import { Button, Input, Modal, useToast } from '../../../shared/components/native';

interface EditarPerfilPageProps {
  currentUser: any;
  onSave: (updatedUser: any) => void;
  onCancel: () => void;
}

export default function EditarPerfilPage({ currentUser, onSave, onCancel }: EditarPerfilPageProps) {
  // Debug: Ver qué datos tiene currentUser
  console.log('🔍 [EditarPerfilPage] currentUser:', currentUser);

  // Usar el toast global del contexto
  const { showToast } = useToast();

  // Obtener usuario desde localStorage primero (datos más completos)
  const getUserData = () => {
    // Intentar primero desde localStorage (tiene todos los datos)
    const storedUser = localStorage.getItem('damabella_current_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.id || parsed?.email) {
          console.log('✅ [getUserData] Datos cargados desde localStorage:', parsed);
          return parsed;
        }
      } catch (e) {
        console.log('❌ Error parsing localStorage');
      }
    }
    
    // Si no hay en localStorage, buscar en damabella_users por email
    if (currentUser?.email) {
      const users = JSON.parse(localStorage.getItem('damabella_users') || '[]');
      const foundUser = users.find((u: any) => u.email === currentUser.email);
      if (foundUser) {
        console.log('✅ [getUserData] Usuario encontrado en damabella_users:', foundUser);
        return foundUser;
      }
    }
    
    // Como último recurso, usar currentUser
    console.log('✅ [getUserData] Usando currentUser:', currentUser);
    return currentUser;
  };

  const userData = getUserData();

  // Inicializar con los datos del usuario (de currentUser o localStorage)
  const [formData, setFormData] = useState(() => ({
    nombre: userData?.nombre || userData?.name || '',
    email: userData?.email || '',
    celular: userData?.celular || userData?.phone || '',
    direccion: userData?.direccion || userData?.address || '',
    tipoDoc: userData?.tipoDoc || 'CC',
    numeroDoc: userData?.numeroDoc || '',
    avatar: userData?.avatar || null
  }));

  const [errors, setErrors] = useState<any>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<any>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar cuando currentUser cambia
  useEffect(() => {
    const user = getUserData();
    console.log('📋 [useEffect] Sincronizando con usuario:', user);
    setFormData({
      nombre: user?.nombre || user?.name || '',
      email: user?.email || '',
      celular: user?.celular || user?.phone || '',
      direccion: user?.direccion || user?.address || '',
      tipoDoc: user?.tipoDoc || 'CC',
      numeroDoc: user?.numeroDoc || '',
      avatar: user?.avatar || null
    });
    setErrors({});
  }, [currentUser]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png','image/jpeg','image/jpg'].includes(file.type)) {
        showToast('Solo se permiten imágenes PNG o JPG', 'error');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showToast('El tamaño máximo permitido es 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para mostrar toast - REMOVIDA, ahora usamos el hook global

  // Validaciones más simples
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidDocumentNumber = (num: string) => num.trim().length >= 5;
  const isValidCellNumber = (num: string) => /^\d{7,15}$/.test(num.replace(/\D/g, ''));
  const isValidDireccion = (dir: string) => dir.trim().length >= 3;

  useEffect(() => {
    const newErrors: any = {};
    // Validaciones simples
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    // Campos opcionales - solo validar si tienen valor
    if (formData.celular && formData.celular.trim() && !isValidCellNumber(formData.celular)) {
      newErrors.celular = 'Celular inválido (7-15 dígitos)';
    }
    if (formData.direccion && formData.direccion.trim() && formData.direccion.trim().length < 3) {
      newErrors.direccion = 'Dirección muy corta';
    }
    if (formData.numeroDoc && formData.numeroDoc.trim() && formData.numeroDoc.trim().length < 5) {
      newErrors.numeroDoc = 'Número de documento inválido';
    }
    setErrors(newErrors);
  }, [formData]);

  // Validar contraseñas en tiempo real
  useEffect(() => {
    const newPasswordErrors: any = {};
    
    if (passwordData.newPassword && passwordData.newPassword.length < 6) {
      newPasswordErrors.newPassword = 'Mínimo 6 caracteres';
    }
    if (!passwordData.newPassword) {
      newPasswordErrors.newPassword = 'La nueva contraseña es obligatoria';
    }
    
    if (!passwordData.confirmPassword) {
      newPasswordErrors.confirmPassword = 'Debe confirmar la contraseña';
    } else if (passwordData.newPassword && passwordData.confirmPassword !== passwordData.newPassword) {
      newPasswordErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    if (passwordData.currentPassword && passwordData.currentPassword.length < 6) {
      newPasswordErrors.currentPassword = 'Mínimo 6 caracteres';
    }
    
    setPasswordErrors(newPasswordErrors);
  }, [passwordData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💾 [handleSubmit] GUARDANDO CAMBIOS DEL PERFIL');
    console.log('  📋 Datos del formulario:', JSON.stringify(formData, null, 2));
    console.log('  👤 Usuario actual:', JSON.stringify(currentUser, null, 2));
    console.log('  🔍 Errores encontrados:', errors);
    
    // Validación simple: solo nombre y email son obligatorios
    if (!formData.nombre.trim()) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }
    if (!formData.email.trim()) {
      showToast('El email es obligatorio', 'error');
      return;
    }
    if (!isValidEmail(formData.email)) {
      showToast('Email inválido', 'error');
      return;
    }
    
    // Validar campos opcionales solo si tienen contenido
    if (formData.celular && formData.celular.trim() && !isValidCellNumber(formData.celular)) {
      showToast('Celular inválido', 'error');
      return;
    }

    const users = JSON.parse(localStorage.getItem('damabella_users') || '[]');
    console.log('  📋 Total de usuarios en BD:', users.length);
    console.log('  🔎 Buscando usuario con ID:', currentUser?.id, 'o email:', currentUser?.email);
    
    // Buscar por ID primero, luego por email como fallback
    let userIndex = users.findIndex((u: any) => u.id === currentUser?.id);
    if (userIndex === -1) {
      console.log('  ⚠️ ID no encontrado, buscando por email...');
      userIndex = users.findIndex((u: any) => u.email === currentUser?.email);
    }
    
    console.log('  🔍 Usuario encontrado en índice:', userIndex);

    // Construir usuario actualizado (con datos del formulario actual)
    const updatedUser = { 
      id: currentUser?.id || `user_${Date.now()}`,
      nombre: formData.nombre.trim() || 'Sin nombre',
      name: formData.nombre.trim() || 'Sin nombre',
      email: formData.email.trim(),
      celular: formData.celular.trim() || '',
      phone: formData.celular.trim() || '',
      direccion: formData.direccion.trim() || '',
      address: formData.direccion.trim() || '',
      tipoDoc: formData.tipoDoc || 'CC',
      numeroDoc: formData.numeroDoc.trim() || '',
      avatar: formData.avatar || currentUser?.avatar || null,
      role: currentUser?.role || currentUser?.rol || 'Cliente',  // Buscar en ambos campos
      rol: currentUser?.rol || currentUser?.role || 'Cliente',    // Guardar también en 'rol' para compatibilidad
      password: userIndex !== -1 ? users[userIndex].password : undefined, // Preservar contraseña existente
      estado: userIndex !== -1 ? users[userIndex].estado : 'Activo' // Preservar estado actual
    };
    
    console.log('  📝 Usuario actualizado completo:', JSON.stringify(updatedUser, null, 2));
    
    if (userIndex !== -1) {
      // Actualizar usuario existente
      users[userIndex] = updatedUser;
      console.log('  ✅ Usuario actualizado en índice:', userIndex);
    } else {
      // Crear nuevo usuario si no existe
      console.log('  📝 Creando nuevo usuario...');
      users.push(updatedUser);
      console.log('  ✅ Nuevo usuario creado y añadido');
    }
    
    // Guardar en localStorage
    localStorage.setItem('damabella_users', JSON.stringify(users));
    localStorage.setItem('damabella_current_user', JSON.stringify(updatedUser));
    console.log('  ✅ Cambios guardados en localStorage');
    showToast('Perfil actualizado correctamente', 'success');
    // Pequeño delay para asegurar que el toast se renderice antes de navegar
    setTimeout(() => {
      onSave(updatedUser);
    }, 100);
  };

  const handleChangePassword = () => {
    console.log('🔐 [handleChangePassword] INICIANDO CAMBIO DE CONTRASEÑA');
    
    // Validar que no haya errores
    if (Object.keys(passwordErrors).length > 0) {
      showToast('Por favor, completa los campos correctamente', 'error');
      return;
    }

    try {
      // Obtener el usuario actual con todos sus datos
      const currentUserData = getUserData();
      console.log('  👤 Usuario actual:', JSON.stringify(currentUserData, null, 2));
      
      const users = JSON.parse(localStorage.getItem('damabella_users') || '[]');
      
      // Buscar por email (más confiable)
      const userIndex = users.findIndex((u: any) => u.email === currentUserData?.email);
      
      console.log('  🔎 Usuario encontrado en índice:', userIndex);
      console.log('  📧 Buscando por email:', currentUserData?.email);
      
      if (userIndex !== -1) {
        // Actualizar contraseña
        const updatedUser = { 
          ...users[userIndex], 
          password: passwordData.newPassword 
        };
        users[userIndex] = updatedUser;
        
        localStorage.setItem('damabella_users', JSON.stringify(users));
        localStorage.setItem('damabella_current_user', JSON.stringify(updatedUser));
        
        console.log('  ✅ Contraseña actualizada exitosamente');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordErrors({});
        showToast('Contraseña actualizada correctamente', 'success');
      } else {
        console.log('  ❌ Usuario no encontrado. Emails en BD:', users.map((u: any) => u.email));
        showToast('Usuario no encontrado en la base de datos', 'error');
      }
    } catch (error) {
      console.error('❌ Error al cambiar contraseña:', error);
      showToast('Error al actualizar contraseña', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-700 text-xl overflow-hidden">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (formData.nombre || currentUser?.nombre)?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <button
                type="button"
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 bg-gray-700 text-white p-1.5 rounded-full hover:bg-gray-600 transition-colors"
                title="Cambiar foto"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className="text-white">
              <h2 className="text-white mb-1">Editar Perfil</h2>
              <p className="text-gray-200 text-sm">Actualiza tu información personal</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label className="block text-gray-700 mb-1.5 flex items-center gap-2 text-sm">
                <User size={14} /> Nombre Completo
              </label>
              <Input
                type="text"
                placeholder="Ingresa tu nombre completo"
                value={formData.nombre}
                onChange={(e) => {
                  const value = e.target.value.split('').filter(char => /^[a-zA-Z0-9\s]$/.test(char)).join('');
                  setFormData({ ...formData, nombre: value });
                }}
                className={errors.nombre ? "border-red-500 focus:ring-red-500" : ""}
              />
              {errors.nombre && <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.nombre}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 mb-1.5 flex items-center gap-2 text-sm">
                <Mail size={14} /> Correo Electrónico
              </label>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? "border-red-500 focus:ring-red-500" : ""}
              />
              {errors.email && <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.email}</p>}
            </div>

            {/* Tipo de Documento */}
            <div>
              <label className="block text-gray-700 mb-1.5 flex items-center gap-2 text-sm">
                <FileText size={14} /> Tipo de Documento
              </label>
              <select
                value={formData.tipoDoc}
                onChange={(e) => setFormData({ ...formData, tipoDoc: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="PAS">Pasaporte</option>
              </select>
            </div>

            {/* Número de Documento */}
            <div>
              <label className="block text-gray-700 mb-1.5 flex items-center gap-2 text-sm">
                <FileText size={14} /> Número de Documento
              </label>
              <Input
                type="text"
                placeholder="1234567890"
                value={formData.numeroDoc}
                onChange={(e) => {
                  const value = e.target.value.split('').filter(char => /^\d$/.test(char)).join('');
                  setFormData({ ...formData, numeroDoc: value });
                }}
                className={errors.numeroDoc ? "border-red-500 focus:ring-red-500" : ""}
              />
              {errors.numeroDoc && <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.numeroDoc}</p>}
            </div>

            {/* Celular */}
            <div>
              <label className="block text-gray-700 mb-1.5 flex items-center gap-2 text-sm">
                <Phone size={14} /> Celular
              </label>
              <Input
                type="tel"
                placeholder="3001234567"
                value={formData.celular}
                onChange={(e) => {
                  const value = e.target.value.split('').filter(char => /^\d$/.test(char)).join('');
                  setFormData({ ...formData, celular: value });
                }}
                className={errors.celular ? "border-red-500 focus:ring-red-500" : ""}
              />
              {errors.celular && <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.celular}</p>}
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-gray-700 mb-1.5 flex items-center gap-2 text-sm">
                <MapPin size={14} /> Dirección
              </label>
              <Input
                type="text"
                placeholder="Calle 123 # 45-67"
                value={formData.direccion}
                onChange={(e) => {
                  const value = e.target.value.split('').filter(char => /^[a-zA-Z0-9\s#\-.,]$/.test(char)).join('');
                  setFormData({ ...formData, direccion: value });
                }}
                className={errors.direccion ? "border-red-500 focus:ring-red-500" : ""}
              />
              {errors.direccion && <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.direccion}</p>}
            </div>
          </div>

          {/* Seguridad */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-gray-900 mb-2 flex items-center gap-2 text-sm font-semibold">
              <Lock size={16} /> Seguridad
            </h3>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                console.log('🔐 [SEGURIDAD] ABRIENDO MODAL DE CAMBIO DE CONTRASEÑA');
                setShowPasswordModal(true);
              }}
              className="flex items-center gap-2"
              size="sm"
            >
              <Lock size={16} /> Cambiar Contraseña
            </Button>
          </div>

          <div className="mt-4 flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex items-center gap-2">
              <X size={16} /> Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex items-center gap-2">
              <Save size={16} /> Guardar Cambios
            </Button>
          </div>
        </form>
      </div>

      {/* Modal Cambiar Contraseña */}
      <Modal isOpen={showPasswordModal} onClose={() => {
        console.log('🔒 [MODAL CONTRASEÑA] CERRANDO MODAL DE CAMBIO DE CONTRASEÑA');
        setShowPasswordModal(false);
      }} title="Cambiar Contraseña">
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Contraseña Actual (opcional si es la primera vez)</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Ingresa tu contraseña actual"
                className={passwordErrors.currentPassword ? "border-red-500 focus:ring-red-500" : ""}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordErrors.currentPassword && <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {passwordErrors.currentPassword}</p>}
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Nueva Contraseña *</label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Ingresa tu nueva contraseña"
                className={passwordErrors.newPassword ? "border-red-500 focus:ring-red-500" : ""}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordErrors.newPassword ? (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {passwordErrors.newPassword}</p>
            ) : (
              <p className="text-gray-500 text-sm mt-1">Mínimo 6 caracteres</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Confirmar Nueva Contraseña *</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirma tu nueva contraseña"
                className={passwordErrors.confirmPassword ? "border-red-500 focus:ring-red-500" : ""}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordErrors.confirmPassword && <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {passwordErrors.confirmPassword}</p>}
            {!passwordErrors.confirmPassword && passwordData.newPassword && passwordData.confirmPassword && (
              <p className="text-green-600 text-sm mt-1">✓ Las contraseñas coinciden</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={() => {
              setShowPasswordModal(false);
              setPasswordErrors({});
            }} variant="secondary">
              Cancelar
            </Button>
            <Button 
              onClick={handleChangePassword} 
              variant="primary"
              disabled={Object.keys(passwordErrors).length > 0}
              className={Object.keys(passwordErrors).length > 0 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <Lock size={18} /> Cambiar Contraseña
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
