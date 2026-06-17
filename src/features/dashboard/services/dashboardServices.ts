import { API } from "@/services/ApiConfigure";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface UsersActiveResponse {
  success: boolean;
  results: number;
  message?: string;
}

export interface PendingOrdersResponse {
  success: boolean;
  results: number;
  message?: string;
}

export interface VentasMesResponse {
  success: boolean;
  results: number;
  message?: string;
}

export interface DineroVentasMesResponse {
  success: boolean;
  results: number;
  message?: string;
}

export interface ProductoMasVendido {
  id: number;
  nombre: string;
  cantidad_vendida: number;
  ingresos: number;
}

export interface ProductosMasVendidosResponse {
  success: boolean;
  results: ProductoMasVendido[];
  message?: string;
}

export interface DistribucionCategoria {
  categoria: string;
  cantidad: number;
  porcentaje: number;
}

export interface DistribucionCategoriasResponse {
  success: boolean;
  results: DistribucionCategoria[];
  message?: string;
}

// ─── Datos mensuales ──────────────────────────────────────────────────────────

export interface DatoMensual {
  mes: string;
  valor: number;
}

export interface DineroVentasPorMesResponse {
  success: boolean;
  results: DatoMensual[];
  message?: string;
}

export interface CantidadVentasPorMesResponse {
  success: boolean;
  results: DatoMensual[];
  message?: string;
}

// ─── Respuesta unificada del dashboard ─────────────────────────────────────────

export interface DashboardSummary {
  usersActive: number;
  pendingOrders: number;
  ventasMes: number;
  dineroVentasMes: number;
  productosMasVendidos?: ProductoMasVendido[];
  distribucionCategorias?: DistribucionCategoria[];
  cantidadDevoluciones?: number;
  error?: string;
}

// ─── Funciones individuales ───────────────────────────────────────────────────

/**
 * Obtiene la cantidad de usuarios activos
 */
export const getUsuariosActivos = async (): Promise<number | null> => {
  try {
    console.log('🔴 [SERVICE] Llamando GET /dashboard/get_users_active/');
    const response = await API.get<UsersActiveResponse>('/dashboard/get_users_active/');
    console.log('🔴 [SERVICE] Respuesta get_users_active:', response.data);
    if (response.data.success === true) {
      return response.data.results;
    }
    console.warn('getUsuariosActivos warning:', response.data.message);
    return null;
  } catch (error: any) {
    console.error('🔴 [SERVICE] getUsuariosActivos error:', error.message, error.response?.data);
    return null;
  }
};

/**
 * Obtiene la cantidad de pedidos pendientes
 */
export const getPedidosPendientes = async (): Promise<number | null> => {
  try {
    const response = await API.get<PendingOrdersResponse>('/dashboard/get_pending_orders/');
    if (response.data.success === true) {
      return response.data.results;
    }
    console.warn('getPedidosPendientes warning:', response.data.message);
    return null;
  } catch (error: any) {
    console.error('getPedidosPendientes error:', error);
    return null;
  }
};

/**
 * Obtiene la cantidad de ventas del mes
 */
export const getCantidadVentasMes = async (): Promise<number | null> => {
  try {
    const response = await API.get<VentasMesResponse>('/dashboard/cantidad_ventas_mes/');
    if (response.data.success === true) {
      return response.data.results;
    }
    console.warn('getCantidadVentasMes warning:', response.data.message);
    return null;
  } catch (error: any) {
    console.error('getCantidadVentasMes error:', error);
    return null;
  }
};

/**
 * Obtiene el dinero generado por ventas del mes
 */
export const getDineroVentasMes = async (): Promise<number | null> => {
  try {
    const response = await API.get<DineroVentasMesResponse>('/dashboard/dinero_ventas_mes/');
    if (response.data.success === true) {
      return response.data.results;
    }
    console.warn('getDineroVentasMes warning:', response.data.message);
    return null;
  } catch (error: any) {
    console.error('getDineroVentasMes error:', error);
    return null;
  }
};

/**
 * Obtiene los productos más vendidos
 */
export const getProductosMasVendidos = async (): Promise<ProductoMasVendido[] | null> => {
  try {
    const response = await API.get<ProductosMasVendidosResponse>('/dashboard/productos_mas_vendidos/');    console.log('👉 TOP:', response.data);    if (response.data.success === true) {
      return response.data.results;
    }
    console.warn('getProductosMasVendidos warning:', response.data.message);
    return null;
  } catch (error: any) {
    console.error('getProductosMasVendidos error:', error);
    return null;
  }
};

/**
 * Obtiene la distribución de productos por categoría
 */
