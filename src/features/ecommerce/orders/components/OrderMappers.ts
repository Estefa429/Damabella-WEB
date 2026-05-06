// src/features/orders/utils/orderMappers.ts
//
// Convierte el formData del componente PedidosManager al DTO que espera la API,
// y convierte la respuesta Order de la API al formato que usa el componente.
 
import type { CreateOrderDTO, Order, OrderDetailNested } from '../services/OrderServices';
 
// ─── Tipos locales del componente ────────────────────────────────────────────
 
export interface ItemPedidoLocal {
  id: string;
  productoId: string;        // id del producto (no la variante)
  variantId?: number;        // id de la variante → requerido por la API
  productoNombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
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
 
// ─── Mapeo formData → CreateOrderDTO ─────────────────────────────────────────
 
/**
 * Convierte el estado local del formulario al DTO que acepta createOrder() / updateOrder().
 *
 * IMPORTANTE: cada ItemPedidoLocal debe tener `variantId` relleno antes de llamar aquí.
 * Ese id viene del producto seleccionado en el catálogo (variante de talla+color).
 */
export const formDataToCreateOrderDTO = (
  formData: FormDataLocal,
  estadoIdPendiente: number = 1,  // ajusta según tu backend
): CreateOrderDTO => {
  const detail: OrderDetailNested[] = formData.items.map(item => ({
    variant: item.variantId ?? parseInt(item.productoId, 10), // fallback si no hay variantId
    quantity: item.cantidad,
  }));
 
  return {
    client: parseInt(formData.clienteId, 10),
    payment_method: formData.metodoPagoId ?? metodoPagoNameToId(formData.metodoPago),
    address_shipment: formData.direccionEnvio || '',
    person_receives: formData.personaRecibe || '',
    observations: formData.observaciones || '',
    state: formData.estadoId ?? estadoIdPendiente,
    detail,
  };
};
 
// ─── Mapeo Order (API) → formato tabla del componente ────────────────────────
 
/**
 * Normaliza la respuesta de la API para que el componente pueda
 * renderizarla sin cambios en la tabla y en los modales de detalle.
 */
export const apiOrderToLocal = (order: Order) => ({
  id: order.id_order,
  numeroPedido: order.number_order,
  clienteId: String(order.client),
  clienteNombre: order.client_name ?? '',
  fechaPedido: order.order_date,
  estado: apiStateToLocalState(order.state_name),
  items: (order.detail ?? []).map(d => ({
    id: String(d.id_detail),
    productoId: String(d.variant),
    variantId: d.variant,
    productoNombre: d.variant_name ?? '',
    talla: '',    // la API no devuelve talla/color por separado en este endpoint
    color: '',    // ampliar si el backend los expone
    cantidad: d.quantity,
    precioUnitario: parseFloat(d.sales_price),
    subtotal: parseFloat(d.subtotal),
  })),
  subtotal: parseFloat(order.subtotal),
  iva: parseFloat(order.iva),
  total: parseFloat(order.total),
  metodoPago: order.payment_method_name ?? '',
  metodoPagoId: order.payment_method,
  observaciones: order.observations ?? '',
  direccionEnvio: order.address_shipment,
  personaRecibe: order.person_receives,
  estadoId: order.state,
  createdAt: order.created_at ?? new Date().toISOString(),
});
 
// ─── Helpers internos ─────────────────────────────────────────────────────────
 
/**
 * Convierte el nombre de estado que devuelve la API al string
 * que usa el componente para colores y etiquetas.
 * Ajusta los valores según los que devuelva tu backend.
 */
export const apiStateToLocalState = (
  stateName?: string,
): 'Pendiente' | 'Completada' | 'Anulado' | 'Convertido a venta' => {
  const name = (stateName ?? '').toLowerCase();
  if (name.includes('complet') || name.includes('finaliz')) return 'Completada';
  if (name.includes('anul') || name.includes('cancel'))    return 'Anulado';
  if (name.includes('convert') || name.includes('venta'))  return 'Convertido a venta';
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