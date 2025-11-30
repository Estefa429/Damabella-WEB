import { useState } from 'react';
import { Card, Button, Input, Label, Modal, DataTable, Badge, useToast } from '../../../shared/components/native';
import { Plus, Edit, Trash2, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface Provider {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  status: 'Activo' | 'Inactivo';
}

const mockProviders: Provider[] = [
  { id: '1', name: 'Textiles El Sol', contact: 'Carlos Ramírez', email: 'carlos@textiles.com', phone: '3001234567', address: 'Calle 50 #20-30', category: 'Telas', status: 'Activo' },
  { id: '2', name: 'Distribuidora Fashion', contact: 'Ana López', email: 'ana@fashion.com', phone: '3107654321', address: 'Carrera 15 #80-45', category: 'Accesorios', status: 'Activo' },
  { id: '3', name: 'Importadora Textil', contact: 'Miguel Torres', email: 'miguel@importadora.com', phone: '3209876543', address: 'Avenida 68 #100-20', category: 'Telas', status: 'Inactivo' },
];

export default function ProveedoresPage() {
  const [providers, setProviders] = useState<Provider[]>(mockProviders);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    category: 'Telas',
    status: 'Activo' as 'Activo' | 'Inactivo',
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const { showToast } = useToast();
  const { user } = useAuth();

  const canDelete = user?.role === 'Administrador';

  const validateField = (field: string, value: string) => {
    const errors: any = {};
    
    if (field === 'name') {
      if (!value.trim()) {
        errors.name = 'Este campo es obligatorio';
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        errors.name = 'Solo se permiten letras y espacios';
      }
    }
    
    if (field === 'contact') {
      if (!value.trim()) {
        errors.contact = 'Este campo es obligatorio';
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        errors.contact = 'Solo se permiten letras y espacios';
      }
    }
    
    if (field === 'email') {
      if (!value.trim()) {
        errors.email = 'Este campo es obligatorio';
      } else if (!/^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        errors.email = 'Email inválido (debe iniciar con letra)';
      }
    }
    
    if (field === 'phone') {
      if (!value.trim()) {
        errors.phone = 'Este campo es obligatorio';
      } else if (!/^\d{10}$/.test(value)) {
        errors.phone = 'Debe tener exactamente 10 dígitos';
      }
    }
    
    if (field === 'address') {
      if (!value.trim()) {
        errors.address = 'Este campo es obligatorio';
      }
    }
    
    if (field === 'category') {
      if (!value.trim()) {
        errors.category = 'Este campo es obligatorio';
      }
    }
    
    return errors;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    const fieldErrors = validateField(field, value);
    setFormErrors({ ...formErrors, ...fieldErrors, [field]: fieldErrors[field] });
  };

  const handleOpenModal = (provider?: Provider) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData(provider);
    } else {
      setEditingProvider(null);
      setFormData({
        name: '',
        contact: '',
        email: '',
        phone: '',
        address: '',
        category: 'Telas',
        status: 'Activo',
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos
    const allErrors: any = {};
    ['name', 'contact', 'email', 'phone', 'address', 'category'].forEach(field => {
      const fieldErrors = validateField(field, (formData as any)[field]);
      if (fieldErrors[field]) {
        allErrors[field] = fieldErrors[field];
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    if (editingProvider) {
      setProviders(providers.map(p => p.id === editingProvider.id ? { ...p, ...formData } : p));
      showToast('Proveedor actualizado correctamente', 'success');
    } else {
      const newProvider: Provider = {
        id: Date.now().toString(),
        ...formData,
      };
      setProviders([...providers, newProvider]);
      showToast('Proveedor creado correctamente', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      showToast('No tienes permisos para eliminar proveedores', 'error');
      return;
    }
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      setProviders(providers.filter(p => p.id !== id));
      showToast('Proveedor eliminado correctamente', 'success');
    }
  };

  const columns = [
    { key: 'name', label: 'Empresa' },
    { key: 'contact', label: 'Contacto' },
    {
      key: 'email',
      label: 'Email',
      render: (provider: Provider) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{provider.email}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Teléfono',
      render: (provider: Provider) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{provider.phone}</span>
        </div>
      ),
    },
    { key: 'category', label: 'Categoría' },
    {
      key: 'status',
      label: 'Estado',
      render: (provider: Provider) => (
        <Badge variant={provider.status === 'Activo' ? 'success' : 'default'}>
          {provider.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (provider: Provider) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(provider)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          {canDelete && (
            <button
              onClick={() => handleDelete(provider.id)}
              className="p-1 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proveedores</h1>
          <p className="text-gray-600">Gestión de proveedores</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      <Card className="p-6">
        <DataTable
          data={providers}
          columns={columns}
          searchPlaceholder="Buscar proveedores..."
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Empresa</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                required
              />
              {formErrors.name && (
                <p className="text-red-600 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Persona de Contacto</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => handleFieldChange('contact', e.target.value)}
                required
              />
              {formErrors.contact && (
                <p className="text-red-600 text-xs mt-1">{formErrors.contact}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                required
              />
              {formErrors.email && (
                <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                required
              />
              {formErrors.phone && (
                <p className="text-red-600 text-xs mt-1">{formErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                placeholder="Ej: Telas, Accesorios"
                required
              />
              {formErrors.category && (
                <p className="text-red-600 text-xs mt-1">{formErrors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Activo' | 'Inactivo' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent bg-white"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              required
            />
            {formErrors.address && (
              <p className="text-red-600 text-xs mt-1">{formErrors.address}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingProvider ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
