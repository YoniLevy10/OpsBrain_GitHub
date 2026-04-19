import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace_id, max_results = 10 } = await req.json();

    // קבלת access token מ-Gmail OAuth
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');

    // שליפת אימיילים אחרונים
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${max_results}&q=is:unread`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch emails');
    }

    const data = await response.json();
    const messages = data.messages || [];

    // שליפת פרטי כל אימייל
    const emailDetails = await Promise.all(
      messages.slice(0, max_results).map(async (msg) => {
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const detail = await detailResponse.json();
        
        const headers = detail.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        // בדיקה אם יש חשבונית במייל
        const hasInvoice = /invoice|חשבונית|receipt|קבלה/i.test(subject);

        return {
          id: msg.id,
          subject,
          from,
          date,
          snippet: detail.snippet,
          hasInvoice,
          threadId: msg.threadId
        };
      })
    );

    // אוטומציה: יצירת משימה לכל מייל עם חשבונית
    for (const email of emailDetails.filter(e => e.hasInvoice)) {
      try {
        await base44.asServiceRole.entities.Task.create({
          workspace_id,
          title: `עיבוד חשבונית: ${email.subject}`,
          description: `התקבלה חשבונית במייל מ-${email.from}`,
          status: 'pending',
          priority: 'high',
          source: 'email',
          metadata: {
            email_id: email.id,
            email_subject: email.subject
          }
        });
      } catch (error) {
        console.error('Failed to create task:', error);
      }
    }

    return Response.json({
      success: true,
      emails: emailDetails,
      unread_count: emailDetails.length,
      invoices_found: emailDetails.filter(e => e.hasInvoice).length
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});