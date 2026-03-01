import api from './api';
import { Payment, Invoice, ApiResponse } from '../types';

interface CashPaymentResult {
  invoice: Invoice;
  payment: Payment;
}

interface OnlinePaymentResult {
  invoice: Invoice;
  payment: Payment;
  razorpayOrder: { id: string; amount: number; currency: string };
  razorpayKeyId: string;
}

export const recordCashPayment = async (data: {
  customerId: string;
  fromMonth: string;
  toMonth: string;
  amount: number;
}): Promise<CashPaymentResult> => {
  const { data: res } = await api.post<ApiResponse<CashPaymentResult>>('/payments/cash', data);
  return res.data;
};

export const createOnlinePayment = async (data: {
  customerId: string;
  fromMonth: string;
  toMonth: string;
  amount: number;
}): Promise<OnlinePaymentResult> => {
  const { data: res } = await api.post<ApiResponse<OnlinePaymentResult>>('/payments/online', data);
  return res.data;
};

export const verifyPayment = async (data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<Payment> => {
  const { data: res } = await api.post<ApiResponse<Payment>>('/payments/webhook', data);
  return res.data;
};

export const getPayments = async (filters?: {
  status?: string;
  paymentMethod?: string;
  customerId?: string;
}): Promise<Payment[]> => {
  const { data } = await api.get<ApiResponse<Payment[]>>('/payments', { params: filters });
  return data.data;
};
