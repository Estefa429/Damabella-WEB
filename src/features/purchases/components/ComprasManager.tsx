import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Truck, Eye, X, Trash2, AlertTriangle, PackagePlus, Ban } from 'lucide-react';
import { Button, Input, Modal } from '../../../shared/components/native';
import { useToast } from '../../../shared/components/native';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { ProveedoresManager } from '../../suppliers/components/ProveedoresManager';

// ─── Services ─────────────────────────────────────────────────────────────────
import { getAllProviders, Providers }       from '@/features/suppliers/services/providersService';
import { getAllCategories, Categories }     from '@/features/ecommerce/categories/services/categoriesService';
import { getAllIvas, Iva, createIva } from '@/features/purchases/services/ivaService';
import { getAllVariants, getAllPurchases, createPurchase, deletePurchase, patchPurchaseState, Purchase, VariantProduct, CreatePurchaseDetailDTO } from '@/features/purchases/services/PurchasesService';
import { getAllStates, State }              from '@/features/purchases/services/statesService';
import { getAllProducts, getAllColors, getAllSizes, createProduct, createProductWithVariant, createVariant, createColor, createSize, Product, Color, Size } from '@/features/ecommerce/products/services/productsService';

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
  ivaRate:        number;
  ivaPercent:     number;
}

import { formatCOP } from '@/features/dashboard/utils/dashboardHelpers';

interface FormData {
  providerId:   number | null;
  purchaseDate: string;
  stateId:      number | null;
  observations: string;
  items:        ItemCompra[];
  envio?:        number;
}

