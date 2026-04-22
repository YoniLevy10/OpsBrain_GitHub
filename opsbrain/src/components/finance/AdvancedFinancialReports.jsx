import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdvancedFinancialReports({ transactions, dateRange = 'month' }) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');

  // חישובים בסיסיים
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = income - expenses;
  const profitMargin = income > 0 ? ((netProfit / income) * 100).toFixed(1) : 0;

  // פילוח הוצאות לפי קטגוריות
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category || 'אחר';
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {});

  const categoryData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / expenses) * 100).toFixed(1)
  }));

  // פילוח הכנסות לפי מקור
  const incomeByCategory = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      const category = t.category || 'אחר';
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {});

  const incomeData = Object.entries(incomeByCategory).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / income) * 100).toFixed(1)
  }));

  // מגמה חודשית (6 חודשים אחרונים)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthName = date.toLocaleString(language === 'he' ? 'he-IL' : 'en-US', { month: 'short' });
    
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
    });

    monthlyTrend.push({
      month: monthName,
      income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expenses: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    });
  }

  // צבעים לגרפים
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6'];

  const exportReport = (type) => {
    const reportData = type === 'profit-loss' 
      ? `דוח רווח והפסד\n\nהכנסות: ₪${income.toLocaleString()}\nהוצאות: ₪${expenses.toLocaleString()}\nרווח נקי: ₪${netProfit.toLocaleString()}\nמרווח רווח: ${profitMargin}%`
      : `מאזן\n\nנכסים שוטפים: ₪${income.toLocaleString()}\nהתחייבויות: ₪${expenses.toLocaleString()}\nהון עצמי: ₪${netProfit.toLocaleString()}`;
    
    const blob = new Blob([reportData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          {language === 'he' ? 'דוחות כספיים מתקדמים' : 'Advanced Financial Reports'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">{language === 'he' ? 'סקירה' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="profit-loss">{language === 'he' ? 'רווח והפסד' : 'P&L'}</TabsTrigger>
            <TabsTrigger value="breakdown">{language === 'he' ? 'פילוח' : 'Breakdown'}</TabsTrigger>
            <TabsTrigger value="trends">{language === 'he' ? 'מגמות' : 'Trends'}</TabsTrigger>
          </TabsList>

          {/* סקירה כללית */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{language === 'he' ? 'סה"כ הכנסות' : 'Total Income'}</p>
                      <p className="text-2xl font-bold text-green-600">₪{income.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{language === 'he' ? 'סה"כ הוצאות' : 'Total Expenses'}</p>
                      <p className="text-2xl font-bold text-red-600">₪{expenses.toLocaleString()}</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{language === 'he' ? 'רווח נקי' : 'Net Profit'}</p>
                      <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        ₪{netProfit.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{language === 'he' ? 'מרווח רווח' : 'Profit Margin'}</p>
                      <p className="text-2xl font-bold text-purple-600">{profitMargin}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* גרף מגמה חודשית */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === 'he' ? 'מגמה חודשית' : 'Monthly Trend'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10b981" name={language === 'he' ? 'הכנסות' : 'Income'} strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" name={language === 'he' ? 'הוצאות' : 'Expenses'} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* דוח רווח והפסד */}
          <TabsContent value="profit-loss" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{language === 'he' ? 'דוח רווח והפסד' : 'Profit & Loss Statement'}</h3>
              <Button variant="outline" size="sm" onClick={() => exportReport('profit-loss')}>
                <Download className="w-4 h-4 ml-2" />
                {language === 'he' ? 'ייצא' : 'Export'}
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h4 className="font-semibold text-green-700 mb-2">{language === 'he' ? 'הכנסות' : 'Revenue'}</h4>
                    {incomeData.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-2 text-sm">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium">₪{item.value.toLocaleString()} ({item.percentage}%)</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t font-bold">
                      <span>{language === 'he' ? 'סה"כ הכנסות' : 'Total Revenue'}</span>
                      <span className="text-green-600">₪{income.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-semibold text-red-700 mb-2">{language === 'he' ? 'הוצאות' : 'Expenses'}</h4>
                    {categoryData.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-2 text-sm">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium">₪{item.value.toLocaleString()} ({item.percentage}%)</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t font-bold">
                      <span>{language === 'he' ? 'סה"כ הוצאות' : 'Total Expenses'}</span>
                      <span className="text-red-600">₪{expenses.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">{language === 'he' ? 'רווח/הפסד נקי' : 'Net Profit/Loss'}</span>
                      <span className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₪{netProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-600">
                      <span>{language === 'he' ? 'מרווח רווח' : 'Profit Margin'}</span>
                      <span className="font-medium">{profitMargin}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* פילוח */}
          <TabsContent value="breakdown" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'he' ? 'פילוח הוצאות' : 'Expense Breakdown'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'he' ? 'פילוח הכנסות' : 'Income Breakdown'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={incomeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {incomeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* מגמות */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === 'he' ? 'מגמת הכנסות והוצאות' : 'Income & Expense Trends'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" fill="#10b981" name={language === 'he' ? 'הכנסות' : 'Income'} />
                    <Bar dataKey="expenses" fill="#ef4444" name={language === 'he' ? 'הוצאות' : 'Expenses'} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}