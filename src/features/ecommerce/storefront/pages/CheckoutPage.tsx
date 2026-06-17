import React, { useState, useContext, useMemo, useEffect } from 'react';
import { EcommerceContext } from '@/shared/contexts';
import { PremiumNavbar } from '../components/PremiumNavbar';
import { Package, ChevronDown } from 'lucide-react';
import { useToast } from '../../../../shared/components/native';
import { createOrder, getAllPaymentMethods, getAllStates } from '../../orders/services/OrderServices';
import { getAllClients, createClients, CreateClientsDTO } from '../../customers/services/clientsServices';
import { formatCOP } from '@/features/dashboard/utils/dashboardHelpers';

// ✅ CONFIGURACIÓN DE ENVÍO
const MIN_SHIPPING_AMOUNT = 150000; // Monto mínimo para envío gratis
const STANDARD_SHIPPING_COST = 15000; // Costo de envío estándar

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
  const { showToast } = useToast();
  
  if (!ecommerceContext) {
    return <div className="text-center py-8">Error al cargar contexto</div>;
  }

  const { cart, clearCart, getProductStock, products } = ecommerceContext;

  const [paymentMethodsDB, setPaymentMethodsDB] = useState<any[]>([]);
  const [statesDB, setStatesDB] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar métodos de pago y estados disponibles del backend al montar el componente
  useEffect(() => {
    const loadDBData = async () => {
      try {
        const [methods, states] = await Promise.all([
          getAllPaymentMethods(),
          getAllStates(),
        ]);
        if (methods) setPaymentMethodsDB(methods);
        if (states) setStatesDB(states);
      } catch (err) {
        console.error('Error al cargar datos de pago y estados del backend:', err);
      }
    };
    loadDBData();
  }, []);

  // Estado del formulario
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: currentUser?.name || currentUser?.nombre || '',
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
  const iva = subtotal * 0.19;
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

  const handleConfirmPurchase = async () => {
    if (!isFormValid) {
      showToast('Por favor completa todos los campos correctamente', 'error');
      return;
    }

    // Validar stock disponible en tiempo real
    for (const item of cart) {
      const availableStock = getProductStock(item.productId, item.color, item.size);
      if (item.quantity > availableStock) {
        showToast(`Lo sentimos, "${item.productName}" (Talla: ${item.size}, Color: ${item.color}) ya no tiene stock suficiente. Disponible: ${availableStock} unidad(es).`, 'error');
        onNavigate('cart');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1) RESOLVER O CREAR CLIENTE EN EL BACKEND REAL
      let clientId: number | null = null;
      const directClientId = currentUser?.id_client ?? currentUser?.clientId ?? currentUser?.client?.id ?? (typeof currentUser?.client === 'number' ? currentUser.client : null);
      
      if (directClientId) {
        clientId = Number(directClientId);
        console.log('✅ Cliente ID directo desde currentUser:', clientId);
      } else {
        try {
          const clients = await getAllClients();
          const email = (currentUser?.email || '').toLowerCase().trim();
          
          let clientExistente = clients?.find((c: any) => 
            (c.email && c.email.toLowerCase().trim() === email) ||
            (c.phone && c.phone.trim() === shippingInfo.phone.trim()) ||
            (c.doc && c.doc.trim() === shippingInfo.phone.trim())
          );

          if (clientExistente) {
            clientId = clientExistente.id_client;
            console.log('✅ Cliente encontrado en DB (por email, teléfono o documento):', clientId);
          } else {
            // Crear nuevo cliente
            const nuevoCliente = await createClients({
              name: shippingInfo.fullName,
              type_doc: 1, // Cédula de Ciudadanía
              doc: shippingInfo.phone, // Teléfono como doc temporal
              phone: shippingInfo.phone,
              email: currentUser?.email || '',
              address: shippingInfo.address,
              city: shippingInfo.city
            });
            if (nuevoCliente && nuevoCliente.id_client) {
              clientId = nuevoCliente.id_client;
              console.log('✅ Cliente creado en DB:', clientId);
            } else {
              throw new Error('No se pudo crear el cliente en el backend.');
            }
          }
        } catch (clientError: any) {
          console.error('Error al resolver cliente:', clientError);
          showToast('Error al procesar el cliente en el servidor.', 'error');
          setIsSubmitting(false);
          return;
        }
      }

      if (!clientId) {
        showToast('No se pudo determinar el identificador del cliente.', 'error');
        setIsSubmitting(false);
        return;
      }

      // 2) RESOLVER EL MÉTODO DE PAGO DESDE EL BACKEND
      let paymentMethodId = 1;
      const selectedName = 
        paymentMethod === 'card' ? 'tarjeta' : 
        paymentMethod === 'nequi' ? 'nequi' : 
        paymentMethod === 'bancolombia' ? 'bancolombia' : 'contra entrega';
      
      const matchedMethod = paymentMethodsDB.find(m => 
        m.name.toLowerCase().includes(selectedName) || 
        selectedName.includes(m.name.toLowerCase())
      );
      if (matchedMethod) {
        paymentMethodId = matchedMethod.id_method;
      } else if (paymentMethodsDB.length > 0) {
        paymentMethodId = paymentMethodsDB[0].id_method;
      }

      // 3) RESOLVER EL ESTADO PENDIENTE DESDE EL BACKEND
      let stateId = 1;
      const matchedState = statesDB.find(s => 
        s.name_state.toLowerCase().includes('pendiente')
      );
      if (matchedState) {
        stateId = matchedState.id_state;
      } else if (statesDB.length > 0) {
        stateId = statesDB[0].id_state;
      }

      // 4) CONSTRUIR PAYLOAD DE PEDIDO (DETAILS)
      const detail = cart.map((it: any) => {
        let vId = Number(it.variantId || 0);
        if (vId === 0) {
          // Intentar resolver desde los productos del contexto
          const prod = products.find(p => 
            String(p.id) === String(it.productId) || 
            String(p.id).replace(/^p/i, '') === String(it.productId).replace(/^p/i, '')
          );
          if (prod) {
            const v = prod.variants.find(varItem => varItem.color === it.color || varItem.color.toLowerCase() === (it.color || '').toLowerCase());
            if (v) {
              const s = v.sizes.find(sizeItem => sizeItem.size === it.size);
              if (s && s.variantId) {
                vId = Number(s.variantId);
                console.log(`✅ Variante resuelta defensivamente para ${it.productName}:`, vId);
              }
            }
          }
        }
        return {
          variant: vId,
          quantity: Number(it.quantity)
        };
      });

      // Validar variantes válidas antes de enviar
      const invalidItem = detail.find(d => d.variant === 0);
      if (invalidItem) {
        showToast('Hay un producto en el carrito con variante no válida.', 'error');
        setIsSubmitting(false);
        return;
      }

      const orderPayload = {
        client: clientId,
        payment_method: paymentMethodId,
        address_shipment: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.department} (CP: ${shippingInfo.postalCode})`,
        person_receives: shippingInfo.fullName,
        observations: `Pedido web. Teléfono de contacto: ${shippingInfo.phone}`,
        state: stateId,
        subtotal: subtotal.toFixed(2),
        iva: iva.toFixed(2),
        total: total.toFixed(2),
        detail
      };

      console.log('Sending CreateOrderDTO payload:', orderPayload);

      // 5) ENVIAR PEDIDO REAL AL BACKEND
      const result = await createOrder(orderPayload);
      if (result) {
        showToast('🛒 ¡Pedido generado exitosamente!', 'success');

        // Sincronizar en LocalStorage como backup para la UI administrativa local
        try {
          const PEDIDOS_KEY = 'damabella_pedidos';
          const pedidosRaw = localStorage.getItem(PEDIDOS_KEY) || '[]';
          const pedidos = JSON.parse(pedidosRaw);

          const itemsPedidoLocal = cart.map((it: any, idx: number) => ({
            id: `it-${Date.now()}-${idx}`,
            productoId: it.productId,
            productoNombre: it.productName || '',
            talla: it.size || '',
            color: it.color || '',
            cantidad: it.quantity || 1,
            precioUnitario: it.price || 0,
            subtotal: (it.price || 0) * (it.quantity || 1),
            variantId: it.variantId || null
          }));

          const nuevoPedidoLocal = {
            id: result.id_order || Date.now(),
            numeroPedido: result.number_order || `PED-${Date.now()}`,
            tipo: 'Pedido',
            clienteId: clientId,
            clienteNombre: shippingInfo.fullName,
            fechaPedido: new Date().toISOString(),
            estado: 'Pendiente',
            items: itemsPedidoLocal,
            productos: itemsPedidoLocal,
            subtotal: Number(subtotal.toFixed(2)),
            iva: Number(iva.toFixed(2)),
            total: Number(total.toFixed(2)),
            metodoPago: paymentMethod || 'unknown',
            observaciones: '',
            createdAt: new Date().toISOString(),
            venta_id: null
          };

          pedidos.push(nuevoPedidoLocal);
          localStorage.setItem(PEDIDOS_KEY, JSON.stringify(pedidos));

          // Guardar en historial de compras
          const purchases = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
          purchases.push({
            id: result.number_order || `ORD-${Date.now()}`,
            items: cart,
            subtotal: Number(subtotal.toFixed(2)),
            shipping: shippingCost,
            iva: Number(iva.toFixed(2)),
            total: Number(total.toFixed(2)),
            shippingInfo,
            paymentMethod,
            date: new Date().toLocaleDateString('es-CO'),
            timestamp: Date.now()
          });
          localStorage.setItem('purchaseHistory', JSON.stringify(purchases));

        } catch (localError) {
          console.warn('Error al guardar copia del pedido en almacenamiento local:', localError);
        }

        // Limpiar el carrito local
        clearCart();

        // Redirigir al historial de pedidos
        onNavigate('orders');
      } else {
        showToast('❌ Error en el servidor al guardar el pedido.', 'error');
      }
    } catch (e) {
      console.error('Error al procesar el pedido:', e);
      showToast('❌ Error inesperado al enviar el pedido.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pt-0 pb-8">
        <PremiumNavbar onNavigate={onNavigate} isAuthenticated={Boolean(currentUser)} currentUser={currentUser} />
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
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pt-0 pb-8">
      <PremiumNavbar onNavigate={onNavigate} isAuthenticated={Boolean(currentUser)} currentUser={currentUser} />
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Datos del pedido</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="md:col-span-2 space-y-6">
            {/* Información de envío */}
            <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de envío</h2>
              
              <div className="space-y-6">
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
            <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
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
                <div className="mt-6 space-y-6 pt-6 border-t">
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
                    📲 Simulación: recibirás instrucciones en tu app Nequi para completar el pago. No se realiza ninguna redirección ni pago real desde esta interfaz.
                  </p>
                </div>
              )}

              {paymentMethod === 'bancolombia' && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    🏦 Simulación: se mostrará información para completar el pago por Banco. No se realizará ninguna redirección ni pago real.
                  </p>
                </div>
              )}

              {paymentMethod === 'delivery' && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    🚚 Pagarás el total al recibir tu pedido en la dirección indicada (Pago contra entrega). Este flujo es solo visual.
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
                      <span>{formatCOP(item.price)}</span>
                      <span>{formatCOP(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <hr className="my-4" />

              {/* Totales */}
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>{formatCOP(subtotal)}</span>
                </div>

                <div className="flex justify-between text-gray-700">
                  <span>Envío:</span>
                  <span className={shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
                    {shippingCost === 0 ? '¡Gratis!' : formatCOP(shippingCost)}
                  </span>
                </div>

                <div className="flex justify-between text-gray-700">
                  <span>IVA (19%):</span>
                  <span>{formatCOP(iva)}</span>
                </div>

                <hr className="my-3" />

                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total:</span>
                  <span className="text-pink-600 font-extrabold">{formatCOP(total)}</span>
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
                    ℹ️ Envío gratis en compras mayores a {formatCOP(MIN_SHIPPING_AMOUNT)}
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(subtotal / MIN_SHIPPING_AMOUNT) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    Te faltan {formatCOP(MIN_SHIPPING_AMOUNT - subtotal + 1)} para envío gratis
                  </div>
                </div>
              )}

              {/* Botón de confirmación */}
              <button
                onClick={handleConfirmPurchase}
                disabled={!isFormValid || isSubmitting}
                className={`w-full mt-6 py-3 rounded-lg font-semibold transition ${
                  isFormValid && !isSubmitting
                    ? 'bg-pink-400 text-white hover:bg-pink-500 hover:scale-105 transform shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Procesando pedido...' : isFormValid ? 'Confirmar Pedido' : 'Completa el formulario'}
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
