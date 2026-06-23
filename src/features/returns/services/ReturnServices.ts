// src/features/returns/services/ReturnServices.ts
import { API } from "../../../services/ApiConfigure";

// ============================================
// INTERFACES
// ============================================

export interface ReturnDetail {
  id_detail: number;
  return_id: number;
  variant: number;
  variant_name?: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
  created_at?: string;
}

export interface Return {
  id_return: number;
  return_number: string;
  sale: number;
  sale_number?: string;
  client_name?: string;
  reason_of_return: string;
  state: number;
  state_name?: string;
  created_at: string;
  updated_at?: string;
  details?: ReturnDetail[];
}

export interface CreateReturnDTO {
  sale: number;
  reason: string;
  state: number;
  details: {
    variant: number;
    quantity: number;
  }[];
}

export interface ReturnMetrics {
  total_returns: number;
  total_amount: number;
  pending_returns: number;
  completed_returns: number;
}

// ============================================
// SERVICES
// ============================================

export const getAllReturns = async (): Promise<Return[] | null> => {
  try {
    const res = await API.get('/returns/get_returns/');
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getAllReturns error:', error);
    return null;
  }
};

export const getReturnById = async (id: number): Promise<Return | null> => {
  try {
    const res = await API.get(`/returns/${id}/get_return_by_id/`);
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getReturnById error:', error);
    return null;
  }
};

export const createReturn = async (data: CreateReturnDTO): Promise<Return | null> => {
  try {
    const res = await API.post('/returns/create_return/', data);
    return res.data.success ? res.data.object : null;
  } catch (error: any) {
    console.error('createReturn error:', error.response?.data || error.message);
    return null;
  }
};

export const deleteReturn = async (id: number): Promise<boolean> => {
  try {
    const res = await API.delete(`/returns/${id}/delete_return/`);
    return res.data.success === true;
  } catch (error) {
    console.error('deleteReturn error:', error);
    return false;
  }
};

export const annulReturn = async (id: number): Promise<boolean> => {
  try {
    const res = await API.post(`/returns/${id}/annul_return/`);
    return res.data.success === true;
  } catch (error) {
    console.error('annulReturn error:', error);
    return false;
  }
};

export const searchReturns = async (term: string): Promise<Return[] | null> => {
  try {
    const res = await API.get('/returns/search_returns/', { params: { search: term } });
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('searchReturns error:', error);
    return null;
  }
};

export const getReturnMetrics = async (): Promise<ReturnMetrics | null> => {
  try {
    const res = await API.get('/returns/get_metrics/');
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getReturnMetrics error:', error);
    return null;
  }
};

export const exportAllReturns = async () => {
  try {
    const res = await API.get('/returns/export_all_returns/', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `devoluciones_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('exportAllReturns error:', error);
  }
};

export const exportReturnById = async (id: number) => {
  try {
    const res = await API.get(`/returns/${id}/export_return_by_id/`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `devolucion_${id}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('exportReturnById error:', error);
  }
};

export const getReturnDetails = async (returnId: number): Promise<ReturnDetail[] | null> => {
  try {
    const res = await API.get(`/return-details/${returnId}/get_returns_by_id/`);
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getReturnDetails error:', error);
    return null;
  }
};
