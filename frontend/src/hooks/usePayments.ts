import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as paymentService from '../services/paymentService';
import toast from 'react-hot-toast';

export const usePayments = (filters?: { status?: string; paymentMethod?: string; customerId?: string }) =>
  useQuery({ queryKey: ['payments', filters], queryFn: () => paymentService.getPayments(filters) });

export const useRecordCashPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: paymentService.recordCashPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Cash payment recorded successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Payment failed'),
  });
};

export const useCreateOnlinePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: paymentService.createOnlinePayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to create payment'),
  });
};

export const useVerifyPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: paymentService.verifyPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Payment verified successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Payment verification failed'),
  });
};
