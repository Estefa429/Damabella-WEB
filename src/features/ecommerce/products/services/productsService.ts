// src/services/productsService.ts
import { VariantProduct } from "@/features/purchases/services/PurchasesService";
import { API } from "@/services/ApiConfigure";

export interface Product {
  id_product:    number;
  name:          string;
  category:      number;
  category_name: string;
  price:         number;
  purchase_price: number;
  iva?:          number;
  is_active:     boolean;
}


export interface Inventory {
  id_inventory: number;
  variant:      number;
  stock:        number;
  updated_at:   string;
}

export interface Color { id_color: number; name: string; }

export interface Size  { id_size:  number; name: string; }

export interface CreateProductDTO {
  name:     string;
  category: number;
  price:    number;
  purchase_price: number;
  iva?:     number;
}

export interface CreateVariantDTO {
  product: number;
  size:    number;
  color:   number;
  sku:     string;
}

export interface CreateProductWithVariantDTO {
  name:            string;
  category:        number;
  price:           number;
  purchase_price:  number;
  iva?:            number;
  sku:             string;
  size:            number;
  color:           number;
  stock:           number;
}

export interface Photo {
  id:        number;
  producto:  number;
  variant:   number | null;
  image:     string;
  created_at: string;
  updated_at: string;
}

export interface PhotoResponse {
  success: boolean;
  results?: Photo[];
  object?: Photo;
}

export const getAllColors = async (): Promise<Color[] | null> => {
  try {
    const res = await API.get('/colors/get_colors/');
    return res.data.success ? res.data.results : null;
  } catch { return null; }
};

export const getAllSizes = async (): Promise<Size[] | null> => {
  try {
    const res = await API.get('/sizes/get_sizes/');
    return res.data.success ? res.data.results : null;
  } catch { return null; }
};

export const getAllProducts = async (): Promise<Product[] | null> => {
  try {
    const res = await API.get('/products/get_products/');
    return res.data.success ? res.data.results : null;
  } catch { return null; }
};

export const getAllInventory = async (): Promise<Inventory[] | null> => {
  try {
    const res = await API.get('/inventory/get_inventories/');
    if (Array.isArray(res.data)) return res.data;
    return res.data.success ? res.data.results : null;
  } catch { return null; }
};

export const createProduct = async (data: CreateProductDTO): Promise<Product | null> => {
  try {
    const res = await API.post('/products/create_products/', data);
    return res.data.success ? res.data.object : null;
  } catch { return null; }
};

export const createProductWithVariant = async (data: CreateProductWithVariantDTO): Promise<Product | null> => {
  try {
    console.log('🔄 createProductWithVariant - Datos enviados:', data);
    const res = await API.post('/products/create_products/', data);
    console.log('✅ createProductWithVariant - Respuesta:', res.data);
    return res.data.success ? res.data.product : null;
  } catch(error:any) {
    console.error('❌ createProductWithVariant - Error:', error.message);
    console.error('❌ createProductWithVariant - Detalles:', JSON.stringify(error.response?.data, null, 2));
    console.error('❌ createProductWithVariant - Status:', error.response?.status);
    return null;
  }
};

export const createVariant = async (data: CreateVariantDTO): Promise<VariantProduct | null> => {
  try {
    console.log('🔄 createVariant - Datos enviados:', data);
    const res = await API.post('/variants/create_variant/', data);
    console.log('✅ createVariant - Respuesta:', res.data);
    return res.data.success ? res.data.object : null;
  } catch(error:any) { 
    console.error('❌ createVariant - Error directo:', error.message);
    console.error('❌ createVariant - Datos del error:', JSON.stringify(error.response?.data, null, 2));
    console.error('❌ createVariant - Status:', error.response?.status);
    return null; 
  }
};

export const updateProduct = async (id: number, data: Partial<Product>): Promise<Product | null> => {
  try {
    const res = await API.put(`/products/${id}/update_products/`, data);
    return res.data.success ? res.data.product : null;
  } catch { return null; }
};

