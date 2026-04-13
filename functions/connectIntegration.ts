import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * חיבור אינטגרציה חדשה ל-Workspace
 * מקבל: integration_name, integration_type, credentials, settings
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // אימות משתמש
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // קבלת workspace פעיל
    const stateRecords = await base44.entities.UserWorkspaceState.filter({
      user_id: user.id
    });

    if (stateRecords.length === 0) {
      return Response.json({ error: 'No active workspace' }, { status: 400 });
    }

    const workspaceId = stateRecords[0].active_workspace_id;

    // קריאת body
    const { integration_name, integration_type, credentials, settings } = await req.json();

    if (!integration_name || !integration_type) {
      return Response.json({ 
        error: 'Missing required fields: integration_name, integration_type' 
      }, { status: 400 });
    }

    // בדוק אם כבר קיים
    const existing = await base44.entities.WorkspaceIntegration.filter({
      workspace_id: workspaceId,
      integration_name
    });

    let integration;
    
    if (existing.length > 0) {
      // עדכן קיים
      integration = await base44.entities.WorkspaceIntegration.update(existing[0].id, {
        credentials,
        settings,
        status: 'active',
        last_sync: new Date().toISOString()
      });
    } else {
      // צור חדש
      integration = await base44.entities.WorkspaceIntegration.create({
        workspace_id: workspaceId,
        integration_name,
        integration_type,
        credentials,
        settings,
        status: 'active',
        last_sync: new Date().toISOString()
      });
    }

    return Response.json({ 
      success: true, 
      integration 
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});