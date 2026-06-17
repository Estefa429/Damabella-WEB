/**
 * 🔒 REGLAS Y HELPERS CENTRALIZADOS DE ESTADO DE PEDIDOS
 *
 * Módulo PURO (sin efectos secundarios ni localStorage): define los tipos,
 * las validaciones de transición y los helpers de UI para el estado de un pedido.
 *
 * La persistencia y la lógica de negocio (crear la venta, descontar / devolver
 * stock, anular la venta) la maneja el BACKEND de Django automáticamente al hacer
 * `PATCH /orders/{id}/patch_state/`. El front solo:
 *   1) valida la transición con `puedeTransicionar` / `puedeEditarse`,
 *   2) llama a la API vía `useOrders.cambiarEstado(id, estadoId)`,
 *   3) refresca la lista con `fetchPedidos()`.
 */

// ============================================================
// TIPOS E INTERFACES
// ============================================================

// Nombres EXACTOS de la tabla States de Django:
//   1 = Pendiente · 2 = Entregado · 3 = Cancelado · 4 = Anulado
export type EstadoPedido = 'Pendiente' | 'Entregado' | 'Cancelado' | 'Anulado';

export type TipoTransicion =
  | 'completar'      // Pendiente → Entregado (el backend crea la Venta + descuenta stock)
  | 'anular'         // Pendiente/Entregado → Cancelado (el backend devuelve stock si aplica)
  | 'cambiar-estado'; // Cambio genérico de estado

export interface ItemPedido {
  id: string;
  productoId: string;
  productoNombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  numeroPedido: string;
  tipo: 'Pedido';
  clienteId: string;
  clienteNombre: string;
  fechaPedido: string;
  estado: EstadoPedido;
  items: ItemPedido[];
  subtotal: number;
  iva: number;
  total: number;
  metodoPago: string;
  observaciones: string;
  createdAt: string;
  venta_id?: string | null;
}

// ============================================================
// VALIDADORES - Punto central de reglas de negocio
// ============================================================

/**
 * ✅ ¿Puede editarse un pedido en este estado?
 *
 * Regla: Solo Pendiente es editable
 * - Pendiente: ✅ (aún no hay venta)
 * - Entregado: ❌ (venta ya existe, cambios afectarían Ventas)
 * - Cancelado / Anulado: ❌ (estados terminales)
 */
export function puedeEditarse(estado: EstadoPedido): boolean {
  return estado === 'Pendiente';
}

/**
 * ✅ ¿Puede cambiar de estado este pedido?
 *
 * Regla: Transiciones permitidas
 * - Pendiente → Entregado: ✅ (convertir a venta)
 * - Pendiente → Cancelado: ✅ (anular)
 * - Entregado → Cancelado: ✅ (anular después de venta)
 * - Entregado → Pendiente: ❌ (no se permite reversa)
 * - Cancelado / Anulado → *: ❌ (estados terminales)
 */
export function puedeTransicionar(
  estadoActual: EstadoPedido,
  estadoDestino: EstadoPedido
): boolean {
  // Estados terminales: no admiten más cambios
  if (estadoActual === 'Cancelado' || estadoActual === 'Anulado') return false;

  // Transiciones válidas
  if (estadoActual === 'Pendiente') {
    return estadoDestino === 'Entregado' || estadoDestino === 'Cancelado';
  }

  if (estadoActual === 'Entregado') {
    return estadoDestino === 'Cancelado'; // Solo permite anular
  }

  return false;
}

/**
 * ✅ Determinar qué tipo de transición es
 */
export function determinarTipoTransicion(
  estadoActual: EstadoPedido,
  estadoDestino: EstadoPedido
): TipoTransicion | null {
  if (estadoDestino === 'Entregado' && estadoActual === 'Pendiente') {
    return 'completar';
  }

  if (estadoDestino === 'Cancelado' && (estadoActual === 'Pendiente' || estadoActual === 'Entregado')) {
    return 'anular';
  }

  return null; // Transición inválida o no soportada
}

