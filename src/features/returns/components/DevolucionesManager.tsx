import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Eye, Download, FileText } from 'lucide-react';
import { Input, Modal } from '../../../shared/components/native';

const STORAGE_KEY = 'damabella_devoluciones';
const VENTAS_KEY = 'damabella_ventas';

interface ItemDevolucion {
  id: string;
  productoNombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Devolucion {
  id: number;
  numeroDevolucion: string;
  ventaId: number;
  numeroVenta: string;
  clienteNombre: string;
  fechaDevolucion: string;
  motivo: string;
  items: ItemDevolucion[];
  total: number;
  createdAt: string;
}

export function DevolucionesManager() {
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [ventas, setVentas] = useState(() => {
    const stored = localStorage.getItem(VENTAS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingDevolucion, setViewingDevolucion] = useState<Devolucion | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleStorageChange = () => {
      const storedDevoluciones = localStorage.getItem(STORAGE_KEY);
      const storedVentas = localStorage.getItem(VENTAS_KEY);
      if (storedDevoluciones) setDevoluciones(JSON.parse(storedDevoluciones));
      if (storedVentas) setVentas(JSON.parse(storedVentas));
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const descargarComprobante = (devolucion: Devolucion) => {
    const contenido = `
=================================
COMPROBANTE DE DEVOLUCIÓN
${devolucion.numeroDevolucion}
=================================

Fecha de Devolución: ${new Date(devolucion.fechaDevolucion).toLocaleDateString()}
Venta Original: ${devolucion.numeroVenta}
Cliente: ${devolucion.clienteNombre}

---------------------------------
MOTIVO DE DEVOLUCIÓN
---------------------------------
${devolucion.motivo}

---------------------------------
PRODUCTOS DEVUELTOS
---------------------------------
${devolucion.items.map(item => `
${item.productoNombre}
Talla: ${item.talla} | Color: ${item.color}
Cantidad: ${item.cantidad} x $${item.precioUnitario.toLocaleString()}
Subtotal: $${item.subtotal.toLocaleString()}
`).join('\n')}

---------------------------------
TOTAL A DEVOLVER
---------------------------------
$${devolucion.total.toLocaleString()}

=================================
DAMABELLA - Moda Femenina
=================================
    `.trim();

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${devolucion.numeroDevolucion}.txt`;
    a.click();
  };

  const filteredDevoluciones = devoluciones.filter(d =>
    d.numeroDevolucion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.numeroVenta.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Devoluciones</h2>
          <p className="text-gray-600">Consulta las devoluciones creadas desde ventas</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar por número de devolución, venta o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Info Card */}
      {devoluciones.length === 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <RotateCcw className="text-purple-600 mt-1" size={24} />
            <div>
              <h3 className="text-purple-900 mb-1">¿Cómo crear devoluciones?</h3>
              <p className="text-purple-700 text-sm">
                Las devoluciones se crean desde el módulo de <strong>Ventas</strong>. 
                Busca la venta que deseas devolver y haz clic en el botón de devolución.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Devoluciones Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-gray-600">Número</th>
                <th className="text-left py-4 px-6 text-gray-600">Venta Original</th>
                <th className="text-left py-4 px-6 text-gray-600">Cliente</th>
                <th className="text-left py-4 px-6 text-gray-600">Fecha</th>
                <th className="text-left py-4 px-6 text-gray-600">Motivo</th>
                <th className="text-right py-4 px-6 text-gray-600">Total</th>
                <th className="text-right py-4 px-6 text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDevoluciones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <RotateCcw className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron devoluciones</p>
                    <p className="text-sm mt-2">Crea devoluciones desde el módulo de Ventas</p>
                  </td>
                </tr>
              ) : (
                filteredDevoluciones.map((devolucion) => (
                  <tr key={devolucion.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 rounded-full">
                          <RotateCcw size={16} />
                        </span>
                        <div className="text-gray-900">{devolucion.numeroDevolucion}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-600">{devolucion.numeroVenta}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{devolucion.clienteNombre}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {new Date(devolucion.fechaDevolucion).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600 max-w-xs truncate" title={devolucion.motivo}>
                        {devolucion.motivo}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-gray-900">
                      ${devolucion.total.toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setViewingDevolucion(devolucion); setShowDetailModal(true); }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => descargarComprobante(devolucion)}
                          className="p-2 hover:bg-purple-50 rounded-lg transition-colors text-purple-600"
                          title="Descargar comprobante"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalle */}
      {viewingDevolucion && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Detalle Devolución ${viewingDevolucion.numeroDevolucion}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div>
                <div className="text-sm text-purple-600 mb-1">Número de Devolución</div>
                <div className="text-purple-900">{viewingDevolucion.numeroDevolucion}</div>
              </div>
              <div>
                <div className="text-sm text-purple-600 mb-1">Venta Original</div>
                <div className="text-purple-900">{viewingDevolucion.numeroVenta}</div>
              </div>
              <div>
                <div className="text-sm text-purple-600 mb-1">Cliente</div>
                <div className="text-purple-900">{viewingDevolucion.clienteNombre}</div>
              </div>
              <div>
                <div className="text-sm text-purple-600 mb-1">Fecha de Devolución</div>
                <div className="text-purple-900">
                  {new Date(viewingDevolucion.fechaDevolucion).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Motivo de la Devolución</div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900">
                {viewingDevolucion.motivo}
              </div>
            </div>

            <div>
              <h4 className="text-gray-900 mb-3">Productos Devueltos</h4>
              <div className="space-y-2">
                {viewingDevolucion.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex justify-between mb-1">
                      <div className="text-gray-900">{item.productoNombre}</div>
                      <div className="text-gray-900">${item.subtotal.toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Talla: {item.talla} | Color: {item.color} | Cantidad: {item.cantidad} x ${item.precioUnitario.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 bg-purple-50 rounded-lg p-4">
              <div className="flex justify-between text-purple-900">
                <span className="font-medium">Total a Devolver:</span>
                <span className="font-medium">${viewingDevolucion.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                onClick={() => descargarComprobante(viewingDevolucion)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Download size={16} />
                Descargar Comprobante
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
