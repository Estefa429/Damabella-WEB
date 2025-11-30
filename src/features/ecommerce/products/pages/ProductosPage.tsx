import { useState, useEffect } from 'react';
import { Card, Button, Input, Label, Select, Textarea, Modal, DataTable, Badge, useToast } from '../../../../shared/components/native';
import { Plus, Edit, Trash2, Package, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../../../../shared/contexts/AuthContext';

interface ProductVariant {
  size: string;
  colors: {
    color: string;
    hexCode: string;
    stock: number;
  }[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  variants: ProductVariant[];
  status: 'Activo' | 'Inactivo';
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Vestido Largo Elegante',
    description: 'Vestido largo para eventos formales',
    category: 'Vestidos Largos',
    price: 159900,
    images: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400'],
    variants: [
      {
        size: 'S',
        colors: [
          { color: 'Negro', hexCode: '#000000', stock: 10 },
          { color: 'Rojo', hexCode: '#DC2626', stock: 5 },
        ],
      },
      {
        size: 'M',
        colors: [
          { color: 'Negro', hexCode: '#000000', stock: 15 },
          { color: 'Azul', hexCode: '#2563EB', stock: 8 },
        ],
      },
    ],
    status: 'Activo',
  },
];

export function ProductosPage() {
  const [products, setProducts] = useState<Product[]>(() => {
    const stored = localStorage.getItem('damabella_productos');
    return stored ? JSON.parse(stored) : mockProducts;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showVariants, setShowVariants] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Vestidos Largos',
    price: '',
    images: [] as string[],
    variants: [] as ProductVariant[],
    status: 'Activo' as 'Activo' | 'Inactivo',
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const [imageUrl, setImageUrl] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [newSize, setNewSize] = useState('');
  const [showAddColorModal, setShowAddColorModal] = useState(false);
  const [showAddSizeModal, setShowAddSizeModal] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  const canDelete = user?.role === 'Administrador';

  // Guardar en localStorage cuando cambien los productos
  useEffect(() => {
    localStorage.setItem('damabella_productos', JSON.stringify(products));
  }, [products]);

  const [availableSizes, setAvailableSizes] = useState(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  const [availableColors, setAvailableColors] = useState([
    { name: 'Negro', hex: '#000000' },
    { name: 'Blanco', hex: '#FFFFFF' },
    { name: 'Rojo', hex: '#DC2626' },
    { name: 'Azul', hex: '#2563EB' },
    { name: 'Verde', hex: '#16A34A' },
    { name: 'Rosa', hex: '#EC4899' },
  ]);

  const validateField = (field: string, value: any) => {
    const errors: any = {};
    
    if (field === 'name') {
      if (!value.trim()) {
        errors.name = 'Este campo es obligatorio';
      } else if (value.trim().length < 3) {
        errors.name = 'Debe tener al menos 3 caracteres';
      }
    }
    
    if (field === 'description') {
      if (!value.trim()) {
        errors.description = 'Este campo es obligatorio';
      } else if (value.trim().length < 10) {
        errors.description = 'Debe tener al menos 10 caracteres';
      }
    }
    
    if (field === 'price') {
      if (!value) {
        errors.price = 'Este campo es obligatorio';
      } else if (parseFloat(value) <= 0) {
        errors.price = 'El precio debe ser mayor a 0';
      }
    }
    
    return errors;
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    const fieldErrors = validateField(field, value);
    setFormErrors({ ...formErrors, ...fieldErrors, [field]: fieldErrors[field] });
  };

  const handleAddNewColor = () => {
    if (!newColorName.trim()) {
      showToast('Ingresa un nombre para el color', 'error');
      return;
    }
    
    if (availableColors.some(c => c.name.toLowerCase() === newColorName.toLowerCase())) {
      showToast('Este color ya existe', 'error');
      return;
    }

    setAvailableColors([...availableColors, { name: newColorName, hex: newColorHex }]);
    showToast('Color agregado correctamente', 'success');
    setNewColorName('');
    setNewColorHex('#000000');
    setShowAddColorModal(false);
  };

  const handleAddNewSize = () => {
    if (!newSize.trim()) {
      showToast('Ingresa un nombre para la talla', 'error');
      return;
    }
    
    if (availableSizes.some(s => s.toLowerCase() === newSize.toLowerCase())) {
      showToast('Esta talla ya existe', 'error');
      return;
    }

    setAvailableSizes([...availableSizes, newSize.toUpperCase()]);
    showToast('Talla agregada correctamente', 'success');
    setNewSize('');
    setShowAddSizeModal(false);
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price.toString(),
        images: product.images,
        variants: product.variants,
        status: product.status,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        category: 'Vestidos Largos',
        price: '',
        images: [],
        variants: [],
        status: 'Activo',
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
    setShowVariants(false);
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, imageUrl.trim()],
      });
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      size: 'M',
      colors: [{ color: 'Negro', hexCode: '#000000', stock: 0 }],
    };
    setFormData({
      ...formData,
      variants: [...formData.variants, newVariant],
    });
  };

  const handleRemoveVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const handleUpdateVariant = (variantIndex: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex] = {
      ...newVariants[variantIndex],
      [field]: value,
    };
    setFormData({ ...formData, variants: newVariants });
  };

  const handleAddColorToVariant = (variantIndex: number) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex].colors.push({
      color: 'Negro',
      hexCode: '#000000',
      stock: 0,
    });
    setFormData({ ...formData, variants: newVariants });
  };

  const handleRemoveColorFromVariant = (variantIndex: number, colorIndex: number) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex].colors = newVariants[variantIndex].colors.filter((_, i) => i !== colorIndex);
    setFormData({ ...formData, variants: newVariants });
  };

  const handleUpdateColor = (variantIndex: number, colorIndex: number, field: string, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex].colors[colorIndex] = {
      ...newVariants[variantIndex].colors[colorIndex],
      [field]: value,
    };
    setFormData({ ...formData, variants: newVariants });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...formData, price: parseFloat(formData.price) } : p));
      showToast('Producto actualizado correctamente', 'success');
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        ...formData,
        price: parseFloat(formData.price),
      };
      setProducts([...products, newProduct]);
      showToast('Producto creado correctamente', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      showToast('No tienes permisos para eliminar productos', 'error');
      return;
    }
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== id));
      showToast('Producto eliminado correctamente', 'success');
    }
  };

  const handleLoadSampleData = () => {
    if (confirm('¿Deseas cargar productos de ejemplo? Esto agregará 3 productos con stock al catálogo.')) {
      const sampleProducts = [
        {
          id: Date.now(),
          nombre: 'Vestido Elegante Rosa',
          categoria: 'Vestidos',
          precioVenta: 89900,
          imagen: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
          descripcion: 'Vestido elegante perfecto para eventos especiales',
          material: '95% Poliéster, 5% Elastano',
          variantes: [
            {
              talla: 'S',
              colores: [
                { color: 'Rosa', cantidad: 5 },
                { color: 'Negro', cantidad: 3 }
              ]
            },
            {
              talla: 'M',
              colores: [
                { color: 'Rosa', cantidad: 7 },
                { color: 'Negro', cantidad: 4 }
              ]
            },
            {
              talla: 'L',
              colores: [
                { color: 'Rosa', cantidad: 3 },
                { color: 'Negro', cantidad: 2 }
              ]
            }
          ],
          activo: true,
          destacado: true,
          nuevo: true
        },
        {
          id: Date.now() + 1,
          nombre: 'Set Deportivo',
          categoria: 'Sets',
          precioVenta: 129900,
          imagen: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400',
          descripcion: 'Set deportivo de dos piezas con tejido transpirable',
          material: '88% Poliéster, 12% Elastano',
          variantes: [
            {
              talla: 'S',
              colores: [
                { color: 'Negro', cantidad: 10 },
                { color: 'Gris', cantidad: 8 }
              ]
            },
            {
              talla: 'M',
              colores: [
                { color: 'Negro', cantidad: 15 },
                { color: 'Gris', cantidad: 12 }
              ]
            },
            {
              talla: 'L',
              colores: [
                { color: 'Negro', cantidad: 8 },
                { color: 'Gris', cantidad: 6 }
              ]
            }
          ],
          activo: true,
          destacado: false,
          nuevo: true
        },
        {
          id: Date.now() + 2,
          nombre: 'Enterizo Casual',
          categoria: 'Enterizos',
          precioVenta: 119900,
          imagen: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
          descripcion: 'Enterizo de mezclilla con diseño moderno y cómodo',
          material: '98% Algodón, 2% Elastano',
          variantes: [
            {
              talla: 'S',
              colores: [
                { color: 'Azul', cantidad: 6 }
              ]
            },
            {
              talla: 'M',
              colores: [
                { color: 'Azul', cantidad: 9 }
              ]
            },
            {
              talla: 'L',
              colores: [
                { color: 'Azul', cantidad: 4 }
              ]
            }
          ],
          activo: true,
          destacado: true,
          nuevo: false
        }
      ];

      // Guardar en localStorage del panel admin
      localStorage.setItem('damabella_productos', JSON.stringify(sampleProducts));
      
      // Disparar evento para actualizar el ecommerce
      window.dispatchEvent(new Event('productsUpdated'));
      window.dispatchEvent(new Event('storage'));
      
      showToast('✅ Productos de ejemplo cargados. Ahora puedes verlos en el e-commerce!', 'success');
      
      // Recargar página para refrescar
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const getTotalStock = (product: Product) => {
    return product.variants.reduce((total, variant) => {
      return total + variant.colors.reduce((sum, color) => sum + color.stock, 0);
    }, 0);
  };

  const columns = [
    {
      key: 'image',
      label: 'Imagen',
      render: (product: Product) => (
        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Producto',
      render: (product: Product) => (
        <div>
          <p className="font-medium">{product.name}</p>
          <p className="text-xs text-gray-600">{product.category}</p>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Precio',
      render: (product: Product) => (
        <span className="font-semibold text-gray-900">${product.price.toLocaleString()}</span>
      ),
    },
    {
      key: 'stock',
      label: 'Stock Total',
      render: (product: Product) => (
        <Badge variant={getTotalStock(product) > 20 ? 'success' : getTotalStock(product) > 10 ? 'warning' : 'danger'}>
          {getTotalStock(product)}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (product: Product) => (
        <Badge variant={product.status === 'Activo' ? 'success' : 'default'}>
          {product.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setViewingProduct(product);
              setIsDetailModalOpen(true);
            }}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Ver Detalle
          </button>
          <button
            onClick={() => handleOpenModal(product)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          {canDelete && (
            <button
              onClick={() => handleDelete(product.id)}
              className="p-1 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-gray-600">Gestión de productos del catálogo</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      <Card className="p-6">
        <DataTable
          data={products}
          columns={columns}
          searchPlaceholder="Buscar productos..."
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                required
              />
              {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Vestidos Largos">Vestidos Largos</option>
                <option value="Vestidos Cortos">Vestidos Cortos</option>
                <option value="Sets">Sets</option>
                <option value="Enterizos">Enterizos</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleFieldChange('price', e.target.value)}
                required
              />
              {formErrors.price && <p className="text-red-500 text-sm">{formErrors.price}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Activo' | 'Inactivo' })}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              required
            />
            {formErrors.description && <p className="text-red-500 text-sm">{formErrors.description}</p>}
          </div>

          {/* Imágenes */}
          <div className="space-y-3">
            <Label>Imágenes del Producto</Label>
            <div className="flex gap-2">
              <Input
                placeholder="URL de la imagen"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Button type="button" onClick={handleAddImage}>
                Agregar
              </Button>
            </div>
            {formData.images.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img src={img} alt="" className="w-full h-24 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variantes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Variantes (Talla y Color)</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setShowAddSizeModal(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Talla
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowAddColorModal(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo Color
                </Button>
                <Button type="button" size="sm" onClick={handleAddVariant}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Talla
                </Button>
              </div>
            </div>

            {formData.variants.map((variant, variantIndex) => (
              <Card key={variantIndex} className="p-4 border-2 border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Select
                      value={variant.size}
                      onChange={(e) => handleUpdateVariant(variantIndex, 'size', e.target.value)}
                      className="w-24"
                    >
                      {availableSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </Select>
                    <span className="text-sm font-medium">Talla {variant.size}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(variantIndex)}
                      className="ml-auto p-1 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Colores disponibles:</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddColorToVariant(variantIndex)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Color
                      </Button>
                    </div>

                    {variant.colors.map((colorItem, colorIndex) => (
                      <div key={colorIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Select
                          value={colorItem.color}
                          onChange={(e) => {
                            const selectedColor = availableColors.find(c => c.name === e.target.value);
                            handleUpdateColor(variantIndex, colorIndex, 'color', e.target.value);
                            handleUpdateColor(variantIndex, colorIndex, 'hexCode', selectedColor?.hex || '#000000');
                          }}
                          className="flex-1"
                        >
                          {availableColors.map(color => (
                            <option key={color.name} value={color.name}>{color.name}</option>
                          ))}
                        </Select>
                        <div
                          className="w-8 h-8 rounded border border-gray-300"
                          style={{ backgroundColor: colorItem.hexCode }}
                        />
                        <Input
                          type="number"
                          value={colorItem.stock}
                          onChange={(e) => handleUpdateColor(variantIndex, colorIndex, 'stock', parseInt(e.target.value) || 0)}
                          placeholder="Stock"
                          className="w-24"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveColorFromVariant(variantIndex, colorIndex)}
                          className="p-1 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingProduct ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal para agregar color */}
      <Modal
        isOpen={showAddColorModal}
        onClose={() => setShowAddColorModal(false)}
        title="Agregar Color"
        size="sm"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newColorName">Nombre del Color</Label>
            <Input
              id="newColorName"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              placeholder="Ej: Morado"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newColorHex">Código Hexadecimal</Label>
            <div className="flex gap-2">
              <Input
                id="newColorHex"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                placeholder="#000000"
              />
              <input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-16 h-10 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowAddColorModal(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleAddNewColor}>
              Agregar Color
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para agregar talla */}
      <Modal
        isOpen={showAddSizeModal}
        onClose={() => setShowAddSizeModal(false)}
        title="Agregar Talla"
        size="sm"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newSize">Nombre de la Talla</Label>
            <Input
              id="newSize"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              placeholder="Ej: XXXL"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowAddSizeModal(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleAddNewSize}>
              Agregar Talla
            </Button>
          </div>
        </div>
      </Modal>

      {/* Botón para cargar datos de ejemplo */}
      <div className="mt-6">
        <Button type="button" variant="outline" onClick={handleLoadSampleData}>
          Cargar Productos de Ejemplo
        </Button>
      </div>

      {/* Modal de Detalle del Producto */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detalle del Producto"
        size="lg"
      >
        {viewingProduct && (
          <div className="space-y-6">
            {/* Imágenes */}
            {viewingProduct.images.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Imágenes</h3>
                <div className="grid grid-cols-3 gap-3">
                  {viewingProduct.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${viewingProduct.name} - ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Información básica */}
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="font-semibold">{viewingProduct.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Categoría</p>
                <p className="font-semibold">{viewingProduct.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Precio</p>
                <p className="text-2xl font-bold text-gray-900">${viewingProduct.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Descripción</p>
                <p>{viewingProduct.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <Badge variant={viewingProduct.status === 'Activo' ? 'success' : 'default'}>
                  {viewingProduct.status}
                </Badge>
              </div>
            </div>

            {/* Variantes disponibles */}
            <div className="space-y-3">
              <h3 className="font-semibold">Variantes Disponibles</h3>
              
              {viewingProduct.variants.length === 0 ? (
                <p className="text-sm text-gray-600">No hay variantes configuradas</p>
              ) : (
                <div className="space-y-4">
                  {viewingProduct.variants.map((variant, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="font-semibold mb-3">Talla: {variant.size}</h4>
                      
                      {variant.colors.length === 0 ? (
                        <p className="text-sm text-gray-600">No hay colores disponibles</p>
                      ) : (
                        <div className="space-y-2">
                          {variant.colors.map((colorItem, colorIndex) => (
                            <div
                              key={colorIndex}
                              className="flex items-center justify-between bg-white p-3 rounded-md"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded border border-gray-300"
                                  style={{ backgroundColor: colorItem.hexCode }}
                                />
                                <div>
                                  <p className="font-medium">{colorItem.color}</p>
                                  <p className="text-xs text-gray-600">{colorItem.hexCode}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">Stock</p>
                                <Badge
                                  variant={
                                    colorItem.stock > 20
                                      ? 'success'
                                      : colorItem.stock > 10
                                      ? 'warning'
                                      : 'danger'
                                  }
                                >
                                  {colorItem.stock} unidades
                                </Badge>
                              </div>
                            </div>
                          ))}
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
                <span className="font-semibold">Stock Total:</span>
                <Badge
                  variant={
                    getTotalStock(viewingProduct) > 20
                      ? 'success'
                      : getTotalStock(viewingProduct) > 10
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {getTotalStock(viewingProduct)} unidades
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
