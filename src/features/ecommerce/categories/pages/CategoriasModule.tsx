import React, { useState, useEffect } from 'react';
import { User, Category } from '../../../../shared/types';
import { DataTable } from '../../../../components/ui/DataTable';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../../../../components/ui/dialog';
import { Textarea } from '../../../../components/ui/textarea';
import { Plus, Search, AlertCircle } from 'lucide-react';
import validateField from '../../../../shared/utils/validation';
import { toast } from 'sonner';

interface CategoriasProps {
  user: User;
}

const mockCategorias: Category[] = [
  { id: '1', name: 'Vestidos Largos', description: 'Vestidos elegantes de largo completo', productCount: 45, createdAt: new Date().toISOString() },
  { id: '2', name: 'Vestidos Cortos', description: 'Vestidos casuales y de coctel', productCount: 38, createdAt: new Date().toISOString() },
  { id: '3', name: 'Sets', description: 'Conjuntos coordinados de dos piezas', productCount: 28, createdAt: new Date().toISOString() },
  { id: '4', name: 'Enterizos', description: 'Monos y jumpsuits', productCount: 22, createdAt: new Date().toISOString() },
];

export function Categorias({ user }: CategoriasProps) {
  const [categorias, setCategorias] = useState<Category[]>(() => {
    const stored = localStorage.getItem('damabella_categorias');
    return stored ? JSON.parse(stored) : mockCategorias;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState<any>({});

  const canDelete = user.role === 'Administrador';

  useEffect(() => {
    localStorage.setItem('damabella_categorias', JSON.stringify(categorias));
  }, [categorias]);

  const filteredCategorias = categorias.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditMode(false);
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleEdit = (categoria: Category) => {
    setEditMode(true);
    setSelectedCategoria(categoria);
    setFormData({ name: categoria.name, description: categoria.description || '' });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: any = {};
    const nameErr = validateField('nombre', formData.name);
    if (nameErr) errors.name = nameErr;
    const descErr = validateField('name', formData.description);
    if (descErr) errors.description = descErr;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    if (editMode && selectedCategoria) {
      setCategorias(
        categorias.map(c =>
          c.id === selectedCategoria.id ? { ...c, ...formData } : c
        )
      );
      toast.success('Categoría actualizada exitosamente');
    } else {
      const newCategoria: Category = {
        id: String(categorias.length + 1),
        ...formData,
        productCount: 0,
        createdAt: new Date().toISOString(),
      };
      setCategorias([...categorias, newCategoria]);
      toast.success('Categoría creada exitosamente');
    }
    setDialogOpen(false);
    setFormData({ name: '', description: '' });
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (field === 'name') {
      const err = validateField('nombre', value);
      if (err) setFormErrors({ ...formErrors, name: err });
      else {
        const { name: _n, ...rest } = formErrors;
        setFormErrors(rest);
      }
      return;
    }

    if (field === 'description') {
      const err = validateField('name', value);
      if (err) setFormErrors({ ...formErrors, description: err });
      else {
        const { description: _d, ...rest } = formErrors;
        setFormErrors(rest);
      }
      return;
    }
  };

  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'productCount', label: 'Productos Asociados' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="tracking-tight text-2xl font-bold">Categorías</h2>
          <p className="text-gray-500">Gestión de categorías de productos</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Categoría
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar categorías..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid view of categories (cards) with actions incl. Delete */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCategorias.map((categoria) => (
          <div key={categoria.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-600">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7h18M3 12h18M3 17h18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{categoria.name}</div>
                  </div>
                </div>
                <div>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      // toggle status: activate immediately if inactive, otherwise confirm
                      if (categoria.status === 'Inactivo') {
                        setCategorias(prev => prev.map(c => c.id === categoria.id ? { ...c, status: 'Activo' } : c));
                        toast.success('Categoría activada');
                        try { localStorage.setItem('damabella_categorias', JSON.stringify(categorias.map(c => c.id === categoria.id ? { ...c, status: 'Activo' } : c))); } catch(e){}
                      } else {
                        // open browser confirm to keep changes minimal
                        const ok = confirm(`¿Estás seguro de inactivar la categoría "${categoria.name}"?`);
                        if (ok) {
                          setCategorias(prev => prev.map(c => c.id === categoria.id ? { ...c, status: 'Inactivo' } : c));
                          toast.success('Categoría inactivada');
                          try { localStorage.setItem('damabella_categorias', JSON.stringify(categorias.map(c => c.id === categoria.id ? { ...c, status: 'Inactivo' } : c))); } catch(e){}
                        }
                      }
                    }}
                    aria-pressed={categoria.status !== 'Inactivo'}
                    title={categoria.status === 'Inactivo' ? 'Activar categoría' : 'Inactivar categoría'}
                    className={`relative w-12 h-6 rounded-full transition-colors ${categoria.status === 'Activo' ? 'bg-green-500' : 'bg-gray-400'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${categoria.status === 'Activo' ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm text-gray-500">Productos</div>
                <div className="mt-2 inline-flex items-center gap-2">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">{categoria.productCount}</div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 p-3 flex items-center justify-between">
              <div className={`text-sm ${categoria.status === 'Activo' ? 'text-green-600' : 'text-gray-600'}`}>{categoria.status === 'Activo' ? 'Activa' : 'Inactiva'}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(categoria)} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Editar">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20h9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                {canDelete && (
                  <button
                    onClick={() => {
                      try {
                        const productosRaw = localStorage.getItem('damabella_productos');
                        const productos = productosRaw ? JSON.parse(productosRaw) : [];
                        const hasProducts = productos.some((p: any) => String(p.categoria) === String(categoria.name));
                        if (hasProducts) {
                          toast.error('No se puede eliminar la categoría porque tiene productos asociados');
                          return;
                        }
                        if (confirm(`¿Estás seguro de eliminar la categoría "${categoria.name}"?`)) {
                          setCategorias(prev => prev.filter(c => c.id !== categoria.id));
                          try { localStorage.setItem('damabella_categorias', JSON.stringify(categorias.filter(c => c.id !== categoria.id))); } catch(e){}
                          toast.success('Categoría eliminada');
                        }
                      } catch (e) {
                        console.error('Error comprobando productos asociados:', e);
                        toast.error('Error comprobando productos asociados');
                      }
                    }}
                    className="p-2 hover:bg-red-50 rounded text-red-600"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11v6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {editMode ? 'Actualiza los detalles de la categoría' : 'Crea una nueva categoría para el catálogo'}
          </DialogDescription>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la categoría</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleFieldChange('name', e.target.value)}
                  placeholder="Ej: Vestidos Largos"
                  className={formData.name && !formErrors.name ? 'border-green-500' : formErrors.name ? 'border-red-500' : ''}
                  required
                />
                {formErrors.name && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-600 text-sm">{formErrors.name}</p>
                  </div>
                )}
                {formData.name && !formErrors.name && <p className="text-green-600 text-xs">✓ Nombre válido</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => handleFieldChange('description', e.target.value)}
                  placeholder="Describe esta categoría..."
                  rows={3}
                  className={formData.description && !formErrors.description ? 'border-green-500' : formErrors.description ? 'border-red-500' : ''}
                  required
                />
                {formErrors.description && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-600 text-sm">{formErrors.description}</p>
                  </div>
                )}
                {formData.description && !formErrors.description && <p className="text-green-600 text-xs">✓ Descripción válida</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editMode ? 'Actualizar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
