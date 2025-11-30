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
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // --- Determinar rol con enum ---
  const roleLabel = user?.role === UserRole.Admin
    ? 'Administrador'
    : user?.role === UserRole.Empleado
    ? 'Empleado'
    : 'Cliente';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header con botón de regreso */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600">Gestiona tu información personal</p>
        </div>
        {onBackToDashboard && (
          <Button onClick={onBackToDashboard} variant="secondary" className="flex items-center gap-2">
            <Home size={18} />
            Volver al Panel
          </Button>
        )}
      </div>

      {/* Información del perfil */}
      <Card className="p-6">
        <div className="flex items-start gap-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-3xl text-white font-bold">
                {user?.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-600">{user?.email}</p>
            <div className="mt-2 inline-flex px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
              {roleLabel}
            </div>
          </div>
        </div>

        {/* Formulario de perfil */}
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {[
            { id: 'name', label: 'Nombre completo', icon: UserIcon, placeholder: 'Tu nombre completo' },
            { id: 'email', label: 'Correo electrónico', icon: Mail, placeholder: 'correo@ejemplo.com', type: 'email' },
            { id: 'phone', label: 'Teléfono', icon: Phone, placeholder: '3001234567' },
            { id: 'address', label: 'Dirección', icon: MapPin, placeholder: 'Calle 123 # 45-67' },
          ].map((field) => (
            <div key={field.id}>
              <Label htmlFor={field.id}>{field.label}</Label>
              <div className="relative">
                <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id={field.id}
                  type={field.type || 'text'}
                  value={formData[field.id as keyof typeof formData]}
                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  className="pl-10"
                  placeholder={field.placeholder}
                />
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button type="submit" variant="primary">Guardar cambios</Button>
          </div>
        </form>
      </Card>

      {/* Cambiar contraseña */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-900">Cambiar contraseña</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {['current', 'new', 'confirm'].map((field) => {
            const id = field + 'Password';
            return (
              <div key={id}>
                <Label htmlFor={id}>
                  {field === 'current' ? 'Contraseña actual' : field === 'new' ? 'Nueva contraseña' : 'Confirmar nueva contraseña'}
                </Label>
                <div className="relative">
                  <Input
                    id={id}
                    type={showPasswords[field as keyof typeof showPasswords] ? 'text' : 'password'}
                    value={passwordData[id as keyof typeof passwordData]}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, [id]: e.target.value } as any)
                    }
                    className="pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        [field]: !showPasswords[field as keyof typeof showPasswords],
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords[field as keyof typeof showPasswords] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex justify-end">
            <Button type="submit" variant="primary">Actualizar contraseña</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
