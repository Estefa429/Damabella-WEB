import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Truck, Eye, X, Trash2, AlertTriangle, PackagePlus } from 'lucide-react';
import { Button, Input, Modal } from '../../../shared/components/native';
import { useToast } from '../../../shared/components/native';
import { ProveedoresManager } from '../../suppliers/components/ProveedoresManager';

// ─── Services ─────────────────────────────────────────────────────────────────
import { getAllProviders, Providers }       from '@/features/suppliers/services/providersService';
import { getAllCategories, Categories }     from '@/features/ecommerce/categories/services/categoriesService';
import { getAllVariants, getAllPurchases, createPurchase, deletePurchase, patchPurchaseState, Purchase, VariantProduct, CreatePurchaseDetailDTO } from '@/features/purchases/services/PurchasesService';
import { getAllStates, State }              from '@/features/purchases/services/statesService';
import { getAllProducts, getAllColors, getAllSizes, createProduct, createVariant, Product, Color, Size } from '@/features/ecommerce/products/services/productsService';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ItemCompra {
  id:             string;
  variantId:      number;
  productoNombre: string;
  size_name:      string;
  color_name:     string;
  cantidad:       number;
  precioCompra:   number;
  precioVenta:    number;
  subtotal:       number;
}

interface FormData {
  providerId:   number | null;
  stateId:      number | null;
  observations: string;
  items:        ItemCompra[];
}

const IVA = 0.19;

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

