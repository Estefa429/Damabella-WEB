import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, SlidersHorizontal, X } from 'lucide-react';
import { useEcommerce } from '../../../../shared/contexts';
import { useToast } from '../../../../shared/components/native';
import { PremiumNavbar } from '../components/PremiumNavbar';
import { PremiumFooter } from '../components/PremiumFooter';

interface SearchPageProps {
  onNavigate: (view: string, productId?: string) => void;
  initialCategory?: string;
  isAuthenticated?: boolean;
  currentUser?: any;
}

export function SearchPage({ onNavigate, initialCategory, isAuthenticated = false, currentUser = null }: SearchPageProps) {
  const { products, favorites, toggleFavorite, addToCart } = useEcommerce();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'Todas');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 300000 });
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>(['Todas']);
  const loadedCategoriesRef = useRef<string>(''); // Para detectar cambios

  // Cargar categorías desde localStorage + Polling para cambios
  useEffect(() => {
    const loadCategories = () => {
      const stored = localStorage.getItem('damabella_categorias');
      
      // Solo actualizar si cambió
      if (stored !== loadedCategoriesRef.current) {
        loadedCategoriesRef.current = stored || '';
        console.log('[SearchPage] Leyendo categorías desde localStorage...', stored ? JSON.parse(stored).length + ' categorías' : 'ninguna');
        
        if (stored) {
          try {
            const categorias = JSON.parse(stored);
            const categoryNames = ['Todas', ...categorias.map((cat: any) => cat.name)];
            setCategories(categoryNames);
            console.log('[SearchPage] ✅ Categorías actualizadas:', categoryNames.join(', '));
          } catch (error) {
            console.error('[SearchPage] Error cargando categorías:', error);
            setCategories(['Todas']);
          }
        } else {
          console.log('[SearchPage] ⚠️ No hay categorías en localStorage');
          setCategories(['Todas']);
        }
      }
    };

    // Cargar una vez al inicio
    loadCategories();
    
    // Polling cada 500ms para detectar nuevas categorías
    const interval = setInterval(loadCategories, 500);
    return () => clearInterval(interval);
  }, []);

  // Actualizar selectedCategory cuando cambie initialCategory
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);
  
  const allColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach(p => p.variants.forEach(v => colors.add(v.color)));
    return Array.from(colors);
  }, [products]);

  const allSizes = ['S', 'M', 'L', 'XL'];

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'Todas') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (selectedColors.length > 0) {
      filtered = filtered.filter(p =>
        p.variants.some(v => selectedColors.includes(v.color))
      );
    }

    if (selectedSizes.length > 0) {
      filtered = filtered.filter(p =>
        p.variants.some(v => v.sizes.some(s => selectedSizes.includes(s.size) && s.stock > 0))
      );
    }

    filtered = filtered.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);

    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'new':
        filtered.sort((a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0));
        break;
      default:
        filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedColors, selectedSizes, priceRange, sortBy]);

  const toggleColor = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const clearFilters = () => {
    setSelectedCategory('Todas');
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange({ min: 0, max: 300000 });
    setSortBy('popular');
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
      showToast('✅ Producto agregado al carrito', 'success');
    }
  };

  const handleToggleFavorite = (productId: string) => {
    toggleFavorite(productId);
    if (favorites.includes(productId)) {
      showToast('❤️ Removido de favoritos', 'info');
    } else {
      showToast('❤️ Agregado a favoritos', 'success');
    }
  };

  const activeFiltersCount = 
    (selectedCategory !== 'Todas' ? 1 : 0) +
    selectedColors.length +
    selectedSizes.length +
    (priceRange.min > 0 || priceRange.max < 300000 ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <PremiumNavbar onNavigate={onNavigate} isAuthenticated={isAuthenticated} currentUser={currentUser} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl text-gray-900 mb-2">
            {selectedCategory !== 'Todas' ? selectedCategory : 'Todos los Productos'}
          </h1>
          <p className="text-gray-600">
            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* Sort */}
            <div className="w-full md:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
              >
                <option value="popular">Más Popular</option>
                <option value="new">Más Nuevo</option>
                <option value="price-asc">Menor Precio</option>
                <option value="price-desc">Mayor Precio</option>
              </select>
            </div>

            {/* Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <SlidersHorizontal size={20} />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="bg-pink-400 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl text-gray-900">Filtros</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-pink-400 hover:text-pink-500 transition-colors"
              >
                Limpiar todo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Categories */}
              <div>
                <h4 className="text-sm text-gray-700 mb-3">Categoría</h4>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === cat
                          ? 'bg-pink-50 text-pink-400'
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <h4 className="text-sm text-gray-700 mb-3">Colores</h4>
                <div className="flex flex-wrap gap-2">
                  {allColors.map(color => {
                    const variant = products.find(p => p.variants.some(v => v.color === color))?.variants.find(v => v.color === color);
                    return (
                      <button
                        key={color}
                        onClick={() => toggleColor(color)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selectedColors.includes(color)
                            ? 'border-pink-400 ring-2 ring-pink-200'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: variant?.colorHex }}
                        title={color}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h4 className="text-sm text-gray-700 mb-3">Tallas</h4>
                <div className="flex flex-wrap gap-2">
                  {allSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedSizes.includes(size)
                          ? 'bg-pink-50 border-pink-400 text-pink-400'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-sm text-gray-700 mb-3">Rango de Precio</h4>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="300000"
                    step="10000"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                    className="w-full accent-pink-400"
                  />
                  <p className="text-sm text-gray-600">
                    Hasta: ${priceRange.max.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
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
                  {product.new && (
                    <span className="absolute top-3 left-3 bg-pink-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                      NUEVO
                    </span>
                  )}
                  <button
                    onClick={() => handleToggleFavorite(product.id)}
                    className="absolute top-3 right-3 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md"
                  >
                    <Heart
                      size={20}
                      className={favorites.includes(product.id) ? 'fill-pink-400 text-pink-400' : 'text-gray-600'}
                    />
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
                    className="w-full bg-gray-900 text-white py-3 rounded-full hover:bg-gray-800 transition-colors"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-400 mb-4">No se encontraron productos</p>
            <button
              onClick={clearFilters}
              className="text-pink-400 hover:text-pink-500 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      <PremiumFooter onNavigate={onNavigate} />
    </div>
  );
}