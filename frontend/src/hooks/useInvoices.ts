import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as invoiceService from '../services/invoiceService';
import toast from 'react-hot-toast';

export const useInvoices = (filters?: {
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  paymentMethod?: string;
}) => useQuery({ queryKey: ['invoices', filters], queryFn: () => invoiceService.getInvoices(filters) });

export const useInvoice = (id: string) =>
  useQuery({ queryKey: ['invoices', id], queryFn: () => invoiceService.getInvoiceById(id), enabled: !!id });

export const useResendSMS = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: invoiceService.resendSMS,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(data.sent ? 'SMS sent successfully' : 'SMS delivery failed');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to send SMS'),
  });
};
