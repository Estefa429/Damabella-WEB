import { useState } from 'react';
import { Card, Button, Input, Label, Select, Modal, DataTable, Badge, useToast } from '../../../shared/components/native';
import validateField from '../../../shared/utils/validation';
import { Plus, Edit, Trash2, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface Purchase {
  id: string;
  date: string;
  provider: string;
  product: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: 'Pendiente' | 'Recibido' | 'Cancelado';
  size?: string;
  color?: string;
}

const mockPurchases: Purchase[] = [
  { id: 'COMP-001', date: '2024-11-08', provider: 'Textiles El Sol', product: 'Vestido Largo Elegante', quantity: 50, unitPrice: 15000, total: 750000, status: 'Recibido', size: 'M', color: 'Negro' },
  { id: 'COMP-002', date: '2024-11-07', provider: 'Distribuidora Fashion', product: 'Set Deportivo Premium', quantity: 100, unitPrice: 5000, total: 500000, status: 'Recibido', size: 'S', color: 'Gris' },
  { id: 'COMP-003', date: '2024-11-06', provider: 'Importadora Textil', product: 'Vestido Corto Casual', quantity: 30, unitPrice: 25000, total: 750000, status: 'Pendiente', size: 'L', color: 'Blanco' },
];

export default function ComprasPage() {
  const [purchases, setPurchases] = useState<Purchase[]>(mockPurchases);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [formData, setFormData] = useState({
    provider: '',
    product: '',
    quantity: '',
    unitPrice: '',
    status: 'Pendiente' as Purchase['status'],
    size: '',
    color: '',
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const { showToast } = useToast();
  const { user } = useAuth();

  const canDelete = user?.role === 'Administrador';

  const handleOpenModal = (purchase?: Purchase) => {
    if (purchase) {
      setEditingPurchase(purchase);
      setFormData({
        provider: purchase.provider,
        product: purchase.product,
        quantity: purchase.quantity.toString(),
        unitPrice: purchase.unitPrice.toString(),
        status: purchase.status,
        size: purchase.size || '',
        color: purchase.color || '',
      });
    } else {
      setEditingPurchase(null);
      setFormData({
        provider: '',
        product: '',
        quantity: '',
        unitPrice: '',
        status: 'Pendiente',
        size: '',
        color: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: any = {};
    const providerErr = validateField('nombre', formData.provider);
    if (providerErr) errors.provider = providerErr;
    const productErr = validateField('name', formData.product);
    if (productErr) errors.product = productErr;

    const quantity = parseInt(formData.quantity || '0');
    if (isNaN(quantity) || quantity <= 0) errors.quantity = 'Cantidad inválida';

    const unitPrice = parseFloat(formData.unitPrice || '0');
    if (isNaN(unitPrice) || unitPrice <= 0) errors.unitPrice = 'Precio inválido';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const total = quantity * unitPrice;

    if (editingPurchase) {
      setPurchases(purchases.map(p => 
        p.id === editingPurchase.id 
          ? { ...p, ...formData, quantity, unitPrice, total }
          : p
      ));
      showToast('Compra actualizada correctamente', 'success');
    } else {
      // Generar ID en formato COMP-001
      const nextNumber = purchases.length + 1;
      const purchaseId = `COMP-${String(nextNumber).padStart(3, '0')}`;
      
      const newPurchase: Purchase = {
        id: purchaseId,
        date: new Date().toISOString().split('T')[0],
        provider: formData.provider,
        product: formData.product,
        quantity,
        unitPrice,
        total,
        status: formData.status,
        size: formData.size || undefined,
        color: formData.color || undefined,
      };
      setPurchases([newPurchase, ...purchases]);
      showToast('Compra creada correctamente', 'success');
    }

    setIsModalOpen(false);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    // validate
    if (field === 'provider') {
      const err = validateField('nombre', value);
      if (err) setFormErrors({ ...formErrors, provider: err });
      else {
        const { provider: _p, ...rest } = formErrors;
        setFormErrors(rest);
      }
      return;
    }

    if (field === 'product') {
      const err = validateField('name', value);
      if (err) setFormErrors({ ...formErrors, product: err });
      else {
        const { product: _p, ...rest } = formErrors;
        setFormErrors(rest);
      }
      return;
    }

    if (field === 'quantity') {
      const n = parseInt(value || '0');
      if (isNaN(n) || n <= 0) setFormErrors({ ...formErrors, quantity: 'Cantidad inválida' });
      else {
        const { quantity: _q, ...rest } = formErrors;
        setFormErrors(rest);
      }
      return;
    }

    if (field === 'unitPrice') {
      const n = parseFloat(value || '0');
      if (isNaN(n) || n <= 0) setFormErrors({ ...formErrors, unitPrice: 'Precio inválido' });
      else {
        const { unitPrice: _u, ...rest } = formErrors;
        setFormErrors(rest);
      }
      return;
    }

    // generic fallback
    const err = validateField(field, value);
    if (err) setFormErrors({ ...formErrors, [field]: err });
    else {
      const { [field]: _removed, ...rest } = formErrors;
      setFormErrors(rest);
    }
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      showToast('No tienes permisos para eliminar compras', 'error');
      return;
    }
    if (confirm('¿Estás seguro de eliminar esta compra?')) {
      setPurchases(purchases.filter(p => p.id !== id));
      showToast('Compra eliminada correctamente', 'success');
    }
  };

  const totalCompras = purchases.reduce((sum, p) => sum + p.total, 0);

  const columns = [
    {
      key: 'id',
      label: 'Compra',
      render: (purchase: Purchase) => (
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-gray-600" />
          <span className="font-medium">{purchase.id}</span>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Fecha',
      render: (purchase: Purchase) => new Date(purchase.date).toLocaleDateString('es-ES'),
    },
    { key: 'provider', label: 'Proveedor' },
    { 
      key: 'product', 
      label: 'Producto',
      render: (purchase: Purchase) => (
        <div>
          <p className="font-medium">{purchase.product}</p>
          {(purchase.size || purchase.color) && (
            <p className="text-xs text-gray-500">
              {purchase.size && `Talla: ${purchase.size}`}
              {purchase.size && purchase.color && ' | '}
              {purchase.color && `Color: ${purchase.color}`}
            </p>
          )}
        </div>
      ),
    },
    { key: 'quantity', label: 'Cantidad' },
    {
      key: 'unitPrice',
      label: 'Precio Unit.',
      render: (purchase: Purchase) => `$${purchase.unitPrice.toLocaleString()}`,
    },
    {
      key: 'total',
      label: 'Total',
      render: (purchase: Purchase) => (
        <span className="font-semibold">${purchase.total.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (purchase: Purchase) => (
        <Badge variant={
          purchase.status === 'Recibido' ? 'success' :
          purchase.status === 'Cancelado' ? 'danger' :
          'warning'
        }>
          {purchase.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (purchase: Purchase) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(purchase)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          {canDelete && (
            <button
              onClick={() => handleDelete(purchase.id)}
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
          <h1 className="text-3xl font-bold">Compras</h1>
          <p className="text-gray-600">Gestión de compras a proveedores</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Compra
        </Button>
      </div>

      <Card className="p-6">
        <DataTable
          data={purchases}
          columns={columns}
          searchPlaceholder="Buscar compras..."
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPurchase ? 'Editar Compra' : 'Nueva Compra'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Proveedor</Label>
            <Input
              id="provider"
              value={formData.provider}
              onChange={(e) => handleFieldChange('provider', e.target.value)}
              placeholder="Nombre del proveedor"
              required
            />
            {formErrors.provider && <p className="text-red-600 text-sm mt-1">{formErrors.provider}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Producto</Label>
            <Input
              id="product"
              value={formData.product}
              onChange={(e) => handleFieldChange('product', e.target.value)}
              placeholder="Descripción del producto"
              required
            />
            {formErrors.product && <p className="text-red-600 text-sm mt-1">{formErrors.product}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Talla (Opcional)</Label>
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => handleFieldChange('size', e.target.value)}
                placeholder="Ej: M, L, XL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color (Opcional)</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleFieldChange('color', e.target.value)}
                placeholder="Ej: Negro, Blanco"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleFieldChange('quantity', e.target.value)}
                required
              />
              {formErrors.quantity && <p className="text-red-600 text-sm mt-1">{formErrors.quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Precio Unitario</Label>
              <Input
                id="unitPrice"
                type="number"
                value={formData.unitPrice}
                onChange={(e) => handleFieldChange('unitPrice', e.target.value)}
                required
              />
              {formErrors.unitPrice && <p className="text-red-600 text-sm mt-1">{formErrors.unitPrice}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              id="status"
              value={formData.status}
              onChange={(e) => handleFieldChange('status', e.target.value as Purchase['status'])}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Recibido">Recibido</option>
              <option value="Cancelado">Cancelado</option>
            </Select>
          </div>

          {formData.quantity && formData.unitPrice && (
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">
                ${(parseFloat(formData.quantity) * parseFloat(formData.unitPrice)).toLocaleString()}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingPurchase ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
