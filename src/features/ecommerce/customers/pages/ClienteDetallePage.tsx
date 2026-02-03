import React from 'react';
import { Button } from '../../../../shared/components/native';
import { ChevronLeft, User, DollarSign, BarChart3, Eye } from 'lucide-react';

interface Cliente {
  id: number;
  nombre: string;
  tipoDoc: string;
  numeroDoc: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  activo: boolean;
  createdAt: string;
}

interface ClienteDetallePageProps {
  cliente: Cliente | null;
  onBack: () => void;
}

export default function ClienteDetallePage({ cliente, onBack }: ClienteDetallePageProps) {
  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">Error: Cliente no encontrado</p>
          <Button onClick={onBack} variant="secondary">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  // Calcular datos comerciales (SINCRONIZADO con ClientesManager)
  const VENTAS_KEY = 'damabella_ventas';
  const DEVOLUCIONES_KEY = 'damabella_devoluciones';
  const CAMBIOS_KEY = 'damabella_cambios';

  const calcularDatosComerciales = () => {
    const ventas = JSON.parse(localStorage.getItem(VENTAS_KEY) || '[]');
    const devoluciones = JSON.parse(localStorage.getItem(DEVOLUCIONES_KEY) || '[]');
    const cambios = JSON.parse(localStorage.getItem(CAMBIOS_KEY) || '[]');

    // 🔒 Normalizar clienteId para comparación (string o número) - IGUAL QUE ClientesManager
    const clienteIdStr = cliente.id.toString();

    // Total de ventas del cliente - SIN FILTRAR POR ESTADO (como ClientesManager)
    const ventasCliente = ventas.filter((v: any) => 
      v.clienteId === cliente.id || 
      v.clienteId?.toString() === clienteIdStr ||
      v.clienteId === clienteIdStr
    );
    const totalVentas = ventasCliente.reduce((sum: number, v: any) => sum + (v.total || 0), 0);

    // Total de devoluciones del cliente (usar .total, no .monto)
    const devolucionesCliente = devoluciones.filter((d: any) => 
      d.clienteId === cliente.id || 
      d.clienteId?.toString() === clienteIdStr ||
      d.clienteId === clienteIdStr
    );
    const totalDevoluciones = devolucionesCliente.reduce((sum: number, d: any) => sum + (d.total || 0), 0);

    // Total de cambios del cliente (SOLO INFORMATIVO, no afecta el saldo)
    const cambiosCliente = cambios.filter((c: any) => 
      c.clienteId === cliente.id || 
      c.clienteId?.toString() === clienteIdStr ||
      c.clienteId === clienteIdStr
    );
    const totalCambios = cambiosCliente.reduce((sum: number, c: any) => sum + (c.diferencia || 0), 0);

    // 🔒 Saldo a Favor - SOLO afectado por devoluciones, NO por cambios
    // Representa el saldo disponible por devoluciones no aplicadas
    const saldoAFavor = totalDevoluciones;

    return {
      totalVentas,
      totalDevoluciones,
      totalCambios,
      saldoAFavor,
    };
  };

  const obtenerHistorialCliente = () => {
    const ventas = JSON.parse(localStorage.getItem(VENTAS_KEY) || '[]');
    const devoluciones = JSON.parse(localStorage.getItem(DEVOLUCIONES_KEY) || '[]');
    const cambios = JSON.parse(localStorage.getItem(CAMBIOS_KEY) || '[]');

    // 🔒 Normalizar clienteId para comparación (string o número)
    const clienteIdStr = cliente.id.toString();

    const historial: any[] = [];

    // Filtrar ventas con comparación normalizada
    ventas
      .filter((v: any) => 
        v.clienteId === cliente.id || 
        v.clienteId?.toString() === clienteIdStr ||
        v.clienteId === clienteIdStr
      )
      .forEach((v: any) => {
        historial.push({
          tipo: '🛍️ Venta',
          numero: v.numeroVenta || 'N/A',
          fecha: v.fechaVenta || 'N/A',
          valor: v.total || 0,
          estado: v.estado || 'Pendiente',
        });
      });

    // Filtrar devoluciones con comparación normalizada
    devoluciones
      .filter((d: any) => 
        d.clienteId === cliente.id || 
        d.clienteId?.toString() === clienteIdStr ||
        d.clienteId === clienteIdStr
      )
      .forEach((d: any) => {
        historial.push({
          tipo: '📦 Devolución',
          numero: d.numeroDevolucion || 'N/A',
          fecha: d.fechaDevolucion || 'N/A',
          valor: d.total || 0,
          estado: d.estado || 'Completada',
        });
      });

    // Filtrar cambios con comparación normalizada
    cambios
      .filter((c: any) => 
        c.clienteId === cliente.id || 
        c.clienteId?.toString() === clienteIdStr ||
        c.clienteId === clienteIdStr
      )
      .forEach((c: any) => {
        historial.push({
          tipo: '♻️ Cambio',
          numero: c.numeroCambio || 'N/A',
          fecha: c.fechaCambio || 'N/A',
          valor: c.monto || 0,
          estado: c.estado || 'Completada',
        });
      });

    return historial.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  };

  const datos = calcularDatosComerciales();
  const historial = obtenerHistorialCliente();

  return (
    <div className="space-y-6 pb-10">
      {/* Header con botón volver */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          title="Volver"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Detalle del Cliente: {cliente.nombre}
        </h1>
      </div>

      {/* Grid de información */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* INFORMACIÓN PERSONAL */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={20} />
            Información Personal
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tipo de Documento</p>
              <p className="text-gray-900 font-medium">{cliente.tipoDoc}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Número de Documento</p>
              <p className="text-gray-900 font-medium">{cliente.numeroDoc}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Teléfono</p>
              <p className="text-gray-900 font-medium">{cliente.telefono || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ciudad</p>
              <p className="text-gray-900 font-medium">{cliente.ciudad || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Correo Electrónico</p>
              <p className="text-gray-900 font-medium">{cliente.email || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Dirección</p>
              <p className="text-gray-900 font-medium">{cliente.direccion || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* ESTADO */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado</h2>
          <div className="flex justify-center">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              cliente.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {cliente.activo ? 'Activo' : 'Inactivo'}
            </div>
          </div>
        </div>
      </div>

      {/* RESUMEN COMERCIAL */}
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
            <p className={`text-2xl font-bold mt-1 ${datos.totalDevoluciones > 0 ? 'text-red-600' : 'text-gray-900'}`}>
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
            <p className={`text-2xl font-bold mt-1 ${datos.saldoAFavor > 0 ? 'text-green-600' : 'text-gray-900'}`}>
              ${datos.saldoAFavor.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* HISTORIAL CRONOLÓGICO */}
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
                  <p className={`text-xs ${mov.estado === 'Completada' || mov.estado === 'Aplicado' || mov.estado === 'Aplicada' ? 'text-green-600' : 'text-yellow-600'}`}>
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
