import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Package, Search, FolderTree, AlertTriangle, Eye, Grid3x3, List } from 'lucide-react';
import { Button, Input, Modal, useToast } from '../../../../shared/components/native';
import { usePermissions } from '../../../../shared/hooks/usePermissions';

const STORAGE_KEY = 'damabella_categorias';
const PRODUCTOS_KEY = 'damabella_productos';
const DISABLED_PRODUCTS_KEY = 'damabella_disabled_products_by_category';

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

  const [disabledProductsByCategory, setDisabledProductsByCategory] = useState(() => {
    const stored = localStorage.getItem(DISABLED_PRODUCTS_KEY);
    return stored ? JSON.parse(stored) : {};
  });
  
  const { showToast } = useToast();
  const { hasPermission, getModulePermissions } = usePermissions();
  
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showInactiveConfirmModal, setShowInactiveConfirmModal] = useState(false);
  const [showActiveConfirmModal, setShowActiveConfirmModal] = useState(false);
  const [categoryToToggle, setCategoryToToggle] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const itemsPerPage = 10;
  // 🔐 PERMISOS - Usar el hook usePermissions
  const permisos = getModulePermissions('Categorias');
  const canViewCategorias = permisos.canView;
  const canCreateCategorias = permisos.canCreate;
  const canEditCategorias = permisos.canEdit;

  // 🔄 ESCUCHAR CAMBIOS EN ROLES DESDE OTROS MÓDULOS/TABS
  useEffect(() => {
    console.log(`📋 [CategoriasManager] Permisos del usuario:`, {
      canViewCategorias,
      canCreateCategorias,
      canEditCategorias,
    });

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'damabella_roles') {
        console.log('🔄 [CategoriasManager] Roles actualizados en otro tab/módulo, recalculando permisos');
        // Force re-render para recalcular permisos
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [canViewCategorias, canCreateCategorias, canEditCategorias]);

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

const getProductosDeCategoria = (categoriaName: string) => {
  return productos.filter((p: any) => 
    p.categoria === categoriaName && p.activo === true
  );
};

const handleViewProducts = (category: any) => {
  setSelectedCategory(category);
  setShowProductsModal(true);
};


  const handleFieldChange = (field: string, value: string) => {
    let processedValue = value;
    
    // Validación de caracteres especiales en el nombre - permite Ñ y acentos
    if (field === 'name') {
      // Permite letras (incluyendo acentos y Ñ), números y espacios
      processedValue = value.split('').filter(char => /^[a-zA-ZñÑáéíóúàèìòùäëïöüâêîôûãõ0-9\s\-]$/.test(char)).join('');
    }
    
    setFormData({ ...formData, [field]: processedValue });
    
    // Validación en tiempo real
    const errors: any = {};
    if (field === 'name') {
      if (!processedValue.trim()) {
        errors.name = 'El nombre de la categoría es requerido';
      }
    }
    setFormErrors({ ...formErrors, ...errors });
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setFormErrors({ name: '' });
    setShowModal(true);
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({ 
      name: category.name, 
      description: category.description
    });
    setFormErrors({ name: '' });
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
      showToast(`✅ Categoría "${formData.name}" actualizada correctamente`, 'success');
    } else {
      setCategories([...categories, { 
        id: Date.now(), 
        ...formData, 
        active: true, 
        productos: 0 
      }]);
      showToast(`✅ Categoría "${formData.name}" creada correctamente`, 'success');
    }
    setShowModal(false);
  };

  const toggleActive = (id: number) => {
    const category = categories.find((c: any) => c.id === id);
    
    // Si está activa y queremos desactivarla, mostrar modal de confirmación
    if (category && category.active) {
      setCategoryToToggle(category);
      setShowInactiveConfirmModal(true);
    } else if (category && !category.active) {
      // Si está inactiva, mostrar modal de confirmación para activarla
      setCategoryToToggle(category);
      setShowActiveConfirmModal(true);
    }
  };

  const confirmToggleActive = () => {
    if (categoryToToggle) {
      const categoryName = categoryToToggle.name;
      
      // Activar la categoría
      setCategories(categories.map((c: any) => 
        c.id === categoryToToggle.id ? { ...c, active: true } : c
      ));
      
      // Reactivar productos que fueron desactivados por esta categoría
      if (disabledProductsByCategory[categoryName]) {
        const productosReactivados = productos.map((p: any) => {
          if (disabledProductsByCategory[categoryName].includes(p.id)) {
            return { ...p, activo: true };
          }
          return p;
        });
        setProductos(productosReactivados);
        localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosReactivados));
        
        // Limpiar el historial
        const newDisabledProducts = { ...disabledProductsByCategory };
        delete newDisabledProducts[categoryName];
        setDisabledProductsByCategory(newDisabledProducts);
        localStorage.setItem(DISABLED_PRODUCTS_KEY, JSON.stringify(newDisabledProducts));
        
        console.log(`✅ Categoría "${categoryName}" activada. Se reactivaron ${disabledProductsByCategory[categoryName].length} producto(s)`);
      } else {
        console.log(`✅ Categoría "${categoryName}" activada (sin productos desactivados)`);
      }
    }
    setShowActiveConfirmModal(false);
    setCategoryToToggle(null);
  };

  const confirmToggleInactive = () => {
    if (categoryToToggle) {
      const categoryName = categoryToToggle.name;
      
      // Desactivar la categoría
      setCategories(categories.map((c: any) => 
        c.id === categoryToToggle.id ? { ...c, active: false } : c
      ));
      
      // Desactivar todos los productos relacionados con esta categoría
      const productsToDisable: any[] = [];
      const productosActualizados = productos.map((p: any) => {
        if (p.categoria === categoryName) {
          productsToDisable.push(p.id);
          return { ...p, activo: false };
        }
        return p;
      });
      
      // Guardar el historial de productos desactivados por esta categoría
      const newDisabledProducts = { ...disabledProductsByCategory };
      newDisabledProducts[categoryName] = productsToDisable;
      setDisabledProductsByCategory(newDisabledProducts);
      localStorage.setItem(DISABLED_PRODUCTS_KEY, JSON.stringify(newDisabledProducts));
      
      // Guardar productos actualizados
      setProductos(productosActualizados);
      localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosActualizados));
      
      console.log(`⏸️ Categoría "${categoryName}" desactivada. Se guardaron ${productsToDisable.length} producto(s) para futura reactivación`);
    }
    setShowInactiveConfirmModal(false);
    setCategoryToToggle(null);
  };

  const filteredCategories = categories.filter((c: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      c.id.toString().includes(searchTerm) ||
      (c.name?.toLowerCase() ?? '').includes(searchLower) ||
      (c.description?.toLowerCase() ?? '').includes(searchLower) ||
      (c.active ? 'activa' : 'inactiva').includes(searchLower)
    );
  });

  // Aplicar paginación
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

  // Resetear página si el término de búsqueda cambia
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Categorías de Productos</h2>
          <p className="text-gray-600">Gestiona las categorías: Vestidos Largos, Vestidos Cortos, Sets y Enterizos</p>
        </div>
        <Button 
          onClick={handleCreate} 
          variant="primary"
          disabled={!canCreateCategorias}
          title={!canCreateCategorias ? 'No tienes permiso para crear categorías' : ''}
        >
          <Plus size={20} />
          Nueva Categoría
        </Button>
      </div>

      {/* Search and View Mode */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder='Buscar por nombre, descripción o escribe "activa" / "inactiva"'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Vista de cuadrícula"
              >
                <Grid3x3 size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Vista de lista"
              >
                <List size={20} />
              </button>
            </div>
          </div>
          
          {/* Filtros rápidos */}
          <div className="flex gap-2">
            <button
              onClick={() => setSearchTerm('activa')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                searchTerm === 'activa'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
              }`}
            >
              ✓ Activas
            </button>
            <button
              onClick={() => setSearchTerm('inactiva')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                searchTerm === 'inactiva'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              ✗ Inactivas
            </button>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors ml-auto"
              >
                Limpiar filtro
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categories Grid/List */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-16 text-center">
          <Package className="mx-auto mb-4 text-gray-300" size={64} />
          <h3 className="text-gray-900 text-xl mb-2">No se encontraron categorías</h3>
          <p className="text-gray-600">Intenta con otro término de búsqueda</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            // VISTA GRID
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedCategories.map((category: any) => (
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
                      <button
                        onClick={() => handleViewProducts(category)}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                        title="Ver productos"
                      >
                        <Package size={16} />
                        <span className="font-semibold">{getProductosPorCategoria(category.name)}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${category.active ? 'text-green-600' : 'text-gray-400'}`}>
                        {category.active ? 'Activa' : 'Inactiva'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewProducts(category)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          title="Ver productos"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(category)}
                          disabled={!canEditCategorias}
                          className={`p-2 rounded-lg transition-colors ${
                            canEditCategorias
                              ? 'hover:bg-white text-gray-600'
                              : 'opacity-50 cursor-not-allowed text-gray-400'
                          }`}
                          title={!canEditCategorias ? 'No tienes permiso para editar' : 'Editar'}
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // VISTA LIST
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nombre</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Descripción</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Productos</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Estado</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCategories.map((category: any, idx: number) => (
                      <tr key={category.id} className={idx !== paginatedCategories.length - 1 ? 'border-b border-gray-200' : ''}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{category.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{category.description}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleViewProducts(category)}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors text-sm font-medium"
                          >
                            <Package size={14} />
                            {getProductosPorCategoria(category.name)}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                            category.active
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-300'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${category.active ? 'bg-green-600' : 'bg-gray-400'}`}></span>
                            {category.active ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleViewProducts(category)}
                              className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                              title="Ver productos"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEdit(category)}
                              disabled={!canEditCategorias}
                              className={`p-2 rounded-lg transition-colors ${
                                canEditCategorias
                                  ? 'hover:bg-gray-100 text-gray-600'
                                  : 'opacity-50 cursor-not-allowed text-gray-400'
                              }`}
                              title={!canEditCategorias ? 'No tienes permiso para editar' : 'Editar'}
                            >
                              <Edit2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pb-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>

              <span className="ml-4 text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
            </div>
          )}
        </>
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

      {/* Modal View Products by Category */}
      <Modal
        isOpen={showProductsModal}
        onClose={() => {
          setShowProductsModal(false);
          setSelectedCategory(null);
        }}
        title={`Productos de ${selectedCategory?.name}`}
      >
        <div className="space-y-4">
          {selectedCategory && (
            <>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700">{selectedCategory.description}</p>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {getProductosDeCategoria(selectedCategory.name).length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="mx-auto mb-2 text-gray-400" size={48} />
                    <p className="text-gray-600">No hay productos en esta categoría</p>
                  </div>
                ) : (
                  getProductosDeCategoria(selectedCategory.name).map((producto: any, idx: number) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{producto.nombre}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Proveedor: <span className="font-medium">{producto.proveedor}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Precio Venta: <span className="font-semibold text-green-600">
                              ${Number(producto.precioVenta).toLocaleString('es-CO')}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200">
                            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                            <span className="text-xs font-medium text-green-700">Activo</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowProductsModal(false)} variant="secondary">
                  Cerrar
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal Confirmation - Inactivate Category */}
      <Modal
        isOpen={showInactiveConfirmModal}
        onClose={() => {
          setShowInactiveConfirmModal(false);
          setCategoryToToggle(null);
        }}
        title="Confirmar Desactivación"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-gray-700 mb-2">
              ¿Está seguro de que desea desactivar la categoría <strong>{categoryToToggle?.name}</strong>?
            </p>
            <p className="text-yellow-800 font-semibold text-sm mb-2">
              ⚠️ Se desactivarán {getProductosPorCategoria(categoryToToggle?.name || '')} producto(s) relacionado(s)
            </p>
            <p className="text-gray-600 text-sm">
              Esta categoría y sus productos no serán visibles en el catálogo. Puede reactivarlos en cualquier momento.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              onClick={() => {
                setShowInactiveConfirmModal(false);
                setCategoryToToggle(null);
              }} 
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button onClick={confirmToggleInactive} variant="primary">
              Desactivar Categoría y Productos
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmation - Activate Category */}
      <Modal
        isOpen={showActiveConfirmModal}
        onClose={() => {
          setShowActiveConfirmModal(false);
          setCategoryToToggle(null);
        }}
        title="Confirmar Activación"
      >
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-gray-700 mb-2">
              ¿Está seguro de que desea activar la categoría <strong>{categoryToToggle?.name}</strong>?
            </p>
            <p className="text-green-800 font-semibold text-sm mb-2">
              ✅ Se activarán {disabledProductsByCategory[categoryToToggle?.name]?.length || 0} producto(s) relacionado(s)
            </p>
            <p className="text-gray-600 text-sm">
              Esta categoría y sus productos volverán a ser visibles en el catálogo.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              onClick={() => {
                setShowActiveConfirmModal(false);
                setCategoryToToggle(null);
              }} 
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button onClick={confirmToggleActive} variant="primary" className="bg-green-600 hover:bg-green-700">
              Activar Categoría y Productos
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
