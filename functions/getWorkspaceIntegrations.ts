import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Get workspace integrations with workspace membership verification
 * Returns all integrations connected to the active workspace (Stage 1: Security Hardened)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active workspace
    const stateRecords = await base44.entities.UserWorkspaceState.filter({
      user_id: user.id
    });

    if (stateRecords.length === 0) {
      return Response.json({ error: 'No active workspace' }, { status: 400 });
    }

    const workspaceId = stateRecords[0].active_workspace_id;

    // SECURITY: Stage 1 - Verify workspace membership before returning data
    const membership = await base44.entities.WorkspaceMember.filter({
      workspace_id: workspaceId,
      user_id: user.id
    });

    if (membership.length === 0) {
      return Response.json(
        { error: 'Access denied: not a member of this workspace' },
        { status: 403 }
      );
    }

    // Get integrations for this workspace
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