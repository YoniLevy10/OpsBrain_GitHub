import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

/**
 * Hook לניהול הרשאות ברמת Workspace
 * מספק בדיקות הרשאות לפי role וקובע מה המשתמש יכול לעשות
 */
export function usePermissions() {
  const { activeWorkspace } = useWorkspace();
  const [permissions, setPermissions] = useState({
    isOwner: false,
    isAdmin: false,
    isMember: false,
    canManageTeam: false,
    canManageIntegrations: false,
    canManageFinances: false,
    canManageSettings: false,
    canDeleteWorkspace: false,
    canInviteMembers: false,
    role: null,
    loading: true
  });

  useEffect(() => {
    loadPermissions();
  }, [activeWorkspace?.id]);

  const loadPermissions = async () => {
    try {
      const user = await base44.auth.me();
      
      if (!user || !activeWorkspace?.id) {
        setPermissions(prev => ({ ...prev, loading: false }));
        return;
      }

      // מצא את ה-membership של המשתמש ב-workspace הפעיל
      const memberships = await base44.entities.WorkspaceMember.filter({
        workspace_id: activeWorkspace.id,
        user_id: user.id,
        status: 'active'
      });

      if (memberships.length === 0) {
        setPermissions(prev => ({ ...prev, loading: false }));
        return;
      }

      const membership = memberships[0];
      const role = membership.role;

      // הגדרת הרשאות לפי role
      const isOwner = role === 'owner';
      const isAdmin = ['owner', 'admin'].includes(role);
      const isMember = ['owner', 'admin', 'member'].includes(role);

      setPermissions({
        isOwner,
        isAdmin,
        isMember,
        role,
        
        // הרשאות ניהול
        canManageTeam: isAdmin,
        canManageIntegrations: isAdmin,
        canManageFinances: isAdmin,
        canManageSettings: isAdmin,
        canDeleteWorkspace: isOwner,
        canInviteMembers: isAdmin,
        
        // הרשאות נוספות
        canCreateProjects: isMember,
        canCreateClients: isMember,
        canCreateTasks: isMember,
        canViewFinances: isMember,
        canViewReports: isMember,
        
        loading: false
      });

    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions(prev => ({ ...prev, loading: false }));
    }
  };

  /**
   * בדוק אם המשתמש יכול לערוך resource ספציפי
   * @param {string} resourceType - סוג ה-resource (client, project, task, etc.)
   * @param {object} resource - ה-resource עצמו
   * @returns {boolean}
   */
  const canEdit = (resourceType, resource) => {
    // Admin יכול לערוך הכל
    if (permissions.isAdmin) return true;
    
    // בדוק אם המשתמש יצר את ה-resource
    if (resource?.created_by) {
      return resource.created_by === user?.email;
    }
    
    // אם assigned למשתמש
    if (resource?.assigned_to) {
      return resource.assigned_to === user?.email;
    }
    
    return false;
  };

  /**
   * בדוק אם המשתמש יכול למחוק resource ספציפי
   * @param {string} resourceType - סוג ה-resource
   * @param {object} resource - ה-resource עצמו
   * @returns {boolean}
   */
  const canDelete = (resourceType, resource) => {
    // רק admin או owner יכולים למחוק
    if (permissions.isAdmin) return true;
    
    // משתמש רגיל יכול למחוק רק את מה שהוא יצר
    if (resource?.created_by === user?.email) {
      return true;
    }
    
    return false;
  };

  /**
   * בדוק אם המשתמש יכול לראות resource ספציפי
   * @param {string} resourceType - סוג ה-resource
   * @param {object} resource - ה-resource עצמו
   * @returns {boolean}
   */
  const canView = (resourceType, resource) => {
    // כל member יכול לראות
    return permissions.isMember;
  };

  return {
    ...permissions,
    canEdit,
    canDelete,
    canView,
    refresh: loadPermissions
  };
}