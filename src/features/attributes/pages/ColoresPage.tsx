import { useState } from 'react';
import { Card, Button, Input, Label, Modal, DataTable, Badge, useToast } from '../../../shared/components/native';
import { Plus, Edit, Trash2, Palette } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface Color {
  id: string;
  name: string;
  hexCode: string;
  status: 'Activo' | 'Inactivo';
}

const mockColors: Color[] = [
  { id: '1', name: 'Negro', hexCode: '#000000', status: 'Activo' },
  { id: '2', name: 'Blanco', hexCode: '#FFFFFF', status: 'Activo' },
  { id: '3', name: 'Rojo', hexCode: '#DC2626', status: 'Activo' },
  { id: '4', name: 'Azul', hexCode: '#2563EB', status: 'Activo' },
  { id: '5', name: 'Verde', hexCode: '#16A34A', status: 'Activo' },
  { id: '6', name: 'Rosa', hexCode: '#EC4899', status: 'Activo' },
  { id: '7', name: 'Gris', hexCode: '#6B7280', status: 'Activo' },
  { id: '8', name: 'Beige', hexCode: '#D4A574', status: 'Activo' },
];

export default function ColoresPage() {
  const [colors, setColors] = useState<Color[]>(mockColors);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    hexCode: '#000000',
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
      } else if (value.trim().length < 2) {
        errors.name = 'Debe tener al menos 2 caracteres';
      }
    }
    
    if (field === 'hexCode') {
      if (!value.trim()) {
        errors.hexCode = 'Este campo es obligatorio';
      } else if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
        errors.hexCode = 'Formato inválido. Use #RRGGBB';
      }
    }
    
    return errors;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    const fieldErrors = validateField(field, value);
    setFormErrors({ ...formErrors, ...fieldErrors, [field]: fieldErrors[field] });
  };

  const handleOpenModal = (color?: Color) => {
    if (color) {
      setEditingColor(color);
      setFormData(color);
    } else {
      setEditingColor(null);
      setFormData({
        name: '',
        hexCode: '#000000',
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
    ['name', 'hexCode'].forEach(field => {
      const fieldErrors = validateField(field, (formData as any)[field]);
      if (fieldErrors[field]) {
        allErrors[field] = fieldErrors[field];
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    if (editingColor) {
      setColors(colors.map(c => c.id === editingColor.id ? { ...c, ...formData } : c));
      showToast('Color actualizado correctamente', 'success');
    } else {
      const newColor: Color = {
        id: Date.now().toString(),
        ...formData,
      };
      setColors([...colors, newColor]);
      showToast('Color creado correctamente', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      showToast('No tienes permisos para eliminar colores', 'error');
      return;
    }
    if (confirm('¿Estás seguro de eliminar este color?')) {
      setColors(colors.filter(c => c.id !== id));
      showToast('Color eliminado correctamente', 'success');
    }
  };

  const columns = [
    {
      key: 'color',
      label: 'Color',
      render: (color: Color) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg border border-gray-300"
            style={{ backgroundColor: color.hexCode }}
          />
          <div>
            <p className="font-medium">{color.name}</p>
            <p className="text-xs text-gray-600">{color.hexCode}</p>
          </div>
        </div>
      ),
    },
    { key: 'hexCode', label: 'Código HEX' },
    {
      key: 'status',
      label: 'Estado',
      render: (color: Color) => (
        <Badge variant={color.status === 'Activo' ? 'success' : 'default'}>
          {color.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (color: Color) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(color)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          {canDelete && (
            <button
              onClick={() => handleDelete(color.id)}
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
          <h1 className="text-3xl font-bold">Colores</h1>
          <p className="text-gray-600">Gestión de colores de productos</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Color
        </Button>
      </div>

      <Card className="p-6">
        <DataTable
          data={colors}
          columns={columns}
          searchPlaceholder="Buscar colores..."
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingColor ? 'Editar Color' : 'Nuevo Color'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Color</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Rojo, Azul, Verde"
              required
            />
            {formErrors.name && (
              <p className="text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Selecciona o Crea un Color</Label>
            
            {/* Color Picker Visual */}
            <div className="flex gap-3 items-end">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-gray-600">Selector de color:</span>
                <Input
                  id="hexCode"
                  type="color"
                  value={formData.hexCode}
                  onChange={(e) => handleFieldChange('hexCode', e.target.value)}
                  className="w-20 h-12 p-1 cursor-pointer rounded-lg"
                  required
                />
              </div>
              <div className="flex-1">
                <Input
                  value={formData.hexCode}
                  onChange={(e) => handleFieldChange('hexCode', e.target.value)}
                  placeholder="#000000"
                  className="w-full"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  required
                />
              </div>
            </div>
            
            {/* Paleta de Colores Predefinidos */}
            <div className="mt-4">
              <span className="text-xs text-gray-600 mb-2 block">O elige de la paleta:</span>
              <div className="grid grid-cols-8 gap-2">
                {[
                  '#000000', '#FFFFFF', '#DC2626', '#2563EB', '#16A34A', '#EC4899', '#6B7280', '#D4A574',
                  '#F97316', '#06B6D4', '#8B5CF6', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#6366F1',
                  '#14B8A6', '#D946EF', '#F43F5E', '#0EA5E9', '#84CC16', '#F97316', '#4F46E5', '#6D28D9'
                ].map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => handleFieldChange('hexCode', hex)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                      formData.hexCode === hex ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
              </div>
            </div>
            
            {formErrors.hexCode && <p className="text-red-500 text-sm mt-2">{formErrors.hexCode}</p>}
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
              {editingColor ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
