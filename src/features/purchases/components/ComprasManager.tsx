import React, { useState, useEffect } from 'react';
import { Plus, Search, Truck, Eye, X, Ban } from 'lucide-react';
import { Button, Input, Modal } from '../../../shared/components/native';

const STORAGE_KEY = 'damabella_compras';
const PROVEEDORES_KEY = 'damabella_proveedores';
const PRODUCTOS_KEY = 'damabella_productos';

interface ItemCompra {
  id: string;
  productoId: string;
  productoNombre: string;
  talla?: string;
  color?: string;
  cantidad: number;
  precioCompra: number;
  precioVenta: number;
  subtotal: number;
}

interface Compra {
  id: number;
  numeroCompra: string;
  proveedorId: string;
  proveedorNombre: string;
  fechaCompra: string;
  fechaRegistro: string;
  items: ItemCompra[];
  subtotal: number;
  iva: number;
  total: number;
  estado: 'Pendiente' | 'Recibida' | 'Anulada';
  observaciones: string;
  createdAt: string;
}

export function ComprasManager() {
  const [compras, setCompras] = useState<Compra[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [proveedores, setProveedores] = useState(() => {
    const stored = localStorage.getItem(PROVEEDORES_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [productos, setProductos] = useState(() => {
    const stored = localStorage.getItem(PRODUCTOS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingCompra, setViewingCompra] = useState<Compra | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [proveedorSearchTerm, setProveedorSearchTerm] = useState('');
  const [productoSearchTerm, setProductoSearchTerm] = useState('');
  const [showProveedorDropdown, setShowProveedorDropdown] = useState(false);
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    proveedorId: '',
    fechaCompra: new Date().toISOString().split('T')[0],
    iva: '19',
    observaciones: '',
    items: [] as ItemCompra[]
  });

  const [formErrors, setFormErrors] = useState<any>({});

  const [nuevoItem, setNuevoItem] = useState({
    productoId: '',
    talla: '',
    color: '',
    cantidad: '',
    precioCompra: '',
    precioVenta: ''
  });

  // Contador para el número de compra
  const [compraCounter, setCompraCounter] = useState(() => {
    const counter = localStorage.getItem('damabella_compra_counter');
    return counter ? parseInt(counter) : 1;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compras));
  }, [compras]);

  useEffect(() => {
    localStorage.setItem('damabella_compra_counter', compraCounter.toString());
  }, [compraCounter]);

  const validateField = (field: string, value: any) => {
    const errors: any = {};
    
    if (field === 'proveedorId') {
      if (!value) {
        errors.proveedorId = 'Debes seleccionar un proveedor';
      }
    }
    
    if (field === 'fechaCompra') {
      if (!value) {
        errors.fechaCompra = 'La fecha es obligatoria';
      }
    }

    if (field === 'iva') {
      if (!value || parseFloat(value) < 0) {
        errors.iva = 'El IVA debe ser mayor o igual a 0';
      }
    }
    
    return errors;
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    const fieldErrors = validateField(field, value);
    setFormErrors({ ...formErrors, [field]: fieldErrors[field] });
  };

  const handleCreate = () => {
    setFormData({
      proveedorId: '',
      fechaCompra: new Date().toISOString().split('T')[0],
      iva: '19',
      observaciones: '',
      items: []
    });
    setNuevoItem({
      productoId: '',
      talla: '',
      color: '',
      cantidad: '',
      precioCompra: '',
      precioVenta: ''
    });
    setFormErrors({});
    setProveedorSearchTerm('');
    setProductoSearchTerm('');
    setShowModal(true);
  };

  const handleView = (compra: Compra) => {
    setViewingCompra(compra);
    setShowDetailModal(true);
  };

  const handleSelectProveedor = (proveedorId: string, proveedorNombre: string) => {
    setFormData({ ...formData, proveedorId });
    setProveedorSearchTerm(proveedorNombre);
    setShowProveedorDropdown(false);
    setFormErrors({ ...formErrors, proveedorId: undefined });
  };

  const handleSelectProducto = (productoId: string, productoNombre: string) => {
    setNuevoItem({ ...nuevoItem, productoId });
    setProductoSearchTerm(productoNombre);
    setShowProductoDropdown(false);
  };

  const filteredProveedores = proveedores.filter((p: any) => 
    p.activo && p.nombre.toLowerCase().includes(proveedorSearchTerm.toLowerCase())
  );

  const filteredProductos = productos.filter((p: any) => 
    p.activo && p.nombre.toLowerCase().includes(productoSearchTerm.toLowerCase())
  );

  const agregarItem = () => {
    if (!nuevoItem.productoId || !nuevoItem.cantidad || !nuevoItem.precioCompra || !nuevoItem.precioVenta) {
      alert('Por favor completa todos los campos del item');
      return;
    }

    const producto = productos.find((p: any) => p.id.toString() === nuevoItem.productoId);
    if (!producto) return;

    const cantidad = parseFloat(nuevoItem.cantidad);
    const precioCompra = parseFloat(nuevoItem.precioCompra);
    const precioVenta = parseFloat(nuevoItem.precioVenta);
    const subtotal = cantidad * precioCompra;

    const item: ItemCompra = {
      id: Date.now().toString(),
      productoId: nuevoItem.productoId,
      productoNombre: producto.nombre,
      talla: nuevoItem.talla,
      color: nuevoItem.color,
      cantidad,
      precioCompra,
      precioVenta,
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
      cantidad: '',
      precioCompra: '',
      precioVenta: ''
    });
    setProductoSearchTerm('');
  };

  const eliminarItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== itemId)
    });
  };

  const calcularSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  };

  const calcularIVA = () => {
    const subtotal = calcularSubtotal();
    const ivaPercent = parseFloat(formData.iva) || 0;
    return (subtotal * ivaPercent) / 100;
  };

  const calcularTotal = () => {
    return calcularSubtotal() + calcularIVA();
  };

  const handleSave = () => {
    // Validar todos los campos
    const allErrors: any = {};
    ['proveedorId', 'fechaCompra', 'iva'].forEach(field => {
      const fieldErrors = validateField(field, (formData as any)[field]);
      if (fieldErrors[field]) {
        allErrors[field] = fieldErrors[field];
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    if (formData.items.length === 0) {
      alert('Debes agregar al menos un producto a la compra');
      return;
    }

    const proveedor = proveedores.find((p: any) => p.id.toString() === formData.proveedorId);
    if (!proveedor) {
      alert('Proveedor no encontrado');
      return;
    }

    const subtotal = calcularSubtotal();
    const iva = calcularIVA();
    const total = calcularTotal();
    const numeroCompra = `COMP-${compraCounter.toString().padStart(3, '0')}`;

    const compraData: Compra = {
      id: Date.now(),
      numeroCompra,
      proveedorId: formData.proveedorId,
      proveedorNombre: proveedor.nombre,
      fechaCompra: formData.fechaCompra,
      fechaRegistro: new Date().toISOString().split('T')[0],
      items: formData.items,
      subtotal,
      iva,
      total,
      estado: 'Pendiente',
      observaciones: formData.observaciones,
      createdAt: new Date().toISOString()
    };

    setCompras([...compras, compraData]);
    setCompraCounter(compraCounter + 1);
    setShowModal(false);
  };

  const anularCompra = (id: number) => {
    if (confirm('¿Está seguro de anular esta compra? Esta acción no se puede deshacer.')) {
      setCompras(compras.map(c => 
        c.id === id ? { ...c, estado: 'Anulada' as 'Anulada' } : c
      ));
    }
  };

  const cambiarEstado = (id: number, nuevoEstado: 'Pendiente' | 'Recibida') => {
    if (confirm(`¿Está seguro de cambiar el estado a "${nuevoEstado}"?`)) {
      setCompras(compras.map(c => 
        c.id === id ? { ...c, estado: nuevoEstado } : c
      ));
    }
  };

  const filteredCompras = compras.filter(c =>
    c.numeroCompra.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.proveedorNombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Compras</h2>
          <p className="text-gray-600">Administra las compras a proveedores</p>
        </div>
        <Button onClick={handleCreate} variant="primary">
          <Plus size={20} />
          Nueva Compra
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar compras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Compras List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-gray-600">N° Compra</th>
                <th className="text-left py-4 px-6 text-gray-600">Proveedor</th>
                <th className="text-left py-4 px-6 text-gray-600">Fecha Compra</th>
                <th className="text-left py-4 px-6 text-gray-600">Fecha Registro</th>
                <th className="text-center py-4 px-6 text-gray-600">Items</th>
                <th className="text-right py-4 px-6 text-gray-600">Total</th>
                <th className="text-center py-4 px-6 text-gray-600">Estado</th>
                <th className="text-right py-4 px-6 text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCompras.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <Truck className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron compras</p>
                  </td>
                </tr>
              ) : (
                filteredCompras.map((compra) => (
                  <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-gray-400" />
                        <span className="text-gray-900 font-medium">{compra.numeroCompra}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-700">{compra.proveedorNombre}</td>
                    <td className="py-4 px-6 text-gray-600">{compra.fechaCompra}</td>
                    <td className="py-4 px-6 text-gray-600">{compra.fechaRegistro}</td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleView(compra)}
                        className="text-gray-600 hover:text-gray-900 underline"
                      >
                        {compra.items.length} items
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right text-gray-900 font-semibold">${compra.total.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        {compra.estado === 'Anulada' ? (
                          <span className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-700">
                            Anulada
                          </span>
                        ) : (
                          <select
                            value={compra.estado}
                            onChange={(e) => cambiarEstado(compra.id, e.target.value as any)}
                            className={`px-3 py-1 rounded-full text-xs border-0 cursor-pointer ${
                              compra.estado === 'Recibida' ? 'bg-green-100 text-green-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Recibida">Recibida</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleView(compra)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>
                        {compra.estado !== 'Anulada' && (
                          <button
                            onClick={() => anularCompra(compra.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                            title="Anular compra"
                          >
                            <Ban size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Compra */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva Compra"
        size="lg"
      >
        <div className="space-y-6">
          {/* Datos generales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Proveedor *</label>
              <div className="relative">
                <Input
                  value={proveedorSearchTerm}
                  onChange={(e) => {
                    setProveedorSearchTerm(e.target.value);
                    setShowProveedorDropdown(true);
                    if (!e.target.value) {
                      setFormData({ ...formData, proveedorId: '' });
                    }
                  }}
                  onFocus={() => setShowProveedorDropdown(true)}
                  placeholder="Buscar proveedor..."
                  className={formErrors.proveedorId ? 'border-red-500' : ''}
                />
                {showProveedorDropdown && filteredProveedores.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredProveedores.map((p: any) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProveedor(p.id.toString(), p.nombre)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{p.nombre}</div>
                        <div className="text-sm text-gray-600">{p.numeroDoc}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {formErrors.proveedorId && (
                <p className="text-red-600 text-xs mt-1">{formErrors.proveedorId}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Fecha de Compra *</label>
              <Input
                type="date"
                value={formData.fechaCompra}
                onChange={(e) => handleFieldChange('fechaCompra', e.target.value)}
                className={formErrors.fechaCompra ? 'border-red-500' : ''}
                required
              />
              {formErrors.fechaCompra && (
                <p className="text-red-600 text-xs mt-1">{formErrors.fechaCompra}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">IVA (%) *</label>
            <Input
              type="number"
              value={formData.iva}
              onChange={(e) => handleFieldChange('iva', e.target.value)}
              placeholder="19"
              className={formErrors.iva ? 'border-red-500' : ''}
              required
            />
            {formErrors.iva && (
              <p className="text-red-600 text-xs mt-1">{formErrors.iva}</p>
            )}
          </div>

          {/* Agregar productos */}
          <div className="border-t pt-4">
            <h4 className="text-gray-900 mb-4">Agregar Productos a la Compra</h4>
            
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-gray-700 mb-2 text-sm">Producto</label>
                <div className="relative">
                  <Input
                    value={productoSearchTerm}
                    onChange={(e) => {
                      setProductoSearchTerm(e.target.value);
                      setShowProductoDropdown(true);
                      if (!e.target.value) {
                        setNuevoItem({ ...nuevoItem, productoId: '' });
                      }
                    }}
                    onFocus={() => setShowProductoDropdown(true)}
                    placeholder="Buscar producto..."
                  />
                  {showProductoDropdown && filteredProductos.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredProductos.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProducto(p.id.toString(), p.nombre)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{p.nombre}</div>
                          <div className="text-sm text-gray-600">{p.categoria}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Talla (Opcional)</label>
                  <Input
                    value={nuevoItem.talla}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, talla: e.target.value })}
                    placeholder="Ej: M, L, XL"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Color (Opcional)</label>
                  <Input
                    value={nuevoItem.color}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, color: e.target.value })}
                    placeholder="Ej: Rojo, Azul"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Cantidad</label>
                  <Input
                    type="number"
                    value={nuevoItem.cantidad}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: e.target.value })}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Precio Compra</label>
                  <Input
                    type="number"
                    value={nuevoItem.precioCompra}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, precioCompra: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Precio Venta</label>
                  <Input
                    type="number"
                    value={nuevoItem.precioVenta}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, precioVenta: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <Button onClick={agregarItem} variant="primary" className="w-full mb-4">
              <Plus size={16} />
              Agregar Producto
            </Button>

            {/* Lista de productos agregados */}
            {formData.items.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 text-gray-600">Producto</th>
                      <th className="text-right py-2 px-3 text-gray-600">Cant.</th>
                      <th className="text-right py-2 px-3 text-gray-600">P. Compra</th>
                      <th className="text-right py-2 px-3 text-gray-600">P. Venta</th>
                      <th className="text-right py-2 px-3 text-gray-600">Subtotal</th>
                      <th className="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 text-gray-900">{item.productoNombre}</td>
                        <td className="py-2 px-3 text-right text-gray-700">{item.cantidad}</td>
                        <td className="py-2 px-3 text-right text-gray-700">${(item.precioCompra || 0).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-gray-700">${(item.precioVenta || 0).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-gray-900">${(item.subtotal || 0).toLocaleString()}</td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => eliminarItem(item.id)}
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totales */}
            {formData.items.length > 0 && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>${calcularSubtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>IVA ({formData.iva}%):</span>
                  <span>${calcularIVA().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-900 pt-2 border-t border-gray-300">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-semibold">${calcularTotal().toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-gray-700 mb-2">Observaciones</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows={3}
              placeholder="Notas adicionales sobre la compra..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={() => setShowModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="primary">
              Crear Compra
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Ver Detalles */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Detalles de la Compra ${viewingCompra?.numeroCompra}`}
      >
        {viewingCompra && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-600 mb-1">Proveedor</div>
                <div className="text-gray-900 font-medium">{viewingCompra.proveedorNombre}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Estado</div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                  viewingCompra.estado === 'Recibida' ? 'bg-green-100 text-green-700' :
                  viewingCompra.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {viewingCompra.estado}
                </span>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Fecha de Compra</div>
                <div className="text-gray-900">{viewingCompra.fechaCompra}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Fecha de Registro</div>
                <div className="text-gray-900">{viewingCompra.fechaRegistro}</div>
              </div>
            </div>

            {viewingCompra.observaciones && (
              <div>
                <div className="text-gray-600 mb-1">Observaciones</div>
                <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingCompra.observaciones}</div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="text-gray-900 font-semibold mb-3">Productos</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 text-gray-600">Producto</th>
                      <th className="text-right py-2 px-3 text-gray-600">Cant.</th>
                      <th className="text-right py-2 px-3 text-gray-600">P. Compra</th>
                      <th className="text-right py-2 px-3 text-gray-600">P. Venta</th>
                      <th className="text-right py-2 px-3 text-gray-600">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewingCompra.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 text-gray-900">{item.productoNombre}</td>
                        <td className="py-2 px-3 text-right text-gray-700">{item.cantidad}</td>
                        <td className="py-2 px-3 text-right text-gray-700">${item.precioCompra.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-gray-700">${item.precioVenta.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-gray-900">${item.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span>${viewingCompra.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>IVA:</span>
                <span>${viewingCompra.iva.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-900 pt-2 border-t border-gray-300">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-semibold">${viewingCompra.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
