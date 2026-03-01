import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as customerPortalService from '../services/customerPortalService';
import toast from 'react-hot-toast';

export const useCustomerDashboard = () =>
  useQuery({ queryKey: ['customer-dashboard'], queryFn: customerPortalService.getCustomerDashboard });

export const useCustomerInvoices = () =>
  useQuery({ queryKey: ['customer-invoices'], queryFn: customerPortalService.getCustomerInvoices });

export const useInitiatePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fromMonth, toMonth }: { fromMonth: string; toMonth: string }) =>
      customerPortalService.initiatePayment(fromMonth, toMonth),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-dashboard'] });
      qc.invalidateQueries({ queryKey: ['customer-invoices'] });
      toast.success('Payment initiated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Payment failed'),
  });
};
