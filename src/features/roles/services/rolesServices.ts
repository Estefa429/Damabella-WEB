import { API } from "@/services/ApiConfigure";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Role {
  idRol: number;
  name: string;
  description: string;
  is_active: boolean;
}

export interface Permission {
  id_permissions: number;
  Module_permission: string;
  Action: string;
}

export interface RolPermission {
  id: number;
  rol: number;
  permission: number;
}

export interface CreateRoleDTO {
  name: string;
  description: string;
  permissions?: number[];
}

export interface UpdateRoleDTO {
  name: string;
  description: string;
  is_active?: boolean;
}

// ─── Roles ────────────────────────────────────────────────────────────────────

export const getAllRoles = async (): Promise<Role[] | null> => {
  try {
    const response = await API.get('/roles/get_roles/');
    if (response.data.success === true) return response.data.results;
    console.warn(response.data.message);
    return null;
  } catch (error: any) {
    console.error('getAllRoles error:', error);
    return null;
  }
};

export const getRoleById = async (id: number): Promise<Role | null> => {
  try {
    const response = await API.get(`/roles/${id}/get_rol_by_id/`);
    if (response.data.success === true) return response.data.results;
    console.warn(response.data.message);
    return null;
  } catch (error: any) {
    console.error('getRoleById error:', error);
    return null;
  }
};

export const createRole = async (data: CreateRoleDTO): Promise<Role | null> => {
  try {
    const response = await API.post('/roles/create_roles/', data);
    if (response.data.success === true) return response.data.object;
    console.warn(response.data.message);
    return null;
  } catch (error: any) {
    console.error('createRole error:', JSON.stringify(error.response?.data));
    return null;
  }
};

export const updateRole = async (id: number, data: UpdateRoleDTO): Promise<Role | null> => {
  try {
    const response = await API.put(`/roles/${id}/update_roles/`, data);
    if (response.data.success === true) return response.data.rol;
    console.warn(response.data.message);
    return null;
  } catch (error: any) {
    console.error('updateRole error:', JSON.stringify(error.response?.data));
    return null;
  }
};

export const patchRoleState = async (id: number, is_active: boolean): Promise<boolean> => {
  try {
    const response = await API.patch(`/roles/${id}/change_state/`, { is_active });
    if (response.data.success === true) return true;
    console.warn(response.data.message);
    return false;
  } catch (error: any) {
    console.error('patchRoleState error:', error);
    return false;
  }
};

export const deleteRole = async (id: number): Promise<{success: boolean; hasUsers?:boolean}> => {
  try {
    const response = await API.delete(`/roles/${id}/delete_rol/`);
    return { success: response.data.success === true };
  } catch (error: any) {
    if (error.response?.status === 409) {
        return { success: false, hasUsers: true };
      }
      console.error('deleteRole error:', error);
      return { success: false };
    }
};

export const searchRoles = async (query: string): Promise<Role[] | null> => {
  try {
    const response = await API.get('/roles/search_roles/', { params: { search: query } });
    if (response.data.success === true) return response.data.results;
    return [];
  } catch (error: any) {
    console.error('searchRoles error:', error);
    return null;
  }
};

// ─── Permissions ──────────────────────────────────────────────────────────────

export const getAllPermissions = async (): Promise<Permission[] | null> => {
  try {
    const response = await API.get('/permissions/get_all_permissions/');
    if (response.data.success === true) return response.data.results;
    console.warn(response.data.message);
    return null;
  } catch (error: any) {
    console.error('getAllPermissions error:', error);
    return null;
  }
};

// ─── RolPermission ────────────────────────────────────────────────────────────

export const getPermissionsByRol = async (rolId: number): Promise<RolPermission[] | null> => {
  try {
    const response = await API.get(`/rolPermissions/${rolId}/get_permissions_by_rol/`);
    if (response.data.success === true) return response.data.results;
    console.warn(response.data.message);
    return null;
  } catch (error: any) {
    console.error('getPermissionsByRol error:', error);
    return null;
  }
};

export const assignPermission = async (rol: number, permission: number): Promise<boolean> => {
  try {
    const response = await API.post('/rolPermissions/assing_permission/', { rol, permission });
    if (response.data.success === true) return true;
    console.warn(response.data.message);
    return false;
  } catch (error: any) {
    console.error('assignPermission error:', JSON.stringify(error.response?.data));
    return false;
  }
};

export const removePermission = async (rol: number, permission: number): Promise<boolean> => {
  try {
    const response = await API.delete('/rolPermissions/delete_rol_permission/', {
      data: { rol, permission },
    });
    if (response.data.success === true) return true;
    console.warn(response.data.message);
    return false;
  } catch (error: any) {
    console.error('removePermission error:', error);
    return false;
  }
};

// ─── Helper: sincronizar permisos de un rol ───────────────────────────────────
export const syncRolePermissions = async (
  rolId: number,
  desiredPermissionIds: number[]
): Promise<boolean> => {
  try {
    const current = await getPermissionsByRol(rolId);
    if (current === null) return false;

    const currentIds = current.map((rp) => rp.permission);
    const toAdd    = desiredPermissionIds.filter((id) => !currentIds.includes(id));
    const toRemove = currentIds.filter((id) => !desiredPermissionIds.includes(id));

    await Promise.all([
      ...toAdd.map((id) => assignPermission(rolId, id)),
      ...toRemove.map((id) => removePermission(rolId, id)),
    ]);
    return true;
  } catch (error: any) {
    console.error('syncRolePermissions error:', error);
    return false;
  }
};