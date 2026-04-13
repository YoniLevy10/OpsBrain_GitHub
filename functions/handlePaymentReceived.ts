import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || event.type !== 'create') {
      return Response.json({ success: false });
    }

    // 1. עדכון סטטוס החשבונית ל-paid
    if (data.invoice_id) {
      await base44.asServiceRole.entities.Invoice.update(data.invoice_id, {
        status: 'paid'
      });
    }

    // 2. עדכון אנליטיקה
    const today = new Date().toISOString().split('T')[0];
    
    await base44.asServiceRole.entities.Analytics.create({
      workspace_id: data.workspace_id,
      metric_name: 'payment_received',
      metric_type: 'revenue',
      value: data.amount,
      period: 'daily',
      date: today,
      breakdown: {
        client_id: data.client_id,
        payment_method: data.payment_method,
        invoice_id: data.invoice_id
      }
    });

    // 3. רישום פעילות
    const client = await base44.asServiceRole.entities.Client.filter({ id: data.client_id });
    const clientName = client.length > 0 ? client[0].name : 'לקוח';

    await base44.asServiceRole.entities.ActivityFeed.create({
      workspace_id: data.workspace_id,
      action_type: 'completed',
      entity_type: 'Payment',
      entity_id: data.id,
      entity_name: `תשלום ₪${data.amount.toLocaleString()}`,
      description: `התקבל תשלום מ${clientName}`,
      icon: 'DollarSign',
      color: 'green'
    });

    // 4. שליחת התראות לצוות
    const members = await base44.asServiceRole.entities.WorkspaceMember.filter({
      workspace_id: data.workspace_id,
      status: 'active'
    });

    for (const member of members) {
      await base44.asServiceRole.entities.Notification.create({
        workspace_id: data.workspace_id,
        user_email: member.invited_email,
        type: 'payment_received',
        priority: 'high',
        title: '💰 תשלום התקבל!',
        message: `₪${data.amount.toLocaleString()} מ${clientName}`,
        related_entity_type: 'Payment',
        related_entity_id: data.id
      });
    }

    // 5. אם יש מנוי - עדכון תאריך חיוב הבא
    if (data.invoice_id) {
      const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
        workspace_id: data.workspace_id,
        client_id: data.client_id,
        status: 'active'
      });

      for (const sub of subscriptions) {
        const nextBilling = new Date(sub.next_billing_date);
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          next_billing_date: nextBilling.toISOString().split('T')[0]
        });
      }
    }

    return Response.json({
      success: true,
      actions_completed: [
        'invoice_updated',
        'analytics_recorded',
        'activity_logged',
        'notifications_sent',
        'subscriptions_updated'
      ]
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});