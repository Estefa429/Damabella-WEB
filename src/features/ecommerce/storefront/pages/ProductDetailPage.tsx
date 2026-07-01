import React, { useState, useEffect } from 'react';
import { Heart, Star, Plus, Minus, ShoppingCart, Shield, RotateCcw, Loader } from 'lucide-react';
import { useToast } from '../../../../shared/components/native';
import { useProductDetail } from '@/features/ecommerce/storefront/pages/useProductDetail';
import { PremiumNavbar } from '../components/PremiumNavbar';
import { PremiumFooter } from '../components/PremiumFooter';
import { useEcommerce } from '../../../../shared/contexts';
import { ProductImage } from '../../../../components/ecommerce/ProductImage';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (view: string, productId?: string) => void;
  isAuthenticated?: boolean;
  currentUser?: any;
}

export function ProductDetailPage({ 
  productId, 
  onNavigate, 
  isAuthenticated = false, 
  currentUser = null 
}: ProductDetailPageProps) {
  const { product, loading, error } = useProductDetail(productId);
  const { showToast } = useToast();
  const { addToCart } = useEcommerce();
  
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [rating, setRating] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Inicializar color y talla cuando cargue el producto
  useEffect(() => {
    if (product && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      setSelectedColor(firstVariant.color);
      
      const firstAvailableSize = firstVariant.sizes.find(s => s.stock > 0);
      if (firstAvailableSize) {
        setSelectedSize(firstAvailableSize.size);
      } else if (firstVariant.sizes.length > 0) {
        // Si no hay tamaño con stock en la variante, selecciona el primero
        setSelectedSize(firstVariant.sizes[0].size);
      }
    }
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PremiumNavbar onNavigate={onNavigate} isAuthenticated={isAuthenticated} currentUser={currentUser} />
        <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center">
          <Loader className="animate-spin text-pink-400 mb-4" size={48} />
          <p className="text-xl text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PremiumNavbar onNavigate={onNavigate} isAuthenticated={isAuthenticated} currentUser={currentUser} />
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <p className="text-2xl text-gray-400">
            {error || 'Producto no encontrado'}
          </p>
          <button
            onClick={() => onNavigate('search')}
            className="mt-6 text-pink-400 hover:text-pink-500 transition-colors"
          >
            Ver todos los productos
          </button>
        </div>
      </div>
    );
  }

  const selectedVariant = product.variants.find(v => v.color === selectedColor);
  const selectedSizeData = selectedVariant?.sizes.find(s => s.size === selectedSize);
  const currentStock = selectedSizeData?.stock || 0;

  // Obtener todas las tallas únicas
  const allUniqueSizes = Array.from(
    new Set(product.variants.flatMap(v => v.sizes.map(s => s.size)))
  );

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) {
      showToast('Selecciona color y talla', 'error');
      return;
    }

    if (currentStock === 0) {
      showToast('❌ No hay stock disponible', 'error');
      return;
    }

    if (quantity > currentStock) {
      showToast(`❌ Solo disponibles ${currentStock} unidades`, 'error');
      return;
    }

    addToCart({
      productId: product.id,
      productName: product.name,
      price: product.price,
      image: product.image,
      color: selectedColor,
      colorHex: selectedVariant?.colorHex || '#000000',
      size: selectedSize,
      quantity,
      variantId: selectedSizeData?.variantId
    });
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    if (!isFavorite) {
      showToast('❤️ Agregado a favoritos', 'success');
    } else {
      showToast('❤️ Removido de favoritos', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PremiumNavbar onNavigate={onNavigate} isAuthenticated={isAuthenticated} currentUser={currentUser} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <button onClick={() => onNavigate('home')} className="hover:text-pink-400 transition-colors">
            Inicio
          </button>
          <span>/</span>
          <button onClick={() => onNavigate('search')} className="hover:text-pink-400 transition-colors">
            Productos
          </button>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        {/* Product Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Images */}
          <div>
            {/* Imagen principal */}
            <ProductImage
              src={product.photos[selectedImage]?.image || product.image}
              alt={product.name}
              aspectRatio="3/4"
              className="rounded-2xl shadow-sm mb-4"
            />

            {/* Miniaturas */}
            {product.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                      index === selectedImage
                        ? 'border-pink-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={photo.image}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {product.photos.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {selectedImage + 1} de {product.photos.length} fotos
              </p>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="mb-6">
              <h1 className="text-4xl text-gray-900 mb-4">{product.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <p className="text-4xl text-gray-900">
                  {product.price.toLocaleString()} COP
                </p>
                <button
                  onClick={handleToggleFavorite}
                  className={`p-3 rounded-full transition-all duration-300 transform ${
                    isFavorite 
                      ? 'bg-red-100 hover:bg-red-200 scale-110' 
                      : 'hover:bg-gray-100 scale-100'
                  }`}
                >
                  <Heart
                    size={28}
                    className={`transition-all duration-300 ${
                      isFavorite 
                        ? 'fill-red-600 text-red-600' 
                        : 'text-gray-700 hover:text-gray-800'
                    }`}
                  />
                </button>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setRating(i + 1);
                        showToast(`⭐ Calificación de ${i + 1} estrella${i + 1 !== 1 ? 's' : ''} registrada`, 'success');
                      }}
                      className="cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star
                        size={18}
                        className={
                          i < Math.max(rating, product.rating)
                            ? i < rating
                              ? 'fill-orange-400 text-orange-400'
                              : 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    </button>
                  ))}
                </div>
                <span className="text-gray-600">({Math.max(rating, product.rating).toFixed(1)})</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <h3 className="text-lg text-gray-900 mb-3">
                Color: <span className="font-normal text-gray-600">{selectedColor}</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((variant) => (
                  <button
                    key={variant.color}
                    onClick={() => {
                      setSelectedColor(variant.color);
                      // Reset size cuando cambia el color
                      const firstAvailable = variant.sizes.find(s => s.stock > 0);
                      setSelectedSize(firstAvailable?.size || '');
                    }}
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      selectedColor === variant.color
                        ? 'border-pink-400 ring-2 ring-pink-200 scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: variant.colorHex }}
                    title={variant.colorName}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <h3 className="text-lg text-gray-900 mb-3">
                Talla: <span className="font-normal text-gray-600">{selectedSize || 'Seleccionar'}</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {allUniqueSizes.map((size) => {
                  const sizeInVariant = selectedVariant?.sizes.find(s => s.size === size);
                  const hasStock = sizeInVariant && sizeInVariant.stock > 0;
                  
                  return (
                    <button
                      key={size}
                      onClick={() => hasStock && setSelectedSize(size)}
                      disabled={!hasStock}
                      className={`px-6 py-3 rounded-lg border-2 transition-all ${
                        selectedSize === size
                          ? 'bg-pink-50 border-pink-400 text-pink-400'
                          : hasStock
                          ? 'border-gray-300 text-gray-700 hover:border-gray-400 cursor-pointer'
                          : 'border-gray-200 text-gray-400 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-lg text-gray-900 mb-3">
                {currentStock > 0 ? `Cantidad (Stock: ${currentStock})` : 'Cantidad (Sin stock)'}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-300 rounded-lg px-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-gray-100 transition-colors"
                    disabled={currentStock === 0}
                  >
                    <Minus size={20} />
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={currentStock}
                    value={quantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 1;
                      setQuantity(Math.max(1, Math.min(currentStock, v)));
                    }}
                    className="w-28 text-center text-xl px-2 outline-none bg-transparent"
                    disabled={currentStock === 0}
                  />

                  <button
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    className="p-3 hover:bg-gray-100 transition-colors"
                    disabled={currentStock === 0}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={currentStock === 0 || !selectedColor || !selectedSize}
              className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-4 rounded-full hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-lg mb-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <ShoppingCart size={24} />
              {currentStock === 0 ? 'Sin stock' : 'Agregar al Carrito'}
            </button>

            {/* Product Features */}
            <div className="space-y-3 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 text-gray-700">
                <Shield size={20} className="text-pink-400" />
                <span>Garantía de calidad</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <RotateCcw size={20} className="text-pink-400" />
                <span>30 días para cambios y devoluciones</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PremiumFooter onNavigate={onNavigate} />
    </div>
  );
}
