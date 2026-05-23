import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { useSession } from 'next-auth/react';

export function useOperations() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  return useQuery({
    queryKey: ['operations'],
    queryFn: () => apiGet('/operations', token),
    enabled: !!token,
  });
}

export function useOperationMutations() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/operations', data, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operations'] }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/operations/${id}/complete`, {}, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operations'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/operations/${id}`, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operations'] }),
  });

  return { createMutation, completeMutation, deleteMutation };
}
