import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, ShoppingBag, LogOut, Edit2, Camera, Package, Heart, ChevronRight, Home, Bell, Shield, CreditCard } from 'lucide-react';
import { PremiumNavbar } from '../components/PremiumNavbar';
import { PremiumFooter } from '../components/PremiumFooter';
import { useEcommerce } from '../../../../shared/contexts';

interface ProfilePageProps {
  onNavigate: (view: string) => void;
  currentUser: any;
  onLogout: () => void;
  onLogin: (user: any) => void;
}

export function ProfilePage({ onNavigate, currentUser, onLogout, onLogin }: ProfilePageProps) {
  const { orders, favorites } = useEcommerce();
  const [isEditing, setIsEditing] = useState(false);

  // Contar pedidos del usuario actual
  const userOrdersCount = orders.filter(order => 
    order.clientEmail === currentUser?.email
  ).length;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={48} className="text-white" />
          </div>
          <h2 className="text-3xl text-gray-900 mb-3">Inicia Sesión</h2>
          <p className="text-gray-600 mb-8">Accede a tu cuenta para ver tu perfil y gestionar tus pedidos</p>
          <button 
            onClick={() => onNavigate('home')}
            className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-4 rounded-full hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-105 shadow-lg"
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
        {/* Header con foto de perfil y banner */}
        <div className="bg-gradient-to-r from-pink-400 to-purple-400 rounded-3xl overflow-hidden mb-8 shadow-lg">
          <div className="p-12 text-white relative">
            <div className="flex items-end gap-6">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-pink-400 text-5xl shadow-xl ring-4 ring-white">
                {currentUser.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="pb-2 flex-1">
                <h1 className="text-4xl mb-2">{currentUser.name}</h1>
                <p className="text-pink-100 text-lg">{currentUser.email}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="bg-white/20 px-4 py-1 rounded-full text-sm backdrop-blur-sm">
                    {currentUser.role === 'Cliente' ? '👑 Cliente VIP' : currentUser.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Información y opciones */}
          <div className="lg:col-span-1 space-y-6">
            {/* Información Personal */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-gray-900">Información Personal</h2>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Edit2 size={18} className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail size={20} className="text-pink-400 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Correo Electrónico</p>
                    <p className="text-gray-900">{currentUser.email}</p>
                  </div>
                </div>

                {currentUser.celular && (
                  <div className="flex items-start gap-3">
                    <Phone size={20} className="text-pink-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                      <p className="text-gray-900">{currentUser.celular}</p>
                    </div>
                  </div>
                )}

                {currentUser.direccion && (
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-pink-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Dirección</p>
                      <p className="text-gray-900">{currentUser.direccion}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl text-gray-900 mb-6">Resumen de Cuenta</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <Package size={20} className="text-pink-400" />
                    </div>
                    <span className="text-gray-700">Pedidos</span>
                  </div>
                  <span className="text-2xl text-gray-900">{userOrdersCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Heart size={20} className="text-purple-400" />
                    </div>
                    <span className="text-gray-700">Favoritos</span>
                  </div>
                  <span className="text-2xl text-gray-900">{favorites.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Opciones del perfil */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl text-gray-900 mb-6">Mi Cuenta</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mis Pedidos */}
                <button
                  onClick={() => onNavigate('orders')}
                  className="group bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-xl hover:shadow-md transition-all border-2 border-transparent hover:border-pink-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-xl flex items-center justify-center">
                      <Package size={24} className="text-white" />
                    </div>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-pink-400 transition-colors" />
                  </div>
                  <h3 className="text-lg text-gray-900 mb-1">Mis Pedidos</h3>
                  <p className="text-sm text-gray-600">Ver historial y seguimiento</p>
                </button>

                {/* Favoritos */}
                <button
                  onClick={() => onNavigate('favorites')}
                  className="group bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-xl hover:shadow-md transition-all border-2 border-transparent hover:border-pink-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-xl flex items-center justify-center">
                      <Heart size={24} className="text-white" />
                    </div>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-pink-400 transition-colors" />
                  </div>
                  <h3 className="text-lg text-gray-900 mb-1">Mis Favoritos</h3>
                  <p className="text-sm text-gray-600">Productos que me gustan</p>
                </button>

                {/* Direcciones */}
                <button
                  className="group bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl hover:shadow-md transition-all border-2 border-transparent hover:border-gray-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-gray-400 rounded-xl flex items-center justify-center">
                      <MapPin size={24} className="text-white" />
                    </div>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <h3 className="text-lg text-gray-900 mb-1">Mis Direcciones</h3>
                  <p className="text-sm text-gray-600">Gestionar direcciones de envío</p>
                </button>

                {/* Métodos de Pago */}
                <button
                  className="group bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl hover:shadow-md transition-all border-2 border-transparent hover:border-gray-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-gray-400 rounded-xl flex items-center justify-center">
                      <CreditCard size={24} className="text-white" />
                    </div>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <h3 className="text-lg text-gray-900 mb-1">Métodos de Pago</h3>
                  <p className="text-sm text-gray-600">Tarjetas guardadas</p>
                </button>
              </div>
            </div>

            {/* Configuración */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl text-gray-900 mb-6">Configuración</h2>

              <div className="space-y-3">
                <button 
                  onClick={() => onNavigate('home')}
                  className="w-full flex items-center justify-between p-4 hover:bg-pink-50 rounded-xl transition-colors group border-2 border-transparent hover:border-pink-200"
                >
                  <div className="flex items-center gap-3">
                    <Home size={20} className="text-pink-600" />
                    <span className="text-pink-600">Volver al Inicio</span>
                  </div>
                  <ChevronRight size={20} className="text-pink-400 group-hover:text-pink-600" />
                </button>

                <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                  <div className="flex items-center gap-3">
                    <Bell size={20} className="text-gray-600" />
                    <span className="text-gray-900">Notificaciones</span>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600" />
                </button>

                <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                  <div className="flex items-center gap-3">
                    <Shield size={20} className="text-gray-600" />
                    <span className="text-gray-900">Privacidad y Seguridad</span>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600" />
                </button>

                <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-xl transition-colors group border-2 border-transparent hover:border-red-200"
                >
                  <div className="flex items-center gap-3">
                    <LogOut size={20} className="text-red-600" />
                    <span className="text-red-600">Cerrar Sesión</span>
                  </div>
                  <ChevronRight size={20} className="text-red-400 group-hover:text-red-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PremiumFooter onNavigate={onNavigate} />
    </div>
  );
}