export function ComprasManager({ initialSearchTerm = '' }: { initialSearchTerm?: string }) {
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();

  // ─── Data from API ───────────────────────────────────────────────────────────
  const [providers,  setProviders]  = useState<Providers[]>([]);
  const [categories, setCategories] = useState<Categories[]>([]);
  const [variants,   setVariants]   = useState<VariantProduct[]>([]);
  const [states,     setStates]     = useState<State[]>([]);
  const [purchases,  setPurchases]  = useState<Purchase[]>([]);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [colors,     setColors]     = useState<Color[]>([]);
  const [sizes,      setSizes]      = useState<Size[]>([]);
  const [ivas,       setIvas]       = useState<Iva[]>([]);
  const [loading,    setLoading]    = useState(true);

  // ─── UI State ────────────────────────────────────────────────────────────────
  const [searchTerm,         setSearchTerm]         = useState(initialSearchTerm);

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);
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
  const [formData,   setFormData]   = useState<FormData>({ providerId: null, purchaseDate: new Date().toISOString().split('T')[0], stateId: null, observations: '', items: [], envio: 0 });
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
  const [newProductIvaId, setNewProductIvaId] = useState<number | null>(null);
  const [showExpressIvaForm, setShowExpressIvaForm] = useState(false);
  const [expressIvaPercentage, setExpressIvaPercentage] = useState('');
  const [isCreatingExpressIva, setIsCreatingExpressIva] = useState(false);

  // Paso 2: talla, color, SKU
  const [variantSizeId,  setVariantSizeId]  = useState<number | null>(null);
  const [variantColorId, setVariantColorId] = useState<number | null>(null);
  const [variantCustomSize,  setVariantCustomSize]  = useState('');
  const [variantCustomColor, setVariantCustomColor] = useState('');
  const [variantCustomColorHex, setVariantCustomColorHex] = useState('#000000');
  const [variantSizeMode, setVariantSizeMode] = useState<'select' | 'write'>('select');
  const [variantColorMode, setVariantColorMode] = useState<'select' | 'write'>('select');
  const [variantSku,     setVariantSku]     = useState('');
  const [variantErrors,  setVariantErrors]  = useState<Record<string, string>>({});

  // ─── Load all data ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prov, cats, vars, sts, purch, prods, cols, szs, ivaList] = await Promise.all([
        getAllProviders(),
        getAllCategories(),
        getAllVariants(),
        getAllStates(),
        getAllPurchases(),
        getAllProducts(),
        getAllColors(),
        getAllSizes(),
        getAllIvas(),
      ]);
      if (prov)  setProviders(prov);
      if (cats)  setCategories(cats);
      // Normalizar variantes: si la variante no trae `purchase_price`, buscar en el product asociado
      if (vars && prods) {
        const normalized = vars.map(v => {
          try {
            const prod = (prods as any[]).find(p => Number(p.id_product ?? p.id) === Number(v.product));
            const purchasePriceFromProd = prod ? (prod.purchase_price ?? prod.purchasePrice ?? prod.purchasePriceRaw ?? prod.price) : undefined;
            return { ...v, purchase_price: v.purchase_price ?? purchasePriceFromProd };
          } catch (e) {
            return v;
          }
        });
        setVariants(normalized as VariantProduct[]);
      } else if (vars) {
        setVariants(vars);
      }
      if (sts)   setStates(sts);
      if (purch) setPurchases(purch);
      if (prods) setProducts(prods);
      if (cols)  setColors(cols);
      if (szs)   setSizes(szs);
      if (ivaList) setIvas(ivaList);
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
    setFormData({ providerId: null, purchaseDate: new Date().toISOString().split('T')[0], stateId: null, observations: '', items: [], envio: 0 });
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
    setNewProductIvaId(null);
    setShowExpressIvaForm(false);
    setExpressIvaPercentage('');
    setCreatingNewProduct(false);
    setVariantSizeId(null);
    setVariantColorId(null);
    setVariantCustomSize('');
    setVariantCustomColor('');
    setVariantCustomColorHex('#000000');
    setVariantSizeMode('select');
    setVariantColorMode('select');
    setVariantSku('');
    setVariantErrors({});
  };

  const handleCreate = () => {
    resetForm();
    setShowProveedorModal(false);
    setProveedorModalKey(0);
    setShowModal(true);
  };

  // ─── Variantes filtradas ──────────────────────────────────────────────────────
  const filteredVariants = variants.filter(v =>
    v.product_name.toLowerCase().includes(variantSearch.toLowerCase()) ||
    v.sku.toLowerCase().includes(variantSearch.toLowerCase()) ||
    v.size_name.toLowerCase().includes(variantSearch.toLowerCase()) ||
    v.color_name.toLowerCase().includes(variantSearch.toLowerCase())
  );

  const findProductById = (productId: number) => products.find(p => p.id_product === productId);

  const formatVariantDisplay = (variant: VariantProduct) => {
    const product = findProductById(variant.product);
    return `${variant.product_name} — ${variant.size_name} / ${variant.color_name}` +
      (product ? ` · ${product.category_name}` : '');
  };

  // ─── Productos filtrados (para buscar en modal crear variante) ────────────────
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(variantProductSearch.toLowerCase())
  );

  const selectedProvider = providers.find(p => p.id_provider === formData.providerId);

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
  const getProductIvaRate = (productId: number) => {
    const product = findProductById(productId);
    if (!product) return 0;

    const ivaId = Number(product.iva ?? 0);
    const ivaItem = ivas.find(i => i.id_iva === ivaId);
    if (ivaItem) return ivaItem.value;

    const rawIva = Number(product.iva ?? 0);
    if (!Number.isFinite(rawIva) || rawIva <= 0) return 0;
    return rawIva > 1 ? rawIva / 100 : rawIva;
  };

  const handleSelectVariant = (variant: VariantProduct) => {
    const product = findProductById(variant.product);
    setSelectedVariant(variant);
    setVariantSearch(`${variant.product_name} — ${variant.size_name} / ${variant.color_name}`);

    const v: any = variant as any;
    const purchasePrice = v.purchase_price ?? v.purchasePrice ?? v.purchase_price_raw ?? v.purchase ?? product?.purchase_price ?? product?.price ?? null;
    const salePrice = v.price ?? v.sale_price ?? v.sales_price ?? v.price_unit ?? product?.price ?? null;

    setItemPrecioVenta(String(salePrice ?? ''));
    setItemPrecioCompra(String(purchasePrice ?? salePrice ?? ''));
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

    const ivaRate = getProductIvaRate(selectedVariant.product);
    const ivaPercent = Math.round(ivaRate * 100);

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
        ivaRate,
        ivaPercent,
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
  const calcTotalIva = () => formData.items.reduce((s, i) => s + i.subtotal * i.ivaRate, 0);
  const calcTotal    = () => calcSubtotal() + (formData.envio || 0) + calcTotalIva();
  const calcItemTotalWithIva = (item: ItemCompra) => item.subtotal * (1 + item.ivaRate);

  // ─── Validar form ─────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.providerId) errors.providerId = 'Selecciona un proveedor';
    if (!formData.purchaseDate) {
      errors.purchaseDate = 'Ingresa la fecha de compra';
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      if (formData.purchaseDate > todayStr) {
        errors.purchaseDate = 'La fecha no puede ser posterior a la actual';
      }
    }
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
        subtotal:       item.subtotal,
        purchase:       null,
      } as any));
      const obsWithEnvio = formData.envio && formData.envio > 0
        ? `${formData.observations || ''} [Costo Envío: ${formatCOP(formData.envio)}]`.trim()
        : formData.observations;
      const payload: any = {
        provider: formData.providerId!,
        observations: obsWithEnvio || undefined,
        details,
      };
      const result = await createPurchase(payload);
      if (result) {
        showToast('¡Compra creada exitosamente!', 'success');
        await loadData();
        setShowModal(false);
        setShowProveedorModal(false);
        setProveedorModalKey(0);
        resetForm();
        resetVariantModal();
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
  const isPurchaseCanceled = (purchase: Purchase) => {
    const canceledValue = purchase.canceled as unknown;
    const canceledText = String(canceledValue).toLowerCase();
    const canceledBool = canceledValue === true || canceledText === 'true' || canceledText === '1';
    return canceledBool;
  };

  const handlePatchState = async (purchase: Purchase, stateId: number, canceled?: boolean) => {
    const result = await patchPurchaseState(purchase.id_purchase, stateId, canceled);
    if (result) { showToast('Estado actualizado', 'success'); await loadData(); }
    else          showToast('No se pudo cambiar el estado', 'error');
  };

  // ─── Anular compra ────────────────────────────────────────────────────────────
  const handleCancelPurchase = async (purchase: Purchase) => {
    // Marca la compra como cancelada usando el flag `canceled`.
    // El backend espera un `state` en el body; reusamos el valor actual de `purchase.state`.
    const stateValue = typeof purchase.state !== 'undefined' ? purchase.state : 0;
    const result = await patchPurchaseState(purchase.id_purchase, stateValue, true);
    if (result) {
      showToast('Compra anulada correctamente', 'success');
      await loadData();
    } else {
      showToast('No se pudo anular la compra', 'error');
    }
  };

  // ─── Eliminar compra ──────────────────────────────────────────────────────────
  const handleDelete = (purchase: Purchase) => {
    if (!isPurchaseCanceled(purchase)) {
      showToast('Solo se pueden eliminar compras anuladas', 'error');
      return;
    }
    setDeletingPurchase(purchase);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingPurchase) return;
    setIsSubmitting(true);
    console.debug('[ComprasManager] confirmDelete deletingPurchase', { deletingPurchase });
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

  // ─── Crear IVA Express ────────────────────────────────────────────────────────
  const handleCreateExpressIva = async () => {
    if (!expressIvaPercentage) {
      showToast('Ingresa un porcentaje de IVA', 'error');
      return;
    }
    const percent = parseFloat(expressIvaPercentage);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      showToast('El IVA debe ser un número entre 0 y 100', 'error');
      return;
    }

    setIsCreatingExpressIva(true);
    try {
      const created = await createIva({ percentage: percent });
      if (created) {
        showToast(`IVA ${percent}% creado exitosamente`, 'success');
        const refreshedIvas = await getAllIvas();
        if (refreshedIvas) {
          setIvas(refreshedIvas);
          setNewProductIvaId(created.id_iva);
        }
        setShowExpressIvaForm(false);
        setExpressIvaPercentage('');
      } else {
        showToast('Error al crear el IVA', 'error');
      }
    } catch (error) {
      console.error('Error creating express IVA:', error);
      showToast('Error al crear el IVA', 'error');
    } finally {
      setIsCreatingExpressIva(false);
    }
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
      if (!newProductIvaId)                              errors.iva             = 'IVA requerido';
    }
    // Validar talla
    if (variantSizeMode === 'select' && !variantSizeId) errors.size = 'Selecciona una talla';
    if (variantSizeMode === 'write' && !variantCustomSize.trim()) errors.size = 'Escribe una talla';
    // Validar color
    if (variantColorMode === 'select' && !variantColorId) errors.color = 'Selecciona un color';
    if (variantColorMode === 'write' && !variantCustomColor.trim()) errors.color = 'Escribe un color';
    if (!variantSku.trim()) errors.sku = 'SKU requerido';

    setVariantErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsCreatingVariant(true);
    try {
      let productId = selectedProduct ? Number(selectedProduct.id_product ?? (selectedProduct as any).id ?? 0) || null : null;
      let createdVariant: VariantProduct | null = null;

      if (!creatingNewProduct && !productId) {
        showToast('Error: no se recibió un producto válido', 'error');
        return;
      }

      // Obtener o crear talla
      let sizeId: number;
      if (variantSizeMode === 'select') {
        sizeId = variantSizeId!;
      } else {
        // Modo write: crear talla personalizada
        const newSize = await createSize(variantCustomSize.trim());
        if (!newSize) { showToast('Error al crear la talla', 'error'); return; }
        sizeId = newSize.id_size;
        showToast(`Talla "${newSize.name}" creada`, 'success');
      }

      // Obtener o crear color
      let colorId: number;
      if (variantColorMode === 'select') {
        colorId = variantColorId!;
      } else {
        // Modo write: crear color personalizado
        const newColor = await createColor(variantCustomColor.trim());
        if (!newColor) { showToast('Error al crear el color', 'error'); return; }
        colorId = newColor.id_color;
        showToast(`Color "${newColor.name}" creada`, 'success');
      }

      if (creatingNewProduct) {
        const newProdWithVariant = await createProductWithVariant({
          name:           newProductName.trim(),
          category:       newProductCategory!,
          price:          Number(newProductPrice),
          purchase_price: Number(newProductPurchasePrice),
          iva:            newProductIvaId!,
          sku:            variantSku.trim(),
          size:           sizeId,
          color:          colorId,
          stock:          0,
        });

        if (!newProdWithVariant) {
          showToast('Error al crear el producto y la variante', 'error');
          return;
        }

        productId = newProdWithVariant.id_product;
        showToast(`Producto "${newProdWithVariant.name}" y variante creados`, 'success');
      } else {
        // Solo crear variante para producto existente
        createdVariant = await createVariant({
          product: productId!,
          size:    sizeId,
          color:   colorId,
          sku:     variantSku.trim(),
        });

        if (!createdVariant) {
          showToast('Error al crear la variante', 'error');
          return;
        }

        showToast('¡Variante creada exitosamente!', 'success');
      }

      // Recargar variantes, productos, colores y tallas
      const [vars, prods, cols, szs] = await Promise.all([getAllVariants(), getAllProducts(), getAllColors(), getAllSizes()]);
      if (vars)  setVariants(vars);
      if (prods) setProducts(prods);
      if (cols)  setColors(cols);
      if (szs)   setSizes(szs);

      if (creatingNewProduct) {
        const foundVariant = vars?.find(v => v.sku === variantSku.trim() && v.product === productId);
        if (foundVariant) {
          createdVariant = foundVariant;
        }
      }

      if (!createdVariant) {
        showToast('Producto creado, pero no se pudo seleccionar automáticamente la variante', 'warning');
      } else {
        handleSelectVariant(createdVariant);
        setItemPrecioVenta(String(createdVariant.price ?? ''));
      }

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
        {hasPermission('compras', 'create') && (
          <Button onClick={handleCreate} variant="primary">
            <Plus size={20} /> Registrar Compra
          </Button>
        )}
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
                <th className="text-right py-3 px-4 text-gray-600 font-medium">Total</th>
                <th className="text-right py-3 px-4 text-gray-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Truck className="mx-auto mb-2 text-gray-300" size={40} />
                    <p>No se encontraron compras</p>
                  </td>
                </tr>
              ) : (
                paginated.map(purchase => {
                  const isCanceled = isPurchaseCanceled(purchase);
                  return (
                    <tr key={purchase.id_purchase} className={`${isCanceled ? 'bg-red-50 text-red-900' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Truck size={14} className={isCanceled ? 'text-red-500' : 'text-gray-400'} />
                            <span className={`font-medium ${isCanceled ? 'text-red-900' : 'text-gray-900'}`}>{purchase.purchase_number}</span>
                          </div>
                          {isCanceled && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-red-100 text-red-700 w-max">
                              Anulada
                            </span>
                          )}
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
                          onClick={() => handleCancelPurchase(purchase)}
                          className="p-1.5 hover:bg-yellow-50 rounded-lg text-yellow-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Anular compra"
                          disabled={isPurchaseCanceled(purchase) || !hasPermission('compras', 'delete')}
                        >
                          <Ban size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(purchase)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={!hasPermission('compras', 'delete')}
                          title={!hasPermission('compras', 'delete') ? "Sin permiso para eliminar" : "Eliminar compra"}
                        >
                          <Trash2 size={16} />
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
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setShowProveedorModal(false);
          setProveedorModalKey(0);
          resetForm();
          resetVariantModal();
        }}
        title="Nueva Compra"
        size="xxl"
      >
        <div className="w-full text-xs">

          {/* ─── SECCIÓN 1: Datos Básicos ─────────────────────────────────── */}
          <div className="border border-gray-200 rounded-lg bg-white p-3 shrink-0 mb-2">
            <h4 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">Datos de la Compra</h4>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">

              {/* Proveedor */}
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-xs">Proveedor *</label>
                <select
                  value={formData.providerId ?? ''}
                  onChange={(e) => { setFormData(prev => ({ ...prev, providerId: Number(e.target.value) || null })); setFormErrors(prev => ({ ...prev, providerId: '' })); }}
                  className={`w-full h-8 px-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 ${formErrors.providerId ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Seleccionar...</option>
                    {providers.filter(p => p.is_active).map(p => (
                      <option key={p.id_provider} value={p.id_provider}>
                        {p.name} {p.number_doc ? `- NIT ${p.number_doc}` : ''}
                      </option>
                  ))}
                </select>
                {formErrors.providerId && <p className="text-red-500 text-xs mt-1">{formErrors.providerId}</p>}
                  {selectedProvider && (
                    <p className="text-gray-500 text-xs mt-1">NIT: {selectedProvider.number_doc || 'No disponible'}</p>
                  )}
                <button
                  type="button"
                  onClick={() => { setShowProveedorModal(true); setProveedorModalKey(k => k + 1); }}
                  className="mt-1 w-full h-7 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50 transition-colors text-xs"
                >
                  + Nuevo proveedor
                </button>
                {showProveedorModal && (
                  <ProveedoresManager
                    key={proveedorModalKey}
                    onlyModal
                    openOnMount
                    onClose={() => {
                      setShowProveedorModal(false);
                      setProveedorModalKey(0);
                    }}
                  />
                )}
              </div>

              {/* Fecha de Compra */}
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-xs">Fecha de Compra *</label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => { setFormData(prev => ({ ...prev, purchaseDate: e.target.value })); setFormErrors(prev => ({ ...prev, purchaseDate: '' })); }}
                  className={`w-full h-8 px-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 ${formErrors.purchaseDate ? 'border-red-400' : 'border-gray-300'}`}
                />
                {formErrors.purchaseDate && <p className="text-red-500 text-xs mt-1">{formErrors.purchaseDate}</p>}
              </div>

            </div>
          </div>

          {/* ─── SECCIÓN 2: Observaciones y Envío ─────────────────────────── */}
          <div className="border border-gray-200 rounded-lg bg-white p-3 shrink-0 mb-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-medium mb-1 text-xs">Observaciones (Opcional)</label>
                <input
                  type="text"
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Notas sobre esta compra..."
                  className="w-full h-8 px-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-xs">Costo de Envío (Opcional)</label>
                <input
                  type="number"
                  value={formData.envio || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setFormData(prev => ({ ...prev, envio: isNaN(val) ? 0 : val }));
                  }}
                  placeholder="0"
                  className="w-full h-8 px-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* ─── SECCIÓN 3: Agregar Productos ────────────────────────────── */}
          <div className="border border-gray-200 rounded-lg bg-white p-3 mb-2">
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
                    onBlur={() => setTimeout(() => setShowVariantDrop(false), 200)}
                    className="w-full h-8 px-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  {selectedVariant && (
                    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="font-semibold">Producto</p>
                          <p className="text-gray-600 truncate">{selectedVariant.product_name}</p>
                        </div>
                        <div>
                          <p className="font-semibold">Cantidad</p>
                          <p className="text-gray-600">{itemCantidad || '0'}</p>
                        </div>
                        <div>
                          <p className="font-semibold">Talla</p>
                          <p className="text-gray-600">{selectedVariant.size_name}</p>
                        </div>
                        <div>
                          <p className="font-semibold">Color</p>
                          <p className="text-gray-600">{selectedVariant.color_name}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {showVariantDrop && (
                    <div className="absolute z-50 mt-1 w-full max-h-72 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto text-xs">
                      {filteredVariants.length === 0 ? (
                        <div className="px-3 py-3 text-center">
                          <p className="text-gray-400 text-xs mb-2">Sin resultados</p>
                          <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); setShowVariantDrop(false); resetVariantModal(); setNewProductName(variantSearch); setCreatingNewProduct(true); setShowVariantModal(true); }}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mx-auto"
                          >
                            <PackagePlus size={12} /> Crear nueva variante
                          </button>
                        </div>
                      ) : (
                        filteredVariants.map(v => {
                          const product = findProductById(v.product);
                          return (
                            <button
                              key={v.id_variant}
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); handleSelectVariant(v); }}
                              className="w-full text-left px-3 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900">{v.product_name}</p>
                                  <p className="text-gray-500">{product?.category_name ?? 'Sin categoría'}</p>
                                </div>
                                <div className="text-right text-gray-500">
                                  <p className="text-xs">{formatCOP(v.price)}</p>
                                  <p className="text-xs">Compra {formatCOP(v.purchase_price ?? product?.purchase_price ?? v.price)}</p>
                                </div>
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                                <div className="rounded-lg bg-gray-50 p-2">
                                  <span className="block text-[11px] text-gray-500 uppercase">Talla</span>
                                  <span>{v.size_name}</span>
                                </div>
                                <div className="rounded-lg bg-gray-50 p-2">
                                  <span className="block text-[11px] text-gray-500 uppercase">Color</span>
                                  <span>{v.color_name}</span>
                                </div>
                              </div>
                              <div className="mt-2 rounded-lg bg-gray-50 p-2 text-gray-600 text-[11px]">
                                <span className="font-medium">SKU:</span> {v.sku}
                              </div>
                            </button>
                          );
                        })
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
                  <Input type="number" value={itemPrecioCompra} readOnly placeholder="0" className="h-8 text-xs px-2 bg-gray-100 cursor-not-allowed" />
                </div>

                {/* P. Venta */}
                <div className="w-32">
                  <label className="block text-gray-600 mb-1">P. Venta</label>
                  <Input type="number" value={itemPrecioVenta} readOnly placeholder="0" className="h-8 text-xs px-2 bg-gray-100 cursor-not-allowed" />
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
                      <th className="text-right py-2 px-3 text-gray-600">IVA</th>
                      <th className="text-right py-2 px-3 text-gray-600">Total parcial</th>
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
                        <td className="py-2 px-3 text-right tabular-nums">{item.ivaPercent}% ({formatCOP(item.subtotal * item.ivaRate)})</td>
                        <td className="py-2 px-3 text-right tabular-nums font-medium">{formatCOP(calcItemTotalWithIva(item))}</td>
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

          {/* Totales */}
          <div className="bg-white border-t border-gray-200 pt-3 mt-4 shrink-0">
            <div className="flex items-end justify-between gap-4">
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 min-w-[240px]">
                <div className="flex justify-between text-gray-600 text-xs">
                  <span>Subtotal:</span><span className="tabular-nums font-medium">{formatCOP(calcSubtotal())}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-xs mt-2">
                  <span>Envío:</span><span className="tabular-nums font-medium">{formatCOP(formData.envio || 0)}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-xs mt-2">
                  <span>Total IVA:</span><span className="tabular-nums font-medium">{formatCOP(calcTotalIva())}</span>
                </div>
                <div className="flex justify-between text-gray-900 text-sm font-bold mt-2 pt-2 border-t border-gray-200">
                  <span>Total General:</span><span className="tabular-nums">{formatCOP(calcTotal())}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowModal(false);
                    setShowProveedorModal(false);
                    setProveedorModalKey(0);
                    resetForm();
                    resetVariantModal();
                  }}
                  variant="secondary"
                  className="h-8 px-4 text-xs"
                >
                  Cancelar
                </Button>
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
        size="xl"
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
                    onBlur={() => setTimeout(() => setShowProductDrop(false), 200)}
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
                            onMouseDown={(e) => { e.preventDefault(); setSelectedProduct(p); setVariantProductSearch(p.name); setShowProductDrop(false); setVariantErrors(prev => ({ ...prev, product: '' })); }}
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
                  <button onClick={() => { setCreatingNewProduct(false); setNewProductName(''); setNewProductPrice(''); setNewProductPurchasePrice(''); setNewProductCategory(null); setNewProductIvaId(null); setShowExpressIvaForm(false); setExpressIvaPercentage(''); }}
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

                <div className="grid grid-cols-2 gap-3 min-w-0">
                  <div className="min-w-0">
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
                  <div className="min-w-0">
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
                  <div className="min-w-0">
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
                  <div className="min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-gray-700 font-medium text-xs">IVA *</label>
                      <button
                        type="button"
                        onClick={() => setShowExpressIvaForm(!showExpressIvaForm)}
                        className="text-[10px] text-blue-600 hover:underline hover:text-blue-800 font-medium"
                      >
                        + Crear nuevo IVA
                      </button>
                    </div>

                    {showExpressIvaForm ? (
                      <div className="flex gap-1 items-center">
                        <input
                          type="number"
                          value={expressIvaPercentage}
                          onChange={(e) => setExpressIvaPercentage(e.target.value)}
                          placeholder="Ej: 19"
                          className="w-16 h-8 px-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
                          min="0"
                          max="100"
                        />
                        <span className="text-xs text-gray-500">%</span>
                        <button
                          type="button"
                          onClick={handleCreateExpressIva}
                          disabled={isCreatingExpressIva}
                          className="h-8 px-2 bg-blue-600 text-white rounded-lg text-[10px] hover:bg-blue-700 font-medium"
                        >
                          {isCreatingExpressIva ? '...' : 'OK'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowExpressIvaForm(false); setExpressIvaPercentage(''); }}
                          className="h-8 px-1.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] hover:bg-gray-200"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <select
                        value={newProductIvaId ?? ''}
                        onChange={(e) => {
                          setNewProductIvaId(Number(e.target.value) || null);
                          setVariantErrors(prev => ({ ...prev, iva: '' }));
                        }}
                        className={`w-full h-8 px-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 ${variantErrors.iva ? 'border-red-400' : 'border-gray-300'}`}
                      >
                        <option value="">Seleccionar IVA...</option>
                        {ivas.map(iva => (
                          <option key={iva.id_iva} value={iva.id_iva}>{iva.name}</option>
                        ))}
                      </select>
                    )}
                    {variantErrors.iva && <p className="text-red-500 text-[10px] mt-1">{variantErrors.iva}</p>}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Sección Talla / Color / SKU ── */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-3">
            <h5 className="font-semibold text-gray-900 text-xs uppercase tracking-wide">2. Talla, Color y SKU</h5>

            {/* Talla */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-gray-700 font-medium text-xs">Talla *</label>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => { setVariantSizeMode('select'); setVariantCustomSize(''); }}
                    className={`px-2 py-1 rounded transition-colors ${
                      variantSizeMode === 'select'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Seleccionar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVariantSizeMode('write'); setVariantSizeId(null); }}
                    className={`px-2 py-1 rounded transition-colors ${
                      variantSizeMode === 'write'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Escribir
                  </button>
                </div>
              </div>

              {variantSizeMode === 'select' ? (
                <select
                  value={variantSizeId ?? ''}
                  onChange={(e) => { setVariantSizeId(Number(e.target.value) || null); setVariantErrors(prev => ({ ...prev, size: '' })); }}
                  className={`w-full h-8 px-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 ${variantErrors.size ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Seleccionar talla...</option>
                  {sizes.map(s => <option key={s.id_size} value={s.id_size}>{s.name}</option>)}
                </select>
              ) : (
                <Input
                  value={variantCustomSize}
                  onChange={(e) => { setVariantCustomSize(e.target.value); setVariantErrors(prev => ({ ...prev, size: '' })); }}
                  placeholder="Ej: M, L, 38, etc."
                  className={`h-8 text-xs ${variantErrors.size ? 'border-red-400' : ''}`}
                />
              )}
              {variantErrors.size && <p className="text-red-500 text-xs mt-1">{variantErrors.size}</p>}
            </div>

            {/* Color */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-gray-700 font-medium text-xs">Color *</label>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => { setVariantColorMode('select'); setVariantCustomColor(''); }}
                    className={`px-2 py-1 rounded transition-colors ${
                      variantColorMode === 'select'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Seleccionar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVariantColorMode('write'); setVariantColorId(null); }}
                    className={`px-2 py-1 rounded transition-colors ${
                      variantColorMode === 'write'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Escribir
                  </button>
                </div>
              </div>

              {variantColorMode === 'select' ? (
                <select
                  value={variantColorId ?? ''}
                  onChange={(e) => { setVariantColorId(Number(e.target.value) || null); setVariantErrors(prev => ({ ...prev, color: '' })); }}
                  className={`w-full h-8 px-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 ${variantErrors.color ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Seleccionar color...</option>
                  {colors.map(c => <option key={c.id_color} value={c.id_color}>{c.name}</option>)}
                </select>
              ) : (
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      value={variantCustomColor}
                      onChange={(e) => { setVariantCustomColor(e.target.value); setVariantErrors(prev => ({ ...prev, color: '' })); }}
                      placeholder="Ej: Rojo, Azul Oscuro, etc."
                      className={`h-8 text-xs ${variantErrors.color ? 'border-red-400' : ''}`}
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-0.5">
                    <label className="text-gray-600 font-medium text-xs">Paleta:</label>
                    <input
                      type="color"
                      value={variantCustomColorHex}
                      onChange={(e) => setVariantCustomColorHex(e.target.value)}
                      className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                      title="Selecciona el color"
                    />
                  </div>
                </div>
              )}
              {variantErrors.color && <p className="text-red-500 text-xs mt-1">{variantErrors.color}</p>}
            </div>

            {/* SKU */}
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
          <div className="space-y-4 text-sm max-h-[85vh] overflow-y-auto pr-2">
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
                    <th className="text-right py-2 px-3 text-gray-600">IVA</th>
                    <th className="text-right py-2 px-3 text-gray-600">Subtotal con IVA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(viewingPurchase.details ?? []).map(detail => {
                    const variant = variants.find(v => v.id_variant === detail.variant);
                    const product = variant ? findProductById(variant.product) : null;
                    const ivaRate = product ? getProductIvaRate(product.id_product) : 0;
                    const ivaPercent = Math.round(ivaRate * 100);
                    const ivaValue = detail.subtotal * ivaRate;
                    const totalWithIva = detail.subtotal + ivaValue;
                    return (
                      <tr key={detail.id_detail}>
                        <td className="py-2 px-3">
                          {variant ? `${variant.product_name} — ${variant.size_name} / ${variant.color_name}` : `Variante #${detail.variant}`}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">{detail.quantity}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{formatCOP(detail.purchase_price)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{formatCOP(detail.sales_price)}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-gray-600">
                          {ivaPercent}% ({formatCOP(ivaValue)})
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums font-medium">{formatCOP(totalWithIva)}</td>
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
                <span>Total IVA</span><span className="tabular-nums">{formatCOP(viewingPurchase.iva)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total General</span><span className="tabular-nums">{formatCOP(viewingPurchase.total)}</span>
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
