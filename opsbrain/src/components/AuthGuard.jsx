import React, { useState, useEffect } from 'react';
import { opsbrain } from '@/api/client';
import { Loader2 } from 'lucide-react';
import { WorkspaceProvider } from './workspace/WorkspaceContext';

/**
 * AuthGuard - Multi-Workspace Edition
 * בודק:
 * 1. Authentication
 * 2. Workspace membership
 * 3. Auto-create workspace if needed
 * 4. Onboarding status
 */
export default function AuthGuard({ children }) {
  const [authState, setAuthState] = useState('loading');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // 1. בדיקת authentication
      const isAuth = await opsbrain.auth.isAuthenticated();
      
      if (!isAuth) {
        setAuthState('unauthenticated');
        opsbrain.auth.redirectToLogin(window.location.pathname);
        return;
      }

      // 2. קבלת פרטי משתמש
      const currentUser = await opsbrain.auth.me();
      setUser(currentUser);

      // 3. בדיקת memberships
      const memberships = await opsbrain.entities.WorkspaceMember.filter({
        user_id: currentUser.id,
        status: 'active'
      });

      // 4. אם אין workspaces - נוצר אוטומטית
      if (memberships.length === 0) {
        await createDefaultWorkspace(currentUser);
        return;
      }

      // 5. בדיקת active workspace
      const stateRecords = await opsbrain.entities.UserWorkspaceState.filter({
        user_id: currentUser.id
      });

      let activeWorkspaceId = stateRecords.length > 0 
        ? stateRecords[0].active_workspace_id 
        : memberships[0].workspace_id;

      // בדוק שה-workspace קיים ב-memberships
      const validMembership = memberships.find(m => m.workspace_id === activeWorkspaceId);
      if (!validMembership) {
        activeWorkspaceId = memberships[0].workspace_id;
        
        // עדכן state
        if (stateRecords.length > 0) {
          await opsbrain.entities.UserWorkspaceState.update(stateRecords[0].id, {
            active_workspace_id: activeWorkspaceId
          });
        } else {
          await opsbrain.entities.UserWorkspaceState.create({
            user_id: currentUser.id,
            active_workspace_id: activeWorkspaceId
          });
        }
      }

      // 6. טען את ה-workspace הפעיל
      const activeWorkspaces = await opsbrain.entities.Workspace.filter({ id: activeWorkspaceId });
      
      if (activeWorkspaces.length === 0) {
        console.error('Active workspace not found');
        await createDefaultWorkspace(currentUser);
        return;
      }

      const activeWorkspace = activeWorkspaces[0];

      // 7. בדוק onboarding
      if (!activeWorkspace.onboarding_completed) {
        setAuthState('needs-onboarding');
        window.location.href = '/Onboarding';
        return;
      }

      // 8. הכל תקין
      setAuthState('authenticated');
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState('unauthenticated');
      opsbrain.auth.redirectToLogin(window.location.pathname);
    }
  };

  const createDefaultWorkspace = async (user) => {
    try {
      const workspaceName = user.full_name 
        ? `${user.full_name.split(' ')[0]}'s Workspace`
        : user.email.split('@')[0] + "'s Workspace";

      const workspace = await opsbrain.entities.Workspace.create({
        name: workspaceName,
        onboarding_completed: false
      });

      await opsbrain.entities.WorkspaceMember.create({
        workspace_id: workspace.id,
        user_id: user.id,
        invited_email: user.email,
        role: 'owner',
        status: 'active',
        accepted_at: new Date().toISOString()
      });

      await opsbrain.entities.UserWorkspaceState.create({
        user_id: user.id,
        active_workspace_id: workspace.id
      });

      // הפנה ל-onboarding
      setAuthState('needs-onboarding');
      window.location.href = '/Onboarding';
    } catch (error) {
      console.error('Error creating default workspace:', error);
      setAuthState('unauthenticated');
    }
  };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated' || authState === 'needs-onboarding') {
    return null;
  }

  return children;
}