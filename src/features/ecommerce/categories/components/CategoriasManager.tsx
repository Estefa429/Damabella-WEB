import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Package, Search, FolderTree, AlertTriangle, Eye, Grid3x3, List, Trash2, Loader } from 'lucide-react';
import { Button, Input, Modal, useToast } from '../../../../shared/components/native';
import { usePermissions } from '../../../../shared/hooks/usePermissions';
import { 
  getAllCategories, 
  createCategories, 
  updateCategories, 
  deleteCategories, 
  patchState, 
  searchCategories,
  Categories 
} from '../services/categoriesService';

export default function CategoriasManager() {
  // Estado de datos
  const [categories, setCategories] = useState<Categories[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Hooks
  const { showToast } = useToast();
  const { hasPermission, getModulePermissions } = usePermissions();

  // Ref para el debounce del buscador
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Estado de UI - Modales
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categories | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showInactiveConfirmModal, setShowInactiveConfirmModal] = useState(false);
  const [showActiveConfirmModal, setShowActiveConfirmModal] = useState(false);
  const [categoryToToggle, setCategoryToToggle] = useState<Categories | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Categories | null>(null);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Categories | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const itemsPerPage = 10;

  // 🔐 PERMISOS - Usar el hook usePermissions
  const permisos = getModulePermissions('Categorias');
  const canViewCategorias = permisos.canView;
  const canCreateCategorias = permisos.canCreate;
  const canEditCategorias = permisos.canEdit;
  const canDeleteCategorias = hasPermission('Categorias', 'delete');

  // 📥 CARGAR CATEGORÍAS AL MONTAR COMPONENTE
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllCategories();
      if (data) {
        const normalized = data.map((cat) => ({
          ...cat,
          active: cat.is_active
        }));
        setCategories(normalized);
      } else {
        showToast('Error al cargar las categorías', 'error');
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
      showToast('Error al cargar las categorías', 'error');
    } finally {
      setLoading(false);
    }
  };

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
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [canViewCategorias, canCreateCategorias, canEditCategorias]);

  const getProductosPorCategoria = (categoryId: number) => {
    return 0;
  };

  const handleViewProducts = (category: Categories) => {
    setSelectedCategory(category);
    setShowProductsModal(true);
  };

  // Validación de entrada en formulario
  const handleFieldChange = (field: string, value: string) => {
    let processedValue = value;
    
    if (field === 'name') {
      processedValue = value.split('').filter(char => /^[a-zA-ZñÑáéíóúàèìòùäëïöüâêîôûãõ0-9\s\-]$/.test(char)).join('');
    }
    
    setFormData({ ...formData, [field]: processedValue });
    
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
    setFormErrors({});
    setShowModal(true);
  };

  const handleEdit = (category: Categories) => {
    setEditingCategory(category);
    setFormData({ 
      name: category.name, 
      description: category.description
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    const errors: any = {};
    if (!formData.name.trim()) {
      errors.name = 'El nombre de la categoría es requerido';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setActionLoading(true);
      
      if (editingCategory) {
        const response = await updateCategories(editingCategory.id_category, {
          name: formData.name,
          description: formData.description
        });
        
        if (response) {
          const normalized = { ...response, active: response.is_active };
          setCategories(categories.map(c => 
            c.id_category === editingCategory.id_category ? normalized : c
          ));
          showToast(`✅ Categoría "${formData.name}" actualizada correctamente`, 'success');
        } else {
          showToast('Error al actualizar la categoría', 'error');
          setActionLoading(false);
          return;
        }
      } else {
        const response = await createCategories({
          name: formData.name,
          description: formData.description
        });
        
        if (response) {
          const normalized = { ...response, active: response.is_active };
          setCategories([...categories, normalized]);
          showToast(`✅ Categoría "${formData.name}" creada correctamente`, 'success');
        } else {
          showToast('Error al crear la categoría', 'error');
          setActionLoading(false);
          return;
        }
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      showToast('Error al guardar la categoría', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleActive = (id_category: number) => {
    const category = categories.find((c) => c.id_category === id_category);
    
    if (category) {
      if (category.is_active) {
        setCategoryToToggle(category);
        setShowInactiveConfirmModal(true);
      } else {
        setCategoryToToggle(category);
        setShowActiveConfirmModal(true);
      }
    }
  };

  const confirmToggleInactive = async () => {
    if (!categoryToToggle) return;

    try {
      setActionLoading(true);
      const response = await patchState(categoryToToggle.id_category, false);
      
      if (response) {
        const normalized = { ...response, active: response.is_active };
        setCategories(categories.map((c) =>
          c.id_category === categoryToToggle.id_category ? normalized : c
        ));
        showToast(`⏸️ Categoría "${categoryToToggle.name}" desactivada correctamente`, 'success');
      } else {
        showToast('Error al desactivar la categoría', 'error');
      }
    } catch (error) {
      console.error('Error desactivando categoría:', error);
      showToast('Error al desactivar la categoría', 'error');
    } finally {
      setActionLoading(false);
      setShowInactiveConfirmModal(false);
      setCategoryToToggle(null);
    }
  };

  const confirmToggleActive = async () => {
    if (!categoryToToggle) return;

    try {
      setActionLoading(true);
      const response = await patchState(categoryToToggle.id_category, true);
      
      if (response) {
        const normalized = { ...response, active: response.is_active };
        setCategories(categories.map((c) =>
          c.id_category === categoryToToggle.id_category ? normalized : c
        ));
        showToast(`✅ Categoría "${categoryToToggle.name}" activada correctamente`, 'success');
      } else {
        showToast('Error al activar la categoría', 'error');
      }
    } catch (error) {
      console.error('Error activando categoría:', error);
      showToast('Error al activar la categoría', 'error');
    } finally {
      setActionLoading(false);
      setShowActiveConfirmModal(false);
      setCategoryToToggle(null);
    }
  };

  const handleDeleteCategory = (id_category: number) => {
    const categoria = categories.find((c) => c.id_category === id_category);
    if (categoria) {
      setCategoryToDelete(categoria);
      setShowDeleteConfirmModal(true);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    const idAEliminar = categoryToDelete.id_category;
    const nombreAEliminar = categoryToDelete.name;

    // Cierra el modal y limpia la referencia inmediatamente
    setShowDeleteConfirmModal(false);
    setCategoryToDelete(null);

    // Elimina del estado local de forma optimista
    setCategories(prev => prev.filter((c) => c.id_category !== idAEliminar));

    try {
      setActionLoading(true);
      const success = await deleteCategories(idAEliminar);
      
      if (success) {
        showToast('✅ Categoría eliminada correctamente', 'success');
      } else {
        // Si falla, restaura recargando desde la API
        showToast('No se puede eliminar la categoría (posiblemente tiene productos asociados)', 'error');
        await loadCategories();
      }
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      showToast('Error al eliminar la categoría', 'error');
      await loadCategories();
    } finally {
      setActionLoading(false);
    }
  };

  // ─── BÚSQUEDA CON DEBOUNCE ────────────────────────────────────────────────────
  // El input NUNCA se deshabilita. El debounce evita llamadas excesivas a la API.
  // searchLoading solo controla el spinner, no el estado del input.
  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setCurrentPage(1);

    // Cancelar el timer anterior si el usuario sigue escribiendo
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!query.trim()) {
      // Si limpia el campo, cargar todo sin esperar debounce
      loadCategories();
      return;
    }

    // Esperar 350ms desde la última tecla antes de llamar a la API
    searchDebounceRef.current = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const results = await searchCategories({ name: query });

        if (results) {
          const normalized = results.map((cat) => ({
            ...cat,
            active: cat.is_active
          }));
          setCategories(normalized);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error('Error en búsqueda:', error);
        showToast('Error en la búsqueda', 'error');
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  };

  // Limpiar el timer al desmontar el componente
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // FILTRAR CATEGORÍAS (LOCAL)
  const filteredCategories = categories.filter((c) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (c.id_category?.toString() ?? '').includes(searchTerm) ||
      (c.name?.toLowerCase() ?? '').includes(searchLower) ||
      (c.description?.toLowerCase() ?? '').includes(searchLower) ||
      (c.is_active ? 'activa' : 'inactiva').includes(searchLower)
    );
  });

  // Paginación
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Categorías de Productos</h2>
          <p className="text-gray-600">Gestiona las categorías de productos disponibles</p>
        </div>
        <Button 
          onClick={handleCreate} 
          variant="primary"
          disabled={!canCreateCategorias || actionLoading}
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
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                // ✅ Sin disabled — el input NUNCA pierde el foco
              />
              {/* El spinner flota sobre el input sin afectar su estado */}
              {searchLoading && (
                <Loader className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={20} />
              )}
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
              onClick={() => handleSearch('activa')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                searchTerm === 'activa'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
              }`}
            >
              ✓ Activas
            </button>
            <button
              onClick={() => handleSearch('inactiva')}
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
                onClick={() => handleSearch('')}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedCategories.map((category) => (
                <div 
                  key={category.id_category} 
                  className="bg-gray-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200"
                >
                  <div className="bg-white p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <FolderTree size={28} className="text-gray-600" />
                      </div>
                      <button
                        onClick={() => toggleActive(category.id_category)}
                        disabled={actionLoading}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          category.is_active ? 'bg-green-500' : 'bg-gray-400'
                        } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={category.is_active ? 'Desactivar' : 'Activar'}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                          category.is_active ? 'translate-x-7' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    <h3 className="text-gray-900 text-xl">{category.name}</h3>
                  </div>

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
                        <span className="font-semibold">{getProductosPorCategoria(category.id_category)}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${category.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                        {category.is_active ? 'Activa' : 'Inactiva'}
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
                          disabled={!canEditCategorias || actionLoading}
                          className={`p-2 rounded-lg transition-colors ${
                            canEditCategorias && !actionLoading
                              ? 'hover:bg-white text-gray-600'
                              : 'opacity-50 cursor-not-allowed text-gray-400'
                          }`}
                          title={!canEditCategorias ? 'No tienes permiso para editar' : 'Editar'}
                        >
                          <Edit2 size={18} />
                        </button>
                        {canDeleteCategorias && (
                          <button
                            onClick={() => handleDeleteCategory(category.id_category)}
                            disabled={actionLoading}
                            className={`p-2 rounded-lg transition-colors text-red-600 ${
                              actionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'
                            }`}
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
                    {paginatedCategories.map((category, idx) => (
                      <tr key={category.id_category} className={idx !== paginatedCategories.length - 1 ? 'border-b border-gray-200' : ''}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{category.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{category.description}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleViewProducts(category)}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors text-sm font-medium"
                          >
                            <Package size={14} />
                            {getProductosPorCategoria(category.id_category)}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleActive(category.id_category)}
                            disabled={actionLoading}
                            className={`relative w-14 h-7 rounded-full transition-colors ${
                              category.is_active ? 'bg-green-500' : 'bg-gray-400'
                            } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={category.is_active ? 'Desactivar categoría' : 'Activar categoría'}
                          >
                            <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                              category.is_active ? 'translate-x-7' : 'translate-x-0'
                            }`} />
                          </button>
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
                              disabled={!canEditCategorias || actionLoading}
                              className={`p-2 rounded-lg transition-colors ${
                                canEditCategorias && !actionLoading
                                  ? 'hover:bg-gray-100 text-gray-600'
                                  : 'opacity-50 cursor-not-allowed text-gray-400'
                              }`}
                              title={!canEditCategorias ? 'No tienes permiso para editar' : 'Editar'}
                            >
                              <Edit2 size={18} />
                            </button>
                            {canDeleteCategorias && (
                              <button
                                onClick={() => handleDeleteCategory(category.id_category)}
                                disabled={actionLoading}
                                className={`p-2 rounded-lg transition-colors text-red-600 ${
                                  actionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'
                                }`}
                                title="Eliminar"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
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

      {/* Modal Create/Edit */}
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
              disabled={actionLoading}
            />
            {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              rows={3}
              placeholder="Describe esta categoría"
              disabled={actionLoading}
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              onClick={() => setShowModal(false)} 
              variant="secondary"
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              variant="primary"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  {editingCategory ? 'Guardando...' : 'Creando...'}
                </>
              ) : (
                editingCategory ? 'Guardar Cambios' : 'Crear Categoría'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmation - Delete Category */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={() => {
          setShowDeleteConfirmModal(false);
          setCategoryToDelete(null);
        }}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-gray-700 mb-2">
              ¿Estás seguro de que deseas eliminar la categoría <strong>{categoryToDelete?.name}</strong>?
            </p>
            <p className="text-red-800 font-semibold text-sm mb-2">
              ⚠️ Esta acción es irreversible y eliminará la categoría.
            </p>
            <p className="text-gray-600 text-sm">
              Antes de eliminar se verifica que no existan productos asociados. Si no hay productos, la categoría será eliminada permanentemente.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setCategoryToDelete(null);
              }} 
              variant="secondary"
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmDeleteCategory} 
              variant="primary" 
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar Categoría'
              )}
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
                <div className="text-center py-8">
                  <Package className="mx-auto mb-2 text-gray-400" size={48} />
                  <p className="text-gray-600">
                    Conecte el servicio de productos para ver los productos de esta categoría
                  </p>
                </div>
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
              ⚠️ Esta categoría no será visible en el catálogo
            </p>
            <p className="text-gray-600 text-sm">
              Puede reactivarla en cualquier momento.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              onClick={() => {
                setShowInactiveConfirmModal(false);
                setCategoryToToggle(null);
              }} 
              variant="secondary"
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmToggleInactive} 
              variant="primary"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Desactivando...
                </>
              ) : (
                'Desactivar Categoría'
              )}
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
              ✅ La categoría volverá a estar visible en el catálogo
            </p>
            <p className="text-gray-600 text-sm">
              Todos los productos asociados también serán visibles.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              onClick={() => {
                setShowActiveConfirmModal(false);
                setCategoryToToggle(null);
              }} 
              variant="secondary"
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmToggleActive} 
              variant="primary" 
              className="bg-green-600 hover:bg-green-700"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Activando...
                </>
              ) : (
                'Activar Categoría'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
