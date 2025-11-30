import React, { useState } from 'react';
import { Search, Heart, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEcommerce } from '../../../../shared/contexts';

interface HomePageProps {
  onNavigate: (view: string, productId?: string) => void;
  onLoginRequired: () => void;
  isAuthenticated: boolean;
}

export function HomePage({ onNavigate, onLoginRequired, isAuthenticated }: HomePageProps) {
  const { products, favorites, toggleFavorite, recentlyViewed, addToCart } = useEcommerce();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Detectar si hay productos del panel administrativo
  const adminProductsCount = products.filter(p => !p.id.startsWith('p')).length;
  const hasAdminProducts = adminProductsCount > 0;

  const featuredProducts = products.filter(p => p.featured).slice(0, 8);
  const newProducts = products.filter(p => p.new).slice(0, 8);
  const recentlyViewedProducts = products.filter(p => recentlyViewed.includes(p.id)).slice(0, 4);

  const banners = [
    { id: 1, title: '✨ Nueva Colección', subtitle: 'Descubre los últimos diseños', bgColor: 'from-pink-300 to-purple-300' },
    { id: 2, title: '🎁 Envío Gratis', subtitle: 'En compras mayores a $150.000', bgColor: 'from-blue-300 to-pink-300' },
    { id: 3, title: '💎 Descuentos Especiales', subtitle: 'Hasta 30% OFF en productos seleccionados', bgColor: 'from-purple-300 to-pink-400' },
  ];

  const categories = [
    { name: 'Vestidos Largos', icon: '👗', color: 'bg-pink-100', count: products.filter(p => p.category === 'Vestidos Largos').length },
    { name: 'Vestidos Cortos', icon: '👚', color: 'bg-purple-100', count: products.filter(p => p.category === 'Vestidos Cortos').length },
    { name: 'Enterizos', icon: '🩱', color: 'bg-blue-100', count: products.filter(p => p.category === 'Enterizos').length },
    { name: 'Sets', icon: '👔', color: 'bg-rose-100', count: products.filter(p => p.category === 'Sets').length },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleAddToCart = (product: any) => {
    const firstVariant = product.variants[0];
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
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      {/* Header - Desktop */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm lg:hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              DAMABELLA
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('search')}
                className="flex items-center gap-2 px-6 py-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Search size={20} className="text-gray-600" />
                <span className="text-gray-700">Buscar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Indicador de Conexión con Panel Administrativo */}
      {hasAdminProducts && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 py-3 text-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <p className="text-center">
              ✨ <strong>{adminProductsCount}</strong> productos sincronizados desde el Panel Administrativo
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        {/* Banner Carousel */}
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-md mb-8">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className={`min-w-full h-80 bg-gradient-to-r ${banner.bgColor} flex flex-col items-center justify-center px-6`}
                >
                  <h2 className="text-5xl font-bold text-gray-800 text-center mb-4">
                    {banner.title}
                  </h2>
                  <p className="text-xl text-gray-700 text-center">{banner.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full hover:bg-white transition-colors shadow-lg"
          >
            <ChevronLeft size={24} className="text-gray-800" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full hover:bg-white transition-colors shadow-lg"
          >
            <ChevronRight size={24} className="text-gray-800" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-gray-800' : 'bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h3 className="text-3xl text-gray-800 mb-6">Categorías</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => onNavigate('search', category.name)}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <p className="text-lg text-gray-800 mb-1">{category.name}</p>
                <p className="text-sm text-gray-600">{category.count} productos</p>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        <div className="mb-12">
          <h3 className="text-3xl text-gray-800 mb-6">Productos Destacados</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="relative group">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                    onClick={() => onNavigate('detail', product.id)}
                  />
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md"
                  >
                    <Heart
                      size={20}
                      className={favorites.includes(product.id) ? 'fill-[#FFB6C1] text-[#FFB6C1]' : 'text-gray-600'}
                    />
                  </button>
                </div>
                <div className="p-4">
                  <h4 className="text-gray-800 mb-2 line-clamp-2 min-h-[3rem]">
                    {product.name}
                  </h4>
                  <p className="text-2xl text-gray-900 mb-3">
                    ${product.price.toLocaleString()}
                  </p>
                  <div className="flex gap-1.5 mb-3">
                    {product.variants.slice(0, 4).map((variant, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: variant.colorHex }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-[#FFB6C1] text-white py-3 rounded-lg hover:bg-[#FF9EB1] transition-colors font-semibold"
                  >
                    Agregar al Carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New Products */}
        <div className="mb-12">
          <h3 className="text-3xl text-gray-800 mb-6">Novedades</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {newProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="relative group">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                    onClick={() => onNavigate('detail', product.id)}
                  />
                  <span className="absolute top-3 left-3 bg-[#FFB6C1] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    NUEVO
                  </span>
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md"
                  >
                    <Heart
                      size={20}
                      className={favorites.includes(product.id) ? 'fill-[#FFB6C1] text-[#FFB6C1]' : 'text-gray-600'}
                    />
                  </button>
                </div>
                <div className="p-4">
                  <h4 className="text-gray-800 mb-2 line-clamp-2 min-h-[3rem]">
                    {product.name}
                  </h4>
                  <p className="text-2xl text-gray-900 mb-3">
                    ${product.price.toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-[#FFB6C1] text-white py-3 rounded-lg hover:bg-[#FF9EB1] transition-colors font-semibold"
                  >
                    Agregar al Carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Viewed */}
        {recentlyViewedProducts.length > 0 && (
          <div className="mb-12">
            <h3 className="text-3xl text-gray-800 mb-6">Vistos Recientemente</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recentlyViewedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                  onClick={() => onNavigate('detail', product.id)}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-56 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="text-gray-800 mb-2 line-clamp-2">
                      {product.name}
                    </h4>
                    <p className="text-xl text-gray-900">
                      ${product.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}