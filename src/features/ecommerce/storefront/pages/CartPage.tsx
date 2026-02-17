import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, X } from 'lucide-react';
import { useEcommerce } from '../../../../shared/contexts';
import { useToast } from '../../../../shared/components/native';
import { PremiumNavbar } from '../components/PremiumNavbar';
import { PremiumFooter } from '../components/PremiumFooter';

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
  const shipping = subtotal >= 150000 ? 0 : 15000;
  const total = subtotal + shipping;

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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-4xl text-gray-900 mb-8">
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
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={`${item.productId}-${item.color}-${item.size}`} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex gap-4 items-center">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl text-gray-900 mb-2">{item.productName}</h3>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Color:</span>
                          <div
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <span className="text-sm text-gray-900">{item.color}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Talla:</span>
                          <span className="text-sm text-gray-900 font-medium">{item.size}</span>
                        </div>
                      </div>
                      <p className="text-2xl text-gray-900 mb-4">
                        ${item.price.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border-2 border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.color, item.size, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 transition-colors"
                          >
                            <Minus size={18} />
                          </button>
                          <span className="px-4 font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.color, item.size, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 transition-colors"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                          {deletingItem?.productId === item.productId && deletingItem?.color === item.color && deletingItem?.size === item.size ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">¿Eliminar?</span>
                            <button
                              onClick={handleConfirmDelete}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Sí
                            </button>
                            <button
                              onClick={handleCancelDelete}
                              className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              No
                            </button>
                          </div>
                          ) : (
                          <button
                            onClick={() => handleDeleteClick(item.productId, item.color, item.size)}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-md transition-colors self-center flex items-center"
                            aria-label="Eliminar producto del carrito"
                          >
                            <Trash2 size={22} />
                            <span className="ml-2 text-sm text-red-600">Eliminar producto del carrito</span>
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
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h2 className="text-2xl text-gray-900 mb-6">Resumen del Pedido</h2>
                
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Envío</span>
                    <span>{shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString()}`}</span>
                  </div>
                  {subtotal < 150000 && shipping > 0 && (
                    <p className="text-sm text-pink-400">
                      ¡Agrega ${(150000 - subtotal).toLocaleString()} más para envío gratis!
                    </p>
                  )}
                </div>

                <div className="flex justify-between text-2xl text-gray-900 mb-6">
                  <span>Total</span>
                  <span>${total.toLocaleString()}</span>
                </div>

                <button
                  onClick={() => onNavigate('checkout')}
                  className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-4 rounded-full hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-105 shadow-lg mb-3"
                >
                  Proceder al Pago
                </button>

                <button
                  onClick={() => onNavigate('search')}
                  className="w-full text-gray-700 py-4 rounded-full hover:bg-gray-100 transition-colors"
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