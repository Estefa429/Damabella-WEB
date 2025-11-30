import { useState } from 'react';
import { Card, Button, Input, Label, useToast } from '../../../shared/components/native';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Camera, User, Mail, Phone, MapPin, Eye, EyeOff } from 'lucide-react';

type UserRole = 'Admin' | 'Empleado' | 'Cliente';

export default function PerfilPage() {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
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
    updateProfile(formData);
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
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  // Función para mostrar el rol de manera segura
  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case 'Admin':
        return 'Administrador';
      case 'Empleado':
        return 'Empleado';
      case 'Cliente':
        return 'Cliente';
      default:
        return 'Cliente';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-gray-600">Gestiona tu información personal</p>
      </div>

      {/* Información del perfil */}
      <Card className="p-6">
        <div className="flex items-start gap-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-3xl text-white font-bold">
                {user?.name
                  ?.split(' ')
                  .map((n: string) => n[0] ?? '')
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user?.name ?? 'Sin nombre'}</h2>
            <p className="text-gray-600">{user?.email ?? 'Sin email'}</p>
            <div className="mt-2 inline-flex px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
              {getRoleLabel(user?.role as UserRole)}
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit">Guardar Cambios</Button>
          </div>
        </form>
      </Card>

      {/* Cambiar contraseña */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cambiar Contraseña</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Contraseña actual */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña Actual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit">Actualizar Contraseña</Button>
          </div>
        </form>
      </Card>

      {/* Estadísticas del usuario (si es cliente) */}
      {user?.role === 'Cliente' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Mis Estadísticas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Compras Totales</p>
              <p className="text-2xl font-bold">15</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Gastado</p>
              <p className="text-2xl font-bold">$2,450,000</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Pedidos Activos</p>
              <p className="text-2xl font-bold">2</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
