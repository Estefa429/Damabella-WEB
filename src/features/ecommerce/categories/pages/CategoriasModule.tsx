import React, { useState, useEffect } from 'react';
import { User, Category } from '../../../../shared/types';
import { DataTable } from '../../../../components/ui/DataTable';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Textarea } from '../../../../components/ui/textarea';
import { Plus, Search } from 'lucide-react';
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
    setDialogOpen(true);
  };

  const handleEdit = (categoria: Category) => {
    setEditMode(true);
    setSelectedCategoria(categoria);
    setFormData({ name: categoria.name, description: categoria.description || '' });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

      <DataTable
        data={filteredCategorias}
        columns={columns}
        onEdit={handleEdit}
        onDelete={canDelete ? (categoria) => {
          setCategorias(categorias.filter(c => c.id !== categoria.id));
          toast.success('Categoría eliminada');
        } : undefined}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la categoría</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
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
