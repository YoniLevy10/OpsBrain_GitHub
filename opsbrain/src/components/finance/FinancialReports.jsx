import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { he } from 'date-fns/locale';

export default function FinancialReports({ transactions }) {
  const [period, setPeriod] = useState('current');

  const getPeriodDates = () => {
    const now = new Date();
    if (period === 'current') {
      return { start: startOfMonth(now), end: endOfMonth(now) };
    } else if (period === 'last') {
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    } else {
      return { start: subMonths(now, 3), end: now };
    }
  };

  const { start, end } = getPeriodDates();
  const periodTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= start && date <= end;
  });

  // רווח והפסד
  const income = periodTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = periodTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const profit = income - expenses;

  // ניתוח הוצאות לפי קטגוריה
  const expensesByCategory = {};
  periodTransactions.filter(t => t.type === 'expense').forEach(t => {
    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
  });

  const categoryData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#000000', '#404040', '#737373', '#a3a3a3', '#d4d4d4'];

  // רווח והפסד חודשי
  const profitLossData = [
    { name: 'הכנסות', value: income },
    { name: 'הוצאות', value: expenses },
    { name: 'רווח נקי', value: profit }
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            דוחות כספיים
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl">
              <Download className="w-4 h-4 ml-1" />
              ייצא PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" onValueChange={setPeriod} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="current">חודש נוכחי</TabsTrigger>
            <TabsTrigger value="last">חודש שעבר</TabsTrigger>
            <TabsTrigger value="quarter">רבעון</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="space-y-6">
            {/* רווח והפסד */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">דו"ח רווח והפסד</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">הכנסות</p>
                  <p className="text-2xl font-bold text-green-600">₪{income.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">הוצאות</p>
                  <p className="text-2xl font-bold text-red-600">₪{expenses.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">רווח נקי</p>
                  <p className={`text-2xl font-bold ${profit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    ₪{profit.toLocaleString()}
                  </p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={profitLossData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₪${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#000000" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ניתוח הוצאות */}
            {categoryData.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">פילוח הוצאות לפי קטגוריה</h3>
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => `${entry.name}: ${((entry.value / expenses) * 100).toFixed(1)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₪${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {categoryData.map((item, index) => (
                      <div key={item.name} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm text-gray-700">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">₪{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}