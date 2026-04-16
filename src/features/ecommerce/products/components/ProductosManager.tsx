import React, { useState, useEffect, useCallback } from 'react';
import { Search, Package, Eye, Edit2, Trash2, Download, AlertCircle } from 'lucide-react';
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
  Product,
  Inventory,
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
  const [loading,    setLoading]    = useState(true);

  // ─── UI ──────────────────────────────────────────────────────────────────────
  const [searchTerm,  setSearchTerm]  = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

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
  const [addColor, setAddColor] = useState('');
  const [addSize, setAddSize] = useState('');
  const [imageBase64, setImageBase64] = useState<string>('');

  // ─── Load data ───────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, vars, inv, cats] = await Promise.all([
        getAllProducts(),
        getAllVariants(),
        getAllInventory(),
        getAllCategories(),
      ]);
      if (prods) setProducts(prods);
      if (vars)  setVariants(vars);
      if (inv)   setInventory(inv);
      if (cats)  setCategories(cats);
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
    setAddColor('');
    setAddSize('');
    setImageBase64('');
    setAddErrors({});
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

  const handleSaveAdd = async () => {
    const errors: Record<string, string> = {};
    if (!addName.trim())                     errors.name     = 'El nombre es obligatorio';
    if (!addPrice || Number(addPrice) <= 0) errors.price    = 'El precio debe ser mayor a 0';
    if (!addPurchasePrice || Number(addPurchasePrice) <= 0) errors.purchasePrice = 'El precio de compra debe ser mayor a 0';
    if (!addCategory)                        errors.category = 'Selecciona una categoría';
    setAddErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    const result = await createProduct({
      name: addName.trim(),
      category: addCategory!,
      price: Number(addPrice),
      purchase_price: Number(addPurchasePrice)
    });

    if (result) {
      // Guardar imagen en localStorage si existe
      if (imageBase64) {
        localStorage.setItem(`product_image_${result.id_product}`, imageBase64);
      }
      
      // Guardar datos adicionales en localStorage
      const productMeta = {
        stock: addStock,
        color: addColor,
        size: addSize
      };
      localStorage.setItem(`product_meta_${result.id_product}`, JSON.stringify(productMeta));
      
      showToast('Producto creado exitosamente', 'success');
      await loadData();
      handleCloseAddModal();
    } else {
      showToast('Error al crear el producto', 'error');
    }
    setIsSubmitting(false);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    handleOpenAdd(); // Limpia todos los campos
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
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-lg mb-1">Gestión de Productos</h2>
          <p className="text-gray-500 text-xs">
            {products.length} productos · {variants.length} variantes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleOpenAdd} variant="primary" className="flex items-center gap-2">
            <Package size={16} />
            Nuevo Producto
          </Button>
          <Button onClick={exportToExcel} variant="secondary">
            <Download size={16} />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Buscar por nombre, categoría o estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginated.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400">
            <Package className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-sm">No se encontraron productos</p>
            <p className="text-xs mt-1">Los productos se crean desde el módulo Compras</p>
          </div>
        ) : (
          paginated.map(product => {
            const stock       = getTotalStock(product.id_product);
            const productVars = getProductVariants(product.id_product);
            const productImage = getProductImage(product.id_product);

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
                    className={`absolute top-2 right-2 w-10 h-6 rounded-full transition-colors z-10 ${
                      product.is_active ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      product.is_active ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Contenido del Producto */}
                <div className="p-3">
                  {/* Nombre */}
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">{product.name}</h3>
                  
                  {/* Categoría */}
                  <p className="text-xs text-gray-500 mb-2">{product.category_name}</p>

                  {/* Talla, Color, Cantidad */}
                  {(() => {
                    const meta = getProductMeta(product.id_product);
                    return (
                      <>
                        {(meta.size || meta.color || meta.stock) && (
                          <div className="space-y-1 mb-2 text-xs">
                            {meta.size && <p className="text-gray-600"><span className="font-medium">Talla:</span> {meta.size}</p>}
                            {meta.color && <p className="text-gray-600"><span className="font-medium">Color:</span> {meta.color}</p>}
                            {meta.stock && <p className="text-gray-600"><span className="font-medium">Cantidad:</span> {meta.stock}</p>}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Stock */}
                  <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block mb-2 ${
                    stock > 20 ? 'bg-green-100 text-green-700' :
                    stock > 5  ? 'bg-yellow-100 text-yellow-700' :
                    stock > 0  ? 'bg-red-100 text-red-700' :
                                 'bg-gray-100 text-gray-500'
                  }`}>
                    Stock: {stock} unidades
                  </div>

                  {/* Precio */}
                  <div className="text-xl font-bold text-gray-900 mb-1">
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
                      <Eye size={13} /> Ver Detalles
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
          const totalStock  = getTotalStock(viewingProduct.id_product);
          return (
            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Nombre</p>
                  <p className="font-semibold text-gray-900">{viewingProduct.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Categoría</p>
                  <p className="font-medium">{viewingProduct.category_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Precio</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCOP(viewingProduct.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Precio de compra</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCOP(viewingProduct.purchase_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Estado</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    viewingProduct.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {viewingProduct.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Información de Meta (Cantidad, Talla, Color) */}
              {(() => {
                const meta = getProductMeta(viewingProduct.id_product);
                return (meta.size || meta.color || meta.stock) ? (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Información Adicional</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {meta.stock && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Cantidad</p>
                          <p className="font-semibold text-gray-900">{meta.stock}</p>
                        </div>
                      )}
                      {meta.size && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Talla</p>
                          <p className="font-semibold text-gray-900">{meta.size}</p>
                        </div>
                      )}
                      {meta.color && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Color</p>
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
      {/* ─── Modal Editar Producto ─────────────────────────────────────────── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Producto" size="md">
        <div className="space-y-4 text-sm">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            Solo puedes editar nombre, precio y categoría. Las variantes se gestionan desde Compras.
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Nombre *</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nombre del producto"
              className={editErrors.name ? 'border-red-400' : ''}
            />
            {editErrors.name && <p className="text-red-500 text-xs mt-1">{editErrors.name}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Precio *</label>
            <Input
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              placeholder="0"
              className={editErrors.price ? 'border-red-400' : ''}
            />
            {editErrors.price && <p className="text-red-500 text-xs mt-1">{editErrors.price}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Precio de compra *</label>
            <Input
              type="number"
              value={editPurchasePrice}
              onChange={(e) => setEditPurchasePrice(e.target.value)}
              placeholder="0"
              className={editErrors.purchasePrice ? 'border-red-400' : ''}
            />
            {editErrors.purchasePrice && <p className="text-red-500 text-xs mt-1">{editErrors.purchasePrice}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Categoría *</label>
            <select
              value={editCategory ?? ''}
              onChange={(e) => setEditCategory(Number(e.target.value) || null)}
              className={`w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 ${
                editErrors.category ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar categoría...</option>
              {categories.map(c => (
                <option key={c.id_category} value={c.id_category}>{c.name}</option>
              ))}
            </select>
            {editErrors.category && <p className="text-red-500 text-xs mt-1">{editErrors.category}</p>}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button onClick={() => setShowEditModal(false)} variant="secondary">Cancelar</Button>
            <Button onClick={handleSaveEdit} variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal Agregar Producto ────────────────────────────────────────── */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nuevo Producto" size="lg">
        <div className="space-y-4 text-sm max-h-96 overflow-y-auto">
          {/* Imagen */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-xs">Imagen del Producto</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
              {addImagePreview ? (
                <div className="relative">
                  <img src={addImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-2" />
                  <div className="flex gap-2 justify-center">
                    <label className="text-blue-500 text-xs hover:underline cursor-pointer">
                      Cambiar imagen
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAddImage(null);
                        setAddImagePreview('');
                        setImageBase64('');
                      }}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="text-gray-400 text-xs py-4">
                    <Package size={28} className="mx-auto mb-2" />
                    <div>Haz clic o arrastra una imagen aquí</div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Nombre del Producto *</label>
            <Input
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="Nombre del producto"
              className={addErrors.name ? 'border-red-400' : ''}
            />
            {addErrors.name && <p className="text-red-500 text-xs mt-1">{addErrors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-xs">Precio de venta *</label>
              <Input
                type="number"
                value={addPrice}
                onChange={(e) => setAddPrice(e.target.value)}
                placeholder="0"
                className={addErrors.price ? 'border-red-400' : ''}
              />
              {addErrors.price && <p className="text-red-500 text-xs mt-1">{addErrors.price}</p>}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-xs">Precio de compra *</label>
              <Input
                type="number"
                value={addPurchasePrice}
                onChange={(e) => setAddPurchasePrice(e.target.value)}
                placeholder="0"
                className={addErrors.purchasePrice ? 'border-red-400' : ''}
              />
              {addErrors.purchasePrice && <p className="text-red-500 text-xs mt-1">{addErrors.purchasePrice}</p>}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Categoría *</label>
            <select
              value={addCategory ?? ''}
              onChange={(e) => setAddCategory(Number(e.target.value) || null)}
              className={`w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 ${
                addErrors.category ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar categoría...</option>
              {categories.map(c => (
                <option key={c.id_category} value={c.id_category}>{c.name}</option>
              ))}
            </select>
            {addErrors.category && <p className="text-red-500 text-xs mt-1">{addErrors.category}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-xs">Stock</label>
              <Input
                type="number"
                value={addStock}
                onChange={(e) => setAddStock(e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-xs">Color</label>
              <Input
                value={addColor}
                onChange={(e) => setAddColor(e.target.value)}
                placeholder="Ej: Negro"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-xs">Talla</label>
              <Input
                value={addSize}
                onChange={(e) => setAddSize(e.target.value)}
                placeholder="Ej: M, L"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t">
            <Button onClick={handleCloseAddModal} variant="secondary">Cancelar</Button>
            <Button onClick={handleSaveAdd} variant="primary" disabled={isSubmitting}>
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
          <div className="flex gap-3 justify-end">
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
