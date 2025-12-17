import React from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { useEcommerce } from '../../../../shared/contexts';
import { PremiumNavbar } from '../components/PremiumNavbar';
import { PremiumFooter } from '../components/PremiumFooter';

interface FavoritesPageProps {
  onNavigate: (view: string, productId?: string) => void;
  isAuthenticated?: boolean;
  currentUser?: any;
}

export function FavoritesPage({ onNavigate, isAuthenticated = false, currentUser = null }: FavoritesPageProps) {
  const { products, favorites, toggleFavorite, addToCart } = useEcommerce();

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  const handleAddToCart = (product: any) => {
    // Validar que el producto tenga variantes
    if (!product?.variants || product.variants.length === 0) {
      alert('Este producto no tiene variantes disponibles');
      return;
    }

    const firstVariant = product.variants[0];

    // Validar que la variante tenga tallas
    if (!firstVariant?.sizes || firstVariant.sizes.length === 0) {
      alert('Este producto no tiene tallas disponibles');
      return;
    }

    const firstSize = firstVariant.sizes.find((s: any) => s.stock > 0);

    if (firstSize) {
      addToCart({
        productId: product.id,
        productName: product.name,
        price: product.price,
        image: product.image,
        color: firstVariant.color,
        colorHex: firstVariant.colorHex,
        size: firstSize.size,
        quantity: 1,
      });
    } else {
      alert('Este producto no tiene stock disponible');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PremiumNavbar onNavigate={onNavigate} isAuthenticated={isAuthenticated} currentUser={currentUser} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-4xl text-gray-900 mb-8">
          Mis Favoritos
        </h1>

        {favoriteProducts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <Heart size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-2xl text-gray-400 mb-6">Aún no tienes favoritos</p>
            <button
              onClick={() => onNavigate('search')}
              className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-8 py-4 rounded-full hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-105 shadow-lg"
            >
              Explorar Productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favoriteProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover cursor-pointer group-hover:scale-110 transition-transform duration-700"
                    onClick={() => onNavigate('detail', product.id)}
                  />
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-3 right-3 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md"
                  >
                    <Heart size={20} className="fill-pink-400 text-pink-400" />
                  </button>
                </div>
                <div className="p-4">
                  <h3
                    className="text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-pink-400 transition-colors min-h-[3rem]"
                    onClick={() => onNavigate('detail', product.id)}
                  >
                    {product.name}
                  </h3>
                  <p className="text-2xl text-gray-900 mb-3">
                    ${product.price.toLocaleString()}
                  </p>
                  <div className="flex gap-1 mb-3">
                    {Array.from(new Set(product.variants.map(v => v.colorHex))).slice(0, 4).map((colorHex, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: colorHex }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-gray-900 text-white py-3 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={18} />
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PremiumFooter onNavigate={onNavigate} />
    </div>
  );
}