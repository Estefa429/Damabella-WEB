import { useState } from 'react';
import { Card, Button, Input, Label, Modal, DataTable, Badge, useToast } from '../../../../shared/components/native';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../../../shared/contexts/AuthContext';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalPurchases: number;
  status: 'Activo' | 'Inactivo';
}

const mockClients: Client[] = [
  { id: '1', name: 'Laura Martínez', email: 'laura@email.com', phone: '3001234567', address: 'Calle 123 #45-67', totalPurchases: 1250000, status: 'Activo' },
  { id: '2', name: 'Sofía González', email: 'sofia@email.com', phone: '3107654321', address: 'Carrera 89 #12-34', totalPurchases: 890000, status: 'Activo' },
  { id: '3', name: 'Camila Rodríguez', email: 'camila@email.com', phone: '3209876543', address: 'Avenida 56 #78-90', totalPurchases: 450000, status: 'Inactivo' },
];

export function ClientesPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
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
    
    if (field === 'email') {
      if (!value.trim()) {
        errors.email = 'Este campo es obligatorio';
      } else if (!/^[a-zA-Z][a-zA-Z0-9.-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        errors.email = 'Email inválido (debe iniciar con letra, no puede contener _)';
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
    
    return errors;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    const fieldErrors = validateField(field, value);
    setFormErrors({ ...formErrors, ...fieldErrors, [field]: fieldErrors[field] });
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        status: client.status,
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
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
    ['name', 'email', 'phone', 'address'].forEach(field => {
      const fieldErrors = validateField(field, (formData as any)[field]);
      if (fieldErrors[field]) {
        allErrors[field] = fieldErrors[field];
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    // Validar email único
    const emailExists = clients.find(c => 
      c.email.toLowerCase() === formData.email.toLowerCase() && 
      (!editingClient || c.id !== editingClient.id)
    );
    
    if (emailExists) {
      setFormErrors({ ...formErrors, email: 'Este correo ya está registrado' });
      showToast('Este correo ya está registrado', 'error');
      return;
    }

    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...formData } : c));
      showToast('Cliente actualizado correctamente', 'success');
    } else {
      const newClient: Client = {
        id: Date.now().toString(),
        ...formData,
        totalPurchases: 0,
      };
      setClients([...clients, newClient]);
      showToast('Cliente creado correctamente', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      showToast('No tienes permisos para eliminar clientes', 'error');
      return;
    }
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      setClients(clients.filter(c => c.id !== id));
      showToast('Cliente eliminado correctamente', 'success');
    }
  };

  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Correo' },
    { key: 'phone', label: 'Teléfono' },
    {
      key: 'totalPurchases',
      label: 'Compras Totales',
      render: (client: Client) => `$${client.totalPurchases.toLocaleString()}`,
    },
    {
      key: 'status',
      label: 'Estado',
      render: (client: Client) => (
        <Badge variant={client.status === 'Activo' ? 'success' : 'default'}>
          {client.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (client: Client) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(client)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          {canDelete && (
            <button
              onClick={() => handleDelete(client.id)}
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
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-gray-600">Gestión de clientes</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <Card className="p-6">
        <DataTable
          data={clients}
          columns={columns}
          searchPlaceholder="Buscar clientes..."
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
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
              {editingClient ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
