import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, DollarSign, Users, Lightbulb, CheckCircle, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useDashboardData } from '@/components/hooks/useDashboardData';

export default function ProactiveInsights() {
  const { invoices, clients, projects, transactions, activeWorkspace } = useDashboardData();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);

  useEffect(() => {
    if (activeWorkspace) {
      generateInsights();
    }
  }, [invoices.length, clients.length, projects.length, transactions.length, activeWorkspace?.id]);

  const generateInsights = async () => {
    const newInsights = [];
    const today = new Date();

    // 1. חשבוניות שלא שולמו
    const unpaidInvoices = invoices.filter(inv => 
      inv.status === 'sent' && 
      new Date(inv.due_date) < today
    );
    if (unpaidInvoices.length > 0) {
      const total = unpaidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      newInsights.push({
        id: 'unpaid-invoices',
        type: 'warning',
        icon: AlertTriangle,
        title: `${unpaidInvoices.length} חשבוניות ממתינות לתשלום`,
        description: `סה"כ ₪${total.toLocaleString()} בחשבוניות שעבר מועד התשלום שלהן`,
        action: 'שלח תזכורות',
        actionable: true,
        data: unpaidInvoices
      });
    }

    // 2. פרויקטים בסיכון
    const atRiskProjects = projects.filter(proj => {
      if (proj.status === 'active' && proj.budget && proj.actual_cost) {
        const usage = (proj.actual_cost / proj.budget) * 100;
        return usage > 80;
      }
      return false;
    });
    if (atRiskProjects.length > 0) {
      newInsights.push({
        id: 'at-risk-projects',
        type: 'alert',
        icon: AlertTriangle,
        title: `${atRiskProjects.length} פרויקטים בסיכון תקציבי`,
        description: 'פרויקטים שעברו 80% מהתקציב',
        action: 'צפה בפרויקטים',
        actionable: true,
        data: atRiskProjects
      });
    }

    // 3. לקוחות שלא היה איתם קשר
    const inactiveClients = clients.filter(client => {
      if (client.last_contact) {
        const daysSinceContact = Math.floor((today - new Date(client.last_contact)) / (1000 * 60 * 60 * 24));
        return daysSinceContact > 30;
      }
      return false;
    });
    if (inactiveClients.length > 0) {
      newInsights.push({
        id: 'inactive-clients',
        type: 'opportunity',
        icon: Users,
        title: `${inactiveClients.length} לקוחות ללא קשר ל-30+ יום`,
        description: 'הזדמנות לחידוש קשר ומכירה נוספת',
        action: 'צור רשימת משימות',
        actionable: true,
        data: inactiveClients
      });
    }

    // 4. חיזוי תזרים מזומנים
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const last30DaysExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) > thirtyDaysAgo)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const avgMonthlyExpense = last30DaysExpenses;
    const pendingIncome = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    
    if (avgMonthlyExpense > 0) {
      const cashRunway = pendingIncome / avgMonthlyExpense;
      
      if (cashRunway < 2) {
        newInsights.push({
          id: 'cash-flow',
          type: 'warning',
          icon: DollarSign,
          title: 'תזרים מזומנים נמוך',
          description: `יש לך כיסוי ל-${cashRunway.toFixed(1)} חודשים בלבד`,
          action: 'צפה בתחזית',
          actionable: false
        });
      }
    }

    // 5. המלצה לצמיחה
    const topClient = clients.reduce((prev, current) => 
      ((current.total_revenue || 0) > (prev?.total_revenue || 0)) ? current : prev
    , null);
    
    if (topClient && (topClient.total_revenue || 0) > 0) {
      newInsights.push({
        id: 'upsell-opportunity',
        type: 'opportunity',
        icon: TrendingUp,
        title: `הזדמנות לשדרוג עם ${topClient.name}`,
        description: `הלקוח הכי רווחי שלך (₪${(topClient.total_revenue || 0).toLocaleString()}) - כדאי להציע שירות נוסף`,
        action: 'צור הצעת מחיר',
        actionable: true,
        data: [topClient]
      });
    }

    setInsights(newInsights);
    setLoading(false);
  };

  const handleAction = async (insight) => {
    setActioning(insight.id);
    
    try {
      switch(insight.id) {
        case 'unpaid-invoices':
          for (const invoice of insight.data) {
            const client = clients.find(c => c.id === invoice.client_id);
            if (client?.email) {
              await base44.integrations.Core.SendEmail({
                to: client.email,
                subject: `תזכורת: חשבונית ${invoice.invoice_number} ממתינה לתשלום`,
                body: `שלום ${client.name},\n\nחשבונית מספר ${invoice.invoice_number} בסך ₪${invoice.total_amount} ממתינה לתשלום.\nתאריך יעד לתשלום: ${new Date(invoice.due_date).toLocaleDateString('he-IL')}\n\nתודה,\nצוות OpsBrain`
              });
            }
          }
          toast.success('תזכורות נשלחו בהצלחה');
          break;

        case 'inactive-clients':
          for (const client of insight.data.slice(0, 3)) {
            const daysSince = Math.floor((new Date() - new Date(client.last_contact)) / (1000 * 60 * 60 * 24));
            await base44.entities.Task.create({
              workspace_id: activeWorkspace.id,
              title: `חידוש קשר עם ${client.name}`,
              description: `לא היה קשר עם לקוח זה כבר ${daysSince} יום`,
              status: 'open',
              priority: 'medium',
              due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
          }
          toast.success('משימות מעקב נוצרו');
          break;

        default:
          toast.info('פעולה זו תתווסף בקרוב');
      }

      setInsights(prev => prev.filter(i => i.id !== insight.id));
    } catch (error) {
      console.error('Action error:', error);
      toast.error('שגיאה בביצוע הפעולה');
    } finally {
      setActioning(null);
    }
  };

  const dismissInsight = (insightId) => {
    setInsights(prev => prev.filter(i => i.id !== insightId));
    toast.success('התובנה נסגרה');
  };

  const typeConfig = {
    warning: { color: 'bg-red-50 border-red-200', badgeColor: 'bg-red-100 text-red-800' },
    alert: { color: 'bg-orange-50 border-orange-200', badgeColor: 'bg-orange-100 text-orange-800' },
    opportunity: { color: 'bg-green-50 border-green-200', badgeColor: 'bg-green-100 text-green-800' }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">מנתח נתונים ומייצר תובנות...</p>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">הכל נראה טוב!</h3>
          <p className="text-gray-500 text-sm">אין התראות או המלצות כרגע</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map(insight => {
        const Icon = insight.icon;
        const config = typeConfig[insight.type];
        
        return (
          <Card key={insight.id} className={`border ${config.color}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                      <Badge className={config.badgeColor}>
                        {insight.type === 'warning' ? 'דורש תשומת לב' : 
                         insight.type === 'alert' ? 'התראה' : 'הזדמנות'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{insight.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissInsight(insight.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            {insight.actionable && (
              <CardContent className="pt-0">
                <Button
                  onClick={() => handleAction(insight)}
                  disabled={actioning === insight.id}
                  size="sm"
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  {actioning === insight.id ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      מבצע...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4 ml-2" />
                      {insight.action}
                    </>
                  )}
                </Button>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}