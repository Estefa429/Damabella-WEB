import React, { useState, useEffect } from 'react';
import { CheckCircle, Package, DownloadCloud } from 'lucide-react';

interface PurchaseSuccessPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const PurchaseSuccessPage: React.FC<PurchaseSuccessPageProps> = ({ onNavigate }) => {
  const [purchase, setPurchase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
            <h1 className="text-2xl font-bold text-gray-800 mb-4">No hay compra registrada</h1>
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Encabezado de éxito */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-20 h-20 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">¡Compra Confirmada!</h1>
          <p className="text-lg text-gray-600">Gracias por tu compra</p>
        </div>

        {/* Número de orden */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-center">
          <p className="text-sm text-gray-600 mb-2">Número de orden</p>
          <p className="text-3xl font-bold text-blue-600 break-all">{purchase.id}</p>
          <p className="text-sm text-gray-600 mt-2">{purchase.date}</p>
        </div>

        {/* Información de envío */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de envío</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Nombre</p>
              <p className="text-lg text-gray-900 font-medium">{purchase.shippingInfo.fullName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Teléfono</p>
              <p className="text-lg text-gray-900 font-medium">{purchase.shippingInfo.phone}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 mb-1">Dirección</p>
              <p className="text-lg text-gray-900 font-medium">{purchase.shippingInfo.address}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Ciudad</p>
              <p className="text-lg text-gray-900 font-medium">{purchase.shippingInfo.city}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Departamento</p>
              <p className="text-lg text-gray-900 font-medium">{purchase.shippingInfo.department}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Código postal</p>
              <p className="text-lg text-gray-900 font-medium">{purchase.shippingInfo.postalCode}</p>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Productos</h2>
          
          <div className="space-y-4">
            {purchase.items.map((item: any, index: number) => (
              <div key={index} className="flex items-start justify-between pb-4 border-b last:border-b-0">
                <div className="flex items-start space-x-4 flex-1">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Cantidad: <span className="font-medium">{item.quantity}</span>
                    </p>
                    {item.color && (
                      <p className="text-sm text-gray-600">
                        Color: <span className="font-medium">{item.color}</span>
                      </p>
                    )}
                    {item.size && (
                      <p className="text-sm text-gray-600">
                        Talla: <span className="font-medium">{item.size}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">${item.price.toLocaleString('es-CO')}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    ${(item.price * item.quantity).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Método de pago */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Método de pago</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b">
              <span className="text-gray-700">Método de pago:</span>
              <span className="font-medium text-gray-900">
                {purchase.paymentMethod === 'card' && '💳 Tarjeta de crédito'}
                {purchase.paymentMethod === 'nequi' && '📱 Nequi'}
                {purchase.paymentMethod === 'bancolombia' && '🏦 Bancolombia'}
                {purchase.paymentMethod === 'delivery' && '🚚 Contra entrega'}
              </span>
            </div>

            {purchase.paymentMethod === 'card' && purchase.cardInfo && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Tarjeta:</span>
                  <span className="font-medium text-gray-900">
                    {purchase.cardInfo.name} (••••{purchase.cardInfo.lastFourDigits})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

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
            <li>✓ Recibirás un email de confirmación con los detalles de tu compra</li>
            <li>✓ El estado del pedido será actualizado a medida que se procese</li>
            <li>✓ Puedes rastrear tu envío desde tu panel de compras</li>
            <li>✓ Contacta al servicio al cliente si tienes preguntas</li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => onNavigate('orders')}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
          >
            <Package className="w-5 h-5" />
            Ver mis compras
          </button>

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
      </div>
    </div>
  );
};
