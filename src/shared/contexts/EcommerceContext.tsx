import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '../components/native';
import { sampleProducts } from '../utils/sampleData';

// Cargar assets locales con Vite para resolver nombres de archivo dinámicos
const _images = import.meta.glob('../../assets/*.{png,jpg,jpeg,svg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const imageMap: Record<string, string> = Object.fromEntries(
  Object.entries(_images).map(([k, v]) => [k.split('/').pop() || k, v])
);

function resolveImage(src: string): string {
  if (!src) return '';
  if (typeof src !== 'string') return '';
  const trimmed = src.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) return trimmed;
  const name = trimmed.split('/').pop() || trimmed;
  return imageMap[name] || trimmed;
}

// Tipos
export interface ProductVariant {
  color: string;
  colorHex: string;
  sizes: { size: string; stock: number }[];
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
  const { showToast } = useToast();

  // Cargar desde localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('damabella_cart');
    const savedFavorites = localStorage.getItem('damabella_favorites');
    const savedRecentlyViewed = localStorage.getItem('damabella_recently_viewed');
    // Priorizar la fuente administrativa actual: 'damabella_productos'
    const savedAdminProducts = localStorage.getItem('damabella_productos');
    const savedProducts = savedAdminProducts || localStorage.getItem('damabella_ecommerce_products');
    const savedOrders = localStorage.getItem('damabella_orders');

    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedRecentlyViewed) setRecentlyViewed(JSON.parse(savedRecentlyViewed));
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    
    if (savedProducts) {
      // Si proviene de 'damabella_productos' (estructura administrativa), convertir al formato UI esperado
      try {
        const adminProducts = JSON.parse(savedProducts) as any[];
        // Mostrar solo productos activos (aceptar true / 1 / '1' / 'true' por compatibilidad)
        const adminProductsActive = adminProducts.filter((p: any) => p && (p.activo === true || p.activo === 1 || p.activo === '1' || p.activo === 'true'));
        const resolvedAdmin = adminProductsActive.map((p: any) => {
          // Mapear campos obligatorios
          const mapped: any = {
              id: (p.id !== undefined && p.id !== null) ? Number(p.id) : NaN,
              name: p.nombre || p.name || 'Producto sin nombre',
              description: p.descripcion || p.description || '',
              price: p.precioVenta || p.price || 0,
              image: resolveImage(p.imagen || p.image || ''),
              category: p.categoria || p.category || 'Sin categoría',
              featured: p.destacado || false,
              new: p.nuevo || false,
              variants: [] as any[],
              rating: p.rating || 0,
            };

          // Convertir variantes administrativas a la forma { color, colorHex, sizes: [{size, stock}] }
          const variantes = p.variantes || [];
          const variantList: any[] = [];
          variantes.forEach((v: any) => {
            const talla = v.talla || v.size || '';
            const colores = v.colores || [];
            colores.forEach((c: any) => {
              const colorName = c.color || 'Negro';
              const cantidad = Number(c.cantidad || c.stock || 0);
              // Buscar si ya existe variante para ese color
              let existing = variantList.find(x => x.color === colorName);
              if (!existing) {
                existing = { color: colorName, colorHex: getColorHex(colorName), sizes: [] };
                variantList.push(existing);
              }
              existing.sizes.push({ size: talla, stock: cantidad });
            });
          });

          // Fallback: si no hay variantes, crear una variante genérica
          if (variantList.length === 0) {
            variantList.push({ color: 'Negro', colorHex: '#000000', sizes: [{ size: 'S', stock: 0 }] });
          }

          mapped.variants = variantList;
          return mapped;
        });

        setProducts(resolvedAdmin);
      } catch (e) {
        console.error('[EcommerceContext] Error parsing saved products:', e);
        setProducts(convertSampleProducts());
      }
    } else {
      setProducts(convertSampleProducts());
    }

    // Cargar categorías (desde localStorage si existen)
    try {
      const storedCats = localStorage.getItem('damabella_categorias');
      if (storedCats) {
        const parsed = JSON.parse(storedCats) as any[];
        const mapped = parsed.map(c => ({ id: c.id ?? c.name, name: c.name }));
        setCategories(mapped);
      }
    } catch (e) {
      console.warn('[EcommerceContext] No se pudieron cargar categorías desde localStorage', e);
    }
  }, []);

  // Guardar cambios en localStorage
  useEffect(() => { localStorage.setItem('damabella_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('damabella_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('damabella_recently_viewed', JSON.stringify(recentlyViewed)); }, [recentlyViewed]);
  useEffect(() => {
    // Asegurarse de convertir `id` a string antes de usar `startsWith` para evitar errores
    localStorage.setItem('damabella_ecommerce_products', JSON.stringify(products.filter(p => !String(p.id).startsWith('p'))));
  }, [products]);
  useEffect(() => { localStorage.setItem('damabella_orders', JSON.stringify(orders)); }, [orders]);

  // Funciones de carrito
  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === item.productId && i.color === item.color && i.size === item.size);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += item.quantity;
        return copy;
      }
      return [...prev, item];
    });
    try {
      showToast('Producto agregado al carrito', 'success');
    } catch (e) {
      // Si por alguna razón showToast no está disponible, evitar romper la app
      // No hacemos nada más aquí para respetar la petición de cambios mínimos
    }
  };

  const removeFromCart = (productId: string, color: string, size: string) => {
    setCart(prev => prev.filter(i => !(i.productId === productId && i.color === color && i.size === size)));
  };

  const updateCartQuantity = (productId: string, color: string, size: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId, color, size);
    setCart(prev => prev.map(i => i.productId === productId && i.color === color && i.size === size ? { ...i, quantity } : i));
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

  // Obtener stock real desde el storage administrativo
  const getProductStock = (productId: string, color: string, size: string): number => {
    try {
      const adminProducts = localStorage.getItem('damabella_productos');
      if (!adminProducts) return 0;
      const prods = JSON.parse(adminProducts) as any[];

      const prodIdRaw = (productId || '').toString();
      const prodDigitsMatch = prodIdRaw.match(/\d+/);
      const prodDigits = prodDigitsMatch ? prodDigitsMatch[0] : prodIdRaw;
      console.log('[EcommerceContext] getProductStock called', { productId: prodIdRaw, prodDigits, color, size });

      const adminProduct = prods.find((p: any) => {
        const pid = p?.id;
        const pidStr = pid !== undefined && pid !== null ? pid.toString() : '';
        const pidDigitsMatch = pidStr.match(/\d+/);
        const pidDigits = pidDigitsMatch ? pidDigitsMatch[0] : pidStr;

        const matches = pidStr === prodIdRaw || pidDigits === prodDigits || `p${pidStr}` === prodIdRaw || `admin_${pidStr}` === prodIdRaw || `admin-${pidStr}` === prodIdRaw;
        if (matches) console.log('[EcommerceContext] getProductStock matched product', { storageId: pidStr, pidDigits });
        return matches;
      });

      if (!adminProduct) {
        console.log('[EcommerceContext] getProductStock: adminProduct not found for', productId);
        return 0;
      }

      const variant = adminProduct.variantes?.find((v: any) => v.talla === size) || adminProduct.variantes?.[0];
      if (!variant) return 0;
      const colorData = variant.colores?.find((c: any) => c.color === color || (c.color && c.color.toString().trim().toLowerCase() === (color || '').toString().trim().toLowerCase()));
      return colorData ? (colorData.cantidad || 0) : 0;
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
