import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export function useClients({ staleTimeMs = 3 * 60 * 1000 } = {}) {
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['clients', activeWorkspace?.id], [activeWorkspace?.id]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.Client.filter({ workspace_id: activeWorkspace.id }, '-created_date');
    },
    enabled: !!activeWorkspace,
    staleTime: staleTimeMs,
  });

  const create = useMutation({
    mutationFn: async (data) => {
      if (!activeWorkspace) throw new Error('No workspace');
      return opsbrain.entities.Client.create({ ...data, workspace_id: activeWorkspace.id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const remove = useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error('Missing id');
      return opsbrain.entities.Client.delete(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  return {
    activeWorkspace,
    clients: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
    create,
    remove,
  };
}

