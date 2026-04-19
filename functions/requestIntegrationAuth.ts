import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integration_type, integration_name } = await req.json();

    // מיפוי אינטגרציות ל-scopes
    const integrationConfig = {
      gmail: {
        scopes: [
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.modify'
        ],
        reason: 'כדי לאפשר ל-OpsBrain לשלוח ולקרוא אימיילים'
      },
      googlecalendar: {
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ],
        reason: 'כדי לנהל אירועים ביומן'
      },
      googledrive: {
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        reason: 'כדי לשמור ולנהל קבצים'
      },
      googlesheets: {
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        reason: 'כדי לייצא דוחות ולנהל נתונים'
      },
      googledocs: {
        scopes: ['https://www.googleapis.com/auth/documents'],
        reason: 'כדי ליצור ולערוך מסמכים'
      },
      googleslides: {
        scopes: ['https://www.googleapis.com/auth/presentations'],
        reason: 'כדי ליצור ולערוך מצגות'
      },
      slack: {
        scopes: ['chat:write', 'channels:read', 'users:read'],
        reason: 'כדי לשלוח הודעות והתראות'
      },
      notion: {
        scopes: [],
        reason: 'כדי לסנכרן מסמכים ומשימות'
      },
      hubspot: {
        scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write'],
        reason: 'כדי לסנכרן לקוחות ואנשי קשר'
      }
    };

    const config = integrationConfig[integration_type];
    
    if (!config) {
      return Response.json({ 
        error: 'Integration not supported',
        message: 'אינטגרציה זו אינה נתמכת'
      }, { status: 400 });
    }

    // החזרת הנתונים שהצד הלקוח יצטרך כדי לבקש הרשאה
    return Response.json({
      success: true,
      integration_type,
      integration_name: integration_name || integration_type,
      scopes: config.scopes,
      reason: config.reason,
      message: 'נתוני ההרשאה מוכנים'
    });

  } catch (error) {
    console.error('Error in requestIntegrationAuth:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});