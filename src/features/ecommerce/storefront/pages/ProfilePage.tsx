import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, LogOut, Edit2, Package, Heart, ChevronRight, Home, Bell, Shield, CreditCard, ChevronUp, X, Eye, EyeOff, Check, AlertCircle, Lock, Save } from 'lucide-react';
import { PremiumNavbar } from '../components/PremiumNavbar';
import { PremiumFooter } from '../components/PremiumFooter';
import { useEcommerce } from '@/shared/contexts';
import { getMyOrders } from '@/features/ecommerce/orders/services/OrderServices';


interface ProfilePageProps {
  onNavigate: (view: string) => void;
  currentUser: any;
  onLogout: () => void;
  onLogin: (user: any) => void;
}

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard';
  last4: string;
  name: string;
  expiry: string;
  isMain: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'sale' | 'order' | 'inventory' | 'system';
}

export function ProfilePage({ onNavigate, currentUser, onLogout, onLogin }: ProfilePageProps) {
  const { orders, favorites } = useEcommerce();
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [userOrdersCount, setUserOrdersCount] = useState<number>(0);
  const [loadingOrdersCount, setLoadingOrdersCount] = useState<boolean>(true);

  // Cargar número de pedidos reales desde la base de datos
  useEffect(() => {
    if (!currentUser) return;
    
    // Si no es un cliente (por ejemplo, es administrador), no tiene pedidos y evitamos la llamada a la API
    // que podría fallar con 401/403/404 y provocar un cierre de sesión automático por el interceptor.
    const isUserCliente = () => {
      const roleName = (currentUser.rol_name ?? currentUser.role ?? currentUser.rol ?? '').toString().toLowerCase().trim();
      const roleId = Number(currentUser.rol);
      return roleName === 'cliente' || roleName === 'clientes' || roleName === 'client' || roleName === 'clients' || roleId === 2;
    };

    if (!isUserCliente()) {
      setUserOrdersCount(0);
      setLoadingOrdersCount(false);
      return;
    }
    
    const fetchOrdersCount = async () => {
      setLoadingOrdersCount(true);
      try {
        const data = await getMyOrders();
        if (data) {
          setUserOrdersCount(data.length);
        } else {
          setUserOrdersCount(0);
        }
      } catch (err: any) {
        console.error('[ProfilePage] Error al obtener contador de pedidos:', err);
        // Si es 404 (cliente no existe en DB), significa 0 pedidos
        setUserOrdersCount(0);
      } finally {
        setLoadingOrdersCount(false);
      }
    };
    
    fetchOrdersCount();
  }, [currentUser]);


  // Debug: Ver qué datos tiene currentUser
  console.log('🔍 [ProfilePage] currentUser:', currentUser);

  // Estados para Información Personal
  const [editForm, setEditForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    celular: currentUser?.celular || '',
    direccion: currentUser?.direccion || '',
  });
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});
  const [editSuccess, setEditSuccess] = useState('');

  // /* COMENTADO: Estados para Métodos de Pago - Inicializados con datos por defecto
  // const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
  //   { id: 'card_1', type: 'visa', last4: '4242', name: 'Demo Cliente', expiry: '12/26', isMain: true },
  //   { id: 'card_2', type: 'mastercard', last4: '1111', name: 'Demo Cliente', expiry: '07/25', isMain: false },
  // ]);
  // const [showAddPayment, setShowAddPayment] = useState(false);
  // const [newPayment, setNewPayment] = useState({ cardNumber: '', name: '', expiry: '' });
  // const [paymentError, setPaymentError] = useState(''); */

  // Función para filtrar caracteres especiales según el tipo
  const filterSpecialChars = (value: string, fieldType: string = 'general'): string => {
    if (fieldType === 'address') {
      // Direcciones: permitir números, letras, espacios, guiones, puntos, comas, #
      return value.replace(/[^a-zA-Z0-9\s\-.,#ñáéíóúÑÁÉÍÓÚ]/g, '');
    } else if (fieldType === 'phone') {
      // Teléfono: solo números
      return value.replace(/\D/g, '');
    }
    // General: letras, números, espacios, guiones, apóstrofes y acentos
    return value.replace(/[^a-zA-Z\s\-'ñáéíóúÑÁÉÍÓÚ]/g, '');
  };

  // Estados para Privacidad y Seguridad
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState<{ current?: string; newPass?: string; confirm?: string }>({});
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({ hasLength: false, hasUppercase: false, hasNumber: false, hasSpecial: false, matchesConfirm: false });
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // /* COMENTADO: Estados para Notificaciones - Inicializados con datos por defecto
  // const [notifications, setNotifications] = useState<Notification[]>([
  //   { id: '1', title: 'Tu pedido ha sido enviado', message: 'Pedido #12345 está en camino', date: '2024-12-10', read: false, type: 'order' },
  //   { id: '2', title: 'Nueva colección disponible', message: 'Vestidos largo - Colección Premium', date: '2024-12-09', read: false, type: 'sale' },
  //   { id: '3', title: 'Stock bajo', message: 'Prenda XYZ tiene poco stock', date: '2024-12-08', read: true, type: 'inventory' },
  //   { id: '4', title: 'Sistema actualizado', message: 'Nuevas características disponibles', date: '2024-12-07', read: true, type: 'system' },
  //   { id: '5', title: 'Tu tarjeta fue actualizada', message: 'Visa ••••4242 guardada', date: '2024-12-06', read: true, type: 'sale' },
  //   { id: '6', title: 'Oferta especial', message: '20% desc. en vestidos selectos', date: '2024-12-05', read: false, type: 'sale' },
  // ]);
  // const [unreadCount, setUnreadCount] = useState(3); */

  // Inicializar datos de localStorage
  useEffect(() => {
    // /* COMENTADO: Cargar métodos de pago
    // const savedPayments = localStorage.getItem('damabella_payment_methods');
    // if (savedPayments) {
    //   try {
    //     const parsed = JSON.parse(savedPayments);
    //     setPaymentMethods(parsed);
    //     console.log('✅ [ProfilePage] Métodos de pago cargados desde localStorage');
    //   } catch (e) {
    //     console.log('✅ [ProfilePage] Usando métodos de pago por defecto');
    //   }
    // } else {
    //   const defaultMethods = [
    //     { id: 'card_1', type: 'visa', last4: '4242', name: 'Demo Cliente', expiry: '12/26', isMain: true },
    //     { id: 'card_2', type: 'mastercard', last4: '1111', name: 'Demo Cliente', expiry: '07/25', isMain: false },
    //   ];
    //   localStorage.setItem('damabella_payment_methods', JSON.stringify(defaultMethods));
    // } */

    // Cargar 2FA setting
    const saved2FA = localStorage.getItem('damabella_settings_2fa');
    if (saved2FA !== null) {
      setTwoFAEnabled(JSON.parse(saved2FA));
    }

    // /* COMENTADO: Cargar notificaciones
    // const savedNotifications = localStorage.getItem('damabella_notifications');
    // if (savedNotifications) {
    //   try {
    //     const parsed = JSON.parse(savedNotifications);
    //     setNotifications(parsed);
    //     const unread = parsed.filter((n: Notification) => !n.read).length;
    //     setUnreadCount(unread);
    //     console.log('✅ [ProfilePage] Notificaciones cargadas desde localStorage');
    //   } catch (e) {
    //     console.log('✅ [ProfilePage] Usando notificaciones por defecto');
    //   }
    // } else {
    //   const defaultNotifications = [
    //     { id: '1', title: 'Tu pedido ha sido enviado', message: 'Pedido #12345 está en camino', date: '2024-12-10', read: false, type: 'order' },
    //     { id: '2', title: 'Nueva colección disponible', message: 'Vestidos largo - Colección Premium', date: '2024-12-09', read: false, type: 'sale' },
    //     { id: '3', title: 'Stock bajo', message: 'Prenda XYZ tiene poco stock', date: '2024-12-08', read: true, type: 'inventory' },
    //     { id: '4', title: 'Sistema actualizado', message: 'Nuevas características disponibles', date: '2024-12-07', read: true, type: 'system' },
    //     { id: '5', title: 'Tu tarjeta fue actualizada', message: 'Visa ••••4242 guardada', date: '2024-12-06', read: true, type: 'sale' },
    //     { id: '6', title: 'Oferta especial', message: '20% desc. en vestidos selectos', date: '2024-12-05', read: false, type: 'sale' },
    //   ];
    //   localStorage.setItem('damabella_notifications', JSON.stringify(defaultNotifications));
    //   setUnreadCount(3);
    // } */
  }, []);

  // Validadores
  const validateEmail = (email: string) => /^[a-zA-Z0-9][^\s@]*@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^\d{7,}$/.test(phone.replace(/\D/g, ''));
  const validateName = (name: string) => /^[a-zA-ZáéíóúÁÉÍÓÚ\s\-']+$/.test(name) && name.trim().length > 0;
  const validateAddress = (address: string) => /^[a-zA-Z0-9\s\-.,#@ñáéíóúÑÁÉÍÓÚ]*$/.test(address);
  const validateSpecialChars = (value: string, fieldType: string = 'general'): boolean => {
    if (fieldType === 'address') {
      return /^[a-zA-Z0-9\s\-.,#@ñáéíóúÑÁÉÍÓÚ]*$/.test(value);
    }
    return /^[a-zA-Z0-9\s\-'ñáéíóúÑÁÉÍÓÚ]*$/.test(value);
  };

  // Validación en tiempo real para formulario
  const handlePersonalInfoChange = (field: string, value: string) => {
    setEditForm({ ...editForm, [field]: value });
    const newErrors = { ...editErrors };

    if (field === 'name') {
      if (!value.trim()) {
        newErrors.name = 'El nombre no puede estar vacío';
      } else if (!validateSpecialChars(value)) {
        newErrors.name = 'El nombre contiene caracteres no permitidos';
      } else if (!validateName(value)) {
        newErrors.name = 'Solo letras, espacios y acentos permitidos';
      } else {
        delete newErrors.name;
      }
    }

    if (field === 'email') {
      if (!value.trim()) {
        newErrors.email = 'El email no puede estar vacío';
      } else if (!validateEmail(value)) {
        newErrors.email = 'Formato de email inválido (ej: usuario@dominio.com)';
      } else {
        delete newErrors.email;
      }
    }

    if (field === 'celular') {
      if (value && !validatePhone(value)) {
        newErrors.celular = 'Solo números, mínimo 7 dígitos';
      } else {
        delete newErrors.celular;
      }
    }

    if (field === 'direccion') {
      if (value && !validateAddress(value)) {
        newErrors.direccion = 'La dirección contiene caracteres no permitidos';
      } else {
        delete newErrors.direccion;
      }
    }

    setEditErrors(newErrors);
  };

  // Verificar si hay errores o campos vacíos para deshabilitar botón
  const hasFormErrors = () => {
    return (
      Object.keys(editErrors).length > 0 ||
      !editForm.name.trim() ||
      !editForm.email.trim()
    );
  };

  // Guardar información personal
  const handleSavePersonalInfo = () => {
    const errors: { [key: string]: string } = {};
    
    if (!validateSpecialChars(editForm.name)) errors.name = 'El nombre contiene caracteres no permitidos';
    else if (!validateName(editForm.name)) errors.name = 'Solo letras y espacios';
    if (!validateEmail(editForm.email)) errors.email = 'Email inválido';
    if (editForm.celular && !validatePhone(editForm.celular)) errors.celular = 'Mínimo 7 dígitos';
    if (editForm.direccion && !validateAddress(editForm.direccion)) errors.direccion = 'Caracteres no permitidos en la dirección';

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    // Actualizar usuario actual
    const updatedUser = { ...currentUser, ...editForm };
    localStorage.setItem('damabella_user', JSON.stringify(updatedUser));
    onLogin(updatedUser);

    // Actualizar en array de usuarios
    const users = JSON.parse(localStorage.getItem('damabella_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.email === currentUser.email);
    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
      localStorage.setItem('damabella_users', JSON.stringify(users));
    }

    setIsEditing(false);
    setEditErrors({});
    setEditSuccess('✅ Información guardada correctamente');
    console.log('✅ [ProfilePage] Información personal guardada');
    
    setTimeout(() => setEditSuccess(''), 3000);
  };

  // Guardar tarjeta de pago
  /* COMENTADO: Funciones de Métodos de Pago
  const handleSavePayment = () => {
    setPaymentError('');
    
    if (!newPayment.cardNumber || !newPayment.name || !newPayment.expiry) {
      setPaymentError('Completa todos los campos');
      return;
    }

    if (!validateSpecialChars(newPayment.name)) {
      setPaymentError('El nombre contiene caracteres no permitidos');
      return;
    }

    const cardNum = newPayment.cardNumber.replace(/\s/g, '');
    if (cardNum.length < 13 || cardNum.length > 19) {
      setPaymentError('Número de tarjeta inválido');
      return;
    }

    const lastFour = cardNum.slice(-4);
    const cardType = cardNum[0] === '4' ? 'visa' : 'mastercard';
    
    const newMethod: PaymentMethod = {
      id: `card_${Date.now()}`,
      type: cardType as 'visa' | 'mastercard',
      last4: lastFour,
      name: newPayment.name.toUpperCase(),
      expiry: newPayment.expiry,
      isMain: false,
    };

    const updated = [...paymentMethods, newMethod];
    setPaymentMethods(updated);
    localStorage.setItem('damabella_payment_methods', JSON.stringify(updated));
    setNewPayment({ cardNumber: '', name: '', expiry: '' });
    setShowAddPayment(false);
    console.log('✅ [ProfilePage] Tarjeta guardada');
  };

  const handleDeletePayment = (id: string) => {
    const updated = paymentMethods.filter(p => p.id !== id);
    setPaymentMethods(updated);
    localStorage.setItem('damabella_payment_methods', JSON.stringify(updated));
    console.log('✅ [ProfilePage] Tarjeta eliminada');
  };

  const handleSetMainPayment = (id: string) => {
    const updated = paymentMethods.map(p => ({
      ...p,
      isMain: p.id === id,
    }));
    setPaymentMethods(updated);
    localStorage.setItem('damabella_payment_methods', JSON.stringify(updated));
    console.log('✅ [ProfilePage] Tarjeta principal actualizada');
  };
  */

  const handleSavePassword = async () => {
    const errors: { current?: string; newPass?: string; confirm?: string } = {};
    setPasswordSuccess('');

    // Validar contraseña actual
    if (!passwordForm.current) {
      errors.current = 'Ingresa tu contraseña actual';
    }

    // Validar nueva contraseña
    if (!passwordForm.newPass) {
      errors.newPass = 'Ingresa una nueva contraseña';
    } else {
      const validation = {
        hasLength: passwordForm.newPass.length >= 8,
        hasUppercase: /[A-Z]/.test(passwordForm.newPass),
        hasNumber: /[0-9]/.test(passwordForm.newPass),
        hasSpecial: /[@$!%*?&]/.test(passwordForm.newPass),
        matchesConfirm: passwordForm.newPass === passwordForm.confirm,
      };
      setPasswordValidation(validation);

      if (!validation.hasLength || !validation.hasUppercase || !validation.hasNumber || !validation.hasSpecial) {
        errors.newPass = 'La contraseña no cumple los requisitos';
      }
    }

    // Validar confirmación
    if (!passwordForm.confirm) {
      errors.confirm = 'Confirma tu nueva contraseña';
    } else if (passwordForm.newPass !== passwordForm.confirm) {
      errors.confirm = 'Las contraseñas no coinciden';
    }

    setPasswordErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      // Guardar nueva contraseña
      const updatedUser = { ...currentUser, password: passwordForm.newPass };
      localStorage.setItem('damabella_user', JSON.stringify(updatedUser));
      onLogin(updatedUser);
      
      // Actualizar en array de usuarios
      const users = JSON.parse(localStorage.getItem('damabella_users') || '[]');
      const userIndex = users.findIndex((u: any) => u.email === currentUser.email);
      if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem('damabella_users', JSON.stringify(users));
      }

      localStorage.setItem('damabella_password_updated', new Date().toISOString());
      setPasswordForm({ current: '', newPass: '', confirm: '' });
      setShowPasswordFields(false);
      setPasswordErrors({});
      setPasswordValidation({ hasLength: false, hasUppercase: false, hasNumber: false, hasSpecial: false, matchesConfirm: false });
      setPasswordSuccess('✅ Contraseña actualizada correctamente');
      console.log('✅ [ProfilePage] Contraseña actualizada');
      
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      setPasswordErrors({ newPass: 'Error al actualizar. Intenta de nuevo.' });
    }
  };

  const handleToggle2FA = () => {
    const newValue = !twoFAEnabled;
    setTwoFAEnabled(newValue);
    localStorage.setItem('damabella_settings_2fa', JSON.stringify(newValue));
    console.log('✅ [ProfilePage] 2FA actualizado:', newValue);
  };

  /* COMENTADO: Funciones de Notificaciones
  const handleMarkNotificationRead = (id: string) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('damabella_notifications', JSON.stringify(updated));
    setUnreadCount(updated.filter(n => !n.read).length);
    console.log('✅ [ProfilePage] Notificación marcada como leída');
  };

  const handleDeleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('damabella_notifications', JSON.stringify(updated));
    setUnreadCount(updated.filter(n => !n.read).length);
    console.log('✅ [ProfilePage] Notificación eliminada');
  };
  */

  // Guard: Usuario no autenticado
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={48} className="text-white" />
          </div>
          <h2 className="text-3xl text-gray-900 mb-3">Inicia Sesión</h2>
          <p className="text-gray-600 mb-8">Accede a tu cuenta para ver tu perfil</p>
          <button 
            onClick={() => onNavigate('home')}
            className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-4 rounded-full hover:from-pink-500 hover:to-purple-500 transition-all shadow-lg"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <PremiumNavbar onNavigate={onNavigate} isAuthenticated={true} currentUser={currentUser} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-400 to-purple-400 rounded-3xl overflow-hidden mb-8 shadow-lg">
          <div className="p-12 text-white">
            <div className="flex items-end gap-6">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-pink-400 text-5xl shadow-xl ring-4 ring-white">
                {currentUser.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="pb-2 flex-1">
                <h1 className="text-4xl mb-2">{currentUser.name}</h1>
                <p className="text-pink-100 text-lg">{currentUser.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Información Personal */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-gray-900">Información Personal</h2>
                <button 
                  onClick={() => {
                    if (!isEditing) {
                      // Cargar datos actuales cuando abre edición
                      setEditForm({
                        name: currentUser?.name || '',
                        email: currentUser?.email || '',
                        celular: currentUser?.celular || '',
                        direccion: currentUser?.direccion || '',
                      });
                      setEditErrors({});
                    }
                    setIsEditing(!isEditing);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Edit2 size={18} className="text-gray-600" />
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Nombre</label>
                    <input 
                      type="text" 
                      value={editForm.name}
                      onChange={(e) => handlePersonalInfoChange('name', filterSpecialChars(e.target.value))}
                      className={`w-full border rounded-lg px-3 py-2 mt-1 transition-colors ${
                        editErrors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {editErrors.name && <p className="text-xs text-red-600 mt-1">{editErrors.name}</p>}
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <input 
                      type="email" 
                      value={editForm.email}
                      onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 mt-1 transition-colors ${
                        editErrors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {editErrors.email && <p className="text-xs text-red-600 mt-1">{editErrors.email}</p>}
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Teléfono</label>
                    <input 
                      type="tel" 
                      value={editForm.celular}
                      onChange={(e) => handlePersonalInfoChange('celular', filterSpecialChars(e.target.value, 'phone'))}
                      className={`w-full border rounded-lg px-3 py-2 mt-1 transition-colors ${
                        editErrors.celular ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {editErrors.celular && <p className="text-xs text-red-600 mt-1">{editErrors.celular}</p>}
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Dirección</label>
                    <input 
                      type="text" 
                      value={editForm.direccion}
                      onChange={(e) => handlePersonalInfoChange('direccion', filterSpecialChars(e.target.value, 'address'))}
                      className={`w-full border rounded-lg px-3 py-2 mt-1 transition-colors ${
                        editErrors.direccion ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {editErrors.direccion && <p className="text-xs text-red-600 mt-1">{editErrors.direccion}</p>}
                  </div>

                  {editSuccess && <p className="text-xs text-green-600 bg-green-50 p-2 rounded">{editSuccess}</p>}

                  <div className="flex gap-2">
                    <button 
                      onClick={handleSavePersonalInfo}
                      disabled={hasFormErrors()}
                      className={`flex-1 py-2 rounded-lg transition-colors text-sm font-medium ${
                        hasFormErrors()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-pink-400 text-white hover:bg-pink-500'
                      }`}
                    >
                      Guardar
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditErrors({});
                      }}
                      className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail size={20} className="text-pink-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Correo</p>
                      <p className="text-gray-900">{currentUser.email}</p>
                    </div>
                  </div>
                  {currentUser.celular && (
                    <div className="flex items-start gap-3">
                      <Phone size={20} className="text-pink-400 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500">Teléfono</p>
                        <p className="text-gray-900">{currentUser.celular}</p>
                      </div>
                    </div>
                  )}
                  {currentUser.direccion && (
                    <div className="flex items-start gap-3">
                      <MapPin size={20} className="text-pink-400 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500">Dirección</p>
                        <p className="text-gray-900">{currentUser.direccion}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resumen */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl text-gray-900 mb-6">Resumen de Cuenta</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package size={20} className="text-pink-400" />
                    <span className="text-gray-700">Pedidos</span>
                  </div>
                  <span className="text-2xl text-gray-900 font-bold">
                    {loadingOrdersCount ? (
                      <span className="inline-block w-5 h-5 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      userOrdersCount
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart size={20} className="text-purple-400" />
                    <span className="text-gray-700">Favoritos</span>
                  </div>
                  <span className="text-2xl text-gray-900 font-bold">{favorites.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl text-gray-900 mb-6">Mi Cuenta</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => onNavigate('orders')}
                  className="group bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-xl hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Package size={24} className="text-pink-400" />
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-pink-400" />
                  </div>
                  <h3 className="text-lg text-gray-900 mb-1">Mis Pedidos</h3>
                  <p className="text-sm text-gray-600">Ver historial</p>
                </button>

                <button
                  onClick={() => onNavigate('favorites')}
                  className="group bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-xl hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Heart size={24} className="text-purple-400" />
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-pink-400" />
                  </div>
                  <h3 className="text-lg text-gray-900 mb-1">Mis Favoritos</h3>
                  <p className="text-sm text-gray-600">Productos guardados</p>
                </button>

                {/* /* COMENTADO: Botón de Métodos de Pago
                <button
                  onClick={() => {
                    console.log('📌 Métodos de pago → abierto');
                    setActiveSection('payments');
                  }}
                  className="group bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-xl hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <CreditCard size={24} className="text-pink-400" />
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-pink-400" />
                  </div>
                  <h3 className="text-lg text-gray-900 mb-1">Métodos de Pago</h3>
                  <p className="text-sm text-gray-600">Tarjetas guardadas</p>
                </button>
                */ }
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl text-gray-900 mb-6">Configuración</h2>
              <div className="space-y-3">
                {/* /* COMENTADO: Botón de Notificaciones
                <button
                  onClick={() => {
                    console.log('🔔 Notificaciones → abierto');
                    setActiveSection('notifications');
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bell size={20} className="text-gray-600" />
                    <span className="text-gray-900">Notificaciones {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">{unreadCount}</span>}</span>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>
                */ }

                <button
                  onClick={() => {
                    console.log('🔐 Privacidad y seguridad → abierto');
                    setActiveSection('privacy');
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={20} className="text-gray-600" />
                    <span className="text-gray-900">Privacidad y Seguridad</span>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>

                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <LogOut size={20} className="text-red-600" />
                    <span className="text-red-600">Cerrar Sesión</span>
                  </div>
                  <ChevronRight size={20} className="text-red-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PremiumFooter onNavigate={onNavigate} />

      {/* /* COMENTADO: Sección Notificaciones
      {activeSection === 'notifications' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Bell size={24} className="text-gray-600" />
                <h2 className="text-2xl text-gray-900">Notificaciones</h2>
              </div>
              <button
                onClick={() => setActiveSection(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronUp size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No tienes notificaciones</p>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border-l-4 flex items-start justify-between ${
                      notif.read ? 'bg-gray-50 border-gray-300' : 'bg-blue-50 border-blue-400'
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`font-medium ${notif.read ? 'text-gray-700' : 'text-blue-900'}`}>{notif.title}</p>
                      <p className={`text-sm mt-1 ${notif.read ? 'text-gray-600' : 'text-blue-700'}`}>{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{notif.date}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkNotificationRead(notif.id)}
                          className="text-xs bg-blue-400 text-white px-3 py-1 rounded hover:bg-blue-500 transition-colors"
                        >
                          Leído
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <X size={18} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      */ }

      {/* Sección Privacidad y Seguridad */}
      {activeSection === 'privacy' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Shield size={24} className="text-gray-600" />
                <h2 className="text-2xl text-gray-900">Privacidad y Seguridad</h2>
              </div>
              <button
                onClick={() => setActiveSection(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronUp size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Cambiar contraseña */}
              <div className="border-b pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={20} className="text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Cambiar Contraseña</h3>
                </div>
                
                {!showPasswordFields ? (
                  <button
                    onClick={() => setShowPasswordFields(true)}
                    className="text-pink-400 hover:text-pink-500 text-sm font-medium"
                  >
                    Cambiar contraseña
                  </button>
                ) : (
                  <div className="space-y-4 mt-4">
                    {/* Contraseña actual */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña actual</label>
                      <input 
                        type="password"
                        placeholder="Ingresa tu contraseña actual"
                        value={passwordForm.current}
                        onChange={(e) => {
                          setPasswordForm({ ...passwordForm, current: e.target.value });
                          setPasswordErrors(prev => ({ ...prev, current: '' }));
                        }}
                        className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                          passwordErrors.current ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {passwordErrors.current && <p className="text-xs text-red-600 mt-1">{passwordErrors.current}</p>}
                    </div>

                    {/* Nueva contraseña */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nueva contraseña</label>
                      <input 
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={passwordForm.newPass}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPasswordForm(prev => ({ ...prev, newPass: value }));
                          setPasswordErrors(prev => ({ ...prev, newPass: '' }));
                          
                          // Validar en tiempo real
                          setPasswordValidation(prev => ({
                            ...prev,
                            hasLength: value.length >= 8,
                            hasUppercase: /[A-Z]/.test(value),
                            hasNumber: /[0-9]/.test(value),
                            hasSpecial: /[@$!%*?&]/.test(value),
                            matchesConfirm: value === passwordForm.confirm || !passwordForm.confirm,
                          }));
                        }}
                        className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                          passwordErrors.newPass ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {passwordErrors.newPass && <p className="text-xs text-red-600 mt-1">{passwordErrors.newPass}</p>}
                      
                      {/* Indicador de requisitos */}
                      {passwordForm.newPass && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${passwordValidation.hasLength ? 'bg-green-500' : 'bg-gray-300'}`}>
                              {passwordValidation.hasLength && <span className="text-white">✓</span>}
                            </div>
                            <span className={`text-sm ${passwordValidation.hasLength ? 'text-green-700' : 'text-gray-600'}`}>Mínimo 8 caracteres</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${passwordValidation.hasUppercase ? 'bg-green-500' : 'bg-gray-300'}`}>
                              {passwordValidation.hasUppercase && <span className="text-white">✓</span>}
                            </div>
                            <span className={`text-sm ${passwordValidation.hasUppercase ? 'text-green-700' : 'text-gray-600'}`}>Al menos una mayúscula</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${passwordValidation.hasNumber ? 'bg-green-500' : 'bg-gray-300'}`}>
                              {passwordValidation.hasNumber && <span className="text-white">✓</span>}
                            </div>
                            <span className={`text-sm ${passwordValidation.hasNumber ? 'text-green-700' : 'text-gray-600'}`}>Al menos un número</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${passwordValidation.hasSpecial ? 'bg-green-500' : 'bg-gray-300'}`}>
                              {passwordValidation.hasSpecial && <span className="text-white">✓</span>}
                            </div>
                            <span className={`text-sm ${passwordValidation.hasSpecial ? 'text-green-700' : 'text-gray-600'}`}>Al menos un carácter especial (@$!%*?&)</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirmar contraseña */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar nueva contraseña</label>
                      <input 
                        type="password"
                        placeholder="Confirma tu nueva contraseña"
                        value={passwordForm.confirm}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPasswordForm(prev => ({ ...prev, confirm: value }));
                          setPasswordErrors(prev => ({ ...prev, confirm: '' }));
                          
                          // Validar coincidencia en tiempo real
                          const matches = value === passwordForm.newPass;
                          setPasswordValidation(prev => ({
                            ...prev,
                            matchesConfirm: matches,
                          }));
                        }}
                        className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                          passwordErrors.confirm ? 'border-red-500 bg-red-50' : 
                          passwordForm.confirm && passwordForm.newPass && passwordValidation.matchesConfirm ? 'border-green-500 bg-green-50' :
                          passwordForm.confirm && !passwordValidation.matchesConfirm ? 'border-orange-500 bg-orange-50' :
                          'border-gray-300'
                        }`}
                      />
                      {passwordErrors.confirm && <p className="text-xs text-red-600 mt-1">{passwordErrors.confirm}</p>}
                      {passwordForm.confirm && passwordForm.newPass && passwordValidation.matchesConfirm && !passwordErrors.confirm && (
                        <p className="text-xs text-green-600 mt-1">✓ Las contraseñas coinciden</p>
                      )}
                      {passwordForm.confirm && !passwordValidation.matchesConfirm && !passwordErrors.confirm && (
                        <p className="text-xs text-orange-600 mt-1">Las contraseñas no coinciden</p>
                      )}
                    </div>

                    {/* Mensajes de error/éxito */}
                    {passwordSuccess && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">{passwordSuccess}</p>}
                    
                    {/* Botones */}
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={handleSavePassword}
                        disabled={!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm || !passwordValidation.matchesConfirm || !passwordValidation.hasLength || !passwordValidation.hasUppercase || !passwordValidation.hasNumber || !passwordValidation.hasSpecial}
                        className={`flex-1 py-2 rounded-lg transition-colors text-sm font-medium ${
                          passwordForm.current && passwordForm.newPass && passwordForm.confirm && passwordValidation.matchesConfirm && passwordValidation.hasLength && passwordValidation.hasUppercase && passwordValidation.hasNumber && passwordValidation.hasSpecial
                            ? 'bg-pink-400 text-white hover:bg-pink-500'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Guardar Cambios
                      </button>
                      <button 
                        onClick={() => {
                          setShowPasswordFields(false);
                          setPasswordForm({ current: '', newPass: '', confirm: '' });
                          setPasswordErrors({});
                          setPasswordValidation({ hasLength: false, hasUppercase: false, hasNumber: false, hasSpecial: false, matchesConfirm: false });
                          setPasswordSuccess('');
                        }}
                        className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Autenticación 2FA */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Autenticación de Dos Factores</h3>
                <button
                  onClick={handleToggle2FA}
                  className={`px-4 py-2 rounded-lg text-white transition-colors ${
                    twoFAEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'
                  }`}
                >
                  {twoFAEnabled ? '✅ Habilitado' : '⏹️ Deshabilitado'}
                </button>
              </div>

              {/* Términos y Condiciones */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Términos y Condiciones</h3>
                <div className="text-sm text-gray-700 space-y-4 mb-6">
                  <p>Al usar esta plataforma, aceptas nuestros términos y condiciones. Nos reservamos el derecho de modificar estos términos en cualquier momento.</p>
                  <p>Recopilamos información personal para procesar pedidos y mejorar tu experiencia. Nunca compartiremos tu información sin tu consentimiento.</p>
                  <p>Utilizamos tecnología SSL/TLS para proteger tus transacciones. Mantén tu contraseña confidencial y cambia regularmente.</p>
                </div>
                <button className="text-pink-400 hover:text-pink-500 text-sm font-medium">
                  Ver PDF completo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* /* COMENTADO: Sección Métodos de Pago
      {activeSection === 'payments' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CreditCard size={24} className="text-gray-600" />
                <h2 className="text-2xl text-gray-900">Métodos de Pago</h2>
              </div>
              <button
                onClick={() => setActiveSection(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronUp size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              {paymentMethods.map(card => (
                <div key={card.id} className="border-2 border-pink-200 rounded-lg p-4 bg-gradient-to-r from-pink-50 to-purple-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Tipo de Tarjeta</p>
                      <p className="font-semibold text-gray-900 mb-3">
                        {card.type === 'visa' ? 'Visa' : 'MasterCard'} •••• {card.last4}
                        {card.isMain && <span className="ml-2 text-xs bg-pink-400 text-white px-2 py-1 rounded">Principal</span>}
                      </p>
                      <p className="text-xs text-gray-600 mb-1">Titular</p>
                      <p className="text-gray-900">{card.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">Vencimiento</p>
                      <p className="text-gray-900 font-medium">{card.expiry}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {!card.isMain && (
                      <button
                        onClick={() => handleSetMainPayment(card.id)}
                        className="text-xs bg-pink-400 text-white px-3 py-1 rounded hover:bg-pink-500 transition-colors"
                      >
                        Marcar principal
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePayment(card.id)}
                      className="ml-auto p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <X size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>
              ))}

              {!showAddPayment ? (
                <button
                  onClick={() => setShowAddPayment(true)}
                  className="w-full py-2 border-2 border-pink-400 text-pink-400 rounded-lg hover:bg-pink-50 transition-colors text-sm font-medium"
                >
                  + Agregar nueva tarjeta
                </button>
              ) : (
                <div className="border-2 border-pink-200 rounded-lg p-4 bg-pink-50">
                  <h3 className="font-semibold text-gray-900 mb-4">Nueva Tarjeta</h3>
                  <div className="space-y-3">
                    <input 
                      type="text"
                      placeholder="Número de tarjeta (13-19 dígitos)"
                      value={newPayment.cardNumber}
                      onChange={(e) => setNewPayment({ ...newPayment, cardNumber: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                    <input 
                      type="text"
                      placeholder="Nombre del titular"
                      value={newPayment.name}
                      onChange={(e) => {
                        const filtered = e.target.value.replace(/[^a-zA-Z\s\-'ñáéíóúÑÁÉÍÓÚ]/g, '').toUpperCase();
                        setNewPayment({ ...newPayment, name: filtered });
                      }}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                    <input 
                      type="text"
                      placeholder="MM/YY"
                      value={newPayment.expiry}
                      onChange={(e) => setNewPayment({ ...newPayment, expiry: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                    
                    {paymentError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{paymentError}</p>}

                    <div className="flex gap-2">
                      <button 
                        onClick={handleSavePayment}
                        className="flex-1 bg-pink-400 text-white py-2 rounded-lg hover:bg-pink-500 transition-colors text-sm"
                      >
                        Guardar Tarjeta
                      </button>
                      <button 
                        onClick={() => {
                          setShowAddPayment(false);
                          setPaymentError('');
                          setNewPayment({ cardNumber: '', name: '', expiry: '' });
                        }}
                        className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      */ }
    </div>
  );
}
