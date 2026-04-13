import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function useDashboardData() {
  const { activeWorkspace } = useWorkspace();
  const wsId = activeWorkspace?.id;

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', wsId],
    queryFn: () => base44.entities.Invoice.filter({ workspace_id: wsId }),
    enabled: !!wsId,
    staleTime: STALE_TIME
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', wsId],
    queryFn: () => base44.entities.Transaction.filter({ workspace_id: wsId }),
    enabled: !!wsId,
    staleTime: STALE_TIME
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', wsId],
    queryFn: () => base44.entities.Client.filter({ workspace_id: wsId }),
    enabled: !!wsId,
    staleTime: STALE_TIME
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', wsId],
    queryFn: () => base44.entities.Project.filter({ workspace_id: wsId }),
    enabled: !!wsId,
    staleTime: STALE_TIME
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', wsId],
    queryFn: () => base44.entities.Task.filter({ workspace_id: wsId }),
    enabled: !!wsId,
    staleTime: STALE_TIME
  });

  return { invoices, transactions, clients, projects, tasks, activeWorkspace };
}