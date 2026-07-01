import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, ShoppingCart as CartIcon, SlidersHorizontal, X } from 'lucide-react';
import { useEcommerce } from '../../../../shared/contexts';
import { useToast } from '../../../../shared/components/native';
import { PremiumNavbar } from '../components/PremiumNavbar';
import { PremiumFooter } from '../components/PremiumFooter';
import { ProductImage } from '../../../../components/ecommerce/ProductImage';

interface SearchPageProps {
  onNavigate: (view: string, productId?: string) => void;
  initialCategory?: string;
  isAuthenticated?: boolean;
  currentUser?: any;
}

export function SearchPage({ onNavigate, initialCategory, isAuthenticated = false, currentUser = null }: SearchPageProps) {
  const { products, categories, favorites, toggleFavorite, addToCart, getProductStock, bestSellerId } = useEcommerce();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'Todas');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 300000 });
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);

  // Actualizar categorías desde el contexto (cargadas desde API)
  useEffect(() => {
    if (categories && categories.length > 0) {
      const categoryNames = ['Todas', ...categories.map((cat: any) => cat.name)];
      console.log('[SearchPage] ✅ Categorías del contexto:', categoryNames.join(', '));
    }
  }, [categories]);

  // Construir lista de nombres de categorías únicos para el selector
  const categoryOptions = useMemo(() => {
    const uniqueNames = new Set<string>();
    categories.forEach((cat: any) => {
      if (cat?.name) {
        uniqueNames.add(cat.name.trim());
      }
    });
    return ['Todas', ...Array.from(uniqueNames)];
  }, [categories]);

  // Actualizar selectedCategory cuando cambia initialCategory (incluyendo cuando es undefined/nulo)
  useEffect(() => {
    setSelectedCategory(initialCategory || 'Todas');
  }, [initialCategory]);
  
  const allColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach(p => p.variants.forEach(v => {
      if (v.color) {
        colors.add(v.color.trim());
      }
    }));
    return Array.from(colors);
  }, [products]);

  const allSizes = ['S', 'M', 'L', 'XL'];

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const name = p.name ? String(p.name).toLowerCase() : '';
        const category = p.category ? String(p.category).toLowerCase() : '';
        const desc = p.description ? String(p.description).toLowerCase() : '';
        return name.includes(term) || category.includes(term) || desc.includes(term);
      });
    }

    if (selectedCategory !== 'Todas') {
      const selectedCatLower = selectedCategory.trim().toLowerCase();
      filtered = filtered.filter(p => 
        p.category && String(p.category).trim().toLowerCase() === selectedCatLower
      );
    }

    if (selectedColors.length > 0) {
      const lowerColors = selectedColors.map(c => c.toLowerCase());
      filtered = filtered.filter(p =>
        p.variants.some(v => v.color && lowerColors.includes(v.color.toLowerCase()))
      );
    }

    if (selectedSizes.length > 0) {
      const lowerSizes = selectedSizes.map(s => s.toLowerCase());
      filtered = filtered.filter(p =>
        p.variants.some(v => v.sizes.some(s => s.size && lowerSizes.includes(s.size.toLowerCase()) && s.stock > 0))
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
    // ✅ Validaciones defensivas
    if (!product) {
      showToast('Producto no válido', 'error');
      return;
    }

    if (!product.id) {
      showToast('Error: Producto sin identificador', 'error');
      return;
    }

    if (!product.variants || product.variants.length === 0) {
      showToast('Este producto no tiene variantes disponibles', 'error');
      return;
    }

    const firstVariant = product.variants[0];
    
    if (!firstVariant || !firstVariant.color) {
      showToast('Error: Variante sin datos', 'error');
      return;
    }

    if (!firstVariant.sizes || firstVariant.sizes.length === 0) {
      showToast('Este producto no tiene tallas disponibles', 'error');
      return;
    }

    const firstSize = firstVariant.sizes.find((s: any) => s && s.stock > 0);

    if (!firstSize || !firstSize.size) {
      showToast('❌ Este producto no tiene stock disponible', 'error');
      return;
    }

    // ✅ Validar stock disponible en admin
    const availableStock = getProductStock(product.id, firstVariant.color, firstSize.size);
    
    if (availableStock === 0) {
      showToast('❌ Este producto no tiene stock disponible', 'error');
      return;
    }

    try {
      // ✅ Llamar a addToCart y esperar resultado boolean
      const success = addToCart({
        productId: product.id,
        productName: product.name || 'Producto sin nombre',
        price: product.price || 0,
        image: product.image || '',
        color: firstVariant.color,
        colorHex: firstVariant.colorHex || '#000000',
        size: firstSize.size,
        quantity: 1,
        variantId: firstSize.variantId
      });

      if (!success) {
        console.warn('[SearchPage] addToCart retornó false para:', product.name);
      }
    } catch (error) {
      console.error('[SearchPage] Error al agregar al carrito:', error);
      showToast('Error al agregar al carrito. Intenta de nuevo.', 'error');
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

      <div className="store-container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl text-gray-900 mb-2">
            {selectedCategory !== 'Todas' ? selectedCategory : 'Todos los Productos'}
          </h1>
          <p className="text-gray-600">
            {`${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`}
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
                  {categoryOptions.map(cat => (
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
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group bg-white overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col h-full border border-gray-100 rounded-md"
              >
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  aspectRatio="aspect-[5/6]"
                  onClick={() => onNavigate('detail', product.id)}
                >
                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    {product.new && (
                      <span className="bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        ✨ NUEVO
                      </span>
                    )}
                    {product.id === bestSellerId && (
                      <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1 shadow-md">
                        MÁS VENDIDO
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(product.id)}
                    className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 transform shadow-lg z-10 ${
                      favorites.includes(product.id)
                        ? 'scale-110 bg-red-100 hover:bg-red-200'
                        : 'bg-white/80 hover:bg-white scale-100'
                    }`}
                  >
                    <Heart
                      size={20}
                      className={`transition-all duration-300 ${
                        favorites.includes(product.id) 
                          ? 'fill-red-600 text-red-600' 
                          : 'text-gray-700 hover:text-gray-800'
                      }`}
                    />
                  </button>
                </ProductImage>
                <div className="p-4 flex flex-col flex-grow">
                  <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">DAMABELLA</p>
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 leading-tight min-h-[2.5rem]">
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-3 min-h-[2.5rem]">
                    {product.description || 'Prenda confeccionada con materiales seleccionados para un look elegante y cómodo.'}
                  </p>
                  <p className="text-base font-bold text-gray-950 mb-3">
                    ${product.price.toLocaleString()}
                  </p>
                  
                  {/* Colors */}
                  <div className="flex items-center gap-1.5 mb-4 min-h-6">
                    {Array.from(new Set(product.variants.map((variant) => variant.colorHex))).slice(0, 5).map((colorHex, index) => (
                      <span
                        key={`${product.id}-${colorHex}-${index}`}
                        className="h-5 w-5 rounded-full border border-gray-300 shadow-sm"
                        style={{ backgroundColor: colorHex }}
                      />
                    ))}
                  </div>

                  {/* Buy Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="mt-auto w-full bg-[#ec4899] text-white py-2.5 font-semibold text-sm hover:bg-[#db2777] transition-colors rounded cursor-pointer"
                  >
                    COMPRAR
                  </button>
                </div>
              </article>
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
