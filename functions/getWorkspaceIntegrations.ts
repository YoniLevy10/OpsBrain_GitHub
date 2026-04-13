import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * דוגמה ל-Backend Function מודע ל-Workspace
 * מחזיר את כל האינטגרציות המחוברות ל-Workspace הפעיל
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

    // קבלת אינטגרציות עבור workspace זה בלבד
    const integrations = await base44.entities.WorkspaceIntegration.filter({
      workspace_id: workspaceId
    });

    return Response.json({ 
      success: true, 
      workspace_id: workspaceId,
      integrations 
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});