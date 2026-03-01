export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Gunta {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerStatus = 'Rented' | 'Vacant' | 'Closed' | 'Unsold';

export interface Customer {
  _id: string;
  nameEnglish: string;
  nameHindi?: string;
  mobile: string;
  address?: string;
  guntaId: Gunta | string;
  roomNumber: string;
  monthlyCharge: number;
  status: CustomerStatus;
  username: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerId: Customer | string;
  paidFromMonth: string;
  paidToMonth: string;
  monthsCovered: number;
  amountPaid: number;
  paymentMethod: 'Cash' | 'Online';
  pendingMonths: number;
  pendingAmount: number;
  smsSent: boolean;
  smsError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  invoiceId: Invoice | string;
  customerId: Customer | string;
  amount: number;
  paymentMethod: 'Cash' | 'Online';
  status: 'pending' | 'completed' | 'failed';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalCustomers: number;
  rentedCustomers: number;
  vacantCustomers: number;
  closedCustomers: number;
  monthlyCollection: number;
  monthlyInvoiceCount: number;
  totalCollection: number;
  defaulterCount: number;
  recentInvoices: Invoice[];
}

export interface Defaulter {
  customer: {
    _id: string;
    nameEnglish: string;
    nameHindi?: string;
    mobile: string;
    roomNumber: string;
    monthlyCharge: number;
    gunta: Gunta;
  };
  pendingFrom: string;
  pendingMonths: number;
  pendingAmount: number;
  lastPaymentDate: string | null;
}

export interface CollectionSummary {
  byGunta: Record<string, { cash: number; online: number; total: number; count: number }>;
  cashTotal: number;
  onlineTotal: number;
  grandTotal: number;
  invoiceCount: number;
  invoices: Invoice[];
}

export interface CustomerAuthResponse {
  token: string;
  customer: {
    id: string;
    nameEnglish: string;
    username: string;
    roomNumber: string;
    mobile: string;
  };
}

export interface CustomerDashboard {
  customer: {
    nameEnglish: string;
    roomNumber: string;
    gunta: Gunta;
    monthlyCharge: number;
    mobile: string;
  };
  billing: {
    isPaid: boolean;
    pendingFrom: string | null;
    pendingMonths: number;
    pendingAmount: number;
    currentMonth: string;
  };
  recentInvoices: Invoice[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
