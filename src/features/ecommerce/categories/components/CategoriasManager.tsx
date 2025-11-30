import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Search, FolderTree } from 'lucide-react';
import { Button, Input, Modal } from '../../../../shared/components/native';

const STORAGE_KEY = 'damabella_categorias';
const PRODUCTOS_KEY = 'damabella_productos';

const categoriasIniciales = [
  { id: 1, name: 'Vestidos Largos', description: 'Vestidos elegantes de largo completo', active: true },
  { id: 2, name: 'Vestidos Cortos', description: 'Vestidos casuales y formales cortos', active: true },
  { id: 3, name: 'Sets', description: 'Conjuntos de dos piezas', active: true },
  { id: 4, name: 'Enterizos', description: 'Prendas de una sola pieza', active: true }
];

export default function CategoriasManager() {
  const [categories, setCategories] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Normalizar campos de español a inglés si es necesario
      return parsed.map((cat: any) => ({
        id: cat.id,
        name: cat.name || cat.nombre,
        description: cat.description || cat.descripcion,
        active: cat.active !== undefined ? cat.active : cat.activo
      }));
    }
    return categoriasIniciales;
  });

  const [productos, setProductos] = useState(() => {
    const stored = localStorage.getItem(PRODUCTOS_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  // Recargar productos cuando cambian
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(PRODUCTOS_KEY);
      if (stored) setProductos(JSON.parse(stored));
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

 const getProductosPorCategoria = (categoriaName: string) => {
  return productos.filter((p: any) => 
    p.categoria === categoriaName && p.activo === true
  ).length;
};


  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Validación en tiempo real
    const errors: any = {};
    if (field === 'name') {
      if (!value.trim()) {
        errors.name = 'El nombre de la categoría es requerido';
      }
    }
    setFormErrors({ ...formErrors, ...errors });
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({ 
      name: category.name, 
      description: category.description
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = () => {
    const errors: any = {};
    if (!formData.name.trim()) {
      errors.name = 'El nombre de la categoría es requerido';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingCategory) {
      setCategories(categories.map((c: any) => 
        c.id === editingCategory.id ? { ...c, ...formData } : c
      ));
    } else {
      setCategories([...categories, { 
        id: Date.now(), 
        ...formData, 
        active: true, 
        productos: 0 
      }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de eliminar esta categoría?')) {
      setCategories(categories.filter((c: any) => c.id !== id));
    }
  };

  const toggleActive = (id: number) => {
    setCategories(categories.map((c: any) => 
      c.id === id ? { ...c, active: !c.active } : c
    ));
  };

  const filteredCategories = categories.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Categorías de Productos</h2>
          <p className="text-gray-600">Gestiona las categorías: Vestidos Largos, Vestidos Cortos, Sets y Enterizos</p>
        </div>
        <Button onClick={handleCreate} variant="primary">
          <Plus size={20} />
          Nueva Categoría
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-16 text-center">
          <Package className="mx-auto mb-4 text-gray-300" size={64} />
          <h3 className="text-gray-900 text-xl mb-2">No se encontraron categorías</h3>
          <p className="text-gray-600">Intenta con otro término de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category: any) => (
            <div 
              key={category.id} 
              className="bg-gray-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200"
            >
              {/* Header sin gradiente */}
              <div className="bg-white p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <FolderTree size={28} className="text-gray-600" />
                  </div>
                  {/* Switch ON/OFF */}
                  <button
                    onClick={() => toggleActive(category.id)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      category.active ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                      category.active ? 'translate-x-7' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                <h3 className="text-gray-900 text-xl">{category.name}</h3>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-gray-600 mb-4 min-h-[3rem]">{category.description}</p>
                
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <span className="text-gray-500 text-sm">Productos</span>
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white text-gray-700 border border-gray-200">
                    {getProductosPorCategoria(category.name)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${category.active ? 'text-green-600' : 'text-gray-400'}`}>
                    {category.active ? 'Activa' : 'Inactiva'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create/Edit - NEUTRAL */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Nombre de la Categoría *</label>
            <Input
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Ej: Vestidos Largos"
              required
            />
            {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows={3}
              placeholder="Describe esta categoría"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button onClick={() => setShowModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="primary">
              {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