export const patchProductState = async (id: number, is_active: boolean): Promise<boolean> => {
  try {
    const res = await API.patch(`/products/${id}/patch_state/`, { is_active });
    return res.data.success === true;
  } catch { return false; }
};

export const deleteProduct = async (id: number): Promise<boolean> => {
  try {
    const res = await API.delete(`/products/${id}/delete_products/`);
    return res.data.success === true;
  } catch { return false; }
};

export const createColor = async (name: string): Promise<Color | null> => {
  try {
    const res = await API.post('/colors/create_colors/', { name });
    return res.data.success ? res.data.object : null;
  } catch { return null; }
};

export const createSize = async (name: string): Promise<Size | null> => {
  try {
    const res = await API.post('/sizes/create_sizes/', { name });
    return res.data.success ? res.data.object : null;
  } catch { return null; }
};

// ============================================================
// SERVICIOS PARA FOTOS DE PRODUCTOS
// ============================================================

export const getPhotos = async (): Promise<Photo[] | null> => {
  try {
    console.log('🔄 getPhotos - Obteniendo todas las fotos');
    const res = await API.get('/photos/get_photos/');
    console.log('✅ getPhotos - Respuesta:', res.data);
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.results)) return res.data.results;
    if (Array.isArray(res.data?.data)) return res.data.data;
    return res.data?.success && Array.isArray(res.data?.object) ? res.data.object : null;
  } catch (error: any) {
    console.error('❌ getPhotos - Error:', error.message);
    return null;
  }
};

export const getPhotosById = async (id: number): Promise<Photo | null> => {
  try {
    console.log(`🔄 getPhotosById - Obteniendo foto ${id}`);
    const res = await API.get(`/photos/${id}/get_photos_by_id/`);
    console.log('✅ getPhotosById - Respuesta:', res.data);
    // Aceptar varias formas de respuesta: object, result, results, data
    if (res?.data) {
      if (res.data.object) return res.data.object as Photo;
      if (res.data.result) return res.data.result as Photo;
      if (Array.isArray(res.data.results) && res.data.results.length > 0) return res.data.results[0] as Photo;
      if (Array.isArray(res.data.data) && res.data.data.length > 0) return res.data.data[0] as Photo;
      // Algunos endpoints devuelven la estructura con claves directas
      if (res.data.id || res.data.image) return res.data as Photo;
    }
    return null;
  } catch (error: any) {
    console.error(`❌ getPhotosById - Error al obtener foto ${id}:`, error.message);
    return null;
  }
};

