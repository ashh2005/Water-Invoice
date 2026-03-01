import api from './api';
import { CustomerAuthResponse, ApiResponse } from '../types';

export const customerLogin = async (username: string, password: string): Promise<CustomerAuthResponse> => {
  const { data } = await api.post<ApiResponse<CustomerAuthResponse>>('/customer-auth/login', { username, password });
  return data.data;
};
