import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function CashFlowChart({ transactions }) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const data = days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayTransactions = transactions.filter(t => t.date === dayStr);
    
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const expenses = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      date: format(day, 'd', { locale: he }),
      income,
      expenses,
      net: income - expenses
    };
  });

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>תזרים מזומנים חודשי</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value) => `₪${value.toLocaleString()}`}
              labelStyle={{ direction: 'rtl' }}
            />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#10b981" name="הכנסות" strokeWidth={2} />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="הוצאות" strokeWidth={2} />
            <Line type="monotone" dataKey="net" stroke="#3b82f6" name="נטו" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}