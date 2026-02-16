import React, { useState, useEffect } from 'react';
import { Heart, Star, Plus, Minus, ShoppingCart, Truck, Shield, RotateCcw } from 'lucide-react';
import { useEcommerce } from '../../../../shared/contexts';
import { useToast } from '../../../../shared/components/native';
import { PremiumNavbar } from '../components/PremiumNavbar';
import { PremiumFooter } from '../components/PremiumFooter';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (view: string, productId?: string) => void;
  isAuthenticated?: boolean;
  currentUser?: any;
}

export function ProductDetailPage({ productId, onNavigate, isAuthenticated = false, currentUser = null }: ProductDetailPageProps) {
  const { products, favorites, toggleFavorite, addToCart, addToRecentlyViewed, getProductStock } = useEcommerce();
  const { showToast } = useToast();
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [realStock, setRealStock] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [rating, setRating] = useState(0);

  const product = products.find(p => p.id === productId);

  useEffect(() => {
    if (product && selectedColor && selectedSize) {
      try {
        const stock = getProductStock(product.id, selectedColor, selectedSize);
        setRealStock(Number(stock) || 0);
        return;
      } catch (e) {
        console.warn('[ProductDetailPage] getProductStock failed', e);
      }
    }
    setRealStock(0);
  }, [product, selectedColor, selectedSize, getProductStock]);

  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product.id);
      if (product.variants.length > 0) {
        setSelectedColor(product.variants[0].color);
        const firstAvailableSize = product.variants[0].sizes.find(s => s.stock > 0);
        if (firstAvailableSize) {
          setSelectedSize(firstAvailableSize.size);
        }
      }
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PremiumNavbar onNavigate={onNavigate} isAuthenticated={isAuthenticated} currentUser={currentUser} />
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <p className="text-2xl text-gray-400">Producto no encontrado</p>
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
  
  // Obtener todas las tallas únicas de todas las variantes
  const allUniqueSizes = Array.from(
    new Set(product.variants.flatMap(v => v.sizes.map(s => s.size)))
  ).sort();
  
  // Obtener stock de la talla seleccionada en la variante actual
  const availableSizes = selectedVariant?.sizes.filter(s => s.stock > 0) || [];
  const maxStock = selectedVariant?.sizes.find(s => s.size === selectedSize)?.stock || 0;
  const isFavorite = favorites.includes(product.id);

  const handleAddToCart = () => {
    console.log('[ProductDetailPage] handleAddToCart called', {
      productId: product?.id,
      selectedColor,
      selectedSize,
      quantity,
    });
    // ✅ Validaciones defensivas
    if (!selectedColor || !selectedSize) {
      showToast('Selecciona color y talla', 'error');
      return;
    }

    if (!product || !product.id) {
      showToast('Producto no válido', 'error');
      return;
    }

    if (!selectedVariant) {
      showToast('Variante no encontrada', 'error');
      return;
    }

    // Validar stock disponible desde localStorage
    const adminProducts = localStorage.getItem('damabella_productos');
    console.log('[ProductDetailPage] damabella_productos raw:', adminProducts);
    if (!adminProducts) {
      showToast('No hay productos disponibles', 'error');
      return;
    }

    try {
      const prods = JSON.parse(adminProducts) as any[];
      const prodIdRaw = (product.id || '').toString();
      // extraer sólo los dígitos del id recibido (p.ej. 'admin_1' -> '1')
      const prodDigitsMatch = prodIdRaw.match(/\d+/);
      const prodDigits = prodDigitsMatch ? prodDigitsMatch[0] : prodIdRaw;
      console.log('[ProductDetailPage] Normalizing product id for search', { prodIdRaw, prodDigits });
      console.log('[ProductDetailPage] Stored products ids:', prods.map((p:any) => ({ id: p?.id, idStr: p?.id?.toString?.(), digits: (p?.id?.toString?.() || '').match(/\d+/)?.[0] })));

      const adminProduct = prods.find((p: any) => {
        const pid = p?.id;
        const pidStr = pid !== undefined && pid !== null ? pid.toString() : '';
        const pidDigitsMatch = pidStr.match(/\d+/);
        const pidDigits = pidDigitsMatch ? pidDigitsMatch[0] : pidStr;

        const matchesDirect = pidStr === prodIdRaw || pidDigits === prodDigits;
        const matchesPrefixed = (`p${pidStr}` === prodIdRaw) || (`admin_${pidStr}` === prodIdRaw) || (`admin-${pidStr}` === prodIdRaw);

        const matched = matchesDirect || matchesPrefixed;
        if (matched) {
          console.log('[ProductDetailPage] Matching storage product for search', { storageId: pid, pidStr, pidDigits, prodIdRaw, prodDigits });
        }
        return matched;
      });
      console.log('[ProductDetailPage] adminProduct found:', adminProduct);
      if (!adminProduct) {
        showToast('Producto no encontrado en inventario', 'error');
        return;
      }
      // Calcular stock total del producto (todas las variantes/colores)
      const totalStock = (adminProduct.variantes || []).reduce((sum: number, v: any) => {
        const cols = v.colores || [];
        return sum + cols.reduce((s: number, c: any) => s + (Number(c.cantidad) || 0), 0);
      }, 0);
      console.log('[ProductDetailPage] totalStock:', totalStock);

      // Mostrar mensaje global de "sin stock" solo si el stock total es 0
      if (totalStock === 0) {
        showToast('❌ Este producto no tiene stock disponible', 'error');
        return;
      }

      const variant = adminProduct.variantes?.find((v: any) => v.talla === selectedSize || (v.talla && v.talla.toString() === selectedSize));
      console.log('[ProductDetailPage] matched variant:', variant);
      if (!variant) {
        showToast('Talla no disponible', 'error');
        return;
      }

      const colorData = variant.colores?.find((c: any) => {
        if (!c || c.color === undefined || c.color === null) return false;
        return c.color.toString().trim().toLowerCase() === selectedColor.toString().trim().toLowerCase();
      });
      console.log('[ProductDetailPage] matched colorData:', colorData);

      // Si la variante/color seleccionado no tiene stock, mostrar mensaje específico (no el mensaje global)
      if (!colorData || (Number(colorData.cantidad) || 0) === 0) {
        showToast('La variante/color seleccionado no tiene stock. Selecciona otra opción', 'error');
        return;
      }

      if (quantity > (Number(colorData.cantidad) || 0)) {
        showToast(`❌ Solo disponibles ${colorData.cantidad} unidades de este producto`, 'error');
        return;
      }

      // ✅ Agregar al carrito
      const success = addToCart({
        productId: product.id,
        productName: product.name || 'Producto sin nombre',
        price: product.price || 0,
        image: product.image || '',
        color: selectedColor,
        colorHex: selectedVariant?.colorHex || '#000000',
        size: selectedSize,
        quantity,
      });
      // Sólo después de agregar con éxito al carrito, ajustar el stock en el storage administrativo
      try {
        // Encontrar nuevamente el producto en storage por si cambió
        const prods2 = JSON.parse(localStorage.getItem('damabella_productos') || '[]') as any[];
        const adminProduct2 = prods2.find((p: any) => {
          const pid = p?.id;
          const pidStr = pid !== undefined && pid !== null ? pid.toString() : '';
          const pidDigitsMatch = pidStr.match(/\d+/);
          const pidDigits = pidDigitsMatch ? pidDigitsMatch[0] : pidStr;
          const matchesDirect = pidStr === prodIdRaw || pidDigits === prodDigits;
          const matchesPrefixed = (`p${pidStr}` === prodIdRaw) || (`admin_${pidStr}` === prodIdRaw) || (`admin-${pidStr}` === prodIdRaw);
          return matchesDirect || matchesPrefixed;
        });
        if (adminProduct2) {
          const variant2 = adminProduct2.variantes?.find((v: any) => v.talla === selectedSize || (v.talla && v.talla.toString() === selectedSize));
          if (variant2) {
            const colorObj = variant2.colores?.find((c: any) => c.color && c.color.toString().trim().toLowerCase() === selectedColor.toString().trim().toLowerCase());
            if (colorObj) {
              colorObj.cantidad = Math.max(0, (Number(colorObj.cantidad) || 0) - Number(quantity || 0));
              localStorage.setItem('damabella_productos', JSON.stringify(prods2));
              setRealStock(colorObj.cantidad);
            }
          }
        }
      } catch (e) {
        console.warn('[ProductDetailPage] No se pudo actualizar stock en storage después de agregar al carrito', e);
      }
    } catch (error) {
      console.error('[ProductDetailPage] Error al agregar al carrito:', error);
      showToast('Error al agregar al carrito. Intenta de nuevo.', 'error');
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite(product.id);
    if (isFavorite) {
      showToast('❤️ Removido de favoritos', 'info');
    } else {
      showToast('❤️ Agregado a favoritos', 'success');
    }
  };

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

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
          <button onClick={() => onNavigate('search', product.category)} className="hover:text-pink-400 transition-colors">
            {product.category}
          </button>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        {/* Product Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Images */}
          <div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4 aspect-[3/4]">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            {/* Title and Price */}
            <div className="mb-6">
              <h1 className="text-4xl text-gray-900 mb-4">{product.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <p className="text-4xl text-gray-900">
                  ${product.price.toLocaleString()}
                </p>
                <button
                  onClick={handleToggleFavorite}
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Heart
                    size={28}
                    className={isFavorite ? 'fill-pink-400 text-pink-400' : 'text-gray-600'}
                  />
                </button>
              </div>
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
                      title={`Calificar con ${i + 1} estrella${i + 1 !== 1 ? 's' : ''}`}
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
                <span className="text-gray-600">({Math.max(rating, product.rating)}.0)</span>
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
                {Array.from(new Map(product.variants.map((v) => [v.color, v])).values()).map((variant) => (
                  <button
                    key={variant.color}
                    onClick={() => setSelectedColor(variant.color)}
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      selectedColor === variant.color
                        ? 'border-pink-400 ring-2 ring-pink-200 scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: variant.colorHex }}
                    title={variant.color}
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
                  const hasStock = selectedVariant ? selectedVariant.sizes.some(s => s.size === size && s.stock > 0) : false;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-3 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedSize === size
                          ? 'bg-pink-50 border-pink-400 text-pink-400'
                          : hasStock
                          ? 'border-gray-300 text-gray-700 hover:border-gray-400'
                          : 'border-gray-200 text-gray-400 opacity-50'
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
              <h3 className="text-lg text-gray-900 mb-3">Cantidad {realStock > 0 ? `(Stock: ${realStock})` : ''}</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-300 rounded-lg px-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-gray-100 transition-colors"
                    aria-label="Disminuir cantidad"
                  >
                    <Minus size={20} />
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={realStock}
                    value={quantity}
                    placeholder={`Stock disponible: ${realStock}`}
                    onChange={(e) => {
                      const v = Number(e.target.value || 0);
                      if (isNaN(v)) return setQuantity(1);
                      const stockMax = Number(realStock || maxStock || 99);
                      const newQ = Math.max(1, Math.min(stockMax, Math.floor(v)));
                      setQuantity(newQ);
                    }}
                    className="w-28 text-center text-xl px-2 outline-none bg-transparent"
                  />

                  <button
                    onClick={() => setQuantity(Math.min(Math.max(1, realStock || maxStock || 99), quantity + 1))}
                    className="p-3 hover:bg-gray-100 transition-colors"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <p className="text-sm text-gray-600">Stock del producto: {realStock}</p>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-4 rounded-full hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-lg mb-6"
            >
              <ShoppingCart size={24} />
              Agregar al Carrito
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

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-3xl text-gray-900 mb-8">Productos Relacionados</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                  onClick={() => onNavigate('detail', relatedProduct.id)}
                >
                  <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                    <img
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-gray-900 mb-2 line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-xl text-gray-900">
                      ${relatedProduct.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <PremiumFooter onNavigate={onNavigate} />
    </div>
  );
}