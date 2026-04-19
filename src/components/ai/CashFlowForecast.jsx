import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useLanguage } from '@/components/LanguageContext';
import { useDashboardData } from '@/components/hooks/useDashboardData';

export default function CashFlowForecast() {
  const { t } = useLanguage();
  const { transactions, invoices } = useDashboardData();

  const generateForecast = () => {
    const today = new Date();
    const forecastData = [];

    // חישוב ממוצע הכנסות והוצאות חודשי
    const last90Days = transactions.filter(t => {
      const tDate = new Date(t.date);
      const daysDiff = Math.floor((today - tDate) / (1000 * 60 * 60 * 24));
      return daysDiff <= 90;
    });

    const avgMonthlyIncome = last90Days
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) / 3;

    const avgMonthlyExpense = last90Days
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0) / 3;

    // חשבוניות שממתינות לתשלום
    const pendingInvoices = invoices.filter(inv => inv.status === 'sent');
    const expectedIncome = pendingInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);

    // בניית תחזית ל-3 חודשים קדימה
    let currentBalance = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) - 
      transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // חודש נוכחי
    forecastData.push({
      month: 'היום',
      balance: currentBalance,
      income: avgMonthlyIncome,
      expense: avgMonthlyExpense
    });

    // חודש 1
    const month1Balance = currentBalance + expectedIncome * 0.7 + avgMonthlyIncome * 0.3 - avgMonthlyExpense;
    forecastData.push({
      month: 'חודש 1',
      balance: month1Balance,
      income: expectedIncome * 0.7 + avgMonthlyIncome * 0.3,
      expense: avgMonthlyExpense
    });

    // חודש 2
    const month2Balance = month1Balance + avgMonthlyIncome - avgMonthlyExpense;
    forecastData.push({
      month: 'חודש 2',
      balance: month2Balance,
      income: avgMonthlyIncome,
      expense: avgMonthlyExpense
    });

    // חודש 3
    const month3Balance = month2Balance + avgMonthlyIncome * 1.1 - avgMonthlyExpense;
    forecastData.push({
      month: 'חודש 3',
      balance: month3Balance,
      income: avgMonthlyIncome * 1.1,
      expense: avgMonthlyExpense
    });

    return forecastData;
  };

  const forecastData = generateForecast();
  const trend = forecastData[forecastData.length - 1].balance > forecastData[0].balance;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{t('cashFlow.title')}</CardTitle>
          <div className="flex items-center gap-2">
            {trend ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <span className={`text-sm font-medium ${trend ? 'text-green-600' : 'text-red-600'}`}>
              {trend ? t('cashFlow.positive') : t('cashFlow.negative')}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {t('cashFlow.description')}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}K`} />
            <Tooltip 
              formatter={(value) => `₪${value.toLocaleString()}`}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#000" 
              strokeWidth={3}
              dot={{ fill: '#000', r: 5 }}
              name="יתרה צפויה"
            />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#10b981" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#10b981', r: 3 }}
              name="הכנסות"
            />
            <Line 
              type="monotone" 
              dataKey="expense" 
              stroke="#ef4444" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#ef4444', r: 3 }}
              name="הוצאות"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-gray-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">יתרה צפויה</p>
            <p className="text-lg font-bold text-gray-900">
              ₪{forecastData[forecastData.length - 1].balance.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">הכנסות חזויות</p>
            <p className="text-lg font-bold text-green-700">
              ₪{forecastData[forecastData.length - 1].income.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <TrendingDown className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">הוצאות חזויות</p>
            <p className="text-lg font-bold text-red-700">
              ₪{forecastData[forecastData.length - 1].expense.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}