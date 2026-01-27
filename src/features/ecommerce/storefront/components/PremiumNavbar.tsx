import React, { useState, useEffect, useRef } from 'react';
import { Search, Heart, ShoppingCart, User } from 'lucide-react';
import { useEcommerce } from '../../../../shared/contexts';

interface PremiumNavbarProps {
  onNavigate: (view: string, category?: string) => void;
  isAuthenticated: boolean;
  currentUser: any;
}

export function PremiumNavbar({ onNavigate, isAuthenticated, currentUser }: PremiumNavbarProps) {
  const { cart, favorites } = useEcommerce();
  const [categories, setCategories] = useState<string[]>(['Vestidos Largos', 'Vestidos Cortos', 'Sets', 'Enterizos']);
  const loadedCategoriesRef = useRef<string>('');

  // Cargar categorías dinámicas desde localStorage con polling
  useEffect(() => {
    const loadCategories = () => {
      const stored = localStorage.getItem('damabella_categorias');
      
      if (stored !== loadedCategoriesRef.current) {
        loadedCategoriesRef.current = stored || '';
        
        if (stored) {
          try {
            const categorias = JSON.parse(stored);
            const categoryNames = categorias.map((cat: any) => cat.name);
            setCategories(categoryNames);
            console.log('[PremiumNavbar] ✅ Categorías actualizadas:', categoryNames.join(', '));
          } catch (error) {
            console.error('[PremiumNavbar] Error cargando categorías:', error);
          }
        }
      }
    };

    loadCategories();
    
    // Polling cada 500ms
    const interval = setInterval(loadCategories, 500);
    return () => clearInterval(interval);
  }, []);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const favoritesCount = favorites.length;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent hover:from-pink-500 hover:to-purple-500 transition-all"
          >
            DAMABELLA
          </button>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => onNavigate('search')}
              className="text-gray-700 hover:text-pink-400 transition-colors"
            >
              Productos
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onNavigate('search', category)}
                className="text-gray-700 hover:text-pink-400 transition-colors"
              >
                {category}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('search')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Buscar"
            >
              <Search size={22} className="text-gray-700" />
            </button>

            <button
              onClick={() => onNavigate('favorites')}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Favoritos"
            >
              <Heart size={22} className="text-gray-700" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-400 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Carrito"
            >
              <ShoppingCart size={22} className="text-gray-700" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-400 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('profile')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Perfil"
            >
              {isAuthenticated && currentUser ? (
                <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              ) : (
                <User size={22} className="text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}