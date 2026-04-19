import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || !event) {
      return Response.json({ error: 'Missing data' }, { status: 400 });
    }

    // שליפת פרטי הלקוח
    const client = await base44.asServiceRole.entities.Client.filter({ id: data.client_id });
    if (!client.length || !client[0].phone) {
      return Response.json({ 
        success: false, 
        message: 'Client has no phone number' 
      });
    }

    const clientData = client[0];

    // יצירת הודעת WhatsApp
    const message = `
שלום ${clientData.name} 👋

קיבלת חשבונית חדשה מספר *${data.invoice_number}*

📊 פרטי החשבונית:
• סכום: *₪${data.total_amount.toLocaleString()}*
• תאריך יעד: ${new Date(data.due_date).toLocaleDateString('he-IL')}

💳 ניתן לשלם באמצעות:
• העברה בנקאית
• כרטיס אשראי
• bit

תודה על העסקים המשותפים! 🙏
    `.trim();

    // כאן תצטרך להוסיף אינטגרציה עם WhatsApp Business API
    // לדוגמה: Twilio, WhatsApp Business Cloud API, או WA.me link
    
    // יצירת לינק WhatsApp (פשוט)
    const phoneNumber = clientData.phone.replace(/[^0-9]/g, '');
    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    // שמירת התראה למשתמש
    const workspace = await base44.asServiceRole.entities.Workspace.filter({ id: data.workspace_id });
    if (workspace.length > 0) {
      const members = await base44.asServiceRole.entities.WorkspaceMember.filter({
        workspace_id: data.workspace_id,
        status: 'active'
      });

      for (const member of members) {
        await base44.asServiceRole.entities.Notification.create({
          workspace_id: data.workspace_id,
          user_email: member.invited_email,
          type: 'system',
          priority: 'medium',
          title: '📱 חשבונית נשלחה ב-WhatsApp',
          message: `חשבונית ${data.invoice_number} ללקוח ${clientData.name}`,
          action_url: whatsappLink,
          action_label: 'פתח WhatsApp'
        });
      }
    }

    return Response.json({
      success: true,
      whatsapp_link: whatsappLink,
      message: 'WhatsApp notification created'
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});