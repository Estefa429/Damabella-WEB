// src/features/orders/hooks/useOrders.ts
import { useState, useEffect, useCallback } from 'react';
import {
  getAllOrders,
  createOrder,
  updateOrder,
  patchOrderState,
  deleteOrder,
  searchOrders,
  exportOrders,
  type Order,
  type CreateOrderDTO,
} from '../services/OrderServices';

interface UseOrdersReturn {
  pedidos: Order[];
  loading: boolean;
  error: string | null;
  fetchPedidos: () => Promise<void>;
  crearPedido: (data: CreateOrderDTO) => Promise<Order | null>;
  editarPedido: (id: number, data: Partial<CreateOrderDTO>) => Promise<Order | null>;
  cambiarEstado: (id: number, state: number) => Promise<Order | null>;
  eliminarPedido: (id: number) => Promise<boolean>;
  buscarPedidos: (term: string) => Promise<void>;
  descargarExcel: () => Promise<void>;
}

export const useOrders = (): UseOrdersReturn => {
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllOrders();
      setPedidos(data ?? []);
    } catch {
      setError('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  const crearPedido = useCallback(async (data: CreateOrderDTO): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const nuevo = await createOrder(data);
      if (nuevo) {
        setPedidos(prev => [...prev, nuevo]);
      }
      return nuevo;
    } catch {
      setError('Error al crear pedido');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const editarPedido = useCallback(async (id: number, data: Partial<CreateOrderDTO>): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const actualizado = await updateOrder(id, data);
      if (actualizado) {
        setPedidos(prev => prev.map(p => p.id_order === id ? actualizado : p));
      }
      return actualizado;
    } catch {
      setError('Error al actualizar pedido');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cambiarEstado = useCallback(async (id: number, state: number): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const actualizado = await patchOrderState(id, state);
      if (actualizado) {
        setPedidos(prev => prev.map(p => p.id_order === id ? actualizado : p));
      }
      return actualizado;
    } catch {
      setError('Error al cambiar estado');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarPedido = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const ok = await deleteOrder(id);
      if (ok) {
        setPedidos(prev => prev.filter(p => p.id_order !== id));
      }
      return ok;
    } catch {
      setError('Error al eliminar pedido');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarPedidos = useCallback(async (term: string) => {
    if (!term.trim()) {
      await fetchPedidos();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchOrders(term);
      setPedidos(data ?? []);
    } catch {
      setError('Error al buscar pedidos');
    } finally {
      setLoading(false);
    }
  }, [fetchPedidos]);

  const descargarExcel = useCallback(async () => {
    try {
      await exportOrders();
    } catch {
      setError('Error al exportar pedidos');
    }
  }, []);

  return {
    pedidos,
    loading,
    error,
    fetchPedidos,
    crearPedido,
    editarPedido,
    cambiarEstado,
    eliminarPedido,
    buscarPedidos,
    descargarExcel,
  };
};