export const getDistribucionCategorias = async (): Promise<DistribucionCategoria[] | null> => {
  try {
    const response = await API.get<DistribucionCategoriasResponse>('/dashboard/distribucion_categorias/');
    if (response.data.success === true) {
      return response.data.results;
    }
    console.warn('getDistribucionCategorias warning:', response.data.message);
    return null;
  } catch (error: any) {
    console.error('getDistribucionCategorias error:', error);
    return null;
  }
};

/**
 * Obtiene el dinero de ventas por mes (últimos 6 meses)
 */
export const getDineroVentasPorMes = async (): Promise<DatoMensual[] | null> => {
  try {
    console.log('🔴 [SERVICE] Llamando GET /dashboard/dinero_ventas_por_mes/');
    const response = await API.get<DineroVentasPorMesResponse>('/dashboard/dinero_ventas_por_mes/');
    console.log('🔴 [SERVICE] Respuesta dinero_ventas_por_mes:', response.data);
    if (response.data.success === true) {
      return response.data.results;
    }
    console.warn('getDineroVentasPorMes warning:', response.data.message);
    return null;
  } catch (error: any) {
    console.error('🔴 [SERVICE] getDineroVentasPorMes error:', error.message, error.response?.data);
    return null;
  }
};

/**
 * Obtiene la cantidad de ventas por mes (últimos 6 meses)
 */
export const getCantidadVentasPorMes = async (): Promise<DatoMensual[] | null> => {
  try {
    console.log('🔴 [SERVICE] Llamando GET /dashboard/cantidad_ventas_por_mes/');
    const response = await API.get<CantidadVentasPorMesResponse>('/dashboard/cantidad_ventas_por_mes/');
    console.log('🔴 [SERVICE] Respuesta cantidad_ventas_por_mes:', response.data);
    if (response.data.success === true) {
      return response.data.results;
    }
    console.warn('getCantidadVentasPorMes warning:', response.data.message);
    return null;
  } catch (error: any) {
    console.error('🔴 [SERVICE] getCantidadVentasPorMes error:', error.message, error.response?.data);
    return null;
  }
};

// ─── Función unificada ────────────────────────────────────────────────────────

/**
 * Obtiene un resumen completo del dashboard usando Promise.all()
 * Las primeras 4 peticiones (tarjetas principales) se ejecutan en paralelo.
 * Las últimas 2 (gráficos) se pueden solicitar también, pero sin bloquear.
 */
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    console.log('🔴 [SERVICE] getDashboardSummary iniciando...');
    
    // Ejecutar las primeras 4 peticiones en paralelo
    const [usersActive, pendingOrders, ventasMes, dineroVentasMes] = await Promise.all([
      getUsuariosActivos(),
      getPedidosPendientes(),
      getCantidadVentasMes(),
      getDineroVentasMes(),
    ]);

    console.log('🔴 [SERVICE] Datos principales obtenidos:', { usersActive, pendingOrders, ventasMes, dineroVentasMes });

    // Crear el objeto de respuesta base con los datos principales
    const summary: DashboardSummary = {
      usersActive: usersActive ?? 0,
      pendingOrders: pendingOrders ?? 0,
      ventasMes: ventasMes ?? 0,
      dineroVentasMes: dineroVentasMes ?? 0,
    };

    // Opcionalmen solicitar también los gráficos en paralelo
    try {
      const [productosMasVendidos, distribucionCategorias] = await Promise.all([
        getProductosMasVendidos(),
        getDistribucionCategorias(),
      ]);

      if (productosMasVendidos) {
        summary.productosMasVendidos = productosMasVendidos;
      }
      if (distribucionCategorias) {
        summary.distribucionCategorias = distribucionCategorias;
      }
    } catch (error) {
      // Si los gráficos fallan, no es crítico — devolvemos el resumen sin ellos
      console.warn('Error cargando gráficos del dashboard:', error);
    }

    // Intentar obtener la métrica de devoluciones desde el endpoint correspondiente
    try {
      const resp = await API.get<any>('/returns/get_metrics/');
      if (resp?.data?.success && resp.data.metrics && typeof resp.data.metrics.cantidad_devoluciones !== 'undefined') {
        summary.cantidadDevoluciones = resp.data.metrics.cantidad_devoluciones;
      } else {
        summary.cantidadDevoluciones = 0;
      }
    } catch (err) {
      console.warn('Error cargando métrica de devoluciones:', err);
      summary.cantidadDevoluciones = 0;
    }

    console.log('🔴 [SERVICE] getDashboardSummary retornando:', summary);
    return summary;
  } catch (error: any) {
    console.error('🔴 [SERVICE] getDashboardSummary error crítico:', error);
    return {
      usersActive: 0,
      pendingOrders: 0,
      ventasMes: 0,
      dineroVentasMes: 0,
      error: error?.message || 'Error al cargar el resumen del dashboard',
    };
  }
};
