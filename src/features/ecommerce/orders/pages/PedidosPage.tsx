import { useState } from 'react';
import { Card, Button, Input, Label, Select, Modal, DataTable, Badge, useToast } from '../../../../shared/components/native';
import { Plus, Eye, Package, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../../shared/contexts/AuthContext';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  size: string;
  color: string;
}

interface Order {
  id: string;
  date: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  items: OrderItem[];
  total: number;
  status: 'Pendiente';
  paymentMethod: string;
}

// Almacenamiento para ventas creadas desde pedidos
const SALES_STORAGE_KEY = 'damabella_sales';

const getSales = () => {
  const stored = localStorage.getItem(SALES_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveSale = (sale: any) => {
  const sales = getSales();
  sales.push(sale);
  localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
};

const mockOrders: Order[] = [
  {
    id: 'PED-001',
    date: '2024-11-10',
    clientName: 'María Rodríguez',
    clientEmail: 'maria@email.com',
    clientPhone: '3001234567',
    clientAddress: 'Calle 123 #45-67',
    items: [
      { productId: '1', productName: 'Vestido Largo Elegante', quantity: 1, unitPrice: 159900, size: 'M', color: 'Negro' },
    ],
    total: 159900,
    status: 'Pendiente',
    paymentMethod: 'Tarjeta de Crédito'
  },
];

export function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'create' | 'view'>('create');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    paymentMethod: 'Efectivo',
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const { showToast } = useToast();
  const { user } = useAuth();

  const validateField = (field: string, value: string) => {
    const errors: any = {};
    
    if (field === 'clientName') {
      if (!value.trim()) {
        errors.clientName = 'Este campo es obligatorio';
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        errors.clientName = 'Solo se permiten letras y espacios';
      }
    }
    
    if (field === 'clientEmail') {
      if (!value.trim()) {
        errors.clientEmail = 'Este campo es obligatorio';
      } else if (!/^[a-zA-Z][a-zA-Z0-9.-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        errors.clientEmail = 'Email inválido (debe iniciar con letra)';
      }
    }
    
    if (field === 'clientPhone') {
      if (!value.trim()) {
        errors.clientPhone = 'Este campo es obligatorio';
      } else if (!/^\d{10}$/.test(value)) {
        errors.clientPhone = 'Debe tener exactamente 10 dígitos';
      }
    }
    
    if (field === 'clientAddress') {
      if (!value.trim()) {
        errors.clientAddress = 'Este campo es obligatorio';
      }
    }
    
    return errors;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    const fieldErrors = validateField(field, value);
    setFormErrors({ ...formErrors, ...fieldErrors, [field]: fieldErrors[field] });
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewMode('view');
    setIsModalOpen(true);
  };

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setViewMode('create');
    setFormData({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
      paymentMethod: 'Efectivo',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos
    const allErrors: any = {};
    ['clientName', 'clientEmail', 'clientPhone', 'clientAddress'].forEach(field => {
      const fieldErrors = validateField(field, (formData as any)[field]);
      if (fieldErrors[field]) {
        allErrors[field] = fieldErrors[field];
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    const nextNumber = orders.length + 1;
    const orderId = `PED-${String(nextNumber).padStart(3, '0')}`;

    const newOrder: Order = {
      id: orderId,
      date: new Date().toISOString().split('T')[0],
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      clientAddress: formData.clientAddress,
      items: [
        { productId: '1', productName: 'Vestido Largo Elegante', quantity: 1, unitPrice: 159900, size: 'M', color: 'Negro' }
      ],
      total: 159900,
      status: 'Pendiente',
      paymentMethod: formData.paymentMethod,
    };

    setOrders([newOrder, ...orders]);
    showToast('Pedido creado correctamente', 'success');
    setIsModalOpen(false);
  };

  const handleConvertToSale = (order: Order) => {
    setSelectedOrder(order);
    setIsConvertModalOpen(true);
  };

  const confirmConvertToSale = () => {
    if (!selectedOrder) return;

    // Crear venta
    const nextNumber = getSales().length + 1;
    const saleId = `V-${String(nextNumber).padStart(4, '0')}`;
    
    const newSale = {
      id: saleId,
      date: new Date().toISOString().split('T')[0],
      clientName: selectedOrder.clientName,
      clientEmail: selectedOrder.clientEmail,
      clientPhone: selectedOrder.clientPhone,
      items: selectedOrder.items,
      total: selectedOrder.total,
      paymentMethod: selectedOrder.paymentMethod,
      seller: user?.name || 'Sistema',
      status: 'Completada',
      fromOrder: selectedOrder.id,
    };

    saveSale(newSale);

    // Eliminar pedido
    setOrders(orders.filter(o => o.id !== selectedOrder.id));
    
    showToast('Pedido convertido a venta exitosamente', 'success');
    setIsConvertModalOpen(false);
    setSelectedOrder(null);

    // Disparar evento para que VentasPage se actualice
    window.dispatchEvent(new Event('salesUpdated'));
  };

  const columns = [
    {
      key: 'id',
      label: 'Pedido',
      render: (order: Order) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-600" />
          <span className="font-medium">{order.id}</span>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Fecha',
      render: (order: Order) => new Date(order.date).toLocaleDateString('es-ES'),
    },
    { key: 'clientName', label: 'Cliente' },
    {
      key: 'items',
      label: 'Productos',
      render: (order: Order) => `${order.items.length} producto${order.items.length > 1 ? 's' : ''}`,
    },
    {
      key: 'total',
      label: 'Total',
      render: (order: Order) => `$${order.total.toLocaleString()}`,
    },
    { key: 'paymentMethod', label: 'Pago' },
    {
      key: 'status',
      label: 'Estado',
      render: (order: Order) => (
        <Badge variant="warning">Pendiente</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (order: Order) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewOrder(order)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => handleConvertToSale(order)}
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
            title="Convertir a venta"
          >
            <ArrowRight className="h-3 w-3" />
            Convertir
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-gray-600">Gestión de pedidos de clientes</p>
        </div>
        <Button onClick={handleCreateOrder}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Pedidos Pendientes</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total en Pedidos</p>
          <p className="text-2xl font-bold">${orders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Promedio por Pedido</p>
          <p className="text-2xl font-bold">
            ${orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length).toLocaleString() : '0'}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <DataTable
          data={orders}
          columns={columns}
          searchPlaceholder="Buscar pedidos..."
        />
      </Card>

      {/* Modal Ver/Crear Pedido */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewMode === 'view' ? `Detalle del Pedido ${selectedOrder?.id}` : 'Nuevo Pedido'}
        size="lg"
      >
        {viewMode === 'view' && selectedOrder ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-medium">{selectedOrder.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha</p>
                <p className="font-medium">{new Date(selectedOrder.date).toLocaleDateString('es-ES')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{selectedOrder.clientEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium">{selectedOrder.clientPhone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Dirección</p>
                <p className="font-medium">{selectedOrder.clientAddress}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Método de Pago</p>
                <p className="font-medium">{selectedOrder.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <Badge variant="warning">Pendiente</Badge>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Productos</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">
                          Talla: {item.size} | Color: {item.color}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.unitPrice.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">x {item.quantity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold">Total</p>
                <p className="text-2xl font-bold">${selectedOrder.total.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cerrar
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  setIsModalOpen(false);
                  handleConvertToSale(selectedOrder);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Convertir a Venta
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nombre del Cliente</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => handleFieldChange('clientName', e.target.value)}
                placeholder="Nombre completo"
                required
              />
              {formErrors.clientName && (
                <p className="text-red-600 text-xs mt-1">{formErrors.clientName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Correo Electrónico</Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => handleFieldChange('clientEmail', e.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
              {formErrors.clientEmail && (
                <p className="text-red-600 text-xs mt-1">{formErrors.clientEmail}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Teléfono</Label>
                <Input
                  id="clientPhone"
                  value={formData.clientPhone}
                  onChange={(e) => handleFieldChange('clientPhone', e.target.value)}
                  placeholder="3001234567"
                  required
                  maxLength={10}
                />
                {formErrors.clientPhone && (
                  <p className="text-red-600 text-xs mt-1">{formErrors.clientPhone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Método de Pago</Label>
                <Select
                  id="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                  <option value="Transferencia">Transferencia</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientAddress">Dirección</Label>
              <Input
                id="clientAddress"
                value={formData.clientAddress}
                onChange={(e) => handleFieldChange('clientAddress', e.target.value)}
                placeholder="Calle 20 #10-32"
                required
              />
              {formErrors.clientAddress && (
                <p className="text-red-600 text-xs mt-1">{formErrors.clientAddress}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Crear Pedido
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Confirmación para Convertir a Venta */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convertir a Venta"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de convertir el pedido <strong>{selectedOrder?.id}</strong> en una venta?
          </p>
          <p className="text-sm text-gray-600">
            Esta acción moverá el pedido al módulo de Ventas y no podrá deshacerse.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Cliente:</span>
              <span className="font-medium">{selectedOrder?.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="font-bold text-green-600">${selectedOrder?.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsConvertModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={confirmConvertToSale}
              className="bg-green-600 hover:bg-green-700"
            >
              Aceptar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