// ============================================================
// HELPERS PARA UI/COMPONENTES
// ============================================================

/**
 * Obtener qué estados son válidos como destino desde un estado actual
 * Útil para mostrar solo opciones válidas en UI
 */
export function obtenerEstadosValidos(estadoActual: EstadoPedido): EstadoPedido[] {
  const estados: EstadoPedido[] = ['Pendiente', 'Entregado', 'Cancelado', 'Anulado'];
  return estados.filter(estado =>
    estado !== estadoActual && puedeTransicionar(estadoActual, estado)
  );
}

/**
 * Obtener descripción legible de un estado
 */
export function obtenerDescripcionEstado(estado: EstadoPedido): string {
  switch (estado) {
    case 'Pendiente':
      return 'Pendiente de procesamiento';
    case 'Entregado':
      return 'Entregado (convertido a venta)';
    case 'Cancelado':
      return 'Cancelado';
    case 'Anulado':
      return 'Anulado';
    default:
      return 'Estado desconocido';
  }
}

/**
 * Obtener clases Tailwind para badge de estado
 */
export function obtenerClaseEstado(estado: EstadoPedido): string {
  switch (estado) {
    case 'Pendiente':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider';
    case 'Entregado':
      return 'bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider';
    case 'Cancelado':
    case 'Anulado':
      return 'bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider';
  }
}

/**
 * Obtener color de estado para componentes
 */
export function obtenerColorEstado(estado: EstadoPedido): string {
  switch (estado) {
    case 'Pendiente':
      return 'amber';
    case 'Entregado':
      return 'green';
    case 'Cancelado':
      return 'red';
    case 'Anulado':
      return 'red';
    default:
      return 'gray';
  }
}

// ============================================================
// DOCUMENTACIÓN DE REGLAS DE NEGOCIO
// ============================================================

/*
MATRIZ DE TRANSICIONES - REGLAS CENTRALIZADAS:

┌───────────────┬───────────┬─────────────┬────────────┬────────────┐
│ Estado Actual │ Editable? │ → Pendiente │ → Entregado│ → Cancelado│
├───────────────┼───────────┼─────────────┼────────────┼────────────┤
│ Pendiente     │    ✅     │      -      │     ✅     │     ✅     │
│               │           │             │ Crea Venta │ Cancelar   │
│               │           │             │ Stock ⬇️   │ (sin Venta)│
├───────────────┼───────────┼─────────────┼────────────┼────────────┤
│ Entregado     │    ❌     │     ❌      │     -      │     ✅     │
│               │           │  (reversa   │            │ Anula Venta│
│               │           │  prohibida) │            │ Stock ⬆️   │
├───────────────┼───────────┼─────────────┼────────────┼────────────┤
│ Cancelado     │    ❌     │     ❌      │     ❌     │     -      │
│ Anulado       │ (terminal)│   (no)      │   (no)     │ (terminal) │
└───────────────┴───────────┴─────────────┴────────────┴────────────┘

NOTA: Los efectos secundarios (crear Venta, descontar/devolver stock, anular Venta)
los ejecuta el BACKEND de Django al recibir PATCH /orders/{id}/patch_state/.
Este módulo NO toca localStorage ni stock: solo valida y describe estados.

FLUJOS PRINCIPALES (responsabilidad del backend):

1. COMPLETAR (Pendiente → Entregado / state=2):
   - El backend crea la Venta automáticamente y descuenta stock.

2. ANULAR (Pendiente → Cancelado / state=3):
   - Aún no hay venta; el backend solo cambia el estado.

3. ANULAR (Entregado → Cancelado / state=3):
   - El backend devuelve stock y marca la Venta como anulada.

BLOQUEOS:

- Edición: Solo si estado === 'Pendiente'
- Cambio de estado: Solo según la matriz anterior
- Reversa (Entregado → Pendiente): PROHIBIDA
- Terminal (Cancelado / Anulado): No se puede cambiar
*/
