import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sampleProducts } from '../utils/sampleData';

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
  cart: CartItem[];
  favorites: string[];
  recentlyViewed: string[];
  orders: Order[];
  addToCart: (item: CartItem) => void;
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

const EcommerceContext = createContext<EcommerceContextType | undefined>(undefined);

export { EcommerceContext };

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
    image: p.imagen,
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Cargar desde localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('damabella_cart');
    const savedFavorites = localStorage.getItem('damabella_favorites');
    const savedRecentlyViewed = localStorage.getItem('damabella_recently_viewed');
    const savedOrders = localStorage.getItem('damabella_orders');

    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedRecentlyViewed) setRecentlyViewed(JSON.parse(savedRecentlyViewed));
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    
    // Cargar productos del admin (damabella_productos)
    const adminProductosRaw = localStorage.getItem('damabella_productos');
    const adminProducts: Product[] = [];
    
    if (adminProductosRaw) {
      try {
        const adminProductos = JSON.parse(adminProductosRaw);
        // Convertir productos del admin al formato de ecommerce
        adminProductos.forEach((p: any) => {
          if (p.activo === true) { // Solo mostrar productos activos
            const variants: ProductVariant[] = [];
            
            if (p.variantes && Array.isArray(p.variantes)) {
              p.variantes.forEach((variant: any) => {
                const colors = variant.colores || [];
                if (colors.length > 0) {
                  colors.forEach((color: any) => {
                    variants.push({
                      color: color.color || 'Negro',
                      colorHex: getColorHex(color.color || 'Negro'),
                      sizes: [{ size: variant.talla, stock: color.cantidad || 0 }]
                    });
                  });
                } else {
                  variants.push({
                    color: 'Negro',
                    colorHex: '#000000',
                    sizes: [{ size: variant.talla, stock: 0 }]
                  });
                }
              });
            }
            
            adminProducts.push({
              id: `admin_${p.id}`,
              name: p.nombre,
              description: `Proveedor: ${p.proveedor}`,
              price: p.precioVenta,
              image: p.imagen || 'https://images.unsplash.com/photo-1505252585461-04db1921b902?w=500&h=500&fit=crop',
              category: p.categoria,
              featured: Math.random() > 0.6,
              new: true,
              variants: variants.length > 0 ? variants : [{
                color: 'Negro',
                colorHex: '#000000',
                sizes: [{ size: 'Única', stock: 0 }]
              }],
              rating: 4.5
            });
          }
        });
      } catch (e) {
        console.error('Error al cargar productos del admin:', e);
      }
    }
    
    const sampleProds = convertSampleProducts();
    setProducts([...adminProducts, ...sampleProds]);

    // Listener para cambios en los productos del admin
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'damabella_productos' && e.newValue) {
        try {
          const adminProductos = JSON.parse(e.newValue);
          const updatedAdminProducts: Product[] = [];
          
          adminProductos.forEach((p: any) => {
            if (p.activo === true) {
              const variants: ProductVariant[] = [];
              
              if (p.variantes && Array.isArray(p.variantes)) {
                p.variantes.forEach((variant: any) => {
                  const colors = variant.colores || [];
                  if (colors.length > 0) {
                    colors.forEach((color: any) => {
                      variants.push({
                        color: color.color || 'Negro',
                        colorHex: getColorHex(color.color || 'Negro'),
                        sizes: [{ size: variant.talla, stock: color.cantidad || 0 }]
                      });
                    });
                  } else {
                    variants.push({
                      color: 'Negro',
                      colorHex: '#000000',
                      sizes: [{ size: variant.talla, stock: 0 }]
                    });
                  }
                });
              }
              
              updatedAdminProducts.push({
                id: `admin_${p.id}`,
                name: p.nombre,
                description: `Proveedor: ${p.proveedor}`,
                price: p.precioVenta,
                image: p.imagen || 'https://images.unsplash.com/photo-1505252585461-04db1921b902?w=500&h=500&fit=crop',
                category: p.categoria,
                featured: Math.random() > 0.6,
                new: true,
                variants: variants.length > 0 ? variants : [{
                  color: 'Negro',
                  colorHex: '#000000',
                  sizes: [{ size: 'Única', stock: 0 }]
                }],
                rating: 4.5
              });
            }
          });
          
          const sampleProds = convertSampleProducts();
          setProducts([...updatedAdminProducts, ...sampleProds]);
        } catch (error) {
          console.error('Error al actualizar productos del admin:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Guardar cambios en localStorage
  useEffect(() => { localStorage.setItem('damabella_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('damabella_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('damabella_recently_viewed', JSON.stringify(recentlyViewed)); }, [recentlyViewed]);
  useEffect(() => { localStorage.setItem('damabella_ecommerce_products', JSON.stringify(products.filter(p => !p.id.startsWith('p')))); }, [products]);
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
  const addProduct = (product: Product) => setProducts(prev => [...prev, product]);
  const updateProduct = (productId: string, updates: Partial<Product>) => setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updates } : p));
  const deleteProduct = (productId: string) => setProducts(prev => prev.filter(p => p.id !== productId));

  // Funciones de órdenes
  const addOrder = (order: Order) => setOrders(prev => [...prev, order]);
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  return (
    <EcommerceContext.Provider value={{
      products, cart, favorites, recentlyViewed, orders,
      addToCart, removeFromCart, updateCartQuantity, clearCart,
      toggleFavorite, addToRecentlyViewed,
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
