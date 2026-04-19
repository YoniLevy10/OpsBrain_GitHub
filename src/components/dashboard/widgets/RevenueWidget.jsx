import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ArrowUp } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useDashboardData } from '@/components/hooks/useDashboardData';

export default function RevenueWidget({ size = 'medium' }) {
  const { language } = useLanguage();
  const { transactions } = useDashboardData();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];

  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const thisMonthRevenue = incomeTransactions
    .filter(t => t.date >= startOfMonth)
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const lastMonthRevenue = incomeTransactions
    .filter(t => t.date >= startOfLastMonth && t.date < startOfMonth)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const percentChange = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : 0;

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
          <p className="text-3xl font-bold">₪{thisMonthRevenue.toLocaleString()}</p>
          {percentChange != 0 && (
            <div className="flex items-center gap-1 text-sm">
              <ArrowUp className={`w-4 h-4 ${percentChange >= 0 ? 'text-green-300' : 'text-red-300 rotate-180'}`} />
              <span className={percentChange >= 0 ? 'text-green-300' : 'text-red-300'}>
                {percentChange >= 0 ? '+' : ''}{percentChange}%
              </span>
              <span className="text-purple-200">{language === 'he' ? 'מחודש שעבר' : 'from last month'}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}