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
}

export interface CreateVariantDTO {
  product: number;
  size:    number;
  color:   number;
  sku:     string;
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
    return res.data.success ? res.data.results : null;
  } catch { return null; }
};

export const createProduct = async (data: CreateProductDTO): Promise<Product | null> => {
  try {
    const res = await API.post('/products/create_products/', data);
    return res.data.success ? res.data.object : null;
  } catch { return null; }
};

export const createVariant = async (data: CreateVariantDTO): Promise<VariantProduct | null> => {
  try {
    const res = await API.post('/variants/create_variant/', data);
    return res.data.success ? res.data.object : null;
  } catch(error:any) { 
    console.error('createVariant error:', JSON.stringify(error.response?.data));
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