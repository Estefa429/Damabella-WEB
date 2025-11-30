import { useState, useEffect } from 'react';
import { Card, Button, Input, Label, Modal, DataTable, Badge, useToast } from '../../../../shared/components/native';
import { DollarSign, TrendingUp, RotateCcw, Eye, XCircle } from 'lucide-react';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  size: string;
  color: string;
}

interface Sale {
  id: string;
  date: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  products: string;
  quantity: number;
  total: number;
  paymentMethod: string;
  seller: string;
  status: 'Completada' | 'Anulada';
  fromOrder?: string;
  items?: OrderItem[];
  cancelledBy?: string;
  cancelledDate?: string;
  cancelReason?: string;
}

interface ReturnItem extends OrderItem {
  returnQuantity: number;
}

const SALES_STORAGE_KEY = 'damabella_sales';
const RETURNS_STORAGE_KEY = 'damabella_returns';
const CLIENT_BALANCES_KEY = 'damabella_client_balances';

const getSales = () => {
  const stored = localStorage.getItem(SALES_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveSales = (sales: Sale[]) => {
  localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
};

const saveReturn = (returnData: any) => {
  const returns = localStorage.getItem(RETURNS_STORAGE_KEY);
  const existingReturns = returns ? JSON.parse(returns) : [];
  existingReturns.push(returnData);
  localStorage.setItem(RETURNS_STORAGE_KEY, JSON.stringify(existingReturns));
};

const getClientBalance = (clientName: string) => {
  const balances = localStorage.getItem(CLIENT_BALANCES_KEY);
  const existingBalances = balances ? JSON.parse(balances) : {};
  return existingBalances[clientName] || 0;
};

const addClientBalance = (clientName: string, amount: number) => {
  const balances = localStorage.getItem(CLIENT_BALANCES_KEY);
  const existingBalances = balances ? JSON.parse(balances) : {};
  existingBalances[clientName] = (existingBalances[clientName] || 0) + amount;
  localStorage.setItem(CLIENT_BALANCES_KEY, JSON.stringify(existingBalances));
};

const mockSales: Sale[] = [
  { 
    id: 'V-1001', 
    date: '2024-11-10', 
    clientName: 'Laura Martínez', 
    clientEmail: 'laura@email.com',
    clientPhone: '3001234567',
    products: 'Vestido Largo Elegante', 
    quantity: 1, 
    total: 159900, 
    paymentMethod: 'Tarjeta', 
    seller: 'María García', 
    status: 'Completada',
    items: [
      { productId: '1', productName: 'Vestido Largo Elegante', quantity: 1, unitPrice: 159900, size: 'M', color: 'Negro' }
    ]
  },
  { 
    id: 'V-1002', 
    date: '2024-11-10', 
    clientName: 'Sofía Gómez', 
    clientEmail: 'sofia@email.com',
    clientPhone: '3107654321',
    products: 'Set Deportivo Premium', 
    quantity: 2, 
    total: 259800, 
    paymentMethod: 'Efectivo', 
    seller: 'Juan Pérez', 
    status: 'Completada',
    items: [
      { productId: '2', productName: 'Set Deportivo Premium', quantity: 2, unitPrice: 129900, size: 'S', color: 'Gris' }
    ]
  },
];

export function VentasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [cancelReason, setCancelReason] = useState('');
  const { showToast } = useToast();

  // Cargar ventas al inicio y cuando se dispare el evento
  useEffect(() => {
    const loadSales = () => {
      const storedSales = getSales();
      // Combinar ventas mock con las almacenadas
      const allSales = [...mockSales, ...storedSales];
      setSales(allSales);
    };

    loadSales();

    // Escuchar actualizaciones desde Pedidos
    const handleSalesUpdate = () => {
      loadSales();
    };

    // Escuchar evento de navegación desde Devoluciones
    const handleNavigateToSale = (event: any) => {
      const { saleId } = event.detail;
      const sale = sales.find(s => s.id === saleId);
      if (sale) {
        handleOpenReturnModal(sale);
      }
    };

    window.addEventListener('salesUpdated', handleSalesUpdate);
    window.addEventListener('navigateToSale', handleNavigateToSale);
    return () => {
      window.removeEventListener('salesUpdated', handleSalesUpdate);
      window.removeEventListener('navigateToSale', handleNavigateToSale);
    };
  }, []);

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setIsViewModalOpen(true);
  };

  const handleOpenReturnModal = (sale: Sale) => {
    if (!sale.items || sale.items.length === 0) {
      showToast('Esta venta no tiene productos para devolver', 'error');
      return;
    }

    setSelectedSale(sale);
    // Inicializar items de devolución con cantidad 0
    setReturnItems(sale.items.map(item => ({
      ...item,
      returnQuantity: 0
    })));
    setIsReturnModalOpen(true);
  };

  const handleReturnQuantityChange = (index: number, value: number) => {
    const newReturnItems = [...returnItems];
    const maxQuantity = newReturnItems[index].quantity;
    newReturnItems[index].returnQuantity = Math.max(0, Math.min(value, maxQuantity));
    setReturnItems(newReturnItems);
  };

  const handleGenerateReturn = () => {
    if (!selectedSale) return;

    // Filtrar solo los items con cantidad a devolver > 0
    const itemsToReturn = returnItems.filter(item => item.returnQuantity > 0);

    if (itemsToReturn.length === 0) {
      showToast('Debes seleccionar al menos un producto para devolver', 'error');
      return;
    }

    // Calcular total de devolución
    const returnTotal = itemsToReturn.reduce((sum, item) => 
      sum + (item.unitPrice * item.returnQuantity), 0
    );

    // Crear registro de devolución
    const returnData = {
      id: `DEV-${String(Date.now()).slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      saleId: selectedSale.id,
      clientName: selectedSale.clientName,
      clientEmail: selectedSale.clientEmail,
      clientPhone: selectedSale.clientPhone,
      items: itemsToReturn.map(item => ({
        productName: item.productName,
        quantity: item.returnQuantity,
        unitPrice: item.unitPrice,
        size: item.size,
        color: item.color,
        total: item.unitPrice * item.returnQuantity
      })),
      total: returnTotal,
      reason: 'Devolución solicitada por el cliente',
      status: 'Aprobada'
    };

    // Guardar devolución
    saveReturn(returnData);

    // Agregar saldo a favor del cliente
    addClientBalance(selectedSale.clientName, returnTotal);

    // Disparar evento para actualizar módulo de devoluciones
    window.dispatchEvent(new Event('returnsUpdated'));

    showToast(`Devolución generada exitosamente. Saldo a favor: $${returnTotal.toLocaleString()}`, 'success');
    setIsReturnModalOpen(false);
    setSelectedSale(null);
    setReturnItems([]);
  };

  const handleOpenCancelModal = (sale: Sale) => {
    if (sale.status === 'Anulada') {
      showToast('Esta venta ya está anulada', 'error');
      return;
    }
    setSelectedSale(sale);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleCancelSale = () => {
    if (!selectedSale) return;

    if (!cancelReason.trim()) {
      showToast('Debes especificar el motivo de anulación', 'error');
      return;
    }

    // Actualizar la venta a estado Anulada
    const updatedSales = sales.map(sale => 
      sale.id === selectedSale.id 
        ? { 
            ...sale, 
            status: 'Anulada' as const,
            cancelledBy: 'Usuario Actual', // En producción vendría del contexto de auth
            cancelledDate: new Date().toISOString().split('T')[0],
            cancelReason: cancelReason
          }
        : sale
    );

    // Guardar solo las ventas que no son mock
    const salesToSave = updatedSales.filter(s => !mockSales.find(m => m.id === s.id));
    saveSales(salesToSave);
    
    setSales(updatedSales);
    
    // Disparar evento para actualizar otros módulos
    window.dispatchEvent(new Event('salesUpdated'));

    showToast('Venta anulada exitosamente', 'success');
    setIsCancelModalOpen(false);
    setSelectedSale(null);
    setCancelReason('');
  };

  const totalVentas = sales.filter(s => s.status === 'Completada').reduce((sum, sale) => sum + sale.total, 0);
  const ventasHoy = sales.filter(s => s.date === new Date().toISOString().split('T')[0] && s.status === 'Completada')
    .reduce((sum, sale) => sum + sale.total, 0);
  const ventasAnuladas = sales.filter(s => s.status === 'Anulada').length;

  const columns = [
    {
      key: 'id',
      label: 'Venta',
      render: (sale: Sale) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-medium">{sale.id}</span>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Fecha',
      render: (sale: Sale) => new Date(sale.date).toLocaleDateString('es-ES'),
    },
    { 
      key: 'clientName', 
      label: 'Cliente',
      render: (sale: Sale) => (
        <div>
          <p className="font-medium">{sale.clientName}</p>
          {sale.fromOrder && (
            <p className="text-xs text-gray-500">Desde {sale.fromOrder}</p>
          )}
        </div>
      ),
    },
    { key: 'products', label: 'Productos' },
    { key: 'quantity', label: 'Cantidad' },
    {
      key: 'total',
      label: 'Total',
      render: (sale: Sale) => (
        <span className="font-semibold text-green-600">
          ${sale.total.toLocaleString()}
        </span>
      ),
    },
    { key: 'paymentMethod', label: 'Método de Pago' },
    { key: 'seller', label: 'Vendedor' },
    {
      key: 'status',
      label: 'Estado',
      render: (sale: Sale) => (
        sale.status === 'Completada'
          ? <Badge variant="success">Completada</Badge>
          : <Badge variant="danger">Anulada</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (sale: Sale) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewSale(sale)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => handleOpenReturnModal(sale)}
            className="px-2 py-1 text-xs bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-1"
            title="Generar devolución"
          >
            <RotateCcw className="h-3 w-3" />
            Devolución
          </button>
          <button
            onClick={() => handleOpenCancelModal(sale)}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-1"
            title="Anular venta"
          >
            <XCircle className="h-3 w-3" />
            Anular
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ventas</h1>
        <p className="text-gray-600">Registro de todas las ventas realizadas</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Ventas</p>
              <p className="text-2xl font-bold">${totalVentas.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ventas Hoy</p>
              <p className="text-2xl font-bold">${ventasHoy.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transacciones</p>
              <p className="text-2xl font-bold">{sales.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Badge variant="info">{sales.length}</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ventas Anuladas</p>
              <p className="text-2xl font-bold text-red-600">{ventasAnuladas}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <DataTable
          data={sales}
          columns={columns}
          searchPlaceholder="Buscar ventas..."
        />
      </Card>

      {/* Modal Ver Detalle */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Detalle de Venta ${selectedSale?.id}`}
        size="lg"
      >
        {selectedSale && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-medium">{selectedSale.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha</p>
                <p className="font-medium">{new Date(selectedSale.date).toLocaleDateString('es-ES')}</p>
              </div>
              {selectedSale.clientEmail && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{selectedSale.clientEmail}</p>
                </div>
              )}
              {selectedSale.clientPhone && (
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium">{selectedSale.clientPhone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Método de Pago</p>
                <p className="font-medium">{selectedSale.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vendedor</p>
                <p className="font-medium">{selectedSale.seller}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                {selectedSale.status === 'Completada'
                  ? <Badge variant="success">Completada</Badge>
                  : <Badge variant="danger">Anulada</Badge>
                }
              </div>
              {selectedSale.fromOrder && (
                <div>
                  <p className="text-sm text-gray-600">Origen</p>
                  <p className="font-medium">Pedido {selectedSale.fromOrder}</p>
                </div>
              )}
            </div>

            {selectedSale.items && selectedSale.items.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Productos</h4>
                <div className="space-y-2">
                  {selectedSale.items.map((item: OrderItem, index: number) => (
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
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold">Total</p>
                <p className="text-2xl font-bold text-green-600">
                  ${selectedSale.total.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Cerrar
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenReturnModal(selectedSale);
                }}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Generar Devolución
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Generar Devolución */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title={`Generar Devolución - ${selectedSale?.id}`}
        size="lg"
      >
        {selectedSale && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Cliente: {selectedSale.clientName}</p>
              <p className="text-xs text-blue-700 mt-1">
                Saldo actual a favor: ${getClientBalance(selectedSale.clientName).toLocaleString()}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Selecciona los productos a devolver</h4>
              <div className="space-y-3">
                {returnItems.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">
                          Talla: {item.size} | Color: {item.color}
                        </p>
                        <p className="text-sm text-gray-600">
                          Precio: ${item.unitPrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Cantidad comprada: {item.quantity}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Label htmlFor={`return-qty-${index}`} className="text-sm">
                        Cantidad a devolver:
                      </Label>
                      <Input
                        id={`return-qty-${index}`}
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={item.returnQuantity}
                        onChange={(e) => handleReturnQuantityChange(index, parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                      {item.returnQuantity > 0 && (
                        <p className="text-sm font-medium text-green-600">
                          Subtotal: ${(item.unitPrice * item.returnQuantity).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border-t-4 border-orange-500">
              <div className="flex justify-between items-center">
                <p className="font-semibold">Total a devolver:</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${returnItems.reduce((sum, item) => sum + (item.unitPrice * item.returnQuantity), 0).toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Este monto se agregará como saldo a favor del cliente
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsReturnModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={handleGenerateReturn}
                className="bg-orange-600 hover:bg-orange-700"
                disabled={returnItems.every(item => item.returnQuantity === 0)}
              >
                Generar Devolución
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Anular Venta */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={`Anular Venta - ${selectedSale?.id}`}
        size="md"
      >
        {selectedSale && (
          <div className="space-y-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-red-900">Cliente: {selectedSale.clientName}</p>
              <p className="text-xs text-red-700 mt-1">
                Total de la venta: ${selectedSale.total.toLocaleString()}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Motivo de Anulación</h4>
              <Input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full"
                placeholder="Especifica el motivo de anulación"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCancelModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={handleCancelSale}
                className="bg-red-600 hover:bg-red-700"
                disabled={!cancelReason.trim()}
              >
                Anular Venta
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
