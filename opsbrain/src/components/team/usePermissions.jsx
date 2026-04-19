import { useQuery } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useState, useEffect } from 'react';

/**
 * Hook לבדיקת הרשאות משתמש
 * מחזיר פונקציה לבדיקה אם למשתמש יש הרשאה ספציפית
 */
export function usePermissions() {
  const { activeWorkspace } = useWorkspace();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    opsbrain.auth.me().then(currentUser => {
      setUser(currentUser);
      // מצא את התפקיד של המשתמש ב-workspace הנוכחי
      if (currentUser && activeWorkspace) {
        opsbrain.entities.WorkspaceMember.filter({
          workspace_id: activeWorkspace.id,
          user_id: currentUser.id,
          status: 'active'
        }).then(members => {
          if (members.length > 0) {
            setUserRole(members[0].role);
          }
        });
      }
    });
  }, [activeWorkspace]);

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions', activeWorkspace?.id, userRole],
    queryFn: async () => {
      if (!activeWorkspace || !userRole) return [];
      return await opsbrain.entities.Permission.filter({
        workspace_id: activeWorkspace.id,
        role: userRole
      });
    },
    enabled: !!activeWorkspace && !!userRole
  });

  /**
   * בדוק אם למשתמש יש הרשאה ספציפית
   * @param {string} module - המודול (finance, clients, וכו')
   * @param {string} action - הפעולה (view, create, edit, delete)
   * @returns {boolean}
   */
  const hasPermission = (module, action) => {
    // בעלי workspace תמיד מורשים
    if (userRole === 'owner') return true;
    
    // אם אין הרשאות מוגדרות, השתמש בברירות מחדל
    if (permissions.length === 0) {
      const defaultPermissions = {
        admin: {
          finance: { view: true, create: true, edit: true, delete: true },
          clients: { view: true, create: true, edit: true, delete: true },
          projects: { view: true, create: true, edit: true, delete: true },
          documents: { view: true, create: true, edit: true, delete: true },
          settings: { view: true, edit: false },
          team: { view: true, invite: true, manage: false }
        },
        member: {
          finance: { view: true, create: true, edit: true, delete: false },
          clients: { view: true, create: true, edit: true, delete: false },
          projects: { view: true, create: true, edit: true, delete: false },
          documents: { view: true, create: true, edit: true, delete: false },
          settings: { view: false, edit: false },
          team: { view: true, invite: false, manage: false }
        },
        viewer: {
          finance: { view: true, create: false, edit: false, delete: false },
          clients: { view: true, create: false, edit: false, delete: false },
          projects: { view: true, create: false, edit: false, delete: false },
          documents: { view: true, create: false, edit: false, delete: false },
          settings: { view: false, edit: false },
          team: { view: false, invite: false, manage: false }
        }
      };
      
      return defaultPermissions[userRole]?.[module]?.[action] || false;
    }

    const permission = permissions[0];
    return permission?.permissions?.[module]?.[action] || false;
  };

  /**
   * בדוק אם המשתמש הוא בעלים או מנהל
   */
  const isAdminOrOwner = () => {
    return userRole === 'owner' || userRole === 'admin';
  };

  return {
    hasPermission,
    isAdminOrOwner,
    userRole,
    user
  };
}