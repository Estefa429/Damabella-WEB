import React, { useState } from 'react';
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
  Bell,
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
import DashboardMain from '../pages/DashboardMain';
import { RolesPage } from '../../roles';

import { PermisosPage, ConfiguracionPage } from '../../configuration';
import { UsuariosModule } from '../../users';
import { CategoriasManager } from '../../ecommerce/categories';
import { ProductosManager } from '../../ecommerce/products';
import { ProveedoresManager } from '../../suppliers';
import { ComprasManager } from '../../purchases';
import { ClientesManager } from '../../ecommerce/customers';
import { PedidosManager } from '../../ecommerce/orders';
import { VentasManager } from '../../ecommerce/sales';
import { DevolucionesManager } from '../../returns';
import { EditarPerfilPage } from '../../profile';
import { NotificacionesPage } from '../../notifications';
import { Modal, ToastProvider } from '../../../shared/components/native';
import { AuthProvider } from '../../../shared/contexts/AuthContext';

interface AppLayoutProps {
  currentUser: any;
  onLogout: () => void;
}

export default function AppLayout({ currentUser, onLogout }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [user, setUser] = useState(currentUser);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Obtener permisos del rol del usuario
  const getUserPermissions = () => {
    const roles = JSON.parse(localStorage.getItem('damabella_roles') || '[]');
    const userRole = roles.find((r: any) => 
      r.id === user.roleId || 
      r.nombre === user.role || 
      r.name === user.role
    );
    
    // Si encontramos el rol y tiene permisos definidos, usarlos
    if (userRole && (userRole.permissions || userRole.permisos) && Array.isArray(userRole.permissions || userRole.permisos)) {
      const permArray = userRole.permissions || userRole.permisos;
      const permisosMap: any = {};
      
      permArray.forEach((p: any) => {
        const moduleName = (p.module || p.modulo || '').toLowerCase();
        permisosMap[moduleName] = {
          ver: p.canView ?? p.ver ?? false,
          crear: p.canCreate ?? p.crear ?? false,
          editar: p.canEdit ?? p.editar ?? false,
          eliminar: p.canDelete ?? p.eliminar ?? false
        };
      });
      
      console.log(`✅ [getUserPermissions] Permisos dinámicos encontrados para ${user.role}:`, permisosMap);
      return permisosMap;
    }
    
    // Fallback a permisos por rol si no están definidos dinámicamente
    if (!userRole || (!userRole.permissions && !userRole.permisos)) {
      console.log(`⚠️ [getUserPermissions] No se encontraron permisos dinámicos para ${user.role}, usando fallback`);
      
      // Si es Administrador y no tiene permisos definidos, dar acceso total
      if (user.role === 'Administrador') {
        return {
          dashboard: { ver: true },
          roles: { ver: true, crear: true, editar: true, eliminar: true },
          permisos: { ver: true, crear: true, editar: true, eliminar: true },
          usuarios: { ver: true, crear: true, editar: true, eliminar: true },
          categorías: { ver: true, crear: true, editar: true, eliminar: true },
          productos: { ver: true, crear: true, editar: true, eliminar: true },
          proveedores: { ver: true, crear: true, editar: true, eliminar: true },
          compras: { ver: true, crear: true, editar: true, eliminar: true },
          clientes: { ver: true, crear: true, editar: true, eliminar: true },
          pedidos: { ver: true, crear: true, editar: true, eliminar: true },
          ventas: { ver: true, crear: true, editar: true, eliminar: true },
          devoluciones: { ver: true, crear: true, editar: true, eliminar: true }
        };
      }
      
      // Empleado: acceso limitado (sin permisos dinámicos)
      if (user.role === 'Empleado') {
        return {
          dashboard: { ver: true },
          productos: { ver: true, crear: false, editar: false, eliminar: false },
          clientes: { ver: true, crear: true, editar: true, eliminar: false },
          pedidos: { ver: true, crear: true, editar: true, eliminar: false },
          ventas: { ver: true, crear: true, editar: false, eliminar: false },
          devoluciones: { ver: true, crear: true, editar: false, eliminar: false }
        };
      }
      
      return {};
    }
    
    return userRole.permisos;
  };

  const permisos = getUserPermissions();

  // Normalizar nombre de módulo (remover acentos y convertir a minúsculas)
  const normalizeModuleName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
  };

  const hasPermission = (modulo: string, accion: string = 'ver') => {
    const moduloKey = normalizeModuleName(modulo);
    
    // Buscar en permisos normalizados
    let hasAccess = false;
    for (const [key, value] of Object.entries(permisos)) {
      if (normalizeModuleName(key) === moduloKey) {
        hasAccess = (value as any)?.[accion] === true;
        break;
      }
    }
    
    console.log(`🔍 [hasPermission] Módulo: "${modulo}" (${moduloKey}), Acción: ${accion}, Acceso: ${hasAccess}`);
    return hasAccess;
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleSaveProfile = (updatedUser: any) => {
    setUser(updatedUser);
    // Actualizar también en el localStorage para que persista
    localStorage.setItem('damabella_current_user', JSON.stringify(updatedUser));
    setCurrentPage('dashboard');
  };

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
      page: 'dashboard', // Enlace directo, no desplegable
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

  // Filtrar menús según permisos
  const filteredMenuItems = user.role === 'Administrador' 
    ? menuItems // Los admins ven TODO sin filtrar
    : menuItems.map(menu => {
      // Si el menú tiene enlace directo (page), verificar permiso
      if (menu.page) {
        return hasPermission(menu.modulo || menu.id) ? menu : null;
      }
      // Si tiene submenu, filtrar items del submenu
      return {
        ...menu,
        submenu: menu.submenu?.filter((item: any) => hasPermission(item.modulo || item.id))
      };
    }).filter(menu => menu && (menu.page || (menu.submenu && menu.submenu.length > 0)));

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
        return <ComprasManager />;
      case 'clientes':
        return <ClientesManager />;
      case 'pedidos':
        return <PedidosManager />;
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
    <AuthProvider>
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
            <h1 className="text-zinc-900">DAMABELLA</h1>
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
                {filteredPages.length > 0 ? (
                  filteredPages.map(page => (
                    <button
                      key={page.id}
                      onClick={() => {
                        setCurrentPage(page.id);
                        setSearchTerm('');
                        setShowSearchResults(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
                    >
                      <span className="text-gray-900">{page.label}</span>
                      <span className="text-gray-500 text-sm">{page.categoria}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500">No se encontraron resultados</div>
                )}
              </div>
            )}
          </div>

          {/* Notificaciones y perfil */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentPage('notificaciones')}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

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
          onClick={() => setCurrentPage(page)}
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
              onClick={() => setCurrentPage(item.id)}
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
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </Modal>
    </div>
      </ToastProvider>
    </AuthProvider>
  );
}
