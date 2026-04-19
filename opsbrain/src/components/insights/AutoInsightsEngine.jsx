import React, { useState, useEffect } from 'react';
import { opsbrain } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp, AlertTriangle, Sparkles, ArrowUp, ArrowDown, DollarSign, Users, Calendar } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function AutoInsightsEngine() {
  const { t, language } = useLanguage();
  const [insights, setInsights] = useState([]);
  const [generating, setGenerating] = useState(true);

  // שליפת נתונים
  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => opsbrain.entities.Transaction.list(),
    initialData: []
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => opsbrain.entities.Invoice.list(),
    initialData: []
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => opsbrain.entities.Client.list(),
    initialData: []
  });

  useEffect(() => {
    generateInsights();
  }, [transactions, invoices, clients]);

  const generateInsights = async () => {
    setGenerating(true);
    
    try {
      const generatedInsights = [];
      
      // תובנה 1: ניתוח תזרים
      const thisMonth = transactions.filter(t => {
        const date = new Date(t.date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });
      
      const income = thisMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = thisMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const netCashFlow = income - expenses;
      
      if (netCashFlow > 0) {
        generatedInsights.push({
          type: 'positive',
          icon: TrendingUp,
          title: language === 'he' ? 'תזרים חיובי החודש' : 'Positive Cash Flow This Month',
          description: language === 'he' 
            ? `תזרים המזומנים שלך חיובי ב-₪${netCashFlow.toLocaleString()}. המשך כך!`
            : `Your cash flow is positive by ₪${netCashFlow.toLocaleString()}. Keep it up!`,
          value: netCashFlow,
          color: 'green'
        });
      } else if (netCashFlow < 0) {
        generatedInsights.push({
          type: 'warning',
          icon: AlertTriangle,
          title: language === 'he' ? 'תזרים שלילי - שים לב' : 'Negative Cash Flow - Attention',
          description: language === 'he'
            ? `תזרים המזומנים שלך שלילי ב-₪${Math.abs(netCashFlow).toLocaleString()}. שקול להפחית הוצאות.`
            : `Your cash flow is negative by ₪${Math.abs(netCashFlow).toLocaleString()}. Consider reducing expenses.`,
          value: netCashFlow,
          color: 'red'
        });
      }
      
      // תובנה 2: חשבוניות ממתינות לתשלום
      const pendingInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue');
      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      
      if (pendingInvoices.length > 0) {
        generatedInsights.push({
          type: 'info',
          icon: DollarSign,
          title: language === 'he' ? 'חשבוניות ממתינות לתשלום' : 'Pending Invoices',
          description: language === 'he'
            ? `יש לך ${pendingInvoices.length} חשבוניות ממתינות בסכום כולל של ₪${pendingAmount.toLocaleString()}`
            : `You have ${pendingInvoices.length} pending invoices totaling ₪${pendingAmount.toLocaleString()}`,
          value: pendingAmount,
          color: 'blue',
          action: language === 'he' ? 'שלח תזכורות' : 'Send reminders'
        });
      }
      
      // תובנה 3: ניתוח לקוחות
      const activeClients = clients.filter(c => c.status === 'active').length;
      const leadClients = clients.filter(c => c.status === 'lead').length;
      
      if (leadClients > 0) {
        generatedInsights.push({
          type: 'opportunity',
          icon: Users,
          title: language === 'he' ? 'הזדמנויות עסקיות' : 'Business Opportunities',
          description: language === 'he'
            ? `יש לך ${leadClients} לידים פוטנציאליים שכדאי לעקוב אחריהם`
            : `You have ${leadClients} potential leads to follow up with`,
          value: leadClients,
          color: 'purple',
          action: language === 'he' ? 'פנה ללידים' : 'Contact leads'
        });
      }
      
      // תובנה 4: חיזוי תזרים
      const avgMonthlyIncome = income / 1; // חודש אחד
      const projectedNextMonth = avgMonthlyIncome * 1.1; // חיזוי 10% גידול
      
      generatedInsights.push({
        type: 'forecast',
        icon: Calendar,
        title: language === 'he' ? 'תחזית לחודש הבא' : 'Next Month Forecast',
        description: language === 'he'
          ? `על סמך המגמה הנוכחית, צפוי הכנסה של ₪${Math.round(projectedNextMonth).toLocaleString()} בחודש הבא`
          : `Based on current trends, expecting revenue of ₪${Math.round(projectedNextMonth).toLocaleString()} next month`,
        value: projectedNextMonth,
        color: 'indigo'
      });
      
      // תובנה 5: הוצאות גבוהות
      const topExpenseCategory = findTopExpenseCategory(thisMonth);
      if (topExpenseCategory) {
        generatedInsights.push({
          type: 'insight',
          icon: Sparkles,
          title: language === 'he' ? 'קטגוריית הוצאה מובילה' : 'Top Expense Category',
          description: language === 'he'
            ? `ההוצאה הגדולה ביותר שלך היא על ${topExpenseCategory.category} (₪${topExpenseCategory.amount.toLocaleString()})`
            : `Your largest expense is on ${topExpenseCategory.category} (₪${topExpenseCategory.amount.toLocaleString()})`,
          value: topExpenseCategory.amount,
          color: 'orange'
        });
      }
      
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setGenerating(false);
    }
  };

  const findTopExpenseCategory = (transactions) => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const byCategory = {};
    
    expenses.forEach(t => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = 0;
      }
      byCategory[t.category] += t.amount;
    });
    
    const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    return top ? { category: top[0], amount: top[1] } : null;
  };

  const getColorClasses = (color) => {
    const colors = {
      green: 'bg-green-50 border-green-200 text-green-900',
      red: 'bg-red-50 border-red-200 text-red-900',
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      purple: 'bg-purple-50 border-purple-200 text-purple-900',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900',
      orange: 'bg-orange-50 border-orange-200 text-orange-900'
    };
    return colors[color] || colors.blue;
  };

  if (generating && insights.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 animate-pulse text-purple-600" />
          <p className="text-gray-600">
            {language === 'he' ? 'מנתח נתונים ומפיק תובנות...' : 'Analyzing data and generating insights...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold">
          {language === 'he' ? 'תובנות אוטומטיות' : 'Automatic Insights'}
        </h3>
      </div>
      
      {insights.map((insight, index) => {
        const Icon = insight.icon;
        return (
          <Card key={index} className={`border ${getColorClasses(insight.color)}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{insight.title}</h4>
                  <p className="text-sm opacity-90">{insight.description}</p>
                  {insight.action && (
                    <button className="text-sm font-medium underline mt-2">
                      {insight.action}
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}