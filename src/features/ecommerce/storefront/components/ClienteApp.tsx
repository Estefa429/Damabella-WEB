import React, { useState } from 'react';
import { EcommerceProvider } from '../../../../shared/contexts';
import { ToastProvider } from '../../../../shared/components/native';
import { PremiumHomePage } from '../pages/PremiumHomePage';
import { SearchPage } from '../pages/SearchPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartPage } from '../pages/CartPage';
import { FavoritesPage } from '../pages/FavoritesPage';
// import { CheckoutPage } from '../pages/CheckoutPage';
import { ProfilePage } from '../pages/ProfilePage';
import { OrdersPage } from '../../orders/pages/OrdersPage';
import { ContactPage } from '../pages/ContactPage';
import { LoginModal } from '../components/LoginModal';

interface ClienteAppProps {
  currentUser: any;
  isAuthenticated: boolean;
  onLogin: (user: any) => void;
  onLogout: () => void;
}

export default function ClienteApp({ currentUser, isAuthenticated, onLogin, onLogout }: ClienteAppProps) {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchCategory, setSearchCategory] = useState<string | undefined>(undefined);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleNavigate = (view: string, param?: string) => {
    // Vistas que requieren autenticación
    const protectedViews = ['checkout', 'profile', 'orders'];
    
    if (protectedViews.includes(view) && !isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (view === 'detail') {
      setSelectedProductId(param || null);
      setCurrentView('detail');
    } else if (view === 'search') {
      setSearchCategory(param);
      setCurrentView('search');
    } else {
      setCurrentView(view);
      setSelectedProductId(null);
    }
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = (user: any) => {
    onLogin(user);
    setShowLoginModal(false);
    
    // El App.tsx detectará automáticamente el cambio de rol y mostrará el panel si es necesario
    // Ya no necesitamos recargar la página
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <PremiumHomePage onNavigate={handleNavigate} onLoginRequired={() => setShowLoginModal(true)} isAuthenticated={isAuthenticated} currentUser={currentUser} />;
      
      case 'search':
        return <SearchPage onNavigate={handleNavigate} initialCategory={searchCategory} isAuthenticated={isAuthenticated} currentUser={currentUser} />;
      
      case 'detail':
        return selectedProductId ? (
          <ProductDetailPage productId={selectedProductId} onNavigate={handleNavigate} isAuthenticated={isAuthenticated} currentUser={currentUser} />
        ) : (
          <PremiumHomePage onNavigate={handleNavigate} onLoginRequired={() => setShowLoginModal(true)} isAuthenticated={isAuthenticated} currentUser={currentUser} />
        );
      
      case 'cart':
        return <CartPage onNavigate={handleNavigate} isAuthenticated={isAuthenticated} currentUser={currentUser} />;
      
      case 'favorites':
        return <FavoritesPage onNavigate={handleNavigate} isAuthenticated={isAuthenticated} currentUser={currentUser} />;
      
      // case 'checkout':
      //   return isAuthenticated ? (
      //     <CheckoutPage onNavigate={handleNavigate} currentUser={currentUser} />
      //   ) : (
      //     <PremiumHomePage onNavigate={handleNavigate} onLoginRequired={() => setShowLoginModal(true)} isAuthenticated={isAuthenticated} currentUser={currentUser} />
      //   );
      
      case 'profile':
        return isAuthenticated ? (
          <ProfilePage onNavigate={handleNavigate} currentUser={currentUser} onLogout={onLogout} onLogin={handleLoginSuccess} />
        ) : (
          <PremiumHomePage onNavigate={handleNavigate} onLoginRequired={() => setShowLoginModal(true)} isAuthenticated={isAuthenticated} currentUser={currentUser} />
        );
      
      case 'orders':
        return isAuthenticated ? (
          <OrdersPage onNavigate={handleNavigate} currentUser={currentUser} />
        ) : (
          <PremiumHomePage onNavigate={handleNavigate} onLoginRequired={() => setShowLoginModal(true)} isAuthenticated={isAuthenticated} currentUser={currentUser} />
        );
      
      case 'contact':
        return <ContactPage onNavigate={handleNavigate} isAuthenticated={isAuthenticated} currentUser={currentUser} />;
      
      default:
        return <PremiumHomePage onNavigate={handleNavigate} onLoginRequired={() => setShowLoginModal(true)} isAuthenticated={isAuthenticated} currentUser={currentUser} />;
    }
  };

  return (
    <ToastProvider>
      <EcommerceProvider>
        {renderView()}

        {/* Modal de Login */}
        {showLoginModal && (
          <LoginModal 
            onClose={() => setShowLoginModal(false)} 
            onLogin={handleLoginSuccess} 
          />
        )}
      </EcommerceProvider>
    </ToastProvider>
  );
}