import React, { useState, lazy, Suspense } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, Wallet, Upload } from 'lucide-react';
import TransactionsList from '../components/finance/TransactionsList';
import TransactionsListWithRefresh from '../components/finance/TransactionsListWithRefresh';
import FinancialSummary from '../components/finance/FinancialSummary';
import AddTransactionDialog from '../components/finance/AddTransactionDialog';
import ImportDataDialog from '../components/finance/ImportDataDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { Skeleton } from '@/components/ui/skeleton';
import FloatingAgentButton from '@/components/FloatingAgentButton';

const CashFlowChart = lazy(() => import('../components/finance/CashFlowChart'));
const FinancialAlerts = lazy(() => import('../components/finance/FinancialAlerts'));
const BudgetIntegration = lazy(() => import('../components/finance/BudgetIntegration'));
const FinancialReports = lazy(() => import('../components/finance/FinancialReports'));
const CashFlowForecast = lazy(() => import('../components/finance/CashFlowForecast'));
const AutoFinanceTracker = lazy(() => import('../components/finance/AutoFinanceTracker'));
const AdvancedFinancialReports = lazy(() => import('../components/finance/AdvancedFinancialReports'));
const SmartCategoryRecommendations = lazy(() => import('../components/finance/SmartCategoryRecommendations'));
const EnhancedCashFlowForecast = lazy(() => import('../components/finance/EnhancedCashFlowForecast'));
const SmartCashFlowForecast = lazy(() => import('../components/finance/SmartCashFlowForecast'));

export default function Finance() {
  const { t } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await base44.entities.Transaction.filter({ workspace_id: activeWorkspace.id }, '-date');
    },
    enabled: !!activeWorkspace,
    staleTime: 2 * 60 * 1000
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (!activeWorkspace) throw new Error('No workspace');
      return base44.entities.Transaction.create({ ...data, workspace_id: activeWorkspace.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowAddDialog(false);
    }
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, category }) => base44.entities.Transaction.update(id, { category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', activeWorkspace?.id] });
    },
  });

  const handleApplyCategoryRecommendation = async (transactionId, category) => {
    await updateTransactionMutation.mutateAsync({ id: transactionId, category });
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const balance = totalIncome - totalExpenses;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Auto Finance Tracker - סנכרון אוטומטי */}
      <Suspense fallback={<Skeleton className="h-32 mb-6" />}>
        <div className="mb-6">
          <AutoFinanceTracker />
        </div>
      </Suspense>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('finance.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">{t('finance.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowImportDialog(true)} variant="outline" className="rounded-xl text-xs md:text-sm">
            <Upload className="w-4 h-4 ml-1 md:ml-2" />
            <span className="hidden sm:inline">{t('finance.importData')}</span>
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="bg-black hover:bg-gray-800 rounded-xl text-xs md:text-sm">
            <Plus className="w-4 h-4 ml-1 md:ml-2" />
            {t('finance.newTransaction')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 mb-6" />
      ) : (
        <FinancialSummary 
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          balance={balance}
        />
      )}

      <Suspense fallback={<Skeleton className="h-48 mb-6" />}>
        <FinancialAlerts transactions={transactions} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-96 mb-6" />}>
        <div className="mb-6">
          <SmartCashFlowForecast />
        </div>
      </Suspense>

      <Suspense fallback={<Skeleton className="h-64 mb-6" />}>
        <div className="mb-6">
          <AdvancedFinancialReports transactions={transactions} />
        </div>
      </Suspense>

      <Suspense fallback={<Skeleton className="h-48 mb-6" />}>
        <div className="mb-6">
          <SmartCategoryRecommendations 
            transactions={transactions}
            onApplyRecommendation={handleApplyCategoryRecommendation}
          />
        </div>
      </Suspense>

      <Suspense fallback={<Skeleton className="h-64 mb-6" />}>
        <div className="mb-6">
          <EnhancedCashFlowForecast 
            transactions={transactions}
            subscriptions={[]}
          />
        </div>
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Suspense fallback={<Skeleton className="h-80" />}>
          <CashFlowChart transactions={transactions} />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-80" />}>
          <BudgetIntegration transactions={transactions} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Suspense fallback={<Skeleton className="h-80" />}>
          <CashFlowForecast transactions={transactions} />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-80" />}>
          <FinancialReports transactions={transactions} />
        </Suspense>
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="lg:hidden">
          <TransactionsListWithRefresh transactions={transactions} />
        </div>
      )}
      
      <div className="hidden lg:block">
        {!isLoading && <TransactionsList transactions={transactions} />}
      </div>

      <AddTransactionDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      <ImportDataDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['transactions'] })}
      />
      
      <FloatingAgentButton 
        agentName="financial_assistant"
        agentTitle={t('finance.title')}
        initialMessage="עזור לי עם הפיננסים"
      />
    </div>
  );
}