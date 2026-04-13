import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace_id } = await req.json();

    // שליפת כל הנתונים הפיננסיים
    const [transactions, invoices, subscriptions] = await Promise.all([
      base44.asServiceRole.entities.Transaction.filter({ workspace_id }),
      base44.asServiceRole.entities.Invoice.filter({ workspace_id }),
      base44.asServiceRole.entities.Subscription.filter({ workspace_id, status: 'active' })
    ]);

    // חישוב ממוצעים חודשיים מ-90 יום אחרונים
    const now = Date.now();
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
    
    const recentTransactions = transactions.filter(t => 
      new Date(t.date) >= ninetyDaysAgo
    );

    const avgMonthlyIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0) / 3;

    const avgMonthlyExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0) / 3;

    // חישוב הכנסות צפויות מחשבוניות
    const pendingInvoices = invoices.filter(i => 
      i.status === 'sent' || i.status === 'draft'
    );
    const expectedFromInvoices = pendingInvoices.reduce((sum, i) => 
      sum + (i.total_amount || 0), 0
    );

    // הכנסות צפויות ממנויים
    const monthlyRecurringRevenue = subscriptions.reduce((sum, s) => {
      const freq = s.billing_frequency === 'monthly' ? 1 : 
                   s.billing_frequency === 'quarterly' ? 0.33 : 0.083;
      return sum + (s.amount * freq);
    }, 0);

    // יתרה נוכחית (הכנסות - הוצאות)
    const currentBalance = transactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);

    // בניית תחזית ל-90 יום קדימה
    const forecast = [];
    let runningBalance = currentBalance;

    for (let i = 0; i < 90; i += 7) { // שבועות
      const week = Math.floor(i / 7) + 1;
      const date = new Date(now + i * 24 * 60 * 60 * 1000);
      
      // הכנסות שבועיות משוערות
      const weeklyIncome = (avgMonthlyIncome + monthlyRecurringRevenue) / 4;
      const weeklyExpenses = avgMonthlyExpenses / 4;
      
      // הוספת רנדומליות קלה לריאליזם
      const variance = 0.15; // 15% שונות
      const incomeVariance = 1 + (Math.random() - 0.5) * variance;
      const expenseVariance = 1 + (Math.random() - 0.5) * variance;
      
      const projectedIncome = weeklyIncome * incomeVariance;
      const projectedExpenses = weeklyExpenses * expenseVariance;
      
      runningBalance = runningBalance + projectedIncome - projectedExpenses;

      forecast.push({
        week,
        date: date.toISOString().split('T')[0],
        balance: Math.round(runningBalance),
        income: Math.round(projectedIncome),
        expenses: Math.round(projectedExpenses),
        net: Math.round(projectedIncome - projectedExpenses)
      });
    }

    // זיהוי חוסרים צפויים
    const alerts = [];
    forecast.forEach((week, idx) => {
      if (week.balance < 5000) {
        const daysUntil = idx * 7;
        alerts.push({
          severity: week.balance < 0 ? 'critical' : 'warning',
          date: week.date,
          days_until: daysUntil,
          projected_balance: week.balance,
          message: week.balance < 0 
            ? `חוסר צפוי של ₪${Math.abs(week.balance).toLocaleString()}`
            : `יתרה נמוכה צפויה: ₪${week.balance.toLocaleString()}`
        });
      }
    });

    // המלצות אוטומטיות
    const recommendations = [];

    // המלצה על גביית חשבוניות
    if (pendingInvoices.length > 0) {
      const overdueInvoices = pendingInvoices.filter(i => 
        new Date(i.due_date) < new Date()
      );
      if (overdueInvoices.length > 0) {
        recommendations.push({
          type: 'collect_payments',
          priority: 'high',
          action: 'גבה תשלומים מחשבוניות באיחור',
          impact: `₪${overdueInvoices.reduce((s, i) => s + i.total_amount, 0).toLocaleString()}`,
          count: overdueInvoices.length
        });
      }
    }

    // המלצה על קיצוץ הוצאות
    if (avgMonthlyExpenses > avgMonthlyIncome * 0.7) {
      recommendations.push({
        type: 'reduce_expenses',
        priority: 'medium',
        action: 'הוצאות גבוהות - בדוק אופטימיזציה',
        impact: `₪${Math.round((avgMonthlyExpenses - avgMonthlyIncome * 0.6)).toLocaleString()}`,
        detail: 'מומלץ להוריד הוצאות ל-60% מההכנסות'
      });
    }

    // המלצה על השקעה
    if (currentBalance > 50000 && forecast[12]?.balance > 50000) {
      recommendations.push({
        type: 'invest',
        priority: 'low',
        action: 'עודף תזרים - שקול השקעה',
        impact: `₪${Math.round(currentBalance * 0.3).toLocaleString()}`,
        detail: 'ניתן להשקיע עד 30% מהיתרה'
      });
    }

    return Response.json({
      success: true,
      current_balance: Math.round(currentBalance),
      forecast,
      alerts,
      recommendations,
      metrics: {
        avg_monthly_income: Math.round(avgMonthlyIncome),
        avg_monthly_expenses: Math.round(avgMonthlyExpenses),
        monthly_recurring_revenue: Math.round(monthlyRecurringRevenue),
        pending_invoices_value: Math.round(expectedFromInvoices)
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});