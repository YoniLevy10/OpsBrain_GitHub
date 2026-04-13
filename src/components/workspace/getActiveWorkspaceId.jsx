import { base44 } from '@/api/base44Client';

/**
 * Helper function to get the active workspace ID for the current user
 * Critical for query scoping - use this in all entity queries!
 */
export async function getActiveWorkspaceId() {
  try {
    const user = await base44.auth.me();
    
    const stateRecords = await base44.entities.UserWorkspaceState.filter({
      user_id: user.id
    });

    if (stateRecords.length === 0) {
      throw new Error('No active workspace found');
    }

    return stateRecords[0].active_workspace_id;
  } catch (error) {
    console.error('Error getting active workspace ID:', error);
    throw error;
  }
}