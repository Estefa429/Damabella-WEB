import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

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
  categories: { id: number | string; name: string; description: string }[];
  categoriesForHome: { id: number | string; name: string; description: string }[];
  addToCart: (item: CartItem) => boolean;
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
  getProductStock: (productId: string, color: string, size: string) => number;
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

// Función para obtener categorías activas del admin para el NAVBAR
// ✅ Mostrar TODAS las categorías activas, sin filtrar por stock
const getActiveCategoriesForNavbar = (): { id: number | string; name: string; description: string }[] => {
  const categoriesRaw = localStorage.getItem('damabella_categorias');
  
  const activeCategories: { id: number | string; name: string; description: string }[] = [];
  
  if (!categoriesRaw) return activeCategories;
  
  try {
    const allCategories = JSON.parse(categoriesRaw);
    
    // Filtrar SOLO categorías que están activas
    allCategories.forEach((cat: any) => {
      if (cat.active === true) {
        activeCategories.push({
          id: cat.id,
          name: cat.name || cat.nombre,
          description: cat.description || cat.descripcion || ''
        });
      }
    });
    
    console.log('[EcommerceContext] Categorías activas para Navbar:', activeCategories.length);
    return activeCategories;
  } catch (e) {
    console.error('[EcommerceContext] Error al obtener categorías para navbar:', e);
    return activeCategories;
  }
};

// Función para obtener categorías activas del admin para el HOME
// ✅ Mostrar SOLO categorías con al menos un producto activo y con stock
const getActiveCategoriesForHome = (): { id: number | string; name: string; description: string }[] => {
  const categoriesRaw = localStorage.getItem('damabella_categorias');
  const productsRaw = localStorage.getItem('damabella_productos');
  
  const activeCategories: { id: number | string; name: string; description: string }[] = [];
  
  if (!categoriesRaw) return activeCategories;
  
  try {
    const allCategories = JSON.parse(categoriesRaw);
    const allProducts = productsRaw ? JSON.parse(productsRaw) : [];
    
    // Filtrar categorías que están activas
    const activeOnlyCategories = allCategories.filter((cat: any) => cat.active === true);
    
    // Filtrar categorías que tengan al menos un producto activo con stock
    activeOnlyCategories.forEach((cat: any) => {
      const hasActiveProduct = allProducts.some((prod: any) => 
        (prod.categoria === cat.name || prod.categoria === cat.id) &&
        prod.activo !== false && // Mostrar si está activo o no definido
        prod.stockTotal > 0
      );
      
      if (hasActiveProduct) {
        activeCategories.push({
          id: cat.id,
          name: cat.name || cat.nombre,
          description: cat.description || cat.descripcion || ''
        });
      }
    });
    
    console.log('[EcommerceContext] Categorías activas para Home:', activeCategories.length);
    return activeCategories;
  } catch (e) {
    console.error('[EcommerceContext] Error al obtener categorías para home:', e);
    return activeCategories;
  }
};

