// src/features/sales/services/salesService.ts
import { API } from "@/services/ApiConfigure";

// ============================================
// INTERFACES
// ============================================

export interface SaleDetail {
  id_detail?: number;
  sale?: number;
  variant: number;
  quantity: number;
  unit_price?: string;
  subtotal?: string;
  creation_date?: string;
}

export interface Sale {
  id_sale: number;
  number_sale: string;
  client: number;
  client_name?: string;
  date_sale: string;
  state: number;
  state_name?: string;
  payment_method: number;
  payment_method_name?: string;
  subtotal: string;
  iva: string;
  total: string;
  observations?: string;
  void?: boolean;
  void_reason?: string;
  output_executing?: boolean;
  return_executing?: boolean;
  created_at?: string;
  updated_at?: string;
  details?: SaleDetail[];
}

export interface CreateSaleDTO {
  client: number;
  payment_method: number;
  date_sale: string;
  state: number;
  observations?: string;
  details: SaleDetail[];
}

// ============================================
// SERVICES
// ============================================

export const getAllSales = async (): Promise<Sale[] | null> => {
  try {
    const res = await API.get('/sales/get_sales/');
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getAllSales error:', error);
    return null;
  }
};

export const getSaleById = async (id: number): Promise<Sale | null> => {
  try {
    const res = await API.get(`/sales/${id}/get_sales_by_id/`);
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getSaleById error:', error);
    return null;
  }
};

export const createSale = async (data: CreateSaleDTO): Promise<Sale | null> => {
  try {
    const res = await API.post('/sales/create_sale/', data);
    // El backend devuelve solo message + success en create
    // Recargamos la lista para obtener la venta creada
    return res.data.success ? res.data.object ?? res.data.results ?? true : null;
  } catch (error: any) {
    console.error('createSale error:', JSON.stringify(error.response?.data));
    return null;
  }
};

export const updateSale = async (id: number, data: Partial<CreateSaleDTO>): Promise<Sale | null> => {
  try {
    const res = await API.put(`/sales/${id}/update_sales/`, data);
    return res.data.success ? res.data.object : null;
  } catch (error) {
    console.error('updateSale error:', error);
    return null;
  }
};

export const patchSaleState = async (id: number, state: number): Promise<Sale | null> => {
  try {
    const res = await API.patch(`/sales/${id}/patch_state/`, { state });
    return res.data.success ? res.data.object : null;
  } catch (error) {
    console.error('patchSaleState error:', error);
    return null;
  }
};

export const deleteSale = async (id: number): Promise<boolean> => {
  try {
    const res = await API.delete(`/sales/${id}/delete_sale/`);
    return res.data.success === true;
  } catch (error) {
    console.error('deleteSale error:', error);
    return false;
  }
};

export const searchSales = async (term: string): Promise<Sale[] | null> => {
  try {
    const res = await API.get('/sales/search_sales/', { params: { search: term } });
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('searchSales error:', error);
    return null;
  }
};

export const exportSales = async (): Promise<void> => {
  try {
    const res = await API.get('/sales/export_sales/', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ventas_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('exportSales error:', error);
    throw error;
  }
};

// ============================================
// SALE DETAILS
// ============================================

export const getSaleDetailsByOrder = async (saleId: number): Promise<SaleDetail[] | null> => {
  try {
    const res = await API.get(`/sales_details/${saleId}/get_sales_by_id/`);
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getSaleDetailsByOrder error:', error);
    return null;
  }
};

export const searchSaleDetails = async (term: string): Promise<SaleDetail[] | null> => {
  try {
    const res = await API.get('/sales_details/search_details/', { params: { search: term } });
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('searchSaleDetails error:', error);
    return null;
  }
}; 