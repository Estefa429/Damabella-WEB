import React, { useState, useEffect } from 'react';
import { Plus, Search, Image as ImageIcon, Package, Upload, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Button, Input, Modal } from '../../../../shared/components/native';
import validateField from '../../../../shared/utils/validation';
import { Eye, Edit2, Trash2, X } from 'lucide-react';

const STORAGE_KEY = 'damabella_productos';
const CATEGORIAS_KEY = 'damabella_categorias';
const PROVEEDORES_KEY = 'damabella_proveedores';
const TALLAS_KEY = 'damabella_tallas';
const COLORES_KEY = 'damabella_colores';

interface VarianteTalla {
  talla: string;
  colores: {
    color: string;
    cantidad: number;
  }[];
}

interface Producto {
  id: number;
  nombre: string;
  proveedor: string;
  categoria: string;
  precioVenta: number;
  activo: boolean;
  variantes: VarianteTalla[];
  imagen?: string;
  createdAt: string;
}

export default function ProductosManager() {
  const getColoresTemporales = () => {
    return [
      { nombre: 'Negro', hex: '#000000' },
      { nombre: 'Blanco', hex: '#FFFFFF' },
      { nombre: 'Gris', hex: '#808080' },
      { nombre: 'Azul', hex: '#0000FF' },
      { nombre: 'Rojo', hex: '#FF0000' },
      { nombre: 'Verde', hex: '#008000' },
      { nombre: 'Amarillo', hex: '#FFFF00' },
      { nombre: 'Rosa', hex: '#FFC0CB' },
      { nombre: 'Naranja', hex: '#FFA500' },
      { nombre: 'Púrpura', hex: '#800080' },
      { nombre: 'Beige', hex: '#F5F5DC' },
      { nombre: 'Marrón', hex: '#A52A2A' },
      { nombre: 'Azul Marino', hex: '#000080' },
      { nombre: 'Turquesa', hex: '#40E0D0' },
      { nombre: 'Dorado', hex: '#FFD700' }
    ];
  };

  const [productos, setProductos] = useState<Producto[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [categorias, setCategorias] = useState(() => {
    const stored = localStorage.getItem(CATEGORIAS_KEY);
    return stored ? JSON.parse(stored) : [
      { id: 1, name: 'Vestidos Largos' },
      { id: 2, name: 'Vestidos Cortos' },
      { id: 3, name: 'Sets' },
      { id: 4, name: 'Enterizos' }
    ];
  });

  const [proveedores, setProveedores] = useState(() => {
    const stored = localStorage.getItem(PROVEEDORES_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [tallas, setTallas] = useState(() => {
    const stored = localStorage.getItem(TALLAS_KEY);
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
    const stored = localStorage.getItem(COLORES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((c: any) => ({
          nombre: c.name || c.nombre || '',
          hex: c.hexCode || c.hex || '#000000'
        })).filter((c: any) => c.nombre);
      } catch {
        return getColoresTemporales();
      }
    }
    return getColoresTemporales();
  });

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Producto | null>(null);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    nombre: '',
    proveedor: '',
    categoria: '',
    precioVenta: '',
    imagen: '',
    variantes: [] as VarianteTalla[]
  });

  const [formErrors, setFormErrors] = useState<any>({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [showConfirmToggle, setShowConfirmToggle] = useState(false);
  const [productToToggle, setProductToToggle] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState({ visible: false, message: '', type: 'error' as 'error' | 'success' | 'info' });

  const [nuevaVariante, setNuevaVariante] = useState({
    talla: '',
    colores: [{ color: '', cantidad: 0 }]
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
  }, [productos]);

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      nombre: '',
      proveedor: '',
      categoria: '',
      precioVenta: '',
      imagen: '',
      variantes: []
    });
    setFormErrors({});
    setNuevaVariante({
      talla: '',
      colores: [{ color: '', cantidad: 0 }]
    });
    setShowModal(true);
  };

  const handleEdit = (producto: Producto) => {
    setEditingProduct(producto);
    setFormData({
      nombre: producto.nombre || '',
      proveedor: producto.proveedor || '',
      categoria: producto.categoria || '',
      precioVenta: producto.precioVenta ? producto.precioVenta.toString() : '',
      imagen: producto.imagen || '',
      variantes: producto.variantes && producto.variantes.length > 0 
        ? producto.variantes 
        : []
    });
    setShowModal(true);
  };

  const handleViewDetail = (producto: Producto) => {
    setViewingProduct(producto);
    setShowDetailModal(true);
  };

  const agregarVariante = () => {
    if (!nuevaVariante.talla) {
      setShowAlert({ visible: true, message: 'Debes seleccionar una talla', type: 'error' });
      return;
    }

    const coloresValidos = nuevaVariante.colores.filter(c => c.color && c.cantidad >= 0);
    if (coloresValidos.length === 0) {
      setShowAlert({ visible: true, message: 'Debes agregar al menos un color con cantidad', type: 'error' });
      return;
    }

    // Verificar si ya existe una variante con esa talla
    if (formData.variantes.some(v => v.talla === nuevaVariante.talla)) {
      setShowAlert({ visible: true, message: 'Ya existe una variante con esta talla', type: 'error' });
      return;
    }

    setFormData({
      ...formData,
      variantes: [...formData.variantes, {
        talla: nuevaVariante.talla,
        colores: coloresValidos
      }]
    });

    setNuevaVariante({
      talla: '',
      colores: [{ color: '', cantidad: 0 }]
    });
  };

  const eliminarVariante = (tallaIndex: number) => {
    setFormData({
      ...formData,
      variantes: formData.variantes.filter((_, i) => i !== tallaIndex)
    });
  };

  const handleSave = () => {
    const errors: any = {};
    const nombreErr = validateField('nombre', formData.nombre);
    if (nombreErr) errors.nombre = nombreErr;
    if (!formData.proveedor) errors.proveedor = 'Este campo es obligatorio';
    if (!formData.categoria) errors.categoria = 'Este campo es obligatorio';
    const precioErr = validateField('price', formData.precioVenta);
    if (precioErr) errors.precioVenta = precioErr;

    if (formData.variantes.length === 0) {
      errors.variantes = 'Debes agregar al menos una talla con sus colores';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const productoData = {
      nombre: formData.nombre,
      proveedor: formData.proveedor,
      categoria: formData.categoria,
      precioVenta: parseFloat(formData.precioVenta),
      activo: editingProduct ? editingProduct.activo : true,
      variantes: formData.variantes,
      imagen: formData.imagen,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString()
    };

    if (editingProduct) {
      setProductos(productos.map(p => 
        p.id === editingProduct.id ? { ...p, ...productoData } : p
      ));
      setShowAlert({ visible: true, message: 'Producto actualizado exitosamente', type: 'success' });
    } else {
      setProductos([...productos, { id: Date.now(), ...productoData }]);
      setShowAlert({ visible: true, message: 'Producto creado exitosamente', type: 'success' });
    }
    
    setShowModal(false);
    setFormErrors({});
    setNuevaVariante({ talla: '', colores: [{ color: '', cantidad: 0 }] });
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    let err = '';
    if (field === 'nombre') err = validateField('nombre', value);
    else if (field === 'precioVenta') err = validateField('price', value);
    else if (field === 'proveedor' || field === 'categoria') err = value ? '' : 'Este campo es obligatorio';

    if (err) setFormErrors({ ...formErrors, [field]: err });
    else {
      const { [field]: _removed, ...rest } = formErrors;
      setFormErrors(rest);
    }
  };

  const handleDelete = (id: number) => {
    setProductToDelete(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      setProductos(productos.filter(p => p.id !== productToDelete));
      setShowAlert({ visible: true, message: 'Producto eliminado exitosamente', type: 'success' });
    }
    setShowConfirmDelete(false);
    setProductToDelete(null);
  };

  const toggleActive = (id: number) => {
    setProductToToggle(id);
    setShowConfirmToggle(true);
  };

  const confirmToggle = () => {
    if (productToToggle) {
      const producto = productos.find(p => p.id === productToToggle);
      setProductos(productos.map(p => 
        p.id === productToToggle ? { ...p, activo: !p.activo } : p
      ));
      const nuevoEstado = !producto?.activo ? 'activado' : 'desactivado';
      setShowAlert({ visible: true, message: `Producto ${nuevoEstado} exitosamente`, type: 'success' });
    }
    setShowConfirmToggle(false);
    setProductToToggle(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imagen: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredProducts = productos.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (p.nombre?.toLowerCase() ?? '').includes(searchLower) ||
      (p.categoria?.toLowerCase() ?? '').includes(searchLower) ||
      (p.proveedor?.toLowerCase() ?? '').includes(searchLower) ||
      (p.activo ? 'activo' : 'inactivo').includes(searchLower) ||
      p.precioVenta.toString().includes(searchLower) ||
      (p.variantes || []).some(v => 
        (v.talla?.toLowerCase() ?? '').includes(searchLower) ||
        (v.colores || []).some(c => (c.color?.toLowerCase() ?? '').includes(searchLower))
      )
    );
  });

  const getTotalStock = (producto: Producto) => {
    if (!producto.variantes || !Array.isArray(producto.variantes)) {
      return 0;
    }
    return producto.variantes.reduce((totalVariantes, variante) => {
      if (!variante.colores || !Array.isArray(variante.colores)) {
        return totalVariantes;
      }
      return totalVariantes + variante.colores.reduce((totalColores, color) => totalColores + (color.cantidad || 0), 0);
    }, 0);
  };

  const exportToExcel = () => {
    const headers = ['Nombre', 'Categoría', 'Proveedor', 'Precio', 'Estado', 'Stock Total', 'Tallas', 'Colores'];
    const rows = productos.map(p => [
      p.nombre,
      p.categoria,
      p.proveedor,
      p.precioVenta,
      p.activo ? 'Activo' : 'Inactivo',
      getTotalStock(p),
      (p.variantes || []).map(v => v.talla).join(' / ') || 'Sin tallas',
      (p.variantes || []).flatMap(v => v.colores.map(c => c.color)).join(' / ') || 'Sin colores'
    ]);
    
    const csvContent = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `productos_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Alert Modal */}
      <Modal
        isOpen={showAlert.visible}
        onClose={() => setShowAlert({ ...showAlert, visible: false })}
        title={showAlert.type === 'error' ? 'Error' : showAlert.type === 'success' ? 'Éxito' : 'Información'}
        size="sm"
      >
        <div className="flex items-center gap-3">
          {showAlert.type === 'error' && <AlertCircle className="text-red-600" size={24} />}
          {showAlert.type === 'success' && <CheckCircle className="text-green-600" size={24} />}
          <p className="text-gray-700">{showAlert.message}</p>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={() => setShowAlert({ ...showAlert, visible: false })} variant="primary">
            Aceptar
          </Button>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Confirmar Eliminación"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">¿Está seguro de que desea eliminar este producto? Esta acción no se puede deshacer.</p>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setShowConfirmDelete(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={confirmDelete} variant="primary" className="bg-red-600 hover:bg-red-700">
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Toggle Modal */}
      <Modal
        isOpen={showConfirmToggle}
        onClose={() => setShowConfirmToggle(false)}
        title="Confirmar Cambio de Estado"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">¿Desea cambiar el estado de este producto?</p>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setShowConfirmToggle(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={confirmToggle} variant="primary">
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Productos</h2>
          <p className="text-gray-600">Administra el inventario con múltiples tallas y colores por producto</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="secondary">
            <Download size={20} />
            Exportar Excel
          </Button>
          <Button onClick={handleCreate} variant="primary">
            <Plus size={20} />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">
            <Package className="mx-auto mb-4 text-gray-300" size={48} />
            <p>No se encontraron productos</p>
          </div>
        ) : (
          currentProducts.map((producto) => (
            <div key={producto.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Imagen del producto */}
              <div className="h-48 bg-gray-100 relative">
                {producto.imagen ? (
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="text-gray-300" size={48} />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => toggleActive(producto.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      producto.activo 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {producto.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              </div>

              {/* Información del producto */}
              <div className="p-4">
                <h3 className="text-gray-900 mb-1">{producto.nombre}</h3>
                <p className="text-sm text-gray-500 mb-3">{producto.categoria}</p>
                
                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900">
                    ${(producto.precioVenta || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Stock total: <span className="font-semibold">{getTotalStock(producto)}</span> unidades
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetail(producto)}
                    className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 flex items-center justify-center gap-2 text-sm"
                  >
                    <Eye size={16} />
                    Ver Detalle
                  </button>
                  <button
                    onClick={() => handleEdit(producto)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(producto.id)}
                    className="px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
        >
          Anterior
        </button>
        <div className="text-gray-600">
          Página {currentPage} de {totalPages}
        </div>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
        >
          Siguiente
        </button>
      </div>

      {/* Modal Ver Detalle */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detalle del Producto"
        size="lg"
      >
        {viewingProduct && (
          <div className="space-y-6">
            {/* Imagen */}
            {viewingProduct.imagen && (
              <div className="flex justify-center">
                <img
                  src={viewingProduct.imagen}
                  alt={viewingProduct.nombre}
                  className="w-full max-w-md h-64 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Información básica */}
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="text-xl font-semibold text-gray-900">{viewingProduct.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Categoría</p>
                <p className="font-medium text-gray-900">{viewingProduct.categoria}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Precio</p>
                <p className="text-3xl font-bold text-gray-900">${viewingProduct.precioVenta.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  viewingProduct.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {viewingProduct.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            {/* Variantes disponibles */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-4">Tallas y Colores Disponibles</h3>
              
              {!viewingProduct.variantes || viewingProduct.variantes.length === 0 ? (
                <p className="text-sm text-gray-600">No hay variantes configuradas</p>
              ) : (
                <div className="space-y-4">
                  {viewingProduct.variantes.map((variante, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="font-semibold text-gray-900 mb-3">Talla: {variante.talla}</h4>
                      
                      {variante.colores.length === 0 ? (
                        <p className="text-sm text-gray-600">No hay colores disponibles</p>
                      ) : (
                        <div className="space-y-2">
                          {variante.colores.map((colorItem, colorIndex) => {
                            const colorInfo = coloresDisponibles.find(c => c.nombre === colorItem.color);
                            return (
                              <div
                                key={colorIndex}
                                className="flex items-center justify-between bg-white p-3 rounded-md"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-8 h-8 rounded border border-gray-300"
                                    style={{ backgroundColor: colorInfo?.hex || '#000000' }}
                                  />
                                  <span className="font-medium text-gray-900">{colorItem.color}</span>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Stock</p>
                                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                    colorItem.cantidad > 20
                                      ? 'bg-green-100 text-green-700'
                                      : colorItem.cantidad > 10
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {colorItem.cantidad} unidades
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stock total */}
            {viewingProduct.variantes && viewingProduct.variantes.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Stock Total:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {getTotalStock(viewingProduct)} unidades
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Create/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFormErrors({});
          setEditingProduct(null);
          setFormData({
            nombre: '',
            proveedor: '',
            categoria: '',
            precioVenta: '',
            imagen: '',
            variantes: []
          });
          setNuevaVariante({ talla: '', colores: [{ color: '', cantidad: 0 }] });
        }}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Información Básica - Reorganizada */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Nombre del Producto *</label>
              <Input
                value={formData.nombre}
                onChange={(e) => handleFieldChange('nombre', e.target.value)}
                placeholder="Ej: Vestido Elegante"
                required
              />
              {formErrors.nombre && <p className="text-red-600 text-sm mt-1">{formErrors.nombre}</p>}
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Precio de Venta *</label>
              <Input
                type="number"
                value={formData.precioVenta}
                onChange={(e) => handleFieldChange('precioVenta', e.target.value)}
                placeholder="0"
                required
              />
              {formErrors.precioVenta && <p className="text-red-600 text-sm mt-1">{formErrors.precioVenta}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Categoría *</label>
              <select
                value={formData.categoria}
                onChange={(e) => handleFieldChange('categoria', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              >
                <option value="">Seleccionar...</option>
                {categorias.map((cat: any) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              {formErrors.categoria && <p className="text-red-600 text-sm mt-1">{formErrors.categoria}</p>}
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Proveedor *</label>
              <select
                value={formData.proveedor}
                onChange={(e) => handleFieldChange('proveedor', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              >
                <option value="">Seleccionar...</option>
                {proveedores.map((prov: any) => (
                  <option key={prov.id} value={prov.nombre}>{prov.nombre}</option>
                ))}
              </select>
              {formErrors.proveedor && <p className="text-red-600 text-sm mt-1">{formErrors.proveedor}</p>}
            </div>
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-gray-700 mb-2">Imagen del Producto</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {formData.imagen ? (
                <div className="relative">
                  <img
                    src={formData.imagen}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg mb-2"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imagen: '' })}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-600">Haz clic para subir una imagen</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Agregar variantes (tallas y colores) */}
          <div className="border-t pt-4">
            <h4 className="text-gray-900 mb-3">Tallas y Colores Disponibles</h4>
            
            {/* Nueva variante */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="mb-3">
                <label className="block text-gray-700 mb-2">Seleccionar Talla *</label>
                <select
                  value={nuevaVariante.talla}
                  onChange={(e) => setNuevaVariante({ ...nuevaVariante, talla: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">Seleccionar talla...</option>
                  {tallas.map(talla => (
                    <option key={talla} value={talla}>{talla}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 mb-2">Color y Cantidad *</label>
                <div className="flex gap-2 items-start">
                  <select
                    value={nuevaVariante.colores[0]?.color || ''}
                    onChange={(e) => {
                      const nuevoColor = e.target.value;
                      setNuevaVariante({
                        ...nuevaVariante,
                        colores: [{ ...nuevaVariante.colores[0], color: nuevoColor }]
                      });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="">Seleccionar color...</option>
                    {coloresDisponibles.map(color => (
                      <option key={color.nombre} value={color.nombre}>
                        {color.nombre}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    value={nuevaVariante.colores[0]?.cantidad || 0}
                    onChange={(e) => {
                      setNuevaVariante({
                        ...nuevaVariante,
                        colores: [{ ...nuevaVariante.colores[0], cantidad: parseInt(e.target.value) || 0 }]
                      });
                    }}
                    placeholder="Cantidad"
                    className="w-24"
                  />
                </div>
              </div>

              <Button 
                type="button"
                onClick={agregarVariante}
                variant="secondary"
                className="w-full"
              >
                <Plus size={18} />
                Agregar esta Talla
              </Button>
            </div>

            {/* Variantes agregadas */}
            {formData.variantes.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-gray-700 font-medium">Variantes agregadas:</h5>
                {formData.variantes.map((variante, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Talla {variante.talla}</span>
                      <button
                        type="button"
                        onClick={() => eliminarVariante(index)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      {variante.colores.map((c, i) => (
                        <span key={i}>
                          {c.color}: {c.cantidad} unid.
                          {i < variante.colores.length - 1 ? ' | ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button onClick={() => {
              setShowModal(false);
              setFormErrors({});
              setEditingProduct(null);
              setFormData({
                nombre: '',
                proveedor: '',
                categoria: '',
                precioVenta: '',
                imagen: '',
                variantes: []
              });
              setNuevaVariante({ talla: '', colores: [{ color: '', cantidad: 0 }] });
            }} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="primary">
              {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}