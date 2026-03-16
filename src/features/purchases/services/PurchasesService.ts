import { API } from "@/services/ApiConfigure";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface VariantProduct {
  id_variant:    number;
  product:       number;
  product_name:  string;
  size:          number;
  size_name:     string;
  color:         number;
  color_name:    string;
  sku:           string;
  price:         number;
  category:      number;
  category_name: string;
}

export interface PurchaseDetail {
  id_detail:      number;
  variant:        number;
  quantity:       number;
  purchase_price: number;
  sales_price:    number;
  subtotal:       number;
  purchase:       number;
}

export interface Purchase {
  id_purchase:       number;
  purchase_number:   string;
  provider:          number;
  provider_name?:    string;
  state:             number;
  state_name?:       string;
  subtotal:          number;
  iva:               number;
  total:             number;
  purchase_date:     string;
  registration_date: string;
  observations:      string | null;
  image:             string | null;
  details:           PurchaseDetail[];
}

export interface CreatePurchaseDetailDTO {
  variant:        number;
  quantity:       number;
  purchase_price: number;
  sales_price:    number;
  purchase:       number | null;
}

export interface CreatePurchaseDTO {
  provider:     number;
  state:        number;
  observations?: string;
  image?:        string;
  details:       CreatePurchaseDetailDTO[];
}

// ─── Variantes ────────────────────────────────────────────────────────────────
export const getAllVariants = async (): Promise<VariantProduct[] | null> => {
  try {
    const response = await API.get('/variants/get_variants/');
    if (response.data.success === true) return response.data.results;
    console.warn(response.data.message);
    return null;
  } catch (error: any) {
    console.error(error);
    return null;
  }
};

// ─── Compras ──────────────────────────────────────────────────────────────────
export const getAllPurchases = async (): Promise<Purchase[] | null> => {
  try {
    const response = await API.get('/purchases/get_purchases/');
    if (response.data.success === true) return response.data.results;
    return null;
  } catch (error: any) {
    console.error(error);
    return null;
  }
};

export const createPurchase = async (data: CreatePurchaseDTO): Promise<Purchase | null> => {
  try {
    const response = await API.post('/purchases/create_purchase/', data);
    if (response.data.success === true) return response.data.object;
    console.warn(response.data.message);
    return null;
  } catch (error: any) {
    console.error('createPurchase error:', JSON.stringify(error.response?.data));
    return null;
  }
};

export const deletePurchase = async (id_purchase: number): Promise<boolean> => {
  try {
    const response = await API.delete(`/purchases/${id_purchase}/delete_purchase/`);
    if (response.data.success === true) return true;
    console.warn(response.data.message);
    return false;
  } catch (error: any) {
    console.error(error);
    return false;
  }
};

export const patchPurchaseState = async (id_purchase: number, state: number): Promise<Purchase | null> => {
  try {
    const response = await API.patch(`/purchases/${id_purchase}/patch_state/`, { state });
    if (response.data.success === true) return response.data.object;
    console.warn(response.data.message);
    return null;
  } catch (error: any) {
    console.error(error);
    return null;
  }
};

export const searchPurchases = async (query: string): Promise<Purchase[] | null> => {
  try {
    const response = await API.get('/purchases/search_purchases/', { params: { search: query } });
    if (response.data.success === true) return response.data.results;
    return [];
  } catch (error: any) {
    console.error(error);
    return null;
  }
};