import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integration_type, reason, scopes } = await req.json();

    // רשימת כל האינטגרציות הנתמכות
    const supportedIntegrations = {
      googlecalendar: { 
        name: 'Google Calendar',
        defaultScopes: ['https://www.googleapis.com/auth/calendar']
      },
      googledrive: { 
        name: 'Google Drive',
        defaultScopes: ['https://www.googleapis.com/auth/drive.file']
      },
      gmail: { 
        name: 'Gmail',
        defaultScopes: [
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.modify'
        ]
      },
      googlesheets: { 
        name: 'Google Sheets',
        defaultScopes: ['https://www.googleapis.com/auth/spreadsheets']
      },
      googledocs: { 
        name: 'Google Docs',
        defaultScopes: ['https://www.googleapis.com/auth/documents']
      },
      googleslides: { 
        name: 'Google Slides',
        defaultScopes: ['https://www.googleapis.com/auth/presentations']
      },
      slack: { 
        name: 'Slack',
        defaultScopes: ['chat:write', 'channels:read', 'users:read']
      },
      notion: { 
        name: 'Notion',
        defaultScopes: []
      },
      hubspot: { 
        name: 'HubSpot',
        defaultScopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write']
      }
    };

    const integration = supportedIntegrations[integration_type];
    
    if (!integration) {
      return Response.json({ 
        error: 'Integration not supported',
        supported: Object.keys(supportedIntegrations)
      }, { status: 400 });
    }

    // החזר הוראות לחיבור
    return Response.json({ 
      success: true,
      message: `Please authorize ${integration.name} through Base44 app connectors`,
      integration_type,
      scopes: scopes || integration.defaultScopes,
      reason,
      instructions: {
        he: `כדי לחבר את ${integration.name}, יש להשתמש ב-App Connectors של Base44 דרך הממשק`,
        en: `To connect ${integration.name}, use Base44 App Connectors through the interface`
      }
    });

  } catch (error) {
    console.error('Error in requestOAuthIntegration:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});