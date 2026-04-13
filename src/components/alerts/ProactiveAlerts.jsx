import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, TrendingDown, Clock, XCircle } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/components/hooks/useDashboardData';

export default function ProactiveAlerts() {
  const { t, language } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const { invoices, transactions } = useDashboardData();

  useEffect(() => {
    generateAlerts();
  }, [invoices, transactions]);

  const generateAlerts = () => {
    const newAlerts = [];
    const now = new Date();

    // התראה 1: חשבוניות באיחור
    const overdueInvoices = invoices.filter(inv => {
      if (inv.due_date && inv.status !== 'paid') {
        const dueDate = new Date(inv.due_date);
        return dueDate < now;
      }
      return false;
    });

    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      newAlerts.push({
        id: 'overdue-invoices',
        type: 'urgent',
        icon: AlertTriangle,
        title: language === 'he' ? '⚠️ חשבוניות באיחור' : '⚠️ Overdue Invoices',
        message: language === 'he'
          ? `${overdueInvoices.length} חשבוניות באיחור בסכום כולל של ₪${totalOverdue.toLocaleString()}`
          : `${overdueInvoices.length} overdue invoices totaling ₪${totalOverdue.toLocaleString()}`,
        action: language === 'he' ? 'שלח תזכורות' : 'Send reminders',
        priority: 'high'
      });
    }

    // התראה 2: חשבוניות שעומדות לפקוע בקרוב
    const soonDueInvoices = invoices.filter(inv => {
      if (inv.due_date && inv.status !== 'paid') {
        const dueDate = new Date(inv.due_date);
        const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        return daysUntilDue > 0 && daysUntilDue <= 7;
      }
      return false;
    });

    if (soonDueInvoices.length > 0) {
      newAlerts.push({
        id: 'soon-due',
        type: 'warning',
        icon: Clock,
        title: language === 'he' ? 'תשלומים בקרוב' : 'Upcoming Payments',
        message: language === 'he'
          ? `${soonDueInvoices.length} חשבוניות יפקעו בשבוע הקרוב`
          : `${soonDueInvoices.length} invoices due next week`,
        action: language === 'he' ? 'צפה' : 'View',
        priority: 'medium'
      });
    }

    // התראה 3: תזרים צפוי להיות שלילי
    const thisMonth = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const income = thisMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = thisMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    if (expenses > income * 0.9) {
      newAlerts.push({
        id: 'cash-flow-warning',
        type: 'warning',
        icon: TrendingDown,
        title: language === 'he' ? 'תזרים מזומנים נמוך' : 'Low Cash Flow',
        message: language === 'he'
          ? 'ההוצאות שלך קרובות להכנסות. שקול לעקוב אחר הוצאות.'
          : 'Your expenses are close to your income. Consider monitoring expenses.',
        action: language === 'he' ? 'צפה בתזרים' : 'View cash flow',
        priority: 'medium'
      });
    }

    setAlerts(newAlerts);
  };

  const dismissAlert = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const Icon = alert.icon;
        const colorClasses = {
          urgent: 'bg-red-50 border-red-200',
          warning: 'bg-amber-50 border-amber-200',
          info: 'bg-blue-50 border-blue-200'
        };

        return (
          <Card key={alert.id} className={`border-2 ${colorClasses[alert.type]}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-5 h-5 ${
                    alert.type === 'urgent' ? 'text-red-600' : 
                    alert.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{alert.title}</h4>
                  <p className="text-sm text-gray-700 mb-3">{alert.message}</p>
                  <div className="flex items-center gap-2">
                    {alert.action && (
                      <Button size="sm" variant="outline">
                        {alert.action}
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      {language === 'he' ? 'התעלם' : 'Dismiss'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}