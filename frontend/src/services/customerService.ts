import api from './api';
import { Customer, ApiResponse } from '../types';

export const getCustomers = async (filters?: { search?: string; guntaId?: string; status?: string }): Promise<Customer[]> => {
  const { data } = await api.get<ApiResponse<Customer[]>>('/customers', { params: filters });
  return data.data;
};

export const getCustomerById = async (id: string): Promise<Customer> => {
  const { data } = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
  return data.data;
};

interface CreateCustomerResult {
  customer: Customer;
  generatedUsername: string;
  generatedPassword: string;
}

export const createCustomer = async (customerData: {
  nameEnglish: string;
  nameHindi?: string;
  mobile: string;
  address?: string;
  guntaId: string;
  roomNumber: string;
  monthlyCharge: number;
  status?: string;
  notes?: string;
}): Promise<CreateCustomerResult> => {
  const { data } = await api.post<ApiResponse<CreateCustomerResult>>('/customers', customerData);
  return data.data;
};

export const updateCustomer = async (id: string, customerData: Partial<Customer> & { password?: string }): Promise<Customer> => {
  const { data } = await api.put<ApiResponse<Customer>>(`/customers/${id}`, customerData);
  return data.data;
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await api.delete(`/customers/${id}`);
};
