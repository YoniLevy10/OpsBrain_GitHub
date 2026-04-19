import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function CashFlowForecast({ transactions }) {
  // חישוב ממוצעים יומיים
  const last30Days = transactions.filter(t => {
    const date = new Date(t.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  });

  const avgDailyIncome = last30Days
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) / 30;

  const avgDailyExpenses = last30Days
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0) / 30;

  const currentBalance = transactions.reduce((sum, t) => {
    return sum + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);

  // תחזית ל-30 הימים הקרובים
  const forecastData = [];
  let balance = currentBalance;

  for (let i = 0; i <= 30; i++) {
    const date = addDays(new Date(), i);
    balance += (avgDailyIncome - avgDailyExpenses);
    
    forecastData.push({
      date: format(date, 'd/M', { locale: he }),
      balance: Math.round(balance),
      isNegative: balance < 0
    });
  }

  const minBalance = Math.min(...forecastData.map(d => d.balance));
  const hasNegativeForecast = minBalance < 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          תחזית תזרים מזומנים - 30 יום
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasNegativeForecast && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">אזהרה: תזרים מזומנים שלילי צפוי</p>
              <p className="text-sm text-red-700 mt-1">
                לפי הנתונים הנוכחיים, היתרה עשויה להיות שלילית ב-{Math.abs(minBalance).toLocaleString()}₪
              </p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">ממוצע הכנסות יומי</p>
            <p className="text-lg font-bold text-green-600">₪{Math.round(avgDailyIncome).toLocaleString()}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">ממוצע הוצאות יומי</p>
            <p className="text-lg font-bold text-red-600">₪{Math.round(avgDailyExpenses).toLocaleString()}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">יתרה צפויה בעוד 30 יום</p>
            <p className={`text-lg font-bold ${forecastData[30].balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              ₪{forecastData[30].balance.toLocaleString()}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value) => `₪${value.toLocaleString()}`}
              labelFormatter={(label) => `תאריך: ${label}`}
            />
            <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#000000" 
              strokeWidth={2}
              dot={false}
              name="יתרה צפויה"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}