import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { useSession } from 'next-auth/react';

export function useClients() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  return useQuery({
    queryKey: ['clients'],
    queryFn: () => apiGet('/clients', token),
    enabled: !!token,
  });
}

export function useClientMutations() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/clients', data, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => apiPatch(`/clients/${id}`, data, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/clients/${id}`, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  return { createMutation, updateMutation, deleteMutation };
}
