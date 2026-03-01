import axios from 'axios';
import { CustomerDashboard, Invoice, ApiResponse } from '../types';

const portalApi = axios.create({
  baseURL: '/api/customer-portal',
  headers: { 'Content-Type': 'application/json' },
});

portalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('customerToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerUser');
      window.location.href = '/customer-login';
    }
    return Promise.reject(error);
  }
);

export const getCustomerDashboard = async (): Promise<CustomerDashboard> => {
  const { data } = await portalApi.get<ApiResponse<CustomerDashboard>>('/dashboard');
  return data.data;
};

export const getCustomerInvoices = async (): Promise<Invoice[]> => {
  const { data } = await portalApi.get<ApiResponse<Invoice[]>>('/invoices');
  return data.data;
};

export const initiatePayment = async (fromMonth: string, toMonth: string): Promise<any> => {
  const { data } = await portalApi.post<ApiResponse<any>>('/pay', { fromMonth, toMonth });
  return data.data;
};
