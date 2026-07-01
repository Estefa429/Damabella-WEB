import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Users,
  ShoppingCart,
  TrendingUp,
  ChevronDown,
  Menu,
  X,
  Search,
  LogOut,
  User,
  Shield,
  Lock,
  UserCog,
  Package,
  Store,
  Truck,
  ShoppingBag,
  FileText,
  DollarSign,
  RotateCcw
} from 'lucide-react';
import logoImg from '../../../assets/logos/logo-ba.png.webp';
import DashboardMain from '../pages/DashboardMain';
import { RolesPage } from '../../roles';

import { PermisosPage, ConfiguracionPage } from '../../configuration';
import { UsuariosModule } from '../../users';
import { CategoriasManager } from '../../ecommerce/categories';
import { ProductosManager } from '../../ecommerce/products';
import { ProveedoresManager } from '../../suppliers';
import { ComprasManager } from '../../purchases';
import { ClientesManager } from '../../ecommerce/customers';
import ClienteDetallePage from '../../ecommerce/customers/pages/ClienteDetallePage';
import { PedidosManager } from '../../ecommerce/orders';
import { searchOrders } from '../../ecommerce/orders/services/OrderServices';
import { searchPurchases } from '../../purchases/services/PurchasesService';
import { VentasManager } from '../../ecommerce/sales';
import { DevolucionesManager } from '../../returns';
import { EditarPerfilPage } from '../../profile';
import { NotificacionesPage } from '../../notifications';
import { Modal, ToastProvider } from '../../../shared/components/native';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';

