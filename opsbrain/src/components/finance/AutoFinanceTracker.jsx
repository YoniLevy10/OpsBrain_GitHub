import React, { useEffect, useState } from 'react';
import { opsbrain } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Loader2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function AutoFinanceTracker() {
  const { t, language } = useLanguage();
  const [syncing, setSyncing] = useState(true);
  const [stats, setStats] = useState({
    income: 0,
    expenses: 0,
    balance: 0,
    transactions_count: 0
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => opsbrain.entities.Transaction.list(),
    initialData: []
  });

  useEffect(() => {
    // סימולציה של סנכרון אוטומטי עם בנק
    syncBankData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [transactions]);

  const syncBankData = async () => {
    setSyncing(true);
    try {
      // בפועל כאן נסנכרן עם הבנק דרך API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // סימולציה של טרנזקציות שנמשכו מהבנק
      const bankTransactions = [
        {
          type: 'income',
          amount: 15000,
          category: 'Client Payment',
          description: 'Payment from Client A',
          date: new Date().toISOString().split('T')[0]
        },
        {
          type: 'expense',
          amount: 3500,
          category: 'Software',
          description: 'Adobe Creative Cloud',
          date: new Date().toISOString().split('T')[0]
        }
      ];
      
      // שמירה אוטומטית
      for (const trans of bankTransactions) {
        await opsbrain.entities.Transaction.create(trans);
      }
      
    } catch (error) {
      console.error('Bank sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const calculateStats = () => {
    const thisMonth = transactions.filter(t => {
      const date = new Date(t.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const income = thisMonth
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = thisMonth
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setStats({
      income,
      expenses,
      balance: income - expenses,
      transactions_count: thisMonth.length
    });
  };

  return (
    <div className="space-y-4">
      {syncing && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">
                  {language === 'he' ? 'מסנכרן עם הבנק...' : 'Syncing with bank...'}
                </p>
                <p className="text-sm text-blue-700">
                  {language === 'he' 
                    ? 'מושך תנועות אחרונות ועדכונים'
                    : 'Pulling recent transactions and updates'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!syncing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              {language === 'he' ? 'מצב פיננסי עדכני' : 'Current Financial Status'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {language === 'he' ? 'הכנסות' : 'Income'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  ₪{stats.income.toLocaleString()}
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {language === 'he' ? 'הוצאות' : 'Expenses'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-900">
                  ₪{stats.expenses.toLocaleString()}
                </p>
              </div>

              <div className={`rounded-lg p-4 ${
                stats.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
              }`}>
                <div className={`flex items-center gap-2 mb-2 ${
                  stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {language === 'he' ? 'יתרה' : 'Balance'}
                  </span>
                </div>
                <p className={`text-2xl font-bold ${
                  stats.balance >= 0 ? 'text-blue-900' : 'text-orange-900'
                }`}>
                  ₪{stats.balance.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t text-sm text-gray-600">
              {language === 'he' ? 'עדכון אחרון:' : 'Last update:'} {new Date().toLocaleString(language === 'he' ? 'he-IL' : 'en-US')}
              <span className="mx-2">•</span>
              {stats.transactions_count} {language === 'he' ? 'תנועות החודש' : 'transactions this month'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}