import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '../components/native';
import { sampleProducts } from '../utils/sampleData';
import { getAllProducts } from '@/features/ecommerce/products/services/productsService';
import { getAllCategories } from '@/features/ecommerce/categories/services/categoriesService';

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

  // Cargar desde API
  useEffect(() => {
    const loadDataFromAPI = async () => {
      try {
        // Cargar categorías desde API
        const categoriesData = await getAllCategories();
        if (categoriesData) {
          const mapped = categoriesData.map((c: any) => ({ 
            id: c.id_category ?? c.name, 
            name: c.name 
          }));
          setCategories(mapped);
          console.log('[EcommerceContext] Categorías cargadas desde API:', mapped.length + ' categorías');
        } else {
          console.warn('[EcommerceContext] Error cargando categorías desde API');
          setCategories([]);
        }
      } catch (error) {
        console.error('[EcommerceContext] Error en getAllCategories:', error);
        setCategories([]);
      }

      try {
        // Cargar productos desde API
        const productsData = await getAllProducts();
        if (productsData && Array.isArray(productsData)) {
          // Solo mostrar productos activos
          const activeProducts = productsData.filter((p: any) => p && (p.is_active === true || p.is_active === 1 || p.is_active === '1' || p.is_active === 'true'));
          
          const resolvedProducts = activeProducts.map((p: any) => {
            // Mapear campos del producto API al formato esperado en el contexto
            const mapped: any = {
              id: (p.id_product !== undefined && p.id_product !== null) ? Number(p.id_product) : NaN,
              name: p.name || 'Producto sin nombre',
              description: p.description || '',
              price: p.price || 0,
              image: resolveImage(p.image || ''),
              category: p.category_name || 'Sin categoría',
              featured: p.featured || false,
              new: p.new || false,
              variants: [] as any[],
              rating: p.rating || 0,
            };

            // Convertir variantes del API al formato esperado
            // El API retorna información de variantes, colores e inventario
            // Por ahora, creamos variantes básicas
            const variantList: any[] = [];
            
            // Si el producto tiene información de variantes/colores del API, usarla
            if (p.variants && Array.isArray(p.variants)) {
              p.variants.forEach((v: any) => {
                const colorName = v.color_name || 'Negro';
                const sizeName = v.size_name || 'M';
                const stock = v.stock || 0;
                
                let existing = variantList.find(x => x.color === colorName);
                if (!existing) {
                  existing = { color: colorName, colorHex: getColorHex(colorName), sizes: [] };
                  variantList.push(existing);
                }
                
                const sizeExists = existing.sizes.find((s: any) => s.size === sizeName);
                if (!sizeExists) {
                  existing.sizes.push({ size: sizeName, stock });
                }
              });
            }

            // Fallback: si no hay variantes del API, crear una variante genérica
            if (variantList.length === 0) {
              variantList.push({ 
                color: 'Negro', 
                colorHex: '#000000', 
                sizes: [{ size: 'M', stock: 0 }] 
              });
            }

            mapped.variants = variantList;
            return mapped;
          });

          setProducts(resolvedProducts);
          console.log('[EcommerceContext] Productos cargados desde API:', resolvedProducts.length + ' productos');
        } else {
          console.warn('[EcommerceContext] Error cargando productos desde API o lista vacía');
          setProducts(convertSampleProducts());
        }
      } catch (error) {
        console.error('[EcommerceContext] Error en getAllProducts:', error);
        console.log('[EcommerceContext] Usando productos de ejemplo como fallback');
        setProducts(convertSampleProducts());
      }
    };

    loadDataFromAPI();

    // Cargar datos del carrito desde localStorage (estos sí se mantienen en local)
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
    // Asegurar que la cantidad no supere el stock real
    try {
      const available = getProductStock(item.productId, item.color, item.size);
      const qtyToAdd = Math.max(0, Number(item.quantity || 0));

      setCart(prev => {
        const idx = prev.findIndex(i => i.productId === item.productId && i.color === item.color && i.size === item.size);
        if (idx > -1) {
          const copy = [...prev];
          const newQty = Math.min(copy[idx].quantity + qtyToAdd, available);
          copy[idx].quantity = newQty;
          return copy;
        }
        const initialQty = Math.min(qtyToAdd, available);
        return [...prev, { ...item, quantity: initialQty }];
      });

      if (qtyToAdd > available) {
        try { showToast('Cantidad ajustada al stock disponible', 'info'); } catch (e) {}
      } else {
        try { showToast('Producto agregado al carrito', 'success'); } catch (e) {}
      }
    } catch (e) {
      // En caso de error al consultar stock, proceder como antes pero evitando romper la app
      setCart(prev => {
        const idx = prev.findIndex(i => i.productId === item.productId && i.color === item.color && i.size === item.size);
        if (idx > -1) {
          const copy = [...prev];
          copy[idx].quantity += item.quantity;
          return copy;
        }
        return [...prev, item];
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
        if (prodDigitsMatch && pidDigitsMatch && prodDigitsMatch[0] === pidDigitsMatch[0]) return true;
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
