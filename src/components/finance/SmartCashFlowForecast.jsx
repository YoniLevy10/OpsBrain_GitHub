import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, AlertTriangle, AlertCircle, CheckCircle, Lightbulb, DollarSign, ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SmartCashFlowForecast() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cash-flow-forecast', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return null;
      const response = await base44.functions.invoke('predictCashFlow', {
        workspace_id: activeWorkspace.id
      });
      return response.data;
    },
    enabled: !!activeWorkspace,
    refetchInterval: 60 * 60 * 1000 // רענון כל שעה
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{language === 'he' ? 'מחשב תחזית...' : 'Calculating forecast...'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const chartData = data.forecast.map(f => ({
    week: `W${f.week}`,
    balance: f.balance,
    income: f.income,
    expenses: f.expenses
  }));

  const finalBalance = data.forecast[data.forecast.length - 1]?.balance || 0;
  const balanceChange = finalBalance - data.current_balance;
  const isPositive = balanceChange >= 0;

  return (
    <div className="space-y-6">
      {/* כותרת + סטטוס */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">
                {language === 'he' ? 'תחזית תזרים מזומנים חכמה' : 'Smart Cash Flow Forecast'}
              </CardTitle>
              <CardDescription className="text-blue-100">
                {language === 'he' ? 'ניבוי AI של 90 יום קדימה' : 'AI prediction for 90 days ahead'}
              </CardDescription>
            </div>
            <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => refetch()}>
              {language === 'he' ? 'רענן תחזית' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-blue-100 mb-1">{language === 'he' ? 'יתרה נוכחית' : 'Current Balance'}</p>
              <p className="text-3xl font-bold">₪{data.current_balance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-blue-100 mb-1">{language === 'he' ? 'חזוי בעוד 90 יום' : 'Predicted in 90 days'}</p>
              <p className="text-3xl font-bold">₪{finalBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-blue-100 mb-1">{language === 'he' ? 'שינוי צפוי' : 'Expected Change'}</p>
              <div className="flex items-center gap-2">
                {isPositive ? (
                  <ArrowUp className="w-6 h-6 text-green-300" />
                ) : (
                  <ArrowDown className="w-6 h-6 text-red-300" />
                )}
                <p className={`text-3xl font-bold ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                  {isPositive ? '+' : ''}₪{balanceChange.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* התראות - מוצג רק התראה אחת הכי קריטית */}
      {data.alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              {language === 'he' ? 'התראת תזרים' : 'Cash Flow Alert'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const criticalAlert = data.alerts.find(a => a.severity === 'critical') || data.alerts[0];
              return (
                <div
                  className={`p-4 rounded-lg ${
                    criticalAlert.severity === 'critical' 
                      ? 'bg-red-100 border border-red-300' 
                      : 'bg-yellow-100 border border-yellow-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {criticalAlert.severity === 'critical' ? (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{criticalAlert.message}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {language === 'he' ? 'צפוי בעוד' : 'Expected in'} {criticalAlert.days_until} {language === 'he' ? 'ימים' : 'days'}
                        {' • '}
                        {new Date(criticalAlert.date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
                      </p>
                      {data.alerts.length > 1 && (
                        <p className="text-xs text-gray-500 mt-2">
                          {language === 'he' ? `+${data.alerts.length - 1} התראות נוספות` : `+${data.alerts.length - 1} more alerts`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* תרשים */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'he' ? 'תחזית שבועית' : 'Weekly Forecast'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value) => `₪${value.toLocaleString()}`}
                />
                <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name={language === 'he' ? 'יתרה' : 'Balance'}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name={language === 'he' ? 'הכנסות' : 'Income'}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name={language === 'he' ? 'הוצאות' : 'Expenses'}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* המלצות */}
      {data.recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Lightbulb className="w-5 h-5" />
              {language === 'he' ? 'המלצות פעולה' : 'Action Recommendations'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg bg-white border ${
                  rec.priority === 'high' ? 'border-red-300' :
                  rec.priority === 'medium' ? 'border-yellow-300' :
                  'border-green-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{rec.action}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {language === 'he' ? 'השפעה צפויה:' : 'Expected impact:'} <span className="font-medium">{rec.impact}</span>
                    </p>
                    {rec.detail && (
                      <p className="text-xs text-gray-500 mt-1">{rec.detail}</p>
                    )}
                    {rec.count && (
                      <p className="text-xs text-gray-500 mt-1">
                        {rec.count} {language === 'he' ? 'פריטים' : 'items'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* מטריקות */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-2">{language === 'he' ? 'הכנסה חודשית ממוצעת' : 'Avg Monthly Income'}</p>
            <p className="text-2xl font-bold text-green-600">₪{data.metrics.avg_monthly_income.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-2">{language === 'he' ? 'הוצאה חודשית ממוצעת' : 'Avg Monthly Expenses'}</p>
            <p className="text-2xl font-bold text-red-600">₪{data.metrics.avg_monthly_expenses.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-2">{language === 'he' ? 'MRR' : 'MRR'}</p>
            <p className="text-2xl font-bold text-purple-600">₪{data.metrics.monthly_recurring_revenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-2">{language === 'he' ? 'חשבוניות ממתינות' : 'Pending Invoices'}</p>
            <p className="text-2xl font-bold text-blue-600">₪{data.metrics.pending_invoices_value.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}