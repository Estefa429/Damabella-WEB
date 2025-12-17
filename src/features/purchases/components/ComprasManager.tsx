import React, { useState, useEffect } from 'react';
import { Plus, Search, Truck, Eye, X, Ban, AlertTriangle } from 'lucide-react';
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
    if (stored) {
      return JSON.parse(stored);
    }
    // Productos temporales - Ropa femenina
    return [
      {
        id: '1',
        nombre: 'Vestido Corto Casual',
        referencia: 'VES-CORTA-001',
        codigoInterno: 'VCC-001',
        precioVenta: 65000,
        activo: true,
        tallas: ['XS', 'S', 'M', 'L', 'XL'],
        colores: ['Rojo', 'Negro', 'Blanco', 'Azul', 'Rosa'],
      },
      {
        id: '2',
        nombre: 'Vestido Largo Elegante',
        referencia: 'VES-LARGO-002',
        codigoInterno: 'VLE-002',
        precioVenta: 95000,
        activo: true,
        tallas: ['XS', 'S', 'M', 'L', 'XL'],
        colores: ['Negro', 'Rojo', 'Champagne', 'Azul Marino'],
      },
      {
        id: '3',
        nombre: 'Enterizo Ejecutivo',
        referencia: 'ENT-EJE-003',
        codigoInterno: 'ENE-003',
        precioVenta: 85000,
        activo: true,
        tallas: ['XS', 'S', 'M', 'L', 'XL'],
        colores: ['Negro', 'Blanco', 'Gris', 'Azul'],
      },
      {
        id: '4',
        nombre: 'Set Blusa y Falda',
        referencia: 'SET-BF-004',
        codigoInterno: 'SBF-004',
        precioVenta: 105000,
        activo: true,
        tallas: ['XS', 'S', 'M', 'L', 'XL'],
        colores: ['Rosa', 'Blanco', 'Negro', 'Beige'],
      },
      {
        id: '5',
        nombre: 'Vestido Midi Floral',
        referencia: 'VES-MIDI-005',
        codigoInterno: 'VMF-005',
        precioVenta: 75000,
        activo: true,
        tallas: ['XS', 'S', 'M', 'L', 'XL'],
        colores: ['Multicolor', 'Rosa Pálido', 'Azul Claro', 'Verde Menta'],
      },
    ];
  });

  const [tallas, setTallas] = useState(() => {
    const stored = localStorage.getItem('damabella_tallas');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((t: any) => t.abbreviation || t.name || t).filter(Boolean);
      } catch {
        return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      }
    }
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  });

  const [coloresDisponibles, setColoresDisponibles] = useState(() => {
    const stored = localStorage.getItem('damabella_colores');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((c: any) => c.name || c.nombre || '').filter(Boolean);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingCompra, setViewingCompra] = useState<Compra | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [proveedorSearchTerm, setProveedorSearchTerm] = useState('');
  const [productoSearchTerm, setProductoSearchTerm] = useState('');
  const [showProveedorDropdown, setShowProveedorDropdown] = useState(false);
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'error' | 'success' | 'warning'>('error');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  
  const [formData, setFormData] = useState({
    proveedorId: '',
    fechaCompra: new Date().toISOString().split('T')[0],
    iva: '19',
    observaciones: '',
    items: [] as ItemCompra[]
  });

  const [formErrors, setFormErrors] = useState<any>({});
  const [itemsError, setItemsError] = useState<string>('');

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
    setItemsError('');
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
    p.activo && (p.nombre?.toLowerCase() ?? '').includes(proveedorSearchTerm.toLowerCase())
  );

  const filteredProductos = productos.filter((p: any) => 
    p.activo && (p.nombre?.toLowerCase() ?? '').includes(productoSearchTerm.toLowerCase())
  );

  const agregarItem = () => {
    if (!nuevoItem.productoId || !nuevoItem.cantidad || !nuevoItem.precioCompra || !nuevoItem.precioVenta) {
      setNotificationMessage('Por favor completa todos los campos del item');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    const producto = productos.find((p: any) => String(p.id) === String(nuevoItem.productoId));
    
    // Si no existe en BD pero está en las opciones temporales, usar el nombre del select
    let productoNombre = producto?.nombre;
    if (!productoNombre) {
      const productosTemporales: any = {
        'prod1': 'Camisa',
        'prod2': 'Pantalón',
        'prod3': 'Blusa',
        'prod4': 'Chaqueta'
      };
      productoNombre = productosTemporales[nuevoItem.productoId] || 'Producto desconocido';
    }

    const cantidad = parseFloat(nuevoItem.cantidad);
    const precioCompra = parseFloat(nuevoItem.precioCompra);
    const precioVenta = parseFloat(nuevoItem.precioVenta);
    const subtotal = cantidad * precioCompra;

    const item: ItemCompra = {
      id: Date.now().toString(),
      productoId: nuevoItem.productoId,
      productoNombre,
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
      setItemsError('Debes agregar al menos un producto a la compra');
      return;
    }

    setItemsError('');

    // Mapeo temporal de proveedores
    const proveedoresTemporales: any = {
      'prov1': 'Proveedor A',
      'prov2': 'Proveedor B',
      'prov3': 'Proveedor C'
    };

    const proveedorNombre = proveedoresTemporales[formData.proveedorId] || formData.proveedorId;

    const subtotal = calcularSubtotal();
    const iva = calcularIVA();
    const total = calcularTotal();
    const numeroCompra = `COMP-${compraCounter.toString().padStart(3, '0')}`;

    const compraData: Compra = {
      id: Date.now(),
      numeroCompra,
      proveedorId: formData.proveedorId,
      proveedorNombre,
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
    setConfirmMessage('¿Está seguro de anular esta compra? Esta acción no se puede deshacer.');
    setConfirmAction(() => () => {
      setCompras(compras.map(c => 
        c.id === id ? { ...c, estado: 'Anulada' as 'Anulada' } : c
      ));
      setShowConfirmModal(false);
      setNotificationMessage('Compra anulada correctamente');
      setNotificationType('success');
      setShowNotificationModal(true);
    });
    setShowConfirmModal(true);
  };

  const cambiarEstado = (id: number, nuevoEstado: 'Pendiente' | 'Recibida') => {
    setConfirmMessage(`¿Está seguro de cambiar el estado a "${nuevoEstado}"?`);
    setConfirmAction(() => () => {
      setCompras(compras.map(c => 
        c.id === id ? { ...c, estado: nuevoEstado } : c
      ));
      setShowConfirmModal(false);
      setNotificationMessage(`Estado cambiado a "${nuevoEstado}"`);
      setNotificationType('success');
      setShowNotificationModal(true);
    });
    setShowConfirmModal(true);
  };

  const filteredCompras = compras.filter(c =>
    (c.numeroCompra?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (c.proveedorNombre?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
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
              <select
                value={formData.proveedorId}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, proveedorId: val });
                  setFormErrors({ ...formErrors, proveedorId: undefined });
                  const sel = proveedores.find((p: any) => String(p.id) === String(val));
                  setProveedorSearchTerm(sel ? sel.nombre : '');
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${formErrors.proveedorId ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Seleccionar proveedor...</option>
                <option value="prov1">Proveedor A</option>
                <option value="prov2">Proveedor B</option>
                <option value="prov3">Proveedor C</option>
              </select>
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
            
            {itemsError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle size={16} />
                {itemsError}
              </div>
            )}
            
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-gray-700 mb-2 text-sm">Producto</label>
                <select
                  value={nuevoItem.productoId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNuevoItem({ ...nuevoItem, productoId: val });
                    const sel = productos.find((p:any) => String(p.id) === String(val));
                    setProductoSearchTerm(sel ? sel.nombre : '');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">Seleccionar producto...</option>
                  <option value="prod1">Camisa</option>
                  <option value="prod2">Pantalón</option>
                  <option value="prod3">Blusa</option>
                  <option value="prod4">Chaqueta</option>
                  {productos.filter((p:any)=>p.activo).map((p:any) => (
                    <option key={p.id} value={String(p.id)}>{p.nombre} {p.categoria ? ` - ${p.categoria}` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Talla (Opcional)</label>
                  <select
                    value={nuevoItem.talla}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, talla: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="">Seleccionar talla...</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    {tallas.map(talla => (
                      <option key={talla} value={talla}>{talla}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Color (Opcional)</label>
                  <select
                    value={nuevoItem.color}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="">Seleccionar color...</option>
                    <option value="Rojo">Rojo</option>
                    <option value="Negro">Negro</option>
                    <option value="Blanco">Blanco</option>
                    <option value="Azul">Azul</option>
                    {coloresDisponibles.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
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
                      <th className="text-left py-2 px-3 text-gray-600">Talla</th>
                      <th className="text-left py-2 px-3 text-gray-600">Color</th>
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
                        <td className="py-2 px-3 text-gray-700">{item.talla || '-'}</td>
                        <td className="py-2 px-3 text-gray-700">{item.color || '-'}</td>
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
                      <th className="text-left py-2 px-3 text-gray-600">Talla</th>
                      <th className="text-left py-2 px-3 text-gray-600">Color</th>
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
                        <td className="py-2 px-3 text-gray-700">{item.talla || '-'}</td>
                        <td className="py-2 px-3 text-gray-700">{item.color || '-'}</td>
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

      {/* Modal Notificación */}
      <Modal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        title={notificationType === 'error' ? 'Error' : notificationType === 'success' ? 'Éxito' : 'Advertencia'}
      >
        <div className="space-y-4">
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            notificationType === 'error' ? 'bg-red-50 border-red-200' :
            notificationType === 'success' ? 'bg-green-50 border-green-200' :
            'bg-yellow-50 border-yellow-200'
          }`}>
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${
              notificationType === 'error' ? 'bg-red-600' :
              notificationType === 'success' ? 'bg-green-600' :
              'bg-yellow-600'
            }`}>
              {notificationType === 'error' ? '!' : notificationType === 'success' ? '✓' : '⚠'}
            </div>
            <p className={notificationType === 'error' ? 'text-red-800' : 
                        notificationType === 'success' ? 'text-green-800' : 'text-yellow-800'}>
              {notificationMessage}
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowNotificationModal(false)} variant="primary">
              Aceptar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmación */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar acción"
      >
        <div className="space-y-4">
          <p className="text-gray-700">{confirmMessage}</p>
          <div className="flex gap-3 justify-end">
            <Button 
              onClick={() => setShowConfirmModal(false)} 
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => confirmAction && confirmAction()} 
              variant="primary"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
