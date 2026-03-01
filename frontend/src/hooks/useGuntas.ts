import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as guntaService from '../services/guntaService';
import toast from 'react-hot-toast';

export const useGuntas = (search?: string) =>
  useQuery({ queryKey: ['guntas', search], queryFn: () => guntaService.getGuntas(search) });

export const useGunta = (id: string) =>
  useQuery({ queryKey: ['guntas', id], queryFn: () => guntaService.getGuntaById(id), enabled: !!id });

export const useCreateGunta = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: guntaService.createGunta,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guntas'] }); toast.success('Gunta created'); },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to create gunta'),
  });
};

export const useUpdateGunta = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => guntaService.updateGunta(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guntas'] }); toast.success('Gunta updated'); },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to update gunta'),
  });
};

export const useDeleteGunta = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: guntaService.deleteGunta,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guntas'] }); toast.success('Gunta deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to delete gunta'),
  });
};
