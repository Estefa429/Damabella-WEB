// src/features/returns/services/ChangeServices.ts
import { API } from "../../../services/ApiConfigure";

// ============================================
// INTERFACES
// ============================================

export interface ChangeDetail {
  id_detail: number;
  change_id: number;
  variant: number;
  variant_name?: string;
  quantity: number;
  price_difference: string;
  created_at?: string;
}

export interface Change {
  id_change: number;
  change_number: string;
  sale: number;
  sale_number?: string;
  client_name?: string;
  reason_of_change: string;
  state: number;
  state_name?: string;
  stock_applied: boolean;
  return_applied: boolean;
  created_at: string;
  updated_at?: string;
  details?: ChangeDetail[];
}

export interface CreateChangeDTO {
  sale: number;
  reason_of_change: string;
  state: number;
  details: {
    variant_returned: number;
    variant_delivered: number;
  }[];
}

export interface ChangeMetrics {
  total_changes: number;
  pending_changes: number;
  completed_changes: number;
}

// ============================================
// SERVICES
// ============================================

export const getAllChanges = async (): Promise<Change[] | null> => {
  try {
    const res = await API.get('/changes/get_changes/');
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getAllChanges error:', error);
    return null;
  }
};

export const getChangeById = async (id: number): Promise<Change | null> => {
  try {
    const res = await API.get(`/changes/${id}/get_change_by_id/`);
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getChangeById error:', error);
    return null;
  }
};

export const createChange = async (data: CreateChangeDTO): Promise<Change | null> => {
  try {
    const res = await API.post('/changes/create_change/', data);
    return res.data.success ? res.data.object : null;
  } catch (error: any) {
    console.error('createChange error:', error.response?.data || error.message);
    return null;
  }
};

export const deleteChange = async (id: number): Promise<boolean> => {
  try {
    const res = await API.delete(`/changes/${id}/delete_change/`);
    return res.data.success === true;
  } catch (error) {
    console.error('deleteChange error:', error);
    return false;
  }
};

export const getChangeMetrics = async (): Promise<ChangeMetrics | null> => {
  try {
    const res = await API.get('/changes/get_metrics/');
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getChangeMetrics error:', error);
    return null;
  }
};

export const getChangeDetails = async (changeId: number): Promise<ChangeDetail[] | null> => {
  try {
    const res = await API.get(`/change-details/${changeId}/get_changes_by_id/`);
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getChangeDetails error:', error);
    return null;
  }
};
