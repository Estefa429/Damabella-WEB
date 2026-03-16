// src/features/users/services/usersService.ts
import { API } from "@/services/ApiConfigure";

export interface TypeDoc {
  id_doc: number;
  name:   string;
}

export interface Role {
  idRol:      number;
  name:        string;
  description: string;
  is_active:   boolean;
}

export interface User {
  id_user:      number;
  type_doc:     number;
  type_doc_name: string;
  doc_identity: string;
  name:         string;
  email:        string;
  phone:        string;
  address:      string;
  id_rol:       number;
  role_name:    string;
  is_active:    boolean;
  created_at:   string;
  updated_at:   string;
}

export interface CreateUserDTO {
  type_doc:     number;
  doc_identity: string;
  name:         string;
  email:        string;
  phone:        string;
  address?:     string;
  password:     string;
  id_rol:       number;
}

export const getAllUsers = async (): Promise<User[] | null> => {
  try {
    const res = await API.get('/users/get_users/');
    return res.data.success ? res.data.results : null;
  } catch { return null; }
};

export const getAllRoles = async (): Promise<Role[] | null> => {
  try {
    const res = await API.get('/roles/get_roles/');
    return res.data.success ? res.data.results : null;
  } catch { return null; }
};

export const getAllTypeDocs = async (): Promise<TypeDoc[] | null> => {
  try {
    const res = await API.get('/typesDocs/get_types_docs/');
    return res.data.success ? res.data.results : null;
  } catch { return null; }
};

export const createUser = async (data: CreateUserDTO): Promise<User | null> => {
  try {
    const res = await API.post('/users/create_users/', data);
    return res.data.success ? res.data.object : null;
  } catch(error:any) {
    console.error('createUser error:', JSON.stringify(error.response?.data));
    console.error('payload enviado:', data);
    return null; }
};

export const updateUser = async (id: number, data: Partial<CreateUserDTO>): Promise<User | null> => {
  try {
    const res = await API.put(`/users/${id}/update_users/`, data);
    return res.data.success ? res.data.User : null;
  } catch { return null; }
};

export const patchUserState = async (id: number, is_active: boolean): Promise<boolean> => {
  try {
    const res = await API.patch(`/users/${id}/change_state/`, { is_active });
    return res.data.success === true;
  } catch { return false; }
};

export const deleteUser = async (id: number): Promise<boolean> => {
  try {
    const res = await API.delete(`/users/${id}/delete_users/`);
    return res.data.success === true;
  } catch { return false; }
};

export const exportUsers = async () => {
  const res = await API.get('/users/export_users/', { responseType: 'blob' });
  const url  = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href     = url;
  link.download = `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};