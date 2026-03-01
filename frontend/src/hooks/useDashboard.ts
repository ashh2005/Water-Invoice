import { useQuery } from '@tanstack/react-query';
import * as reportService from '../services/reportService';

export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: reportService.getDashboardSummary });

export const useMonthlyCollection = (month?: string) =>
  useQuery({ queryKey: ['monthly-collection', month], queryFn: () => reportService.getMonthlyCollection(month) });

export const useDefaulters = () =>
  useQuery({ queryKey: ['defaulters'], queryFn: reportService.getDefaulters });

export const useCollectionSummary = (fromDate: string, toDate: string) =>
  useQuery({
    queryKey: ['collection-summary', fromDate, toDate],
    queryFn: () => reportService.getCollectionSummary(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  });
