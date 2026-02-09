import React, { useState, useContext, useMemo } from 'react';
import { EcommerceContext } from '../../../../shared/contexts';
import { Package, ChevronDown } from 'lucide-react';

// ✅ CONFIGURACIÓN DE ENVÍO
const MIN_SHIPPING_AMOUNT = 50000; // Monto mínimo para envío gratis
const STANDARD_SHIPPING_COST = 8000; // Costo de envío estándar

interface ShippingInfo {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  postalCode: string;
}

interface ShippingErrors {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  department?: string;
  postalCode?: string;
}

interface CheckoutPageProps {
  onNavigate: (view: string, param?: string) => void;
  currentUser: any;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate, currentUser }) => {
  const ecommerceContext = useContext(EcommerceContext);
  
  if (!ecommerceContext) {
    return <div className="text-center py-8">Error al cargar contexto</div>;
  }

  const { cart, clearCart } = ecommerceContext;

  // Estado del formulario
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: currentUser?.nombre || '',
    phone: '',
    address: '',
    city: '',
    department: '',
    postalCode: '',
  });

  const [errors, setErrors] = useState<ShippingErrors>({});
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'nequi' | 'bancolombia' | 'delivery'>('card');
  const [cardInfo, setCardInfo] = useState({
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
  });
  const [showCardForm, setShowCardForm] = useState(false);

  // Función para filtrar caracteres especiales según el tipo
  const filterSpecialChars = (value: string, fieldType: string = 'general'): string => {
    if (fieldType === 'address') {
      return value.replace(/[^a-zA-Z0-9\s\-.,#ñáéíóúÑÁÉÍÓÚ]/g, '');
    } else if (fieldType === 'phone') {
      return value.replace(/\D/g, '');
    }
    return value.replace(/[^a-zA-Z\s\-'ñáéíóúÑÁÉÍÓÚ]/g, '');
  };

  // Validadores
  const validateSpecialChars = (value: string, fieldType: string = 'general'): boolean => {
    // Expresiones regulares para diferentes tipos de campos
    if (fieldType === 'address') {
      // Las direcciones pueden contener números, letras, espacios, guiones, puntos, comas, #, @
      return /^[a-zA-Z0-9\s\-.,#@ñáéíóúÑÁÉÍÓÚ]*$/.test(value);
    }
    // Para otros campos: solo letras, números, espacios y algunos caracteres permitidos
    return /^[a-zA-Z0-9\s\-'ñáéíóúÑÁÉÍÓÚ]*$/.test(value);
  };

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
        if (!validateSpecialChars(value)) return 'El nombre contiene caracteres no permitidos';
        return undefined;
      case 'phone':
        if (!/^\d{7,10}$/.test(value)) return 'Teléfono inválido (7-10 dígitos)';
        return undefined;
      case 'address':
        if (value.trim().length < 5) return 'La dirección debe tener al menos 5 caracteres';
        if (!validateSpecialChars(value, 'address')) return 'La dirección contiene caracteres no permitidos';
        return undefined;
      case 'city':
        if (value.trim().length < 2) return 'La ciudad es requerida';
        if (!validateSpecialChars(value)) return 'La ciudad contiene caracteres no permitidos';
        return undefined;
      case 'department':
        if (value.trim().length < 2) return 'El departamento es requerido';
        if (!validateSpecialChars(value)) return 'El departamento contiene caracteres no permitidos';
        return undefined;
      case 'postalCode':
        if (!/^\d{4,6}$/.test(value)) return 'Código postal inválido (4-6 dígitos)';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleShippingChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
    
    const error = validateField(field, value);
    setErrors(prev => {
      if (error) {
        return { ...prev, [field]: error };
      } else {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
    });
  };

  const handleCardChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'cardName') {
      // Solo permitir letras, espacios y acentos para el nombre
      formattedValue = value.replace(/[^a-zA-Z\s\-'ñáéíóúÑÁÉÍÓÚ]/g, '').toUpperCase();
    } else if (field === 'cardNumber') {
      formattedValue = value.replace(/\D/g, '').slice(0, 16);
    } else if (field === 'cardExpiry') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
      }
    } else if (field === 'cardCVC') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }
    
    setCardInfo(prev => ({ ...prev, [field]: formattedValue }));
  };

  // Cálculos
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const shippingCost = subtotal > MIN_SHIPPING_AMOUNT ? 0 : STANDARD_SHIPPING_COST;
  const iva = (subtotal + shippingCost) * 0.19;
  const total = subtotal + shippingCost + iva;

  const hasErrors = Object.keys(errors).length > 0;
  const isFormValid = 
    shippingInfo.fullName &&
    shippingInfo.phone &&
    shippingInfo.address &&
    shippingInfo.city &&
    shippingInfo.department &&
    shippingInfo.postalCode &&
    !hasErrors;

  const handleConfirmPurchase = () => {
    if (!isFormValid) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    // Crear objeto de compra
    const purchase = {
      id: `ORD-${Date.now()}`,
      items: cart,
      subtotal: Number(subtotal.toFixed(2)),
      shipping: shippingCost,
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
      shippingInfo,
      paymentMethod,
      cardInfo: paymentMethod === 'card' ? {
        lastFourDigits: cardInfo.cardNumber.slice(-4),
        name: cardInfo.cardName,
      } : null,
      date: new Date().toLocaleDateString('es-CO'),
      timestamp: Date.now(),
    };

    // Guardar en localStorage
    localStorage.setItem('lastPurchase', JSON.stringify(purchase));
    
    // Guardar en historial de compras
    const purchases = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
    purchases.push(purchase);
    localStorage.setItem('purchaseHistory', JSON.stringify(purchases));

    console.log('✅ Compra creada:', purchase);

    // Limpiar carrito
    clearCart();

    // Navegar a página de éxito
    onNavigate('purchase-success');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h1>
            <p className="text-gray-600 mb-6">Agrega productos antes de proceder al checkout</p>
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
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="md:col-span-2 space-y-6">
            {/* Información de envío */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de envío</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                  <input
                    type="text"
                    value={shippingInfo.fullName}
                    onChange={(e) => handleShippingChange('fullName', filterSpecialChars(e.target.value))}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 ${
                      errors.fullName ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Juan Pérez"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={shippingInfo.phone}
                    onChange={(e) => handleShippingChange('phone', filterSpecialChars(e.target.value, 'phone'))}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 ${
                      errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="3001234567"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={shippingInfo.address}
                    onChange={(e) => handleShippingChange('address', filterSpecialChars(e.target.value, 'address'))}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 ${
                      errors.address ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Calle 50 #10-20 Apt 301"
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={shippingInfo.city}
                      onChange={(e) => handleShippingChange('city', filterSpecialChars(e.target.value))}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 ${
                        errors.city ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Medellín"
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                    <input
                      type="text"
                      value={shippingInfo.department}
                      onChange={(e) => handleShippingChange('department', filterSpecialChars(e.target.value))}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 ${
                        errors.department ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Antioquia"
                    />
                    {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código postal</label>
                    <input
                      type="text"
                      value={shippingInfo.postalCode}
                      onChange={(e) => handleShippingChange('postalCode', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 ${
                        errors.postalCode ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="050010"
                    />
                    {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Método de pago */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Método de pago</h2>
              
              <div className="space-y-3">
                {[
                  { id: 'card', label: '💳 Tarjeta de crédito' },
                  { id: 'nequi', label: '📱 Nequi' },
                  { id: 'bancolombia', label: '🏦 Bancolombia' },
                  { id: 'delivery', label: '🚚 Contra entrega' },
                ].map((method) => (
                  <label key={method.id} className="flex items-center cursor-pointer p-3 border rounded-lg hover:bg-pink-50 transition" style={{borderColor: paymentMethod === method.id ? '#ec4899' : '#d1d5db'}}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id as any}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value as any);
                        if (e.target.value === 'card') {
                          setShowCardForm(true);
                        } else {
                          setShowCardForm(false);
                        }
                      }}
                      className="w-4 h-4 text-pink-400"
                    />
                    <span className="ml-3 text-gray-700">{method.label}</span>
                  </label>
                ))}
              </div>

              {/* Formulario de tarjeta */}
              {paymentMethod === 'card' && (
                <div className="mt-6 space-y-4 pt-6 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre en la tarjeta</label>
                    <input
                      type="text"
                      value={cardInfo.cardName}
                      onChange={(e) => handleCardChange('cardName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                      placeholder="JUAN PEREZ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de tarjeta</label>
                    <input
                      type="text"
                      value={cardInfo.cardNumber}
                      onChange={(e) => handleCardChange('cardNumber', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                      placeholder="4532 1234 5678 9010"
                      maxLength={19}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
                      <input
                        type="text"
                        value={cardInfo.cardExpiry}
                        onChange={(e) => handleCardChange('cardExpiry', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                        placeholder="MM/YY"
                      maxLength={5}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                      <input
                        type="text"
                        value={cardInfo.cardCVC}
                        onChange={(e) => handleCardChange('cardCVC', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                        placeholder="123"
                      maxLength={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'nequi' && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    📲 Recibirás un código en tu app Nequi para confirmar la compra después de hacer clic en "Confirmar Compra"
                  </p>
                </div>
              )}

              {paymentMethod === 'bancolombia' && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    🏦 Serás redirigido a Bancolombia para completar tu transacción de manera segura
                  </p>
                </div>
              )}

              {paymentMethod === 'delivery' && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    🚚 Pagarás el total al recibir tu pedido en la dirección indicada
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen del pedido</h2>

              {/* Productos */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={`${item.productId}-${item.color}-${item.size}`} className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-700">{item.productName}</span>
                      <span className="text-gray-700 font-medium">x{item.quantity}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>${item.price.toLocaleString('es-CO')}</span>
                      <span>${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                ))}
              </div>

              <hr className="my-4" />

              {/* Totales */}
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>${subtotal.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                </div>

                <div className="flex justify-between text-gray-700">
                  <span>Envío:</span>
                  <span className={shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
                    {shippingCost === 0 ? '¡Gratis!' : `$${shippingCost.toLocaleString('es-CO')}`}
                  </span>
                </div>

                <div className="flex justify-between text-gray-700">
                  <span>IVA (19%):</span>
                  <span>${iva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                </div>

                <hr className="my-3" />

                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total:</span>
                  <span className="text-pink-600">${total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              {/* Nota de envío gratis */}
              {shippingCost === 0 && subtotal > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-700 font-medium">
                    ✅ ¡Envío GRATIS! Tu compra califica para envío sin costo.
                  </div>
                </div>
              )}

              {subtotal > 0 && subtotal <= MIN_SHIPPING_AMOUNT && shippingCost > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs text-gray-700 mb-2">
                    ℹ️ Envío gratis en compras mayores a ${MIN_SHIPPING_AMOUNT.toLocaleString('es-CO')}
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(subtotal / MIN_SHIPPING_AMOUNT) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    Te faltan ${(MIN_SHIPPING_AMOUNT - subtotal).toLocaleString('es-CO')} para envío gratis
                  </div>
                </div>
              )}

              {/* Botón de confirmación */}
              <button
                onClick={handleConfirmPurchase}
                disabled={!isFormValid}
                className={`w-full mt-6 py-3 rounded-lg font-semibold transition ${
                  isFormValid
                    ? 'bg-pink-400 text-white hover:bg-pink-500'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isFormValid ? 'Confirmar Compra' : 'Completa el formulario'}
              </button>

              {/* Botón de volver */}
              <button
                onClick={() => onNavigate('cart')}
                className="w-full mt-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Volver al carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
