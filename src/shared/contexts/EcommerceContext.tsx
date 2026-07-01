/// <reference types="vite/client" />
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '../components/native';
import { sampleProducts } from '../utils/sampleData';
import {
  getAllInventory,
  getAllProducts,
  getAllVariants,
  getPhotos,
  getBestSeller,
} from '@/features/ecommerce/products/services/productsService';
import { getAllCategories } from '@/features/ecommerce/categories/services/categoriesService';

// Cargar assets locales con Vite para resolver nombres de archivo dinámicos
const _images = import.meta.glob('../../assets/*.{png,jpg,jpeg,svg}', { eager: true }) as Record<string, any>;
const API_MEDIA_ORIGIN = 'https://damabella-backend.onrender.com';
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="%23f3f4f6"/><text x="450" y="590" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="%239ca3af">DAMABELLA</text><text x="450" y="642" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="%23b6bcc6">Imagen no disponible</text></svg>';

const imageMap: Record<string, string> = Object.fromEntries(
  Object.entries(_images).map(([k, v]) => {
    const filename = k.split('/').pop() || k;
    const url = v?.default || v;
    return [filename, url];
  })
);

function resolveImage(src: string): string {
  if (!src) return PLACEHOLDER_IMAGE;
  if (typeof src !== 'string') return PLACEHOLDER_IMAGE;
  const trimmed = src.trim().replace(/\\/g, '/');
  if (!trimmed) return PLACEHOLDER_IMAGE;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) return trimmed;
  if (trimmed.startsWith('/media/') || trimmed.startsWith('media/')) {
    return `${API_MEDIA_ORIGIN}/${trimmed.replace(/^\/+/, '')}`;
  }
  const name = trimmed.split('/').pop() || trimmed;
  return imageMap[name] || `${API_MEDIA_ORIGIN}/media/${trimmed.replace(/^\/+/, '')}`;
}

function getStoreColorHex(color: string): string {
  const normalized = (color || '').trim().toLowerCase();
  const colors: Record<string, string> = {
    negro: '#000000',
    blanco: '#FFFFFF',
    rosa: '#FFB6C1',
    azul: '#4169E1',
    rojo: '#DC143C',
    verde: '#32CD32',
    amarillo: '#FFD700',
    morado: '#9370DB',
    naranja: '#FF8C00',
    gris: '#808080',
    beige: '#F5F5DC',
    cafe: '#8B4513',
    'café': '#8B4513',
    turquesa: '#40E0D0',
    lavanda: '#E6E6FA',
    coral: '#FF7F50',
    menta: '#98FF98',
    fucsia: '#D946EF',
    vinotinto: '#7F1D1D',
    marfil: '#FFFFF0',
  };

  return colors[normalized] || (normalized.startsWith('#') ? color : '#111827');
}

const getProductId = (product: any) => Number(product?.id_product ?? product?.id ?? product?.product);
const getVariantProductId = (variant: any) => Number(variant?.product ?? variant?.id_product ?? variant?.producto);
const getPhotoProductId = (photo: any) => {
  const rawProduct = photo?.producto ?? photo?.product ?? photo?.id_product;
  if (typeof rawProduct === 'object' && rawProduct !== null) {
    return Number(rawProduct.id_product ?? rawProduct.id ?? rawProduct.product);
  }
  return Number(rawProduct);
};

const getPhotoImage = (photo: any): string => {
  if (!photo) return '';
  return (
    photo.image_url ??
    photo.imageUrl ??
    photo.photo_url ??
    photo.photoUrl ??
    photo.url ??
    photo.src ??
    photo.image ??
    photo.photo ??
    photo.imagen ??
    ''
  );
};

const getStoredProductImage = (productId: number): string => {
  try {
    return localStorage.getItem(`product_image_${productId}`) || '';
  } catch {
    return '';
  }
};

