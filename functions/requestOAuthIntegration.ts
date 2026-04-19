import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integration_type, integration_name } = await req.json();

    // רשימת האינטגרציות הנתמכות ב-Base44
    const supportedIntegrations = {
      googlecalendar: 'Google Calendar',
      googledrive: 'Google Drive',
      gmail: 'Gmail',
      googlesheets: 'Google Sheets',
      googledocs: 'Google Docs',
      googleslides: 'Google Slides',
      slack: 'Slack',
      notion: 'Notion',
      hubspot: 'HubSpot'
    };

    const integrationName = supportedIntegrations[integration_type];
    
    if (!integrationName) {
      return Response.json({ 
        error: 'Integration not supported',
        message: 'האינטגרציה הזו אינה נתמכת כרגע',
        supported: Object.keys(supportedIntegrations)
      }, { status: 400 });
    }

    // יצירת שיחה עם הסוכן הראשי שיטפל בבקשה
    return Response.json({ 
      success: false,
      requires_chat: true,
      message: `כדי לחבר את ${integrationName}, פנה לעוזר האישי שלך בצ'אט`,
      chat_message: `אני רוצה לחבר ${integration_name || integrationName}`,
      integration_type,
      note: 'Base44 connectors נדרשים לחיבור זה - יש לפנות דרך הצ\'אט כדי שהמערכת תבקש הרשאות'
    });

  } catch (error) {
    console.error('Error in requestOAuthIntegration:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});