// Función para convertir productos del admin al formato de ecommerce
const convertAdminProductsToDisplayFormat = (): Product[] => {
  const adminProductosRaw = localStorage.getItem('damabella_productos');
  const adminProducts: Product[] = [];
  
  if (adminProductosRaw) {
    try {
      const adminProductos = JSON.parse(adminProductosRaw);
      console.log('[EcommerceContext] Productos encontrados en localStorage:', adminProductos.length);
      
      adminProductos.forEach((p: any, index: number) => {
        // Mostrar estado de cada producto para debugging
        console.log(`[EcommerceContext] Producto ${index + 1}: ${p.nombre} | Categoría: ${p.categoria} | activo: ${p.activo}`);
        
        // Calcular stock total del producto
        let totalStock = 0;
        if (p.variantes && Array.isArray(p.variantes)) {
          p.variantes.forEach((variant: any) => {
            if (variant.colores && Array.isArray(variant.colores)) {
              variant.colores.forEach((color: any) => {
                totalStock += color.cantidad || 0;
              });
            } else {
              totalStock += variant.cantidad || 0;
            }
          });
        }
        
        console.log(`[EcommerceContext] Stock total para ${p.nombre}: ${totalStock}`);
        
        // ✅ CAMBIO: Mostrar productos activos O productos que no tengan el campo definido (null/undefined)
        // AND que tengan stock disponible (totalStock > 0)
        // Esto es más tolerante con productos que no especifiquen explícitamente 'activo'
        if (p.activo !== false && totalStock > 0) {
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
          
          console.log(`[EcommerceContext] ✅ Producto incluido: ${p.nombre} (Stock: ${totalStock})`);
        } else {
          if (p.activo === false) {
            console.log(`[EcommerceContext] ❌ Producto excluido (inactivo): ${p.nombre}`);
          } else {
            console.log(`[EcommerceContext] ❌ Producto excluido (sin stock): ${p.nombre}`);
          }
        }
      });
      
      console.log('[EcommerceContext] Total productos para mostrar:', adminProducts.length);
    } catch (e) {
      console.error('Error al convertir productos del admin:', e);
    }
  } else {
    console.log('[EcommerceContext] No hay productos en localStorage');
  }
  
  return adminProducts;
};

// Función auxiliar para obtener el stock disponible de un producto específico
const getProductStock = (productId: string, color: string, size: string): number => {
  // ✅ Validaciones defensivas
  if (!productId || !color || !size) {
    console.warn('[getProductStock] Parámetros inválidos:', { productId, color, size });
    return 0;
  }

  const adminProductosRaw = localStorage.getItem('damabella_productos');
  
  if (!adminProductosRaw) {
    console.warn('[getProductStock] No hay productos en localStorage');
    return 0;
  }
  
  try {
    const adminProductos = JSON.parse(adminProductosRaw);
    
    if (!Array.isArray(adminProductos)) {
      console.warn('[getProductStock] Productos no es un array');
      return 0;
    }

    // Extraer el ID sin el prefijo "admin_"
    const actualId = productId.replace('admin_', '');
    const product = adminProductos.find((p: any) => p && p.id?.toString() === actualId);
    
    if (!product) {
      console.warn('[getProductStock] Producto no encontrado:', actualId);
      return 0;
    }

    if (product.activo === false) {
      console.warn('[getProductStock] Producto inactivo:', productId);
      return 0;
    }
    
    if (!product.variantes || !Array.isArray(product.variantes)) {
      console.warn('[getProductStock] Producto sin variantes:', productId);
      return 0;
    }

    for (const variant of product.variantes) {
      if (!variant || variant.talla !== size) continue;

      if (variant.colores && Array.isArray(variant.colores)) {
        for (const colorObj of variant.colores) {
          if (colorObj && colorObj.color === color) {
            const stock = colorObj.cantidad || 0;
            console.log(`[getProductStock] Stock encontrado: ${productId} - ${color} - ${size} = ${stock}`);
            return stock;
          }
        }
      } else if (variant.color === color) {
        const stock = variant.cantidad || 0;
        console.log(`[getProductStock] Stock encontrado (alt): ${productId} - ${color} - ${size} = ${stock}`);
        return stock;
      }
    }
    
    console.warn('[getProductStock] Combinación color/talla no encontrada:', { color, size });
    return 0;
  } catch (e) {
    console.error('[getProductStock] Error obteniendo stock:', e);
    return 0;
  }
};

