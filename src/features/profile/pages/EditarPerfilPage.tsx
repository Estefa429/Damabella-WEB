import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Phone, MapPin, FileText, Save, X, Lock, Eye, EyeOff, Camera } from 'lucide-react';
import { Button, Input, Modal } from '../../../shared/components/native';

interface EditarPerfilPageProps {
  currentUser: any;
  onSave: (updatedUser: any) => void;
  onCancel: () => void;
}

export default function EditarPerfilPage({ currentUser, onSave, onCancel }: EditarPerfilPageProps) {
  // Obtener usuario desde localStorage si currentUser no tiene datos
  const getUserData = () => {
    // Si currentUser tiene nombre, usarlo
    if (currentUser?.nombre) {
      return currentUser;
    }
    
    // Si no, intentar obtener de localStorage
    const storedUser = localStorage.getItem('damabella_current_user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    
    // Si aún no hay datos, retornar currentUser tal cual
    return currentUser;
  };

  const userData = getUserData();

  // Inicializar con los datos del usuario (de currentUser o localStorage)
  const [formData, setFormData] = useState(() => ({
    nombre: userData?.nombre || '',
    email: userData?.email || '',
    celular: userData?.celular || '',
    direccion: userData?.direccion || '',
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toasts, setToasts] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar cuando currentUser cambia
  useEffect(() => {
    const user = currentUser?.nombre ? currentUser : JSON.parse(localStorage.getItem('damabella_current_user') || '{}');
    setFormData({
      nombre: user?.nombre || '',
      email: user?.email || '',
      celular: user?.celular || '',
      direccion: user?.direccion || '',
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
        showToast('Solo se permiten imágenes PNG o JPG');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showToast('El tamaño máximo permitido es 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para mostrar toast
  const showToast = (message: string) => {
    setToasts(prev => [...prev, message]);
    setTimeout(() => {
      setToasts(prev => prev.filter(msg => msg !== message));
    }, 3000);
  };

  // Validaciones
  const isValidEmail = (email: string) => /^[a-zA-Z0-9][\w.-]*@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidDocumentNumber = (num: string) => /^[1-9][0-9]{4,19}$/.test(num);
  const isValidCellNumber = (num: string) => /^[1-9][0-9]{6,14}$/.test(num);
  const isValidDireccion = (dir: string) => dir.trim().length >= 5;

  useEffect(() => {
    const newErrors: any = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    if (!formData.email.trim()) newErrors.email = 'El email es obligatorio.';
    else if (!isValidEmail(formData.email)) newErrors.email = 'El email no es válido o empieza con un guion bajo.';
    if (!formData.celular.trim()) newErrors.celular = 'El celular es obligatorio.';
    else if (!isValidCellNumber(formData.celular)) newErrors.celular = 'El celular debe tener entre 7 y 15 dígitos y no puede empezar con 0.';
    if (!formData.direccion.trim()) newErrors.direccion = 'La dirección es obligatoria.';
    else if (!isValidDireccion(formData.direccion)) newErrors.direccion = 'La dirección debe tener al menos 5 caracteres.';
    if (!formData.numeroDoc.trim()) newErrors.numeroDoc = 'El número de documento es obligatorio.';
    else if (!isValidDocumentNumber(formData.numeroDoc)) newErrors.numeroDoc = 'El número de documento debe tener entre 5 y 20 dígitos y no puede empezar con 0.';
    setErrors(newErrors);
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💾 [handleSubmit] GUARDANDO CAMBIOS DEL PERFIL');
    console.log('  📋 Datos del formulario:', JSON.stringify(formData, null, 2));
    console.log('  👤 Usuario actual ID:', currentUser?.id);
    
    if (Object.keys(errors).length > 0) {
      console.log('  ❌ Error: Hay errores de validación:', errors);
      return;
    }

    const users = JSON.parse(localStorage.getItem('damabella_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === currentUser.id);
    console.log('  🔍 Usuario encontrado en índice:', userIndex);

    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...formData };
      localStorage.setItem('damabella_users', JSON.stringify(users));
      console.log('  ✅ Cambios guardados en localStorage');
      onSave({ ...currentUser, ...formData });
      showToast('Perfil guardado exitosamente ✅');
    } else {
      console.log('  ❌ Error: Usuario no encontrado en la base de datos');
    }
  };

  const handleChangePassword = () => {
    console.log('🔐 [handleChangePassword] INICIANDO CAMBIO DE CONTRASEÑA');
    console.log('  👤 Usuario ID:', currentUser?.id);
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      console.log('  ❌ Error: Campos incompletos');
      showToast('Por favor completa todos los campos');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      console.log('  ❌ Error: Las nuevas contraseñas no coinciden');
      showToast('Las contraseñas nuevas no coinciden');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      console.log('  ❌ Error: Nueva contraseña muy corta (mínimo 6 caracteres)');
      showToast('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    const users = JSON.parse(localStorage.getItem('damabella_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === currentUser.id);
    console.log('  🔍 Usuario encontrado en índice:', userIndex);
    
    if (userIndex !== -1) {
      if (users[userIndex].password !== passwordData.currentPassword) {
        console.log('  ❌ Error: Contraseña actual incorrecta');
        showToast('La contraseña actual es incorrecta');
        return;
      }
      users[userIndex].password = passwordData.newPassword;
      localStorage.setItem('damabella_users', JSON.stringify(users));
      console.log('  ✅ Contraseña actualizada en localStorage');
      setShowPasswordModal(false);
      console.log('  🔒 Modal de contraseña cerrado');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Contraseña actualizada ✅');
    } else {
      console.log('  ❌ Error: Usuario no encontrado');
    }
  };

  return (
    <div className="max-w-2xl mx-auto relative">
      {/* Contenedor de Toasts a la derecha */}
      <div className="fixed top-5 right-5 flex flex-col gap-2 z-50">
        {toasts.map((msg, index) => (
          <div
            key={index}
            className="bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-slide-in"
          >
            {msg}
          </div>
        ))}
      </div>

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
              />
              {errors.nombre && <p className="text-red-600 text-sm mt-1">{errors.nombre}</p>}
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
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
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
              />
              {errors.numeroDoc && <p className="text-red-600 text-sm mt-1">{errors.numeroDoc}</p>}
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
              />
              {errors.celular && <p className="text-red-600 text-sm mt-1">{errors.celular}</p>}
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
              />
              {errors.direccion && <p className="text-red-600 text-sm mt-1">{errors.direccion}</p>}
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
            <label className="block text-gray-700 mb-2">Contraseña Actual *</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Ingresa tu contraseña actual"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Nueva Contraseña *</label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Ingresa tu nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-1">Mínimo 6 caracteres</p>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Confirmar Nueva Contraseña *</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirma tu nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordData.newPassword && passwordData.confirmPassword && (
              <p className={`text-sm mt-1 ${passwordData.newPassword === passwordData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                {passwordData.newPassword === passwordData.confirmPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={() => setShowPasswordModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} variant="primary">
              <Lock size={18} /> Cambiar Contraseña
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
