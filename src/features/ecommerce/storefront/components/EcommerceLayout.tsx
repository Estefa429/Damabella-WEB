import React, { useState } from 'react';
import { Home, Search, Heart, ShoppingCart, User } from 'lucide-react';
import { useEcommerce } from '../../../../shared/contexts/EcommerceContext';

interface EcommerceLayoutProps {
  children: React.ReactNode;
  currentView: 'home' | 'search' | 'favorites' | 'cart' | 'profile' | 'detail' | 'checkout' | 'orders' | 'contact';
  onNavigate: (view: string) => void;
  isAuthenticated: boolean;
  currentUser: any;
}

export function EcommerceLayout({ children, currentView, onNavigate, isAuthenticated, currentUser }: EcommerceLayoutProps) {
  const { cart, favorites } = useEcommerce();

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const favoritesCount = favorites.length;

  const navItems = [
    { id: 'home', icon: Home, label: 'Inicio' },
    { id: 'search', icon: Search, label: 'Buscar' },
    { id: 'favorites', icon: Heart, label: 'Favoritos' },
    { id: 'cart', icon: ShoppingCart, label: 'Carrito' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6F7] flex">
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-40">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            DAMABELLA
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const showBadge = item.id === 'cart' && cartItemsCount > 0;
            const showFavBadge = item.id === 'favorites' && favoritesCount > 0;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-pink-50 text-[#FFB6C1]' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="relative">
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  {showBadge && (
                    <span className="absolute -top-2 -right-2 bg-[#FFB6C1] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                  {showFavBadge && (
                    <span className="absolute -top-2 -right-2 bg-[#FFB6C1] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {favoritesCount}
                    </span>
                  )}
                </div>
                <span className={`${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* User Info in Sidebar */}
        {isAuthenticated && currentUser && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white">
                {currentUser.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-screen-xl mx-auto flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const showBadge = item.id === 'cart' && cartItemsCount > 0;
            const showFavBadge = item.id === 'favorites' && favoritesCount > 0;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? 'text-[#FFB6C1]' : 'text-gray-600'
                }`}
              >
                <div className="relative">
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  {showBadge && (
                    <span className="absolute -top-2 -right-2 bg-[#FFB6C1] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                  {showFavBadge && (
                    <span className="absolute -top-2 -right-2 bg-[#FFB6C1] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {favoritesCount}
                    </span>
                  )}
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
