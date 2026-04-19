import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ArrowUp, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useQuery } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';

export default function RevenueWidget({ size = 'medium' }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();

  const { data, isLoading } = useQuery({
    queryKey: ['revenue-widget', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return null;
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      
      const transactions = await opsbrain.entities.Transaction.filter({
        workspace_id: activeWorkspace.id,
        type: 'income'
      });

      const thisMonth = transactions.filter(t => t.date >= startOfMonth);
      const currentRevenue = thisMonth.reduce((sum, t) => sum + (t.amount || 0), 0);

      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastMonthEnd = startOfMonth;
      const lastMonthTransactions = transactions.filter(t => t.date >= lastMonth && t.date < lastMonthEnd);
      const lastMonthRevenue = lastMonthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      const percentChange = lastMonthRevenue > 0 
        ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
        : 0;

      return {
        current: currentRevenue,
        change: percentChange
      };
    },
    enabled: !!activeWorkspace
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const revenue = data?.current || 0;
  const change = data?.change || 0;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          {language === 'he' ? 'הכנסות החודש' : 'Monthly Revenue'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-3xl font-bold">₪{revenue.toLocaleString()}</p>
          {change != 0 && (
            <div className="flex items-center gap-1 text-sm">
              <ArrowUp className={`w-4 h-4 ${change >= 0 ? 'text-green-300' : 'text-red-300 rotate-180'}`} />
              <span className={change >= 0 ? 'text-green-300' : 'text-red-300'}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
              <span className="text-purple-200">{language === 'he' ? 'מחודש שעבר' : 'from last month'}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}