// src/features/orders/OrderMappers.ts
//
// Convierte el formData del componente PedidosManager al DTO que espera la API,
// y convierte la respuesta Order de la API al formato que usa el componente.

import type { CreateOrderDTO, Order, OrderDetailNested } from '../services/OrderServices';

// ─── Tipos locales del componente ────────────────────────────────────────────

export interface ItemPedidoLocal {
  id: string;
  productoId: string;
  variantId?: number;
  productoNombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
  precioCompra: number;      // requerido
  precioVenta: number;       // requerido — era opcional, causaba NaN en totales
  subtotal: number;
}

export interface FormDataLocal {
  clienteId: string;
  fechaPedido: string;
  metodoPago: string;         // string legible ("Efectivo", "Tarjeta"...)
  metodoPagoId?: number;      // id numérico que espera la API
  observaciones: string;
  items: ItemPedidoLocal[];
  direccionEnvio: string;
  personaRecibe: string;
  estadoId?: number;          // id del estado inicial (normalmente "Pendiente")
}

// ─── Estado del pedido (alineado 1:1 con la tabla States de Django) ───────────
//
// IDs reales en la base de datos:
//   1 = Pendiente · 2 = Entregado · 3 = Cancelado · 4 = Anulado
export type EstadoLocal = 'Pendiente' | 'Entregado' | 'Cancelado' | 'Anulado';

// El backend puede exponer el estado de varias formas según el serializer:
//  - objeto anidado:  { id_state, name_state }
//  - solo el id:      number
//  - solo el nombre:  string
export interface ApiOrderState {
  id_state?: number;
  name_state?: string;
}
export type ApiOrderStateRef = ApiOrderState | number | string | null | undefined;

const STATE_ID_TO_LOCAL: Record<number, EstadoLocal> = {
  1: 'Pendiente',
  2: 'Entregado',
  3: 'Cancelado',
  4: 'Anulado',
};

const extractStateId = (state: ApiOrderStateRef): number | undefined => {
  if (state && typeof state === 'object') return state.id_state;
  if (typeof state === 'number')          return state;
  return undefined;
};

const extractStateName = (state: ApiOrderStateRef): string | undefined => {
  if (state && typeof state === 'object') return state.name_state;
  if (typeof state === 'string')          return state;
  return undefined;
};

// ─── Mapeo formData → CreateOrderDTO ─────────────────────────────────────────

/**
 * Convierte el estado local del formulario al DTO que acepta createOrder() / updateOrder().
 *
 * IMPORTANTE: cada ItemPedidoLocal debe tener `variantId` relleno antes de llamar aquí.
 * Ese id viene del producto seleccionado en el catálogo (variante de talla+color).
 */
const calculateOrderTotals = (items: ItemPedidoLocal[]) => {
  const total = items.reduce(
    (sum, item) => sum + item.cantidad * (item.precioVenta ?? item.precioUnitario),
    0,
  );
  const subtotal = total / 1.19;
  const iva = total - subtotal;
  return { subtotal, iva, total };
};

export const formDataToCreateOrderDTO = (
  formData: FormDataLocal,
  estadoIdPendiente: number = 1,  // ajusta según tu backend
): CreateOrderDTO => {
  const detail: OrderDetailNested[] = formData.items.map(item => ({
    variant: item.variantId as number,
    quantity: item.cantidad,
  }));

  const totals = calculateOrderTotals(formData.items);

  return {
    client: parseInt(formData.clienteId, 10),
    payment_method: formData.metodoPagoId ?? metodoPagoNameToId(formData.metodoPago),
    address_shipment: formData.direccionEnvio || '',
    person_receives: formData.personaRecibe || '',
    observations: formData.observaciones || '',
    state: formData.estadoId ?? estadoIdPendiente,
    subtotal: totals.subtotal.toFixed(2),
    iva: totals.iva.toFixed(2),
    total: totals.total.toFixed(2),
    detail,
  };
};

// ─── Mapeo Order (API) → formato tabla del componente ────────────────────────

/**
 * Normaliza la respuesta de la API para que el componente pueda
 * renderizarla sin cambios en la tabla y en los modales de detalle.
 *
 * El estado se lee del objeto `state` real que devuelve Django
 * (`{ id_state, name_state }`), con respaldo a `state_name`/`state`
 * para serializers planos. Así `estado`/`estadoId` nunca quedan undefined.
 */
export const apiOrderToLocal = (order: Order) => {
  const stateRef: ApiOrderStateRef = (order.state ?? order.state_name) as ApiOrderStateRef;

  return {
    id: order.id_order,
    numeroPedido: order.number_order,
    clienteId: String(order.client),
    clienteNombre: order.client_name ?? '',
    fechaPedido: order.order_date,
    estado: apiStateToLocalState(stateRef, order.state_name),
    estadoId: extractStateId(stateRef) ?? 1,
    items: (order.detail ?? []).map(d => ({
      id:             String(d.id_detail),
      productoId:     String(d.variant),
      variantId:      d.variant,
      productoNombre: d.variant_name ?? '',
      talla:          '',
      color:          '',
      cantidad:       d.quantity,
      precioUnitario: parseFloat(d.sales_price),
      precioCompra:   0,
      precioVenta:    parseFloat(d.sales_price),  // ← antes faltaba, ahora igual a precioUnitario
      subtotal:       parseFloat(d.subtotal),
    })),
    subtotal: parseFloat(order.subtotal),
    iva: parseFloat(order.iva),
    total: parseFloat(order.total),
    metodoPago: order.payment_method_name ?? '',
    metodoPagoId: order.payment_method,
    observaciones: order.observations ?? '',
    direccionEnvio: order.address_shipment,
    personaRecibe: order.person_receives,
    createdAt: order.created_at ?? new Date().toISOString(),
  };
};

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Convierte el estado que devuelve la API al string local exacto de la BD.
 *
 * Prioridad:
 *   1) ID de la tabla States (lo más fiable, inmune a tildes/mayúsculas).
 *   2) Nombre (`name_state`) por coincidencia de texto, como respaldo.
 *
 * Nunca devuelve undefined: si no reconoce nada, asume "Pendiente".
 */
export const apiStateToLocalState = (
  state: ApiOrderStateRef,
  fallbackName?: string,
): EstadoLocal => {
  // 1) Por ID exacto de la base de datos.
  const id = extractStateId(state);
  if (id != null && STATE_ID_TO_LOCAL[id]) return STATE_ID_TO_LOCAL[id];

  // 2) Por nombre (respaldo).
  const name = (extractStateName(state) ?? fallbackName ?? '').toLowerCase();
  if (name.includes('pend'))   return 'Pendiente';
  if (name.includes('entreg')) return 'Entregado';
  if (name.includes('cancel')) return 'Cancelado';
  if (name.includes('anul'))   return 'Anulado';

  return 'Pendiente';
};

/**
 * Mapea nombre de método de pago → id numérico.
 * Reemplaza estos valores por los ids reales de tu base de datos.
 */
export const metodoPagoNameToId = (nombre: string): number => {
  const map: Record<string, number> = {
    'Efectivo':      1,
    'Transferencia': 2,
    'Tarjeta':       3,
    'Nequi':         4,
    'Daviplata':     5,
  };
  return map[nombre] ?? 1;
};
