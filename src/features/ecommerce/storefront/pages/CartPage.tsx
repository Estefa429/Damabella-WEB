import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useEcommerce } from '../../../../shared/contexts';
import { useToast } from '../../../../shared/components/native';
import { PremiumNavbar } from '../components/PremiumNavbar';
import { PremiumFooter } from '../components/PremiumFooter';
import { formatCOP } from '@/features/dashboard/utils/dashboardHelpers';

interface CartPageProps {
  onNavigate: (view: string) => void;
  isAuthenticated?: boolean;
  currentUser?: any;
}

export function CartPage({ onNavigate, isAuthenticated = false, currentUser = null }: CartPageProps) {
  const { cart, updateCartQuantity, removeFromCart } = useEcommerce();
  const { showToast } = useToast();
  const [deletingItem, setDeletingItem] = useState<{ productId: string; color: string; size: string } | null>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 150000 ? 0 : 15000;
  const iva = subtotal * 0.19;
  const total = subtotal + shipping + iva;

  const handleDeleteClick = (productId: string, color: string, size: string) => {
    setDeletingItem({ productId, color, size });
  };

  const handleConfirmDelete = () => {
    if (deletingItem) {
      removeFromCart(deletingItem.productId, deletingItem.color, deletingItem.size);
      showToast('🗑️ Producto eliminado del carrito', 'info');
    }
    setDeletingItem(null);
  };

  const handleCancelDelete = () => {
    setDeletingItem(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PremiumNavbar onNavigate={onNavigate} isAuthenticated={isAuthenticated} currentUser={currentUser} />

      <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
        <h1 className="text-4xl text-gray-900 mb-10 font-bold">
          Carrito de Compras
        </h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <ShoppingBag size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-2xl text-gray-400 mb-6">Tu carrito está vacío</p>
            <button
              onClick={() => onNavigate('search')}
              className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-8 py-4 rounded-full hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-105 shadow-lg"
            >
              Explorar Productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item) => (
                <div key={`${item.productId}-${item.color}-${item.size}`} className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
                  <div className="flex gap-4 sm:gap-5 items-center flex-col sm:flex-row">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg self-center sm:self-auto"
                    />
                    <div className="flex-1 w-full">
                      <h3 className="text-base sm:text-lg text-gray-900 mb-1 font-semibold">{item.productName}</h3>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Color:</span>
                          <div
                            className="w-5 h-5 rounded-full border border-gray-300"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <span className="text-xs text-gray-900 font-medium">{item.color}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Talla:</span>
                          <span className="text-xs text-gray-900 font-bold">{item.size}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-between items-baseline gap-2 mb-2 pb-2 border-b border-gray-100">
                        <span className="text-xs text-gray-500 font-medium">
                          {formatCOP(item.price)} c/u
                        </span>
                        <span className="text-base sm:text-lg font-bold text-gray-900">
                          Subtotal: {formatCOP(item.price * item.quantity)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.color, item.size, item.quantity - 1)}
                            className="p-1.5 hover:bg-gray-100 transition-colors"
                          >
                            <Minus size={15} />
                          </button>
                          <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.color, item.size, item.quantity + 1)}
                            className="p-1.5 hover:bg-gray-100 transition-colors"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                        {deletingItem?.productId === item.productId && deletingItem?.color === item.color && deletingItem?.size === item.size ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-700 font-medium">¿Eliminar?</span>
                            <button
                              onClick={handleConfirmDelete}
                              className="px-2.5 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors font-medium"
                            >
                              Sí
                            </button>
                            <button
                              onClick={handleCancelDelete}
                              className="px-2.5 py-1 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDeleteClick(item.productId, item.color, item.size)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors flex items-center"
                            aria-label="Eliminar producto del carrito"
                          >
                            <Trash2 size={16} />
                            <span className="ml-1.5 text-xs text-red-600 font-medium">Eliminar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-8 sticky top-24">
                <h2 className="text-2xl text-gray-900 mb-6 font-bold">Resumen del Pedido</h2>
                
                <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatCOP(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Envío</span>
                    <span className={shipping === 0 ? 'text-green-600 font-bold' : 'font-semibold'}>
                      {shipping === 0 ? 'Gratis' : formatCOP(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>IVA (19%)</span>
                    <span className="font-semibold">{formatCOP(iva)}</span>
                  </div>
                  {subtotal <= 150000 && shipping > 0 && (
                    <p className="text-sm text-pink-400">
                      ¡Agrega {formatCOP(150001 - subtotal)} más para envío gratis!
                    </p>
                  )}
                </div>

                <div className="flex justify-between text-2xl font-bold text-gray-900 mb-6">
                  <span>Total</span>
                  <span className="text-pink-600">{formatCOP(total)}</span>
                </div>

                <button
                  onClick={() => onNavigate('checkout')}
                  className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-4 rounded-full hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-105 shadow-lg mb-3 font-semibold text-lg"
                >
                  Proceder al Pago
                </button>

                <button
                  onClick={() => onNavigate('search')}
                  className="w-full text-gray-700 py-4 rounded-full hover:bg-gray-100 transition-colors font-medium"
                >
                  Continuar Comprando
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <PremiumFooter onNavigate={onNavigate} />
    </div>
  );
}