import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export function useProjects({ staleTimeMs = 3 * 60 * 1000 } = {}) {
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const projectsKey = useMemo(() => ['projects', activeWorkspace?.id], [activeWorkspace?.id]);
  const clientsKey = useMemo(() => ['clients', activeWorkspace?.id], [activeWorkspace?.id]);
  const tasksKey = useMemo(() => ['tasks', activeWorkspace?.id], [activeWorkspace?.id]);

  const projectsQuery = useQuery({
    queryKey: projectsKey,
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.Project.filter({ workspace_id: activeWorkspace.id }, '-created_date');
    },
    enabled: !!activeWorkspace,
    staleTime: staleTimeMs,
  });

  const clientsQuery = useQuery({
    queryKey: clientsKey,
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.Client.filter({ workspace_id: activeWorkspace.id });
    },
    enabled: !!activeWorkspace,
    staleTime: 5 * 60 * 1000,
  });

  const tasksQuery = useQuery({
    queryKey: tasksKey,
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.Task.filter({ workspace_id: activeWorkspace.id });
    },
    enabled: !!activeWorkspace,
    staleTime: 2 * 60 * 1000,
  });

  const create = useMutation({
    mutationFn: async (data) => {
      if (!activeWorkspace) throw new Error('No workspace');
      return opsbrain.entities.Project.create({ ...data, workspace_id: activeWorkspace.id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  return {
    activeWorkspace,
    projects: projectsQuery.data ?? [],
    projectsLoading: projectsQuery.isLoading,
    projectsError: projectsQuery.error ?? null,
    refetchProjects: projectsQuery.refetch,
    clients: clientsQuery.data ?? [],
    clientsLoading: clientsQuery.isLoading,
    tasks: tasksQuery.data ?? [],
    tasksLoading: tasksQuery.isLoading,
    create,
  };
}

