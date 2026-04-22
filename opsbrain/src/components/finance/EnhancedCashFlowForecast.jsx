import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Calendar, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { opsbrain } from '@/api/client';
import { toast } from 'sonner';

export default function EnhancedCashFlowForecast({ transactions, subscriptions = [] }) {
  const { language } = useLanguage();
  const [forecast, setForecast] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  // חישוב תחזית מתקדמת
  const generateForecast = async () => {
    setIsLoading(true);
    
    try {
      // נתוני עבר - 6 חודשים
      const historicalData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString(language === 'he' ? 'he-IL' : 'en-US', { month: 'short', year: 'numeric' });
        
        const monthTransactions = transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
        });

        const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        historicalData.push({
          month: monthName,
          income,
          expenses,
          balance: income - expenses,
          type: 'historical'
        });
      }

      // חישוב ממוצעים
      const avgIncome = historicalData.reduce((sum, m) => sum + m.income, 0) / historicalData.length;
      const avgExpenses = historicalData.reduce((sum, m) => sum + m.expenses, 0) / historicalData.length;
      
      // מגמת צמיחה
      const recentIncome = historicalData.slice(-3).reduce((sum, m) => sum + m.income, 0) / 3;
      const olderIncome = historicalData.slice(0, 3).reduce((sum, m) => sum + m.income, 0) / 3;
      const growthRate = olderIncome > 0 ? (recentIncome - olderIncome) / olderIncome : 0;

      // תחזית עתידית - 3 חודשים קדימה
      const forecastData = [];
      let cumulativeBalance = historicalData[historicalData.length - 1].balance;
      
      for (let i = 1; i <= 3; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        const monthName = date.toLocaleString(language === 'he' ? 'he-IL' : 'en-US', { month: 'short', year: 'numeric' });
        
        // תחזית עם מגמת צמיחה
        const forecastIncome = avgIncome * (1 + (growthRate * i * 0.5));
        const forecastExpenses = avgExpenses * 1.05; // הנחה של עלייה של 5% בהוצאות
        
        // הוסף הכנסות חוזרות ממנויים
        const recurringRevenue = subscriptions
          .filter(s => s.status === 'active')
          .reduce((sum, s) => sum + (s.mrr || 0), 0);

        const totalIncome = forecastIncome + recurringRevenue;
        const balance = totalIncome - forecastExpenses;
        cumulativeBalance += balance;

        forecastData.push({
          month: monthName,
          income: Math.round(totalIncome),
          expenses: Math.round(forecastExpenses),
          balance: Math.round(balance),
          cumulativeBalance: Math.round(cumulativeBalance),
          type: 'forecast'
        });
      }

      // שלב היסטורי ותחזית
      const combinedData = [...historicalData, ...forecastData];
      setForecast(combinedData);

      // קבל תובנות מ-AI
      const aiInsights = await opsbrain.integrations.Core.InvokeLLM({
        prompt: `אתה מומחה כלכלי. נתח את הנתונים הפיננסיים הבאים ותן תובנות והמלצות:

היסטוריה (6 חודשים אחרונים):
${historicalData.map(m => `${m.month}: הכנסות ₪${m.income}, הוצאות ₪${m.expenses}, מאזן ₪${m.balance}`).join('\n')}

תחזית (3 חודשים קדימה):
${forecastData.map(m => `${m.month}: הכנסות צפויות ₪${m.income}, הוצאות צפויות ₪${m.expenses}, מאזן צפוי ₪${m.balance}`).join('\n')}

ממוצע הכנסות: ₪${Math.round(avgIncome)}
ממוצע הוצאות: ₪${Math.round(avgExpenses)}
מגמת צמיחה: ${(growthRate * 100).toFixed(1)}%

תן 3-5 תובנות קצרות והמלצות פעולה קונקרטיות.`,
        response_json_schema: {
          type: 'object',
          properties: {
            insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  severity: { type: 'string' },
                  action: { type: 'string' }
                }
              }
            },
            summary: { type: 'string' }
          }
        }
      });

      setInsights(aiInsights);
      toast.success(language === 'he' ? 'תחזית נוצרה בהצלחה' : 'Forecast generated successfully');
    } catch (error) {
      console.error('Error generating forecast:', error);
      toast.error(language === 'he' ? 'שגיאה ביצירת תחזית' : 'Error generating forecast');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (transactions.length > 0) {
      generateForecast();
    }
  }, [transactions.length]);

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            {language === 'he' ? 'תחזית תזרים מזומנים מתקדמת' : 'Advanced Cash Flow Forecast'}
          </CardTitle>
          <Button 
            onClick={generateForecast} 
            disabled={isLoading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4 ml-2" />
                {language === 'he' ? 'חדש תחזית' : 'Refresh Forecast'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {forecast.length > 0 ? (
          <div className="space-y-6">
            {/* גרף תחזית */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === 'he' ? 'תחזית תזרים - 3 חודשים קדימה' : '3-Month Cash Flow Forecast'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={forecast}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorIncome)"
                      name={language === 'he' ? 'הכנסות' : 'Income'}
                      strokeWidth={2}
                      strokeDasharray={(entry) => entry.type === 'forecast' ? '5 5' : '0'}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ef4444" 
                      fillOpacity={1} 
                      fill="url(#colorExpenses)"
                      name={language === 'he' ? 'הוצאות' : 'Expenses'}
                      strokeWidth={2}
                      strokeDasharray={(entry) => entry.type === 'forecast' ? '5 5' : '0'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-gray-400"></div>
                    <span>{language === 'he' ? 'נתוני עבר' : 'Historical Data'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 border-t-2 border-dashed border-gray-400"></div>
                    <span>{language === 'he' ? 'תחזית' : 'Forecast'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* תובנות AI */}
            {insights && insights.insights && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  {language === 'he' ? 'תובנות והמלצות' : 'Insights & Recommendations'}
                </h3>
                
                {insights.summary && (
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-700">{insights.summary}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-3">
                  {insights.insights.map((insight, idx) => (
                    <Card key={idx} className={`border ${getSeverityColor(insight.severity)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{insight.title}</h4>
                            <p className="text-sm mb-2">{insight.description}</p>
                            {insight.action && (
                              <div className="flex items-center gap-2 text-sm">
                                <TrendingUp className="w-4 h-4" />
                                <span className="font-medium">{language === 'he' ? 'פעולה מומלצת:' : 'Recommended Action:'}</span>
                                <span>{insight.action}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>{language === 'he' ? 'טוען תחזית...' : 'Loading forecast...'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}