/**
 * OpsBrain Stage 1 Security - Workspace Membership Verification
 * 
 * This helper ensures that authenticated users can only access
 * workspace-scoped operations if they are actually members of that workspace.
 */

export async function verifyWorkspaceMembership(
  base44: any,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  try {
    // Check if user is a member of this workspace
    const membership = await base44.entities.WorkspaceMember.filter({
      workspace_id: workspaceId,
      user_id: userId
    });

    return membership.length > 0;
  } catch (error) {
    console.error('Workspace membership check failed:', error);
    throw new Error('Security verification failed');
  }
}

export async function enforceWorkspaceMembership(req: any, workspace_error_handler?: (res: Response) => Response) {
  /**
   * Helper to verify workspace membership at function entry point.
   * Used in workspace-scoped backend functions.
   * 
   * Returns: { success: true, user, workspaceId } or throws 403 error
   */
  return async (baseFunction: () => Promise<any>): Promise<Response> => {
    try {
      const { createClientFromRequest } = await import('npm:@base44/sdk@0.8.6');
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

      // SECURITY: Verify workspace membership
      const isMember = await verifyWorkspaceMembership(base44, user.id, workspaceId);
      if (!isMember) {
        return Response.json(
          { error: 'Access denied: not a member of this workspace' },
          { status: 403 }
        );
      }

      // Call the actual function with verified context
      return await baseFunction();
    } catch (error) {
      console.error('Error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  };
}
