// Tipos y interfaces del sistema DAMABELLA

export type UserRole = 'Administrador' | 'Empleado' | 'Cliente';
export type UserStatus = 'Activo' | 'Inactivo';
export type OrderStatus = 'Pendiente' | 'Procesando' | 'Enviado' | 'Entregado' | 'Cancelado';
export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'PSE';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  document: string;
  phone?: string;
  address?: string;
  role: UserRole;
  status: UserStatus;
  image?: string;
  createdAt: string;
  createdBy?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt?: string;
  
}

export interface Client {
  id: string;
  name: string;
  email: string;
  document: string;
  phone: string;
  address?: string;
  city?: string;
  totalPurchases: number;
  lastPurchase?: string;
  status: UserStatus;
  createdAt: string;
}

export interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  nit: string;
  status: UserStatus;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  productCount: number;
  createdAt: string;
}

export interface Size {
  id: string;
  name: string;
  abbreviation: string;
  createdAt: string;
}

export interface Color {
  id: string;
  name: string;
  hexCode: string;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sizeId: string;
  colorId: string;
  stock: number;
  sku: string;
}

export interface ProductPhoto {
  id: string;
  productId: string;
  url: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName?: string;
  stock: number;
  images: string[];
  status: UserStatus;
  createdAt: string;
  createdBy?: string;
}

export interface Transaction {
  id: string;
  type: 'Venta' | 'Compra' | 'Pedido';
  date: string;
  userId: string;
  userName?: string;
  providerId?: string;
  providerName?: string;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  items: TransactionItem[];
  createdAt: string;
  createdBy?: string;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Return {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  status: 'Pendiente' | 'Aprobada' | 'Rechazada';
  date: string;
  createdAt: string;
  createdBy?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalReturns: number;
  totalClients: number;
  salesGrowth: number;
  ordersGrowth: number;
  returnsGrowth: number;
  clientsGrowth: number;
}
