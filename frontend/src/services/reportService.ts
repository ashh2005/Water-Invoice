import api from './api';
import { DashboardSummary, Defaulter, CollectionSummary, GuntaDetailReport, ApiResponse } from '../types';

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const { data } = await api.get<ApiResponse<DashboardSummary>>('/reports/dashboard');
  return data.data;
};

export const getMonthlyCollection = async (month?: string): Promise<any[]> => {
  const params = month ? { month } : {};
  const { data } = await api.get<ApiResponse<any[]>>('/reports/monthly-collection', { params });
  return data.data;
};

export const getDefaulters = async (): Promise<Defaulter[]> => {
  const { data } = await api.get<ApiResponse<Defaulter[]>>('/reports/defaulters');
  return data.data;
};

export const getCollectionSummary = async (fromDate: string, toDate: string): Promise<CollectionSummary> => {
  const { data } = await api.get<ApiResponse<CollectionSummary>>('/reports/collection-summary', {
    params: { fromDate, toDate },
  });
  return data.data;
};

export const getGuntaDetail = async (guntaId: string, fromMonth: string, toMonth: string): Promise<GuntaDetailReport> => {
  const { data } = await api.get<ApiResponse<GuntaDetailReport>>('/reports/gunta-detail', {
    params: { guntaId, fromMonth, toMonth },
  });
  return data.data;
};
