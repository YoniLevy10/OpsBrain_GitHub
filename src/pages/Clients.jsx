import React, { useState, lazy, Suspense } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Plus, Users, Upload, Sparkles } from 'lucide-react';
import ClientCard from '../components/crm/ClientCard';
import AddClientDialog from '../components/crm/AddClientDialog';
import ClientStats from '../components/crm/ClientStats';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingSpinner from '../components/LoadingSpinner';
import SmartDocumentImport from '../components/documents/SmartDocumentImport';

const ClientDetailView = lazy(() => import('../components/clients/ClientDetailView'));
const DataImport = lazy(() => import('../components/onboarding/DataImport'));

export default function Clients() {
  const { t } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading, refetch: refetchClients } = useQuery({
    queryKey: ['clients', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await base44.entities.Client.filter({ workspace_id: activeWorkspace.id }, '-created_date');
    },
    enabled: !!activeWorkspace,
    staleTime: 0
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (!activeWorkspace) throw new Error('No workspace');
      return base44.entities.Client.create({ ...data, workspace_id: activeWorkspace.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowAddDialog(false);
    }
  });

  const filteredClients = filterStatus === 'all' 
    ? clients 
    : clients.filter(c => c.status === filterStatus);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('clients.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">{t('clients.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowSmartImport(true)} variant="outline" className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 text-xs md:text-sm">
            <Sparkles className="w-4 h-4 ml-1 md:ml-2" />
            <span className="hidden sm:inline">{t('clientsExtra.smartImport')}</span>
            <span className="sm:hidden">AI</span>
          </Button>
          <Button onClick={() => setShowImportDialog(true)} variant="outline" className="rounded-xl text-xs md:text-sm">
            <Upload className="w-4 h-4 ml-1 md:ml-2" />
            <span className="hidden sm:inline">{t('clients.importCSV')}</span>
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="bg-black hover:bg-gray-800 rounded-xl text-xs md:text-sm">
            <Plus className="w-4 h-4 ml-1 md:ml-2" />
            {t('clients.newClient')}
          </Button>
        </div>
      </div>

      <ClientStats clients={clients} />

      <div className="flex gap-2 mb-6">
        {['all', 'lead', 'active', 'inactive'].map(status => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(status)}
          >
            {status === 'all' ? t('clients.all') : status === 'lead' ? t('clients.leads') : status === 'active' ? t('clients.active') : t('clients.inactive')}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">{t('clients.noClients')}</h3>
            <p className="text-gray-500 text-sm mb-4">{t('clients.noClientsDesc')}</p>
            <Button onClick={() => setShowAddDialog(true)}>{t('clients.addClient')}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map(client => (
            <div key={client.id} onClick={() => setSelectedClient(client)} className="cursor-pointer">
              <ClientCard client={client} onDelete={refetchClients} />
            </div>
          ))}
        </div>
      )}

      <AddClientDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      {selectedClient && (
        <Suspense fallback={<LoadingSpinner />}>
          <ClientDetailView
            client={selectedClient}
            open={!!selectedClient}
            onClose={() => setSelectedClient(null)}
          />
        </Suspense>
      )}

      <SmartDocumentImport
        open={showSmartImport}
        onClose={() => setShowSmartImport(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['clients'] })}
      />

      {showImportDialog && (
        <Suspense fallback={<LoadingSpinner />}>
          <DataImport
            open={showImportDialog}
            onClose={() => {
              setShowImportDialog(false);
              queryClient.invalidateQueries({ queryKey: ['clients'] });
            }}
            entityType="Client"
          />
        </Suspense>
      )}
    </div>
  );
}