const buildVariantsForProduct = (productId: number, variants: any[] = [], inventory: any[] = []): ProductVariant[] => {
  const byColor = new Map<string, ProductVariant>();

  variants
    .filter((variant) => getVariantProductId(variant) === productId)
    .forEach((variant) => {
      const colorName = String(variant.color_name || variant.colorName || variant.color?.name || variant.color || 'Negro');
      const sizeName = String(variant.size_name || variant.sizeName || variant.size?.name || variant.size || 'U');
      const inventoryStock = inventory.find((item) => {
        const matchesVariant = Number(item.variant ?? item.id_variant) === Number(variant.id_variant);
        const itemProductId = Number(item.product ?? item.id_product ?? item.producto);
        const matchesProduct = Number.isNaN(itemProductId) || itemProductId === Number(productId);

        return matchesVariant && matchesProduct;
      })?.stock;
      const stock = Number(inventoryStock ?? variant.stock ?? variant.quantity ?? variant.cantidad ?? 0);

      if (!byColor.has(colorName)) {
        byColor.set(colorName, {
          color: colorName,
          colorHex: variant.color_hex || variant.colorHex || getStoreColorHex(colorName),
          sizes: [],
        });
      }

      byColor.get(colorName)?.sizes.push({
        size: sizeName,
        stock: Number.isFinite(stock) ? stock : 0,
        variantId: Number(variant.id_variant || variant.id || 0),
      });
    });

  const mapped = Array.from(byColor.values());
  return mapped.length > 0
    ? mapped
    : [{ color: 'Negro', colorHex: '#111827', sizes: [{ size: 'U', stock: 0 }] }];
};

// Tipos
export interface ProductVariant {
  color: string;
  colorHex: string;
  sizes: { size: string; stock: number; variantId?: number }[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  featured?: boolean;
  new?: boolean;
  variants: ProductVariant[];
   rating?: number; 
}

export type OrderStatus = 'Pendiente' | 'Enviado' | 'Completado';

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  image: string;
  color: string;
  colorHex: string;
  size: string;
  quantity: number;
  variantId?: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  iva: number;
  total: number;
  paymentMethod: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  date: string;
  status: OrderStatus;
  createdAt: string;
}

interface EcommerceContextType {
  products: Product[];
  categories: { id: string | number; name: string }[];
  categoriesForHome: { id: string | number; name: string }[];
  cart: CartItem[];
  favorites: string[];
  bestSellerId: string | null;
  recentlyViewed: string[];
  orders: Order[];
  addToCart: (item: CartItem) => void;
  getProductStock: (productId: string, color: string, size: string) => number;
  removeFromCart: (productId: string, color: string, size: string) => void;
  updateCartQuantity: (productId: string, color: string, size: string, quantity: number) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  addToRecentlyViewed: (productId: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export const EcommerceContext = createContext<EcommerceContextType | undefined>(undefined);

// Función auxiliar para colores
function getColorHex(color: string): string {
  const map: Record<string, string> = {
    Negro: '#000000', Blanco: '#FFFFFF', Rosa: '#FFB6C1', Azul: '#4169E1',
    Rojo: '#DC143C', Verde: '#32CD32', Amarillo: '#FFD700', Morado: '#9370DB',
    Naranja: '#FF8C00', Gris: '#808080', Beige: '#F5F5DC', Café: '#8B4513',
    Turquesa: '#40E0D0', Lavanda: '#E6E6FA', Coral: '#FF7F50', Menta: '#98FF98'
  };
  return map[color] || '#000000';
}

// Convertir sampleProducts
const convertSampleProducts = (): Product[] => {
  return sampleProducts.map((p: any) => ({
    id: `p${p.id}`,
    name: p.nombre,
    description: p.descripcion,
    price: p.precioVenta,
    image: resolveImage(p.imagen),
    category: p.categoria,
    featured: Math.random() > 0.5,
    new: Math.random() > 0.7,
    variants: p.variantes?.map((v: any) => ({
      color: v.colores?.[0]?.color || v.color || 'Negro',
      colorHex: getColorHex(v.colores?.[0]?.color || v.color || 'Negro'),
      sizes: v.colores?.map((c: any) => ({ size: v.talla, stock: c.cantidad || 0 })) || [{ size: v.talla, stock: v.cantidad || 0 }]
    })) || [{
      color: 'Negro', colorHex: '#000000', sizes: [
        { size: 'S', stock: 10 }, { size: 'M', stock: 15 }, { size: 'L', stock: 10 }
      ]
    }]
  }));
};

export function EcommerceProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string | number; name: string }[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bestSellerId, setBestSellerId] = useState<string | null>(null);
  const { showToast } = useToast();

