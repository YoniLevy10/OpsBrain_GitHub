import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Support both scheduled (no auth) and manual (with auth) invocations
    let body = {};
    try { body = await req.json(); } catch (_) {}

    const { action, workspace_id, project_id, invoice_id } = body;

    // If called as scheduled automation (no action), run overdue check across all workspaces
    if (!action) {
      const allInvoices = await base44.asServiceRole.entities.Invoice.filter({ status: 'sent' });
      const now = Date.now();
      const overdue = allInvoices.filter(inv => inv.due_date && now > new Date(inv.due_date).getTime());

      for (const inv of overdue) {
        const client = await base44.asServiceRole.entities.Client.filter({ id: inv.client_id });
        if (client.length > 0 && client[0].email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: client[0].email,
            subject: `תזכורת תשלום: חשבונית ${inv.invoice_number}`,
            body: `<div dir="rtl"><p>שלום ${client[0].name},</p><p>חשבונית ${inv.invoice_number} בסך ₪${inv.total_amount} עברה את מועד התשלום.</p><p>נשמח לקבל את התשלום בהקדם. תודה!</p></div>`
          });
        }
      }

      return Response.json({ success: true, reminders_sent: overdue.length });
    }

    // Manual actions require admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    switch (action) {
      case 'create_from_project': {
        // שליפת פרטי הפרויקט
        const project = await base44.asServiceRole.entities.Project.get(project_id);
        if (!project) {
          return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        // שליפת פרטי הלקוח
        const client = await base44.asServiceRole.entities.Client.get(project.client_id);

        // יצירת החשבונית
        const invoice = await base44.asServiceRole.entities.Invoice.create({
          workspace_id,
          client_id: project.client_id,
          invoice_number: `INV-${Date.now()}`,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'draft',
          items: [{
            description: project.name,
            quantity: 1,
            unit_price: project.budget || 0,
            total: project.budget || 0
          }],
          subtotal: project.budget || 0,
          tax_rate: 17,
          tax_amount: (project.budget || 0) * 0.17,
          total_amount: (project.budget || 0) * 1.17
        });

        return Response.json({ 
          success: true, 
          invoice,
          message: 'חשבונית נוצרה אוטומטית'
        });
      }

      case 'send_invoice': {
        const invoice = await base44.asServiceRole.entities.Invoice.get(invoice_id);
        const client = await base44.asServiceRole.entities.Client.get(invoice.client_id);

        // שליחת מייל ללקוח
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: client.email,
          subject: `חשבונית מספר ${invoice.invoice_number}`,
          body: `
            <div dir="rtl" style="font-family: Arial, sans-serif;">
              <h2>שלום ${client.name},</h2>
              <p>מצורפת חשבונית מספר ${invoice.invoice_number}</p>
              <p><strong>סכום לתשלום:</strong> ₪${invoice.total_amount}</p>
              <p><strong>תאריך לתשלום:</strong> ${invoice.due_date}</p>
              <br>
              <p>תודה על העסק!</p>
            </div>
          `
        });

        // עדכון סטטוס
        await base44.asServiceRole.entities.Invoice.update(invoice_id, {
          status: 'sent'
        });

        return Response.json({ 
          success: true,
          message: 'החשבונית נשלחה בהצלחה'
        });
      }

      case 'send_reminder': {
        const invoice = await base44.asServiceRole.entities.Invoice.get(invoice_id);
        const client = await base44.asServiceRole.entities.Client.get(invoice.client_id);

        const daysOverdue = Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: client.email,
          subject: `תזכורת: חשבונית ${invoice.invoice_number}`,
          body: `
            <div dir="rtl" style="font-family: Arial, sans-serif;">
              <h2>שלום ${client.name},</h2>
              <p>זוהי תזכורת ידידותית לגבי חשבונית ${invoice.invoice_number}</p>
              <p><strong>סכום לתשלום:</strong> ₪${invoice.total_amount}</p>
              <p><strong>עבר מועד התשלום ב:</strong> ${daysOverdue} ימים</p>
              <br>
              <p>נשמח לקבל את התשלום בהקדם.</p>
              <p>תודה!</p>
            </div>
          `
        });

        return Response.json({ 
          success: true,
          message: 'תזכורת נשלחה'
        });
      }

      case 'check_overdue': {
        // בדיקת חשבוניות שעבר מועד התשלום שלהן
        const invoices = await base44.asServiceRole.entities.Invoice.filter({
          workspace_id,
          status: 'sent'
        });

        const now = Date.now();
        const overdueInvoices = invoices.filter(inv => {
          const dueDate = new Date(inv.due_date).getTime();
          return now > dueDate;
        });

        return Response.json({
          success: true,
          overdue_count: overdueInvoices.length,
          invoices: overdueInvoices
        });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});