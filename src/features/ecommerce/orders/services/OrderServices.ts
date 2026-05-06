// src/features/orders/services/ordersService.ts
import { API } from "@/services/ApiConfigure";

// ============================================
// INTERFACES - ORDERS
// ============================================

export interface OrderState {
  id_state: number;
  name_state: string;
  description?: string;
}

export interface PaymentMethod {
  id_method: number;
  name: string;
  description?: string;
}

export interface OrderDetailNested {
  variant: number;
  quantity: number;
}

export interface Order {
  id_order: number;
  number_order: string;
  client: number;
  client_name?: string;
  order_date: string;
  payment_method: number;
  payment_method_name?: string;
  address_shipment: string;
  person_receives: string;
  subtotal: string;
  iva: string;
  total: string;
  observations?: string;
  state: number;
  state_name?: string;
  created_at?: string;
  updated_at?: string;
  detail?: OrderDetail[]; // Detalles anidados en respuesta
}

export interface CreateOrderDTO {
  client: number;
  payment_method: number;
  address_shipment: string;
  person_receives: string;
  observations?: string;
  state: number;
  detail: OrderDetailNested[]; // ✅ Detalles anidados en creación
}

export interface OrderDetail {
  id_detail: number;
  order: number;
  order_number?: string;
  variant: number;
  variant_name?: string;
  quantity: number;
  sales_price: string;
  subtotal: string;
}

export interface CreateOrderDetailDTO {
  order: number;
  variant: number;
  quantity: number;
  sales_price: string;
  subtotal: string;
}

// ============================================
// SERVICES - ORDERS
// ============================================

export const getAllOrders = async (): Promise<Order[] | null> => {
  try {
    const res = await API.get('/orders/get_orders/');
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getAllOrders error:', error);
    return null;
  }
};

export const getOrderById = async (id: number): Promise<Order | null> => {
  try {
    const res = await API.get(`/orders/${id}/get_orders_by_id/`);
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getOrderById error:', error);
    return null;
  }
};

export const createOrder = async (data: CreateOrderDTO): Promise<Order | null> => {
  try {
    const res = await API.post('/orders/create_orders/', data);
    return res.data.success ? res.data.object : null;
  } catch (error: any) {
    console.error('createOrder error:', JSON.stringify(error.response?.data));
    console.error('payload enviado:', data);
    return null;
  }
};

export const updateOrder = async (id: number, data: Partial<CreateOrderDTO>): Promise<Order | null> => {
  try {
    const res = await API.put(`/orders/${id}/update_orders/`, data);
    return res.data.success ? res.data.object : null;
  } catch (error) {
    console.error('updateOrder error:', error);
    return null;
  }
};

export const patchOrderState = async (id: number, state: number): Promise<Order | null> => {
  try {
    const res = await API.patch(`/orders/${id}/patch_state/`, { state });
    return res.data.success ? res.data.object : null;
  } catch (error) {
    console.error('patchOrderState error:', error);
    return null;
  }
};

export const deleteOrder = async (id: number): Promise<boolean> => {
  try {
    const res = await API.delete(`/orders/${id}/delete_orders/`);
    return res.data.success === true;
  } catch (error) {
    console.error('deleteOrder error:', error);
    return false;
  }
};

export const searchOrders = async (searchTerm: string): Promise<Order[] | null> => {
  try {
    const res = await API.get('/orders/search_orders/', {
      params: { search: searchTerm }
    });
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('searchOrders error:', error);
    return null;
  }
};

export const exportOrders = async () => {
  try {
    const res = await API.get('/orders/export_orders/', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `pedidos_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('exportOrders error:', error);
    throw error;
  }
};

// ============================================
// SERVICES - ORDER DETAILS
// ============================================

export const getAllOrderDetails = async (): Promise<OrderDetail[] | null> => {
  try {
    const res = await API.get('/orders_details/get_details/');
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getAllOrderDetails error:', error);
    return null;
  }
};

export const getOrderDetailById = async (id: number): Promise<OrderDetail | null> => {
  try {
    const res = await API.get(`/orders_details/${id}/get_details_by_id/`);
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getOrderDetailById error:', error);
    return null;
  }
};

export const getDetailsByOrder = async (orderId: number): Promise<OrderDetail[] | null> => {
  try {
    const res = await API.get(`/orders_details/${orderId}/get_details_by_order/`);
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getDetailsByOrder error:', error);
    return null;
  }
};

export const searchOrderDetails = async (searchTerm: string): Promise<OrderDetail[] | null> => {
  try {
    const res = await API.get('/orders_details/search_details/', {
      params: { search: searchTerm }
    });
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('searchOrderDetails error:', error);
    return null;
  }
};

// ============================================
// SERVICES - ESTADOS
// ============================================

export const getAllStates = async (): Promise<OrderState[] | null> => {
  try {
    const res = await API.get('/states/get_states/');
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getAllStates error:', error);
    return null;
  }
};

export const getStateById = async (id: number): Promise<OrderState | null> => {
  try {
    const res = await API.get(`/states/${id}/get_states_by_id/`);
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getStateById error:', error);
    return null;
  }
};

export const createState = async (data: Omit<OrderState, 'id_state'>): Promise<OrderState | null> => {
  try {
    const res = await API.post('/states/create_states/', data);
    return res.data.success ? res.data.object : null;
  } catch (error) {
    console.error('createState error:', error);
    return null;
  }
};

export const updateState = async (id: number, data: Partial<OrderState>): Promise<OrderState | null> => {
  try {
    const res = await API.put(`/states/${id}/update_states/`, data);
    return res.data.success ? res.data.object : null;
  } catch (error) {
    console.error('updateState error:', error);
    return null;
  }
};

export const deleteState = async (id: number): Promise<boolean> => {
  try {
    const res = await API.delete(`/states/${id}/delete_states/`);
    return res.data.success === true;
  } catch (error) {
    console.error('deleteState error:', error);
    return false;
  }
};

// ============================================
// SERVICES - MÉTODOS DE PAGO
// ============================================

export const getAllPaymentMethods = async (): Promise<PaymentMethod[] | null> => {
  try {
    const res = await API.get('/paymentmethods/');
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getAllPaymentMethods error:', error);
    return null;
  }
};

export const getPaymentMethodById = async (id: number): Promise<PaymentMethod | null> => {
  try {
    const res = await API.get(`/paymentmethods/${id}/`);
    return res.data.success ? res.data.results : null;
  } catch (error) {
    console.error('getPaymentMethodById error:', error);
    return null;
  }
};

export const createPaymentMethod = async (data: Omit<PaymentMethod, 'id_method'>): Promise<PaymentMethod | null> => {
  try {
    const res = await API.post('/paymentmethods/', data);
    return res.data.success ? res.data.object : null;
  } catch (error) {
    console.error('createPaymentMethod error:', error);
    return null;
  }
};

export const updatePaymentMethod = async (id: number, data: Partial<PaymentMethod>): Promise<PaymentMethod | null> => {
  try {
    const res = await API.put(`/paymentmethods/${id}/`, data);
    return res.data.success ? res.data.object : null;
  } catch (error) {
    console.error('updatePaymentMethod error:', error);
    return null;
  }
};

export const deletePaymentMethod = async (id: number): Promise<boolean> => {
  try {
    const res = await API.delete(`/paymentmethods/${id}/`);
    return res.data.success === true;
  } catch (error) {
    console.error('deletePaymentMethod error:', error);
    return false;
  }
};