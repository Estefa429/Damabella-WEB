import { useState } from 'react';
import { Card, Button, Input, Label, useToast } from '../../../shared/components/native';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Camera, User as UserIcon, Mail, Phone, MapPin, Eye, EyeOff, Home } from 'lucide-react';

// --- Enum y tipo de usuario ---
export enum UserRole {
  Admin = 'Administrador',
  Empleado = 'Empleado',
  Cliente = 'Cliente',
}

export type UserType = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole;
  document?: string;
  status?: string;
  image?: string;
  createdAt?: string;
};

interface PerfilProps {
  onBackToDashboard?: () => void;
}

export default function Perfil({ onBackToDashboard }: PerfilProps) {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    company: 'Creative Code Inc.',
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    address: user?.address || '',
    city: '',
    country: '',
    postalCode: '',
    about: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const { showToast } = useToast();

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    updateProfile({ ...formData, name: fullName });
    showToast('Perfil actualizado correctamente', 'success');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showToast('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }
    showToast('Contraseña actualizada correctamente', 'success');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // --- Determinar rol con enum ---
  const roleLabel = user?.role === UserRole.Admin
    ? 'Administrador'
    : user?.role === UserRole.Empleado
    ? 'Empleado'
    : 'Cliente';

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-gray-300 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Editar Perfil</h1>
        </div>
        {onBackToDashboard && (
          <Button onClick={onBackToDashboard} variant="secondary" className="flex items-center gap-3 px-6 py-2.5">
            <Home size={18} />
            Volver al Panel
          </Button>
        )}
      </div>

      {/* Main layout: 2 columns */}
      <div className="grid grid-cols-3 gap-8">
        {/* Left column: Form */}
        <div className="col-span-2">
          <Card className="p-10 shadow-md">
            <form onSubmit={handleUpdateProfile} className="space-y-8">
              {/* Empresa */}
              <div className="space-y-3">
                <Label htmlFor="company" className="text-base font-semibold text-gray-800">Empresa (discapacitado)</Label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  disabled
                  className="bg-gray-100 text-gray-500 px-4 py-3 text-base"
                />
              </div>

              {/* Nombre de usuario */}
              <div className="space-y-3">
                <Label htmlFor="username" className="text-base font-semibold text-gray-800">Nombre de usuario</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Tu nombre de usuario"
                  className="px-4 py-3 text-base"
                />
              </div>

              {/* Email */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-base font-semibold text-gray-800">Dirección de correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="px-4 py-3 text-base"
                />
              </div>

              {/* Nombre de pila y Apellido */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="firstName" className="text-base font-semibold text-gray-800">Nombre de pila</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Nombre"
                    className="px-4 py-3 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="lastName" className="text-base font-semibold text-gray-800">Apellido</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Apellido"
                    className="px-4 py-3 text-base"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-3">
                <Label htmlFor="address" className="text-base font-semibold text-gray-800">DIRECCIÓN</Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Calle 123 # 45-67"
                  className="px-4 py-3 text-base"
                />
              </div>

              {/* Ciudad, País, Código Postal */}
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="city" className="text-base font-semibold text-gray-800">Ciudad</Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Tu ciudad"
                    className="px-4 py-3 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="country" className="text-base font-semibold text-gray-800">País</Label>
                  <Input
                    id="country"
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Tu país"
                    className="px-4 py-3 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="postalCode" className="text-base font-semibold text-gray-800">Código Postal</Label>
                  <Input
                    id="postalCode"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="Código postal"
                    className="px-4 py-3 text-base"
                  />
                </div>
              </div>

              {/* Acerca de mí */}
              <div className="space-y-3">
                <Label htmlFor="about" className="text-base font-semibold text-gray-800">Acerca de mi</Label>
                <textarea
                  id="about"
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  placeholder="Cuéntanos sobre ti..."
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={4}
                />
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-start pt-6 border-t-2 border-gray-300">
                <Button type="submit" variant="primary" className="bg-purple-500 hover:bg-purple-600 px-8 py-3 text-base font-semibold">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right column: Profile */}
        <div className="col-span-1">
          <Card className="p-10 flex flex-col items-center text-center shadow-md">
            {/* Profile Image */}
            <div className="relative mb-8">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden border-4 border-purple-500 shadow-md">
                <span className="text-5xl text-white font-bold">
                  {user?.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 p-3 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors shadow-lg">
                <Camera className="h-6 w-6" />
              </button>
            </div>

            {/* Name and Role */}
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{user?.name}</h2>
            <p className="text-base font-medium text-purple-600 mb-8">{roleLabel}</p>

            {/* About section */}
            <p className="text-base text-gray-600 leading-relaxed mb-10">
              {formData.about || 'No hay información sobre ti.'}
            </p>

            {/* Social icons - placeholder */}
            <div className="flex gap-6 justify-center w-full">
              <button className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-purple-100 hover:text-purple-600 transition-colors shadow-sm">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-purple-100 hover:text-purple-600 transition-colors shadow-sm">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7s1.1 5.5-5.5 8.5-5.5 2-5.5 2"/>
                </svg>
              </button>
              <button className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-purple-100 hover:text-purple-600 transition-colors shadow-sm">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 15h-4v-5.5c0-1.1-.9-2-2-2s-2 .9-2 2V17H8V9h3v1.5c.6-.9 1.9-1.5 3.5-1.5 2.5 0 4.5 1.9 4.5 4.5V17zm-9-8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
