// src/features/ecommerce/products/hooks/useProductDetail.ts
import { useState, useEffect } from 'react';
import { getProductDetail, ProductDetailResponse } from '@/features/ecommerce/products/services/productsService';

const API_MEDIA_ORIGIN = 'https://damabella-backend.onrender.com';
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="%23f3f4f6"/><text x="450" y="590" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="%239ca3af">DAMABELLA</text><text x="450" y="642" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="%23b6bcc6">Imagen no disponible</text></svg>';

const resolveImage = (src?: string): string => {
  if (!src || typeof src !== 'string') return PLACEHOLDER_IMAGE;
  const trimmed = src.trim().replace(/\\/g, '/');
  if (!trimmed) return PLACEHOLDER_IMAGE;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) return trimmed;
  return `${API_MEDIA_ORIGIN}/${trimmed.replace(/^\/+/, '')}`;
};

const getPhotoImage = (photo: any): string => {
  if (!photo) return '';
  return (
    photo.image_url ??
    photo.imageUrl ??
    photo.photo_url ??
    photo.photoUrl ??
    photo.url ??
    photo.src ??
    photo.image ??
    photo.photo ??
    photo.imagen ??
    ''
  );
};

const getStoredProductImage = (productId: string): string => {
  try {
    return localStorage.getItem(`product_image_${productId}`) || '';
  } catch {
    return '';
  }
};

export interface VariantForDisplay {
  color: string;
  colorName: string;
  colorHex: string;
  sizes: {
    size: string;
    stock: number;
    variantId: number;
  }[];
}

export interface ProductForDisplay {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  variants: VariantForDisplay[];
  photos: { id: number; image: string }[];
  rating: number;
}

// Mapeo de colores a sus códigos hexadecimales
const COLOR_HEX_MAP: { [key: string]: string } = {
  'rojo': '#EF4444',
  'red': '#EF4444',
  'azul': '#3B82F6',
  'blue': '#3B82F6',
  'verde': '#10B981',
  'green': '#10B981',
  'amarillo': '#FBBF24',
  'yellow': '#FBBF24',
  'negro': '#1F2937',
  'black': '#1F2937',
  'blanco': '#F9FAFB',
  'white': '#F9FAFB',
  'rosa': '#EC4899',
  'pink': '#EC4899',
  'morado': '#A855F7',
  'purple': '#A855F7',
  'naranja': '#F97316',
  'orange': '#F97316',
  'gris': '#6B7280',
  'gray': '#6B7280',
  'café': '#92400E',
  'brown': '#92400E',
  'beige': '#D4A574',
  'crema': '#FEF3C7',
  'cream': '#FEF3C7',
  'vino': '#7F1D1D',
  'wine': '#7F1D1D',
  'turquesa': '#14B8A6',
  'turquoise': '#14B8A6',
  'lavanda': '#C4B5FD',
  'lavender': '#C4B5FD',
};

const getColorHex = (colorName: string): string => {
  const normalized = colorName.toLowerCase().trim();
  return COLOR_HEX_MAP[normalized] || '#6B7280'; // gris por defecto
};

export const useProductDetail = (productId: string) => {
  const [product, setProduct] = useState<ProductForDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProductDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const numericId = parseInt(productId);
        if (isNaN(numericId)) {
          setError('ID de producto inválido');
          setLoading(false);
          return;
        }

        const data = await getProductDetail(numericId);
        
        if (!data) {
          setError('No se pudo cargar el producto');
          setLoading(false);
          return;
        }

        // Agrupar variantes por color
        const variantsByColor = data.variants.reduce((acc, variant: any) => {
          const colorKey = String(variant.color_name || variant.colorName || variant.color?.name || variant.color || 'Negro');
          const sizeName = String(variant.size_name || variant.sizeName || variant.size?.name || variant.size || 'U');
          const rawStock = variant.stock ?? variant.quantity ?? variant.cantidad ?? 0;
          const stock = Number.isFinite(Number(rawStock)) ? Number(rawStock) : 0;
          
          if (!acc[colorKey]) {
            acc[colorKey] = {
              color: colorKey,
              colorName: colorKey,
              colorHex: getColorHex(colorKey),
              sizes: []
            };
          }

          acc[colorKey].sizes.push({
            size: sizeName,
            stock,
            variantId: variant.id_variant
          });
          
          return acc;
        }, {} as { [key: string]: VariantForDisplay });

        // Convertir a array y ordenar tallas
        const variants = Object.values(variantsByColor).map(v => ({
          ...v,
          sizes: v.sizes.sort((a, b) => {
            // Ordenar tallas: XS, S, M, L, XL, XXL, o numéricas
            const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
            const aIndex = sizeOrder.indexOf(a.size);
            const bIndex = sizeOrder.indexOf(b.size);
            
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            
            // Si son números, ordenar numéricamente
            const aNum = parseInt(a.size);
            const bNum = parseInt(b.size);
            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
            
            return a.size.localeCompare(b.size);
          })
        }));

        const variantsWithAvailableOptionsFirst = variants
          .map((variant: any) => ({
            ...variant,
            sizes: [...variant.sizes].sort((a: any, b: any) => {
              if ((a.stock > 0) !== (b.stock > 0)) return a.stock > 0 ? -1 : 1;
              const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'U'];
              return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
            }),
          }))
          .sort((a: any, b: any) => {
            const aHasStock = a.sizes.some((size: any) => size.stock > 0);
            const bHasStock = b.sizes.some((size: any) => size.stock > 0);
            if (aHasStock === bHasStock) return 0;
            return aHasStock ? -1 : 1;
          });

        const productForDisplay: ProductForDisplay = {
          id: data.id_product.toString(),
          name: data.name,
          category: data.category_name,
          price: data.price,
          description: 'Producto de alta calidad',
          image: resolveImage(
            getStoredProductImage(data.id_product.toString()) ||
            getPhotoImage(data.photos[0]) ||
            (data as any).image_url ||
            (data as any).imageUrl ||
            (data as any).photo_url ||
            (data as any).photoUrl ||
            (data as any).url ||
            (data as any).src ||
            (data as any).image ||
            (data as any).photo ||
            (data as any).imagen
          ),
          variants: variantsWithAvailableOptionsFirst,
          photos: data.photos.map((p: any) => ({
            id: p.id ?? p.id_photo ?? p.id_photos,
            image: resolveImage(getPhotoImage(p)),
          })),
          rating: 4.5
        };

        setProduct(productForDisplay);
      } catch (err: any) {
        console.error('Error cargando detalle del producto:', err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    loadProductDetail();
  }, [productId]);

  return { product, loading, error };
};
