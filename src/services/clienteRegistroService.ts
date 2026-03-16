import { API } from '@/services/ApiConfigure';
import { getAllTypesDocs, TypesDocs } from '@/features/suppliers/services/providersService';

export { getAllTypesDocs };
export type { TypesDocs };

// ─── Interfaces basadas en el modelo Users del backend ────────────────────────
export interface RegistroData {
  nombre:          string;
  tipoDocumento:   number; // id_doc de Typesdoc
  numeroDocumento: string;
  telefono:        string;
  ciudad:          string; // campo informativo, no está en Users
  email:           string;
  direccion:       string;
  password:        string;
}

export interface RegistroResult {
  success: boolean;
  error?:  string;
}

// ─── Ciudades de Colombia para el select ─────────────────────────────────────
export const CIUDADES_COLOMBIA = [
  'Medellín',
  'Bogotá',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Ibagué',
  'Bucaramanga',
  'Pereira',
  'Manizales',
  'Envigado',
  'Bello',
  'Santa Marta',
  'Villavicencio',
  'Cúcuta',
  'Pasto',
];

// ─── Validadores de formato (sin API) ─────────────────────────────────────────
export function validateEmail(email: string): boolean {
  const regex = /^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

export function validatePassword(password: string): boolean {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return regex.test(password);
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
      doc_identity: data.numeroDocumento,
      type_doc:     data.tipoDocumento,
      phone:        data.telefono,
      address:      data.direccion,
      // id_rol no se envía → backend asigna Cliente automáticamente
    };

    const response = await API.post('/users/create_users/', payload);

    if (response.data.success) {
      return { success: true };
    }

    return { success: false, error: 'Error al registrar' };

  } catch (error: any) {
    const detail = error?.response?.data?.detail;
    const msg    = typeof detail === 'string' ? detail : 'Error al registrar. Intenta de nuevo.';
    return { success: false, error: msg };
  }
}