  // Cargar desde API
  useEffect(() => {
    const loadDataFromAPI = async () => {
      try {
        console.log('[EcommerceContext] 🔄 Iniciando carga de datos...');
        
        try {
          const [categoriesData, productsData, photosData, variantsData, inventoryData, bestSellerVal] = await Promise.all([
            getAllCategories(),
            getAllProducts(),
            getPhotos(),
            getAllVariants(),
            getAllInventory(),
            getBestSeller(),
          ]);

          if (bestSellerVal !== null) {
            setBestSellerId(String(bestSellerVal));
          } else {
            setBestSellerId(null);
          }

          // Procesar categorías primero
          let resolvedCategories: any[] = [];
          if (categoriesData) {
            const activeCategoriesData = categoriesData.filter((c: any) => c && c.is_active === true);
            resolvedCategories = activeCategoriesData.map((c: any) => ({ 
              id: c.id_category ?? c.name, 
              name: c.name 
            }));
          }

          // Procesar productos
          if (productsData && Array.isArray(productsData)) {
            // Solo mostrar productos activos
            const activeProducts = productsData.filter((p: any) => p && (p.is_active === true || p.is_active === 1));
            
            const resolvedProducts = activeProducts.map((p: any) => {
              const productId = getProductId(p);
              const productPhotos = (photosData || []).filter((photo: any) => getPhotoProductId(photo) === productId);
              const mainPhoto =
                getStoredProductImage(productId) ||
                getPhotoImage(productPhotos[0]) ||
                p.image_url ||
                p.imageUrl ||
                p.photo_url ||
                p.photoUrl ||
                p.url ||
                p.src ||
                p.image ||
                p.photo ||
                p.imagen ||
                '';

              return {
                id: productId.toString(),
                name: p.name || 'Producto sin nombre',
                description: p.description || '',
                price: Number(p.price) || 0,
                image: resolveImage(mainPhoto),
                category: p.category_name || 'Sin categoría',
                featured: false,
                new: false,
                variants: buildVariantsForProduct(productId, variantsData || [], inventoryData || []),
                rating: 0,
              };
            });

            setProducts(resolvedProducts);
            console.log('[EcommerceContext] ✅ Productos cargados:', resolvedProducts.length);

            setCategories(resolvedCategories);
            console.log('[EcommerceContext] ✅ Categorías cargadas (filtradas solo por activas):', resolvedCategories.length);
          } else {
            console.warn('[EcommerceContext] ⚠️ Usando productos de ejemplo');
            setProducts(convertSampleProducts());
            setCategories(resolvedCategories);
          }
        } catch (error) {
          console.error('[EcommerceContext] ❌ Error en carga de API:', error);
          setProducts(convertSampleProducts());
          setCategories([]);
        }
      } catch (error) {
        console.error('[EcommerceContext] ❌ Error general:', error);
        setProducts(convertSampleProducts());
        setCategories([]);
      }
    };

    loadDataFromAPI();

    // Cargar datos del carrito desde localStorage
    const savedCart = localStorage.getItem('damabella_cart');
    const savedFavorites = localStorage.getItem('damabella_favorites');
    const savedRecentlyViewed = localStorage.getItem('damabella_recently_viewed');
    const savedOrders = localStorage.getItem('damabella_orders');

    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedRecentlyViewed) setRecentlyViewed(JSON.parse(savedRecentlyViewed));
    if (savedOrders) setOrders(JSON.parse(savedOrders));
  }, []);

  // Guardar cambios en localStorage
  useEffect(() => { localStorage.setItem('damabella_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('damabella_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('damabella_recently_viewed', JSON.stringify(recentlyViewed)); }, [recentlyViewed]);
  useEffect(() => { localStorage.setItem('damabella_orders', JSON.stringify(orders)); }, [orders]);

  // Funciones de carrito
  const addToCart = (item: CartItem) => {
    let resolvedVariantId = item.variantId;
    if (!resolvedVariantId) {
      const prod = products.find(p => String(p.id) === String(item.productId) || String(p.id).replace(/^p/i, '') === String(item.productId).replace(/^p/i, ''));
      if (prod) {
        const v = prod.variants.find(vItem => vItem.color === item.color || vItem.color.toLowerCase() === (item.color || '').toLowerCase());
        if (v) {
          const s = v.sizes.find(sItem => sItem.size === item.size);
          if (s && s.variantId) {
            resolvedVariantId = s.variantId;
          }
        }
      }
    }
    const resolvedItem = { ...item, variantId: resolvedVariantId };

    // Asegurar que la cantidad no supere el stock real
    try {
      const available = getProductStock(resolvedItem.productId, resolvedItem.color, resolvedItem.size);
      const qtyToAdd = Math.max(0, Number(resolvedItem.quantity || 0));

      setCart(prev => {
        const idx = prev.findIndex(i => i.productId === resolvedItem.productId && i.color === resolvedItem.color && i.size === resolvedItem.size);
        if (idx > -1) {
          const copy = [...prev];
          const newQty = Math.min(copy[idx].quantity + qtyToAdd, available);
          copy[idx].quantity = newQty;
          if (!copy[idx].variantId && resolvedItem.variantId) {
            copy[idx].variantId = resolvedItem.variantId;
          }
          return copy;
        }
        const initialQty = Math.min(qtyToAdd, available);
        return [...prev, { ...resolvedItem, quantity: initialQty }];
      });

      if (qtyToAdd > available) {
        try { showToast('Cantidad ajustada al stock disponible', 'info'); } catch (e) {}
      } else {
        try { showToast('Producto agregado al carrito', 'success'); } catch (e) {}
      }
    } catch (e) {
      // En caso de error al consultar stock, proceder como antes pero evitando romper la app
      setCart(prev => {
        const idx = prev.findIndex(i => i.productId === resolvedItem.productId && i.color === resolvedItem.color && i.size === resolvedItem.size);
        if (idx > -1) {
          const copy = [...prev];
          copy[idx].quantity += resolvedItem.quantity;
          if (!copy[idx].variantId && resolvedItem.variantId) {
            copy[idx].variantId = resolvedItem.variantId;
          }
          return copy;
        }
        return [...prev, resolvedItem];
      });
      try { showToast('Producto agregado al carrito', 'success'); } catch (e) {}
    }
  };

  const removeFromCart = (productId: string, color: string, size: string) => {
    setCart(prev => prev.filter(i => !(i.productId === productId && i.color === color && i.size === size)));
  };

  const updateCartQuantity = (productId: string, color: string, size: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId, color, size);
    try {
      const available = getProductStock(productId, color, size);
      const finalQty = Math.min(quantity, Math.max(0, available));

      if (finalQty <= 0) {
        // No eliminar el producto si ya existe en el carrito; mantener la cantidad actual
        setCart(prev => {
          const existing = prev.find(i => i.productId === productId && i.color === color && i.size === size);
          if (!existing) return prev;
          try { showToast('Este producto ya no tiene stock disponible', 'error'); } catch (e) {}
          return prev;
        });
        return;
      }

      if (finalQty !== quantity) {
        try { showToast('Cantidad ajustada al stock disponible', 'info'); } catch (e) {}
      }

      setCart(prev => prev.map(i => i.productId === productId && i.color === color && i.size === size ? { ...i, quantity: finalQty } : i));
    } catch (e) {
      // Fallback: si falla la verificación de stock, aplicar el cambio simple
      setCart(prev => prev.map(i => i.productId === productId && i.color === color && i.size === size ? { ...i, quantity } : i));
    }
  };

  const clearCart = () => setCart([]);
  const toggleFavorite = (productId: string) => setFavorites(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  const addToRecentlyViewed = (productId: string) => setRecentlyViewed(prev => [productId, ...prev.filter(id => id !== productId)].slice(0, 10));

  // Funciones de productos
  const addProduct = (product: Product) => setProducts(prev => [...prev, { ...product, image: resolveImage(product.image) }]);
  const updateProduct = (productId: string, updates: Partial<Product>) => {
    const resolvedUpdates = updates.image ? { ...updates, image: resolveImage(updates.image as string) } : updates;
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...resolvedUpdates } : p));
  };
  const deleteProduct = (productId: string) => setProducts(prev => prev.filter(p => p.id !== productId));

  // Obtener stock real desde el estado local de productos (cargados desde API)
  const getProductStock = (productId: string, color: string, size: string): number => {
    try {
      const prodIdRaw = (productId || '').toString();
      
      // Buscar el producto en el estado local - Intenta múltiples coincidencias
      const product = products.find((p: any) => {
        const pid = String(p.id);
        // Coincidencia directa
        if (pid === prodIdRaw) return true;
        // Coincidencia con prefijo
        if (`p${pid}` === prodIdRaw || prodIdRaw === `p${pid}`) return true;
        // Coincidencia de dígitos
        const prodDigitsMatch = prodIdRaw.match(/\d+/);
        const pidDigitsMatch = pid.match(/\d+/);
        if (
          prodDigitsMatch &&
          pidDigitsMatch &&
          prodDigitsMatch[0] === prodIdRaw.replace(/^p/i, '') &&
          pidDigitsMatch[0] === pid.replace(/^p/i, '') &&
          prodDigitsMatch[0] === pidDigitsMatch[0]
        ) return true;
        return false;
      });

      if (!product) {
        console.log('[EcommerceContext] getProductStock: product not found for', productId);
        return 0;
      }

      // Buscar la variante con el color coincidente
      const variant = product.variants.find((v: any) => 
        v.color === color || v.color.toLowerCase() === (color || '').toLowerCase()
      );
      
      if (!variant) {
        console.log('[EcommerceContext] getProductStock: variant not found for color', color);
        return 0;
      }

      // Buscar la talla coincidente
      const sizeData = variant.sizes.find((s: any) => s.size === size);
      return sizeData ? (sizeData.stock || 0) : 0;
    } catch (e) {
      console.error('[EcommerceContext] getProductStock error', e);
      return 0;
    }
  };

  // Funciones de órdenes
  const addOrder = (order: Order) => setOrders(prev => [...prev, order]);
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  return (
    <EcommerceContext.Provider value={{
      products, cart, favorites, recentlyViewed, orders,
      categories,
      categoriesForHome: categories.slice(0, 4),
      bestSellerId,
      addToCart, removeFromCart, updateCartQuantity, clearCart,
      toggleFavorite, addToRecentlyViewed,
      getProductStock,
      addProduct, updateProduct, deleteProduct,
      addOrder, updateOrderStatus
    }}>
      {children}
    </EcommerceContext.Provider>
  );
}

export function useEcommerce() {
  const context = useContext(EcommerceContext);
  if (!context) throw new Error('useEcommerce debe estar dentro de un EcommerceProvider');
  return context;
}
