import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // בדוק אם הפרויקט עבר ל-completed
    if (event.type !== 'update' || data.status !== 'completed' || old_data?.status === 'completed') {
      return Response.json({ success: false, message: 'Not a completion event' });
    }

    // 1. יצירת חשבונית אוטומטית
    const project = data;
    const client = await base44.asServiceRole.entities.Client.filter({ id: project.client_id });
    
    if (!client.length) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // חישוב סכום החשבונית
    const totalAmount = project.budget || 0;
    const taxRate = 17;
    const subtotal = totalAmount / (1 + taxRate / 100);
    const taxAmount = totalAmount - subtotal;

    // יצירת מספר חשבונית
    const invoices = await base44.asServiceRole.entities.Invoice.filter({
      workspace_id: project.workspace_id
    });
    const invoiceNumber = `INV-${(invoices.length + 1).toString().padStart(4, '0')}`;

    const invoice = await base44.asServiceRole.entities.Invoice.create({
      workspace_id: project.workspace_id,
      client_id: project.client_id,
      invoice_number: invoiceNumber,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      items: [{
        description: `${project.name} - ${project.description || 'פרויקט הושלם'}`,
        quantity: 1,
        unit_price: subtotal,
        total: subtotal
      }],
      subtotal: subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      notes: `פרויקט הושלם בהצלחה: ${project.name}`
    });

    // 2. רישום פעילות
    await base44.asServiceRole.entities.ActivityFeed.create({
      workspace_id: project.workspace_id,
      action_type: 'completed',
      entity_type: 'Project',
      entity_id: project.id,
      entity_name: project.name,
      description: `פרויקט הושלם וחשבונית ${invoiceNumber} נוצרה אוטומטית`,
      icon: 'CheckCircle',
      color: 'green'
    });

    // 3. שליחת התראות
    const members = await base44.asServiceRole.entities.WorkspaceMember.filter({
      workspace_id: project.workspace_id,
      status: 'active'
    });

    for (const member of members) {
      await base44.asServiceRole.entities.Notification.create({
        workspace_id: project.workspace_id,
        user_email: member.invited_email,
        type: 'project_update',
        priority: 'high',
        title: '✅ פרויקט הושלם!',
        message: `${project.name} הושלם וחשבונית ${invoiceNumber} נוצרה`,
        action_url: '/Invoices',
        action_label: 'צפה בחשבונית',
        related_entity_type: 'Invoice',
        related_entity_id: invoice.id
      });
    }

    // 4. שליחת מייל ללקוח
    if (client[0].email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: client[0].email,
        subject: `✅ ${project.name} הושלם בהצלחה!`,
        body: `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>שלום ${client[0].name} 👋</h2>
            <p>שמחים לעדכן שהפרויקט <strong>${project.name}</strong> הושלם בהצלחה!</p>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>פרטי החשבונית:</h3>
              <p>מספר חשבונית: <strong>${invoiceNumber}</strong></p>
              <p>סכום: <strong>₪${totalAmount.toLocaleString()}</strong></p>
              <p>תאריך יעד לתשלום: ${new Date(invoice.due_date).toLocaleDateString('he-IL')}</p>
            </div>
            
            <p>תודה רבה על האמון! 🙏</p>
          </div>
        `
      });
    }

    return Response.json({
      success: true,
      invoice_id: invoice.id,
      invoice_number: invoiceNumber,
      actions: ['invoice_created', 'activity_logged', 'notifications_sent', 'email_sent']
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});