export function ComprasManager() {
  const { showToast } = useToast();

  // ─── Data from API ───────────────────────────────────────────────────────────
  const [providers,  setProviders]  = useState<Providers[]>([]);
  const [categories, setCategories] = useState<Categories[]>([]);
  const [variants,   setVariants]   = useState<VariantProduct[]>([]);
  const [states,     setStates]     = useState<State[]>([]);
  const [purchases,  setPurchases]  = useState<Purchase[]>([]);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [colors,     setColors]     = useState<Color[]>([]);
  const [sizes,      setSizes]      = useState<Size[]>([]);
  const [loading,    setLoading]    = useState(true);

  // ─── UI State ────────────────────────────────────────────────────────────────
  const [searchTerm,         setSearchTerm]         = useState('');
  const [currentPage,        setCurrentPage]        = useState(1);
  const [showModal,          setShowModal]          = useState(false);
  const [showDetailModal,    setShowDetailModal]    = useState(false);
  const [viewingPurchase,    setViewingPurchase]    = useState<Purchase | null>(null);
  const [showProveedorModal, setShowProveedorModal] = useState(false);
  const [proveedorModalKey,  setProveedorModalKey]  = useState(0);
  const [isSubmitting,       setIsSubmitting]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null);
  const itemsPerPage = 10;

  // ─── Form State ──────────────────────────────────────────────────────────────
  const [formData,   setFormData]   = useState<FormData>({ providerId: null, stateId: null, observations: '', items: [] });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [itemsError, setItemsError] = useState('');

  // ─── Nuevo Item ──────────────────────────────────────────────────────────────
  const [variantSearch,    setVariantSearch]    = useState('');
  const [showVariantDrop,  setShowVariantDrop]  = useState(false);
  const [selectedVariant,  setSelectedVariant]  = useState<VariantProduct | null>(null);
  const [itemCantidad,     setItemCantidad]     = useState('');
  const [itemPrecioCompra, setItemPrecioCompra] = useState('');
  const [itemPrecioVenta,  setItemPrecioVenta]  = useState('');

  // ─── Modal Crear Variante ─────────────────────────────────────────────────────
  const [showVariantModal,  setShowVariantModal]  = useState(false);
  const [isCreatingVariant, setIsCreatingVariant] = useState(false);

  // Paso 1: producto
  const [variantProductSearch,  setVariantProductSearch]  = useState('');
  const [showProductDrop,       setShowProductDrop]       = useState(false);
  const [selectedProduct,       setSelectedProduct]       = useState<Product | null>(null);
  // Si producto no existe → crear
  const [newProductName,     setNewProductName]     = useState('');
  const [newProductPrice,    setNewProductPrice]    = useState('');
  const [newProductPurchasePrice, setNewProductPurchasePrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<number | null>(null);
  const [creatingNewProduct, setCreatingNewProduct] = useState(false);

  // Paso 2: talla, color, SKU
  const [variantSizeId,  setVariantSizeId]  = useState<number | null>(null);
  const [variantColorId, setVariantColorId] = useState<number | null>(null);
  const [variantSku,     setVariantSku]     = useState('');
  const [variantErrors,  setVariantErrors]  = useState<Record<string, string>>({});

  // ─── Load all data ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prov, cats, vars, sts, purch, prods, cols, szs] = await Promise.all([
        getAllProviders(),
        getAllCategories(),
        getAllVariants(),
        getAllStates(),
        getAllPurchases(),
        getAllProducts(),
        getAllColors(),
        getAllSizes(),
      ]);
      if (prov)  setProviders(prov);
      if (cats)  setCategories(cats);
      if (vars)  setVariants(vars);
      if (sts)   setStates(sts);
      if (purch) setPurchases(purch);
      if (prods) setProducts(prods);
      if (cols)  setColors(cols);
      if (szs)   setSizes(szs);
    } catch {
      showToast('Error cargando datos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // ─── Reset form ───────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ providerId: null, stateId: states[0]?.id_state ?? null, observations: '', items: [] });
    setFormErrors({});
    setItemsError('');
    setVariantSearch('');
    setSelectedVariant(null);
    setItemCantidad('');
    setItemPrecioCompra('');
    setItemPrecioVenta('');
  };

  const resetVariantModal = () => {
    setVariantProductSearch('');
    setShowProductDrop(false);
    setSelectedProduct(null);
    setNewProductName('');
    setNewProductPrice('');
    setNewProductPurchasePrice('');
    setNewProductCategory(null);
    setCreatingNewProduct(false);
    setVariantSizeId(null);
    setVariantColorId(null);
    setVariantSku('');
    setVariantErrors({});
  };

  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  // ─── Variantes filtradas ──────────────────────────────────────────────────────
  const filteredVariants = variants.filter(v =>
    v.product_name.toLowerCase().includes(variantSearch.toLowerCase()) ||
    v.sku.toLowerCase().includes(variantSearch.toLowerCase()) ||
    v.size_name.toLowerCase().includes(variantSearch.toLowerCase()) ||
    v.color_name.toLowerCase().includes(variantSearch.toLowerCase())
  );

  // ─── Productos filtrados (para buscar en modal crear variante) ────────────────
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(variantProductSearch.toLowerCase())
  );

  // ─── Generar SKU automático ───────────────────────────────────────────────────
  const autoSku = () => {
    if (!selectedProduct && !newProductName) return;
    const prodName  = selectedProduct ? selectedProduct.name : newProductName;
    const sizeName  = sizes.find(s => s.id_size === variantSizeId)?.name ?? '';
    const colorName = colors.find(c => c.id_color === variantColorId)?.name ?? '';
    const base = `${prodName.slice(0, 3).toUpperCase()}-${sizeName.slice(0, 2).toUpperCase()}-${colorName.slice(0, 3).toUpperCase()}`;
    const rand = Math.floor(Math.random() * 900 + 100);
    setVariantSku(`${base}-${rand}`);
  };

  // ─── Seleccionar variante existente ──────────────────────────────────────────
  const handleSelectVariant = (variant: VariantProduct) => {
    setSelectedVariant(variant);
    setVariantSearch(`${variant.product_name} — ${variant.size_name} / ${variant.color_name}`);
    setItemPrecioVenta(String(variant.price));
    setShowVariantDrop(false);
  };

  // ─── Agregar item ─────────────────────────────────────────────────────────────
  const agregarItem = () => {
    if (!selectedVariant)                              { showToast('Selecciona una variante', 'error'); return; }
    if (!itemCantidad || !itemPrecioCompra || !itemPrecioVenta) { showToast('Completa cantidad y precios', 'error'); return; }
    const cantidad     = parseFloat(itemCantidad);
    const precioCompra = parseFloat(itemPrecioCompra);
    const precioVenta  = parseFloat(itemPrecioVenta);
    if (cantidad <= 0 || precioCompra <= 0 || precioVenta <= 0) { showToast('Cantidad y precios deben ser > 0', 'error'); return; }
    if (formData.items.find(i => i.variantId === selectedVariant.id_variant)) { showToast('Esta variante ya está en la lista', 'error'); return; }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id:             Date.now().toString(),
        variantId:      selectedVariant.id_variant,
        productoNombre: selectedVariant.product_name,
        size_name:      selectedVariant.size_name,
        color_name:     selectedVariant.color_name,
        cantidad,
        precioCompra,
        precioVenta,
        subtotal: cantidad * precioCompra,
      }],
    }));
    setItemsError('');
    setSelectedVariant(null);
    setVariantSearch('');
    setItemCantidad('');
    setItemPrecioCompra('');
    setItemPrecioVenta('');
  };

  const eliminarItem = (id: string) =>
    setFormData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));

  // ─── Cálculos ─────────────────────────────────────────────────────────────────
  const calcSubtotal = () => formData.items.reduce((s, i) => s + i.subtotal, 0);
  const calcIva      = () => calcSubtotal() * IVA;
  const calcTotal    = () => calcSubtotal() + calcIva();

  // ─── Validar form ─────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.providerId) errors.providerId = 'Selecciona un proveedor';
    if (!formData.stateId)    errors.stateId    = 'Selecciona un estado';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── Guardar compra ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validateForm()) return;
    if (formData.items.length === 0) { setItemsError('Debes agregar al menos un producto'); return; }

    setIsSubmitting(true);
    try {
      const details: CreatePurchaseDetailDTO[] = formData.items.map(item => ({
        variant:        item.variantId,
        quantity:       item.cantidad,
        purchase_price: item.precioCompra,
        sales_price:    item.precioVenta,
        purchase:       null,
      }));
      const result = await createPurchase({ provider: formData.providerId!, state: formData.stateId!, observations: formData.observations || undefined, details });
      if (result) {
        showToast('¡Compra creada exitosamente!', 'success');
        await loadData();
        setShowModal(false);
        resetForm();
      } else {
        showToast('Error al crear la compra', 'error');
      }
    } catch {
      showToast('Error al crear la compra', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Cambiar estado ───────────────────────────────────────────────────────────
  const handlePatchState = async (purchase: Purchase, stateId: number) => {
    const result = await patchPurchaseState(purchase.id_purchase, stateId);
    if (result) { showToast('Estado actualizado', 'success'); await loadData(); }
    else          showToast('No se pudo cambiar el estado', 'error');
  };

  // ─── Eliminar compra ──────────────────────────────────────────────────────────
  const handleDelete = (purchase: Purchase) => {
  const isAnulado = states.find(s => s.id_state === purchase.state)?.name_state?.toLowerCase() === 'anulado';
    if (!isAnulado) {
      showToast('Solo se pueden eliminar compras con estado Anulado', 'error');
      return;
    }
    setDeletingPurchase(purchase);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingPurchase) return;
    setIsSubmitting(true);
    const ok = await deletePurchase(deletingPurchase.id_purchase);
    if (ok) {
      showToast('Compra eliminada', 'success');
      await loadData();
    } else {
      showToast('No se pudo eliminar', 'error');
    }
    setIsSubmitting(false);
    setShowDeleteModal(false);
    setDeletingPurchase(null);
  };

  // ─── Crear variante ───────────────────────────────────────────────────────────
  const handleCreateVariant = async () => {
    const errors: Record<string, string> = {};

    // Validar producto
    if (!selectedProduct && !creatingNewProduct)         errors.product = 'Selecciona o crea un producto';
    if (creatingNewProduct) {
      if (!newProductName.trim())                        errors.productName     = 'Nombre requerido';
      if (!newProductPrice || Number(newProductPrice) <= 0) errors.productPrice = 'Precio debe ser > 0';
      if (!newProductPurchasePrice || Number(newProductPurchasePrice) <= 0) errors.productPurchasePrice = 'Precio de compra debe ser > 0';
      if (!newProductCategory)                           errors.productCategory = 'Categoría requerida';
    }
    if (!variantSizeId)   errors.size  = 'Selecciona una talla';
    if (!variantColorId)  errors.color = 'Selecciona un color';
    if (!variantSku.trim()) errors.sku = 'SKU requerido';

    setVariantErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsCreatingVariant(true);
    try {
      let productId = selectedProduct?.id_product ?? null;

      // Crear producto si es nuevo
      if (creatingNewProduct) {
        const newProd = await createProduct({
          name:     newProductName.trim(),
          price:    Number(newProductPrice),
          purchase_price: Number(newProductPurchasePrice),
          category: newProductCategory!,
        });
        if (!newProd) { showToast('Error al crear el producto', 'error'); return; }
        productId = newProd.id_product;
        showToast(`Producto "${newProd.name}" creado`, 'success');
      }

      // Crear variante
      const newVariant = await createVariant({
        product: productId!,
        size:    variantSizeId!,
        color:   variantColorId!,
        sku:     variantSku.trim(),
      });

      if (!newVariant) { showToast('Error al crear la variante', 'error'); return; }

      showToast('¡Variante creada exitosamente!', 'success');

      // Recargar variantes y productos
      const [vars, prods] = await Promise.all([getAllVariants(), getAllProducts()]);
      if (vars)  setVariants(vars);
      if (prods) setProducts(prods);

      // Auto-seleccionar la variante recién creada
      handleSelectVariant(newVariant);
      setItemPrecioVenta(String(newVariant.price ?? ''));

      setShowVariantModal(false);
      resetVariantModal();
    } catch {
      showToast('Error al crear la variante', 'error');
    } finally {
      setIsCreatingVariant(false);
    }
  };

  // ─── Paginación ───────────────────────────────────────────────────────────────
  const filtered   = purchases.filter(p =>
    p.purchase_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.provider_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.state_name    ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Cargando compras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-lg mb-1">Gestión de Compras</h2>
          <p className="text-gray-500 text-xs">Administra las compras a proveedores</p>
        </div>
        <Button onClick={handleCreate} variant="primary" size="lg">
          <Plus size={16} /> Agregar Compra
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Buscar por número, proveedor o estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">N° Compra</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Proveedor</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Fecha</th>
                <th className="text-center py-3 px-4 text-gray-600 font-medium">Items</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Estado</th>
                <th className="text-right py-3 px-4 text-gray-600 font-medium">Total</th>
                <th className="text-right py-3 px-4 text-gray-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Truck className="mx-auto mb-2 text-gray-300" size={40} />
                    <p>No se encontraron compras</p>
                  </td>
                </tr>
              ) : (
                paginated.map(purchase => (
                  <tr key={purchase.id_purchase} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-gray-400" />
                        <span className="font-medium text-gray-900">{purchase.purchase_number}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{purchase.provider_name ?? purchase.provider}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(purchase.purchase_date).toLocaleDateString('es-CO')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => { setViewingPurchase(purchase); setShowDetailModal(true); }}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        {purchase.details?.length ?? 0} items
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={purchase.state}
                        onChange={(e) => handlePatchState(purchase, Number(e.target.value))}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                      >
                        {states.map(s => (
                          <option key={s.id_state} value={s.id_state}>{s.name_state}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {formatCOP(purchase.total)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => { setViewingPurchase(purchase); setShowDetailModal(true); }}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(purchase)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">{filtered.length} compras — página {currentPage} de {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40">
                Anterior
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, currentPage - 2) + i;
                if (page > totalPages) return null;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      currentPage === page ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}>
                    {page}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal Nueva Compra ─────────────────────────────────────────────── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Compra" size="xxl" noScroll>
        <div className="w-[95vw] max-w-[1200px] max-h-[90vh] mx-auto flex flex-col text-xs">

          {/* Header del form */}
          <div className="border border-gray-200 rounded-lg bg-white p-3 shrink-0 mb-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

              {/* Proveedor */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Proveedor *</label>
                <select
                  value={formData.providerId ?? ''}
                  onChange={(e) => { setFormData(prev => ({ ...prev, providerId: Number(e.target.value) || null })); setFormErrors(prev => ({ ...prev, providerId: '' })); }}
                  className={`w-full h-8 px-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 ${formErrors.providerId ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Seleccionar proveedor...</option>
                  {providers.filter(p => p.is_active).map(p => (
                    <option key={p.id_provider} value={p.id_provider}>{p.name}</option>
                  ))}
                </select>
                {formErrors.providerId && <p className="text-red-500 text-xs mt-1">{formErrors.providerId}</p>}
                <button
                  type="button"
                  onClick={() => { setShowProveedorModal(true); setProveedorModalKey(k => k + 1); }}
                  className="mt-1 w-full h-7 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                >
                  + Agregar nuevo proveedor
                </button>
                {showProveedorModal && <ProveedoresManager key={proveedorModalKey} onlyModal openOnMount />}
              </div>

              {/* Estado */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Estado *</label>
                <select
                  value={formData.stateId ?? ''}
                  onChange={(e) => { setFormData(prev => ({ ...prev, stateId: Number(e.target.value) || null })); setFormErrors(prev => ({ ...prev, stateId: '' })); }}
                  className={`w-full h-8 px-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 ${formErrors.stateId ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Seleccionar estado...</option>
                  {states.map(s => (
                    <option key={s.id_state} value={s.id_state}>{s.name_state}</option>
                  ))}
                </select>
                {formErrors.stateId && <p className="text-red-500 text-xs mt-1">{formErrors.stateId}</p>}
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Observaciones</label>
                <input
                  type="text"
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Opcional..."
                  className="w-full h-8 px-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Body scrolleable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="border border-gray-200 rounded-lg bg-white p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Agregar productos</h4>
                <button
                  type="button"
                  onClick={() => { resetVariantModal(); setShowVariantModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs hover:bg-gray-700 transition-colors"
                >
                  <PackagePlus size={13} />
                  Nueva variante
                </button>
              </div>

              {itemsError && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
                  <AlertTriangle size={14} /> {itemsError}
                </div>
              )}

              {/* Fila agregar item */}
              <div className="bg-gray-50 rounded-lg p-2 mb-3 border border-gray-200">
                <div className="flex gap-2 items-end flex-wrap">

                  {/* Búsqueda variante */}
                  <div className="flex-1 min-w-[200px] relative">
                    <label className="block text-gray-600 mb-1">Variante (producto / talla / color)</label>
                    <input
                      type="text"
                      placeholder="Buscar variante..."
                      value={variantSearch}
                      onChange={(e) => { setVariantSearch(e.target.value); setSelectedVariant(null); setShowVariantDrop(true); }}
                      onFocus={() => setShowVariantDrop(true)}
                      className="w-full h-8 px-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                    {showVariantDrop && variantSearch && (
                      <div className="absolute z-50 mt-1 w-full max-h-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto">
                        {filteredVariants.length === 0 ? (
                          <div className="px-3 py-3 text-center">
                            <p className="text-gray-400 text-xs mb-2">Sin resultados</p>
                            <button
                              type="button"
                              onClick={() => { setShowVariantDrop(false); resetVariantModal(); setNewProductName(variantSearch); setCreatingNewProduct(true); setShowVariantModal(true); }}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mx-auto"
                            >
                              <PackagePlus size={12} /> Crear nueva variante
                            </button>
                          </div>
                        ) : (
                          filteredVariants.map(v => (
                            <button
                              key={v.id_variant}
                              type="button"
                              onClick={() => handleSelectVariant(v)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                            >
                              <p className="font-medium text-gray-900 text-xs">{v.product_name}</p>
                              <p className="text-gray-500 text-xs">{v.size_name} / {v.color_name} — SKU: {v.sku}</p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div className="w-24">
                    <label className="block text-gray-600 mb-1">Cantidad</label>
                    <Input type="number" value={itemCantidad} onChange={(e) => setItemCantidad(e.target.value)} placeholder="0" className="h-8 text-xs px-2" />
                  </div>

                  {/* P. Compra */}
                  <div className="w-32">
                    <label className="block text-gray-600 mb-1">P. Compra</label>
                    <Input type="number" value={itemPrecioCompra} onChange={(e) => setItemPrecioCompra(e.target.value)} placeholder="0" className="h-8 text-xs px-2" />
                  </div>

                  {/* P. Venta */}
                  <div className="w-32">
                    <label className="block text-gray-600 mb-1">P. Venta</label>
                    <Input type="number" value={itemPrecioVenta} onChange={(e) => setItemPrecioVenta(e.target.value)} placeholder="0" className="h-8 text-xs px-2" />
                  </div>

                  <Button onClick={agregarItem} variant="secondary" className="h-8 px-3 text-xs whitespace-nowrap">
                    <Plus size={14} /> Agregar
                  </Button>
                </div>
              </div>

              {/* Tabla items */}
              {formData.items.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-2 px-3 text-gray-600">Producto</th>
                        <th className="text-left py-2 px-3 text-gray-600">Talla</th>
                        <th className="text-left py-2 px-3 text-gray-600">Color</th>
                        <th className="text-right py-2 px-3 text-gray-600">Cant.</th>
                        <th className="text-right py-2 px-3 text-gray-600">P. Compra</th>
                        <th className="text-right py-2 px-3 text-gray-600">P. Venta</th>
                        <th className="text-right py-2 px-3 text-gray-600">Subtotal</th>
                        <th className="py-2 px-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {formData.items.map(item => (
                        <tr key={item.id}>
                          <td className="py-2 px-3 text-gray-900 font-medium">{item.productoNombre}</td>
                          <td className="py-2 px-3 text-gray-700">{item.size_name}</td>
                          <td className="py-2 px-3 text-gray-700">{item.color_name}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{item.cantidad}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{formatCOP(item.precioCompra)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{formatCOP(item.precioVenta)}</td>
                          <td className="py-2 px-3 text-right tabular-nums font-medium">{formatCOP(item.subtotal)}</td>
                          <td className="py-2 px-3">
                            <button onClick={() => eliminarItem(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Totales sticky */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-3 mt-2 shrink-0">
            <div className="flex items-end justify-between gap-4">
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 min-w-[240px]">
                <div className="flex justify-between text-gray-600 text-xs">
                  <span>Subtotal:</span><span className="tabular-nums font-medium">{formatCOP(calcSubtotal())}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-xs mt-1">
                  <span>IVA (19%):</span><span className="tabular-nums font-medium">{formatCOP(calcIva())}</span>
                </div>
                <div className="flex justify-between text-gray-900 text-sm font-bold mt-2 pt-2 border-t border-gray-200">
                  <span>Total:</span><span className="tabular-nums">{formatCOP(calcTotal())}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowModal(false)} variant="secondary" className="h-8 px-4 text-xs">Cancelar</Button>
                <Button onClick={handleSave} variant="primary" className="h-8 px-4 text-xs" disabled={isSubmitting}>
                  {isSubmitting ? 'Creando...' : 'Crear Compra'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ─── Modal Crear Variante (encima del modal compra) ─────────────────── */}
      <Modal
        isOpen={showVariantModal}
        onClose={() => { setShowVariantModal(false); resetVariantModal(); }}
        title="Nueva Variante de Producto"
        size="md"
      >
        <div className="space-y-4 text-sm">

          {/* ── Sección Producto ── */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-3">
            <h5 className="font-semibold text-gray-900 text-xs uppercase tracking-wide">1. Producto</h5>

            {!creatingNewProduct ? (
              <>
                {/* Buscar producto existente */}
                <div className="relative">
                  <label className="block text-gray-700 font-medium mb-1 text-xs">Buscar producto existente</label>
                  <input
                    type="text"
                    placeholder="Escribe el nombre del producto..."
                    value={variantProductSearch}
                    onChange={(e) => { setVariantProductSearch(e.target.value); setSelectedProduct(null); setShowProductDrop(true); }}
                    onFocus={() => setShowProductDrop(true)}
                    className={`w-full h-8 px-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 ${variantErrors.product ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {selectedProduct && (
                    <div className="mt-1 px-2 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-center justify-between">
                      <span>✓ {selectedProduct.name} — {selectedProduct.category_name}</span>
                      <button onClick={() => { setSelectedProduct(null); setVariantProductSearch(''); }} className="text-green-500 hover:text-green-700">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  {showProductDrop && variantProductSearch && !selectedProduct && (
                    <div className="absolute z-[60] mt-1 w-full max-h-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <p className="px-3 py-2 text-gray-400 text-xs">No encontrado</p>
                      ) : (
                        filteredProducts.map(p => (
                          <button
                            key={p.id_product}
                            type="button"
                            onClick={() => { setSelectedProduct(p); setVariantProductSearch(p.name); setShowProductDrop(false); setVariantErrors(prev => ({ ...prev, product: '' })); }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 text-xs"
                          >
                            <p className="font-medium text-gray-900">{p.name}</p>
                            <p className="text-gray-500">{p.category_name} — {formatCOP(p.price)}</p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {variantErrors.product && <p className="text-red-500 text-xs">{variantErrors.product}</p>}

                <button
                  type="button"
                  onClick={() => { setCreatingNewProduct(true); setSelectedProduct(null); setVariantProductSearch(''); }}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> El producto no existe, crear nuevo
                </button>
              </>
            ) : (
              <>
                {/* Crear nuevo producto */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700 flex items-center justify-between">
                  <span>Creando nuevo producto</span>
                  <button onClick={() => { setCreatingNewProduct(false); setNewProductName(''); setNewProductPrice(''); setNewProductCategory(null); }}
                    className="text-blue-500 hover:text-blue-700 text-xs underline">
                    Cancelar, buscar existente
                  </button>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-xs">Nombre *</label>
                  <Input
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Nombre del producto"
                    className={`h-8 text-xs ${variantErrors.productName ? 'border-red-400' : ''}`}
                  />
                  {variantErrors.productName && <p className="text-red-500 text-xs mt-1">{variantErrors.productName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1 text-xs">Precio compra *</label>
                    <Input
                      type="number"
                      value={newProductPurchasePrice}
                      onChange={(e) => setNewProductPurchasePrice(e.target.value)}
                      placeholder="0"
                      className={`h-8 text-xs ${variantErrors.productPurchasePrice ? 'border-red-400' : ''}`}
                    />
                    {variantErrors.productPurchasePrice && <p className="text-red-500 text-xs mt-1">{variantErrors.productPurchasePrice}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1 text-xs">Precio venta *</label>
                    <Input
                      type="number"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder="0"
                      className={`h-8 text-xs ${variantErrors.productPrice ? 'border-red-400' : ''}`}
                    />
                    {variantErrors.productPrice && <p className="text-red-500 text-xs mt-1">{variantErrors.productPrice}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1 text-xs">Categoría *</label>
                    <select
                      value={newProductCategory ?? ''}
                      onChange={(e) => setNewProductCategory(Number(e.target.value) || null)}
                      className={`w-full h-8 px-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 ${variantErrors.productCategory ? 'border-red-400' : 'border-gray-300'}`}
                    >
                      <option value="">Categoría...</option>
                      {categories.map(c => (
                        <option key={c.id_category} value={c.id_category}>{c.name}</option>
                      ))}
                    </select>
                    {variantErrors.productCategory && <p className="text-red-500 text-xs mt-1">{variantErrors.productCategory}</p>}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Sección Talla / Color / SKU ── */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-3">
            <h5 className="font-semibold text-gray-900 text-xs uppercase tracking-wide">2. Talla, Color y SKU</h5>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-xs">Talla *</label>
                <select
                  value={variantSizeId ?? ''}
                  onChange={(e) => { setVariantSizeId(Number(e.target.value) || null); setVariantErrors(prev => ({ ...prev, size: '' })); }}
                  className={`w-full h-8 px-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 ${variantErrors.size ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Seleccionar talla...</option>
                  {sizes.map(s => <option key={s.id_size} value={s.id_size}>{s.name}</option>)}
                </select>
                {variantErrors.size && <p className="text-red-500 text-xs mt-1">{variantErrors.size}</p>}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1 text-xs">Color *</label>
                <select
                  value={variantColorId ?? ''}
                  onChange={(e) => { setVariantColorId(Number(e.target.value) || null); setVariantErrors(prev => ({ ...prev, color: '' })); }}
                  className={`w-full h-8 px-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 ${variantErrors.color ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Seleccionar color...</option>
                  {colors.map(c => <option key={c.id_color} value={c.id_color}>{c.name}</option>)}
                </select>
                {variantErrors.color && <p className="text-red-500 text-xs mt-1">{variantErrors.color}</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-gray-700 font-medium text-xs">SKU *</label>
                <button type="button" onClick={autoSku} className="text-xs text-blue-600 hover:underline">
                  Generar automático
                </button>
              </div>
              <Input
                value={variantSku}
                onChange={(e) => { setVariantSku(e.target.value); setVariantErrors(prev => ({ ...prev, sku: '' })); }}
                placeholder="Ej: VES-M-NEG-001"
                className={`h-8 text-xs font-mono ${variantErrors.sku ? 'border-red-400' : ''}`}
              />
              {variantErrors.sku && <p className="text-red-500 text-xs mt-1">{variantErrors.sku}</p>}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-1">
            <Button onClick={() => { setShowVariantModal(false); resetVariantModal(); }} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleCreateVariant} variant="primary" disabled={isCreatingVariant}>
              {isCreatingVariant ? 'Creando...' : 'Crear variante'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal Ver Detalle Compra ───────────────────────────────────────── */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Detalles — ${viewingPurchase?.purchase_number}`}
      >
        {viewingPurchase && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-gray-500 text-xs mb-1">Proveedor</p>
                <p className="font-medium">{viewingPurchase.provider_name ?? viewingPurchase.provider}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Estado</p>
                <span className="inline-block px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium">
                  {viewingPurchase.state_name ?? viewingPurchase.state}
                </span>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Fecha compra</p>
                <p>{new Date(viewingPurchase.purchase_date).toLocaleDateString('es-CO')}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Fecha registro</p>
                <p>{new Date(viewingPurchase.registration_date).toLocaleDateString('es-CO')}</p>
              </div>
            </div>

            {viewingPurchase.observations && (
              <div>
                <p className="text-gray-500 text-xs mb-1">Observaciones</p>
                <p className="bg-gray-50 rounded-lg p-2 text-sm">{viewingPurchase.observations}</p>
              </div>
            )}

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-3 text-gray-600">Variante</th>
                    <th className="text-right py-2 px-3 text-gray-600">Cant.</th>
                    <th className="text-right py-2 px-3 text-gray-600">P. Compra</th>
                    <th className="text-right py-2 px-3 text-gray-600">P. Venta</th>
                    <th className="text-right py-2 px-3 text-gray-600">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(viewingPurchase.details ?? []).map(detail => {
                    const variant = variants.find(v => v.id_variant === detail.variant);
                    return (
                      <tr key={detail.id_detail}>
                        <td className="py-2 px-3">
                          {variant ? `${variant.product_name} — ${variant.size_name} / ${variant.color_name}` : `Variante #${detail.variant}`}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">{detail.quantity}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{formatCOP(detail.purchase_price)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{formatCOP(detail.sales_price)}</td>
                        <td className="py-2 px-3 text-right tabular-nums font-medium">{formatCOP(detail.subtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-gray-600 text-xs">
                <span>Subtotal</span><span className="tabular-nums">{formatCOP(viewingPurchase.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-xs">
                <span>IVA</span><span className="tabular-nums">{formatCOP(viewingPurchase.iva)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span><span className="tabular-nums">{formatCOP(viewingPurchase.total)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Eliminar Compra" size="sm">
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 mb-1">Esta acción no se puede deshacer</p>
              <p className="text-red-600 text-xs">
                Se eliminará permanentemente la compra <strong>{deletingPurchase?.purchase_number}</strong> y todos sus detalles.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button onClick={() => setShowDeleteModal(false)} variant="secondary">Cancelar</Button>
            <Button
              onClick={confirmDelete}
              variant="primary"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 border-red-600"
            >
              {isSubmitting ? 'Eliminando...' : 'Eliminar compra'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
