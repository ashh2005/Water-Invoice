import api from './api';
import { Gunta, ApiResponse } from '../types';

export const getGuntas = async (search?: string): Promise<Gunta[]> => {
  const params = search ? { search } : {};
  const { data } = await api.get<ApiResponse<Gunta[]>>('/guntas', { params });
  return data.data;
};

export const getGuntaById = async (id: string): Promise<Gunta> => {
  const { data } = await api.get<ApiResponse<Gunta>>(`/guntas/${id}`);
  return data.data;
};

export const createGunta = async (guntaData: {
  name: string;
  description?: string;
  assignedStaff?: string | null;
}): Promise<Gunta> => {
  const { data } = await api.post<ApiResponse<Gunta>>('/guntas', guntaData);
  return data.data;
};

export const updateGunta = async (
  id: string,
  guntaData: { name?: string; description?: string; assignedStaff?: string | null }
): Promise<Gunta> => {
  const { data } = await api.put<ApiResponse<Gunta>>(`/guntas/${id}`, guntaData);
  return data.data;
};

export const deleteGunta = async (id: string): Promise<void> => {
  await api.delete(`/guntas/${id}`);
};
