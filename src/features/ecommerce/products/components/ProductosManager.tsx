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
  getPhotos,
  getPhotosById,
  createPhotos,
  deletePhotos,
  exportProductsToExcel,
  Product,
  Inventory,
  Color,
  Size,
  Photo,
} from '@/features/ecommerce/products/services/productsService';
import { getAllIvas, Iva } from '@/features/purchases/services/ivaService';
import { API } from '@/services/ApiConfigure';
import { getAllVariants, VariantProduct } from '@/features/purchases/services/PurchasesService';
import { getAllCategories, Categories } from '@/features/ecommerce/categories/services/categoriesService';
import { formatCOP } from '@/features/dashboard/utils/dashboardHelpers';

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
  const [ivas,       setIvas]       = useState<Iva[]>([]);
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
  const [editIvaId,    setEditIvaId]    = useState<number | null>(null);
  const [editErrors,   setEditErrors]   = useState<Record<string, string>>({});
  const [editPurchasePrice, setEditPurchasePrice] = useState('');

  // ─── Add form ─────────────────────────────────────────────────────────────────
  const [addName,     setAddName]     = useState('');
  const [addPrice,    setAddPrice]    = useState('');
  const [addCategory, setAddCategory] = useState<number | null>(null);
  const [addIvaId,    setAddIvaId]    = useState<number | null>(null);
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

  // ─── Estados para fotos ──────────────────────────────────────────────────────
  const [addPhotos, setAddPhotos] = useState<File[]>([]);
  const [addPhotoPreviews, setAddPhotoPreviews] = useState<string[]>([]);
  const [productPhotos, setProductPhotos] = useState<Photo[]>([]);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [selectedVariantForPhoto, setSelectedVariantForPhoto] = useState<number | null>(null);

  // ─── Load data ───────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, vars, inv, cats, cols, szs, ivaList] = await Promise.all([
        getAllProducts(),
        getAllVariants(),
        getAllInventory(),
        getAllCategories(),
        getAllColors(),
        getAllSizes(),
        getAllIvas(),
      ]);
      if (prods) setProducts(prods);
      if (ivaList) setIvas(ivaList);
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

  // Cargar fotos cuando se abre el modal de detalle
  useEffect(() => {
    if (viewingProduct && showDetailModal) {
      loadProductPhotos(viewingProduct.id_product);
    }
  }, [viewingProduct, showDetailModal]);

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

  // Construir URL completa para la imagen retornada por backend
  const buildPhotoUrl = (raw: string | null | undefined) => {
    if (!raw) return '';
    try {
      if (/^https?:\/\//i.test(raw)) return raw;
      const base = (API.defaults.baseURL as string) || '';
      const origin = base.replace(/\/api\/?$/i, '').replace(/\/$/, '');
      return `${origin}/${String(raw).replace(/^\/+/, '')}`;
    } catch {
      return String(raw);
    }
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

  const getProductIvaLabel = (product: Product) => {
    const ivaItem = ivas.find(i => i.id_iva === product.iva);
    if (!ivaItem) return 'Sin IVA';
    return `${ivaItem.name} (${Math.round(ivaItem.value * 100)}%)`;
  };

  // ─── Auto-generar SKU ────────────────────────────────────────────────────────
  const autoGenerateSku = () => {
    const productPrefix = addName.substring(0, 3).toUpperCase() || 'PRD';
    const sizeStr = sizes.find(s => s.id_size === addSizeId)?.name.toUpperCase() || 'N/A';
    const colorStr = colors.find(c => c.id_color === addColorId)?.name.substring(0, 3).toUpperCase() || 'N/A';
    const timestamp = Date.now().toString().slice(-6);
    
    setAddSku(`${productPrefix}-${sizeStr}-${colorStr}-${timestamp}`);
  };

  // ─── Funciones para gestión de fotos ──────────────────────────────────────────
  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      const newPhotos = Array.from(files);
      setAddPhotos([...addPhotos, ...newPhotos]);

      // Crear previsualizaciones
      newPhotos.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setAddPhotoPreviews(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setAddPhotos(addPhotos.filter((_, i) => i !== index));
    setAddPhotoPreviews(addPhotoPreviews.filter((_, i) => i !== index));
  };

  const uploadPhotosForProduct = async (productId: number, photos: File[], variant?: number): Promise<number> => {
    if (photos.length === 0) return 0;
    
    setIsUploadingPhotos(true);
    const uploaded: Photo[] = [];

    for (const photo of photos) {
      try {
        const result = await createPhotos(productId, photo, variant);
        if (result) {
          uploaded.push(result);
        } else {
          console.warn('createPhotos devolvió null para:', photo.name);
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
      }
    }

    // Si al menos una foto se creó, anexarla al estado para mostrarla inmediatamente
    if (uploaded.length > 0) {
      setProductPhotos(prev => [...prev, ...uploaded]);
    }

    setIsUploadingPhotos(false);

    // Devolver el número de fotos que se subieron correctamente
    return uploaded.length;
  };

  const loadProductPhotos = async (productId: number) => {
    try {
      // Limpiar fotos actuales para evitar peticiones a rutas obsoletas mientras cargamos detalles
      setProductPhotos([]);

      const allPhotos = await getPhotos();
      if (allPhotos) {
        // Filtrar fotos del producto actual
        const filtered = allPhotos.filter(p => p.producto === productId);

        // Obtener detalle por ID para asegurar que la URL se resuelva correctamente
        const detailed = await Promise.all(filtered.map(async (p) => {
          try {
            const detail = await getPhotosById(p.id);
            // Log para depuración: pegar esto si necesitas ayuda
            console.log('[loadProductPhotos] photo detail for id', p.id, detail);

            const imageRaw = (detail && (detail.image ?? p.image)) || p.image;

            // Si el backend solo devuelve una ruta relativa (ej: 'products/photos/xxx.jpg')
            // evitamos construir una URL que provoque una petición directa al archivo estático.
            // En ese caso, dejamos la imagen vacía y mostramos placeholder hasta que
            // el backend proporcione un campo que permita descargar la imagen vía API.
            if (typeof imageRaw === 'string' && (/^https?:\/\//i.test(imageRaw) || imageRaw.startsWith('data:'))) {
              return { ...p, image: buildPhotoUrl(imageRaw) } as Photo;
            } else {
              console.warn(`[loadProductPhotos] image for photo id ${p.id} is a relative path; skipping direct URL to avoid 404`, imageRaw);
              return { ...p, image: '' } as Photo;
            }
          } catch (err) {
            console.error('[loadProductPhotos] error fetching photo detail', p.id, err);
            return { ...p, image: '' } as Photo;
          }
        }));

        setProductPhotos(detailed);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      setProductPhotos([]);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    const ok = await deletePhotos(photoId);
    if (ok) {
      showToast('Foto eliminada', 'success');
      setProductPhotos(productPhotos.filter(p => p.id !== photoId));
    } else {
      showToast('Error al eliminar la foto', 'error');
    }
  };

  // ─── Modal para seleccionar variante y subir fotos ─────────────────────────
  const photosInputId = (productId: number) => `upload-photos-modal-${productId}`;

  const handleOpenPhotosForProduct = (productId: number) => {
    setAddPhotos([]);
    setAddPhotoPreviews([]);
    setSelectedVariantForPhoto(null);
    setShowPhotosModal(true);
  };

  const handleSelectFilesAndUpload = async (productId: number) => {
    if (!viewingProduct) return;
    if (addPhotos.length === 0) {
      showToast('Selecciona al menos una imagen', 'error');
      return;
    }
    const uploadedCount = await uploadPhotosForProduct(productId, addPhotos, selectedVariantForPhoto ?? undefined);
    if (uploadedCount === addPhotos.length) {
      showToast('Fotos cargadas correctamente', 'success');
    } else if (uploadedCount > 0) {
      showToast(`Se cargaron ${uploadedCount} de ${addPhotos.length} fotos`, 'warning');
    } else {
      showToast('Error subiendo fotos', 'error');
    }

    // Siempre intentar recargar fotos desde servidor y cerrar modal si hubo al menos una subida
    await loadProductPhotos(productId);
    if (uploadedCount > 0) {
      setShowPhotosModal(false);
      setAddPhotos([]);
      setAddPhotoPreviews([]);
      setSelectedVariantForPhoto(null);
    }
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
    setEditIvaId(product.iva ?? null);
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const errors: Record<string, string> = {};
    if (!editName.trim())                     errors.name     = 'El nombre es obligatorio';
    if (!editPrice || Number(editPrice) <= 0) errors.price    = 'El precio debe ser mayor a 0';
    if (!editPurchasePrice || Number(editPurchasePrice) <= 0) errors.purchasePrice = 'El precio de compra debe ser mayor a 0';
    if (!editCategory)                        errors.category = 'Selecciona una categoría';
    if (!editIvaId)                           errors.iva      = 'Selecciona un IVA';
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!editingProduct) return;

    setIsSubmitting(true);
    const result = await updateProduct(editingProduct.id_product, {
      name:      editName.trim(),
      price:     Number(editPrice),
      purchase_price: Number(editPurchasePrice),
      category:  editCategory!,
      iva:       editIvaId ?? undefined,
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
    setAddIvaId(ivas[0]?.id_iva ?? null);
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
    if (!addIvaId)                           errors.iva      = 'Selecciona un IVA';
    
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
        iva: addIvaId ?? undefined,
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
        purchase_price: Number(addPurchasePrice),
        iva: addIvaId ?? undefined
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

    // 3. Cargar fotos si existen
    if (addPhotos.length > 0 && result) {
      console.log('📸 handleSaveAdd - Subiendo fotos...');
      const photosUploaded = await uploadPhotosForProduct(result.id_product, addPhotos);
      if (photosUploaded) {
        showToast(`${addPhotos.length} foto(s) cargada(s) exitosamente`, 'success');
      } else {
        showToast('Algunas fotos no se cargaron correctamente', 'warning');
      }
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
    setAddPhotos([]);
    setAddPhotoPreviews([]);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    // Limpiar todos los estados del formulario
    setAddName('');
    setAddPrice('');
    setAddCategory(null);
    setAddIvaId(null);
    setAddPurchasePrice('');
    setAddImage(null);
    setAddImagePreview('');
    setAddStock('');
    setAddColorId(null);
    setAddSizeId(null);
    setAddSku('');
    setImageBase64('');
    setAddErrors({});
    setAddPhotos([]);
    setAddPhotoPreviews([]);
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
  const exportToExcel = async () => {
    try {
      await exportProductsToExcel();
      showToast('Productos exportados exitosamente', 'success');
    } catch {
      showToast('Error al exportar productos', 'error');
    }
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
                  <p className="text-xs text-gray-500 mb-2">IVA: {getProductIvaLabel(product)}</p>

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
                  <p className="text-xs text-gray-500 mb-0.5">IVA</p>
                  <p className="font-semibold text-gray-900">{getProductIvaLabel(viewingProduct)}</p>
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

              {/* Fotos del Producto */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    📸 Fotos ({productPhotos.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => { setAddPhotos([]); setAddPhotoPreviews([]); setSelectedVariantForPhoto(null); setShowPhotosModal(true); }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + Agregar fotos
                  </button>
                </div>
                
                {productPhotos.length === 0 ? (
                  <p className="text-xs text-gray-400">Sin fotos. Agrega una para mostrar el producto.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {productPhotos.map(photo => (
                      <div key={photo.id} className="relative group">
                        <img 
                          src={buildPhotoUrl(photo.image)}
                          alt="Producto"
                          className="w-full h-24 object-cover rounded-lg"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="12"%3ENo imagen%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                  {/* Modal para seleccionar variante y subir fotos */}
                  <Modal isOpen={showPhotosModal} onClose={() => setShowPhotosModal(false)} title={`Agregar fotos — ${viewingProduct?.name ?? ''}`} size="md">
                    <div className="space-y-3">
                      <p className="text-xs text-gray-600">Selecciona la variante a la cual asignar las fotos (o deja en Producto para asociarlas al producto):</p>
                      <div className="max-h-44 overflow-y-auto border rounded p-2 bg-white">
                        <div className="flex items-center gap-2 mb-2">
                          <input type="radio" id={`variant_none_${viewingProduct?.id_product}`} name="variant_select" checked={selectedVariantForPhoto === null} onChange={() => setSelectedVariantForPhoto(null)} />
                          <label htmlFor={`variant_none_${viewingProduct?.id_product}`} className="text-xs">Producto (sin variante)</label>
                        </div>
                        {getProductVariants(viewingProduct?.id_product ?? 0).map(v => (
                          <div key={v.id_variant} className="flex items-center gap-2 mb-2">
                            <input type="radio" id={`variant_${v.id_variant}`} name="variant_select" checked={selectedVariantForPhoto === v.id_variant} onChange={() => setSelectedVariantForPhoto(v.id_variant)} />
                            <label htmlFor={`variant_${v.id_variant}`} className="text-xs">{v.sku} — {v.size_name} / {v.color_name}</label>
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Archivos seleccionados</label>
                        {addPhotoPreviews.length === 0 ? (
                          <p className="text-xs text-gray-400">No hay archivos seleccionados</p>
                        ) : (
                          <div className="flex gap-2 overflow-x-auto">
                            {addPhotoPreviews.map((p, i) => (
                              <div key={i} className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                                <img src={p} alt={`preview-${i}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input id={photosInputId(viewingProduct?.id_product ?? 0)} type="file" multiple accept="image/*" onChange={handleAddPhotos} className="hidden" />
                        <button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => document.getElementById(photosInputId(viewingProduct?.id_product ?? 0))?.click()}>Seleccionar archivos</button>
                        <div className="flex-1" />
                        <Button type="button" variant="secondary" onClick={() => { setShowPhotosModal(false); setAddPhotos([]); setAddPhotoPreviews([]); setSelectedVariantForPhoto(null); }}>Cancelar</Button>
                        <Button type="button" variant="primary" onClick={() => handleSelectFilesAndUpload(viewingProduct!.id_product)} disabled={isUploadingPhotos || addPhotos.length === 0}>
                          {isUploadingPhotos ? 'Subiendo...' : 'Subir fotos'}
                        </Button>
                      </div>
                    </div>
                  </Modal>
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
            <label className="block text-gray-700 font-medium mb-0.5 text-xs">IVA *</label>
            <select
              value={editIvaId ?? ''}
              onChange={(e) => setEditIvaId(Number(e.target.value) || null)}
              className={`w-full h-8 px-2 border rounded-lg text-sm ${editErrors.iva ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">Seleccionar IVA...</option>
              {ivas.map(iva => (
                <option key={iva.id_iva} value={iva.id_iva}>
                  {iva.name} ({Math.round(iva.value * 100)}%)
                </option>
              ))}
            </select>
            {editErrors.iva && <p className="text-red-500 text-xs mt-0.5">{editErrors.iva}</p>}
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
  size="xl"
>
  <div className="text-xs space-y-2">

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-700">
      <strong>Opcional:</strong> Puedes crear el producto con talla, color y stock inicial.
    </div>

    <div className="grid gap-2 lg:grid-cols-2">
      <div className="space-y-2">
        <div>
          <label className="block text-gray-700 font-medium mb-1 text-xs">Imagen principal *</label>
          <div className="border border-dashed border-gray-300 rounded-lg bg-white h-28 max-h-28 overflow-hidden relative">
            <input
              id="add-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {addImagePreview ? (
              <>
                <img
                  src={addImagePreview}
                  alt="Preview"
                  className="w-full h-24 object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/15 backdrop-blur-sm px-2 py-1 flex items-center justify-center gap-2 text-xs text-white">
                  <label htmlFor="add-image-input" className="cursor-pointer text-blue-100 hover:text-white">
                    Cambiar
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAddImage(null);
                      setAddImagePreview('');
                      setImageBase64('');
                    }}
                    className="text-red-200 hover:text-white"
                  >
                    Eliminar
                  </button>
                </div>
              </>
            ) : (
              <label htmlFor="add-image-input" className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 cursor-pointer">
                <Package size={24} className="text-gray-400" />
                <span>Subir imagen</span>
              </label>
            )}
          </div>
          {addErrors.productImage && <p className="text-red-500 text-xs mt-1">{addErrors.productImage}</p>}
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1 text-xs">Nombre del producto *</label>
          <Input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Nombre del producto"
            className={`h-8 text-xs ${addErrors.name ? 'border-red-400' : ''}`}
          />
          {addErrors.name && <p className="text-red-500 text-xs mt-1">{addErrors.name}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Precio compra *</label>
            <Input
              type="number"
              value={addPurchasePrice}
              onChange={(e) => setAddPurchasePrice(e.target.value)}
              placeholder="0"
              className={`h-8 text-xs ${addErrors.purchasePrice ? 'border-red-400' : ''}`}
            />
            {addErrors.purchasePrice && <p className="text-red-500 text-xs mt-1">{addErrors.purchasePrice}</p>}
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Precio venta *</label>
            <Input
              type="number"
              value={addPrice}
              onChange={(e) => setAddPrice(e.target.value)}
              placeholder="0"
              className={`h-8 text-xs ${addErrors.price ? 'border-red-400' : ''}`}
            />
            {addErrors.price && <p className="text-red-500 text-xs mt-1">{addErrors.price}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">IVA *</label>
            <select
              value={addIvaId ?? ''}
              onChange={(e) => setAddIvaId(Number(e.target.value) || null)}
              className={`w-full h-8 px-2 border rounded-lg text-xs ${addErrors.iva ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">Seleccionar IVA...</option>
              {ivas.map(iva => (
                <option key={iva.id_iva} value={iva.id_iva}>
                  {iva.name} ({Math.round(iva.value * 100)}%)
                </option>
              ))}
            </select>
            {addErrors.iva && <p className="text-red-500 text-xs mt-1">{addErrors.iva}</p>}
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Categoría *</label>
            <select
              value={addCategory ?? ''}
              onChange={(e) => setAddCategory(Number(e.target.value) || null)}
              className={`w-full h-8 px-2 border rounded-lg text-xs ${addErrors.category ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">Seleccionar</option>
              {categories.map(c => (
                <option key={c.id_category} value={c.id_category}>{c.name}</option>
              ))}
            </select>
            {addErrors.category && <p className="text-red-500 text-xs mt-1">{addErrors.category}</p>}
          </div>
        </div>
      </div>
    </div>

    <div className="grid gap-2 lg:grid-cols-2">
      <div className="border border-gray-200 rounded-lg p-2 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">Variante inicial</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Talla</label>
            {isCreatingNewSize ? (
              <div className="space-y-2">
                <Input
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  placeholder="Ej: M"
                  className="h-8 text-xs"
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handleCreateSize}
                    disabled={isSubmitting}
                    className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-[10px] hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creando...' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewSize(false);
                      setNewSizeName('');
                    }}
                    className="flex-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] hover:bg-gray-300"
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
                  className={`w-full h-8 px-2 border rounded-lg text-xs ${addErrors.size ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Seleccionar</option>
                  {sizes.map(s => (
                    <option key={s.id_size} value={s.id_size}>{s.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewSize(true)}
                  className="text-blue-600 text-[10px] mt-1 hover:underline"
                >
                  + Nueva talla
                </button>
              </>
            )}
            {addErrors.size && <p className="text-red-500 text-xs mt-1">{addErrors.size}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Color</label>
            {isCreatingNewColor ? (
              <div className="space-y-2">
                <Input
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="Ej: Negro"
                  className="h-8 text-xs"
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handleCreateColor}
                    disabled={isSubmitting}
                    className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-[10px] hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creando...' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewColor(false);
                      setNewColorName('');
                    }}
                    className="flex-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] hover:bg-gray-300"
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
                  className={`w-full h-8 px-2 border rounded-lg text-xs ${addErrors.color ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Seleccionar</option>
                  {colors.map(c => (
                    <option key={c.id_color} value={c.id_color}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewColor(true)}
                  className="text-blue-600 text-[10px] mt-1 hover:underline"
                >
                  + Nuevo color
                </button>
              </>
            )}
            {addErrors.color && <p className="text-red-500 text-xs mt-1">{addErrors.color}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Stock inicial</label>
            <Input
              type="number"
              value={addStock}
              onChange={(e) => setAddStock(e.target.value)}
              placeholder="0"
              className={`h-8 text-xs ${addErrors.stock ? 'border-red-400' : ''}`}
            />
            {addErrors.stock && <p className="text-red-500 text-xs mt-1">{addErrors.stock}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-gray-700 font-medium text-xs">SKU</label>
              <button
                type="button"
                onClick={autoGenerateSku}
                className="text-xs text-blue-600 hover:underline"
              >
                Generar
              </button>
            </div>
            <Input
              value={addSku}
              onChange={(e) => setAddSku(e.target.value)}
              placeholder="Ej: VES-M-NEG-001"
              className={`h-8 text-xs font-mono ${addErrors.sku ? 'border-red-400' : ''}`}
            />
            {addErrors.sku && <p className="text-red-500 text-xs mt-1">{addErrors.sku}</p>}
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-2 space-y-2 max-h-48 overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-800">Fotos del producto</h3>
        <div className="border border-dashed border-amber-400 rounded-lg p-2 text-center bg-white h-20 flex items-center justify-center">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleAddPhotos}
            className="hidden"
            id="add-photos-input"
          />
          <label htmlFor="add-photos-input" className="cursor-pointer inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-gray-50">
            + Agregar fotos
          </label>
        </div>
        {addPhotoPreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 overflow-hidden">
            {addPhotoPreviews.map((preview, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200 h-16">
                <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        {addPhotoPreviews.length > 0 && (
          <p className="text-xs text-amber-700">{addPhotoPreviews.length} foto(s) seleccionada(s)</p>
        )}
      </div>
    </div>

    <div className="flex gap-2 justify-end pt-1 border-t">
      <Button onClick={handleCloseAddModal} variant="secondary" className="h-8 px-3 text-xs">Cancelar</Button>
      <Button onClick={handleSaveAdd} variant="primary" disabled={isSubmitting} className="h-8 px-3 text-xs">
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