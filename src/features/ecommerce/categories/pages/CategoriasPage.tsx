import { useState, useEffect } from 'react';
import { Card, Button, Input, Label, Textarea, Modal, DataTable, useToast } from '../../../../shared/components/native';
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react';
import { useAuth } from '../../../../shared/contexts/AuthContext';

interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  status: 'Activo' | 'Inactivo';
}

const mockCategories: Category[] = [
  { id: '1', name: 'Vestidos Largos', description: 'Vestidos largos para eventos formales', productCount: 45, status: 'Activo' },
  { id: '2', name: 'Vestidos Cortos', description: 'Vestidos cortos casuales y de fiesta', productCount: 38, status: 'Activo' },
  { id: '3', name: 'Sets', description: 'Conjuntos de dos piezas', productCount: 25, status: 'Activo' },
  { id: '4', name: 'Enterizos', description: 'Enterizos de una pieza', productCount: 32, status: 'Activo' },
];

export function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
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
    
    if (field === 'description') {
      if (!value.trim()) {
        errors.description = 'Este campo es obligatorio';
      } else if (value.trim().length < 10) {
        errors.description = 'Debe tener al menos 10 caracteres';
      }
    }
    
    return errors;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    const fieldErrors = validateField(field, value);
    setFormErrors({ ...formErrors, ...fieldErrors, [field]: fieldErrors[field] });
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        status: category.status,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
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
    ['name', 'description'].forEach(field => {
      const fieldErrors = validateField(field, (formData as any)[field]);
      if (fieldErrors[field]) {
        allErrors[field] = fieldErrors[field];
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...formData } : c));
      showToast('Categoría actualizada correctamente', 'success');
    } else {
      const newCategory: Category = {
        id: Date.now().toString(),
        ...formData,
        productCount: 0,
      };
      setCategories([...categories, newCategory]);
      showToast('Categoría creada correctamente', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      showToast('No tienes permisos para eliminar categorías', 'error');
      return;
    }
    // Verificar si existen productos asociados en localStorage
    try {
      const productosRaw = localStorage.getItem('damabella_productos');
      const productos = productosRaw ? JSON.parse(productosRaw) : [];
      const categoria = categories.find(c => c.id === id);
      const hasProducts = productos.some((p: any) => {
        // Comparar por nombre de categoría si existe
        return (p.categoria && categoria && String(p.categoria) === String(categoria.name));
      });

      if (hasProducts) {
        showToast('No se puede eliminar la categoría porque tiene productos asociados', 'error');
        return;
      }

      if (confirm('¿Estás seguro de eliminar esta categoría?')) {
        const updated = categories.filter(c => c.id !== id);
        setCategories(updated);
        try {
          localStorage.setItem('damabella_categorias', JSON.stringify(updated));
        } catch (e) {
          console.warn('No se pudo actualizar damabella_categorias en localStorage', e);
        }
        showToast('Categoría eliminada correctamente', 'success');
      }
    } catch (e) {
      console.error('Error verificando productos asociados:', e);
      showToast('Error verificando productos asociados', 'error');
    }
  };

  // Persistir categorías en localStorage para que sean la fuente de verdad del módulo
  useEffect(() => {
    try {
      localStorage.setItem('damabella_categorias', JSON.stringify(categories));
    } catch (e) {
      console.warn('No se pudo guardar damabella_categorias en localStorage', e);
    }
  }, [categories]);

  // Estado y lógica de confirmación para estandarizar toggle como en Roles
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [categoryToToggle, setCategoryToToggle] = useState<Category | null>(null);

  const toggleStatus = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    if (cat.status === 'Inactivo') {
      // Activar inmediatamente
      const updated = categories.map(c => c.id === id ? { ...c, status: 'Activo' as 'Activo' | 'Inactivo' } : c);
      setCategories(updated);
      showToast('Categoría activada', 'success');
    } else {
      // Abrir modal para confirmar inactivación
      setCategoryToToggle(cat);
      setIsStatusModalOpen(true);
    }
  };

  const confirmToggleStatus = () => {
    if (!categoryToToggle) return;
    const updated = categories.map(c => c.id === categoryToToggle.id ? { ...c, status: 'Inactivo' as 'Activo' | 'Inactivo' } : c);
    setCategories(updated);
    setIsStatusModalOpen(false);
    setCategoryToToggle(null);
    showToast('Categoría inactivada', 'success');
  };

  const columns = [
    {
      key: 'name',
      label: 'Categoría',
      render: (category: Category) => (
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-gray-600" />
          <span className="font-medium">{category.name}</span>
        </div>
      ),
    },
    { key: 'description', label: 'Descripción' },
    {
      key: 'productCount',
      label: 'Productos',
      render: (category: Category) => `${category.productCount} productos`,
    },
    {
      key: 'status',
      label: 'Estado',
        render: (category: Category) => (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleStatus(category.id)}
            aria-pressed={category.status !== 'Inactivo'}
            title={category.status === 'Inactivo' ? 'Activar categoría' : 'Inactivar categoría'}
            className={`relative w-12 h-6 rounded-full transition-colors ${category.status === 'Activo' ? 'bg-green-500' : 'bg-gray-400'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${category.status === 'Activo' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (category: Category) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(category)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          {canDelete && (
            <button
              onClick={() => handleDelete(category.id)}
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
          <h1 className="text-3xl font-bold">Categorías</h1>
          <p className="text-gray-600">Gestión de categorías de productos</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      <Card className="p-6 bg-gray-50">
        <DataTable
          data={categories}
          columns={columns}
          searchPlaceholder="Buscar categorías..."
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Categoría</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              required
            />
            {formErrors.name && (
              <p className="text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Descripción de la categoría"
              required
            />
            {formErrors.description && (
              <p className="text-sm text-red-600">{formErrors.description}</p>
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingCategory ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Confirm status change modal (inactivar) - estandarizado como Roles */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => { setIsStatusModalOpen(false); setCategoryToToggle(null); }}
        title="Confirmar cambio de estado"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <FolderTree className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-900 font-medium">¿Estás seguro de que deseas inactivar esta categoría?</p>
              <p className="text-gray-600 text-sm mt-2">
                Esta acción deshabilitará la categoría <strong>{categoryToToggle?.name}</strong> y puede afectar productos asociados.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsStatusModalOpen(false); setCategoryToToggle(null); }}>
              Cancelar
            </Button>
            <Button type="button" className="bg-orange-600 hover:bg-orange-700" onClick={confirmToggleStatus}>
              Inactivar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
