import { API } from '@/services/ApiConfigure';

export interface Iva {
  id_iva: number;
  name: string;
  value: number;
}

export interface CreateIvaDTO {
  percentage: number;
}

const normalizeIva = (data: any): Iva => {
  const rawValue = Number(data.percentage ?? data.value ?? data.rate ?? data.iva ?? 0);
  const value = Number.isFinite(rawValue) ? (rawValue > 1 ? rawValue / 100 : rawValue) : 0;
  return {
    id_iva: Number(data.id_iva ?? data.id ?? data.iva_id ?? data.pk ?? 0),
    name: String(data.name ?? data.nombre ?? `${Math.round(value * 100)}%`),
    value,
  };
};

export const getAllIvas = async (): Promise<Iva[] | null> => {
  try {
    const response = await API.get('/iva/');
    const results = response.data?.results ?? response.data;
    if (Array.isArray(results)) {
      return results.map(normalizeIva);
    }
    console.warn('[IvaService] getAllIvas unexpected response', response.data);
    return null;
  } catch (error: any) {
    console.error('[IvaService] getAllIvas error:', error);
    return null;
  }
};

export const createIva = async (data: CreateIvaDTO): Promise<Iva | null> => {
  try {
    const response = await API.post('/iva/', data);
    const item = response.data?.object ?? response.data;
    if (item) {
      return normalizeIva(item);
    }
    console.warn('[IvaService] createIva unexpected response', response.data);
    return null;
  } catch (error: any) {
    console.error('[IvaService] createIva error:', error.response?.data ?? error);
    return null;
  }
};

export const updateIva = async (id_iva: number, data: CreateIvaDTO): Promise<Iva | null> => {
  try {
    const response = await API.put(`/iva/${id_iva}/`, data);
    const item = response.data?.object ?? response.data;
    if (item) {
      return normalizeIva(item);
    }
    console.warn('[IvaService] updateIva unexpected response', response.data);
    return null;
  } catch (error: any) {
    console.error('[IvaService] updateIva error:', error.response?.data ?? error);
    return null;
  }
};

export const patchIva = async (id_iva: number, data: Partial<CreateIvaDTO>): Promise<Iva | null> => {
  try {
    const response = await API.patch(`/iva/${id_iva}/`, data);
    const item = response.data?.object ?? response.data;
    if (item) {
      return normalizeIva(item);
    }
    console.warn('[IvaService] patchIva unexpected response', response.data);
    return null;
  } catch (error: any) {
    console.error('[IvaService] patchIva error:', error.response?.data ?? error);
    return null;
  }
};

export const deleteIva = async (id_iva: number): Promise<boolean> => {
  try {
    const response = await API.delete(`/iva/${id_iva}/`);
    if (response.data?.success === true || response.status === 204) {
      return true;
    }
    console.warn('[IvaService] deleteIva unexpected response', response.data);
    return false;
  } catch (error: any) {
    console.error('[IvaService] deleteIva error:', error);
    return false;
  }
};
