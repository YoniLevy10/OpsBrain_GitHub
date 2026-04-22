import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';

export default function FinancialAlerts({ transactions = [] }) {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (transactions.length > 0) {
      analyzeTransactions();
    }
  }, [transactions]);

  const analyzeTransactions = async () => {
    setIsLoading(true);
    try {
      const last30Days = transactions.filter(t => {
        const daysAgo = (Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 30;
      });

      const expenses = last30Days.filter(t => t.type === 'expense');
      const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
      const avgExpense = totalExpenses / Math.max(expenses.length, 1);

      const recentExpenses = expenses.slice(0, 5);
      const unusualExpenses = recentExpenses.filter(e => e.amount > avgExpense * 2);

      const categoryExpenses = {};
      expenses.forEach(e => {
        if (!categoryExpenses[e.category]) categoryExpenses[e.category] = 0;
        categoryExpenses[e.category] += e.amount;
      });

      const topCategory = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1])[0];

      const detectedAlerts = [];

      if (unusualExpenses.length > 0) {
        detectedAlerts.push({
          type: 'warning',
          title: 'הוצאה חריגה זוהתה',
          description: `זוהתה הוצאה של ₪${unusualExpenses[0].amount.toLocaleString()} ב${unusualExpenses[0].category} - גבוהה פי 2 מהממוצע`
        });
      }

      if (topCategory && topCategory[1] > totalExpenses * 0.4) {
        detectedAlerts.push({
          type: 'info',
          title: 'ריכוז הוצאות גבוה',
          description: `${((topCategory[1] / totalExpenses) * 100).toFixed(0)}% מההוצאות ב-${topCategory[0]}`
        });
      }

      const income = last30Days.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      if (totalExpenses > income * 0.9) {
        detectedAlerts.push({
          type: 'warning',
          title: 'יחס הוצאות-הכנסות גבוה',
          description: 'ההוצאות מגיעות ל-90% מההכנסות בחודש האחרון'
        });
      }

      setAlerts(detectedAlerts);
    } catch (error) {
      console.error('Failed to analyze:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            מצב תקין
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">לא זוהו חריגות פיננסיות</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          התראות פיננסיות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, idx) => (
          <Alert key={idx} className={alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'}>
            <AlertDescription className="text-sm">
              <p className="font-semibold mb-1">{alert.title}</p>
              <p className="text-gray-600">{alert.description}</p>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}