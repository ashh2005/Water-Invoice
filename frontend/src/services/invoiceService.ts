import api from './api';
import { Invoice, ApiResponse } from '../types';

export const getInvoices = async (filters?: {
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  paymentMethod?: string;
}): Promise<Invoice[]> => {
  const { data } = await api.get<ApiResponse<Invoice[]>>('/invoices', { params: filters });
  return data.data;
};

export const getInvoiceById = async (id: string): Promise<Invoice> => {
  const { data } = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
  return data.data;
};

export const resendSMS = async (id: string): Promise<{ sent: boolean }> => {
  const { data } = await api.post<ApiResponse<{ sent: boolean }>>(`/invoices/${id}/resend-sms`);
  return data.data;
};
