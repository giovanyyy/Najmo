import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { useSession } from 'next-auth/react';

export function useInvoices() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  return useQuery({
    queryKey: ['invoices'],
    queryFn: () => apiGet('/invoices', token),
    enabled: !!token,
  });
}

export function useInvoiceMutations() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/invoices', data, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => apiPatch(`/invoices/${id}/status`, { status }, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/invoices/${id}`, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  return { createMutation, updateStatusMutation, deleteMutation };
}
