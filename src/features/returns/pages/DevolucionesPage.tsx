import { useState, useEffect } from 'react';
import { Card, Button, Input, Label, Modal, DataTable, Badge, useToast } from '../../../shared/components/native';
import { Plus, RotateCcw, Eye, Search } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';

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
}

interface ReturnItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  size: string;
  color: string;
  total: number;
  returnQuantity?: number;
}

interface Return {
  id: string;
  date: string;
  saleId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  items: ReturnItem[];
  total: number;
  reason: string;
  status: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Procesada';
}

const RETURNS_STORAGE_KEY = 'damabella_returns';
const SALES_STORAGE_KEY = 'damabella_sales';
const CLIENT_BALANCES_KEY = 'damabella_client_balances';

const getReturns = () => {
  const stored = localStorage.getItem(RETURNS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const getSales = () => {
  const stored = localStorage.getItem(SALES_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const getClientBalance = (clientName: string) => {
  const balances = localStorage.getItem(CLIENT_BALANCES_KEY);
  const existingBalances = balances ? JSON.parse(balances) : {};
  return existingBalances[clientName] || 0;
};

const saveReturn = (returnData: any) => {
  const returns = localStorage.getItem(RETURNS_STORAGE_KEY);
  const existingReturns = returns ? JSON.parse(returns) : [];
  existingReturns.push(returnData);
  localStorage.setItem(RETURNS_STORAGE_KEY, JSON.stringify(existingReturns));
};

const addClientBalance = (clientName: string, amount: number) => {
  const balances = localStorage.getItem(CLIENT_BALANCES_KEY);
  const existingBalances = balances ? JSON.parse(balances) : {};
  existingBalances[clientName] = (existingBalances[clientName] || 0) + amount;
  localStorage.setItem(CLIENT_BALANCES_KEY, JSON.stringify(existingBalances));
};

export default function DevolucionesPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCreateReturnModalOpen, setIsCreateReturnModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'view'>('view');
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [searchSaleId, setSearchSaleId] = useState('');
  const [foundSales, setFoundSales] = useState<any[]>([]);
  const { showToast } = useToast();
  const { user } = useAuth();

  // Cargar devoluciones al inicio
  useEffect(() => {
    const loadReturns = () => {
      const storedReturns = getReturns();
      setReturns(storedReturns);
    };

    loadReturns();

    // Escuchar actualizaciones desde Ventas
    const handleReturnsUpdate = () => {
      loadReturns();
    };

    window.addEventListener('returnsUpdated', handleReturnsUpdate);
    return () => window.removeEventListener('returnsUpdated', handleReturnsUpdate);
  }, []);

  const handleViewReturn = (returnItem: Return) => {
    setSelectedReturn(returnItem);
    setViewMode('view');
    setIsModalOpen(true);
  };

  const handleSearchSales = () => {
    const sales = getSales();
    
    // Incluir ventas mock también
    const mockSales = [
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
        status: 'Completada' as const,
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
        status: 'Completada' as const,
        items: [
          { productId: '2', productName: 'Set Deportivo Premium', quantity: 2, unitPrice: 129900, size: 'S', color: 'Gris' }
        ]
      },
    ];

    const allSales = [...mockSales, ...sales];
    
    if (!searchSaleId.trim()) {
      setFoundSales(allSales);
      showToast(`Se encontraron ${allSales.length} ventas`, 'success');
      return;
    }

    // Buscar por ID de venta o nombre de cliente
    const filtered = allSales.filter((sale: any) => 
      sale.id.toLowerCase().includes(searchSaleId.toLowerCase()) ||
      sale.clientName.toLowerCase().includes(searchSaleId.toLowerCase())
    );

    if (filtered.length === 0) {
      showToast('No se encontraron ventas con ese criterio', 'error');
      setFoundSales([]);
    } else {
      setFoundSales(filtered);
      showToast(`Se encontraron ${filtered.length} ventas`, 'success');
    }
  };

  const handleCreateReturnFromSale = (sale: any) => {
    if (!sale.items || sale.items.length === 0) {
      showToast('Esta venta no tiene productos para devolver', 'error');
      return;
    }

    if (sale.status === 'Anulada') {
      showToast('No se puede generar devolución de una venta anulada', 'error');
      return;
    }

    setSelectedSale(sale);
    // Inicializar items de devolución con cantidad 0
    setReturnItems(sale.items.map((item: OrderItem) => ({
      ...item,
      returnQuantity: 0,
      total: 0
    })));
    setIsSearchModalOpen(false);
    setIsCreateReturnModalOpen(true);
  };

  const handleReturnQuantityChange = (index: number, value: number) => {
    const newReturnItems = [...returnItems];
    const maxQuantity = returnItems[index].quantity;
    newReturnItems[index].returnQuantity = Math.max(0, Math.min(value, maxQuantity));
    newReturnItems[index].total = newReturnItems[index].returnQuantity * newReturnItems[index].unitPrice;
    setReturnItems(newReturnItems);
  };

  const handleGenerateReturn = () => {
    if (!selectedSale) return;

    // Filtrar solo los items con cantidad a devolver > 0
    const itemsToReturn = returnItems.filter(item => (item.returnQuantity || 0) > 0);

    if (itemsToReturn.length === 0) {
      showToast('Debes seleccionar al menos un producto para devolver', 'error');
      return;
    }

    // Calcular total de devolución
    const returnTotal = itemsToReturn.reduce((sum, item) => 
      sum + (item.unitPrice * (item.returnQuantity || 0)), 0
    );

    // Crear registro de devolución
 const handleGenerateReturn = () => {
  if (!selectedSale) return;

  // Filtrar solo los items con cantidad a devolver > 0
  const itemsToReturn = returnItems.filter(item => (item.returnQuantity || 0) > 0);

  if (itemsToReturn.length === 0) {
    showToast('Debes seleccionar al menos un producto para devolver', 'error');
    return;
  }

  // Calcular total de devolución
  const returnTotal = itemsToReturn.reduce((sum, item) => 
    sum + (item.unitPrice * (item.returnQuantity || 0)), 0
  );

  // Crear registro de devolución con tipo Return
  const returnData: Return = {
    id: `DEV-${String(Date.now()).slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    saleId: selectedSale.id,
    clientName: selectedSale.clientName,
    clientEmail: selectedSale.clientEmail,
    clientPhone: selectedSale.clientPhone,
    items: itemsToReturn.map(item => ({
      productName: item.productName,
      quantity: item.returnQuantity || 0,
      unitPrice: item.unitPrice,
      size: item.size,
      color: item.color,
      total: item.unitPrice * (item.returnQuantity || 0)
    })),
    total: returnTotal,
    reason: 'Devolución solicitada por el cliente',
    status: 'Aprobada' as const // <--- literal para evitar error de tipo
  };

  // Guardar devolución
  saveReturn(returnData);

  // Agregar saldo a favor del cliente
  addClientBalance(selectedSale.clientName, returnTotal);

  // Actualizar la lista de devoluciones
  setReturns([...returns, returnData]);

  // Disparar evento para actualizar otros módulos
  window.dispatchEvent(new Event('returnsUpdated'));

  showToast(`Devolución generada exitosamente. Saldo a favor: $${returnTotal.toLocaleString()}`, 'success');
  setIsCreateReturnModalOpen(false);
  setSelectedSale(null);
  setReturnItems([]);
};


  const getStatusVariant = (status: Return['status']) => {
    switch (status) {
      case 'Procesada': return 'success';
      case 'Aprobada': return 'info';
      case 'Rechazada': return 'danger';
      default: return 'warning';
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'Devolución',
      render: (returnItem: Return) => (
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-gray-600" />
          <span className="font-medium">{returnItem.id}</span>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Fecha',
      render: (returnItem: Return) => new Date(returnItem.date).toLocaleDateString('es-ES'),
    },
    { 
      key: 'saleId', 
      label: 'Venta',
      render: (returnItem: Return) => (
        <span className="text-blue-600 font-medium">{returnItem.saleId}</span>
      ),
    },
    { 
      key: 'clientName', 
      label: 'Cliente',
      render: (returnItem: Return) => (
        <div>
          <p className="font-medium">{returnItem.clientName}</p>
          <p className="text-xs text-gray-500">
            Saldo: ${getClientBalance(returnItem.clientName).toLocaleString()}
          </p>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Productos',
      render: (returnItem: Return) => `${returnItem.items.length} producto${returnItem.items.length > 1 ? 's' : ''}`,
    },
    {
      key: 'total',
      label: 'Monto',
      render: (returnItem: Return) => (
        <span className="font-semibold text-orange-600">${returnItem.total.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (returnItem: Return) => (
        <Badge variant={getStatusVariant(returnItem.status)}>
          {returnItem.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (returnItem: Return) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewReturn(returnItem)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devoluciones</h1>
          <p className="text-gray-600">Gestión de devoluciones y reembolsos</p>
        </div>
        <Button onClick={() => setIsSearchModalOpen(true)}>
          <Search className="h-4 w-4 mr-2" />
          Buscar Venta para Devolución
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Pendientes</p>
          <p className="text-2xl font-bold">{returns.filter(r => r.status === 'Pendiente').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Aprobadas</p>
          <p className="text-2xl font-bold">{returns.filter(r => r.status === 'Aprobada').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Devuelto</p>
          <p className="text-2xl font-bold text-orange-600">
            ${returns.reduce((sum, r) => sum + r.total, 0).toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Rechazadas</p>
          <p className="text-2xl font-bold text-red-600">{returns.filter(r => r.status === 'Rechazada').length}</p>
        </Card>
      </div>

      <Card className="p-6">
        <DataTable
          data={returns}
          columns={columns}
          searchPlaceholder="Buscar devoluciones..."
        />
      </Card>

      {/* Modal Ver Detalle */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Detalle de Devolución ${selectedReturn?.id}`}
        size="lg"
      >
        {selectedReturn && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-medium">{selectedReturn.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha</p>
                <p className="font-medium">{new Date(selectedReturn.date).toLocaleDateString('es-ES')}</p>
              </div>
              {selectedReturn.clientEmail && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{selectedReturn.clientEmail}</p>
                </div>
              )}
              {selectedReturn.clientPhone && (
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium">{selectedReturn.clientPhone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Venta Original</p>
                <p className="font-medium text-blue-600">{selectedReturn.saleId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <Badge variant={getStatusVariant(selectedReturn.status)}>
                  {selectedReturn.status}
                </Badge>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-900">
                Saldo a favor del cliente: <strong>${getClientBalance(selectedReturn.clientName).toLocaleString()}</strong>
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Productos Devueltos</h4>
              <div className="space-y-2">
                {selectedReturn.items.map((item, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">
                          Talla: {item.size} | Color: {item.color}
                        </p>
                        <p className="text-sm text-gray-600">
                          Cantidad: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.unitPrice.toLocaleString()}</p>
                        <p className="text-sm font-semibold text-orange-600">
                          Subtotal: ${item.total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Motivo de la Devolución</p>
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedReturn.reason}</p>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-lg">Total Devuelto</p>
                <p className="text-2xl font-bold text-orange-600">${selectedReturn.total.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Buscar Ventas */}
      <Modal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title="Buscar Venta para Devolución"
        size="lg"
      >
        <div className="space-y-6">
          <div className="flex gap-3">
            <Input
              placeholder="ID de venta (V-1001) o nombre del cliente"
              value={searchSaleId}
              onChange={(e) => setSearchSaleId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSales()}
            />
            <Button onClick={handleSearchSales}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          {foundSales.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Ventas Encontradas ({foundSales.length})</h4>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {foundSales.map((sale) => (
                  <div key={sale.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-blue-600">{sale.id}</p>
                        <p className="text-sm text-gray-600">Cliente: {sale.clientName}</p>
                        <p className="text-xs text-gray-500">
                          Fecha: {new Date(sale.date).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${sale.total.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">{sale.paymentMethod}</p>
                      </div>
                    </div>
                    
                    {sale.items && sale.items.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-600 mb-1">Productos:</p>
                        {sale.items.map((item: any, idx: number) => (
                          <p key={idx} className="text-xs text-gray-700">
                            • {item.productName} - {item.size} - {item.color} (x{item.quantity})
                          </p>
                        ))}
                      </div>
                    )}

                    <Button
                      onClick={() => handleCreateReturnFromSale(sale)}
                      className="w-full mt-3 bg-orange-600 hover:bg-orange-700"
                      size="sm"
                    >
                      <RotateCcw className="h-3 w-3 mr-2" />
                      Generar Devolución
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {foundSales.length === 0 && searchSaleId && (
            <div className="text-center py-8 text-gray-500">
              <p>No se encontraron ventas</p>
              <p className="text-sm">Intenta con otro ID o nombre de cliente</p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setIsSearchModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Crear Devolución */}
      <Modal
        isOpen={isCreateReturnModalOpen}
        onClose={() => setIsCreateReturnModalOpen(false)}
        title="Generar Devolución"
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
                <p className="text-sm text-gray-600">Venta Original</p>
                <p className="font-medium text-blue-600">{selectedSale.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <Badge variant={selectedSale.status === 'Completada' ? 'success' : 'danger'}>
                  {selectedSale.status}
                </Badge>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-900">
                Saldo a favor del cliente: <strong>${getClientBalance(selectedSale.clientName).toLocaleString()}</strong>
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Productos Devueltos</h4>
              <div className="space-y-2">
                {returnItems.map((item, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">
                          Talla: {item.size} | Color: {item.color}
                        </p>
                        <p className="text-sm text-gray-600">
                          Cantidad: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.unitPrice.toLocaleString()}</p>
                        <p className="text-sm font-semibold text-orange-600">
                          Subtotal: ${item.total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label>Cantidad a Devolver</Label>
                      <Input
                        type="number"
                        value={item.returnQuantity || 0}
                        onChange={(e) => handleReturnQuantityChange(index, parseInt(e.target.value))}
                        min="0"
                        max={item.quantity}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-lg">Total Devuelto</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${returnItems.reduce((sum, item) => sum + (item.unitPrice * (item.returnQuantity || 0)), 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateReturnModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" onClick={handleGenerateReturn}>
                Generar Devolución
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
}