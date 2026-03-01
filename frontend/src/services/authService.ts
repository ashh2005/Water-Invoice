import api from './api';
import { AuthResponse, User, ApiResponse } from '../types';

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', { username, password });
  return data.data;
};

export const getProfile = async (): Promise<User> => {
  const { data } = await api.get<ApiResponse<User>>('/auth/profile');
  return data.data;
};

export const register = async (userData: {
  username: string;
  email: string;
  password: string;
  role: string;
}): Promise<User> => {
  const { data } = await api.post<ApiResponse<User>>('/auth/register', userData);
  return data.data;
};
