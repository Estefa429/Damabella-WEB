import axios from 'axios';

const API_BASE_URL = 'https://damabella-backend.onrender.com/api';

// Instancia de Axios con configuración base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token JWT en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('damabella_access_token') || localStorage.getItem('damabella_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tipos básicos
interface ReturnDetail {
  variant: number;
  quantity: number;
}

interface ReturnData {
  sale: number;
  reason: string;
  observations?: string;
  state: number;
  return_detail: ReturnDetail[];
}

interface ChangeDetail {
  variant_returned: number;
  variant_delivered: number;
}

interface ChangeData {
  sale: number;
  reason_of_change: string;
  state: number;
  change_detail: ChangeDetail[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  results?: T;
  metrics?: any;
}

// ==================== SERVICIOS PARA DEVOLUCIONES ====================

export const getReturns = async (): Promise<any> => {
  try {
    const response = await api.get<ApiResponse<any>>('/returns/get_returns/');
    return response.data;
  } catch (error) {
    console.error('Error fetching returns:', error);
    throw error;
  }
};

export const getReturnById = async (id: number): Promise<any> => {
  try {
    const response = await api.get<ApiResponse<any>>(`/returns/${id}/get_return_by_id/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching return ${id}:`, error);
    throw error;
  }
};

export const createReturn = async (data: ReturnData): Promise<any> => {
  try {
    const response = await api.post<ApiResponse<any>>('/returns/create_return/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating return:', error);
    throw error;
  }
};

export const deleteReturn = async (id: number): Promise<any> => {
  try {
    const response = await api.delete<ApiResponse<any>>(`/returns/${id}/delete_return/`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting return ${id}:`, error);
    throw error;
  }
};

export const searchReturns = async (query: string): Promise<any> => {
  try {
    const response = await api.get<ApiResponse<any>>('/returns/search_returns/', {
      params: { search: query },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching returns:', error);
    throw error;
  }
};

export const getReturnMetrics = async (): Promise<any> => {
  try {
    const response = await api.get<ApiResponse<any>>('/returns/get_metrics/');
    return response.data;
  } catch (error) {
    console.error('Error fetching return metrics:', error);
    throw error;
  }
};

export const exportAllReturnsExcel = async (): Promise<Blob> => {
  try {
    const response = await api.get('/returns/export_all_returns/', {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting all returns:', error);
    throw error;
  }
};

export const exportReturnByIdExcel = async (id: number): Promise<Blob> => {
  try {
    const response = await api.get(`/returns/${id}/export_return_by_id/`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error(`Error exporting return ${id}:`, error);
    throw error;
  }
};

// Hook personalizado para traer devoluciones con manejo de estado
export const useReturns = () => {
  const [returns, setReturns] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchReturns = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReturns();
      if (data.success) {
        setReturns(data.results || []);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching returns');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  return { returns, loading, error, refetch: fetchReturns };
};

// ==================== SERVICIOS PARA CAMBIOS ====================

export const getChanges = async (): Promise<any> => {
  try {
    const response = await api.get<ApiResponse<any>>('/changes/get_changes/');
    return response.data;
  } catch (error) {
    console.error('Error fetching changes:', error);
    throw error;
  }
};

export const getChangeById = async (id: number): Promise<any> => {
  try {
    const response = await api.get<ApiResponse<any>>(`/changes/${id}/get_change_by_id/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching change ${id}:`, error);
    throw error;
  }
};

export const createChange = async (data: ChangeData): Promise<any> => {
  try {
    const response = await api.post<ApiResponse<any>>('/changes/create_change/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating change:', error);
    throw error;
  }
};

export const deleteChange = async (id: number): Promise<any> => {
  try {
    const response = await api.delete<ApiResponse<any>>(`/changes/${id}/delete_change/`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting change ${id}:`, error);
    throw error;
  }
};

export const searchChanges = async (query: string): Promise<any> => {
  try {
    const response = await api.get<ApiResponse<any>>('/changes/search_changes/', {
      params: { search: query },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching changes:', error);
    throw error;
  }
};

export const getChangeMetrics = async (): Promise<any> => {
  try {
    const response = await api.get<ApiResponse<any>>('/changes/get_metrics/');
    return response.data;
  } catch (error) {
    console.error('Error fetching change metrics:', error);
    throw error;
  }
};

// Hook personalizado para traer cambios con manejo de estado
export const useChanges = () => {
  const [changes, setChanges] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchChanges = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getChanges();
      if (data.success) {
        setChanges(data.results || []);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching changes');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchChanges();
  }, [fetchChanges]);

  return { changes, loading, error, refetch: fetchChanges };
};

// ==================== UTILITARIOS ====================

// Helper para descargar archivos Excel
export const downloadExcelFile = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export default {
  // Devoluciones
  getReturns,
  getReturnById,
  createReturn,
  deleteReturn,
  searchReturns,
  getReturnMetrics,
  exportAllReturnsExcel,
  exportReturnByIdExcel,
  useReturns,
  // Cambios
  getChanges,
  getChangeById,
  createChange,
  deleteChange,
  searchChanges,
  getChangeMetrics,
  useChanges,
  // Utilitarios
  downloadExcelFile,
};
