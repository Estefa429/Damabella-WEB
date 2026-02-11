import React, { useState } from 'react';
import { ChevronRight, Star, Truck, Shield, Heart, ArrowRight, Instagram, Facebook, Twitter } from 'lucide-react';
import { useEcommerce } from '../../../../shared/contexts';
import { PremiumNavbar } from '../components/PremiumNavbar';
import { PremiumFooter } from '../components/PremiumFooter';
import { ImageWithFallback } from '../../../../components/figma/ImageWithFallback';

interface PremiumHomePageProps {
  onNavigate: (view: string, productId?: string) => void;
  onLoginRequired: () => void;
  isAuthenticated: boolean;
  currentUser?: any;
}

export function PremiumHomePage({ onNavigate, onLoginRequired, isAuthenticated, currentUser }: PremiumHomePageProps) {
  const { products, categoriesForHome, favorites, toggleFavorite, addToCart, getProductStock } = useEcommerce();
  const [email, setEmail] = useState('');

  const newProducts = products.slice(0, 8); // Mostrar los primeros 8 productos

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('¡Gracias por suscribirte! Pronto recibirás nuestras novedades.');
    setEmail('');
  };

  const handleAddToCart = (product: any) => {
    // ✅ Validación defensiva completa
    if (!product) {
      alert('Producto no válido');
      return;
    }

    if (!product.id) {
      console.error('Producto sin ID:', product);
      alert('Error: Producto sin identificador');
      return;
    }

    if (!product.variants || product.variants.length === 0) {
      alert('Este producto no tiene variantes disponibles');
      return;
    }

    const firstVariant = product.variants[0];

    if (!firstVariant?.color) {
      alert('Variante sin color');
      return;
    }

    if (!firstVariant?.sizes || firstVariant.sizes.length === 0) {
      alert('Este producto no tiene tallas disponibles');
      return;
    }

    const firstSize = firstVariant.sizes.find((s: any) => s && s.stock > 0);

    if (!firstSize || !firstSize.size) {
      alert('Este producto no tiene stock disponible');
      return;
    }

    // ✅ Validar stock disponible en admin
    const availableStock = getProductStock(product.id, firstVariant.color, firstSize.size);
    
    if (availableStock === 0) {
      alert('❌ Este producto no tiene stock disponible');
      return;
    }

    // ✅ Llamar a addToCart y esperar resultado boolean
      try {
      const success = addToCart({
        productId: product.id,
        productName: product.name || 'Producto sin nombre',
        price: product.price || 0,
        image: product.image || '',
        color: firstVariant.color,
        colorHex: firstVariant.colorHex || '#000000',
        size: firstSize.size,
        quantity: 1,
      });
      if (!success) {
        console.warn('[PremiumHomePage] addToCart retornó false para:', product.name);
      }
    } catch (error) {
      console.error('[PremiumHomePage] Error al agregar al carrito:', error);
      // El toast de error ya debería haberse mostrado en el contexto
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PremiumNavbar onNavigate={onNavigate} isAuthenticated={isAuthenticated} currentUser={currentUser} />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-purple-50 to-pink-50" />
        
        {/* Hero Image */}
        <div className="absolute inset-0 opacity-40">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1720005398225-4ea01c9d2b8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZmFzaGlvbiUyMHdvbWFuJTIwZHJlc3N8ZW58MXx8fHwxNzYzOTE0ODA3fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Fashion"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-7xl lg:text-8xl mb-6 text-gray-900 tracking-tight">
            DAMABELLA
          </h1>
          <p className="text-2xl lg:text-3xl mb-4 text-gray-700 max-w-3xl mx-auto">
            Elegancia Redefinida
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Descubre nuestra colección exclusiva de moda femenina. 
            Diseños únicos que resaltan tu belleza natural.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => onNavigate('search')}
              className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-8 py-4 rounded-full hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              Explorar Colección
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* Split Banner - Categorías Dinámicas */}
      {categoriesForHome.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-pink-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-5xl text-gray-900 mb-4">Explora Nuestras Categorías</h2>
              <p className="text-xl text-gray-600">Encuentra el estilo perfecto para cada ocasión</p>
            </div>
            
            <div className={`grid ${
              categoriesForHome.length === 1 ? 'grid-cols-1' :
              categoriesForHome.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              categoriesForHome.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
              'grid-cols-1 md:grid-cols-2'
            } gap-8`}>
              {categoriesForHome.map((category, index) => {
                const categoryImages = [
                  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
                  'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800',
                  'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
                  'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800',
                ];
                const categoryDescriptions = [
                  'Elegancia para cada ocasión',
                  'Frescura y versatilidad',
                  'Conjuntos perfectamente coordinados',
                  'Sofisticación en una sola pieza'
                ];
                
                return (
                  <div 
                    key={category.id}
                    className="relative overflow-hidden rounded-3xl h-[400px] group cursor-pointer"
                    onClick={() => onNavigate('search', category.name)}
                  >
                    <img
                      src={categoryImages[index % categoryImages.length]}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                      <h3 className="text-4xl mb-2">{category.name}</h3>
                      <p className="text-lg mb-4">{categoryDescriptions[index % categoryDescriptions.length]}</p>
                      <button className="inline-flex items-center gap-2 text-white hover:gap-3 transition-all">
                        Explorar
                        <ArrowRight size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      {newProducts.length > 0 ? (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl text-gray-900 mb-4">Nuevos Ingresos</h2>
              <p className="text-xl text-gray-600">
                Lo último en moda femenina
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {newProducts.map((product) => (
                <div
                  key={product.id}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-2xl mb-4 aspect-[3/4] bg-gray-100">
                    <span className="absolute top-4 left-4 bg-pink-400 text-white text-sm px-4 py-1.5 rounded-full z-10">
                      NUEVO
                    </span>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 cursor-pointer"
                      onClick={() => onNavigate('detail', product.id)}
                    />
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <Heart
                        size={20}
                        className={favorites.includes(product.id) ? 'fill-pink-400 text-pink-400' : 'text-gray-600'}
                      />
                    </button>
                  </div>
                  <h3 
                    className="text-lg text-gray-900 mb-2 line-clamp-2"
                    onClick={() => onNavigate('detail', product.id)}
                  >
                    {product.name}
                  </h3>
                  <p className="text-2xl text-gray-900 mb-4">
                    ${product.price.toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-gray-900 text-white py-3 rounded-full hover:bg-gray-800 transition-colors"
                  >
                    Agregar al Carrito
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-2xl text-gray-400 mb-4">No hay productos disponibles en este momento</p>
            <p className="text-lg text-gray-500 mb-8">Verifica nuevamente en unos momentos para ver nuestros nuevos ingresos</p>
            <button
              onClick={() => onNavigate('search')}
              className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-8 py-3 rounded-full hover:from-pink-500 hover:to-purple-500 transition-all"
            >
              Explorar Colección
            </button>
          </div>
        </section>
      )}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl text-gray-900 mb-4">Lo Que Dicen Nuestras Clientas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'María González',
                review: 'La calidad de las prendas es excepcional. Me encanta cada pieza que he comprado.',
                rating: 5
              },
              {
                name: 'Laura Rodríguez',
                review: 'Excelente atención al cliente y los diseños son hermosos. Totalmente recomendado.',
                rating: 5
              },
              {
                name: 'Ana Martínez',
                review: 'Las mejores prendas de moda femenina. Siempre encuentro algo perfecto para cada ocasión.',
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={20} className="fill-pink-400 text-pink-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 text-lg">"{testimonial.review}"</p>
                <p className="text-gray-900">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-gradient-to-r from-pink-400 to-purple-400">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl text-white mb-4">Únete a Nuestra Comunidad</h2>
          <p className="text-xl text-white/90 mb-8">
            Suscríbete y recibe descuentos exclusivos y las últimas novedades
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex gap-4 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo electrónico"
              required
              className="flex-1 px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="bg-gray-900 text-white px-8 py-4 rounded-full hover:bg-gray-800 transition-colors whitespace-nowrap"
            >
              Suscribirse
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <PremiumFooter onNavigate={onNavigate} />
    </div>
  );
}