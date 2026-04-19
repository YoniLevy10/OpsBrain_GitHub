import React, { createContext, useContext, useState, useEffect } from 'react';
import { opsbrain } from '@/api/client';

const WorkspaceContext = createContext();

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};

export const WorkspaceProvider = ({ children }) => {
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const user = await opsbrain.auth.me();
      
      // טען את כל ה-memberships של המשתמש
      const memberships = await opsbrain.entities.WorkspaceMember.filter({
        user_id: user.id,
        status: 'active'
      });

      if (memberships.length === 0) {
        // אין workspaces - ניצור אחד אוטומטית
        await createDefaultWorkspace(user);
        return;
      }

      // טען את כל ה-workspaces
      const workspaceIds = memberships.map(m => m.workspace_id);
      const workspacesList = [];
      
      for (const wsId of workspaceIds) {
        const ws = await opsbrain.entities.Workspace.filter({ id: wsId });
        if (ws.length > 0) {
          workspacesList.push(ws[0]);
        }
      }

      setWorkspaces(workspacesList);

      // בדוק אם יש active workspace שמורה
      let activeWsId = null;
      const stateRecords = await opsbrain.entities.UserWorkspaceState.filter({
        user_id: user.id
      });

      if (stateRecords.length > 0) {
        activeWsId = stateRecords[0].active_workspace_id;
      }

      // אם אין או שה-workspace לא תקין, קח את הראשון
      const activeWs = workspacesList.find(w => w.id === activeWsId) || workspacesList[0];
      setActiveWorkspace(activeWs);
      
      // שמור את הבחירה
      if (stateRecords.length > 0) {
        await opsbrain.entities.UserWorkspaceState.update(stateRecords[0].id, {
          active_workspace_id: activeWs.id
        });
      } else {
        await opsbrain.entities.UserWorkspaceState.create({
          user_id: user.id,
          active_workspace_id: activeWs.id
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading workspaces:', error);
      setLoading(false);
    }
  };

  const createDefaultWorkspace = async (user) => {
    try {
      // יצירת workspace
      const workspaceName = user.full_name 
        ? `${user.full_name.split(' ')[0]}'s Workspace`
        : user.email.split('@')[0] + "'s Workspace";

      const workspace = await opsbrain.entities.Workspace.create({
        name: workspaceName,
        onboarding_completed: false
      });

      // יצירת membership
      await opsbrain.entities.WorkspaceMember.create({
        workspace_id: workspace.id,
        user_id: user.id,
        invited_email: user.email,
        role: 'owner',
        status: 'active',
        accepted_at: new Date().toISOString()
      });

      // שמירת state
      await opsbrain.entities.UserWorkspaceState.create({
        user_id: user.id,
        active_workspace_id: workspace.id
      });

      setActiveWorkspace(workspace);
      setWorkspaces([workspace]);
      setLoading(false);
    } catch (error) {
      console.error('Error creating default workspace:', error);
      setLoading(false);
    }
  };

  const switchWorkspace = async (workspaceId) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) return;

    setActiveWorkspace(workspace);
    
    // עדכן ב-DB
    const user = await opsbrain.auth.me();
    const stateRecords = await opsbrain.entities.UserWorkspaceState.filter({
      user_id: user.id
    });

    if (stateRecords.length > 0) {
      await opsbrain.entities.UserWorkspaceState.update(stateRecords[0].id, {
        active_workspace_id: workspaceId
      });
    }

    // רענן את הדף כדי שכל הנתונים יעודכנו
    window.location.reload();
  };

  const createWorkspace = async (name) => {
    try {
      const user = await opsbrain.auth.me();
      
      // בדיקת מגבלת 3 workspaces
      const userWorkspaces = workspaces.filter(ws => {
        // בדוק אם המשתמש הוא owner
        return ws.created_by === user.id;
      });

      if (userWorkspaces.length >= 3) {
        throw new Error('Maximum 3 workspaces allowed');
      }

      // יצירת workspace חדש
      const workspace = await opsbrain.entities.Workspace.create({
        name,
        onboarding_completed: false
      });

      // יצירת membership
      await opsbrain.entities.WorkspaceMember.create({
        workspace_id: workspace.id,
        user_id: user.id,
        invited_email: user.email,
        role: 'owner',
        status: 'active',
        accepted_at: new Date().toISOString()
      });

      // רענן את הרשימה
      await loadWorkspaces();
      
      return workspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        workspaces,
        loading,
        switchWorkspace,
        createWorkspace,
        refreshWorkspaces: loadWorkspaces
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};