export default function AppLayout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { hasPermission, getVisibleModules } = usePermissions();
  const isUserAdmin = isAdmin();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [clienteDetalleActual, setClienteDetalleActual] = useState<any>(null);
  
  // Búsqueda general de pedidos y compras
  const [moduleSearchTerm, setModuleSearchTerm] = useState('');
  const [matchingOrders, setMatchingOrders] = useState<any[]>([]);
  const [matchingPurchases, setMatchingPurchases] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setMatchingOrders([]);
      setMatchingPurchases([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [ordersRes, purchasesRes] = await Promise.all([
          searchOrders(searchTerm),
          searchPurchases(searchTerm)
        ]);
        setMatchingOrders(ordersRes ?? []);
        setMatchingPurchases(purchasesRes ?? []);
      } catch (err) {
        console.error('Error fetching search results:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Asegurar que el sidebar esté siempre visible al cargar
  useEffect(() => {
    setSidebarOpen(true);
  }, []);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleSaveProfile = (updatedUser: any) => {
    localStorage.setItem('damabella_current_user', JSON.stringify(updatedUser));
    setCurrentPage('dashboard');
  };

  // ===== Activar historial de navegación (pushState + popstate)
  // Comportamiento mínimo: cada cambio de `currentPage` empuja un estado al history
  // y escuchamos `popstate` para restaurar la página al usar back/forward del navegador.
  useEffect(() => {
    // Inicializar desde history.state si existe, o desde hash si viene de enlace externo
    try {
      const st: any = window.history.state;
      if (st && st.page && typeof st.page === 'string') {
        setCurrentPage(st.page);
      } else if (window.location.hash && window.location.hash.startsWith('#admin-')) {
        const fromHash = window.location.hash.replace('#admin-', '');
        if (fromHash) setCurrentPage(fromHash);
      }
    } catch (err) {
      // no bloquear si el acceso al history falla
    }

    const onPop = (ev: PopStateEvent) => {
      try {
        const p = (ev.state && (ev.state as any).page) || null;
        if (p && typeof p === 'string') {
          setCurrentPage(p);
        } else if (window.location.hash && window.location.hash.startsWith('#admin-')) {
          const fromHash = window.location.hash.replace('#admin-', '');
          if (fromHash) setCurrentPage(fromHash);
        }
      } catch (e) {
        // ignore
      }
    };

    // Listener para navegar a detalle de cliente
    const onNavigateClienteDetalle = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        setClienteDetalleActual(customEvent.detail);
      }
      setCurrentPage('cliente-detalle');
    };

    window.addEventListener('popstate', onPop);
    window.addEventListener('navigate-cliente-detalle', onNavigateClienteDetalle);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('navigate-cliente-detalle', onNavigateClienteDetalle);
    };
  }, []);

  useEffect(() => {
    try {
      // push a history entry con la página actual y actualizar hash para visibilidad
      const state = { page: currentPage };
      const urlHash = `#admin-${currentPage}`;
      window.history.pushState(state, '', urlHash);
    } catch (err) {
      // no interrumpir la app si falla
    }
  }, [currentPage]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowSearchResults(e.target.value.length > 0);
  };

  const searchablePages = [
    { id: 'dashboard', label: 'Dashboard', categoria: 'General' },
    { id: 'roles', label: 'Gestión de Roles', categoria: 'Configuración' },
    { id: 'permisos', label: 'Gestión de Permisos', categoria: 'Configuración' },
    { id: 'usuarios', label: 'Gestión de Usuarios', categoria: 'Usuarios' },
    { id: 'categorias', label: 'Categorías de Productos', categoria: 'Compras' },
    { id: 'productos', label: 'Productos', categoria: 'Compras' },
    { id: 'proveedores', label: 'Proveedores', categoria: 'Compras' },
    { id: 'compras', label: 'Compras', categoria: 'Compras' },
    { id: 'clientes', label: 'Clientes', categoria: 'Ventas' },
    { id: 'pedidos', label: 'Pedidos', categoria: 'Ventas' },
    { id: 'ventas', label: 'Ventas', categoria: 'Ventas' },
    { id: 'devoluciones', label: 'Devoluciones', categoria: 'Ventas' }
  ];

  const filteredPages = searchablePages.filter(page =>
    page.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      page: 'dashboard',
      modulo: 'dashboard'
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: Settings,
      submenu: [
        { id: 'roles', label: 'Gestión de Roles y Permisos', icon: Shield, modulo: 'roles' }
      ]
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: Users,
      submenu: [
        { id: 'usuarios', label: 'Gestión de Usuarios', icon: UserCog, modulo: 'usuarios' }
      ]
    },
    {
      id: 'compras',
      label: 'Compras',
      icon: ShoppingCart,
      submenu: [
        { id: 'categorias', label: 'Categorías de Productos', icon: Package, modulo: 'categorias' },
        { id: 'productos', label: 'Productos', icon: ShoppingBag, modulo: 'productos' },
        { id: 'proveedores', label: 'Proveedores', icon: Store, modulo: 'proveedores' },
        { id: 'compras', label: 'Compras', icon: Truck, modulo: 'compras' }
      ]
    },
    {
      id: 'ventas',
      label: 'Ventas',
      icon: TrendingUp,
      submenu: [
        { id: 'clientes', label: 'Clientes', icon: Users, modulo: 'clientes' },
        { id: 'pedidos', label: 'Pedidos', icon: FileText, modulo: 'pedidos' },
        { id: 'ventas', label: 'Ventas', icon: DollarSign, modulo: 'ventas' },
        { id: 'devoluciones', label: 'Devoluciones', icon: RotateCcw, modulo: 'devoluciones' }
      ]
    }
  ];

  // Filtrar menús según permisos del usuario
  const filteredMenuItems = isUserAdmin
    ? menuItems // Los admins ven TODO sin filtrar
    : menuItems
      .map((menu) => {
        if (menu.id === 'dashboard') return menu;

        if (menu.submenu) {
          return {
            ...menu,
            submenu: menu.submenu.filter((item: any) => hasPermission(item.modulo || item.id, 'view')),
          };
        }

        return menu;
      })
      .filter((menu) => {
        if (menu.id === 'dashboard') return true;
        if (!menu.submenu) return hasPermission(menu.modulo || menu.id, 'view');
        return menu.submenu && menu.submenu.length > 0;
      });

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardMain />;
      case 'roles':
        return <RolesPage />;
      case 'permisos':
        return <PermisosPage />;
      case 'usuarios':
        return <UsuariosModule />;
      case 'categorias':
        return <CategoriasManager />;
      case 'productos':
        return <ProductosManager />;
      case 'proveedores':
        return <ProveedoresManager />;
      case 'compras':
        return <ComprasManager initialSearchTerm={moduleSearchTerm} />;
      case 'clientes':
        return <ClientesManager />;
      case 'cliente-detalle':
        return <ClienteDetallePage clientId={clienteDetalleActual?.id_client} onBack={() => setCurrentPage('clientes')} />;
      case 'pedidos':
        return <PedidosManager initialSearchTerm={moduleSearchTerm} />;
      case 'ventas':
        return <VentasManager />;
      case 'devoluciones':
        return <DevolucionesManager />;
      case 'perfil':
        return <EditarPerfilPage currentUser={user} onSave={handleSaveProfile} onCancel={() => setCurrentPage('dashboard')} />;
      case 'configuracion-general':
        return <ConfiguracionPage />;
      case 'notificaciones':
        return <NotificacionesPage />;
      default:
        return <DashboardMain />;
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo y toggle sidebar */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Damabella Logo" className="h-8 w-8 object-contain" />
              <h1 className="text-zinc-900 font-semibold">DAMABELLA</h1>
            </div>
          </div>

          {/* Buscador */}
          <div className="flex-1 max-w-2xl mx-8 hidden md:block relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar productos, clientes, pedidos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                value={searchTerm}
                onChange={handleSearch}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              />
            </div>
            {showSearchResults && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                {searchLoading && (
                  <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 animate-pulse">Buscando...</div>
                )}

                {/* Páginas Encontradas */}
                {filteredPages.length > 0 && (
                  <div className="border-b border-gray-100 pb-1">
                    <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Módulos</div>
                    {filteredPages.map(page => (
                      <button
                        key={page.id}
                        onClick={() => {
                          setModuleSearchTerm('');
                          setCurrentPage(page.id);
                          setSearchTerm('');
                          setShowSearchResults(false);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
                      >
                        <span className="text-gray-900 text-sm">{page.label}</span>
                        <span className="text-gray-500 text-xs">{page.categoria}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Pedidos Encontrados */}
                {matchingOrders.length > 0 && (
                  <div className="border-b border-gray-100 pb-1">
                    <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Pedidos</div>
                    {matchingOrders.map(order => (
                      <button
                        key={order.id_order}
                        onClick={() => {
                          setModuleSearchTerm(order.number_order);
                          setCurrentPage('pedidos');
                          setSearchTerm('');
                          setShowSearchResults(false);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="text-gray-900 text-sm font-medium">{order.number_order}</p>
                          <p className="text-gray-500 text-xs">Cliente: {order.client_name ?? 'N/A'}</p>
                        </div>
                        <span className="text-gray-500 text-xs">Total: ${parseFloat(order.total || '0').toLocaleString('es-CO')}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Compras Encontradas */}
                {matchingPurchases.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Compras</div>
                    {matchingPurchases.map(purchase => (
                      <button
                        key={purchase.id_purchase}
                        onClick={() => {
                          setModuleSearchTerm(purchase.purchase_number);
                          setCurrentPage('compras');
                          setSearchTerm('');
                          setShowSearchResults(false);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="text-gray-900 text-sm font-medium">{purchase.purchase_number}</p>
                          <p className="text-gray-500 text-xs">Proveedor: {purchase.provider_name ?? 'N/A'}</p>
                        </div>
                        <span className="text-gray-500 text-xs">Total: ${(purchase.total ?? 0).toLocaleString('es-CO')}</span>
                      </button>
                    ))}
                  </div>
                )}

                {filteredPages.length === 0 && matchingOrders.length === 0 && matchingPurchases.length === 0 && !searchLoading && (
                  <div className="px-4 py-3 text-gray-500 text-sm">No se encontraron resultados</div>
                )}
              </div>
            )}
          </div>

          {/* Perfil */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.[0] || 'A'
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-gray-900">{user?.name}</div>
                  <div className="text-gray-500">{user?.role}</div>
                </div>
                <ChevronDown size={16} />
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="text-gray-900">{user?.name}</div>
                      <div className="text-gray-500">{user?.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentPage('perfil');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <User size={16} />
                      Mi Perfil
                    </button>
                    <hr className="my-2" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowLogoutModal(true);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-red-600"
                    >
                      <LogOut size={16} />
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <nav className="p-4 h-full overflow-y-auto">
          {filteredMenuItems.map((menu) => {
  if (!menu) return null; // <-- Previene TS sin cambiar funcionalidad

  const page = menu.page ?? ""; // <-- Evita undefined en setCurrentPage
  const submenu = menu.submenu ?? []; // <-- Evita undefined al mapear submenu

  return (
    <div key={menu.id} className="mb-2">
      {menu.page ? (
        <button
          onClick={() => {
            setModuleSearchTerm('');
            setCurrentPage(page);
          }}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900"
        >
          <div className="flex items-center gap-3">
            {menu.icon && <menu.icon size={20} />}
            <span>{menu.label}</span>
          </div>
        </button>
      ) : (
        <button
          onClick={() => toggleMenu(menu.id)}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900"
        >
          <div className="flex items-center gap-3">
            {menu.icon && <menu.icon size={20} />}
            <span>{menu.label}</span>
          </div>
          <ChevronDown
            size={16}
            className={`transition-transform ${
              expandedMenus.includes(menu.id) ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {expandedMenus.includes(menu.id) && submenu.length > 0 && (
        <div className="ml-4 mt-1 space-y-1">
          {submenu.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setModuleSearchTerm('');
                setCurrentPage(item.id);
              }}
              className={`w-full flex items-center gap-3 p-2 pl-8 rounded-lg transition-colors ${
                currentPage === item.id
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.icon && <item.icon size={18} />}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
})}

        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className="p-6">
          {renderContent()}
        </div>
      </main>

      {/* Modal de confirmación de cierre de sesión */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Cerrar Sesión"
      >
        <div className="space-y-4">
          <p className="text-gray-600">¿Estás seguro que deseas cerrar sesión?</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowLogoutModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                try {
                  logout();
                } catch (e) {
                  // ignore
                }
                navigate('/login');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </Modal>
    </div>
    </ToastProvider>
  );
}
