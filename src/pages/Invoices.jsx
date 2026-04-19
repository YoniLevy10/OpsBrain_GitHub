import React, { useState, lazy, Suspense } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Send, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery as useBusinessQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingSpinner from '@/components/LoadingSpinner';
import ActionButton from '@/components/ActionButton';
import EmptyState from '@/components/EmptyState';

const CreateInvoiceDialog = lazy(() => import('../components/invoices/CreateInvoiceDialog'));
const InvoiceTemplate = lazy(() => import('../components/invoices/InvoiceTemplate'));
const StripePaymentButton = lazy(() => import('../components/payments/StripePaymentButton'));

export default function Invoices() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date'),
    staleTime: 1 * 60 * 1000,
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: business } = useBusinessQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const businesses = await base44.entities.Business.list();
      return businesses[0];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Invoice.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      toast.success(t('invoices.statusUpdated'));
    }
  });

  const statusConfig = {
    draft: { label: t('invoices.draft'), color: 'bg-gray-100 text-gray-700', icon: FileText },
    sent: { label: t('invoices.sent'), color: 'bg-blue-100 text-blue-700', icon: Send },
    paid: { label: t('invoices.paid'), color: 'bg-green-100 text-green-700', icon: CheckCircle },
    overdue: { label: t('invoices.overdue'), color: 'bg-red-100 text-red-700', icon: Clock },
    cancelled: { label: t('invoices.cancelled'), color: 'bg-gray-100 text-gray-500', icon: XCircle }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || t('invoices.unknownClient');
  };

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'sent').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0)
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('invoices.title')}</h1>
          <p className="text-gray-500 mt-1">{t('invoices.subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-black hover:bg-gray-800 rounded-xl">
          <Plus className="w-4 h-4 ml-2" />
          {t('invoices.newInvoice')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('invoices.totalInvoices')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('invoices.paidInvoices')}</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.paid}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('invoices.pending')}</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('invoices.overdue')}</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('invoices.revenue')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₪{stats.totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      {invoicesLoading || clientsLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState 
          icon={FileText}
          title={t('invoices.noInvoices')}
          description={t('invoices.noInvoicesDesc')}
          actionLabel={t('invoices.newInvoice')}
          onAction={() => setShowCreateDialog(true)}
        />
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const StatusIcon = statusConfig[invoice.status]?.icon || FileText;
            return (
              <Card key={invoice.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">#{invoice.invoice_number}</h3>
                          <Badge className={statusConfig[invoice.status]?.color}>
                            <StatusIcon className="w-3 h-3 ml-1" />
                            {statusConfig[invoice.status]?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{getClientName(invoice.client_id)}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {t('invoices.date')}: {new Date(invoice.issue_date).toLocaleDateString('he-IL')} | 
                          {t('invoices.dueDate')}: {new Date(invoice.due_date).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-gray-900">₪{invoice.total_amount?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mr-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewInvoice(invoice)}
                        className="rounded-xl"
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        {t('invoices.view')}
                      </Button>
                      {invoice.status === 'draft' && (
                        <ActionButton
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'sent' })}
                          isLoading={updateStatusMutation.isPending && updateStatusMutation.variables?.id === invoice.id}
                          className="rounded-xl"
                        >
                          <Send className="w-4 h-4 ml-1" />
                          {t('invoices.send')}
                        </ActionButton>
                      )}
                      {invoice.status === 'sent' && (
                        <>
                          <Suspense fallback={<Skeleton className="h-8 w-24" />}>
                            <StripePaymentButton 
                              invoice={invoice}
                              onSuccess={() => queryClient.invalidateQueries(['invoices'])}
                            />
                          </Suspense>
                          <ActionButton
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'paid' })}
                            isLoading={updateStatusMutation.isPending && updateStatusMutation.variables?.id === invoice.id}
                            className="rounded-xl bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          >
                            <CheckCircle className="w-4 h-4 ml-1" />
                            {t('invoices.markPaid')}
                          </ActionButton>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showCreateDialog && (
        <Suspense fallback={<LoadingSpinner />}>
          <CreateInvoiceDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            clients={clients}
            onSuccess={() => queryClient.invalidateQueries(['invoices'])}
          />
        </Suspense>
      )}

      {previewInvoice && (
        <Suspense fallback={<LoadingSpinner />}>
          <InvoiceTemplate
            invoice={previewInvoice}
            client={clients.find(c => c.id === previewInvoice.client_id)}
            business={business}
          />
        </Suspense>
      )}
    </div>
  );
}