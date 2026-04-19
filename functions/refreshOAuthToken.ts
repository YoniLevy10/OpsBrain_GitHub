import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * רענון OAuth tokens שפג תוקפם
 * מטפל ב-refresh token flow אוטומטית
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integration_id, workspace_id } = await req.json();

    // שליפת האינטגרציה
    const integrations = await base44.asServiceRole.entities.WorkspaceIntegration.filter({
      id: integration_id,
      workspace_id
    });

    if (integrations.length === 0) {
      return Response.json({ error: 'Integration not found' }, { status: 404 });
    }

    const integration = integrations[0];

    // בדוק אם יש refresh_token
    if (!integration.refresh_token) {
      return Response.json({ 
        error: 'No refresh token available',
        message: 'יש להתחבר מחדש לאינטגרציה'
      }, { status: 400 });
    }

    // רענון ה-token לפי הספק
    let newTokens;
    
    switch (integration.provider) {
      case 'gmail':
      case 'googlecalendar':
      case 'googledrive':
      case 'googlesheets':
      case 'googledocs':
      case 'googleslides':
        // Google OAuth refresh
        const googleResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
            refresh_token: integration.refresh_token,
            grant_type: 'refresh_token'
          })
        });
        
        if (!googleResponse.ok) {
          throw new Error('Failed to refresh Google token');
        }
        
        const googleData = await googleResponse.json();
        newTokens = {
          access_token: googleData.access_token,
          expires_at: new Date(Date.now() + googleData.expires_in * 1000).toISOString()
        };
        break;

      case 'slack':
        // Slack OAuth refresh
        const slackResponse = await fetch('https://slack.com/api/oauth.v2.access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: Deno.env.get('SLACK_CLIENT_ID'),
            client_secret: Deno.env.get('SLACK_CLIENT_SECRET'),
            refresh_token: integration.refresh_token,
            grant_type: 'refresh_token'
          })
        });
        
        const slackData = await slackResponse.json();
        if (!slackData.ok) {
          throw new Error('Failed to refresh Slack token');
        }
        
        newTokens = {
          access_token: slackData.access_token,
          expires_at: new Date(Date.now() + slackData.expires_in * 1000).toISOString()
        };
        break;

      default:
        return Response.json({ 
          error: 'Unsupported provider',
          message: `רענון אוטומטי לא נתמך עבור ${integration.provider}`
        }, { status: 400 });
    }

    // עדכון האינטגרציה עם ה-tokens החדשים
    await base44.asServiceRole.entities.WorkspaceIntegration.update(integration_id, {
      access_token: newTokens.access_token,
      expires_at: newTokens.expires_at,
      last_sync: new Date().toISOString(),
      status: 'active'
    });

    // רישום ב-ActivityFeed
    await base44.asServiceRole.entities.ActivityFeed.create({
      workspace_id,
      user_email: user.email,
      user_name: user.full_name,
      action_type: "updated",
      entity_type: "Integration",
      entity_id: integration_id,
      entity_name: integration.provider,
      description: `Token רוענן אוטומטית עבור ${integration.provider}`,
      icon: "🔄",
      color: "green"
    });

    return Response.json({
      success: true,
      access_token: newTokens.access_token,
      expires_at: newTokens.expires_at,
      message: 'Token רוענן בהצלחה'
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return Response.json({ 
      error: error.message || 'Failed to refresh token',
      details: error.stack
    }, { status: 500 });
  }
});