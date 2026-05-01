import api from './api';
import { StaffUser, ApiResponse } from '../types';

export const getStaffUsers = async (): Promise<StaffUser[]> => {
  const { data } = await api.get<ApiResponse<StaffUser[]>>('/users/staff');
  return data.data;
};
