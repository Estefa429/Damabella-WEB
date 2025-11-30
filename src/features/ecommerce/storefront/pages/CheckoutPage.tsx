// src/shared/contexts/EcommerceContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// --- Tipos de datos ---
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  [key: string]: any;
}

export interface CartItem extends Product {
  productId: string;
  quantity: number;
  color?: string;
  size?: string;
}

export type OrderStatus = 'Pendiente' | 'Enviado' | 'Completado';

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  iva: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  date: string;
  createdAt: string;
}

export interface EcommerceContextType {
  products: Product[];
  cart: CartItem[];
  favorites: Product[];
  recentlyViewed: Product[];
  orders: Order[];

  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleFavorite: (product: Product) => void;
  addToRecentlyViewed: (product: Product) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  getCartTotal: () => { subtotal: number; iva: number; total: number };
  createOrder: (orderData: Omit<Order, 'id' | 'date' | 'createdAt'>) => Order;
}

// --- Contexto ---
const EcommerceContext = createContext<EcommerceContextType | undefined>(undefined);

export const useEcommerce = (): EcommerceContextType => {
  const context = useContext(EcommerceContext);
  if (!context) throw new Error('useEcommerce must be used within an EcommerceProvider');
  return context;
};

interface ProviderProps {
  children: ReactNode;
}

export const EcommerceProvider: React.FC<ProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // --- Carrito ---
  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const index = prev.findIndex(
        i => i.productId === item.productId && i.color === item.color && i.size === item.size
      );
      if (index >= 0) {
        const updated = [...prev];
        updated[index].quantity += item.quantity;
        return updated;
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (productId: string) =>
    setCart(prev => prev.filter(i => i.productId !== productId));

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId);
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity } : i));
  };

  const clearCart = () => setCart([]);

  // --- Favoritos ---
  const toggleFavorite = (product: Product) =>
    setFavorites(prev =>
      prev.find(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    );

  // --- Recientemente vistos ---
  const addToRecentlyViewed = (product: Product) =>
    setRecentlyViewed(prev =>
      prev.find(p => p.id === product.id) ? prev : [...prev, product]
    );

  // --- Productos ---
  const addProduct = (product: Product) => setProducts(prev => [...prev, product]);
  const updateProduct = (product: Product) =>
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  const deleteProduct = (productId: string) =>
    setProducts(prev => prev.filter(p => p.id !== productId));

  // --- Órdenes ---
  const addOrder = (order: Order) => setOrders(prev => [...prev, order]);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    let found = false;
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          found = true;
          return { ...o, status };
        }
        return o;
      })
    );
    if (!found) console.warn(`Orden con id "${orderId}" no encontrada`);
  };

  // --- Funciones de totales ---
  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  const createOrder = (orderData: Omit<Order, 'id' | 'date' | 'createdAt'>): Order => {
    const newOrder: Order = {
      ...orderData,
      id: `o${Date.now()}`,
      date: new Date().toLocaleDateString(),
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [...prev, newOrder]);
    return newOrder;
  };

  return (
    <EcommerceContext.Provider
      value={{
        products,
        cart,
        favorites,
        recentlyViewed,
        orders,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleFavorite,
        addToRecentlyViewed,
        addProduct,
        updateProduct,
        deleteProduct,
        addOrder,
        updateOrderStatus,
        getCartTotal,
        createOrder,
      }}
    >
      {children}
    </EcommerceContext.Provider>
  );
};
