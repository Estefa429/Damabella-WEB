import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Eye, Trash2, X, CheckCircle, UserPlus, Download, AlertCircle, Edit2, ShoppingCart } from 'lucide-react';
import { Button, Input, Modal } from '../../../../shared/components/native';

const STORAGE_KEY = 'damabella_pedidos';
const CLIENTES_KEY = 'damabella_clientes';
const PRODUCTOS_KEY = 'damabella_productos';

interface ItemPedido {
  id: string;
  productoId: string;
  productoNombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Pedido {
  id: number;
  numeroPedido: string;
  tipo: 'Pedido';
  clienteId: string;
  clienteNombre: string;
  fechaPedido: string;
  estado: 'Pendiente' | 'Confirmado' | 'Enviado' | 'Entregado';
  items: ItemPedido[];
  subtotal: number;
  iva: number;
  total: number;
  metodoPago: string;
  observaciones: string;
  createdAt: string;
}

export default function PedidosManager() {
  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [clientes, setClientes] = useState(() => {
    const stored = localStorage.getItem(CLIENTES_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [productos, setProductos] = useState(() => {
    const stored = localStorage.getItem(PRODUCTOS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [viewingPedido, setViewingPedido] = useState<Pedido | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteSearch, setClienteSearch] = useState('');
  
  const [formData, setFormData] = useState({
    tipo: 'Pedido' as 'Pedido',
    clienteId: '',
    fechaPedido: new Date().toISOString().split('T')[0],
    metodoPago: 'Efectivo',
    observaciones: '',
    items: [] as ItemPedido[]
  });

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    tipoDoc: 'CC',
    numeroDoc: '',
    telefono: '',
    email: '',
    direccion: ''
  });

  const [nuevoItem, setNuevoItem] = useState({
    productoId: '',
    talla: '',
    color: '',
    cantidad: '1',
    precioUnitario: ''
  });

  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
  }, [pedidos]);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedProductos = localStorage.getItem(PRODUCTOS_KEY);
      const storedClientes = localStorage.getItem(CLIENTES_KEY);
      if (storedProductos) setProductos(JSON.parse(storedProductos));
      if (storedClientes) setClientes(JSON.parse(storedClientes));
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const generarNumeroPedido = () => {
    const ultimoPedido = pedidos.length > 0 
      ? Math.max(...pedidos.map(p => parseInt(p.numeroPedido.split('-')[1])))
      : 0;
    const nuevoNumero = (ultimoPedido + 1).toString().padStart(3, '0');
    return `PED-${nuevoNumero}`;
  };

  const calcularTotales = (items: ItemPedido[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  const handleCreate = () => {
    setEditingPedido(null);
    setFormData({
      tipo: 'Pedido',
      clienteId: '',
      fechaPedido: new Date().toISOString().split('T')[0],
      metodoPago: 'Efectivo',
      observaciones: '',
      items: []
    });
    setNuevoItem({
      productoId: '',
      talla: '',
      color: '',
      cantidad: '1',
      precioUnitario: ''
    });
    setShowModal(true);
  };

  const handleEdit = (pedido: Pedido) => {
    setEditingPedido(pedido);
    setFormData({
      tipo: pedido.tipo,
      clienteId: pedido.clienteId,
      fechaPedido: pedido.fechaPedido,
      metodoPago: pedido.metodoPago,
      observaciones: pedido.observaciones,
      items: pedido.items
    });
    setShowModal(true);
  };

  const getProductoSeleccionado = () => {
    return productos.find((p: any) => p.id.toString() === nuevoItem.productoId);
  };

  const getTallasDisponibles = () => {
    const producto = getProductoSeleccionado();
    if (!producto || !producto.variantes) return [];
    return producto.variantes.map((v: any) => v.talla);
  };

  const getColoresDisponibles = () => {
    const producto = getProductoSeleccionado();
    if (!producto || !producto.variantes || !nuevoItem.talla) return [];
    const variante = producto.variantes.find((v: any) => v.talla === nuevoItem.talla);
    if (!variante) return [];
    return variante.colores.map((c: any) => c.color);
  };

  const agregarItem = () => {
    if (!nuevoItem.productoId || !nuevoItem.talla || !nuevoItem.color || !nuevoItem.cantidad) {
      alert('Completa todos los campos del producto');
      return;
    }

    const producto = productos.find((p: any) => p.id.toString() === nuevoItem.productoId);
    if (!producto) return;

    const cantidad = parseInt(nuevoItem.cantidad);
    const precioUnitario = producto.precioVenta;
    const subtotal = cantidad * precioUnitario;

    const item: ItemPedido = {
      id: Date.now().toString(),
      productoId: nuevoItem.productoId,
      productoNombre: producto.nombre,
      talla: nuevoItem.talla,
      color: nuevoItem.color,
      cantidad,
      precioUnitario,
      subtotal
    };

    setFormData({
      ...formData,
      items: [...formData.items, item]
    });

    setNuevoItem({
      productoId: '',
      talla: '',
      color: '',
      cantidad: '1',
      precioUnitario: ''
    });
  };

  const eliminarItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== itemId)
    });
  };