export function EcommerceProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number | string; name: string; description: string }[]>([]);
  const [categoriesForHome, setCategoriesForHome] = useState<{ id: number | string; name: string; description: string }[]>([]);
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
    
    // ✅ Cargar categorías: NavBar usa todas las activas, Home usa solo las comercializables
    const navbarCategories = getActiveCategoriesForNavbar();
    const homeCategories = getActiveCategoriesForHome();
    setCategories(navbarCategories);
    setCategoriesForHome(homeCategories);
    
    // ✅ Cargar SOLO productos del admin (damabella_productos) - fuente única de verdad
    const adminProducts = convertAdminProductsToDisplayFormat();
    setProducts(adminProducts);

    // Listener para cambios en los productos y categorías del admin (desde otra pestaña)
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === 'damabella_productos' || e.key === 'damabella_categorias') && e.newValue) {
        const adminProducts = convertAdminProductsToDisplayFormat();
        setProducts(adminProducts);
        
        const navbarCategories = getActiveCategoriesForNavbar();
        const homeCategories = getActiveCategoriesForHome();
        setCategories(navbarCategories);
        setCategoriesForHome(homeCategories);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Polling para sincronización en la misma pestaña (cada 1 segundo)
    const pollInterval = setInterval(() => {
      const adminProducts = convertAdminProductsToDisplayFormat();
      setProducts(adminProducts);
      
      const navbarCategories = getActiveCategoriesForNavbar();
      const homeCategories = getActiveCategoriesForHome();
      setCategories(navbarCategories);
      setCategoriesForHome(homeCategories);
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  // Guardar cambios en localStorage
  useEffect(() => { localStorage.setItem('damabella_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('damabella_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('damabella_recently_viewed', JSON.stringify(recentlyViewed)); }, [recentlyViewed]);
  useEffect(() => { localStorage.setItem('damabella_ecommerce_products', JSON.stringify(products.filter(p => !p.id.startsWith('p')))); }, [products]);
  useEffect(() => { localStorage.setItem('damabella_orders', JSON.stringify(orders)); }, [orders]);

  // Funciones de carrito
  const addToCart = (item: CartItem): boolean => {
    try {
      // ✅ Validaciones defensivas exhaustivas
      if (!item) {
        console.error('[addToCart] Item es null/undefined');
        toast.error('❌ Producto inválido');
        return false;
      }

      if (!item.productId) {
        console.error('[addToCart] Item sin productId:', item);
        toast.error('❌ Producto sin identificador');
        return false;
      }

      if (!item.productName) {
        console.error('[addToCart] Item sin productName:', item);
        toast.error('❌ Producto sin nombre');
        return false;
      }

      if (item.price === undefined || item.price === null || item.price < 0) {
        console.error('[addToCart] Precio inválido:', item.price);
        toast.error('❌ Precio inválido');
        return false;
      }

      if (!item.color) {
        console.error('[addToCart] Item sin color:', item);
        toast.error('❌ Color no especificado');
        return false;
      }

      if (!item.size) {
        console.error('[addToCart] Item sin size:', item);
        toast.error('❌ Talla no especificada');
        return false;
      }

      if (!item.quantity || item.quantity < 1) {
        console.error('[addToCart] Cantidad inválida:', item.quantity);
        toast.error('❌ Cantidad inválida');
        return false;
      }

      // ✅ Validar stock disponible en el admin
      const availableStock = getProductStock(item.productId, item.color, item.size);
      if (availableStock < item.quantity) {
        console.warn(`[addToCart] Stock insuficiente: solicitado ${item.quantity}, disponible ${availableStock}`);
        toast.error(`❌ Stock insuficiente. Disponible: ${availableStock}`);
        return false;
      }

      // ✅ Si todas las validaciones pasaron, agregar al carrito
      setCart(prev => {
        const idx = prev.findIndex(
          i => i.productId === item.productId && i.color === item.color && i.size === item.size
        );
        if (idx > -1) {
          const copy = [...prev];
          copy[idx].quantity += item.quantity;
          return copy;
        }
        return [...prev, item];
      });

      console.log('[addToCart] ✅ Producto agregado:', item.productName);
      toast.success(`✅ ${item.productName} agregado al carrito`);
      return true;

    } catch (error) {
      console.error('[addToCart] Error no controlado:', error);
      toast.error('❌ Error al agregar el producto. Intenta de nuevo.');
      return false;
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
      products, categories, categoriesForHome, cart, favorites, recentlyViewed, orders,
      addToCart, removeFromCart, updateCartQuantity, clearCart,
      toggleFavorite, addToRecentlyViewed,
      addProduct, updateProduct, deleteProduct,
      addOrder, updateOrderStatus, getProductStock
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
