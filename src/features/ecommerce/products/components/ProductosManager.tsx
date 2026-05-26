import React, { useState, useEffect, useCallback } from 'react';
import { Search, Package, Eye, Edit2, Trash2, Download, AlertCircle, Plus, Grid3x3, List } from 'lucide-react';
import { Button, Input, Modal } from '../../../../shared/components/native';
import { useToast } from '../../../../shared/components/native';

// ─── Services ─────────────────────────────────────────────────────────────────
import {
  getAllProducts,
  getAllInventory,
  updateProduct,
  patchProductState,
  deleteProduct,
  createProduct,
  createProductWithVariant,
  createVariant,
  getAllColors,
  getAllSizes,
  createColor,
  createSize,
  Product,
  Inventory,
  Color,
  Size,
} from '@/features/ecommerce/products/services/productsService';
import { getAllVariants, VariantProduct } from '@/features/purchases/services/PurchasesService';
import { getAllCategories, Categories } from '@/features/ecommerce/categories/services/categoriesService';

// ─── Utils ────────────────────────────────────────────────────────────────────
const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProductosManager() {
  const { showToast } = useToast();

  // ─── Data ────────────────────────────────────────────────────────────────────
  const [products,   setProducts]   = useState<Product[]>([]);
  const [variants,   setVariants]   = useState<VariantProduct[]>([]);
  const [inventory,  setInventory]  = useState<Inventory[]>([]);
  const [categories, setCategories] = useState<Categories[]>([]);
  const [colors,     setColors]     = useState<Color[]>([]);
  const [sizes,      setSizes]      = useState<Size[]>([]);
  const [loading,    setLoading]    = useState(true);

  // ─── UI ──────────────────────────────────────────────────────────────────────
  const [searchTerm,  setSearchTerm]  = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode,    setViewMode]    = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('productos_viewMode');
    return (saved as 'grid' | 'list') || 'grid';
  });
  const itemsPerPage = 12;

  // 💾 Guardar preferencia de vista en localStorage
  useEffect(() => {
    localStorage.setItem('productos_viewMode', viewMode);
  }, [viewMode]);

  // ─── Modals ──────────────────────────────────────────────────────────────────
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal,   setShowEditModal]   = useState(false);
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [viewingProduct,  setViewingProduct]  = useState<Product | null>(null);
  const [editingProduct,  setEditingProduct]  = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isSubmitting,    setIsSubmitting]    = useState(false);

  // ─── Edit form ───────────────────────────────────────────────────────────────
  const [editName,     setEditName]     = useState('');
  const [editPrice,    setEditPrice]    = useState('');
  const [editCategory, setEditCategory] = useState<number | null>(null);
  const [editErrors,   setEditErrors]   = useState<Record<string, string>>({});
  const [editPurchasePrice, setEditPurchasePrice] = useState('');

  // ─── Add form ─────────────────────────────────────────────────────────────────
  const [addName,     setAddName]     = useState('');
  const [addPrice,    setAddPrice]    = useState('');
  const [addCategory, setAddCategory] = useState<number | null>(null);
  const [addErrors,   setAddErrors]   = useState<Record<string, string>>({});
  const [addPurchasePrice, setAddPurchasePrice] = useState('');
  const [addImage, setAddImage] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState<string>('');
  const [addStock, setAddStock] = useState('');
  const [addColorId, setAddColorId] = useState<number | null>(null);
  const [addSizeId, setAddSizeId] = useState<number | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [addSku, setAddSku] = useState('');

  // Estados para crear nueva talla/color
  const [isCreatingNewColor, setIsCreatingNewColor] = useState(false);
  const [isCreatingNewSize, setIsCreatingNewSize] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newSizeName, setNewSizeName] = useState('');

  // ─── Load data ───────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, vars, inv, cats, cols, szs] = await Promise.all([
        getAllProducts(),
        getAllVariants(),
        getAllInventory(),
        getAllCategories(),
        getAllColors(),
        getAllSizes(),
      ]);
      if (prods) setProducts(prods);
      if (vars)  setVariants(vars);
      if (inv)   setInventory(inv);
      if (cats)  setCategories(cats);
      if (cols)  setColors(cols);
      if (szs)   setSizes(szs);
    } catch {
      showToast('Error cargando productos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getProductVariants = (productId: number) =>
    variants.filter(v => v.product === productId);

  const getVariantStock = (variantId: number) =>
    inventory.find(i => i.variant === variantId)?.stock ?? 0;

  const getTotalStock = (productId: number) =>
    getProductVariants(productId).reduce((sum, v) => sum + getVariantStock(v.id_variant), 0);

  const getProductImage = (productId: number): string | null => {
    const image = localStorage.getItem(`product_image_${productId}`);
    return image || null;
  };

  const getProductMeta = (productId: number) => {
    const meta = localStorage.getItem(`product_meta_${productId}`);
    if (meta) {
      try {
        return JSON.parse(meta);
      } catch {
        return { stock: '', color: '', size: '' };
      }
    }
    return { stock: '', color: '', size: '' };
  };

  // Validar consistencia de inventario
  const isInventoryConsistent = (productId: number) => {
    const meta = getProductMeta(productId);
    const realStock = getTotalStock(productId);
    const hasMetaStock = meta.stock && Number(meta.stock) > 0;
    
    // Si hay cantidad en meta pero stock real es 0, es inconsistente
    if (hasMetaStock && realStock === 0) {
      return false;
    }
    return true;
  };

  // Obtener el stock correcto (priorizar stock real sobre meta)
  const getCorrectStock = (productId: number) => {
    const realStock = getTotalStock(productId);
    const meta = getProductMeta(productId);
    
    // Si hay stock real, usarlo
    if (realStock > 0) {
      return realStock;
    }
    
    // Si no hay stock real pero hay cantidad en meta, significa que es un producto
    // sin variantes aún (en transición), retornar 0 para ser consistente
    return 0;
  };

  // ─── Auto-generar SKU ────────────────────────────────────────────────────────
  const autoGenerateSku = () => {
    const productPrefix = addName.substring(0, 3).toUpperCase() || 'PRD';
    const sizeStr = sizes.find(s => s.id_size === addSizeId)?.name.toUpperCase() || 'N/A';
    const colorStr = colors.find(c => c.id_color === addColorId)?.name.substring(0, 3).toUpperCase() || 'N/A';
    const timestamp = Date.now().toString().slice(-6);
    
    setAddSku(`${productPrefix}-${sizeStr}-${colorStr}-${timestamp}`);
  };

  // ─── Filter & paginate ───────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category_name.toLowerCase().includes(q) ||
      (p.is_active ? 'activo' : 'inactivo').includes(q)
    );
  });
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ─── Edit ────────────────────────────────────────────────────────────────────
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditPrice(String(product.price));
    setEditPurchasePrice(String(product.purchase_price));
    setEditCategory(product.category);
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const errors: Record<string, string> = {};
    if (!editName.trim())                     errors.name     = 'El nombre es obligatorio';
    if (!editPrice || Number(editPrice) <= 0) errors.price    = 'El precio debe ser mayor a 0';
    if (!editPurchasePrice || Number(editPurchasePrice) <= 0) errors.purchasePrice = 'El precio de compra debe ser mayor a 0';
    if (!editCategory)                        errors.category = 'Selecciona una categoría';
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!editingProduct) return;

    setIsSubmitting(true);
    const result = await updateProduct(editingProduct.id_product, {
      name:      editName.trim(),
      price:     Number(editPrice),
      purchase_price: Number(editPurchasePrice),
      category:  editCategory!,
      is_active: editingProduct.is_active,
    });

    if (result) {
      showToast('Producto actualizado', 'success');
      await loadData();
      setShowEditModal(false);
    } else {
      showToast('Error al actualizar', 'error');
    }
    setIsSubmitting(false);
  };

  // ─── Add ──────────────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setAddName('');
    setAddPrice('');
    setAddCategory(null);
    setAddPurchasePrice('');
    setAddImage(null);
    setAddImagePreview('');
    setAddStock('');
    setAddColorId(null);
    setAddSizeId(null);
    setImageBase64('');
    setAddSku('');
    setAddErrors({});
    setIsCreatingNewColor(false);
    setIsCreatingNewSize(false);
    setNewColorName('');
    setNewSizeName('');
    setShowAddModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAddImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAddImagePreview(result);
        setImageBase64(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Crear nuevo color
  const handleCreateColor = async () => {
    if (!newColorName.trim()) {
      showToast('Ingresa un nombre para el color', 'error');
      return;
    }
    
    setIsSubmitting(true);
    const newColor = await createColor(newColorName.trim());
    
    if (newColor) {
      showToast('Color creado exitosamente', 'success');
      setColors([...colors, newColor]);
      setAddColorId(newColor.id_color);
      setIsCreatingNewColor(false);
      setNewColorName('');
    } else {
      showToast('Error al crear el color', 'error');
    }
    setIsSubmitting(false);
  };

  // Crear nueva talla
  const handleCreateSize = async () => {
    if (!newSizeName.trim()) {
      showToast('Ingresa un nombre para la talla', 'error');
      return;
    }
    
    setIsSubmitting(true);
    const newSize = await createSize(newSizeName.trim());
    
    if (newSize) {
      showToast('Talla creada exitosamente', 'success');
      setSizes([...sizes, newSize]);
      setAddSizeId(newSize.id_size);
      setIsCreatingNewSize(false);
      setNewSizeName('');
    } else {
      showToast('Error al crear la talla', 'error');
    }
    setIsSubmitting(false);
  };

  const handleSaveAdd = async () => {
    const errors: Record<string, string> = {};
    if (!addName.trim())                     errors.name     = 'El nombre es obligatorio';
    if (!addPrice || Number(addPrice) <= 0) errors.price    = 'El precio debe ser mayor a 0';
    if (!addPurchasePrice || Number(addPurchasePrice) <= 0) errors.purchasePrice = 'El precio de compra debe ser mayor a 0';
    if (!addCategory)                        errors.category = 'Selecciona una categoría';
    
    // Detectar si hay campos de variante parcialmente llenados
    const hasAnyVariantField = !!(addColorId || addSizeId || addStock || addSku.trim());
    const allVariantFieldsPresent = !!(addColorId && addSizeId && addStock && Number(addStock) > 0 && addSku.trim());

    console.log('📋 handleSaveAdd - Estado de campos:');
    console.log('  addColorId:', addColorId, 'tipo:', typeof addColorId);
    console.log('  addSizeId:', addSizeId, 'tipo:', typeof addSizeId);
    console.log('  addStock:', addStock, 'tipo:', typeof addStock);
    console.log('  addSku:', addSku, 'tipo:', typeof addSku);
    console.log('  hasAnyVariantField:', hasAnyVariantField);
    console.log('  allVariantFieldsPresent:', allVariantFieldsPresent);

    // Si hay al menos un campo de variante, validar que TODOS estén presentes
    if (hasAnyVariantField && !allVariantFieldsPresent) {
      if (!addColorId) errors.color = 'Color es requerido (o déjalo vacío para omitir variante)';
      if (!addSizeId)  errors.size  = 'Talla es requerida (o déjalo vacío para omitir variante)';
      if (!addStock || Number(addStock) <= 0) errors.stock = 'Stock es requerido (o déjalo vacío para omitir variante)';
      if (!addSku.trim()) errors.sku = 'SKU es requerido (o déjalo vacío para omitir variante)';
    }

    setAddErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);

    let result: Product | null = null;

    // 1. Crear el producto CON o SIN variante
    console.log('🔍 handleSaveAdd - Verificando variante:', { allVariantFieldsPresent });
    
    if (allVariantFieldsPresent) {
      // Enviar TODO junto: producto + variante en una sola petición
      console.log('📤 handleSaveAdd - Creando PRODUCTO + VARIANTE en UNA petición:');
      console.log('  name:', addName.trim());
      console.log('  category:', addCategory);
      console.log('  price:', Number(addPrice));
      console.log('  purchase_price:', Number(addPurchasePrice));
      console.log('  sku:', addSku.trim());
      console.log('  size:', addSizeId);
      console.log('  color:', addColorId);
      console.log('  stock:', Number(addStock));
      
      result = await createProductWithVariant({
        name: addName.trim(),
        category: addCategory!,
        price: Number(addPrice),
        purchase_price: Number(addPurchasePrice),
        sku: addSku.trim(),
        size: addSizeId!,
        color: addColorId!,
        stock: Number(addStock)
      });

      if (!result) {
        showToast('Error al crear el producto con variante', 'error');
        setIsSubmitting(false);
        return;
      }

      console.log('✅ handleSaveAdd - Producto + Variante creado:', result);

      // Guardar metadata
      const productMeta = {
        stock: addStock,
        color: colors.find(c => c.id_color === addColorId)?.name || '',
        size: sizes.find(s => s.id_size === addSizeId)?.name || ''
      };
      localStorage.setItem(`product_meta_${result.id_product}`, JSON.stringify(productMeta));
      showToast('Producto y variante creados exitosamente', 'success');
    } else {
      // Solo crear el producto base
      console.log('⏭️ handleSaveAdd - Creando solo PRODUCTO (sin variante)');
      result = await createProduct({
        name: addName.trim(),
        category: addCategory!,
        price: Number(addPrice),
        purchase_price: Number(addPurchasePrice)
      });

      if (!result) {
        showToast('Error al crear el producto', 'error');
        setIsSubmitting(false);
        return;
      }

      console.log('✅ handleSaveAdd - Producto creado:', result);
      showToast('Producto creado exitosamente', 'success');
    }

    // 2. Guardar imagen en localStorage si existe
    if (imageBase64 && result) {
      localStorage.setItem(`product_image_${result.id_product}`, imageBase64);
    }

    await loadData();
    setShowAddModal(false);
    setIsSubmitting(false);
    
    // Limpiar estados del formulario
    setAddName('');
    setAddPrice('');
    setAddCategory(null);
    setAddPurchasePrice('');
    setAddImage(null);
    setAddImagePreview('');
    setAddStock('');
    setAddColorId(null);
    setAddSizeId(null);
    setAddSku('');
    setImageBase64('');
    setAddErrors({});
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    // Limpiar todos los estados del formulario
    setAddName('');
    setAddPrice('');
    setAddCategory(null);
    setAddPurchasePrice('');
    setAddImage(null);
    setAddImagePreview('');
    setAddStock('');
    setAddColorId(null);
    setAddSizeId(null);
    setAddSku('');
    setImageBase64('');
    setAddErrors({});
  };

  // ─── Toggle ──────────────────────────────────────────────────────────────────
  const handleToggle = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    
    const newState = !product.is_active;
    // Actualizar localmente primero para feedback inmediato
    setProducts(products.map(p => 
      p.id_product === product.id_product 
        ? { ...p, is_active: newState }
        : p
    ));
    
    // Luego actualizar en servidor
    const ok = await patchProductState(product.id_product, newState);
    if (ok) {
      showToast(`Producto ${newState ? 'activado' : 'desactivado'}`, 'success');
    } else {
      // Si falla, revertir cambio local
      setProducts(products.map(p => 
        p.id_product === product.id_product 
          ? { ...p, is_active: !newState }
          : p
      ));
      showToast('Error al cambiar estado', 'error');
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = (product: Product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;
    setIsSubmitting(true);
    const ok = await deleteProduct(deletingProduct.id_product);
    if (ok) {
      showToast('Producto eliminado', 'success');
      await loadData();
    } else {
      showToast('No se pudo eliminar — puede tener variantes o compras asociadas', 'error');
    }
    setIsSubmitting(false);
    setShowDeleteModal(false);
  };

  // ─── Export ──────────────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const headers = ['ID', 'Nombre', 'Categoría', 'Precio', 'Estado', 'Stock Total', 'Variantes'];
    const rows = products.map(p => [
      p.id_product,
      p.name,
      p.category_name,
      p.price,
      p.is_active ? 'Activo' : 'Inactivo',
      getTotalStock(p.id_product),
      getProductVariants(p.id_product).map(v => `${v.size_name}/${v.color_name}`).join(' | ') || 'Sin variantes',
    ]);
    const csv  = [headers, ...rows].map(r => r.join('\t')).join('\n');
    const blob = new Blob([csv], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = `productos_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Productos</h2>
          <p className="text-gray-600">
            {products.length} productos · {variants.length} variantes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToExcel} variant="secondary">
            <Download size={16} />
            Exportar Excel
          </Button>
          <Button onClick={handleOpenAdd} variant="primary" className="flex items-center gap-2">
            <Plus size={16} />
            Registrar Producto
          </Button>
        </div>
      </div>

      {/* Search and View Mode */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Buscar por nombre, categoría o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
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
      </div>

      {/* Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginated.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400">
            <Package className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-sm">No se encontraron productos</p>
            <p className="text-xs mt-0.5">Los productos se crean desde el módulo Compras</p>
          </div>
        ) : (
          paginated.map(product => {
            const stock       = getCorrectStock(product.id_product);
            const productVars = getProductVariants(product.id_product);
            const productImage = getProductImage(product.id_product);
            const meta = getProductMeta(product.id_product);
            const isConsistent = isInventoryConsistent(product.id_product);

            return (
              <div
                key={product.id_product}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Imagen del Producto */}
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden group">
                  {productImage ? (
                    <img src={productImage} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="text-gray-300" size={48} />
                  )}

                  {/* Toggle activo - Esquina superior derecha */}
                  <button
                    onClick={(e) => handleToggle(e, product)}
                    title={product.is_active ? 'Desactivar' : 'Activar'}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '44px',
                      height: '24px',
                      borderRadius: '9999px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: product.is_active ? '#22c55e' : '#9ca3af',
                      transition: 'background-color 0.2s',
                      zIndex: 10
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: product.is_active ? '22px' : '2px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '9999px',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>

                {/* Contenido del Producto */}
                <div className="p-3">
                  {/* Nombre */}
                  <h3 className="font-semibold text-gray-900 text-sm mb-0.5 truncate">{product.name}</h3>
                  
                  {/* Categoría */}
                  <p className="text-xs text-gray-500 mb-2">{product.category_name}</p>

                  {/* Talla, Color, Cantidad - Solo mostrar si es consistente */}
                  {(() => {
                    // Solo mostrar metadata si hay stock real O si es consistente
                    if (!isConsistent) {
                      return null; // No mostrar datos inconsistentes
                    }
                    return (
                      <>
                        {(meta.size || meta.color || (meta.stock && stock > 0)) && (
                          <div className="space-y-1 mb-2 text-xs">
                            {meta.size && <p className="text-gray-600"><span className="font-medium">Talla:</span> {meta.size}</p>}
                            {meta.color && <p className="text-gray-600"><span className="font-medium">Color:</span> {meta.color}</p>}
                            {meta.stock && stock > 0 && <p className="text-gray-600"><span className="font-medium">Cantidad:</span> {meta.stock}</p>}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Stock - Con indicador si hay inconsistencia */}
                  <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block mb-2 ${
                    !isConsistent ? 'bg-red-100 text-red-700' :
                    stock > 20 ? 'bg-green-100 text-green-700' :
                    stock > 5  ? 'bg-yellow-100 text-yellow-700' :
                    stock > 0  ? 'bg-red-100 text-red-700' :
                                 'bg-gray-100 text-gray-500'
                  }`}>
                    Stock: {stock} {!isConsistent && '⚠️ (inconsistente)'}
                  </div>

                  {/* Precio */}
                  <div className="text-xl font-bold text-gray-900 mb-0.5">
                    {formatCOP(product.price)}
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    Compra: {formatCOP(product.purchase_price)}
                  </div>

                  {/* Botones de Acciones */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setViewingProduct(product); setShowDetailModal(true); }}
                      className="flex-1 px-2 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 flex items-center justify-center gap-1 text-xs transition-colors font-medium"
                    >
                      <Eye size={18} /> 
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      className="px-2 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="px-2 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nombre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Categoría</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Precio</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Stock</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                      <Package className="mx-auto mb-3 text-gray-300" size={48} />
                      <p className="text-sm">No se encontraron productos</p>
                      <p className="text-xs mt-0.5">Los productos se crean desde el módulo Compras</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((product, idx) => {
                    const stock = getCorrectStock(product.id_product);
                    const isConsistent = isInventoryConsistent(product.id_product);
                    return (
                      <tr key={product.id_product} className={idx !== paginated.length - 1 ? 'border-b border-gray-200' : ''}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="text-gray-400" size={20} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{product.category_name}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCOP(product.price)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            !isConsistent ? 'bg-red-100 text-red-700' :
                            stock > 20 ? 'bg-green-100 text-green-700' :
                            stock > 5  ? 'bg-yellow-100 text-yellow-700' :
                            stock > 0  ? 'bg-red-100 text-red-700' :
                                         'bg-gray-100 text-gray-500'
                          }`}>
                            {stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <button
                              onClick={(e) => handleToggle(e, product)}
                              title={product.is_active ? 'Desactivar' : 'Activar'}
                              style={{
                                position: 'relative',
                                width: '44px',
                                height: '24px',
                                borderRadius: '9999px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: product.is_active ? '#22c55e' : '#9ca3af',
                                transition: 'background-color 0.2s',
                              }}
                            >
                              <div style={{
                                position: 'absolute',
                                top: '2px',
                                left: product.is_active ? '22px' : '2px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '9999px',
                                backgroundColor: 'white',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                transition: 'left 0.2s',
                              }} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setViewingProduct(product); setShowDetailModal(true); }}
                              className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                              title="Ver detalles"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {filtered.length} productos — página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal Ver Detalle ──────────────────────────────────────────────── */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Detalle del Producto" size="lg">
        {viewingProduct && (() => {
          const productVars = getProductVariants(viewingProduct.id_product);
          const totalStock  = getCorrectStock(viewingProduct.id_product);
          const meta = getProductMeta(viewingProduct.id_product);
          const isConsistent = isInventoryConsistent(viewingProduct.id_product);
          return (
            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Nombre</p>
                  <p className="font-semibold text-gray-900">{viewingProduct.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Categoría</p>
                  <p className="font-medium">{viewingProduct.category_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Precio</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCOP(viewingProduct.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Precio de compra</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCOP(viewingProduct.purchase_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Estado</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    viewingProduct.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {viewingProduct.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Información de Meta (Cantidad, Talla, Color) - Solo si es consistente */}
              {(() => {
                if (!isConsistent) {
                  return (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h4 className="font-semibold text-red-900 mb-2">⚠️ Inventario Inconsistente</h4>
                      <p className="text-xs text-red-700 mb-3">
                        La cantidad guardada no coincide con el stock real. Por favor, cree variantes desde el módulo de Compras o corrija manualmente el inventario.
                      </p>
                    </div>
                  );
                }
                return (meta.size || meta.color || (meta.stock && totalStock > 0)) ? (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Información Adicional</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {meta.stock && totalStock > 0 && (
                        <div>
                          <p className="text-xs text-gray-600 mb-0.5">Cantidad Inicial</p>
                          <p className="font-semibold text-gray-900">{meta.stock}</p>
                        </div>
                      )}
                      {meta.size && (
                        <div>
                          <p className="text-xs text-gray-600 mb-0.5">Talla</p>
                          <p className="font-semibold text-gray-900">{meta.size}</p>
                        </div>
                      )}
                      {meta.color && (
                        <div>
                          <p className="text-xs text-gray-600 mb-0.5">Color</p>
                          <p className="font-semibold text-gray-900">{meta.color}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Variantes ({productVars.length}) — Stock total:{' '}
                  <span className="text-gray-700">{totalStock} uds</span>
                </h4>
                {productVars.length === 0 ? (
                  <p className="text-xs text-gray-400">Sin variantes. Se crean desde Compras.</p>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-2 px-3 text-gray-600">SKU</th>
                          <th className="text-left py-2 px-3 text-gray-600">Talla</th>
                          <th className="text-left py-2 px-3 text-gray-600">Color</th>
                          <th className="text-right py-2 px-3 text-gray-600">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {productVars.map(v => {
                          const stock = getVariantStock(v.id_variant);
                          return (
                            <tr key={v.id_variant}>
                              <td className="py-2 px-3 font-mono text-gray-500">{v.sku}</td>
                              <td className="py-2 px-3 text-gray-700">{v.size_name}</td>
                              <td className="py-2 px-3 text-gray-700">{v.color_name}</td>
                              <td className="py-2 px-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full font-medium ${
                                  stock > 20 ? 'bg-green-100 text-green-700' :
                                  stock > 5  ? 'bg-yellow-100 text-yellow-700' :
                                  stock > 0  ? 'bg-red-100 text-red-700' :
                                               'bg-gray-100 text-gray-400'
                                }`}>
                                  {stock}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ─── Modal Editar ───────────────────────────────────────────────────── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Producto" size="md">
        <div className="space-y-4 text-sm">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            Solo puedes editar nombre, precio y categoría. Las variantes se gestionan desde Compras.
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-0.5 text-xs">Nombre *</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nombre del producto"
              className={editErrors.name ? 'border-red-400' : ''}
            />
            {editErrors.name && <p className="text-red-500 text-xs mt-0.5">{editErrors.name}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-0.5 text-xs">Precio *</label>
            <Input
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              placeholder="0"
              className={editErrors.price ? 'border-red-400' : ''}
            />
            {editErrors.price && <p className="text-red-500 text-xs mt-0.5">{editErrors.price}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-0.5 text-xs">Precio de compra *</label>
            <Input
              type="number"
              value={editPurchasePrice}
              onChange={(e) => setEditPurchasePrice(e.target.value)}
              placeholder="0"
              className={editErrors.purchasePrice ? 'border-red-400' : ''}
            />
            {editErrors.purchasePrice && <p className="text-red-500 text-xs mt-0.5">{editErrors.purchasePrice}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-0.5 text-xs">Categoría *</label>
            <select
              value={editCategory ?? ''}
              onChange={(e) => setEditCategory(Number(e.target.value) || null)}
              className={`w-full h-8 px-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 ${
                editErrors.category ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar categoría...</option>
              {categories.map(c => (
                <option key={c.id_category} value={c.id_category}>{c.name}</option>
              ))}
            </select>
            {editErrors.category && <p className="text-red-500 text-xs mt-0.5">{editErrors.category}</p>}
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button onClick={() => setShowEditModal(false)} variant="secondary">Cancelar</Button>
            <Button onClick={handleSaveEdit} variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </Modal>

     {/* ─── Modal Agregar Producto ────────────────────────────────────────── */}
<Modal 
  isOpen={showAddModal} 
  onClose={handleCloseAddModal} 
  title="Nuevo Producto" 
  size="md"
>
  <div className="space-y-1.5 text-xs max-h-[400px] overflow-y-auto">

    {/* Alerta informativa */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
      <strong>Opcional:</strong> Puedes crear el producto con talla, color y stock inicial. Si no los completas, podrás agregar variantes más tarde desde el módulo de Compras.
    </div>

    {/* Imagen */}
    <div>
      <label className="block text-gray-700 font-medium mb-1 text-xs">
        Imagen del Producto
      </label>

      <div className="border border-dashed border-gray-300 rounded-lg p-1.5 text-center bg-gray-50">
        {addImagePreview ? (
          <div>
            <img 
              src={addImagePreview} 
              alt="Preview" 
              className="w-full h-16 object-cover rounded-lg mb-1" 
            />
            <div className="flex gap-2 justify-center text-xs">
              <label className="text-blue-500 hover:underline cursor-pointer text-xs">
                Cambiar
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              <button
                type="button"
                onClick={() => {
                  setAddImage(null);
                  setAddImagePreview('');
                  setImageBase64('');
                }}
                className="text-red-500 hover:underline"
              >
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <label className="cursor-pointer text-gray-400 text-xs py-4 block">
            <Package size={26} className="mx-auto mb-2" />
            Subir imagen
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        )}
      </div>
    </div>

    {/* Nombre */}
    <div>
      <label className="block text-gray-700 font-medium mb-1 text-xs">
        Nombre del Producto *
      </label>
      <Input
        value={addName}
        onChange={(e) => setAddName(e.target.value)}
        placeholder="Nombre del producto"
        className={`h-9 text-sm ${addErrors.name ? 'border-red-400' : ''}`}
      />
      {addErrors.name && <p className="text-red-500 text-xs mt-0.5">{addErrors.name}</p>}
    </div>

    {/* Precios */}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-gray-700 font-medium mb-1 text-xs">
          Precio compra *
        </label>
        <Input
          type="number"
          value={addPurchasePrice}
          onChange={(e) => setAddPurchasePrice(e.target.value)}
          placeholder="0"
          className={`h-9 text-sm ${addErrors.purchasePrice ? 'border-red-400' : ''}`}
        />
        {addErrors.purchasePrice && <p className="text-red-500 text-xs mt-0.5">{addErrors.purchasePrice}</p>}
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-1 text-xs">
          Precio venta *
        </label>
        <Input
          type="number"
          value={addPrice}
          onChange={(e) => setAddPrice(e.target.value)}
          placeholder="0"
          className={`h-9 text-sm ${addErrors.price ? 'border-red-400' : ''}`}
        />
        {addErrors.price && <p className="text-red-500 text-xs mt-0.5">{addErrors.price}</p>}
      </div>
    </div>

    {/* Categoría */}
    <div>
      <label className="block text-gray-700 font-medium mb-1 text-xs">
        Categoría *
      </label>
      <select
        value={addCategory ?? ''}
        onChange={(e) => setAddCategory(Number(e.target.value) || null)}
        className={`w-full h-9 px-2 border rounded-lg text-sm ${
          addErrors.category ? 'border-red-400' : 'border-gray-300'
        }`}
      >
        <option value="">Seleccionar</option>
        {categories.map(c => (
          <option key={c.id_category} value={c.id_category}>
            {c.name}
          </option>
        ))}
      </select>
      {addErrors.category && <p className="text-red-500 text-xs mt-0.5">{addErrors.category}</p>}
    </div>

    {/* Sección de Variante (Talla, Color, Stock, SKU) */}
    <div className="border-t pt-2">
      <h4 className="font-semibold text-gray-900 mb-2 text-xs">Variante Inicial (Opcional)</h4>
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Talla */}
        <div>
          <label className="block text-gray-700 font-medium mb-1 text-xs">
            Talla
          </label>
          {isCreatingNewSize ? (
            <div className="space-y-1">
              <Input
                value={newSizeName}
                onChange={(e) => setNewSizeName(e.target.value)}
                placeholder="Ej: M, L, XL"
                className="h-8 text-sm"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={handleCreateSize}
                  disabled={isSubmitting}
                  className="flex-1 px-1.5 py-0.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creando...' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNewSize(false);
                    setNewSizeName('');
                  }}
                  className="flex-1 px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <select
                value={addSizeId ?? ''}
                onChange={(e) => setAddSizeId(Number(e.target.value) || null)}
                className={`w-full h-9 px-2 border rounded-lg text-sm ${
                  addErrors.size ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar</option>
                {sizes.map(s => (
                  <option key={s.id_size} value={s.id_size}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsCreatingNewSize(true)}
                className="text-blue-600 text-xs mt-0.5 hover:underline"
              >
                + Nueva talla
              </button>
            </>
          )}
          {addErrors.size && <p className="text-red-500 text-xs mt-0.5">{addErrors.size}</p>}
        </div>

        {/* Color */}
        <div>
          <label className="block text-gray-700 font-medium mb-1 text-xs">
            Color
          </label>
          {isCreatingNewColor ? (
            <div className="space-y-2">
              <Input
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Ej: Negro, Rojo"
                className="h-9 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateColor}
                  disabled={isSubmitting}
                  className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creando...' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNewColor(false);
                    setNewColorName('');
                  }}
                  className="flex-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <select
                value={addColorId ?? ''}
                onChange={(e) => setAddColorId(Number(e.target.value) || null)}
                className={`w-full h-9 px-2 border rounded-lg text-sm ${
                  addErrors.color ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar</option>
                {colors.map(c => (
                  <option key={c.id_color} value={c.id_color}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsCreatingNewColor(true)}
                className="text-blue-600 text-xs mt-0.5 hover:underline"
              >
                + Nuevo color
              </button>
            </>
          )}
          {addErrors.color && <p className="text-red-500 text-xs mt-0.5">{addErrors.color}</p>}
        </div>

        {/* Stock */}
        <div>
          <label className="block text-gray-700 font-medium mb-1 text-xs">
            Stock Inicial
          </label>
          <Input
            type="number"
            value={addStock}
            onChange={(e) => setAddStock(e.target.value)}
            placeholder="0"
            className={`h-9 text-sm ${addErrors.stock ? 'border-red-400' : ''}`}
          />
          {addErrors.stock && <p className="text-red-500 text-xs mt-0.5">{addErrors.stock}</p>}
        </div>

        {/* SKU */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-gray-700 font-medium text-xs">SKU</label>
            <button 
              type="button" 
              onClick={autoGenerateSku} 
              className="text-xs text-blue-600 hover:underline"
            >
              Generar automático
            </button>
          </div>
          <Input
            value={addSku}
            onChange={(e) => setAddSku(e.target.value)}
            placeholder="Ej: VES-M-NEG-001"
            className={`h-9 text-sm font-mono ${addErrors.sku ? 'border-red-400' : ''}`}
          />
          {addErrors.sku && <p className="text-red-500 text-xs mt-0.5">{addErrors.sku}</p>}
        </div>
      </div>
    </div>

    {/* Botones */}
    <div className="flex gap-2 justify-end pt-1.5 border-t">
      <Button onClick={handleCloseAddModal} variant="secondary">
        Cancelar
      </Button>
      <Button 
        onClick={handleSaveAdd} 
        variant="primary" 
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creando...' : 'Crear Producto'}
      </Button>
    </div>

  </div>
</Modal>

      {/* ─── Modal Eliminar ─────────────────────────────────────────────────── */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Eliminar Producto" size="sm">
        <div className="space-y-4 text-sm">
          <p className="text-gray-700">
            ¿Eliminar <strong>{deletingProduct?.name}</strong>? Esta acción no se puede deshacer.
          </p>
          <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
            Si el producto tiene variantes o compras asociadas no se podrá eliminar.
          </p>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setShowDeleteModal(false)} variant="secondary">Cancelar</Button>
            <Button
              onClick={confirmDelete}
              variant="primary"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}