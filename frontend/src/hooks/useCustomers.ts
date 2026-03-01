import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as customerService from '../services/customerService';
import toast from 'react-hot-toast';

export const useCustomers = (filters?: { search?: string; guntaId?: string; status?: string }) =>
  useQuery({ queryKey: ['customers', filters], queryFn: () => customerService.getCustomers(filters) });

export const useCustomer = (id: string) =>
  useQuery({ queryKey: ['customers', id], queryFn: () => customerService.getCustomerById(id), enabled: !!id });

export const useCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to create customer'),
  });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => customerService.updateCustomer(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer updated'); },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to update customer'),
  });
};

export const useDeleteCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customerService.deleteCustomer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to delete customer'),
  });
};
