import React, { useState, useEffect } from 'react';
import { CheckCircle, Package, DownloadCloud } from 'lucide-react';
import { PremiumNavbar } from '../components/PremiumNavbar';

interface PurchaseSuccessPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const PurchaseSuccessPage: React.FC<PurchaseSuccessPageProps> = ({ onNavigate }) => {
  const [purchase, setPurchase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    // Cargar la última compra del localStorage
    const lastPurchase = localStorage.getItem('lastPurchase');
    if (lastPurchase) {
      try {
        setPurchase(JSON.parse(lastPurchase));
      } catch (error) {
        console.error('Error loading purchase:', error);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">No hay pedido registrado</h1>
            <p className="text-gray-600 mb-6">Parece que no hay datos de compra disponibles</p>
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition"
            >
              Volver a la tienda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white mt-0 pt-0" style={{ marginTop: 0 }}>
      <PremiumNavbar onNavigate={onNavigate} isAuthenticated={false} currentUser={null} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">

          {/* Main content (center/left) */}
          <main className="md:col-span-2">
            {/* Encabezado de éxito */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-20 h-20 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pedido generado</h1>
              <p className="text-lg text-gray-600">Pedido pendiente de confirmación</p>
              <div className="mt-3">
                {purchase?.estado === 'Pagado' ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-800 border border-green-200">
                    ✅ Estado: Pedido pagado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
                    ⚠️ Estado: Pedido pendiente de pago
                  </span>
                )}
              </div>
            </div>

            {/* Información para pago (mover arriba) */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Información para pago</h2>

              <div className="space-y-3 text-sm text-gray-600">
                <p>Simulación: esta sección muestra información para completar el pago fuera de esta interfaz. No se realiza ningún cargo ni redirección desde el dashboard.</p>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Método seleccionado</p>
                    <p className="text-base font-medium text-gray-900">
                      {purchase.paymentMethod === 'card' && '💳 Tarjeta de crédito'}
                      {purchase.paymentMethod === 'nequi' && '📱 Nequi'}
                      {purchase.paymentMethod === 'bancolombia' && '🏦 Bancolombia'}
                      {purchase.paymentMethod === 'delivery' && '🚚 Contra entrega'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Totales</p>
                    <p className="text-base font-medium text-gray-900">Subtotal: ${purchase.subtotal.toLocaleString('es-CO')}</p>
                    <p className="text-base font-medium text-gray-900">Total: ${purchase.total.toLocaleString('es-CO')}</p>
                  </div>
                </div>

                <div className="mt-2 grid md:grid-cols-2 gap-3">
                  <div className="flex flex-col items-center justify-center p-3 border rounded-md">
                    <div className="w-32 h-32 bg-gray-100 flex items-center justify-center rounded-md">
                      <span className="text-xs text-gray-500">QR simulado</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Código de pago (simulado): <span className="font-mono">{purchase.id}-QR</span></p>
                  </div>

                  <div className="p-3 border rounded-md text-sm text-gray-700">
                    <p className="mb-1">Instrucciones (simulación)</p>
                    <p>Usa la referencia <span className="font-mono">{purchase.id}</span> al realizar la transferencia o pago en tu app bancaria. Esta página no procesa pagos.</p>
                    {purchase.paymentMethod === 'card' && purchase.cardInfo && (
                      <p className="mt-2">Tarjeta registrada: {purchase.cardInfo.name} (••••{purchase.cardInfo.lastFourDigits}). No se ejecuta cargo desde esta interfaz.</p>
                    )}
                    {purchase.paymentMethod === 'nequi' && (
                      <p className="mt-2">Simulación Nequi: abre tu app y paga usando la referencia indicada.</p>
                    )}
                    {purchase.paymentMethod === 'bancolombia' && (
                      <p className="mt-2">Simulación transferencia: puedes usar la referencia y el valor mostrado para realizar la transferencia en tu banco.</p>
                    )}
                    {purchase.paymentMethod === 'delivery' && (
                      <p className="mt-2">Pago contra entrega: prepara el efectivo o medio de pago al recibir el pedido.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Productos + Método de pago en una fila (desktop) */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Productos</h2>
                <div className="space-y-3">
                  {purchase.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-start justify-between pb-2 border-b last:border-b-0">
                      <div className="flex items-start space-x-3 flex-1">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
                          <p className="text-xs text-gray-600 mt-1">Cantidad: <span className="font-medium">{item.quantity}</span></p>
                          {item.color && <p className="text-xs text-gray-600">Color: <span className="font-medium">{item.color}</span></p>}
                          {item.size && <p className="text-xs text-gray-600">Talla: <span className="font-medium">{item.size}</span></p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 text-sm">${item.price.toLocaleString('es-CO')}</p>
                        <p className="text-xs text-gray-600 mt-1">${(item.price * item.quantity).toLocaleString('es-CO')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Método de pago</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-gray-700">Método de pago:</span>
                    <span className="font-medium text-gray-900 text-sm">
                      {purchase.paymentMethod === 'card' && '💳 Tarjeta de crédito'}
                      {purchase.paymentMethod === 'nequi' && '📱 Nequi'}
                      {purchase.paymentMethod === 'bancolombia' && '🏦 Bancolombia'}
                      {purchase.paymentMethod === 'delivery' && '🚚 Contra entrega'}
                    </span>
                  </div>

                  {purchase.paymentMethod === 'card' && purchase.cardInfo && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">Tarjeta:</span>
                      <span className="font-medium text-gray-900">{purchase.cardInfo.name} (••••{purchase.cardInfo.lastFourDigits})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

        {/* (Se eliminó sección duplicada de 'Información para pago' — se conserva la sección superior) */}

        {/* Resumen total */}
        <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg p-6 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span>${purchase.subtotal.toLocaleString('es-CO')}</span>
            </div>

            <div className="flex justify-between text-gray-700">
              <span>Envío:</span>
              <span className={purchase.shipping === 0 ? 'text-green-600 font-medium' : ''}>
                {purchase.shipping === 0 ? '¡Gratis!' : `$${purchase.shipping.toLocaleString('es-CO')}`}
              </span>
            </div>

            <div className="flex justify-between text-gray-700">
              <span>IVA (19%):</span>
              <span>${purchase.iva.toLocaleString('es-CO')}</span>
            </div>

            <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
              <span>Total:</span>
              <span className="text-pink-600">${purchase.total.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">✉️ Próximos pasos</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>✓ Recibirás un email cuando el pago sea validado y el pedido confirmado</li>
            <li>✓ El estado del pedido será actualizado una vez se valide el pago</li>
            <li>✓ Puedes rastrear tu envío desde tu panel de pedidos</li>
            <li>✓ Contacta al servicio al cliente si tienes preguntas</li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-4">
            <button
              onClick={() => onNavigate('orders')}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              Ver mis pedidos
            </button>

            {purchase && purchase.estado !== 'Pagado' && (
              <button
                onClick={async () => {
                  try {
                    setSimulating(true);
                    const updated = { ...purchase, estado: 'Pagado', paidAt: new Date().toISOString() };

                    // Actualizar solo el objeto lastPurchase en localStorage (cliente)
                    localStorage.setItem('lastPurchase', JSON.stringify(updated));
                    setPurchase(updated);
                  } catch (e) {
                    console.error('Error simulando pago:', e);
                  } finally {
                    setSimulating(false);
                  }
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                {simulating ? 'Simulando...' : 'Simular pago realizado'}
              </button>
            )}
          </div>

          <button
            onClick={() => onNavigate('home')}
            className="flex-1 px-6 py-3 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition font-medium"
          >
            Volver a la tienda
          </button>
        </div>

        {/* Información de contacto */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600 mb-2">¿Tienes preguntas?</p>
          <button
            onClick={() => onNavigate('contact')}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Contáctanos →
          </button>
        </div>
      </main>

      {/* Right column: Información del pedido */}
      <aside className="md:col-span-1">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 sticky top-20">
          <p className="text-sm text-gray-600 mb-2">Número de pedido</p>
          <p className="text-2xl font-bold text-blue-700 break-all mb-2">{purchase.id}</p>
          <p className="text-sm text-gray-600 mb-4">{purchase.date}</p>

          <div className="mb-4">
            <p className="text-sm text-gray-600">Estado</p>
            <p className="font-medium">{purchase.estado}</p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">Método de pago</p>
            <p className="font-medium">
              {purchase.paymentMethod === 'card' && '💳 Tarjeta de crédito'}
              {purchase.paymentMethod === 'nequi' && '📱 Nequi'}
              {purchase.paymentMethod === 'bancolombia' && '🏦 Bancolombia'}
              {purchase.paymentMethod === 'delivery' && '🚚 Contra entrega'}
            </p>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>${purchase.subtotal.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Envío</span>
              <span>{purchase.shipping === 0 ? '¡Gratis!' : `$${purchase.shipping.toLocaleString('es-CO')}`}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Total</span>
              <span className="font-bold text-pink-600">${purchase.total.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</div>
  );
};
