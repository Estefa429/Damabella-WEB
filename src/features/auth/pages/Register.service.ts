import { API } from '@/services/ApiConfigure';

export interface RegistroData {
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  ciudad: string;
  email: string;
  direccion: string;
  password: string;
}

export interface RegistroResult {
  success: boolean;
  error?: string;
}

// ─── Validadores contra la API ────────────────────────────────────────────────
export async function isEmailUnique(email: string): Promise<boolean> {
  try {
    const response = await API.get('/users/search_users/', { params: { search: email } });
    return response.data.results?.length === 0;
  } catch {
    return true;
  }
}

export async function isDocumentoUnique(numero: string): Promise<boolean> {
  try {
    const response = await API.get('/users/search_users/', { params: { search: numero } });
    return response.data.results?.length === 0;
  } catch {
    return true;
  }
}

// ─── Registro principal ───────────────────────────────────────────────────────
export async function registrarClienteDesdeEcommerce(data: RegistroData): Promise<RegistroResult> {
  try {
    const payload = {
      name:         data.nombre,
      email:        data.email,
      password:     data.password,
      type_doc:     data.tipoDocumento,
      doc_identity: data.numeroDocumento,
      phone:        data.telefono,
      address:      data.direccion,
      // id_rol no se envía — el backend asigna Cliente automáticamente
    };

    console.log('[Register.service] Enviando datos:', { tipoDocumento: data.tipoDocumento, payload: payload });

    const response = await API.post('/users/create_users/', payload);

    if (response.data.success) {
      return { success: true };
    }

    return { success: false, error: 'Error al registrar' };

  } catch (error: any) {
    const msg = error?.response?.data?.detail || 'Error al registrar. Intenta de nuevo.';
    return { success: false, error: msg };
  }
}
