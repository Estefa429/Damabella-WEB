import React, { useState, useEffect } from 'react';
import { Plus, Search, Image as ImageIcon, Package, Upload } from 'lucide-react';
import { Button, Input, Modal } from '../../../../shared/components/native';
import { Eye, Edit2, Trash2, X } from 'lucide-react';

const STORAGE_KEY = 'damabella_productos';
const CATEGORIAS_KEY = 'damabella_categorias';

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
  categoria: string;
  precioVenta: number;
  activo: boolean;
  variantes: VarianteTalla[];
  imagen?: string;
  createdAt: string;
}

export default function ProductosManager() {
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

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Producto | null>(null);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [newTalla, setNewTalla] = useState('');
  const [newColor, setNewColor] = useState('');
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    precioVenta: '',
    imagen: '',
    variantes: [] as VarianteTalla[]
  });

  const [nuevaVariante, setNuevaVariante] = useState({
    talla: '',
    colores: [{ color: '', cantidad: 0 }]
  });

  const tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const coloresDisponibles = [
    { nombre: 'Rojo', hex: '#EF4444' },
    { nombre: 'Rosa', hex: '#EC4899' },
    { nombre: 'Fucsia', hex: '#D946EF' },
    { nombre: 'Púrpura', hex: '#A855F7' },
    { nombre: 'Violeta', hex: '#8B5CF6' },
    { nombre: 'Índigo', hex: '#6366F1' },
    { nombre: 'Azul', hex: '#3B82F6' },
    { nombre: 'Cyan', hex: '#06B6D4' },
    { nombre: 'Verde Agua', hex: '#14B8A6' },
    { nombre: 'Verde', hex: '#10B981' },
    { nombre: 'Lima', hex: '#84CC16' },
    { nombre: 'Amarillo', hex: '#EAB308' },
    { nombre: 'Naranja', hex: '#F97316' },
    { nombre: 'Coral', hex: '#FB923C' },
    { nombre: 'Blanco', hex: '#FFFFFF' },
    { nombre: 'Gris Claro', hex: '#D1D5DB' },
    { nombre: 'Gris', hex: '#6B7280' },
    { nombre: 'Negro', hex: '#1F2937' },
    { nombre: 'Beige', hex: '#D4A574' },
    { nombre: 'Café', hex: '#92400E' },
    { nombre: 'Dorado', hex: '#F59E0B' },
    { nombre: 'Plata', hex: '#9CA3AF' }
  ];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
  }, [productos]);

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      nombre: '',
      categoria: '',
      precioVenta: '',
      imagen: '',
      variantes: []
    });
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

  const agregarColorAVariante = () => {
    setNuevaVariante({
      ...nuevaVariante,
      colores: [...nuevaVariante.colores, { color: '', cantidad: 0 }]
    });
  };

  const eliminarColorDeVariante = (index: number) => {
    setNuevaVariante({
      ...nuevaVariante,
      colores: nuevaVariante.colores.filter((_, i) => i !== index)
    });
  };

  const actualizarColorVariante = (index: number, field: 'color' | 'cantidad', value: string | number) => {
    const nuevosColores = [...nuevaVariante.colores];
    nuevosColores[index] = { ...nuevosColores[index], [field]: value };
    setNuevaVariante({ ...nuevaVariante, colores: nuevosColores });
  };

  const agregarVariante = () => {
    if (!nuevaVariante.talla) {
      alert('Debes seleccionar una talla');
      return;
    }

    const coloresValidos = nuevaVariante.colores.filter(c => c.color && c.cantidad >= 0);
    if (coloresValidos.length === 0) {
      alert('Debes agregar al menos un color con cantidad');
      return;
    }

    // Verificar si ya existe una variante con esa talla
    if (formData.variantes.some(v => v.talla === nuevaVariante.talla)) {
      alert('Ya existe una variante con esta talla');
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
    if (!formData.nombre.trim() || !formData.categoria || !formData.precioVenta) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (formData.variantes.length === 0) {
      alert('Debes agregar al menos una talla con sus colores');
      return;
    }

    const productoData = {
      nombre: formData.nombre,
      categoria: formData.categoria,
      precioVenta: parseFloat(formData.precioVenta),
      activo: true,
      variantes: formData.variantes,
      imagen: formData.imagen,
      createdAt: new Date().toISOString()
    };

    if (editingProduct) {
      setProductos(productos.map(p => 
        p.id === editingProduct.id ? { ...p, ...productoData } : p
      ));
    } else {
      setProductos([...productos, { id: Date.now(), ...productoData }]);
    }
    
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      setProductos(productos.filter(p => p.id !== id));
    }
  };

  const toggleActive = (id: number) => {
    setProductos(productos.map(p => 
      p.id === id ? { ...p, activo: !p.activo } : p
    ));
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

  const filteredProducts = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalStock = (producto: Producto) => {
    return producto.variantes.reduce((totalVariantes, variante) => {
      return totalVariantes + variante.colores.reduce((totalColores, color) => totalColores + color.cantidad, 0);
    }, 0);
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Productos</h2>
          <p className="text-gray-600">Administra el inventario con múltiples tallas y colores por producto</p>
        </div>
        <Button onClick={handleCreate} variant="primary">
          <Plus size={20} />
          Nuevo Producto
        </Button>
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
              
              {viewingProduct.variantes.length === 0 ? (
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
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Stock Total:</span>
                <span className="text-2xl font-bold text-gray-900">
                  {getTotalStock(viewingProduct)} unidades
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Create/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <div className="space-y-4">
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

          <div>
            <label className="block text-gray-700 mb-2">Nombre del Producto *</label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Vestido Elegante"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Categoría *</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              >
                <option value="">Seleccionar...</option>
                {categorias.map((cat: any) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Precio de Venta *</label>
              <Input
                type="number"
                value={formData.precioVenta}
                onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Agregar variantes (tallas y colores) */}
          <div className="border-t pt-4">
            <h4 className="text-gray-900 mb-3">Tallas y Colores Disponibles</h4>
            
            {/* Nueva variante */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="mb-3">
                <label className="block text-gray-700 mb-2">Seleccionar Talla</label>
                <div className="flex gap-2">
                  <select
                    value={nuevaVariante.talla}
                    onChange={(e) => setNuevaVariante({ ...nuevaVariante, talla: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="">Seleccionar talla...</option>
                    {tallas.map(talla => (
                      <option key={talla} value={talla}>{talla}</option>
                    ))}
                  </select>
                  <span className="text-gray-500 py-2">o</span>
                  <Input
                    value={newTalla}
                    onChange={(e) => setNewTalla(e.target.value)}
                    placeholder="Nueva talla"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newTalla.trim()) {
                        setNuevaVariante({ ...nuevaVariante, talla: newTalla.trim() });
                        setNewTalla('');
                      }
                    }}
                    variant="secondary"
                  >
                    Usar
                  </Button>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-700">Colores y Cantidades</label>
                  <button
                    type="button"
                    onClick={agregarColorAVariante}
                    className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm"
                  >
                    <Plus size={14} />
                    Agregar Color
                  </button>
                </div>
                <div className="space-y-2">
                  {nuevaVariante.colores.map((colorItem, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex gap-2 items-start">
                        <select
                          value={colorItem.color}
                          onChange={(e) => actualizarColorVariante(index, 'color', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          <option value="">Seleccionar color...</option>
                          {coloresDisponibles.map(color => (
                            <option key={color.nombre} value={color.nombre}>{color.nombre}</option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          value={colorItem.cantidad}
                          onChange={(e) => actualizarColorVariante(index, 'cantidad', parseInt(e.target.value) || 0)}
                          placeholder="Cantidad"
                          className="w-24"
                        />
                        {nuevaVariante.colores.length > 1 && (
                          <button
                            type="button"
                            onClick={() => eliminarColorDeVariante(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 items-center ml-2">
                        <span className="text-sm text-gray-500">o agregar nuevo:</span>
                        <Input
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          placeholder="Nombre del color"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (newColor.trim()) {
                              actualizarColorVariante(index, 'color', newColor.trim());
                              setNewColor('');
                            }
                          }}
                          variant="secondary"
                        >
                          Usar
                        </Button>
                      </div>
                    </div>
                  ))}
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
            <Button onClick={() => setShowModal(false)} variant="secondary">
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