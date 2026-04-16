import React, { useState } from 'react';
import { Star, Heart, ChevronRight, ChevronLeft } from 'lucide-react';
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

export function PremiumHomePage({ onNavigate, isAuthenticated, currentUser }: PremiumHomePageProps) {
  const { products, categoriesForHome, favorites, toggleFavorite, addToCart, getProductStock } = useEcommerce();
  const [email, setEmail] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Array de imágenes para el carrusel del hero
  const heroSlides = [
    {
      image: 'https://aguamarinaoficial.com/cdn/shop/files/MG_6774.jpg?v=1759176066&width=1000',
      title: 'Encuentra tu outfit ideal',
      subtitle: 'Nuevas colecciones cada semana'
    },
    {
      image: 'https://pinkrose.com.co/cdn/shop/files/ROM14870BLK_e74d4c0b-5012-473a-9e2b-b8fb1d0f0f73.jpg?v=1773943166&width=1000',
      title: 'Colecciones exclusivas',
      subtitle: 'Diseños únicos y de calidad'
    },
    {
      image: 'https://pinkrose.com.co/cdn/shop/files/ROM16131CMLS.png?v=1770739817',
      title: 'Lo mejor en tendencias',
      subtitle: 'Prendas que marcan estilo'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const newProducts = products.slice(0, 12); // Mostrar más productos
  const bestSellers = products.slice(0, 8);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('¡Gracias por suscribirte!');
    setEmail('');
  };

  const handleAddToCart = (product: any) => {
    if (!product?.id) return;

    const variant = product.variants?.[0];
    const size = variant?.sizes?.find((s: any) => s?.stock > 0);

    if (!variant || !size) return;

    const stock = getProductStock(product.id, variant.color, size.size);
    if (stock === 0) return;

    addToCart({
      productId: product.id,
      productName: product.name,
      price: product.price,
      image: product.image,
      color: variant.color,
      colorHex: variant.colorHex,
      size: size.size,
      quantity: 1,
    });
  };


  return (
    <div className="min-h-screen bg-amber-50">
      <PremiumNavbar onNavigate={onNavigate} isAuthenticated={isAuthenticated} currentUser={currentUser} />

      {/* HERO - Carrusel Simple y Visible */}
      <section className="w-full relative" style={{ height: '500px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Imagen de fondo */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${heroSlides[currentSlide].image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1
        }} />
        
        {/* Overlay oscuro */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 2
        }} />

        {/* Contenido - Directo sobre imagen */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '600px',
          padding: '40px',
          textAlign: 'left',
          color: '#fff'
        }}>
          <p style={{ 
            fontSize: '12px', 
            color: '#fff', 
            fontWeight: 'bold', 
            textTransform: 'uppercase', 
            letterSpacing: '1px', 
            marginBottom: '16px',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
          }}>
          </p>
          <h1 style={{ 
            fontSize: '56px', 
            fontWeight: 'bold', 
            color: '#fff', 
            marginBottom: '16px', 
            lineHeight: '1.1',
            textShadow: '3px 3px 6px rgba(0, 0, 0, 0.6)'
          }}>
            {heroSlides[currentSlide].title}
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#fff', 
            marginBottom: '32px',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            maxWidth: '400px'
          }}>
            {heroSlides[currentSlide].subtitle}
          </p>
          <button
            onClick={() => onNavigate('search')}
            style={{
              backgroundColor: '#ec4899',
              color: '#fff',
              padding: '14px 40px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#db2777'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ec4899'}
          >
            VER PRODUCTOS
          </button>
        </div>

        {/* Flechas izquierda */}
        <button
          onClick={prevSlide}
          style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            border: 'none',
            padding: '12px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'}
        >
          <ChevronLeft size={32} color="#fff" />
        </button>

        {/* Flechas derecha */}
        <button
          onClick={nextSlide}
          style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            border: 'none',
            padding: '12px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'}
        >
          <ChevronRight size={32} color="#fff" />
        </button>

        {/* Indicadores */}
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          gap: '12px'
        }}>
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                width: index === currentSlide ? '24px' : '10px',
                height: '10px',
                borderRadius: '5px',
                backgroundColor: index === currentSlide ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>
      </section>

      {/* MÁS VENDIDOS */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">MÁS VENDIDOS</h2>
            <div className="w-20 h-1 bg-amber-600 mx-auto" />
            <p className="text-gray-600 text-base mt-3">Los favoritos de nuestras clientas</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {bestSellers.slice(0, 10).map((product) => (
              <div key={product.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
                {/* Product Image */}
                <div
                  className="aspect-[3/4] overflow-hidden cursor-pointer bg-gray-100 relative"
                  onClick={() => onNavigate('detail', product.id)}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Badge */}
                  <div className="absolute top-3 left-3 bg-amber-600 text-white px-3 py-1 text-xs font-bold">
                    TOP SELLER
                  </div>
                  
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                    className={`absolute top-3 right-3 bg-white/90 p-2 rounded-full transition-all duration-300 transform cursor-pointer ${
                      favorites.includes(product.id) 
                        ? 'scale-110 bg-red-100 hover:bg-red-200' 
                        : 'hover:bg-white scale-100'
                    }`}
                  >
                    <Heart
                      size={18}
                      className={`transition-all duration-300 ${
                        favorites.includes(product.id) 
                          ? 'fill-red-600 text-red-600' 
                          : 'text-gray-700 hover:text-gray-800'
                      }`}
                    />
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <p className="text-xs font-medium text-gray-600 mb-1 uppercase">DAMABELLA</p>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
                    {product.name}
                  </p>
                  <p className="text-lg font-bold text-gray-900 mb-4">
                    ${product.price.toLocaleString()}
                  </p>

                  {/* Buy Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-amber-700 text-white py-2.5 font-semibold text-sm hover:bg-amber-800 transition-colors rounded cursor-pointer"
                  >
                    COMPRAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORÍAS - Menu Horizontal - Full Width */}
      {categoriesForHome.length > 0 && (
        <section className="py-16 bg-white border-y border-gray-200 w-screen relative left-1/2 -translate-x-1/2">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">CATEGORÍAS</h2>
              <div className="w-20 h-1 bg-amber-600" />
            </div>
            <div className="flex flex-wrap gap-6">
              {categoriesForHome.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onNavigate('search', category.name)}
                  className="px-6 py-3 border border-pink-400 text-gray-700 hover:text-pink hover:bg-pink-400 font-semibold rounded-full transition-all duration-300 text-base whitespace-nowrap cursor-pointer"                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* IMAGEN PROMOCIONAL */}
      <section className="py-0 bg-gray-50">
        <div className="max-w-full mx-0 px-0">
          <img 
            src="https://www.bybla.com.co/cdn/shop/files/new_denim_melisa_8fdefb4f-4753-4e91-bb46-7ade9334bcb2.png?v=1774471060&width=1800"
            alt="Promotional Banner"
            className="w-full h-auto object-cover"
          />
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">RESEÑAS DE CLIENTES</h2>
            <div className="w-20 h-1 bg-amber-600 mx-auto" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                name: 'María González', 
                text: 'Excelente calidad en las prendas. Los diseños son únicos y la atención al cliente es impecable. ¡Muy recomendado!',
                rating: 5
              },
              { 
                name: 'Laura Rodríguez', 
                text: 'Me encanta encontrar piezas diferentes en DAMABELLA. Siempre hay algo nuevo y de muy buena calidad.',
                rating: 5
              },
              { 
                name: 'Ana Martínez', 
                text: 'Tienda confiable con excelentes diseños. Las fotos son fieles y la entrega es rápida. ¡100% recomendado!',
                rating: 5
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-gray-50 p-8 rounded-lg border border-gray-200 hover:border-amber-400 transition-colors">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} size={18} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-base mb-4 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <p className="text-sm font-bold text-gray-900">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-100">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-black mb-3 border-4 border-black p-4 rounded-lg">Suscríbete a DAMABELLA</h2>
          <p className="text-dark gray-300 mb-8 text-lg">
            Sé la primera en enterarte de nuevas colecciones, ofertas y los mejores tips de moda
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo electrónico"
              required
              className="flex-1 px-4 py-4 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 placeholder:text-gray-500 border-2 border-black"
            />
            <button
              type="submit"
              className="bg-pink-400 text-white px-8 py-4 font-semibold rounded-md hover:bg-pink-500 transition-all duration-300 cursor-pointer"
            >
              Suscribirse
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <PremiumFooter onNavigate={onNavigate} />
    </div>
  );
}