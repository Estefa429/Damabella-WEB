import { useState } from 'react';
import { Card, Button, Input, Label, Modal, DataTable, Badge, useToast } from '../../../shared/components/native';
import { Plus, Edit, Trash2, Ruler } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface Size {
  id: string;
  name: string;
  abbreviation: string;
  measurements: string;
  status: 'Activo' | 'Inactivo';
}

const mockSizes: Size[] = [
  { id: '1', name: 'Extra Small', abbreviation: 'XS', measurements: '80-60-85 cm', status: 'Activo' },
  { id: '2', name: 'Small', abbreviation: 'S', measurements: '85-65-90 cm', status: 'Activo' },
  { id: '3', name: 'Medium', abbreviation: 'M', measurements: '90-70-95 cm', status: 'Activo' },
  { id: '4', name: 'Large', abbreviation: 'L', measurements: '95-75-100 cm', status: 'Activo' },
  { id: '5', name: 'Extra Large', abbreviation: 'XL', measurements: '100-80-105 cm', status: 'Activo' },
];

export default function TallasPage() {
  const [sizes, setSizes] = useState<Size[]>(mockSizes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    measurements: '',
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
      } else if (value.trim().length < 3) {
        errors.name = 'Debe tener al menos 3 caracteres';
      }
    }
    
    if (field === 'abbreviation') {
      if (!value.trim()) {
        errors.abbreviation = 'Este campo es obligatorio';
      } else if (value.trim().length < 1 || value.trim().length > 5) {
        errors.abbreviation = 'Debe tener entre 1 y 5 caracteres';
      }
    }
    
    if (field === 'measurements') {
      if (!value.trim()) {
        errors.measurements = 'Este campo es obligatorio';
      }
    }
    
    return errors;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    const fieldErrors = validateField(field, value);
    setFormErrors({ ...formErrors, ...fieldErrors, [field]: fieldErrors[field] });
  };

  const handleOpenModal = (size?: Size) => {
    if (size) {
      setEditingSize(size);
      setFormData(size);
    } else {
      setEditingSize(null);
      setFormData({
        name: '',
        abbreviation: '',
        measurements: '',
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
    ['name', 'abbreviation', 'measurements'].forEach(field => {
      const fieldErrors = validateField(field, (formData as any)[field]);
      if (fieldErrors[field]) {
        allErrors[field] = fieldErrors[field];
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    if (editingSize) {
      setSizes(sizes.map(s => s.id === editingSize.id ? { ...s, ...formData } : s));
      showToast('Talla actualizada correctamente', 'success');
    } else {
      const newSize: Size = {
        id: Date.now().toString(),
        ...formData,
      };
      setSizes([...sizes, newSize]);
      showToast('Talla creada correctamente', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      showToast('No tienes permisos para eliminar tallas', 'error');
      return;
    }
    if (confirm('¿Estás seguro de eliminar esta talla?')) {
      setSizes(sizes.filter(s => s.id !== id));
      showToast('Talla eliminada correctamente', 'success');
    }
  };

  const columns = [
    {
      key: 'abbreviation',
      label: 'Talla',
      render: (size: Size) => (
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-gray-600" />
          <span className="font-bold text-lg">{size.abbreviation}</span>
        </div>
      ),
    },
    { key: 'name', label: 'Nombre' },
    { key: 'measurements', label: 'Medidas' },
    {
      key: 'status',
      label: 'Estado',
      render: (size: Size) => (
        <Badge variant={size.status === 'Activo' ? 'success' : 'default'}>
          {size.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (size: Size) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(size)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          {canDelete && (
            <button
              onClick={() => handleDelete(size.id)}
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
          <h1 className="text-3xl font-bold">Tallas</h1>
          <p className="text-gray-600">Gestión de tallas de productos</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Talla
        </Button>
      </div>

      <Card className="p-6">
        <DataTable
          data={sizes}
          columns={columns}
          searchPlaceholder="Buscar tallas..."
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSize ? 'Editar Talla' : 'Nueva Talla'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="abbreviation">Abreviatura</Label>
              <Input
                id="abbreviation"
                value={formData.abbreviation}
                onChange={(e) => handleFieldChange('abbreviation', e.target.value.toUpperCase())}
                placeholder="S, M, L, XL"
                required
              />
              {formErrors.abbreviation && (
                <p className="text-sm text-red-600">{formErrors.abbreviation}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Small, Medium, Large"
                required
              />
              {formErrors.name && (
                <p className="text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="measurements">Medidas</Label>
            <Input
              id="measurements"
              value={formData.measurements}
              onChange={(e) => handleFieldChange('measurements', e.target.value)}
              placeholder="90-70-95 cm (Busto-Cintura-Cadera)"
              required
            />
            {formErrors.measurements && (
              <p className="text-sm text-red-600">{formErrors.measurements}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Activo' | 'Inactivo' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingSize ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