  const handleSave = () => {
    // Validar campos obligatorios
    const errors: any = {};
    
    if (!formData.clienteId) {
      errors.clienteId = 'Debes seleccionar un cliente';
    }

    if (!formData.fechaPedido) {
      errors.fechaPedido = 'La fecha del pedido es obligatoria';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (formData.items.length === 0) {
      alert('Agrega al menos un producto');
      return;
    }

    const cliente = clientes.find((c: any) => c.id.toString() === formData.clienteId);
    if (!cliente) return;

    const totales = calcularTotales(formData.items);

    const pedidoData: Pedido = {
      id: editingPedido?.id || Date.now(),
      numeroPedido: editingPedido?.numeroPedido || generarNumeroPedido(),
      tipo: formData.tipo,
      clienteId: formData.clienteId,
      clienteNombre: cliente.nombre,
      fechaPedido: formData.fechaPedido,
      estado: 'Pendiente',
      items: formData.items,
      subtotal: totales.subtotal,
      iva: totales.iva,
      total: totales.total,
      metodoPago: formData.metodoPago,
      observaciones: formData.observaciones,
      createdAt: editingPedido?.createdAt || new Date().toISOString()
    };

    if (editingPedido) {
      setPedidos(pedidos.map(p => p.id === editingPedido.id ? pedidoData : p));
    } else {
      setPedidos([...pedidos, pedidoData]);
    }

    setShowModal(false);
  };

  const handleDelete = (pedido: Pedido) => {
    if (confirm(`¿Eliminar el ${pedido.tipo.toLowerCase()} ${pedido.numeroPedido}?`)) {
      setPedidos(pedidos.filter(p => p.id !== pedido.id));
    }
  };

  const cambiarEstado = (pedido: Pedido, nuevoEstado: Pedido['estado']) => {
    setPedidos(pedidos.map(p => 
      p.id === pedido.id ? { ...p, estado: nuevoEstado } : p
    ));
  };

  const handleCrearCliente = () => {
    if (!nuevoCliente.nombre || !nuevoCliente.numeroDoc || !nuevoCliente.telefono) {
      alert('Completa los campos obligatorios');
      return;
    }

    const clienteData = {
      id: Date.now(),
      ...nuevoCliente,
      activo: true,
      createdAt: new Date().toISOString()
    };

    const clientesActuales = JSON.parse(localStorage.getItem(CLIENTES_KEY) || '[]');
    localStorage.setItem(CLIENTES_KEY, JSON.stringify([...clientesActuales, clienteData]));
    
    setClientes([...clientes, clienteData]);
    setFormData({ ...formData, clienteId: clienteData.id.toString() });
    setShowClienteModal(false);
    setNuevoCliente({
      nombre: '',
      tipoDoc: 'CC',
      numeroDoc: '',
      telefono: '',
      email: '',
      direccion: ''
    });
  };

  const descargarComprobante = (pedido: Pedido) => {
    const contenido = `
=================================
${pedido.tipo.toUpperCase()}
${pedido.numeroPedido}
=================================

Fecha: ${new Date(pedido.fechaPedido).toLocaleDateString()}
Cliente: ${pedido.clienteNombre}
Estado: ${pedido.estado}

---------------------------------
PRODUCTOS
---------------------------------
${pedido.items.map(item => `
${item.productoNombre}
Talla: ${item.talla} | Color: ${item.color}
Cantidad: ${item.cantidad} x $${item.precioUnitario.toLocaleString()}
Subtotal: $${item.subtotal.toLocaleString()}
`).join('\n')}

---------------------------------
TOTALES
---------------------------------
Subtotal: $${pedido.subtotal.toLocaleString()}
IVA (19%): $${pedido.iva.toLocaleString()}
TOTAL: $${pedido.total.toLocaleString()}

Método de Pago: ${pedido.metodoPago}

${pedido.observaciones ? `Observaciones:\n${pedido.observaciones}` : ''}

=================================
DAMABELLA - Moda Femenina
=================================
    `.trim();

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pedido.numeroPedido}.txt`;
    a.click();
  };

  const filteredPedidos = pedidos.filter(p =>
    p.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClientes = clientes.filter((c: any) =>
    c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) ||
    c.numeroDoc.includes(clienteSearch) ||
    (c.telefono && c.telefono.includes(clienteSearch))
  );

  const getEstadoColor = (estado: Pedido['estado']) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-700';
      case 'Confirmado': return 'bg-blue-100 text-blue-700';
      case 'Enviado': return 'bg-purple-100 text-purple-700';
      case 'Entregado': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totales = calcularTotales(formData.items);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Pedidos</h2>
          <p className="text-gray-600">Administra pedidos y cotizaciones con IVA incluido</p>
        </div>
        <Button onClick={handleCreate} variant="primary">
          <Plus size={20} />
          Nuevo Pedido
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar por número, cliente o estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Pedidos Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-gray-600">Número</th>
                <th className="text-left py-4 px-6 text-gray-600">Cliente</th>
                <th className="text-left py-4 px-6 text-gray-600">Fecha</th>
                <th className="text-right py-4 px-6 text-gray-600">Total</th>
                <th className="text-center py-4 px-6 text-gray-600">Estado</th>
                <th className="text-right py-4 px-6 text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <ShoppingCart className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron pedidos</p>
                  </td>
                </tr>
              ) : (
                filteredPedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="text-gray-900">{pedido.numeroPedido}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{pedido.clienteNombre}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {new Date(pedido.fechaPedido).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right text-gray-900">
                      ${pedido.total.toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm ${getEstadoColor(pedido.estado)}`}>
                          {pedido.estado}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setViewingPedido(pedido); setShowDetailModal(true); }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => descargarComprobante(pedido)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          title="Descargar"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(pedido)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(pedido)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
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

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPedido ? `Editar Pedido` : 'Nuevo Pedido'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Cliente */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-700">Cliente *</label>
              <button
                onClick={() => setShowClienteModal(true)}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm"
              >
                <UserPlus size={14} />
                Nuevo Cliente
              </button>
            </div>
            <select
              value={formData.clienteId}
              onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((cliente: any) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} - {cliente.numeroDoc}
                </option>
              ))}
            </select>
            {formErrors.clienteId && <p className="text-red-500 text-sm mt-1">{formErrors.clienteId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Fecha *</label>
              <Input
                type="date"
                value={formData.fechaPedido}
                onChange={(e) => setFormData({ ...formData, fechaPedido: e.target.value })}
                required
              />
              {formErrors.fechaPedido && <p className="text-red-500 text-sm mt-1">{formErrors.fechaPedido}</p>}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Método de Pago *</label>
              <select
                value={formData.metodoPago}
                onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Nequi">Nequi</option>
                <option value="Daviplata">Daviplata</option>
              </select>
            </div>
          </div>

          {/* Productos */}
          <div className="border-t pt-4">
            <h4 className="text-gray-900 mb-3">Agregar Productos</h4>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
              <div>
                <label className="block text-gray-700 mb-2 text-sm">Producto</label>
                <select
                  value={nuevoItem.productoId}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, productoId: e.target.value, talla: '', color: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">Seleccionar producto...</option>
                  {productos.filter((p: any) => p.activo).map((producto: any) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} - ${(producto.precioVenta || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {nuevoItem.productoId && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid grid-cols-2 gap-3">
  <div>
    <label className="block text-gray-700 mb-2 text-sm">Talla</label>
    <select
      value={nuevoItem.talla}
      onChange={(e) => setNuevoItem({ ...nuevoItem, talla: e.target.value, color: '' })}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
    >
      <option value="">Seleccionar...</option>
      {getTallasDisponibles().map((talla: string) => (
        <option key={talla} value={talla}>{talla}</option>
      ))}
    </select>
  </div>

  <div>
    <label className="block text-gray-700 mb-2 text-sm">Color</label>
    <select
      value={nuevoItem.color}
      onChange={(e) => setNuevoItem({ ...nuevoItem, color: e.target.value })}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
      disabled={!nuevoItem.talla}
    >
      <option value="">Seleccionar...</option>
      {getColoresDisponibles().map((color: string) => (
        <option key={color} value={color}>{color}</option>
      ))}
    </select>
  </div>
</div>

                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">Cantidad</label>
                    <Input
                      type="number"
                      min="1"
                      value={nuevoItem.cantidad}
                      onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                </>
              )}

              <Button onClick={agregarItem} variant="secondary" className="w-full">
                <Plus size={16} />
                Agregar Producto
              </Button>
            </div>

            {/* Lista de items */}
            {formData.items.length > 0 && (
              <div className="space-y-2">
                {formData.items.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-white flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-gray-900">{item.productoNombre}</div>
                      <div className="text-sm text-gray-600">
                        Talla: {item.talla} | Color: {item.color} | Cant: {item.cantidad} x ${item.precioUnitario.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-gray-900">${item.subtotal.toLocaleString()}</div>
                      <button
                        onClick={() => eliminarItem(item.id)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales */}
          {formData.items.length > 0 && (
            <div className="border-t pt-4 bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>${totales.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>IVA (19%):</span>
                  <span>${totales.iva.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-900 pt-2 border-t">
                  <span>Total:</span>
                  <span>${totales.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-gray-700 mb-2">Observaciones</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows={3}
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={() => setShowModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="primary">
              {editingPedido ? 'Guardar Cambios' : `Crear ${formData.tipo}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Detalle */}
      {viewingPedido && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Detalle ${viewingPedido.tipo} ${viewingPedido.numeroPedido}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600 mb-1">Cliente</div>
                <div className="text-gray-900">{viewingPedido.clienteNombre}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Fecha</div>
                <div className="text-gray-900">
                  {new Date(viewingPedido.fechaPedido).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Estado</div>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm ${getEstadoColor(viewingPedido.estado)}`}>
                  {viewingPedido.estado}
                </span>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Método de Pago</div>
                <div className="text-gray-900">{viewingPedido.metodoPago}</div>
              </div>
            </div>

            <div>
              <h4 className="text-gray-900 mb-3">Productos</h4>
              <div className="space-y-2">
                {viewingPedido.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
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

            <div className="border-t pt-4 bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>${viewingPedido.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>IVA (19%):</span>
                  <span>${viewingPedido.iva.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-900 pt-2 border-t">
                  <span>Total:</span>
                  <span>${viewingPedido.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {viewingPedido.observaciones && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Observaciones</div>
                <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {viewingPedido.observaciones}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="text-sm text-gray-600 mb-2">Cambiar Estado</div>
              <div className="flex flex-wrap gap-2">
                {(['Pendiente', 'Confirmado', 'Enviado', 'Entregado'] as const).map(estado => (
                  <button
                    key={estado}
                    onClick={() => {
                      cambiarEstado(viewingPedido, estado);
                      setViewingPedido({ ...viewingPedido, estado });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      viewingPedido.estado === estado
                        ? getEstadoColor(estado) + ' ring-2 ring-gray-400'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {estado}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Crear Cliente */}
      <Modal
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        title="Nuevo Cliente"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Nombre Completo *</label>
            <Input
              value={nuevoCliente.nombre}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
              placeholder="Nombre del cliente"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Tipo de Documento *</label>
              <select
                value={nuevoCliente.tipoDoc}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipoDoc: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="PAS">Pasaporte</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Número de Documento *</label>
              <Input
                value={nuevoCliente.numeroDoc}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, numeroDoc: e.target.value })}
                placeholder="1234567890"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Teléfono *</label>
            <Input
              value={nuevoCliente.telefono}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
              placeholder="3001234567"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Correo Electrónico</label>
            <Input
              type="email"
              value={nuevoCliente.email}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Dirección</label>
            <Input
              value={nuevoCliente.direccion}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
              placeholder="Calle 123 # 45-67"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={() => setShowClienteModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleCrearCliente} variant="primary">
              Crear Cliente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