export const createPhotos = async (
  producto: number,
  image: File,
  variant?: number
): Promise<Photo | null> => {
  try {
    console.log('🔄 createPhotos - Creando foto para producto:', producto);
    
    const formData = new FormData();
    formData.append('producto', producto.toString());
    formData.append('image', image);
    
    if (variant) {
      formData.append('variant', variant.toString());
    }

    const res = await API.post('/photos/create_photos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('✅ createPhotos - Respuesta:', res.data);

    // Aceptar múltiples formatos de respuesta del backend.
    // Priorizar `object`, `result` o primer elemento de `results`.
    if (res?.data) {
      if (res.data.object) return res.data.object as Photo;
      if (res.data.result) return res.data.result as Photo;
      if (Array.isArray(res.data.results) && res.data.results.length > 0) return res.data.results[0] as Photo;
      // Algunos endpoints devuelven una estructura plana
      if (res.data.id || res.data.image) return res.data as Photo;
    }

    return null;
  } catch (error: any) {
    console.error('❌ createPhotos - Error:', error.message);
    console.error('❌ createPhotos - Detalles:', error.response?.data);
    return null;
  }
};

export const deletePhotos = async (id: number): Promise<boolean> => {
  try {
    console.log(`🔄 deletePhotos - Eliminando foto ${id}`);
    const res = await API.delete(`/photos/${id}/delete_photos/`);
    console.log('✅ deletePhotos - Respuesta:', res.data);
    return res.data.success === true;
  } catch (error: any) {
    console.error(`❌ deletePhotos - Error al eliminar foto ${id}:`, error.message);
    return false;
  }
};

// Agregar estos servicios a productsService.ts

export interface VariantWithDetails {
  id_variant: number;
  product: number;
  size: number;
  size_name: string;
  color: number;
  color_name: string;
  sku: string;
  stock: number;
}

export interface ProductDetailResponse {
  id_product: number;
  name: string;
  category: number;
  category_name: string;
  price: number;
  purchase_price: number;
  is_active: boolean;
  variants: VariantWithDetails[];
  photos: Photo[];
}

// Obtener todas las variantes
export const getAllVariants = async (): Promise<VariantWithDetails[] | null> => {
  try {
    const res = await API.get('/variants/get_variants/');
    if (Array.isArray(res.data)) return res.data;
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('❌ getAllVariants - Error:', error);
    return null;
  }
};

// Obtener variantes de un producto específico
export const getVariantsByProduct = async (productId: number): Promise<VariantWithDetails[] | null> => {
  try {
    console.log(`🔄 getVariantsByProduct - Obteniendo variantes del producto ${productId}`);
    const res = await API.get(`/variants/get_variants/?product=${productId}`);
    console.log('✅ getVariantsByProduct - Respuesta:', res.data);
    const rawVariants = Array.isArray(res.data) ? res.data : res.data.success ? res.data.results : null;

    return rawVariants?.filter((variant: any) => {
      const variantProductId = Number(variant.product ?? variant.id_product ?? variant.producto);
      return variantProductId === Number(productId);
    }) ?? null;
  } catch (error: any) {
    console.error('❌ getVariantsByProduct - Error:', error.message);
    return null;
  }
};

// Obtener detalle completo de un producto (producto + variantes + fotos)
export const getProductDetail = async (productId: number): Promise<ProductDetailResponse | null> => {
  try {
    console.log(`🔄 getProductDetail - Obteniendo detalle completo del producto ${productId}`);
    
    // Obtener producto
    const allProducts = await getAllProducts();
    const product = allProducts?.find(p => p.id_product === productId);
    
    if (!product) {
      console.error('❌ Producto no encontrado');
      return null;
    }

    // Obtener variantes del producto y cruzarlas con inventario real
    const variants = await getVariantsByProduct(productId);
    const inventory = await getAllInventory();
    const variantsWithStock = (variants || []).map((variant: any) => {
      const inventoryItem = (inventory || []).find((item: any) => {
        const matchesVariant = Number(item.variant ?? item.id_variant) === Number(variant.id_variant);
        const itemProductId = Number(item.product ?? item.id_product ?? item.producto);
        const matchesProduct = Number.isNaN(itemProductId) || itemProductId === Number(productId);

        return matchesVariant && matchesProduct;
      });
      const rawStock = inventoryItem?.stock ?? variant.stock ?? variant.quantity ?? variant.cantidad ?? 0;

      return {
        ...variant,
        stock: Number.isFinite(Number(rawStock)) ? Number(rawStock) : 0,
      };
    });
    
    // Obtener fotos del producto
    const allPhotos = await getPhotos();
    const productPhotos = allPhotos?.filter((p: any) => {
      const rawProduct = p.producto ?? p.product ?? p.id_product;
      const photoProductId = typeof rawProduct === 'object' && rawProduct !== null
        ? Number(rawProduct.id_product ?? rawProduct.id ?? rawProduct.product)
        : Number(rawProduct);
      return photoProductId === productId;
    }) || [];

    const response: ProductDetailResponse = {
      ...product,
      variants: variantsWithStock,
      photos: productPhotos
    };

    console.log('✅ getProductDetail - Respuesta completa:', response);
    return response;
  } catch (error: any) {
    console.error('❌ getProductDetail - Error:', error.message);
    return null;
  }
};

// Exportar productos a Excel llamando al backend
export const exportProductsToExcel = async () => {
  const res = await API.get('/products/export_products/', { responseType: 'blob' });
  const url  = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href     = url;
  link.download = `productos_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};
