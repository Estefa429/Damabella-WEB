import React, { useState, useEffect } from 'react';
import { Button } from '../../../../shared/components/native';
import { ChevronLeft, User, BarChart3, Eye, Loader } from 'lucide-react';
import {
  getClientsById,
  Clients,
} from '@/features/ecommerce/customers/services/clientsServices';
import {
  getAllTypesDocs,
  TypesDocs,
} from '@/features/suppliers/services/providersService';

interface ClienteDetallePageProps {
  clientId: number;
  onBack: () => void;
}

const VENTAS_KEY       = 'damabella_ventas';
const DEVOLUCIONES_KEY = 'damabella_devoluciones';
const CAMBIOS_KEY      = 'damabella_cambios';

export default function ClienteDetallePage({ clientId, onBack }: ClienteDetallePageProps) {
  const [cliente, setCliente]     = useState<Clients | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [typesDocs, setTypesDocs] = useState<TypesDocs[]>([]);

  // ─── Carga desde el backend al montar (o cuando cambia clientId) ────────────
  useEffect(() => {
    const fetchCliente = async () => {
      setLoading(true);
      setError(false);
      setCliente(null);
      const data = await getClientsById(clientId);
      if (data) {
        setCliente(data);
      } else {
        setError(true);
      }
      setLoading(false);
    };

    fetchCliente();
  }, [clientId]);

  // ─── Carga tipos de documento ────────────────────────────────────────────────
  useEffect(() => {
    const fetchTypesDocs = async () => {
      const data = await getAllTypesDocs();
      if (data) setTypesDocs(data);
    };
    fetchTypesDocs();
  }, []);

  const tipoDocLabel = (type_doc: number) => {
    const found = typesDocs.find(t => t.id_doc === type_doc);
    return found ? found.name : String(type_doc);
  };

  // ─── Estado: cargando ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-gray-600">Cargando información del cliente...</p>
      </div>
    );
  }

  // ─── Estado: error / no encontrado ──────────────────────────────────────────
  if (error || !cliente) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="text-center space-y-4">
          <p className="text-red-600 font-semibold text-lg">No se encontró el cliente</p>
          <p className="text-gray-500 text-sm">
            El cliente puede haber sido eliminado o el ID no es válido.
          </p>
          <Button onClick={onBack} variant="secondary">Volver</Button>
        </div>
      </div>
    );
  }

  // ─── Lógica comercial (localStorage) ────────────────────────────────────────
  const clienteIdStr = cliente.id_client.toString();

  const matchesCliente = (item: any) =>
    item.clienteId === cliente.id_client ||
    item.clienteId?.toString() === clienteIdStr ||
    item.clienteId === clienteIdStr;

  const calcularDatosComerciales = () => {
    const ventas       = JSON.parse(localStorage.getItem(VENTAS_KEY)       || '[]');
    const devoluciones = JSON.parse(localStorage.getItem(DEVOLUCIONES_KEY) || '[]');
    const cambios      = JSON.parse(localStorage.getItem(CAMBIOS_KEY)      || '[]');

    const totalVentas = ventas
      .filter(matchesCliente)
      .reduce((sum: number, v: any) => sum + (v.total || 0), 0);

    const totalDevoluciones = devoluciones
      .filter(matchesCliente)
      .reduce((sum: number, d: any) => sum + (d.total || 0), 0);

    const totalCambios = cambios
      .filter(matchesCliente)
      .reduce((sum: number, c: any) => sum + (c.diferencia || 0), 0);

    // Saldo a favor: SOLO afectado por devoluciones, NO por cambios
    const saldoAFavor = totalDevoluciones;

    return { totalVentas, totalDevoluciones, totalCambios, saldoAFavor };
  };

  const obtenerHistorialCliente = () => {
    const ventas       = JSON.parse(localStorage.getItem(VENTAS_KEY)       || '[]');
    const devoluciones = JSON.parse(localStorage.getItem(DEVOLUCIONES_KEY) || '[]');
    const cambios      = JSON.parse(localStorage.getItem(CAMBIOS_KEY)      || '[]');

    const historial: any[] = [];

    ventas.filter(matchesCliente).forEach((v: any) => {
      historial.push({
        tipo: '🛍️ Venta',
        numero: v.numeroVenta || 'N/A',
        fecha: v.fechaVenta || v.createdAt || 'N/A',
        valor: v.total || 0,
        estado: v.estado || 'Pendiente',
      });
    });

    devoluciones.filter(matchesCliente).forEach((d: any) => {
      historial.push({
        tipo: '📦 Devolución',
        numero: d.numeroDevolucion || 'N/A',
        fecha: d.fechaDevolucion || d.createdAt || 'N/A',
        valor: d.total || 0,
        estado: d.estado || 'Completada',
      });
    });

    cambios.filter(matchesCliente).forEach((c: any) => {
      historial.push({
        tipo: '♻️ Cambio',
        numero: c.numeroCambio || 'N/A',
        fecha: c.fechaCambio || c.createdAt || 'N/A',
        valor: c.diferencia || c.monto || 0,
        estado: c.estado || 'Completada',
      });
    });

    return historial.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  };

  const datos     = calcularDatosComerciales();
  const historial = obtenerHistorialCliente();

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          title="Volver"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Detalle del Cliente: {cliente.name}
        </h1>
      </div>

      {/* Grid información + estado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Personal */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={20} />
            Información Personal
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tipo de Documento</p>
              <p className="text-gray-900 font-medium">{tipoDocLabel(cliente.type_doc)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Número de Documento</p>
              <p className="text-gray-900 font-medium">{cliente.doc}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Teléfono</p>
              <p className="text-gray-900 font-medium">{cliente.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ciudad</p>
              <p className="text-gray-900 font-medium">{cliente.city || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Correo Electrónico</p>
              <p className="text-gray-900 font-medium">{cliente.email || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Dirección</p>
              <p className="text-gray-900 font-medium">{cliente.address || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Estado */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado</h2>
          <div className="flex justify-center">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              cliente.state ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {cliente.state ? 'Activo' : 'Inactivo'}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen Comercial */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200 shadow-sm">
        <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Resumen Comercial
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-xs font-medium text-gray-600">Total de Ventas</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ${datos.totalVentas.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-xs font-medium text-gray-600">Total Devoluciones</p>
            <p className={`text-2xl font-bold mt-1 ${
              datos.totalDevoluciones > 0 ? 'text-red-600' : 'text-gray-900'
            }`}>
              ${datos.totalDevoluciones.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-xs font-medium text-gray-600">Total Cambios</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ${datos.totalCambios.toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-xs font-bold text-green-700">Saldo a Favor</p>
            <p className={`text-2xl font-bold mt-1 ${
              datos.saldoAFavor > 0 ? 'text-green-600' : 'text-gray-900'
            }`}>
              ${datos.saldoAFavor.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Historial Cronológico */}
      {historial.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye size={20} />
            Historial Cronológico
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {historial.map((mov, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{mov.tipo}</p>
                  <p className="text-gray-600 text-sm">{mov.numero}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 font-medium">${mov.valor.toLocaleString()}</p>
                  <p className={`text-xs ${
                    ['Completada', 'Aplicado', 'Aplicada'].includes(mov.estado)
                      ? 'text-green-600'
                      : 'text-yellow-600'
                  }`}>
                    {mov.estado}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón volver */}
      <div className="flex gap-3">
        <Button onClick={onBack} variant="secondary">
          Volver a Clientes
        </Button>
      </div>
    </div>
  );
}
